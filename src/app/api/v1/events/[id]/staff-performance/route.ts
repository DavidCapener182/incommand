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

    // Get user's organization
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: userProfile } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', user.id)
      .single()

    if (!userProfile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    // Verify the event belongs to the user's organization
    const { data: event } = await supabase
      .from('events')
      .select('organization_id')
      .eq('id', eventId)
      .single()

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    if (event.organization_id !== userProfile.organization_id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Get staff performance data
    const { data: performances, error: performanceError } = await supabase
      .from('staff_performance')
      .select(`
        *,
        profiles!inner(
          id,
          first_name,
          last_name,
          callsign,
          email
        )
      `)
      .eq('event_id', eventId)

    if (performanceError) {
      console.error('Staff performance error:', performanceError)
      return NextResponse.json(
        { error: 'Failed to fetch staff performance' },
        { status: 500 }
      )
    }

    // If no performance data exists, calculate it for all staff in the event's organization
    if (!performances || performances.length === 0) {
      // Get all staff in the organization
      const { data: staff } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, callsign, email')
        .eq('organization_id', event.organization_id)

      if (staff && staff.length > 0) {
        // Calculate performance for each staff member
        const calculatedPerformances = []
        
        for (const member of staff) {
          const { data: performanceMetrics } = await supabase
            .rpc('calculate_staff_performance', { 
              p_event_id: eventId, 
              p_profile_id: member.id 
            })

          if (performanceMetrics && performanceMetrics.length > 0) {
            const metrics = performanceMetrics[0]
            
            // Insert or update the performance record
            const { data: performanceRecord } = await supabase
              .from('staff_performance')
              .upsert({
                profile_id: member.id,
                event_id: eventId,
                performance_score: metrics.performance_score,
                incidents_handled: metrics.incidents_handled,
                avg_response_time_minutes: metrics.avg_response_time_minutes,
                log_quality_score: metrics.log_quality_score,
                resolution_rate: metrics.resolution_rate,
                calculated_at: new Date().toISOString()
              }, {
                onConflict: 'profile_id,event_id'
              })
              .select(`
                *,
                profiles!inner(
                  id,
                  first_name,
                  last_name,
                  callsign,
                  email
                )
              `)
              .single()

            if (performanceRecord) {
              calculatedPerformances.push(performanceRecord)
            }
          }
        }

        return NextResponse.json({
          success: true,
          performances: calculatedPerformances
        })
      }
    }

    return NextResponse.json({
      success: true,
      performances: performances || []
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

// POST endpoint to recalculate performance for all staff
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const eventId = params.id

    if (!eventId) {
      return NextResponse.json({ error: 'Event ID is required' }, { status: 400 })
    }

    // Get user's organization
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: userProfile } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', user.id)
      .single()

    if (!userProfile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    // Verify the event belongs to the user's organization
    const { data: event } = await supabase
      .from('events')
      .select('organization_id')
      .eq('id', eventId)
      .single()

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    if (event.organization_id !== userProfile.organization_id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Get all staff in the organization
    const { data: staff } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, callsign, email')
      .eq('organization_id', event.organization_id)

    if (!staff || staff.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No staff found to calculate performance for'
      })
    }

    // Calculate performance for each staff member
    const calculatedPerformances = []
    
    for (const member of staff) {
      const { data: performanceMetrics } = await supabase
        .rpc('calculate_staff_performance', { 
          p_event_id: eventId, 
          p_profile_id: member.id 
        })

      if (performanceMetrics && performanceMetrics.length > 0) {
        const metrics = performanceMetrics[0]
        
        // Insert or update the performance record
        const { data: performanceRecord } = await supabase
          .from('staff_performance')
          .upsert({
            profile_id: member.id,
            event_id: eventId,
            performance_score: metrics.performance_score,
            incidents_handled: metrics.incidents_handled,
            avg_response_time_minutes: metrics.avg_response_time_minutes,
            log_quality_score: metrics.log_quality_score,
            resolution_rate: metrics.resolution_rate,
            calculated_at: new Date().toISOString()
          }, {
            onConflict: 'profile_id,event_id'
          })
          .select(`
            *,
            profiles!inner(
              id,
              first_name,
              last_name,
              callsign,
              email
            )
          `)
          .single()

        if (performanceRecord) {
          calculatedPerformances.push(performanceRecord)
        }
      }
    }

    return NextResponse.json({
      success: true,
      performances: calculatedPerformances,
      message: `Performance calculated for ${calculatedPerformances.length} staff members`
    })
  } catch (error) {
    console.error('Recalculate performance API error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to recalculate performance',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
