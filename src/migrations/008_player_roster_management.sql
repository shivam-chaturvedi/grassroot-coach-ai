begin;

drop function if exists public.review_academy_join_request(uuid, public.academy_join_request_status, text);
drop function if exists public.review_academy_join_request(p_request_id uuid, p_decision text, p_response_message text);

create or replace function public.review_academy_join_request(
  p_request_id uuid,
  p_decision text,
  p_response_message text default null
)
returns public.academy_join_requests
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  normalized_decision public.academy_join_request_status;
  target_request public.academy_join_requests%rowtype;
  reviewer_profile public.profiles%rowtype;
  requester_profile public.profiles%rowtype;
  next_jersey integer;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  normalized_decision :=
    case lower(coalesce(p_decision, ''))
      when 'approved' then 'approved'::public.academy_join_request_status
      when 'rejected' then 'rejected'::public.academy_join_request_status
      else null
    end;

  if normalized_decision is null then
    raise exception 'Invalid review decision';
  end if;

  select *
  into target_request
  from public.academy_join_requests
  where id = p_request_id
  for update;

  if target_request.id is null then
    raise exception 'Join request not found';
  end if;

  if target_request.status <> 'pending'::public.academy_join_request_status then
    raise exception 'This request has already been reviewed';
  end if;

  if not public.can_manage_academy(target_request.academy_id) and not public.is_super_admin() then
    raise exception 'You do not have permission to review this request';
  end if;

  select *
  into reviewer_profile
  from public.profiles
  where user_id = auth.uid();

  update public.academy_join_requests
  set
    status = normalized_decision,
    response_message = p_response_message,
    reviewed_by = auth.uid(),
    reviewed_at = timezone('utc', now()),
    updated_at = timezone('utc', now())
  where id = p_request_id
  returning *
  into target_request;

  if normalized_decision = 'approved'::public.academy_join_request_status then
    select *
    into requester_profile
    from public.profiles
    where user_id = target_request.requester_user_id;

    insert into public.academy_memberships (
      academy_id,
      user_id,
      role,
      is_primary
    )
    values (
      target_request.academy_id,
      target_request.requester_user_id,
      'player'::public.user_role,
      true
    )
    on conflict (academy_id, user_id) do update
      set role = excluded.role,
          is_primary = true,
          updated_at = timezone('utc', now());

    update public.profiles
    set
      academy_id = target_request.academy_id,
      role = 'player'::public.user_role,
      updated_at = timezone('utc', now())
    where user_id = target_request.requester_user_id;

    if not exists (
      select 1
      from public.players
      where profile_id = target_request.requester_user_id
    ) then
      select coalesce(max(p.jersey_number), 0) + 1
      into next_jersey
      from public.players p
      where p.academy_id = target_request.academy_id;

      insert into public.players (
        academy_id,
        profile_id,
        full_name,
        short_name,
        age,
        player_role,
        batting_style,
        bowling_style,
        jersey_number,
        position,
        notes,
        is_active
      )
      values (
        target_request.academy_id,
        target_request.requester_user_id,
        coalesce(nullif(requester_profile.full_name, ''), 'New Player'),
        coalesce(nullif(requester_profile.display_name, ''), requester_profile.full_name, 'New Player'),
        18,
        'batsman'::public.player_role,
        'right_hand'::public.batting_style,
        'none'::public.bowling_style,
        next_jersey,
        'squad',
        'Auto-created from academy join request',
        true
      );
    end if;
  end if;

  insert into public.notifications (
    academy_id,
    recipient_user_id,
    notification_type,
    title,
    message,
    action_url,
    metadata
  )
  values (
    target_request.academy_id,
    target_request.requester_user_id,
    'system'::public.notification_type,
    case
      when normalized_decision = 'approved'::public.academy_join_request_status then 'Academy request approved'
      else 'Academy request not approved'
    end,
    case
      when normalized_decision = 'approved'::public.academy_join_request_status then
        'Your request was approved. You can now access your academy workspace.'
      else
        coalesce(p_response_message, 'Your request was not approved. You can search for another academy.')
    end,
    case
      when normalized_decision = 'approved'::public.academy_join_request_status then '/'
      else '/onboarding'
    end,
    jsonb_build_object(
      'join_request_id', target_request.id,
      'reviewed_by', reviewer_profile.user_id
    )
  );

  return target_request;
end;
$$;

insert into public.players (
  academy_id,
  profile_id,
  full_name,
  short_name,
  age,
  player_role,
  batting_style,
  bowling_style,
  jersey_number,
  position,
  notes,
  is_active
)
select
  p.academy_id,
  p.user_id,
  coalesce(nullif(p.full_name, ''), 'New Player'),
  coalesce(nullif(p.display_name, ''), p.full_name, 'New Player'),
  18,
  'batsman'::public.player_role,
  'right_hand'::public.batting_style,
  'none'::public.bowling_style,
  row_number() over (
    partition by p.academy_id
    order by p.created_at, p.user_id
  ) + coalesce(existing.max_jersey, 0),
  'squad',
  'Auto-created for approved academy player',
  true
from public.profiles p
join public.academy_memberships am
  on am.user_id = p.user_id
 and am.academy_id = p.academy_id
left join public.players existing_player
  on existing_player.profile_id = p.user_id
left join (
  select academy_id, max(jersey_number) as max_jersey
  from public.players
  group by academy_id
) existing
  on existing.academy_id = p.academy_id
where p.role = 'player'::public.user_role
  and p.academy_id is not null
  and existing_player.id is null;

create or replace function public.remove_academy_player(p_player_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  target_player public.players%rowtype;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  select *
  into target_player
  from public.players
  where id = p_player_id
  for update;

  if target_player.id is null then
    raise exception 'Player not found';
  end if;

  if not public.can_manage_academy(target_player.academy_id) and not public.is_super_admin() then
    raise exception 'You do not have permission to remove this player';
  end if;

  if target_player.profile_id is not null then
    delete from public.academy_memberships
    where academy_id = target_player.academy_id
      and user_id = target_player.profile_id;

    update public.profiles
    set
      academy_id = null,
      updated_at = timezone('utc', now())
    where user_id = target_player.profile_id;

    insert into public.notifications (
      recipient_user_id,
      notification_type,
      title,
      message,
      action_url
    )
    values (
      target_player.profile_id,
      'system'::public.notification_type,
      'Academy access removed',
      'Your academy access has been removed. You can search for another academy if needed.',
      '/onboarding'
    );
  end if;

  delete from public.players
  where id = target_player.id;

  return p_player_id;
end;
$$;

commit;
