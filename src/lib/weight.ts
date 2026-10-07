import type { WeightEntry } from '../types';

const DAY = 86400000;

/** Mean of all weigh-ins in the 7 days up to and including each entry. Smooths daily water swings. */
export function withRollingAvg(entries: WeightEntry[]) {
  return entries.map((e, i) => {
    let sum = 0, n = 0;
    for (let j = i; j >= 0 && e.at - entries[j].at < 7 * DAY; j--) { sum += entries[j].kg; n++; }
    return { ...e, avg: sum / n };
  });
}

/** Average of weigh-ins inside [from, to). null when there are none. */
export function avgBetween(entries: WeightEntry[], from: number, to: number) {
  const xs = entries.filter(e => e.at >= from && e.at < to);
  return xs.length ? xs.reduce((a, e) => a + e.kg, 0) / xs.length : null;
}

export const fmtKg = (kg: number) => kg.toFixed(1);
export const fmtDelta = (d: number) => `${d > 0 ? '+' : d < 0 ? '−' : '±'}${Math.abs(d).toFixed(1)}`;
export const fmtWhen = (at: number) =>
  new Date(at).toLocaleString(undefined, { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });
export { DAY };
