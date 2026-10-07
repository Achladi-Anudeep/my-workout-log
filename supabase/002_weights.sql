-- Body weight log. Run once in Supabase → SQL Editor → New query → Run.
create table if not exists public.weights (
  id          text primary key,
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  at          bigint not null default 0,        -- weigh-in time, ms since epoch
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
