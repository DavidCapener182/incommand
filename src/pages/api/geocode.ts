import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { address } = req.query;
  const apiKey = process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY;

  if (!address || !apiKey) {
    return res.status(400).json({ error: 'Missing address or API key' });
  }

  // Helper to call OpenWeatherMap geocoding
  async function fetchGeocode(addr: string) {
    const url = `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(addr)}&limit=1&appid=${apiKey}`;
    const response = await fetch(url);
    if (!response.ok) return [];
    return await response.json();
  }

  // Try full address first
  let data = await fetchGeocode(address as string);

  // If no result, try a simplified address (venue name and city only)
  if ((!Array.isArray(data) || data.length === 0) && typeof address === 'string') {
    // Try to extract venue name and city (assume comma-separated, take first two parts)
    const parts = address.split(',').map(p => p.trim());
    if (parts.length >= 2) {
      const simplified = parts[0] + ', ' + parts[1];
      data = await fetchGeocode(simplified);
    }
  }

  res.status(200).json(data);
} 