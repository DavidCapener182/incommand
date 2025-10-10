-- =====================================================
-- MONITORING & ANALYTICS MIGRATION
-- Error tracking, performance metrics, and usage analytics
-- =====================================================

-- Usage Events Table
CREATE TABLE IF NOT EXISTS usage_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id TEXT NOT NULL UNIQUE,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id),
  session_id TEXT NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('pageView', 'click', 'formSubmit', 'featureUse', 'custom')),
  event_name TEXT NOT NULL,
  properties JSONB,
  page TEXT,
  referrer TEXT,
  device_type TEXT CHECK (device_type IN ('desktop', 'tablet', 'mobile')),
  browser TEXT,
  os TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Error Logs Table
CREATE TABLE IF NOT EXISTS error_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  error_id TEXT NOT NULL UNIQUE,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  level TEXT NOT NULL CHECK (level IN ('error', 'warning', 'info', 'debug')),
  message TEXT NOT NULL,
  stack TEXT,
  context JSONB,
  user_id UUID REFERENCES auth.users(id),
  session_id TEXT,
  user_agent TEXT,
  url TEXT,
  component TEXT,
  action TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Performance Metrics Table
CREATE TABLE IF NOT EXISTS performance_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_id TEXT NOT NULL UNIQUE,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  type TEXT NOT NULL CHECK (type IN ('pageLoad', 'apiCall', 'userInteraction', 'render', 'custom')),
  name TEXT NOT NULL,
  duration NUMERIC NOT NULL,
  metadata JSONB,
  user_id UUID REFERENCES auth.users(id),
  session_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- System Health Snapshots
CREATE TABLE IF NOT EXISTS system_health_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  cpu_usage NUMERIC,
  memory_usage NUMERIC,
  disk_usage NUMERIC,
  active_connections INTEGER,
  request_rate NUMERIC,
  error_rate NUMERIC,
  avg_response_time NUMERIC,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Feature Adoption Tracking
CREATE TABLE IF NOT EXISTS feature_adoption (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feature_name TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  first_use TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_use TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  use_count INTEGER NOT NULL DEFAULT 1,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(feature_name, user_id)
);

-- User Sessions
CREATE TABLE IF NOT EXISTS user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL UNIQUE,
  user_id UUID REFERENCES auth.users(id),
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  duration_seconds INTEGER,
  page_views INTEGER DEFAULT 0,
  events_count INTEGER DEFAULT 0,
  device_type TEXT,
  browser TEXT,
  os TEXT,
  ip_address INET,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- INDEXES
-- =====================================================

-- Usage Events Indexes
CREATE INDEX IF NOT EXISTS idx_usage_events_timestamp ON usage_events(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_usage_events_user_id ON usage_events(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_events_session_id ON usage_events(session_id);
CREATE INDEX IF NOT EXISTS idx_usage_events_event_type ON usage_events(event_type);
CREATE INDEX IF NOT EXISTS idx_usage_events_event_name ON usage_events(event_name);
CREATE INDEX IF NOT EXISTS idx_usage_events_page ON usage_events(page);

-- Error Logs Indexes
CREATE INDEX IF NOT EXISTS idx_error_logs_timestamp ON error_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_error_logs_level ON error_logs(level);
CREATE INDEX IF NOT EXISTS idx_error_logs_user_id ON error_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_error_logs_component ON error_logs(component);
CREATE INDEX IF NOT EXISTS idx_error_logs_session_id ON error_logs(session_id);

-- Performance Metrics Indexes
CREATE INDEX IF NOT EXISTS idx_performance_metrics_timestamp ON performance_metrics(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_type ON performance_metrics(type);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_name ON performance_metrics(name);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_duration ON performance_metrics(duration);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_user_id ON performance_metrics(user_id);

-- System Health Indexes
CREATE INDEX IF NOT EXISTS idx_system_health_timestamp ON system_health_snapshots(timestamp DESC);

-- Feature Adoption Indexes
CREATE INDEX IF NOT EXISTS idx_feature_adoption_feature_name ON feature_adoption(feature_name);
CREATE INDEX IF NOT EXISTS idx_feature_adoption_user_id ON feature_adoption(user_id);
CREATE INDEX IF NOT EXISTS idx_feature_adoption_last_use ON feature_adoption(last_use DESC);

-- User Sessions Indexes
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_started_at ON user_sessions(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_sessions_session_id ON user_sessions(session_id);

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS
ALTER TABLE usage_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE error_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_health_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE feature_adoption ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;

-- Usage Events Policies
CREATE POLICY "usage_events_insert_own" ON usage_events
  FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "usage_events_select_admin" ON usage_events
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role IN ('admin', 'superadmin')
    )
  );

-- Error Logs Policies
CREATE POLICY "error_logs_insert_own" ON error_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "error_logs_select_admin" ON error_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role IN ('admin', 'superadmin')
    )
  );

-- Performance Metrics Policies
CREATE POLICY "performance_metrics_insert_own" ON performance_metrics
  FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "performance_metrics_select_admin" ON performance_metrics
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role IN ('admin', 'superadmin')
    )
  );

-- System Health Policies (Admin only)
CREATE POLICY "system_health_select_admin" ON system_health_snapshots
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role IN ('admin', 'superadmin')
    )
  );

CREATE POLICY "system_health_insert_admin" ON system_health_snapshots
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role IN ('admin', 'superadmin')
    )
  );

-- Feature Adoption Policies
CREATE POLICY "feature_adoption_select_own" ON feature_adoption
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "feature_adoption_insert_own" ON feature_adoption
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "feature_adoption_update_own" ON feature_adoption
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "feature_adoption_select_admin" ON feature_adoption
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role IN ('admin', 'superadmin')
    )
  );

-- User Sessions Policies
CREATE POLICY "user_sessions_select_own" ON user_sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "user_sessions_insert_own" ON user_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "user_sessions_update_own" ON user_sessions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "user_sessions_select_admin" ON user_sessions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role IN ('admin', 'superadmin')
    )
  );

-- =====================================================
-- FUNCTIONS & TRIGGERS
-- =====================================================

-- Auto-update feature adoption
CREATE OR REPLACE FUNCTION update_feature_adoption()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO feature_adoption (feature_name, user_id, first_use, last_use, use_count)
  VALUES (NEW.event_name, NEW.user_id, NEW.timestamp, NEW.timestamp, 1)
  ON CONFLICT (feature_name, user_id)
  DO UPDATE SET
    last_use = NEW.timestamp,
    use_count = feature_adoption.use_count + 1,
    updated_at = NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_feature_adoption
  AFTER INSERT ON usage_events
  FOR EACH ROW
  WHEN (NEW.event_type = 'featureUse')
  EXECUTE FUNCTION update_feature_adoption();

-- Auto-update session stats
CREATE OR REPLACE FUNCTION update_session_stats()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_sessions (session_id, user_id, started_at, page_views, events_count, device_type, browser, os)
  VALUES (
    NEW.session_id,
    NEW.user_id,
    NEW.timestamp,
    CASE WHEN NEW.event_type = 'pageView' THEN 1 ELSE 0 END,
    1,
    NEW.device_type,
    NEW.browser,
    NEW.os
  )
  ON CONFLICT (session_id)
  DO UPDATE SET
    page_views = user_sessions.page_views + CASE WHEN NEW.event_type = 'pageView' THEN 1 ELSE 0 END,
    events_count = user_sessions.events_count + 1,
    updated_at = NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_session_stats
  AFTER INSERT ON usage_events
  FOR EACH ROW
  EXECUTE FUNCTION update_session_stats();

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON TABLE usage_events IS 'Tracks user interactions and feature usage';
COMMENT ON TABLE error_logs IS 'Stores application errors and warnings for debugging';
COMMENT ON TABLE performance_metrics IS 'Records performance measurements for monitoring';
COMMENT ON TABLE system_health_snapshots IS 'Periodic snapshots of system health metrics';
COMMENT ON TABLE feature_adoption IS 'Tracks feature usage per user for adoption analytics';
COMMENT ON TABLE user_sessions IS 'Tracks user session information and activity';

