-- Admin backend schema extensions

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
