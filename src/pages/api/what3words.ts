import type { NextApiRequest, NextApiResponse } from 'next';

// Helper function to normalize query parameters that may arrive as arrays
function normalizeQueryParam(param: string | string[] | undefined): string | undefined {
  if (Array.isArray(param)) {
    return param[0];
  }
  return param;
}

// Helper function to validate focus format (lat,lon)
function validateFocus(focus: string): boolean {
  const focusPattern = /^-?\d+(\.\d+)?,-?\d+(\.\d+)?$/;
  if (!focusPattern.test(focus)) {
    return false;
  }
  
  const [lat, lon] = focus.split(',').map(Number);
  return lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Comment 5: Restrict the endpoint to GET and return 405 for other methods
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Comment 4: Normalize query params that may arrive as arrays
  const normalizedQuery = {
    lat: normalizeQueryParam(req.query.lat),
    lon: normalizeQueryParam(req.query.lon),
    words: normalizeQueryParam(req.query.words),
    input: normalizeQueryParam(req.query.input),
    focus: normalizeQueryParam(req.query.focus)
  };

  const { lat, lon, words, input, focus } = normalizedQuery;
  const apiKey = process.env.WHAT3WORDS_API_KEY;

  if (!apiKey) {
    return res.status(400).json({ error: 'What3Words API key not configured. Please add WHAT3WORDS_API_KEY to your environment variables.' });
  }

  // Comment 1: Treat empty input as client error instead of proxying to upstream autosuggest
  if (input === '') {
    return res.status(400).json({ error: 'Input parameter cannot be empty' });
  }

  // Comment 2: Validate parameter exclusivity to avoid ambiguous requests
  const hasInput = !!input;
  const hasWords = !!words;
  const hasLatLon = !!(lat && lon);
  
  const paramCount = [hasInput, hasWords, hasLatLon].filter(Boolean).length;
  if (paramCount !== 1) {
    return res.status(400).json({ 
      error: 'Exactly one of input, words, or lat+lon parameters must be provided' 
    });
  }

  // Comment 3: Validate focus format (lat,lon) and bounds
  if (focus && !validateFocus(focus)) {
    return res.status(400).json({ 
      error: 'Focus parameter must be in lat,lon format with valid coordinates' 
    });
  }

  // Autosuggest functionality
  if (input) {
    let url = `https://api.what3words.com/v3/autosuggest?input=${encodeURIComponent(input)}&key=${apiKey}`;
    
    // Add focus parameter if provided
    if (focus) {
      url += `&focus=${encodeURIComponent(focus)}`;
    }

    try {
      const response = await fetch(url);
      if (!response.ok) {
        return res.status(response.status).json({ error: 'Failed to fetch autosuggest results' });
      }
      const data = await response.json();
      res.status(200).json({ suggestions: data.suggestions || [] });
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
  // Convert coordinates to what3words
  else if (lat && lon) {
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
    const url = `https://api.what3words.com/v3/convert-to-coordinates?words=${encodeURIComponent(words)}&key=${apiKey}`;

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
    return res.status(400).json({ error: 'Missing input, lat/lon, or words parameter' });
  }
} 