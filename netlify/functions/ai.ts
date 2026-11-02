/**
 * AI helper for My Workout Log, running on Netlify (free tier) and calling Google Gemini (free tier).
 *
 * - The Gemini key lives only here, in the GEMINI_API_KEY environment variable. It never reaches the browser.
 * - Only someone signed in to one of this app's own Supabase projects can use it, so nobody else can spend the free quota.
 * - Three tasks: "ask" (a question about an exercise), "review" (last week's training) and
 *   "identify" (which of your exercises a machine photo shows, picked only from your own list).
 */

/** This app's two databases (production and test). Their URLs are public; anything else is refused. */
const ALLOWED_PROJECTS = ['https://anutvisbezcefrbkxplo.supabase.co', 'https://vzdeaxytytzrjjdwdpwk.supabase.co'];

/** Tried in order: if one is overloaded, slow or retired, the next one answers. All are on the free tier. */
const MODELS = ['gemini-flash-latest', 'gemini-flash-lite-latest', 'gemini-2.5-flash'];
const LIMITS = { question: 600, context: 9000, image: 1_400_000, candidates: 150 };

const COACH = `You are a careful, encouraging strength coach inside the user's personal workout app.
Rules:
- Base every answer on the data provided (their plan, logs and profile). Don't invent numbers.
- The user is a beginner with knee pain: prefer knee-friendly options and pain-free range of motion.
- For sharp pain, swelling, numbness or anything that sounds like an injury, say to stop that exercise and see a physio.
- Be concise: at most about 130 words. Plain text only. You may use short lines starting with "- ". No headings, no bold, no tables.
- If you are not sure, say so plainly.`;

type Json = Record<string, unknown>;
const env = (k: string): string | undefined => (globalThis as { process?: { env: Record<string, string | undefined> } }).process?.env[k];
const reply = (status: number, body: Json) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' } });
const str = (v: unknown, max: number) => (typeof v === 'string' ? v.slice(0, max) : '');

/** Checks the caller's Supabase session against one of this app's projects. */
async function signedIn(req: Request): Promise<boolean> {
  const token = (req.headers.get('authorization') ?? '').replace(/^Bearer\s+/i, '');
  const project = (req.headers.get('x-sb-url') ?? '').replace(/\/+$/, '');
  const apikey = req.headers.get('x-sb-key') ?? '';
  if (!token || !apikey || !ALLOWED_PROJECTS.includes(project)) return false;
  try {
    const res = await fetch(`${project}/auth/v1/user`, { headers: { apikey, authorization: `Bearer ${token}` } });
    if (!res.ok) return false;
    const user = (await res.json()) as { id?: string };
    return !!user?.id;
  } catch {
    return false;
  }
}

/** Short answers don't need the model's slow "thinking" step; some models don't accept the setting, so it's retried without. */
const FAST = { thinkingConfig: { thinkingBudget: 0 } };
const PER_TRY_MS = 8000;

async function gemini(key: string, body: Json, models = MODELS): Promise<{ ok: true; text: string } | { ok: false; status: number; error: string }> {
  let busy = false;
  let lastError = 'no-model';
  const started = Date.now();
  for (const model of [env('GEMINI_MODEL'), ...models].filter((m): m is string => !!m)) {
    if (Date.now() - started > 19000) break; // stay well inside Netlify's time limit
    for (const fast of [true, false]) {
      const cfg = { ...(body.generationConfig as Json), ...(fast ? FAST : {}) };
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), PER_TRY_MS);
      let res: Response;
      try {
        res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
          method: 'POST',
          headers: { 'content-type': 'application/json', 'x-goog-api-key': key },
          body: JSON.stringify({ ...body, generationConfig: cfg }),
          signal: ctrl.signal,
        });
      } catch {
        console.warn(`[ai] ${model} timed out or failed to connect, trying the next model`);
        busy = true;
        clearTimeout(timer);
        break; // next model
      }
      clearTimeout(timer);
      if (res.ok) {
        const data = (await res.json()) as { candidates?: { content?: { parts?: { text?: string }[] }; finishReason?: string }[] };
        const text = (data.candidates?.[0]?.content?.parts ?? []).map(p => p.text ?? '').join('').trim();
        if (text) return { ok: true, text };
        lastError = `empty (${data.candidates?.[0]?.finishReason ?? 'no candidates'})`;
        console.error(`[ai] ${model} ${lastError}`);
        break;
      }
      const detail = (await res.text().catch(() => '')).replace(/\s+/g, ' ').slice(0, 300);
      if (res.status === 400 && fast && /thinking/i.test(detail)) continue; // retry this model without the setting
      if (res.status === 404) { console.warn(`[ai] model ${model} not found, trying the next one`); break; }
      if (res.status === 429 || res.status === 503 || res.status === 500) {
        console.warn(`[ai] ${model} busy (${res.status}), trying the next model`);
        busy = true;
        break;
      }
      console.error(`[ai] gemini ${model} ${res.status}: ${detail}`);
      return { ok: false, status: 502, error: `gemini ${res.status}: ${detail.slice(0, 160)}` };
    }
  }
  if (busy) return { ok: false, status: 429, error: 'busy' };
  console.error(`[ai] no model answered: ${lastError}`);
  return { ok: false, status: 502, error: lastError };
}

export default async (req: Request): Promise<Response> => {
  if (req.method !== 'POST') return reply(405, { error: 'method' });
  if (Number(req.headers.get('content-length') ?? 0) > 2_000_000) return reply(413, { error: 'too-big' });
  if (!(await signedIn(req))) return reply(401, { error: 'sign-in' });
  const key = env('GEMINI_API_KEY');
  if (!key) return reply(503, { error: 'not-configured' });

  let body: Json;
  try { body = (await req.json()) as Json; } catch { return reply(400, { error: 'bad-json' }); }
  const context = str(body.context, LIMITS.context);
  const config = { temperature: 0.4, maxOutputTokens: 2048 };

  if (body.task === 'ask' || body.task === 'review') {
    const question = body.task === 'review'
      ? 'Review my last 7 days of training and body weight. Give 2–4 short points: what went well, what to fix, and one thing to focus on next week.'
      : str(body.question, LIMITS.question).trim();
    if (!question) return reply(400, { error: 'empty-question' });
    const r = await gemini(key, {
      systemInstruction: { parts: [{ text: COACH }] },
      contents: [{ role: 'user', parts: [{ text: `${context}\n\nQuestion: ${question}` }] }],
      generationConfig: config,
    });
    return r.ok ? reply(200, { text: r.text }) : reply(r.status, { error: r.error });
  }

  if (body.task === 'identify') {
    const image = str(body.image, LIMITS.image);
    const m = /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/.exec(image);
    if (!m) return reply(400, { error: 'bad-image' });
    const candidates = (Array.isArray(body.candidates) ? body.candidates : []).slice(0, LIMITS.candidates)
      .map(c => c as Json).filter(c => typeof c.id === 'string')
      .map(c => ({ id: str(c.id, 60), name: str(c.name, 80), equipment: str(c.equipment, 200) }));
    if (!candidates.length) return reply(400, { error: 'no-candidates' });
    const ids = new Set(candidates.map(c => c.id));
    const list = candidates.map(c => `${c.id} | ${c.name} | ${c.equipment}`).join('\n');
    const r = await gemini(key, {
      systemInstruction: { parts: [{ text: 'You identify gym equipment in photos. Answer only with the JSON requested. Pick ids only from the list. If the photo does not clearly show one of them, set best to "none" and confidence to "low".' }] },
      contents: [{ role: 'user', parts: [
        { text: `Which exercise from this list is done on the equipment in the photo?\nid | name | equipment\n${list}` },
        { inline_data: { mime_type: m[1], data: m[2] } },
      ] }],
      generationConfig: {
        ...config, temperature: 0.1, responseMimeType: 'application/json',
        responseSchema: {
          type: 'OBJECT',
          properties: {
            best: { type: 'STRING' }, second: { type: 'STRING' },
            confidence: { type: 'STRING', enum: ['high', 'medium', 'low'] },
            machine: { type: 'STRING' }, reason: { type: 'STRING' },
          },
          required: ['best', 'confidence', 'machine', 'reason'],
        },
      },
    });
    if (!r.ok) return reply(r.status, { error: r.error });
    try {
      const j = JSON.parse(r.text) as Json;
      const pick = (v: unknown) => (typeof v === 'string' && ids.has(v) ? v : null);
      return reply(200, {
        match: {
          best: pick(j.best), second: pick(j.second),
          confidence: ['high', 'medium', 'low'].includes(j.confidence as string) ? j.confidence : 'low',
          machine: str(j.machine, 120), reason: str(j.reason, 300),
        },
      });
    } catch {
      return reply(502, { error: 'bad-answer' });
    }
  }

  return reply(400, { error: 'unknown-task' });
};
