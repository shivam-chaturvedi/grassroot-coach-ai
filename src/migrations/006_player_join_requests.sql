begin;

create type public.academy_join_request_status as enum (
  'pending',
  'approved',
  'rejected'
);

create table public.academy_join_requests (
  id uuid primary key default gen_random_uuid(),
  academy_id uuid not null references public.academies(id) on delete cascade,
  requester_user_id uuid not null references auth.users(id) on delete cascade,
  requested_role public.user_role not null default 'player',
  status public.academy_join_request_status not null default 'pending',
  response_message text,
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index academy_join_requests_academy_id_idx on public.academy_join_requests(academy_id);
create index academy_join_requests_requester_user_id_idx on public.academy_join_requests(requester_user_id);
create index academy_join_requests_status_idx on public.academy_join_requests(status);

create unique index academy_join_requests_one_pending_idx
on public.academy_join_requests(requester_user_id)
where status = 'pending';

create trigger on_academy_join_requests_touch_updated_at
before update on public.academy_join_requests
for each row
execute function public.touch_updated_at();

alter table public.academy_join_requests enable row level security;

create policy "Join requests are readable by requester or academy managers"
on public.academy_join_requests
for select
to authenticated
using (
  requester_user_id = auth.uid()
  or public.can_manage_academy(academy_id)
  or public.is_super_admin()
);

create or replace function public.list_academy_directory(search_term text default null)
returns table (
  id uuid,
  name text,
  slug text,
  founded_year integer,
  district_rank integer,
  state_rank integer,
  address text
)
language sql
stable
security definer
set search_path = public, auth
as $$
  select
    a.id,
    a.name,
    a.slug,
    a.founded_year,
    a.district_rank,
    a.state_rank,
    a.address
  from public.academies a
  where
    search_term is null
    or btrim(search_term) = ''
    or a.name ilike '%' || search_term || '%'
    or a.slug ilike '%' || search_term || '%'
    or coalesce(a.address, '') ilike '%' || search_term || '%'
  order by a.name asc;
$$;

create or replace function public.submit_academy_join_request(target_academy_id uuid)
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
    requested_role
  )
  values (
    target_academy_id,
    auth.uid(),
    'player'::public.user_role
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
    coalesce(current_profile.full_name, 'A player') || ' requested to join your academy.',
    '/requests',
    jsonb_build_object(
      'join_request_id', created_request.id,
      'requester_user_id', auth.uid()
    )
  from public.academy_memberships am
  where am.academy_id = target_academy_id
    and am.role in ('academy_owner'::public.user_role, 'coach'::public.user_role);

  return created_request;
end;
$$;

create or replace function public.review_academy_join_request(
  request_id uuid,
  decision public.academy_join_request_status,
  response_message text default null
)
returns public.academy_join_requests
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  target_request public.academy_join_requests%rowtype;
  reviewer_profile public.profiles%rowtype;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  if decision not in ('approved'::public.academy_join_request_status, 'rejected'::public.academy_join_request_status) then
    raise exception 'Invalid review decision';
  end if;

  select *
  into target_request
  from public.academy_join_requests
  where id = request_id
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
    status = decision,
    response_message = response_message,
    reviewed_by = auth.uid(),
    reviewed_at = timezone('utc', now()),
    updated_at = timezone('utc', now())
  where id = request_id
  returning *
  into target_request;

  if decision = 'approved'::public.academy_join_request_status then
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
      when decision = 'approved'::public.academy_join_request_status then 'Academy request approved'
      else 'Academy request not approved'
    end,
    case
      when decision = 'approved'::public.academy_join_request_status then
        'Your request was approved. You can now access your academy workspace.'
      else
        coalesce(response_message, 'Your request was not approved. You can search for another academy.')
    end,
    case
      when decision = 'approved'::public.academy_join_request_status then '/'
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
