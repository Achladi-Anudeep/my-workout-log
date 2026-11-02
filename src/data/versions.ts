/**
 * Hand-picked "other versions" of each exercise from ExerciseDB: different equipment, grip, or an easier/harder
 * variation. Every animation was checked by eye and confirmed to load (Nov 2026). Labels are ours, written to
 * describe what the animation shows, because some library names are misleading.
 */
export interface Version { id: string; label: string; note?: string }

const v = (id: string, label: string, note?: string): Version => ({ id, label, ...(note ? { note } : {}) });

export const VERSIONS: Record<string, Version[]> = {
  'chest-press': [v('T0yTjgW', 'Chest press machine (another model)'), v('jHAnWmT', 'Incline chest press machine'), v('nIR4Rwl', 'Seated cable chest press')],
  'incline-press': [v('8eqjhOl', 'Incline dumbbell press, palms facing in', 'Easier on the shoulders'), v('3TZduzM', 'Incline barbell bench press'), v('5v7KYld', 'Incline press on the Smith machine')],
  dips: [v('PnZJIrk', 'Assisted dip machine, wide grip'), v('BRImeP8', 'Seated dip machine'), v('9WTm7dq', 'Bodyweight chest dip on bars', 'Harder: no assistance')],
  'lateral-raise': [v('hrrS0Ed', 'Seated dumbbell lateral raise', 'Stops you swinging'), v('goJ6ezq', 'Cable lateral raise'), v('dRTfGZT', 'Lateral raise machine')],
  'band-lateral-raise': [v('goJ6ezq', 'Cable lateral raise (gym)'), v('hrrS0Ed', 'Seated dumbbell lateral raise')],
  'triceps-pushdown': [v('dU605di', 'Rope pushdown'), v('gAwDzB3', 'V-bar pushdown'), v('qRZ5S1N', 'Single-arm cable pushdown')],
  'shoulder-press': [v('f1jf47L', 'Seated dumbbell press, palms facing in', 'Easier on the shoulders'), v('A6wtbuL', 'Standing dumbbell press'), v('dNFYIU1', 'Shoulder press machine')],
  'front-raise': [v('Rr7S3yg', 'Dumbbell front raise (another angle)'), v('u2X71Np', 'Cable front raise'), v('Ys97II0', 'Seated dumbbell front raise')],
  deadlift: [v('nUwVh7b', 'Dumbbell deadlift', 'Easier to learn'), v('KgI0tqW', 'Sumo deadlift (wide stance)'), v('wQ2c4XD', 'Barbell Romanian deadlift')],
  'lat-pulldown': [v('rkg41Fb', 'Pulldown with parallel (neutral) grip'), v('4c9BhzB', 'Close-grip pulldown with V-handle'), v('ecpY0rH', 'Underhand-grip pulldown machine')],
  'bent-over-row': [v('C0MA9bC', 'Single-arm dumbbell row on a bench', 'Supports your back'), v('eZyBC3j', 'Barbell bent-over row'), v('LuBEORI', 'T-bar row with V-handle')],
  'low-row': [v('7I6LNUG', 'Seated row machine (chest pad)', 'Supports your back'), v('SJqRxOt', 'Seated cable row with rope'), v('fUBheHs', 'Seated cable row (another angle)')],
  'band-row': [v('km0sQC0', 'Standing single-arm band row (door anchor)'), v('hvV79Si', 'Seated cable row (gym)')],
  'rear-delt-fly': [v('myfUsKf', 'Reverse fly on the pec deck machine', 'Easiest to learn'), v('EAs3xL9', 'Dumbbell reverse fly, chest on an incline bench'), v('aqvSOQE', 'Cable crossover reverse fly')],
  squat: [v('yn8yg1r', 'Goblet squat (one dumbbell)', 'Knee-friendlier, easy to learn'), v('DhMl549', 'Barbell squat, seen from behind'), v('75Bgtjy', 'Bodyweight squat')],
  'bw-squat': [v('b63ZzGe', 'Squat holding a bench for support', 'Easier: good on knee-pain days'), v('yn8yg1r', 'Goblet squat (one dumbbell)', 'Harder'), v('QChZi3x', 'Squat to overhead reach')],
  'leg-press': [v('2Qh2J1e', '45° leg press (another model)'), v('yn2lLSI', '45° leg press, seen from behind', 'Watch the knees track over the toes'), v('WWD6FzI', 'Single-leg 45° leg press')],
  rdl: [v('wQ2c4XD', 'Barbell Romanian deadlift'), v('5eLRITT', 'Dumbbell stiff-leg deadlift'), v('gKozT8X', 'Single-leg dumbbell deadlift', 'Harder: balance')],
  'leg-curl': [v('Zg3XY7P', 'Seated leg curl machine'), v('FkBIE6a', 'Lying dumbbell leg curl'), v('C5jncD2', 'Standing single-leg curl (bodyweight)')],
  'seated-calf': [v('r29jP7S', 'Seated calf raise with dumbbells on the knees'), v('Ia7tumC', 'Seated single-leg calf raise'), v('ipvgBnC', 'Seated calf raise with a barbell')],
  'standing-calf': [v('bJYHBIN', 'Bodyweight standing calf raise'), v('8ozhUIZ', 'Barbell standing calf raise'), v('6MaEjVA', 'Smith machine standing calf raise')],
  'single-leg-calf': [v('fKZgDEO', 'Single-leg calf raise holding a dumbbell'), v('0jp9Rlz', 'Single-leg calf raise on the floor'), v('1kB3Wmk', 'Dumbbell single-leg calf raise')],
  'side-plank': [v('5VXmnV5', 'Side plank with hands on a bench', 'Easier'), v('VO2qeJg', 'Side plank with leg lift', 'Harder')],
  'bicep-curl': [v('BU15nH4', 'Alternating dumbbell curl'), v('F3xgbjF', 'Incline dumbbell curl'), v('BCGQ6J5', 'Cable curl')],
  'hammer-curl': [v('HPlPoQA', 'Cable hammer curl with rope'), v('HDYiZcY', 'Cross-body hammer curl'), v('6em2Dxj', 'Seated alternating hammer curl')],
  'ss-triceps-ext': [v('2IxROQ1', 'Overhead cable extension with rope'), v('FQXdXzY', 'Seated two-dumbbell overhead extension'), v('5uFK1xr', 'Overhead extension with a barbell')],
  'leg-raise': [v('Hgs6Nl1', 'Seated leg raise on a bench', 'Easier'), v('weoDEpH', "Captain's chair leg raise", 'Harder'), v('I3tsCnC', 'Hanging leg raise', 'Hardest')],
  'glute-bridge': [v('aWedzZX', 'Glute bridge with feet on a bench'), v('GibBPPg', 'Glute bridge march', 'Harder'), v('qKBpF7I', 'Barbell glute bridge', 'Gym version')],
  'band-glute-bridge': [v('aWedzZX', 'Glute bridge with feet on a bench'), v('GibBPPg', 'Glute bridge march', 'Harder')],
  'step-up': [v('d5bTEPV', 'Band step-up'), v('Kxquu2E', 'Barbell step-up', 'Gym version')],
  'push-up': [v('B1EVP9F', 'Incline push-up (hands on a bench)', 'Easier'), v('F7vjXqT', 'Incline push-up on a box', 'Easier'), v('JmMVpR3', 'Wide-hand push-up'), v('i5cEhka', 'Decline push-up (feet up)', 'Harder')],
  'russian-twist': [v('6sYyrRX', 'Lying knee twist', 'Easier on the lower back'), v('aVs3BR3', 'Standing cable twist')],
  'face-pull': [v('wqNPGCg', 'Face pull from a high pulley'), v('G61cXLk', 'Kneeling face pull'), v('tc5dYrf', 'Face pull with a band (home)')],
  'band-face-pull': [v('wqNPGCg', 'Cable face pull (gym)'), v('G61cXLk', 'Kneeling cable face pull')],
  shrug: [v('dG7tG5y', 'Barbell shrug'), v('Eg98Ft9', 'Cable shrug'), v('ZZKbeMw', 'Shrug machine')],
  flies: [v('ESOd5Pl', 'Incline dumbbell fly'), v('0CXGHya', 'Cable crossover (high pulleys)'), v('FVmZVhk', 'Low-to-high cable fly')],
  plank: [v('h1ezqSu', 'Kneeling plank with shoulder taps', 'Easier'), v('CosupLu', 'Plank with twist', 'Harder')],
};
// Same movement, different id in the routines.
VERSIONS['ss-curl'] = VERSIONS['bicep-curl'];
VERSIONS['tri-bi-superset'] = VERSIONS['ss-triceps-ext'];
VERSIONS['lying-leg-raise'] = VERSIONS['leg-raise'];

/**
 * Demos for warm-up and cool-down moves, matched by name. Moves the library has no clean match for
 * (cat-camel, 90-90 hips, ankle rocks, thread the needle, pigeon, hip-flexor stretch, arm circles) stay text-only.
 */
export const WARMUP_DEMOS: { match: RegExp; id: string; note?: string }[] = [
  { match: /inch ?worm/i, id: 'TV87DNB' },
  { match: /cobra to mountain/i, id: '01qpYSe', note: 'Shows the cobra part. Then push your hips up and back into a downward dog (the "mountain").' },
  { match: /world.?s greatest/i, id: 'DFGXwZr' },
  { match: /child.?s pose/i, id: 'f38OEuO', note: 'Kneel, sit your hips back to your heels and reach your arms forward.' },
  { match: /chest (&|and) triceps/i, id: '3uj0Ozg', note: 'Chest part shown. For triceps, reach one hand down your back and gently pull the elbow.' },
  { match: /glute bridge/i, id: 'u0cNiij' },
  { match: /band pull.?apart/i, id: 'sTfvVsG' },
  { match: /^hamstring stretch/i, id: '99rWm7w' },
  { match: /quad stretch/i, id: 'BWnJR72', note: 'Shown on your side. Lying face down works the same.' },
  { match: /figure.?4/i, id: 'QY39eBr', note: 'Seated version shown. Lying on your back works the same.' },
  { match: /butterfly/i, id: 'bWlZvXh' },
  { match: /^bodyweight squats/i, id: '75Bgtjy' },
  { match: /^push-ups × \d+ easy/i, id: 'I4hDWkc' },
  { match: /calf (&|and) ankle stretch|calf stretch/i, id: '17bqEXD' },
];

export const warmupDemo = (item: string) => WARMUP_DEMOS.find(d => d.match.test(item)) ?? null;
