-- Maintenance and asset management schema
create table if not exists public.assets (
  id uuid primary key default gen_random_uuid(),
  asset_tag text not null unique,
  name text not null,
  description text,
  location text,
  status text not null default 'operational',
  service_life_months integer,
  commissioned_at date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.maintenance_schedules (
  id uuid primary key default gen_random_uuid(),
  asset_id uuid not null references public.assets(id) on delete cascade,
  frequency_days integer not null,
  next_due_date date,
  last_completed_at timestamptz,
  webhook_endpoint text,
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.work_orders (
  id uuid primary key default gen_random_uuid(),
  asset_id uuid references public.assets(id) on delete set null,
  schedule_id uuid references public.maintenance_schedules(id) on delete set null,
  title text not null,
  description text,
  status text not null default 'open',
  priority text not null default 'medium',
  assigned_vendor_id uuid references public.vendors(id),
  assigned_profile_id uuid references public.profiles(id),
  due_date timestamptz,
  completed_at timestamptz,
  completion_notes text,
  attachments jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.maintenance_event_hooks (
  id uuid primary key default gen_random_uuid(),
  asset_id uuid references public.assets(id) on delete cascade,
  event_type text not null,
  target_url text not null,
  secret text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists assets_status_idx on public.assets(status);
create index if not exists maintenance_schedules_asset_idx on public.maintenance_schedules(asset_id);
create index if not exists work_orders_status_idx on public.work_orders(status);
create index if not exists work_orders_asset_idx on public.work_orders(asset_id);

comment on table public.assets is 'Physical asset register used for maintenance planning.';
comment on table public.work_orders is 'Maintenance work orders and reactive tasks, optionally linked to assets and schedules.';
comment on table public.maintenance_event_hooks is 'Webhook subscriptions for IoT integrations and predictive maintenance signals.';
