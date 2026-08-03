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
