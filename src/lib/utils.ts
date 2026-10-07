import type { DayId, Exercise, Session } from '../types';

export const pad = (n: number) => String(n).padStart(2, '0');
export const isoDay = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const weekdayId = (d = new Date()): DayId => (['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as DayId[])[d.getDay()];
export const fmtDate = (iso: string) => new Date(iso + 'T00:00:00').toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' });
export const mmss = (s: number) => `${Math.floor(s / 60)}:${pad(Math.max(0, s % 60))}`;
export const fmtW = (w: number | null) => (w == null ? 'BW' : `${+w.toFixed(1)}`);
export const range = (e: Exercise) => (e.min === e.max ? `${e.min}` : `${e.min}–${e.max}`) + (e.unit === 'sec' ? 's' : '') + (e.perSide ? '/side' : '');
export const uid = () => (crypto?.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2) + Date.now().toString(36));
export const nextWeight = (w: number) => (w < 10 ? w + 1 : Math.round(w * 1.05 * 2) / 2);

export const volumeOf = (s: Session) =>
  s.ex.reduce((a, e) => a + (e.unit === 'reps' ? e.sets.reduce((b, x) => b + (x.w ?? 0) * x.r, 0) : 0), 0);

export function lastFor(sessions: Session[], exId: string) {
  for (const s of sessions) {
    const e = s.ex.find(x => x.id === exId);
    if (e && e.sets.length) return { s, e };
  }
  return null;
}

export function programWeek(startDate: string) {
  const days = Math.floor((new Date(isoDay() + 'T00:00:00').getTime() - new Date(startDate + 'T00:00:00').getTime()) / 86400000);
  const week = Math.max(1, Math.floor(days / 7) + 1);
  const phase = week <= 2
    ? { name: 'Calibration', rir: 'Stop each set with 3 reps left', tone: 'warn' as const }
    : { name: 'Build', rir: 'Stop each set with 1–2 reps left', tone: 'accent' as const };
  return { week, ...phase, deload: week > 2 && week % 7 === 0 };
}

export function progressStatus(sessions: Session[], e: Exercise) {
  const last = lastFor(sessions, e.id);
  if (!last) return { kind: 'new' as const, last: null, next: null };
  const sets = last.e.sets;
  const hitTop = sets.length >= e.sets && sets.slice(0, e.sets).every(s => s.r >= e.max);
  const w = sets[0].w;
  if (hitTop) return { kind: 'ready' as const, last, next: w != null ? nextWeight(w) : null };
  return { kind: 'building' as const, last, next: null };
}
