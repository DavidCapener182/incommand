-- Radio Sign-Out Staff Integration Migration
-- Add staff_id field to radio_signouts table to support staff members

-- Add staff_id column to radio_signouts table
ALTER TABLE radio_signouts 
ADD COLUMN IF NOT EXISTS staff_id UUID REFERENCES staff(id) ON DELETE SET NULL;

-- Add staff_name column for display purposes
ALTER TABLE radio_signouts 
ADD COLUMN IF NOT EXISTS staff_name TEXT;

-- Create index for staff_id
CREATE INDEX IF NOT EXISTS idx_radio_signouts_staff_id ON radio_signouts(staff_id);

-- Update existing records to use staff information if available
-- This is a one-time migration for existing data
UPDATE radio_signouts 
SET staff_name = COALESCE(
  (SELECT full_name FROM staff WHERE staff.id = radio_signouts.staff_id),
  (SELECT full_name FROM profiles WHERE profiles.id = radio_signouts.user_id)
)
WHERE staff_name IS NULL;

-- Add comment
COMMENT ON COLUMN radio_signouts.staff_id IS 'Reference to staff member who signed out the radio';
COMMENT ON COLUMN radio_signouts.staff_name IS 'Staff member name for display purposes';
