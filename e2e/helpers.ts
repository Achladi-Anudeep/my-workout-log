import { expect, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';

export const PROD_SUPABASE_REF = 'anutvisbezcefrbkxplo';

/** Collects real app errors (uncaught exceptions, console errors, CSP violations) while a test runs. */
export function watchErrors(page: Page) {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(`pageerror: ${e.message}`));
  page.on('console', m => {
    if (m.type() !== 'error') return;
    const t = m.text();
    // Third-party fonts or demo GIFs failing to load are not app errors; CSP violations are.
    if (/Failed to load resource/.test(t) && !/Content Security Policy/i.test(t)) return;
    errors.push(`console: ${t}`);
  });
  return {
    errors,
    assertNone: () => expect(errors, errors.join('\n')).toEqual([]),
  };
}

export async function openApp(page: Page) {
  await page.goto('/');
  await expect(page.getByText('My Workout Log', { exact: true })).toBeVisible();
}

export const tab = (page: Page, id: 'today' | 'calendar' | 'progress' | 'tutorials' | 'plan') => page.locator(`#tab-${id}`).click();

/** The test environment's database settings, read from netlify.toml (single source of truth). */
export function testSupabase() {
  const toml = readFileSync(new URL('../netlify.toml', import.meta.url), 'utf8');
  const block = toml.split('[context.develop.environment]')[1]?.split('\n[')[0] ?? '';
  const url = /VITE_SUPABASE_URL\s*=\s*"([^"]*)"/.exec(block)?.[1] ?? '';
  const key = /VITE_SUPABASE_ANON_KEY\s*=\s*"([^"]*)"/.exec(block)?.[1] ?? '';
  return { url, key };
}

/** Deletes everything the test account owns in the TEST database, so each run starts clean. */
export async function resetTestAccount(email: string, password: string) {
  const { url, key } = testSupabase();
  if (!url || !key) throw new Error('The test database is not configured in netlify.toml ([context.develop.environment]).');
  if (url.includes(PROD_SUPABASE_REF)) throw new Error('Refusing to reset: netlify.toml test settings point at PRODUCTION.');
  const auth = await fetch(`${url}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: { apikey: key, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!auth.ok) throw new Error(`Test account sign-in failed (${auth.status}): ${await auth.text()}`);
  const { access_token, user } = await auth.json();
  for (const table of ['sessions', 'weights', 'routines', 'settings']) {
    const res = await fetch(`${url}/rest/v1/${table}?user_id=eq.${user.id}`, {
      method: 'DELETE',
      headers: { apikey: key, Authorization: `Bearer ${access_token}` },
    });
    if (!res.ok) throw new Error(`Could not clear ${table} (${res.status}): ${await res.text()}`);
  }
}

/** Fake ExerciseDB responses so local tests don't depend on a third-party API. */
export async function mockExerciseDb(page: Page) {
  const gif = Buffer.from('R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==', 'base64');
  await page.route('https://static.exercisedb.dev/**', r => r.fulfill({ body: gif, contentType: 'image/gif' }));
  await page.route('https://oss.exercisedb.dev/api/v1/exercises**', async r => {
    const name = new URL(r.request().url()).searchParams.get('name') ?? 'exercise';
    await r.fulfill({
      json: {
        success: true,
        data: [1, 2].map(i => ({
          exerciseId: `mock${i}`, name: `${name} variation ${i}`, gifUrl: `https://static.exercisedb.dev/media/mock${i}.gif`,
          targetMuscles: ['glutes'], secondaryMuscles: ['hamstrings'], equipments: ['barbell'],
          instructions: ['Step:1 Set up on the bench.', 'Step:2 Drive the hips up.', 'Step:3 Lower slowly.'],
        })),
      },
    });
  });
}
