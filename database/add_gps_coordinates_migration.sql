-- Migration: Add GPS coordinate columns to incident_logs table
-- This migration adds latitude and longitude columns to store GPS coordinates for incidents

-- Add GPS coordinate columns to incident_logs table
ALTER TABLE incident_logs 
ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8),
ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8);

-- Add comments to document the new columns
COMMENT ON COLUMN incident_logs.latitude IS 'GPS latitude coordinate (decimal degrees)';
COMMENT ON COLUMN incident_logs.longitude IS 'GPS longitude coordinate (decimal degrees)';

-- Create index for efficient GPS-based queries
CREATE INDEX IF NOT EXISTS idx_incident_logs_gps_coordinates 
ON incident_logs(latitude, longitude) 
WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

-- Create a function to calculate distance between two GPS coordinates (Haversine formula)
CREATE OR REPLACE FUNCTION calculate_distance(
    lat1 DECIMAL,
    lon1 DECIMAL,
    lat2 DECIMAL,
    lon2 DECIMAL
) RETURNS DECIMAL AS $$
DECLARE
    R DECIMAL := 6371; -- Earth's radius in kilometers
    dlat DECIMAL;
    dlon DECIMAL;
    a DECIMAL;
    c DECIMAL;
BEGIN
    -- Convert degrees to radians
    dlat := RADIANS(lat2 - lat1);
    dlon := RADIANS(lon2 - lon1);
    
    -- Haversine formula
    a := SIN(dlat/2) * SIN(dlat/2) + 
         COS(RADIANS(lat1)) * COS(RADIANS(lat2)) * 
         SIN(dlon/2) * SIN(dlon/2);
    c := 2 * ATAN2(SQRT(a), SQRT(1-a));
    
    RETURN R * c;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Create a function to find incidents within a certain radius
CREATE OR REPLACE FUNCTION find_incidents_within_radius(
    center_lat DECIMAL,
    center_lon DECIMAL,
    radius_km DECIMAL DEFAULT 1.0
) RETURNS TABLE (
    id UUID,
    log_number TEXT,
    incident_type TEXT,
    occurrence TEXT,
    latitude DECIMAL,
    longitude DECIMAL,
    distance_km DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        il.id,
        il.log_number,
        il.incident_type,
        il.occurrence,
        il.latitude,
        il.longitude,
        calculate_distance(center_lat, center_lon, il.latitude, il.longitude) as distance_km
    FROM incident_logs il
    WHERE il.latitude IS NOT NULL 
      AND il.longitude IS NOT NULL
      AND calculate_distance(center_lat, center_lon, il.latitude, il.longitude) <= radius_km
    ORDER BY distance_km ASC;
END;
$$ LANGUAGE plpgsql STABLE;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION calculate_distance(DECIMAL, DECIMAL, DECIMAL, DECIMAL) TO authenticated;
GRANT EXECUTE ON FUNCTION find_incidents_within_radius(DECIMAL, DECIMAL, DECIMAL) TO authenticated;

-- Add a constraint to ensure valid GPS coordinates
ALTER TABLE incident_logs 
ADD CONSTRAINT check_valid_latitude 
CHECK (latitude IS NULL OR (latitude >= -90 AND latitude <= 90));

ALTER TABLE incident_logs 
ADD CONSTRAINT check_valid_longitude 
CHECK (longitude IS NULL OR (longitude >= -180 AND longitude <= 180));
