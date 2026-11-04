import { useTheme, type ThemePref } from '../lib/theme';

const OPTIONS: { id: ThemePref; label: string }[] = [
  { id: 'auto', label: 'Auto' },
  { id: 'light', label: '☀ Day' },
  { id: 'dark', label: '☾ Night' },
];

/** Day / night mode switch. Auto follows the phone. */
export default function ThemeCard() {
  const pref = useTheme(s => s.pref);
  const set = useTheme(s => s.set);
  return (
    <section className="rounded-2xl border border-line bg-surface px-4 py-3">
      <div className="label">Appearance</div>
      <div role="radiogroup" aria-label="Appearance" className="mt-2 grid grid-cols-3 gap-1 rounded-xl bg-sunk p-1">
        {OPTIONS.map(o => (
          <button key={o.id} id={`theme-${o.id}`} role="radio" aria-checked={pref === o.id} onClick={() => set(o.id)}
            className={`h-10 rounded-lg text-[14px] font-semibold ${pref === o.id ? 'bg-accent text-accentInk shadow-sm' : 'text-muted'}`}>{o.label}</button>
        ))}
      </div>
      <p className="mt-2 text-[13px] text-muted">{pref === 'auto' ? 'Follows your phone’s light or dark setting.' : 'Saved on this device.'}</p>
    </section>
  );
}
