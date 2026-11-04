import { useEffect, useRef, useState } from 'react';
import { mmss } from '../lib/utils';
import { beep } from '../lib/beep';
import { haptic } from '../lib/lift';

export interface Timer { end: number; total: number; label: string; }

export default function RestTimer({ t, onClose, onAdd }: { t: Timer; onClose: () => void; onAdd: (s: number) => void }) {
  const [now, setNow] = useState(Date.now());
  const buzzed = useRef(false);
  useEffect(() => { const i = setInterval(() => setNow(Date.now()), 250); return () => clearInterval(i); }, []);
  useEffect(() => { buzzed.current = false; }, [t.end]);
  const left = Math.ceil((t.end - now) / 1000);
  const over = left <= 0;
  useEffect(() => {
    if (over && !buzzed.current) { buzzed.current = true; beep(); if (typeof navigator.vibrate === 'function') navigator.vibrate(200); else haptic(); }
  }, [over]);
  const pct = Math.min(100, Math.max(0, ((t.total - left) / t.total) * 100));
  return (
    <div className="anim-drop fixed inset-x-0 top-0 z-30 px-4" style={{ paddingTop: 'calc(8px + env(safe-area-inset-top, 0px))' }}>
      <div className={`relative mx-auto max-w-xl overflow-hidden rounded-2xl shadow-lg transition-colors duration-300 ${over ? 'bg-good text-surface' : 'bg-ink text-bg'}`}>
        <div className="flex items-center gap-3 py-2.5 pl-4 pr-2">
          <div className="min-w-0 flex-1">
            <div className="disp text-[12px] font-bold uppercase tracking-[0.12em] opacity-80">{over ? 'Rest done · next set' : 'Resting'}</div>
            <div className="truncate text-[13px] opacity-80">{t.label}</div>
          </div>
          <div key={over ? 'go' : 'run'} className={`poster text-[30px] leading-none ${over ? 'anim-pop' : ''}`} style={{ fontVariantNumeric: 'tabular-nums' }}>{over ? 'GO' : mmss(left)}</div>
          <button className="h-11 rounded-xl border px-3 text-[13px] font-bold" style={{ borderColor: 'color-mix(in srgb, currentColor 35%, transparent)' }} onClick={() => onAdd(15)}>+15s</button>
          <button className="h-11 rounded-xl bg-bg px-3 text-[13px] font-bold text-ink" onClick={onClose}>{over ? 'Close' : 'Skip'}</button>
        </div>
        <div className="absolute inset-x-0 bottom-0 h-1"><div className="h-1 bg-hot transition-[width] duration-300 ease-linear" style={{ width: `${pct}%` }} /></div>
      </div>
    </div>
  );
}
