import { useEffect, useState } from 'react';
import { act, activeDay } from '../store/workout';
import { DEMO_NOTE } from '../data/demos';
import { detailsOf } from '../data/details';
import { swapOptions } from '../data/alternatives';
import { advise } from '../lib/coach';
import { lastFor, mmss, programWeek, range, fmtW } from '../lib/utils';
import type { Active, Exercise, Session } from '../types';
import DemoGif from '../components/exercise/DemoGif';
import MachineNote from '../components/exercise/MachineNote';
import MachinePhoto from '../components/exercise/MachinePhoto';
import SetRows, { type OnRest } from '../components/exercise/SetRows';
import SwapSheet from '../components/exercise/SwapSheet';
import ExerciseHowTo from '../components/ExerciseHowTo';
import Advice from '../components/Advice';
import AskAI from '../components/ai/AskAI';

const doneSets = (a: Active, e: Exercise) => (a.logs[e.id] ?? []).filter(r => r.done).length;
const allDone = (a: Active, e: Exercise) => { const rows = a.logs[e.id] ?? []; return rows.length > 0 && rows.every(r => r.done); };

/** Where to go after ticking a set, and what the rest timer should say. Supersets alternate A1 ↔ A2. */
export function nextStep(a: Active, idx: number, setIndex: number): { idx: number; label?: string } {
  const list = activeDay(a).exercises;
  const e = list[idx];
  const desc = (x: Exercise) => {
    const eq = detailsOf(x)?.equipment;
    return `Next up: ${x.name}${eq ? ` · ${eq}` : ''}`;
  };
  if (e.superset) {
    const partnerIdx = list.findIndex((x, i) => i !== idx && x.superset && x.superset[0] === e.superset![0]);
    const partner = list[partnerIdx];
    const partnerLeft = partner && !allDone(a, partner);
    if (partner && partnerIdx > idx && partnerLeft) return { idx: partnerIdx, label: `Superset: straight into ${partner.name}` };
    if (partner && partnerIdx < idx && partnerLeft) return { idx: partnerIdx, label: `${partner.name} · set ${doneSets(a, partner) + 1}` };
  }
  if (allDone(a, e)) {
    const nextIdx = list.findIndex((x, i) => i > idx && !allDone(a, x));
    if (nextIdx >= 0) return { idx: nextIdx, label: desc(list[nextIdx]) };
    return { idx, label: 'Last set done · tap Finish' };
  }
  return { idx, label: `${e.name} · set ${setIndex + 2} next` };
}

/** One exercise at a time: big demo, your machine, how to do it, and the sets. */
export default function Guided({ active, sessions, startDate, onRest, onFinish }: {
  active: Active; sessions: Session[]; startDate: string; onRest: OnRest; onFinish: () => void;
}) {
  const day = activeDay(active);
  const list = day.exercises;
  const idx = Math.min(active.guided ?? 0, list.length - 1);
  const e = list[idx];
  const [howTo, setHowTo] = useState(false);
  const [swap, setSwap] = useState(false);
  const [now, setNow] = useState(Date.now());
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(t); }, []);
  useEffect(() => { window.scrollTo({ top: 0 }); setHowTo(false); }, [idx, e.id]);

  const d = detailsOf(e);
  const adv = advise(sessions, e, { deload: programWeek(startDate).deload });
  const last = lastFor(sessions, e.id);
  const rows = active.logs[e.id] ?? [];
  const inWorkout = list.map(x => x.id);
  const canSwap = swapOptions(e, inWorkout, !!day.home).length > 0;
  const next = list[idx + 1];
  const isLast = idx === list.length - 1;
  const go = (i: number) => act().setGuided(i);

  return (
    <div id="guided" className="grid gap-4 pb-24">
      <div className="flex items-center gap-3">
        <button id="guided-exit" className="disp h-10 rounded-lg bg-sunk px-3 text-[14px] font-bold uppercase tracking-wider" onClick={() => act().setGuided(null)}>☰ List</button>
        <span className="poster flex-1 text-center text-[20px]"><span id="guided-pos">{idx + 1} / {list.length}</span></span>
        <span className="num text-[14px] text-muted">{mmss(Math.floor((now - active.startedAt) / 1000))}</span>
      </div>
      <div className="flex gap-1" aria-hidden>
        {list.map((x, i) => {
          const full = allDone(active, x);
          const some = doneSets(active, x) > 0;
          return <button key={x.id} tabIndex={-1} onClick={() => go(i)}
            className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${i === idx ? 'bg-ink' : full ? 'bg-good' : some ? 'bg-hot' : 'bg-line'}`} />;
        })}
      </div>

      <div key={e.id} className="anim-rise">
        <div className="label">{day.title}{e.superset ? ` · superset ${e.superset}` : ''}</div>
        <h2 className="poster mt-1 text-[38px] leading-[0.95]">{e.name}</h2>
        <p className="mt-1 text-[14px] text-muted"><span className="num font-semibold text-ink">{e.sets}×{range(e)}</span> · {e.wNote} · {e.rest > 0 ? `rest ${e.rest}s` : 'no rest, go to next'}</p>
        {e.swappedFor && <p className="mt-0.5 text-[13px] font-semibold text-warn">Swapped in for {e.swappedFor.name}</p>}
      </div>

      <DemoGif key={`demo-${e.id}`} e={e} className="anim-fade mx-auto aspect-square w-full max-w-sm rounded-2xl" />
      {!e.demo && DEMO_NOTE[e.id] && <p className="demo-note -mt-2 rounded-lg bg-sunk px-3 py-2 text-[13px]">{DEMO_NOTE[e.id]}</p>}

      {d?.equipment && (
        <p className="flex gap-2 rounded-lg bg-sunk px-3 py-2 text-[14px]">
          <span aria-hidden className="text-muted">⚙</span>
          <span className="min-w-0"><span className="font-semibold">Equipment: </span>{d.equipment}</span>
        </p>
      )}
      <MachinePhoto exId={e.id} />
      <MachineNote exId={e.id} />
      {e.cue && <p className="rounded-lg border-l-4 border-accent bg-surface px-3 py-2 text-[14px]"><span className="font-semibold">Key cue: </span>{e.cue}</p>}

      <div className="flex flex-wrap items-center gap-2 text-[13px]">
        <Advice kind={adv.kind} title={adv.title} detail={adv.detail} />
        {last && <span className="text-muted">Last: <span className="num text-ink">{last.e.sets.map(x => `${fmtW(x.w)}×${x.r}`).join('  ')}</span></span>}
      </div>

      <section className="card-now">
        <SetRows e={e} rows={rows} onRest={onRest} afterTick={i => {
          const step = nextStep(act().active!, idx, i);
          if (step.idx !== idx) go(step.idx);
          return { label: step.label };
        }} />
      </section>

      <div className="flex flex-wrap gap-x-5 gap-y-2">
        <button className="text-[14px] font-semibold text-accent" aria-expanded={howTo} onClick={() => setHowTo(!howTo)}>{howTo ? 'Hide steps' : 'How to do it'}</button>
        {canSwap && <button className="text-[14px] font-semibold text-accent" onClick={() => setSwap(true)} aria-label={`Swap ${e.name}`}>⇄ Machine busy? Swap</button>}
      </div>
      {howTo && <div className="card px-3 py-3"><ExerciseHowTo e={e} hideEquipment /></div>}
      <AskAI key={e.id} e={e} />
      {swap && <SwapSheet e={e} inWorkout={inWorkout} atHome={!!day.home} onClose={() => setSwap(false)} />}

      <div className="fixed inset-x-0 z-20 px-4" style={{ bottom: 'calc(72px + env(safe-area-inset-bottom, 0px))' }}>
        <div className="mx-auto flex max-w-xl gap-2">
          <button id="guided-prev" disabled={idx === 0} onClick={() => go(idx - 1)}
            aria-label="Previous exercise" className="h-14 rounded-2xl border-[1.5px] border-ink bg-surface px-5 text-[20px] font-semibold shadow-lg disabled:opacity-40">‹</button>
          {isLast
            ? <button id="guided-finish" onClick={onFinish} className="poster h-14 flex-1 rounded-2xl bg-hot text-[20px] text-hotInk shadow-lg">Finish ›</button>
            : <button id="guided-next" onClick={() => go(idx + 1)} className="flex h-14 min-w-0 flex-1 items-center justify-between gap-2 rounded-2xl bg-ink px-4 text-bg shadow-lg">
                <span className="min-w-0 text-left"><span className="disp block text-[11px] font-bold uppercase tracking-[0.12em] opacity-70">Next</span><span className="block truncate text-[15px] font-semibold">{next.name}</span></span>
                <span className="poster text-[22px]">›</span>
              </button>}
        </div>
      </div>
    </div>
  );
}
