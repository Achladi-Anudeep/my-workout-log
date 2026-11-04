import { useEffect, useState, type ReactNode } from 'react';
import { CheckIcon, Chip } from '../components/ui';
import { act, activeDay, useWorkout } from '../store/workout';
import { useActivePlan } from '../lib/useRoutine';
import { routineName } from '../lib/routines';
import { isoDay, lastFor, mmss, pad, programWeek, range, fmtW, weekdayId } from '../lib/utils';

/** Monday of this week, as YYYY-MM-DD. */
const mondayIso = () => { const d = new Date(); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return isoDay(d); };
import { advise } from '../lib/coach';
import Advice from '../components/Advice';
import type { Active, Day, DayId, Exercise, Session, Venue } from '../types';
import WeightSheet from '../components/WeightSheet';
import ExerciseHowTo from '../components/ExerciseHowTo';
import DemoGif from '../components/exercise/DemoGif';
import DemoSheet from '../components/exercise/DemoSheet';
import SwapSheet from '../components/exercise/SwapSheet';
import MachineNote from '../components/exercise/MachineNote';
import SetRows from '../components/exercise/SetRows';
import { PhotoThumb } from '../components/exercise/MachinePhoto';
import Guided from './Guided';
import { warmupDemo } from '../data/versions';
import { gifUrl } from '../data/demos';
import MachineFinder from '../components/ai/MachineFinder';
import { swapOptions } from '../data/alternatives';
import { useWakeLock } from '../lib/wakeLock';
import { detailsOf } from '../data/details';
import { fmtKg, fmtWhen } from '../lib/weight';

export type OnRest = (secs: number, label: string) => void;

/** This week as seven plate circles: tap one to see that day. Done days are filled with a tick. */
function WeekDots({ sel, onSel, today, plan, doneIds }: { sel: DayId; onSel: (d: DayId) => void; today: DayId; plan: Day[]; doneIds: Set<DayId> }) {
  return (
    <div className="grid grid-cols-7 gap-1" role="group" aria-label="Days this week">
      {plan.map(d => {
        const on = sel === d.id, done = doneIds.has(d.id), rest = !d.exercises.length;
        return (
          <button key={d.id} id={`day-${d.id}`} onClick={() => onSel(d.id)} aria-pressed={on}
            aria-label={`${d.short}: ${d.title}${done ? ', done' : ''}${d.id === today ? ', today' : ''}`}
            className="flex flex-col items-center gap-1 py-1">
            <span className={`disp text-[12px] font-bold uppercase tracking-wider ${d.id === today ? 'text-ink' : 'text-muted'}`}>{d.id === today ? 'Today' : d.short}</span>
            <span className="grid h-9 w-9 place-items-center rounded-full text-[13px] font-bold transition-all duration-200"
              style={on
                ? { background: d.plate, color: '#fff', boxShadow: `0 0 0 3px var(--bg), 0 0 0 5px ${d.plate}` }
                : done ? { background: 'var(--ink)', color: 'var(--bg)' }
                : { border: `1.5px ${rest ? 'dashed' : 'solid'} var(--line)`, color: 'var(--muted)' }}>
              {done ? <svg width="15" height="15" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M4.5 10.5l3.5 3.5 7.5-8" /></svg>
                : rest ? '–' : <span className="block h-2 w-2 rounded-full" style={{ background: on ? '#fff' : d.plate }} />}
            </span>
          </button>
        );
      })}
    </div>
  );
}

/** The big plate behind the day's title. Purely decoration. */
function PosterPlate({ color }: { color: string }) {
  return (
    <svg width="168" height="168" viewBox="0 0 190 190" aria-hidden className="pointer-events-none absolute -right-12 -top-3 transition-colors duration-300">
      <circle cx="95" cy="95" r="92" fill={color} />
      <circle cx="95" cy="95" r="70" fill="none" stroke="#fff" strokeOpacity=".28" strokeWidth="2" />
      <circle cx="95" cy="95" r="17" fill="var(--bg)" />
    </svg>
  );
}

function RoutineItem({ item }: { item: string }) {
  const demo = warmupDemo(item);
  const [open, setOpen] = useState(false);
  if (!demo) return <li className="py-0.5 pl-[52px]">{item}</li>;
  return (
    <li className="grid gap-2">
      <button className="flex items-center gap-3 text-left" aria-expanded={open} onClick={() => setOpen(!open)} aria-label={`Show demo of ${item}`}>
        <img src={gifUrl(demo.id)} alt="" loading="lazy" className="h-10 w-10 shrink-0 rounded-md border border-line bg-white object-contain" />
        <span className="min-w-0 flex-1">{item}</span>
        <span className="text-[12px] font-semibold text-accent">{open ? 'Hide' : 'Demo'}</span>
      </button>
      {open && (
        <div className="grid gap-1.5 pl-[52px]">
          <img src={gifUrl(demo.id)} alt={`Demo of ${item}`} className="aspect-square w-full max-w-[260px] rounded-lg border border-line bg-white object-contain" />
          {demo.note && <p className="text-[13px] text-muted">{demo.note}</p>}
        </div>
      )}
    </li>
  );
}

function RoutineList({ title, items }: { title: string; items: string[] }) {
  const [open, setOpen] = useState(false);
  if (!items.length) return null;
  return (
    <div className="card">
      <button className="flex w-full items-center justify-between px-4 py-3 text-left" onClick={() => setOpen(!open)} aria-expanded={open}>
        <span className="label">{title}</span>
        <span className="flex items-center gap-1 text-[13px] text-muted">{items.length} moves <Chevron open={open} /></span>
      </button>
      <Reveal open={open}><ul className="grid gap-2 border-t border-line px-4 py-3 text-[14px]">{items.map(i => <RoutineItem key={i} item={i} />)}</ul></Reveal>
    </div>
  );
}

/** Collapsible area that animates open. Hidden content stays out of the tab order. */
function Reveal({ open, children, id }: { open: boolean; children: ReactNode; id?: string }) {
  return (
    <div id={id} className="reveal" data-open={open} {...(open ? {} : { inert: 'true' as unknown as boolean })}>
      <div>{children}</div>
    </div>
  );
}

const Chevron = ({ open }: { open: boolean }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden
    className={`transition-transform duration-200 ${open ? 'rotate-180' : ''}`}><path d="M6 9l6 6 6-6" /></svg>
);

/**
 * One exercise. Before you tap: the demo, sets × reps + weight, and last time's sets.
 * Everything else (equipment, what it works, your setup, the coach's call, how-to, swap) is one tap away.
 * During a workout the exercise you're on gets the bold "now" card.
 */
function ExerciseCard({ e, idx, total, active, sessions, onRest, now }: {
  e: Exercise; idx: number; total: number; active: Active | null; sessions: Session[]; onRest: OnRest; now: boolean;
}) {
  const [more, setMore] = useState(false);
  const [howTo, setHowTo] = useState(false);
  const [sheet, setSheet] = useState<'demo' | 'swap' | null>(null);
  const det = detailsOf(e);
  const inWorkout = active ? activeDay(active).exercises.map(x => x.id) : [];
  const atHome = !!active && !!activeDay(active).home;
  const canSwap = !!active && swapOptions(e, inWorkout, atHome).length > 0;
  const startDate = useWorkout(s => s.startDate);
  const adv = advise(sessions, e, { deload: programWeek(startDate).deload });
  const last = lastFor(sessions, e.id);
  const rows = active?.logs[e.id];
  const doneCount = rows?.filter(r => r.done).length ?? 0;
  const finished = !!rows && rows.length > 0 && doneCount >= rows.length;
  const showSets = !!rows && (!finished || more);
  const detailsId = `more-${e.id}`;
  return (
    <article className={`${now ? 'card-now' : 'card'} anim-rise transition-shadow duration-200 ${finished && !more ? 'opacity-80' : ''}`}>
      <header className="flex items-center gap-3 p-3">
        <button className="relative shrink-0" onClick={() => setSheet('demo')} aria-label={`Show how to do ${e.name}`}>
          <span className="flex gap-1.5"><DemoGif e={e} size={now ? 76 : 64} className="transition-all duration-200" /><PhotoThumb exId={e.id} size={now ? 76 : 64} /></span>
          {finished
            ? <span className="absolute -left-1.5 -top-1.5 grid h-6 w-6 place-items-center rounded-full bg-good text-surface anim-pop"><CheckIcon /></span>
            : <span className="num absolute -left-1.5 -top-1.5 grid h-5 min-w-5 place-items-center rounded-full bg-ink px-1 text-[11px] font-bold text-bg">{idx + 1}</span>}
        </button>
        <div className="min-w-0 flex-1">
          {now && <div className="disp text-[12px] font-bold uppercase tracking-[0.14em] text-hot">Now · {idx + 1} of {total}</div>}
          <h3 className={`leading-tight ${now ? 'poster text-[24px]' : 'text-[16px] font-semibold'}`}>
            {e.superset && <span className="num mr-1.5 rounded-md bg-accentSoft px-1.5 py-0.5 align-middle text-[12px] font-bold text-accent">{e.superset}</span>}{e.name}
          </h3>
          <p className="num mt-0.5 text-[14px] font-semibold">{e.sets}×{range(e)} <span className="font-normal text-muted">·</span> {e.wNote}</p>
          {last && <p className="num mt-0.5 truncate text-[12px] text-muted">Last: {last.e.sets.map(x => `${fmtW(x.w)}×${x.r}`).join('  ')}</p>}
        </div>
        {rows && <span className={`num shrink-0 rounded-md px-2 py-1 text-[12px] font-bold transition-colors ${finished ? 'bg-goodSoft text-good' : 'bg-sunk text-muted'}`}>{doneCount}/{rows.length}</span>}
        <button className="grid h-11 w-9 shrink-0 place-items-center rounded-lg text-muted" aria-expanded={more} aria-controls={detailsId}
          aria-label={`${more ? 'Less' : 'More'} about ${e.name}`} onClick={() => setMore(!more)}>
          <Chevron open={more} />
        </button>
      </header>

      {(now || more) && (
        <div className="anim-fade flex flex-wrap gap-2 px-3 pb-1">
          <button className="h-10 rounded-full border border-line px-3.5 text-[13px] font-semibold" aria-expanded={more} onClick={() => setMore(!more)}>
            <span className="mr-1.5 inline-block h-2 w-2 rounded-full bg-hot align-middle" />Coach tip
          </button>
          <button className="h-10 rounded-full bg-sunk px-3.5 text-[13px] font-semibold" aria-expanded={howTo} onClick={() => setHowTo(!howTo)}>{howTo ? 'Hide steps' : 'How to do it'}</button>
          {canSwap && <button className="h-10 rounded-full bg-sunk px-3.5 text-[13px] font-semibold" onClick={() => setSheet('swap')} aria-label={`Swap ${e.name}`}>⇄ Swap</button>}
        </div>
      )}

      <Reveal open={more} id={detailsId}>
        <div className="grid gap-2 px-3 pb-2 pt-1 text-[14px]">
          <Advice kind={adv.kind} title={adv.title} detail={adv.detail} />
          {det?.equipment && <p className="rounded-lg bg-sunk px-3 py-2"><span className="font-semibold">Equipment: </span>{det.equipment}</p>}
          <p className="text-[13px] text-muted">
            {det?.targets && <>Works: {det.targets} · </>}
            {e.rest > 0 ? <>rest <span className="num">{e.rest}s</span></> : 'no rest, go to next'}
          </p>
          {e.swappedFor && <p className="text-[13px] font-semibold text-warn">Swapped in for {e.swappedFor.name}</p>}
          <MachineNote exId={e.id} compact />
        </div>
      </Reveal>
      <Reveal open={howTo}>
        <div className="mx-3 mb-2 rounded-xl bg-bg px-3 py-3"><ExerciseHowTo e={e} hideEquipment /></div>
      </Reveal>

      {sheet === 'demo' && <DemoSheet e={e} onClose={() => setSheet(null)} />}
      {sheet === 'swap' && <SwapSheet e={e} inWorkout={inWorkout} atHome={atHome} onClose={() => setSheet(null)} />}
      {showSets ? <SetRows e={e} rows={rows!} onRest={onRest} /> : <div className="h-1" />}
    </article>
  );
}

function FinishPanel({ day, onClose }: { day: Day; onClose: () => void }) {
  const [cardio, setCardio] = useState('');
  const [note, setNote] = useState('');
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const active = useWorkout(s => s.active)!;
  const done = Object.values(active.logs).flat().filter(r => r.done).length;
  return (
    <div className="anim-fade fixed inset-0 z-40 flex items-end bg-black/50" onClick={onClose}>
      <div className="anim-sheet w-full rounded-t-3xl border-t border-line bg-surface px-4 pt-5" style={{ paddingBottom: 'calc(20px + env(safe-area-inset-bottom, 0px))' }} onClick={e => e.stopPropagation()}>
        <div className="mx-auto max-w-xl">
          <h2 className="poster text-[30px] leading-none">Finish {day.title}</h2>
          <p className="text-muted"><span className="num text-ink">{done}</span> sets ticked · <span className="num text-ink">{Math.round((Date.now() - active.startedAt) / 60000)}</span> min so far. Only ticked sets are saved.</p>
          {day.cardio !== 'none' && (
            <label className="mt-4 block" htmlFor="cardio-min">
              <span className="label">Cardio after lifting (minutes, optional)</span>
              <input id="cardio-min" inputMode="numeric" type="number" placeholder="15–20" value={cardio} onChange={e => setCardio(e.target.value)}
                className="num mt-1 h-11 w-full rounded-lg border border-line bg-bg px-3" />
            </label>
          )}
          <label className="mt-3 block" htmlFor="session-note">
            <span className="label">Note (optional)</span>
            <input id="session-note" placeholder="Knee felt fine, squat depth to bench" value={note} onChange={e => setNote(e.target.value)}
              className="mt-1 h-11 w-full rounded-lg border border-line bg-bg px-3" />
          </label>
          {done === 0 && <p className="mt-4 rounded-lg bg-warnSoft px-3 py-2 text-[14px] text-warn">Tick at least one set to save this workout, or discard it.</p>}
          <button disabled={done === 0} className="poster mt-5 h-12 w-full rounded-xl bg-ink text-[19px] text-bg disabled:opacity-40" onClick={() => { act().finish(Number(cardio) || 0, note.trim()); onClose(); }}>Save workout</button>
          <div className="mt-2 flex justify-between">
            <button className="h-11 px-2 text-[14px] font-semibold text-muted" onClick={onClose}>Keep training</button>
            {confirmDiscard
              ? <button className="h-11 px-2 text-[14px] font-bold text-danger" onClick={() => { act().discard(); onClose(); }}>Tap again to discard</button>
              : <button className="h-11 px-2 text-[14px] font-semibold text-danger" onClick={() => setConfirmDiscard(true)}>Discard workout</button>}
          </div>
        </div>
      </div>
    </div>
  );
}

function WeightQuickRow() {
  const latest = useWorkout(s => s.weights[s.weights.length - 1]);
  const [open, setOpen] = useState(false);
  const loggedToday = latest && isoDay(new Date(latest.at)) === isoDay();
  return (
    <div className="card flex min-w-0 flex-col justify-between gap-1 p-3">
      <div className="label">Body weight</div>
      <div className="text-[14px]">
        {latest
          ? <><span className="num text-[17px] font-bold">{fmtKg(latest.kg)}</span> <span className="text-muted">kg · {loggedToday ? 'today' : fmtWhen(latest.at)}</span></>
          : <span className="text-muted">Not logged yet</span>}
      </div>
      <button className="h-10 self-start rounded-lg bg-sunk px-3 text-[13px] font-semibold" onClick={() => setOpen(true)}>{loggedToday ? '+ Log again' : '+ Log weight'}</button>
      {open && <WeightSheet onClose={() => setOpen(false)} />}
    </div>
  );
}

export default function Today({ onRest }: { onRest: OnRest }) {
  const active = useWorkout(s => s.active);
  const sessions = useWorkout(s => s.sessions);
  const startDate = useWorkout(s => s.startDate);
  const today = weekdayId();
  const [sel, setSel] = useState<DayId>(active?.dayId ?? today);
  const [finishing, setFinishing] = useState(false);
  const [finder, setFinder] = useState(false);
  const [now, setNow] = useState(Date.now());
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(t); }, []);
  const { routine, plan, byId, homeById } = useActivePlan();
  const venuePick = useWorkout(s => s.venuePick);
  const isActiveHere = active?.dayId === sel;
  const homeAvail = !!homeById[sel];
  const venue: Venue = isActiveHere ? (active?.venue ?? 'gym') : homeAvail ? (venuePick[sel] ?? 'gym') : 'gym';
  // While a workout runs, show the snapshot it started with, even if the routine was edited since.
  const day = isActiveHere && active ? activeDay(active) : venue === 'home' ? homeById[sel]! : byId[sel];
  const pw = programWeek(startDate);
  useWakeLock(isActiveHere);
  const doneToday = sessions.find(s => s.date === isoDay() && s.dayId === sel);
  const doneThisWeek = new Set(sessions.filter(s => s.date >= mondayIso()).map(s => s.dayId));

  if (isActiveHere && active && active.guided != null && day.exercises.length) {
    return (
      <>
        <Guided active={active} sessions={sessions} startDate={startDate} onRest={onRest} onFinish={() => setFinishing(true)} />
        {finishing && <FinishPanel day={day} onClose={() => setFinishing(false)} />}
      </>
    );
  }

  const curIdx = isActiveHere && active ? day.exercises.findIndex(x => !(active.logs[x.id] ?? []).every(r => r.done)) : -1;

  return (
    <div className="grid gap-4">
      <section className="relative -mx-4 overflow-hidden px-4 pb-1">
        <PosterPlate color={day.plate} />
        <div className="relative flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="disp text-[13px] font-bold uppercase tracking-[0.12em] text-muted">{day.short}{sel === today ? ' · today' : ''}{day.home ? ' · home' : ''}</span>
          <span className={`disp rounded-full border px-2 py-0.5 text-[12px] font-bold uppercase tracking-wider ${pw.tone === 'warn' ? 'border-warn text-warn' : 'border-ink'}`}>Week {pw.week} · {pw.name}</span>
        </div>
        <h2 className="poster relative mt-2 max-w-[78%] text-[52px] leading-[0.92] sm:text-[60px]">{day.title}</h2>
        <p className="disp relative mt-2 text-[15px] font-semibold uppercase tracking-wide">
          {day.exercises.length > 0 && <>{day.exercises.length} moves · ~<span className="num">{day.mins}</span> min · </>}{day.focus}
        </p>
        {pw.deload && <p className="relative mt-1 text-[13px] text-warn">Easy week due: drop weights ~20% this week.</p>}
        {!pw.deload && <p className="relative mt-1 text-[13px] text-muted">{pw.rir}. Form over weight. · {routineName(routine)}</p>}
      </section>

      <WeekDots sel={sel} onSel={setSel} today={today} plan={plan} doneIds={doneThisWeek} />

      {homeAvail && !isActiveHere && (
        <div>
          <div role="radiogroup" aria-label="Where are you training today?" className="grid h-11 grid-cols-2 overflow-hidden rounded-xl border-[1.5px] border-ink">
            {(['gym', 'home'] as const).map(v => (
              <button key={v} id={`venue-${v}`} role="radio" aria-checked={venue === v} onClick={() => act().setVenuePick(sel, v)}
                className={`disp text-[16px] font-bold uppercase tracking-[0.1em] transition-colors duration-200 ${venue === v ? 'bg-ink text-bg' : 'text-ink'}`}>
                {v}
              </button>
            ))}
          </div>
          {venue === 'home' && <p className="anim-fade mt-1.5 text-[13px] text-muted">Home version of {byId[sel].title}: same muscles, with your dumbbell kit, bands and push-up stands.</p>}
        </div>
      )}
      {day.cardio !== 'none' && day.exercises.length > 0 && <p className="-mt-2 text-[13px] text-muted">Optional cardio after: 15–20 min, easy pace{day.cardio === 'home' ? ' (brisk walk or jog in place)' : ''}.</p>}

      {!day.exercises.length ? (
        <div className="card anim-rise px-4 py-6 text-center">
          <p className="poster text-[28px]">Rest day</p>
          <p className="mt-1 text-muted">Muscle is built while you recover. Light walking in daily life is fine.</p>
        </div>
      ) : (
        <>
          {doneToday && !isActiveHere && <div><Chip tone="good">✓ Logged today · {doneToday.mins} min</Chip></div>}
          {isActiveHere && (
            <button id="guided-open" className="flex h-12 items-center justify-center gap-2 rounded-xl border-[1.5px] border-ink text-[15px] font-bold"
              onClick={() => act().setGuided(Math.max(0, day.exercises.findIndex(x => !(active!.logs[x.id] ?? []).every(r => r.done))))}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden><rect x="4" y="4" width="16" height="16" rx="2" /><path d="M10 9l5 3-5 3z" /></svg>
              Guided mode · one exercise at a time
            </button>
          )}
          <RoutineList title="Warm-up · 5–7 min" items={day.warmup} />
          <div className="grid gap-2.5">
            {day.exercises.map((e, i) => <ExerciseCard key={e.id} e={e} idx={i} total={day.exercises.length} now={i === curIdx} active={isActiveHere ? active : null} sessions={sessions} onRest={onRest} />)}
          </div>
          <RoutineList title="Cool-down · hold 30s each" items={day.cooldown} />
          <div className="fixed inset-x-0 z-20 px-4" style={{ bottom: 'calc(72px + env(safe-area-inset-bottom, 0px))' }}>
            <div className="mx-auto max-w-xl">
              {isActiveHere ? (
                <button className="anim-rise flex h-14 w-full items-center justify-between rounded-2xl bg-ink pl-4 pr-2 text-bg shadow-lg" onClick={() => setFinishing(true)}>
                  <span className="text-[15px] font-semibold">In progress · <span className="num">{mmss(Math.floor((now - active!.startedAt) / 1000))}</span></span>
                  <span className="poster grid h-10 place-items-center rounded-xl bg-hot px-3 text-[17px] text-hotInk">Finish ›</span>
                </button>
              ) : active ? (
                <button className="h-12 w-full card text-[15px] font-semibold shadow-lg" onClick={() => setSel(active.dayId)}>
                  {activeDay(active).title} workout in progress · go back
                </button>
              ) : (
                <div className="flex gap-2">
                  <button id="start-guided" className="anim-rise flex h-14 min-w-0 flex-1 items-center justify-between gap-2 rounded-2xl bg-ink pl-4 pr-2 text-bg shadow-lg" onClick={() => act().start(sel, true, venue)}>
                    <span className="poster truncate text-[19px]">Start {day.title}</span>
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-hot text-hotInk"><svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden><path d="M8 5l11 7-11 7z" /></svg></span>
                  </button>
                  <button id="start-workout" className="anim-rise h-14 card px-4 text-[14px] font-semibold shadow-lg" onClick={() => act().start(sel, false, venue)}>
                    List
                  </button>
                </div>
              )}
            </div>
          </div>
        </>
      )}
      <div className="grid grid-cols-2 gap-2.5">
        <WeightQuickRow />
        <button id="machine-finder" onClick={() => setFinder(true)} className="card flex min-h-[112px] flex-col justify-between gap-1 p-3 text-left" style={{ alignItems: 'flex-start' }}>
          <span className="label">Gym helper</span>
          <span className="text-[14px] font-semibold leading-snug">What's this machine?</span>
          <span className="flex items-center gap-1.5 text-[12px] text-muted">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M4 8h3l2-3h6l2 3h3v11H4z" /><circle cx="12" cy="13" r="3.5" /></svg>
            Snap it, AI explains
          </span>
        </button>
      </div>
      {finder && <MachineFinder onClose={() => setFinder(false)} />}
      {/* room for the fixed Start / Finish bar */}
      {day.exercises.length > 0 && <div aria-hidden className="h-20" />}
      {finishing && isActiveHere && <FinishPanel day={day} onClose={() => setFinishing(false)} />}
    </div>
  );
}
