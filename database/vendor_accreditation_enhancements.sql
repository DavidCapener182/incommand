-- Vendor accreditation enhancements: status workflow, ID verification, induction token
alter table if exists public.vendor_accreditations
  add column if not exists accreditation_number text,
  add column if not exists id_document_type text,
  add column if not exists id_document_reference text,
  add column if not exists induction_token text default gen_random_uuid()::text;

update public.vendor_accreditations
  set induction_token = gen_random_uuid()::text
  where induction_token is null;

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
