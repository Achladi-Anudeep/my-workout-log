import { useEffect, useRef, useState } from 'react';
import { fmtKg, fmtWhen } from '../lib/weight';

interface Pt { id: string; at: number; kg: number; avg: number; }

/** Weigh-ins as dots, 7-day average as a line. One y-axis (kg). Tap or drag to inspect a point. */
export default function WeightChart({ pts }: { pts: Pt[] }) {
  const wrap = useRef<HTMLDivElement>(null);
  const [w, setW] = useState(340);
  const [hover, setHover] = useState<number | null>(null);

  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setW(Math.max(240, Math.round(e.contentRect.width))));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  useEffect(() => setHover(null), [pts]);

  const H = 190, L = 40, R = 12, T = 12, B = 26;
  const iw = w - L - R, ih = H - T - B;

  const vals = pts.flatMap(p => [p.kg, p.avg]);
  let lo = Math.min(...vals), hi = Math.max(...vals);
  // Pad to whole-kg bounds with at least 2 kg of range so tiny swings don't look dramatic.
  lo = Math.floor(lo - 0.3); hi = Math.ceil(hi + 0.3);
  if (hi - lo < 2) { const mid = (hi + lo) / 2; lo = Math.floor(mid - 1); hi = Math.ceil(mid + 1); }
  const step = hi - lo > 8 ? 2 : hi - lo > 4 ? 1 : 0.5;
  const ticks: number[] = [];
  for (let v = lo; v <= hi + 1e-9; v += step) ticks.push(+v.toFixed(1));

  const t0 = pts[0].at, t1 = pts[pts.length - 1].at;
  const span = Math.max(t1 - t0, 1);
  const x = (at: number) => (pts.length === 1 ? L + iw / 2 : L + ((at - t0) / span) * iw);
  const y = (kg: number) => T + (1 - (kg - lo) / (hi - lo)) * ih;

  const avgPath = pts.map((p, i) => `${i ? 'L' : 'M'}${x(p.at).toFixed(1)},${y(p.avg).toFixed(1)}`).join(' ');
  const fmtAxis = (at: number) => new Date(at).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
  const xLabels = pts.length > 1 ? [t0, t0 + span / 2, t1] : [t0];

  const pick = (clientX: number) => {
    const r = wrap.current?.getBoundingClientRect();
    if (!r) return;
    const px = clientX - r.left;
    let best = 0, bd = Infinity;
    pts.forEach((p, i) => { const d = Math.abs(x(p.at) - px); if (d < bd) { bd = d; best = i; } });
    setHover(best);
  };

  const hp = hover != null ? pts[hover] : null;
  const tipLeft = hp ? Math.min(Math.max(x(hp.at) - 70, 0), w - 140) : 0;

  return (
    <div ref={wrap} className="relative w-full select-none" style={{ touchAction: 'pan-y' }}
      onPointerDown={e => pick(e.clientX)} onPointerMove={e => { if (e.pointerType === 'mouse' || e.buttons) pick(e.clientX); }}
      onPointerLeave={e => { if (e.pointerType === 'mouse') setHover(null); }}>
      <svg width={w} height={H} viewBox={`0 0 ${w} ${H}`} role="img" aria-label={`Body weight from ${fmtAxis(t0)} to ${fmtAxis(t1)}`}>
        {ticks.map(v => (
          <g key={v}>
            <line x1={L} x2={w - R} y1={y(v)} y2={y(v)} stroke="var(--line)" strokeWidth="1" />
            <text x={L - 6} y={y(v) + 4} textAnchor="end" fontSize="11" fill="var(--muted)" className="num">{step < 1 ? v.toFixed(1) : v}</text>
          </g>
        ))}
        {xLabels.map((t, i) => (
          <text key={i} x={x(t)} y={H - 6} fontSize="11" fill="var(--muted)"
            textAnchor={xLabels.length === 1 ? 'middle' : i === 0 ? 'start' : i === xLabels.length - 1 ? 'end' : 'middle'}>{fmtAxis(t)}</text>
        ))}
        {hp && <line x1={x(hp.at)} x2={x(hp.at)} y1={T} y2={T + ih} stroke="var(--muted)" strokeWidth="1" strokeDasharray="3 3" />}
        {pts.length > 1 && <path d={avgPath} fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />}
        {pts.map((p, i) => (
          <circle key={p.id} cx={x(p.at)} cy={y(p.kg)} r={hover === i ? 5.5 : 4}
            fill={hover === i ? 'var(--ink)' : 'var(--muted)'} stroke="var(--surface)" strokeWidth="2" />
        ))}
      </svg>
      {hp && (
        <div className="pointer-events-none absolute top-0 w-[140px] rounded-lg border border-line bg-surface px-2.5 py-1.5 text-[12px] shadow-lg" style={{ left: tipLeft }}>
          <div className="text-muted">{fmtWhen(hp.at)}</div>
          <div className="flex justify-between"><span>Weigh-in</span><span className="num font-bold">{fmtKg(hp.kg)} kg</span></div>
          <div className="flex justify-between"><span>7-day avg</span><span className="num font-bold">{fmtKg(hp.avg)}</span></div>
        </div>
      )}
    </div>
  );
}
