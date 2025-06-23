import { createClient } from '@supabase/supabase-js';
import { NextApiRequest, NextApiResponse } from 'next';
import OpenAI from 'openai';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  const { eventId } = body;

  if (!eventId) {
    return res.status(400).json({ error: 'Event ID is required.' });
  }

  try {
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('event_name, venue_name')
      .eq('id', eventId)
      .single();

    if (eventError || !event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    // 1. Fetch event data
    const { data: incidents, error: incidentsError } = await supabase
      .from('incident_logs')
      .select('timestamp, incident_type, status, occurrence')
      .eq('event_id', eventId);

    const { data: attendance, error: attendanceError } = await supabase
      .from('attendance_records')
      .select('timestamp, count')
      .eq('event_id', eventId);

    const { data: callsigns, error: callsignsError } = await supabase
      .from('callsign_assignments')
      .select('assigned_name, callsign_role_id, callsign_roles(callsign, position)')
      .eq('event_id', eventId);

    if (incidentsError || attendanceError || callsignsError) {
      console.error('Error fetching data from Supabase:', incidentsError, attendanceError, callsignsError);
      return res.status(500).json({ error: 'Failed to fetch event data.' });
    }

    if (!incidents || incidents.length === 0) {
        return res.status(404).json({ error: 'No incident data found for this event to generate a debrief.' });
    }

    // 3. Construct a detailed prompt for OpenAI
    const prompt = `
      Please provide a debrief summary for the event: "${event.event_name}" at "${event.venue_name}".
      The output must be a valid JSON object.
      Here is the data:
      - Incidents: ${JSON.stringify(incidents.slice(0, 20))}
      - Attendance: ${JSON.stringify(attendance)}
      - Callsign Assignments: ${JSON.stringify(callsigns)}

      Generate a comprehensive debrief summary as a JSON object with the following keys: "eventOverview", "attendanceSummary", "significantIncidents", and "learningPoints".
      - "eventOverview": A string summarizing the event. Include key statistics and mention key personnel like the HOS.
      - "attendanceSummary": A string analyzing the attendance data. Describe the rate at which people entered and note the specific time of peak attendance.
      - "significantIncidents": An array of objects. Each object must have keys: "date" (string), "type" (string), and "details" (string). Populate this with the most significant incidents. Do not include incidents with type 'Attendance' or 'Sit Rep'.
      - "learningPoints": An array of strings, with each string being a key learning point or recommendation.
      The tone must be professional and analytical. Do not include any text outside of the JSON object.
    `;

    // 4. Generate the summary using OpenAI
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
    });

    const summary = response.choices[0]?.message?.content;

    if (!summary) {
      throw new Error('Failed to generate summary from OpenAI.');
    }
    
    let summaryJson;
    try {
        summaryJson = JSON.parse(summary);
    } catch (e) {
        console.error("OpenAI did not return valid JSON:", summary);
        throw new Error('Failed to generate a valid summary from OpenAI.');
    }

    // 5. Save summary to the debriefs table
    const { data: debriefData, error: saveError } = await supabase
      .from('debriefs')
      .update({ ai_summary: summary })
      .eq('event_id', eventId)
      .select()
      .single();

    if (saveError) {
        // If update fails, maybe the row doesn't exist. Let's try inserting.
        const { data: insertData, error: insertError } = await supabase
            .from('debriefs')
            .insert({ event_id: eventId, ai_summary: summary })
            .select()
            .single();
        
        if (insertError) {
            console.error('Failed to save debrief summary:', insertError);
            throw new Error('Failed to save debrief summary to the database.');
        }
        return res.status(200).json({ summary: insertData.ai_summary });
    }
    
    return res.status(200).json({ summary: debriefData.ai_summary });

  } catch (error: any) {
    console.error('Error generating debrief summary:', error);
    return res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
} 