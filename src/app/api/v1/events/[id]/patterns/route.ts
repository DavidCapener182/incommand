import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { generatePatternAnalysis, type IncidentData } from '@/lib/ml/patternDetection'

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

    if (!incidents || incidents.length === 0) {
      return NextResponse.json({
        success: true,
        analysis: {
          patterns: [],
          overallRisk: 'low',
          summary: 'No incidents found for pattern analysis',
          recommendations: [],
          confidence: 100
        }
      })
    }

    // Convert to IncidentData format
    const incidentData: IncidentData[] = incidents.map(incident => ({
      id: incident.id.toString(),
      timestamp: incident.timestamp,
      incident_type: incident.incident_type || 'Unknown',
      location: incident.location || 'Unknown',
      priority: incident.priority || 'medium',
      callsign_from: incident.callsign_from || '',
      callsign_to: incident.callsign_to || '',
      assigned_to: incident.assigned_to,
      responded_at: incident.responded_at,
      resolved_at: incident.resolved_at,
      is_closed: incident.is_closed || false,
      occurrence: incident.occurrence || '',
      action_taken: incident.action_taken || '',
      weather_conditions: incident.weather_conditions,
      crowd_density: incident.crowd_density
    }))

    // Generate pattern analysis
    const analysis = await generatePatternAnalysis(incidentData, provider)

    // Store the analysis results (optional)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      await supabase
        .from('pattern_analyses')
        .upsert({
          event_id: eventId,
          analyzed_by: user?.id,
          analysis_data: analysis,
          analyzed_at: new Date().toISOString(),
          provider_used: provider
        }, {
          onConflict: 'event_id'
        })
    } catch (error) {
      console.error('Failed to store pattern analysis:', error)
      // Continue without storing
    }

    return NextResponse.json({
      success: true,
      analysis,
      incidentCount: incidents.length,
      provider
    })
  } catch (error) {
    console.error('Pattern analysis error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to analyze patterns',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// GET endpoint to retrieve stored pattern analysis
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

    // Get stored pattern analysis
    const { data: storedAnalysis, error: analysisError } = await supabase
      .from('pattern_analyses')
      .select('*')
      .eq('event_id', eventId)
      .single()

    if (analysisError || !storedAnalysis) {
      return NextResponse.json(
        { error: 'No pattern analysis found for this event' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      analysis: storedAnalysis.analysis_data,
      analyzedAt: storedAnalysis.analyzed_at,
      provider: storedAnalysis.provider_used
    })
  } catch (error) {
    console.error('Pattern analysis retrieval error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to retrieve pattern analysis',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
