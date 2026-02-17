-- RLS Security Hotfix (2026-02-17)
-- Goals:
-- 1) Enable RLS on tables flagged by Supabase database linter.
-- 2) Preserve existing policies if they already exist.
-- 3) Add safe fallback policies (authenticated-only) only when a table has no policies.
-- 4) Set incident_log_revision_history view to security invoker.
--
-- This migration is intentionally idempotent and non-destructive.

BEGIN;

DO $$
DECLARE
  target_tables text[] := ARRAY[
    'accreditation_access_levels',
    'assets',
    'audit_log',
    'best_practice_cache',
    'blockchain_audit',
    'camera_feeds',
    'chat_channels',
    'chat_messages',
    'crowd_behavior_readings',
    'crowd_predictions',
    'dim_date',
    'dim_time',
    'emergency_contacts',
    'emergency_logs',
    'escalation_timers',
    'event_callsigns',
    'event_staff',
    'fact_incidents',
    'fixture_completions',
    'fixture_tasks',
    'gate_status',
    'gates',
    'incident_patterns',
    'incident_sops',
    'incident_tags',
    'installed_plugins',
    'maintenance_event_hooks',
    'ml_predictions',
    'notifications',
    'plugin_events',
    'position_assignments',
    'positioning_beacons',
    'predictive_forecasts',
    'search_analytics',
    'sensor_readings',
    'settings_audit_logs',
    'shared_files',
    'smart_collections',
    'sms_messages',
    'social_media_monitoring',
    'staffing_actuals',
    'staffing_roles',
    'stand_occupancy',
    'stands',
    'tag_presets',
    'transport_configs',
    'transport_issues',
    'vendor_access_levels',
    'vendor_accreditation_access_levels',
    'vendor_accreditation_audit_logs',
    'vendor_accreditations',
    'vendor_inductions',
    'vendors',
    'venue_3d_models',
    'venue_zones',
    'welfare_sentiment',
    'workflow_executions',
    'work_orders',
    'wristband_access_levels',
    'wristband_types'
  ];
  table_name text;
  table_exists boolean;
  has_any_policy boolean;
BEGIN
  FOREACH table_name IN ARRAY target_tables LOOP
    SELECT EXISTS (
      SELECT 1
      FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'public'
        AND c.relname = table_name
        AND c.relkind IN ('r', 'p')
    )
    INTO table_exists;

    IF NOT table_exists THEN
      RAISE NOTICE 'Skipping public.% (table not found)', table_name;
      CONTINUE;
    END IF;

    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', table_name);

    SELECT EXISTS (
      SELECT 1
      FROM pg_policies
      WHERE schemaname = 'public'
        AND tablename = table_name
    )
    INTO has_any_policy;

    IF has_any_policy THEN
      RAISE NOTICE 'Enabled RLS on public.% and preserved existing policies', table_name;
      CONTINUE;
    END IF;

    -- Fallback access model to avoid app breakage:
    -- allow authenticated users only.
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL)',
      'autofix_auth_select',
      table_name
    );

    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL)',
      'autofix_auth_insert',
      table_name
    );

    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL)',
      'autofix_auth_update',
      table_name
    );

    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR DELETE TO authenticated USING (auth.uid() IS NOT NULL)',
      'autofix_auth_delete',
      table_name
    );

    RAISE NOTICE 'Enabled RLS and added fallback authenticated policies on public.%', table_name;
  END LOOP;
END
$$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relname = 'incident_log_revision_history'
      AND c.relkind IN ('v', 'm')
  ) THEN
    BEGIN
      EXECUTE 'ALTER VIEW public.incident_log_revision_history SET (security_invoker = true)';
      RAISE NOTICE 'Set public.incident_log_revision_history to security_invoker=true';
    EXCEPTION
      WHEN OTHERS THEN
        RAISE NOTICE 'Could not set security_invoker on public.incident_log_revision_history: %', SQLERRM;
    END;
  ELSE
    RAISE NOTICE 'Skipping public.incident_log_revision_history (view not found)';
  END IF;
END
$$;

COMMIT;
