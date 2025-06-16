import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY! || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).end();
  try {
    // Get current event
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('id')
      .eq('is_current', true)
      .single();
    if (eventError || !event) return res.status(400).json({ error: 'No current event found' });
    // Get incidents with location
    const { data, error } = await supabase
      .from('incident_logs')
      .select('id, location, incident_type, timestamp')
      .eq('event_id', event.id)
      .not('location', 'is', null);
    if (error) return res.status(400).json({ error: error.message });
    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
} 