-- Migration: Create push notification tables and policies
-- This migration creates the necessary tables for push notification functionality

-- Create push_subscriptions table
CREATE TABLE IF NOT EXISTS push_subscriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    endpoint TEXT NOT NULL,
    p256dh TEXT NOT NULL,
    auth TEXT NOT NULL,
    device_type TEXT,
    browser TEXT,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true
);

-- Create notification_logs table
CREATE TABLE IF NOT EXISTS notification_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    subscription_id UUID REFERENCES push_subscriptions(id) ON DELETE CASCADE,
    notification_type TEXT NOT NULL,
    title TEXT NOT NULL,
    body TEXT,
    data JSONB,
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    delivered_at TIMESTAMP WITH TIME ZONE,
    clicked_at TIMESTAMP WITH TIME ZONE,
    status TEXT DEFAULT 'sent',
    error_message TEXT
);

-- Create notifications table for notification preferences and settings
CREATE TABLE IF NOT EXISTS notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    incident_alerts BOOLEAN DEFAULT true,
    high_priority_alerts BOOLEAN DEFAULT true,
    system_updates BOOLEAN DEFAULT false,
    email_notifications BOOLEAN DEFAULT true,
    push_notifications BOOLEAN DEFAULT true,
    quiet_hours_start TIME DEFAULT '22:00',
    quiet_hours_end TIME DEFAULT '08:00',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user_id ON push_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_endpoint ON push_subscriptions(endpoint);
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_active ON push_subscriptions(is_active);

CREATE INDEX IF NOT EXISTS idx_notification_logs_user_id ON notification_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_logs_subscription_id ON notification_logs(subscription_id);
CREATE INDEX IF NOT EXISTS idx_notification_logs_sent_at ON notification_logs(sent_at);
CREATE INDEX IF NOT EXISTS idx_notification_logs_status ON notification_logs(status);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);

-- Create unique constraints
CREATE UNIQUE INDEX IF NOT EXISTS idx_push_subscriptions_endpoint_unique ON push_subscriptions(endpoint) WHERE is_active = true;
CREATE UNIQUE INDEX IF NOT EXISTS idx_notifications_user_unique ON notifications(user_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_push_subscriptions_updated_at 
    BEFORE UPDATE ON push_subscriptions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notifications_updated_at 
    BEFORE UPDATE ON notifications 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for push_subscriptions
CREATE POLICY "Users can view their own push subscriptions" ON push_subscriptions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own push subscriptions" ON push_subscriptions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own push subscriptions" ON push_subscriptions
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own push subscriptions" ON push_subscriptions
    FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for notification_logs
CREATE POLICY "Users can view their own notification logs" ON notification_logs
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own notification logs" ON notification_logs
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own notification logs" ON notification_logs
    FOR UPDATE USING (auth.uid() = user_id);

-- Create RLS policies for notifications (preferences)
CREATE POLICY "Users can view their own notification preferences" ON notifications
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own notification preferences" ON notifications
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own notification preferences" ON notifications
    FOR UPDATE USING (auth.uid() = user_id);

-- Create function to get user's notification preferences
CREATE OR REPLACE FUNCTION get_user_notification_preferences(user_uuid UUID)
RETURNS TABLE (
    incident_alerts BOOLEAN,
    high_priority_alerts BOOLEAN,
    system_updates BOOLEAN,
    email_notifications BOOLEAN,
    push_notifications BOOLEAN,
    quiet_hours_start TIME,
    quiet_hours_end TIME
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        n.incident_alerts,
        n.high_priority_alerts,
        n.system_updates,
        n.email_notifications,
        n.push_notifications,
        n.quiet_hours_start,
        n.quiet_hours_end
    FROM notifications n
    WHERE n.user_id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get user's active push subscriptions
CREATE OR REPLACE FUNCTION get_user_push_subscriptions(user_uuid UUID)
RETURNS TABLE (
    id UUID,
    endpoint TEXT,
    p256dh TEXT,
    auth TEXT,
    device_type TEXT,
    browser TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ps.id,
        ps.endpoint,
        ps.p256dh,
        ps.auth,
        ps.device_type,
        ps.browser
    FROM push_subscriptions ps
    WHERE ps.user_id = user_uuid AND ps.is_active = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON push_subscriptions TO authenticated;
GRANT ALL ON notification_logs TO authenticated;
GRANT ALL ON notifications TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_notification_preferences(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_push_subscriptions(UUID) TO authenticated;
