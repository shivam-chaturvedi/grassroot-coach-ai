begin;

alter table public.player_match_stats
  add column did_bat boolean not null default false,
  add column did_bowl boolean not null default false,
  add column batting_order smallint,
  add column role_performed text,
  add column dismissal_type text,
  add column dismissal_details text,
  add column ones_taken integer not null default 0,
  add column twos_taken integer not null default 0,
  add column stumpings integer not null default 0,
  add column dropped_catches integer not null default 0,
  add column missed_chances integer not null default 0,
  add column bowling_spell text,
  add column positive_tags text[] not null default '{}'::text[],
  add column mistake_tags text[] not null default '{}'::text[],
  add column self_feedback text,
  add column improvement_goal text,
  add column self_confidence_rating smallint not null default 0,
  add column self_energy_rating smallint not null default 0,
  add column self_focus_rating smallint not null default 0,
  add column pressure_handling_rating smallint not null default 0,
  add column match_impact_rating smallint not null default 0,
  add column submitted_by_player_at timestamptz,
  add column coach_feedback text,
  add column coach_action_points text,
  add column coach_tags text[] not null default '{}'::text[],
  add column coach_rating smallint not null default 0,
  add column reviewed_by_coach_id uuid references public.profiles(user_id) on delete set null,
  add column reviewed_at timestamptz,
  add constraint player_match_stats_batting_order_check check (batting_order is null or batting_order between 1 and 11),
  add constraint player_match_stats_ones_taken_check check (ones_taken >= 0),
  add constraint player_match_stats_twos_taken_check check (twos_taken >= 0),
  add constraint player_match_stats_stumpings_check check (stumpings >= 0),
  add constraint player_match_stats_dropped_catches_check check (dropped_catches >= 0),
  add constraint player_match_stats_missed_chances_check check (missed_chances >= 0),
  add constraint player_match_stats_self_confidence_rating_check check (self_confidence_rating between 0 and 10),
  add constraint player_match_stats_self_energy_rating_check check (self_energy_rating between 0 and 10),
  add constraint player_match_stats_self_focus_rating_check check (self_focus_rating between 0 and 10),
  add constraint player_match_stats_pressure_handling_rating_check check (pressure_handling_rating between 0 and 10),
  add constraint player_match_stats_match_impact_rating_check check (match_impact_rating between 0 and 10),
  add constraint player_match_stats_coach_rating_check check (coach_rating between 0 and 10);

create or replace function public.is_player_selected_for_match(target_match_id uuid, target_player_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select exists (
    select 1
    from public.match_squads ms
    where ms.match_id = target_match_id
      and ms.player_id = target_player_id
      and ms.is_selected = true
  );
$$;

create or replace function public.can_submit_own_match_stats(target_match_id uuid, target_player_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select
    public.current_player_id() = target_player_id
    and exists (
      select 1
      from public.matches m
      where m.id = target_match_id
        and m.status = 'completed'::public.match_status
    )
    and public.is_player_selected_for_match(target_match_id, target_player_id);
$$;

create policy "Match stats can be inserted by linked player after completion"
on public.player_match_stats
for insert
to authenticated
with check (
  public.can_submit_own_match_stats(match_id, player_id)
  or public.can_manage_academy(public.match_academy_id(match_id))
  or public.is_super_admin()
);

create policy "Match stats can be updated by linked player after completion"
on public.player_match_stats
for update
to authenticated
using (
  public.can_submit_own_match_stats(match_id, player_id)
  or public.can_manage_academy(public.match_academy_id(match_id))
  or public.is_super_admin()
)
with check (
  public.can_submit_own_match_stats(match_id, player_id)
  or public.can_manage_academy(public.match_academy_id(match_id))
  or public.is_super_admin()
);

commit;
