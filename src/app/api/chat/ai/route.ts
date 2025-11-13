import { NextRequest, NextResponse } from 'next/server'
import { getServiceSupabaseClient } from '@/lib/supabaseServer'
import { retrieveContext, formatContextForPrompt, needsKnowledgeContext, needsGreenGuideContext } from '@/lib/ai/retrieveContext'

const supabase = getServiceSupabaseClient()

/**
 * Process AI message with Green Guide context
 * POST /api/chat/ai/message
 */
export async function POST(request: NextRequest) {
  try {
    console.log('AI API called')
    const body = await request.json()
    console.log('Request body:', JSON.stringify(body, null, 2))
    
    const { messages, userId, eventId, companyId } = body
    const userMessageContent = messages?.[messages.length - 1]?.content || ''
    
    console.log('📋 Extracted params:', {
      userId: userId ? 'present' : 'missing',
      eventId: eventId ? `present (${eventId})` : 'missing',
      companyId: companyId ? `present (${companyId})` : 'missing',
      messageCount: messages?.length || 0,
      userMessage: userMessageContent?.substring(0, 100) + '...'
    })

    if (!messages || !userId) {
      console.log('Missing required fields:', { messages: !!messages, userId: !!userId })
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Check if OpenAI API key is available
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      )
    }

    // Get the last user message
    const lastMessage = messages[messages.length - 1]
    const userMessageContentLower = lastMessage.content.toLowerCase()
    
    // Check if user wants knowledge context (Green Guide or Knowledge Base)
    const wantsKnowledgeContext = needsGreenGuideContext(userMessageContent) || needsKnowledgeContext(userMessageContent)
    let knowledgeContext = ''
    let citations: { text: string; page: number }[] = []

    // Check if user wants incident data
    const wantsIncidentData = /\b(incident|log|summary|summarise|summarize|report|event|issue|today|medical|ejection|refusal|suspicious|technical|welfare|lost|queue|weather|aggressive|status|what happened|give me|show me)\b/i.test(userMessageContentLower)
    let incidentContext = ''
    
    console.log('User message:', userMessageContent)
    console.log('Wants knowledge context:', wantsKnowledgeContext)
    console.log('Wants incident data:', wantsIncidentData)
    
    // Diagnostic logging for debugging
    console.log('Detection results:', {
      userMessage: userMessageContent,
      wantsKnowledgeContext,
      wantsIncidentData,
      eventId,
      companyId
    })

    if (wantsKnowledgeContext) {
      try {
        console.log('Retrieving unified knowledge context for:', userMessageContent)
        const contexts = await retrieveContext(userMessageContent, {
          organizationId: companyId,
          eventId: eventId,
          topK: 5,
          useHybrid: true
        })

        if (contexts.length > 0) {
          knowledgeContext = formatContextForPrompt(contexts)
          
          // Extract citations
          contexts.forEach(ctx => {
            if (ctx.source === 'green-guide' && ctx.metadata.page) {
              citations.push({ 
                text: `Green Guide, p.${ctx.metadata.page}`, 
                page: ctx.metadata.page 
              })
            } else if (ctx.source === 'knowledge-base' && ctx.metadata.title) {
              citations.push({ 
                text: ctx.metadata.title, 
                page: ctx.metadata.chunkIndex || 0 
              })
            }
          })
          
          console.log(`Retrieved ${contexts.length} knowledge contexts`)
        }
      } catch (kbError) {
        console.error('Error retrieving knowledge context:', kbError)
      }
    }

    if (wantsIncidentData) {
      try {
        console.log('Attempting to fetch incident data for:', userMessageContent)
        
        // Fetch incident data from the database
        const { getServiceSupabaseClient } = await import('@/lib/supabaseServer')
        const supabase = getServiceSupabaseClient()
        
        if (!eventId) {
          console.warn("⚠️ No eventId passed to AI Assistant incident query.")
          incidentContext = 'No event context available. Please ensure you are viewing an active event.'
        } else {
          console.log('🔍 Fetching comprehensive incident context with params:', { eventId, companyId })
          
          // Fetch comprehensive incident context across all related tables
          const context = await fetchIncidentContext(eventId, companyId)
          incidentContext = context
          console.log('Comprehensive incident context generated successfully')
        }
      } catch (incidentError) {
        console.error('Error fetching incident data:', incidentError)
        incidentContext = 'Unable to access incident data at this time.'
      }
    }

    // Get event type and strategy for AI focus
    let eventType = 'concert' // default
    let aiFocus = 'artist safety, stage performance, crowd density, and venue security'
    
    if (eventId) {
      try {
        const { data: event } = await supabase
          .from('events')
          .select('event_type')
          .eq('id', eventId)
          .single()
        
        if (event?.event_type) {
          eventType = event.event_type
          // Import event strategies dynamically
          const { getEventStrategy } = await import('@/lib/strategies/eventStrategies')
          const strategy = getEventStrategy(eventType)
          aiFocus = strategy.aiFocus
        }
      } catch (error) {
        console.error('Error fetching event type:', error)
      }
    }

    // Build system prompt
    let systemPrompt = `You are the inCommand AI Assistant providing real-time operational intelligence for ${eventType} events.

    You have access to comprehensive incident data from the live incident logs, separated into:
    - **ACTUAL INCIDENTS**: Real incidents requiring attention (medical, security, technical issues)
    - **OPERATIONAL LOGS**: Routine updates (sit reps, artist on/off stage, accreditation, staffing, attendance)

    **EVENT TYPE FOCUS**: This is a ${eventType} event. Focus on ${aiFocus}.

    CRITICAL: When counting "open incidents", count the number of incidents listed in the "OPEN INCIDENTS" section. If there are numbered items (1., 2., etc.) in that section, count them. If the section shows "No open incidents requiring attention", then there are 0 open incidents.

    Your goals:
    1. Distinguish between actual incidents and routine operational logs
    2. Summarise, correlate, and interpret actual incidents for operational decision-making
    3. When asked, reference categories (Medical, Security, Technical), times, and priorities
    4. Mention open vs closed status for actual incidents only
    5. Highlight repeated issues or clusters of related incidents
    6. Suggest operational improvements based on actual incident patterns
    7. When information is incomplete, infer context sensibly (e.g., "likely a routine medical response" or "pending log update")
    8. **CRITICAL**: Use operational logs to answer questions about event activities (e.g., "Artist on Stage" entries show which artists performed, "Artist off Stage" shows when they finished)
    9. Count and analyze operational log entries when asked (e.g., "how many artists on stage" = count "Artist on Stage" entries)
    10. **EVENT-SPECIFIC**: Adapt your analysis and recommendations to ${eventType} event operations and terminology

    Be concise, professional, and use the tone of a live event control report appropriate for ${eventType} events.

    **FORMATTING INSTRUCTIONS:**
    - Use HTML formatting instead of markdown
    - Use <strong>bold</strong> for emphasis instead of **bold**
    - Use <em>italics</em> for emphasis instead of *italics*
    - Use <h3> for section headers instead of ###
    - Use <h4> for subsections instead of ####
    - Use <ul> and <li> for lists instead of bullet points
    - Use <div> with inline styles for proper spacing and colors
    - Never use markdown syntax like #, **, or *

    If the user asks about "last incident", use the most recent entry in the ACTUAL INCIDENTS list.

    For Green Guide procedures and safety questions, refer to the provided Green Guide context and cite sections using [GG p.<page number>].
    For uploaded knowledge base documents, cite using the document title (e.g., [Creamfields Briefing.pdf]).
    
    Current User ID: ${userId}
    ${eventId ? `Current Event ID: ${eventId}` : ''}
    ${companyId ? `Current Company ID: ${companyId}` : ''}
    ${knowledgeContext ? `\nKnowledge Context:\n${knowledgeContext}` : ''}
    ${incidentContext ? `\nLive Incident Data:\n${incidentContext}` : ''}`

    // Call OpenAI API
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages.map((msg: any) => ({ role: msg.role, content: msg.content }))
        ],
        max_tokens: 1000,
        temperature: 0.7,
        stream: false
      })
    })

    if (!openaiResponse.ok) {
      const errorData = await openaiResponse.text()
      console.error('OpenAI API error:', errorData)
      return NextResponse.json(
        { error: 'AI service unavailable' },
        { status: 500 }
      )
    }

    const data = await openaiResponse.json()
    const response = data.choices[0]?.message?.content || 'I apologize, but I was unable to generate a response.'

    // If no incidents were found and user asked for incident data, provide a clearer response
    if (wantsIncidentData && (!incidentContext || incidentContext.includes('No incidents found'))) {
      return NextResponse.json({
        reply: "No incidents were found for today's log. Please ensure you're viewing an active event with recorded incidents.",
        citations: citations
      })
    }

    return NextResponse.json({ 
      reply: response,
      citations: citations
    })
  } catch (error) {
    console.error('AI chat error:', error)
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace')
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// Comprehensive incident context fetcher
async function fetchIncidentContext(eventId: string, companyId?: string) {
  if (!eventId) return 'No event context available. Please ensure you are viewing an active event.'

  try {
    const { getServiceSupabaseClient } = await import('@/lib/supabaseServer')
    const supabase = getServiceSupabaseClient()
    
    const today = new Date()
    const startOfDay = new Date(today.setHours(0, 0, 0, 0)).toISOString()

    console.log('🔍 Fetching comprehensive incident data for event:', eventId)

    // Fetch main incidents from incident_logs table
    const { data: incidents, error: incidentError } = await supabase
      .from('incident_logs')
      .select(`
        id,
        log_number,
        incident_type,
        occurrence,
        status,
        priority,
        timestamp,
        location,
        callsign_from,
        callsign_to,
        action_taken,
        created_at,
        updated_at
      `)
      .eq('event_id', eventId)
      .order('created_at', { ascending: false })
      .limit(50)

    if (incidentError) {
      console.error('Error fetching incidents:', incidentError.message)
      return 'Unable to fetch incident data at this time. Please try again or contact support if the issue persists.'
    }

    // For now, we'll focus on the main incident_logs table
    // Additional tables (incident_updates, incident_actions, incident_occurrences) 
    // can be added when they exist in the database schema
    const updates: any[] = []
    const actions: any[] = []
    const occurrences: any[] = []

    console.log(`✅ Found ${incidents.length} incidents, ${updates.length} updates, ${actions.length} actions, ${occurrences.length} occurrences`)
    console.log('🔍 Incident status breakdown:', incidents.reduce((acc: Record<string, number>, i) => {
      const status = i.status || 'NULL'
      acc[status] = (acc[status] || 0) + 1
      return acc
    }, {}))

    if (incidents.length === 0) {
      return `No incidents found for today's log (Event ID: ${eventId}). This could mean:
- No incidents have been logged yet for this event today
- You may be viewing a different event
- The event may not have started yet`
    }

    // Separate actual incidents from operational logs
    const actualIncidents = incidents.filter(i => {
      const type = (i.incident_type || '').toLowerCase()
      const occurrence = (i.occurrence || '').toLowerCase()
      const status = (i.status || '').toLowerCase()
      
      // These are operational logs, not incidents
      const operationalTypes = ['sit rep', 'artist on stage', 'artist off stage', 'accreditation', 'staffing', 'attendance']
      const operationalKeywords = ['doors are open', 'on stage', 'off stage', 'wristband', 'briefed and in position', 'guest requesting access', 'production team reports', 'current attendance']
      
      // Check if it's an operational log
      const isOperationalType = operationalTypes.some(op => type.includes(op))
      const isOperationalKeyword = operationalKeywords.some(keyword => occurrence.includes(keyword))
      
      // Also filter out low-priority sit reps and routine updates
      const isLowPrioritySitRep = type.includes('sit rep') && (i.priority || '').toLowerCase() === 'low'
      const isRoutineUpdate = occurrence.includes('doors are open') || occurrence.includes('briefed and in position')
      
      return !isOperationalType && !isOperationalKeyword && !isLowPrioritySitRep && !isRoutineUpdate
    })
    
    // Filter for only open incidents
    const openIncidents = actualIncidents.filter(i => (i.status || '').toLowerCase() === 'open')
    const closedIncidents = actualIncidents.filter(i => (i.status || '').toLowerCase() === 'closed')
    
    console.log(`🔍 Filtered results: ${actualIncidents.length} actual incidents, ${openIncidents.length} open, ${closedIncidents.length} closed`)
    console.log('🔍 Open incidents:', openIncidents.map(i => `${i.incident_type} (${i.status})`))
    
    const operationalLogs = incidents.filter(i => {
      const type = (i.incident_type || '').toLowerCase()
      const occurrence = (i.occurrence || '').toLowerCase()
      
      const operationalTypes = ['sit rep', 'artist on stage', 'artist off stage', 'accreditation', 'staffing']
      const operationalKeywords = ['doors are open', 'on stage', 'off stage', 'wristband', 'briefed and in position', 'guest requesting access', 'production team reports']
      
      const isOperationalType = operationalTypes.some(op => type.includes(op))
      const isOperationalKeyword = operationalKeywords.some(keyword => occurrence.includes(keyword))
      const isLowPrioritySitRep = type.includes('sit rep') && (i.priority || '').toLowerCase() === 'low'
      const isRoutineUpdate = occurrence.includes('doors are open') || occurrence.includes('briefed and in position')
      
      return isOperationalType || isOperationalKeyword || isLowPrioritySitRep || isRoutineUpdate
    })

    // Format open incidents
    const formattedOpenIncidents = openIncidents
      .map((i, idx) => {
        const timestamp = i.timestamp || i.created_at
        const time = timestamp ? new Date(timestamp).toLocaleTimeString([], { 
          hour: "2-digit", 
          minute: "2-digit" 
        }) : "Unknown time"
        
        const amended = i.updated_at && i.updated_at !== i.created_at
          ? ` (amended ${new Date(i.updated_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })})`
          : ""
        
        return `${idx + 1}. [${i.priority || "Unrated"}] ${i.incident_type || "Unknown"} (${i.status || "Unknown"}) — ${
          i.occurrence || "No description provided"
        } @ ${time}${amended}`
      })
      .join('\n')

    // Format closed incidents (summary)
    const formattedClosedIncidents = closedIncidents.length > 0 
      ? `${closedIncidents.length} closed incidents (medical, security, technical issues)`
      : 'No closed incidents'

    // Format operational logs
    const formattedOperationalLogs = operationalLogs
      .map((i, idx) => {
        const timestamp = i.timestamp || i.created_at
        const time = timestamp ? new Date(timestamp).toLocaleTimeString([], { 
          hour: "2-digit", 
          minute: "2-digit" 
        }) : "Unknown time"
        
        return `${idx + 1}. [${i.incident_type || "Log"}] ${i.occurrence || "No details"} @ ${time}`
      })
      .join('\n')

    // Format updates
    const formattedUpdates = updates
      .map(u => `• Update on incident ${u.incident_id}: ${u.update_text} (by ${u.updated_by} @ ${new Date(u.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })})`)
      .join('\n')

    // Format actions
    const formattedActions = actions
      .map(a => `• Action for incident ${a.incident_id}: ${a.action_taken} (by ${a.performed_by} @ ${new Date(a.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })})`)
      .join('\n')

    // Format occurrences
    const formattedOccurrences = occurrences
      .map(o => `• Occurrence for incident ${o.incident_id}: ${o.occurrence_details} (${new Date(o.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })})`)
      .join('\n')

    return `<div style="font-family: system-ui, -apple-system, sans-serif; line-height: 1.6; color: #333;">
      <h3 style="color: #dc2626; margin: 0 0 12px 0; font-size: 16px; font-weight: 600;">🚨 OPEN INCIDENTS — incidents requiring immediate attention</h3>
      <div style="margin-bottom: 20px;">
        ${formattedOpenIncidents ? formattedOpenIncidents.replace(/\n/g, '<br>') : '<p style="color: #6b7280; font-style: italic;">No open incidents requiring attention.</p>'}
      </div>

      <h3 style="color: #059669; margin: 0 0 12px 0; font-size: 16px; font-weight: 600;">📋 CLOSED INCIDENTS — resolved incidents</h3>
      <div style="margin-bottom: 20px;">
        <p style="margin: 0;">${formattedClosedIncidents}</p>
      </div>

      ${formattedOperationalLogs ? `
      <h3 style="color: #2563eb; margin: 0 0 12px 0; font-size: 16px; font-weight: 600;">📊 OPERATIONAL LOGS — routine updates and situation reports</h3>
      <div style="margin-bottom: 20px;">
        ${formattedOperationalLogs.replace(/\n/g, '<br>')}
      </div>` : ''}

      ${formattedUpdates ? `
      <h3 style="color: #7c3aed; margin: 0 0 12px 0; font-size: 16px; font-weight: 600;">✏️ AMENDMENTS / UPDATES — real-time modifications to existing incidents</h3>
      <div style="margin-bottom: 20px;">
        ${formattedUpdates.replace(/\n/g, '<br>')}
      </div>` : ''}

      ${formattedOccurrences ? `
      <h3 style="color: #ea580c; margin: 0 0 12px 0; font-size: 16px; font-weight: 600;">🕒 OCCURRENCES — sub-events or progress notes linked to incidents</h3>
      <div style="margin-bottom: 20px;">
        ${formattedOccurrences.replace(/\n/g, '<br>')}
      </div>` : ''}

      ${formattedActions ? `
      <h3 style="color: #0891b2; margin: 0 0 12px 0; font-size: 16px; font-weight: 600;">⚙️ ACTIONS TAKEN — interventions or follow-ups</h3>
      <div style="margin-bottom: 20px;">
        ${formattedActions.replace(/\n/g, '<br>')}
      </div>` : ''}
    </div>`

  } catch (error) {
    console.error('Error fetching comprehensive incident context:', error)
    return 'Unable to access incident data at this time. Please try again or contact support if the issue persists.'
  }
}

// Helper function to analyze incidents (legacy - now replaced by fetchIncidentContext)
function analyzeIncidents(incidents: any[]): string {
  if (!incidents || incidents.length === 0) {
    return 'No incidents found for this event.'
  }

  // Smart commenting function for incomplete records
  function generateComment(incident: any): string {
    if (!incident.occurrence && incident.incident_type === 'Medical') {
      return 'Likely a minor or resolved medical case — details pending.'
    }
    if (!incident.occurrence && incident.incident_type === 'Ejection') {
      return 'Security response completed — incident details being finalized.'
    }
    if (!incident.occurrence && incident.incident_type === 'Fight') {
      return 'Security intervention completed — report being prepared.'
    }
    if (!incident.occurrence && incident.incident_type === 'Welfare') {
      return 'Welfare check completed — details being documented.'
    }
    if (!incident.occurrence && incident.priority === 'high') {
      return 'High-priority incident resolved — full details pending.'
    }
    if (!incident.occurrence) {
      return 'Incident logged — details being recorded.'
    }
    return ''
  }

  // Get the latest incident for detailed context
  const latest = incidents[0]
  const latestTime = new Date(latest.timestamp || latest.created_at).toLocaleTimeString([], { 
    hour: "2-digit", 
    minute: "2-digit" 
  })

  // Group incidents by type
  const incidentsByType = incidents.reduce((acc, incident) => {
    const type = incident.incident_type || 'Unknown'
    if (!acc[type]) acc[type] = []
    acc[type].push(incident)
    return acc
  }, {})

  // Count by status
  const statusCounts = incidents.reduce((acc, incident) => {
    const status = incident.status || 'Unknown'
    acc[status] = (acc[status] || 0) + 1
    return acc
  }, {})

  // Count by priority
  const priorityCounts = incidents.reduce((acc, incident) => {
    const priority = incident.priority || 'Unknown'
    acc[priority] = (acc[priority] || 0) + 1
    return acc
  }, {})

  // Get recent incidents (last 24 hours)
  const now = new Date()
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000)
  const recentIncidents = incidents.filter(incident => {
    const incidentTime = new Date(incident.timestamp || incident.created_at)
    return incidentTime > yesterday
  })

  // Get open incidents
  const openIncidents = incidents.filter(incident => 
    incident.status === 'open' || incident.status === 'in_progress'
  )

  // Get high priority incidents
  const highPriorityIncidents = incidents.filter(incident => 
    incident.priority === 'high' || incident.priority === 'critical'
  )

  let summary = `LATEST INCIDENT CONTEXT:\n`
  summary += `The most recent incident was a ${latest.priority || 'unknown'} priority ${latest.incident_type || 'unknown type'} case recorded at ${latestTime}.\n`
  summary += `Status: ${latest.status || 'Unknown'} | Location: ${latest.location || 'Not specified'}\n`
  if (latest.occurrence) {
    summary += `Details: ${latest.occurrence.substring(0, 150)}${latest.occurrence.length > 150 ? '...' : ''}\n`
  } else {
    summary += `Details: ${generateComment(latest)}\n`
  }
  
  summary += `\nINCIDENT SUMMARY (${incidents.length} total incidents):\n\n`
  
  // Status breakdown
  summary += `Status Breakdown:\n`
  Object.entries(statusCounts).forEach(([status, count]) => {
    summary += `- ${status}: ${count}\n`
  })
  
  // Priority breakdown
  summary += `\nPriority Breakdown:\n`
  Object.entries(priorityCounts).forEach(([priority, count]) => {
    summary += `- ${priority}: ${count}\n`
  })
  
  // Type breakdown
  summary += `\nIncident Types:\n`
  Object.entries(incidentsByType).forEach(([type, typeIncidents]) => {
    summary += `- ${type}: ${(typeIncidents as any[]).length}\n`
  })
  
  // Recent activity
  summary += `\nRecent Activity (Last 24 hours): ${recentIncidents.length} incidents\n`
  
  // Recent incidents with smart commenting
  summary += `\nRecent Incidents (Last 5):\n`
  incidents.slice(0, 5).forEach(incident => {
    const time = new Date(incident.timestamp || incident.created_at).toLocaleTimeString([], { 
      hour: "2-digit", 
      minute: "2-digit" 
    })
    const details = incident.occurrence || generateComment(incident)
    summary += `- [${incident.priority || 'Unknown'}] ${incident.incident_type || 'Unknown'} (${incident.status || 'Unknown'}) — ${details} @ ${time}\n`
  })
  
  // Open incidents
  if (openIncidents.length > 0) {
    summary += `\nOpen Incidents (${openIncidents.length}):\n`
    openIncidents.slice(0, 5).forEach(incident => {
      const details = incident.occurrence || generateComment(incident)
      summary += `- ${incident.incident_type} (${incident.priority} priority): ${details}\n`
    })
  }
  
  // High priority incidents
  if (highPriorityIncidents.length > 0) {
    summary += `\nHigh Priority Incidents (${highPriorityIncidents.length}):\n`
    highPriorityIncidents.slice(0, 3).forEach(incident => {
      const details = incident.occurrence || generateComment(incident)
      summary += `- ${incident.incident_type}: ${details}\n`
    })
  }

  return summary
}
