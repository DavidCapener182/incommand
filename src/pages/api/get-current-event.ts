console.log("DEBUG: process.env.NEXT_PUBLIC_SUPABASE_URL =", process.env.NEXT_PUBLIC_SUPABASE_URL);
console.log("DEBUG: process.env.SUPABASE_SERVICE_ROLE_KEY =", process.env.SUPABASE_SERVICE_ROLE_KEY);

import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY! || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const { data, error } = await supabase
    .from('events')
    .select('id, event_name, event_type')
    .eq('is_current', true)
    .single();
  if (error) return res.status(500).json({ error: error.message });
  if (!data) return res.status(404).json({ error: 'No current event found' });
  return res.status(200).json(data);
} 