import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;
  if (req.method === 'GET') {
    const { data, error } = await supabase.from('incident_attachments').select('*').eq('incident_id', id);
    if (error) return res.status(400).json({ error: error.message });
    return res.status(200).json(data);
  }
  if (req.method === 'POST') {
    const { file_url, file_type, uploaded_by } = req.body;
    const { error } = await supabase.from('incident_attachments').insert([{ incident_id: id, file_url, file_type, uploaded_by }]);
    await supabase.from('incident_events').insert([{ incident_id: id, event_type: 'attachment', event_data: { file_url, file_type }, created_by: uploaded_by }]);
    if (error) return res.status(400).json({ error: error.message });
    return res.status(200).json({ success: true });
  }
  res.status(405).end();
} 