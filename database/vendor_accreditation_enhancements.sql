-- Vendor accreditation enhancements: status workflow, ID verification, induction token
alter table if exists public.vendor_accreditations
  add column if not exists accreditation_number text,
  add column if not exists id_document_type text,
  add column if not exists id_document_reference text,
  add column if not exists induction_token text default gen_random_uuid()::text;

update public.vendor_accreditations
  set induction_token = gen_random_uuid()::text
  where induction_token is null;

alter table if exists public.vendor_accreditations
  alter column induction_token set not null;

create unique index if not exists vendor_accreditations_induction_token_idx
  on public.vendor_accreditations(induction_token);

alter table if exists public.vendor_accreditations
  alter column status set default 'new';

update public.vendor_accreditations
  set status = 'new'
  where status = 'pending';

alter table if exists public.vendor_accreditations
  add constraint vendor_accreditations_status_check
    check (status in ('new', 'pending_review', 'approved', 'rejected'));

create table if not exists public.vendor_induction_events (
  id uuid primary key default gen_random_uuid(),
  accreditation_id uuid not null references public.vendor_accreditations(id) on delete cascade,
  event_type text not null check (event_type in ('link_opened', 'completed', 'email_sent', 'email_failed', 'pass_issued')),
  ip_address text,
  user_agent text,
  created_at timestamptz not null default now()
);

create index if not exists vendor_induction_events_accreditation_idx
  on public.vendor_induction_events(accreditation_id, created_at desc);
