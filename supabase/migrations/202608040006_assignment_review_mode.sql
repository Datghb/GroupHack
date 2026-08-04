alter table public.assignments
  add column if not exists review_mode text not null default 'TEAM';

alter table public.assignments
  drop constraint if exists assignments_review_mode_check;
alter table public.assignments
  add constraint assignments_review_mode_check
  check (review_mode in ('TEAM', 'INDIVIDUAL')) not valid;
alter table public.assignments validate constraint assignments_review_mode_check;

alter table public.product_reviews
  add column if not exists review_mode text not null default 'TEAM';

alter table public.product_reviews
  drop constraint if exists product_reviews_review_mode_check;
alter table public.product_reviews
  add constraint product_reviews_review_mode_check
  check (review_mode in ('TEAM', 'INDIVIDUAL')) not valid;
alter table public.product_reviews validate constraint product_reviews_review_mode_check;

alter table public.product_reviews
  drop constraint if exists product_reviews_submission_id_reviewer_team_id_key;
drop index if exists public.product_reviews_submission_id_reviewer_team_id_key;
drop index if exists public.product_reviews_student_team_unique;
drop index if exists public.product_reviews_student_individual_unique;

create unique index product_reviews_student_team_unique
  on public.product_reviews (submission_id, reviewer_team_id)
  where reviewer_team_id is not null and review_mode = 'TEAM';

create unique index product_reviews_student_individual_unique
  on public.product_reviews (submission_id, reviewer_id)
  where reviewer_team_id is not null and review_mode = 'INDIVIDUAL';

create or replace function public.set_assignment_review_mode(
  p_assignment_id uuid,
  p_teacher_id uuid,
  p_review_mode text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_review_mode not in ('TEAM', 'INDIVIDUAL') then
    raise exception 'Invalid review mode';
  end if;

  if not exists (
    select 1
    from public.assignments a
    join public.classrooms c on c.id = a.classroom_id
    where a.id = p_assignment_id and c.teacher_id = p_teacher_id::text
  ) then
    raise exception 'Assignment not managed by teacher';
  end if;

  if exists (
    select 1 from public.assignments
    where id = p_assignment_id and review_mode <> p_review_mode
  ) then
    delete from public.product_reviews pr
    using public.product_submissions ps
    where pr.submission_id = ps.id
      and ps.assignment_id = p_assignment_id
      and pr.reviewer_team_id is not null;

    update public.assignments
    set review_mode = p_review_mode
    where id = p_assignment_id;
  end if;
end;
$$;

revoke all on function public.set_assignment_review_mode(uuid, uuid, text) from public;
grant execute on function public.set_assignment_review_mode(uuid, uuid, text) to service_role;

notify pgrst, 'reload schema';
