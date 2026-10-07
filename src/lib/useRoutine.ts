import { useMemo } from 'react';
import { useWorkout } from '../store/workout';
import { BUILTIN, DAY_IDS, findRoutine, planOf } from './routines';
import type { Day, DayId, Exercise } from '../types';

/** The active routine and its 7 days, as the screens consume them. */
export function useActivePlan() {
  const routines = useWorkout(s => s.routines);
  const activeId = useWorkout(s => s.activeRoutineId);
  return useMemo(() => {
    const routine = findRoutine(routines, activeId);
    const plan = planOf(routine);
    const byId = Object.fromEntries(plan.map(d => [d.id, d])) as Record<DayId, Day>;
    return { routine, plan, byId };
  }, [routines, activeId]);
}

/** Every exercise you have in any routine, active routine first; deduped by id. */
export function useAllExercises() {
  const routines = useWorkout(s => s.routines);
  const activeId = useWorkout(s => s.activeRoutineId);
  return useMemo(() => {
    const ordered = [findRoutine(routines, activeId), BUILTIN, ...routines];
    const m = new Map<string, Exercise>();
    ordered.forEach(r => DAY_IDS.forEach(d => r.days[d]?.exercises.forEach(e => { if (!m.has(e.id)) m.set(e.id, e); })));
    return [...m.values()];
  }, [routines, activeId]);
}

