import { useState } from 'react';
import { act, useWorkout } from '../store/workout';
import { isoDay, pad } from '../lib/utils';

/** Bottom sheet to log a weigh-in. Date and time default to now, editable for back-filling. */
export default function WeightSheet({ onClose }: { onClose: () => void }) {
  const last = useWorkout(s => s.weights[s.weights.length - 1]);
  const now = new Date();
  const [kg, setKg] = useState(last ? String(last.kg) : '');
  const [date, setDate] = useState(isoDay(now));
  const [time, setTime] = useState(`${pad(now.getHours())}:${pad(now.getMinutes())}`);
  const [err, setErr] = useState('');

  const save = () => {
    const v = Number(kg.replace(',', '.'));
    if (!v || v < 25 || v > 300) { setErr('Enter your weight in kg, e.g. 65.4'); return; }
    const at = new Date(`${date}T${time || '00:00'}`).getTime();
    if (Number.isNaN(at)) { setErr('Pick a valid date and time.'); return; }
    if (at > Date.now() + 60000) { setErr('That time is in the future.'); return; }
    act().addWeight(v, at);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-40 flex items-end bg-black/50" onClick={onClose}>
      <div className="w-full rounded-t-3xl border-t border-line bg-surface px-4 pt-5" style={{ paddingBottom: 'calc(20px + env(safe-area-inset-bottom, 0px))' }} onClick={e => e.stopPropagation()}>
        <form className="mx-auto grid max-w-xl gap-3" onSubmit={e => { e.preventDefault(); save(); }}>
          <h2 className="disp text-[28px] font-bold uppercase">Log weight</h2>
          <label htmlFor="weight-kg" className="block">
            <span className="label">Body weight (kg)</span>
            <input id="weight-kg" inputMode="decimal" type="number" step="0.1" autoFocus placeholder="65.4" value={kg}
              onChange={e => { setKg(e.target.value); setErr(''); }}
              className="num mt-1 h-14 w-full rounded-lg border border-line bg-bg px-3 text-[24px] font-bold" />
          </label>
          <div className="grid grid-cols-2 gap-2">
            <label htmlFor="weight-date" className="block min-w-0">
              <span className="label">Date</span>
              <input id="weight-date" type="date" max={isoDay()} value={date} onChange={e => setDate(e.target.value)}
                className="num mt-1 h-11 w-full min-w-0 rounded-lg border border-line bg-bg px-3" />
            </label>
            <label htmlFor="weight-time" className="block min-w-0">
              <span className="label">Time</span>
              <input id="weight-time" type="time" value={time} onChange={e => setTime(e.target.value)}
                className="num mt-1 h-11 w-full min-w-0 rounded-lg border border-line bg-bg px-3" />
            </label>
          </div>
          {err && <p className="text-[13px] text-danger">{err}</p>}
          <p className="text-[13px] text-muted">Tip: weigh at the same time each day, ideally in the morning before eating.</p>
          <button type="submit" className="mt-1 h-12 w-full rounded-xl bg-accent text-[16px] font-bold text-accentInk">Save weight</button>
          <button type="button" className="h-11 text-[14px] font-semibold text-muted" onClick={onClose}>Cancel</button>
        </form>
      </div>
    </div>
  );
}
