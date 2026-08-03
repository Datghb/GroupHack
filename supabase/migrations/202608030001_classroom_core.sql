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
