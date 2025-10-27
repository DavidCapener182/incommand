-- Add event_type column to events table for multi-event type dashboard support
-- This migration adds support for different event types: concert, football, festival, parade

ALTER TABLE events
ADD COLUMN event_type TEXT DEFAULT 'concert'
CHECK (event_type IN ('concert', 'football', 'festival', 'parade'));

COMMENT ON COLUMN events.event_type IS 'Type of event for conditional dashboard rendering';

-- Create index for performance on event_type queries
CREATE INDEX IF NOT EXISTS idx_events_event_type ON events(event_type);

-- Update any existing events to have the default 'concert' type (safety measure)
UPDATE events 
SET event_type = 'concert' 
WHERE event_type IS NULL;
