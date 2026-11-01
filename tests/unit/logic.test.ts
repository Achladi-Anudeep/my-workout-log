import { afterEach, describe, expect, it, vi } from 'vitest';
import { fmtW, isoDay, nextWeight, programWeek, progressStatus, range, volumeOf } from '../../src/lib/utils';
import { avgBetween, fmtDelta, withRollingAvg } from '../../src/lib/weight';
import type { Exercise, Session } from '../../src/types';

const ex = (p: Partial<Exercise> = {}): Exercise => ({
  id: 'bench', name: 'Bench', sets: 3, min: 8, max: 12, unit: 'reps', start: 20, wNote: '20 kg', rest: 90, cue: '', ...p,
});
const session = (id: string, at: number, sets: { w: number | null; r: number }[], exId = 'bench'): Session => ({
  id, dayId: 'mon', date: isoDay(new Date(at)), startedAt: at, mins: 45, cardio: 0, note: '',
  ex: [{ id: exId, name: 'Bench', unit: 'reps', sets }],
});

afterEach(() => vi.useRealTimers());

describe('progression rule', () => {
  it('is "new" when the exercise was never logged', () => {
    expect(progressStatus([], ex()).kind).toBe('new');
  });

  it('is ready to progress only when every set hits the top of the range', () => {
    const s = [session('a', 1, [{ w: 20, r: 12 }, { w: 20, r: 12 }, { w: 20, r: 12 }])];
    const st = progressStatus(s, ex());
    expect(st.kind).toBe('ready');
    expect(st.next).toBe(21); // under 10 kg steps of +1 kg, above that +5% → 20 * 1.05 = 21
  });

  it('keeps building reps if one set falls short', () => {
    const s = [session('a', 1, [{ w: 20, r: 12 }, { w: 20, r: 11 }, { w: 20, r: 12 }])];
    expect(progressStatus(s, ex()).kind).toBe('building');
  });

  it('needs the full number of sets', () => {
    const s = [session('a', 1, [{ w: 20, r: 12 }, { w: 20, r: 12 }])];
    expect(progressStatus(s, ex()).kind).toBe('building');
  });

  it('uses the most recent session (sessions are newest first)', () => {
    const s = [session('new', 2, [{ w: 22, r: 8 }]), session('old', 1, [{ w: 20, r: 12 }, { w: 20, r: 12 }, { w: 20, r: 12 }])];
    expect(progressStatus(s, ex()).last?.s.id).toBe('new');
  });

  it('suggests a harder variation for bodyweight moves', () => {
    const s = [session('a', 1, [{ w: null, r: 12 }, { w: null, r: 12 }, { w: null, r: 12 }])];
    const st = progressStatus(s, ex({ start: null }));
    expect(st.kind).toBe('ready');
    expect(st.next).toBeNull();
  });

  it('steps small weights by 1 kg and larger ones by about 5%, rounded to 0.5 kg', () => {
    expect(nextWeight(4)).toBe(5);
    expect(nextWeight(15)).toBe(16);   // 15.75 → 16
    expect(nextWeight(20)).toBe(21);
    expect(nextWeight(30)).toBe(31.5);
  });
});

describe('formatting', () => {
  it('formats ranges, holds and per-side work', () => {
    expect(range(ex())).toBe('8–12');
    expect(range(ex({ min: 15, max: 15 }))).toBe('15');
    expect(range(ex({ unit: 'sec', min: 30, max: 45 }))).toBe('30–45s');
    expect(range(ex({ min: 12, max: 12, perSide: true }))).toBe('12/side');
  });

  it('shows bodyweight as BW', () => {
    expect(fmtW(null)).toBe('BW');
    expect(fmtW(12.5)).toBe('12.5');
  });

  it('counts volume for weighted rep sets only', () => {
    const s = session('a', 1, [{ w: 20, r: 10 }, { w: null, r: 10 }]);
    s.ex.push({ id: 'plank', name: 'Plank', unit: 'sec', sets: [{ w: null, r: 60 }] });
    expect(volumeOf(s)).toBe(200);
  });
});

describe('program week', () => {
  it('starts in calibration and moves to build in week 3', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-11-01T09:00:00'));
    expect(programWeek('2026-11-01')).toMatchObject({ week: 1, name: 'Calibration' });
    expect(programWeek('2026-10-19')).toMatchObject({ week: 2, name: 'Calibration' });
    expect(programWeek('2026-10-18')).toMatchObject({ week: 3, name: 'Build' });
  });

  it('never shows a week before 1 for a future start date', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-11-01T09:00:00'));
    expect(programWeek('2026-12-01').week).toBe(1);
  });
});

describe('body weight', () => {
  const DAY = 86400000;
  const t0 = new Date('2026-10-01T07:00:00').getTime();
  const entries = [
    { id: '1', at: t0, kg: 66 },
    { id: '2', at: t0 + 3 * DAY, kg: 65 },
    { id: '3', at: t0 + 10 * DAY, kg: 64 },
  ];

  it('averages the 7 days up to each weigh-in', () => {
    const out = withRollingAvg(entries);
    expect(out[0].avg).toBe(66);
    expect(out[1].avg).toBe(65.5);
    expect(out[2].avg).toBe(64); // the first two are more than 7 days earlier
  });

  it('averages a time window and returns null when empty', () => {
    expect(avgBetween(entries, t0, t0 + 4 * DAY)).toBe(65.5);
    expect(avgBetween(entries, t0 + 20 * DAY, t0 + 30 * DAY)).toBeNull();
  });

  it('formats changes with a sign', () => {
    expect(fmtDelta(0.44)).toBe('+0.4');
    expect(fmtDelta(-1.26)).toBe('−1.3');
    expect(fmtDelta(0)).toBe('±0.0');
  });
});
