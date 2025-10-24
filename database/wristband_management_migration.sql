-- Wristband Access Management Migration
-- Event-specific accreditation access levels (replaces vendor_access_levels)
create table if not exists public.accreditation_access_levels (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  name text not null,
  description text,
  created_at timestamptz not null default now()
);

-- Wristband types with colors and access configurations
create table if not exists public.wristband_types (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  wristband_name text not null,
  wristband_color text not null,
  available_quantity integer,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Junction table: wristband types to access levels (many-to-many)
create table if not exists public.wristband_access_levels (
  id uuid primary key default gen_random_uuid(),
  wristband_type_id uuid not null references public.wristband_types(id) on delete cascade,
  access_level_id uuid not null references public.accreditation_access_levels(id) on delete cascade,
  unique(wristband_type_id, access_level_id)
);

-- Update vendor_accreditation_access_levels to reference new table
-- (Keep existing table structure but change reference)
alter table public.vendor_accreditation_access_levels 
  drop constraint if exists vendor_accreditation_access_levels_access_level_id_fkey;

alter table public.vendor_accreditation_access_levels 
  add constraint vendor_accreditation_access_levels_access_level_id_fkey 
  foreign key (access_level_id) references public.accreditation_access_levels(id) on delete cascade;
