import { supabase } from './supabase';
import { advise } from './coach';
import { detailsOf } from '../data/details';
import { fmtW, isoDay, range } from './utils';
import type { Day, Exercise, Session, WeightEntry } from '../types';

/** What the AI knows about you. Editable under Plan → About me (for AI). */
export const DEFAULT_PROFILE = [
  'Male, 28, 162 cm. Beginner (little regular exercise before starting).',
  'Knee pain at the gym: keep gym leg work knee-friendly and pain-free. At home the knee is fine (no limits).',
  'Goal: lean, athletic and muscular with visible abs. Currently on a gentle cut (~1,900–2,000 kcal, 120–140 g protein a day).',
  'Vegetarian. Trains 6 days a week at the gym or at home (Saturday always at home).',
  'Home gear: adjustable dumbbell kit (5 / 10 / 15 kg per hand, up to 20 kg on one dumbbell), a 2 kg dumbbell pair, 20 kg blue tube band with handles + door anchor, 7–15 kg red loop band, push-up stands, hand gripper, chair, bed, yoga mat, a table/counter and wall space. No bench, step, box or incline seat at home: never suggest exercises that need them. No knee limits at home.',
].join('\n');

/** Earlier default profiles: replaced by the current default if you never edited them. */
export const LEGACY_PROFILES = [[
  'Male, 28, 162 cm. Beginner (little regular exercise before starting).',
  'Has knee pain: keep exercises knee-friendly and within a pain-free range.',
  'Goal: lean, athletic and muscular with visible abs. Currently on a gentle cut (~1,900–2,000 kcal, 120–140 g protein a day).',
  'Vegetarian. Trains 6 days a week (Saturday at home with a tube band and a loop band).',
].join('\n'), [
  'Male, 28, 162 cm. Beginner (little regular exercise before starting).',
  'Knee pain at the gym: keep gym leg work knee-friendly and pain-free. At home the knee is fine (no limits).',
  'Goal: lean, athletic and muscular with visible abs. Currently on a gentle cut (~1,900–2,000 kcal, 120–140 g protein a day).',
  'Vegetarian. Trains 6 days a week at the gym or at home (Saturday always at home).',
  'Home gear: 20 kg blue tube band with handles + door anchor, 7–15 kg red loop band, 2 kg dumbbells, push-up stands, hand gripper, chair, bed, yoga mat. No knee limits at home.',
].join('\n')];

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
export const modelLabel = (t: { model?: string; tier?: 'pro' | 'free' }) => {
  const name = t.model ? t.model.replace(/^gemini-/, 'Gemini ').replace(/-latest$/, '').replace(/-/g, ' ') : 'Gemini';
  return t.tier === 'pro' ? `${name} (Pro credit)` : `${name} (free)`;
};

export interface MachineMatch { best: string | null; second: string | null; confidence: 'high' | 'medium' | 'low'; machine: string; reason: string; model?: string; tier?: 'pro' | 'free'; }
export const identifyMachine = (image: string, candidates: Exercise[]) =>
  call<{ match: MachineMatch; model?: string; tier?: 'pro' | 'free' }>({
    task: 'identify', image,
    candidates: candidates.map(e => ({ id: e.id, name: e.name, equipment: detailsOf(e)?.equipment ?? e.wNote })),
  }).then(r => ({ ...r.match, model: r.model, tier: r.tier }));

/** Compare progress photos (earliest vs latest per pose). Each photo has a label like "Front · 3 Oct 2026 (earliest)". */
export const reviewBody = (photos: { label: string; image: string }[], context: string) =>
  call<AiReply>({ task: 'body', photos, context });

// ---------- context builders: plain text the model can read ----------

/** The whole week in a few lines, so every answer knows the full program. */
export function planSummary(plan: Day[], home?: Record<string, Day | null>) {
  const line = (d: Day) => `${d.short} ${d.title}${d.home ? ' (home)' : ''}: ${d.exercises.map(e => `${e.name} ${e.sets}×${range(e)}${e.superset ? ` [${e.superset}]` : ''}`).join(', ')}`;
  return 'My weekly plan (gym, with a home version of most days):\n' + plan.map(d => {
    if (!d.exercises.length) return `${d.short}: rest`;
    const h = home?.[d.id];
    return h ? `${line(d)}\n  or at home → ${line(h)}` : line(d);
  }).join('\n');
}

const setsText = (s: Session, id: string) => {
  const x = s.ex.find(e => e.id === id);
  return x ? `${s.date}: ${x.sets.map(v => `${fmtW(v.w)}×${v.r}`).join(', ')}` : '';
};

/** One exercise: the plan, how to do it, your recent sets and the coach's call. */
export function exerciseContext(profile: string, e: Exercise, sessions: Session[], machineNote?: string, plan?: Day[], home?: Record<string, Day | null>) {
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
    plan ? `\n${planSummary(plan, home)}` : '',
  ].filter(Boolean).join('\n');
}

/** The last 7 days: workouts done vs planned, sets per exercise, body weight and the coach's calls. */
export function weekContext(profile: string, plan: Day[], sessions: Session[], weights: WeightEntry[], now = Date.now(), home?: Record<string, Day | null>) {
  const since = now - 7 * 86400000;
  const week = sessions.filter(s => s.startedAt >= since).slice().reverse();
  const done = week.map(s => `${s.date} ${s.title ?? s.dayId}${s.venue === 'home' ? ' at home' : ''} (${s.mins} min${s.cardio ? `, ${s.cardio} min cardio` : ''}${s.note ? `, note: ${s.note}` : ''})\n`
    + s.ex.map(e => `  ${e.name}${e.swappedFor ? ` (swapped for ${e.swappedFor})` : ''}: ${e.sets.map(v => `${fmtW(v.w)}×${v.r}`).join(', ')}`).join('\n')).join('\n');
  const w = weights.filter(x => x.at >= now - 21 * 86400000).map(x => `${isoDay(new Date(x.at))} ${x.kg} kg`).join(', ');
  const exercises = [...new Map(plan.flatMap(d => d.exercises).map(e => [e.id, e])).values()];
  const calls = exercises.map(e => ({ e, a: advise(sessions, e) })).filter(x => x.a.kind !== 'new' && x.a.kind !== 'hold')
    .map(x => `${x.e.name}: ${x.a.title}`).join('; ');
  return [
    `About me:\n${profile}`,
    planSummary(plan, home),
    `Workouts in the last 7 days (${week.length}):\n${done || 'none'}`,
    `Body weight, last 3 weeks: ${w || 'not logged'}`,
    `App coach calls: ${calls || 'nothing to change'}`,
  ].join('\n\n');
}
