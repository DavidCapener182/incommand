-- Best Practice cache table for Green Guide guidance
-- Creates a TTL'd cache keyed by incident_hash to reduce LLM/RAG costs

create extension if not exists pgcrypto;

create table if not exists public.best_practice_cache (
  id uuid primary key default gen_random_uuid(),
  incident_hash text not null unique,
  incident_type text not null,
  occurrence_excerpt text not null,
  best_practice jsonb not null,
  created_at timestamptz not null default now(),
  ttl_expires_at timestamptz not null
);

create index if not exists idx_best_practice_cache_ttl_expires_at
  on public.best_practice_cache (ttl_expires_at);

-- Optional cleanup policy (manual or via a scheduled job outside SQL)
-- delete from public.best_practice_cache where ttl_expires_at < now();


