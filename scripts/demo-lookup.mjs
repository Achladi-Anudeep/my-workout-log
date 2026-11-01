// One-off helper: prints ExerciseDB candidates for each exercise so the right demo can be pinned.
const Q = {
  'chest-press': ['lever chest press', 'chest press'], 'incline-press': ['dumbbell incline bench press', 'incline press'],
  dips: ['assisted chest dip', 'chest dip'], 'lateral-raise': ['dumbbell lateral raise'], 'triceps-pushdown': ['cable pushdown', 'triceps pushdown'],
  'shoulder-press': ['dumbbell seated shoulder press', 'dumbbell shoulder press'], deadlift: ['barbell deadlift'],
  'lat-pulldown': ['cable pulldown', 'lat pulldown', 'pulldown'], 'bent-over-row': ['dumbbell bent over row'], 'low-row': ['cable seated row', 'seated row'],
  'face-pull': ['face pull'], shrug: ['dumbbell shrug'], squat: ['barbell full squat', 'barbell squat'], 'leg-press': ['sled 45 leg press', 'leg press'],
  rdl: ['dumbbell romanian deadlift', 'romanian deadlift'], 'wall-sit': ['wall sit'], 'leg-curl': ['lever lying leg curl', 'leg curl'],
  'seated-calf': ['lever seated calf raise', 'seated calf raise'], 'standing-calf': ['lever standing calf raise', 'standing calf raise'],
  'side-plank': ['side bridge', 'side plank'], flies: ['dumbbell fly'], 'bicep-curl': ['dumbbell biceps curl', 'dumbbell curl'],
  'hammer-curl': ['dumbbell hammer curl', 'hammer curl'], 'ss-triceps-ext': ['dumbbell seated triceps extension', 'triceps extension'],
  'front-raise': ['dumbbell front raise'], 'rear-delt-fly': ['dumbbell rear fly', 'rear delt fly', 'rear lateral raise'],
  'farmers-carry': ['farmers walk'], 'leg-raise': ['lying leg raise', 'leg raise'], plank: ['front plank', 'plank'],
  'bw-squat': ['bodyweight squat', 'air squat'], 'glute-bridge': ['glute bridge', 'low glute bridge'], 'step-up': ['step-up', 'step up'],
  'push-up': ['push-up', 'push up'], 'russian-twist': ['russian twist'], 'dead-bug': ['dead bug'], 'single-leg-calf': ['single leg calf raise', 'calf raise'],
  'db-bench-press': ['dumbbell bench press'], 'bench-dip': ['bench dip'], 'cable-lateral-raise': ['cable lateral raise'],
  'machine-shoulder-press': ['lever shoulder press', 'shoulder press machine'], 'back-extension': ['hyperextension', 'back extension'],
  'assisted-pull-up': ['assisted pull-up', 'assisted pull up'], 'single-arm-db-row': ['dumbbell one arm bent over row', 'one arm row'],
  'band-pull-apart': ['band pull apart', 'pull apart'], 'goblet-squat': ['dumbbell goblet squat', 'goblet squat'],
  'cable-crossover': ['cable cross-over', 'cable crossover', 'cable fly'], 'cable-curl': ['cable curl', 'cable biceps curl'],
};
const DONE = new Set(["chest-press", "incline-press", "dips", "lateral-raise", "triceps-pushdown", "front-raise", "farmers-carry", "bicep-curl"]);
for (const [id, qs] of Object.entries(Q)) {
  if (DONE.has(id)) continue;
  const seen = new Set();
  const rows = [];
  for (const q of qs) {
    try {
      const r = await fetch(`https://oss.exercisedb.dev/api/v1/exercises?name=${encodeURIComponent(q)}&limit=10`);
      const j = await r.json();
      for (const d of j.data ?? []) if (!seen.has(d.exerciseId)) { seen.add(d.exerciseId); rows.push(`${d.exerciseId} | ${d.name} | ${d.equipments.join(',')} | ${d.targetMuscles.join(',')}`); }
    } catch (e) { rows.push(`ERR ${q}: ${e.message}`); }
    await new Promise(r => setTimeout(r, 4000));
  }
  console.log(`DEMO ${id}\n  ` + (rows.slice(0, 10).join('\n  ') || '(none)'));
}
