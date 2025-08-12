-- Incident Assignment and Escalation Migration
-- Adds automated assignment, escalation timers, and dependency tracking

-- Add assignment and escalation columns to incident_logs table
ALTER TABLE incident_logs 
ADD COLUMN assigned_staff_ids UUID[] DEFAULT '{}',
ADD COLUMN escalation_level INTEGER DEFAULT 0,
ADD COLUMN escalate_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN escalated BOOLEAN DEFAULT false,
ADD COLUMN dependencies UUID[] DEFAULT '{}',
ADD COLUMN auto_assigned BOOLEAN DEFAULT false,
ADD COLUMN escalation_notes TEXT,
ADD COLUMN assignment_notes TEXT;

-- Create incident escalations tracking table
CREATE TABLE incident_escalations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    incident_id UUID REFERENCES incident_logs(id) ON DELETE CASCADE,
    escalation_level INTEGER NOT NULL,
    escalated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    escalated_by UUID REFERENCES staff(id),
    supervisor_notified BOOLEAN DEFAULT false,
    resolution_time INTERVAL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create escalation SLA configuration table
CREATE TABLE escalation_sla_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    incident_type VARCHAR(100) NOT NULL,
    priority_level VARCHAR(50) NOT NULL,
    escalation_timeout_minutes INTEGER NOT NULL,
    escalation_levels INTEGER DEFAULT 3,
    supervisor_roles TEXT[] DEFAULT '{}',
    auto_escalate BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(incident_type, priority_level)
);

-- Create staff assignment history table
CREATE TABLE staff_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    incident_id UUID REFERENCES incident_logs(id) ON DELETE CASCADE,
    staff_id UUID REFERENCES staff(id) ON DELETE CASCADE,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    unassigned_at TIMESTAMP WITH TIME ZONE,
    assigned_by UUID REFERENCES staff(id),
    assignment_type VARCHAR(50) DEFAULT 'auto', -- 'auto', 'manual', 'reassigned'
    assignment_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for efficient queries
CREATE INDEX idx_incident_logs_escalate_at ON incident_logs(escalate_at) WHERE escalated = false;
CREATE INDEX idx_incident_logs_assigned_staff ON incident_logs USING GIN(assigned_staff_ids);
CREATE INDEX idx_incident_logs_dependencies ON incident_logs USING GIN(dependencies);
CREATE INDEX idx_incident_logs_escalation_level ON incident_logs(escalation_level);
CREATE INDEX idx_incident_escalations_incident_id ON incident_escalations(incident_id);
CREATE INDEX idx_incident_escalations_escalated_at ON incident_escalations(escalated_at);
CREATE INDEX idx_staff_assignments_incident_id ON staff_assignments(incident_id);
CREATE INDEX idx_staff_assignments_staff_id ON staff_assignments(staff_id);
CREATE INDEX idx_staff_assignments_active ON staff_assignments(staff_id) WHERE unassigned_at IS NULL;

-- Insert default escalation SLA configurations
INSERT INTO escalation_sla_config (incident_type, priority_level, escalation_timeout_minutes, escalation_levels, supervisor_roles) VALUES
('medical', 'urgent', 2, 3, ARRAY['supervisor', 'manager']),
('medical', 'high', 5, 3, ARRAY['supervisor']),
('medical', 'medium', 15, 2, ARRAY['supervisor']),
('medical', 'low', 30, 1, ARRAY['supervisor']),
('security', 'urgent', 1, 3, ARRAY['supervisor', 'manager', 'security_lead']),
('security', 'high', 3, 3, ARRAY['supervisor', 'security_lead']),
('security', 'medium', 10, 2, ARRAY['supervisor']),
('security', 'low', 20, 1, ARRAY['supervisor']),
('technical', 'urgent', 5, 3, ARRAY['supervisor', 'technical_lead']),
('technical', 'high', 10, 2, ARRAY['supervisor']),
('technical', 'medium', 20, 1, ARRAY['supervisor']),
('technical', 'low', 45, 1, ARRAY['supervisor']),
('general', 'urgent', 3, 3, ARRAY['supervisor', 'manager']),
('general', 'high', 8, 2, ARRAY['supervisor']),
('general', 'medium', 15, 1, ARRAY['supervisor']),
('general', 'low', 30, 1, ARRAY['supervisor']);

-- Create function to update escalation timestamp
CREATE OR REPLACE FUNCTION update_incident_escalation_time()
RETURNS TRIGGER AS $$
BEGIN
    -- Calculate escalation time based on incident type and priority
    SELECT NOW() + (escalation_timeout_minutes || ' minutes')::INTERVAL
    INTO NEW.escalate_at
    FROM escalation_sla_config
    WHERE incident_type = NEW.incident_type
    AND priority_level = NEW.priority
    LIMIT 1;
    
    -- Default to 15 minutes if no SLA config found
    IF NEW.escalate_at IS NULL THEN
        NEW.escalate_at = NOW() + INTERVAL '15 minutes';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically set escalation time on incident creation
CREATE TRIGGER trigger_update_escalation_time
    BEFORE INSERT ON incident_logs
    FOR EACH ROW
    EXECUTE FUNCTION update_incident_escalation_time();

-- Create function to log staff assignments
CREATE OR REPLACE FUNCTION log_staff_assignment()
RETURNS TRIGGER AS $$
BEGIN
    -- Log new assignments
    IF TG_OP = 'UPDATE' AND OLD.assigned_staff_ids IS DISTINCT FROM NEW.assigned_staff_ids THEN
        -- Log unassignments
        INSERT INTO staff_assignments (incident_id, staff_id, unassigned_at, assigned_by, assignment_type)
        SELECT NEW.id, staff_id, NOW(), NEW.updated_by, 'reassigned'
        FROM unnest(OLD.assigned_staff_ids) AS staff_id
        WHERE staff_id NOT IN (SELECT unnest(NEW.assigned_staff_ids));
        
        -- Log new assignments
        INSERT INTO staff_assignments (incident_id, staff_id, assigned_by, assignment_type)
        SELECT NEW.id, staff_id, NEW.updated_by, 
               CASE WHEN NEW.auto_assigned THEN 'auto' ELSE 'manual' END
        FROM unnest(NEW.assigned_staff_ids) AS staff_id
        WHERE staff_id NOT IN (SELECT unnest(OLD.assigned_staff_ids));
    ELSIF TG_OP = 'INSERT' AND NEW.assigned_staff_ids IS NOT NULL AND array_length(NEW.assigned_staff_ids, 1) > 0 THEN
        -- Log initial assignments
        INSERT INTO staff_assignments (incident_id, staff_id, assigned_by, assignment_type)
        SELECT NEW.id, staff_id, NEW.created_by,
               CASE WHEN NEW.auto_assigned THEN 'auto' ELSE 'manual' END
        FROM unnest(NEW.assigned_staff_ids) AS staff_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to log staff assignments
CREATE TRIGGER trigger_log_staff_assignment
    AFTER INSERT OR UPDATE ON incident_logs
    FOR EACH ROW
    EXECUTE FUNCTION log_staff_assignment();

-- Create function to check for circular dependencies
CREATE OR REPLACE FUNCTION check_circular_dependencies()
RETURNS TRIGGER AS $$
DECLARE
    dependency_chain UUID[] := ARRAY[NEW.id];
    current_incident UUID;
    dependent_incidents UUID[];
BEGIN
    -- Check if adding this dependency would create a circular reference
    current_incident := NEW.id;
    
    LOOP
        -- Get incidents that depend on the current incident
        SELECT array_agg(id) INTO dependent_incidents
        FROM incident_logs
        WHERE id = ANY(
            SELECT unnest(dependencies)
            FROM incident_logs
            WHERE id = current_incident
        );
        
        -- If no dependents, no circular reference
        IF dependent_incidents IS NULL OR array_length(dependent_incidents, 1) = 0 THEN
            EXIT;
        END IF;
        
        -- Check if any dependent is in our chain (circular reference)
        IF current_incident = ANY(dependent_incidents) THEN
            RAISE EXCEPTION 'Circular dependency detected: incident % depends on itself', current_incident;
        END IF;
        
        -- Add dependents to chain and continue checking
        dependency_chain := dependency_chain || dependent_incidents;
        current_incident := dependent_incidents[1];
    END LOOP;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to prevent circular dependencies
CREATE TRIGGER trigger_check_circular_dependencies
    BEFORE INSERT OR UPDATE ON incident_logs
    FOR EACH ROW
    EXECUTE FUNCTION check_circular_dependencies();

-- Enable Row Level Security on new tables
ALTER TABLE incident_escalations ENABLE ROW LEVEL SECURITY;
ALTER TABLE escalation_sla_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_assignments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for incident_escalations
CREATE POLICY "Users can view escalations for their events" ON incident_escalations
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM incident_logs il
            JOIN events e ON il.event_id = e.id
            JOIN event_staff es ON e.id = es.event_id
            WHERE il.id = incident_escalations.incident_id
            AND es.staff_id = auth.uid()
        )
    );

CREATE POLICY "Supervisors can manage escalations" ON incident_escalations
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM staff s
            WHERE s.id = auth.uid()
            AND s.role IN ('supervisor', 'manager', 'admin')
        )
    );

-- Create RLS policies for escalation_sla_config
CREATE POLICY "All authenticated users can view SLA config" ON escalation_sla_config
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Only admins can modify SLA config" ON escalation_sla_config
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM staff s
            WHERE s.id = auth.uid()
            AND s.role = 'admin'
        )
    );

-- Create RLS policies for staff_assignments
CREATE POLICY "Users can view assignments for their events" ON staff_assignments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM incident_logs il
            JOIN events e ON il.event_id = e.id
            JOIN event_staff es ON e.id = es.event_id
            WHERE il.id = staff_assignments.incident_id
            AND es.staff_id = auth.uid()
        )
    );

CREATE POLICY "Supervisors can manage assignments" ON staff_assignments
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM staff s
            WHERE s.id = auth.uid()
            AND s.role IN ('supervisor', 'manager', 'admin')
        )
    );

-- Add comments for documentation
COMMENT ON TABLE incident_escalations IS 'Tracks escalation events for incidents';
COMMENT ON TABLE escalation_sla_config IS 'Configuration for escalation timeouts by incident type and priority';
COMMENT ON TABLE staff_assignments IS 'Historical record of staff assignments to incidents';
COMMENT ON COLUMN incident_logs.assigned_staff_ids IS 'Array of staff IDs assigned to this incident';
COMMENT ON COLUMN incident_logs.escalation_level IS 'Current escalation level (0 = normal, 1+ = escalated)';
COMMENT ON COLUMN incident_logs.escalate_at IS 'Timestamp when incident should escalate';
COMMENT ON COLUMN incident_logs.escalated IS 'Whether incident has been escalated';
COMMENT ON COLUMN incident_logs.dependencies IS 'Array of incident IDs this incident depends on';
COMMENT ON COLUMN incident_logs.auto_assigned IS 'Whether staff were auto-assigned';

-- ============================================================================
-- ROLLBACK PROCEDURES
-- ============================================================================
-- Execute these statements in reverse order to safely rollback the migration

-- Rollback: Drop RLS policies (in reverse order of creation)
DROP POLICY IF EXISTS "Supervisors can manage assignments" ON staff_assignments;
DROP POLICY IF EXISTS "Users can view assignments for their events" ON staff_assignments;
DROP POLICY IF EXISTS "Only admins can modify SLA config" ON escalation_sla_config;
DROP POLICY IF EXISTS "All authenticated users can view SLA config" ON escalation_sla_config;
DROP POLICY IF EXISTS "Supervisors can manage escalations" ON incident_escalations;
DROP POLICY IF EXISTS "Users can view escalations for their events" ON incident_escalations;

-- Rollback: Disable RLS on tables
ALTER TABLE staff_assignments DISABLE ROW LEVEL SECURITY;
ALTER TABLE escalation_sla_config DISABLE ROW LEVEL SECURITY;
ALTER TABLE incident_escalations DISABLE ROW LEVEL SECURITY;

-- Rollback: Drop triggers (in reverse order of creation)
DROP TRIGGER IF EXISTS trigger_check_circular_dependencies ON incident_logs;
DROP TRIGGER IF EXISTS trigger_log_staff_assignment ON incident_logs;
DROP TRIGGER IF EXISTS trigger_update_escalation_time ON incident_logs;

-- Rollback: Drop functions (in reverse order of creation)
DROP FUNCTION IF EXISTS check_circular_dependencies();
DROP FUNCTION IF EXISTS log_staff_assignment();
DROP FUNCTION IF EXISTS update_incident_escalation_time();

-- Rollback: Drop indexes (in reverse order of creation)
DROP INDEX IF EXISTS idx_staff_assignments_active;
DROP INDEX IF EXISTS idx_staff_assignments_staff_id;
DROP INDEX IF EXISTS idx_staff_assignments_incident_id;
DROP INDEX IF EXISTS idx_incident_escalations_escalated_at;
DROP INDEX IF EXISTS idx_incident_escalations_incident_id;
DROP INDEX IF EXISTS idx_incident_logs_escalation_level;
DROP INDEX IF EXISTS idx_incident_logs_dependencies;
DROP INDEX IF EXISTS idx_incident_logs_assigned_staff;
DROP INDEX IF EXISTS idx_incident_logs_escalate_at;

-- Rollback: Drop tables (in reverse dependency order)
DROP TABLE IF EXISTS staff_assignments CASCADE;
DROP TABLE IF EXISTS escalation_sla_config CASCADE;
DROP TABLE IF EXISTS incident_escalations CASCADE;

-- Rollback: Remove columns from incident_logs table
ALTER TABLE incident_logs 
DROP COLUMN IF EXISTS assigned_staff_ids,
DROP COLUMN IF EXISTS escalation_level,
DROP COLUMN IF EXISTS escalate_at,
DROP COLUMN IF EXISTS escalated,
DROP COLUMN IF EXISTS dependencies,
DROP COLUMN IF EXISTS auto_assigned,
DROP COLUMN IF EXISTS escalation_notes,
DROP COLUMN IF EXISTS assignment_notes;

-- Rollback: Remove comments (optional - comments don't affect functionality)
COMMENT ON TABLE incident_escalations IS NULL;
COMMENT ON TABLE escalation_sla_config IS NULL;
COMMENT ON TABLE staff_assignments IS NULL;
