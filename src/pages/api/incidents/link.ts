import { NextApiRequest, NextApiResponse } from 'next';
import { getServiceClient } from '@/lib/supabaseServer';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const supabase = getServiceClient() as any;

  if (req.method === 'POST') {
    const { incident_id, linked_incident_id, created_by } = req.body;
    const { error } = await supabase.from('incident_links').insert([{ incident_id, linked_incident_id }]);
    if (error) return res.status(400).json({ error: error.message });

    const { error: eventError } = await supabase.from('incident_events').insert([
      { incident_id, event_type: 'link', event_data: { linked_incident_id }, created_by },
    ]);
    if (eventError) return res.status(400).json({ error: eventError.message });

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
