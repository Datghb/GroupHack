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
