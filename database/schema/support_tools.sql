-- Support Tools Database Schema
-- All tables are scoped to company_id and event_id for multi-tenancy

-- Stand Occupancy Tables
CREATE TABLE IF NOT EXISTS stands (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL,
    event_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    capacity INTEGER NOT NULL CHECK (capacity > 0),
    order_index INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(company_id, event_id, name)
);

CREATE TABLE IF NOT EXISTS stand_occupancy (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL,
    event_id UUID NOT NULL,
    stand_id UUID NOT NULL REFERENCES stands(id) ON DELETE CASCADE,
    current_occupancy INTEGER NOT NULL DEFAULT 0 CHECK (current_occupancy >= 0),
    predicted_60m INTEGER,
    predicted_50m INTEGER,
    predicted_40m INTEGER,
    predicted_30m INTEGER,
    predicted_20m INTEGER,
    predicted_10m INTEGER,
    predicted_0m INTEGER,
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    recorded_by VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(company_id, event_id, stand_id)
);

-- Staffing Tables
CREATE TABLE IF NOT EXISTS staffing_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL,
    event_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    planned_count INTEGER NOT NULL DEFAULT 0 CHECK (planned_count >= 0),
    discipline TEXT NOT NULL DEFAULT 'security' CHECK (discipline IN ('security','police','medical','stewarding','other')),
    icon VARCHAR(10),
    color VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(company_id, event_id, name)
);

CREATE TABLE IF NOT EXISTS staffing_actuals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL,
    event_id UUID NOT NULL,
    role_id UUID NOT NULL REFERENCES staffing_roles(id) ON DELETE CASCADE,
    actual_count INTEGER NOT NULL DEFAULT 0 CHECK (actual_count >= 0),
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    recorded_by VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(company_id, event_id, role_id)
);

CREATE TABLE IF NOT EXISTS staffing_forecasts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    discipline TEXT NOT NULL CHECK (discipline IN ('security','police','medical','stewarding','other')),
    predicted_required INTEGER NOT NULL CHECK (predicted_required >= 0),
    confidence NUMERIC,
    methodology TEXT,
    generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    generated_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(company_id, event_id, discipline, generated_at)
);

-- Fixture/Match Progress Tables
CREATE TABLE IF NOT EXISTS fixture_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL,
    event_id UUID NOT NULL,
    minute INTEGER NOT NULL CHECK (minute >= 0 AND minute <= 120),
    description TEXT NOT NULL,
    assigned_role VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS fixture_completions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL,
    event_id UUID NOT NULL,
    task_id UUID NOT NULL REFERENCES fixture_tasks(id) ON DELETE CASCADE,
    completed BOOLEAN NOT NULL DEFAULT FALSE,
    completed_at TIMESTAMP WITH TIME ZONE,
    completed_by VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(company_id, event_id, task_id)
);

-- Crowd Movement & Gate Status Tables
CREATE TABLE IF NOT EXISTS gates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL,
    event_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    sensor_id VARCHAR(255),
    entry_rate INTEGER NOT NULL DEFAULT 0 CHECK (entry_rate >= 0),
    threshold INTEGER NOT NULL DEFAULT 10000 CHECK (threshold > 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(company_id, event_id, name)
);

CREATE TABLE IF NOT EXISTS gate_status (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL,
    event_id UUID NOT NULL,
    gate_id UUID NOT NULL REFERENCES gates(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL CHECK (status IN ('active', 'delayed', 'closed')),
    entry_rate INTEGER NOT NULL DEFAULT 0 CHECK (entry_rate >= 0),
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    recorded_by VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(company_id, event_id, gate_id)
);

-- Transport Status Tables
CREATE TABLE IF NOT EXISTS transport_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL,
    event_id UUID NOT NULL,
    location VARCHAR(500) NOT NULL,
    postcode VARCHAR(20),
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    radius INTEGER NOT NULL DEFAULT 3 CHECK (radius > 0 AND radius <= 50),
    providers TEXT[], -- Array of provider names
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(company_id, event_id)
);

CREATE TABLE IF NOT EXISTS transport_issues (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL,
    event_id UUID NOT NULL,
    config_id UUID NOT NULL REFERENCES transport_configs(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    description TEXT NOT NULL,
    severity VARCHAR(20) NOT NULL CHECK (severity IN ('low', 'medium', 'high')),
    reported_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    reported_by VARCHAR(255),
    resolved BOOLEAN NOT NULL DEFAULT FALSE,
    resolved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_stands_company_event ON stands(company_id, event_id);
CREATE INDEX IF NOT EXISTS idx_stand_occupancy_company_event ON stand_occupancy(company_id, event_id);
CREATE INDEX IF NOT EXISTS idx_staffing_roles_company_event ON staffing_roles(company_id, event_id);
CREATE INDEX IF NOT EXISTS idx_staffing_actuals_company_event ON staffing_actuals(company_id, event_id);
CREATE INDEX IF NOT EXISTS idx_staffing_forecasts_company_event ON staffing_forecasts(company_id, event_id, discipline);
CREATE INDEX IF NOT EXISTS idx_fixture_tasks_company_event ON fixture_tasks(company_id, event_id);
CREATE INDEX IF NOT EXISTS idx_fixture_completions_company_event ON fixture_completions(company_id, event_id);
CREATE INDEX IF NOT EXISTS idx_gates_company_event ON gates(company_id, event_id);
CREATE INDEX IF NOT EXISTS idx_gate_status_company_event ON gate_status(company_id, event_id);
CREATE INDEX IF NOT EXISTS idx_transport_configs_company_event ON transport_configs(company_id, event_id);
CREATE INDEX IF NOT EXISTS idx_transport_issues_company_event ON transport_issues(company_id, event_id);

-- Update triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_stands_updated_at BEFORE UPDATE ON stands FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_stand_occupancy_updated_at BEFORE UPDATE ON stand_occupancy FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_staffing_roles_updated_at BEFORE UPDATE ON staffing_roles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_staffing_actuals_updated_at BEFORE UPDATE ON staffing_actuals FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_staffing_forecasts_updated_at BEFORE UPDATE ON staffing_forecasts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_fixture_tasks_updated_at BEFORE UPDATE ON fixture_tasks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_fixture_completions_updated_at BEFORE UPDATE ON fixture_completions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_gates_updated_at BEFORE UPDATE ON gates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_gate_status_updated_at BEFORE UPDATE ON gate_status FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_transport_configs_updated_at BEFORE UPDATE ON transport_configs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_transport_issues_updated_at BEFORE UPDATE ON transport_issues FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
