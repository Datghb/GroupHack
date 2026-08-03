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
