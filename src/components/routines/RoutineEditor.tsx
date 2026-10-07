import { useState } from 'react';
import { Chip, Plate } from '../ui';
import { act, useWorkout } from '../../store/workout';
import { BUILTIN_ID, findRoutine, planOf } from '../../lib/routines';
import type { DayId } from '../../types';

/** One routine: rename, activate, duplicate, delete, and pick a day to edit. */
export default function RoutineEditor({ id, onBack, onOpenDay, onOpenRoutine }: {
  id: string; onBack: () => void; onOpenDay: (d: DayId) => void; onOpenRoutine: (id: string) => void;
}) {
  const routines = useWorkout(s => s.routines);
  const activeId = useWorkout(s => s.activeRoutineId);
  const workoutRunning = useWorkout(s => !!s.active);
  const routine = findRoutine(routines, id);
  const ro = routine.id === BUILTIN_ID;
  const isActive = activeId === routine.id;
  const [confirmDel, setConfirmDel] = useState(false);
  const plan = planOf(routine);
  const trainingDays = plan.filter(d => d.exercises.length).length;

  return (
    <div className="grid gap-4">
      <button className="justify-self-start text-[14px] font-semibold text-accent" onClick={onBack}>‹ All routines</button>

      {ro ? (
        <div>
          <h2 className="disp text-[34px] font-extrabold uppercase leading-none">{routine.name}</h2>
          <p className="mt-2 rounded-xl bg-sunk px-4 py-3 text-[14px] text-muted">Your original plan. It's locked so it never changes by accident. Duplicate it to make an editable copy; your progress history carries over.</p>
        </div>
      ) : (
        <label htmlFor="routine-name" className="block"><span className="label">Routine name</span>
          <input id="routine-name" value={routine.name} onChange={e => act().renameRoutine(routine.id, e.target.value)}
            className="disp mt-1 h-14 w-full rounded-lg border border-line bg-bg px-3 text-[26px] font-bold uppercase" />
        </label>
      )}

      <div className="flex flex-wrap items-center gap-2">
        {isActive
          ? <Chip tone="good">✓ Active routine</Chip>
          : <button id="set-active" className="h-10 rounded-lg bg-accent px-4 text-[14px] font-bold text-accentInk" onClick={() => act().setActiveRoutine(routine.id)}>Use this routine</button>}
        <button id="duplicate-routine" className="h-10 rounded-lg border border-line bg-surface px-4 text-[14px] font-semibold"
          onClick={() => onOpenRoutine(act().createRoutine(`${routine.name} (copy)`, routine.id))}>Duplicate</button>
        {!ro && (confirmDel
          ? <button className="h-10 px-3 text-[14px] font-bold text-danger" onClick={() => { act().deleteRoutine(routine.id); onBack(); }}>Tap again to delete</button>
          : <button className="h-10 px-3 text-[14px] font-semibold text-muted" onClick={() => setConfirmDel(true)}>Delete</button>)}
      </div>
      {isActive && workoutRunning && <p className="text-[13px] text-muted">Edits apply from your next workout. The one in progress keeps its exercises.</p>}

      <section className="grid gap-2">
        <div className="label">Week · {trainingDays} training day{trainingDays === 1 ? '' : 's'}</div>
        <div className="overflow-hidden rounded-2xl border border-line bg-surface">
          {plan.map((d, i) => (
            <button key={d.id} id={`edit-day-${d.id}`} onClick={() => onOpenDay(d.id)} className={`flex w-full items-center gap-3 px-4 py-3 text-left ${i ? 'border-t border-line' : ''}`}>
              <span className="disp w-10 text-[18px] font-bold uppercase">{d.short}</span>
              <Plate color={d.plate} size={12} />
              <span className="min-w-0 flex-1">
                <span className="block font-semibold">{d.title}</span>
                <span className="block truncate text-[13px] text-muted">{d.exercises.length ? d.exercises.map(e => e.name).join(', ') : 'Rest day'}</span>
              </span>
              <span className="text-[13px] font-semibold text-accent">{ro ? 'View' : 'Edit'} ›</span>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
