import { useEffect } from 'react';

type Sentinel = { release: () => Promise<void>; addEventListener?: (t: string, f: () => void) => void };

/**
 * Keeps the phone screen on while `enabled` (during a workout), so it doesn't lock between sets.
 * iPhone releases the lock when the app goes to the background; it's requested again on return.
 * Silently does nothing where the browser doesn't support it.
 */
export function useWakeLock(enabled: boolean) {
  useEffect(() => {
    const wl = (navigator as Navigator & { wakeLock?: { request: (t: 'screen') => Promise<Sentinel> } }).wakeLock;
    if (!enabled || !wl) return;
    let sentinel: Sentinel | null = null;
    let cancelled = false;
    const request = async () => {
      if (document.visibilityState !== 'visible' || cancelled) return;
      try { sentinel = await wl.request('screen'); } catch { /* denied or unsupported: fine */ }
    };
    const onVisible = () => { if (document.visibilityState === 'visible') void request(); };
    void request();
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', onVisible);
      void sentinel?.release().catch(() => {});
    };
  }, [enabled]);
}
