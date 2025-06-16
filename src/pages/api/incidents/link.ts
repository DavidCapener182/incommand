import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY! || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    const { incident_id, linked_incident_id, created_by } = req.body;
    const { error } = await supabase.from('incident_links').insert([{ incident_id, linked_incident_id }]);
    await supabase.from('incident_events').insert([{ incident_id, event_type: 'link', event_data: { linked_incident_id }, created_by }]);
    if (error) return res.status(400).json({ error: error.message });
    return res.status(200).json({ success: true });
  }
  if (req.method === 'DELETE') {
    const { incident_id, linked_incident_id } = req.body;
    const { error } = await supabase.from('incident_links').delete().match({ incident_id, linked_incident_id });
    if (error) return res.status(400).json({ error: error.message });
    return res.status(200).json({ success: true });
  }
  res.status(405).end();
} 