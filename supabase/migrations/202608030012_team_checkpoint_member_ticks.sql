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
