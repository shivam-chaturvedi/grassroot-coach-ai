begin;

create extension if not exists pgcrypto;

create type public.user_role as enum (
  'super_admin',
  'academy_owner',
  'coach',
  'analyst',
  'player'
);

create type public.player_role as enum (
  'batsman',
  'bowler',
  'all_rounder',
  'wicket_keeper'
);

create type public.batting_style as enum (
  'right_hand',
  'left_hand'
);

create type public.bowling_style as enum (
  'right_arm_fast',
  'right_arm_medium',
  'left_arm_fast',
  'left_arm_medium',
  'right_arm_off_break',
  'right_arm_leg_break',
  'left_arm_spin',
  'slow_left_arm',
  'none'
);

create type public.match_format as enum (
  't10',
  't20',
  'odi',
  'test',
  'practice_match'
);

create type public.match_status as enum (
  'scheduled',
  'live',
  'completed',
  'abandoned',
  'cancelled'
);

create type public.toss_side as enum (
  'our_team',
  'opponent'
);

create type public.toss_decision as enum (
  'bat_first',
  'bowl_first'
);

create type public.notification_type as enum (
  'match',
  'milestone',
  'ai',
  'alert',
  'system'
);

create type public.report_type as enum (
  'pdf',
  'csv',
  'xlsx',
  'json'
);

create type public.session_type as enum (
  'batting_nets',
  'bowling_practice',
  'match_simulation',
  'fielding_drills',
  'fitness_recovery',
  'team_meeting'
);

create type public.recommendation_type as enum (
  'tactical',
  'player',
  'lineup',
  'bowling',
  'batting',
  'fielding',
  'simulation'
);

create type public.priority_level as enum (
  'low',
  'medium',
  'high'
);

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create table public.academies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  founded_year integer,
  district_rank integer,
  state_rank integer,
  currency_code char(3) not null default 'INR',
  revenue_monthly_amount numeric(12,2) not null default 0,
  revenue_annual_amount numeric(12,2) not null default 0,
  logo_url text,
  description text,
  website_url text,
  address text,
  timezone text not null default 'Asia/Kolkata',
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  academy_id uuid references public.academies(id) on delete set null,
  full_name text not null default '',
  display_name text,
  email text not null default '',
  avatar_url text,
  phone text,
  role public.user_role not null default 'player',
  bio text,
  is_active boolean not null default true,
  last_sign_in_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.academy_memberships (
  id uuid primary key default gen_random_uuid(),
  academy_id uuid not null references public.academies(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.user_role not null default 'player',
  joined_at timestamptz not null default timezone('utc', now()),
  is_primary boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (academy_id, user_id)
);

create table public.seasons (
  id uuid primary key default gen_random_uuid(),
  academy_id uuid not null references public.academies(id) on delete cascade,
  name text not null,
  starts_on date,
  ends_on date,
  is_current boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index academies_created_by_idx on public.academies(created_by);
create index profiles_academy_id_idx on public.profiles(academy_id);
create index profiles_role_idx on public.profiles(role);
create index academy_memberships_academy_id_idx on public.academy_memberships(academy_id);
create index academy_memberships_user_id_idx on public.academy_memberships(user_id);
create index seasons_academy_id_idx on public.seasons(academy_id);
create index seasons_current_idx on public.seasons(academy_id, is_current);

create or replace function public.current_user_role()
returns public.user_role
language sql
stable
security definer
set search_path = public, auth
as $$
  select coalesce(
    (select p.role from public.profiles p where p.user_id = auth.uid()),
    'player'::public.user_role
  );
$$;

create or replace function public.is_super_admin()
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select public.current_user_role() = 'super_admin'::public.user_role;
$$;

create or replace function public.is_academy_member(target_academy_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select exists (
    select 1
    from public.academy_memberships am
    where am.academy_id = target_academy_id
      and am.user_id = auth.uid()
  );
$$;

create or replace function public.can_view_academy(target_academy_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select public.is_super_admin() or public.is_academy_member(target_academy_id);
$$;

create or replace function public.can_manage_academy(target_academy_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select public.is_super_admin()
  or exists (
    select 1
    from public.academy_memberships am
    where am.academy_id = target_academy_id
      and am.user_id = auth.uid()
      and am.role in ('academy_owner'::public.user_role, 'coach'::public.user_role)
  );
$$;

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  resolved_role public.user_role;
  resolved_full_name text;
begin
  resolved_role :=
    case lower(coalesce(new.raw_user_meta_data->>'role', 'player'))
      when 'super_admin' then 'super_admin'::public.user_role
      when 'academy_owner' then 'academy_owner'::public.user_role
      when 'coach' then 'coach'::public.user_role
      when 'analyst' then 'analyst'::public.user_role
      else 'player'::public.user_role
    end;

  resolved_full_name := coalesce(
    nullif(new.raw_user_meta_data->>'full_name', ''),
    nullif(new.raw_user_meta_data->>'name', ''),
    split_part(coalesce(new.email, ''), '@', 1)
  );

  insert into public.profiles (
    user_id,
    full_name,
    display_name,
    email,
    avatar_url,
    role
  )
  values (
    new.id,
    coalesce(resolved_full_name, ''),
    coalesce(nullif(new.raw_user_meta_data->>'display_name', ''), resolved_full_name),
    coalesce(new.email, ''),
    nullif(new.raw_user_meta_data->>'avatar_url', ''),
    resolved_role
  )
  on conflict (user_id) do update
    set email = excluded.email,
        full_name = excluded.full_name,
        display_name = excluded.display_name,
        avatar_url = excluded.avatar_url,
        role = excluded.role,
        updated_at = timezone('utc', now());

  return new;
end;
$$;

create or replace function public.handle_new_academy_membership()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  if new.created_by is not null then
    insert into public.academy_memberships (
      academy_id,
      user_id,
      role,
      is_primary
    )
    values (
      new.id,
      new.created_by,
      'academy_owner'::public.user_role,
      true
    )
    on conflict (academy_id, user_id) do nothing;
  end if;

  return new;
end;
$$;

create trigger on_academies_touch_updated_at
before update on public.academies
for each row
execute function public.touch_updated_at();

create trigger on_profiles_touch_updated_at
before update on public.profiles
for each row
execute function public.touch_updated_at();

create trigger on_academy_memberships_touch_updated_at
before update on public.academy_memberships
for each row
execute function public.touch_updated_at();

create trigger on_seasons_touch_updated_at
before update on public.seasons
for each row
execute function public.touch_updated_at();

create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.handle_new_auth_user();

create trigger on_academy_created
after insert on public.academies
for each row
execute function public.handle_new_academy_membership();

alter table public.academies enable row level security;
alter table public.profiles enable row level security;
alter table public.academy_memberships enable row level security;
alter table public.seasons enable row level security;

create policy "Academies are readable by members"
on public.academies
for select
to authenticated
using (public.can_view_academy(id));

create policy "Academies can be created by authenticated users"
on public.academies
for insert
to authenticated
with check (created_by = auth.uid() or public.is_super_admin());

create policy "Academies are editable by managers"
on public.academies
for update
to authenticated
using (public.can_manage_academy(id))
with check (public.can_manage_academy(id));

create policy "Academies are deletable by managers"
on public.academies
for delete
to authenticated
using (public.can_manage_academy(id));

create policy "Profiles are readable by owner or academy members"
on public.profiles
for select
to authenticated
using (
  user_id = auth.uid()
  or public.is_super_admin()
  or (academy_id is not null and public.can_view_academy(academy_id))
);

create policy "Profiles are editable by owner or managers"
on public.profiles
for update
to authenticated
using (
  user_id = auth.uid()
  or public.is_super_admin()
  or (academy_id is not null and public.can_manage_academy(academy_id))
)
with check (
  user_id = auth.uid()
  or public.is_super_admin()
  or (academy_id is not null and public.can_manage_academy(academy_id))
);

create policy "Profiles can be inserted by service flows"
on public.profiles
for insert
to authenticated
with check (user_id = auth.uid() or public.is_super_admin());

create policy "Memberships are readable by owners and members"
on public.academy_memberships
for select
to authenticated
using (
  user_id = auth.uid()
  or public.is_super_admin()
  or public.can_view_academy(academy_id)
);

create policy "Memberships are editable by academy managers"
on public.academy_memberships
for insert
to authenticated
with check (public.can_manage_academy(academy_id) or public.is_super_admin());

create policy "Memberships updates are limited to academy managers"
on public.academy_memberships
for update
to authenticated
using (public.can_manage_academy(academy_id) or public.is_super_admin())
with check (public.can_manage_academy(academy_id) or public.is_super_admin());

create policy "Memberships can be deleted by academy managers"
on public.academy_memberships
for delete
to authenticated
using (public.can_manage_academy(academy_id) or public.is_super_admin());

create policy "Seasons are readable by academy members"
on public.seasons
for select
to authenticated
using (public.can_view_academy(academy_id));

create policy "Seasons are editable by academy managers"
on public.seasons
for insert
to authenticated
with check (public.can_manage_academy(academy_id) or public.is_super_admin());

create policy "Seasons can be updated by academy managers"
on public.seasons
for update
to authenticated
using (public.can_manage_academy(academy_id) or public.is_super_admin())
with check (public.can_manage_academy(academy_id) or public.is_super_admin());

create policy "Seasons can be deleted by academy managers"
on public.seasons
for delete
to authenticated
using (public.can_manage_academy(academy_id) or public.is_super_admin());

commit;
