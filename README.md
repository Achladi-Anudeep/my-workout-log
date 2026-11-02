# My Workout Log

A phone-first workout logger for the 6-day Push / Pull / Legs / Arms plan. It's an installable PWA for iPhone, and workouts sync between your phone and laptop.

- **Today:** the day's workout, as a list or in **guided mode** (one exercise at a time, supersets alternate automatically, the rest timer names the next exercise and its equipment). Each exercise shows its demo animation, the equipment to look for, a photo of your own gym's machine and your machine settings (both synced), full how-to details, a coach suggestion (add weight / stay / go lighter, with the reason), and **Swap** for when a machine is busy. The screen stays on during a workout and the rest timer beeps. Set logging (kg × reps), a rest timer, and Finish with cardio minutes and a note.
- **Calendar:** a month view of logged and missed days, with adherence, cardio and volume, and per-day session details.
- **Progress:** body-weight log (date and time, 7-day average, trend chart) plus per-exercise trend lines and "ready to add weight" cues.
- **Tutorials:** animated GIF demos and steps, fetched live from the free [ExerciseDB](https://oss.exercisedb.dev/) API. Nothing is stored.
- **Plan:** your routines (two built-in, locked routines: Gym PPL and Gym PPL v2; duplicate it or start blank to build your own), a day-by-day editor with an exercise picker (your exercises, the ExerciseDB library, or custom), plus rules, start date and the sync account.

Appearance follows the phone's light/dark setting, or pick Day or Night under **Plan → Appearance**.

Stack: React 18, TypeScript, Vite, Tailwind CSS, Zustand, Supabase (auth + Postgres), and vite-plugin-pwa.

## One-time setup

### 1. Supabase (sync)
1. Create a free project at https://supabase.com.
2. Go to **SQL Editor → New query**, paste the contents of `supabase/schema.sql`, and click **Run**.
3. Go to **Project Settings → API** and copy the **Project URL** and the **publishable / anon key**. Both are safe to use in a website. Never use the `service_role` / secret key.
4. Optional, but easier: go to **Authentication → Sign In / Providers → Email** and turn off **Confirm email**. You can then sign in right after creating your account.

### 2. Netlify (hosting)
1. Go to **Add new site → Import an existing project → GitHub** and pick this repo. The build settings come from `netlify.toml` (`npm run build`, publish `dist`).
2. Before the first deploy, open **Site configuration → Environment variables** and add:
   - `VITE_SUPABASE_URL` = your Project URL
   - `VITE_SUPABASE_ANON_KEY` = your publishable / anon key
3. Deploy. If you add or change the variables later, run **Deploys → Trigger deploy** so the build picks them up.

### 3. iPhone
1. Open your Netlify URL in **Safari**, then tap **Share → Add to Home Screen**.
2. Open the app from the new icon, go to **Plan → Create account**, and sign in.
3. On your laptop, open the same URL and sign in with the same account.

When both devices are signed in, go to **Supabase → Authentication → Sign In / Providers** and turn off **Allow new users to sign up**, so nobody else can create an account on your project.

### Updating an existing Supabase project
If you set the project up before these features existed, run these once in the SQL Editor:
- `supabase/002_weights.sql` (body weight)
- `supabase/003_routines.sql` (custom routines)
- `supabase/004_photos.sql` (machine photos)

## How sync works
- Every workout is saved on the device first, so logging works with no signal at the gym.
- Changes upload right away when online. Otherwise they queue and upload when the connection returns (the header shows "Offline · N to sync").
- The app pulls new data when it opens, when it comes back to the foreground, and every minute while it's open.
- Deletes are soft (a `deleted` flag), so a session deleted on one device disappears on the other too.

## Environments

| | Branch | URL | Database |
|---|---|---|---|
| **Production** | `main` | https://my-own-workout-log.netlify.app | production Supabase project (set in the Netlify UI) |
| **Test** | `develop` | https://develop--my-own-workout-log.netlify.app | test Supabase project `my-workout-log-test` (set in `netlify.toml`) |

- The test site shows a **TEST** badge in the header and installs as "Workout TEST", so it can't be confused with the real app.
- `scripts/check-env.mjs` fails any Netlify build that would connect the wrong database: production must use the production project, and every other build must not.
- Supabase pauses free projects after about a week of no activity. `.github/workflows/keep-alive.yml` makes a tiny read against both databases every second day so that never happens, and fails loudly if one is already paused. The same workflow runs `scripts/check-demos.mjs`, which checks that every pinned demo animation still loads from ExerciseDB (it sometimes drops a media file) and lists any that need a new pick in `src/data/demos.ts`.
- Every deploy publishes `/version.json` (commit, environment, database host), which the pipeline uses to confirm exactly what is live.

## Release process (CI/CD)

All changes go to **`develop`**. Nobody pushes to `main` directly; branch protection only accepts commits that passed the test environment.

1. **CI** (`.github/workflows/ci.yml`, every push and PR): type check → unit tests (including a two-device sync simulation) → production build → end-to-end tests on iPhone (WebKit) and Android (Chromium).
2. **Release** (`.github/workflows/release.yml`, every push to `develop`):
   1. runs CI;
   2. waits for Netlify to deploy the commit to the **test** site, checks it uses the test database, then runs smoke tests and real sync tests (phone + laptop, sign-in, workouts, weight, routines, deletes, offline logging) against it with a dedicated test account;
   3. **promotes** the exact tested commit to `main` (fast-forward) → Netlify deploys **production**;
   4. waits for production to serve that commit and runs read-only smoke tests (no sign-in, no data written).

GitHub secrets (environment **test**): `TEST_USER_EMAIL`, `TEST_USER_PASSWORD` — a user that exists only in the test Supabase project.

## Local development
```bash
npm install
cp .env.example .env.local   # fill in the two Supabase values
npm run dev
npm run check      # everything CI runs: typecheck, unit tests, build, e2e
```
Without the env vars the app still runs, saving to this device only.
