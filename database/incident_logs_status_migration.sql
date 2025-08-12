-- Migration to add status column to incident_logs table
-- This ensures the CollaborationBoard can properly read and update incident statuses

-- Add status column if it doesn't exist
ALTER TABLE incident_logs ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'open';

-- Temporarily disable the attendance status trigger to allow updates
ALTER TABLE incident_logs DISABLE TRIGGER enforce_attendance_status_trigger;

-- Update existing records to have proper status values
-- Set status to 'closed' for incidents that are already marked as closed
UPDATE incident_logs SET status = 'closed' WHERE is_closed = true AND (status IS NULL OR status = 'open');

-- Set status to 'open' for incidents that are not closed and don't have a status
UPDATE incident_logs SET status = 'open' WHERE is_closed = false AND status IS NULL;

-- Clean up any invalid status values (like 'logged') by setting them based on is_closed
UPDATE incident_logs 
SET status = CASE 
    WHEN is_closed = true THEN 'closed'
    ELSE 'open'
END
WHERE status NOT IN ('open', 'in_progress', 'closed') OR status IS NULL;

-- Add check constraint to ensure valid status values
ALTER TABLE incident_logs ADD CONSTRAINT check_incident_status CHECK (status IN ('open', 'in_progress', 'closed'));

-- Add index for efficient status-based queries
CREATE INDEX IF NOT EXISTS idx_incident_logs_status ON incident_logs(status);

-- Re-enable the attendance status trigger
ALTER TABLE incident_logs ENABLE TRIGGER enforce_attendance_status_trigger;
