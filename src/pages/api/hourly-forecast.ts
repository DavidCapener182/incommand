import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { lat, lon } = req.query;
  const apiKey = process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY;

  if (!lat || !lon || !apiKey) {
    return res.status(400).json({ error: 'Missing lat, lon, or API key' });
  }

  // Use the 5-day/3-hour forecast API
  const url = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${apiKey}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      return res.status(response.status).json({ error: 'Failed to fetch forecast data' });
    }
    const data = await response.json();
    const now = new Date();
    // Round up to the next full hour
    now.setMinutes(0, 0, 0);
    now.setHours(now.getMinutes() > 0 ? now.getHours() + 1 : now.getHours());
    // Build forecast for the next 6 full hours
    const hourly: any[] = [];
    for (let i = 0; i < 6; i++) {
      const target = new Date(now.getTime() + i * 60 * 60 * 1000);
      // Find the closest forecast point
      let closest = null;
      let minDiff = Infinity;
      for (const h of data.list) {
        const dt = new Date(h.dt * 1000);
        const diff = Math.abs(dt.getTime() - target.getTime());
        if (diff < minDiff) {
          minDiff = diff;
          closest = h;
        }
      }
      if (closest) {
        hourly.push({
          time: target.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
          temp: closest.main.temp,
          description: closest.weather[0].description
        });
      }
    }
    res.status(200).json(hourly);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
} 