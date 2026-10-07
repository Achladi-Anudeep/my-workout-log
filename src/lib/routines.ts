import { PLAN, DAY as BUILTIN_DAY } from '../data/plan';
import type { Day, DayId, Exercise, Routine, RoutineDay, Session } from '../types';

export const DAY_IDS: DayId[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
export const DAY_SHORT: Record<DayId, string> = { mon: 'Mon', tue: 'Tue', wed: 'Wed', thu: 'Thu', fri: 'Fri', sat: 'Sat', sun: 'Sun' };
export const DAY_LONG: Record<DayId, string> = { mon: 'Monday', tue: 'Tuesday', wed: 'Wednesday', thu: 'Thursday', fri: 'Friday', sat: 'Saturday', sun: 'Sunday' };
/** Plate colour per weekday — the same in every routine, so the calendar reads consistently. */
export const PLATE: Record<DayId, string> = Object.fromEntries(PLAN.map(d => [d.id, d.plate])) as Record<DayId, string>;

export const BUILTIN_ID = 'builtin-ppl';

/** Your original plan. Never stored or edited; duplicate it to customise. */
export const BUILTIN: Routine = {
  id: BUILTIN_ID,
  name: 'Gym PPL',
  builtin: true,
  updatedAt: 0,
  days: Object.fromEntries(PLAN.map(d => {
    const { id: _id, short: _s, plate: _p, ...rest } = d;
    return [d.id, rest];
  })) as Record<DayId, RoutineDay>,
};

export const emptyDay = (): RoutineDay => ({ title: '', focus: '', mins: '', cardio: 'none', warmup: [], cooldown: [], exercises: [] });

export const clone = <T,>(x: T): T => JSON.parse(JSON.stringify(x));

export function toDay(r: Routine, id: DayId): Day {
  const d = r.days[id] ?? emptyDay();
  const isRest = d.exercises.length === 0;
  return {
    ...d,
    id,
    short: DAY_SHORT[id],
    plate: isRest ? 'var(--line)' : PLATE[id],
    title: d.title.trim() || (isRest ? 'Rest' : DAY_LONG[id]),
    focus: d.focus || (isRest ? 'Rest day' : ''),
    mins: isRest ? '0' : d.mins,
  };
}

export const planOf = (r: Routine): Day[] => DAY_IDS.map(id => toDay(r, id));

export function findRoutine(routines: Routine[], id: string): Routine {
  return routines.find(r => r.id === id) ?? BUILTIN;
}

/** Title shown for a logged session. */
export const sessionTitle = (s: Session) => s.title ?? BUILTIN_DAY[s.dayId]?.title ?? DAY_LONG[s.dayId];

/** Which days of a plan include an exercise. */
export const exDays = (plan: Day[], id: string) => plan.filter(d => d.exercises.some(e => e.id === id)).map(d => d.short);
