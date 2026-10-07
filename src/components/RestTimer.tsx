import { useEffect, useRef, useState } from 'react';
import { mmss } from '../lib/utils';

export interface Timer { end: number; total: number; label: string; }

export default function RestTimer({ t, onClose, onAdd }: { t: Timer; onClose: () => void; onAdd: (s: number) => void }) {
  const [now, setNow] = useState(Date.now());
  const buzzed = useRef(false);
  useEffect(() => { const i = setInterval(() => setNow(Date.now()), 250); return () => clearInterval(i); }, []);
  useEffect(() => { buzzed.current = false; }, [t.end]);
  const left = Math.ceil((t.end - now) / 1000);
  const over = left <= 0;
  useEffect(() => {
    if (over && !buzzed.current) { buzzed.current = true; navigator.vibrate?.(200); }
  }, [over]);
  const pct = Math.min(100, Math.max(0, ((t.total - left) / t.total) * 100));
  return (
    <div className="fixed inset-x-0 top-0 z-30 px-4" style={{ paddingTop: 'calc(8px + env(safe-area-inset-top, 0px))' }}>
      <div className={`mx-auto max-w-xl overflow-hidden rounded-2xl border shadow-lg ${over ? 'border-good bg-goodSoft' : 'border-line bg-surface'}`}>
        <div className="flex items-center gap-3 px-4 py-2.5">
          <div className="min-w-0 flex-1">
            <div className="label">{over ? 'Rest done · next set' : 'Resting'}</div>
            <div className="truncate text-[13px] text-muted">{t.label}</div>
          </div>
          <div className={`num text-[26px] font-bold ${over ? 'text-good' : ''}`}>{over ? 'GO' : mmss(left)}</div>
          <button className="h-10 rounded-lg bg-sunk px-3 text-[13px] font-semibold" onClick={() => onAdd(15)}>+15s</button>
          <button className="h-10 rounded-lg px-2 text-[13px] font-semibold text-muted" onClick={onClose}>{over ? 'Close' : 'Skip'}</button>
        </div>
        <div className="h-1 bg-sunk"><div className="h-1 bg-accent transition-all" style={{ width: `${pct}%` }} /></div>
      </div>
    </div>
  );
}
