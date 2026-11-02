import { useEffect, useState } from 'react';
import { Chip, Plate } from '../components/ui';
import { act, activeDay, useWorkout } from '../store/workout';
import { useActivePlan } from '../lib/useRoutine';
import { routineName } from '../lib/routines';
import { isoDay, lastFor, mmss, pad, programWeek, range, fmtW, weekdayId } from '../lib/utils';
import { advise } from '../lib/coach';
import Advice from '../components/Advice';
import type { Active, Day, DayId, Exercise, Session } from '../types';
import WeightSheet from '../components/WeightSheet';
import ExerciseHowTo from '../components/ExerciseHowTo';
import DemoGif from '../components/exercise/DemoGif';
import DemoSheet from '../components/exercise/DemoSheet';
import SwapSheet from '../components/exercise/SwapSheet';
import MachineNote from '../components/exercise/MachineNote';
import SetRows from '../components/exercise/SetRows';
import { PhotoThumb } from '../components/exercise/MachinePhoto';
import Guided from './Guided';
import { swapOptions } from '../data/alternatives';
import { useWakeLock } from '../lib/wakeLock';
import { detailsOf } from '../data/details';
import { fmtKg, fmtWhen } from '../lib/weight';

export type OnRest = (secs: number, label: string) => void;

function DayStrip({ sel, onSel, today, plan }: { sel: DayId; onSel: (d: DayId) => void; today: DayId; plan: Day[] }) {
  return (
    <div className="-mx-4 overflow-x-auto px-4 pb-1">
      <div className="flex gap-2">
        {plan.map(d => (
          <button key={d.id} id={`day-${d.id}`} onClick={() => onSel(d.id)}
            className={`flex min-w-[64px] flex-col items-center gap-1 rounded-xl border px-2 py-2 transition ${sel === d.id ? 'border-ink bg-ink text-bg' : 'border-line bg-surface text-ink'}`}>
            <span className="disp text-[17px] font-bold uppercase leading-none">{d.short}</span>
            <span className="flex items-center gap-1 text-[11px] leading-none opacity-80"><Plate color={d.plate} size={9} />{d.id === today ? 'Today' : d.title.split(' ')[0]}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function RoutineList({ title, items }: { title: string; items: string[] }) {
  const [open, setOpen] = useState(false);
  if (!items.length) return null;
  return (
    <div className="rounded-xl border border-line bg-surface">
      <button className="flex w-full items-center justify-between px-4 py-3 text-left" onClick={() => setOpen(!open)} aria-expanded={open}>
        <span className="label">{title}</span>
        <span className="text-[13px] text-muted">{items.length} moves {open ? '▴' : '▾'}</span>
      </button>
      {open && <ul className="grid gap-1.5 border-t border-line px-4 py-3 text-[14px]">{items.map(i => <li key={i}>{i}</li>)}</ul>}
    </div>
  );
}

function ExerciseCard({ e, idx, active, sessions, onRest }: { e: Exercise; idx: number; active: Active | null; sessions: Session[]; onRest: OnRest }) {
  const [cue, setCue] = useState(false);
  const [sheet, setSheet] = useState<'demo' | 'swap' | null>(null);
  const det = detailsOf(e);
  const targets = det?.targets;
  const inWorkout = active ? activeDay(active).exercises.map(x => x.id) : [];
  const canSwap = !!active && swapOptions(e, inWorkout).length > 0;
  const startDate = useWorkout(s => s.startDate);
  const adv = advise(sessions, e, { deload: programWeek(startDate).deload });
  const last = lastFor(sessions, e.id);
  const rows = active?.logs[e.id];
  const doneCount = rows?.filter(r => r.done).length ?? 0;
  return (
    <article className="rounded-2xl border border-line bg-surface">
      <header className="flex items-start gap-3 px-4 pt-4">
        <button className="relative shrink-0" onClick={() => setSheet('demo')} aria-label={`Show how to do ${e.name}`}>
          <span className="flex gap-1.5"><DemoGif e={e} size={72} /><PhotoThumb exId={e.id} /></span>
          <span className="num absolute -left-1.5 -top-1.5 grid h-5 min-w-5 place-items-center rounded-full bg-ink px-1 text-[11px] font-bold text-bg">{idx + 1}</span>
        </button>
        <div className="min-w-0 flex-1">
          <h3 className="disp text-[22px] font-bold uppercase leading-tight">{e.superset && <span className="mr-2 rounded-md bg-accentSoft px-1.5 align-middle text-[14px] text-accent">{e.superset}</span>}{e.name}</h3>
          <p className="mt-0.5 text-[14px] text-muted"><span className="num font-semibold text-ink">{e.sets}×{range(e)}</span> · {e.wNote} · {e.rest > 0 ? <>rest <span className="num">{e.rest}s</span></> : 'no rest, go to next'}</p>
          {targets && <p className="mt-0.5 text-[13px] text-muted">Works: {targets}</p>}
          {e.swappedFor && <p className="mt-0.5 text-[13px] font-semibold text-warn">Swapped in for {e.swappedFor.name}</p>}
        </div>
        {rows && <span className={`num rounded-md px-2 py-1 text-[12px] font-bold ${doneCount >= e.sets ? 'bg-goodSoft text-good' : 'bg-sunk text-muted'}`}>{doneCount}/{rows.length}</span>}
      </header>
      {det?.equipment && (
        <p className="mx-4 mt-3 flex gap-2 rounded-lg bg-sunk px-3 py-2 text-[14px]">
          <span aria-hidden className="text-muted">⚙</span>
          <span className="min-w-0"><span className="font-semibold">Equipment: </span>{det.equipment}</span>
        </p>
      )}
      <div className="mx-4 mt-2"><MachineNote exId={e.id} compact /></div>
      <div className="flex flex-wrap items-center gap-2 px-4 pt-2 text-[13px]">
        <Advice kind={adv.kind} title={adv.title} detail={adv.detail} />
        {last && <span className="text-muted">Last: <span className="num text-ink">{last.e.sets.map(x => `${fmtW(x.w)}×${x.r}`).join('  ')}</span></span>}
        <span className="ml-auto flex items-center gap-3">
          {canSwap && <button className="text-[13px] font-semibold text-accent" onClick={() => setSheet('swap')} aria-label={`Swap ${e.name}`}>⇄ Swap</button>}
          <button className="text-[13px] font-semibold text-accent" aria-expanded={cue} onClick={() => setCue(!cue)}>{cue ? 'Hide details' : 'How to do it'}</button>
        </span>
      </div>
      {cue && <div className="mx-4 mt-3 rounded-xl border border-line bg-bg px-3 py-3"><ExerciseHowTo e={e} hideEquipment /></div>}
      {sheet === 'demo' && <DemoSheet e={e} onClose={() => setSheet(null)} />}
      {sheet === 'swap' && <SwapSheet e={e} inWorkout={inWorkout} onClose={() => setSheet(null)} />}
      {rows ? <SetRows e={e} rows={rows} onRest={onRest} /> : <div className="h-4" />}
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
    <div className="fixed inset-0 z-40 flex items-end bg-black/50" onClick={onClose}>
      <div className="w-full rounded-t-3xl border-t border-line bg-surface px-4 pt-5" style={{ paddingBottom: 'calc(20px + env(safe-area-inset-bottom, 0px))' }} onClick={e => e.stopPropagation()}>
        <div className="mx-auto max-w-xl">
          <h2 className="disp text-[28px] font-bold uppercase">Finish {day.title}</h2>
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
          <button disabled={done === 0} className="mt-5 h-12 w-full rounded-xl bg-accent text-[16px] font-bold text-accentInk disabled:opacity-40" onClick={() => { act().finish(Number(cardio) || 0, note.trim()); onClose(); }}>Save workout</button>
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
    <div className="flex items-center gap-3 rounded-xl border border-line bg-surface px-4 py-2.5">
      <div className="min-w-0 flex-1">
        <div className="label">Body weight</div>
        <div className="text-[14px]">
          {latest
            ? <><span className="num font-bold">{fmtKg(latest.kg)} kg</span> <span className="text-muted">· {loggedToday ? 'today' : fmtWhen(latest.at)}</span></>
            : <span className="text-muted">Not logged yet</span>}
        </div>
      </div>
      <button className="h-10 rounded-lg bg-sunk px-3 text-[14px] font-semibold" onClick={() => setOpen(true)}>{loggedToday ? '+ Log again' : '+ Log weight'}</button>
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
  const [now, setNow] = useState(Date.now());
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(t); }, []);
  const { routine, plan, byId } = useActivePlan();
  const isActiveHere = active?.dayId === sel;
  // While a workout runs, show the snapshot it started with, even if the routine was edited since.
  const day = isActiveHere && active ? activeDay(active) : byId[sel];
  const pw = programWeek(startDate);
  useWakeLock(isActiveHere);
  const doneToday = sessions.find(s => s.date === isoDay() && s.dayId === sel);

  if (isActiveHere && active && active.guided != null && day.exercises.length) {
    return (
      <>
        <Guided active={active} sessions={sessions} startDate={startDate} onRest={onRest} onFinish={() => setFinishing(true)} />
        {finishing && <FinishPanel day={day} onClose={() => setFinishing(false)} />}
      </>
    );
  }

  return (
    <div className="grid gap-4">
      <div className={`rounded-xl px-4 py-3 text-[14px] ${pw.tone === 'warn' ? 'bg-warnSoft' : 'bg-accentSoft'}`}>
        <span className="disp text-[18px] font-bold uppercase">Week {pw.week} · {pw.name}</span>
        <span className="block text-muted">{pw.deload ? 'Easy week due: drop weights ~20% this week.' : `${pw.rir}. Form over weight.`}</span>
      </div>
      <WeightQuickRow />
      <DayStrip sel={sel} onSel={setSel} today={today} plan={plan} />
      <section>
        <div className="flex items-center gap-2"><Plate color={day.plate} size={14} /><span className="label">{day.short}{sel === today ? ' · today' : ''}{day.home ? ' · at home' : ''} · {routineName(routine)}</span></div>
        <h2 className="disp mt-1 text-[40px] font-extrabold uppercase leading-[0.95]">{day.title}</h2>
        <p className="mt-1 text-muted">{day.focus}{day.mins !== '0' && <> · ~<span className="num">{day.mins}</span> min</>}</p>
        {day.cardio !== 'none' && <p className="mt-1 text-[14px] text-muted">Optional cardio after: 15–20 min, conversational pace{day.cardio === 'home' ? ' (walk, stairs, jog in place)' : ''}.</p>}
        {day.exercises.length > 0 && day.cardio === 'none' && <p className="mt-1 text-[14px] text-muted">No cardio today.</p>}
      </section>

      {!day.exercises.length ? (
        <div className="rounded-2xl border border-line bg-surface px-4 py-6 text-center">
          <p className="disp text-[24px] font-bold uppercase">Rest day</p>
          <p className="mt-1 text-muted">Muscle is built while you recover. Light walking in daily life is fine.</p>
        </div>
      ) : (
        <>
          {doneToday && !isActiveHere && <div><Chip tone="good">✓ Logged today · {doneToday.mins} min</Chip></div>}
          {isActiveHere && (
            <button id="guided-open" className="flex h-12 items-center justify-center gap-2 rounded-xl border border-accent bg-accentSoft text-[15px] font-bold text-accent"
              onClick={() => act().setGuided(Math.max(0, day.exercises.findIndex(x => !(active!.logs[x.id] ?? []).every(r => r.done))))}>
              ▶ Guided mode · one exercise at a time
            </button>
          )}
          <RoutineList title="Warm-up · 5–7 min" items={day.warmup} />
          {day.exercises.map((e, i) => <ExerciseCard key={e.id} e={e} idx={i} active={isActiveHere ? active : null} sessions={sessions} onRest={onRest} />)}
          <RoutineList title="Cool-down · hold 30s each" items={day.cooldown} />
          <div className="h-16" />
          <div className="fixed inset-x-0 z-20 px-4" style={{ bottom: 'calc(72px + env(safe-area-inset-bottom, 0px))' }}>
            <div className="mx-auto max-w-xl">
              {isActiveHere ? (
                <button className="flex h-12 w-full items-center justify-between rounded-xl bg-ink px-4 text-bg shadow-lg" onClick={() => setFinishing(true)}>
                  <span className="text-[15px] font-semibold">In progress · <span className="num">{mmss(Math.floor((now - active!.startedAt) / 1000))}</span></span>
                  <span className="disp text-[18px] font-bold uppercase">Finish ›</span>
                </button>
              ) : active ? (
                <button className="h-12 w-full rounded-xl border border-line bg-surface text-[15px] font-semibold shadow-lg" onClick={() => setSel(active.dayId)}>
                  {activeDay(active).title} workout in progress · go back
                </button>
              ) : (
                <div className="flex gap-2">
                  <button id="start-guided" className="h-12 flex-1 rounded-xl bg-accent text-[16px] font-bold text-accentInk shadow-lg" onClick={() => act().start(sel, true)}>
                    ▶ Start {day.title}
                  </button>
                  <button id="start-workout" className="h-12 rounded-xl border border-line bg-surface px-4 text-[14px] font-semibold shadow-lg" onClick={() => act().start(sel)}>
                    List
                  </button>
                </div>
              )}
            </div>
          </div>
        </>
      )}
      {finishing && isActiveHere && <FinishPanel day={day} onClose={() => setFinishing(false)} />}
    </div>
  );
}
