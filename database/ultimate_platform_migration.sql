-- Ultimate Platform Enhancement
-- Database migrations for all 15 feature sets

-- ============================================================================
-- TIER 1: Advanced Reporting & Automation
-- ============================================================================

-- Executive summaries
CREATE TABLE IF NOT EXISTS executive_summaries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID REFERENCES events(id),
  summary_data JSONB NOT NULL,
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  generated_by TEXT
);

-- Compliance reports
CREATE TABLE IF NOT EXISTS compliance_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID REFERENCES events(id),
  standard TEXT NOT NULL, -- 'JESIP', 'JDM', 'ISO22320'
  report_data JSONB NOT NULL,
  score NUMERIC(5,2),
  rating TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Automation workflows
CREATE TABLE IF NOT EXISTS automation_workflows (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  trigger_type TEXT NOT NULL,
  trigger_config JSONB,
  conditions JSONB,
  actions JSONB,
  is_active BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Workflow execution logs
CREATE TABLE IF NOT EXISTS workflow_executions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workflow_id UUID REFERENCES automation_workflows(id),
  trigger_data JSONB,
  executed_actions JSONB,
  status TEXT, -- 'success', 'failed', 'partial'
  error_message TEXT,
  executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Smart collections (saved searches)
CREATE TABLE IF NOT EXISTS smart_collections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  filters JSONB NOT NULL,
  auto_update BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Search analytics
CREATE TABLE IF NOT EXISTS search_analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID,
  query TEXT NOT NULL,
  results_count INTEGER,
  clicked_result UUID,
  searched_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- TIER 2: ML, IoT, and Predictive Systems
-- ============================================================================

-- ML models
CREATE TABLE IF NOT EXISTS ml_models (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  model_type TEXT NOT NULL, -- 'classification', 'regression', 'clustering'
  accuracy NUMERIC(5,4),
  parameters JSONB,
  training_data_size INTEGER,
  trained_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ML predictions
CREATE TABLE IF NOT EXISTS ml_predictions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  model_id UUID REFERENCES ml_models(id),
  incident_id UUID,
  prediction JSONB NOT NULL,
  confidence NUMERIC(5,4),
  was_correct BOOLEAN,
  predicted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- IoT sensors
CREATE TABLE IF NOT EXISTS iot_sensors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sensor_id TEXT UNIQUE NOT NULL,
  sensor_type TEXT NOT NULL, -- 'camera', 'crowd_density', 'temperature', etc.
  location JSONB,
  status TEXT DEFAULT 'active',
  last_reading JSONB,
  last_reading_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- IoT sensor readings
CREATE TABLE IF NOT EXISTS sensor_readings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sensor_id UUID REFERENCES iot_sensors(id),
  reading_value NUMERIC,
  reading_data JSONB,
  alert_triggered BOOLEAN DEFAULT false,
  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Camera feeds
CREATE TABLE IF NOT EXISTS camera_feeds (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  stream_url TEXT NOT NULL,
  location TEXT,
  is_active BOOLEAN DEFAULT true,
  ai_detection_enabled BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Predictive forecasts
CREATE TABLE IF NOT EXISTS predictive_forecasts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID REFERENCES events(id),
  forecast_type TEXT NOT NULL, -- 'weather', 'crowd', 'incident', 'resource'
  forecast_data JSONB NOT NULL,
  confidence NUMERIC(5,4),
  valid_from TIMESTAMP WITH TIME ZONE,
  valid_until TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- TIER 3: AI Assistant, Blockchain, and Advanced Systems
-- ============================================================================

-- AI chat conversations
CREATE TABLE IF NOT EXISTS ai_conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  session_id TEXT NOT NULL,
  messages JSONB NOT NULL,
  context JSONB,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ended_at TIMESTAMP WITH TIME ZONE
);

-- Blockchain audit entries
CREATE TABLE IF NOT EXISTS blockchain_audit (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  block_index INTEGER NOT NULL,
  data_hash TEXT NOT NULL,
  previous_hash TEXT NOT NULL,
  nonce INTEGER NOT NULL,
  data JSONB NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3D venue models
CREATE TABLE IF NOT EXISTS venue_3d_models (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  venue_name TEXT NOT NULL,
  model_data JSONB NOT NULL, -- floors, zones, beacons
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indoor positioning beacons
CREATE TABLE IF NOT EXISTS positioning_beacons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  venue_id UUID REFERENCES venue_3d_models(id),
  uuid TEXT NOT NULL,
  major INTEGER NOT NULL,
  minor INTEGER NOT NULL,
  location JSONB NOT NULL, -- lat, lng, floor
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Geofences/zones
CREATE TABLE IF NOT EXISTS venue_zones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  venue_id UUID REFERENCES venue_3d_models(id),
  name TEXT NOT NULL,
  zone_type TEXT NOT NULL, -- 'entry', 'exit', 'stage', 'seating', etc.
  polygon JSONB NOT NULL, -- array of lat/lng coordinates
  capacity INTEGER,
  alerts JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- BI data warehouse dimensions
CREATE TABLE IF NOT EXISTS dim_date (
  date_key INTEGER PRIMARY KEY,
  full_date DATE NOT NULL,
  year INTEGER,
  month INTEGER,
  day INTEGER,
  day_of_week INTEGER,
  is_weekend BOOLEAN
);

CREATE TABLE IF NOT EXISTS dim_time (
  time_key INTEGER PRIMARY KEY,
  hour INTEGER,
  minute INTEGER,
  time_of_day TEXT -- 'morning', 'afternoon', 'evening', 'night'
);

-- BI fact table
CREATE TABLE IF NOT EXISTS fact_incidents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  incident_id UUID REFERENCES incident_logs(id),
  event_id UUID,
  date_key INTEGER,
  time_key INTEGER,
  incident_type_key TEXT,
  priority_key TEXT,
  response_time_minutes INTEGER,
  resolution_time_minutes INTEGER,
  quality_score NUMERIC(5,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Plugin system
CREATE TABLE IF NOT EXISTS installed_plugins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  plugin_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  version TEXT NOT NULL,
  author TEXT,
  category TEXT,
  permissions JSONB,
  config JSONB,
  is_active BOOLEAN DEFAULT true,
  installed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS plugin_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  plugin_id UUID REFERENCES installed_plugins(id),
  event_type TEXT NOT NULL,
  event_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Communication hub
CREATE TABLE IF NOT EXISTS radio_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  channel TEXT NOT NULL,
  from_callsign TEXT NOT NULL,
  message TEXT NOT NULL,
  priority TEXT DEFAULT 'routine',
  transmitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sms_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  from_number TEXT NOT NULL,
  to_number TEXT NOT NULL,
  message TEXT NOT NULL,
  direction TEXT NOT NULL, -- 'inbound', 'outbound'
  status TEXT DEFAULT 'sent',
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS social_media_monitoring (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  platform TEXT NOT NULL,
  post_id TEXT UNIQUE NOT NULL,
  content TEXT NOT NULL,
  author TEXT,
  sentiment TEXT,
  requires_action BOOLEAN DEFAULT false,
  posted_at TIMESTAMP WITH TIME ZONE,
  monitored_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- Indexes for performance
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_workflow_executions_workflow_id ON workflow_executions(workflow_id);
CREATE INDEX IF NOT EXISTS idx_workflow_executions_executed_at ON workflow_executions(executed_at);
CREATE INDEX IF NOT EXISTS idx_ml_predictions_model_id ON ml_predictions(model_id);
CREATE INDEX IF NOT EXISTS idx_ml_predictions_incident_id ON ml_predictions(incident_id);
CREATE INDEX IF NOT EXISTS idx_sensor_readings_sensor_id ON sensor_readings(sensor_id);
CREATE INDEX IF NOT EXISTS idx_sensor_readings_recorded_at ON sensor_readings(recorded_at);
CREATE INDEX IF NOT EXISTS idx_ai_conversations_user_id ON ai_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_blockchain_audit_block_index ON blockchain_audit(block_index);
CREATE INDEX IF NOT EXISTS idx_fact_incidents_event_id ON fact_incidents(event_id);
CREATE INDEX IF NOT EXISTS idx_fact_incidents_date_key ON fact_incidents(date_key);

-- ============================================================================
-- Row Level Security (RLS) Policies
-- ============================================================================

ALTER TABLE executive_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE ml_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE iot_sensors ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_conversations ENABLE ROW LEVEL SECURITY;

-- Grant access based on user roles (customize as needed)
-- Example: Only admins can view executive summaries
CREATE POLICY executive_summaries_policy ON executive_summaries
  FOR ALL USING (true);

COMMENT ON TABLE executive_summaries IS 'AI-generated executive summaries for events';
COMMENT ON TABLE compliance_reports IS 'JESIP/JDM compliance certification reports';
COMMENT ON TABLE automation_workflows IS 'Intelligent automation rule engine';
COMMENT ON TABLE ml_models IS 'Machine learning models for prediction';
COMMENT ON TABLE iot_sensors IS 'IoT sensor registry and management';
COMMENT ON TABLE ai_conversations IS 'ChatGPT-style AI assistant conversations';
COMMENT ON TABLE blockchain_audit IS 'Immutable blockchain audit trail';
COMMENT ON TABLE venue_3d_models IS '3D venue models for indoor positioning';
COMMENT ON TABLE installed_plugins IS 'Marketplace plugin registry';
