begin;

alter table public.academy_join_requests
add column if not exists requested_player_role public.player_role not null default 'batsman';

create or replace function public.submit_academy_join_request(
  target_academy_id uuid,
  target_player_role public.player_role default 'batsman'
)
returns public.academy_join_requests
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  current_profile public.profiles%rowtype;
  existing_request public.academy_join_requests%rowtype;
  created_request public.academy_join_requests%rowtype;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  select *
  into current_profile
  from public.profiles
  where user_id = auth.uid();

  if current_profile.user_id is null then
    raise exception 'Profile not found';
  end if;

  if current_profile.academy_id is not null then
    raise exception 'You are already linked to an academy';
  end if;

  select *
  into existing_request
  from public.academy_join_requests
  where requester_user_id = auth.uid()
    and status = 'pending'
  limit 1;

  if existing_request.id is not null then
    raise exception 'You already have a pending academy request';
  end if;

  insert into public.academy_join_requests (
    academy_id,
    requester_user_id,
    requested_role,
    requested_player_role
  )
  values (
    target_academy_id,
    auth.uid(),
    'player'::public.user_role,
    target_player_role
  )
  returning *
  into created_request;

  insert into public.notifications (
    academy_id,
    recipient_user_id,
    notification_type,
    title,
    message,
    action_url,
    metadata
  )
  select
    target_academy_id,
    am.user_id,
    'alert'::public.notification_type,
    'New academy join request',
    coalesce(current_profile.full_name, 'A player') || ' requested to join your academy as ' || replace(created_request.requested_player_role::text, '_', ' ') || '.',
    '/requests',
    jsonb_build_object(
      'join_request_id', created_request.id,
      'requester_user_id', auth.uid(),
      'requested_player_role', created_request.requested_player_role
    )
  from public.academy_memberships am
  where am.academy_id = target_academy_id
    and am.role in ('academy_owner'::public.user_role, 'coach'::public.user_role);

  return created_request;
end;
$$;

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
        target_request.requested_player_role,
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
      'reviewed_by', reviewer_profile.user_id,
      'requested_player_role', target_request.requested_player_role
    )
  );

  return target_request;
end;
$$;

commit;
