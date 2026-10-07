import { exDays } from '../lib/routines';
import { useActivePlan, useAllExercises } from '../lib/useRoutine';
import { Chip } from '../components/ui';
import BodyWeight from '../components/BodyWeight';
import { useWorkout } from '../store/workout';
import { fmtW, progressStatus, range } from '../lib/utils';

function Spark({ pts }: { pts: number[] }) {
  if (pts.length < 2) return <div className="h-8 w-24" />;
  const W = 96, H = 32, lo = Math.min(...pts), hi = Math.max(...pts), span = hi - lo || 1;
  const xy = pts.map((p, i) => [4 + (i * (W - 8)) / (pts.length - 1), H - 4 - ((p - lo) / span) * (H - 8)]);
  const d = xy.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');
  const last = xy[xy.length - 1];
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} aria-hidden>
      <path d={`${d} L${last[0]},${H} L${xy[0][0]},${H} Z`} fill="var(--accent-soft)" />
      <path d={d} fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinejoin="round" />
      <circle cx={last[0]} cy={last[1]} r="3" fill="var(--accent)" />
    </svg>
  );
}

const ORDER = { ready: 0, building: 1, new: 2 } as const;

export default function Progress() {
  const sessions = useWorkout(s => s.sessions);
  const { plan } = useActivePlan();
  const allEx = useAllExercises();
  // Exercises in the active routine, plus anything else you've actually logged.
  const loggedIds = new Set(sessions.flatMap(s => s.ex.map(e => e.id)));
  const inPlan = new Set(plan.flatMap(d => d.exercises.map(e => e.id)));
  const rows = allEx.filter(e => inPlan.has(e.id) || loggedIds.has(e.id)).map(e => {
    const st = progressStatus(sessions, e);
    const hist = sessions.slice().reverse()
      .map(s => s.ex.find(x => x.id === e.id))
      .filter((x): x is NonNullable<typeof x> => !!x && x.sets.length > 0)
      .map(x => (e.start != null ? Math.max(...x.sets.map(s => s.w ?? 0)) : Math.max(...x.sets.map(s => s.r))));
    return { e, st, hist };
  }).sort((a, b) => ORDER[a.st.kind] - ORDER[b.st.kind]);
  const ready = rows.filter(r => r.st.kind === 'ready').length;

  return (
    <div className="grid gap-4">
      <h2 className="disp text-[36px] font-extrabold uppercase leading-none">Progress</h2>
      <BodyWeight />
      <div className="label mt-2">Lifts</div>
      <p className="-mt-2 text-[14px] text-muted">Add weight only when all 3 sets hit the top of the rep range with good form. Then add 2.5–5% and drop back to the bottom of the range.</p>
      {ready > 0 && <div><Chip tone="good">▲ {ready} exercise{ready > 1 ? 's' : ''} ready to progress</Chip></div>}
      <div className="overflow-hidden rounded-2xl border border-line bg-surface">
        {rows.map(({ e, st, hist }, i) => (
          <div key={e.id} className={`flex items-center gap-3 px-4 py-3 ${i ? 'border-t border-line' : ''}`}>
            <div className="min-w-0 flex-1">
              <div className="truncate text-[15px] font-semibold">{e.name}</div>
              <div className="text-[12px] text-muted">{exDays(plan, e.id).join(' · ') || 'Not in active routine'} · target {e.sets}×{range(e)}</div>
              <div className="mt-1">
                {st.kind === 'ready' && <Chip tone="good">Go {st.next != null ? `${fmtW(st.next)} kg` : 'harder'}</Chip>}
                {st.kind === 'building' && <Chip tone="accent">Building reps</Chip>}
                {st.kind === 'new' && <Chip tone="muted">Not logged · start {e.wNote.toLowerCase()}</Chip>}
              </div>
            </div>
            <Spark pts={hist} />
            <div className="w-16 text-right">
              <div className="num text-[17px] font-bold">{st.last ? (e.start != null ? fmtW(st.last.e.sets[0].w) : `${st.last.e.sets[0].r}${e.unit === 'sec' ? 's' : ''}`) : '—'}</div>
              <div className="text-[11px] text-muted">{e.start != null ? 'kg last' : e.unit === 'sec' ? 'hold last' : 'reps last'}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
