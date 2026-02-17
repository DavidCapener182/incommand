-- Security Hardening Phase 2 (2026-02-17)
-- Scope:
-- 1) Fix function_search_path_mutable warnings for non-extension functions in public schema.
-- 2) Fix rls_policy_always_true warnings for INSERT/UPDATE/DELETE/ALL policies by replacing
--    literal TRUE expressions with auth.uid() IS NOT NULL.
--
-- This migration does not delete data and is designed to be idempotent.

BEGIN;

-- ---------------------------------------------------------------------------
-- 1) Lock function search_path for user-defined public functions
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  fn_signature text;
  updated_count integer := 0;
BEGIN
  FOR fn_signature IN
    SELECT p.oid::regprocedure::text
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      -- Skip extension-owned functions.
      AND NOT EXISTS (
        SELECT 1
        FROM pg_depend d
        JOIN pg_extension e ON e.oid = d.refobjid
        WHERE d.classid = 'pg_proc'::regclass
          AND d.objid = p.oid
          AND d.deptype = 'e'
      )
      -- Only update functions that do not already pin search_path.
      AND NOT EXISTS (
        SELECT 1
        FROM unnest(COALESCE(p.proconfig, ARRAY[]::text[])) cfg
        WHERE cfg LIKE 'search_path=%'
      )
  LOOP
    EXECUTE format(
      'ALTER FUNCTION %s SET search_path = public, extensions, pg_temp',
      fn_signature
    );
    updated_count := updated_count + 1;
  END LOOP;

  RAISE NOTICE 'Pinned search_path on % public functions', updated_count;
END
$$;

-- ---------------------------------------------------------------------------
-- 2) Replace literal TRUE write policies with authenticated guard
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  rec record;
  cmd_sql text;
  roles_sql text;
  using_expr text;
  check_expr text;
  using_norm text;
  check_norm text;
  create_sql text;
  fixed_count integer := 0;
BEGIN
  FOR rec IN
    SELECT
      p.oid AS policy_oid,
      n.nspname AS schemaname,
      c.relname AS tablename,
      p.polname AS policy_name,
      p.polcmd AS polcmd,
      p.polpermissive AS polpermissive,
      p.polroles AS polroles,
      pg_get_expr(p.polqual, p.polrelid) AS qual_expr,
      pg_get_expr(p.polwithcheck, p.polrelid) AS with_check_expr
    FROM pg_policy p
    JOIN pg_class c ON c.oid = p.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND p.polcmd IN ('a', 'w', 'd', '*') -- INSERT, UPDATE, DELETE, ALL
  LOOP
    using_expr := rec.qual_expr;
    check_expr := rec.with_check_expr;

    using_norm := regexp_replace(lower(coalesce(using_expr, '')), '\s+', '', 'g');
    check_norm := regexp_replace(lower(coalesce(check_expr, '')), '\s+', '', 'g');

    -- Only touch policies with literal TRUE predicates.
    IF using_norm NOT IN ('true', '(true)')
       AND check_norm NOT IN ('true', '(true)') THEN
      CONTINUE;
    END IF;

    IF using_norm IN ('true', '(true)') THEN
      using_expr := 'auth.uid() IS NOT NULL';
    END IF;

    IF check_norm IN ('true', '(true)') THEN
      check_expr := 'auth.uid() IS NOT NULL';
    END IF;

    CASE rec.polcmd
      WHEN 'a' THEN cmd_sql := 'INSERT';
      WHEN 'w' THEN cmd_sql := 'UPDATE';
      WHEN 'd' THEN cmd_sql := 'DELETE';
      WHEN '*' THEN cmd_sql := 'ALL';
      ELSE cmd_sql := 'ALL';
    END CASE;

    -- Ensure required expressions exist for each command type.
    IF cmd_sql IN ('UPDATE', 'DELETE', 'ALL') AND using_expr IS NULL THEN
      using_expr := 'auth.uid() IS NOT NULL';
    END IF;

    IF cmd_sql IN ('INSERT', 'UPDATE', 'ALL') AND check_expr IS NULL THEN
      check_expr := 'auth.uid() IS NOT NULL';
    END IF;

    SELECT COALESCE(string_agg(quote_ident(r.rolname), ', '), 'PUBLIC')
      INTO roles_sql
    FROM unnest(rec.polroles) AS role_oid
    LEFT JOIN pg_roles r ON r.oid = role_oid;

    EXECUTE format(
      'DROP POLICY %I ON %I.%I',
      rec.policy_name,
      rec.schemaname,
      rec.tablename
    );

    create_sql := format(
      'CREATE POLICY %I ON %I.%I AS %s FOR %s TO %s',
      rec.policy_name,
      rec.schemaname,
      rec.tablename,
      CASE WHEN rec.polpermissive THEN 'PERMISSIVE' ELSE 'RESTRICTIVE' END,
      cmd_sql,
      roles_sql
    );

    IF cmd_sql IN ('UPDATE', 'DELETE', 'ALL') THEN
      create_sql := create_sql || format(' USING (%s)', using_expr);
    END IF;

    IF cmd_sql IN ('INSERT', 'UPDATE', 'ALL') THEN
      create_sql := create_sql || format(' WITH CHECK (%s)', check_expr);
    END IF;

    EXECUTE create_sql;
    fixed_count := fixed_count + 1;
  END LOOP;

  RAISE NOTICE 'Rewrote % permissive write policies', fixed_count;
END
$$;

COMMIT;
