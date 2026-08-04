-- VICheck rubric setup for per-assignment product evaluation
begin;

alter table public.product_reviews
  alter column rating type numeric(3,1) using rating::numeric;

create table if not exists public.assignment_review_criteria (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid not null references public.assignments(id) on delete cascade,
  title text not null check (char_length(title) between 2 and 120),
  description text not null default '' check (char_length(description) <= 500),
  position integer not null default 0 check (position >= 0),
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  unique (assignment_id, position)
);

create table if not exists public.product_review_scores (
  id uuid primary key default gen_random_uuid(),
  review_id uuid not null references public.product_reviews(id) on delete cascade,
  criterion_id uuid not null references public.assignment_review_criteria(id) on delete cascade,
  score integer not null check (score between 1 and 5),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (review_id, criterion_id)
);

create index if not exists assignment_review_criteria_assignment_idx
  on public.assignment_review_criteria (assignment_id, position);
create index if not exists product_review_scores_review_idx
  on public.product_review_scores (review_id);

alter table public.assignment_review_criteria enable row level security;
alter table public.product_review_scores enable row level security;
revoke all on public.assignment_review_criteria, public.product_review_scores from anon, authenticated;
grant all on public.assignment_review_criteria, public.product_review_scores to service_role;

commit;
notify pgrst, 'reload schema';
