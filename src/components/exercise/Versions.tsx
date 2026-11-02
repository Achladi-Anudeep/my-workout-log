import { useState } from 'react';
import { VERSIONS } from '../../data/versions';
import { gifUrl } from '../../data/demos';
import type { Exercise } from '../../types';

/** Hand-picked, checked variations of an exercise (other equipment, easier or harder). Tap one to see it big. */
export default function Versions({ e }: { e: Exercise }) {
  const list = VERSIONS[e.id] ?? [];
  const [pick, setPick] = useState<number | null>(null);
  if (!list.length) return null;
  const sel = pick != null ? list[pick] : null;
  return (
    <section className="versions grid gap-2">
      <div className="label">Other versions</div>
      <div className="grid grid-cols-3 gap-2">
        {list.slice(0, 6).map((x, i) => (
          <button key={x.id} onClick={() => setPick(pick === i ? null : i)} aria-pressed={pick === i}
            className={`overflow-hidden rounded-xl border text-left ${pick === i ? 'border-ink' : 'border-line'} bg-surface`}>
            <img src={gifUrl(x.id)} alt="" loading="lazy" className="aspect-square w-full bg-white object-contain" />
            <span className="block px-1.5 py-1 text-[11px] font-semibold leading-tight">{x.label}</span>
          </button>
        ))}
      </div>
      {sel && (
        <div className="grid gap-1.5 rounded-xl border border-line bg-surface p-2">
          <img src={gifUrl(sel.id)} alt={`Demo of ${sel.label}`} className="mx-auto aspect-square w-full max-w-sm rounded-lg bg-white object-contain" />
          <p className="text-[14px] font-semibold">{sel.label}</p>
          {sel.note && <p className="-mt-1 text-[13px] text-muted">{sel.note}</p>}
          <p className="text-[12px] text-muted">For reference. Your plan's version is the one at the top; use Swap during a workout to log a different exercise.</p>
        </div>
      )}
    </section>
  );
}
