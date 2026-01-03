import { NextApiRequest, NextApiResponse } from 'next';
import { getServiceSupabaseClient } from '@/lib/supabaseServer';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).end();

  const { eventId } = req.query;

  if (!eventId || typeof eventId !== 'string') {
    return res.status(400).json({ error: 'Event ID is required.' });
  }

  try {
    let supabase: any;
    try {
      supabase = getServiceSupabaseClient() as any;
    } catch (configError) {
      console.error('Supabase configuration error', configError);
      return res.status(500).json({ error: 'Supabase environment variables are not configured' });
    }
    // Get incidents with timestamps
    const { data, error } = await supabase
      .from('incident_logs')
      .select('timestamp, responded_at, resolved_at, is_closed, updated_at')
      .eq('event_id', eventId);
    if (error) return res.status(400).json({ error: error.message });
    // Calculate averages
    let responseTimes: number[] = [], resolutionTimes: number[] = [];
    const incidents = (data ?? []) as Array<{
      timestamp?: string;
      responded_at?: string | null;
      resolved_at?: string | null;
      updated_at?: string | null;
      is_closed?: boolean | null;
    }>;
    if (incidents.length > 0) {
      for (const inc of incidents) {
        const startTime = inc.timestamp ? new Date(inc.timestamp).getTime() : NaN;
        if (Number.isNaN(startTime)) continue;
        if (inc.responded_at) {
          const respondedTime = new Date(inc.responded_at).getTime();
          if (!isNaN(respondedTime)) {
            responseTimes.push(respondedTime - startTime);
          }
        }
        // Only use closed incidents for resolution time
        if (inc.is_closed) {
          const resolutionTimeValue = inc.resolved_at || inc.updated_at;
          if (resolutionTimeValue) {
            const resolutionTime = new Date(resolutionTimeValue).getTime();
            if (!isNaN(resolutionTime)) {
              resolutionTimes.push(resolutionTime - startTime);
            }
          }
        }
      }
    }
    const avg = (arr: number[]): number | null => {
      if (!arr.length) return null;
      const sum = arr.reduce((a, b) => a + b, 0);
      return Math.round(sum / arr.length);
    };
    res.status(200).json({
      avgResponseTimeMs: avg(responseTimes),
      avgResolutionTimeMs: avg(resolutionTimes)
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
} 
