import type { NextApiRequest, NextApiResponse } from 'next';
import { getServiceClient } from '@/lib/supabaseServer';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const supabase = getServiceClient() as any;
  const { event_id } = req.query;
  if (!event_id || typeof event_id !== 'string') {
    return res.status(400).json({ error: 'Missing event_id' });
  }

  if (req.method === 'GET') {
    // Fetch all callsign assignments for the event
    const { data, error } = await supabase
      .from('event_callsigns')
      .select('id, event_id, callsign, position, assigned_name, role, updated_at')
      .eq('event_id', event_id);
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data);
  }

  if (req.method === 'POST' || req.method === 'PUT') {
    const assignments = req.body;
    if (!Array.isArray(assignments)) {
      return res.status(400).json({ error: 'Assignments must be an array' });
    }
    // Upsert assignments
    const { data, error } = await supabase
      .from('event_callsigns')
      .upsert(assignments, { onConflict: 'id' });
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data);
  }

  return res.status(405).json({ error: 'Method not allowed' });
} 
