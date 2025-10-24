import { NextApiRequest, NextApiResponse } from 'next';
import { getServiceClient } from '@/lib/supabaseServer';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).end();
  try {
    const supabase = getServiceClient();
    // Get current event
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('id')
      .eq('is_current', true)
      .single();
    if (eventError || !event) return res.status(400).json({ error: 'No current event found' });
    // Get callsign assignments for the event
    const { data, error } = await supabase
      .from('callsign_assignments')
      .select('callsign, position, assigned_name')
      .eq('event_id', event.id);
    if (error) return res.status(400).json({ error: error.message });
    return res.status(200).json(data);
  } catch (e) {
    return res.status(500).json({ error: 'Internal server error' });
  }
} 
