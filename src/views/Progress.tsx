import { exDays } from '../lib/routines';
import { useActivePlan, useAllExercises } from '../lib/useRoutine';
import { Chip } from '../components/ui';
import BodyWeight from '../components/BodyWeight';
import { useWorkout } from '../store/workout';
import { fmtW, lastFor, programWeek, range } from '../lib/utils';
import { advise, type AdviceKind } from '../lib/coach';
import Advice from '../components/Advice';
import WeekReview from '../components/ai/WeekReview';

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

const ORDER: Record<AdviceKind, number> = { up: 0, harder: 0, down: 1, comeback: 1, 'easy-week': 2, hold: 3, new: 4 };

export default function Progress() {
  const sessions = useWorkout(s => s.sessions);
  const startDate = useWorkout(s => s.startDate);
  const deload = programWeek(startDate).deload;
  const { plan } = useActivePlan();
  const allEx = useAllExercises();
  // Exercises in the active routine, plus anything else you've actually logged.
  const loggedIds = new Set(sessions.flatMap(s => s.ex.map(e => e.id)));
  const inPlan = new Set(plan.flatMap(d => d.exercises.map(e => e.id)));
  const rows = allEx.filter(e => inPlan.has(e.id) || loggedIds.has(e.id)).map(e => {
    const adv = advise(sessions, e, { deload });
    const last = lastFor(sessions, e.id);
    const hist = sessions.slice().reverse()
      .map(s => s.ex.find(x => x.id === e.id))
      .filter((x): x is NonNullable<typeof x> => !!x && x.sets.length > 0)
      .map(x => (e.start != null ? Math.max(...x.sets.map(s => s.w ?? 0)) : Math.max(...x.sets.map(s => s.r))));
    return { e, adv, last, hist };
  }).sort((a, b) => ORDER[a.adv.kind] - ORDER[b.adv.kind]);
  const ready = rows.filter(r => r.adv.kind === 'up' || r.adv.kind === 'harder').length;
  const lighter = rows.filter(r => r.adv.kind === 'down').length;

  return (
    <div className="grid gap-4">
      <h2 className="disp text-[36px] font-extrabold uppercase leading-none">Progress</h2>
      <BodyWeight />
      <WeekReview />
      <div className="label mt-2">Lifts</div>
      <p className="-mt-2 text-[14px] text-muted">The coach checks your last workouts: add weight when every set hits the top of the range, stay and add reps while building, go lighter after two tough workouts in a row. Tap a suggestion to see why.</p>
      {(ready > 0 || lighter > 0) && <div className="flex flex-wrap gap-2">{ready > 0 && <Chip tone="good">▲ {ready} ready to go up</Chip>}{lighter > 0 && <Chip tone="warn">▼ {lighter} to go lighter</Chip>}</div>}
      <div className="overflow-hidden rounded-2xl border border-line bg-surface">
        {rows.map(({ e, adv, last, hist }, i) => (
          <div key={e.id} className={`flex items-center gap-3 px-4 py-3 ${i ? 'border-t border-line' : ''}`}>
            <div className="min-w-0 flex-1">
              <div className="truncate text-[15px] font-semibold">{e.name}</div>
              <div className="text-[12px] text-muted">{exDays(plan, e.id).join(' · ') || 'Not in active routine'} · target {e.sets}×{range(e)}</div>
              <div className="mt-1"><Advice kind={adv.kind} title={adv.title} detail={adv.detail} /></div>
            </div>
            <Spark pts={hist} />
            <div className="w-16 text-right">
              <div className="num text-[17px] font-bold">{last ? (e.start != null ? fmtW(last.e.sets[0].w) : `${last.e.sets[0].r}${e.unit === 'sec' ? 's' : ''}`) : '—'}</div>
              <div className="text-[11px] text-muted">{e.start != null ? 'kg last' : e.unit === 'sec' ? 'hold last' : 'reps last'}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
