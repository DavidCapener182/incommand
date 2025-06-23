import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { eventId } = req.query;

  if (!eventId || typeof eventId !== 'string') {
    return res.status(400).json({ error: 'Event ID is required.' });
  }

  try {
    const { data, error } = await supabase
      .from('debriefs')
      .select('ai_summary, notes, callsign_sheet')
      .eq('event_id', eventId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') { // PostgREST error for "No rows found"
        return res.status(404).json({ summary: '', notes: '', callsignSheet: [] });
      }
      throw error;
    }

    return res.status(200).json({
      summary: data.ai_summary || '',
      notes: data.notes || '',
      callsignSheet: data.callsign_sheet || [],
    });

  } catch (error: any) {
    console.error('Error fetching debrief summary:', error);
    return res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
} 