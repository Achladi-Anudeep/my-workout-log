import type { Day, DayId, Exercise, Unit } from '../types';

const E = (id: string, name: string, sets: number, min: number, max: number, unit: Unit, start: number | null,
  wNote: string, rest: number, cue: string, perSide = false): Exercise => ({ id, name, sets, min, max, unit, start, wNote, rest, cue, perSide });

const PUSH_WU = ['Inch worm × 5', 'Cobra to Mountain × 6', "World's Greatest Stretch × 5/side", 'Cat-Camel × 10 slow'];
const UPPER_CD = ["Child's Pose · 30s", 'Thread the Needle · 30s/side', 'Chest & triceps stretch · 30s'];

export const PLAN: Day[] = [
  { id: 'mon', short: 'Mon', title: 'Push', focus: 'Chest · front & side delts · triceps', mins: '55', plate: 'var(--p-red)', cardio: 'gym',
    warmup: [...PUSH_WU, 'Band pull-aparts × 10'], cooldown: UPPER_CD, exercises: [
    E('chest-press', 'Chest Press', 3, 12, 15, 'reps', 10, '10–15 kg', 90, 'Shoulder blades pinched back, feet flat, elbows ~45° from the body.'),
    E('incline-press', 'Incline Press', 3, 12, 15, 'reps', 4, '4–6 kg per hand', 90, 'Bench at 30–45°. Press up and slightly together, control the lowering.'),
    E('dips', 'Dips', 3, 10, 12, 'reps', null, 'Assisted or bodyweight', 90, 'Lean slightly forward. Stop at ~90° at the elbow for shoulder safety.'),
    E('lateral-raise', 'Lateral Raises', 3, 15, 15, 'reps', 2, '2–3 kg', 60, 'Slight elbow bend, lift to shoulder height, lead with the elbows.'),
    E('triceps-pushdown', 'Triceps Pushdown', 3, 12, 15, 'reps', 8, '8–10 kg', 60, 'Elbows pinned to your sides, squeeze at the bottom.'),
  ] },
  { id: 'tue', short: 'Tue', title: 'Pull · Deadlift', focus: 'Back · traps · rear delts · hamstrings', mins: '55', plate: 'var(--p-blue)', cardio: 'none',
    warmup: [...PUSH_WU, 'Glute Bridge × 12', '90-90 Hip Rotation × 8/side'], cooldown: [...UPPER_CD, 'Hip Flexor Stretch · 30s/side'], exercises: [
    E('deadlift', 'Deadlift', 3, 8, 10, 'reps', 20, 'Empty bar · 20 kg', 120, 'Bar over mid-foot, hips back, flat back, push the floor away. Add weight only after 2–3 weeks of clean form.'),
    E('lat-pulldown', 'Lat Pulldown', 3, 12, 15, 'reps', 15, '15–20 kg', 90, 'Chest up, pull to the upper chest, drive the elbows down.'),
    E('bent-over-row', 'Bent Over Row', 3, 10, 12, 'reps', 8, '8–10 kg', 90, 'Hinge to ~45°, neutral spine, pull to the lower ribs.'),
    E('low-row', 'Low Row', 3, 12, 15, 'reps', 12, '12–15 kg', 90, 'Sit tall, pull to the belly button, squeeze 1s.'),
    E('face-pull', 'Face Pulls', 3, 15, 15, 'reps', 5, '5–8 kg', 60, 'Pull toward the face with elbows high.'),
    E('shrug', 'Shrugs', 3, 15, 15, 'reps', 10, '10–12 kg', 60, 'Lift straight up, hold 1s, no neck rolling.'),
  ] },
  { id: 'wed', short: 'Wed', title: 'Legs', focus: 'Quads · hamstrings · glutes · calves · knee-adjusted', mins: '60', plate: 'var(--p-yellow)', cardio: 'none',
    warmup: ['90-90 Hip Rotations × 8/side', 'Ankle Dorsiflexion Rocks × 10/side', 'Glute Bridge × 12', 'Deep Squat Hamstring Stretch · 30s (pain-free)'],
    cooldown: ['Prone Quad Stretch · 30s', 'Figure 4 Glute Stretch · 30s', 'Butterfly Stretch · 30s', 'Seated Calf & Ankle Stretch · 30s'], exercises: [
    E('squat', 'Barbell Squat', 3, 10, 12, 'reps', 20, 'Empty bar · 20 kg or bodyweight', 120, 'Knees track over toes, chest up. Only as deep as stays pain-free — box squat to a bench as a depth guide.'),
    E('leg-press', 'Leg Press', 3, 12, 15, 'reps', 20, '20–30 kg', 90, 'Feet mid-platform, knees no deeper than ~90°, no hard lockout.'),
    E('rdl', 'RDL', 3, 10, 12, 'reps', 6, '6–8 kg', 90, 'Soft knees, push the hips back, weights close to the legs.'),
    E('wall-sit', 'Wall Sit', 3, 30, 45, 'sec', null, 'Bodyweight', 60, 'Thighs at or above parallel, back flat on the wall.'),
    E('leg-curl', 'Leg Curl', 3, 15, 15, 'reps', 8, '8–10 kg', 60, 'Slow, controlled lowering.'),
    E('seated-calf', 'Seated Calf Raise', 3, 15, 15, 'reps', 10, '10–15 kg', 45, 'Full stretch at the bottom, pause 1s at the top.'),
    E('side-plank', 'Side Plank', 3, 45, 45, 'sec', null, 'Bodyweight', 45, 'Body in a straight line, hips lifted.', true),
  ] },
  { id: 'thu', short: 'Thu', title: 'Push + Arms', focus: 'Chest · shoulders · biceps · triceps', mins: '50', plate: 'var(--p-green)', cardio: 'gym',
    warmup: PUSH_WU, cooldown: UPPER_CD, exercises: [
    E('incline-press', 'Incline Press', 3, 12, 15, 'reps', 4, '4–6 kg per hand', 90, 'Same as Monday, controlled lowering.'),
    E('flies', 'Flies', 3, 15, 15, 'reps', 3, '3–4 kg', 60, 'Slight elbow bend, open until you feel a stretch, then hug together.'),
    E('bicep-curl', 'Bicep Curl', 3, 12, 15, 'reps', 4, '4–6 kg', 60, 'Elbows fixed at your sides, no swinging.'),
    E('tri-bi-superset', 'Triceps + Bicep Superset', 3, 12, 12, 'reps', 6, '6 kg triceps + 4 kg biceps', 60, 'One set of each back to back, then rest. Log the triceps weight.'),
    E('front-raise', 'Front Raises', 3, 15, 15, 'reps', 2, '2–3 kg', 45, 'Lift to eye level, no leaning back.'),
    E('rear-delt-fly', 'Rear Delt Fly', 3, 15, 15, 'reps', 2, '2–3 kg', 45, 'Hinge forward, lead with the elbows.'),
  ] },
  { id: 'fri', short: 'Fri', title: 'Pull + Abs', focus: 'Back · rear delts · grip · core', mins: '50', plate: 'var(--p-white)', cardio: 'gym',
    warmup: PUSH_WU, cooldown: UPPER_CD, exercises: [
    E('lat-pulldown', 'Lat Pulldown', 3, 12, 15, 'reps', 15, '15–20 kg', 90, 'Chest up, pull to the upper chest, drive the elbows down.'),
    E('low-row', 'Low Row', 3, 12, 15, 'reps', 12, '12–15 kg', 90, 'Sit tall, pull to the belly button, squeeze 1s.'),
    E('rear-delt-fly', 'Rear Delt Fly', 3, 15, 15, 'reps', 2, '2–3 kg', 45, 'Hinge forward, lead with the elbows.'),
    E('farmers-carry', "Farmer's Carry", 3, 30, 30, 'sec', 8, '8–10 kg per hand', 60, 'Stand tall, shoulders back, short steady steps.'),
    E('leg-raise', 'Leg Raises', 3, 15, 15, 'reps', null, 'Bodyweight', 45, 'Lower back stays pressed down, no swinging.'),
    E('plank', 'Plank', 3, 60, 60, 'sec', null, 'Bodyweight', 45, 'Straight line head to heels, squeeze the glutes.'),
  ] },
  { id: 'sat', short: 'Sat', title: 'Home Recovery + Core', focus: 'Light full body · core · bodyweight', mins: '35', plate: 'var(--p-black)', cardio: 'home', home: true,
    warmup: ['Brisk walk, jumping jacks or stairs · 5–10 min'],
    cooldown: ["Child's Pose · 30s", 'Pigeon Pose · 30s/side', 'Thread the Needle · 30s/side', 'Hamstring Stretch · 30s', 'Wall Chest Opener · 30s'], exercises: [
    E('bw-squat', 'Bodyweight Squat', 3, 20, 20, 'reps', null, 'Bodyweight', 45, 'Shallow, pain-free depth, slow tempo.'),
    E('glute-bridge', 'Glute Bridge', 3, 15, 15, 'reps', null, 'Bodyweight', 45, 'Pause 2s at the top.'),
    E('step-up', 'Step-ups (low step)', 3, 12, 12, 'reps', null, 'Bodyweight', 45, 'Push through the heel, lower slowly.', true),
    E('push-up', 'Push-ups', 3, 12, 12, 'reps', null, 'Bodyweight (incline if needed)', 45, 'Body in one straight line.'),
    E('russian-twist', 'Russian Twists', 3, 20, 20, 'reps', null, 'Bodyweight', 30, 'Rotate from the ribs, not the arms.'),
    E('dead-bug', 'Dead Bug', 3, 12, 12, 'reps', null, 'Bodyweight', 30, 'Lower back stays flat on the floor.', true),
    E('lying-leg-raise', 'Lying Leg Raise', 3, 12, 12, 'reps', null, 'Bodyweight', 30, 'Keep your lower back pressed down.'),
  ] },
  { id: 'sun', short: 'Sun', title: 'Rest', focus: 'Full rest · no training, no cardio', mins: '0', plate: 'var(--line)', cardio: 'none', warmup: [], cooldown: [], exercises: [] },
];

export const DAY = Object.fromEntries(PLAN.map(d => [d.id, d])) as Record<DayId, Day>;

export const ALL_EX: Exercise[] = (() => {
  const m = new Map<string, Exercise>();
  PLAN.forEach(d => d.exercises.forEach(e => { if (!m.has(e.id)) m.set(e.id, e); }));
  return [...m.values()];
})();

export const EX_DAYS = (id: string) => PLAN.filter(d => d.exercises.some(e => e.id === id)).map(d => d.short);

/** Search terms for the ExerciseDB demo of each plan exercise. */
export const DEMO_Q: Record<string, string> = {
  'chest-press': 'chest press', 'incline-press': 'dumbbell incline bench press', dips: 'chest dip', 'lateral-raise': 'dumbbell lateral raise',
  'triceps-pushdown': 'pushdown', deadlift: 'barbell deadlift', 'lat-pulldown': 'pulldown', 'bent-over-row': 'bent over row', 'low-row': 'seated row',
  'face-pull': 'face pull', shrug: 'dumbbell shrug', squat: 'barbell full squat', 'leg-press': 'leg press', rdl: 'romanian deadlift', 'wall-sit': 'wall sit',
  'leg-curl': 'lying leg curl', 'seated-calf': 'seated calf raise', 'side-plank': 'side bridge', flies: 'dumbbell fly', 'bicep-curl': 'dumbbell biceps curl',
  'tri-bi-superset': 'triceps extension', 'front-raise': 'dumbbell front raise', 'rear-delt-fly': 'rear delt fly', 'farmers-carry': 'farmers walk',
  'leg-raise': 'lying leg raise', plank: 'plank', 'bw-squat': 'bodyweight squat', 'glute-bridge': 'glute bridge', 'step-up': 'step-up',
  'push-up': 'push-up', 'russian-twist': 'russian twist', 'dead-bug': 'dead bug', 'lying-leg-raise': 'lying leg raise',
};
