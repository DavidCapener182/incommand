-- Enable pgvector and create green_guide_chunks table
-- Safe to run multiple times (IF NOT EXISTS guards)

-- 1) Extension
create extension if not exists vector;

-- 2) Table
create table if not exists public.green_guide_chunks (
  id uuid primary key default gen_random_uuid(),
  content text not null,
  page int,
  heading text,
  embedding vector(1536),
  created_at timestamptz not null default now()
);

-- 3) Index for ANN search
create index if not exists green_guide_chunks_embedding_idx
  on public.green_guide_chunks using ivfflat (embedding vector_l2_ops)
  with (lists = 100);

-- 4) Security: basic RLS (optional tighten as needed)
alter table public.green_guide_chunks enable row level security;
do $$ begin
  if not exists (
    select 1 from pg_policies where tablename = 'green_guide_chunks' and policyname = 'allow_read'
  ) then
    create policy allow_read on public.green_guide_chunks for select using (true);
  end if;
end $$;


