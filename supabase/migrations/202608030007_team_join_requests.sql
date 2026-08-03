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
