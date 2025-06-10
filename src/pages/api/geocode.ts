import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { address } = req.query;
  const apiKey = process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY;

  if (!address || !apiKey) {
    return res.status(400).json({ error: 'Missing address or API key' });
  }

  const url = `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(address as string)}&limit=1&appid=${apiKey}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      return res.status(response.status).json({ error: 'Failed to fetch geocode data' });
    }
    const data = await response.json();
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
} 