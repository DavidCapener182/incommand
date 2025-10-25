import { NextApiRequest, NextApiResponse } from 'next';
import OpenAI from 'openai';
import { getServiceClient } from '@/lib/supabaseServer';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Simple in-memory cache keyed by event id and latest incident timestamp
type CacheKey = string; // `${eventId}:${latestTs}`
type CachedPayload = {
  body: any;
  createdAt: number;
};
const INSIGHTS_CACHE: Map<CacheKey, CachedPayload> = new Map();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const supabase = getServiceClient();
    // For POST, get the prompt from the body (if provided)
    let customPrompt = '';
    if (req.method === 'POST') {
      customPrompt = req.body?.prompt || '';
    }

    // Get the current event - try multiple approaches
    let currentEvent = null;
    
    // First try: events with is_current = true
    const { data: currentEventData } = await supabase
      .from('events')
      .select('id, event_name, start_datetime, venue_name')
      .eq('is_current', true)
      .maybeSingle();

    if (currentEventData) {
      currentEvent = currentEventData;
    } else {
      // Fallback: get the most recent event that's happening today or in the future
      const today = new Date().toISOString().split('T')[0];
      const { data: recentEvent } = await supabase
        .from('events')
        .select('id, event_name, start_datetime, venue_name')
        .gte('start_datetime', today)
        .order('start_datetime', { ascending: true })
        .limit(1)
        .maybeSingle();
      
      if (recentEvent) {
        currentEvent = recentEvent;
      }
    }

    if (!currentEvent) {
      return res.status(200).json({
        summary: 'No current event found.',
        analysis: {
          totalIncidents: 0,
          openIncidents: 0,
          highPriorityIncidents: 0,
          urgentAlerts: [],
          recentTrends: []
        },
        lastUpdated: new Date().toISOString(),
        incidentCount: 0
      });
    }

    // Get comprehensive incident data for the current event
    const { data: incidents, error: incidentsError } = await supabase
      .from('incident_logs')
      .select(
        'id, incident_type, occurrence, timestamp, is_closed, status, location, log_number, priority'
      )
      .eq('event_id', currentEvent.id)
      .order('timestamp', { ascending: false });

    if (incidentsError) {
      console.error('Error fetching incidents for AI summary:', incidentsError);
      throw incidentsError;
    }

    // Exclude attendance incidents from total count (they're capacity tracking, not security incidents)
    const totalIncidents = incidents?.filter(i => i.incident_type.toLowerCase() !== 'attendance')?.length || 0;
    // Count incidents as closed if they are either is_closed=true OR status='logged'
    const openIncidents = incidents?.filter(i => !i.is_closed && i.status !== 'logged' && i.incident_type.toLowerCase() !== 'attendance')?.length || 0;
    
    // High priority incident types
    const highPriorityTypes = [
      'Ejection', 'Code Green', 'Code Black', 'Code Pink', 'Aggressive Behaviour',
      'Missing Child/Person', 'Hostile Act', 'Counter-Terror Alert', 'Fire Alarm',
      'Evacuation', 'Medical', 'Suspicious Behaviour'
    ];
    
    // Only count high priority incidents that are still open (not closed and not logged, excluding attendance)
    const highPriorityIncidents = incidents?.filter(i => 
      highPriorityTypes.includes(i.incident_type) && !i.is_closed && i.status !== 'logged' && i.incident_type.toLowerCase() !== 'attendance'
    )?.length || 0;

    // Get incident type breakdown (excluding attendance)
    const incidentTypeBreakdown = incidents?.filter(i => i.incident_type.toLowerCase() !== 'attendance').reduce((acc: any, incident) => {
      acc[incident.incident_type] = (acc[incident.incident_type] || 0) + 1;
      return acc;
    }, {}) || {};

    // Get recent incidents (last 2 hours, excluding attendance)
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
    const recentIncidents = incidents?.filter(i => 
      new Date(i.timestamp) > twoHoursAgo && i.incident_type.toLowerCase() !== 'attendance'
    ) || [];

    // Prepare data for AI analysis
    const eventName = currentEvent.event_name ?? 'Current Event';
    const eventDate = currentEvent.start_datetime ?? null;
    const venueName = currentEvent.venue_name ?? 'Venue';

    const eventData = {
      eventName,
      eventDate,
      venue: venueName,
      totalIncidents,
      openIncidents,
      highPriorityIncidents,
      incidentTypeBreakdown,
      recentIncidents: recentIncidents.slice(0, 10).map(i => ({
        type: i.incident_type,
        time: i.timestamp,
        description: i.occurrence.substring(0, 200),
        location: i.location,
        closed: i.is_closed || i.status === 'logged'
      })),
      overallStatus: openIncidents > 5 ? 'High Activity' : openIncidents > 2 ? 'Moderate Activity' : 'Low Activity'
    };

    // Compute cache key based on latest incident timestamp
    const latestTs = incidents?.[0]?.timestamp ? new Date(incidents[0].timestamp).getTime() : 0;
    const cacheKey: CacheKey = `${currentEvent.id}:${latestTs}`;

    // Serve from cache when available
    const cached = INSIGHTS_CACHE.get(cacheKey);
    if (cached) {
      return res.status(200).json(cached.body);
    }

    let aiSummary = '';
    let urgentAlerts: string[] = [];
    let recentTrends: string[] = [];

    // Generate AI summary if we have OpenAI API key
    if (process.env.OPENAI_API_KEY && incidents && incidents.length > 0) {
      try {
        // Use custom prompt if provided, otherwise use the default
        const promptToUse = customPrompt
          ? customPrompt
          : `You are an AI security analyst for an event management system. Analyze the following incident data and provide a comprehensive security and operational overview.

**Current Event Data:**
- Total Incidents: ${totalIncidents}
- Open Incidents: ${openIncidents} 
- High Priority Incidents: ${highPriorityIncidents}
- Recent Activity (last 2 hours): ${recentIncidents.length} incidents

**Incident Breakdown by Type:**
${Object.entries(incidentTypeBreakdown).map(([type, count]) => `- ${type}: ${count} incidents`).join('\n')}

**Recent Incidents (last 2 hours):**
${recentIncidents.map(incident => `- ${incident.incident_type}: ${incident.occurrence.substring(0, 100)} (Priority: ${highPriorityTypes.includes(incident.incident_type) ? 'High' : 'Standard'}, Status: ${incident.is_closed || incident.status === 'logged' ? 'Closed' : 'Open'})`).join('\n')}

**All Current Incidents:**
${incidents?.slice(0, 20).map(incident => `- ${incident.incident_type}: ${incident.occurrence.substring(0, 150)} (Priority: ${highPriorityTypes.includes(incident.incident_type) ? 'High' : 'Standard'}, Status: ${incident.is_closed || incident.status === 'logged' ? 'Closed' : 'Open'}, Location: ${incident.location || 'Not specified'})`).join('\n')}

**IMPORTANT CONTEXT:**
- "Attendance" incidents are NOT security issues - they track venue occupancy and people entering
- For Attendance incidents, focus on: occupancy patterns, peak entry times, capacity management, crowd flow
- All other incident types (Medical, Ejection, Technical, etc.) are actual security/operational concerns
- "Artist On/Off Stage" incidents are NOT issues or concerns; they simply record scheduled artist transitions and are expected as part of the event flow.

Provide a structured analysis in exactly this format with ### headers:

### Current Event Status
Brief overview of overall event security status and any immediate concerns requiring attention.

### Attendance & Capacity Analysis  
Analysis of venue occupancy patterns, entry trends, peak times, and capacity management (only if attendance incidents exist).

### Security & Operational Concerns
Analysis of actual security incidents (Medical, Ejection, Fighting, Technical, etc.) and operational issues requiring attention.

### Urgent Patterns or Concerns
Identify any critical patterns, escalating situations, or areas requiring immediate security attention.

### Trending Locations or Incident Types
Analysis of incident hotspots and patterns by location or incident type.

### Actionable Recommendations
Provide 3-5 specific, numbered actionable recommendations for event control teams. Format each as:
**1. [Action Title]**: Brief description of what needs to be done and why.
**2. [Action Title]**: Brief description of what needs to be done and why.
etc.

Keep each section concise but informative. Focus on actionable intelligence for event security teams.`;

        const completion = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: 'You are an expert event security analyst. Provide clear, actionable intelligence for event control teams. Distinguish between attendance tracking (venue capacity) and actual security incidents.'
            },
            {
              role: 'user',
              content: promptToUse
            }
          ],
          max_tokens: 1200,
          temperature: 0.3
        });

        const summary = (completion.choices[0]?.message?.content as string) || 'Unable to generate summary';

        // Extract urgent alerts from high priority and recent incidents
        const urgentAlerts: string[] = [];
        
        // Add high priority incidents as urgent alerts (excluding attendance)
        const highPriorityNonAttendance = incidents.filter(incident => 
          !incident.is_closed &&
          incident.status !== 'logged' &&
          highPriorityTypes.includes(incident.incident_type) &&
          incident.incident_type.toLowerCase() !== 'attendance'
        );
        
        highPriorityNonAttendance.slice(0, 3).forEach(incident => {
          urgentAlerts.push(`${incident.incident_type}: ${incident.occurrence.substring(0, 100)} at ${incident.location || 'unknown location'}`);
        });

        // Add recent critical incidents (excluding attendance)
        const recentCritical = recentIncidents.filter(incident => 
          ['ejection', 'medical', 'fighting', 'suspicious behaviour', 'aggressive behaviour'].includes(incident.incident_type.toLowerCase()) &&
          !incident.is_closed &&
          incident.status !== 'logged'
        );
        
        recentCritical.slice(0, 2).forEach(incident => {
          if (urgentAlerts.length < 5) {
            urgentAlerts.push(`Recent ${incident.incident_type}: ${incident.occurrence.substring(0, 100)}`);
          }
        });

        // Identify recent trends (excluding attendance from security trends)
        const recentTrends: string[] = [];
        const nonAttendanceTypes = Object.entries(incidentTypeBreakdown).filter(([type, count]) => type.toLowerCase() !== 'attendance');
        const topIncidentType = nonAttendanceTypes[0];
        
        if (topIncidentType && (topIncidentType[1] as number) > 2) {
          recentTrends.push(`${topIncidentType[0]} incidents are trending (${topIncidentType[1]} total)`);
        }
        
        if (recentIncidents.length > 5) {
          recentTrends.push(`High activity period - ${recentIncidents.length} incidents in last 2 hours`);
        }

        const analysisData = {
          totalIncidents,
          openIncidents,
          highPriorityIncidents,
          urgentAlerts,
          recentTrends
        };

        const payload = {
          summary,
          analysis: analysisData,
          lastUpdated: new Date().toISOString(),
          incidentCount: totalIncidents
        };
        INSIGHTS_CACHE.set(cacheKey, { body: payload, createdAt: Date.now() });
        return res.status(200).json(payload);

      } catch (error) {
        console.error('OpenAI API error:', error);
        
        // Provide fallback summary with corrected attendance understanding
        const fallbackSummary = `### Current Event Status
The event is experiencing ${totalIncidents > 20 ? 'high' : totalIncidents > 10 ? 'moderate' : 'low'} activity with ${totalIncidents} total incidents, of which ${openIncidents} remain open and ${highPriorityIncidents} are high priority.

### Security & Operational Concerns  
${highPriorityIncidents > 0 ? `${highPriorityIncidents} high-priority incidents require immediate attention.` : 'No high-priority security incidents currently open.'} Recent activity shows ${recentIncidents.length} incidents in the last 2 hours.

### Trending Locations or Incident Types
${Object.entries(incidentTypeBreakdown).slice(0, 3).map(([type, count]) => `${type}: ${count} incidents`).join(', ')}. Monitor these areas for developing patterns.

### Actionable Recommendations
- Review and prioritize open high-priority incidents
- Monitor trending incident types for escalation
- Ensure adequate staffing in high-incident areas
- Continue regular security patrols and monitoring`;

        const analysisData = {
          totalIncidents,
          openIncidents, 
          highPriorityIncidents,
          urgentAlerts: highPriorityIncidents > 0 ? [`${highPriorityIncidents} high-priority incidents need attention`] : [],
          recentTrends: [`${recentIncidents.length} incidents in last 2 hours`]
        };

        const payload = {
          summary: fallbackSummary,
          analysis: analysisData,
          lastUpdated: new Date().toISOString(),
          incidentCount: totalIncidents
        };
        INSIGHTS_CACHE.set(cacheKey, { body: payload, createdAt: Date.now() });
        return res.status(200).json(payload);
      }
    } else {
      // Fallback summary without AI
      aiSummary = totalIncidents === 0 
        ? `Event proceeding smoothly with no incidents reported.`
        : `Event monitoring: ${totalIncidents} total incidents, ${openIncidents} currently open, ${highPriorityIncidents} high-priority.`;
    }

    const payload = {
      summary: aiSummary,
      analysis: {
        totalIncidents,
        openIncidents,
        highPriorityIncidents,
        urgentAlerts,
        recentTrends
      },
      lastUpdated: new Date().toISOString(),
      incidentCount: totalIncidents
    };
    INSIGHTS_CACHE.set(cacheKey, { body: payload, createdAt: Date.now() });
    res.status(200).json(payload);

  } catch (error) {
    console.error('Error generating AI summary:', error);
    res.status(500).json({ 
      summary: 'Unable to generate event analysis at this time.',
      analysis: {
        totalIncidents: 0,
        openIncidents: 0,
        highPriorityIncidents: 0,
        urgentAlerts: [],
        recentTrends: []
      },
      lastUpdated: new Date().toISOString(),
      incidentCount: 0
    });
  }
} 
