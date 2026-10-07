import { useState } from 'react';
import ExerciseForm from './ExerciseForm';
import ExercisePicker from './ExercisePicker';
import { Plate } from '../ui';
import { act, useWorkout } from '../../store/workout';
import { BUILTIN_ID, DAY_LONG, PLATE, emptyDay, findRoutine } from '../../lib/routines';
import { range } from '../../lib/utils';
import type { DayId, Exercise, RoutineDay } from '../../types';

/** Edit one weekday of a routine. Read-only for the built-in plan. */
export default function DayEditor({ routineId, dayId, onBack }: { routineId: string; dayId: DayId; onBack: () => void }) {
  const routines = useWorkout(s => s.routines);
  const routine = findRoutine(routines, routineId);
  const day: RoutineDay = routine.days[dayId] ?? emptyDay();
  const ro = routine.id === BUILTIN_ID;
  const [picking, setPicking] = useState(false);
  const [form, setForm] = useState<{ draft: Exercise; mode: 'add' | 'edit'; replaceId?: string } | null>(null);
  const [del, setDel] = useState<string | null>(null);

  const patch = (p: Partial<RoutineDay>) => act().updateDay(routineId, dayId, p);
  const lines = (xs: string[]) => xs.join('\n');
  const toLines = (s: string) => s.split('\n').map(x => x.trim()).filter(Boolean);
  const input = 'mt-1 h-11 w-full min-w-0 rounded-lg border border-line bg-bg px-3 disabled:opacity-70';

  return (
    <div className="grid gap-4">
      <button className="justify-self-start text-[14px] font-semibold text-accent" onClick={onBack}>‹ {routine.name}</button>
      <div className="flex items-center gap-2"><Plate color={day.exercises.length ? PLATE[dayId] : 'var(--line)'} size={14} /><span className="label">{DAY_LONG[dayId]}</span></div>
      {ro && <p className="rounded-xl bg-sunk px-4 py-3 text-[14px] text-muted">This is the built-in plan, so it's read-only. Duplicate the routine to change it.</p>}

      <div className="grid grid-cols-[1fr_96px] gap-2">
        <label htmlFor="day-title" className="block min-w-0"><span className="label">Day name</span>
          <input id="day-title" disabled={ro} placeholder={day.exercises.length ? 'e.g. Push' : 'Rest'} value={day.title}
            onChange={e => patch({ title: e.target.value })} className={input} />
        </label>
        <label htmlFor="day-mins" className="block min-w-0"><span className="label">Minutes</span>
          <input id="day-mins" disabled={ro} type="number" inputMode="numeric" placeholder="50" value={day.mins}
            onChange={e => patch({ mins: e.target.value })} className={`num ${input}`} />
        </label>
      </div>
      <label htmlFor="day-focus" className="block"><span className="label">Focus (optional)</span>
        <input id="day-focus" disabled={ro} placeholder="e.g. Chest · shoulders · triceps" value={day.focus}
          onChange={e => patch({ focus: e.target.value })} className={input} />
      </label>
      <div>
        <span className="label">Cardio after lifting</span>
        <div className="mt-1 grid grid-cols-3 gap-1 rounded-lg bg-sunk p-1">
          {([['none', 'None'], ['gym', 'At the gym'], ['home', 'At home']] as const).map(([v, l]) => (
            <button key={v} disabled={ro} onClick={() => patch({ cardio: v, home: v === 'home' ? true : day.home })} aria-pressed={day.cardio === v}
              className={`h-9 rounded-md text-[13px] font-semibold ${day.cardio === v ? 'bg-surface text-ink shadow' : 'text-muted'}`}>{l}</button>
          ))}
        </div>
      </div>

      <section className="grid gap-2">
        <div className="flex items-baseline justify-between">
          <span className="label">Exercises · {day.exercises.length}</span>
          {!day.exercises.length && <span className="text-[13px] text-muted">No exercises = rest day</span>}
        </div>
        {day.exercises.map((e, i) => (
          <article key={e.id} className="flex items-center gap-2 rounded-2xl border border-line bg-surface py-2 pl-4 pr-2">
            <button className="min-w-0 flex-1 py-1 text-left" onClick={() => setForm({ draft: { ...e }, mode: 'edit', replaceId: e.id })}>
              <span className="block font-semibold">{e.name}</span>
              <span className="block text-[13px] text-muted"><span className="num">{e.sets}×{range(e)}</span> · {e.wNote} · rest {e.rest}s</span>
            </button>
            {!ro && (
              <div className="flex shrink-0 items-center">
                <button aria-label="Move up" disabled={i === 0} onClick={() => act().moveExercise(routineId, dayId, i, i - 1)} className="grid h-10 w-9 place-items-center text-muted disabled:opacity-30">↑</button>
                <button aria-label="Move down" disabled={i === day.exercises.length - 1} onClick={() => act().moveExercise(routineId, dayId, i, i + 1)} className="grid h-10 w-9 place-items-center text-muted disabled:opacity-30">↓</button>
                {del === e.id
                  ? <button className="h-10 px-2 text-[13px] font-bold text-danger" onClick={() => { act().removeExercise(routineId, dayId, e.id); setDel(null); }}>Remove</button>
                  : <button aria-label={`Remove ${e.name}`} onClick={() => setDel(e.id)} className="grid h-10 w-9 place-items-center text-[18px] text-muted">×</button>}
              </div>
            )}
          </article>
        ))}
        {!ro && (
          <button id="add-exercise" onClick={() => setPicking(true)} className="h-12 rounded-xl bg-accent text-[15px] font-bold text-accentInk">+ Add exercise</button>
        )}
      </section>

      <label htmlFor="day-warmup" className="block"><span className="label">Warm-up · one per line</span>
        <textarea id="day-warmup" disabled={ro} rows={4} defaultValue={lines(day.warmup)} key={`w-${routine.updatedAt}-${ro}`}
          onBlur={e => patch({ warmup: toLines(e.target.value) })} placeholder="Arm circles × 10" className="mt-1 w-full rounded-lg border border-line bg-bg px-3 py-2 disabled:opacity-70" />
      </label>
      <label htmlFor="day-cooldown" className="block"><span className="label">Cool-down · one per line</span>
        <textarea id="day-cooldown" disabled={ro} rows={4} defaultValue={lines(day.cooldown)} key={`c-${routine.updatedAt}-${ro}`}
          onBlur={e => patch({ cooldown: toLines(e.target.value) })} placeholder="Child's Pose · 30s" className="mt-1 w-full rounded-lg border border-line bg-bg px-3 py-2 disabled:opacity-70" />
      </label>

      {picking && (
        <ExercisePicker excludeIds={day.exercises.map(e => e.id)} onClose={() => setPicking(false)}
          onPick={draft => { setPicking(false); setForm({ draft, mode: 'add' }); }} />
      )}
      {form && (ro
        ? <ReadOnlyExercise ex={form.draft} onClose={() => setForm(null)} />
        : <ExerciseForm draft={form.draft} mode={form.mode} onClose={() => setForm(null)}
            onSave={ex => { act().saveExercise(routineId, dayId, ex, form.replaceId); setForm(null); }} />)}
    </div>
  );
}

function ReadOnlyExercise({ ex, onClose }: { ex: Exercise; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end bg-black/50" onClick={onClose}>
      <div className="w-full rounded-t-3xl border-t border-line bg-surface px-4 pt-5" style={{ paddingBottom: 'calc(20px + env(safe-area-inset-bottom, 0px))' }} onClick={e => e.stopPropagation()}>
        <div className="mx-auto grid max-w-xl gap-2">
          <h2 className="disp text-[26px] font-bold uppercase">{ex.name}</h2>
          <p className="text-[15px]"><span className="num font-semibold">{ex.sets}×{range(ex)}</span> · {ex.wNote} · rest {ex.rest}s</p>
          {ex.cue && <p className="rounded-lg bg-sunk px-3 py-2 text-[14px]">{ex.cue}</p>}
          <button className="mt-2 h-11 text-[14px] font-semibold text-muted" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}
