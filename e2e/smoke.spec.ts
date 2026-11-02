import { expect, test } from '@playwright/test';
import { PROD_SUPABASE_REF, openApp, tab, watchErrors } from './helpers';

// Read-only checks. Safe for production: no sign-in, no data written.
// EXPECTED_SHA / EXPECTED_ENV come from the pipeline and pin the exact deploy under test.

test.describe('@smoke', () => {
  test('serves the expected version on the right database', async ({ request }) => {
    const res = await request.get(`/version.json?t=${Date.now()}`);
    expect(res.ok()).toBe(true);
    const v = await res.json();
    if (process.env.EXPECTED_SHA) expect(v.sha).toBe(process.env.EXPECTED_SHA);
    const env = process.env.EXPECTED_ENV;
    if (env) expect(v.env).toBe(env);
    if (env === 'prod') expect(v.supabaseHost).toContain(PROD_SUPABASE_REF);
    if (env === 'test') {
      expect(v.supabaseHost, 'the test site must have its own database').toBeTruthy();
      expect(v.supabaseHost).not.toContain(PROD_SUPABASE_REF);
    }
  });

  test('sends security headers', async ({ request }) => {
    test.skip(!process.env.BASE_URL, 'headers come from Netlify, not the local preview server');
    const res = await request.get('/');
    const h = res.headers();
    expect(h['content-security-policy']).toContain("default-src 'self'");
    expect(h['x-frame-options']).toBe('DENY');
    expect(h['x-content-type-options']).toBe('nosniff');
  });

  test('every screen loads without errors', async ({ page }) => {
    const errs = watchErrors(page);
    await openApp(page);
    for (const t of ['calendar', 'progress', 'tutorials', 'plan', 'today'] as const) {
      await tab(page, t);
      await page.waitForTimeout(300);
    }
    await expect(page.locator('main')).toContainText(/Week \d+/);
    errs.assertNone();
  });

  test('the AI helper is deployed and refuses requests without a signed-in account', async ({ request }) => {
    test.skip(!process.env.BASE_URL, 'functions run on Netlify, not the local preview server');
    const res = await request.post('/.netlify/functions/ai', { data: { task: 'ask', question: 'hi' } });
    expect(res.status()).toBe(401);
  });

  test('is installable and works offline after the first visit', async ({ page, context, request, browserName }) => {
    const manifest = await (await request.get('/manifest.webmanifest')).json();
    expect(manifest.display).toBe('standalone');
    expect(manifest.icons.length).toBeGreaterThanOrEqual(2);
    const icon = await request.get(manifest.icons[0].src);
    expect(icon.ok()).toBe(true);

    // Playwright can only drive service workers fully in Chromium; real Safari is checked by hand on the phone.
    test.skip(browserName !== 'chromium', 'service worker checks run in Chromium');
    await openApp(page);
    await page.evaluate(async () => { await navigator.serviceWorker.ready; });
    await page.reload();
    await expect.poll(() => page.evaluate(() => !!navigator.serviceWorker.controller)).toBe(true);
    await expect(page.getByText('My Workout Log', { exact: true })).toBeVisible();

    await context.setOffline(true);
    await page.reload();
    await expect(page.getByText('My Workout Log', { exact: true })).toBeVisible();
    await context.setOffline(false);
  });

  test('sync is configured on deployed sites', async ({ page }) => {
    test.skip(!process.env.BASE_URL, 'local builds have no database');
    await openApp(page);
    await tab(page, 'plan');
    await expect(page.getByText("Sync isn't set up for this site yet")).toHaveCount(0);
    await expect(page.getByText(/Sync across devices|Signed in as/)).toBeVisible();
  });
});
