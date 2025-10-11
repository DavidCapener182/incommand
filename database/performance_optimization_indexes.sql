-- ============================================================================
-- PERFORMANCE OPTIMIZATION INDEXES
-- Indexes to improve query performance across the inCommand platform
-- ============================================================================

-- ============================================================================
-- INCIDENTS TABLE INDEXES
-- ============================================================================

-- Index for filtering by event_id (most common query pattern)
CREATE INDEX IF NOT EXISTS idx_incidents_event_id 
ON incidents(event_id) 
WHERE event_id IS NOT NULL;

-- Index for filtering by status
CREATE INDEX IF NOT EXISTS idx_incidents_status 
ON incidents(status);

-- Index for filtering by is_closed flag
CREATE INDEX IF NOT EXISTS idx_incidents_is_closed 
ON incidents(is_closed);

-- Index for priority filtering
CREATE INDEX IF NOT EXISTS idx_incidents_priority 
ON incidents(priority);

-- Index for incident type filtering
CREATE INDEX IF NOT EXISTS idx_incidents_incident_type 
ON incidents(incident_type);

-- Composite index for event + status (very common query)
CREATE INDEX IF NOT EXISTS idx_incidents_event_status 
ON incidents(event_id, status) 
WHERE event_id IS NOT NULL;

-- Composite index for event + closed status
CREATE INDEX IF NOT EXISTS idx_incidents_event_closed 
ON incidents(event_id, is_closed) 
WHERE event_id IS NOT NULL;

-- Index for timestamp-based queries (real-time feed)
CREATE INDEX IF NOT EXISTS idx_incidents_created_at 
ON incidents(created_at DESC);

-- Index for updated_at (for sync and change detection)
CREATE INDEX IF NOT EXISTS idx_incidents_updated_at 
ON incidents(updated_at DESC);

-- Composite index for event + time range queries
CREATE INDEX IF NOT EXISTS idx_incidents_event_time 
ON incidents(event_id, created_at DESC) 
WHERE event_id IS NOT NULL;

-- ============================================================================
-- INCIDENT_LOGS TABLE INDEXES
-- ============================================================================

-- Index for incident logs by incident_id (most common query)
CREATE INDEX IF NOT EXISTS idx_incident_logs_incident_id 
ON incident_logs(incident_id);

-- Index for filtering by log type
CREATE INDEX IF NOT EXISTS idx_incident_logs_log_type 
ON incident_logs(log_type);

-- Index for timestamp ordering
CREATE INDEX IF NOT EXISTS idx_incident_logs_timestamp 
ON incident_logs(timestamp DESC);

-- Composite index for incident + timestamp
CREATE INDEX IF NOT EXISTS idx_incident_logs_incident_time 
ON incident_logs(incident_id, timestamp DESC);

-- Index for user activity tracking
CREATE INDEX IF NOT EXISTS idx_incident_logs_created_by 
ON incident_logs(created_by) 
WHERE created_by IS NOT NULL;

-- ============================================================================
-- STAFF TABLE INDEXES
-- ============================================================================

-- Index for filtering by event_id
CREATE INDEX IF NOT EXISTS idx_staff_event_id 
ON staff(event_id) 
WHERE event_id IS NOT NULL;

-- Index for callsign lookups
CREATE INDEX IF NOT EXISTS idx_staff_callsign 
ON staff(callsign);

-- Index for role filtering
CREATE INDEX IF NOT EXISTS idx_staff_role 
ON staff(role);

-- Index for status filtering
CREATE INDEX IF NOT EXISTS idx_staff_status 
ON staff(status);

-- Composite index for event + role
CREATE INDEX IF NOT EXISTS idx_staff_event_role 
ON staff(event_id, role) 
WHERE event_id IS NOT NULL;

-- Index for radio signout tracking
CREATE INDEX IF NOT EXISTS idx_staff_radio_id 
ON staff(current_radio_id) 
WHERE current_radio_id IS NOT NULL;

-- ============================================================================
-- EVENTS TABLE INDEXES
-- ============================================================================

-- Index for filtering by company_id
CREATE INDEX IF NOT EXISTS idx_events_company_id 
ON events(company_id);

-- Index for active events
CREATE INDEX IF NOT EXISTS idx_events_is_active 
ON events(is_active);

-- Index for date range queries
CREATE INDEX IF NOT EXISTS idx_events_start_date 
ON events(start_date DESC);

CREATE INDEX IF NOT EXISTS idx_events_end_date 
ON events(end_date DESC);

-- Composite index for company + active events
CREATE INDEX IF NOT EXISTS idx_events_company_active 
ON events(company_id, is_active);

-- ============================================================================
-- USER_PREFERENCES TABLE INDEXES
-- ============================================================================

-- Index for user_id lookups
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id 
ON user_preferences(user_id);

-- Index for updated_at (cache invalidation)
CREATE INDEX IF NOT EXISTS idx_user_preferences_updated_at 
ON user_preferences(updated_at DESC);

-- ============================================================================
-- NOTIFICATIONS TABLE INDEXES
-- ============================================================================

-- Index for user_id
CREATE INDEX IF NOT EXISTS idx_notifications_user_id 
ON notifications(user_id);

-- Index for read status
CREATE INDEX IF NOT EXISTS idx_notifications_is_read 
ON notifications(is_read);

-- Composite index for user + read status
CREATE INDEX IF NOT EXISTS idx_notifications_user_read 
ON notifications(user_id, is_read);

-- Index for timestamp ordering
CREATE INDEX IF NOT EXISTS idx_notifications_created_at 
ON notifications(created_at DESC);

-- ============================================================================
-- ANALYTICS TABLES INDEXES
-- ============================================================================

-- Pattern Analyses
CREATE INDEX IF NOT EXISTS idx_pattern_analyses_event_id 
ON pattern_analyses(event_id) 
WHERE event_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_pattern_analyses_created_at 
ON pattern_analyses(created_at DESC);

-- Predictive Analytics
CREATE INDEX IF NOT EXISTS idx_predictive_analytics_event_id 
ON predictive_analytics(event_id) 
WHERE event_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_predictive_analytics_prediction_type 
ON predictive_analytics(prediction_type);

-- Benchmarking Results
CREATE INDEX IF NOT EXISTS idx_benchmarking_results_event_id 
ON benchmarking_results(event_id) 
WHERE event_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_benchmarking_results_metric_name 
ON benchmarking_results(metric_name);

-- ============================================================================
-- FULL TEXT SEARCH INDEXES
-- ============================================================================

-- Full text search on incident occurrence
CREATE INDEX IF NOT EXISTS idx_incidents_occurrence_fts 
ON incidents USING gin(to_tsvector('english', occurrence));

-- Full text search on incident notes
CREATE INDEX IF NOT EXISTS idx_incident_logs_notes_fts 
ON incident_logs USING gin(to_tsvector('english', notes));

-- ============================================================================
-- PARTIAL INDEXES FOR PERFORMANCE
-- ============================================================================

-- Index only open incidents (reduces index size)
CREATE INDEX IF NOT EXISTS idx_incidents_open 
ON incidents(event_id, created_at DESC) 
WHERE is_closed = false AND event_id IS NOT NULL;

-- Index only high priority incidents
CREATE INDEX IF NOT EXISTS idx_incidents_high_priority 
ON incidents(event_id, created_at DESC) 
WHERE priority = 'high' AND event_id IS NOT NULL;

-- Index only active staff
CREATE INDEX IF NOT EXISTS idx_staff_active 
ON staff(event_id, callsign) 
WHERE status = 'active' AND event_id IS NOT NULL;

-- Index only unread notifications
CREATE INDEX IF NOT EXISTS idx_notifications_unread 
ON notifications(user_id, created_at DESC) 
WHERE is_read = false;

-- ============================================================================
-- GIN INDEXES FOR JSON COLUMNS
-- ============================================================================

-- Index for metadata JSON columns
CREATE INDEX IF NOT EXISTS idx_incidents_metadata_gin 
ON incidents USING gin(metadata) 
WHERE metadata IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_staff_metadata_gin 
ON staff USING gin(metadata) 
WHERE metadata IS NOT NULL;

-- ============================================================================
-- ANALYZE TABLES FOR QUERY PLANNER
-- ============================================================================

ANALYZE incidents;
ANALYZE incident_logs;
ANALYZE staff;
ANALYZE events;
ANALYZE user_preferences;
ANALYZE notifications;
ANALYZE pattern_analyses;
ANALYZE predictive_analytics;
ANALYZE benchmarking_results;

-- ============================================================================
-- VACUUM FOR MAINTENANCE
-- ============================================================================

VACUUM ANALYZE incidents;
VACUUM ANALYZE incident_logs;
VACUUM ANALYZE staff;

-- ============================================================================
-- NOTES
-- ============================================================================
-- These indexes significantly improve query performance for:
-- 1. Real-time incident feeds filtered by event
-- 2. Status-based incident filtering
-- 3. Time-range queries for analytics
-- 4. Staff lookups by callsign
-- 5. User notification retrieval
-- 6. Full-text search on incident details
--
-- Partial indexes reduce index size while maintaining performance
-- for the most common query patterns.
--
-- Regular ANALYZE ensures the query planner has up-to-date statistics.
