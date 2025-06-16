import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY! || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).end();
  try {
    // Get current event
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('id, event_name')
      .eq('is_current', true)
      .single();
    if (eventError || !event) return res.status(400).json({ error: 'No current event found' });
    // Get all incidents
    const { data: incidents, error } = await supabase
      .from('incident_logs')
      .select('*')
      .eq('event_id', event.id);
    if (error) return res.status(400).json({ error: error.message });
    // Get callsign assignments with join to callsign_roles
    const { data: callsignSheet, error: callsignError } = await supabase
      .from('callsign_assignments')
      .select('assigned_name, callsign_role_id, callsign_roles(callsign, position)')
      .eq('event_id', event.id);
    if (callsignError) return res.status(400).json({ error: callsignError.message });
    // Flatten the callsign sheet
    const callsignSheetFlat = (callsignSheet || []).map((row: any) => ({
      callsign: row.callsign_roles?.callsign || '',
      position: row.callsign_roles?.position || '',
      assigned_name: row.assigned_name || '',
    }));
    // Summarise incidents
    const typeCounts = {} as Record<string, number>;
    let resolved = 0;
    let total = 0;
    incidents.forEach((inc: any) => {
      typeCounts[inc.incident_type] = (typeCounts[inc.incident_type] || 0) + 1;
      if (inc.is_closed) resolved++;
      total++;
    });
    const topTypes = Object.entries(typeCounts).sort((a, b) => b[1] - a[1]).slice(0, 3);
    // Compose summary
    const summary = `Event: ${event.event_name}\nTotal Incidents: ${total}\nResolved: ${resolved}\nTop Types: ${topTypes.map(([type, count]) => `${type} (${count})`).join(', ')}`;
    const learningPoints = [
      'Review top incident types for future planning.',
      'Ensure radio assignments are distributed to all teams.',
      'Debrief with team leads on response and resolution times.'
    ];
    return res.status(200).json({ summary, learningPoints, callsignSheet: callsignSheetFlat });
  } catch (e) {
    return res.status(500).json({ error: 'Internal server error' });
  }
} 