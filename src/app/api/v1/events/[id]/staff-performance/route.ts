import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

// Fuzzy matching function to find staff in incident logs
function findStaffInLogs(staffName: string, incidentLogs: any[]): { matched: boolean; incidents: any[] } {
  const normalizedStaffName = staffName.toLowerCase().trim()
  
  // Try exact match first (full name)
  let matchedIncidents = incidentLogs.filter(log => 
    log.callsign_from?.toLowerCase().includes(normalizedStaffName) ||
    log.assigned_to?.toLowerCase().includes(normalizedStaffName)
  )
  
  if (matchedIncidents.length > 0) {
    return { matched: true, incidents: matchedIncidents }
  }
  
  
  // Try fuzzy matching with name parts (first name, last name, etc.)
  const nameParts = normalizedStaffName.split(' ').filter(part => part.length > 1)
  for (const log of incidentLogs) {
    const logCallsign = log.callsign_from?.toLowerCase() || ''
    const logAssigned = log.assigned_to?.toLowerCase() || ''
    
    // Check if any name part matches (handles "Jimmy" matching "Jimmy Norrie")
    const hasMatch = nameParts.some(part => 
      part.length > 2 && (
        logCallsign.includes(part) ||
        logAssigned.includes(part)
      )
    )
    
    if (hasMatch) {
      matchedIncidents.push(log)
    }
  }
  
  return { matched: matchedIncidents.length > 0, incidents: matchedIncidents }
}

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// GET endpoint to fetch staff performance for a specific event
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('Staff performance API called with eventId:', params.id)
    const supabase = createRouteHandlerClient({ cookies })
    const eventId = params.id

    if (!eventId) {
      console.log('No eventId provided')
      return NextResponse.json({ error: 'Event ID is required' }, { status: 400 })
    }

    // Get user's company
    console.log('Getting user...')
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      console.log('No user found')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('Getting user profile for user:', user.id)
    const { data: userProfile } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', user.id)
      .single()

    if (!userProfile) {
      console.log('No user profile found')
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    console.log('User company_id:', userProfile.company_id)

    // Get all staff in the company (from profiles table)
    console.log('Fetching staff for company:', userProfile.company_id)
    const { data: staff, error: staffError } = await supabase
      .from('profiles')
      .select('id, full_name, email, phone_number, skill_tags, is_staff')
      .eq('company_id', userProfile.company_id)
      .eq('is_staff', true)

    if (staffError) {
      console.error('Staff fetch error:', staffError)
      return NextResponse.json(
        { error: 'Failed to fetch staff' },
        { status: 500 }
      )
    }

    console.log('Found staff:', staff?.length || 0, 'members')

    // Get all incident logs for the event to use for fuzzy matching
    console.log('Fetching incident logs for event:', eventId)
    const { data: allIncidentLogs, error: logsError } = await supabase
      .from('incident_logs')
      .select('id, timestamp, responded_at, callsign_from, assigned_to, occurrence, action_taken, location, incident_type, priority')
      .eq('event_id', eventId)

    if (logsError) {
      console.error('Error fetching incident logs:', logsError)
      return NextResponse.json({ error: 'Failed to fetch incident logs' }, { status: 500 })
    }

    console.log('Found incident logs:', allIncidentLogs?.length || 0, 'logs')

    // Calculate performance metrics for each staff member using fuzzy matching
    const performances = []
    
    for (const member of staff) {
      // Use fuzzy matching to find incidents for this staff member
      const { matched, incidents } = findStaffInLogs(member.full_name, allIncidentLogs || [])
      
      if (!matched) {
        continue // Skip staff members with no matching incidents
      }

      const incidentsCount = incidents.length
      
      // Calculate real average response time from matched incidents
      let avgResponseTime = 0
      const responseTimeIncidents = incidents.filter(incident => incident.responded_at)
      if (responseTimeIncidents.length > 0) {
        const responseTimes = responseTimeIncidents.map(incident => {
          const created = new Date(incident.timestamp)
          const responded = new Date(incident.responded_at)
          return (responded.getTime() - created.getTime()) / (1000 * 60) // Convert to minutes
        })
        avgResponseTime = responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length
      }
      
      // Calculate real log quality score based on incident completeness
      let logQualityScore = 0
      if (incidents.length > 0) {
        const qualityScores = incidents.map(incident => {
          let score = 0
          if (incident.occurrence && incident.occurrence.trim() !== '') score += 20
          if (incident.action_taken && incident.action_taken.trim() !== '') score += 20
          if (incident.location && incident.location.trim() !== '') score += 20
          if (incident.incident_type && incident.incident_type.trim() !== '') score += 20
          if (incident.priority && incident.priority.trim() !== '') score += 20
          return score
        })
        logQualityScore = qualityScores.reduce((sum, score) => sum + score, 0) / qualityScores.length
      }
      
      // Calculate overall score based on real data
      const activeMultiplier = member.is_staff ? 1.1 : 0.9
      const responseTimeScore = avgResponseTime > 0 ? Math.max(0, 15 - avgResponseTime) * 2 : 0
      const overallScore = Math.floor(
        (incidentsCount * 10 * activeMultiplier) + 
        responseTimeScore + 
        (logQualityScore * 0.5)
      )

      performances.push({
        profile_id: member.id,
        full_name: member.full_name,
        email: member.email,
        callsign: member.full_name,
        incidents_logged: incidentsCount,
        avg_response_time: avgResponseTime,
        log_quality_score: logQualityScore,
        overall_score: Math.min(100, Math.max(0, overallScore)),
        experience_level: 'intermediate',
        active_assignments: member.is_staff ? 1 : 0
      })
    }

    console.log('Returning performances:', performances.length)
    return NextResponse.json({
      success: true,
      performances: performances.sort((a, b) => b.overall_score - a.overall_score)
    })
  } catch (error) {
    console.error('Event staff performance API error:', error)
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack')
    return NextResponse.json(
      { 
        error: 'Failed to fetch staff performance',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

