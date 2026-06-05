begin;

create table public.matches (
  id uuid primary key default gen_random_uuid(),
  academy_id uuid not null references public.academies(id) on delete cascade,
  team_id uuid references public.teams(id) on delete set null,
  season_id uuid references public.seasons(id) on delete set null,
  match_name text,
  opponent_name text not null,
  scheduled_at timestamptz not null,
  match_format public.match_format not null default 't20',
  overs smallint not null default 20,
  venue text,
  ground text,
  status public.match_status not null default 'scheduled',
  toss_winner_side public.toss_side,
  toss_decision public.toss_decision,
  team_runs integer,
  team_wickets integer,
  opponent_runs integer,
  opponent_wickets integer,
  result_summary text,
  result_margin_runs integer,
  result_margin_wickets integer,
  notes text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.match_squads (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references public.matches(id) on delete cascade,
  player_id uuid not null references public.players(id) on delete cascade,
  batting_position smallint,
  is_selected boolean not null default true,
  is_captain boolean not null default false,
  is_vice_captain boolean not null default false,
  is_available boolean not null default true,
  role_in_match text,
  selection_reason text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (match_id, player_id)
);

create table public.player_match_stats (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references public.matches(id) on delete cascade,
  player_id uuid not null references public.players(id) on delete cascade,
  runs integer not null default 0,
  balls_faced integer not null default 0,
  fours integer not null default 0,
  sixes integer not null default 0,
  wickets integer not null default 0,
  overs_bowled numeric(4,1) not null default 0,
  runs_conceded integer not null default 0,
  maidens integer not null default 0,
  catches integer not null default 0,
  run_outs integer not null default 0,
  dot_balls integer not null default 0,
  notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint player_match_stats_overs_check check (overs_bowled >= 0),
  unique (match_id, player_id)
);

create index matches_academy_id_idx on public.matches(academy_id);
create index matches_team_id_idx on public.matches(team_id);
create index matches_season_id_idx on public.matches(season_id);
create index matches_status_idx on public.matches(status);
create index matches_scheduled_at_idx on public.matches(scheduled_at);
create index match_squads_match_id_idx on public.match_squads(match_id);
create index match_squads_player_id_idx on public.match_squads(player_id);
create index player_match_stats_match_id_idx on public.player_match_stats(match_id);
create index player_match_stats_player_id_idx on public.player_match_stats(player_id);

create or replace function public.match_academy_id(target_match_id uuid)
returns uuid
language sql
stable
security definer
set search_path = public, auth
as $$
  select m.academy_id
  from public.matches m
  where m.id = target_match_id;
$$;

create trigger on_matches_touch_updated_at
before update on public.matches
for each row
execute function public.touch_updated_at();

create trigger on_match_squads_touch_updated_at
before update on public.match_squads
for each row
execute function public.touch_updated_at();

create trigger on_player_match_stats_touch_updated_at
before update on public.player_match_stats
for each row
execute function public.touch_updated_at();

alter table public.matches enable row level security;
alter table public.match_squads enable row level security;
alter table public.player_match_stats enable row level security;

create policy "Matches are readable by academy members"
on public.matches
for select
to authenticated
using (public.can_view_academy(academy_id) or public.is_super_admin());

create policy "Matches are editable by academy managers"
on public.matches
for insert
to authenticated
with check (public.can_manage_academy(academy_id) or public.is_super_admin());

create policy "Matches updates are limited to academy managers"
on public.matches
for update
to authenticated
using (public.can_manage_academy(academy_id) or public.is_super_admin())
with check (public.can_manage_academy(academy_id) or public.is_super_admin());

create policy "Matches can be deleted by academy managers"
on public.matches
for delete
to authenticated
using (public.can_manage_academy(academy_id) or public.is_super_admin());

create policy "Match squads are readable by academy members"
on public.match_squads
for select
to authenticated
using (
  public.can_view_academy(public.match_academy_id(match_id))
  or public.is_super_admin()
);

create policy "Match squads are editable by academy managers"
on public.match_squads
for insert
to authenticated
with check (
  public.can_manage_academy(public.match_academy_id(match_id))
  or public.is_super_admin()
);

create policy "Match squads updates are limited to academy managers"
on public.match_squads
for update
to authenticated
using (
  public.can_manage_academy(public.match_academy_id(match_id))
  or public.is_super_admin()
)
with check (
  public.can_manage_academy(public.match_academy_id(match_id))
  or public.is_super_admin()
);

create policy "Match squads can be deleted by academy managers"
on public.match_squads
for delete
to authenticated
using (
  public.can_manage_academy(public.match_academy_id(match_id))
  or public.is_super_admin()
);

create policy "Match stats are readable by academy members"
on public.player_match_stats
for select
to authenticated
using (
  public.can_view_academy(public.match_academy_id(match_id))
  or public.is_super_admin()
);

create policy "Match stats are editable by academy managers"
on public.player_match_stats
for insert
to authenticated
with check (
  public.can_manage_academy(public.match_academy_id(match_id))
  or public.is_super_admin()
);

create policy "Match stats updates are limited to academy managers"
on public.player_match_stats
for update
to authenticated
using (
  public.can_manage_academy(public.match_academy_id(match_id))
  or public.is_super_admin()
)
with check (
  public.can_manage_academy(public.match_academy_id(match_id))
  or public.is_super_admin()
);

create policy "Match stats can be deleted by academy managers"
on public.player_match_stats
for delete
to authenticated
using (
  public.can_manage_academy(public.match_academy_id(match_id))
  or public.is_super_admin()
);

commit;
