import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { PhotoStore } from '../lib/photoStore';
import { act, useWorkout, type RemoteRoutineRow, type RemoteRow, type RemoteWeightRow } from './workout';

export type SyncMode = 'unconfigured' | 'signed-out' | 'syncing' | 'synced' | 'offline';

interface SyncState { mode: SyncMode; email: string | null; lastSync: number | null; error: string | null; }
export const useSync = create<SyncState>(() => ({ mode: supabase ? 'signed-out' : 'unconfigured', email: null, lastSync: null, error: null }));
const patch = (p: Partial<SyncState>) => useSync.setState(p);

let userId: string | null = null;
let running = false;
let again = false;
let chained = 0;
let retryTimer: ReturnType<typeof setTimeout> | undefined;

/** False once the weights table turns out to be missing, so a not-yet-run migration never blocks workout sync. */
let weightsReady = true;

async function syncWeights() {
  if (!supabase || !userId) return;
  try {
    for (const id of [...act().pendingWUp]) {
      const w = act().weights.find(x => x.id === id);
      if (!w) { act().markWeightUploaded(id); continue; }
      const { error } = await supabase.from('weights').upsert({
        id: w.id, user_id: userId, at: w.at, kg: w.kg, deleted: false, updated_at: new Date().toISOString(),
      });
      if (error) throw error;
      act().markWeightUploaded(id);
    }
    for (const id of [...act().pendingWDel]) {
      const { error } = await supabase.from('weights').upsert({
        id, user_id: userId, at: 0, kg: null, deleted: true, updated_at: new Date().toISOString(),
      });
      if (error) throw error;
      act().markWeightDeleted(id);
    }
    const { data, error } = await supabase.from('weights').select('id, at, kg, deleted').order('at', { ascending: true });
    if (error) throw error;
    act().applyRemoteWeights((data ?? []) as RemoteWeightRow[]);
    weightsReady = true;
  } catch (err: any) {
    // 42P01 / PGRST205 = table not created yet. Keep weights on this device and carry on.
    const missing = err?.code === '42P01' || err?.code === 'PGRST205' || /could not find the table|does not exist/i.test(err?.message ?? '');
    if (missing) { weightsReady = false; return; }
    throw err;
  }
}

/** False while the routines table is missing; routines then stay on this device. */
let routinesReady = true;
const activeRowId = () => `active-${userId}`;
/** Machine-settings notes share the routines table as one row per account (no extra table to set up). */
const notesRowId = () => `notes-${userId}`;

async function syncRoutines() {
  if (!supabase || !userId) return;
  try {
    const now = () => new Date().toISOString();
    for (const id of [...act().pendingRUp]) {
      const r = act().routines.find(x => x.id === id);
      if (!r) { act().markRoutineUploaded(id); continue; }
      const { error } = await supabase.from('routines').upsert({ id: r.id, user_id: userId, data: r, deleted: false, updated_at: now() });
      if (error) throw error;
      act().markRoutineUploaded(id);
    }
    for (const id of [...act().pendingRDel]) {
      const { error } = await supabase.from('routines').upsert({ id, user_id: userId, data: null, deleted: true, updated_at: now() });
      if (error) throw error;
      act().markRoutineDeleted(id);
    }
    if (act().activeRoutineDirty) {
      const { error } = await supabase.from('routines').upsert({
        id: activeRowId(), user_id: userId, data: { activeId: act().activeRoutineId }, deleted: false, updated_at: now(),
      });
      if (error) throw error;
      act().markActiveRoutineSaved();
    }
    const notesVersion = act().notesVersion;
    if (notesVersion !== act().notesSyncedVersion) {
      const { error } = await supabase.from('routines').upsert({
        id: notesRowId(), user_id: userId, data: { notes: act().machineNotes }, deleted: false, updated_at: now(),
      });
      if (error) throw error;
      act().markNotesSaved(notesVersion);
    }
    const { data, error } = await supabase.from('routines').select('id, data, deleted');
    if (error) throw error;
    const rows = (data ?? []) as { id: string; data: any; deleted: boolean }[];
    const activeRow = rows.find(r => r.id === activeRowId());
    const notesRow = rows.find(r => r.id === notesRowId());
    act().applyRemoteRoutines(rows.filter(r => r.id !== activeRowId() && r.id !== notesRowId()) as RemoteRoutineRow[], activeRow?.data?.activeId ?? null);
    act().applyRemoteNotes(notesRow?.data?.notes ?? null);
    routinesReady = true;
  } catch (err: any) {
    const missing = err?.code === '42P01' || err?.code === 'PGRST205' || /could not find the table|does not exist/i.test(err?.message ?? '');
    if (missing) { routinesReady = false; return; }
    throw err;
  }
}

/** False while the photos table is missing; photos then stay on this device. */
let photosReady = true;
const photoRowId = (exId: string) => `${userId}:${exId}`;

async function syncPhotos() {
  if (!supabase || !userId) return;
  try {
    const now = () => new Date().toISOString();
    for (const exId of [...act().pendingPUp]) {
      const at = act().photos[exId];
      const data = at != null ? await PhotoStore.get(exId) : null;
      if (at == null || !data) { act().markPhotoUploaded(exId); continue; }
      const { error } = await supabase.from('photos').upsert({ id: photoRowId(exId), user_id: userId, ex_id: exId, data, at, deleted: false, updated_at: now() });
      if (error) throw error;
      act().markPhotoUploaded(exId);
    }
    for (const exId of [...act().pendingPDel]) {
      const { error } = await supabase.from('photos').upsert({ id: photoRowId(exId), user_id: userId, ex_id: exId, data: null, at: Date.now(), deleted: true, updated_at: now() });
      if (error) throw error;
      act().markPhotoDeleted(exId);
    }
    // Pull only the list first; download an image only when it's newer than the one on this device.
    const { data, error } = await supabase.from('photos').select('id, ex_id, at, deleted');
    if (error) throw error;
    const rows = (data ?? []) as { id: string; ex_id: string; at: number; deleted: boolean }[];
    const remote = new Set(rows.map(r => r.ex_id));
    for (const r of rows) {
      const s = act();
      if (s.pendingPUp.includes(r.ex_id) || s.pendingPDel.includes(r.ex_id)) continue;
      const local = s.photos[r.ex_id];
      if (r.deleted) {
        if (local != null && local <= Number(r.at)) { await PhotoStore.del(r.ex_id); act().photoGone(r.ex_id); }
      } else if (local == null || Number(r.at) > local) {
        const { data: one, error: e2 } = await supabase.from('photos').select('data').eq('id', r.id).maybeSingle();
        if (e2) throw e2;
        if (one?.data) { await PhotoStore.put(r.ex_id, one.data as string); act().photoArrived(r.ex_id, Number(r.at)); }
      } else if (Number(r.at) < local) {
        act().setPhoto(r.ex_id, local); // this device has the newer one
      }
    }
    // Photos taken before signing in, or on a device that was offline, go up too.
    for (const exId of Object.keys(act().photos)) if (!remote.has(exId)) act().setPhoto(exId, act().photos[exId]);
    photosReady = true;
  } catch (err: any) {
    const missing = err?.code === '42P01' || err?.code === 'PGRST205' || /could not find the table|does not exist/i.test(err?.message ?? '');
    if (missing) { photosReady = false; return; }
    throw err;
  }
}

/** Push pending changes, then pull everything. Safe to call often; calls coalesce. */
async function syncNow() {
  if (!supabase || !userId) return;
  if (running) { again = true; return; }
  running = true;
  patch({ mode: 'syncing', error: null });
  try {
    const s = act();

    for (const id of [...s.pendingUp]) {
      const sess = act().sessions.find(x => x.id === id);
      if (!sess) { act().markUploaded(id); continue; }
      const { error } = await supabase.from('sessions').upsert({
        id: sess.id, user_id: userId, started_at: sess.startedAt, data: sess, deleted: false, updated_at: new Date().toISOString(),
      });
      if (error) throw error;
      act().markUploaded(id);
    }

    for (const id of [...act().pendingDel]) {
      const { error } = await supabase.from('sessions').upsert({
        id, user_id: userId, started_at: 0, data: null, deleted: true, updated_at: new Date().toISOString(),
      });
      if (error) throw error;
      act().markDeleted(id);
    }

    if (act().settingsDirty) {
      const { error } = await supabase.from('settings').upsert({ user_id: userId, start_date: act().startDate, updated_at: new Date().toISOString() });
      if (error) throw error;
      act().markSettingsSaved();
    }

    const [{ data: rows, error: e1 }, { data: settings, error: e2 }] = await Promise.all([
      supabase.from('sessions').select('id, data, deleted').order('started_at', { ascending: false }),
      supabase.from('settings').select('start_date').maybeSingle(),
    ]);
    if (e1) throw e1;
    if (e2) throw e2;
    act().applyRemote((rows ?? []) as RemoteRow[], (settings?.start_date as string | undefined) ?? null);

    await syncWeights();
    await syncRoutines();
    await syncPhotos();

    // applyRemote may have queued items that were only on this device
    if (act().pendingUp.length || (weightsReady && act().pendingWUp.length)
      || (routinesReady && (act().pendingRUp.length || act().notesVersion !== act().notesSyncedVersion))
      || (photosReady && (act().pendingPUp.length || act().pendingPDel.length))) again = true;
    patch({ mode: 'synced', lastSync: Date.now() });
  } catch (err: any) {
    const offline = typeof navigator !== 'undefined' && !navigator.onLine;
    patch({ mode: 'offline', error: offline ? null : (err?.message ?? 'Sync failed') });
    clearTimeout(retryTimer);
    retryTimer = setTimeout(() => void syncNow(), 20000);
  } finally {
    running = false;
    // Chain at most a few rounds back to back, so a row the server keeps rejecting can't spin forever.
    if (again && chained < 3) { again = false; chained++; void syncNow(); }
    else { again = false; chained = 0; }
  }
}

/** Routine edits come in bursts (typing a name, tapping steppers): wait for a short pause before uploading. */
let debounce: ReturnType<typeof setTimeout> | undefined;
function scheduleSync() {
  clearTimeout(debounce);
  debounce = setTimeout(() => void syncNow(), 800);
}

function onSignedIn(id: string, email: string | null) {
  userId = id;
  patch({ email, mode: 'syncing' });
  void syncNow();
}

export const Sync = {
  init() {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => {
      const u = data.session?.user;
      if (u) onSignedIn(u.id, u.email ?? null);
    });
    supabase.auth.onAuthStateChange((_event, session) => {
      const u = session?.user;
      if (u && u.id !== userId) onSignedIn(u.id, u.email ?? null);
      if (!u) { userId = null; patch({ mode: 'signed-out', email: null }); }
    });

    // Push as soon as something changes locally
    useWorkout.subscribe((s, prev) => {
      const changed = s.pendingUp !== prev.pendingUp || s.pendingDel !== prev.pendingDel
        || s.pendingWUp !== prev.pendingWUp || s.pendingWDel !== prev.pendingWDel || (s.settingsDirty && !prev.settingsDirty)
        || s.pendingRUp !== prev.pendingRUp || s.pendingRDel !== prev.pendingRDel || (s.activeRoutineDirty && !prev.activeRoutineDirty)
        || s.routines !== prev.routines || s.notesVersion !== prev.notesVersion
        || s.pendingPUp !== prev.pendingPUp || s.pendingPDel !== prev.pendingPDel;
      const hasWork = s.pendingUp.length || s.pendingDel.length || s.pendingWUp.length || s.pendingWDel.length || s.settingsDirty
        || s.pendingRUp.length || s.pendingRDel.length || s.activeRoutineDirty || s.notesVersion !== s.notesSyncedVersion
        || s.pendingPUp.length || s.pendingPDel.length;
      if (changed && hasWork) scheduleSync();
    });

    // Pull when the app comes back to the foreground or the network returns (laptop review, phone unlock)
    window.addEventListener('online', () => void syncNow());
    window.addEventListener('focus', () => void syncNow());
    document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') void syncNow(); });
    setInterval(() => { if (document.visibilityState === 'visible') void syncNow(); }, 60000);
  },

  syncNow,

  async signIn(email: string, password: string) {
    if (!supabase) throw new Error('Sync is not set up for this site yet.');
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  },

  async signUp(email: string, password: string) {
    if (!supabase) throw new Error('Sync is not set up for this site yet.');
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
    return { needsConfirm: !data.session };
  },

  async signOut() {
    await supabase?.auth.signOut();
  },
};
