import { CheckIcon as Check } from '../ui';
import { act } from '../../store/workout';
import type { Exercise, SetLog } from '../../types';
import { isAssisted } from '../../lib/coach';

export type OnRest = (secs: number, label: string) => void;

/**
 * Logging rows for one exercise: kg, reps (or seconds) and a tick per set.
 * `afterTick` lets guided mode move on and say what's next in the rest timer.
 */
export default function SetRows({ e, rows, onRest, afterTick }: {
  e: Exercise; rows: SetLog[]; onRest: OnRest;
  afterTick?: (setIndex: number) => { label?: string } | void;
}) {
  const bw = e.start == null;
  return (
    <div className="px-3 pb-3 pt-3">
      <div className="grid grid-cols-[28px_1fr_1fr_48px] gap-2 px-1 pb-1">
        <span className="label">Set</span><span className="label">{isAssisted(e) ? 'Help kg' : bw ? 'Added kg' : 'kg'}</span><span className="label">{e.unit === 'sec' ? 'Seconds' : 'Reps'}</span><span />
      </div>
      <div className="grid gap-1.5">
        {rows.map((r, i) => (
          <div key={i} className={`grid grid-cols-[28px_1fr_1fr_48px] items-center gap-2 rounded-xl px-1 py-1 ${r.done ? 'bg-goodSoft' : ''}`}>
            <span className="num text-center text-[14px] font-bold text-muted">{i + 1}</span>
            <input id={`${e.id}-w-${i}`} inputMode="decimal" type="number" step="0.5" placeholder={isAssisted(e) ? 'none' : bw ? 'BW' : '—'} value={r.w}
              onChange={ev => act().edit(e.id, i, { w: ev.target.value })}
              className="num h-11 w-full min-w-0 rounded-lg border border-line bg-bg px-3 text-ink placeholder:text-muted" />
            <input id={`${e.id}-r-${i}`} inputMode="numeric" type="number" placeholder={`${e.max}`} value={r.r}
              onChange={ev => act().edit(e.id, i, { r: ev.target.value })}
              className="num h-11 w-full min-w-0 rounded-lg border border-line bg-bg px-3 text-ink placeholder:text-muted" />
            <button aria-label={`Mark set ${i + 1} done`} onClick={() => {
              const done = !r.done;
              act().edit(e.id, i, { done, r: done && r.r === '' ? String(e.max) : r.r });
              if (!done) return;
              const next = afterTick?.(i);
              if (e.rest > 0) onRest(e.rest, (next && next.label) || `${e.name} · set ${i + 1}`);
            }} className={`grid h-11 w-12 place-items-center rounded-lg border transition ${r.done ? 'border-good bg-good text-surface' : 'border-line bg-surface text-muted'}`}>
              <Check />
            </button>
          </div>
        ))}
      </div>
      <div className="mt-2 flex gap-2 px-1">
        <button className="rounded-lg px-2 py-1.5 text-[13px] font-semibold text-accent" onClick={() => act().addSet(e.id)}>+ Add set</button>
        {rows.length > 1 && <button className="rounded-lg px-2 py-1.5 text-[13px] font-semibold text-muted" onClick={() => act().removeSet(e.id)}>Remove last</button>}
      </div>
    </div>
  );
}
