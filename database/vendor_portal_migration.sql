-- Vendor management and accreditation schema
create table if not exists public.vendors (
  id uuid primary key default gen_random_uuid(),
  business_name text not null,
  service_type text,
  contact_name text,
  contact_email text,
  contact_phone text,
  insurance_document_url text,
  insurance_expires_on date,
  contract_expires_on date,
  status text not null default 'active',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.vendor_access_levels (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  is_temporary boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.vendor_accreditations (
  id uuid primary key default gen_random_uuid(),
  vendor_id uuid not null references public.vendors(id) on delete cascade,
  status text not null default 'pending',
  submitted_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references public.profiles(id),
  feedback text,
  digital_pass_url text,
  qr_code_token text,
  expires_at timestamptz,
  induction_completed boolean not null default false,
  induction_completed_at timestamptz,
  induction_completed_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.vendor_accreditation_access_levels (
  id uuid primary key default gen_random_uuid(),
  accreditation_id uuid not null references public.vendor_accreditations(id) on delete cascade,
  access_level_id uuid not null references public.vendor_access_levels(id) on delete cascade
);

create unique index if not exists vendor_accreditation_access_levels_unique
  on public.vendor_accreditation_access_levels(accreditation_id, access_level_id);

create table if not exists public.vendor_inductions (
  id uuid primary key default gen_random_uuid(),
  vendor_id uuid not null references public.vendors(id) on delete cascade,
  title text not null,
  resource_url text,
  is_required boolean not null default true,
  completed_at timestamptz,
  completed_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.vendor_accreditation_audit_logs (
  id uuid primary key default gen_random_uuid(),
  accreditation_id uuid not null references public.vendor_accreditations(id) on delete cascade,
  action text not null,
  notes text,
  actor_profile_id uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

create index if not exists vendors_business_name_idx on public.vendors using gin (to_tsvector('english', business_name));
create index if not exists vendor_accreditations_vendor_idx on public.vendor_accreditations(vendor_id);
create index if not exists vendor_accreditations_status_idx on public.vendor_accreditations(status);

comment on table public.vendors is 'Registered vendors with accreditation and document metadata.';
comment on table public.vendor_accreditations is 'Vendor accreditation lifecycle, including induction completion and access passes.';
comment on table public.vendor_inductions is 'Digital induction resources and completion tracking for vendors.';
