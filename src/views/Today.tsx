import { useEffect, useState } from 'react';
import { DAY, PLAN } from '../data/plan';
import { CheckIcon as Check, Chip, Plate } from '../components/ui';
import { act, useWorkout } from '../store/workout';
import { isoDay, mmss, pad, programWeek, progressStatus, range, fmtW, weekdayId } from '../lib/utils';
import type { Active, Day, DayId, Exercise, Session } from '../types';

export type OnRest = (secs: number, label: string) => void;

function DayStrip({ sel, onSel, today }: { sel: DayId; onSel: (d: DayId) => void; today: DayId }) {
  return (
    <div className="-mx-4 overflow-x-auto px-4 pb-1">
      <div className="flex gap-2">
        {PLAN.map(d => (
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
  const st = progressStatus(sessions, e);
  const rows = active?.logs[e.id];
  const bw = e.start == null;
  const doneCount = rows?.filter(r => r.done).length ?? 0;
  return (
    <article className="rounded-2xl border border-line bg-surface">
      <header className="flex items-start gap-3 px-4 pt-4">
        <span className="num mt-0.5 text-[12px] text-muted">{pad(idx + 1)}</span>
        <div className="min-w-0 flex-1">
          <h3 className="disp text-[22px] font-bold uppercase leading-tight">{e.name}</h3>
          <p className="mt-0.5 text-[14px] text-muted"><span className="num font-semibold text-ink">{e.sets}×{range(e)}</span> · {e.wNote} · rest <span className="num">{e.rest}s</span></p>
        </div>
        {rows && <span className={`num rounded-md px-2 py-1 text-[12px] font-bold ${doneCount >= e.sets ? 'bg-goodSoft text-good' : 'bg-sunk text-muted'}`}>{doneCount}/{rows.length}</span>}
      </header>
      <div className="flex flex-wrap items-center gap-2 px-4 pt-2 text-[13px]">
        {st.kind === 'ready' && <Chip tone="good">▲ Ready to progress{st.next != null ? ` · try ${fmtW(st.next)} kg` : ' · harder variation'}</Chip>}
        {st.last && <span className="text-muted">Last: <span className="num text-ink">{st.last.e.sets.map(s => `${fmtW(s.w)}×${s.r}`).join('  ')}</span></span>}
        {!st.last && <span className="text-muted">First time · start at {e.wNote.toLowerCase()}</span>}
        <button className="ml-auto text-[13px] font-semibold text-accent" onClick={() => setCue(!cue)}>{cue ? 'Hide cue' : 'Form cue'}</button>
      </div>
      {cue && <p className="mx-4 mt-2 rounded-lg bg-sunk px-3 py-2 text-[14px]">{e.cue}</p>}
      {rows ? (
        <div className="px-3 pb-3 pt-3">
          <div className="grid grid-cols-[28px_1fr_1fr_48px] gap-2 px-1 pb-1">
            <span className="label">Set</span><span className="label">{bw ? 'Added kg' : 'kg'}</span><span className="label">{e.unit === 'sec' ? 'Seconds' : 'Reps'}</span><span />
          </div>
          <div className="grid gap-1.5">
            {rows.map((r, i) => (
              <div key={i} className={`grid grid-cols-[28px_1fr_1fr_48px] items-center gap-2 rounded-xl px-1 py-1 ${r.done ? 'bg-goodSoft' : ''}`}>
                <span className="num text-center text-[14px] font-bold text-muted">{i + 1}</span>
                <input id={`${e.id}-w-${i}`} inputMode="decimal" type="number" step="0.5" placeholder={bw ? 'BW' : '—'} value={r.w}
                  onChange={ev => act().edit(e.id, i, { w: ev.target.value })}
                  className="num h-11 w-full min-w-0 rounded-lg border border-line bg-bg px-3 text-ink placeholder:text-muted" />
                <input id={`${e.id}-r-${i}`} inputMode="numeric" type="number" placeholder={`${e.max}`} value={r.r}
                  onChange={ev => act().edit(e.id, i, { r: ev.target.value })}
                  className="num h-11 w-full min-w-0 rounded-lg border border-line bg-bg px-3 text-ink placeholder:text-muted" />
                <button aria-label={`Mark set ${i + 1} done`} onClick={() => {
                  const done = !r.done;
                  act().edit(e.id, i, { done, r: done && r.r === '' ? String(e.max) : r.r });
                  if (done) onRest(e.rest, `${e.name} · set ${i + 1}`);
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
      ) : <div className="h-4" />}
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
          <button className="mt-5 h-12 w-full rounded-xl bg-accent text-[16px] font-bold text-accentInk" onClick={() => { act().finish(Number(cardio) || 0, note.trim()); onClose(); }}>Save workout</button>
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

export default function Today({ onRest }: { onRest: OnRest }) {
  const active = useWorkout(s => s.active);
  const sessions = useWorkout(s => s.sessions);
  const startDate = useWorkout(s => s.startDate);
  const today = weekdayId();
  const [sel, setSel] = useState<DayId>(active?.dayId ?? today);
  const [finishing, setFinishing] = useState(false);
  const [now, setNow] = useState(Date.now());
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(t); }, []);
  const day = DAY[sel];
  const pw = programWeek(startDate);
  const isActiveHere = active?.dayId === sel;
  const doneToday = sessions.find(s => s.date === isoDay() && s.dayId === sel);

  return (
    <div className="grid gap-4">
      <div className={`rounded-xl px-4 py-3 text-[14px] ${pw.tone === 'warn' ? 'bg-warnSoft' : 'bg-accentSoft'}`}>
        <span className="disp text-[18px] font-bold uppercase">Week {pw.week} · {pw.name}</span>
        <span className="block text-muted">{pw.deload ? 'Easy week due: drop weights ~20% this week.' : `${pw.rir}. Form over weight.`}</span>
      </div>
      <DayStrip sel={sel} onSel={setSel} today={today} />
      <section>
        <div className="flex items-center gap-2"><Plate color={day.plate} size={14} /><span className="label">{day.short}{sel === today ? ' · today' : ''}{day.home ? ' · at home' : ''}</span></div>
        <h2 className="disp mt-1 text-[40px] font-extrabold uppercase leading-[0.95]">{day.title}</h2>
        <p className="mt-1 text-muted">{day.focus}{day.mins !== '0' && <> · ~<span className="num">{day.mins}</span> min</>}</p>
        {day.cardio !== 'none' && <p className="mt-1 text-[14px] text-muted">Optional cardio after: 15–20 min, conversational pace{day.cardio === 'home' ? ' (walk, stairs, jog in place)' : ''}.</p>}
        {day.id !== 'sun' && day.cardio === 'none' && <p className="mt-1 text-[14px] text-muted">No cardio today.</p>}
      </section>

      {day.id === 'sun' ? (
        <div className="rounded-2xl border border-line bg-surface px-4 py-6 text-center">
          <p className="disp text-[24px] font-bold uppercase">Rest day</p>
          <p className="mt-1 text-muted">Muscle is built while you recover. Light walking in daily life is fine.</p>
        </div>
      ) : (
        <>
          {doneToday && !isActiveHere && <div><Chip tone="good">✓ Logged today · {doneToday.mins} min</Chip></div>}
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
                  {DAY[active.dayId].title} workout in progress · go back
                </button>
              ) : (
                <button id="start-workout" className="h-12 w-full rounded-xl bg-accent text-[16px] font-bold text-accentInk shadow-lg" onClick={() => act().start(sel)}>
                  Start {day.title} workout
                </button>
              )}
            </div>
          </div>
        </>
      )}
      {finishing && isActiveHere && <FinishPanel day={day} onClose={() => setFinishing(false)} />}
    </div>
  );
}
