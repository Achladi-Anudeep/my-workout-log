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

describe('swapping an exercise when the machine is busy', () => {
  it('replaces it in the running workout, logs it under its own name, and can swap back', async () => {
    const d = await device(null);
    d.act().start('mon');
    d.act().edit('chest-press', 0, { w: '12.5', r: '15', done: true });
    const alt = { ...(await import('../../src/data/alternatives')).EXERCISE_LIBRARY.get('db-bench-press')! };
    d.act().swapExercise('chest-press', alt);
    let day = d.state().active!.day!;
    expect(day.exercises[0]).toMatchObject({ id: 'db-bench-press', sets: 3, swappedFor: { id: 'chest-press', name: 'Chest Press' } });
    expect(d.state().active!.logs['chest-press']).toBeUndefined();
    expect(d.state().active!.logs['db-bench-press'][0].w).toBe('6'); // its own starting weight

    // swap back restores the planned exercise
    const orig = (await import('../../src/data/alternatives')).EXERCISE_LIBRARY.get('chest-press')!;
    d.act().swapExercise('db-bench-press', orig);
    day = d.state().active!.day!;
    expect(day.exercises[0].id).toBe('chest-press');
    expect(day.exercises[0].swappedFor).toBeUndefined();

    d.act().swapExercise('chest-press', alt);
    d.act().edit('db-bench-press', 0, { w: '7', r: '12', done: true });
    d.act().finish(0, '');
    expect(d.state().sessions[0].ex[0]).toMatchObject({ id: 'db-bench-press', name: 'Dumbbell Bench Press', swappedFor: 'Chest Press' });
    // the routine itself is unchanged
    d.act().start('mon');
    expect(d.state().active!.day!.exercises[0].id).toBe('chest-press');
  });

  it('a swap inside a superset keeps the slot\'s rest, so A1 still goes straight into A2', async () => {
    const d = await device(null);
    d.act().setActiveRoutine('builtin-ppl-v2');
    d.act().start('thu');
    const pushdown = (await import('../../src/data/alternatives')).EXERCISE_LIBRARY.get('triceps-pushdown')!;
    expect(pushdown.rest).toBe(60);
    d.act().swapExercise('ss-triceps-ext', pushdown);
    const swapped = d.state().active!.day!.exercises.find(e => e.id === 'triceps-pushdown')!;
    expect(swapped).toMatchObject({ superset: 'A1', rest: 0 });
  });

  it('refuses a swap into an exercise already in the workout', async () => {
    const d = await device(null);
    d.act().start('mon');
    const incline = (await import('../../src/data/alternatives')).EXERCISE_LIBRARY.get('incline-press')!;
    d.act().swapExercise('chest-press', incline);
    expect(d.state().active!.day!.exercises.map(e => e.id).filter(id => id === 'incline-press')).toHaveLength(1);
  });
});

describe('machine settings notes', () => {
  it('saves a note per exercise and marks it for sync', async () => {
    const d = await device(null);
    d.act().setMachineNote('leg-press', 'Seat 3, feet mid-platform');
    expect(d.state().machineNotes['leg-press'].text).toBe('Seat 3, feet mid-platform');
    expect(d.state().notesVersion).not.toBe(d.state().notesSyncedVersion);
  });

  it('merges notes from another device, newest edit wins per exercise', async () => {
    const d = await device(null);
    d.act().setMachineNote('a', 'mine new');
    const mine = d.state().machineNotes['a'].at;
    d.act().applyRemoteNotes({ a: { text: 'old remote', at: mine - 1000 }, b: { text: 'remote only', at: 5 } });
    expect(d.state().machineNotes).toMatchObject({ a: { text: 'mine new' }, b: { text: 'remote only' } });
    d.act().applyRemoteNotes({ a: { text: 'newer remote', at: mine + 1000 } });
    expect(d.state().machineNotes['a'].text).toBe('newer remote');
  });
});

describe('training at home', () => {
  it('starts and logs the home version of a day, and remembers the pick for that weekday', async () => {
    const d = await device(null);
    d.act().setVenuePick('mon', 'home');
    d.act().start('mon', false, 'home');
    const a = d.state().active!;
    expect(a.venue).toBe('home');
    expect(a.day!.title).toBe('Home Push');
    expect(a.day!.exercises[0].id).toBe('stand-push-up');
    d.act().edit('stand-push-up', 0, { r: '12', done: true });
    d.act().finish(0, '');
    expect(d.state().sessions[0]).toMatchObject({ venue: 'home', title: 'Home Push', dayId: 'mon' });
    expect(d.state().venuePick.mon).toBe('home');
  });

  it('a copied routine keeps its home days; a gym start stays a gym workout', async () => {
    const d = await device(null);
    const id = d.act().createRoutine('Mine', 'builtin-ppl-v2');
    expect(d.state().routines.find(r => r.id === id)!.homeDays?.tue?.title).toBe('Home Pull · Hinge');
    d.act().start('tue');
    expect(d.state().active!.venue).toBeUndefined();
  });
});
