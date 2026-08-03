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
