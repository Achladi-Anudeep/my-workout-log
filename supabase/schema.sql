-- My Workout Log: run this once in Supabase → SQL Editor → New query → Run.
-- Each row belongs to one signed-in user; Row Level Security keeps it private to them.

create table if not exists public.sessions (
  id          text primary key,
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  started_at  bigint not null default 0,
  data        jsonb,
  deleted     boolean not null default false,
  updated_at  timestamptz not null default now()
);
create index if not exists sessions_user_idx on public.sessions (user_id, started_at desc);

create table if not exists public.settings (
  user_id     uuid primary key default auth.uid() references auth.users (id) on delete cascade,
  start_date  date,
  updated_at  timestamptz not null default now()
);

alter table public.sessions enable row level security;
alter table public.settings enable row level security;

drop policy if exists "own sessions" on public.sessions;
create policy "own sessions" on public.sessions
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "own settings" on public.settings;
create policy "own settings" on public.settings
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Body weight log (also in 002_weights.sql for projects set up before it existed)
create table if not exists public.weights (
  id          text primary key,
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  at          bigint not null default 0,
  kg          double precision,
  deleted     boolean not null default false,
  updated_at  timestamptz not null default now()
);
create index if not exists weights_user_idx on public.weights (user_id, at);
alter table public.weights enable row level security;
drop policy if exists "own weights" on public.weights;
create policy "own weights" on public.weights
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Your own routines (also in 003_routines.sql)
create table if not exists public.routines (
  id          text primary key,
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  data        jsonb,
  deleted     boolean not null default false,
  updated_at  timestamptz not null default now()
);
create index if not exists routines_user_idx on public.routines (user_id);

alter table public.routines enable row level security;

drop policy if exists "own routines" on public.routines;
create policy "own routines" on public.routines
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
