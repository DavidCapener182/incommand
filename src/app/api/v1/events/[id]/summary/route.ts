import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { generateEventSummary } from '@/lib/ai/eventSummaryGenerator'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

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

    // Get event data
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

    // Get incidents for this event
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
      .from('profiles')
      .select('*')
      .in('organization_id', [event.organization_id])

    if (staffError) {
      return NextResponse.json(
        { error: 'Failed to fetch staff data' },
        { status: 500 }
      )
    }

    // Get weather data if available
    let weather = null
    try {
      const { data: weatherData } = await supabase
        .from('weather_logs')
        .select('*')
        .eq('event_id', eventId)
        .order('timestamp', { ascending: false })
        .limit(1)
        .single()
      
      weather = weatherData
    } catch (error) {
      // Weather data is optional
      console.log('No weather data available')
    }

    // Generate comprehensive event summary
    const summary = await generateEventSummary(event, incidents || [], staff || [], weather)

    return NextResponse.json({
      success: true,
      summary
    })
  } catch (error) {
    console.error('Event summary generation error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to generate event summary',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// POST endpoint to generate and store summary
export async function POST(
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

    // Generate the summary (reuse GET logic)
    const response = await GET(request, { params })
    const summaryData = await response.json()

    if (!summaryData.success) {
      return NextResponse.json(summaryData, { status: response.status })
    }

    // Store the generated summary in database
    const { data: { user } } = await supabase.auth.getUser()
    
    const { error: insertError } = await supabase
      .from('event_summaries')
      .insert({
        event_id: eventId,
        generated_by: user?.id,
        summary_data: summaryData.summary,
        generated_at: new Date().toISOString()
      })

    if (insertError) {
      console.error('Failed to store summary:', insertError)
      // Still return the summary even if storage fails
    }

    return NextResponse.json({
      success: true,
      summary: summaryData.summary,
      stored: !insertError
    })
  } catch (error) {
    console.error('Event summary storage error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to store event summary',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
