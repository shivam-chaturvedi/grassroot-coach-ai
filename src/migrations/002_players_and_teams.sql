begin;

create table public.teams (
  id uuid primary key default gen_random_uuid(),
  academy_id uuid not null references public.academies(id) on delete cascade,
  season_id uuid references public.seasons(id) on delete set null,
  name text not null,
  age_group text,
  level text,
  coach_profile_id uuid references public.profiles(user_id) on delete set null,
  record_wins integer not null default 0,
  record_losses integer not null default 0,
  record_draws integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (academy_id, season_id, name)
);

create table public.players (
  id uuid primary key default gen_random_uuid(),
  academy_id uuid not null references public.academies(id) on delete cascade,
  current_team_id uuid references public.teams(id) on delete set null,
  profile_id uuid unique references public.profiles(user_id) on delete set null,
  full_name text not null,
  short_name text,
  age integer not null,
  player_role public.player_role not null,
  batting_style public.batting_style not null,
  bowling_style public.bowling_style not null default 'none',
  jersey_number integer not null,
  position text,
  strength_summary text,
  weakness_summary text,
  fitness_rating smallint not null default 0,
  consistency_rating smallint not null default 0,
  aggression_rating smallint not null default 0,
  photo_url text,
  notes text,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint players_age_check check (age > 0),
  constraint players_jersey_number_check check (jersey_number > 0),
  constraint players_fitness_rating_check check (fitness_rating between 0 and 100),
  constraint players_consistency_rating_check check (consistency_rating between 0 and 100),
  constraint players_aggression_rating_check check (aggression_rating between 0 and 100),
  unique (academy_id, jersey_number)
);

create table public.team_roster (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams(id) on delete cascade,
  player_id uuid not null references public.players(id) on delete cascade,
  season_id uuid references public.seasons(id) on delete set null,
  batting_position smallint not null default 1,
  is_available boolean not null default true,
  is_captain boolean not null default false,
  is_vice_captain boolean not null default false,
  notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint team_roster_batting_position_check check (batting_position between 1 and 11),
  unique (team_id, player_id, season_id)
);

create table public.player_season_stats (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references public.players(id) on delete cascade,
  season_id uuid not null references public.seasons(id) on delete cascade,
  matches integer not null default 0,
  runs integer not null default 0,
  batting_average numeric(6,2) not null default 0,
  strike_rate numeric(6,2) not null default 0,
  wickets integer not null default 0,
  fifties integer not null default 0,
  hundreds integer not null default 0,
  catches integer not null default 0,
  maidens integer not null default 0,
  economy_rate numeric(6,2) not null default 0,
  highest_score integer not null default 0,
  best_bowling text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (player_id, season_id)
);

create table public.scouting_candidates (
  id uuid primary key default gen_random_uuid(),
  academy_id uuid not null references public.academies(id) on delete cascade,
  full_name text not null,
  age integer not null,
  player_role public.player_role not null,
  batting_style public.batting_style,
  bowling_style public.bowling_style,
  strike_rate numeric(6,2) not null default 0,
  consistency_rating smallint not null default 0,
  aggression_rating smallint not null default 0,
  fitness_rating smallint not null default 0,
  district text,
  source_academy_name text,
  status text not null default 'new',
  notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint scouting_candidates_age_check check (age > 0),
  constraint scouting_candidates_consistency_check check (consistency_rating between 0 and 100),
  constraint scouting_candidates_aggression_check check (aggression_rating between 0 and 100),
  constraint scouting_candidates_fitness_check check (fitness_rating between 0 and 100)
);

create table public.coach_feedback (
  id uuid primary key default gen_random_uuid(),
  academy_id uuid not null references public.academies(id) on delete cascade,
  player_id uuid not null references public.players(id) on delete cascade,
  coach_profile_id uuid references public.profiles(user_id) on delete set null,
  feedback_date date not null default current_date,
  subject text,
  message text not null,
  tags text[] not null default '{}'::text[],
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index teams_academy_id_idx on public.teams(academy_id);
create index teams_season_id_idx on public.teams(season_id);
create index teams_coach_profile_id_idx on public.teams(coach_profile_id);
create index players_academy_id_idx on public.players(academy_id);
create index players_current_team_id_idx on public.players(current_team_id);
create index players_profile_id_idx on public.players(profile_id);
create index players_role_idx on public.players(player_role);
create index team_roster_team_id_idx on public.team_roster(team_id);
create index team_roster_player_id_idx on public.team_roster(player_id);
create index team_roster_season_id_idx on public.team_roster(season_id);
create index player_season_stats_player_id_idx on public.player_season_stats(player_id);
create index player_season_stats_season_id_idx on public.player_season_stats(season_id);
create index scouting_candidates_academy_id_idx on public.scouting_candidates(academy_id);
create index coach_feedback_player_id_idx on public.coach_feedback(player_id);

create or replace function public.team_academy_id(target_team_id uuid)
returns uuid
language sql
stable
security definer
set search_path = public, auth
as $$
  select t.academy_id
  from public.teams t
  where t.id = target_team_id;
$$;

create or replace function public.player_academy_id(target_player_id uuid)
returns uuid
language sql
stable
security definer
set search_path = public, auth
as $$
  select p.academy_id
  from public.players p
  where p.id = target_player_id;
$$;

create or replace function public.current_player_id()
returns uuid
language sql
stable
security definer
set search_path = public, auth
as $$
  select p.id
  from public.players p
  where p.profile_id = auth.uid()
  limit 1;
$$;

create trigger on_teams_touch_updated_at
before update on public.teams
for each row
execute function public.touch_updated_at();

create trigger on_players_touch_updated_at
before update on public.players
for each row
execute function public.touch_updated_at();

create trigger on_team_roster_touch_updated_at
before update on public.team_roster
for each row
execute function public.touch_updated_at();

create trigger on_player_season_stats_touch_updated_at
before update on public.player_season_stats
for each row
execute function public.touch_updated_at();

create trigger on_scouting_candidates_touch_updated_at
before update on public.scouting_candidates
for each row
execute function public.touch_updated_at();

create trigger on_coach_feedback_touch_updated_at
before update on public.coach_feedback
for each row
execute function public.touch_updated_at();

alter table public.teams enable row level security;
alter table public.players enable row level security;
alter table public.team_roster enable row level security;
alter table public.player_season_stats enable row level security;
alter table public.scouting_candidates enable row level security;
alter table public.coach_feedback enable row level security;

create policy "Teams are readable by academy members"
on public.teams
for select
to authenticated
using (public.can_view_academy(academy_id));

create policy "Teams are editable by academy managers"
on public.teams
for insert
to authenticated
with check (public.can_manage_academy(academy_id) or public.is_super_admin());

create policy "Teams updates are limited to academy managers"
on public.teams
for update
to authenticated
using (public.can_manage_academy(academy_id) or public.is_super_admin())
with check (public.can_manage_academy(academy_id) or public.is_super_admin());

create policy "Teams can be deleted by academy managers"
on public.teams
for delete
to authenticated
using (public.can_manage_academy(academy_id) or public.is_super_admin());

create policy "Players are readable by academy members and their linked user"
on public.players
for select
to authenticated
using (
  public.can_view_academy(academy_id)
  or profile_id = auth.uid()
  or public.is_super_admin()
);

create policy "Players are editable by academy managers"
on public.players
for insert
to authenticated
with check (public.can_manage_academy(academy_id) or public.is_super_admin());

create policy "Players updates are limited to academy managers"
on public.players
for update
to authenticated
using (public.can_manage_academy(academy_id) or public.is_super_admin())
with check (public.can_manage_academy(academy_id) or public.is_super_admin());

create policy "Players can be deleted by academy managers"
on public.players
for delete
to authenticated
using (public.can_manage_academy(academy_id) or public.is_super_admin());

create policy "Team roster is readable by academy members"
on public.team_roster
for select
to authenticated
using (
  public.can_view_academy(public.team_academy_id(team_id))
);

create policy "Team roster is editable by academy managers"
on public.team_roster
for insert
to authenticated
with check (
  public.can_manage_academy(public.team_academy_id(team_id))
  or public.is_super_admin()
);

create policy "Team roster updates are limited to academy managers"
on public.team_roster
for update
to authenticated
using (
  public.can_manage_academy(public.team_academy_id(team_id))
  or public.is_super_admin()
)
with check (
  public.can_manage_academy(public.team_academy_id(team_id))
  or public.is_super_admin()
);

create policy "Team roster can be deleted by academy managers"
on public.team_roster
for delete
to authenticated
using (
  public.can_manage_academy(public.team_academy_id(team_id))
  or public.is_super_admin()
);

create policy "Season stats are readable by academy members"
on public.player_season_stats
for select
to authenticated
using (
  public.can_view_academy(public.player_academy_id(player_id))
  or public.is_super_admin()
);

create policy "Season stats are editable by academy managers"
on public.player_season_stats
for insert
to authenticated
with check (
  public.can_manage_academy(public.player_academy_id(player_id))
  or public.is_super_admin()
);

create policy "Season stats updates are limited to academy managers"
on public.player_season_stats
for update
to authenticated
using (
  public.can_manage_academy(public.player_academy_id(player_id))
  or public.is_super_admin()
)
with check (
  public.can_manage_academy(public.player_academy_id(player_id))
  or public.is_super_admin()
);

create policy "Season stats can be deleted by academy managers"
on public.player_season_stats
for delete
to authenticated
using (
  public.can_manage_academy(public.player_academy_id(player_id))
  or public.is_super_admin()
);

create policy "Scouting candidates are readable by academy members"
on public.scouting_candidates
for select
to authenticated
using (public.can_view_academy(academy_id) or public.is_super_admin());

create policy "Scouting candidates are editable by academy managers"
on public.scouting_candidates
for insert
to authenticated
with check (public.can_manage_academy(academy_id) or public.is_super_admin());

create policy "Scouting candidates updates are limited to academy managers"
on public.scouting_candidates
for update
to authenticated
using (public.can_manage_academy(academy_id) or public.is_super_admin())
with check (public.can_manage_academy(academy_id) or public.is_super_admin());

create policy "Scouting candidates can be deleted by academy managers"
on public.scouting_candidates
for delete
to authenticated
using (public.can_manage_academy(academy_id) or public.is_super_admin());

create policy "Coach feedback is readable by academy members and the player"
on public.coach_feedback
for select
to authenticated
using (
  public.can_view_academy(academy_id)
  or player_id = public.current_player_id()
  or public.is_super_admin()
);

create policy "Coach feedback is editable by academy managers"
on public.coach_feedback
for insert
to authenticated
with check (public.can_manage_academy(academy_id) or public.is_super_admin());

create policy "Coach feedback updates are limited to academy managers"
on public.coach_feedback
for update
to authenticated
using (public.can_manage_academy(academy_id) or public.is_super_admin())
with check (public.can_manage_academy(academy_id) or public.is_super_admin());

create policy "Coach feedback can be deleted by academy managers"
on public.coach_feedback
for delete
to authenticated
using (public.can_manage_academy(academy_id) or public.is_super_admin());

commit;
