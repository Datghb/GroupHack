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
