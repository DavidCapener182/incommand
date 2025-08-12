import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { lat, lon, words } = req.query;
  const apiKey = process.env.WHAT3WORDS_API_KEY;

  if (!apiKey) {
    return res.status(400).json({ error: 'Missing API key' });
  }

  // Convert coordinates to what3words
  if (lat && lon) {
    const url = `https://api.what3words.com/v3/convert-to-3wa?coordinates=${lat},${lon}&key=${apiKey}`;

    try {
      const response = await fetch(url);
      if (!response.ok) {
        return res.status(response.status).json({ error: 'Failed to fetch What3Words address' });
      }
      const data = await response.json();
      res.status(200).json({ words: data.words || null });
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
  // Convert what3words to coordinates
  else if (words) {
    const url = `https://api.what3words.com/v3/convert-to-coordinates?words=${encodeURIComponent(words as string)}&key=${apiKey}`;

    try {
      const response = await fetch(url);
      if (!response.ok) {
        return res.status(response.status).json({ error: 'Failed to fetch coordinates' });
      }
      const data = await response.json();
      res.status(200).json({ 
        coordinates: data.coordinates ? {
          lat: data.coordinates.lat,
          lng: data.coordinates.lng
        } : null 
      });
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
  else {
    return res.status(400).json({ error: 'Missing lat/lon or words parameter' });
  }
} 