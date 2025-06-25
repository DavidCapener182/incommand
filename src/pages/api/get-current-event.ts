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
  // First, let's see all events to debug
  const { data: allEvents, error: allError } = await supabase
    .from('events')
    .select('id, event_name, event_type, is_current')
    .limit(5);
  
  console.log('🔍 ALL EVENTS:', allEvents);
  console.log('🔍 ALL EVENTS ERROR:', allError);
  
  const { data, error } = await supabase
    .from('events')
    .select('id, event_name, event_type')
    .eq('is_current', true)
    .single();
  
  console.log('🔍 CURRENT EVENT QUERY RESULT:', data);
  console.log('🔍 CURRENT EVENT QUERY ERROR:', error);
  
  if (error) return res.status(500).json({ error: error.message, debug: { allEvents, allError } });
  if (!data) return res.status(404).json({ error: 'No current event found', debug: { allEvents, allError } });
  return res.status(200).json(data);
} 