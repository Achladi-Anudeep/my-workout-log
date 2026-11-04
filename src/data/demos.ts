import type { Exercise } from '../types';

/**
 * The exact ExerciseDB demo for each exercise, picked by hand (and checked visually) so the animation shows
 * the right machine and variation. Pinning also means no search request is needed (the free API rate-limits
 * searches). scripts/check-demos.mjs checks every few days that each one still loads.
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
  'lat-pulldown': 'qdRxqCj',         // cable pulldown (pro lat bar), wide bar + thigh pad
  'bent-over-row': 'BJ0Hz5L',        // dumbbell bent over row
  'low-row': 'hvV79Si',              // cable low seated row
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
  'wall-sit': 'sVQCCeG',             // march sit (wall): see note
  plank: 'VBAWRPG',                  // weighted front plank: see note
  'back-extension': 'zhMwOwE',       // hyperextension (45° bench)
  // arms
  'bicep-curl': '3s4NnTh',           // dumbbell standing biceps curl
  'ss-curl': '3s4NnTh',
  'hammer-curl': '2NpxjC1',          // dumbbell hammer curl
  'ss-triceps-ext': 'kont8Ut',       // dumbbell seated triceps extension
  'tri-bi-superset': 'kont8Ut',
  // core & home
  'leg-raise': 'WhuFnR7',            // lying leg raise flat bench
  'lying-leg-raise': 'WhuFnR7',
  'bw-squat': '75Bgtjy',             // potty squat = plain bodyweight squat, arms forward
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
  // home bands (Saturday)
  'band-glute-bridge': 'u0cNiij',    // glute bridge on the floor: see note
  'monster-walk': 'O95afRA',         // monster walk
  'band-row': 'Nu7jqFE',             // band seated straight back row
  'band-face-pull': 'tc5dYrf',       // band standing rear delt row = face pull with a band
  'band-lateral-raise': 'DsgkuIt',   // dumbbell lateral raise, same movement: see note
  // home versions of the gym days
  'db-floor-press': 'SpYC0Kp',       // dumbbell bench press: see note
  'stand-push-up': 'I4hDWkc',        // push-up: see note
  'band-chest-press': '4x5Okof',     // band seated chest press (band behind the back)
  'decline-push-up': 'i5cEhka',      // decline push-up
  'band-overhead-press': 'peAeMR3',  // band shoulder press (standing on the band)
  'band-pushdown': '3ZflifB',        // cable pushdown: see note
  'band-rdl': 'kuMiR2T',             // band stiff leg deadlift
  'band-pulldown': 'DptumMx',        // band close-grip pulldown (anchored overhead)
  'single-arm-band-row': 'km0sQC0',  // band single-arm standing low row
  'band-shrug': 'trmte8s',           // band shrug
  'band-squat': 'TUZLh71',           // band squat
  'bulgarian-split-squat': 'y8bYM8w',// band single leg split squat (rear foot raised)
  'single-leg-rdl': 'gKozT8X',       // dumbbell single leg deadlift
  'band-wall-sit': 'sVQCCeG',        // march sit (wall): see note
  'single-leg-bridge': 'rmEukuS',    // single leg bridge with outstretched leg
  'banded-push-up': 'I4hDWkc',       // push-up: see note
  'band-fly': '0CXGHya',             // cable crossover: see note
  'band-curl': '3omWx6P',            // band alternating biceps curl
  'band-overhead-triceps': 'obe5LMq',// band side (overhead, one arm) triceps extension
  'band-hammer-curl': 'HPlPoQA',     // cable hammer curl with rope: see note
  'band-y-raise': 'aHDy5O5',         // band y-raise
  'reverse-crunch': 'nCU1Ekp',       // reverse crunch
  'mountain-climber': 'RJgzwny',     // mountain climber
  // swap-ins
  'cable-lateral-raise': 'goJ6ezq',  // cable lateral raise
  'machine-shoulder-press': 'dNFYIU1', // Machine Shoulder Press (seated)
  'assisted-pull-up': 'kiJ4Z2K',     // assisted pull-up (kneeling on the pad)
  'single-arm-db-row': 'C0MA9bC',    // Dumbbell Single-Arm Bent-Over Row
  'goblet-squat': 'yn8yg1r',         // dumbbell goblet squat
  'cable-crossover': '0CXGHya',      // Cable Crossover
  'cable-curl': 'BCGQ6J5',           // Cable Close-Grip Curl
};

/** Where the demo differs a little from how you do it in this plan. Shown under the big demo. */
export const DEMO_NOTE: Record<string, string> = {
  'wall-sit': 'The demo also lifts one knee at a time. Keep both feet on the floor and just hold the position.',
  plank: 'The demo has a weight plate on the back. Do it with bodyweight only.',
  'rear-delt-fly': 'The demo is seated on the end of a bench. Standing and bent over works the same.',
  'single-leg-calf': 'The demo uses both feet. Do one foot at a time and hold the wall.',
  'tri-bi-superset': 'The demo shows the triceps half. The curl half is the same as Bicep Curl.',
  'band-glute-bridge': 'Same movement with a loop band just above your knees. Push the knees out against it.',
  'band-lateral-raise': 'The demo uses dumbbells. Stand on the middle of the tube band and hold a handle in each hand.',
  'band-row': 'The demo sits on a bench. Sitting on the floor with legs straight works the same.',
  'db-floor-press': 'Shown on a bench. On the floor it is the same press; your upper arms touch the floor at the bottom.',
  'stand-push-up': 'Shown on the floor. Hold your push-up stands: deeper stretch, easier on the wrists.',
  'banded-push-up': 'Same push-up, with the red loop across your upper back and the ends under your palms.',
  'band-pushdown': 'The demo uses a cable. Hang the band from the door anchor at the top of the door; same movement.',
  'band-fly': 'The demo uses cables. Door anchor at chest height, face away, a handle in each hand; same hugging motion.',
  'band-hammer-curl': 'The demo uses a cable rope. Stand on the band, palms facing each other; same movement.',
  'band-overhead-triceps': 'Shown one arm at a time. Both arms together with the band under your back foot works too.',
  'band-wall-sit': 'The demo lifts one knee at a time. Keep both feet down, red loop above the knees, push the knees out.',
  'band-pulldown': 'Shown seated on a box. Kneeling under the door anchor works the same.',
  'band-chest-press': 'Shown seated. Standing works too; keep the band across your upper back.',
  'single-leg-rdl': 'Shown with dumbbells; yours are 2 kg, or do it with bodyweight.',
};

export const gifUrl = (id: string) => `https://static.exercisedb.dev/media/${id}.gif`;

/** The demo animation for an exercise, if one is known: a library pick first, then the pinned demo. */
export function demoGif(e: Exercise): string | null {
  if (e.demo?.gifUrl) return e.demo.gifUrl;
  const id = DEMO_ID[e.id];
  return id ? gifUrl(id) : null;
}
