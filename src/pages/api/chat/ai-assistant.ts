import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

interface EventContext {
  eventName: string;
  venueName: string;
  eventDate: string;
  eventTime: string;
  totalIncidents: number;
  openIncidents: number;
  recentIncidents: any[];
  attendanceData: any[];
  weatherData: any;
  eventBrief?: string;
}

const SYSTEM_PROMPT = `You are inCommand AI, a digital operations assistant for live event control and security management. You provide expert guidance to security, safety, and management staff during live events in the UK.

Your role includes:
- Incident analysis and trend identification
- Standard Operating Procedures (SOPs) for all incident types
- Crowd management and safety advice
- Emergency response guidance
- Risk assessment and mitigation strategies
- Compliance and documentation guidance
- Site-specific operational advice

Communication Guidelines:
- Keep responses concise, clear, and actionable
- Use UK English and terminology
- Prioritise safety and legal compliance
- Reference specific data when available
- Suggest dashboard sections or actions when relevant
- For complex procedures, break into numbered steps

Incident Types You Handle:
- Medical emergencies and first aid
- Ejections and antisocial behaviour
- Lost persons (especially children)
- Crowd control and capacity management
- Technical/equipment failures
- Weather-related issues
- Suspicious activity and security threats
- Fire safety and evacuations
- VIP and performer safety

Always maintain a professional, calm, and authoritative tone suitable for emergency services and security professionals.`;

async function getEventContext(): Promise<EventContext | null> {
  try {
    // Get current event
    const { data: events, error: eventError } = await supabase
      .from('events')
      .select('*')
      .eq('is_current', true)
      .single();

    console.log('Fetched event:', events); // DEBUG

    if (eventError || !events) {
      console.error('Error fetching current event:', eventError);
      return null;
    }

    // Get recent incidents (last 24 hours)
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    
    const { data: incidents, error: incidentError } = await supabase
      .from('incidents')
      .select(`
        *,
        profiles:user_id (display_name)
      `)
      .eq('event_id', events.id)
      .gte('created_at', twentyFourHoursAgo)
      .order('created_at', { ascending: false })
      .limit(20);

    if (incidentError) {
      console.error('Error fetching incidents:', incidentError);
    }

    // Get attendance data
    const { data: attendance, error: attendanceError } = await supabase
      .from('incidents')
      .select('*')
      .eq('event_id', events.id)
      .eq('type', 'Attendance')
      .order('created_at', { ascending: false })
      .limit(10);

    if (attendanceError) {
      console.error('Error fetching attendance data:', attendanceError);
    }

    // Count incidents
    const totalIncidents = incidents?.length || 0;
    const openIncidents = incidents?.filter(i => !i.is_closed && i.status !== 'logged').length || 0;

    const context = {
      eventName: events.event_name,
      venueName: events.venue_name,
      eventDate: events.event_date,
      eventTime: events.event_time,
      totalIncidents,
      openIncidents,
      recentIncidents: incidents || [],
      attendanceData: attendance || [],
      weatherData: null, // Could be enhanced with weather API
      eventBrief: events.event_brief || '',
    };
    console.log('Event context:', context); // DEBUG
    return context;
  } catch (error) {
    console.error('Error getting event context:', error);
    return null;
  }
}

function createContextPrompt(context: EventContext, userPrompt: string) {
  let prompt = `Current Event Context:\nEvent: ${context.eventName}\nVenue: ${context.venueName}\nDate: ${context.eventDate}\nTime: ${context.eventTime}\n\nCurrent Status:\n- Total incidents today: ${context.totalIncidents}\n- Open incidents: ${context.openIncidents}\n- Incident breakdown: \n${context.recentIncidents?.map(i => `- ${i.type}: ${i.status}`).join('\n') || ''}\n`;

  // [event_brief] Always include the event brief if present
  if (context.eventBrief) {
    prompt += `\nClient Event Brief:\n${context.eventBrief}\n`;
  }

  prompt += `\nUser Question: ${userPrompt}\n\nProvide a helpful, professional response based on this context. If referencing specific incidents or data, use the information provided above.`;
  return prompt;
}

const QUICK_ACTIONS = [
  { id: 'ejections', text: "Show me today's ejections", icon: '🚫' },
  { id: 'risks', text: "What are the key risks for tonight?", icon: '⚠️' },
  { id: 'medical', text: "Latest medical incidents", icon: '🏥' },
  { id: 'lost-child', text: "SOP for lost child", icon: '👶' },
  { id: 'show-stop', text: "Best practice for show stop", icon: '⏹️' },
  { id: 'capacity', text: "Current venue capacity status", icon: '👥' },
  { id: 'weather', text: "Weather risks and protocols", icon: '🌧️' },
  { id: 'emergency', text: "Emergency evacuation procedures", icon: '🚨' }
];

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { message, conversationHistory } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Get event context
    const context = await getEventContext();
    
    if (!context) {
      return res.status(500).json({ error: 'Unable to load event context' });
    }

    // The messages array is already correct:
    const messages = [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'system', content: createContextPrompt(context, message) }
    ];
    console.log('Final messages sent to OpenAI:', messages); // DEBUG

    // Add conversation history if provided
    if (conversationHistory && Array.isArray(conversationHistory)) {
      conversationHistory.slice(-10).forEach((msg: ChatMessage) => {
        messages.push({
          role: msg.role,
          content: msg.content
        });
      });
    }

    // Add current user message
    messages.push({ role: 'user', content: message });

    // Call OpenAI API
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages,
        max_tokens: 1000,
        temperature: 0.3,
        stream: false
      })
    });

    if (!openaiResponse.ok) {
      const errorData = await openaiResponse.text();
      console.error('OpenAI API error:', errorData);
      throw new Error(`OpenAI API error: ${openaiResponse.status}`);
    }

    const data = await openaiResponse.json();
    const aiResponse = data.choices[0]?.message?.content;

    if (!aiResponse) {
      throw new Error('No response from OpenAI');
    }

    // Return response with quick actions
    res.status(200).json({
      response: aiResponse,
      quickActions: QUICK_ACTIONS,
      context: {
        eventName: context.eventName,
        totalIncidents: context.totalIncidents,
        openIncidents: context.openIncidents
      }
    });

  } catch (error) {
    console.error('Error in AI assistant:', error);
    res.status(500).json({ 
      error: 'Failed to get AI response',
      fallback: "I'm currently experiencing technical difficulties. Please try again in a moment, or contact your control room supervisor for immediate assistance."
    });
  }
} 