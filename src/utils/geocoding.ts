export async function geocodeAddress(address: string): Promise<{ lat: number; lon: number }> {
  try {
    let city = address;
    // If the address contains 'Liverpool', use 'Liverpool' as the city
    if (address.toLowerCase().includes('liverpool')) {
      city = 'Liverpool';
    } else {
      // Try to extract the city (second last comma-separated part)
      const parts = address.split(',').map(p => p.trim());
      if (parts.length >= 2) {
        city = parts[parts.length - 2];
      }
    }
    const response = await fetch(`/api/geocode?address=${encodeURIComponent(city)}`);
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