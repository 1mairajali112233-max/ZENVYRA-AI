-- backend/sql/001_foundation.sql
--
-- Run this in Supabase → SQL Editor once you've connected your project.
-- Creates: profiles table, usage_daily table, and an atomic increment_usage()
-- function used by middleware/usageLimit.js.

-- 1. PROFILES ---------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text,
  role text not null default 'student' check (role in ('student', 'teacher', 'general')),
  school text,
  phone text,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Users can read/update only their own profile row.
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);

create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id);

-- Note: inserts happen via the backend's service-role client (server-trusted),
-- so no insert policy is granted to regular users here.

-- 2. USAGE_DAILY --------------------------------------------------------------
create table if not exists public.usage_daily (
  user_id uuid not null references auth.users(id) on delete cascade,
  usage_date date not null default current_date,
  messages int not null default 0,
  files int not null default 0,
  photos int not null default 0,
  primary key (user_id, usage_date)
);

alter table public.usage_daily enable row level security;

-- Users can read their own usage (so the frontend can show "12/40 today").
-- All WRITES go through the increment_usage() function via the service-role
-- key only — no direct insert/update policy is granted.
create policy "usage_select_own" on public.usage_daily
  for select using (auth.uid() = user_id);

-- 3. ATOMIC INCREMENT FUNCTION ------------------------------------------------
-- SECURITY DEFINER so it can write regardless of the caller's RLS, but it's
-- only ever called by the backend using the service-role key, never directly
-- by the frontend.
create or replace function public.increment_usage(p_user_id uuid, p_kind text)
returns int
language plpgsql
security definer
as $$
declare
  new_count int;
begin
  if p_kind not in ('messages', 'files', 'photos') then
    raise exception 'invalid usage kind: %', p_kind;
  end if;

  insert into public.usage_daily (user_id, usage_date)
  values (p_user_id, current_date)
  on conflict (user_id, usage_date) do nothing;

  execute format(
    'update public.usage_daily set %I = %I + 1 where user_id = $1 and usage_date = current_date returning %I',
    p_kind, p_kind, p_kind
  ) into new_count using p_user_id;

  return new_count;
end;
$$;
