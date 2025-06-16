import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

function mode(arr: any[]) {
  if (!arr.length) return null;
  const freq: Record<string, number> = {};
  arr.forEach(x => { if (x) freq[x] = (freq[x] || 0) + 1; });
  return Object.entries(freq).sort((a, b) => b[1] - a[1])[0][0];
}

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
    // Get all incidents
    const { data, error } = await supabase
      .from('incident_logs')
      .select('incident_type, location, timestamp')
      .eq('event_id', event.id);
    if (error) return res.status(400).json({ error: error.message });
    // Filter out Attendance and Sit Rep incidents
    const filtered = (data || []).filter(i => i.incident_type !== 'Attendance' && i.incident_type !== 'Sit Rep');
    // Predict most likely next incident type, location, and hour
    const types = filtered.map(i => i.incident_type).filter(Boolean);
    const locations = filtered.map(i => i.location).filter(Boolean);
    const hours = filtered.map(i => i.timestamp && new Date(i.timestamp).getHours()).filter(Boolean);
    res.status(200).json({
      likelyType: mode(types),
      likelyLocation: mode(locations),
      likelyHour: mode(hours)
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
} 