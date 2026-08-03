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
