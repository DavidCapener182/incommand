import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { lat, lon } = req.query;
  const apiKey = process.env.WHAT3WORDS_API_KEY;

  if (!lat || !lon || !apiKey) {
    return res.status(400).json({ error: 'Missing lat, lon, or API key' });
  }

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