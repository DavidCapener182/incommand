/**
 * SOP System Migration
 * Feature 2: Live Doctrine Assistant & Dynamic SOP Adjustment Engine
 * 
 * Creates tables for SOP templates, live SOPs, and adjustment tracking
 */

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create sops table for SOP templates and live SOPs
CREATE TABLE IF NOT EXISTS sops (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  event_id UUID REFERENCES events(id) ON DELETE CASCADE, -- NULL for templates, UUID for event-specific SOPs
  template_id UUID REFERENCES sops(id) ON DELETE SET NULL, -- Reference to template if this is an instance
  
  -- SOP Identification
  sop_type VARCHAR(100) NOT NULL, -- e.g., 'crowd_management', 'medical_response', 'security_protocol'
  title VARCHAR(255) NOT NULL,
  description TEXT,
  
  -- SOP Content
  conditions JSONB NOT NULL DEFAULT '{}'::jsonb, -- Trigger conditions (weather, incidents, crowd density, etc.)
  actions JSONB NOT NULL DEFAULT '[]'::jsonb, -- Array of action steps
  procedures TEXT, -- Detailed procedure text
  
  -- Status & Lifecycle
  status VARCHAR(50) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'suspended', 'archived')),
  priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'critical')),
  
  -- Linking & References
  linked_knowledge_ids UUID[] DEFAULT '{}', -- References to knowledge_base entries (Purple Guide, JESIP, etc.)
  applicable_event_types VARCHAR(50)[], -- Event types this SOP applies to
  
  -- Metadata
  created_by_user_id UUID REFERENCES profiles(id),
  approved_by_user_id UUID REFERENCES profiles(id),
  approved_at TIMESTAMPTZ,
  version INTEGER DEFAULT 1,
  notes TEXT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT template_or_event CHECK (
    (event_id IS NULL AND template_id IS NULL) OR -- Template
    (event_id IS NOT NULL AND template_id IS NOT NULL) -- Event-specific instance
  )
);

-- Create sop_adjustments table for logging changes
CREATE TABLE IF NOT EXISTS sop_adjustments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sop_id UUID NOT NULL REFERENCES sops(id) ON DELETE CASCADE,
  
  -- Adjustment Details
  adjustment_type VARCHAR(50) NOT NULL CHECK (adjustment_type IN ('suggested', 'manual', 'auto', 'revert')),
  reason TEXT NOT NULL, -- Why this adjustment is needed
  suggested_by VARCHAR(100), -- 'system', 'user', 'pattern_detection', etc.
  
  -- Changes
  changes JSONB NOT NULL DEFAULT '{}'::jsonb, -- What changed (conditions, actions, procedures)
  original_state JSONB, -- Snapshot of SOP before adjustment
  proposed_state JSONB, -- Proposed new state
  
  -- Workflow
  status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'modified', 'rejected', 'applied')),
  reviewed_by_user_id UUID REFERENCES profiles(id),
  reviewed_at TIMESTAMPTZ,
  review_notes TEXT,
  
  -- Modifications (if status is 'modified')
  modifications JSONB, -- User modifications to the suggested adjustment
  
  -- Metadata
  created_by_user_id UUID REFERENCES profiles(id),
  applied_at TIMESTAMPTZ,
  applied_by_user_id UUID REFERENCES profiles(id),
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_sops_company_id ON sops(company_id);
CREATE INDEX IF NOT EXISTS idx_sops_event_id ON sops(event_id);
CREATE INDEX IF NOT EXISTS idx_sops_template_id ON sops(template_id);
CREATE INDEX IF NOT EXISTS idx_sops_status ON sops(status);
CREATE INDEX IF NOT EXISTS idx_sops_sop_type ON sops(sop_type);
CREATE INDEX IF NOT EXISTS idx_sops_event_type ON sops USING GIN(applicable_event_types);

CREATE INDEX IF NOT EXISTS idx_sop_adjustments_sop_id ON sop_adjustments(sop_id);
CREATE INDEX IF NOT EXISTS idx_sop_adjustments_status ON sop_adjustments(status);
CREATE INDEX IF NOT EXISTS idx_sop_adjustments_created_at ON sop_adjustments(created_at DESC);

-- Enable Row Level Security
ALTER TABLE sops ENABLE ROW LEVEL SECURITY;
ALTER TABLE sop_adjustments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for sops
CREATE POLICY "Users can view SOPs for their company"
  ON sops FOR SELECT
  USING (
    company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can create SOPs for their company"
  ON sops FOR INSERT
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can update SOPs for their company"
  ON sops FOR UPDATE
  USING (
    company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can delete SOPs for their company"
  ON sops FOR DELETE
  USING (
    company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  );

-- RLS Policies for sop_adjustments
CREATE POLICY "Users can view adjustments for their company SOPs"
  ON sop_adjustments FOR SELECT
  USING (
    sop_id IN (
      SELECT id FROM sops WHERE company_id IN (
        SELECT company_id FROM profiles WHERE id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can create adjustments for their company SOPs"
  ON sop_adjustments FOR INSERT
  WITH CHECK (
    sop_id IN (
      SELECT id FROM sops WHERE company_id IN (
        SELECT company_id FROM profiles WHERE id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can update adjustments for their company SOPs"
  ON sop_adjustments FOR UPDATE
  USING (
    sop_id IN (
      SELECT id FROM sops WHERE company_id IN (
        SELECT company_id FROM profiles WHERE id = auth.uid()
      )
    )
  );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_sops_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_sop_adjustments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers to automatically update updated_at
CREATE TRIGGER update_sops_updated_at
  BEFORE UPDATE ON sops
  FOR EACH ROW
  EXECUTE FUNCTION update_sops_updated_at();

CREATE TRIGGER update_sop_adjustments_updated_at
  BEFORE UPDATE ON sop_adjustments
  FOR EACH ROW
  EXECUTE FUNCTION update_sop_adjustments_updated_at();

-- Add comments
COMMENT ON TABLE sops IS 'Stores SOP templates and event-specific live SOPs';
COMMENT ON TABLE sop_adjustments IS 'Logs all SOP adjustments with approval workflow';
COMMENT ON COLUMN sops.conditions IS 'JSONB object defining trigger conditions (weather, incidents, crowd density, etc.)';
COMMENT ON COLUMN sops.actions IS 'JSONB array of action steps to execute';
COMMENT ON COLUMN sop_adjustments.changes IS 'JSONB object describing what changed in the SOP';
COMMENT ON COLUMN sop_adjustments.modifications IS 'JSONB object with user modifications to suggested adjustment';

