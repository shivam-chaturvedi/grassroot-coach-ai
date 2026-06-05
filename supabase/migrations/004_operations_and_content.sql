begin;

create table public.training_sessions (
  id uuid primary key default gen_random_uuid(),
  academy_id uuid not null references public.academies(id) on delete cascade,
  team_id uuid references public.teams(id) on delete set null,
  season_id uuid references public.seasons(id) on delete set null,
  day_of_week text not null,
  start_time time not null,
  session_name text not null,
  session_type public.session_type not null,
  venue text,
  notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.reports (
  id uuid primary key default gen_random_uuid(),
  academy_id uuid not null references public.academies(id) on delete cascade,
  season_id uuid references public.seasons(id) on delete set null,
  report_name text not null,
  report_type public.report_type not null,
  file_url text,
  generated_by uuid references auth.users(id) on delete set null,
  generated_at timestamptz not null default timezone('utc', now()),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  academy_id uuid references public.academies(id) on delete cascade,
  recipient_user_id uuid references auth.users(id) on delete cascade,
  notification_type public.notification_type not null default 'system',
  title text not null,
  message text not null,
  action_url text,
  read_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint notifications_scope_check check (academy_id is not null or recipient_user_id is not null)
);

create table public.ai_recommendations (
  id uuid primary key default gen_random_uuid(),
  academy_id uuid not null references public.academies(id) on delete cascade,
  team_id uuid references public.teams(id) on delete set null,
  match_id uuid references public.matches(id) on delete set null,
  recommendation_type public.recommendation_type not null,
  priority public.priority_level not null default 'medium',
  title text not null,
  description text not null,
  context jsonb not null default '{}'::jsonb,
  resolved_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index training_sessions_academy_id_idx on public.training_sessions(academy_id);
create index training_sessions_team_id_idx on public.training_sessions(team_id);
create index training_sessions_season_id_idx on public.training_sessions(season_id);
create index reports_academy_id_idx on public.reports(academy_id);
create index reports_season_id_idx on public.reports(season_id);
create index notifications_academy_id_idx on public.notifications(academy_id);
create index notifications_recipient_user_id_idx on public.notifications(recipient_user_id);
create index ai_recommendations_academy_id_idx on public.ai_recommendations(academy_id);
create index ai_recommendations_team_id_idx on public.ai_recommendations(team_id);
create index ai_recommendations_match_id_idx on public.ai_recommendations(match_id);

create trigger on_training_sessions_touch_updated_at
before update on public.training_sessions
for each row
execute function public.touch_updated_at();

create trigger on_reports_touch_updated_at
before update on public.reports
for each row
execute function public.touch_updated_at();

create trigger on_notifications_touch_updated_at
before update on public.notifications
for each row
execute function public.touch_updated_at();

create trigger on_ai_recommendations_touch_updated_at
before update on public.ai_recommendations
for each row
execute function public.touch_updated_at();

alter table public.training_sessions enable row level security;
alter table public.reports enable row level security;
alter table public.notifications enable row level security;
alter table public.ai_recommendations enable row level security;

create policy "Training sessions are readable by academy members"
on public.training_sessions
for select
to authenticated
using (public.can_view_academy(academy_id) or public.is_super_admin());

create policy "Training sessions are editable by academy managers"
on public.training_sessions
for insert
to authenticated
with check (public.can_manage_academy(academy_id) or public.is_super_admin());

create policy "Training sessions updates are limited to academy managers"
on public.training_sessions
for update
to authenticated
using (public.can_manage_academy(academy_id) or public.is_super_admin())
with check (public.can_manage_academy(academy_id) or public.is_super_admin());

create policy "Training sessions can be deleted by academy managers"
on public.training_sessions
for delete
to authenticated
using (public.can_manage_academy(academy_id) or public.is_super_admin());

create policy "Reports are readable by academy members"
on public.reports
for select
to authenticated
using (public.can_view_academy(academy_id) or public.is_super_admin());

create policy "Reports are editable by academy managers"
on public.reports
for insert
to authenticated
with check (public.can_manage_academy(academy_id) or public.is_super_admin());

create policy "Reports updates are limited to academy managers"
on public.reports
for update
to authenticated
using (public.can_manage_academy(academy_id) or public.is_super_admin())
with check (public.can_manage_academy(academy_id) or public.is_super_admin());

create policy "Reports can be deleted by academy managers"
on public.reports
for delete
to authenticated
using (public.can_manage_academy(academy_id) or public.is_super_admin());

create policy "Notifications are readable by the recipient or academy members"
on public.notifications
for select
to authenticated
using (
  recipient_user_id = auth.uid()
  or (academy_id is not null and public.can_view_academy(academy_id))
  or public.is_super_admin()
);

create policy "Notifications are editable by the recipient or academy managers"
on public.notifications
for insert
to authenticated
with check (
  recipient_user_id = auth.uid()
  or (academy_id is not null and public.can_manage_academy(academy_id))
  or public.is_super_admin()
);

create policy "Notifications can be updated by the recipient or academy managers"
on public.notifications
for update
to authenticated
using (
  recipient_user_id = auth.uid()
  or (academy_id is not null and public.can_manage_academy(academy_id))
  or public.is_super_admin()
)
with check (
  recipient_user_id = auth.uid()
  or (academy_id is not null and public.can_manage_academy(academy_id))
  or public.is_super_admin()
);

create policy "Notifications can be deleted by the recipient or academy managers"
on public.notifications
for delete
to authenticated
using (
  recipient_user_id = auth.uid()
  or (academy_id is not null and public.can_manage_academy(academy_id))
  or public.is_super_admin()
);

create policy "AI recommendations are readable by academy members"
on public.ai_recommendations
for select
to authenticated
using (public.can_view_academy(academy_id) or public.is_super_admin());

create policy "AI recommendations are editable by academy managers"
on public.ai_recommendations
for insert
to authenticated
with check (public.can_manage_academy(academy_id) or public.is_super_admin());

create policy "AI recommendations updates are limited to academy managers"
on public.ai_recommendations
for update
to authenticated
using (public.can_manage_academy(academy_id) or public.is_super_admin())
with check (public.can_manage_academy(academy_id) or public.is_super_admin());

create policy "AI recommendations can be deleted by academy managers"
on public.ai_recommendations
for delete
to authenticated
using (public.can_manage_academy(academy_id) or public.is_super_admin());

commit;
