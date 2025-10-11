import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(
  request: NextRequest,
  { params }: { params: { eventId: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { eventId } = params
    const body = await request.json()
    const { provider = 'openai' } = body

    // Get user's company
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', user.id)
      .single()

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    // Get event data
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('*')
      .eq('id', eventId)
      .eq('company_id', profile.company_id)
      .single()

    if (eventError) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    // Get incident data for benchmarking
    const { data: incidents, error: incidentError } = await supabase
      .from('incident_logs')
      .select('*')
      .eq('event_id', eventId)

    if (incidentError) {
      console.error('Failed to fetch incidents:', incidentError)
    }

    // Calculate basic metrics
    const totalIncidents = incidents?.length || 0
    const resolvedIncidents = incidents?.filter(i => i.status === 'closed').length || 0
    const avgResponseTime = incidents?.length ? 
      incidents.reduce((sum, i) => {
        const created = new Date(i.created_at).getTime()
        const updated = new Date(i.updated_at).getTime()
        return sum + (updated - created) / (1000 * 60) // minutes
      }, 0) / incidents.length : 0

    // Mock benchmarking data (replace with real AI analysis later)
    const benchmarkingResult = {
      eventId,
      eventName: event.name,
      venueName: event.venue_name,
      eventDate: event.event_date,
      metrics: {
        totalIncidents,
        resolvedIncidents,
        resolutionRate: totalIncidents > 0 ? (resolvedIncidents / totalIncidents) * 100 : 0,
        averageResponseTime: avgResponseTime,
        qualityScore: 8.5, // Mock score
        complianceScore: 92.3, // Mock score
        staffUtilization: 85.7, // Mock score
        incidentRate: totalIncidents / Math.max(1, 1000) // Mock per 1000 attendees
      },
      benchmarking: {
        industryAverage: {
          resolutionRate: 87.5,
          averageResponseTime: 15.2,
          qualityScore: 7.8,
          complianceScore: 89.1,
          staffUtilization: 78.3,
          incidentRate: 0.12
        },
        percentileRankings: {
          resolutionRate: 85,
          averageResponseTime: 75,
          qualityScore: 90,
          complianceScore: 88,
          staffUtilization: 82,
          incidentRate: 65
        },
        performanceGrade: 'A-',
        keyInsights: [
          'Response time is significantly better than industry average',
          'Quality score exceeds industry standards',
          'Staff utilization is above average',
          'Incident rate is within acceptable range'
        ],
        recommendations: [
          'Continue current operational procedures',
          'Consider expanding successful practices to other events',
          'Monitor compliance metrics for potential improvements'
        ]
      },
      generatedAt: new Date().toISOString()
    }

    return NextResponse.json({
      success: true,
      data: benchmarkingResult
    })
  } catch (error) {
    console.error('Benchmarking API error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to generate benchmarking data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
