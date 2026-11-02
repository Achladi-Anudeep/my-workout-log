// Checks that every pinned demo GIF still loads from ExerciseDB.
// ExerciseDB sometimes drops a media file while the exercise record stays, which leaves a blank tile in the app.
// Runs every few days (keep-alive workflow) and fails loudly with the exercises that need a new demo.
import { readFileSync } from 'node:fs';

const src = readFileSync(new URL('../src/data/demos.ts', import.meta.url), 'utf8');
const block = src.slice(src.indexOf('DEMO_ID'), src.indexOf('};', src.indexOf('DEMO_ID')));
const pins = [...block.matchAll(/^\s*'?([a-z0-9-]+)'?:\s*'([A-Za-z0-9]{7})'/gm)].map(m => ({ ex: m[1], id: m[2] }));
if (pins.length < 40) { console.error(`Only found ${pins.length} pins; the parser needs updating.`); process.exit(1); }

const broken = [];
for (const { ex, id } of pins) {
  const url = `https://static.exercisedb.dev/media/${id}.gif`;
  let ok = false;
  for (let attempt = 0; attempt < 3 && !ok; attempt++) {
    try {
      const res = await fetch(url, { method: 'GET', headers: { Range: 'bytes=0-15' } });
      const type = res.headers.get('content-type') ?? '';
      ok = (res.status === 200 || res.status === 206) && type.includes('image');
      if (!ok && res.status === 404) break;
    } catch { /* retry */ }
    if (!ok) await new Promise(r => setTimeout(r, 2000));
  }
  console.log(`${ok ? 'ok    ' : 'BROKEN'} ${ex} (${id})`);
  if (!ok) broken.push(ex);
}
if (broken.length) {
  console.error(`\n${broken.length} demo(s) no longer load: ${broken.join(', ')}. Pick new ids in src/data/demos.ts.`);
  process.exit(1);
}
console.log(`\nAll ${pins.length} demos load.`);
