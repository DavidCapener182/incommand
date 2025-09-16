import { NextApiRequest, NextApiResponse } from 'next';
import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { eventId, notes } = req.body;

  if (!eventId || notes === undefined) {
    return res.status(400).json({ error: 'Event ID and notes are required.' });
  }

  try {
    const supabase = createServerSupabaseClient({ req, res });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Check if a debrief for this event already exists
    const { data: existingDebrief, error: selectError } = await supabase
      .from('debriefs')
      .select('id')
      .eq('event_id', eventId)
      .single();

    if (selectError && selectError.code !== 'PGRST116') { // PGRST116: no rows found
      throw selectError;
    }

    if (existingDebrief) {
      // Update existing debrief
      const { error: updateError } = await supabase
        .from('debriefs')
        .update({ manual_notes: notes })
        .eq('event_id', eventId);

      if (updateError) throw updateError;
      return res.status(200).json({ message: 'Debrief notes updated successfully.' });

    } else {
      // Insert new debrief
      const { error: insertError } = await supabase
        .from('debriefs')
        .insert({ event_id: eventId, manual_notes: notes });
      
      if (insertError) throw insertError;
      return res.status(201).json({ message: 'Debrief notes saved successfully.' });
    }
  } catch (error: any) {
    console.error('Error saving debrief notes:', error);
    return res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
} 
