import { describe, expect, it } from 'vitest';
import { advise } from '../../src/lib/coach';
import { isNewBest, platesFor, warmupSets } from '../../src/lib/lift';
import type { Exercise, Feel, Session } from '../../src/types';

const DAY = 86400000;
const NOW = 100 * DAY;
const ex = (p: Partial<Exercise> = {}): Exercise => ({
  id: 'press', name: 'Chest Press', sets: 3, min: 10, max: 12, unit: 'reps', start: 20, wNote: '20 kg', rest: 90, cue: '', ...p,
});
const s = (daysAgo: number, sets: [number | null, number, Feel?][], id = 'press'): Session => ({
  id: `s${daysAgo}`, dayId: 'mon', date: '2026-01-01', startedAt: NOW - daysAgo * DAY, mins: 40, cardio: 0, note: '',
  ex: [{ id, name: 'x', unit: 'reps', sets: sets.map(([w, r, feel]) => ({ w, r, ...(feel ? { feel } : {}) })) }],
});

describe('warm-up sets', () => {
  it('ramps up to the working weight in two lighter sets', () => {
    expect(warmupSets(ex(), 40)).toEqual([{ w: 20, r: 8 }, { w: 30, r: 4 }]);
  });
  it('starts a barbell lift with the empty bar', () => {
    expect(warmupSets(ex({ name: 'Barbell Squat', wNote: 'Empty bar' }), 40)).toEqual([{ w: 20, r: 10 }, { w: 28, r: 5 }]);
  });
  it('only uses weights the home kit can make, without repeats', () => {
    expect(warmupSets(ex({ loads: [2, 5, 10, 15] }), 10)).toEqual([{ w: 5, r: 8 }]);
    expect(warmupSets(ex({ loads: [2, 5, 10, 15] }), 15)).toEqual([{ w: 5, r: 8 }, { w: 10, r: 4 }]);
  });
  it('skips bodyweight, timed and assisted exercises', () => {
    expect(warmupSets(ex(), null)).toEqual([]);
    expect(warmupSets(ex({ unit: 'sec' }), 20)).toEqual([]);
    expect(warmupSets(ex({ id: 'assisted-pull-up', assisted: true }), 35)).toEqual([]);
  });
});

describe('plate helper', () => {
  it('says what goes on each end of a kit dumbbell', () => {
    expect(platesFor(5)).toBe('2.5 kg on each end');
    expect(platesFor(10)).toBe('5 kg on each end');
    expect(platesFor(15)).toBe('5 + 2.5 kg on each end');
    expect(platesFor(20)).toBe('5 + 5 kg on each end');
    expect(platesFor(2)).toBe('your fixed 2 kg dumbbell');
    expect(platesFor(7)).toBeNull();
    expect(platesFor(0)).toBeNull();
  });
});

describe('new best', () => {
  const hist = [s(3, [[20, 12], [20, 11]]), s(10, [[17.5, 12]])];
  it('heavier than ever, or more reps at the best weight', () => {
    expect(isNewBest(hist, ex(), 22.5, 8)).toBe(true);
    expect(isNewBest(hist, ex(), 20, 13)).toBe(true);
    expect(isNewBest(hist, ex(), 20, 12)).toBe(false);
    expect(isNewBest(hist, ex(), 17.5, 15)).toBe(false);
  });
  it('the first time is a start, not a best; bodyweight counts reps', () => {
    expect(isNewBest([], ex(), 20, 12)).toBe(false);
    const bw = [s(2, [[null, 10]])];
    expect(isNewBest(bw, ex({ start: null }), null, 11)).toBe(true);
    expect(isNewBest(bw, ex({ start: null }), null, 10)).toBe(false);
  });
});

describe('felt easy / hard', () => {
  const a = (sessions: Session[], e = ex()) => advise(sessions, e, { now: NOW });
  it('hit the top but it felt hard → repeat the weight', () => {
    expect(a([s(2, [[20, 12], [20, 12], [20, 12, 'hard']])])).toMatchObject({ kind: 'hold', weight: 20 });
  });
  it('every set easy and within a rep of the top → add weight a session early', () => {
    const r = a([s(2, [[20, 11, 'easy'], [20, 11, 'easy'], [20, 12, 'easy']])]);
    expect(r).toMatchObject({ kind: 'up' });
    expect(r.detail).toContain('felt easy');
  });
  it('unmarked sets behave as before', () => {
    expect(a([s(2, [[20, 12], [20, 12], [20, 12]])])).toMatchObject({ kind: 'up' });
    expect(a([s(2, [[20, 11], [20, 11], [20, 12]])])).toMatchObject({ kind: 'hold' });
  });
  it('home kit: hard holds; easy still respects big jumps (build reps first)', () => {
    const kit = ex({ loads: [2, 5, 10, 15], start: 10 });
    expect(a([s(2, [[10, 12], [10, 12], [10, 12, 'hard']])], kit)).toMatchObject({ kind: 'hold', weight: 10 });
    expect(a([s(2, [[10, 12, 'easy'], [10, 11, 'easy'], [10, 12, 'easy']])], kit)).toMatchObject({ kind: 'harder', weight: 10 }); // 10 → 15 is a big jump
    const small = ex({ loads: [10, 12.5, 15], start: 10 });
    expect(a([s(2, [[10, 12, 'easy'], [10, 11, 'easy'], [10, 12, 'easy']])], small)).toMatchObject({ kind: 'up', weight: 12.5 });
  });
});
