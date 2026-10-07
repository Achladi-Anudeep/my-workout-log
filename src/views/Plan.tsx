import { PLAN } from '../data/plan';
import { Plate } from '../components/ui';
import AccountCard from '../components/AccountCard';
import { act, useWorkout } from '../store/workout';
import { programWeek } from '../lib/utils';

const RULES: [string, string[]][] = [
  ['How to lift', ['Lift in ~1s, lower in 2–3s. Never drop the weight.', 'Weeks 1–2: stop with 3 reps left. From week 3: 1–2 reps left.', 'Exhale on the effort, inhale on the lowering.', 'Keep the listed rest on compound lifts.']],
  ['Knee rules', ['Never push through sharp pain. Muscle fatigue is fine, joint pain is not.', 'Cut range of motion or weight before dropping an exercise.', 'See a physio if pain lasts more than a week.']],
  ['Cardio', ['Any 2–3 of Mon, Thu, Fri, Sat — always after lifting.', '15–20 min at a pace where you can talk but not sing.', 'Skip Tue, Wed and Sun.']],
  ['Recovery', ['Protein ~105–145 g a day.', 'Sleep 7–9 hours.', 'Easy week (~20% lighter) every 6–8 weeks.']],
];

export default function Plan() {
  const startDate = useWorkout(s => s.startDate);
  const pw = programWeek(startDate);
  return (
    <div className="grid gap-4">
      <h2 className="disp text-[36px] font-extrabold uppercase leading-none">The Plan</h2>
      <p className="text-muted">Push / Pull / Legs / Arms · beginner · knee-adjusted. Week <span className="num text-ink">{pw.week}</span>.</p>

      <AccountCard />

      <div className="overflow-hidden rounded-2xl border border-line bg-surface">
        {PLAN.map((d, i) => (
          <button key={d.id} onClick={() => act().setTab('today')} className={`flex w-full items-center gap-3 px-4 py-3 text-left ${i ? 'border-t border-line' : ''}`}>
            <span className="disp w-10 text-[18px] font-bold uppercase">{d.short}</span>
            <Plate color={d.plate} size={12} />
            <span className="min-w-0 flex-1">
              <span className="block font-semibold">{d.title}</span>
              <span className="block truncate text-[13px] text-muted">{d.exercises.length ? `${d.exercises.length} exercises · ~${d.mins} min` : d.focus}</span>
            </span>
            <span className="text-[12px] text-muted">{d.cardio === 'none' ? (d.id === 'sun' ? '' : 'no cardio') : '+ cardio'}</span>
          </button>
        ))}
      </div>

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
