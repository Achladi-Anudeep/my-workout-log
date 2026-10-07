-- Your own routines (the built-in Gym PPL plan lives in the app and is never stored).
-- Run once in Supabase → SQL Editor → New query → Run.
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
