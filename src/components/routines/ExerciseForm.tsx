import { useState } from 'react';
import type { Exercise, Unit } from '../../types';

/** Bottom sheet to add or edit one exercise in a routine day. */
export default function ExerciseForm({ draft, mode, onSave, onClose }: {
  draft: Exercise; mode: 'add' | 'edit'; onSave: (ex: Exercise) => void; onClose: () => void;
}) {
  const [f, setF] = useState({
    name: draft.name,
    sets: String(draft.sets),
    unit: draft.unit as Unit,
    min: String(draft.min),
    max: String(draft.max),
    start: draft.start == null ? '' : String(draft.start),
    wNote: draft.wNote,
    rest: String(draft.rest),
    perSide: !!draft.perSide,
    cue: draft.cue,
  });
  const [err, setErr] = useState('');
  const up = (p: Partial<typeof f>) => { setF({ ...f, ...p }); setErr(''); };

  const save = () => {
    const sets = Number(f.sets), min = Number(f.min), max = Number(f.max || f.min), rest = Number(f.rest || 0);
    const start = f.start.trim() === '' ? null : Number(f.start.replace(',', '.'));
    if (!f.name.trim()) return setErr('Give the exercise a name.');
    if (!Number.isInteger(sets) || sets < 1 || sets > 10) return setErr('Sets must be between 1 and 10.');
    if (!min || min < 1 || !max || max < min) return setErr(`Enter a ${f.unit === 'sec' ? 'time' : 'rep'} range, low number first (e.g. 8 to 12).`);
    if (start != null && (Number.isNaN(start) || start < 0 || start > 500)) return setErr('Starting weight must be a number in kg, or blank for bodyweight.');
    if (Number.isNaN(rest) || rest < 0 || rest > 600) return setErr('Rest must be between 0 and 600 seconds.');
    onSave({
      ...draft,
      name: f.name.trim(), sets, unit: f.unit, min, max, start, rest, perSide: f.perSide,
      wNote: f.wNote.trim() || (start == null ? 'Bodyweight' : `${start} kg`),
      cue: f.cue.trim(),
    });
  };

  const input = 'mt-1 h-11 w-full min-w-0 rounded-lg border border-line bg-bg px-3';
  return (
    <div className="fixed inset-0 z-50 flex items-end bg-black/50" onClick={onClose}>
      <div className="max-h-[92vh] w-full overflow-y-auto rounded-t-3xl border-t border-line bg-surface px-4 pt-5"
        style={{ paddingBottom: 'calc(20px + env(safe-area-inset-bottom, 0px))' }} onClick={e => e.stopPropagation()}>
        <form className="mx-auto grid max-w-xl gap-3" onSubmit={e => { e.preventDefault(); save(); }}>
          <h2 className="disp text-[26px] font-bold uppercase">{mode === 'add' ? 'Add exercise' : 'Edit exercise'}</h2>
          {draft.demo && (
            <img src={draft.demo.gifUrl} alt="" className="mx-auto h-36 w-36 rounded-xl bg-white object-contain" />
          )}
          <label htmlFor="ex-name" className="block"><span className="label">Name</span>
            <input id="ex-name" value={f.name} onChange={e => up({ name: e.target.value })} className={input} />
          </label>

          <div>
            <span className="label">Measured in</span>
            <div className="mt-1 grid grid-cols-2 gap-1 rounded-lg bg-sunk p-1">
              {(['reps', 'sec'] as Unit[]).map(u => (
                <button key={u} type="button" onClick={() => up({ unit: u })} aria-pressed={f.unit === u}
                  className={`h-9 rounded-md text-[14px] font-semibold ${f.unit === u ? 'bg-surface text-ink shadow' : 'text-muted'}`}>
                  {u === 'reps' ? 'Reps' : 'Seconds (holds, carries)'}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <label htmlFor="ex-sets" className="block min-w-0"><span className="label">Sets</span>
              <input id="ex-sets" type="number" inputMode="numeric" value={f.sets} onChange={e => up({ sets: e.target.value })} className={`num ${input}`} />
            </label>
            <label htmlFor="ex-min" className="block min-w-0"><span className="label">{f.unit === 'sec' ? 'Min sec' : 'Min reps'}</span>
              <input id="ex-min" type="number" inputMode="numeric" value={f.min} onChange={e => up({ min: e.target.value })} className={`num ${input}`} />
            </label>
            <label htmlFor="ex-max" className="block min-w-0"><span className="label">{f.unit === 'sec' ? 'Max sec' : 'Max reps'}</span>
              <input id="ex-max" type="number" inputMode="numeric" value={f.max} onChange={e => up({ max: e.target.value })} className={`num ${input}`} />
            </label>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <label htmlFor="ex-start" className="block min-w-0"><span className="label">Start weight (kg)</span>
              <input id="ex-start" type="number" inputMode="decimal" step="0.5" placeholder="Blank = bodyweight" value={f.start}
                onChange={e => up({ start: e.target.value })} className={`num ${input}`} />
            </label>
            <label htmlFor="ex-rest" className="block min-w-0"><span className="label">Rest (sec)</span>
              <input id="ex-rest" type="number" inputMode="numeric" value={f.rest} onChange={e => up({ rest: e.target.value })} className={`num ${input}`} />
            </label>
          </div>

          <label htmlFor="ex-note" className="block"><span className="label">Weight note (optional)</span>
            <input id="ex-note" placeholder="e.g. 6–8 kg per hand" value={f.wNote} onChange={e => up({ wNote: e.target.value })} className={input} />
          </label>

          <label htmlFor="ex-side" className="flex items-center gap-3 py-1">
            <input id="ex-side" type="checkbox" checked={f.perSide} onChange={e => up({ perSide: e.target.checked })} className="h-5 w-5 accent-[var(--accent)]" />
            <span className="text-[14px]">Done per side (each leg / arm)</span>
          </label>

          <label htmlFor="ex-cue" className="block"><span className="label">Form cue (optional)</span>
            <textarea id="ex-cue" rows={2} value={f.cue} onChange={e => up({ cue: e.target.value })}
              className="mt-1 w-full rounded-lg border border-line bg-bg px-3 py-2" />
          </label>

          {err && <p className="text-[13px] text-danger">{err}</p>}
          <button type="submit" className="h-12 w-full rounded-xl bg-accent text-[16px] font-bold text-accentInk">{mode === 'add' ? 'Add to day' : 'Save changes'}</button>
          <button type="button" className="h-11 text-[14px] font-semibold text-muted" onClick={onClose}>Cancel</button>
        </form>
      </div>
    </div>
  );
}
