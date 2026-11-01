import { expect, test, type Browser, type Page } from '@playwright/test';
import { openApp, resetTestAccount, tab, watchErrors } from './helpers';

// Real sync against the TEST environment and its test database, with a dedicated test account.
// Simulates your phone and your laptop as two separate browsers signed into the same account.

const email = process.env.TEST_USER_EMAIL ?? '';
const password = process.env.TEST_USER_PASSWORD ?? '';

async function signIn(page: Page) {
  await openApp(page);
  await tab(page, 'plan');
  await page.locator('#acct-email').fill(email);
  await page.locator('#acct-password').fill(password);
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await expect(page.getByText(`Signed in as ${email}`)).toBeVisible();
  await expect(page.getByRole('button', { name: /^Synced$/ })).toBeVisible({ timeout: 20_000 });
}

async function syncNow(page: Page) {
  await tab(page, 'plan');
  await page.getByRole('button', { name: 'Sync now' }).click();
  await expect(page.getByRole('button', { name: /^Synced$/ })).toBeVisible({ timeout: 20_000 });
}

async function laptop(browser: Browser) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  return ctx.newPage();
}

test.describe('@env', () => {
  test.describe.configure({ mode: 'serial' });

  test.beforeAll(async () => {
    expect(email, 'TEST_USER_EMAIL is not set').not.toBe('');
    expect(password, 'TEST_USER_PASSWORD is not set').not.toBe('');
    await resetTestAccount(email, password);
  });

  test('phone and laptop stay in sync: workouts, weight, routines and deletes', async ({ page, browser }) => {
    const errs = watchErrors(page);
    const tag = `e2e-${Date.now()}`;

    // ---- phone: sign in, log a workout, a weigh-in and a routine
    await signIn(page);
    await tab(page, 'today');
    await page.locator('#day-mon').click();
    await page.locator('#start-workout').click();
    await page.locator('#chest-press-w-0').fill('12.5');
    await page.locator('#chest-press-r-0').fill('15');
    await page.getByRole('button', { name: 'Mark set 1 done' }).first().click();
    await page.getByRole('button', { name: 'Skip' }).click();
    await page.getByRole('button', { name: 'Finish ›' }).click();
    await page.locator('#session-note').fill(tag);
    await page.getByRole('button', { name: 'Save workout' }).click();

    await tab(page, 'today');
    await page.getByRole('button', { name: /Log weight|Log again/ }).first().click();
    await page.locator('#weight-kg').fill('65.4');
    await page.getByRole('button', { name: 'Save weight' }).click();

    await tab(page, 'plan');
    await page.locator('#new-routine').click();
    await page.locator('#new-from-v2').click();
    await page.locator('#routine-name').fill(`Routine ${tag}`);
    await page.locator('#set-active').click();
    await page.waitForTimeout(1500); // routine edits upload after a short pause
    await syncNow(page);

    // ---- laptop: sign in and see everything
    const lap = await laptop(browser);
    const lapErrs = watchErrors(lap);
    await signIn(lap);
    await tab(lap, 'calendar');
    await lap.locator('article button[aria-expanded]').first().click();
    await expect(lap.locator('article').first()).toContainText(tag);
    await expect(lap.locator('article').first()).toContainText('12.5×15');
    await tab(lap, 'progress');
    await expect(lap.locator('main')).toContainText('65.4 kg');
    await tab(lap, 'plan');
    await expect(lap.locator('main')).toContainText(`Running Routine ${tag}`);

    // ---- laptop deletes the workout → gone on the phone
    await tab(lap, 'calendar');
    await lap.getByRole('button', { name: 'Delete session' }).click();
    await lap.getByRole('button', { name: 'Tap again to delete' }).click();
    await syncNow(lap);

    await syncNow(page);
    await tab(page, 'calendar');
    await expect(page.locator('main')).not.toContainText(tag);

    errs.assertNone();
    lapErrs.assertNone();
    await lap.context().close();
  });

  test('a workout logged with no signal uploads when the connection returns', async ({ page, context, browser }) => {
    await signIn(page);
    await context.setOffline(true);
    await tab(page, 'today');
    await page.locator('#day-fri').click();
    await page.locator('#start-workout').click();
    await page.getByRole('button', { name: 'Mark set 1 done' }).first().click();
    await page.getByRole('button', { name: 'Skip' }).click();
    await page.getByRole('button', { name: 'Finish ›' }).click();
    await page.locator('#session-note').fill('logged offline');
    await page.getByRole('button', { name: 'Save workout' }).click();
    await expect(page.getByRole('button', { name: /Offline/ })).toBeVisible({ timeout: 30_000 });

    await context.setOffline(false);
    await syncNow(page);

    const lap = await laptop(browser);
    await signIn(lap);
    await tab(lap, 'calendar');
    await lap.locator('article button[aria-expanded]').first().click();
    await expect(lap.locator('article').first()).toContainText('logged offline');
    await lap.context().close();
  });

  test.afterAll(async () => {
    if (email && password) await resetTestAccount(email, password);
  });
});
