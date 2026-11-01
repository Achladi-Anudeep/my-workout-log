import { describe, expect, it, vi } from 'vitest';
import { createDb } from './fakeSupabase';
import { device, logWorkout } from './device';
import { BUILTIN_ID } from '../../src/lib/routines';

vi.mock('../../src/lib/supabase', () => ({ get supabase() { return (globalThis as any).__fakeSupabase; } }));

describe('sync between phone and laptop', () => {
  it('a workout logged on the phone shows up on the laptop, and a delete on the laptop reaches the phone', async () => {
    const db = createDb();
    const phone = await device(db);
    const s = logWorkout(phone);
    await phone.settle();
    expect(db.tables.sessions.get(s.id)).toMatchObject({ deleted: false, user_id: 'user-1' });

    const laptop = await device(db);
    await laptop.settle();
    expect(laptop.state().sessions.map(x => x.id)).toEqual([s.id]);
    expect(laptop.state().sessions[0].ex[0].sets[0]).toEqual({ w: 22.5, r: 12 });

    laptop.act().deleteSession(s.id);
    await laptop.settle();
    expect(db.tables.sessions.get(s.id)).toMatchObject({ deleted: true });

    await phone.settle();
    expect(phone.state().sessions).toEqual([]);
  });

  it('workouts logged with no signal upload once the connection is back', async () => {
    const db = createDb();
    const phone = await device(db);
    await phone.settle();
    db.offline = true;
    const s = logWorkout(phone);
    await phone.sync.Sync.syncNow();
    expect(phone.syncState().mode).toBe('offline');
    expect(phone.state().pendingUp).toContain(s.id);
    expect(phone.state().sessions).toHaveLength(1); // nothing lost locally

    db.offline = false;
    await phone.settle();
    expect(db.tables.sessions.get(s.id)).toBeTruthy();
  });

  it('syncs body weight, including deletes', async () => {
    const db = createDb();
    const phone = await device(db);
    phone.act().addWeight(65.4, Date.now() - 1000);
    phone.act().addWeight(65.1, Date.now());
    await phone.settle();

    const laptop = await device(db);
    await laptop.settle();
    expect(laptop.state().weights.map(w => w.kg)).toEqual([65.4, 65.1]);

    phone.act().deleteWeight(phone.state().weights[0].id);
    await phone.settle();
    await laptop.settle();
    expect(laptop.state().weights.map(w => w.kg)).toEqual([65.1]);
  });

  it('syncs routines, edits and the active routine', async () => {
    const db = createDb();
    const phone = await device(db);
    const id = phone.act().createRoutine('Phone routine', BUILTIN_ID);
    phone.act().setActiveRoutine(id);
    await phone.settle();

    const laptop = await device(db);
    await laptop.settle();
    expect(laptop.state().routines.map(r => r.name)).toEqual(['Phone routine']);
    expect(laptop.state().activeRoutineId).toBe(id);

    laptop.act().renameRoutine(id, 'Renamed on laptop');
    laptop.act().removeExercise(id, 'mon', 'dips');
    await laptop.settle();
    await phone.settle();
    expect(phone.state().routines[0].name).toBe('Renamed on laptop');
    expect(phone.state().routines[0].days.mon.exercises.map(e => e.id)).not.toContain('dips');

    phone.act().deleteRoutine(id);
    await phone.settle();
    await laptop.settle();
    expect(laptop.state().routines).toEqual([]);
    expect(laptop.state().activeRoutineId).toBe(BUILTIN_ID);
  });

  it('keeps an unsynced local routine edit instead of overwriting it with the server copy', async () => {
    const db = createDb();
    const phone = await device(db);
    const id = phone.act().createRoutine('Original');
    await phone.settle();
    db.offline = true;
    phone.act().renameRoutine(id, 'Edited offline');
    await phone.sync.Sync.syncNow();
    db.offline = false;
    await phone.settle();
    expect(phone.state().routines[0].name).toBe('Edited offline');
    expect(db.tables.routines.get(id)!.data.name).toBe('Edited offline');
  });

  it('syncs the program start date', async () => {
    const db = createDb();
    const phone = await device(db);
    phone.act().setStartDate('2026-10-05');
    await phone.settle();
    const laptop = await device(db);
    await laptop.settle();
    expect(laptop.state().startDate).toBe('2026-10-05');
  });

  it('a missing weights or routines table never blocks workout sync', async () => {
    const db = createDb();
    db.missing.add('weights');
    db.missing.add('routines');
    const phone = await device(db);
    const s = logWorkout(phone);
    phone.act().addWeight(65, Date.now());
    await phone.sync.Sync.syncNow();
    await vi.waitFor(() => expect(phone.syncState().mode).toBe('synced'));
    expect(db.tables.sessions.get(s.id)).toBeTruthy();
    expect(phone.state().weights).toHaveLength(1); // kept on the device
  });

  it('never sees another account\'s data', async () => {
    const db = createDb();
    const me = await device(db, { id: 'me', email: 'me@x.com' });
    logWorkout(me);
    await me.settle();
    const other = await device(db, { id: 'other', email: 'o@x.com' });
    await other.settle();
    expect(other.state().sessions).toEqual([]);
  });

  it('does not spin forever on a row the server keeps rejecting', async () => {
    const db = createDb();
    const phone = await device(db);
    await phone.settle();
    // A session the server accepts but never returns: it gets re-queued every round.
    db.dropUploads = true;
    logWorkout(phone);
    const before = db.calls;
    await phone.sync.Sync.syncNow();
    await new Promise(r => setTimeout(r, 200));
    expect(db.calls - before).toBeLessThan(60);
  });

  it('syncs machine settings notes between devices', async () => {
    const db = createDb();
    const phone = await device(db);
    phone.act().setMachineNote('leg-press', 'Seat 3');
    await phone.settle();
    const laptop = await device(db);
    await laptop.settle();
    expect(laptop.state().machineNotes['leg-press'].text).toBe('Seat 3');
    laptop.act().setMachineNote('leg-press', 'Seat 4');
    await laptop.settle();
    await phone.settle();
    expect(phone.state().machineNotes['leg-press'].text).toBe('Seat 4');
    // the notes row never shows up as a routine
    expect(phone.state().routines).toEqual([]);
  });
});
