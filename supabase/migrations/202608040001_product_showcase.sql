create table if not exists public.product_submissions (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid not null references public.assignments(id) on delete cascade,
  team_id uuid not null references public.assignment_teams(id) on delete cascade,
  title text not null check (char_length(title) between 3 and 120),
  description text not null default '' check (char_length(description) <= 1000),
  website_url text not null check (char_length(website_url) <= 2048),
  submitted_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (assignment_id, team_id)
);

create table if not exists public.product_reviews (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references public.product_submissions(id) on delete cascade,
  reviewer_team_id uuid not null references public.assignment_teams(id) on delete cascade,
  reviewer_id uuid not null references auth.users(id) on delete restrict,
  rating integer not null check (rating between 1 and 5),
  comment text not null default '' check (char_length(comment) <= 500),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (submission_id, reviewer_team_id)
);

create index if not exists product_submissions_assignment_idx on public.product_submissions (assignment_id);
create index if not exists product_reviews_submission_idx on public.product_reviews (submission_id);

alter table public.product_submissions enable row level security;
alter table public.product_reviews enable row level security;
revoke all on public.product_submissions, public.product_reviews from anon, authenticated;
grant all on public.product_submissions, public.product_reviews to service_role;

notify pgrst, 'reload schema';
