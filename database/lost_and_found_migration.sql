-- Lost and found tracking schema with fuzzy matching support
create extension if not exists pg_trgm;

create table if not exists public.lost_items (
  id uuid primary key default gen_random_uuid(),
  reported_by_profile_id uuid references public.profiles(id),
  reporter_name text,
  contact_email text,
  contact_phone text,
  description text not null,
  keywords text[],
  location text,
  reported_at timestamptz not null default now(),
  photo_url text,
  status text not null default 'awaiting',
  retention_expires_at date,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.found_items (
  id uuid primary key default gen_random_uuid(),
  logged_by_profile_id uuid references public.profiles(id),
  description text not null,
  keywords text[],
  location text,
  found_at timestamptz not null default now(),
  photo_url text,
  storage_location text,
  status text not null default 'stored',
  retention_expires_at date,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.lost_found_matches (
  id uuid primary key default gen_random_uuid(),
  lost_item_id uuid not null references public.lost_items(id) on delete cascade,
  found_item_id uuid not null references public.found_items(id) on delete cascade,
  match_score numeric,
  photo_similarity_score numeric,
  status text not null default 'pending',
  matched_by_profile_id uuid references public.profiles(id),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists lost_items_status_idx on public.lost_items(status);
create index if not exists found_items_status_idx on public.found_items(status);
create index if not exists lost_items_description_trgm_idx on public.lost_items using gin (description gin_trgm_ops);
create index if not exists found_items_description_trgm_idx on public.found_items using gin (description gin_trgm_ops);

comment on table public.lost_items is 'Guest-submitted lost item reports including retention policies.';
comment on table public.found_items is 'Staff logged found property awaiting reconciliation.';
comment on table public.lost_found_matches is 'Suggested and confirmed matches between lost and found records with audit trail.';
