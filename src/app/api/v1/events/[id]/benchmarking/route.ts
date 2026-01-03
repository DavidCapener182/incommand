import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { 
  calculateEventMetrics, 
  calculatePercentileRankings, 
  generateVenueBenchmark,
  generateBenchmarkingAnalysis,
  type VenueTypeData,
  type BenchmarkingMetrics,
  type VenueBenchmark,
  type EventBenchmarkingResult
} from '@/lib/analytics/benchmarking'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const eventId = params.id
    const body = await request.json()
    const { provider = 'openai' } = body

    if (!eventId) {
      return NextResponse.json(
        { error: 'Event ID is required' },
        { status: 400 }
      )
    }

    // Get current event data
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('*')
      .eq('id', eventId)
      .single()

    if (eventError || !event) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      )
    }

    // Get incidents for current event
    const { data: incidents, error: incidentsError } = await supabase
      .from('incident_logs')
      .select('*')
      .eq('event_id', eventId)
      .order('timestamp', { ascending: true })

    if (incidentsError) {
      return NextResponse.json(
        { error: 'Failed to fetch incidents' },
        { status: 500 }
      )
    }

    // Get staff data
    const { data: staff, error: staffError } = await supabase
      .from('staff')
      .select('*')
      .eq('company_id', event.company_id)

    if (staffError) {
      console.warn('Failed to fetch staff data:', staffError)
      // Continue without staff data
    }

    // Calculate current event metrics
    const eventStart = new Date(event.doors_open_time || event.start_time)
    const eventEnd = new Date(event.venue_clear_time || event.end_time)
    const attendance = event.expected_attendance || 0

    const currentMetrics = calculateEventMetrics(
      incidents || [],
      staff || [],
      eventStart,
      eventEnd,
      attendance
    )

    // Get similar events for benchmarking - use ALL events of same event type regardless of company
    // Prefer event_type over venue_type, and normalize to lowercase
    const eventTypeRaw = event.event_type || event.venue_type || 'concert'
    const eventType = eventTypeRaw.toString().toLowerCase().trim()
    
    console.log(`[Benchmarking] Current event type: ${eventType} (from ${event.event_type ? 'event_type' : event.venue_type ? 'venue_type' : 'default'})`)
    
    // Build query - check both event_type and venue_type fields (case-insensitive)
    // Try event_type first, then fall back to checking both
    const { data: similarEvents, error: similarEventsError } = await supabase
      .from('events')
      .select(`
        id, name, event_date, expected_attendance, doors_open_time, venue_clear_time, venue_type, venue_name,
        event_type, start_time, end_time, company_id,
        incident_logs(*)
      `)
      .or(`event_type.ilike.${eventType},venue_type.ilike.${eventType}`)
      .neq('id', eventId)
      .not('event_date', 'is', null) // Only events with dates
      .order('event_date', { ascending: false })
      .limit(100) // Limit to recent similar events

    // Debug: Log what events we found
    const debugEvents = (similarEvents || []).map(e => ({
      id: e.id,
      name: e.name || e.venue_name,
      date: e.event_date,
      company_id: e.company_id,
      incident_count: e.incident_logs?.length || 0
    }))
    
    console.log(`[Benchmarking] Found ${debugEvents.length} similar ${eventType} events:`, debugEvents)

    if (similarEventsError) {
      console.warn('Failed to fetch similar events:', similarEventsError)
    }

    // Create venue data for benchmarking (always include current event for display)
    const venueData: VenueTypeData = {
      venueType: eventType,
      events: (similarEvents || []).map(similarEvent => {
        const eventStart = new Date(similarEvent.doors_open_time || similarEvent.start_time)
        const eventEnd = new Date(similarEvent.venue_clear_time || similarEvent.end_time)
        const duration = (eventEnd.getTime() - eventStart.getTime()) / 3600000

        const eventMetrics = calculateEventMetrics(
          similarEvent.incident_logs || [],
          [], // Staff data not needed for historical events
          eventStart,
          eventEnd,
          similarEvent.expected_attendance || 0
        )

        return {
          id: similarEvent.id,
          date: similarEvent.event_date,
          name: similarEvent.name || similarEvent.venue_name || `Event ${similarEvent.id.slice(0, 8)}`,
          attendance: similarEvent.expected_attendance || 0,
          duration,
          metrics: eventMetrics
        }
      })
    }

    // Always proceed even if no similar events - we'll show current event data only
    const hasComparisonData = venueData.events.length > 0

    // Generate venue benchmark (use current event as baseline if no similar events)
    let venueBenchmark: VenueBenchmark
    if (!hasComparisonData) {
      // No similar events - use current event as the benchmark baseline
      venueBenchmark = {
        venueType: eventType,
        totalEvents: 0,
        averageMetrics: currentMetrics, // Use current event metrics as baseline
        percentileRankings: {
          incidentsPerHour: 50,
          responseTime: 50,
          resolutionRate: 50,
          staffEfficiency: 50
        }
      }
    } else {
      venueBenchmark = generateVenueBenchmark(venueData)
      
      // Calculate percentile rankings for current event
      const percentileRankings = calculatePercentileRankings(currentMetrics, venueData)
      venueBenchmark.percentileRankings = percentileRankings as {
        incidentsPerHour: number
        responseTime: number
        resolutionRate: number
        staffEfficiency: number
      }
    }

    // Generate AI analysis (or use fallback if no comparison data)
    let benchmarkingResult: EventBenchmarkingResult
    if (!hasComparisonData) {
      // No comparison data - provide basic result without comparison
      benchmarkingResult = {
        currentEvent: {
          venueType: eventType,
          metrics: currentMetrics
        },
        benchmark: venueBenchmark,
        percentileRanking: 50, // Neutral percentile when no comparison
        comparison: `This is the only ${eventType} event in the system. Add more events of this type to enable benchmarking comparisons.`,
        strengths: ['Event data is available for analysis'],
        improvements: ['Add more similar events to enable benchmarking'],
        recommendations: ['Continue collecting event data', 'More events will provide better comparisons']
      }
    } else {
      benchmarkingResult = await generateBenchmarkingAnalysis(
        {
          venueType: eventType,
          metrics: currentMetrics
        },
        venueBenchmark,
        provider
      )
    }

    // Store benchmarking results (optional)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      await supabase
        .from('benchmarking_results')
        .upsert({
          event_id: eventId,
          analyzed_by: user?.id,
          benchmarking_data: benchmarkingResult,
          analyzed_at: new Date().toISOString(),
          provider_used: provider
        }, {
          onConflict: 'event_id'
        })
    } catch (error) {
      console.error('Failed to store benchmarking results:', error)
      // Continue without storing
    }

    return NextResponse.json({
      success: true,
      benchmarking: benchmarkingResult,
      venueType: eventType,
      totalSimilarEvents: venueData.events.length,
      provider,
      debug: {
        eventsUsed: debugEvents,
        currentEventId: eventId,
        currentEventName: event.name || event.venue_name || event.event_name,
        comparisonAvailable: hasComparisonData,
        eventTypeUsed: eventType,
        eventTypeSource: event.event_type ? 'event_type' : event.venue_type ? 'venue_type' : 'default'
      }
    })
  } catch (error) {
    console.error('Benchmarking analysis error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to generate benchmarking analysis',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// GET endpoint to retrieve stored benchmarking results
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const eventId = params.id

    if (!eventId) {
      return NextResponse.json(
        { error: 'Event ID is required' },
        { status: 400 }
      )
    }

    // Get stored benchmarking results
    const { data: storedResults, error: resultsError } = await supabase
      .from('benchmarking_results')
      .select('*')
      .eq('event_id', eventId)
      .single()

    if (resultsError || !storedResults) {
      return NextResponse.json(
        { error: 'No benchmarking results found for this event' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      benchmarking: storedResults.benchmarking_data,
      analyzedAt: storedResults.analyzed_at,
      provider: storedResults.provider_used
    })
  } catch (error) {
    console.error('Benchmarking results retrieval error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to retrieve benchmarking results',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
