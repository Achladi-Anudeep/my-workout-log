import type { Exercise, LoggedSet, Session } from '../types';
import { fmtW, nextWeight } from './utils';

/**
 * What to do on an exercise next time, based on your last workouts:
 * add weight, stay and add reps, drop back, or (bodyweight) make it harder.
 */
export type AdviceKind = 'new' | 'up' | 'hold' | 'down' | 'harder' | 'easy-week' | 'comeback';
export interface Advice {
  kind: AdviceKind;
  /** Short line for chips, e.g. "Add weight · 21 kg". */
  title: string;
  /** One sentence on why and what to aim for. */
  detail: string;
  /** Weight to load next time (kg), or null for bodyweight / unknown. */
  weight: number | null;
}

/** About 10% lighter, at least 1 kg, rounded to 0.5 kg. */
export const dropWeight = (w: number) => Math.max(0, w < 10 ? w - 1 : Math.round(w * 0.9 * 2) / 2);
const lighter = (w: number, pct: number) => Math.max(0, Math.round(w * (1 - pct) * 2) / 2);

const unitWord = (e: Exercise) => (e.unit === 'sec' ? 's' : ' reps');
const working = (e: Exercise, sets: LoggedSet[]) => sets.slice(0, e.sets);
const isWeighted = (e: Exercise, sets: LoggedSet[]) => e.start != null || sets.some(s => s.w != null && s.w > 0);

/** The two most recent sessions that include this exercise, newest first. */
function lastTwo(sessions: Session[], id: string) {
  const out: { s: Session; sets: LoggedSet[] }[] = [];
  for (const s of sessions) {
    const x = s.ex.find(e => e.id === id);
    if (x && x.sets.length) out.push({ s, sets: x.sets });
    if (out.length === 2) break;
  }
  return out;
}

export function advise(sessions: Session[], e: Exercise, opts: { deload?: boolean; now?: number } = {}): Advice {
  const now = opts.now ?? Date.now();
  const [last, prev] = lastTwo(sessions, e.id);
  const startW = e.start;
  if (!last) {
    return { kind: 'new', title: 'First time', detail: `Start at ${e.wNote.toLowerCase()} and focus on form.`, weight: startW };
  }
  const sets = working(e, last.sets);
  const weighted = isWeighted(e, sets);
  const w = weighted ? Math.max(...sets.map(s => s.w ?? 0)) : null;
  const tgt = (n: number) => `${n}${unitWord(e)}`;

  if (opts.deload && w != null && w > 0) {
    const lw = lighter(w, 0.2);
    return { kind: 'easy-week', title: `Easy week · ${fmtW(lw)} kg`, detail: `About 20% lighter this week so your body recovers. Aim for ${tgt(e.max)}, nothing to failure.`, weight: lw };
  }

  const daysOff = (now - last.s.startedAt) / 86400000;
  if (daysOff > 21 && w != null && w > 0) {
    const lw = lighter(w, 0.1);
    return { kind: 'comeback', title: `Welcome back · ${fmtW(lw)} kg`, detail: `It's been ${Math.round(daysOff)} days. Start about 10% lighter and build back up over 1–2 weeks.`, weight: lw };
  }

  const allTop = sets.length >= e.sets && sets.every(s => s.r >= e.max);
  const missed = sets.filter(s => s.r < e.min).length;
  const mostlyMissed = missed > 0 && missed * 2 >= sets.length;

  if (!weighted) {
    if (allTop) {
      return e.unit === 'sec'
        ? { kind: 'harder', title: 'Hold longer', detail: `All holds hit ${tgt(e.max)}. Add 5–10 s per hold, or raise the target in your routine.`, weight: null }
        : { kind: 'harder', title: 'Make it harder', detail: 'All sets hit the top. Lower slower (3 s), pause at the hardest point, or try a harder version.', weight: null };
    }
    const best = Math.max(...sets.map(s => s.r));
    return { kind: 'hold', title: 'Add a little', detail: `Beat last time: aim for ${tgt(Math.min(e.max, best + (e.unit === 'sec' ? 5 : 1)))} on each set.`, weight: null };
  }

  const kg = w ?? 0;
  if (allTop) {
    const up = nextWeight(kg);
    return { kind: 'up', title: `Add weight · ${fmtW(up)} kg`, detail: `All sets hit ${tgt(e.max)} at ${fmtW(kg)} kg. Go up and start again at ${tgt(e.min)}.`, weight: up };
  }

  if (mostlyMissed) {
    const prevSets = prev ? working(e, prev.sets) : [];
    const prevW = prevSets.length ? Math.max(...prevSets.map(s => s.w ?? 0)) : 0;
    const prevMissed = prevSets.length > 0 && prevW >= kg && prevSets.filter(s => s.r < e.min).length * 2 >= prevSets.length;
    if (prevMissed) {
      const down = dropWeight(kg);
      return { kind: 'down', title: `Go lighter · ${fmtW(down)} kg`, detail: `Two workouts in a row under ${tgt(e.min)} at ${fmtW(kg)} kg. Drop back, own the full range, then build up again.`, weight: down };
    }
    return { kind: 'hold', title: `Stay at ${fmtW(kg)} kg`, detail: `Last time most sets were under ${tgt(e.min)}. Keep the weight and aim for ${tgt(e.min)}. If it happens again, go lighter.`, weight: kg };
  }

  const aim = sets.map(s => Math.min(e.max, s.r + (e.unit === 'sec' ? 5 : 1)));
  return { kind: 'hold', title: `Stay at ${fmtW(kg)} kg`, detail: `Add a rep per set: aim for ${aim.join(', ')}${e.unit === 'sec' ? ' s' : ''}. Add weight once every set hits ${tgt(e.max)}.`, weight: kg };
}
