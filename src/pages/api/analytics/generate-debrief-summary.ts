import { createClient } from '@supabase/supabase-js';
import { NextApiRequest, NextApiResponse } from 'next';
import OpenAI from 'openai';
import { chatCompletion as ollamaChatCompletion, isOllamaAvailable } from '@/services/ollamaService';

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
      .select('event_name, venue_name, event_brief')
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

    // 3. Construct a detailed prompt for AI
    const prompt = `
      Please provide a debrief summary for the event: "${event.event_name}" at "${event.venue_name}".
      The client event brief is: ${event.event_brief || 'No event brief provided.'}
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
    let aiSource: 'openai' | 'ollama' | 'none' = 'none';
    let summary = '' as string;
    let tokensUsed = 0;

    // 4. Try OpenAI as primary
    try {
      const OPENAI_DEBRIEF_MODEL = process.env.OPENAI_DEBRIEF_MODEL || 'gpt-4o-mini';
      const response = await openai.chat.completions.create({
        model: OPENAI_DEBRIEF_MODEL,
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
      });
      summary = response.choices[0]?.message?.content || '';
      tokensUsed = (response as any)?.usage?.total_tokens || 0;
      if (!summary) throw new Error('No content from OpenAI');
      try {
        JSON.parse(summary);
        aiSource = 'openai';
      } catch (e) {
        throw new Error('OpenAI returned non-JSON content');
      }
    } catch (openaiErr) {
      // 5. Fallback to Ollama if available
      try {
        const available = await isOllamaAvailable();
        if (available) {
          const model = process.env.OLLAMA_MODEL_DEBRIEF;
          const content = await ollamaChatCompletion(
            [ { role: 'user', content: prompt } ],
            { model }
          );
          // Accept fenced or plain JSON
          const fenced = content.match(/```json[\s\S]*?```|```[\s\S]*?```/i);
          const candidate = fenced ? fenced[0].replace(/```json|```/gi, '').trim() : content;
          JSON.parse(candidate); // validate
          summary = candidate;
          aiSource = 'ollama';
          tokensUsed = 0;
        } else {
          throw new Error('Ollama not available');
        }
      } catch (ollamaErr) {
        console.error('AI debrief generation failed (OpenAI, then Ollama):', openaiErr, ollamaErr);
        throw new Error('Failed to generate debrief summary');
      }
    }

    // Validate parsed JSON before saving
    let summaryJson;
    try {
      summaryJson = JSON.parse(summary);
    } catch (e) {
      console.error('Final AI output not valid JSON:', summary);
      throw new Error('Failed to generate a valid summary');
    }

    // Additional shape checks for required keys and types
    const validateDebriefShape = (obj: any) => {
      if (!obj || typeof obj !== 'object') return false;
      const { eventOverview, attendanceSummary, significantIncidents, learningPoints } = obj;
      if (typeof eventOverview !== 'string') return false;
      if (typeof attendanceSummary !== 'string') return false;
      if (!Array.isArray(significantIncidents)) return false;
      if (!Array.isArray(learningPoints)) return false;
      // incidents array items validation
      for (const item of significantIncidents) {
        if (!item || typeof item !== 'object') return false;
        if (typeof item.date !== 'string') return false;
        if (typeof item.type !== 'string') return false;
        if (typeof item.details !== 'string') return false;
      }
      // learningPoints must be strings
      for (const lp of learningPoints) {
        if (typeof lp !== 'string') return false;
      }
      return true;
    };

    if (!validateDebriefShape(summaryJson)) {
      // Attempt fallback to Ollama if not already used
      try {
        if (aiSource !== 'ollama') {
          const available = await isOllamaAvailable();
          if (available) {
            const model = process.env.OLLAMA_MODEL_DEBRIEF;
            const content = await ollamaChatCompletion(
              [ { role: 'user', content: prompt } ],
              { model }
            );
            const fenced = content.match(/```json[\s\S]*?```|```[\s\S]*?```/i);
            const candidate = fenced ? fenced[0].replace(/```json|```/gi, '').trim() : content;
            const parsed = JSON.parse(candidate);
            if (!validateDebriefShape(parsed)) {
              throw new Error('Ollama returned invalid debrief JSON shape');
            }
            summary = candidate;
            summaryJson = parsed;
            aiSource = 'ollama';
            tokensUsed = 0;
          } else {
            throw new Error('Ollama not available for fallback');
          }
        } else {
          throw new Error('Invalid debrief JSON shape and no further fallback available');
        }
      } catch (shapeErr) {
        console.error('Debrief JSON shape validation failed:', shapeErr);
        return res.status(500).json({ error: 'Failed to generate a valid debrief summary structure.' });
      }
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
        // Log AI usage after saving
        await logAIUsage('debrief_summary', tokensUsed, { event_id: eventId, ai_source: aiSource });
        return res.status(200).json({ summary: insertData.ai_summary });
    }
    // Log AI usage after saving
    await logAIUsage('debrief_summary', tokensUsed, { event_id: eventId, ai_source: aiSource });
    return res.status(200).json({ summary: debriefData.ai_summary });

  } catch (error: any) {
    console.error('Error generating debrief summary:', error);
    return res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
} 

async function logAIUsage(operation: string, tokensUsed: number, metadata: Record<string, any>) {
  try {
    const { error } = await supabase
      .from('ai_usage_logs')
      .insert({
        operation,
        tokens_used: tokensUsed,
        metadata: {
          ...metadata,
          timestamp: new Date().toISOString(),
        },
      });
    if (error) {
      console.error('Error logging AI usage:', error);
    }
  } catch (e) {
    console.error('Error logging AI usage:', e);
  }
}