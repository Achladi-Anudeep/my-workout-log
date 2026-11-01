import { vi } from 'vitest';
import { createFakeSupabase, type FakeDb } from './fakeSupabase';

/**
 * One "device": a fresh copy of the app's store and sync engine with its own empty local storage,
 * talking to the shared fake database. Two devices = your phone and your laptop.
 */
let count = 0;

export async function device(db: FakeDb | null, user = { id: 'user-1', email: 'me@example.com' }) {
  // Each device gets its own saved-state key, like separate phones would have separate storage.
  (globalThis as any).__storeKey = `device-${++count}`;
  vi.resetModules();
  (globalThis as any).__fakeSupabase = db ? createFakeSupabase(db, user) : null;
  const store = await import('../../src/store/workout');
  const sync = await import('../../src/store/sync');
  if (db) {
    sync.Sync.init();
    await vi.waitFor(() => { if (!sync.useSync.getState().email) throw new Error('not signed in yet'); });
  }
  return {
    store,
    sync,
    act: store.act,
    state: () => store.useWorkout.getState(),
    syncState: () => sync.useSync.getState(),
    /** Run sync until nothing is waiting to upload. */
    async settle() {
      for (let i = 0; i < 20; i++) {
        await sync.Sync.syncNow();
        await new Promise(r => setTimeout(r, 5));
        const s = store.useWorkout.getState();
        const waiting = s.pendingUp.length + s.pendingDel.length + s.pendingWUp.length + s.pendingWDel.length
          + s.pendingRUp.length + s.pendingRDel.length + (s.settingsDirty ? 1 : 0) + (s.activeRoutineDirty ? 1 : 0);
        if (!waiting && sync.useSync.getState().mode === 'synced') return;
      }
      throw new Error(`sync did not settle: ${JSON.stringify(sync.useSync.getState())}`);
    },
  };
}

/** Log a quick workout: start the given day, tick the first set of the first exercise, save. */
export function logWorkout(d: Awaited<ReturnType<typeof device>>, dayId: 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' = 'mon') {
  d.act().start(dayId);
  const a = d.state().active!;
  const first = a.day!.exercises[0];
  d.act().edit(first.id, 0, { w: '22.5', r: '12', done: true });
  d.act().finish(15, 'test note');
  return d.state().sessions[0];
}
