/**
 * AI helper for My Workout Log, running on Netlify and calling Google Gemini.
 *
 * - Keys live only here, in environment variables, never in the browser:
 *     GEMINI_PRO_KEY  optional, a key on a billing-linked project paid by the Google AI Pro monthly credit → Pro models
 *     GEMINI_API_KEY  the free-tier key → Flash models, used when Pro isn't set up, is capped, busy or slow
 * - Only someone signed in to one of this app's own Supabase projects can use it, so nobody else can spend the quota.
 * - Tasks: "ask" (a question, with the conversation so far), "review" (last week's training) and
 *   "identify" (which of your exercises a machine photo shows, picked only from your own list).
 */

/** This app's two databases (production and test). Their URLs are public; anything else is refused. */
const ALLOWED_PROJECTS = ['https://anutvisbezcefrbkxplo.supabase.co', 'https://vzdeaxytytzrjjdwdpwk.supabase.co'];

/** Tried in order within each tier; a retired, overloaded or slow model moves on to the next. */
const PRO_MODELS = ['gemini-pro-latest', 'gemini-3.1-pro-preview', 'gemini-2.5-pro'];
// Each model has its own free quota; Flash-Lite (weakest at photos) is the last resort.
const FREE_MODELS = ['gemini-flash-latest', 'gemini-2.5-flash', 'gemini-flash-lite-latest'];
const LIMITS = { question: 600, context: 12000, image: 1_400_000, candidates: 150, history: 12, turn: 2000 };
/** Netlify stops a function after ~30 s; leave room to answer. */
const DEADLINE_MS = 26000;

const COACH = `You are a careful, encouraging strength coach inside the user's personal workout app.
Rules:
- Base every answer on the data below (their plan, logs and profile) and on the conversation so far. Don't invent numbers.
- The user is a beginner with knee pain: prefer knee-friendly options and pain-free range of motion.
- For sharp pain, swelling, numbness or anything that sounds like an injury, say to stop that exercise and see a physio.
- Be concise: at most about 150 words. Plain text only. You may use short lines starting with "- ". No headings, no bold, no tables.
- If you are not sure, say so plainly.`;

const IDENTIFY = `You identify gym equipment in photos for a workout app. Answer only with the JSON requested.
First, in "machine" and "reason", describe the equipment and, if a person is shown, their position (seated, standing, lying)
and the direction they move the handle or weight. Then pick the best exercise id from the list, and a second guess.
Commonly confused, decide by body position and direction:
- seated, pulling a bar or handles DOWN from overhead = a pulldown (even on a cable tower)
- seated, pulling handles TOWARD the torso = a seated row
- standing between two high pulleys, sweeping the hands together in front = a cable crossover / fly
- standing, pulling a rope toward the face with elbows high = a face pull
- standing, pushing a bar or rope DOWN with elbows at the sides = a triceps pushdown
- angled sled with a big foot platform = a leg press
- lying face down with a pad behind the ankles = a leg curl; seated with a pad on the thighs and toes on a block = a seated calf raise
Pick ids only from the list. If the photo does not clearly show one of them, set best to "none" and confidence to "low".`;

type Json = Record<string, unknown>;
type Tier = { name: 'pro' | 'free'; key: string; models: string[]; perTry: number };
type Result = { ok: true; text: string; model: string; tier: Tier['name'] } | { ok: false; status: number; error: string };

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

function tiers(): Tier[] {
  const out: Tier[] = [];
  const pro = env('GEMINI_PRO_KEY');
  const free = env('GEMINI_API_KEY');
  // Pro thinks before answering, so it gets more time; the free models are fast.
  if (pro) out.push({ name: 'pro', key: pro, models: [env('GEMINI_PRO_MODEL'), ...PRO_MODELS].filter((m): m is string => !!m), perTry: 15000 });
  if (free) out.push({ name: 'free', key: free, models: [env('GEMINI_MODEL'), ...FREE_MODELS].filter((m): m is string => !!m), perTry: 8000 });
  return out;
}

/**
 * Keep answers quick: newer models take thinkingLevel, older Flash ones thinkingBudget. A model that rejects one
 * (HTTP 400) is retried with the next style, and finally with no setting.
 */
const SPEED: Json[] = [{ thinkingConfig: { thinkingLevel: 'low' } }, { thinkingConfig: { thinkingBudget: 0 } }, {}];

async function gemini(body: Json): Promise<Result> {
  const started = Date.now();
  const left = () => DEADLINE_MS - (Date.now() - started);
  let busy = false;
  let lastError = 'no-model';
  for (const tier of tiers()) {
    for (const model of tier.models) {
      if (left() < 4000) break;
      for (const [i, speed] of SPEED.entries()) {
        const ctrl = new AbortController();
        const timer = setTimeout(() => ctrl.abort(), Math.min(tier.perTry, left() - 1000));
        let res: Response;
        try {
          res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
            method: 'POST',
            headers: { 'content-type': 'application/json', 'x-goog-api-key': tier.key },
            body: JSON.stringify({ ...body, generationConfig: { ...(body.generationConfig as Json), ...speed } }),
            signal: ctrl.signal,
          });
        } catch {
          console.warn(`[ai] ${tier.name} ${model} timed out or failed to connect`);
          busy = true;
          clearTimeout(timer);
          break; // next model
        }
        clearTimeout(timer);
        if (res.ok) {
          const data = (await res.json()) as { candidates?: { content?: { parts?: { text?: string; thought?: boolean }[] }; finishReason?: string }[] };
          const text = (data.candidates?.[0]?.content?.parts ?? []).filter(p => !p.thought).map(p => p.text ?? '').join('').trim();
          if (text) return { ok: true, text, model, tier: tier.name };
          lastError = `empty (${data.candidates?.[0]?.finishReason ?? 'no candidates'})`;
          console.error(`[ai] ${tier.name} ${model} ${lastError}`);
          break;
        }
        const detail = (await res.text().catch(() => '')).replace(/\s+/g, ' ').slice(0, 300);
        if (res.status === 400 && i < SPEED.length - 1 && !/api key|billing|credit|permission/i.test(detail)) continue; // try the next speed setting
        if (res.status === 404) { console.warn(`[ai] ${tier.name} model ${model} not found`); break; } // next model
        if ([429, 500, 503].includes(res.status)) { console.warn(`[ai] ${tier.name} ${model} busy or capped (${res.status})`); busy = true; break; }
        if (tier.name === 'pro') {
          // Pro not usable (no billing linked, credit used up, key restricted): drop to the free models.
          console.warn(`[ai] pro unavailable (${res.status}): ${detail.slice(0, 160)}`);
          lastError = `pro ${res.status}`;
          break;
        }
        console.error(`[ai] gemini ${model} ${res.status}: ${detail}`);
        return { ok: false, status: 502, error: `gemini ${res.status}: ${detail.slice(0, 160)}` };
      }
    }
  }
  if (busy) return { ok: false, status: 429, error: 'busy' };
  console.error(`[ai] no model answered: ${lastError}`);
  return { ok: false, status: 502, error: lastError };
}

/** Earlier turns of this conversation, oldest first, so follow-up questions make sense. */
function historyOf(v: unknown) {
  return (Array.isArray(v) ? v : []).slice(-LIMITS.history)
    .map(t => t as Json)
    .filter(t => (t.role === 'user' || t.role === 'model') && typeof t.text === 'string' && t.text)
    .map(t => ({ role: t.role as string, parts: [{ text: str(t.text, LIMITS.turn) }] }));
}

export default async (req: Request): Promise<Response> => {
  if (req.method !== 'POST') return reply(405, { error: 'method' });
  if (Number(req.headers.get('content-length') ?? 0) > 2_000_000) return reply(413, { error: 'too-big' });
  if (!(await signedIn(req))) return reply(401, { error: 'sign-in' });
  if (!tiers().length) return reply(503, { error: 'not-configured' });

  let body: Json;
  try { body = (await req.json()) as Json; } catch { return reply(400, { error: 'bad-json' }); }
  const context = str(body.context, LIMITS.context);
  const config = { temperature: 0.4, maxOutputTokens: 4096 };

  if (body.task === 'ask' || body.task === 'review') {
    const question = body.task === 'review'
      ? 'Review my last 7 days of training and body weight. Give 2–4 short points: what went well, what to fix, and one thing to focus on next week.'
      : str(body.question, LIMITS.question).trim();
    if (!question) return reply(400, { error: 'empty-question' });
    const r = await gemini({
      systemInstruction: { parts: [{ text: `${COACH}\n\nData (current, from the app):\n${context}` }] },
      contents: [...historyOf(body.history), { role: 'user', parts: [{ text: question }] }],
      generationConfig: config,
    });
    return r.ok ? reply(200, { text: r.text, model: r.model, tier: r.tier }) : reply(r.status, { error: r.error });
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
    const r = await gemini({
      systemInstruction: { parts: [{ text: IDENTIFY }] },
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
          required: ['machine', 'reason', 'best', 'confidence'],
          // Describe first, then decide: answering in this order makes the pick more accurate.
          propertyOrdering: ['machine', 'reason', 'best', 'second', 'confidence'],
        },
      },
    });
    if (!r.ok) return reply(r.status, { error: r.error });
    try {
      const j = JSON.parse(r.text.replace(/^```(?:json)?\s*|\s*```$/g, '')) as Json;
      const pick = (v: unknown) => (typeof v === 'string' && ids.has(v) ? v : null);
      return reply(200, {
        model: r.model, tier: r.tier,
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
