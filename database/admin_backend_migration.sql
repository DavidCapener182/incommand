
-- Ensure the core multi-tenant tables exist so the admin backend objects
-- can reference them even in environments that have not previously run the
-- multi_tenant_migration. These guards intentionally use dynamic SQL so they
-- only create objects when missing and stay idempotent when the tables are
-- already provisioned.

CREATE OR REPLACE FUNCTION update_organizations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'organizations'
  ) THEN
    EXECUTE $$
      CREATE TABLE organizations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL,
        slug TEXT NOT NULL UNIQUE,
        parent_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
        tier TEXT NOT NULL DEFAULT 'free' CHECK (tier IN ('free','professional','enterprise')),
        settings JSONB NOT NULL DEFAULT '{}'::jsonb,
        branding JSONB,
        subscription_status TEXT NOT NULL DEFAULT 'active' CHECK (subscription_status IN ('active','suspended','cancelled')),
        subscription_starts_at TIMESTAMPTZ,
        subscription_ends_at TIMESTAMPTZ,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    $$;
  END IF;
END$$;

CREATE INDEX IF NOT EXISTS idx_organizations_slug ON organizations(slug);
CREATE INDEX IF NOT EXISTS idx_organizations_parent_id ON organizations(parent_id);
CREATE INDEX IF NOT EXISTS idx_organizations_tier ON organizations(tier);
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'organizations'
      AND policyname = 'Users can view their organizations'
  ) THEN
    EXECUTE $$
      CREATE POLICY "Users can view their organizations"
        ON organizations FOR SELECT TO authenticated
        USING (
          id IN (
            SELECT organization_id FROM organization_members
            WHERE user_id = auth.uid() AND is_active = TRUE
          )
        );
    $$;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'organizations'
      AND policyname = 'Organization owners can update their organizations'
  ) THEN
    EXECUTE $$
      CREATE POLICY "Organization owners can update their organizations"
        ON organizations FOR UPDATE TO authenticated
        USING (
          id IN (
            SELECT organization_id FROM organization_members
            WHERE user_id = auth.uid() AND is_owner = TRUE
          )
        );
    $$;
  END IF;
END$$;

DROP TRIGGER IF EXISTS update_organizations_updated_at ON organizations;
CREATE TRIGGER update_organizations_updated_at
  BEFORE UPDATE ON organizations
  FOR EACH ROW EXECUTE PROCEDURE update_organizations_updated_at();

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'roles'
  ) THEN
    EXECUTE $$
      CREATE TABLE roles (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        description TEXT,
        permissions TEXT[] NOT NULL DEFAULT '{}',
        is_system_role BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE(organization_id, name)
      );
    $$;
  END IF;
END$$;

CREATE INDEX IF NOT EXISTS idx_roles_organization_id ON roles(organization_id);
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'roles'
      AND policyname = 'Users can view roles in their organizations'
  ) THEN
    EXECUTE $$
      CREATE POLICY "Users can view roles in their organizations"
        ON roles FOR SELECT TO authenticated
        USING (
          organization_id IN (
            SELECT organization_id FROM organization_members
            WHERE user_id = auth.uid() AND is_active = TRUE
          ) OR is_system_role = TRUE
        );
    $$;
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'organization_members'
  ) THEN
    EXECUTE $$
      CREATE TABLE organization_members (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
        custom_permissions TEXT[] DEFAULT '{}',
        is_owner BOOLEAN NOT NULL DEFAULT FALSE,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        last_active_at TIMESTAMPTZ,
        UNIQUE(organization_id, user_id)
      );
    $$;
  END IF;
END$$;

CREATE INDEX IF NOT EXISTS idx_organization_members_organization_id ON organization_members(organization_id);
CREATE INDEX IF NOT EXISTS idx_organization_members_user_id ON organization_members(user_id);
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'organization_members'
      AND policyname = 'Users can view members in their organizations'
  ) THEN
    EXECUTE $$
      CREATE POLICY "Users can view members in their organizations"
        ON organization_members FOR SELECT TO authenticated
        USING (
          organization_id IN (
            SELECT organization_id FROM organization_members
            WHERE user_id = auth.uid() AND is_active = TRUE
          )
        );
    $$;
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'user_roles'
  ) THEN
    EXECUTE $$
      CREATE TABLE user_roles (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
        role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
        organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        assigned_by UUID REFERENCES auth.users(id),
        assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        expires_at TIMESTAMPTZ,
        UNIQUE(user_id, role_id, organization_id)
      );
    $$;
  END IF;
END$$;

CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_organization_id ON user_roles(organization_id);
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'subscription_usage'
  ) THEN
    EXECUTE $$
      CREATE TABLE subscription_usage (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        period_start TIMESTAMPTZ NOT NULL,
        period_end TIMESTAMPTZ NOT NULL,
        events_count INTEGER DEFAULT 0,
        users_count INTEGER DEFAULT 0,
        storage_gb DECIMAL(10,2) DEFAULT 0,
        api_calls INTEGER DEFAULT 0,
        emails_sent INTEGER DEFAULT 0,
        sms_sent INTEGER DEFAULT 0,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE(organization_id, period_start)
      );
    $$;
  END IF;
END$$;

CREATE INDEX IF NOT EXISTS idx_subscription_usage_organization_id ON subscription_usage(organization_id);
CREATE INDEX IF NOT EXISTS idx_subscription_usage_period ON subscription_usage(period_start, period_end);
ALTER TABLE subscription_usage ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'audit_log'
  ) THEN
    EXECUTE $$
      CREATE TABLE audit_log (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
        action TEXT NOT NULL,
        resource_type TEXT NOT NULL,
        resource_id TEXT,
        changes JSONB,
        ip_address INET,
        user_agent TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    $$;
  END IF;
END$$;

CREATE INDEX IF NOT EXISTS idx_audit_log_organization_id ON audit_log(organization_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_user_id ON audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON audit_log(created_at);
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'audit_log'
      AND policyname = 'Users can view audit logs for their organizations'
  ) THEN
    EXECUTE $$
      CREATE POLICY "Users can view audit logs for their organizations"
        ON audit_log FOR SELECT TO authenticated
        USING (
          organization_id IN (
            SELECT organization_id FROM organization_members
            WHERE user_id = auth.uid() AND is_active = TRUE
          )
        );
    $$;
  END IF;
END$$;

-- Helper function for maintaining updated_at timestamps
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Plans table for subscription management
CREATE TABLE IF NOT EXISTS plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id),
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  description TEXT,
  price_monthly NUMERIC(10,2) NOT NULL DEFAULT 0,
  price_annual NUMERIC(10,2),
  currency TEXT NOT NULL DEFAULT 'GBP',
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS plans_code_idx ON plans(code);
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY plans_select ON plans
  FOR SELECT
  USING (
    organization_id IS NULL
    OR organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid() AND is_active = TRUE
    )
  );

CREATE POLICY plans_modify ON plans
  FOR ALL
  USING (
    organization_id IS NULL OR organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid() AND is_active = TRUE
    )
  )
  WITH CHECK (
    organization_id IS NULL OR organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid() AND is_active = TRUE
    )
  );

CREATE TRIGGER plans_updated_at
  BEFORE UPDATE ON plans
  FOR EACH ROW EXECUTE PROCEDURE set_updated_at();

-- Invoices table
CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES subscription_usage(id),
  event_id UUID,
  issued_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  due_date TIMESTAMPTZ,
  status TEXT NOT NULL CHECK (status IN ('paid','pending','overdue')) DEFAULT 'pending',
  line_items JSONB NOT NULL,
  total_amount NUMERIC(12,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'GBP',
  payment_reference TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS invoices_org_idx ON invoices(organization_id);
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY invoices_select ON invoices
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM organization_members WHERE user_id = auth.uid() AND is_active = TRUE
    )
  );

CREATE POLICY invoices_modify ON invoices
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM organization_members WHERE user_id = auth.uid() AND is_active = TRUE
    )
  ) WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM organization_members WHERE user_id = auth.uid() AND is_active = TRUE
    )
  );

CREATE TRIGGER invoices_updated_at
  BEFORE UPDATE ON invoices
  FOR EACH ROW EXECUTE PROCEDURE set_updated_at();

-- Billing transactions table
CREATE TABLE IF NOT EXISTS billing_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  invoice_id UUID REFERENCES invoices(id),
  event_id UUID,
  amount NUMERIC(12,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'GBP',
  status TEXT NOT NULL CHECK (status IN ('pending','paid','failed')),
  gateway TEXT NOT NULL DEFAULT 'stripe',
  description TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS billing_transactions_org_idx ON billing_transactions(organization_id);
ALTER TABLE billing_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY billing_transactions_select ON billing_transactions
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM organization_members WHERE user_id = auth.uid() AND is_active = TRUE
    )
  );

CREATE POLICY billing_transactions_modify ON billing_transactions
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM organization_members WHERE user_id = auth.uid() AND is_active = TRUE
    )
  ) WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM organization_members WHERE user_id = auth.uid() AND is_active = TRUE
    )
  );

CREATE TRIGGER billing_transactions_updated_at
  BEFORE UPDATE ON billing_transactions
  FOR EACH ROW EXECUTE PROCEDURE set_updated_at();

-- Ledger entries table
CREATE TABLE IF NOT EXISTS ledger_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  event_id UUID,
  date DATE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('credit','debit')),
  account_code TEXT NOT NULL,
  description TEXT NOT NULL,
  amount NUMERIC(12,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'GBP',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ledger_entries_org_idx ON ledger_entries(organization_id);
ALTER TABLE ledger_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY ledger_entries_access ON ledger_entries
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM organization_members WHERE user_id = auth.uid() AND is_active = TRUE
    )
  ) WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM organization_members WHERE user_id = auth.uid() AND is_active = TRUE
    )
  );

CREATE TRIGGER ledger_entries_updated_at
  BEFORE UPDATE ON ledger_entries
  FOR EACH ROW EXECUTE PROCEDURE set_updated_at();

-- Knowledge base table
CREATE TABLE IF NOT EXISTS knowledge_base (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  event_id UUID,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('draft','published','archived')) DEFAULT 'draft',
  author_id UUID REFERENCES auth.users(id),
  tags TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  version INT NOT NULL DEFAULT 1,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS knowledge_base_org_idx ON knowledge_base(organization_id);
ALTER TABLE knowledge_base ENABLE ROW LEVEL SECURITY;

CREATE POLICY knowledge_base_access ON knowledge_base
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM organization_members WHERE user_id = auth.uid() AND is_active = TRUE
    )
  ) WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM organization_members WHERE user_id = auth.uid() AND is_active = TRUE
    )
  );

CREATE TRIGGER knowledge_base_updated_at
  BEFORE UPDATE ON knowledge_base
  FOR EACH ROW EXECUTE PROCEDURE set_updated_at();

-- Support tickets table
CREATE TABLE IF NOT EXISTS support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  event_id UUID,
  subject TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','assigned','resolved','closed')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low','medium','high','urgent')),
  queue TEXT NOT NULL DEFAULT 'general',
  requester_id UUID REFERENCES auth.users(id),
  assignee_id UUID REFERENCES auth.users(id),
  incident_id UUID,
  escalation_level INT DEFAULT 0,
  internal_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS support_tickets_org_idx ON support_tickets(organization_id);
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;

CREATE POLICY support_tickets_access ON support_tickets
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM organization_members WHERE user_id = auth.uid() AND is_active = TRUE
    )
  ) WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM organization_members WHERE user_id = auth.uid() AND is_active = TRUE
    )
  );

CREATE TRIGGER support_tickets_updated_at
  BEFORE UPDATE ON support_tickets
  FOR EACH ROW EXECUTE PROCEDURE set_updated_at();

-- Incident reviews table
CREATE TABLE IF NOT EXISTS incident_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  event_id UUID,
  incident_id UUID,
  reviewer_id UUID REFERENCES auth.users(id),
  summary TEXT NOT NULL,
  resolution TEXT NOT NULL,
  follow_up_actions TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  severity TEXT NOT NULL DEFAULT 'medium' CHECK (severity IN ('low','medium','high','critical')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS incident_reviews_org_idx ON incident_reviews(organization_id);
ALTER TABLE incident_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY incident_reviews_access ON incident_reviews
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM organization_members WHERE user_id = auth.uid() AND is_active = TRUE
    )
  ) WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM organization_members WHERE user_id = auth.uid() AND is_active = TRUE
    )
  );

CREATE TRIGGER incident_reviews_updated_at
  BEFORE UPDATE ON incident_reviews
  FOR EACH ROW EXECUTE PROCEDURE set_updated_at();

-- Moderation queues table for compliance workflows
CREATE TABLE IF NOT EXISTS moderation_queues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  event_id UUID,
  resource_type TEXT NOT NULL,
  resource_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  reviewer_id UUID REFERENCES auth.users(id),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS moderation_queues_org_idx ON moderation_queues(organization_id);
ALTER TABLE moderation_queues ENABLE ROW LEVEL SECURITY;

CREATE POLICY moderation_queues_access ON moderation_queues
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM organization_members WHERE user_id = auth.uid() AND is_active = TRUE
    )
  ) WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM organization_members WHERE user_id = auth.uid() AND is_active = TRUE
    )
  );

CREATE TRIGGER moderation_queues_updated_at
  BEFORE UPDATE ON moderation_queues
  FOR EACH ROW EXECUTE PROCEDURE set_updated_at();

-- Seed default admin organization and user
DO $$
DECLARE
  hq_org UUID;
  admin_user UUID;
  super_role UUID;
BEGIN
  INSERT INTO organizations (name, slug, tier, subscription_status, is_active)
  VALUES ('inCommand HQ', 'incommand-hq', 'enterprise', 'active', TRUE)
  ON CONFLICT (slug) DO UPDATE SET updated_at = NOW()
  RETURNING id INTO hq_org;

  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'david@incommand.uk') THEN
    SELECT (auth.create_user(
      email := 'david@incommand.uk',
      password := 'ChangeMeNow!2024',
      email_confirmed_at := NOW(),
      user_metadata := jsonb_build_object('mfa_enrolled', TRUE)
    )).id INTO admin_user;
  ELSE
    SELECT id INTO admin_user FROM auth.users WHERE email = 'david@incommand.uk' LIMIT 1;
    UPDATE auth.users SET user_metadata = coalesce(user_metadata, '{}'::jsonb) || jsonb_build_object('mfa_enrolled', TRUE)
    WHERE id = admin_user;
  END IF;

  INSERT INTO profiles (id, full_name, role)
  VALUES (admin_user, 'David InCommand', 'superadmin')
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO organization_members (organization_id, user_id, is_owner, is_active)
  VALUES (hq_org, admin_user, TRUE, TRUE)
  ON CONFLICT (organization_id, user_id) DO UPDATE SET is_owner = TRUE, is_active = TRUE;

  INSERT INTO roles (organization_id, name, description, permissions, is_system_role)
  VALUES (hq_org, 'super_admin', 'Platform super administrator', ARRAY['organizations:manage','users:manage','billing:manage','support:manage','compliance:review'], TRUE)
  ON CONFLICT (organization_id, name) DO NOTHING
  RETURNING id INTO super_role;

  IF super_role IS NULL THEN
    SELECT id INTO super_role FROM roles WHERE organization_id = hq_org AND name = 'super_admin';
  END IF;

  INSERT INTO user_roles (user_id, role_id, organization_id, assigned_by)
  VALUES (admin_user, super_role, hq_org, admin_user)
  ON CONFLICT (user_id, role_id, organization_id) DO NOTHING;
END;
$$;
