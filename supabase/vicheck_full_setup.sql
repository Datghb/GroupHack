-- VICheck complete database bootstrap
-- Generated from the ordered files in supabase/migrations.
-- Safe to run as one transaction in the Supabase SQL Editor.
-- Keep this file outside migrations to avoid duplicate execution by supabase db push.

begin;
-- ============================================================================
-- Source: supabase/migrations/202608030001_classroom_core.sql
-- ============================================================================
create extension if not exists pgcrypto;

create table if not exists public.classrooms (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 3 and 120),
  description text not null default '',
  teacher_id text not null,
  archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.class_enrollments (
  id uuid primary key default gen_random_uuid(),
  classroom_id uuid not null references public.classrooms(id) on delete cascade,
  student_id text not null,
  joined_at timestamptz not null default now(),
  unique (classroom_id, student_id)
);

create table if not exists public.teams (
  id uuid primary key default gen_random_uuid(),
  classroom_id uuid not null references public.classrooms(id) on delete cascade,
  name text not null check (char_length(name) between 2 and 100),
  description text not null default '',
  leader_id text not null,
  capacity integer not null default 5 check (capacity between 2 and 10),
  open boolean not null default true,
  archived boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.team_members (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams(id) on delete cascade,
  classroom_id uuid not null references public.classrooms(id) on delete cascade,
  student_id text not null,
  joined_at timestamptz not null default now(),
  unique (team_id, student_id),
  unique (classroom_id, student_id)
);

create index if not exists classrooms_teacher_id_idx on public.classrooms(teacher_id);
create index if not exists enrollments_student_id_idx on public.class_enrollments(student_id);
create index if not exists teams_classroom_id_idx on public.teams(classroom_id);
create index if not exists team_members_student_id_idx on public.team_members(student_id);

alter table public.classrooms enable row level security;
alter table public.class_enrollments enable row level security;
alter table public.teams enable row level security;
alter table public.team_members enable row level security;

revoke all on public.classrooms from anon, authenticated;
revoke all on public.class_enrollments from anon, authenticated;
revoke all on public.teams from anon, authenticated;
revoke all on public.team_members from anon, authenticated;
grant all on public.classrooms to service_role;
grant all on public.class_enrollments to service_role;
grant all on public.teams to service_role;
grant all on public.team_members to service_role;

-- ============================================================================
-- Source: supabase/migrations/202608030002_supabase_auth_profiles.sql
-- ============================================================================
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  role text not null default 'STUDENT' check (role in ('TEACHER', 'STUDENT')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- `create table if not exists` does not update an older profiles table.
-- Keep this migration compatible with Supabase projects that created profiles
-- before VICheck added names, roles and timestamps.
alter table public.profiles
  add column if not exists full_name text not null default '',
  add column if not exists display_name text not null default '',
  add column if not exists role text not null default 'STUDENT',
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

update public.profiles
set display_name = coalesce(nullif(display_name, ''), full_name, '')
where display_name is null or display_name = '';
alter table public.profiles alter column display_name set default '';

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'profiles'
      and column_name = 'role'
      and data_type = 'text'
  ) and not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.profiles'::regclass
      and conname = 'profiles_role_check'
  ) then
    alter table public.profiles
      add constraint profiles_role_check
      check (role in ('TEACHER', 'STUDENT')) not valid;
  end if;
end
$$;

alter table public.profiles enable row level security;

revoke update on table public.profiles from authenticated;
grant update (full_name, updated_at) on table public.profiles to authenticated;

drop policy if exists "Users can read their own profile" on public.profiles;
create policy "Users can read their own profile"
on public.profiles for select to authenticated
using ((select auth.uid()) = id);

drop policy if exists "Users can update their own name" on public.profiles;
create policy "Users can update their own name"
on public.profiles for update to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'display_name', ''),
    coalesce(new.raw_user_meta_data ->> 'display_name', new.raw_user_meta_data ->> 'full_name', '')
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

insert into public.profiles (id, full_name, display_name)
select
  id,
  coalesce(raw_user_meta_data ->> 'full_name', raw_user_meta_data ->> 'display_name', ''),
  coalesce(raw_user_meta_data ->> 'display_name', raw_user_meta_data ->> 'full_name', '')
from auth.users
on conflict (id) do nothing;

-- ============================================================================
-- Source: supabase/migrations/202608030003_assignments_checkpoints.sql
-- ============================================================================
create table if not exists public.assignments (
  id uuid primary key default gen_random_uuid(),
  classroom_id uuid not null references public.classrooms(id) on delete cascade,
  title text not null check (char_length(title) between 3 and 160),
  description text not null default '',
  due_at timestamptz,
  created_by text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.assignment_checkpoints (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid not null references public.assignments(id) on delete cascade,
  title text not null check (char_length(title) between 2 and 160),
  description text not null default '',
  due_at timestamptz,
  position integer not null check (position >= 0),
  unique (assignment_id, position)
);

create table if not exists public.assignment_teams (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid not null references public.assignments(id) on delete cascade,
  classroom_id uuid not null references public.classrooms(id) on delete cascade,
  name text not null check (char_length(name) between 2 and 100),
  description text not null default '',
  leader_id text not null,
  capacity integer not null default 5 check (capacity between 2 and 10),
  open boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.assignment_team_members (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.assignment_teams(id) on delete cascade,
  assignment_id uuid not null references public.assignments(id) on delete cascade,
  student_id text not null,
  joined_at timestamptz not null default now(),
  unique (team_id, student_id),
  unique (assignment_id, student_id)
);

create index if not exists assignments_classroom_idx on public.assignments(classroom_id);
create index if not exists checkpoints_assignment_idx on public.assignment_checkpoints(assignment_id);
create index if not exists assignment_teams_assignment_idx on public.assignment_teams(assignment_id);
create index if not exists assignment_team_members_student_idx on public.assignment_team_members(student_id);

alter table public.assignments enable row level security;
alter table public.assignment_checkpoints enable row level security;
alter table public.assignment_teams enable row level security;
alter table public.assignment_team_members enable row level security;

revoke all on public.assignments, public.assignment_checkpoints, public.assignment_teams, public.assignment_team_members from anon, authenticated;
grant all on public.assignments, public.assignment_checkpoints, public.assignment_teams, public.assignment_team_members to service_role;

-- ============================================================================
-- Source: supabase/migrations/202608030004_classroom_courses.sql
-- ============================================================================
create table if not exists public.classroom_courses (
  id uuid primary key default gen_random_uuid(),
  classroom_id uuid not null references public.classrooms(id) on delete cascade,
  name text not null check (char_length(name) between 2 and 80),
  position integer not null check (position between 1 and 2),
  created_at timestamptz not null default now(),
  unique (classroom_id, position)
);

insert into public.classroom_courses (classroom_id, name, position)
select id, 'Khóa 1', 1 from public.classrooms
on conflict (classroom_id, position) do nothing;
insert into public.classroom_courses (classroom_id, name, position)
select id, 'Khóa 2', 2 from public.classrooms
on conflict (classroom_id, position) do nothing;

alter table public.class_enrollments add column if not exists course_id uuid references public.classroom_courses(id);
alter table public.assignments add column if not exists course_id uuid references public.classroom_courses(id);

update public.class_enrollments enrollment
set course_id = course.id
from public.classroom_courses course
where course.classroom_id = enrollment.classroom_id and course.position = 1 and enrollment.course_id is null;

update public.assignments assignment
set course_id = course.id
from public.classroom_courses course
where course.classroom_id = assignment.classroom_id and course.position = 1 and assignment.course_id is null;

create index if not exists classroom_courses_classroom_idx on public.classroom_courses(classroom_id);
create index if not exists assignments_course_idx on public.assignments(course_id);

alter table public.classroom_courses enable row level security;
revoke all on public.classroom_courses from anon, authenticated;
grant all on public.classroom_courses to service_role;

notify pgrst, 'reload schema';

-- ============================================================================
-- Source: supabase/migrations/202608030005_checkpoint_completions.sql
-- ============================================================================
create table if not exists public.checkpoint_completions (
  id uuid primary key default gen_random_uuid(),
  checkpoint_id uuid not null references public.assignment_checkpoints(id) on delete cascade,
  assignment_id uuid not null references public.assignments(id) on delete cascade,
  team_id uuid not null references public.assignment_teams(id) on delete cascade,
  completed_by uuid not null references auth.users(id) on delete cascade,
  completed_at timestamptz not null default now(),
  unique (checkpoint_id, team_id)
);

create index if not exists checkpoint_completions_assignment_idx
  on public.checkpoint_completions (assignment_id);
create index if not exists checkpoint_completions_team_idx
  on public.checkpoint_completions (team_id);

alter table public.checkpoint_completions enable row level security;
revoke all on public.checkpoint_completions from anon, authenticated;
grant select, insert, update, delete on public.checkpoint_completions to service_role;

-- ============================================================================
-- Source: supabase/migrations/202608030006_atomic_team_join.sql
-- ============================================================================
create or replace function public.join_assignment_team(
  p_team_id uuid,
  p_assignment_id uuid,
  p_student_id uuid
) returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  selected_team public.assignment_teams%rowtype;
  member_count integer;
begin
  select * into selected_team
  from public.assignment_teams
  where id = p_team_id and assignment_id = p_assignment_id
  for update;

  if not found or not selected_team.open then return 'NOT_FOUND'; end if;
  if exists (
    select 1 from public.assignment_team_members
    where assignment_id = p_assignment_id and student_id = p_student_id
  ) then return 'ALREADY_MEMBER'; end if;

  select count(*) into member_count
  from public.assignment_team_members
  where team_id = p_team_id;
  if member_count >= selected_team.capacity then return 'FULL'; end if;

  insert into public.assignment_team_members (team_id, assignment_id, student_id)
  values (p_team_id, p_assignment_id, p_student_id);
  return 'JOINED';
end;
$$;

revoke all on function public.join_assignment_team(uuid, uuid, uuid) from public, anon, authenticated;
grant execute on function public.join_assignment_team(uuid, uuid, uuid) to service_role;
notify pgrst, 'reload schema';

-- ============================================================================
-- Source: supabase/migrations/202608030007_team_join_requests.sql
-- ============================================================================
create table if not exists public.assignment_team_join_requests (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.assignment_teams(id) on delete cascade,
  assignment_id uuid not null references public.assignments(id) on delete cascade,
  student_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'PENDING' check (status in ('PENDING', 'APPROVED', 'REJECTED')),
  created_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references auth.users(id) on delete set null,
  unique (assignment_id, student_id)
);

create index if not exists assignment_team_join_requests_team_idx
  on public.assignment_team_join_requests (team_id, status);
alter table public.assignment_team_join_requests enable row level security;
revoke all on public.assignment_team_join_requests from anon, authenticated;
grant all on public.assignment_team_join_requests to service_role;

create or replace function public.review_assignment_team_join_request(
  p_request_id uuid,
  p_leader_id uuid,
  p_approve boolean
) returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  selected_request public.assignment_team_join_requests%rowtype;
  selected_team public.assignment_teams%rowtype;
  member_count integer;
begin
  select * into selected_request
  from public.assignment_team_join_requests
  where id = p_request_id
  for update;
  if not found or selected_request.status <> 'PENDING' then return 'NOT_PENDING'; end if;

  select * into selected_team
  from public.assignment_teams
  where id = selected_request.team_id
  for update;
  if not found or selected_team.leader_id <> p_leader_id::text then return 'FORBIDDEN'; end if;

  if not p_approve then
    update public.assignment_team_join_requests
    set status = 'REJECTED', reviewed_at = now(), reviewed_by = p_leader_id
    where id = p_request_id;
    return 'REJECTED';
  end if;

  if exists (
    select 1 from public.assignment_team_members
    where assignment_id = selected_request.assignment_id
      and student_id = selected_request.student_id::text
  ) then return 'ALREADY_MEMBER'; end if;

  select count(*) into member_count
  from public.assignment_team_members
  where team_id = selected_request.team_id;
  if member_count >= selected_team.capacity then return 'FULL'; end if;

  insert into public.assignment_team_members (team_id, assignment_id, student_id)
  values (selected_request.team_id, selected_request.assignment_id, selected_request.student_id::text);
  update public.assignment_team_join_requests
  set status = 'APPROVED', reviewed_at = now(), reviewed_by = p_leader_id
  where id = p_request_id;
  return 'APPROVED';
end;
$$;

revoke all on function public.review_assignment_team_join_request(uuid, uuid, boolean)
  from public, anon, authenticated;
grant execute on function public.review_assignment_team_join_request(uuid, uuid, boolean)
  to service_role;
notify pgrst, 'reload schema';

-- ============================================================================
-- Source: supabase/migrations/202608030008_checkpoint_scope.sql
-- ============================================================================
alter table public.assignment_checkpoints add column if not exists scope text;
update public.assignment_checkpoints set scope = 'TEAM' where scope is null;
alter table public.assignment_checkpoints alter column scope set default 'TEAM';
alter table public.assignment_checkpoints alter column scope set not null;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'assignment_checkpoints_scope_check'
      and conrelid = 'public.assignment_checkpoints'::regclass
  ) then
    alter table public.assignment_checkpoints
      add constraint assignment_checkpoints_scope_check
      check (scope in ('INDIVIDUAL', 'TEAM'));
  end if;
end $$;

alter table public.checkpoint_completions
  add column if not exists completion_scope text;
update public.checkpoint_completions
  set completion_scope = 'TEAM'
  where completion_scope is null;
alter table public.checkpoint_completions
  alter column completion_scope set default 'TEAM';
alter table public.checkpoint_completions
  alter column completion_scope set not null;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'checkpoint_completions_scope_check'
      and conrelid = 'public.checkpoint_completions'::regclass
  ) then
    alter table public.checkpoint_completions
      add constraint checkpoint_completions_scope_check
      check (completion_scope in ('INDIVIDUAL', 'TEAM'));
  end if;
end $$;

alter table public.checkpoint_completions
  drop constraint if exists checkpoint_completions_checkpoint_id_team_id_key;

create unique index if not exists checkpoint_completions_team_unique
  on public.checkpoint_completions (checkpoint_id, team_id)
  where completion_scope = 'TEAM';

create unique index if not exists checkpoint_completions_individual_unique
  on public.checkpoint_completions (checkpoint_id, completed_by)
  where completion_scope = 'INDIVIDUAL';

-- ============================================================================
-- Source: supabase/migrations/202608030009_rename_classroom_courses.sql
-- ============================================================================
update public.classroom_courses
set name = case position
  when 1 then 'Khóa 3'
  when 2 then 'Khóa 4'
end
where (position = 1 and name = 'Khóa 1')
   or (position = 2 and name = 'Khóa 2');

notify pgrst, 'reload schema';

-- ============================================================================
-- Source: supabase/migrations/202608030010_simplify_checkpoint_content.sql
-- ============================================================================
update public.assignment_checkpoints
set
  title = 'Checkpoint ' || (position + 1),
  description = '';

notify pgrst, 'reload schema';

-- ============================================================================
-- Source: supabase/migrations/202608030011_notifications.sql
-- ============================================================================
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  title text not null check (char_length(title) between 1 and 160),
  body text not null default '',
  action_url text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists notifications_user_created_idx
on public.notifications (user_id, created_at desc);

alter table public.notifications enable row level security;
revoke all on public.notifications from anon, authenticated;
grant all on public.notifications to service_role;

create or replace function public.notify_students_about_assignment()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.notifications (user_id, title, body, action_url)
  select
    enrollment.student_id,
    'Bài tập mới: ' || new.title,
    case
      when new.due_at is null then 'Giảng viên vừa giao một bài tập mới.'
      else 'Hạn hoàn thành: ' || to_char(new.due_at at time zone 'Asia/Ho_Chi_Minh', 'DD/MM/YYYY HH24:MI') || '.'
    end,
    '/student/classes/' || new.classroom_id || '/assignments/' || new.id
  from public.class_enrollments enrollment
  where enrollment.classroom_id = new.classroom_id
    and enrollment.course_id = new.course_id;
  return new;
end;
$$;

drop trigger if exists assignments_notify_students on public.assignments;
create trigger assignments_notify_students
after insert on public.assignments
for each row execute function public.notify_students_about_assignment();

create or replace function public.notify_team_join_request()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  selected_team public.assignment_teams%rowtype;
  student_name text;
begin
  if new.status <> 'PENDING' then return new; end if;
  select * into selected_team from public.assignment_teams where id = new.team_id;
  select coalesce(full_name, 'Một học sinh') into student_name
  from public.profiles where id = new.student_id;

  insert into public.notifications (user_id, title, body, action_url)
  values (
    selected_team.leader_id,
    'Yêu cầu tham gia nhóm',
    student_name || ' muốn tham gia nhóm ' || selected_team.name || '.',
    '/student/classes/' || selected_team.classroom_id || '/assignments/' || new.assignment_id
  );
  return new;
end;
$$;

drop trigger if exists team_join_request_notify_leader on public.assignment_team_join_requests;
create trigger team_join_request_notify_leader
after insert on public.assignment_team_join_requests
for each row execute function public.notify_team_join_request();

create or replace function public.notify_team_join_result()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  selected_team public.assignment_teams%rowtype;
begin
  if old.status = new.status or new.status not in ('APPROVED', 'REJECTED') then return new; end if;
  select * into selected_team from public.assignment_teams where id = new.team_id;

  insert into public.notifications (user_id, title, body, action_url)
  values (
    new.student_id,
    case when new.status = 'APPROVED' then 'Yêu cầu vào nhóm đã được duyệt' else 'Yêu cầu vào nhóm bị từ chối' end,
    case
      when new.status = 'APPROVED' then 'Bạn đã trở thành thành viên nhóm ' || selected_team.name || '.'
      else 'Trưởng nhóm ' || selected_team.name || ' đã từ chối yêu cầu của bạn.'
    end,
    '/student/classes/' || selected_team.classroom_id || '/assignments/' || new.assignment_id
  );
  return new;
end;
$$;

drop trigger if exists team_join_result_notify_student on public.assignment_team_join_requests;
create trigger team_join_result_notify_student
after update of status on public.assignment_team_join_requests
for each row execute function public.notify_team_join_result();

-- ============================================================================
-- Source: supabase/migrations/202608030012_team_checkpoint_member_ticks.sql
-- ============================================================================
alter table public.checkpoint_completions
  drop constraint if exists checkpoint_completions_team_unique;
alter table public.checkpoint_completions
  drop constraint if exists checkpoint_completions_individual_unique;
alter table public.checkpoint_completions
  drop constraint if exists checkpoint_completions_checkpoint_id_team_id_key;
alter table public.checkpoint_completions
  drop constraint if exists checkpoint_completions_member_unique;

drop index if exists public.checkpoint_completions_team_unique;
drop index if exists public.checkpoint_completions_individual_unique;
drop index if exists public.checkpoint_completions_member_unique;

create unique index checkpoint_completions_member_unique
  on public.checkpoint_completions (checkpoint_id, team_id, completed_by);

comment on index public.checkpoint_completions_member_unique is
  'Mỗi thành viên chỉ được tick một lần cho mỗi checkpoint; checkpoint nhóm hoàn thành khi mọi thành viên đã tick.';

notify pgrst, 'reload schema';
  

-- ============================================================================
-- Source: supabase/migrations/202608040001_product_showcase.sql
-- ============================================================================
create table if not exists public.product_submissions (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid not null references public.assignments(id) on delete cascade,
  team_id uuid not null references public.assignment_teams(id) on delete cascade,
  title text not null check (char_length(title) between 3 and 120),
  description text not null default '' check (char_length(description) <= 1000),
  website_url text not null check (char_length(website_url) <= 2048),
  submitted_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (assignment_id, team_id)
);

create table if not exists public.product_reviews (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references public.product_submissions(id) on delete cascade,
  reviewer_team_id uuid not null references public.assignment_teams(id) on delete cascade,
  reviewer_id uuid not null references auth.users(id) on delete restrict,
  rating integer not null check (rating between 1 and 5),
  comment text not null default '' check (char_length(comment) <= 500),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (submission_id, reviewer_team_id)
);

create index if not exists product_submissions_assignment_idx on public.product_submissions (assignment_id);
create index if not exists product_reviews_submission_idx on public.product_reviews (submission_id);

alter table public.product_submissions enable row level security;
alter table public.product_reviews enable row level security;
revoke all on public.product_submissions, public.product_reviews from anon, authenticated;
grant all on public.product_submissions, public.product_reviews to service_role;

notify pgrst, 'reload schema';

-- ============================================================================
-- Source: supabase/migrations/202608040006_assignment_review_mode.sql
-- ============================================================================
alter table public.assignments
  add column if not exists review_mode text not null default 'TEAM';
alter table public.assignments drop constraint if exists assignments_review_mode_check;
alter table public.assignments add constraint assignments_review_mode_check
  check (review_mode in ('TEAM', 'INDIVIDUAL')) not valid;
alter table public.assignments validate constraint assignments_review_mode_check;

alter table public.product_reviews
  add column if not exists review_mode text not null default 'TEAM';
alter table public.product_reviews drop constraint if exists product_reviews_review_mode_check;
alter table public.product_reviews add constraint product_reviews_review_mode_check
  check (review_mode in ('TEAM', 'INDIVIDUAL')) not valid;
alter table public.product_reviews validate constraint product_reviews_review_mode_check;

alter table public.product_reviews
  drop constraint if exists product_reviews_submission_id_reviewer_team_id_key;
drop index if exists public.product_reviews_submission_id_reviewer_team_id_key;
drop index if exists public.product_reviews_student_team_unique;
drop index if exists public.product_reviews_student_individual_unique;
create unique index product_reviews_student_team_unique
  on public.product_reviews (submission_id, reviewer_team_id)
  where reviewer_team_id is not null and review_mode = 'TEAM';
create unique index product_reviews_student_individual_unique
  on public.product_reviews (submission_id, reviewer_id)
  where reviewer_team_id is not null and review_mode = 'INDIVIDUAL';

create or replace function public.set_assignment_review_mode(
  p_assignment_id uuid,
  p_teacher_id uuid,
  p_review_mode text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_review_mode not in ('TEAM', 'INDIVIDUAL') then
    raise exception 'Invalid review mode';
  end if;
  if not exists (
    select 1 from public.assignments a
    join public.classrooms c on c.id = a.classroom_id
    where a.id = p_assignment_id and c.teacher_id = p_teacher_id::text
  ) then
    raise exception 'Assignment not managed by teacher';
  end if;
  if exists (
    select 1 from public.assignments
    where id = p_assignment_id and review_mode <> p_review_mode
  ) then
    delete from public.product_reviews pr
    using public.product_submissions ps
    where pr.submission_id = ps.id
      and ps.assignment_id = p_assignment_id
      and pr.reviewer_team_id is not null;
    update public.assignments set review_mode = p_review_mode where id = p_assignment_id;
  end if;
end;
$$;
revoke all on function public.set_assignment_review_mode(uuid, uuid, text) from public;
grant execute on function public.set_assignment_review_mode(uuid, uuid, text) to service_role;
notify pgrst, 'reload schema';

-- ============================================================================
-- Source: supabase/migrations/202608040008_assignment_team_leave.sql
-- ============================================================================
create or replace function public.leave_assignment_team(
  p_team_id uuid, p_assignment_id uuid, p_student_id uuid
)
returns text language plpgsql security definer set search_path = public
as $$
declare
  selected_team public.assignment_teams%rowtype;
  member_count integer;
begin
  select * into selected_team from public.assignment_teams
  where id = p_team_id and assignment_id = p_assignment_id for update;
  if not found then return 'NOT_FOUND'; end if;
  if not exists (
    select 1 from public.assignment_team_members
    where team_id = p_team_id and student_id = p_student_id::text
  ) then return 'NOT_MEMBER'; end if;
  if exists (select 1 from public.product_submissions where team_id = p_team_id)
    then return 'HAS_SUBMISSION'; end if;
  select count(*) into member_count from public.assignment_team_members where team_id = p_team_id;
  if selected_team.leader_id = p_student_id::text and member_count > 1
    then return 'LEADER_TRANSFER_REQUIRED'; end if;
  delete from public.product_reviews
  where reviewer_id = p_student_id and reviewer_team_id = p_team_id
    and review_mode = 'INDIVIDUAL';
  delete from public.checkpoint_completions
  where team_id = p_team_id and completed_by = p_student_id::text;
  delete from public.assignment_team_join_requests
  where assignment_id = p_assignment_id and student_id = p_student_id;
  if selected_team.leader_id = p_student_id::text and member_count = 1 then
    delete from public.assignment_teams where id = p_team_id;
    return 'DISBANDED';
  end if;
  delete from public.assignment_team_members
  where team_id = p_team_id and student_id = p_student_id::text;
  return 'LEFT';
end;
$$;

create or replace function public.transfer_assignment_team_leader(
  p_team_id uuid, p_assignment_id uuid, p_current_leader_id uuid, p_new_leader_id uuid
)
returns text language plpgsql security definer set search_path = public
as $$
declare selected_team public.assignment_teams%rowtype;
begin
  select * into selected_team from public.assignment_teams
  where id = p_team_id and assignment_id = p_assignment_id for update;
  if not found then return 'NOT_FOUND'; end if;
  if selected_team.leader_id <> p_current_leader_id::text then return 'FORBIDDEN'; end if;
  if p_current_leader_id = p_new_leader_id then return 'SAME_LEADER'; end if;
  if not exists (
    select 1 from public.assignment_team_members
    where team_id = p_team_id and student_id = p_new_leader_id::text
  ) then return 'NOT_MEMBER'; end if;
  update public.assignment_teams set leader_id = p_new_leader_id::text where id = p_team_id;
  return 'TRANSFERRED';
end;
$$;
revoke all on function public.leave_assignment_team(uuid, uuid, uuid) from public;
revoke all on function public.transfer_assignment_team_leader(uuid, uuid, uuid, uuid) from public;
grant execute on function public.leave_assignment_team(uuid, uuid, uuid) to service_role;
grant execute on function public.transfer_assignment_team_leader(uuid, uuid, uuid, uuid)
  to service_role;
notify pgrst, 'reload schema';

commit;
