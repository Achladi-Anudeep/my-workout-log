-- Photos of your gym's machines, one per exercise (a small JPEG, stored as a data URL).
-- Run once in Supabase → SQL Editor → New query → Run.
create table if not exists public.photos (
  id          text primary key,            -- "<user id>:<exercise id>"
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  ex_id       text not null,
  data        text,                        -- null once deleted
  at          bigint not null default 0,   -- when the photo was taken/replaced (ms); the newest wins
  deleted     boolean not null default false,
  updated_at  timestamptz not null default now()
);
create index if not exists photos_user_idx on public.photos (user_id);

alter table public.photos enable row level security;

drop policy if exists "own photos" on public.photos;
create policy "own photos" on public.photos
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

grant select, insert, update, delete on public.photos to authenticated;
