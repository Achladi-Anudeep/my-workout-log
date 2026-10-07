import { useEffect, useState } from 'react';
import { Chip, Plate } from '../components/ui';
import AccountCard from '../components/AccountCard';
import RoutineEditor from '../components/routines/RoutineEditor';
import DayEditor from '../components/routines/DayEditor';
import { act, useWorkout } from '../store/workout';
import { BUILTIN, BUILTIN_ID, planOf } from '../lib/routines';
import { useActivePlan } from '../lib/useRoutine';
import { programWeek } from '../lib/utils';
import type { DayId } from '../types';

const RULES: [string, string[]][] = [
  ['How to lift', ['Lift in ~1s, lower in 2–3s. Never drop the weight.', 'Weeks 1–2: stop with 3 reps left. From week 3: 1–2 reps left.', 'Exhale on the effort, inhale on the lowering.', 'Keep the listed rest on compound lifts.']],
  ['Knee rules', ['Never push through sharp pain. Muscle fatigue is fine, joint pain is not.', 'Cut range of motion or weight before dropping an exercise.', 'See a physio if pain lasts more than a week.']],
  ['Cardio', ['Any 2–3 of Mon, Thu, Fri, Sat — always after lifting.', '15–20 min at a pace where you can talk but not sing.', 'Skip Tue, Wed and Sun.']],
  ['Recovery', ['Protein ~105–145 g a day.', 'Sleep 7–9 hours.', 'Easy week (~20% lighter) every 6–8 weeks.']],
];

type Nav = { screen: 'home' } | { screen: 'routine'; id: string } | { screen: 'day'; id: string; dayId: DayId };

export default function Plan() {
  const [nav, setNav] = useState<Nav>({ screen: 'home' });
  useEffect(() => { window.scrollTo({ top: 0 }); }, [nav]);

  if (nav.screen === 'day') {
    return <DayEditor routineId={nav.id} dayId={nav.dayId} onBack={() => setNav({ screen: 'routine', id: nav.id })} />;
  }
  if (nav.screen === 'routine') {
    return (
      <RoutineEditor id={nav.id} onBack={() => setNav({ screen: 'home' })}
        onOpenDay={dayId => setNav({ screen: 'day', id: nav.id, dayId })}
        onOpenRoutine={id => setNav({ screen: 'routine', id })} />
    );
  }
  return <PlanHome open={id => setNav({ screen: 'routine', id })} />;
}

function PlanHome({ open }: { open: (id: string) => void }) {
  const startDate = useWorkout(s => s.startDate);
  const routines = useWorkout(s => s.routines);
  const activeId = useWorkout(s => s.activeRoutineId);
  const { routine, plan } = useActivePlan();
  const [creating, setCreating] = useState(false);
  const pw = programWeek(startDate);
  const all = [BUILTIN, ...routines];

  return (
    <div className="grid gap-4">
      <h2 className="disp text-[36px] font-extrabold uppercase leading-none">The Plan</h2>
      <p className="text-muted">Running <span className="font-semibold text-ink">{routine.name}</span> · week <span className="num text-ink">{pw.week}</span>.</p>

      <section className="grid gap-2">
        <div className="flex items-end justify-between">
          <span className="label">Routines</span>
          <button id="new-routine" className="h-9 rounded-lg bg-accent px-3 text-[13px] font-bold text-accentInk" onClick={() => setCreating(!creating)}>+ New routine</button>
        </div>
        {creating && (
          <div className="grid gap-2 rounded-2xl border border-line bg-surface p-3">
            <p className="text-[14px] text-muted">Start from:</p>
            <button id="new-from-builtin" className="h-11 rounded-lg bg-sunk text-[14px] font-semibold"
              onClick={() => { setCreating(false); open(act().createRoutine('My Gym PPL', BUILTIN_ID)); }}>A copy of Gym PPL (keeps your history)</button>
            <button id="new-blank" className="h-11 rounded-lg bg-sunk text-[14px] font-semibold"
              onClick={() => { setCreating(false); open(act().createRoutine('New routine')); }}>A blank week</button>
          </div>
        )}
        <div className="overflow-hidden rounded-2xl border border-line bg-surface">
          {all.map((r, i) => {
            const days = planOf(r).filter(d => d.exercises.length).length;
            return (
              <button key={r.id} onClick={() => open(r.id)} className={`flex w-full items-center gap-3 px-4 py-3 text-left ${i ? 'border-t border-line' : ''}`}>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-semibold">{r.name}</span>
                  <span className="block text-[13px] text-muted">{days} training day{days === 1 ? '' : 's'}{r.builtin ? ' · built-in, locked' : ''}</span>
                </span>
                {r.id === activeId && <Chip tone="good">Active</Chip>}
                <span className="text-[13px] font-semibold text-accent">›</span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="grid gap-2">
        <span className="label">This week · {routine.name}</span>
        <div className="overflow-hidden rounded-2xl border border-line bg-surface">
          {plan.map((d, i) => (
            <button key={d.id} onClick={() => act().setTab('today')} className={`flex w-full items-center gap-3 px-4 py-3 text-left ${i ? 'border-t border-line' : ''}`}>
              <span className="disp w-10 text-[18px] font-bold uppercase">{d.short}</span>
              <Plate color={d.plate} size={12} />
              <span className="min-w-0 flex-1">
                <span className="block font-semibold">{d.title}</span>
                <span className="block truncate text-[13px] text-muted">{d.exercises.length ? `${d.exercises.length} exercises${d.mins ? ` · ~${d.mins} min` : ''}` : d.focus}</span>
              </span>
              <span className="text-[12px] text-muted">{d.cardio === 'none' ? (d.exercises.length ? 'no cardio' : '') : '+ cardio'}</span>
            </button>
          ))}
        </div>
      </section>

      <AccountCard />

      {RULES.map(([h, items]) => (
        <section key={h} className="rounded-2xl border border-line bg-surface px-4 py-3">
          <div className="label">{h}</div>
          <ul className="mt-2 grid list-disc gap-1 pl-5 text-[14px]">{items.map(t => <li key={t}>{t}</li>)}</ul>
        </section>
      ))}

      <section className="rounded-2xl border border-line bg-surface px-4 py-3">
        <label htmlFor="start-date" className="label">Program start date</label>
        <input id="start-date" type="date" value={startDate} onChange={e => e.target.value && act().setStartDate(e.target.value)}
          className="num mt-2 h-11 w-full rounded-lg border border-line bg-bg px-3" />
        <p className="mt-2 text-[13px] text-muted">Sets your week number and when calibration ends.</p>
      </section>
    </div>
  );
}
