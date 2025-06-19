export async function geocodeAddress(address: string): Promise<{ lat: number; lon: number }> {
  try {
    // Use the full address for geocoding
    const response = await fetch(`/api/geocode?address=${encodeURIComponent(address)}`);
    if (!response.ok) {
      throw new Error('Failed to geocode address');
    }
    const data = await response.json();
    if (!data || data.length === 0) {
      // Default to London coordinates if geocoding fails
      return { lat: 51.5074, lon: -0.1278 };
    }
    return {
      lat: data[0].lat,
      lon: data[0].lon
    };
  } catch (error) {
    console.error('Error geocoding address:', error);
    // Default to London coordinates if there's an error
    return { lat: 51.5074, lon: -0.1278 };
  }
} 