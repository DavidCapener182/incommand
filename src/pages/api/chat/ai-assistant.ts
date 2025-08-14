import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import { deriveFollowUpActions } from '@/lib/chat/followUpActions';
import { ConversationContext, EventContext as ChatEventContext } from '@/types/chat';

// Initialize Supabase client
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
    console.log('🔍 Starting getEventContext...');
    
    // Get current event
    console.log('🔍 Fetching current event...');
    const { data: events, error: eventError } = await supabase
      .from('events')
      .select('*')
      .eq('is_current', true)
      .single();

    if (eventError) {
      console.error('❌ Error fetching current event:', eventError);
      return null;
    }

    if (!events) {
      console.error('❌ No current event found');
      return null;
    }

    console.log('✅ Found current event:', events.event_name);

    // Get all incident logs for the current event
    console.log('🔍 Fetching incidents for event:', events.id);
    const { data: incidents, error: incidentError } = await supabase
      .from('incident_logs')
      .select('*')
      .eq('event_id', events.id)
      .order('created_at', { ascending: false });

    if (incidentError) {
      console.error('❌ Error fetching incidents:', incidentError);
      return null;
    }

    console.log('📊 Raw incidents found:', incidents?.length || 0);

    // Count incidents (excluding Attendance and Sit Rep like the Dashboard)
    const countableIncidents = incidents?.filter(i => !['Attendance', 'Sit Rep'].includes(i.incident_type)) || [];
    const totalIncidents = countableIncidents.length;
    // Fix: Use is_closed field as the primary indicator, fallback to status
    const openIncidents = countableIncidents.filter(i => !i.is_closed && i.status !== 'closed').length || 0;
    
    console.log('📈 Countable incidents:', totalIncidents);
    console.log('🔓 Open incidents:', openIncidents);

    // Get staff count for the event
    const { data: staff, error: staffError } = await supabase
      .from('staff')
      .select('*')
      .eq('event_id', events.id);

    const staffCount = staff?.length || 0;

    const context = {
      eventId: events.id,
      eventName: events.event_name,
      venueName: events.venue_name,
      eventDate: events.event_date,
      eventTime: events.event_time,
      totalIncidents,
      openIncidents,
      recentIncidents: countableIncidents || [],
      attendanceData: [],
      eventBrief: events.event_brief || '',
      staffCount,
    };

    console.log('✅ Event context created:', {
      eventName: context.eventName,
      totalIncidents: context.totalIncidents,
      openIncidents: context.openIncidents
    });

    return context;
  } catch (error) {
    console.error('❌ Error getting event context:', error);
    return null;
  }
}

function createContextPrompt(context: EventContext, userPrompt: string) {
  let prompt = `Current Event Context:
Event: ${context.eventName}
Venue: ${context.venueName}
Date: ${context.eventDate}
Time: ${context.eventTime}

Current Status:
- Total incidents for this event: ${context.totalIncidents}
- Open incidents: ${context.openIncidents}
- Recent incidents: ${context.recentIncidents?.slice(0, 5).map(i => `${i.incident_type} (${i.is_closed ? 'Closed' : 'Open'})`).join(', ') || 'None'}

`;

  if (context.eventBrief) {
    prompt += `Event Brief: ${context.eventBrief}

`;
  }

  prompt += `User Question: ${userPrompt}

Provide a helpful, professional response based on this context.`;
  
  console.log('📝 Context prompt created with', context.totalIncidents, 'incidents');
  return prompt;
}

type QuickAction = { id: string; text: string; icon: string };

const QUICK_ACTIONS: readonly QuickAction[] = [
  // Incident Analysis Actions
  { id: 'incident-trends', text: "Analyse incident trends for current event", icon: '📊' },
  { id: 'pattern-recognition', text: "Identify patterns across incident types", icon: '🔍' },
  { id: 'risk-assessment', text: "Assess risks based on current incidents", icon: '⚖️' },
  { id: 'frequency-analysis', text: "Analyse incident frequency by location", icon: '📍' },
  
  // SOP & Procedure Actions
  { id: 'emergency', text: "Emergency evacuation procedures", icon: '🚨' },
  { id: 'lost-child', text: "Lost child procedures and protocols", icon: '👶' },
  { id: 'medical-protocols', text: "Medical emergency protocols", icon: '🏥' },
  { id: 'fire-safety', text: "Fire safety procedures", icon: '🔥' },
  { id: 'crowd-control', text: "Crowd control protocols", icon: '👥' },
  { id: 'security-threat', text: "Security threat response procedures", icon: '🛡️' },
  { id: 'technical-failure', text: "Technical failure procedures", icon: '🔧' },
  { id: 'vip-protection', text: "VIP protection protocols", icon: '👑' },
  
  // Specific Incident Type Actions
  { id: 'medical', text: "Medical incidents analysis and response", icon: '🏥' },
  { id: 'ejections', text: "Ejection incidents review and management", icon: '🚫' },
  { id: 'lost-person', text: "Lost person procedures and search protocols", icon: '🔍' },
  { id: 'technical-issues', text: "Technical issues troubleshooting", icon: '⚙️' },
  { id: 'aggressive-behaviour', text: "Aggressive behaviour management", icon: '😠' },
  { id: 'suspicious-activity', text: "Suspicious activity protocols", icon: '👁️' },
  { id: 'weather-incidents', text: "Guidance for active weather-related incidents", icon: '🌦️' },
  { id: 'capacity-management', text: "Capacity management guidance", icon: '📈' },
  
  // Operational Guidance Actions
  { id: 'capacity', text: "Current venue capacity status", icon: '👥' },
  { id: 'weather', text: "Weather risks overview and protocols", icon: '🌧️' },
  { id: 'staff-deployment', text: "Staff deployment recommendations", icon: '👮' },
  { id: 'communication', text: "Communication protocols and procedures", icon: '📢' },
  { id: 'escalation', text: "Escalation procedures and guidelines", icon: '📞' },
  { id: 'documentation', text: "Documentation requirements and standards", icon: '📝' },
  
  // Trend & Reporting Actions
  { id: 'incident-summary', text: "Generate incident summary report", icon: '📋' },
  { id: 'emerging-patterns', text: "Identify emerging patterns and trends", icon: '📈' },
  { id: 'risk-hotspots', text: "Risk hotspot analysis and mapping", icon: '🗺️' },
  { id: 'performance-metrics', text: "Performance metrics review and analysis", icon: '📊' },
  
  // Legacy Actions (keeping for compatibility)
  { id: 'risks', text: "What are the key risks for tonight?", icon: '⚠️' },
  { id: 'show-stop', text: "Best practice for show stop", icon: '⏹️' }
] as const;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('🤖 AI Assistant API called');
    
    const { message, conversationHistory } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Message is required' });
    }

    console.log('📨 User message:', message.substring(0, 100) + '...');

    // Get event context
    const context = await getEventContext();
    
    if (!context) {
      console.error('❌ No event context available');
      return res.status(500).json({ error: 'Unable to load event context' });
    }

    // Create messages array for OpenAI
    const messages = [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'system', content: createContextPrompt(context, message) }
    ];

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

    console.log('📤 Sending to OpenAI with', messages.length, 'messages');

    // Use OpenAI
    if (!process.env.OPENAI_API_KEY) {
      console.error('❌ No OpenAI API key found');
      return res.status(500).json({ error: 'OpenAI API key not configured' });
    }

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
      console.error('❌ OpenAI API error:', errorData);
      throw new Error(`OpenAI API error: ${openaiResponse.status}`);
    }

    const data = await openaiResponse.json();
    const aiResponseText = data.choices[0]?.message?.content;
    
    if (!aiResponseText || typeof aiResponseText !== 'string') {
      throw new Error('No response from OpenAI');
    }

    console.log('✅ OpenAI response received');

    // Generate context-aware follow-up actions
    const conversationContext: ConversationContext = {
      userMessage: message,
      aiResponse: aiResponseText,
      eventContext: {
        eventId: context.eventId || '',
        eventName: context.eventName,
        currentTime: new Date().toISOString(),
        staffCount: context.staffCount || 0,
        openIncidents: context.openIncidents
      },
      conversationHistory: conversationHistory || [],
      recentIncidents: context.recentIncidents || []
    };

    const dynamicQuickActions = deriveFollowUpActions(conversationContext);

    // Return response with dynamic quick actions
    res.status(200).json({
      response: aiResponseText,
      quickActions: dynamicQuickActions,
      context: {
        eventName: context.eventName,
        totalIncidents: context.totalIncidents,
        openIncidents: context.openIncidents
      }
    });

  } catch (error) {
    console.error('❌ AI Assistant error:', error);
    res.status(500).json({ 
      error: 'Failed to process request',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 