-- Threaded discussions for each showcased product.
begin;

create table if not exists public.product_discussion_comments (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references public.product_submissions(id) on delete cascade,
  author_id uuid not null references auth.users(id) on delete cascade,
  parent_id uuid references public.product_discussion_comments(id) on delete cascade,
  content text not null check (char_length(content) between 1 and 1000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists product_discussion_submission_created_idx
  on public.product_discussion_comments (submission_id, created_at);
create index if not exists product_discussion_parent_idx
  on public.product_discussion_comments (parent_id);

alter table public.product_discussion_comments enable row level security;
revoke all on public.product_discussion_comments from anon, authenticated;
grant all on public.product_discussion_comments to service_role;

commit;
notify pgrst, 'reload schema';
