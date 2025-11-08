-- Pricing Plans Migration
-- Creates subscription_plans table and updates companies/organizations tables
-- Supports versioning, multiple billing cycles, and feature management

BEGIN;

-- Create subscription_plans table with versioning support
CREATE TABLE IF NOT EXISTS subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE CHECK (code IN ('starter', 'operational', 'command', 'enterprise')),
  display_name TEXT NOT NULL,
  version TEXT NOT NULL DEFAULT '1.0.0',
  effective_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  currency TEXT NOT NULL DEFAULT 'GBP' CHECK (currency IN ('GBP', 'USD', 'EUR')),
  price_monthly NUMERIC(10, 2),
  price_annual NUMERIC(10, 2),
  billing_cycles TEXT[] NOT NULL DEFAULT ARRAY['monthly']::TEXT[],
  features JSONB NOT NULL DEFAULT '{}'::jsonb,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  deprecated BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT valid_pricing CHECK (
    (price_monthly IS NOT NULL AND price_monthly >= 0) OR 
    (price_monthly IS NULL AND metadata->>'custom_pricing' = 'true')
  )
);

-- Create index for active plans lookup
CREATE INDEX IF NOT EXISTS idx_subscription_plans_code ON subscription_plans(code);
CREATE INDEX IF NOT EXISTS idx_subscription_plans_active ON subscription_plans(is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_subscription_plans_effective ON subscription_plans(effective_at DESC);

-- Add plan_features JSONB column to companies table
ALTER TABLE companies
  ADD COLUMN IF NOT EXISTS plan_features JSONB DEFAULT '{}'::jsonb;

-- Update subscription_plan CHECK constraint to include new plan codes
ALTER TABLE companies
  DROP CONSTRAINT IF EXISTS companies_subscription_plan_check;

ALTER TABLE companies
  ADD CONSTRAINT companies_subscription_plan_check 
  CHECK (subscription_plan IN ('trial', 'starter', 'operational', 'command', 'enterprise', 'basic', 'premium'));

-- Set default to 'starter' for new companies
ALTER TABLE companies
  ALTER COLUMN subscription_plan SET DEFAULT 'starter';

-- Backfill existing companies with 'starter' if they have old values
UPDATE companies 
SET subscription_plan = 'starter' 
WHERE subscription_plan NOT IN ('starter', 'operational', 'command', 'enterprise', 'trial')
   OR subscription_plan IS NULL;

-- Add plan_features JSONB column to organizations table (if it exists)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'organizations'
  ) THEN
    ALTER TABLE organizations
      ADD COLUMN IF NOT EXISTS plan_features JSONB DEFAULT '{}'::jsonb;

    -- Update tier CHECK constraint
    ALTER TABLE organizations
      DROP CONSTRAINT IF EXISTS organizations_tier_check;

    ALTER TABLE organizations
      ADD CONSTRAINT organizations_tier_check 
      CHECK (tier IN ('free', 'starter', 'operational', 'command', 'enterprise', 'professional'));
  END IF;
END $$;

-- Insert default pricing plans
INSERT INTO subscription_plans (
  code,
  display_name,
  version,
  effective_at,
  currency,
  price_monthly,
  price_annual,
  billing_cycles,
  features,
  metadata,
  is_active
) VALUES
(
  'starter',
  'Starter',
  '1.0.0',
  NOW(),
  'GBP',
  49.00,
  490.00,
  ARRAY['monthly', 'annual'],
  '{
    "maxEvents": 2,
    "maxAttendees": 500,
    "maxUsers": 3,
    "maxStaff": 5,
    "features": [
      "Event dashboard",
      "Basic incident management",
      "Staff scheduling",
      "Email notifications",
      "Mobile app access",
      "Basic analytics",
      "Email support"
    ],
    "addOns": [
      "SMS notifications",
      "Additional staff seats"
    ]
  }'::jsonb,
  '{
    "description": "Perfect for small events and single organizers",
    "popular": false
  }'::jsonb,
  TRUE
),
(
  'operational',
  'Operational',
  '1.0.0',
  NOW(),
  'GBP',
  129.00,
  1290.00,
  ARRAY['monthly', 'annual'],
  '{
    "maxEvents": 10,
    "maxAttendees": 2000,
    "maxUsers": 10,
    "maxStaff": 20,
    "features": [
      "Everything in Starter",
      "Advanced reporting",
      "SMS alerts",
      "API access",
      "Custom branding",
      "Priority support",
      "Advanced analytics",
      "Multi-event management"
    ],
    "addOns": [
      "AI-powered insights",
      "Custom integrations",
      "White-label options"
    ]
  }'::jsonb,
  '{
    "description": "Ideal for mid-sized events and growing operations",
    "popular": true
  }'::jsonb,
  TRUE
),
(
  'command',
  'Command',
  '1.0.0',
  NOW(),
  'GBP',
  249.00,
  2490.00,
  ARRAY['monthly', 'annual'],
  '{
    "maxEvents": 25,
    "maxAttendees": 5000,
    "maxUsers": 25,
    "maxStaff": 50,
    "features": [
      "Everything in Operational",
      "AI-powered insights",
      "Advanced analytics suite",
      "Custom integrations",
      "On-site tools",
      "Real-time dashboards",
      "Predictive analytics",
      "Custom workflows"
    ],
    "addOns": [
      "Dedicated support",
      "Custom development",
      "Training sessions"
    ]
  }'::jsonb,
  '{
    "description": "For large-scale events and complex operations",
    "popular": false
  }'::jsonb,
  TRUE
),
(
  'enterprise',
  'Enterprise',
  '1.0.0',
  NOW(),
  'GBP',
  NULL,
  NULL,
  ARRAY['monthly', 'annual'],
  '{
    "maxEvents": -1,
    "maxAttendees": -1,
    "maxUsers": -1,
    "maxStaff": -1,
    "features": [
      "Everything in Command",
      "Unlimited events",
      "Unlimited attendees",
      "Unlimited staff",
      "Dedicated account manager",
      "Custom integrations",
      "SLA guarantee (99.9%)",
      "Advanced security suite",
      "White-label options",
      "On-premise deployment options",
      "Custom development",
      "Priority 24/7 support"
    ],
    "addOns": [
      "Custom SLA terms",
      "Private cloud deployment",
      "Dedicated infrastructure"
    ]
  }'::jsonb,
  '{
    "description": "For stadiums, councils, and multi-agency operations",
    "popular": false,
    "custom_pricing": true
  }'::jsonb,
  TRUE
)
ON CONFLICT (code) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  price_monthly = EXCLUDED.price_monthly,
  price_annual = EXCLUDED.price_annual,
  features = EXCLUDED.features,
  metadata = EXCLUDED.metadata,
  updated_at = NOW();

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_subscription_plans_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS update_subscription_plans_updated_at ON subscription_plans;
CREATE TRIGGER update_subscription_plans_updated_at
  BEFORE UPDATE ON subscription_plans
  FOR EACH ROW
  EXECUTE FUNCTION update_subscription_plans_updated_at();

-- Enable RLS on subscription_plans
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read active plans
CREATE POLICY "Anyone can view active subscription plans"
  ON subscription_plans FOR SELECT
  USING (is_active = TRUE AND deprecated = FALSE);

COMMIT;

