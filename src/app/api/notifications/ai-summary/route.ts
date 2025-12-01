import { NextRequest, NextResponse } from 'next/server'
import { getServiceSupabaseClient } from '@/lib/supabaseServer'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    // Get the current event ID from query params
    const { searchParams } = new URL(request.url)
    const eventId = searchParams.get('eventId')
    
    if (!eventId) {
      return NextResponse.json({ 
        error: 'Event ID is required' 
      }, { status: 400 })
    }

    const supabase = getServiceSupabaseClient()

    // Fetch all incidents for the event
    // We'll filter out Attendance, Sit Rep, and match flow types in JavaScript
    const { data: allIncidents, error: incidentError } = await supabase
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

    if (incidentError) {
      console.error("Error fetching incidents for AI summary:", incidentError)
      return NextResponse.json({ 
        error: 'Unable to fetch AI summary data',
        details: incidentError.message 
      }, { status: 500 })
    }

    if (!allIncidents || allIncidents.length === 0) {
      return NextResponse.json({ 
        summary: 'No recent incidents to summarize.',
        totalIncidents: 0,
        openIncidents: 0,
        highPriorityIncidents: 0,
        lastUpdated: new Date().toISOString()
      })
    }

    // Filter out non-countable incidents:
    // - Attendance (operational logs)
    // - Sit Rep (operational logs)
    // - Match flow types (informational logs)
    const excludedTypes = [
      'Attendance',
      'Sit Rep',
      'Kick-Off (First Half)',
      'Half-Time',
      'Kick-Off (Second Half)',
      'Full-Time',
      'Home Goal',
      'Away Goal',
      'Match Flow'
    ]
    
    // Filter incidents to exclude non-countable types
    const incidents = allIncidents.filter((incident: any) => {
      const incidentType = incident?.incident_type
      return incidentType && !excludedTypes.includes(incidentType)
    })

    if (!incidents || incidents.length === 0) {
      return NextResponse.json({ 
        summary: 'No recent incidents to summarize.',
        totalIncidents: 0,
        openIncidents: 0,
        highPriorityIncidents: 0,
        lastUpdated: new Date().toISOString()
      })
    }

    // Get total count (excluding match_log) - this is the actual total count
    const totalIncidents = incidents.length
    const openIncidents = incidents.filter(i => (i.status || '').toLowerCase() === 'open').length
    const highPriorityIncidents = incidents.filter(i => (i.priority || '').toLowerCase() === 'high').length
    const closedIncidents = incidents.filter(i => (i.status || '').toLowerCase() === 'closed').length
    const loggedIncidents = incidents.filter(i => (i.status || '').toLowerCase() === 'logged').length

    // Count by type
    const incidentTypes = incidents.reduce((acc, incident) => {
      const type = incident.incident_type || 'Unknown'
      acc[type] = (acc[type] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    // Get most common incident types
    const topIncidentTypes = Object.entries(incidentTypes)
      .sort(([,a], [,b]) => (b as number) - (a as number))
      .slice(0, 3)
      .map(([type, count]) => `${type} (${count})`)
      .join(', ')

    // Generate AI summary
    const summary = `📊 **Event Summary** - ${totalIncidents} total incidents recorded
      
🔍 **Status Breakdown:**
• ${closedIncidents} closed incidents
• ${loggedIncidents} operational logs  
• ${openIncidents} open incidents requiring attention

⚠️ **Priority Analysis:**
• ${highPriorityIncidents} high priority incidents
• Most common types: ${topIncidentTypes}

${openIncidents === 0 ? '✅ **All incidents resolved** - Event running smoothly' : `🚨 **${openIncidents} incidents need attention**`}

💡 **Recommendation:** Use the AI Assistant chat for detailed incident analysis and real-time updates.`

    return NextResponse.json({
      summary,
      totalIncidents,
      openIncidents,
      highPriorityIncidents,
      lastUpdated: new Date().toISOString()
    })

  } catch (error) {
    console.error('Error in AI summary endpoint:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    const errorStack = error instanceof Error ? error.stack : undefined
    console.error('Error details:', { errorMessage, errorStack })
    return NextResponse.json({ 
      error: 'Internal server error',
      message: errorMessage
    }, { status: 500 })
  }
}
