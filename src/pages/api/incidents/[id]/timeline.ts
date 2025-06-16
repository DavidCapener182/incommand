import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;
  if (req.method === 'GET') {
    const { data, error } = await supabase.from('incident_events').select('*').eq('incident_id', id).order('created_at', { ascending: true });
    if (error) return res.status(400).json({ error: error.message });
    return res.status(200).json(data);
  }
  res.status(405).end();
} 