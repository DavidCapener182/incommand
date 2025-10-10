-- Incident Photos Migration
-- Stores photos/media attachments for incidents

-- Create incident_photos table
CREATE TABLE IF NOT EXISTS incident_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id UUID NOT NULL REFERENCES incident_logs(id) ON DELETE CASCADE,
  photo_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  file_type TEXT NOT NULL,
  captured_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  description TEXT,
  uploaded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_incident_photos_incident_id ON incident_photos(incident_id);
CREATE INDEX IF NOT EXISTS idx_incident_photos_captured_at ON incident_photos(captured_at);
CREATE INDEX IF NOT EXISTS idx_incident_photos_uploaded_by ON incident_photos(uploaded_by);

-- Enable Row Level Security
ALTER TABLE incident_photos ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Allow authenticated users to view photos
CREATE POLICY "Allow authenticated users to view photos"
  ON incident_photos FOR SELECT
  TO authenticated
  USING (true);

-- Allow authenticated users to insert photos
CREATE POLICY "Allow authenticated users to insert photos"
  ON incident_photos FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Allow users to update their own photos
CREATE POLICY "Allow users to update own photos"
  ON incident_photos FOR UPDATE
  TO authenticated
  USING (uploaded_by = auth.uid());

-- Allow users to delete their own photos
CREATE POLICY "Allow users to delete own photos"
  ON incident_photos FOR DELETE
  TO authenticated
  USING (uploaded_by = auth.uid());

-- Create storage bucket for incident photos (if not exists)
-- Note: This must be run separately in Supabase Dashboard > Storage
-- Bucket name: incident-photos
-- Public: true (for easy access)
-- File size limit: 10MB
-- Allowed MIME types: image/*

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_incident_photos_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
DROP TRIGGER IF EXISTS update_incident_photos_updated_at ON incident_photos;
CREATE TRIGGER update_incident_photos_updated_at
  BEFORE UPDATE ON incident_photos
  FOR EACH ROW
  EXECUTE FUNCTION update_incident_photos_updated_at();

-- Add comment
COMMENT ON TABLE incident_photos IS 'Stores photos and media attachments for incident logs with metadata and geolocation';
