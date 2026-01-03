-- Update subscription plan feature lists to reflect November 2025 catalogue changes
-- Ensures Starter no longer advertises Staff scheduling or Mobile app access
-- and Operational explicitly includes both capabilities

BEGIN;

UPDATE subscription_plans
SET features = jsonb_set(
  features,
  '{features}',
  '[
    "Event dashboard",
    "Basic incident management",
    "Email notifications",
    "Basic analytics",
    "Email support"
  ]'::jsonb
)
WHERE code = 'starter'
  AND is_active = TRUE
  AND deprecated = FALSE;

UPDATE subscription_plans
SET features = jsonb_set(
  features,
  '{features}',
  '[
    "Everything in Starter",
    "Mobile app access",
    "Staff scheduling",
    "Advanced reporting",
    "SMS alerts",
    "API access",
    "Custom branding",
    "Priority support",
    "Advanced analytics",
    "Multi-event management"
  ]'::jsonb
)
WHERE code = 'operational'
  AND is_active = TRUE
  AND deprecated = FALSE;

COMMIT;



