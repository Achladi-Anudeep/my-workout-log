import type { Exercise, Session } from '../types';
import { isAssisted } from './coach';
import { fmtW } from './utils';

/**
 * Warm-up sets before the first heavy lift of the day: two lighter ramp-up sets, so the working sets
 * feel smooth and the joints are ready. Only for weighted rep exercises; nothing when the weight is light.
 */
export function warmupSets(e: Exercise, working: number | null): { w: number; r: number }[] {
  if (working == null || working <= 0 || e.unit !== 'reps' || isAssisted(e)) return [];
  const round = (x: number) => {
    if (e.loads?.length) {
      const fit = [...e.loads].sort((a, b) => b - a).find(l => l <= x + 1e-9);
      return fit ?? 0;
    }
    return Math.round(x * 2) / 2; // gym: nearest 0.5 kg
  };
  // A barbell starts with the empty 20 kg bar.
  const bar = /barbell|\bbar\b/i.test(`${e.name} ${e.wNote}`) && working > 20 ? 20 : null;
  const raw = bar != null
    ? [{ w: bar, r: 10 }, { w: round(working * 0.7), r: 5 }]
    : [{ w: round(working * 0.5), r: 8 }, { w: round(working * 0.75), r: 4 }];
  const out: { w: number; r: number }[] = [];
  for (const s of raw) if (s.w > 0 && s.w < working && !out.some(o => o.w === s.w)) out.push(s);
  return out;
}

export const warmupText = (sets: { w: number; r: number }[]) => sets.map(s => `${fmtW(s.w)}×${s.r}`).join(' · ');

/**
 * How to load one dumbbell of the home kit (two 5 kg and two 2.5 kg plates per dumbbell end, light rods):
 * the plates for each end. The 2 kg dumbbells are a separate fixed pair.
 */
export function platesFor(kg: number): string | null {
  if (!(kg > 0)) return null;
  if (kg === 2) return 'your fixed 2 kg dumbbell';
  let side = kg / 2;
  const plates: number[] = [];
  for (const p of [5, 5, 2.5, 2.5]) if (side >= p - 1e-9) { plates.push(p); side -= p; }
  if (side > 1e-9 || !plates.length) return null;
  return `${plates.map(p => fmtW(p)).join(' + ')} kg on each end`;
}

/** A logged set beats everything before it: heavier than ever, or more reps at your best weight (bodyweight: most reps ever). */
export function isNewBest(sessions: Session[], e: Exercise, w: number | null, r: number): boolean {
  if (!(r > 0) || isAssisted(e)) return false;
  const past = sessions.flatMap(s => s.ex.filter(x => x.id === e.id).flatMap(x => x.sets));
  if (!past.length) return false; // the first time isn't a "best", it's a start
  const weighted = w != null && w > 0;
  if (!weighted) {
    if (past.some(p => p.w != null && p.w > 0)) return false;
    return r > Math.max(...past.map(p => p.r));
  }
  const top = Math.max(...past.map(p => p.w ?? 0));
  if (w! > top + 1e-9) return true;
  if (Math.abs(w! - top) < 1e-9) return r > Math.max(...past.filter(p => Math.abs((p.w ?? 0) - top) < 1e-9).map(p => p.r));
  return false;
}

/**
 * A short tap you can feel. Android: the vibration API. iPhone (Safari 18+): toggling a hidden switch
 * control gives a system haptic, the only way a web app can do it there.
 */
let iosSwitch: HTMLLabelElement | null = null;
export function haptic() {
  try {
    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') { navigator.vibrate(12); return; }
    if (typeof document === 'undefined') return;
    if (!iosSwitch) {
      iosSwitch = document.createElement('label');
      iosSwitch.setAttribute('aria-hidden', 'true');
      iosSwitch.style.cssText = 'position:fixed;left:-9999px;width:1px;height:1px;overflow:hidden;opacity:0;pointer-events:none';
      const input = document.createElement('input');
      input.type = 'checkbox';
      input.setAttribute('switch', '');
      input.tabIndex = -1;
      iosSwitch.appendChild(input);
      document.body.appendChild(iosSwitch);
    }
    iosSwitch.click();
  } catch { /* haptics are a nice-to-have */ }
}
