const Q = [
  ['face-pull', ['face pull', 'cable rear delt row', 'cable standing rear delt row'], /face|rear delt row/i],
  ['shrug', ['dumbbell shrug', 'shrug'], /shrug/i],
  ['wall-sit', ['wall sit', 'wall squat', 'isometric squat'], /wall|isometric/i],
  ['flies', ['dumbbell fly', 'dumbbell flat fly', 'dumbbell chest fly'], /fly/i],
  ['plank', ['front plank', 'plank', 'forearm plank'], /plank/i],
  ['push-up', ['push-up', 'pushup', 'push up'], /^push-?up$|^push up$|^push-up \(|^incline push-up$/i],
  ['band-pull-apart', ['band pull apart', 'band reverse fly', 'band face pull'], /pull.?apart|reverse fly|face pull/i],
  ['db-bench-press', ['dumbbell bench press', 'dumbbell flat bench press'], /dumbbell (flat )?bench press$|^dumbbell bench press/i],
  ['back-extension', ['hyperextension', 'back extension', '45 degree hyperextension'], /hyperextension|back extension/i],
  ['bench-dip', ['bench dip', 'triceps dip bench'], /dip/i],
];
for (const [id, qs, re] of Q) {
  const seen = new Set(); const rows = [];
  for (const q of qs) {
    try {
      const j = await (await fetch(`https://oss.exercisedb.dev/api/v1/exercises?name=${encodeURIComponent(q)}&limit=25`)).json();
      for (const d of j.data ?? []) if (!seen.has(d.exerciseId) && re.test(d.name)) { seen.add(d.exerciseId); rows.push(`${d.exerciseId} | ${d.name} | ${d.equipments.join(',')}`); }
    } catch (e) { rows.push(`ERR ${q}: ${e.message}`); }
    await new Promise(r => setTimeout(r, 4000));
  }
  console.log(`DEMO ${id}\n  ` + (rows.slice(0, 12).join('\n  ') || '(none)'));
}
