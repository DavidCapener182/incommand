-- Add subscription plan and account status to companies
ALTER TABLE companies
  ADD COLUMN IF NOT EXISTS subscription_plan TEXT NOT NULL DEFAULT 'trial' CHECK (subscription_plan IN ('trial','basic','premium')),
  ADD COLUMN IF NOT EXISTS account_status TEXT NOT NULL DEFAULT 'active' CHECK (account_status IN ('active','inactive'));

-- Backfill existing rows to defaults (idempotent due to defaults)
UPDATE companies SET subscription_plan = COALESCE(subscription_plan, 'trial');
UPDATE companies SET account_status = COALESCE(account_status, 'active');


