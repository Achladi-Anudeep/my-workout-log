// Supabase pauses free projects after about a week without activity, which silently stops sync.
// This makes one tiny read against each environment's database, using the same public URL and key
// that site's deployed app ships with (read from its JavaScript), so nothing secret is needed.
// Usage: node scripts/keep-alive.mjs <site-url> [<site-url> ...]

let failed = false;
for (const site of process.argv.slice(2)) {
  try {
    const html = await (await fetch(site, { cache: 'no-store' })).text();
    const scripts = [...html.matchAll(/src="(\/assets\/[^"]+\.js)"/g)].map(m => m[1]);
    let url = null, key = null;
    for (const s of scripts) {
      const js = await (await fetch(new URL(s, site))).text();
      url ??= /https:\/\/[a-z0-9]{20}\.supabase\.co/.exec(js)?.[0] ?? null;
      key ??= /sb_publishable_[A-Za-z0-9_-]+|eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/.exec(js)?.[0] ?? null;
    }
    if (!url || !key) throw new Error('could not find the database settings in the deployed app');
    const res = await fetch(`${url}/rest/v1/sessions?select=id&limit=1`, { headers: { apikey: key } });
    if (!res.ok) throw new Error(`database answered HTTP ${res.status} (it may be paused: resume it in the Supabase dashboard)`);
    console.log(`✓ ${site} → ${new URL(url).host} is awake`);
  } catch (e) {
    failed = true;
    console.error(`✖ ${site}: ${e.message}`);
  }
}
process.exit(failed ? 1 : 0);
