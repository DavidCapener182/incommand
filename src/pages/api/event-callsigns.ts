import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  const { event_id } = req.query;
  if (!event_id || typeof event_id !== 'string') {
    return res.status(400).json({ error: 'Missing event_id' });
  }

  if (req.method === 'GET') {
    // Fetch all callsign assignments for the event
    const { data, error } = await supabase
      .from('event_callsigns')
      .select('*')
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