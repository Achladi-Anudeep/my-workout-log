import { describe, expect, it, vi } from 'vitest';
import { device, logWorkout } from './device';
import { BUILTIN_ID, BUILTIN_V2_ID } from '../../src/lib/routines';

vi.mock('../../src/lib/supabase', () => ({ get supabase() { return (globalThis as any).__fakeSupabase; } }));

describe('logging a workout (this device only)', () => {
  it('saves only ticked sets, with title, routine, cardio and note', async () => {
    const d = await device(null);
    d.act().start('mon');
    const a = d.state().active!;
    expect(a.routineId).toBe(BUILTIN_ID);
    d.act().edit('chest-press', 0, { w: '12.5', r: '15', done: true });
    d.act().edit('chest-press', 1, { w: '12.5', r: '14', done: false }); // not ticked → not saved
    d.act().finish(20, 'felt good');
    const s = d.state().sessions[0];
    expect(s).toMatchObject({ dayId: 'mon', title: 'Push', routineId: BUILTIN_ID, cardio: 20, note: 'felt good' });
    expect(s.ex).toEqual([{ id: 'chest-press', name: 'Chest Press', unit: 'reps', sets: [{ w: 12.5, r: 15 }] }]);
    expect(d.state().active).toBeNull();
    expect(d.state().pendingUp).toContain(s.id);
  });

  it('prefills weights from the last session, else the plan starting weight', async () => {
    const d = await device(null);
    d.act().start('mon');
    expect(d.state().active!.logs['chest-press'][0].w).toBe('10');
    d.act().edit('chest-press', 0, { w: '15', r: '15', done: true });
    d.act().finish(0, '');
    d.act().start('mon');
    expect(d.state().active!.logs['chest-press'][0].w).toBe('15');
    expect(d.state().active!.logs['dips'][0].w).toBe(''); // bodyweight
  });

  it('keeps a running workout unchanged when its routine is edited mid-session', async () => {
    const d = await device(null);
    const id = d.act().createRoutine('Mine', BUILTIN_ID);
    d.act().setActiveRoutine(id);
    d.act().start('wed');
    d.act().removeExercise(id, 'wed', 'wall-sit');
    expect(d.state().active!.day!.exercises.map(e => e.id)).toContain('wall-sit');
    d.act().edit('wall-sit', 0, { r: '40', done: true });
    d.act().finish(0, '');
    expect(d.state().sessions[0].ex[0].id).toBe('wall-sit');
  });

  it('adds and removes sets but never below one', async () => {
    const d = await device(null);
    d.act().start('mon');
    d.act().addSet('dips');
    expect(d.state().active!.logs['dips']).toHaveLength(4);
    for (let i = 0; i < 5; i++) d.act().removeSet('dips');
    expect(d.state().active!.logs['dips']).toHaveLength(1);
  });

  it('survives an app restart mid-workout (state is saved on the device)', async () => {
    const d = await device(null);
    d.act().start('fri');
    d.act().edit('plank', 0, { r: '60', done: true });
    const saved = localStorage.getItem((globalThis as any).__storeKey);
    expect(saved).toContain('plank');
    const parsed = JSON.parse(saved!);
    expect(parsed.state.active.dayId).toBe('fri');
  });
});

describe('routines', () => {
  it('never changes the built-in routines', async () => {
    const d = await device(null);
    d.act().renameRoutine(BUILTIN_ID, 'Hacked');
    d.act().removeExercise(BUILTIN_ID, 'mon', 'chest-press');
    d.act().deleteRoutine(BUILTIN_V2_ID);
    expect(d.state().routines).toEqual([]);
    d.act().start('mon');
    expect(d.state().active!.day!.exercises[0].id).toBe('chest-press');
  });

  it('copies, edits, reorders and deletes your own routine', async () => {
    const d = await device(null);
    const id = d.act().createRoutine('My PPL', BUILTIN_V2_ID);
    const ex = { id: 'custom-hip', name: 'Hip Thrust', sets: 3, min: 8, max: 12, unit: 'reps' as const, start: 20, wNote: '20 kg', rest: 90, cue: '' };
    d.act().saveExercise(id, 'wed', ex);
    d.act().moveExercise(id, 'wed', 7, 0);
    expect(d.state().routines[0].days.wed.exercises[0].id).toBe('custom-hip');
    d.act().updateDay(id, 'sun', { title: 'Mobility' });
    expect(d.state().routines[0].days.sun.title).toBe('Mobility');
    d.act().setActiveRoutine(id);
    d.act().deleteRoutine(id);
    expect(d.state().routines).toEqual([]);
    expect(d.state().activeRoutineId).toBe(BUILTIN_ID); // falls back to the original
  });

  it('lets you clear the name field while typing a new name', async () => {
    const d = await device(null);
    const id = d.act().createRoutine('Old');
    d.act().renameRoutine(id, '');
    expect(d.state().routines[0].name).toBe('');
    d.act().renameRoutine(id, 'New');
    expect(d.state().routines[0].name).toBe('New');
  });
});

describe('body weight', () => {
  it('keeps weigh-ins sorted by time and rounds to 0.01 kg', async () => {
    const d = await device(null);
    d.act().addWeight(65.456, 2000);
    d.act().addWeight(66, 1000);
    expect(d.state().weights.map(w => w.kg)).toEqual([66, 65.46]);
    d.act().deleteWeight(d.state().weights[0].id);
    expect(d.state().weights).toHaveLength(1);
    expect(d.state().pendingWDel).toHaveLength(1);
  });
});

it('logWorkout helper works', async () => {
  const d = await device(null);
  expect(logWorkout(d).ex[0].sets[0]).toEqual({ w: 22.5, r: 12 });
});
