import type { Exercise } from '../types';

export interface ExerciseDetails { targets: string; equipment?: string; steps: string[]; mistakes: string[]; }

/**
 * How-to details for every exercise in the built-in routines, keyed by exercise id.
 * Copies of routines made before details existed pick these up by id, too.
 */
export const DETAILS: Record<string, ExerciseDetails> = {
  // ---------- Push ----------
  'chest-press': {
    equipment: 'Chest press machine (seated, handles at mid-chest)',
    targets: 'Chest · front delts · triceps',
    steps: [
      'Set the seat so the handles line up with the middle of your chest.',
      'Sit tall, feet flat, and pinch your shoulder blades back and down.',
      'Press forward until your arms are almost straight, without locking the elbows.',
      'Bring the handles back slowly over 2–3 seconds until you feel a stretch across the chest.',
    ],
    mistakes: ['Shoulders rolling forward at the end of each rep', 'Elbows flared straight out at 90°', 'Letting the weight stack slam between reps'],
  },
  'incline-press': {
    equipment: 'Two dumbbells + adjustable bench set to 30–45°',
    targets: 'Upper chest · front delts · triceps',
    steps: [
      'Set the bench to 30–45° and sit back with a dumbbell on each thigh.',
      'Kick the dumbbells up one at a time as you lie back; start with them at chest level, palms forward.',
      'Press up and slightly together until the arms are almost straight.',
      'Lower slowly until the dumbbells are level with your upper chest.',
    ],
    mistakes: ['Bench set too steep (it becomes a shoulder press)', 'Arching the lower back off the bench', 'Bouncing the dumbbells out of the bottom'],
  },
  dips: {
    equipment: 'Assisted dip machine (kneel on the pad) or parallel dip bars',
    targets: 'Lower chest · triceps · front delts',
    steps: [
      'Use the assisted dip machine, or grip the parallel bars with straight arms.',
      'Lean your torso slightly forward and bend your knees behind you.',
      'Lower until your elbows reach about 90°, then stop.',
      'Push back up to straight arms without locking out hard.',
    ],
    mistakes: ['Going deeper than 90° (strains the shoulder joint)', 'Shrugging the shoulders up toward the ears', 'Swinging the legs for momentum'],
  },
  'lateral-raise': {
    equipment: 'Two light dumbbells',
    targets: 'Side delts',
    steps: [
      'Stand tall with a dumbbell at each side, a slight bend in the elbows.',
      'Raise the arms out to the sides, leading with the elbows, until they reach shoulder height.',
      'Pause for a moment at the top.',
      'Lower slowly over 2–3 seconds.',
    ],
    mistakes: ['Shrugging, so the traps take over', 'Swinging the body to lift the weight', 'Lifting above shoulder height'],
  },
  'triceps-pushdown': {
    equipment: 'Cable machine · pulley at the top · straight bar or rope',
    targets: 'Triceps',
    steps: [
      'Set the cable at the top and hold the bar or rope with elbows bent.',
      'Pin your elbows to your sides and lean forward very slightly.',
      'Push down until your arms are straight and squeeze the triceps.',
      'Let the bar rise slowly to about chest height, keeping elbows still.',
    ],
    mistakes: ['Elbows drifting forward', 'Leaning over the bar to push with body weight', 'Cutting the range short at the top'],
  },
  'shoulder-press': {
    equipment: 'Two dumbbells + bench set upright (90°)',
    targets: 'Front & side delts · triceps · upper chest',
    steps: [
      'Set a bench upright (or one notch back) and sit with your back flat against it.',
      'Start with the dumbbells at shoulder height, palms forward, elbows slightly in front of the body.',
      'Press up until the arms are almost straight and the dumbbells are above your head.',
      'Lower slowly back to shoulder height.',
    ],
    mistakes: ['Arching the lower back off the bench', 'Banging the dumbbells together at the top', 'Lowering only halfway'],
  },

  // ---------- Pull ----------
  deadlift: {
    equipment: 'Olympic barbell (20 kg) on the floor, plates optional',
    targets: 'Hamstrings · glutes · lower back · grip',
    steps: [
      'Stand with the bar over the middle of your feet, feet hip-width apart.',
      'Hinge at the hips and grip the bar just outside your legs; shins touch the bar.',
      'Brace your core, flatten your back and lift your chest.',
      'Push the floor away and stand up tall, keeping the bar close to your legs.',
      'Lower by pushing the hips back first, then bending the knees once the bar passes them.',
    ],
    mistakes: ['Rounding the lower back', 'Bar drifting away from the legs', 'Leaning back at the top', 'Jerking the bar off the floor'],
  },
  'lat-pulldown': {
    equipment: 'Lat pulldown machine · wide bar · thigh pad',
    targets: 'Lats · upper back · biceps',
    steps: [
      'Set the thigh pad so your legs are locked in.',
      'Grip the bar a little wider than shoulder-width, palms facing away.',
      'Lift your chest, lean back very slightly, and pull the bar to your upper chest by driving your elbows down.',
      'Let the bar rise slowly until your arms are straight.',
    ],
    mistakes: ['Pulling the bar behind the neck', 'Leaning far back and rowing it down', 'Letting the weight yank the arms up'],
  },
  'bent-over-row': {
    equipment: 'Two dumbbells (no bench needed)',
    targets: 'Mid-back · lats · rear delts · biceps',
    steps: [
      'Hold a dumbbell in each hand and hinge at the hips to about 45°, knees soft.',
      'Keep a flat back and let the arms hang straight down.',
      'Pull the dumbbells toward your lower ribs, squeezing your shoulder blades together.',
      'Lower slowly to straight arms.',
    ],
    mistakes: ['Rounding the back', 'Standing up more with every rep', 'Jerking the weight with the hips'],
  },
  'low-row': {
    equipment: 'Seated cable row machine · V-handle · foot platform',
    targets: 'Mid-back · lats · rear delts',
    steps: [
      'Sit with feet on the platform, knees slightly bent, back upright.',
      'Grab the handle with straight arms.',
      'Pull the handle to your belly button, elbows close to the body.',
      'Squeeze the shoulder blades together for 1 second, then let the arms extend slowly.',
    ],
    mistakes: ['Rocking the torso back and forth', 'Shrugging the shoulders up', 'Rounding forward on the way back'],
  },
  'face-pull': {
    equipment: 'Cable machine · pulley at face height · rope attachment',
    targets: 'Rear delts · upper back · rotator cuff',
    steps: [
      'Set the cable at about face height with a rope attachment.',
      'Hold the rope with thumbs pointing back and step back until the arms are straight.',
      'Pull the rope toward your face, splitting the ends apart, with elbows high.',
      'Hold briefly, then return slowly.',
    ],
    mistakes: ['Elbows dropping below shoulder height', 'Leaning back to pull with body weight', 'Using too much weight to finish the rep'],
  },
  shrug: {
    equipment: 'Two dumbbells',
    targets: 'Upper traps',
    steps: [
      'Stand tall with a dumbbell in each hand at your sides.',
      'Lift your shoulders straight up toward your ears.',
      'Hold the top for 1 second.',
      'Lower slowly to a full stretch.',
    ],
    mistakes: ['Rolling the shoulders in circles', 'Bending the elbows to help', 'Pushing the head forward'],
  },

  // ---------- Legs ----------
  squat: {
    equipment: 'Squat rack + Olympic barbell (20 kg) · a bench behind you for depth',
    targets: 'Quads · glutes · core',
    steps: [
      'Set the bar on your upper back (not your neck); feet shoulder-width, toes slightly out.',
      'Brace your core and keep your chest up.',
      'Sit back and down, knees tracking over your toes, only as deep as stays pain-free. A bench behind you is a good depth guide.',
      'Drive up through the whole foot to standing.',
    ],
    mistakes: ['Knees caving inward', 'Heels lifting off the floor', 'Going deeper than your knee allows', 'Rounding the back at the bottom'],
  },
  'leg-press': {
    equipment: '45° leg press machine (sled with a foot platform)',
    targets: 'Quads · glutes',
    steps: [
      'Sit back in the seat and place your feet hip-width in the middle of the platform.',
      'Release the safety and lower the platform until your knees reach about 90°.',
      'Push back up through your heels and mid-foot.',
      'Stop just short of locking the knees.',
    ],
    mistakes: ['Lowering so deep your hips lift off the seat', 'Locking the knees hard at the top', 'Knees caving inward'],
  },
  rdl: {
    equipment: 'Two dumbbells',
    targets: 'Hamstrings · glutes',
    steps: [
      'Stand with a dumbbell in each hand in front of your thighs, knees soft.',
      'Push your hips back and slide the dumbbells down your legs, back flat.',
      'Go down until you feel a strong hamstring stretch, usually just below the knees.',
      'Squeeze your glutes and drive the hips forward to stand up.',
    ],
    mistakes: ['Rounding the back to reach lower', 'Bending the knees so it becomes a squat', 'Dumbbells drifting away from the legs'],
  },
  'wall-sit': {
    equipment: 'Any flat wall',
    targets: 'Quads',
    steps: [
      'Stand with your back against a wall and feet about 60 cm in front of you.',
      'Slide down until your thighs are at or just above parallel to the floor.',
      'Keep knees over ankles and your back flat on the wall.',
      'Hold for the time, breathing steadily.',
    ],
    mistakes: ['Knees going past the toes', 'Hands pushing on the thighs', 'Holding your breath'],
  },
  'leg-curl': {
    equipment: 'Lying leg curl machine (pad behind your ankles)',
    targets: 'Hamstrings',
    steps: [
      'Adjust the machine so your knees line up with its pivot point and the pad sits just above your heels.',
      'Curl your heels toward your glutes.',
      'Squeeze at the top for a moment.',
      'Lower slowly over 2–3 seconds.',
    ],
    mistakes: ['Hips lifting off the pad', 'Letting the weight drop', 'Short, fast reps'],
  },
  'seated-calf': {
    equipment: 'Seated calf raise machine (pad on your thighs)',
    targets: 'Calves (soleus)',
    steps: [
      'Sit with the balls of your feet on the platform and the pad snug on your thighs.',
      'Lower your heels for a full stretch.',
      'Push up onto your toes as high as you can.',
      'Pause 1 second at the top, then lower slowly.',
    ],
    mistakes: ['Bouncing at the bottom', 'Half reps', 'Rushing through the set'],
  },
  'standing-calf': {
    equipment: 'Standing calf raise machine, or a step + one dumbbell',
    targets: 'Calves (gastrocnemius)',
    steps: [
      'Stand with the balls of your feet on a step or plate, heels hanging off. Use the machine, or hold a dumbbell and a rail.',
      'Keep your legs straight but not locked.',
      'Lower your heels for a full stretch, then rise onto your toes as high as you can.',
      'Pause 1 second at the top.',
    ],
    mistakes: ['Bending the knees to bounce', 'Cutting the stretch short', 'Rushing the reps'],
  },
  'side-plank': {
    equipment: 'Floor mat',
    targets: 'Obliques · hips',
    steps: [
      'Lie on your side with your elbow directly under your shoulder.',
      'Stack your feet, or stagger them for balance.',
      'Lift your hips so your body forms a straight line from head to feet.',
      'Hold, then switch sides.',
    ],
    mistakes: ['Hips sagging toward the floor', 'Rolling forward or back', 'Elbow too far from the shoulder'],
  },

  // ---------- Arms ----------
  flies: {
    equipment: 'Two dumbbells + flat bench',
    targets: 'Chest',
    steps: [
      'Lie on a flat bench with dumbbells above your chest, palms facing each other.',
      'Keep a slight, fixed bend in the elbows.',
      'Open the arms wide in an arc until you feel a stretch across the chest.',
      'Bring them back up as if hugging a big tree.',
    ],
    mistakes: ['Going too deep, which strains the shoulders', 'Bending the elbows more so it becomes a press', 'Clanking the dumbbells at the top'],
  },
  'bicep-curl': {
    equipment: 'Two dumbbells',
    targets: 'Biceps',
    steps: [
      'Stand tall with a dumbbell in each hand, palms forward.',
      'Keep your elbows pinned to your sides.',
      'Curl the dumbbells up toward your shoulders.',
      'Lower slowly to fully straight arms.',
    ],
    mistakes: ['Swinging the body', 'Elbows moving forward', 'Stopping before the arms are straight'],
  },
  'tri-bi-superset': {
    equipment: 'One 6 kg dumbbell (triceps) + two 4 kg dumbbells (curls)',
    targets: 'Triceps · biceps',
    steps: [
      'Do a full set of triceps extensions (6 kg).',
      'Go straight into a full set of curls (4 kg) with no rest.',
      'Rest 60 seconds after both, then repeat.',
    ],
    mistakes: ['Resting between the two exercises', 'Rushing reps because you are tired'],
  },
  'ss-triceps-ext': {
    equipment: 'One dumbbell, held with both hands',
    targets: 'Triceps (long head)',
    steps: [
      'Sit or stand and hold one dumbbell with both hands above your head.',
      'Keep your upper arms close to your head and pointing up.',
      'Lower the dumbbell behind your head by bending the elbows.',
      'Straighten the arms back up and squeeze. Go straight to the curls (A2).',
    ],
    mistakes: ['Elbows flaring out wide', 'Arching the lower back', 'Lowering only a little'],
  },
  'ss-curl': {
    equipment: 'Two light dumbbells',
    targets: 'Biceps',
    steps: [
      'Right after the triceps set, pick up the curl dumbbells.',
      'Elbows pinned to your sides, curl up toward your shoulders.',
      'Lower slowly to straight arms.',
      'Rest 60 seconds, then start the next round with A1.',
    ],
    mistakes: ['Swinging the body', 'Skipping the full stretch at the bottom'],
  },
  'hammer-curl': {
    equipment: 'Two dumbbells',
    targets: 'Biceps · brachialis · forearms',
    steps: [
      'Stand tall with a dumbbell in each hand, palms facing your body.',
      'Keep your elbows pinned to your sides.',
      'Curl the dumbbells up, keeping the palms facing in.',
      'Lower slowly to straight arms.',
    ],
    mistakes: ['Swinging the dumbbells', 'Twisting the wrists', 'Elbows drifting forward'],
  },
  'front-raise': {
    equipment: 'Two light dumbbells',
    targets: 'Front delts',
    steps: [
      'Stand tall with dumbbells in front of your thighs, palms facing you.',
      'Lift one or both arms straight forward to eye level, elbows slightly bent.',
      'Pause briefly at the top.',
      'Lower slowly.',
    ],
    mistakes: ['Leaning back to swing the weight up', 'Lifting above eye level', 'Shrugging'],
  },
  'rear-delt-fly': {
    equipment: 'Two light dumbbells (or the reverse-fly setting on a pec deck)',
    targets: 'Rear delts · upper back',
    steps: [
      'Hold light dumbbells and hinge forward until your chest is nearly parallel to the floor, back flat.',
      'Let the arms hang with a slight elbow bend.',
      'Raise the arms out to the sides, leading with the elbows, until level with your body.',
      'Lower slowly.',
    ],
    mistakes: ['Standing up during the set', 'Squeezing the shoulder blades instead of moving the arms', 'Using momentum'],
  },

  // ---------- Grip & core ----------
  'farmers-carry': {
    equipment: 'Two heavy dumbbells + a clear walkway',
    targets: 'Grip · forearms · traps · core',
    steps: [
      'Pick up a heavy dumbbell in each hand with a flat back, as in a deadlift.',
      'Stand tall with your shoulders back and down.',
      'Walk with short, steady steps for the time.',
      'Set the dumbbells down with control, hinging at the hips.',
    ],
    mistakes: ['Leaning to one side', 'Shoulders rounding forward', 'Rushing with long strides'],
  },
  'leg-raise': {
    equipment: 'Floor mat (or a flat bench)',
    targets: 'Lower abs · hip flexors',
    steps: [
      'Lie on your back, hands under your hips or by your sides.',
      'Press your lower back into the floor.',
      'Keeping your legs straight (or knees slightly bent), raise them until they point at the ceiling.',
      'Lower slowly, stopping before your lower back lifts.',
    ],
    mistakes: ['Lower back arching off the floor', 'Swinging the legs', 'Dropping the legs quickly'],
  },
  plank: {
    equipment: 'Floor mat',
    targets: 'Core · shoulders',
    steps: [
      'Set your forearms on the floor, elbows under your shoulders.',
      'Step your feet back so your body is one straight line from head to heels.',
      'Squeeze your glutes and brace your abs.',
      'Hold and breathe steadily.',
    ],
    mistakes: ['Hips sagging', 'Hips piked up high', 'Holding your breath'],
  },

  // ---------- Home ----------
  'bw-squat': {
    equipment: 'None (bodyweight)',
    targets: 'Quads · glutes',
    steps: [
      'Stand with feet shoulder-width apart, arms out in front for balance.',
      'Sit back and down slowly over about 3 seconds, to a pain-free depth.',
      'Keep your knees in line with your toes and your chest up.',
      'Stand up through the whole foot.',
    ],
    mistakes: ['Knees caving inward', 'Heels lifting', 'Dropping fast to the bottom'],
  },
  'glute-bridge': {
    equipment: 'Floor mat',
    targets: 'Glutes · hamstrings',
    steps: [
      'Lie on your back with knees bent and feet flat, hip-width apart.',
      'Push through your heels and lift your hips until knees, hips and shoulders form a line.',
      'Squeeze your glutes for 2 seconds at the top.',
      'Lower slowly.',
    ],
    mistakes: ['Arching the lower back instead of squeezing the glutes', 'Feet too far from the body', 'Rushing the reps'],
  },
  'step-up': {
    equipment: 'A low, stable step or stair',
    targets: 'Quads · glutes',
    steps: [
      'Stand facing a low, stable step and place one whole foot on it.',
      'Push through the heel of that foot to stand up on the step.',
      'Lower slowly with the same leg in control.',
      'Finish all reps on one side, then switch.',
    ],
    mistakes: ['Pushing off with the back foot', 'Knee caving inward', 'Step too high for a pain-free knee'],
  },
  'single-leg-calf': {
    equipment: 'A stair edge + wall or rail to hold',
    targets: 'Calves',
    steps: [
      'Stand on one foot on a stair edge, heel hanging off, holding the wall or rail.',
      'Lower your heel for a full stretch.',
      'Rise onto your toes as high as you can and pause 1 second.',
      'Finish all reps, then switch legs.',
    ],
    mistakes: ['Bouncing at the bottom', 'Bending the knee to help', 'Half reps'],
  },
  'push-up': {
    equipment: 'Floor (or a table/counter for incline push-ups)',
    targets: 'Chest · triceps · front delts · core',
    steps: [
      'Set your hands a little wider than shoulders. Use a table or counter for incline push-ups if needed.',
      'Make a straight line from head to heels and brace your core.',
      'Lower your chest toward the floor, elbows at about 45° from the body.',
      'Push back up to straight arms.',
    ],
    mistakes: ['Hips sagging', 'Elbows flaring straight out', 'Half reps'],
  },
  'russian-twist': {
    equipment: 'Floor mat',
    targets: 'Obliques · abs',
    steps: [
      'Sit with knees bent and lean back slightly with a straight back.',
      'Hold your hands together in front of your chest.',
      'Rotate your ribs to one side, then the other. Each side counts as one rep.',
      'Lift your feet off the floor only when it gets easy.',
    ],
    mistakes: ['Only moving the arms', 'Rounding the back', 'Going too fast'],
  },
  'dead-bug': {
    equipment: 'Floor mat',
    targets: 'Deep core',
    steps: [
      'Lie on your back with arms pointing at the ceiling and knees bent at 90° above your hips.',
      'Press your lower back into the floor.',
      'Slowly lower the opposite arm and leg toward the floor.',
      'Return and switch sides.',
    ],
    mistakes: ['Lower back lifting off the floor', 'Moving too fast', 'Holding your breath'],
  },
  'lying-leg-raise': {
    equipment: 'Floor mat',
    targets: 'Lower abs · hip flexors',
    steps: [
      'Lie on your back, hands under your hips.',
      'Press your lower back into the floor.',
      'Raise your straight legs until they point at the ceiling.',
      'Lower slowly, stopping before your back lifts.',
    ],
    mistakes: ['Lower back arching', 'Swinging the legs', 'Dropping them fast'],
  },

  // ---------- Alternatives (for swapping when a machine is busy) ----------
  'db-bench-press': {
    equipment: 'Two dumbbells + flat bench',
    targets: 'Chest · front delts · triceps',
    steps: [
      'Sit on the end of a flat bench with a dumbbell on each thigh, then lie back and bring them to chest level.',
      'Plant your feet and pinch your shoulder blades together.',
      'Press the dumbbells up over your chest until the arms are almost straight.',
      'Lower slowly until they are level with your chest.',
    ],
    mistakes: ['Elbows flared straight out', 'Bouncing at the bottom', 'Feet off the floor'],
  },
  'bench-dip': {
    equipment: 'A flat bench or sturdy chair',
    targets: 'Triceps · chest · front delts',
    steps: [
      'Sit on the edge of the bench with hands beside your hips, fingers forward.',
      'Slide your hips off the bench, knees bent and feet flat.',
      'Bend your elbows to lower your body until the elbows reach about 90°.',
      'Push back up to straight arms.',
    ],
    mistakes: ['Going deeper than 90°', 'Hips drifting far from the bench', 'Shrugging the shoulders'],
  },
  'cable-lateral-raise': {
    equipment: 'Cable machine · pulley at the bottom · single handle',
    targets: 'Side delts',
    steps: [
      'Stand side-on to the machine and hold the handle with the far hand, cable across your body.',
      'With a slight elbow bend, raise the arm out to the side up to shoulder height.',
      'Pause, then lower slowly.',
      'Finish all reps, then switch sides.',
    ],
    mistakes: ['Leaning away to swing the weight', 'Lifting above shoulder height', 'Shrugging'],
  },
  'machine-shoulder-press': {
    equipment: 'Shoulder press machine (seated, handles at shoulder height)',
    targets: 'Front & side delts · triceps',
    steps: [
      'Set the seat so the handles start level with your shoulders.',
      'Sit with your back flat against the pad and grip the handles.',
      'Press up until the arms are almost straight.',
      'Lower slowly back to shoulder height.',
    ],
    mistakes: ['Seat too low (handles start below the shoulders)', 'Arching off the back pad', 'Locking out hard'],
  },
  'back-extension': {
    equipment: '45° back extension (hyperextension) bench',
    targets: 'Lower back · glutes · hamstrings',
    steps: [
      'Set the pad just below your hip bones and hook your ankles under the rollers.',
      'Cross your arms over your chest.',
      'Lower your upper body by bending at the hips, back flat.',
      'Squeeze your glutes to come back up until your body is in a straight line.',
    ],
    mistakes: ['Arching past straight at the top', 'Rounding the back', 'Swinging fast'],
  },
  'assisted-pull-up': {
    equipment: 'Assisted pull-up machine (kneel or stand on the pad; more weight = more help)',
    targets: 'Lats · upper back · biceps',
    steps: [
      'Pick an assistance weight, kneel on the pad and grip the handles a little wider than your shoulders.',
      'Start hanging with straight arms.',
      'Pull your chest up toward the bar, driving your elbows down.',
      'Lower slowly to straight arms.',
    ],
    mistakes: ['Kicking the legs', 'Half reps that stop short of straight arms', 'Shrugging the shoulders up'],
  },
  'single-arm-db-row': {
    equipment: 'One dumbbell + flat bench',
    targets: 'Lats · mid-back · biceps',
    steps: [
      'Put one knee and the same hand on the bench, back flat and parallel to the floor.',
      'Hold the dumbbell in the other hand with the arm straight down.',
      'Pull the dumbbell toward your hip, elbow close to your side.',
      'Lower slowly; finish the set, then switch sides.',
    ],
    mistakes: ['Twisting the torso to lift', 'Pulling to the chest instead of the hip', 'Rounding the back'],
  },
  'band-pull-apart': {
    equipment: 'A light resistance band (or a light cable with two handles)',
    targets: 'Rear delts · upper back',
    steps: [
      'Hold the band at shoulder height with straight arms, hands shoulder-width apart.',
      'Pull your hands apart until the band touches your chest.',
      'Squeeze your shoulder blades for a moment.',
      'Return slowly.',
    ],
    mistakes: ['Bending the elbows a lot', 'Shrugging', 'Letting the band snap back'],
  },
  'goblet-squat': {
    equipment: 'One dumbbell, held vertically at your chest',
    targets: 'Quads · glutes · core',
    steps: [
      'Hold one end of a dumbbell against your chest, elbows pointing down.',
      'Feet shoulder-width apart, toes slightly out.',
      'Sit down between your heels to a pain-free depth, chest up.',
      'Drive up through the whole foot.',
    ],
    mistakes: ['Knees caving in', 'Heels lifting', 'Going deeper than your knee allows'],
  },
  'cable-crossover': {
    equipment: 'Cable machine with two pulleys set high · two handles',
    targets: 'Chest',
    steps: [
      'Set both pulleys high, take a handle in each hand and step forward into a split stance.',
      'With a slight bend in the elbows, bring the handles down and together in front of your chest.',
      'Squeeze your chest for a moment.',
      'Let the arms open slowly until you feel a stretch.',
    ],
    mistakes: ['Bending the elbows so it becomes a press', 'Leaning too far forward', 'Letting the weights slam'],
  },
  'cable-curl': {
    equipment: 'Cable machine · pulley at the bottom · straight or EZ bar',
    targets: 'Biceps',
    steps: [
      'Stand facing the machine holding the bar with palms up, arms straight.',
      'Keep your elbows pinned to your sides.',
      'Curl the bar up toward your shoulders.',
      'Lower slowly to straight arms.',
    ],
    mistakes: ['Leaning back', 'Elbows drifting forward', 'Stopping short at the bottom'],
  },
};

/** The details to show for an exercise: its own, or the built-in ones for its id. */
export function detailsOf(e: Exercise): ExerciseDetails | null {
  const base = DETAILS[e.id];
  const targets = e.targets ?? base?.targets ?? '';
  const equipment = e.equipment ?? base?.equipment;
  const steps = e.steps?.length ? e.steps : base?.steps ?? [];
  const mistakes = e.mistakes?.length ? e.mistakes : base?.mistakes ?? [];
  if (!targets && !steps.length && !mistakes.length && !equipment) return null;
  return { targets, equipment, steps, mistakes };
}
