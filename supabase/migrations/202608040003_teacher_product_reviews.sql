alter table public.product_reviews alter column reviewer_team_id drop not null;
create unique index if not exists product_reviews_teacher_unique
  on public.product_reviews (submission_id, reviewer_id)
  where reviewer_team_id is null;
notify pgrst, 'reload schema';
