alter table public.product_reviews
  add column if not exists strengths text not null default '',
  add column if not exists improvements text not null default '';
alter table public.product_reviews
  add constraint product_reviews_strengths_length_check check (char_length(strengths) <= 500),
  add constraint product_reviews_improvements_length_check check (char_length(improvements) <= 500);
notify pgrst, 'reload schema';
