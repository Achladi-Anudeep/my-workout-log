# My Workout Log

A phone-first workout logger for the 6-day Push / Pull / Legs / Arms plan. It's an installable PWA for iPhone, and workouts sync between your phone and laptop.

- **Today:** the day's workout, set logging (kg × reps), a rest timer, and Finish with cardio minutes and a note.
- **Calendar:** a month view of logged and missed days, with adherence, cardio and volume, and per-day session details.
- **Progress:** body-weight log (date and time, 7-day average, trend chart) plus per-exercise trend lines and "ready to add weight" cues.
- **Tutorials:** animated GIF demos and steps, fetched live from the free [ExerciseDB](https://oss.exercisedb.dev/) API. Nothing is stored.
- **Plan:** your routines (the built-in Gym PPL is locked; duplicate it or start blank to build your own), a day-by-day editor with an exercise picker (your exercises, the ExerciseDB library, or custom), plus rules, start date and the sync account.

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

## How sync works
- Every workout is saved on the device first, so logging works with no signal at the gym.
- Changes upload right away when online. Otherwise they queue and upload when the connection returns (the header shows "Offline · N to sync").
- The app pulls new data when it opens, when it comes back to the foreground, and every minute while it's open.
- Deletes are soft (a `deleted` flag), so a session deleted on one device disappears on the other too.

## Local development
```bash
npm install
cp .env.example .env.local   # fill in the two Supabase values
npm run dev
```
Without the env vars the app still runs, saving to this device only.
