import { detailsOf } from '../data/details';
import type { Exercise } from '../types';

/** Targets, steps, key cue and common mistakes for one exercise. */
export default function ExerciseHowTo({ e }: { e: Exercise }) {
  const d = detailsOf(e);
  if (!d && !e.cue) return <p className="text-[14px] text-muted">No details yet. Edit the exercise in your routine to add some.</p>;
  return (
    <div className="grid gap-3 text-[14px]">
      {d?.targets && (
        <div><div className="label">Works</div><p className="mt-0.5">{d.targets}</p></div>
      )}
      {d && d.steps.length > 0 && (
        <div>
          <div className="label">How to do it</div>
          <ol className="mt-1 grid list-decimal gap-1 pl-5">{d.steps.map((s, i) => <li key={i}>{s}</li>)}</ol>
        </div>
      )}
      {e.cue && (
        <div className="rounded-lg bg-accentSoft px-3 py-2"><span className="font-semibold">Key cue: </span>{e.cue}</div>
      )}
      {d && d.mistakes.length > 0 && (
        <div>
          <div className="label">Avoid</div>
          <ul className="mt-1 grid gap-1">
            {d.mistakes.map((m, i) => <li key={i} className="flex gap-2"><span aria-hidden className="text-danger">✕</span><span>{m}</span></li>)}
          </ul>
        </div>
      )}
    </div>
  );
}
