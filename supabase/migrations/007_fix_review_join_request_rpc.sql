begin;

drop function if exists public.review_academy_join_request(uuid, public.academy_join_request_status, text);

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

commit;
