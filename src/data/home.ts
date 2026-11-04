import type { DayId, Exercise, RoutineDay, Unit } from '../types';

/**
 * Home versions of the gym days: the same muscles each day, so skipping the gym never unbalances the week.
 * Gear: 30 kg dumbbell kit (two light rods, plates 4 × 5 kg + 4 × 2.5 kg → 5 / 10 / 15 kg per hand, up to 20 kg
 * on one dumbbell), a 2 kg pair, Boldfit 20 kg blue tube band + door anchor, Slovic 7–15 kg red loop band,
 * push-up stands, hand gripper, chair, bed and a yoga mat. No knee limits at home.
 * Exercise ids are shared with the gym plan where it's the same exercise, so history carries over.
 */
const E = (id: string, name: string, sets: number, min: number, max: number, unit: Unit, start: number | null,
  wNote: string, rest: number, cue: string, extra: Partial<Exercise> = {}): Exercise =>
  ({ id, name, sets, min, max, unit, start, wNote, rest, cue, ...extra });

const UPPER_WU = ['Arm circles × 10 each way', 'Cat-Camel × 10 slow', 'Band pull-aparts × 15 (red loop)', 'Inch worm × 5', 'Push-ups × 5 easy'];
const LEG_WU = ['Leg swings × 10/side', 'Bodyweight squats × 15', 'Glute Bridge × 12', "World's Greatest Stretch × 5/side"];
const UPPER_CD = ["Child's Pose · 30s", 'Chest & triceps stretch · 30s', 'Thread the Needle · 30s/side'];
const LEG_CD = ['Prone Quad Stretch · 30s/side', 'Figure 4 Glute Stretch · 30s/side', 'Hamstring Stretch · 30s/side', 'Seated Calf & Ankle Stretch · 30s'];

/** What the kit can make. Rods weigh next to nothing, so they're counted as 0 kg. */
export const PAIR = [2, 5, 10, 15];     // kg per hand, two dumbbells (2 kg = the old pair)
export const ONE_DB = [2, 5, 10, 15, 20]; // kg, one dumbbell
const KIT = 'Your dumbbell kit: 5 / 10 / 15 kg per hand (plates 2.5 + 2.5, 5 + 5, or 5 + 2.5 each end)';

// Same exercise as at the gym → same id, so history and the coach carry over.
const floorPress = E('db-floor-press', 'Dumbbell Floor Press', 3, 8, 15, 'reps', 5, '5 kg per hand to start', 90,
  'Lie on the mat, upper arms touch the floor each rep, press up and slightly together.', { loads: PAIR, equipment: `${KIT}; lie on the yoga mat` });
const shoulderPress = E('shoulder-press', 'Seated Dumbbell Shoulder Press', 3, 8, 15, 'reps', 5, '5 kg per hand to start', 90,
  'Sit tall on the chair, press up and slightly in, lower to shoulder height.', { loads: PAIR, equipment: `${KIT}; sit on the chair, back straight` });
const lateralRaise = E('lateral-raise', 'Lateral Raises', 3, 15, 20, 'reps', 2, 'Your 2 kg pair', 45,
  'Slight elbow bend, lead with the elbows, stop at shoulder height. Slow 3 s down.', { loads: [2, 5], equipment: 'Your 2 kg dumbbell pair (5 kg once you\'ve earned it)' });
const chairDip = E('bench-dip', 'Chair Dips', 3, 8, 15, 'reps', null, 'Bodyweight, hands on a sturdy chair', 60, 'Shoulders down, elbows point back, stop at about 90°.');
const facePull = E('band-face-pull', 'Band Face Pull', 3, 15, 15, 'reps', null, 'Blue tube band on the door anchor, face height', 45, 'Pull toward your face with elbows high, split the handles apart.');
const calf = E('single-leg-calf', 'Single-leg Calf Raise', 3, 12, 20, 'reps', null, 'Bodyweight on a step; hold one dumbbell when easy', 30,
  'Full stretch at the bottom, pause 1s at the top.', { perSide: true, loads: ONE_DB, equipment: 'A stair edge + wall to hold; one dumbbell in the free hand when bodyweight gets easy' });
const pulldown = E('band-pulldown', 'Band Lat Pulldown', 3, 12, 15, 'reps', null, 'Blue tube band on the door anchor, top of the door', 60, 'Kneel, chest up, pull the handles to your upper chest, elbows drive down.');
const hammer = E('hammer-curl', 'Hammer Curl', 3, 10, 15, 'reps', 5, '5 kg per hand to start', 60,
  'Palms facing in, elbows pinned, slow 3 s down.', { loads: PAIR, equipment: KIT });

export const HOME_DAYS: Partial<Record<DayId, RoutineDay>> = {
  mon: {
    title: 'Home Push', focus: 'Chest · shoulders · triceps · dumbbells, bands + bodyweight', mins: '55', cardio: 'home', home: true,
    warmup: UPPER_WU, cooldown: UPPER_CD, exercises: [
      floorPress,
      E('stand-push-up', 'Push-ups on Stands', 3, 8, 15, 'reps', null, 'Bodyweight, hands on your push-up stands', 60, 'Body in one line, chest drops below the handles, elbows ~45°.'),
      shoulderPress,
      E('decline-push-up', 'Decline Push-ups', 3, 6, 12, 'reps', null, 'Feet on the bed or chair', 60, 'Hips level with the shoulders, lower until your chest nearly touches the floor.'),
      lateralRaise,
      chairDip,
      E('band-pushdown', 'Band Triceps Pushdown', 3, 12, 15, 'reps', null, 'Red loop or blue band on the door anchor, top of the door', 45, 'Elbows pinned to your sides, squeeze at the bottom.'),
    ],
  },
  tue: {
    title: 'Home Pull · Hinge', focus: 'Back · traps · rear delts · hamstrings · grip', mins: '50', cardio: 'none', home: true,
    warmup: [...UPPER_WU.slice(0, 3), 'Glute Bridge × 12', 'Hip hinges × 10'], cooldown: [...UPPER_CD, 'Hamstring Stretch · 30s/side'], exercises: [
      E('rdl', 'Dumbbell RDL', 3, 8, 12, 'reps', 10, '10 kg per hand to start', 120,
        'Soft knees, push the hips back, dumbbells slide down the thighs, flat back.', { loads: PAIR, equipment: KIT }),
      pulldown,
      E('bent-over-row', 'Dumbbell Bent-over Row', 3, 8, 12, 'reps', 10, '10 kg per hand to start', 90,
        'Hinge to ~45°, flat back, pull to the lower ribs, squeeze 1s.', { loads: PAIR, equipment: KIT }),
      facePull,
      E('shrug', 'Dumbbell Shrugs', 3, 12, 15, 'reps', 10, '10 kg per hand to start', 60,
        'Lift straight up, hold 1s, no rolling.', { loads: PAIR, equipment: KIT }),
      E('hand-gripper', 'Hand Gripper', 3, 15, 20, 'reps', null, 'Your hand gripper', 30, 'Squeeze fully closed, hold 1s, open slowly.', { perSide: true }),
    ],
  },
  wed: {
    title: 'Home Legs', focus: 'Quads · glutes · hamstrings · calves · core', mins: '55', cardio: 'none', home: true,
    warmup: LEG_WU, cooldown: LEG_CD, exercises: [
      E('goblet-squat', 'Goblet Squat', 4, 8, 15, 'reps', 10, 'One dumbbell, 10 kg to start', 120,
        'Hold one end at your chest, sit down between your heels, chest up, full depth.', { loads: ONE_DB, equipment: 'One dumbbell from your kit (up to 20 kg: two 5 kg plates each end)' }),
      E('bulgarian-split-squat', 'Bulgarian Split Squat', 3, 8, 12, 'reps', null, 'Bodyweight first, then dumbbells', 90,
        'Rear foot on the chair, most of your weight on the front foot, knee tracks over the toes.', { perSide: true, loads: PAIR, equipment: 'Chair or bed for your rear foot; dumbbells from your kit when bodyweight is easy' }),
      E('single-leg-rdl', 'Single-leg RDL', 3, 8, 12, 'reps', 5, 'One 5 kg dumbbell to start', 60,
        'Hinge on one leg, hips square, back flat, feel the hamstring.', { perSide: true, loads: ONE_DB, equipment: 'One dumbbell from your kit, held in the hand opposite the standing leg' }),
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
      E('bicep-curl', 'Bicep Curl', 3, 10, 15, 'reps', 5, '5 kg per hand to start', 60, 'Elbows fixed at your sides, no swinging, slow 3 s down.', { loads: PAIR, equipment: KIT }),
      E('ss-triceps-ext', 'Overhead Triceps Extension', 3, 10, 15, 'reps', 5, 'One dumbbell, 5 kg to start', 0,
        'Superset A1: go straight into A2 with no rest.', { superset: 'A1', loads: ONE_DB, equipment: 'One dumbbell from your kit, held with both hands' }),
      { ...hammer, cue: 'Superset A2: right after A1, then rest 60s.', superset: 'A2', rest: 60 },
      E('band-pull-apart', 'Band Pull-apart', 3, 15, 20, 'reps', null, 'Red loop, arms straight', 45, 'Pull the band to your chest, squeeze the shoulder blades.'),
      { ...lateralRaise },
    ],
  },
  fri: {
    title: 'Home Pull + Abs', focus: 'Back · biceps · rear delts · calves · core', mins: '55', cardio: 'home', home: true,
    warmup: UPPER_WU, cooldown: [...UPPER_CD, 'Cobra stretch · 30s'], exercises: [
      pulldown,
      E('single-arm-db-row', 'Single-arm Dumbbell Row', 3, 8, 12, 'reps', 10, 'One dumbbell, 10 kg to start', 60,
        'Knee and hand on the bed, pull to your hip, no twisting.', { perSide: true, loads: ONE_DB, equipment: 'One dumbbell from your kit + the bed or chair for support' }),
      E('band-y-raise', 'Band Y-Raise', 3, 12, 15, 'reps', null, 'Red loop under your feet, light', 45, 'Thumbs up, raise your arms into a Y, lower slowly.'),
      hammer,
      calf,
      E('reverse-crunch', 'Reverse Crunch', 3, 12, 15, 'reps', null, 'Bodyweight, on the mat', 45, 'Curl your hips off the mat toward your chest, lower slowly.'),
      E('plank', 'Plank', 3, 45, 60, 'sec', null, 'Bodyweight, on the mat', 45, 'Straight line head to heels, squeeze the glutes.'),
      E('mountain-climber', 'Mountain Climbers', 3, 30, 40, 'sec', null, 'Bodyweight', 45, 'Hips low, drive the knees in fast, keep the shoulders over the hands.'),
    ],
  },
};

/** Band-only versions, for weeks away from the dumbbells (travel): offered as swaps. */
export const BAND_SWAPS: Exercise[] = [
  E('band-chest-press', 'Band Chest Press', 3, 10, 15, 'reps', null, 'Blue tube band behind your back', 60, 'Band across your upper back, press forward and slightly together, slow back.'),
  E('band-overhead-press', 'Band Overhead Press', 3, 10, 15, 'reps', null, 'Stand on the red loop (blue band when easy)', 60, 'Brace your abs, press straight up, no leaning back.'),
  E('band-rdl', 'Band Romanian Deadlift', 4, 12, 15, 'reps', null, 'Stand on the blue tube band', 90, 'Soft knees, push the hips back, flat back, squeeze the glutes to stand.'),
  E('single-arm-band-row', 'Single-arm Band Row', 3, 10, 12, 'reps', null, 'Blue band on the door anchor, waist height', 60, 'Pull to your hip, no twisting, squeeze 1s.', { perSide: true }),
  E('band-shrug', 'Band Shrugs', 3, 15, 20, 'reps', null, 'Stand on the blue tube band', 45, 'Straight up toward the ears, hold 1s, no rolling.'),
  E('band-squat', 'Band Squat', 4, 12, 20, 'reps', null, 'Stand on the blue tube band, handles at your shoulders', 90, 'Feet shoulder-width, sit down between your heels, slow 3 s down.'),
  E('band-curl', 'Band Curl', 3, 10, 15, 'reps', null, 'Stand on the red loop (blue band when easy)', 60, 'Elbows fixed at your sides, slow 3 s down.'),
  E('band-overhead-triceps', 'Band Overhead Triceps Extension', 3, 12, 15, 'reps', null, 'Red loop under your back foot', 45, 'Elbows up by your head, straighten overhead, slow down.'),
  E('band-hammer-curl', 'Band Hammer Curl', 3, 12, 15, 'reps', null, 'Red loop or blue tube band under your feet', 45, 'Palms facing in, elbows pinned, slow 3 s down.'),
];
