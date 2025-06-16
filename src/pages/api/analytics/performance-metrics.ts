import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY! || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).end();
  try {
    // Get current event
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('id')
      .eq('is_current', true)
      .single();
    if (eventError || !event) return res.status(400).json({ error: 'No current event found' });
    // Get incidents with timestamps
    const { data, error } = await supabase
      .from('incident_logs')
      .select('timestamp, responded_at, resolved_at, is_closed, updated_at')
      .eq('event_id', event.id);
    if (error) return res.status(400).json({ error: error.message });
    // Calculate averages
    let responseTimes: number[] = [], resolutionTimes: number[] = [];
    for (const inc of data || []) {
      if (inc.responded_at) {
        responseTimes.push(new Date(inc.responded_at).getTime() - new Date(inc.timestamp).getTime());
      }
      // Only use closed incidents for resolution time
      if (inc.is_closed && inc.updated_at) {
        resolutionTimes.push(new Date(inc.updated_at).getTime() - new Date(inc.timestamp).getTime());
      }
    }
    const avg = (arr: number[]): number | null => arr.length ? Math.round(arr.reduce((a: number, b: number) => a + b, 0) / arr.length) : null;
    res.status(200).json({
      avgResponseTimeMs: avg(responseTimes),
      avgResolutionTimeMs: avg(resolutionTimes)
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
} 