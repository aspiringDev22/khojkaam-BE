create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role text not null check (role in ('owner', 'helper')),
  name text not null,
  phone text not null unique,
  city text not null,
  created_at timestamp without time zone not null default now()
);

do $$
begin
  if exists (
    select 1
    from pg_constraint
    where conname = 'profiles_phone_e164_check'
  ) then
    alter table public.profiles drop constraint profiles_phone_e164_check;
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'profiles_phone_string_check'
  ) then
    alter table public.profiles
      add constraint profiles_phone_string_check
      check (phone ~ '^[0-9+][0-9+\-() ]{5,24}$');
  end if;
end $$;

create index if not exists profiles_role_idx on public.profiles (role);
create index if not exists profiles_city_idx on public.profiles (city);
create index if not exists profiles_created_at_idx on public.profiles (created_at desc);

alter table public.profiles enable row level security;

drop policy if exists "Users can read their own profile" on public.profiles;
create policy "Users can read their own profile"
on public.profiles
for select
to authenticated
using (auth.uid() = id);

drop policy if exists "Users can insert their own profile" on public.profiles;
create policy "Users can insert their own profile"
on public.profiles
for insert
to authenticated
with check (auth.uid() = id);

drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users can update their own profile"
on public.profiles
for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);
