-- CRM Quotes Migration
-- Creates quotes table for tracking quotes and company plan levels
-- Links quotes to companies and tracks quote status

BEGIN;

-- Create quotes table
CREATE TABLE IF NOT EXISTS quotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
  company_name TEXT NOT NULL,
  contact_name TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  
  -- Quote details
  base_plan TEXT NOT NULL CHECK (base_plan IN ('starter', 'operational', 'command', 'enterprise')),
  recommended_plan TEXT NOT NULL CHECK (recommended_plan IN ('starter', 'operational', 'command', 'enterprise')),
  
  -- Input metrics
  events_per_month INTEGER NOT NULL DEFAULT 0,
  avg_attendees_per_event INTEGER NOT NULL DEFAULT 0,
  staff_users INTEGER NOT NULL DEFAULT 0,
  admin_users INTEGER NOT NULL DEFAULT 0,
  feature_add_ons TEXT[] DEFAULT ARRAY[]::TEXT[],
  
  -- Calculated pricing
  monthly_estimate NUMERIC(10, 2) NOT NULL,
  annual_estimate NUMERIC(10, 2) NOT NULL,
  
  -- Breakdown (stored as JSONB for flexibility)
  breakdown JSONB NOT NULL DEFAULT '{}'::jsonb,
  
  -- Quote status
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'accepted', 'rejected', 'expired')),
  
  -- Notes and follow-up
  notes TEXT,
  follow_up_date TIMESTAMPTZ,
  assigned_to UUID REFERENCES profiles(id) ON DELETE SET NULL,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_quotes_company_id ON quotes(company_id);
CREATE INDEX IF NOT EXISTS idx_quotes_status ON quotes(status);
CREATE INDEX IF NOT EXISTS idx_quotes_created_at ON quotes(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_quotes_follow_up_date ON quotes(follow_up_date) WHERE follow_up_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_quotes_assigned_to ON quotes(assigned_to) WHERE assigned_to IS NOT NULL;

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_quotes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_quotes_updated_at
  BEFORE UPDATE ON quotes
  FOR EACH ROW
  EXECUTE FUNCTION update_quotes_updated_at();

-- Enable RLS
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Superadmins can view all quotes
CREATE POLICY "Superadmins can view all quotes" ON quotes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'superadmin'
    )
  );

-- Superadmins can insert quotes
CREATE POLICY "Superadmins can insert quotes" ON quotes
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'superadmin'
    )
  );

-- Superadmins can update quotes
CREATE POLICY "Superadmins can update quotes" ON quotes
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'superadmin'
    )
  );

-- Superadmins can delete quotes
CREATE POLICY "Superadmins can delete quotes" ON quotes
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'superadmin'
    )
  );

-- Add quote_id column to companies table for tracking current quote
ALTER TABLE companies
  ADD COLUMN IF NOT EXISTS current_quote_id UUID REFERENCES quotes(id) ON DELETE SET NULL;

-- Create index for current_quote_id
CREATE INDEX IF NOT EXISTS idx_companies_current_quote_id ON companies(current_quote_id) WHERE current_quote_id IS NOT NULL;

COMMIT;

