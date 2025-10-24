import { NextApiRequest, NextApiResponse } from 'next';
import { getServiceClient } from '@/lib/supabaseServer';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;
  if (req.method === 'GET') {
    const supabase = getServiceClient();
    const { data, error } = await supabase
      .from('incident_events')
      .select('id, incident_id, event_type, event_data, created_at, created_by')
      .eq('incident_id', id)
      .order('created_at', { ascending: true });
    if (error) return res.status(400).json({ error: error.message });
    return res.status(200).json(data);
  }
  res.status(405).end();
}
