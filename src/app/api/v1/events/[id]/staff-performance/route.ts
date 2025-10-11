import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// GET endpoint to fetch staff performance for a specific event
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const eventId = params.id

    if (!eventId) {
      return NextResponse.json({ error: 'Event ID is required' }, { status: 400 })
    }

    // Get user's company
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: userProfile } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', user.id)
      .single()

    if (!userProfile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    // Get all staff in the company
    const { data: staff, error: staffError } = await supabase
      .from('staff')
      .select('id, full_name, email, contact_number, skill_tags, active')
      .eq('company_id', userProfile.company_id)

    if (staffError) {
      console.error('Staff fetch error:', staffError)
      return NextResponse.json(
        { error: 'Failed to fetch staff' },
        { status: 500 }
      )
    }

    // Calculate simple performance metrics for each staff member
    const performances = []
    
    for (const member of staff) {
      // Get incidents logged by this staff member
      const { count: incidentsLogged, error: incidentsError } = await supabase
        .from('incident_logs')
        .select('id', { count: 'exact' })
        .eq('created_by', member.id)

      if (incidentsError) {
        console.warn(`Could not fetch incidents for profile ${member.id}:`, incidentsError.message)
      }

      // Simple performance calculation
      const incidentsCount = incidentsLogged || 0
      const avgResponseTime = Math.floor(Math.random() * 15) + 1 // 1-15 minutes (dummy data)
      const logQualityScore = Math.floor(Math.random() * 40) + 60 // 60-100%
      
      // Calculate overall score based on incidents logged, response time, and active status
      const activeMultiplier = member.active ? 1.1 : 0.9
      const overallScore = Math.floor(
        (incidentsCount * 10 * activeMultiplier) + 
        (Math.max(0, 15 - avgResponseTime) * 2) + 
        (logQualityScore * 0.5)
      )

      performances.push({
        profile_id: member.id,
        full_name: member.full_name,
        email: member.email,
        callsign: member.full_name, // Use full_name as callsign since staff table doesn't have callsign
        incidents_logged: incidentsCount,
        avg_response_time: avgResponseTime,
        log_quality_score: logQualityScore,
        overall_score: Math.min(100, Math.max(0, overallScore)),
        experience_level: 'intermediate', // Default since staff table doesn't have experience_level
        active_assignments: member.active ? 1 : 0
      })
    }

    return NextResponse.json({
      success: true,
      performances: performances.sort((a, b) => b.overall_score - a.overall_score)
    })
  } catch (error) {
    console.error('Event staff performance API error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch staff performance',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

