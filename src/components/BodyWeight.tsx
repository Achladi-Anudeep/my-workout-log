import { useMemo, useState } from 'react';
import WeightChart from './WeightChart';
import WeightSheet from './WeightSheet';
import { act, useWorkout } from '../store/workout';
import { DAY, avgBetween, fmtDelta, fmtKg, fmtWhen, withRollingAvg } from '../lib/weight';

const RANGES = [['1M', 30], ['3M', 90], ['All', 0]] as const;

export default function BodyWeight() {
  const weights = useWorkout(s => s.weights);
  const [range, setRange] = useState<(typeof RANGES)[number][0]>('3M');
  const [logging, setLogging] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [del, setDel] = useState<string | null>(null);

  const all = useMemo(() => withRollingAvg(weights), [weights]);
  const days = RANGES.find(r => r[0] === range)![1];
  const shown = days ? all.filter(p => p.at >= Date.now() - days * DAY) : all;

  const latest = all[all.length - 1];
  const now = Date.now();
  const thisWeek = avgBetween(weights, now - 7 * DAY, now + DAY);
  const lastWeek = avgBetween(weights, now - 14 * DAY, now - 7 * DAY);
  const sinceStart = latest && all.length > 1 ? latest.kg - all[0].kg : null;
  const recent = [...all].reverse().slice(0, showAll ? undefined : 5);

  return (
    <section className="grid gap-3">
      <div className="flex items-end justify-between gap-3">
        <div className="label">Body weight</div>
        <button id="log-weight" className="h-10 rounded-lg bg-accent px-4 text-[14px] font-bold text-accentInk" onClick={() => setLogging(true)}>+ Log weight</button>
      </div>

      {!latest ? (
        <div className="rounded-2xl border border-dashed border-line px-5 py-6 text-center">
          <p className="disp text-[22px] font-bold uppercase">No weigh-ins yet</p>
          <p className="mx-auto mt-1 max-w-sm text-[14px] text-muted">Log your weight from HealthU+ after each weigh-in. You'll see your trend and 7-day average here.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <div className="rounded-xl border border-line bg-surface px-3 py-2.5">
              <div className="label">Latest</div>
              <div className="num mt-0.5 text-[20px] font-bold">{fmtKg(latest.kg)}<span className="text-[13px] font-medium text-muted"> kg</span></div>
              <div className="text-[11px] text-muted">{fmtWhen(latest.at)}</div>
            </div>
            <div className="rounded-xl border border-line bg-surface px-3 py-2.5">
              <div className="label">7-day avg</div>
              <div className="num mt-0.5 text-[20px] font-bold">{thisWeek != null ? fmtKg(thisWeek) : '—'}</div>
              <div className="text-[11px] text-muted">smooths daily swings</div>
            </div>
            <div className="rounded-xl border border-line bg-surface px-3 py-2.5">
              <div className="label">vs last week</div>
              <div className="num mt-0.5 text-[20px] font-bold">{thisWeek != null && lastWeek != null ? fmtDelta(thisWeek - lastWeek) : '—'}</div>
              <div className="text-[11px] text-muted">{lastWeek != null ? 'avg vs avg, kg' : 'needs 2 weeks of data'}</div>
            </div>
            <div className="rounded-xl border border-line bg-surface px-3 py-2.5">
              <div className="label">Since first</div>
              <div className="num mt-0.5 text-[20px] font-bold">{sinceStart != null ? fmtDelta(sinceStart) : '—'}</div>
              <div className="text-[11px] text-muted">from {fmtKg(all[0].kg)} kg</div>
            </div>
          </div>

          <div className="rounded-2xl border border-line bg-surface px-3 pb-2 pt-3">
            <div className="flex flex-wrap items-center justify-between gap-2 px-1 pb-2">
              <div className="flex items-center gap-3 text-[12px] text-muted">
                <span className="flex items-center gap-1.5"><span className="block h-2.5 w-2.5 rounded-full" style={{ background: 'var(--muted)' }} />Weigh-ins</span>
                <span className="flex items-center gap-1.5"><span className="block h-0.5 w-4 rounded" style={{ background: 'var(--accent)' }} />7-day average</span>
              </div>
              <div className="flex gap-1">
                {RANGES.map(([k]) => (
                  <button key={k} onClick={() => setRange(k)} aria-pressed={range === k}
                    className={`h-8 rounded-md px-2.5 text-[12px] font-semibold ${range === k ? 'bg-ink text-bg' : 'bg-sunk text-muted'}`}>{k}</button>
                ))}
              </div>
            </div>
            {shown.length ? <WeightChart pts={shown} /> : <p className="px-1 py-8 text-center text-[14px] text-muted">No weigh-ins in this range. Try "All".</p>}
          </div>

          <div className="overflow-hidden rounded-2xl border border-line bg-surface">
            {recent.map((e, i) => (
              <div key={e.id} className={`flex items-center gap-3 px-4 py-2.5 ${i ? 'border-t border-line' : ''}`}>
                <span className="min-w-0 flex-1 text-[14px] text-muted">{fmtWhen(e.at)}</span>
                <span className="num text-[15px] font-bold">{fmtKg(e.kg)} kg</span>
                {del === e.id
                  ? <button className="h-9 px-1 text-[13px] font-bold text-danger" onClick={() => { act().deleteWeight(e.id); setDel(null); }}>Delete?</button>
                  : <button aria-label="Delete entry" className="h-9 w-9 text-[18px] text-muted" onClick={() => setDel(e.id)}>×</button>}
              </div>
            ))}
            {all.length > 5 && (
              <button className="w-full border-t border-line py-2.5 text-[13px] font-semibold text-accent" onClick={() => setShowAll(!showAll)}>
                {showAll ? 'Show fewer' : `Show all ${all.length}`}
              </button>
            )}
          </div>
        </>
      )}
      {logging && <WeightSheet onClose={() => setLogging(false)} />}
    </section>
  );
}
