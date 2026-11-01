import { defineConfig, devices } from '@playwright/test';

/**
 * Three kinds of end-to-end tests, picked with --grep:
 *   @local  full UI flows against a local production build (no database, runs in CI on every push)
 *   @env    real sync tests against the deployed TEST environment and its test database
 *   @smoke  read-only checks, safe to run against PRODUCTION
 * BASE_URL points the tests at a deployed site; without it they run against `vite preview`.
 */
const baseURL = process.env.BASE_URL || 'http://localhost:4173';

export default defineConfig({
  testDir: 'e2e',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'iphone', use: { ...devices['iPhone 13'] } },
    { name: 'android', use: { ...devices['Pixel 7'] } },
  ],
  webServer: process.env.BASE_URL
    ? undefined
    : { command: 'npm run preview', url: baseURL, reuseExistingServer: !process.env.CI, timeout: 60_000 },
});
