import { describe, expect, it } from 'vitest';
import { advise, dropWeight } from '../../src/lib/coach';
import type { Exercise, Session } from '../../src/types';

const DAY = 86400000;
const NOW = 100 * DAY;
const ex = (p: Partial<Exercise> = {}): Exercise => ({
  id: 'row', name: 'Row', sets: 3, min: 10, max: 12, unit: 'reps', start: 10, wNote: '10–12 kg', rest: 90, cue: '', ...p,
});
const s = (daysAgo: number, sets: [number | null, number][], id = 'row'): Session => ({
  id: `s${daysAgo}`, dayId: 'mon', date: '2026-01-01', startedAt: NOW - daysAgo * DAY, mins: 40, cardio: 0, note: '',
  ex: [{ id, name: 'Row', unit: 'reps', sets: sets.map(([w, r]) => ({ w, r })) }],
});
const a = (sessions: Session[], e = ex(), deload = false) => advise(sessions, e, { now: NOW, deload });

describe('weight coach', () => {
  it('starts new exercises at the plan weight', () => {
    expect(a([])).toMatchObject({ kind: 'new', weight: 10 });
  });
  it('adds weight once every set hits the top of the range', () => {
    expect(a([s(2, [[10, 12], [10, 12], [10, 12]])])).toMatchObject({ kind: 'up', weight: 10.5 }); // +5%, rounded to 0.5 kg
  });
  it('stays and adds reps while building', () => {
    const r = a([s(2, [[10, 12], [10, 11], [10, 10]])]);
    expect(r).toMatchObject({ kind: 'hold', weight: 10 });
    expect(r.detail).toContain('12, 12, 11');
  });
  it('holds after one bad workout, drops after two in a row', () => {
    const bad = s(2, [[20, 8], [20, 7], [20, 9]]);
    expect(a([bad])).toMatchObject({ kind: 'hold', weight: 20 });
    expect(a([bad, s(5, [[20, 9], [20, 8], [20, 8]])])).toMatchObject({ kind: 'down', weight: 18 });
    // a bad day right after going up is not two in a row at that weight
    expect(a([bad, s(5, [[18, 8], [18, 8], [18, 8]])]).kind).toBe('hold');
  });
  it('goes lighter in an easy week and after a long break', () => {
    expect(a([s(2, [[20, 12], [20, 12], [20, 12]])], ex(), true)).toMatchObject({ kind: 'easy-week', weight: 16 });
    expect(a([s(30, [[20, 11], [20, 11], [20, 11]])])).toMatchObject({ kind: 'comeback', weight: 18 });
  });
  it('bodyweight and timed moves get "harder" or "longer" instead of weight', () => {
    const bw = ex({ start: null });
    expect(a([s(2, [[null, 12], [null, 12], [null, 12]])], bw).kind).toBe('harder');
    const plank = ex({ start: null, unit: 'sec', min: 45, max: 60 });
    const r = a([s(2, [[null, 60], [null, 60], [null, 60]])], plank);
    expect(r.title).toBe('Hold longer');
    expect(a([s(2, [[null, 40], [null, 50], [null, 45]])], plank).detail).toContain('55s');
  });
  it('drops ~10%, at least 1 kg, in 0.5 kg steps', () => {
    expect(dropWeight(5)).toBe(4);
    expect(dropWeight(20)).toBe(18);
    expect(dropWeight(12.5)).toBe(11.5);
  });

  it('assisted machines progress by taking help away', () => {
    const pull = ex({ id: 'assisted-pull-up', start: 35, min: 8, max: 12, assisted: true });
    expect(a([s(2, [[35, 12], [35, 12], [35, 12]])], pull)).toMatchObject({ kind: 'up', weight: 30, title: 'Less help · 30 kg' });
    const bad = s(2, [[30, 6], [30, 6], [30, 7]]);
    expect(a([bad, s(5, [[30, 7], [30, 6], [30, 6]])], pull)).toMatchObject({ kind: 'down', weight: 35 });
    expect(a([s(2, [[5, 12], [5, 12], [5, 12]])], pull).title).toBe('Try it without help');
    // an older copy of dips without the flag is still treated as assisted
    const dips = ex({ id: 'dips', start: null, min: 10, max: 12 });
    expect(a([s(2, [[20, 12], [20, 12], [20, 12]])], dips)).toMatchObject({ kind: 'up', weight: 15 });
  });

  it('a barbell exercise done with bodyweight that day is coached as bodyweight, not "0 kg"', () => {
    const squat = ex({ id: 'squat', start: 20 });
    const r = a([s(2, [[null, 12], [null, 12], [null, 12]])], squat);
    expect(r.kind).toBe('harder');
    expect(r.title).not.toContain('kg');
  });

  it('band exercises suggest more band tension', () => {
    const row = ex({ id: 'band-row', start: null, wNote: 'Tube band around your feet' });
    expect(a([s(2, [[null, 12], [null, 12], [null, 12]])], row).title).toBe('More band tension');
  });
});
