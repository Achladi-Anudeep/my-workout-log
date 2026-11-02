import { create } from 'zustand';

/** Day / night mode. "auto" follows the phone's own setting. Kept per device, like the phone setting itself. */
export type ThemePref = 'auto' | 'light' | 'dark';
const KEY = 'theme-pref';

const read = (): ThemePref => {
  try { const v = localStorage.getItem(KEY); return v === 'light' || v === 'dark' ? v : 'auto'; } catch { return 'auto'; }
};

const darkQuery = () => (typeof matchMedia === 'function' ? matchMedia('(prefers-color-scheme: dark)') : null);

/** Puts the choice on <html> and colours the iPhone status bar area to match. */
export function applyTheme(pref: ThemePref) {
  const root = document.documentElement;
  if (pref === 'auto') root.removeAttribute('data-theme'); else root.setAttribute('data-theme', pref);
  const dark = pref === 'dark' || (pref === 'auto' && !!darkQuery()?.matches);
  for (const m of document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]')) {
    m.setAttribute('content', dark ? '#0D0F13' : '#F1F3F6');
    m.removeAttribute('media');
  }
}

export const useTheme = create<{ pref: ThemePref; set: (p: ThemePref) => void }>(set => ({
  pref: read(),
  set: pref => {
    try { if (pref === 'auto') localStorage.removeItem(KEY); else localStorage.setItem(KEY, pref); } catch { /* private mode */ }
    applyTheme(pref);
    set({ pref });
  },
}));

export function initTheme() {
  applyTheme(useTheme.getState().pref);
  darkQuery()?.addEventListener?.('change', () => applyTheme(useTheme.getState().pref));
}
