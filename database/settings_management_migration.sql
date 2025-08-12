-- Settings Management System Migration
-- This migration establishes the complete settings management infrastructure

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- System-wide settings table
CREATE TABLE IF NOT EXISTS system_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    maintenance_mode BOOLEAN DEFAULT FALSE,
    maintenance_message TEXT DEFAULT 'System is under maintenance. Please try again later.',
    feature_flags JSONB DEFAULT '{}',
    default_user_role TEXT DEFAULT 'user',
    notification_settings JSONB DEFAULT '{}',
    platform_config JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_by UUID REFERENCES auth.users(id)
);

-- User preferences table for cross-device sync
CREATE TABLE IF NOT EXISTS user_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    theme TEXT DEFAULT 'light' CHECK (theme IN ('light', 'dark', 'auto')),
    dashboard_layout JSONB DEFAULT '{}',
    notification_preferences JSONB DEFAULT '{}',
    ui_preferences JSONB DEFAULT '{}',
    accessibility_settings JSONB DEFAULT '{}',
    privacy_settings JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Notification templates table
CREATE TABLE IF NOT EXISTS notification_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    template_name TEXT NOT NULL,
    subject TEXT NOT NULL,
    body TEXT NOT NULL,
    variables JSONB DEFAULT '[]',
    category TEXT DEFAULT 'general' CHECK (category IN ('incident', 'system', 'user', 'general')),
    is_active BOOLEAN DEFAULT TRUE,
    is_admin_managed BOOLEAN DEFAULT FALSE,
    version INTEGER DEFAULT 1,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Scheduled notifications table
CREATE TABLE IF NOT EXISTS scheduled_notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    template_id UUID REFERENCES notification_templates(id) ON DELETE CASCADE,
    schedule_type TEXT NOT NULL CHECK (schedule_type IN ('one_time', 'recurring', 'conditional')),
    cron_expression TEXT,
    scheduled_at TIMESTAMP WITH TIME ZONE,
    next_run_at TIMESTAMP WITH TIME ZONE,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'cancelled')),
    variables JSONB DEFAULT '{}',
    retry_count INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 3,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Settings audit logs table
CREATE TABLE IF NOT EXISTS settings_audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id),
    table_name TEXT NOT NULL,
    record_id UUID,
    operation TEXT NOT NULL CHECK (operation IN ('INSERT', 'UPDATE', 'DELETE')),
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON user_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_templates_category ON notification_templates(category);
CREATE INDEX IF NOT EXISTS idx_notification_templates_active ON notification_templates(is_active);
CREATE INDEX IF NOT EXISTS idx_scheduled_notifications_user_id ON scheduled_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_notifications_status ON scheduled_notifications(status);
CREATE INDEX IF NOT EXISTS idx_scheduled_notifications_next_run ON scheduled_notifications(next_run_at);
CREATE INDEX IF NOT EXISTS idx_settings_audit_logs_user_id ON settings_audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_settings_audit_logs_table_name ON settings_audit_logs(table_name);
CREATE INDEX IF NOT EXISTS idx_settings_audit_logs_created_at ON settings_audit_logs(created_at);

-- Enable Row Level Security
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduled_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings_audit_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for system_settings
CREATE POLICY "System settings are readable by all authenticated users" ON system_settings
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "System settings are manageable by superadmin only" ON system_settings
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'superadmin'
        )
    );

-- RLS Policies for user_preferences
CREATE POLICY "Users can view their own preferences" ON user_preferences
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own preferences" ON user_preferences
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own preferences" ON user_preferences
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for notification_templates
CREATE POLICY "Templates are readable by all authenticated users" ON notification_templates
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Templates are manageable by admin users" ON notification_templates
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('admin', 'superadmin')
        )
    );

-- RLS Policies for scheduled_notifications
CREATE POLICY "Users can view their own scheduled notifications" ON scheduled_notifications
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own scheduled notifications" ON scheduled_notifications
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Audit logs are readable by admin users" ON settings_audit_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('admin', 'superadmin')
        )
    );

-- Allow inserts when executed by authenticated users, service contexts, or when no JWT is present (e.g., server-side/trigger contexts)
DROP POLICY IF EXISTS "Audit logs inserts via definer funcs" ON settings_audit_logs;
CREATE POLICY "Audit logs inserts (server + auth)" ON settings_audit_logs
  FOR INSERT TO authenticated, anon, service_role
  WITH CHECK (
    -- Standard authenticated requests
    auth.uid() IS NOT NULL
    -- Or server-side contexts without a JWT (e.g., triggers, background jobs)
    OR current_setting('request.jwt.claims', true) IS NULL
    -- Or privileged roles commonly used in server-side operations
    OR current_user IN ('postgres', 'service_role')
  );

-- Database functions for settings management

-- Function to get system settings
CREATE OR REPLACE FUNCTION get_system_settings()
RETURNS TABLE (
    maintenance_mode BOOLEAN,
    maintenance_message TEXT,
    feature_flags JSONB,
    default_user_role TEXT,
    notification_settings JSONB,
    platform_config JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ss.maintenance_mode,
        ss.maintenance_message,
        ss.feature_flags,
        ss.default_user_role,
        ss.notification_settings,
        ss.platform_config
    FROM system_settings ss
    ORDER BY ss.updated_at DESC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user preferences
CREATE OR REPLACE FUNCTION get_user_preferences(user_uuid UUID)
RETURNS TABLE (
    theme TEXT,
    dashboard_layout JSONB,
    notification_preferences JSONB,
    ui_preferences JSONB,
    accessibility_settings JSONB,
    privacy_settings JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        up.theme,
        up.dashboard_layout,
        up.notification_preferences,
        up.ui_preferences,
        up.accessibility_settings,
        up.privacy_settings
    FROM user_preferences up
    WHERE up.user_id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update user preferences
CREATE OR REPLACE FUNCTION update_user_preferences(
    user_uuid UUID,
    new_theme TEXT DEFAULT NULL,
    new_dashboard_layout JSONB DEFAULT NULL,
    new_notification_preferences JSONB DEFAULT NULL,
    new_ui_preferences JSONB DEFAULT NULL,
    new_accessibility_settings JSONB DEFAULT NULL,
    new_privacy_settings JSONB DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
    INSERT INTO user_preferences (
        user_id, 
        theme, 
        dashboard_layout, 
        notification_preferences, 
        ui_preferences, 
        accessibility_settings, 
        privacy_settings
    ) VALUES (
        user_uuid,
        COALESCE(new_theme, 'light'),
        COALESCE(new_dashboard_layout, '{}'),
        COALESCE(new_notification_preferences, '{}'),
        COALESCE(new_ui_preferences, '{}'),
        COALESCE(new_accessibility_settings, '{}'),
        COALESCE(new_privacy_settings, '{}')
    )
    ON CONFLICT (user_id) DO UPDATE SET
        theme = COALESCE(new_theme, user_preferences.theme),
        dashboard_layout = COALESCE(new_dashboard_layout, user_preferences.dashboard_layout),
        notification_preferences = COALESCE(new_notification_preferences, user_preferences.notification_preferences),
        ui_preferences = COALESCE(new_ui_preferences, user_preferences.ui_preferences),
        accessibility_settings = COALESCE(new_accessibility_settings, user_preferences.accessibility_settings),
        privacy_settings = COALESCE(new_privacy_settings, user_preferences.privacy_settings),
        updated_at = NOW();
    
    RETURN TRUE;
EXCEPTION
    WHEN OTHERS THEN
        RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get audit logs
CREATE OR REPLACE FUNCTION get_settings_audit_logs(
    p_user_id UUID DEFAULT NULL,
    p_table_name TEXT DEFAULT NULL,
    p_limit INTEGER DEFAULT 100,
    p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
    id UUID,
    user_id UUID,
    table_name TEXT,
    record_id UUID,
    operation TEXT,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        sal.id,
        sal.user_id,
        sal.table_name,
        sal.record_id,
        sal.operation,
        sal.old_values,
        sal.new_values,
        sal.ip_address,
        sal.user_agent,
        sal.created_at
    FROM settings_audit_logs sal
    WHERE (p_user_id IS NULL OR sal.user_id = p_user_id)
    AND (p_table_name IS NULL OR sal.table_name = p_table_name)
    ORDER BY sal.created_at DESC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger function for audit logging
CREATE OR REPLACE FUNCTION log_settings_changes()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO settings_audit_logs (
            user_id,
            table_name,
            record_id,
            operation,
            new_values
        ) VALUES (
            COALESCE(auth.uid(), NEW.updated_by),
            TG_TABLE_NAME,
            NEW.id,
            'INSERT',
            to_jsonb(NEW)
        );
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO settings_audit_logs (
            user_id,
            table_name,
            record_id,
            operation,
            old_values,
            new_values
        ) VALUES (
            COALESCE(auth.uid(), NEW.updated_by),
            TG_TABLE_NAME,
            NEW.id,
            'UPDATE',
            to_jsonb(OLD),
            to_jsonb(NEW)
        );
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO settings_audit_logs (
            user_id,
            table_name,
            record_id,
            operation,
            old_values
        ) VALUES (
            COALESCE(auth.uid(), OLD.updated_by),
            TG_TABLE_NAME,
            OLD.id,
            'DELETE',
            to_jsonb(OLD)
        );
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers for audit logging
CREATE TRIGGER audit_system_settings_changes
    AFTER INSERT OR UPDATE OR DELETE ON system_settings
    FOR EACH ROW EXECUTE FUNCTION log_settings_changes();

CREATE TRIGGER audit_user_preferences_changes
    AFTER INSERT OR UPDATE OR DELETE ON user_preferences
    FOR EACH ROW EXECUTE FUNCTION log_settings_changes();

CREATE TRIGGER audit_notification_templates_changes
    AFTER INSERT OR UPDATE OR DELETE ON notification_templates
    FOR EACH ROW EXECUTE FUNCTION log_settings_changes();

CREATE TRIGGER audit_scheduled_notifications_changes
    AFTER INSERT OR UPDATE OR DELETE ON scheduled_notifications
    FOR EACH ROW EXECUTE FUNCTION log_settings_changes();

-- Insert default system settings
INSERT INTO system_settings (
    maintenance_mode,
    maintenance_message,
    feature_flags,
    default_user_role,
    notification_settings,
    platform_config
) VALUES (
    FALSE,
    'System is under maintenance. Please try again later.',
    '{"ai_insights": true, "predictive_analytics": true, "social_media_monitoring": true, "advanced_notifications": false}',
    'user',
    '{"email_enabled": true, "push_enabled": true, "sms_enabled": false, "quiet_hours": {"enabled": false, "start": "22:00", "end": "08:00"}}',
    '{"max_file_upload_size": 10485760, "session_timeout": 3600, "max_login_attempts": 5}'
) ON CONFLICT DO NOTHING;

-- Insert default notification templates
INSERT INTO notification_templates (
    template_name,
    subject,
    body,
    variables,
    category,
    is_admin_managed
) VALUES 
(
    'incident_alert',
    'New Incident Reported - {{incident_type}}',
    'A new {{incident_type}} incident has been reported at {{venue_name}}.\n\nIncident ID: {{incident_id}}\nLocation: {{location}}\nPriority: {{priority}}\n\nPlease review and take appropriate action.',
    '["incident_type", "venue_name", "incident_id", "location", "priority"]',
    'incident',
    TRUE
),
(
    'system_maintenance',
    'System Maintenance Notice',
    'The system will be under maintenance from {{start_time}} to {{end_time}}.\n\nReason: {{reason}}\n\nWe apologize for any inconvenience.',
    '["start_time", "end_time", "reason"]',
    'system',
    TRUE
),
(
    'daily_report',
    'Daily Activity Report - {{date}}',
    'Here is your daily activity summary for {{date}}:\n\n- Total Incidents: {{total_incidents}}\n- Resolved: {{resolved_incidents}}\n- Pending: {{pending_incidents}}\n\nThank you for your service.',
    '["date", "total_incidents", "resolved_incidents", "pending_incidents"]',
    'user',
    FALSE
) ON CONFLICT DO NOTHING;

-- Additional tables for backups, restore jobs, and notification queue

-- Backups table
CREATE TABLE IF NOT EXISTS backups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    size BIGINT DEFAULT 0,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('completed','failed','in_progress')),
    type TEXT NOT NULL DEFAULT 'full' CHECK (type IN ('full','partial')),
    tables TEXT[] DEFAULT '{}',
    "userId" UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Restore jobs table
CREATE TABLE IF NOT EXISTS restore_jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "backupId" UUID REFERENCES backups(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','in_progress','completed','failed')),
    progress INTEGER NOT NULL DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    "startedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "completedAt" TIMESTAMPTZ,
    "errorMessage" TEXT,
    "userId" UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Notification queue table
CREATE TABLE IF NOT EXISTS notification_queue (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "scheduledNotificationId" UUID,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','sent','failed')),
    "scheduledFor" TIMESTAMPTZ NOT NULL,
    "sentAt" TIMESTAMPTZ,
    "errorMessage" TEXT,
    "userId" UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_backups_user ON backups("userId");
CREATE INDEX IF NOT EXISTS idx_backups_created_at ON backups("createdAt");
CREATE INDEX IF NOT EXISTS idx_restore_jobs_user ON restore_jobs("userId");
CREATE INDEX IF NOT EXISTS idx_restore_jobs_started_at ON restore_jobs("startedAt");
CREATE INDEX IF NOT EXISTS idx_notification_queue_user ON notification_queue("userId");
CREATE INDEX IF NOT EXISTS idx_notification_queue_scheduled_for ON notification_queue("scheduledFor");

-- Enable RLS
ALTER TABLE backups ENABLE ROW LEVEL SECURITY;
ALTER TABLE restore_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_queue ENABLE ROW LEVEL SECURITY;

-- RLS: backups - users can manage their own backups
DROP POLICY IF EXISTS "Backups are selectable by owner" ON backups;
CREATE POLICY "Backups are selectable by owner" ON backups
  FOR SELECT USING (auth.uid() = "userId");

DROP POLICY IF EXISTS "Backups are insertable by owner" ON backups;
CREATE POLICY "Backups are insertable by owner" ON backups
  FOR INSERT WITH CHECK (auth.uid() = "userId");

DROP POLICY IF EXISTS "Backups are updatable by owner" ON backups;
CREATE POLICY "Backups are updatable by owner" ON backups
  FOR UPDATE USING (auth.uid() = "userId");

DROP POLICY IF EXISTS "Backups are deletable by owner" ON backups;
CREATE POLICY "Backups are deletable by owner" ON backups
  FOR DELETE USING (auth.uid() = "userId");

-- RLS: restore_jobs - users can view and manage their own restore jobs
DROP POLICY IF EXISTS "Restore jobs are selectable by owner" ON restore_jobs;
CREATE POLICY "Restore jobs are selectable by owner" ON restore_jobs
  FOR SELECT USING (auth.uid() = "userId");

DROP POLICY IF EXISTS "Restore jobs are insertable by owner" ON restore_jobs;
CREATE POLICY "Restore jobs are insertable by owner" ON restore_jobs
  FOR INSERT WITH CHECK (auth.uid() = "userId");

DROP POLICY IF EXISTS "Restore jobs are updatable by owner" ON restore_jobs;
CREATE POLICY "Restore jobs are updatable by owner" ON restore_jobs
  FOR UPDATE USING (auth.uid() = "userId");

-- RLS: notification_queue - users can view their queued notifications
DROP POLICY IF EXISTS "Notification queue is selectable by owner" ON notification_queue;
CREATE POLICY "Notification queue is selectable by owner" ON notification_queue
  FOR SELECT USING (auth.uid() = "userId");

