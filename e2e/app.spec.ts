import { expect, test } from '@playwright/test';
import { mockExerciseDb, openApp, tab, watchErrors } from './helpers';

// Full UI flows on a local build with no database (this-device-only mode).
// Service workers are blocked here so the ExerciseDB mock can intercept requests.
test.use({ serviceWorkers: 'block' });

test.describe('@local', () => {
  let errs: ReturnType<typeof watchErrors>;
  test.beforeEach(async ({ page }) => {
    errs = watchErrors(page);
    await mockExerciseDb(page);
    await openApp(page);
  });
  test.afterEach(() => errs.assertNone());

  test('Today shows the active routine with full exercise details', async ({ page }) => {
    await page.locator('#day-mon').click();
    await expect(page.locator('main')).toContainText('Gym PPL');
    await expect(page.locator('main')).toContainText('Works: Chest · front delts · triceps');
    // the card shows only demo, sets × reps + weight and last time; the rest is one tap away
    await page.getByRole('button', { name: /^More about / }).first().click();
    await page.getByRole('button', { name: 'How to do it' }).first().click();
    await expect(page.locator('main')).toContainText('Set the seat so the handles line up');
    await expect(page.locator('main')).toContainText('Key cue');
    await expect(page.locator('main')).toContainText('Avoid');
  });

  test('logs a workout and shows it on the calendar', async ({ page }) => {
    await page.locator('#day-mon').click();
    await page.locator('#start-workout').click();
    await page.getByRole('button', { name: 'Finish ›' }).click();
    // Nothing ticked yet → can't save an empty workout
    await expect(page.getByRole('button', { name: 'Save workout' })).toBeDisabled();
    await page.getByRole('button', { name: 'Keep training' }).click();

    await page.locator('#chest-press-w-0').fill('12.5');
    await page.locator('#chest-press-r-0').fill('15');
    await page.getByRole('button', { name: 'Mark set 1 done' }).first().click();
    await expect(page.getByText('Resting')).toBeVisible();
    await page.getByRole('button', { name: 'Skip' }).click();

    await page.getByRole('button', { name: 'Finish ›' }).click();
    await page.locator('#cardio-min').fill('15');
    await page.locator('#session-note').fill('e2e workout');
    await page.getByRole('button', { name: 'Save workout' }).click();

    await expect(page.locator('main')).toContainText('Calendar');
    await page.locator('article button[aria-expanded]').first().click();
    await expect(page.locator('article').first()).toContainText('Chest Press');
    await expect(page.locator('article').first()).toContainText('12.5×15');
    await expect(page.locator('article').first()).toContainText('e2e workout');

    // Survives closing and reopening the app
    await page.reload();
    await tab(page, 'calendar');
    await expect(page.locator('article').first()).toContainText('Push');

    // Next Monday prefills 12.5 kg from this session
    await tab(page, 'today');
    await page.locator('#day-mon').click();
    await expect(page.locator('main')).toContainText('Last: 12.5×15');
    // the coach says what to do next time, and why
    await page.getByRole('button', { name: 'More about Chest Press' }).click();
    await page.locator('article', { hasText: 'Chest Press' }).first().getByRole('button', { name: /Stay at 12.5 kg/ }).click();
    await expect(page.locator('main')).toContainText('Add weight once every set hits 15 reps');
  });

  test('logs body weight with validation and shows the trend', async ({ page }) => {
    await page.getByRole('button', { name: '+ Log weight' }).first().click();
    await page.locator('#weight-kg').fill('6');
    await page.getByRole('button', { name: 'Save weight' }).click();
    await expect(page.getByText('Enter your weight in kg')).toBeVisible();
    await page.locator('#weight-kg').fill('65.8');
    await page.getByRole('button', { name: 'Save weight' }).click();
    await expect(page.locator('main')).toContainText('65.8 kg');

    await tab(page, 'progress');
    for (const [date, kg] of [['2026-10-01', '66.6'], ['2026-10-10', '66.1']]) {
      await page.locator('#log-weight').click();
      await page.locator('#weight-kg').fill(kg);
      await page.locator('#weight-date').fill(date);
      await page.getByRole('button', { name: 'Save weight' }).click();
    }
    await page.getByRole('button', { name: 'All', exact: true }).click();
    const chart = page.locator('svg[role=img]');
    await expect(chart).toBeVisible();
    await expect(chart.locator('circle')).toHaveCount(3);
    expect(await chart.innerHTML()).not.toContain('NaN');
    await expect(page.locator('main')).toContainText('from 66.6 kg');
  });

  test('built-in routines are locked; your own copy is fully editable', async ({ page }) => {
    await tab(page, 'plan');
    await page.locator('button', { hasText: 'built-in, locked' }).first().click();
    await expect(page.locator('#routine-name')).toHaveCount(0);
    await page.locator('#edit-day-wed').click();
    await expect(page.locator('#add-exercise')).toHaveCount(0);
    await expect(page.locator('#day-title')).toBeDisabled();
    // details are visible in the read-only view
    await page.getByText('Wall Sit', { exact: true }).click();
    await expect(page.getByText('Slide down until your thighs')).toBeVisible();
    await page.getByRole('button', { name: 'Close' }).click();

    await tab(page, 'plan');
    await page.locator('#new-routine').click();
    await page.locator('#new-from-builtin').click();
    await page.locator('#routine-name').fill('');
    await page.locator('#routine-name').fill('E2E Routine');
    await page.locator('#set-active').click();
    await expect(page.getByText('Active routine')).toBeVisible();

    await page.locator('#edit-day-wed').click();
    await page.getByRole('button', { name: 'Remove Wall Sit' }).click();
    await page.getByRole('button', { name: 'Remove', exact: true }).click();
    await expect(page.locator('main')).not.toContainText('Wall Sit');

    await page.locator('#add-exercise').click();
    await page.locator('#picker-search').fill('hip thrust');
    await page.getByRole('button', { name: /Create custom exercise/ }).click();
    await expect(page.locator('#ex-name')).toHaveValue('Hip Thrust');
    await page.locator('#ex-max').fill('5');
    await page.getByRole('button', { name: 'Add to day' }).click();
    await expect(page.getByText(/rep range/)).toBeVisible();
    await page.locator('#ex-max').fill('12');
    await page.locator('#ex-start').fill('20');
    await page.locator('#ex-steps').fill('Back on the bench\nDrive hips up\nLower slowly');
    await page.getByRole('button', { name: 'Add to day' }).click();
    await expect(page.locator('main')).toContainText('Hip Thrust');

    // From the online library (mocked here)
    await page.locator('#add-exercise').click();
    await page.locator('#picker-search').fill('glute');
    await page.getByRole('button', { name: /glute variation 1/ }).click();
    await expect(page.locator('#ex-steps')).toHaveValue(/Drive the hips up/);
    await page.getByRole('button', { name: 'Add to day' }).click();

    await tab(page, 'today');
    await page.locator('#day-wed').click();
    await expect(page.locator('main')).toContainText('E2E Routine');
    await expect(page.locator('main')).toContainText('Hip Thrust');
    await expect(page.locator('main')).not.toContainText('Wall Sit');
  });

  test('a running workout keeps its exercises when the routine is edited', async ({ page }) => {
    await tab(page, 'plan');
    await page.locator('#new-routine').click();
    await page.locator('#new-from-builtin').click();
    await page.locator('#set-active').click();
    await tab(page, 'today');
    await page.locator('#day-wed').click();
    await page.locator('#start-workout').click();

    await tab(page, 'plan');
    await page.locator('button', { hasText: 'My Gym PPL' }).click();
    await expect(page.getByText('Edits apply from your next workout')).toBeVisible();
    await page.locator('#edit-day-wed').click();
    await page.getByRole('button', { name: 'Remove Wall Sit' }).click();
    await page.getByRole('button', { name: 'Remove', exact: true }).click();

    await tab(page, 'today');
    await expect(page.locator('main')).toContainText('Wall Sit');
  });

  test('Gym PPL v2: superset A1 has no rest, A2 starts the rest timer', async ({ page }) => {
    await tab(page, 'plan');
    await page.locator('button', { hasText: 'Gym PPL v2' }).click();
    await page.locator('#set-active').click();
    await tab(page, 'today');
    await page.locator('#day-thu').click();
    await expect(page.locator('main')).toContainText('no rest, go to next');
    await page.locator('#start-workout').click();
    await page.locator('#ss-triceps-ext-r-0').fill('12');
    await page.locator('article', { hasText: 'Overhead Triceps Extension' }).getByRole('button', { name: 'Mark set 1 done' }).click();
    await expect(page.getByText('Resting')).toHaveCount(0);
    await page.locator('article', { hasText: 'Superset Curl' }).getByRole('button', { name: 'Mark set 1 done' }).click();
    await expect(page.getByText('Resting')).toBeVisible();

    await tab(page, 'today');
    await page.locator('#day-mon').click();
    await expect(page.locator('main')).toContainText('Seated DB Shoulder Press');
  });

  test('tutorials: plan exercises show details; library search shows demos', async ({ page }) => {
    await tab(page, 'tutorials');
    await page.getByRole('button', { name: /Deadlift/ }).first().click();
    await expect(page.locator('main')).toContainText('Push the floor away');
    await expect(page.locator('main img').first()).toBeVisible();
    await page.getByRole('button', { name: '‹ All tutorials' }).click();
    await page.locator('#tutorial-search').fill('hip thrust');
    await expect(page.getByRole('button', { name: /hip thrust variation 1/ })).toBeVisible();
  });

  test('runs in this-device-only mode without a database, and shows its version', async ({ page }) => {
    await tab(page, 'plan');
    await expect(page.getByText("Sync isn't set up for this site yet")).toBeVisible();
    await expect(page.locator('#app-version')).toContainText('local environment');
    await expect(page.locator('#env-badge')).toHaveText('local');
  });

  test('each exercise shows its demo, equipment and your machine settings', async ({ page }) => {
    await page.locator('#day-wed').click();
    const card = page.locator('article', { hasText: 'Leg Press' }).first();
    await expect(card.locator('img[alt="Demo of Leg Press"]')).toBeVisible();
    await expect(card).toContainText('Equipment: 45° leg press machine');

    await card.getByRole('button', { name: 'More about Leg Press' }).click();
    await card.getByRole('button', { name: '+ Add my setup notes' }).click();
    await card.locator('#note-leg-press').fill('Seat 3, feet mid-platform');
    await card.getByRole('button', { name: 'Save' }).click();
    await expect(card).toContainText('My setup: Seat 3, feet mid-platform');

    // tap the demo for the big view with everything in one place
    await card.getByRole('button', { name: 'Show how to do Leg Press' }).click();
    const sheet = page.getByRole('dialog', { name: 'Leg Press' });
    await expect(sheet.locator('img[alt="Demo of Leg Press"]')).toBeVisible();
    await expect(sheet).toContainText('Seat 3, feet mid-platform');
    await expect(sheet).toContainText('Release the safety');
    // hand-picked other versions, tap one to see it big
    await expect(sheet.locator('.versions button')).toHaveCount(3);
    await sheet.getByRole('button', { name: /Single-leg 45° leg press/ }).click();
    await expect(sheet.locator('img[alt="Demo of Single-leg 45° leg press"]')).toBeVisible();
    await sheet.getByRole('button', { name: 'Close' }).click();

    // the note survives a restart and also shows on other days with the same exercise
    await page.reload();
    await page.locator('#day-wed').click();
    await expect(page.locator('article', { hasText: 'Leg Press' }).first()).toContainText('My setup: Seat 3');
  });

  test('wall sit, plank and back extension have demos too, with a note where the demo differs', async ({ page }) => {
    await page.locator('#day-wed').click();
    const card = page.locator('article', { hasText: 'Wall Sit' }).first();
    await expect(card.locator('img[alt="Demo of Wall Sit"]')).toBeVisible();
    await card.getByRole('button', { name: 'Show how to do Wall Sit' }).click();
    const sheet = page.getByRole('dialog', { name: 'Wall Sit' });
    await expect(sheet).toContainText('Keep both feet on the floor');
    await sheet.getByRole('button', { name: 'Close' }).click();
    await page.locator('#day-fri').click();
    await expect(page.locator('article', { hasText: 'Plank' }).last().locator('img[alt="Demo of Plank"]')).toBeVisible();
  });

  test('guided mode: one exercise at a time, supersets alternate, rest timer says what is next', async ({ page }) => {
    await tab(page, 'plan');
    await page.locator('button', { hasText: 'Gym PPL v2' }).click();
    await page.locator('#set-active').click();
    await tab(page, 'today');
    await page.locator('#day-thu').click();
    await page.locator('#start-guided').click();
    await expect(page.locator('#guided-pos')).toHaveText('1 / 7');
    await expect(page.locator('#guided h2')).toHaveText('Incline Press');
    await expect(page.locator('#guided')).toContainText('Equipment: Two dumbbells');
    await expect(page.locator('#guided img[alt="Demo of Incline Press"]')).toBeVisible();

    // finishing all sets moves on and the rest timer names the next exercise
    for (const i of [1, 2, 3]) {
      await page.getByRole('button', { name: `Mark set ${i} done` }).click();
      if (i < 3) await page.getByRole('button', { name: 'Skip' }).click();
    }
    await expect(page.getByText('Next up: Flies')).toBeVisible();
    await page.getByRole('button', { name: 'Skip' }).click();
    await expect(page.locator('#guided h2')).toHaveText('Flies');

    // jump to the superset: A1 → A2 with no rest, A2 → back to A1 after resting
    await page.locator('#guided-next').click();
    await page.locator('#guided-next').click();
    await expect(page.locator('#guided h2')).toHaveText('Overhead Triceps Extension');
    await page.getByRole('button', { name: 'Mark set 1 done' }).click();
    await expect(page.getByText('Resting')).toHaveCount(0);
    await expect(page.locator('#guided h2')).toHaveText('Superset Curl');
    await page.getByRole('button', { name: 'Mark set 1 done' }).click();
    await expect(page.getByText('Overhead Triceps Extension · set 2')).toBeVisible();
    await page.getByRole('button', { name: 'Skip' }).click();
    await expect(page.locator('#guided h2')).toHaveText('Overhead Triceps Extension');

    // survives a reload, and the list view is one tap away
    await page.reload();
    await expect(page.locator('#guided h2')).toHaveText('Overhead Triceps Extension');
    await page.locator('#guided-exit').click();
    await expect(page.locator('#guided-open')).toBeVisible();
    await page.locator('#guided-open').click(); // opens at the first exercise that isn't finished
    await expect(page.locator('#guided h2')).toHaveText('Flies');
    await page.locator('#guided-prev').click();
    await expect(page.locator('#guided-pos')).toHaveText('1 / 7');
  });

  test('add a photo of your gym machine; it shows on the card and in the demo', async ({ page }) => {
    const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAIAAAD91JpzAAAAFklEQVR4nGP8z8DAwMDAxMDAwMDAAAANHQEDasKb6QAAAABJRU5ErkJggg==', 'base64');
    await page.locator('#day-wed').click();
    const card = page.locator('article', { hasText: 'Leg Press' }).first();
    await card.getByRole('button', { name: 'Show how to do Leg Press' }).click();
    const sheet = page.getByRole('dialog', { name: 'Leg Press' });
    await sheet.locator('#photo-input-leg-press').setInputFiles({ name: 'machine.png', mimeType: 'image/png', buffer: png });
    await expect(sheet.locator('img[alt="My photo of the machine"]')).toBeVisible();
    await sheet.getByRole('button', { name: 'Close' }).click();
    await expect(card.locator('img[alt="My photo of the machine"]')).toBeVisible();
    await page.reload();
    await page.locator('#day-wed').click();
    await expect(page.locator('article', { hasText: 'Leg Press' }).first().locator('img[alt="My photo of the machine"]')).toBeVisible();
  });

  test('day and night mode can be picked and are remembered', async ({ page }) => {
    await tab(page, 'plan');
    await page.locator('#theme-dark').click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    const bg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
    expect(bg).toBe('rgb(13, 15, 19)');
    await page.reload();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await tab(page, 'plan');
    await page.locator('#theme-light').click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
    await page.locator('#theme-auto').click();
    await expect(page.locator('html')).not.toHaveAttribute('data-theme', /./);
  });

  test('AI features ask you to sign in when there is no account (nothing is sent)', async ({ page }) => {
    let called = false;
    await page.route('**/.netlify/functions/ai', r => { called = true; return r.fulfill({ status: 500 }); });
    await page.locator('#day-wed').click();
    await page.locator('article', { hasText: 'Leg Press' }).first().getByRole('button', { name: 'Show how to do Leg Press' }).click();
    const sheet = page.getByRole('dialog', { name: 'Leg Press' });
    await sheet.getByRole('button', { name: '✨ Ask AI about this exercise' }).click();
    await sheet.getByRole('button', { name: 'Is this safe for my knee? Anything to change?' }).click();
    await expect(sheet.locator('.ai-error')).toContainText('Sign in');
    await sheet.getByRole('button', { name: 'Close', exact: true }).first().click();

    await tab(page, 'today');
    await page.locator('#machine-finder').click();
    const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAIAAAD91JpzAAAAFklEQVR4nGP8z8DAwMDAxMDAwMDAAAANHQEDasKb6QAAAABJRU5ErkJggg==', 'base64');
    await page.locator('#machine-finder-input').setInputFiles({ name: 'm.png', mimeType: 'image/png', buffer: png });
    await expect(page.getByRole('dialog', { name: "What's this machine?" }).locator('.ai-error')).toContainText('Sign in');
    await page.getByRole('dialog').getByRole('button', { name: 'Close' }).click();

    await tab(page, 'progress');
    await page.locator('#ai-review').click();
    await expect(page.locator('.ai-error')).toContainText('Sign in');
    await tab(page, 'plan');
    await expect(page.locator('main')).toContainText('About me (for AI)');
    expect(called).toBe(false);
  });

  test('warm-up and cool-down moves show a demo where the library has one', async ({ page }) => {
    await page.locator('#day-mon').click();
    await page.getByRole('button', { name: /Warm-up/ }).click();
    await page.getByRole('button', { name: 'Show demo of Inch worm × 5' }).click();
    await expect(page.locator('img[alt="Demo of Inch worm × 5"]')).toBeVisible();
    await expect(page.locator('main')).toContainText('Cat-Camel × 10 slow'); // no clean demo: text only
    await expect(page.getByRole('button', { name: /Show demo of Cat-Camel/ })).toHaveCount(0);
  });

  test('pick Home on a gym day: home exercises, logged as a home workout, remembered next time', async ({ page }) => {
    await page.locator('#day-tue').click();
    await expect(page.locator('main h2').first()).toContainText('Pull');
    await page.locator('#venue-home').click();
    await expect(page.locator('main')).toContainText('Home Pull · Hinge');
    await expect(page.locator('main')).toContainText('Dumbbell RDL');
    await expect(page.locator('article', { hasText: 'Dumbbell RDL' }).first()).toContainText('Equipment: Your dumbbell kit');
    await page.locator('#start-workout').click();
    await page.getByRole('button', { name: 'Mark set 1 done' }).first().click();
    await page.getByRole('button', { name: 'Skip' }).click();
    await page.getByRole('button', { name: 'Finish ›' }).click();
    await page.getByRole('button', { name: 'Save workout' }).click();
    await expect(page.locator('main')).toContainText('Home Pull · Hinge');

    await page.reload();
    await tab(page, 'today');
    await page.locator('#day-tue').click();
    await expect(page.locator('#venue-home')).toHaveAttribute('aria-checked', 'true');
    await page.locator('#venue-gym').click();
    await expect(page.locator('main')).toContainText('Lat Pulldown');
    await expect(page.locator('#day-sat')).toBeVisible();
    await page.locator('#day-sat').click();
    await expect(page.locator('#venue-home')).toHaveCount(0); // Saturday is already a home day
  });

  test('swap a busy machine during a workout, and swap back', async ({ page }) => {
    await page.locator('#day-tue').click();
    await expect(page.getByRole('button', { name: 'Swap Lat Pulldown' })).toHaveCount(0); // only during a workout
    await page.locator('#start-workout').click();
    await page.getByRole('button', { name: 'Swap Lat Pulldown' }).click();
    const sheet = page.getByRole('dialog', { name: 'Swap Lat Pulldown' });
    await expect(sheet).toContainText('Assisted pull-up machine');
    await sheet.locator('#swap-to-assisted-pull-up').click();

    const card = page.locator('article', { hasText: 'Assisted Pull-up' }).first();
    await expect(card).toContainText('Swapped in for Lat Pulldown');
    await expect(card).toContainText('Equipment: Assisted pull-up machine');
    await card.locator('#assisted-pull-up-r-0').fill('10');
    await card.getByRole('button', { name: 'Mark set 1 done' }).click();
    await page.getByRole('button', { name: 'Skip' }).click();

    await card.getByRole('button', { name: 'Swap Assisted Pull-up' }).click();
    await expect(page.getByRole('dialog').locator('#swap-to-lat-pulldown')).toContainText('Back to Lat Pulldown');
    await page.getByRole('dialog').getByRole('button', { name: 'Close' }).click();

    await page.getByRole('button', { name: 'Finish ›' }).click();
    await page.getByRole('button', { name: 'Save workout' }).click();
    await page.locator('article button[aria-expanded]').first().click();
    await expect(page.locator('article').first()).toContainText('Assisted Pull-up');

    // next Tuesday the plan is unchanged
    await tab(page, 'today');
    await page.locator('#day-tue').click();
    await expect(page.locator('main')).toContainText('Lat Pulldown');
    await expect(page.locator('main')).not.toContainText('Swapped in for');
  });
});
