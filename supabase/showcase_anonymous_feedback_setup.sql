-- Structured anonymous feedback for product reviews.
begin;

alter table public.product_reviews
  add column if not exists strengths text not null default '',
  add column if not exists improvements text not null default '';

alter table public.product_reviews
  drop constraint if exists product_reviews_strengths_length_check,
  drop constraint if exists product_reviews_improvements_length_check;

alter table public.product_reviews
  add constraint product_reviews_strengths_length_check check (char_length(strengths) <= 500),
  add constraint product_reviews_improvements_length_check check (char_length(improvements) <= 500);

commit;
notify pgrst, 'reload schema';
