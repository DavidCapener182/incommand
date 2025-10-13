-- Onboarding telemetry table (idempotent)
create table if not exists onboarding_events (
  id uuid default gen_random_uuid() primary key,
  user_id uuid null,
  event_type text not null check (event_type in ('started','step','skipped','finished')),
  step_index int null,
  route text null,
  created_at timestamptz default now()
);

alter table onboarding_events enable row level security;

do $$ begin
  create policy "users can insert own onboarding events" on onboarding_events
  for insert with check (auth.uid() is null or auth.uid() = user_id);
exception when duplicate_object then null; end $$;


