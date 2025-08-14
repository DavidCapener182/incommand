import { createClient } from '@supabase/supabase-js';
import { NextApiRequest, NextApiResponse } from 'next';
import OpenAI from 'openai';
import { chatCompletion as ollamaChatCompletion, isOllamaAvailable, OllamaModelNotFoundError } from '@/services/ollamaService';
import { extractJsonFromText } from '@/lib/ai/jsonUtils';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Single source of truth for the debrief system prompt
const DEBRIEF_SYSTEM_PROMPT = "You are an event analyst. Respond with only a valid JSON object having keys: eventOverview, attendanceSummary, significantIncidents[], learningPoints[]. No preamble or code fences.";

// Helper to run Ollama for debrief and return validated JSON string along with model used
async function tryOllamaDebrief(prompt: string): Promise<{ candidate: string; modelUsed?: string }> {
  let model = process.env.OLLAMA_MODEL_DEBRIEF;
  let available = await isOllamaAvailable(model);
  if (!available) {
    if (await isOllamaAvailable()) {
      model = undefined;
      available = true;
    }
  }
  if (!available) {
    throw new Error('Ollama not available');
  }
  const content = await ollamaChatCompletion(
    [ { role: 'system', content: DEBRIEF_SYSTEM_PROMPT }, { role: 'user', content: prompt } ],
    model ? { model, precheckAvailability: true } : { precheckAvailability: true }
  );
  const candidate = extractJsonFromText(content);
  JSON.parse(candidate);
  return { candidate, modelUsed: model };
}

// Normalize and coerce debrief JSON into expected shape
function normalizeDebrief(input: any) {
  const obj = typeof input === 'object' && input !== null ? input : {};
  const coerceString = (v: any) => {
    if (v == null) return '';
    if (typeof v === 'string') return v;
    try { return JSON.stringify(v); } catch { return String(v); }
  };
  const coerceIncident = (it: any) => {
    if (it == null) return null;
    if (typeof it === 'string') {
      return { date: '', type: '', details: it };
    }
    if (typeof it === 'object') {
      return {
        date: coerceString((it as any).date || (it as any).timestamp || ''),
        type: coerceString((it as any).type || (it as any).incident_type || ''),
        details: coerceString((it as any).details || (it as any).description || (it as any).summary || ''),
      };
    }
    return { date: '', type: '', details: coerceString(it) };
  };
  const incidentsRaw = Array.isArray((obj as any).significantIncidents) ? (obj as any).significantIncidents : [];
  const incidents = incidentsRaw
    .map(coerceIncident)
    .filter(Boolean) as Array<{ date: string; type: string; details: string }>;
  const learningRaw = Array.isArray((obj as any).learningPoints) ? (obj as any).learningPoints : [];
  const learningPoints = learningRaw.map((lp: any) => coerceString(lp)).filter((s: string) => typeof s === 'string');
  return {
    eventOverview: coerceString((obj as any).eventOverview),
    attendanceSummary: coerceString((obj as any).attendanceSummary),
    significantIncidents: incidents,
    learningPoints,
  };
}

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
        return res.status(200).json({ summary: JSON.stringify({ eventOverview: "No incidents recorded.", attendanceSummary: "", significantIncidents: [], learningPoints: [] }) });
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
    let primaryTokensUsed = 0;
    let ollamaModelUsed: string | undefined = undefined;

    // 4. Try OpenAI as primary
    if (process.env.OPENAI_API_KEY) {
      try {
        const OPENAI_DEBRIEF_MODEL = process.env.OPENAI_DEBRIEF_MODEL || 'gpt-4o-mini';
        const messages = [
          { role: 'system', content: DEBRIEF_SYSTEM_PROMPT },
          { role: 'user', content: prompt }
        ] as const;
        try {
          const response = await openai.chat.completions.create({
            model: OPENAI_DEBRIEF_MODEL,
            messages: messages as any,
            response_format: { type: 'json_object' },
          });
          summary = response.choices[0]?.message?.content || '';
          tokensUsed = (response as any)?.usage?.total_tokens || 0;
          primaryTokensUsed = tokensUsed;
          if (!summary) throw new Error('No content from OpenAI');
          JSON.parse(summary);
          aiSource = 'openai';
        } catch (e: any) {
          if (e?.error?.type === 'invalid_request_error' || e?.code === 'invalid_request_error') {
            const response = await openai.chat.completions.create({ model: OPENAI_DEBRIEF_MODEL, messages: messages as any });
            const content = response.choices[0]?.message?.content || '';
            if (!content) throw new Error('No content from OpenAI');
            const candidate = extractJsonFromText(content);
            JSON.parse(candidate);
            summary = candidate;
            aiSource = 'openai';
            tokensUsed = (response as any)?.usage?.total_tokens || 0;
            primaryTokensUsed = primaryTokensUsed || tokensUsed;
          } else {
            throw e;
          }
        }
      } catch (openaiErr) {
        // 5. Fallback to Ollama (single attempt)
        try {
          const { candidate, modelUsed } = await tryOllamaDebrief(prompt);
          summary = candidate;
          aiSource = 'ollama';
          tokensUsed = 0;
          ollamaModelUsed = modelUsed;
        } catch (ollamaErr) {
          console.error('AI debrief generation failed (OpenAI, then Ollama):', openaiErr, ollamaErr);
          throw new Error('Failed to generate debrief summary');
        }
      }
    } else {
      // 5. Use Ollama (single attempt)
      try {
        const { candidate, modelUsed } = await tryOllamaDebrief(prompt);
        summary = candidate;
        aiSource = 'ollama';
        tokensUsed = 0;
        ollamaModelUsed = modelUsed;
      } catch (ollamaErr) {
        console.error('AI debrief generation failed (Ollama only path):', ollamaErr);
        throw new Error('Failed to generate debrief summary');
      }
    }

    // Validate parsed JSON before saving, then normalize/coerce rather than failing
    let summaryJson;
    try {
      summaryJson = JSON.parse(summary);
    } catch (e) {
      console.error('Final AI output not valid JSON:', summary);
      throw new Error('Failed to generate a valid summary');
    }
    const normalized = normalizeDebrief(summaryJson);
    summaryJson = normalized;
    summary = JSON.stringify(normalized);

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
        await logAIUsage('debrief_summary', tokensUsed, { event_id: eventId, ai_source: aiSource, primary_tokens_used: primaryTokensUsed, ollama_model: ollamaModelUsed });
        return res.status(200).json({ summary: insertData.ai_summary });
    }
    // Log AI usage after saving
    await logAIUsage('debrief_summary', tokensUsed, { event_id: eventId, ai_source: aiSource, primary_tokens_used: primaryTokensUsed, ollama_model: ollamaModelUsed });
    return res.status(200).json({ summary: debriefData.ai_summary });

  } catch (error: any) {
    console.error('Error generating debrief summary:', error);
    const payload: any = { error: 'Internal Server Error' };
    if (process.env.NODE_ENV !== 'production') payload.details = error.message;
    return res.status(500).json(payload);
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