-- Incident SOP table to power contextual guided actions
create table if not exists public.incident_sops (
  id uuid primary key default gen_random_uuid(),
  incident_type text not null,
  step_order integer not null,
  description text not null,
  is_required boolean not null default false,
  linked_action_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists incident_sops_type_order_idx
  on public.incident_sops(incident_type, step_order);

create index if not exists incident_sops_incident_type_idx
  on public.incident_sops(incident_type);

comment on table public.incident_sops is 'Standard Operating Procedure steps mapped to detected incident types.';
comment on column public.incident_sops.linked_action_id is 'Optional reference to guided action templates or playbooks.';
