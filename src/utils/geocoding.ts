export async function geocodeAddress(address: string): Promise<{ lat: number; lon: number }> {
  try {
    const response = await fetch(
      `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(address)}&limit=1&appid=${process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY}`
    );

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