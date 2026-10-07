import { useState } from 'react';
import { useAllExercises } from '../../lib/useRoutine';
import { cleanStep, useDemos, type Demo } from '../../lib/exercisedb';
import { uid } from '../../lib/utils';
import { range } from '../../lib/utils';
import type { Exercise } from '../../types';

const titleCase = (s: string) => s.replace(/\b\w/g, c => c.toUpperCase());

/** A starting draft for a library exercise; you confirm sets/reps/weight in the form next. */
function fromLibrary(d: Demo): Exercise {
  const bodyweight = d.equipments.some(x => /body ?weight/i.test(x));
  const first = d.instructions[0] ? cleanStep(d.instructions[0]) : '';
  return {
    id: `exdb-${d.exerciseId}`, name: titleCase(d.name), sets: 3, min: 8, max: 12, unit: 'reps',
    start: null, wNote: bodyweight ? 'Bodyweight' : '', rest: 90, cue: first.length > 160 ? first.slice(0, 157) + '…' : first,
    demo: { id: d.exerciseId, name: d.name, gifUrl: d.gifUrl },
  };
}

export const blankExercise = (): Exercise => ({
  id: `custom-${uid()}`, name: '', sets: 3, min: 8, max: 12, unit: 'reps', start: null, wNote: '', rest: 90, cue: '',
});

/** Full-screen picker: your existing exercises (keeps their history), the online library, or a custom one. */
export default function ExercisePicker({ excludeIds, onPick, onClose }: {
  excludeIds: string[]; onPick: (draft: Exercise) => void; onClose: () => void;
}) {
  const [q, setQ] = useState('');
  const mine = useAllExercises().filter(e => !excludeIds.includes(e.id) && (!q || e.name.toLowerCase().includes(q.toLowerCase())));
  const search = q.trim().length >= 3 ? q.trim().toLowerCase() : null;
  const lib = useDemos(search, 15);

  return (
    <div className="fixed inset-0 z-40 overflow-y-auto bg-bg" style={{ paddingTop: 'env(safe-area-inset-top, 0px)', paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
      <div className="sticky top-0 z-10 border-b border-line bg-bg px-4 py-3">
        <div className="mx-auto flex max-w-xl items-center gap-2">
          <input id="picker-search" type="search" autoFocus placeholder="Search exercises, e.g. hip thrust" value={q} onChange={e => setQ(e.target.value)}
            className="h-11 min-w-0 flex-1 rounded-xl border border-line bg-surface px-4" />
          <button className="h-11 px-2 text-[14px] font-semibold text-muted" onClick={onClose}>Cancel</button>
        </div>
      </div>

      <div className="mx-auto grid max-w-xl gap-5 px-4 py-4">
        <button onClick={() => onPick({ ...blankExercise(), name: titleCase(q.trim()) })}
          className="flex h-12 items-center justify-center rounded-xl border border-dashed border-line text-[15px] font-semibold text-accent">
          + Create custom exercise{q.trim() ? ` "${q.trim()}"` : ''}
        </button>

        {mine.length > 0 && (
          <section className="grid gap-2">
            <div className="label">Your exercises · keeps their progress history</div>
            <div className="overflow-hidden rounded-2xl border border-line bg-surface">
              {mine.slice(0, q ? 20 : 40).map((e, i) => (
                <button key={e.id} onClick={() => onPick({ ...e })} className={`flex w-full items-center gap-3 px-4 py-3 text-left ${i ? 'border-t border-line' : ''}`}>
                  <span className="min-w-0 flex-1"><span className="block font-semibold">{e.name}</span>
                    <span className="block text-[12px] text-muted">{e.sets}×{range(e)} · {e.wNote}</span></span>
                  <span className="text-[13px] font-semibold text-accent">Add</span>
                </button>
              ))}
            </div>
          </section>
        )}

        <section className="grid gap-2">
          <div className="label">Exercise library</div>
          {!search && <p className="text-[14px] text-muted">Type at least 3 letters to search about 1,500 exercises with demos.</p>}
          {search && lib.error && <p className="text-[14px] text-muted">Couldn't reach the exercise library. Check your connection, or create a custom exercise.</p>}
          {search && !lib.error && !lib.data && <p className="text-[14px] text-muted">Searching…</p>}
          {lib.data && !lib.data.length && <p className="text-[14px] text-muted">No matches. Try a simpler name, like "curl" or "row".</p>}
          {lib.data && lib.data.length > 0 && (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {lib.data.filter(d => !excludeIds.includes(`exdb-${d.exerciseId}`)).map(d => (
                <button key={d.exerciseId} onClick={() => onPick(fromLibrary(d))} className="overflow-hidden rounded-xl border border-line bg-surface text-left">
                  <img src={d.gifUrl} alt="" loading="lazy" className="aspect-square w-full bg-white object-contain" />
                  <div className="px-2.5 py-2 text-[13px] font-semibold capitalize leading-snug">{d.name}</div>
                  <div className="px-2.5 pb-2 text-[11px] capitalize text-muted">{d.targetMuscles.join(', ')}</div>
                </button>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
