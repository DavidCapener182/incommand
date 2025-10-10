-- Multi-Tenant Migration
-- Organization hierarchy, roles, permissions, and subscription management

-- Create organizations table
CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  parent_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  tier TEXT NOT NULL DEFAULT 'free' CHECK (tier IN ('free', 'professional', 'enterprise')),
  settings JSONB NOT NULL DEFAULT '{}'::jsonb,
  branding JSONB,
  subscription_status TEXT NOT NULL DEFAULT 'active' CHECK (subscription_status IN ('active', 'suspended', 'cancelled')),
  subscription_starts_at TIMESTAMPTZ,
  subscription_ends_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create roles table
CREATE TABLE IF NOT EXISTS roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  permissions TEXT[] NOT NULL DEFAULT '{}',
  is_system_role BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(organization_id, name)
);

-- Create user_roles table (many-to-many)
CREATE TABLE IF NOT EXISTS user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  assigned_by UUID REFERENCES auth.users(id),
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ,
  UNIQUE(user_id, role_id, organization_id)
);

-- Create organization_members table
CREATE TABLE IF NOT EXISTS organization_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  custom_permissions TEXT[] DEFAULT '{}',
  is_owner BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_active_at TIMESTAMPTZ,
  UNIQUE(organization_id, user_id)
);

-- Create subscription_usage table
CREATE TABLE IF NOT EXISTS subscription_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  events_count INTEGER DEFAULT 0,
  users_count INTEGER DEFAULT 0,
  storage_gb DECIMAL(10, 2) DEFAULT 0,
  api_calls INTEGER DEFAULT 0,
  emails_sent INTEGER DEFAULT 0,
  sms_sent INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(organization_id, period_start)
);

-- Create audit_log table
CREATE TABLE IF NOT EXISTS audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id TEXT,
  changes JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add organization_id to existing tables
ALTER TABLE events ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);
ALTER TABLE incident_logs ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_organizations_slug ON organizations(slug);
CREATE INDEX IF NOT EXISTS idx_organizations_parent_id ON organizations(parent_id);
CREATE INDEX IF NOT EXISTS idx_organizations_tier ON organizations(tier);
CREATE INDEX IF NOT EXISTS idx_roles_organization_id ON roles(organization_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_organization_id ON user_roles(organization_id);
CREATE INDEX IF NOT EXISTS idx_organization_members_organization_id ON organization_members(organization_id);
CREATE INDEX IF NOT EXISTS idx_organization_members_user_id ON organization_members(user_id);
CREATE INDEX IF NOT EXISTS idx_subscription_usage_organization_id ON subscription_usage(organization_id);
CREATE INDEX IF NOT EXISTS idx_subscription_usage_period ON subscription_usage(period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_audit_log_organization_id ON audit_log(organization_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_user_id ON audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON audit_log(created_at);

-- Enable Row Level Security
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies for organizations
CREATE POLICY "Users can view their organizations"
  ON organizations FOR SELECT
  TO authenticated
  USING (
    id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "Organization owners can update their organizations"
  ON organizations FOR UPDATE
  TO authenticated
  USING (
    id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid() AND is_owner = true
    )
  );

-- RLS Policies for roles
CREATE POLICY "Users can view roles in their organizations"
  ON roles FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid() AND is_active = true
    ) OR is_system_role = true
  );

-- RLS Policies for organization_members
CREATE POLICY "Users can view members in their organizations"
  ON organization_members FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

-- RLS Policies for audit_log
CREATE POLICY "Users can view audit logs for their organizations"
  ON audit_log FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

-- Function to log audit events
CREATE OR REPLACE FUNCTION log_audit_event(
  p_organization_id UUID,
  p_action TEXT,
  p_resource_type TEXT,
  p_resource_id TEXT DEFAULT NULL,
  p_changes JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_audit_id UUID;
BEGIN
  INSERT INTO audit_log (
    organization_id,
    user_id,
    action,
    resource_type,
    resource_id,
    changes
  ) VALUES (
    p_organization_id,
    auth.uid(),
    p_action,
    p_resource_type,
    p_resource_id,
    p_changes
  ) RETURNING id INTO v_audit_id;
  
  RETURN v_audit_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check organization feature access
CREATE OR REPLACE FUNCTION check_org_feature(
  p_organization_id UUID,
  p_feature TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  v_has_feature BOOLEAN;
BEGIN
  SELECT (settings->'features'->p_feature)::boolean INTO v_has_feature
  FROM organizations
  WHERE id = p_organization_id AND is_active = true;
  
  RETURN COALESCE(v_has_feature, false);
END;
$$ LANGUAGE plpgsql;

-- Function to check organization limits
CREATE OR REPLACE FUNCTION check_org_limit(
  p_organization_id UUID,
  p_limit TEXT,
  p_current_usage INTEGER
)
RETURNS BOOLEAN AS $$
DECLARE
  v_limit_value INTEGER;
BEGIN
  SELECT (settings->'limits'->p_limit)::integer INTO v_limit_value
  FROM organizations
  WHERE id = p_organization_id AND is_active = true;
  
  -- -1 means unlimited
  IF v_limit_value = -1 THEN
    RETURN true;
  END IF;
  
  RETURN p_current_usage < COALESCE(v_limit_value, 0);
END;
$$ LANGUAGE plpgsql;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_organizations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_roles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_subscription_usage_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers
DROP TRIGGER IF EXISTS update_organizations_updated_at ON organizations;
CREATE TRIGGER update_organizations_updated_at
  BEFORE UPDATE ON organizations
  FOR EACH ROW
  EXECUTE FUNCTION update_organizations_updated_at();

DROP TRIGGER IF EXISTS update_roles_updated_at ON roles;
CREATE TRIGGER update_roles_updated_at
  BEFORE UPDATE ON roles
  FOR EACH ROW
  EXECUTE FUNCTION update_roles_updated_at();

DROP TRIGGER IF EXISTS update_subscription_usage_updated_at ON subscription_usage;
CREATE TRIGGER update_subscription_usage_updated_at
  BEFORE UPDATE ON subscription_usage
  FOR EACH ROW
  EXECUTE FUNCTION update_subscription_usage_updated_at();

-- Insert default system roles
INSERT INTO roles (id, name, description, permissions, is_system_role) VALUES
  ('admin', 'Administrator', 'Full system access', ARRAY['admin:all'], true),
  ('silver_commander', 'Silver Commander', 'Tactical command', ARRAY['incidents:create', 'incidents:read', 'incidents:update', 'incidents:close', 'incidents:amend', 'events:read', 'events:update', 'staff:read', 'analytics:view'], true),
  ('bronze_commander', 'Bronze Commander', 'Operational command', ARRAY['incidents:create', 'incidents:read', 'incidents:update', 'incidents:close', 'events:read', 'staff:read', 'analytics:view'], true),
  ('supervisor', 'Supervisor', 'Team supervision', ARRAY['incidents:create', 'incidents:read', 'incidents:update', 'events:read', 'staff:read'], true),
  ('operator', 'Operator', 'Standard operations', ARRAY['incidents:create', 'incidents:read', 'events:read'], true),
  ('observer', 'Observer', 'Read-only access', ARRAY['incidents:read', 'events:read', 'analytics:view'], true),
  ('client', 'Client', 'Client access', ARRAY['incidents:read', 'events:read', 'analytics:view'], true)
ON CONFLICT (id) DO NOTHING;

-- Add comments
COMMENT ON TABLE organizations IS 'Multi-tenant organization structure';
COMMENT ON TABLE roles IS 'Role definitions with permissions';
COMMENT ON TABLE user_roles IS 'User role assignments';
COMMENT ON TABLE organization_members IS 'Organization membership and access';
COMMENT ON TABLE subscription_usage IS 'Tracks usage against subscription limits';
COMMENT ON TABLE audit_log IS 'Comprehensive audit trail for all actions';
