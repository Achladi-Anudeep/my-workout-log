import { supabase } from './supabase';
import { advise } from './coach';
import { detailsOf } from '../data/details';
import { fmtW, isoDay, range } from './utils';
import type { Day, Exercise, Session, WeightEntry } from '../types';

/** What the AI knows about you. Editable under Plan → About me (for AI). */
export const DEFAULT_PROFILE = [
  'Male, 28, 162 cm. Beginner (little regular exercise before starting).',
  'Has knee pain: keep exercises knee-friendly and within a pain-free range.',
  'Goal: lean, athletic and muscular with visible abs. Currently on a gentle cut (~1,900–2,000 kcal, 120–140 g protein a day).',
  'Vegetarian. Trains 6 days a week (Saturday at home with a tube band and a loop band).',
].join('\n');

export type AiError = 'sign-in' | 'not-configured' | 'busy' | 'offline' | 'failed';
export class AiFailure extends Error { constructor(public code: AiError, public detail = '') { super(code); } }

export const AI_ERROR_TEXT: Record<AiError, string> = {
  'sign-in': 'Sign in (Plan → Account) to use AI.',
  'not-configured': 'AI isn’t switched on for this site yet (the Gemini key is missing).',
  busy: 'Gemini is busy or at today’s limit. Try again in a minute.',
  offline: 'You’re offline. AI needs a connection.',
  failed: 'The AI didn’t answer. Try again.',
};

async function call<T>(payload: Record<string, unknown>): Promise<T> {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) throw new AiFailure('offline');
  const session = supabase ? (await supabase.auth.getSession()).data.session : null;
  if (!session) throw new AiFailure('sign-in');
  let res: Response;
  try {
    res = await fetch('/.netlify/functions/ai', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${session.access_token}`,
        'x-sb-url': import.meta.env.VITE_SUPABASE_URL as string,
        'x-sb-key': import.meta.env.VITE_SUPABASE_ANON_KEY as string,
      },
      body: JSON.stringify(payload),
    });
  } catch {
    throw new AiFailure('offline');
  }
  const body = await res.json().catch(() => ({}));
  if (res.status === 401) throw new AiFailure('sign-in');
  if (res.status === 503) throw new AiFailure('not-configured');
  if (res.status === 429) throw new AiFailure('busy');
  if (!res.ok) throw new AiFailure('failed', typeof body?.error === 'string' ? body.error : `HTTP ${res.status}`);
  return body as T;
}

/** One message in an AI conversation. Kept on the device so follow-up questions have context. */
export interface ChatTurn { role: 'user' | 'model'; text: string; at: number; model?: string; tier?: 'pro' | 'free'; }
export interface AiReply { text: string; model?: string; tier?: 'pro' | 'free'; }
const turns = (history: ChatTurn[]) => history.map(t => ({ role: t.role, text: t.text }));

export const askAI = (question: string, context: string, history: ChatTurn[] = []) =>
  call<AiReply>({ task: 'ask', question, context, history: turns(history) });
export const reviewWeek = (context: string, history: ChatTurn[] = []) =>
  call<AiReply>({ task: 'review', context, history: turns(history) });

/** "Gemini Pro" or "Gemini Flash (free)", for the small label under each answer. */
export const modelLabel = (t: { model?: string; tier?: 'pro' | 'free' }) =>
  t.tier === 'pro' ? 'Gemini Pro (your AI Pro credit)' : t.model?.includes('lite') ? 'Gemini Flash-Lite (free)' : 'Gemini Flash (free)';

export interface MachineMatch { best: string | null; second: string | null; confidence: 'high' | 'medium' | 'low'; machine: string; reason: string; }
export const identifyMachine = (image: string, candidates: Exercise[]) =>
  call<{ match: MachineMatch }>({
    task: 'identify', image,
    candidates: candidates.map(e => ({ id: e.id, name: e.name, equipment: detailsOf(e)?.equipment ?? e.wNote })),
  }).then(r => r.match);

// ---------- context builders: plain text the model can read ----------

/** The whole week in a few lines, so every answer knows the full program. */
export function planSummary(plan: Day[]) {
  return 'My weekly plan:\n' + plan.map(d => d.exercises.length
    ? `${d.short} ${d.title}${d.home ? ' (home)' : ''}: ${d.exercises.map(e => `${e.name} ${e.sets}×${range(e)}${e.superset ? ` [${e.superset}]` : ''}`).join(', ')}`
    : `${d.short}: rest`).join('\n');
}

const setsText = (s: Session, id: string) => {
  const x = s.ex.find(e => e.id === id);
  return x ? `${s.date}: ${x.sets.map(v => `${fmtW(v.w)}×${v.r}`).join(', ')}` : '';
};

/** One exercise: the plan, how to do it, your recent sets and the coach's call. */
export function exerciseContext(profile: string, e: Exercise, sessions: Session[], machineNote?: string, plan?: Day[]) {
  const d = detailsOf(e);
  const recent = sessions.filter(s => s.ex.some(x => x.id === e.id)).slice(0, 4).map(s => setsText(s, e.id));
  const adv = advise(sessions, e);
  return [
    `About me:\n${profile}`,
    `Exercise: ${e.name} — ${e.sets}×${range(e)}${e.unit === 'sec' ? '' : ' reps'}, ${e.wNote}, rest ${e.rest}s.`,
    d?.equipment && `Equipment: ${d.equipment}`,
    d?.targets && `Works: ${d.targets}`,
    e.cue && `Key cue: ${e.cue}`,
    d?.steps.length ? `Steps: ${d.steps.join(' ')}` : '',
    machineNote && `My machine settings: ${machineNote}`,
    `Recent sets (kg×reps, BW = bodyweight): ${recent.length ? recent.join(' | ') : 'none yet'}`,
    `App coach says: ${adv.title}. ${adv.detail}`,
    plan ? `\n${planSummary(plan)}` : '',
  ].filter(Boolean).join('\n');
}

/** The last 7 days: workouts done vs planned, sets per exercise, body weight and the coach's calls. */
export function weekContext(profile: string, plan: Day[], sessions: Session[], weights: WeightEntry[], now = Date.now()) {
  const since = now - 7 * 86400000;
  const week = sessions.filter(s => s.startedAt >= since).slice().reverse();
  const done = week.map(s => `${s.date} ${s.title ?? s.dayId} (${s.mins} min${s.cardio ? `, ${s.cardio} min cardio` : ''}${s.note ? `, note: ${s.note}` : ''})\n`
    + s.ex.map(e => `  ${e.name}${e.swappedFor ? ` (swapped for ${e.swappedFor})` : ''}: ${e.sets.map(v => `${fmtW(v.w)}×${v.r}`).join(', ')}`).join('\n')).join('\n');
  const w = weights.filter(x => x.at >= now - 21 * 86400000).map(x => `${isoDay(new Date(x.at))} ${x.kg} kg`).join(', ');
  const exercises = [...new Map(plan.flatMap(d => d.exercises).map(e => [e.id, e])).values()];
  const calls = exercises.map(e => ({ e, a: advise(sessions, e) })).filter(x => x.a.kind !== 'new' && x.a.kind !== 'hold')
    .map(x => `${x.e.name}: ${x.a.title}`).join('; ');
  return [
    `About me:\n${profile}`,
    planSummary(plan),
    `Workouts in the last 7 days (${week.length}):\n${done || 'none'}`,
    `Body weight, last 3 weeks: ${w || 'not logged'}`,
    `App coach calls: ${calls || 'nothing to change'}`,
  ].join('\n\n');
}
