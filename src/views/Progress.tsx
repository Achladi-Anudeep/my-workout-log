import { exDays } from '../lib/routines';
import { useActivePlan, useAllExercises } from '../lib/useRoutine';
import { Chip } from '../components/ui';
import BodyWeight from '../components/BodyWeight';
import { useWorkout } from '../store/workout';
import { fmtW, isoDay, lastFor, programWeek, range } from '../lib/utils';
import type { Session } from '../types';
import { advise, type AdviceKind } from '../lib/coach';
import Advice from '../components/Advice';
import WeekReview from '../components/ai/WeekReview';
import ProgressPhotos from '../components/ProgressPhotos';

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


const monday = (d: Date) => { const m = new Date(d); m.setHours(0, 0, 0, 0); m.setDate(m.getDate() - ((m.getDay() + 6) % 7)); return m; };

/** Weeks in a row with at least 4 workouts. This week counts once it reaches 4. */
export function weekStreak(sessions: Session[], now = new Date()) {
  const perWeek = new Map<string, number>();
  for (const s of sessions) { const k = isoDay(monday(new Date(s.date + 'T00:00:00'))); perWeek.set(k, (perWeek.get(k) ?? 0) + 1); }
  let wk = monday(now), streak = 0;
  if ((perWeek.get(isoDay(wk)) ?? 0) >= 4) streak++;
  for (;;) { wk = new Date(wk); wk.setDate(wk.getDate() - 7); if ((perWeek.get(isoDay(wk)) ?? 0) >= 4) streak++; else break; }
  return streak;
}

/** This month as a grid of days: gym, home, or nothing logged. */
function MonthGrid({ sessions }: { sessions: Session[] }) {
  const now = new Date();
  const first = new Date(now.getFullYear(), now.getMonth(), 1);
  const days = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const lead = (first.getDay() + 6) % 7;
  const byDate = new Map<string, Session['venue'] | 'gym'>();
  for (const s of sessions) if (byDate.get(s.date) !== 'gym') byDate.set(s.date, s.venue === 'home' ? 'home' : 'gym');
  const today = isoDay();
  const cells = [...Array(lead).fill(null), ...Array.from({ length: days }, (_, i) => isoDay(new Date(now.getFullYear(), now.getMonth(), i + 1)))];
  const bg = (v?: string) => (v === 'gym' ? 'var(--p-blue)' : v === 'home' ? 'color-mix(in srgb, var(--p-blue) 40%, var(--surface))' : 'var(--sunk)');
  return (
    <div>
      <div className="grid grid-cols-7 gap-1.5 text-center" aria-hidden>
        {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => <span key={i} className="disp text-[11px] font-bold text-muted">{d}</span>)}
      </div>
      <div className="stagger mt-1 grid grid-cols-7 gap-1.5" role="img" aria-label={`Training days this month: ${byDate.size ? [...byDate.entries()].filter(([d]) => d.slice(0, 7) === today.slice(0, 7)).length : 0}`}>
        {cells.map((d, i) => d == null ? <span key={i} /> : (
          <span key={d} className={`grid aspect-square place-items-center rounded-lg text-[11px] font-semibold ${d === today ? 'ring-2 ring-ink' : ''}`}
            style={{ background: bg(byDate.get(d)), color: byDate.get(d) === 'gym' ? '#fff' : d > today ? 'var(--line)' : 'var(--muted)' }}>
            {Number(d.slice(8))}
          </span>
        ))}
      </div>
      <div className="mt-2 flex gap-4 text-[12px] text-muted">
        <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm" style={{ background: bg('gym') }} />Gym</span>
        <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm" style={{ background: bg('home') }} />Home</span>
        <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm" style={{ background: bg() }} />Rest / not logged</span>
      </div>
    </div>
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
  const thisMonth = isoDay().slice(0, 7);
  const monthCount = sessions.filter(x => x.date.startsWith(thisMonth)).length;
  const monthName = new Date().toLocaleDateString(undefined, { month: 'long' });
  const streak = weekStreak(sessions);
  const ready = rows.filter(r => r.adv.kind === 'up' || r.adv.kind === 'harder').length;
  const lighter = rows.filter(r => r.adv.kind === 'down').length;

  return (
    <div className="grid gap-4">
      <h2 className="poster text-[40px] leading-none">Progress</h2>
      <div className="stagger grid grid-cols-2 gap-2.5">
        <div className="rounded-2xl bg-ink p-4 text-bg">
          <div className="poster text-[56px] leading-[0.9]">{monthCount}</div>
          <div className="disp mt-1.5 text-[13px] font-bold uppercase tracking-wider opacity-85">Workouts in {monthName}</div>
        </div>
        <div className="rounded-2xl bg-hot p-4 text-hotInk">
          <div className="poster text-[56px] leading-[0.9]">{streak}<span className="text-[24px]"> wk</span></div>
          <div className="disp mt-1.5 text-[13px] font-bold uppercase tracking-wider opacity-90">Streak · 4+ a week</div>
        </div>
      </div>
      <section className="card p-4">
        <div className="label mb-2">This month</div>
        <MonthGrid sessions={sessions} />
      </section>
      <BodyWeight />
      <ProgressPhotos />
      <WeekReview />
      <div className="label mt-2">Lifts</div>
      <p className="-mt-2 text-[14px] text-muted">The coach checks your last workouts: add weight when every set hits the top of the range, stay and add reps while building, go lighter after two tough workouts in a row. Tap a suggestion to see why.</p>
      {(ready > 0 || lighter > 0) && <div className="flex flex-wrap gap-2">{ready > 0 && <Chip tone="good">▲ {ready} ready to go up</Chip>}{lighter > 0 && <Chip tone="warn">▼ {lighter} to go lighter</Chip>}</div>}
      <div className="card overflow-hidden">
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
