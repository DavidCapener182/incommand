import { NextApiRequest, NextApiResponse } from 'next';
import { getServiceClient } from '@/lib/supabaseServer';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).end();

  const { eventId } = req.query;

  if (!eventId || typeof eventId !== 'string') {
    return res.status(400).json({ error: 'Event ID is required.' });
  }

  try {
    const supabase = getServiceClient();
    // Get incidents with location
    const { data, error } = await supabase
      .from('incident_logs')
      .select('id, location, incident_type, timestamp')
      .eq('event_id', eventId)
      .not('location', 'is', null);
    if (error) return res.status(400).json({ error: error.message });
    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
} 
