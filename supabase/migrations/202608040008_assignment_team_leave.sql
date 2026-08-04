create or replace function public.leave_assignment_team(
  p_team_id uuid,
  p_assignment_id uuid,
  p_student_id uuid
)
returns text
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
  if not found then return 'NOT_FOUND'; end if;

  if not exists (
    select 1 from public.assignment_team_members
    where team_id = p_team_id and student_id = p_student_id::text
  ) then return 'NOT_MEMBER'; end if;

  if exists (
    select 1 from public.product_submissions where team_id = p_team_id
  ) then return 'HAS_SUBMISSION'; end if;

  select count(*) into member_count
  from public.assignment_team_members
  where team_id = p_team_id;

  if selected_team.leader_id = p_student_id::text and member_count > 1 then
    return 'LEADER_TRANSFER_REQUIRED';
  end if;

  delete from public.product_reviews
  where reviewer_id = p_student_id
    and reviewer_team_id = p_team_id
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
  p_team_id uuid,
  p_assignment_id uuid,
  p_current_leader_id uuid,
  p_new_leader_id uuid
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  selected_team public.assignment_teams%rowtype;
begin
  select * into selected_team
  from public.assignment_teams
  where id = p_team_id and assignment_id = p_assignment_id
  for update;
  if not found then return 'NOT_FOUND'; end if;
  if selected_team.leader_id <> p_current_leader_id::text then return 'FORBIDDEN'; end if;
  if p_current_leader_id = p_new_leader_id then return 'SAME_LEADER'; end if;
  if not exists (
    select 1 from public.assignment_team_members
    where team_id = p_team_id and student_id = p_new_leader_id::text
  ) then return 'NOT_MEMBER'; end if;

  update public.assignment_teams
  set leader_id = p_new_leader_id::text
  where id = p_team_id;
  return 'TRANSFERRED';
end;
$$;

revoke all on function public.leave_assignment_team(uuid, uuid, uuid) from public;
revoke all on function public.transfer_assignment_team_leader(uuid, uuid, uuid, uuid) from public;
grant execute on function public.leave_assignment_team(uuid, uuid, uuid) to service_role;
grant execute on function public.transfer_assignment_team_leader(uuid, uuid, uuid, uuid)
  to service_role;
notify pgrst, 'reload schema';
