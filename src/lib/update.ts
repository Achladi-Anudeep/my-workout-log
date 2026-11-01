import { create } from 'zustand';
import { registerSW } from 'virtual:pwa-register';
import { useWorkout } from '../store/workout';

/** True once a new version of the app has downloaded and is waiting to take over. */
export const useUpdate = create<{ ready: boolean }>(() => ({ ready: false }));

let apply: ((reload?: boolean) => Promise<void>) | null = null;
const loadedAt = Date.now();

/**
 * Reload into a new version only when it can't interrupt anything:
 * right after launch, or while the app is in the background, and never during a workout.
 * Otherwise a "New version ready" bar lets you reload when it suits you.
 */
function applyIfQuiet() {
  if (!apply || !useUpdate.getState().ready || useWorkout.getState().active) return;
  if (Date.now() - loadedAt < 15000 || document.visibilityState === 'hidden') void apply(true);
}

export function startUpdates() {
  if (!('serviceWorker' in navigator)) return;
  apply = registerSW({
    immediate: true,
    onNeedRefresh() { useUpdate.setState({ ready: true }); applyIfQuiet(); },
    onRegisteredSW(_url, reg) {
      // Check for a new version every 30 minutes while the app stays open.
      if (reg) setInterval(() => { void reg.update(); }, 30 * 60 * 1000);
    },
  });
  document.addEventListener('visibilitychange', applyIfQuiet);
}

export function reloadNow() { if (apply) void apply(true); }
