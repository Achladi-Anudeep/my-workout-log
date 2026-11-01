// Waits until a Netlify site serves the given commit (read from /version.json), then checks its database.
// Usage: node scripts/wait-for-deploy.mjs <site-url> <commit-sha> <prod|test> [timeout-minutes]
import { PROD_SUPABASE_REF } from './check-env.mjs';

const [site, sha, env, minutes = '15'] = process.argv.slice(2);
if (!site || !sha || !env) { console.error('usage: wait-for-deploy.mjs <site-url> <sha> <prod|test> [minutes]'); process.exit(2); }

const deadline = Date.now() + Number(minutes) * 60_000;
let last = '';
while (Date.now() < deadline) {
  try {
    const res = await fetch(`${site.replace(/\/$/, '')}/version.json?t=${Date.now()}`, { cache: 'no-store' });
    if (res.ok) {
      const v = await res.json();
      if (v.sha === sha) {
        console.log(`✓ ${site} is serving ${sha.slice(0, 7)} (${v.env}, database ${v.supabaseHost ?? 'none'})`);
        if (v.env !== env) { console.error(`✖ expected a ${env} build but got ${v.env}`); process.exit(1); }
        if (env === 'test' && (!v.supabaseHost || v.supabaseHost.includes(PROD_SUPABASE_REF))) {
          console.error('✖ the test site must use the test database (set it in netlify.toml → [context.develop.environment])');
          process.exit(1);
        }
        if (env === 'prod' && !v.supabaseHost?.includes(PROD_SUPABASE_REF)) { console.error('✖ production is not using the production database'); process.exit(1); }
        process.exit(0);
      }
      if (v.sha !== last) { console.log(`… ${site} still serves ${String(v.sha).slice(0, 7)}, waiting for ${sha.slice(0, 7)}`); last = v.sha; }
    } else if (last !== `http-${res.status}`) {
      console.log(`… ${site}/version.json → HTTP ${res.status}, waiting`); last = `http-${res.status}`;
    }
  } catch (e) {
    if (last !== 'err') { console.log(`… ${site} not reachable yet (${e.message})`); last = 'err'; }
  }
  await new Promise(r => setTimeout(r, 15_000));
}
console.error(`✖ ${site} did not serve ${sha.slice(0, 7)} within ${minutes} minutes. Check the Netlify deploy log for this commit.`);
process.exit(1);
