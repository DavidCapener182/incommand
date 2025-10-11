-- Custom Dashboards Migration
-- Enables users to create and save custom dashboard layouts

-- Create custom_dashboards table
CREATE TABLE IF NOT EXISTS public.custom_dashboards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  widgets jsonb NOT NULL DEFAULT '[]'::jsonb,
  is_public boolean DEFAULT false,
  created_by text NOT NULL DEFAULT 'system',
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  CONSTRAINT custom_dashboards_name_check CHECK (char_length(name) >= 1)
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_custom_dashboards_created_by ON public.custom_dashboards(created_by);
CREATE INDEX IF NOT EXISTS idx_custom_dashboards_is_public ON public.custom_dashboards(is_public);
CREATE INDEX IF NOT EXISTS idx_custom_dashboards_updated_at ON public.custom_dashboards(updated_at DESC);

-- Enable RLS (Row Level Security)
ALTER TABLE public.custom_dashboards ENABLE ROW LEVEL SECURITY;

-- Create policies for access control
-- Allow users to view public dashboards or their own dashboards
CREATE POLICY "Users can view public dashboards or their own" ON public.custom_dashboards
  FOR SELECT
  USING (is_public = true OR created_by = current_user);

-- Allow users to insert their own dashboards
CREATE POLICY "Users can create their own dashboards" ON public.custom_dashboards
  FOR INSERT
  WITH CHECK (created_by = current_user);

-- Allow users to update their own dashboards
CREATE POLICY "Users can update their own dashboards" ON public.custom_dashboards
  FOR UPDATE
  USING (created_by = current_user);

-- Allow users to delete their own dashboards
CREATE POLICY "Users can delete their own dashboards" ON public.custom_dashboards
  FOR DELETE
  USING (created_by = current_user);

-- Create a trigger to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_custom_dashboards_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER custom_dashboards_updated_at_trigger
  BEFORE UPDATE ON public.custom_dashboards
  FOR EACH ROW
  EXECUTE FUNCTION update_custom_dashboards_updated_at();

-- Add comments for documentation
COMMENT ON TABLE public.custom_dashboards IS 'Stores custom dashboard layouts created by users';
COMMENT ON COLUMN public.custom_dashboards.id IS 'Unique identifier for the dashboard';
COMMENT ON COLUMN public.custom_dashboards.name IS 'Name of the dashboard';
COMMENT ON COLUMN public.custom_dashboards.description IS 'Optional description of the dashboard';
COMMENT ON COLUMN public.custom_dashboards.widgets IS 'JSON array of dashboard widgets with their configuration';
COMMENT ON COLUMN public.custom_dashboards.is_public IS 'Whether the dashboard is visible to all users';
COMMENT ON COLUMN public.custom_dashboards.created_by IS 'User who created the dashboard';
COMMENT ON COLUMN public.custom_dashboards.created_at IS 'Timestamp when the dashboard was created';
COMMENT ON COLUMN public.custom_dashboards.updated_at IS 'Timestamp when the dashboard was last updated';

