import { NextApiRequest, NextApiResponse } from 'next';
import { getServiceClient } from '@/lib/supabaseServer';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;
  const supabase = getServiceClient();
  if (req.method === 'GET') {
    const { data, error } = await supabase
      .from('incident_attachments')
      .select('id, incident_id, file_url, file_type, uploaded_by, created_at')
      .eq('incident_id', id);
    if (error) return res.status(400).json({ error: error.message });
    return res.status(200).json(data);
  }
  if (req.method === 'POST') {
    const { file_url, file_type, uploaded_by } = req.body;
    const { error } = await supabase
      .from('incident_attachments')
      .insert([{ incident_id: id, file_url, file_type, uploaded_by }]);
    if (error) return res.status(400).json({ error: error.message });

    const { error: eventError } = await supabase.from('incident_events').insert([
      { incident_id: id, event_type: 'attachment', event_data: { file_url, file_type }, created_by: uploaded_by },
    ]);
    if (eventError) return res.status(400).json({ error: eventError.message });

    return res.status(200).json({ success: true });
  }
  res.status(405).end();
}
