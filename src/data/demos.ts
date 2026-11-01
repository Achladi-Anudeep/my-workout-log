import type { Exercise } from '../types';

/**
 * The exact ExerciseDB demo for each exercise, picked by hand so the animation shows the right machine
 * and variation. Wall sit, plank and back extension have no clean match in the library, so they show an icon.
 * Pinning also means no search request is needed (the free API rate-limits searches).
 * GIFs are still loaded live from ExerciseDB, never stored by the app.
 */
export const DEMO_ID: Record<string, string> = {
  // push
  'chest-press': 'DOoWcnA',          // Machine Chest Press
  'incline-press': 'B3Rxp6L',        // Dumbbell Incline Bench Press
  dips: 'PAgTVaK',                   // assisted chest dip (kneeling)
  'lateral-raise': 'DsgkuIt',        // dumbbell lateral raise
  'triceps-pushdown': '3ZflifB',     // cable pushdown
  'shoulder-press': 'znQUdHY',       // dumbbell seated shoulder press
  'front-raise': '3eGE2JC',          // dumbbell front raise
  // pull
  deadlift: 'ila4NZS',               // barbell deadlift
  'lat-pulldown': '0MlxeMn',         // cable pulldown (pro lat bar)
  'bent-over-row': 'BJ0Hz5L',        // dumbbell bent over row
  'low-row': 'A3P4O0R',              // cable seated row
  'rear-delt-fly': '8DiFDVA',        // dumbbell rear fly
  'farmers-carry': 'qPEzJjA',        // farmers walk
  // legs
  squat: 'qXTaZnJ',                  // barbell full squat
  'leg-press': '10Z2DXU',            // sled 45° leg press
  rdl: 'rR0LJzx',                    // dumbbell romanian deadlift
  'leg-curl': '17lJ1kr',             // Machine Lying Leg Curl
  'seated-calf': 'bOOdeyc',          // Machine Seated Calf Raise
  'standing-calf': 'ykUOVze',        // Machine Standing Calf Raise
  'side-plank': 'RKjH6Lt',           // side bridge
  // arms
  'bicep-curl': '3s4NnTh',           // dumbbell standing biceps curl
  'ss-curl': '3s4NnTh',
  'hammer-curl': '2NpxjC1',          // dumbbell hammer curl
  'ss-triceps-ext': 'kont8Ut',       // dumbbell seated triceps extension
  'tri-bi-superset': 'kont8Ut',
  // core & home
  'leg-raise': 'WhuFnR7',            // lying leg raise flat bench
  'lying-leg-raise': 'WhuFnR7',
  'bw-squat': '6YUfHPL',             // bodyweight squat
  'glute-bridge': 'u0cNiij',         // low glute bridge on floor
  'step-up': 'aXtJhlg',              // dumbbell step-up
  'single-leg-calf': '6HmFgmx',      // standing calf raise (on a staircase)
  'russian-twist': 'XVDdcoj',        // russian twist
  'dead-bug': 'iny3m5y',             // dead bug
  // more
  'face-pull': 'ZfyAGhK', // cable standing rear delt row (with rope)
  shrug: 'NJzBsGJ',       // dumbbell shrug
  flies: 'yz9nUhF',       // dumbbell fly
  'push-up': 'I4hDWkc',   // push-up
  'band-pull-apart': 'sTfvVsG', // band reverse fly
  'db-bench-press': 'SpYC0Kp', // dumbbell bench press
  'bench-dip': 'VuoerH0', // triceps dip (bench leg)
  // swap-ins
  'cable-lateral-raise': 'goJ6ezq',  // cable lateral raise
  'machine-shoulder-press': '67n3r98', // Machine Shoulder Press
  'assisted-pull-up': '5ipN0iE',     // assisted pull-up
  'single-arm-db-row': 'C0MA9bC',    // Dumbbell Single-Arm Bent-Over Row
  'goblet-squat': 'yn8yg1r',         // dumbbell goblet squat
  'cable-crossover': '0CXGHya',      // Cable Crossover
  'cable-curl': 'BCGQ6J5',           // Cable Close-Grip Curl
};

export const gifUrl = (id: string) => `https://static.exercisedb.dev/media/${id}.gif`;

/** The demo animation for an exercise, if one is known: a library pick first, then the pinned demo. */
export function demoGif(e: Exercise): string | null {
  if (e.demo?.gifUrl) return e.demo.gifUrl;
  const id = DEMO_ID[e.id];
  return id ? gifUrl(id) : null;
}
