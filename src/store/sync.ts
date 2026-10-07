import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { act, useWorkout, type RemoteRow, type RemoteWeightRow } from './workout';

export type SyncMode = 'unconfigured' | 'signed-out' | 'syncing' | 'synced' | 'offline';

interface SyncState { mode: SyncMode; email: string | null; lastSync: number | null; error: string | null; }
export const useSync = create<SyncState>(() => ({ mode: supabase ? 'signed-out' : 'unconfigured', email: null, lastSync: null, error: null }));
const patch = (p: Partial<SyncState>) => useSync.setState(p);

let userId: string | null = null;
let running = false;
let again = false;
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

    // applyRemote may have queued items that were only on this device
    if (act().pendingUp.length || (weightsReady && act().pendingWUp.length)) again = true;
    patch({ mode: 'synced', lastSync: Date.now() });
  } catch (err: any) {
    const offline = typeof navigator !== 'undefined' && !navigator.onLine;
    patch({ mode: 'offline', error: offline ? null : (err?.message ?? 'Sync failed') });
    clearTimeout(retryTimer);
    retryTimer = setTimeout(() => void syncNow(), 20000);
  } finally {
    running = false;
    if (again) { again = false; void syncNow(); }
  }
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
        || s.pendingWUp !== prev.pendingWUp || s.pendingWDel !== prev.pendingWDel || (s.settingsDirty && !prev.settingsDirty);
      const hasWork = s.pendingUp.length || s.pendingDel.length || s.pendingWUp.length || s.pendingWDel.length || s.settingsDirty;
      if (changed && hasWork) void syncNow();
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
