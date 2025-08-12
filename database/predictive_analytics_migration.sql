-- Predictive Analytics Database Migration
-- Creates tables for incident risk factors, crowd predictions, and risk scores

-- Create incident_risk_factors table
CREATE TABLE IF NOT EXISTS incident_risk_factors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    factor_type TEXT NOT NULL CHECK (factor_type IN ('weather', 'crowd', 'time', 'location')),
    factor_value JSONB NOT NULL,
    risk_weight NUMERIC(3,2) NOT NULL CHECK (risk_weight >= 0 AND risk_weight <= 1),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create crowd_predictions table
CREATE TABLE IF NOT EXISTS crowd_predictions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    predicted_time TIMESTAMP WITH TIME ZONE NOT NULL,
    predicted_count INTEGER NOT NULL CHECK (predicted_count >= 0),
    confidence_score NUMERIC(3,2) NOT NULL CHECK (confidence_score >= 0 AND confidence_score <= 1),
    factors JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create risk_scores table
CREATE TABLE IF NOT EXISTS risk_scores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    incident_type TEXT,
    location TEXT,
    risk_score NUMERIC(5,2) NOT NULL CHECK (risk_score >= 0 AND risk_score <= 100),
    contributing_factors JSONB NOT NULL,
    valid_until TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create predictive_alerts table
CREATE TABLE IF NOT EXISTS predictive_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    alert_type TEXT NOT NULL CHECK (alert_type IN ('weather', 'crowd', 'risk', 'incident')),
    severity TEXT NOT NULL CHECK (severity IN ('info', 'warning', 'critical')),
    message TEXT NOT NULL,
    recommendations JSONB,
    acknowledged BOOLEAN DEFAULT FALSE,
    acknowledged_by UUID REFERENCES auth.users(id),
    acknowledged_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_incident_risk_factors_event_id ON incident_risk_factors(event_id);
CREATE INDEX IF NOT EXISTS idx_incident_risk_factors_type ON incident_risk_factors(factor_type);
CREATE INDEX IF NOT EXISTS idx_crowd_predictions_event_id ON crowd_predictions(event_id);
CREATE INDEX IF NOT EXISTS idx_crowd_predictions_time ON crowd_predictions(predicted_time);
CREATE INDEX IF NOT EXISTS idx_risk_scores_event_id ON risk_scores(event_id);
CREATE INDEX IF NOT EXISTS idx_risk_scores_score ON risk_scores(risk_score);
CREATE INDEX IF NOT EXISTS idx_risk_scores_valid_until ON risk_scores(valid_until);
CREATE INDEX IF NOT EXISTS idx_predictive_alerts_event_id ON predictive_alerts(event_id);
CREATE INDEX IF NOT EXISTS idx_predictive_alerts_severity ON predictive_alerts(severity);
CREATE INDEX IF NOT EXISTS idx_predictive_alerts_acknowledged ON predictive_alerts(acknowledged);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_incident_risk_factors_updated_at 
    BEFORE UPDATE ON incident_risk_factors 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_crowd_predictions_updated_at 
    BEFORE UPDATE ON crowd_predictions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_risk_scores_updated_at 
    BEFORE UPDATE ON risk_scores 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE incident_risk_factors ENABLE ROW LEVEL SECURITY;
ALTER TABLE crowd_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE risk_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE predictive_alerts ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view incident risk factors for their events" ON incident_risk_factors
    FOR SELECT USING (
        event_id IN (
            SELECT id FROM events WHERE organization_id IN (
                SELECT organization_id FROM user_organizations WHERE user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can view crowd predictions for their events" ON crowd_predictions
    FOR SELECT USING (
        event_id IN (
            SELECT id FROM events WHERE organization_id IN (
                SELECT organization_id FROM user_organizations WHERE user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can view risk scores for their events" ON risk_scores
    FOR SELECT USING (
        event_id IN (
            SELECT id FROM events WHERE organization_id IN (
                SELECT organization_id FROM user_organizations WHERE user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can view predictive alerts for their events" ON predictive_alerts
    FOR SELECT USING (
        event_id IN (
            SELECT id FROM events WHERE organization_id IN (
                SELECT organization_id FROM user_organizations WHERE user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can update predictive alerts for their events" ON predictive_alerts
    FOR UPDATE USING (
        event_id IN (
            SELECT id FROM events WHERE organization_id IN (
                SELECT organization_id FROM user_organizations WHERE user_id = auth.uid()
            )
        )
    );
