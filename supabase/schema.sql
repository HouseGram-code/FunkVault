-- ============================================================================
-- FunkVault — Supabase schema (v2: channels)
-- Run this in your project: Supabase Dashboard > SQL Editor > New query.
-- It is safe to re-run. NOTE: re-running recreates the subscriptions table
-- (subscription data is reset); videos / comments are preserved.
--
-- Policies are permissive (open to the anon/publishable key) so the demo works
-- without login. Add Supabase Auth + tighter policies for production.
-- ============================================================================

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Accounts (simple email + password auth for this demo)
-- The table is NOT readable with the anon key; it is only reachable through
-- the security-definer register_account / login_account functions below.
-- ---------------------------------------------------------------------------
create table if not exists public.accounts (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  email         text not null,
  password_hash text not null,
  created_at    timestamptz not null default now()
);
create unique index if not exists accounts_email_key on public.accounts (lower(email));
alter table public.accounts add column if not exists is_admin boolean not null default false;
alter table public.accounts add column if not exists banned   boolean not null default false;
alter table public.accounts enable row level security;
-- (intentionally no policies: only the SECURITY DEFINER functions can touch it)

-- Seed / ensure the FunkVault owner (admin) account.
-- The password hash matches the client formula sha256('funkvault::' || password).
insert into public.accounts (name, email, password_hash, is_admin)
select 'FunkVault', 'goh@gmail.com',
       encode(digest('funkvault::1234567890qqq', 'sha256'), 'hex'), true
where not exists (select 1 from public.accounts where lower(email) = 'goh@gmail.com');
update public.accounts
   set is_admin = true,
       password_hash = encode(digest('funkvault::1234567890qqq', 'sha256'), 'hex')
 where lower(email) = 'goh@gmail.com';

-- ---------------------------------------------------------------------------
-- Channels (one per browser / client id)
-- ---------------------------------------------------------------------------
create table if not exists public.channels (
  id         uuid primary key default gen_random_uuid(),
  owner_id   text not null unique,
  name       text not null default 'Your Channel',
  handle     text,
  avatar     text,
  banner     text,
  bio        text,
  created_at timestamptz not null default now()
);
alter table public.channels add column if not exists username text;
alter table public.channels add column if not exists username_changed_at timestamptz;
create unique index if not exists channels_username_key on public.channels (lower(username));

-- ---------------------------------------------------------------------------
-- Videos
-- ---------------------------------------------------------------------------
create table if not exists public.videos (
  id           uuid primary key default gen_random_uuid(),
  title        text not null,
  channel      text not null default 'You',
  duration     text,
  storage_path text,
  thumb        text,
  grad         text,
  views        integer not null default 0,
  created_at   timestamptz not null default now()
);
alter table public.videos add column if not exists channel_id uuid
  references public.channels(id) on delete cascade;
alter table public.videos add column if not exists owner_id text;
alter table public.videos add column if not exists description text;
alter table public.videos add column if not exists tags text[] default '{}';

create table if not exists public.comments (
  id         uuid primary key default gen_random_uuid(),
  video_id   uuid not null references public.videos(id) on delete cascade,
  author     text not null default 'You',
  text       text not null default '',
  gif_id     text,
  gif_aspect double precision,
  created_at timestamptz not null default now()
);

create table if not exists public.reactions (
  id         uuid primary key default gen_random_uuid(),
  video_id   uuid not null references public.videos(id) on delete cascade,
  client_id  text not null,
  kind       text not null check (kind in ('like','dislike')),
  created_at timestamptz not null default now(),
  unique (video_id, client_id)
);

create table if not exists public.comment_likes (
  id         uuid primary key default gen_random_uuid(),
  comment_id uuid not null references public.comments(id) on delete cascade,
  client_id  text not null,
  created_at timestamptz not null default now(),
  unique (comment_id, client_id)
);

-- Subscriptions now key on channel_id
drop table if exists public.subscriptions cascade;
create table public.subscriptions (
  id         uuid primary key default gen_random_uuid(),
  channel_id uuid not null references public.channels(id) on delete cascade,
  client_id  text not null,
  created_at timestamptz not null default now(),
  unique (channel_id, client_id)
);

create index if not exists comments_video_idx on public.comments(video_id);
create index if not exists reactions_video_idx on public.reactions(video_id);
create index if not exists videos_channel_idx on public.videos(channel_id);

-- ---------------------------------------------------------------------------
-- View with aggregated counts + channel display info
-- ---------------------------------------------------------------------------
-- NOTE: this view is intentionally SECURITY DEFINER (owned by the admin role)
-- so it can read accounts.is_admin for the "verified creator" badge without
-- exposing the accounts table itself to the anon key. Only the boolean is used.
drop view if exists public.video_stats;
create view public.video_stats as
select
  v.*,
  coalesce(ch.name, v.channel)  as channel_name,
  ch.avatar                     as channel_avatar,
  coalesce(acc.is_admin, false) as channel_verified,
  coalesce((select count(*) from public.reactions r
            where r.video_id = v.id and r.kind = 'like'), 0) as like_count,
  coalesce((select count(*) from public.comments c
            where c.video_id = v.id), 0) as comment_count
from public.videos v
left join public.channels ch on ch.id = v.channel_id
left join public.accounts acc on acc.id::text = ch.owner_id;

create or replace function public.increment_views(vid uuid)
returns void language sql as $$
  update public.videos set views = views + 1 where id = vid;
$$;

-- Auth: create an account (fails if the email is already used)
drop function if exists public.register_account(text, text, text);
create or replace function public.register_account(
  p_name text, p_email text, p_password_hash text
) returns table(id uuid, name text, email text, is_admin boolean, banned boolean)
language plpgsql security definer set search_path = public as $$
declare new_id uuid;
begin
  if exists (select 1 from public.accounts a where lower(a.email) = lower(p_email)) then
    raise exception 'email_taken';
  end if;
  insert into public.accounts(name, email, password_hash)
  values (p_name, p_email, p_password_hash)
  returning accounts.id into new_id;
  return query select a.id, a.name, a.email, a.is_admin, a.banned
               from public.accounts a where a.id = new_id;
end;
$$;

-- Auth: verify credentials, returning the account when the hash matches
drop function if exists public.login_account(text, text);
create or replace function public.login_account(
  p_email text, p_password_hash text
) returns table(id uuid, name text, email text, is_admin boolean, banned boolean)
language plpgsql security definer set search_path = public as $$
begin
  return query
    select a.id, a.name, a.email, a.is_admin, a.banned from public.accounts a
    where lower(a.email) = lower(p_email) and a.password_hash = p_password_hash;
end;
$$;

-- Auth: fetch fresh account state (used to refresh a stored session so admin/
-- ban status stays correct without forcing a re-login)
create or replace function public.get_account(p_id uuid)
returns table(id uuid, name text, email text, is_admin boolean, banned boolean)
language sql security definer set search_path = public as $$
  select a.id, a.name, a.email, a.is_admin, a.banned
  from public.accounts a where a.id = p_id;
$$;

-- Is the channel owned by an admin? (used for the verified creator badge)
create or replace function public.channel_verified(p_channel_id uuid)
returns boolean
language sql security definer set search_path = public as $$
  select coalesce((
    select a.is_admin from public.accounts a
    join public.channels c on c.owner_id = a.id::text
    where c.id = p_channel_id
  ), false);
$$;

-- Admin: list every account (only when the caller is an admin)
create or replace function public.admin_list_users(p_admin_id uuid)
returns table(id uuid, name text, email text, banned boolean, is_admin boolean, created_at timestamptz)
language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from public.accounts a where a.id = p_admin_id and a.is_admin) then
    raise exception 'not_admin';
  end if;
  return query
    select a.id, a.name, a.email, a.banned, a.is_admin, a.created_at
    from public.accounts a order by a.created_at desc;
end;
$$;

-- Admin: ban / unban a normal account (admins can never be banned)
create or replace function public.admin_set_ban(p_admin_id uuid, p_user_id uuid, p_banned boolean)
returns void
language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from public.accounts a where a.id = p_admin_id and a.is_admin) then
    raise exception 'not_admin';
  end if;
  update public.accounts set banned = p_banned where id = p_user_id and is_admin = false;
end;
$$;

grant execute on function public.register_account(text, text, text) to anon, authenticated;
grant execute on function public.login_account(text, text) to anon, authenticated;
grant execute on function public.get_account(uuid) to anon, authenticated;
grant execute on function public.channel_verified(uuid) to anon, authenticated;
grant execute on function public.admin_list_users(uuid) to anon, authenticated;
grant execute on function public.admin_set_ban(uuid, uuid, boolean) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Row Level Security + permissive demo policies
-- ---------------------------------------------------------------------------
alter table public.channels      enable row level security;
alter table public.videos        enable row level security;
alter table public.comments      enable row level security;
alter table public.reactions     enable row level security;
alter table public.comment_likes enable row level security;
alter table public.subscriptions enable row level security;

drop policy if exists "fv channels all"      on public.channels;
drop policy if exists "fv videos all"        on public.videos;
drop policy if exists "fv comments all"      on public.comments;
drop policy if exists "fv reactions all"     on public.reactions;
drop policy if exists "fv comment_likes all" on public.comment_likes;
drop policy if exists "fv subscriptions all" on public.subscriptions;

create policy "fv channels all"      on public.channels      for all using (true) with check (true);
create policy "fv videos all"        on public.videos        for all using (true) with check (true);
create policy "fv comments all"      on public.comments      for all using (true) with check (true);
create policy "fv reactions all"     on public.reactions     for all using (true) with check (true);
create policy "fv comment_likes all" on public.comment_likes for all using (true) with check (true);
create policy "fv subscriptions all" on public.subscriptions for all using (true) with check (true);

grant execute on function public.increment_views(uuid) to anon, authenticated;
grant select on public.video_stats to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Storage bucket for uploaded videos, avatars and banners (public read)
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('videos', 'videos', true)
on conflict (id) do update set public = true;

drop policy if exists "fv storage read"   on storage.objects;
drop policy if exists "fv storage insert" on storage.objects;
drop policy if exists "fv storage update" on storage.objects;
drop policy if exists "fv storage delete" on storage.objects;

create policy "fv storage read"
  on storage.objects for select using (bucket_id = 'videos');
create policy "fv storage insert"
  on storage.objects for insert with check (bucket_id = 'videos');
create policy "fv storage update"
  on storage.objects for update using (bucket_id = 'videos') with check (bucket_id = 'videos');
create policy "fv storage delete"
  on storage.objects for delete using (bucket_id = 'videos');

-- Done. Reload the app.
