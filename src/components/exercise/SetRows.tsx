import { useState } from 'react';
import { CheckIcon as Check } from '../ui';
import { act, useWorkout } from '../../store/workout';
import type { Exercise, Feel, SetLog } from '../../types';
import { isAssisted } from '../../lib/coach';
import { haptic, isNewBest, platesFor } from '../../lib/lift';

export type OnRest = (secs: number, label: string) => void;

const FEELS: { v: Feel | undefined; label: string }[] = [{ v: 'easy', label: 'Easy' }, { v: undefined, label: 'OK' }, { v: 'hard', label: 'Hard' }];

/**
 * Logging rows for one exercise: kg, reps (or seconds) and a tick per set.
 * After a tick you can say how it felt (easy / OK / hard); the coach uses it.
 * `afterTick` lets guided mode move on and say what's next in the rest timer.
 */
export default function SetRows({ e, rows, onRest, afterTick }: {
  e: Exercise; rows: SetLog[]; onRest: OnRest;
  afterTick?: (setIndex: number) => { label?: string } | void;
}) {
  const bw = e.start == null;
  const sessions = useWorkout(s => s.sessions);
  const [asked, setAsked] = useState<number | null>(null);
  const current = rows.find(r => !r.done) ?? rows[rows.length - 1];
  const plates = e.loads?.length && current ? platesFor(Number(current.w)) : null;
  return (
    <div className="px-3 pb-3 pt-2">
      <div className="grid grid-cols-[28px_1fr_1fr_48px] gap-2 px-1 pb-1">
        <span className="label">Set</span><span className="label">{isAssisted(e) ? 'Help kg' : bw ? 'Added kg' : 'kg'}</span><span className="label">{e.unit === 'sec' ? 'Seconds' : 'Reps'}</span><span />
      </div>
      {e.loads?.length ? (
        <p className="kit-loads px-1 pb-1 text-[12px] text-muted">
          Your kit: {e.loads.map(l => `${l}`).join(' · ')} kg{plates ? <> · <span className="plates font-semibold text-ink">{fmtKg(current!.w)} kg = {plates}</span></> : null}
        </p>
      ) : null}
      <div className="grid gap-1.5">
        {rows.map((r, i) => {
          const best = r.done && isNewBest(sessions, e, r.w === '' ? null : Number(r.w), Number(r.r));
          return (
            <div key={i} className="grid gap-1">
              <div className={`grid grid-cols-[28px_1fr_1fr_48px] items-center gap-2 rounded-xl px-1 py-1 transition-colors duration-200 ${r.done ? 'bg-goodSoft' : ''}`}>
                <span className="num text-center text-[14px] font-bold text-muted">{i + 1}</span>
                <input id={`${e.id}-w-${i}`} inputMode="decimal" type="number" step="0.5" placeholder={isAssisted(e) ? 'none' : bw ? 'BW' : '—'} value={r.w}
                  onChange={ev => act().edit(e.id, i, { w: ev.target.value })}
                  className="num h-11 w-full min-w-0 rounded-lg border border-line bg-bg px-3 text-ink placeholder:text-muted" />
                <input id={`${e.id}-r-${i}`} inputMode="numeric" type="number" placeholder={`${e.max}`} value={r.r}
                  onChange={ev => act().edit(e.id, i, { r: ev.target.value })}
                  className="num h-11 w-full min-w-0 rounded-lg border border-line bg-bg px-3 text-ink placeholder:text-muted" />
                <button aria-label={`Mark set ${i + 1} done`} onClick={() => {
                  const done = !r.done;
                  act().edit(e.id, i, { done, r: done && r.r === '' ? String(e.max) : r.r, ...(done ? {} : { feel: undefined }) });
                  if (!done) { if (asked === i) setAsked(null); return; }
                  haptic();
                  setAsked(i);
                  const next = afterTick?.(i);
                  if (e.rest > 0) onRest(e.rest, (next && next.label) || `${e.name} · set ${i + 1}`);
                }} className={`grid h-11 w-12 place-items-center rounded-lg border transition ${r.done ? 'border-good bg-good text-surface anim-pop' : 'border-line bg-surface text-muted'}`}>
                  <Check />
                </button>
              </div>
              {r.done && (best || r.feel || asked === i) && (
                <div className="anim-fade flex flex-wrap items-center gap-1.5 pl-9 text-[12px]">
                  {best && <span className="new-best anim-pop rounded-md bg-hot px-2 py-0.5 font-bold uppercase tracking-wide text-hotInk">New best</span>}
                  {asked === i ? (
                    <span role="group" aria-label={`How did set ${i + 1} feel?`} className="flex items-center gap-1">
                      <span className="text-muted">Felt</span>
                      {FEELS.map(f => (
                        <button key={f.label} aria-pressed={r.feel === f.v} onClick={() => { act().edit(e.id, i, { feel: f.v }); haptic(); setAsked(null); }}
                          className={`h-10 rounded-full px-3.5 font-semibold ${r.feel === f.v ? 'bg-ink text-bg' : 'bg-sunk text-ink'}`}>{f.label}</button>
                      ))}
                    </span>
                  ) : r.feel ? (
                    <button className="h-10 rounded-full bg-sunk px-3.5 font-semibold text-muted" onClick={() => setAsked(i)} aria-label={`Set ${i + 1} felt ${r.feel}; change`}>
                      Felt {r.feel}
                    </button>
                  ) : null}
                </div>
              )}
            </div>
          );
        })}
      </div>
      <div className="mt-2 flex gap-2 px-1">
        <button className="rounded-lg px-2 py-1.5 text-[13px] font-semibold text-accent" onClick={() => act().addSet(e.id)}>+ Add set</button>
        {rows.length > 1 && <button className="rounded-lg px-2 py-1.5 text-[13px] font-semibold text-muted" onClick={() => act().removeSet(e.id)}>Remove last</button>}
      </div>
    </div>
  );
}

const fmtKg = (w: string) => `${+Number(w).toFixed(1)}`;
