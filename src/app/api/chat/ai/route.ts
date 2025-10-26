import { NextRequest, NextResponse } from 'next/server'
import { getServiceSupabaseClient } from '@/lib/supabaseServer'

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
    const userMessageContent = lastMessage.content.toLowerCase()
    
    // Check if user wants Green Guide context
    const wantsGreenGuide = /green guide|procedure|best practice|safety|regulation|guideline|what should i do/.test(userMessageContent)
    let greenGuideContext = ''
    let citations: { text: string; page: number }[] = []

    // Check if user wants incident data
    const wantsIncidentData = /incident|log|summary|today|report|status|medical|ejection|refusal|suspicious|technical|welfare|lost|queue|weather|aggressive|summarise|summarize/.test(userMessageContent)
    let incidentContext = ''
    
    console.log('User message:', userMessageContent)
    console.log('Wants incident data:', wantsIncidentData)

    if (wantsGreenGuide) {
      try {
        console.log('Attempting Green Guide search for:', userMessageContent)
        const greenGuideResponse = await fetch(`${request.nextUrl.origin}/api/green-guide-search`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: userMessageContent, topK: 3 })
        })

        if (greenGuideResponse.ok) {
          const { results } = await greenGuideResponse.json()
          console.log('Green Guide results:', results)
          if (Array.isArray(results) && results.length) {
            try {
              greenGuideContext = results.map((r: any, i: number) => {
                const content = r.content || r.text || 'No content available'
                const page = r.page || '?'
                citations.push({ text: `Green Guide, p.${page}`, page: page })
                return `(${i + 1}) p.${page}: ${content.slice(0, 400)}`
              }).join('\n')
            } catch (mapError) {
              console.error('Error processing Green Guide results:', mapError)
              greenGuideContext = 'Green Guide context available but could not be processed'
            }
          }
        } else {
          console.log('Green Guide search failed:', greenGuideResponse.status)
        }
      } catch (ggError) {
        console.error('Error fetching Green Guide context:', ggError)
      }
    }

    if (wantsIncidentData) {
      try {
        console.log('Attempting to fetch incident data for:', userMessageContent)
        
        // Fetch incident data from the database
        const { getServiceSupabaseClient } = await import('@/lib/supabaseServer')
        const supabase = getServiceSupabaseClient()
        
        // Get incidents for the current event
        const { data: incidents, error: incidentError } = await supabase
          .from('incident_logs')
          .select(`
            id,
            incident_type,
            description,
            status,
            priority,
            timestamp,
            location,
            callsign_from,
            callsign_to,
            created_at,
            updated_at
          `)
          .eq('event_id', eventId)
          .eq('company_id', companyId)
          .order('timestamp', { ascending: false })
          .limit(50) // Get last 50 incidents

        if (incidentError) {
          console.error('Error fetching incidents:', incidentError)
          incidentContext = 'Unable to fetch incident data at this time.'
        } else if (incidents && incidents.length > 0) {
          console.log('Found incidents:', incidents.length)
          // Analyze and summarize the incidents
          const incidentSummary = analyzeIncidents(incidents)
          incidentContext = incidentSummary
          console.log('Incident context generated:', incidentSummary.substring(0, 200) + '...')
        } else {
          console.log('No incidents found for event:', eventId, 'company:', companyId)
          incidentContext = 'No incidents found for this event.'
        }
      } catch (incidentError) {
        console.error('Error fetching incident data:', incidentError)
        incidentContext = 'Unable to access incident data at this time.'
      }
    }

    // Build system prompt
    let systemPrompt = `You are an expert event operations AI assistant for the inCommand platform.
    Answer questions concisely and accurately.
    If the user asks about procedures, best practices, or safety, refer to the provided Green Guide context.
    Cite Green Guide sections using [GG p.<page number>] where applicable.
    Maintain conversation context.
    
    For incident-related queries:
    - Use the provided incident data to give specific, actionable insights
    - Analyze patterns, trends, and areas of concern
    - Provide recommendations based on the actual incident data
    - Highlight any high-priority or unresolved incidents
    
    Current User ID: ${userId}
    ${eventId ? `Current Event ID: ${eventId}` : ''}
    ${companyId ? `Current Company ID: ${companyId}` : ''}
    ${greenGuideContext ? `\nGreen Guide Context:\n${greenGuideContext}` : ''}
    ${incidentContext ? `\nIncident Data:\n${incidentContext}` : ''}`

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
          ...messages.map(msg => ({ role: msg.role, content: msg.content }))
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

// Helper function to analyze incidents
function analyzeIncidents(incidents: any[]): string {
  if (!incidents || incidents.length === 0) {
    return 'No incidents found for this event.'
  }

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

  let summary = `INCIDENT SUMMARY (${incidents.length} total incidents):\n\n`
  
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
    summary += `- ${type}: ${typeIncidents.length}\n`
  })
  
  // Recent activity
  summary += `\nRecent Activity (Last 24 hours): ${recentIncidents.length} incidents\n`
  
  // Open incidents
  if (openIncidents.length > 0) {
    summary += `\nOpen Incidents (${openIncidents.length}):\n`
    openIncidents.slice(0, 5).forEach(incident => {
      summary += `- ${incident.incident_type} (${incident.priority} priority): ${incident.description?.substring(0, 100) || 'No description'}\n`
    })
  }
  
  // High priority incidents
  if (highPriorityIncidents.length > 0) {
    summary += `\nHigh Priority Incidents (${highPriorityIncidents.length}):\n`
    highPriorityIncidents.slice(0, 3).forEach(incident => {
      summary += `- ${incident.incident_type}: ${incident.description?.substring(0, 100) || 'No description'}\n`
    })
  }

  return summary
}
