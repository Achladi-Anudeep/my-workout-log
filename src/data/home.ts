import type { DayId, Exercise, RoutineDay, Unit } from '../types';

/**
 * Home versions of the gym days: the same muscles each day, so skipping the gym never unbalances the week.
 * Gear: Boldfit 20 kg blue tube band with handles + door anchor, Slovic 7–15 kg red loop band,
 * 2 kg dumbbells, push-up stands, hand gripper, chair, bed and a yoga mat. No knee limits at home.
 * Exercise ids are shared with the gym plan where it's the same exercise, so history carries over.
 */
const E = (id: string, name: string, sets: number, min: number, max: number, unit: Unit, start: number | null,
  wNote: string, rest: number, cue: string, extra: Partial<Exercise> = {}): Exercise =>
  ({ id, name, sets, min, max, unit, start, wNote, rest, cue, ...extra });

const UPPER_WU = ['Arm circles × 10 each way', 'Cat-Camel × 10 slow', 'Band pull-aparts × 15 (red loop)', 'Inch worm × 5', 'Push-ups × 5 easy'];
const LEG_WU = ['Leg swings × 10/side', 'Bodyweight squats × 15', 'Glute Bridge × 12', "World's Greatest Stretch × 5/side"];
const UPPER_CD = ["Child's Pose · 30s", 'Chest & triceps stretch · 30s', 'Thread the Needle · 30s/side'];
const LEG_CD = ['Prone Quad Stretch · 30s/side', 'Figure 4 Glute Stretch · 30s/side', 'Hamstring Stretch · 30s/side', 'Seated Calf & Ankle Stretch · 30s'];

// Shared with the gym plan (same exercise, same history)
const lateralRaise = E('lateral-raise', 'Lateral Raises', 3, 15, 20, 'reps', 2, 'Your 2 kg dumbbells', 45, 'Slight elbow bend, lead with the elbows, stop at shoulder height. Slow 3 s down.');
const chairDip = E('bench-dip', 'Chair Dips', 3, 8, 15, 'reps', null, 'Bodyweight, hands on a sturdy chair', 60, 'Shoulders down, elbows point back, stop at about 90°.');
const bandRow = E('band-row', 'Band Seated Row', 3, 12, 15, 'reps', null, 'Blue tube band around your feet', 60, 'Sit tall, pull to your belly, squeeze the shoulder blades 2s.');
const facePull = E('band-face-pull', 'Band Face Pull', 3, 15, 15, 'reps', null, 'Blue tube band on the door anchor, face height', 45, 'Pull toward your face with elbows high, split the handles apart.');
const calf = E('single-leg-calf', 'Single-leg Calf Raise', 3, 12, 20, 'reps', null, 'Bodyweight on a step; hold a 2 kg dumbbell when easy', 30, 'Full stretch at the bottom, pause 1s at the top.', { perSide: true });

const pulldown = E('band-pulldown', 'Band Lat Pulldown', 3, 12, 15, 'reps', null, 'Blue tube band on the door anchor, top of the door', 60, 'Kneel, chest up, pull the handles to your upper chest, elbows drive down.');
const hammer = E('band-hammer-curl', 'Band Hammer Curl', 3, 12, 15, 'reps', null, 'Red loop or blue tube band under your feet', 45, 'Palms facing in, elbows pinned, slow 3 s down.');

export const HOME_DAYS: Partial<Record<DayId, RoutineDay>> = {
  mon: {
    title: 'Home Push', focus: 'Chest · shoulders · triceps · bands + bodyweight', mins: '50', cardio: 'home', home: true,
    warmup: UPPER_WU, cooldown: UPPER_CD, exercises: [
      E('stand-push-up', 'Push-ups on Stands', 3, 8, 15, 'reps', null, 'Bodyweight, hands on your push-up stands', 90, 'Body in one line, chest drops below the handles, elbows ~45°.'),
      E('band-chest-press', 'Band Chest Press', 3, 10, 15, 'reps', null, 'Blue tube band behind your back', 60, 'Band across your upper back, press forward and slightly together, slow back.'),
      E('decline-push-up', 'Decline Push-ups', 3, 6, 12, 'reps', null, 'Feet on the bed or chair', 60, 'Hips level with the shoulders, lower until your chest nearly touches the floor.'),
      E('band-overhead-press', 'Band Overhead Press', 3, 10, 15, 'reps', null, 'Stand on the red loop (blue band when easy)', 60, 'Brace your abs, press straight up, no leaning back.'),
      lateralRaise,
      chairDip,
      E('band-pushdown', 'Band Triceps Pushdown', 3, 12, 15, 'reps', null, 'Red loop or blue band on the door anchor, top of the door', 45, 'Elbows pinned to your sides, squeeze at the bottom.'),
    ],
  },
  tue: {
    title: 'Home Pull · Hinge', focus: 'Back · traps · rear delts · hamstrings · grip', mins: '50', cardio: 'none', home: true,
    warmup: [...UPPER_WU.slice(0, 3), 'Glute Bridge × 12', 'Hip hinges × 10'], cooldown: [...UPPER_CD, 'Hamstring Stretch · 30s/side'], exercises: [
      E('band-rdl', 'Band Romanian Deadlift', 4, 12, 15, 'reps', null, 'Stand on the blue tube band', 90, 'Soft knees, push the hips back, flat back, squeeze the glutes to stand.'),
      pulldown,
      bandRow,
      E('single-arm-band-row', 'Single-arm Band Row', 3, 10, 12, 'reps', null, 'Blue band on the door anchor, waist height', 60, 'Pull to your hip, no twisting, squeeze 1s.', { perSide: true }),
      facePull,
      E('band-shrug', 'Band Shrugs', 3, 15, 20, 'reps', null, 'Stand on the blue tube band', 45, 'Straight up toward the ears, hold 1s, no rolling.'),
      E('hand-gripper', 'Hand Gripper', 3, 15, 20, 'reps', null, 'Your hand gripper', 30, 'Squeeze fully closed, hold 1s, open slowly.', { perSide: true }),
    ],
  },
  wed: {
    title: 'Home Legs', focus: 'Quads · glutes · hamstrings · calves · core', mins: '55', cardio: 'none', home: true,
    warmup: LEG_WU, cooldown: LEG_CD, exercises: [
      E('band-squat', 'Band Squat', 4, 12, 20, 'reps', null, 'Stand on the blue tube band, handles at your shoulders', 90, 'Feet shoulder-width, sit down between your heels, slow 3 s down.'),
      E('bulgarian-split-squat', 'Bulgarian Split Squat', 3, 8, 12, 'reps', null, 'Rear foot on the chair or bed; 2 kg dumbbells when easy', 90, 'Most of your weight on the front foot, front knee tracks over the toes.', { perSide: true }),
      E('single-leg-rdl', 'Single-leg RDL', 3, 8, 12, 'reps', null, 'Bodyweight or your 2 kg dumbbells', 60, 'Hinge on one leg, hips square, back flat, feel the hamstring.', { perSide: true }),
      E('band-wall-sit', 'Banded Wall Sit', 3, 30, 60, 'sec', null, 'Red loop above the knees', 60, 'Thighs parallel, push your knees out against the band.'),
      E('single-leg-bridge', 'Single-leg Glute Bridge', 3, 10, 15, 'reps', null, 'Bodyweight, on the mat', 45, 'Drive through the heel, hips level, pause 2s at the top.', { perSide: true }),
      calf,
      E('side-plank', 'Side Plank', 3, 30, 45, 'sec', null, 'Bodyweight, on the mat', 45, 'Body in a straight line, hips lifted.', { perSide: true }),
    ],
  },
  thu: {
    title: 'Home Push + Arms', focus: 'Chest · biceps · triceps · side & rear delts', mins: '50', cardio: 'home', home: true,
    warmup: UPPER_WU, cooldown: UPPER_CD, exercises: [
      E('banded-push-up', 'Banded Push-ups', 3, 6, 12, 'reps', null, 'Red loop across your upper back, ends under your palms', 90, 'Body in one line; the band makes the top harder, so push all the way up.'),
      E('band-fly', 'Band Chest Fly', 3, 12, 15, 'reps', null, 'Blue band on the door anchor, chest height, facing away', 60, 'Fixed slight elbow bend, hug the handles together in front of your chest.'),
      E('band-curl', 'Band Curl', 3, 10, 15, 'reps', null, 'Stand on the red loop (blue band when easy)', 60, 'Elbows fixed at your sides, slow 3 s down.'),
      E('band-overhead-triceps', 'Band Overhead Triceps Extension', 3, 12, 12, 'reps', null, 'Red loop under your foot or the blue band on the door anchor', 0,
        'Superset A1: go straight into A2 with no rest.', { superset: 'A1' }),
      { ...hammer, min: 12, max: 12, cue: 'Superset A2: right after A1, then rest 60s.', superset: 'A2', rest: 60 },
      E('band-pull-apart', 'Band Pull-apart', 3, 15, 20, 'reps', null, 'Red loop, arms straight', 45, 'Pull the band to your chest, squeeze the shoulder blades.'),
      { ...lateralRaise },
    ],
  },
  fri: {
    title: 'Home Pull + Abs', focus: 'Back · biceps · rear delts · calves · core', mins: '50', cardio: 'home', home: true,
    warmup: UPPER_WU, cooldown: [...UPPER_CD, 'Cobra stretch · 30s'], exercises: [
      pulldown,
      bandRow,
      E('band-y-raise', 'Band Y-Raise', 3, 12, 15, 'reps', null, 'Red loop under your feet, light', 45, 'Thumbs up, raise your arms into a Y, lower slowly.'),
      hammer,
      calf,
      E('reverse-crunch', 'Reverse Crunch', 3, 12, 15, 'reps', null, 'Bodyweight, on the mat', 45, 'Curl your hips off the mat toward your chest, lower slowly.'),
      E('plank', 'Plank', 3, 45, 60, 'sec', null, 'Bodyweight, on the mat', 45, 'Straight line head to heels, squeeze the glutes.'),
      E('mountain-climber', 'Mountain Climbers', 3, 30, 40, 'sec', null, 'Bodyweight', 45, 'Hips low, drive the knees in fast, keep the shoulders over the hands.'),
    ],
  },
};
