import { BUILTINS, DAY_IDS, homeDayOf } from '../lib/routines';
import type { Exercise, Unit } from '../types';

const E = (id: string, name: string, sets: number, min: number, max: number, unit: Unit, start: number | null,
  wNote: string, rest: number, cue: string, perSide = false): Exercise => ({ id, name, sets, min, max, unit, start, wNote, rest, cue, perSide });

/** Extra exercises that only appear as swaps (when the planned machine is busy). */
export const ALT_EXERCISES: Exercise[] = [
  E('db-bench-press', 'Dumbbell Bench Press', 3, 10, 12, 'reps', 6, '6–8 kg per hand', 90, 'Shoulder blades pinched, lower to chest level.'),
  E('bench-dip', 'Bench Dip', 3, 10, 12, 'reps', null, 'Bodyweight', 60, 'Stop at about 90° at the elbow.'),
  E('cable-lateral-raise', 'Cable Lateral Raise', 3, 12, 15, 'reps', 2.5, '2.5–5 kg', 60, 'Lead with the elbow, stop at shoulder height.', true),
  E('machine-shoulder-press', 'Machine Shoulder Press', 3, 10, 12, 'reps', 10, '10–15 kg', 90, 'Handles start level with your shoulders.'),
  E('back-extension', 'Back Extension', 3, 12, 15, 'reps', null, 'Bodyweight', 60, 'Squeeze your glutes; stop at a straight line.'),
  { ...E('assisted-pull-up', 'Assisted Pull-up', 3, 8, 12, 'reps', 35, '~35 kg of help (less help = harder)', 90, 'Chest to the bar, elbows drive down.'), assisted: true },
  E('single-arm-db-row', 'Single-arm Dumbbell Row', 3, 10, 12, 'reps', 8, '8–10 kg', 60, 'Pull to your hip, no twisting.', true),
  E('band-pull-apart', 'Band Pull-apart', 3, 15, 15, 'reps', null, 'Light band', 45, 'Straight arms, squeeze the shoulder blades.'),
  E('goblet-squat', 'Goblet Squat', 3, 10, 12, 'reps', 8, '8–12 kg', 90, 'Pain-free depth, chest up.'),
  E('cable-crossover', 'Cable Crossover', 3, 12, 15, 'reps', 5, '5–7.5 kg per side', 60, 'Fixed elbow bend, hug the handles together.'),
  E('single-leg-calf', 'Single-leg Calf Raise', 3, 12, 15, 'reps', null, 'Bodyweight, on a stair', 30, 'Hold the wall, full stretch, pause 1s at the top.', true),
  E('cable-curl', 'Cable Curl', 3, 12, 15, 'reps', 10, '10–15 kg', 60, 'Elbows pinned, no leaning back.'),
];

/** What to do instead when the planned exercise's machine or space is taken. Same muscles, different equipment. */
export const ALTERNATIVES: Record<string, string[]> = {
  'chest-press': ['db-bench-press', 'push-up'],
  'incline-press': ['db-bench-press', 'chest-press'],
  dips: ['bench-dip', 'triceps-pushdown'],
  'lateral-raise': ['cable-lateral-raise', 'machine-shoulder-press'],
  'triceps-pushdown': ['ss-triceps-ext', 'bench-dip'],
  'shoulder-press': ['machine-shoulder-press', 'lateral-raise'],
  deadlift: ['rdl', 'back-extension'],
  'lat-pulldown': ['assisted-pull-up', 'single-arm-db-row'],
  'bent-over-row': ['single-arm-db-row', 'low-row'],
  'low-row': ['single-arm-db-row', 'bent-over-row'],
  'face-pull': ['band-pull-apart', 'rear-delt-fly'],
  shrug: ['farmers-carry'],
  squat: ['goblet-squat', 'leg-press'],
  'leg-press': ['goblet-squat', 'squat'],
  rdl: ['back-extension', 'glute-bridge'],
  'wall-sit': ['goblet-squat', 'leg-press'],
  'leg-curl': ['rdl', 'back-extension'],
  'seated-calf': ['standing-calf', 'single-leg-calf'],
  'standing-calf': ['seated-calf', 'single-leg-calf'],
  'side-plank': ['plank', 'russian-twist'],
  flies: ['cable-crossover', 'db-bench-press'],
  'bicep-curl': ['cable-curl', 'hammer-curl'],
  'hammer-curl': ['bicep-curl', 'cable-curl'],
  'ss-curl': ['cable-curl', 'hammer-curl'],
  'tri-bi-superset': ['triceps-pushdown', 'ss-triceps-ext'],
  'ss-triceps-ext': ['triceps-pushdown', 'bench-dip'],
  'front-raise': ['machine-shoulder-press', 'lateral-raise'],
  'rear-delt-fly': ['face-pull', 'band-pull-apart'],
  'farmers-carry': ['shrug', 'plank'],
  'leg-raise': ['lying-leg-raise', 'dead-bug'],
  plank: ['side-plank', 'dead-bug'],
  'bw-squat': ['step-up', 'wall-sit'],
  'glute-bridge': ['step-up', 'bw-squat'],
  'step-up': ['bw-squat', 'glute-bridge'],
  'push-up': ['bench-dip'],
  'russian-twist': ['side-plank', 'dead-bug'],
  'dead-bug': ['plank', 'lying-leg-raise'],
  'lying-leg-raise': ['leg-raise', 'dead-bug'],
  'single-leg-calf': ['standing-calf', 'seated-calf'],
  'band-glute-bridge': ['glute-bridge', 'step-up'],
  'monster-walk': ['band-glute-bridge', 'glute-bridge'],
  'band-row': ['band-pull-apart', 'band-face-pull'],
  'band-face-pull': ['band-pull-apart', 'band-row'],
  'band-lateral-raise': ['band-pull-apart'],
  // home
  'stand-push-up': ['decline-push-up', 'band-chest-press'],
  'band-chest-press': ['stand-push-up', 'banded-push-up'],
  'decline-push-up': ['stand-push-up', 'banded-push-up'],
  'band-overhead-press': ['lateral-raise', 'band-y-raise'],
  'band-pushdown': ['band-overhead-triceps', 'bench-dip'],
  'band-rdl': ['single-leg-rdl', 'single-leg-bridge'],
  'band-pulldown': ['single-arm-band-row', 'band-row'],
  'single-arm-band-row': ['band-row', 'band-pulldown'],
  'band-shrug': ['band-y-raise'],
  'band-squat': ['bulgarian-split-squat', 'bw-squat'],
  'bulgarian-split-squat': ['band-squat', 'step-up'],
  'single-leg-rdl': ['band-rdl', 'single-leg-bridge'],
  'band-wall-sit': ['band-squat', 'wall-sit'],
  'single-leg-bridge': ['glute-bridge', 'band-rdl'],
  'banded-push-up': ['stand-push-up', 'decline-push-up'],
  'band-fly': ['band-chest-press', 'stand-push-up'],
  'band-curl': ['band-hammer-curl'],
  'band-overhead-triceps': ['band-pushdown', 'bench-dip'],
  'band-hammer-curl': ['band-curl'],
  'band-y-raise': ['band-pull-apart', 'band-face-pull'],
  'reverse-crunch': ['lying-leg-raise', 'dead-bug'],
  'mountain-climber': ['plank', 'dead-bug'],
};

/** Every exercise the app knows how to describe: the built-in routines plus the swap-only ones. */
export const EXERCISE_LIBRARY: Map<string, Exercise> = (() => {
  const m = new Map<string, Exercise>();
  for (const r of BUILTINS) for (const d of DAY_IDS) for (const e of [...r.days[d].exercises, ...(homeDayOf(r, d)?.exercises ?? [])]) if (!m.has(e.id)) m.set(e.id, e);
  for (const e of ALT_EXERCISES) if (!m.has(e.id)) m.set(e.id, e);
  return m;
})();

/**
 * Swap options for an exercise in a running workout. A swapped exercise offers its original first,
 * so you can switch back. Exercises already in today's workout are left out.
 */
export function swapOptions(e: Exercise, inWorkout: string[]): Exercise[] {
  const rootId = e.swappedFor?.id ?? e.id;
  const ids = [...(e.swappedFor ? [rootId] : []), ...(ALTERNATIVES[rootId] ?? [])];
  return ids
    .filter(id => id !== e.id && !inWorkout.includes(id))
    .map(id => EXERCISE_LIBRARY.get(id))
    .filter((x): x is Exercise => !!x);
}
