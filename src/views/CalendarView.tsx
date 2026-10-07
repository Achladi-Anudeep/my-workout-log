import { useMemo, useState } from 'react';
import { PLATE, sessionTitle } from '../lib/routines';
import { useActivePlan } from '../lib/useRoutine';
import { Plate } from '../components/ui';
import { act, useWorkout } from '../store/workout';
import { fmtDate, fmtW, isoDay, pad, volumeOf, weekdayId } from '../lib/utils';
import type { Session } from '../types';

function SessionCard({ s, open, onToggle }: { s: Session; open: boolean; onToggle: () => void }) {
  const [del, setDel] = useState(false);
  return (
    <article className="rounded-2xl border border-line bg-surface">
      <button className="flex w-full items-center gap-3 px-4 py-3 text-left" onClick={onToggle} aria-expanded={open}>
        <Plate color={PLATE[s.dayId]} size={14} />
        <div className="min-w-0 flex-1">
          <div className="disp text-[20px] font-bold uppercase leading-tight">{sessionTitle(s)}</div>
          <div className="text-[13px] text-muted">{fmtDate(s.date)} · <span className="num">{s.mins}</span> min{s.cardio ? <> · cardio <span className="num">{s.cardio}</span>m</> : null}</div>
        </div>
        <div className="text-right"><div className="num text-[15px] font-bold">{Math.round(volumeOf(s)).toLocaleString()}</div><div className="text-[11px] text-muted">kg volume</div></div>
      </button>
      {open && (
        <div className="border-t border-line px-4 py-3">
          <div className="grid gap-2">
            {s.ex.map(e => (
              <div key={e.id} className="flex items-baseline justify-between gap-3">
                <span className="min-w-0 text-[14px] font-semibold">{e.name}</span>
                <span className="num text-right text-[13px] text-muted">{e.sets.map(x => `${fmtW(x.w)}×${x.r}${e.unit === 'sec' ? 's' : ''}`).join('  ')}</span>
              </div>
            ))}
          </div>
          {s.note && <p className="mt-3 rounded-lg bg-sunk px-3 py-2 text-[14px]">{s.note}</p>}
          <div className="mt-2 text-right">
            {del
              ? <button className="h-10 px-2 text-[13px] font-bold text-danger" onClick={() => act().deleteSession(s.id)}>Tap again to delete</button>
              : <button className="h-10 px-2 text-[13px] font-semibold text-muted" onClick={() => setDel(true)}>Delete session</button>}
          </div>
        </div>
      )}
    </article>
  );
}

export default function CalendarView() {
  const sessions = useWorkout(s => s.sessions);
  const startDate = useWorkout(s => s.startDate);
  const now = new Date();
  const [month, setMonth] = useState(() => new Date(now.getFullYear(), now.getMonth(), 1));
  const [sel, setSel] = useState<string | null>(null);
  const [open, setOpen] = useState<string | null>(null);
  const todayIso = isoDay();
  const { plan, byId } = useActivePlan();

  const byDate = useMemo(() => {
    const m: Record<string, Session[]> = {};
    sessions.forEach(s => { (m[s.date] ||= []).push(s); });
    return m;
  }, [sessions]);

  const y = month.getFullYear(), mo = month.getMonth();
  const daysInMonth = new Date(y, mo + 1, 0).getDate();
  const offset = (new Date(y, mo, 1).getDay() + 6) % 7; // Monday-first
  const cells: (Date | null)[] = [...Array<null>(offset).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => new Date(y, mo, i + 1))];
  while (cells.length % 7) cells.push(null);

  const monthIso = `${y}-${pad(mo + 1)}`;
  const monthSessions = sessions.filter(s => s.date.startsWith(monthIso));
  let planned = 0, hit = 0;
  cells.forEach(d => {
    if (!d) return;
    const iso = isoDay(d);
    if (iso < startDate || iso > todayIso || !byId[weekdayId(d)].exercises.length) return;
    planned++;
    if (byDate[iso]) hit++;
  });
  const listed = sel ? (byDate[sel] ?? []) : monthSessions;
  const isThisMonth = y === now.getFullYear() && mo === now.getMonth();

  return (
    <div className="grid gap-4">
      <div className="flex items-end justify-between gap-3">
        <h2 className="disp text-[36px] font-extrabold uppercase leading-none">Calendar</h2>
        <div className="flex items-center gap-1">
          <button aria-label="Previous month" className="grid h-10 w-10 place-items-center rounded-lg border border-line bg-surface" onClick={() => { setMonth(new Date(y, mo - 1, 1)); setSel(null); }}>‹</button>
          <button className="h-10 rounded-lg border border-line bg-surface px-3 text-[13px] font-semibold disabled:opacity-40" disabled={isThisMonth} onClick={() => { setMonth(new Date(now.getFullYear(), now.getMonth(), 1)); setSel(null); }}>Today</button>
          <button aria-label="Next month" className="grid h-10 w-10 place-items-center rounded-lg border border-line bg-surface" onClick={() => { setMonth(new Date(y, mo + 1, 1)); setSel(null); }}>›</button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {[
          ['Workouts', `${monthSessions.length}`],
          ['Adherence', planned ? `${Math.round((hit / planned) * 100)}%` : '—'],
          ['Cardio', `${monthSessions.reduce((a, s) => a + s.cardio, 0)}m`],
          ['Volume', `${Math.round(monthSessions.reduce((a, s) => a + volumeOf(s), 0) / 100) / 10}t`],
        ].map(([k, v]) => (
          <div key={k} className="rounded-xl border border-line bg-surface px-3 py-2.5"><div className="label">{k}</div><div className="num mt-0.5 text-[20px] font-bold">{v}</div></div>
        ))}
      </div>

      <section className="rounded-2xl border border-line bg-surface px-3 pb-3 pt-3">
        <div className="disp px-1 pb-2 text-[22px] font-bold uppercase">{month.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}</div>
        <div className="grid grid-cols-7 gap-1 pb-1 text-center">
          {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => <span key={i} className="label">{d}</span>)}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {cells.map((d, i) => {
            if (!d) return <span key={i} />;
            const iso = isoDay(d);
            const day = byId[weekdayId(d)];
            const logged = byDate[iso] ?? [];
            const missed = !logged.length && day.exercises.length > 0 && iso < todayIso && iso >= startDate;
            const isSel = sel === iso, isToday = iso === todayIso;
            return (
              <button key={i} onClick={() => setSel(isSel ? null : iso)} aria-pressed={isSel}
                aria-label={`${fmtDate(iso)}${logged.length ? ', workout logged' : missed ? ', missed' : ''}`}
                className={`flex aspect-square min-h-[44px] flex-col items-center justify-center gap-1 rounded-lg border text-[14px] ${isSel ? 'border-ink bg-ink text-bg' : isToday ? 'border-accent' : 'border-transparent'} ${iso > todayIso && !isSel ? 'text-muted' : ''}`}>
                <span className="num leading-none">{d.getDate()}</span>
                <span className="flex h-2.5 items-center gap-0.5">
                  {logged.slice(0, 2).map(s => <Plate key={s.id} color={PLATE[s.dayId]} size={9} />)}
                  {missed && <span className="block h-0.5 w-2.5 rounded bg-muted" />}
                </span>
              </button>
            );
          })}
        </div>
        <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 px-1 text-[12px] text-muted">
          {plan.filter(p => p.exercises.length).map(p => <span key={p.id} className="flex items-center gap-1"><Plate color={p.plate} size={8} />{p.title}</span>)}
          <span className="flex items-center gap-1"><span className="block h-0.5 w-2.5 rounded bg-muted" />Missed</span>
        </div>
      </section>

      <div className="flex items-baseline justify-between">
        <span className="label">{sel ? fmtDate(sel) : 'This month'}</span>
        {sel && <button className="text-[13px] font-semibold text-accent" onClick={() => setSel(null)}>Show whole month</button>}
      </div>
      {listed.length ? (
        <div className="grid gap-2">{listed.map(s => <SessionCard key={s.id} s={s} open={open === s.id} onToggle={() => setOpen(open === s.id ? null : s.id)} />)}</div>
      ) : (
        <div className="rounded-2xl border border-dashed border-line px-5 py-6 text-center">
          {sel ? (
            <p className="text-muted">Nothing logged on this day. Planned: <span className="font-semibold text-ink">{byId[weekdayId(new Date(sel + 'T00:00:00'))].title}</span>.</p>
          ) : (
            <>
              <p className="disp text-[22px] font-bold uppercase">No workouts this month yet</p>
              <p className="mx-auto mt-1 max-w-sm text-muted">Start a workout from Today and tick each set. Finished sessions show up here and on the calendar.</p>
              <button className="mt-4 h-11 rounded-xl bg-accent px-5 font-bold text-accentInk" onClick={() => act().setTab('today')}>Go to Today</button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
