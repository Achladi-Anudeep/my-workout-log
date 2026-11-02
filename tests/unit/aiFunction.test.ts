import { afterEach, describe, expect, it, vi } from 'vitest';
import handler from '../../netlify/functions/ai';

const PROJECT = 'https://vzdeaxytytzrjjdwdpwk.supabase.co';
const env = (globalThis as any).process.env;

function req(body: unknown, headers: Record<string, string> = {}) {
  return new Request('https://x/.netlify/functions/ai', {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: 'Bearer good', 'x-sb-url': PROJECT, 'x-sb-key': 'anon', ...headers },
    body: JSON.stringify(body),
  });
}

/** Fake Supabase (token "good" is signed in) and fake Gemini (returns `answer`). */
function fakeNet(answer: string, opts: { status?: number; missingFirstModel?: boolean; overloadFirst?: boolean; rejectBudget?: boolean } = {}) {
  const calls: { url: string; body?: any }[] = [];
  vi.stubGlobal('fetch', vi.fn(async (url: string, init?: RequestInit) => {
    calls.push({ url, body: init?.body ? JSON.parse(init.body as string) : undefined });
    if (url.endsWith('/auth/v1/user')) {
      const ok = (init?.headers as Record<string, string>).authorization === 'Bearer good';
      return new Response(JSON.stringify(ok ? { id: 'u1' } : { msg: 'bad' }), { status: ok ? 200 : 401 });
    }
    if (opts.missingFirstModel && url.includes('gemini-flash-latest')) return new Response('{}', { status: 404 });
    if (opts.rejectBudget && (init?.body as string).includes('thinkingBudget')) return new Response('{"error":{"code":400,"message":"Request contains an invalid argument."}}', { status: 400 });
    if (opts.overloadFirst && url.includes('gemini-flash-latest')) return new Response('{"error":{"code":503}}', { status: 503 });
    if (opts.status) return new Response('{}', { status: opts.status });
    return new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text: answer }] } }] }), { status: 200 });
  }));
  return calls;
}

afterEach(() => { vi.unstubAllGlobals(); delete env.GEMINI_API_KEY; });

describe('AI function', () => {
  it('refuses anyone not signed in to one of the app\'s own projects', async () => {
    env.GEMINI_API_KEY = 'k';
    fakeNet('hi');
    expect((await handler(req({ task: 'ask', question: 'q' }, { authorization: 'Bearer bad' }))).status).toBe(401);
    expect((await handler(req({ task: 'ask', question: 'q' }, { 'x-sb-url': 'https://evil.supabase.co' }))).status).toBe(401);
  });

  it('says when the key is not set up yet', async () => {
    fakeNet('hi');
    expect((await handler(req({ task: 'ask', question: 'q' }))).status).toBe(503);
  });

  it('answers a question, keeping the key on the server', async () => {
    env.GEMINI_API_KEY = 'secret-key';
    const calls = fakeNet('Keep your knees over your toes.');
    const res = await handler(req({ task: 'ask', question: 'Is this safe?', context: 'Exercise: Leg Press' }));
    expect(await res.json()).toEqual({ text: 'Keep your knees over your toes.' });
    const g = calls.find(c => c.url.includes('generativelanguage'))!;
    expect(g.url).not.toContain('secret-key');
    expect(g.body.contents[0].parts[0].text).toContain('Exercise: Leg Press');
    expect(g.body.generationConfig.thinkingConfig).toEqual({ thinkingBudget: 0 });
  });

  it('falls back to another model if one is retired or overloaded, and reports a busy free tier', async () => {
    env.GEMINI_API_KEY = 'k';
    fakeNet('ok', { missingFirstModel: true });
    expect((await handler(req({ task: 'review', context: 'c' }))).status).toBe(200);
    fakeNet('x', { status: 503 }); // every model overloaded
    expect((await handler(req({ task: 'review', context: 'c' }))).status).toBe(429);
  });

  it('when the main model is overloaded, the next one answers', async () => {
    env.GEMINI_API_KEY = 'k';
    const calls = fakeNet('Lite answer', { overloadFirst: true });
    const res = await handler(req({ task: 'ask', question: 'q', context: 'c' }));
    expect(await res.json()).toEqual({ text: 'Lite answer' });
    expect(calls.filter(c => c.url.includes('generativelanguage')).map(c => c.url.split('/models/')[1].split(':')[0]))
      .toEqual(['gemini-flash-latest', 'gemini-flash-lite-latest']);
  });

  it('a model that rejects one "thinking" setting is retried with the other style', async () => {
    env.GEMINI_API_KEY = 'k';
    const calls = fakeNet('ok', { rejectBudget: true });
    expect(await (await handler(req({ task: 'ask', question: 'q' }))).json()).toEqual({ text: 'ok' });
    const sent = calls.filter(c => c.url.includes('generativelanguage')).map(c => c.body.generationConfig.thinkingConfig);
    expect(sent).toEqual([{ thinkingBudget: 0 }, { thinkingLevel: 'low' }]);
  });

  it('identifies a machine only from your own exercise list', async () => {
    env.GEMINI_API_KEY = 'k';
    const candidates = [{ id: 'leg-press', name: 'Leg Press', equipment: '45° sled' }, { id: 'leg-curl', name: 'Leg Curl', equipment: 'lying' }];
    const image = 'data:image/jpeg;base64,AAAA';
    fakeNet(JSON.stringify({ best: 'leg-press', second: 'made-up-id', confidence: 'high', machine: 'leg press', reason: 'Sled and foot plate' }));
    const res = await handler(req({ task: 'identify', image, candidates }));
    expect((await res.json()).match).toEqual({ best: 'leg-press', second: null, confidence: 'high', machine: 'leg press', reason: 'Sled and foot plate' });
    expect((await handler(req({ task: 'identify', image: 'not-an-image', candidates }))).status).toBe(400);
  });
});

describe('AI context', () => {
  it('describes an exercise with your recent sets and the coach call', async () => {
    const { exerciseContext } = await import('../../src/lib/ai');
    const { EXERCISE_LIBRARY } = await import('../../src/data/alternatives');
    const e = EXERCISE_LIBRARY.get('leg-press')!;
    const ctx = exerciseContext('Knee pain.', e, [{
      id: 's', dayId: 'wed', date: '2026-11-01', startedAt: Date.now(), mins: 50, cardio: 0, note: '',
      ex: [{ id: 'leg-press', name: 'Leg Press', unit: 'reps', sets: [{ w: 30, r: 15 }, { w: 30, r: 15 }, { w: 30, r: 15 }] }],
    }], 'Seat 3');
    expect(ctx).toContain('Knee pain.');
    expect(ctx).toContain('45° leg press machine');
    expect(ctx).toContain('2026-11-01: 30×15, 30×15, 30×15');
    expect(ctx).toContain('My machine settings: Seat 3');
    expect(ctx).toContain('Add weight');
  });
});
