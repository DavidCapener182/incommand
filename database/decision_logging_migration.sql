-- Decision Logging & Inquiry Pack Migration
-- Feature 3: Golden Thread Decision Logging System
-- Provides tamper-evident decision records for inquiries and debriefs

-- =============================================================================
-- PART 1: Create decisions table
-- =============================================================================

CREATE TABLE IF NOT EXISTS decisions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  
  -- Decision Context
  trigger_issue TEXT NOT NULL,
  options_considered JSONB NOT NULL DEFAULT '[]'::jsonb,
  information_available JSONB NOT NULL DEFAULT '{}'::jsonb,
  decision_taken TEXT NOT NULL,
  rationale TEXT NOT NULL,
  
  -- Decision Ownership
  decision_owner_id UUID REFERENCES profiles(id),
  decision_owner_callsign VARCHAR(50),
  role_level VARCHAR(20) NOT NULL DEFAULT 'other',
  
  -- Temporal Context
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  location VARCHAR(255),
  follow_up_review_time TIMESTAMPTZ,
  
  -- Linking
  linked_incident_ids INTEGER[] DEFAULT '{}',
  linked_staff_assignment_ids UUID[] DEFAULT '{}',
  
  -- Tamper-Evident Locking
  locked_at TIMESTAMPTZ,
  locked_by_user_id UUID REFERENCES profiles(id),
  is_locked BOOLEAN DEFAULT FALSE,
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by_user_id UUID REFERENCES profiles(id),
  
  -- Constraints
  CONSTRAINT decision_owner_required CHECK (
    decision_owner_id IS NOT NULL OR decision_owner_callsign IS NOT NULL
  ),
  CONSTRAINT locked_requires_locker CHECK (
    (is_locked = FALSE) OR (locked_by_user_id IS NOT NULL AND locked_at IS NOT NULL)
  )
);

-- Add role_level constraint
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'role_level_check'
  ) THEN
    ALTER TABLE decisions
      ADD CONSTRAINT role_level_check 
        CHECK (role_level IN ('bronze', 'silver', 'gold', 'platinum', 'other'));
  END IF;
END $$;

-- =============================================================================
-- PART 2: Create decision_evidence table
-- =============================================================================

CREATE TABLE IF NOT EXISTS decision_evidence (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  decision_id UUID NOT NULL REFERENCES decisions(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  
  -- Evidence Details
  evidence_type VARCHAR(50) NOT NULL DEFAULT 'other',
  title VARCHAR(255) NOT NULL,
  description TEXT,
  
  -- Storage
  file_path TEXT,
  file_url TEXT,
  external_reference TEXT,
  
  -- Metadata
  captured_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  captured_by_user_id UUID REFERENCES profiles(id),
  file_size_bytes INTEGER,
  mime_type VARCHAR(100),
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add evidence_type constraint
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'evidence_type_check'
  ) THEN
    ALTER TABLE decision_evidence
      ADD CONSTRAINT evidence_type_check 
        CHECK (evidence_type IN (
          'screenshot', 'cctv_still', 'radio_transcript', 'email', 
          'message', 'document', 'audio_recording', 'video', 'other'
        ));
  END IF;
END $$;

-- =============================================================================
-- PART 3: Create decision_annotations table
-- =============================================================================

CREATE TABLE IF NOT EXISTS decision_annotations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  decision_id UUID NOT NULL REFERENCES decisions(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  
  annotation_text TEXT NOT NULL,
  annotation_type VARCHAR(50) DEFAULT 'note',
  
  created_by_user_id UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add annotation_type constraint
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'annotation_type_check'
  ) THEN
    ALTER TABLE decision_annotations
      ADD CONSTRAINT annotation_type_check 
        CHECK (annotation_type IN (
          'note', 'clarification', 'correction', 'follow_up', 'inquiry_response'
        ));
  END IF;
END $$;

-- =============================================================================
-- PART 4: Create indexes
-- =============================================================================

-- Decisions indexes
CREATE INDEX IF NOT EXISTS idx_decisions_event_id ON decisions(event_id);
CREATE INDEX IF NOT EXISTS idx_decisions_company_id ON decisions(company_id);
CREATE INDEX IF NOT EXISTS idx_decisions_timestamp ON decisions(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_decisions_decision_owner ON decisions(decision_owner_id);
CREATE INDEX IF NOT EXISTS idx_decisions_role_level ON decisions(role_level);
CREATE INDEX IF NOT EXISTS idx_decisions_locked ON decisions(is_locked) WHERE is_locked = TRUE;
CREATE INDEX IF NOT EXISTS idx_decisions_linked_incidents ON decisions USING GIN(linked_incident_ids);
CREATE INDEX IF NOT EXISTS idx_decisions_created_by ON decisions(created_by_user_id);

-- Decision evidence indexes
CREATE INDEX IF NOT EXISTS idx_decision_evidence_decision_id ON decision_evidence(decision_id);
CREATE INDEX IF NOT EXISTS idx_decision_evidence_type ON decision_evidence(evidence_type);
CREATE INDEX IF NOT EXISTS idx_decision_evidence_company_id ON decision_evidence(company_id);

-- Decision annotations indexes
CREATE INDEX IF NOT EXISTS idx_decision_annotations_decision_id ON decision_annotations(decision_id);
CREATE INDEX IF NOT EXISTS idx_decision_annotations_company_id ON decision_annotations(company_id);

-- =============================================================================
-- PART 5: Create updated_at trigger function (if not exists)
-- =============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at trigger to decisions table
DROP TRIGGER IF EXISTS update_decisions_updated_at ON decisions;
CREATE TRIGGER update_decisions_updated_at
  BEFORE UPDATE ON decisions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- PART 6: Enable Row Level Security
-- =============================================================================

ALTER TABLE decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE decision_evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE decision_annotations ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- PART 7: Create RLS Policies for decisions
-- =============================================================================

-- Users can view decisions for their company's events
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'decisions' 
    AND policyname = 'Users can view decisions for their company events'
  ) THEN
    CREATE POLICY "Users can view decisions for their company events"
      ON decisions FOR SELECT
      USING (
        company_id IN (
          SELECT company_id FROM profiles WHERE id = auth.uid()
        )
      );
  END IF;
END $$;

-- Users can create decisions for their company's events
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'decisions' 
    AND policyname = 'Users can create decisions for their company events'
  ) THEN
    CREATE POLICY "Users can create decisions for their company events"
      ON decisions FOR INSERT
      WITH CHECK (
        company_id IN (
          SELECT company_id FROM profiles WHERE id = auth.uid()
        )
        AND created_by_user_id = auth.uid()
      );
  END IF;
END $$;

-- Users can update decisions only if not locked and for their company
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'decisions' 
    AND policyname = 'Users can update unlocked decisions'
  ) THEN
    CREATE POLICY "Users can update unlocked decisions"
      ON decisions FOR UPDATE
      USING (
        company_id IN (
          SELECT company_id FROM profiles WHERE id = auth.uid()
        )
        AND is_locked = FALSE
      )
      WITH CHECK (
        company_id IN (
          SELECT company_id FROM profiles WHERE id = auth.uid()
        )
        AND is_locked = FALSE
      );
  END IF;
END $$;

-- Only decision owner or admins can lock decisions
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'decisions' 
    AND policyname = 'Decision owners and admins can lock decisions'
  ) THEN
    CREATE POLICY "Decision owners and admins can lock decisions"
      ON decisions FOR UPDATE
      USING (
        (decision_owner_id = auth.uid() OR EXISTS (
          SELECT 1 FROM profiles 
          WHERE id = auth.uid() 
          AND role IN ('admin', 'superadmin')
        ))
        AND company_id IN (
          SELECT company_id FROM profiles WHERE id = auth.uid()
        )
      )
      WITH CHECK (
        (decision_owner_id = auth.uid() OR EXISTS (
          SELECT 1 FROM profiles 
          WHERE id = auth.uid() 
          AND role IN ('admin', 'superadmin')
        ))
        AND company_id IN (
          SELECT company_id FROM profiles WHERE id = auth.uid()
        )
      );
  END IF;
END $$;

-- =============================================================================
-- PART 8: Create RLS Policies for decision_evidence
-- =============================================================================

-- Users can view evidence for decisions they can access
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'decision_evidence' 
    AND policyname = 'Users can view evidence for accessible decisions'
  ) THEN
    CREATE POLICY "Users can view evidence for accessible decisions"
      ON decision_evidence FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM decisions d
          WHERE d.id = decision_evidence.decision_id
          AND d.company_id IN (
            SELECT company_id FROM profiles WHERE id = auth.uid()
          )
        )
      );
  END IF;
END $$;

-- Users can add evidence to decisions they can access
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'decision_evidence' 
    AND policyname = 'Users can add evidence to accessible decisions'
  ) THEN
    CREATE POLICY "Users can add evidence to accessible decisions"
      ON decision_evidence FOR INSERT
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM decisions d
          WHERE d.id = decision_evidence.decision_id
          AND d.company_id IN (
            SELECT company_id FROM profiles WHERE id = auth.uid()
          )
          AND d.is_locked = FALSE
        )
        AND company_id IN (
          SELECT company_id FROM profiles WHERE id = auth.uid()
        )
      );
  END IF;
END $$;

-- =============================================================================
-- PART 9: Create RLS Policies for decision_annotations
-- =============================================================================

-- Users can view annotations for decisions they can access
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'decision_annotations' 
    AND policyname = 'Users can view annotations for accessible decisions'
  ) THEN
    CREATE POLICY "Users can view annotations for accessible decisions"
      ON decision_annotations FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM decisions d
          WHERE d.id = decision_annotations.decision_id
          AND d.company_id IN (
            SELECT company_id FROM profiles WHERE id = auth.uid()
          )
        )
      );
  END IF;
END $$;

-- Users can add annotations to decisions they can access
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'decision_annotations' 
    AND policyname = 'Users can add annotations to accessible decisions'
  ) THEN
    CREATE POLICY "Users can add annotations to accessible decisions"
      ON decision_annotations FOR INSERT
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM decisions d
          WHERE d.id = decision_annotations.decision_id
          AND d.company_id IN (
            SELECT company_id FROM profiles WHERE id = auth.uid()
          )
        )
        AND company_id IN (
          SELECT company_id FROM profiles WHERE id = auth.uid()
        )
      );
  END IF;
END $$;

-- =============================================================================
-- PART 10: Add table comments for documentation
-- =============================================================================

COMMENT ON TABLE decisions IS 'Critical operational decisions with full context and rationale. Supports tamper-evident locking for inquiry readiness.';
COMMENT ON TABLE decision_evidence IS 'Supporting evidence (screenshots, transcripts, documents) linked to decisions.';
COMMENT ON TABLE decision_annotations IS 'Immutable annotations added to decisions after locking. Cannot be edited or deleted.';

COMMENT ON COLUMN decisions.trigger_issue IS 'The issue or situation that triggered this decision';
COMMENT ON COLUMN decisions.options_considered IS 'JSONB array of options considered, each with pros and cons';
COMMENT ON COLUMN decisions.information_available IS 'JSONB object containing available information (density, weather, comms, etc.)';
COMMENT ON COLUMN decisions.is_locked IS 'Whether this decision is locked (tamper-evident). Once locked, cannot be edited.';
COMMENT ON COLUMN decisions.locked_at IS 'Timestamp when decision was locked';
COMMENT ON COLUMN decisions.linked_incident_ids IS 'Array of incident_logs.id values linked to this decision';

COMMENT ON COLUMN decision_evidence.evidence_type IS 'Type of evidence: screenshot, cctv_still, radio_transcript, email, etc.';
COMMENT ON COLUMN decision_evidence.external_reference IS 'Reference to external system (e.g., CCTV system ID, radio channel)';

COMMENT ON COLUMN decision_annotations.annotation_type IS 'Type of annotation: note, clarification, correction, follow_up, inquiry_response';

