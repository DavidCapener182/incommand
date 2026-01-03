-- Feature 6: AI Crowd Behaviour & Welfare Sentiment Intelligence
-- Creates foundational tables for crowd behaviour readings and welfare sentiment tracking

-- ============================================================================
-- crowd_behavior_readings
-- ============================================================================
CREATE TABLE IF NOT EXISTS crowd_behavior_readings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  zone_id UUID,
  zone_label TEXT,
  behavior_type TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'low' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  source TEXT NOT NULL,
  sentiment_score NUMERIC(4,2),
  confidence NUMERIC(4,2),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  detected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_crowd_behavior_event_detected_at
  ON crowd_behavior_readings (event_id, detected_at DESC);

CREATE INDEX IF NOT EXISTS idx_crowd_behavior_zone
  ON crowd_behavior_readings (event_id, zone_id);

CREATE INDEX IF NOT EXISTS idx_crowd_behavior_type
  ON crowd_behavior_readings (behavior_type);

-- ============================================================================
-- welfare_sentiment
-- ============================================================================
CREATE TABLE IF NOT EXISTS welfare_sentiment (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  zone_id UUID,
  zone_label TEXT,
  sentiment_score NUMERIC(4,2) NOT NULL,
  concern_level TEXT NOT NULL DEFAULT 'normal' CHECK (concern_level IN ('normal', 'watch', 'warning', 'critical')),
  keywords TEXT[] DEFAULT '{}',
  sample_count INTEGER NOT NULL DEFAULT 0,
  source TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  captured_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_welfare_sentiment_event_captured_at
  ON welfare_sentiment (event_id, captured_at DESC);

CREATE INDEX IF NOT EXISTS idx_welfare_sentiment_concern_level
  ON welfare_sentiment (event_id, concern_level);

CREATE INDEX IF NOT EXISTS idx_welfare_sentiment_zone
  ON welfare_sentiment (event_id, zone_id);


