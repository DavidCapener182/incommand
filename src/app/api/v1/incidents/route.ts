/**
 * REST API Gateway - Incidents Endpoint
 * Public API for third-party integrations
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServiceClient } from '@/lib/supabaseServer'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const supabase = getServiceClient()

// API Key validation
function validateApiKey(request: NextRequest): boolean {
  const apiKey = request.headers.get('X-API-Key')
  const validApiKeys = process.env.API_KEYS?.split(',') || []
  
  return apiKey !== null && validApiKeys.includes(apiKey)
}

// GET /api/v1/incidents - List incidents
export async function GET(request: NextRequest) {
  try {
    // Validate API key
    if (!validateApiKey(request)) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Invalid API key' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    
    // Query parameters
    const eventId = searchParams.get('event_id')
    const status = searchParams.get('status')
    const priority = searchParams.get('priority')
    const incidentType = searchParams.get('type')
    const limit = parseInt(searchParams.get('limit') || '100')
    const offset = parseInt(searchParams.get('offset') || '0')
    const sortBy = searchParams.get('sort_by') || 'timestamp'
    const sortOrder = searchParams.get('sort_order') || 'desc'

    // Build query
    let query = supabase
      .from('incident_logs')
      .select(
        `
          id,
          event_id,
          incident_type,
          priority,
          status,
          occurrence,
          action_taken,
          timestamp,
          is_closed,
          time_logged,
          logged_by_callsign,
          callsign_from,
          callsign_to,
          location,
          incident_photos (
            id,
            incident_id,
            photo_url,
            file_type,
            created_at
          )
        `,
        { count: 'exact' }
      )

    if (eventId) query = query.eq('event_id', eventId)
    if (status === 'open') query = query.eq('is_closed', false)
    if (status === 'closed') query = query.eq('is_closed', true)
    if (priority) query = query.eq('priority', priority)
    if (incidentType) query = query.eq('incident_type', incidentType)

    query = query
      .order(sortBy, { ascending: sortOrder === 'asc' })
      .range(offset, offset + limit - 1)

    const { data, error, count } = await query

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Database error', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data,
      pagination: {
        total: count,
        limit,
        offset,
        hasMore: count ? offset + limit < count : false
      },
      meta: {
        timestamp: new Date().toISOString(),
        version: '1.0'
      }
    })

  } catch (error: any) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

// POST /api/v1/incidents - Create incident
export async function POST(request: NextRequest) {
  try {
    // Validate API key
    if (!validateApiKey(request)) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Invalid API key' },
        { status: 401 }
      )
    }

    const body = await request.json()

    // Validate required fields
    const requiredFields = ['event_id', 'incident_type', 'occurrence']
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { error: 'Validation error', message: `Missing required field: ${field}` },
          { status: 400 }
        )
      }
    }

    // Create incident
    const { data, error } = await supabase
      .from('incident_logs')
      .insert({
        event_id: body.event_id,
        incident_type: body.incident_type,
        occurrence: body.occurrence,
        action_taken: body.action_taken || '',
        priority: body.priority || 'medium',
        callsign_from: body.callsign_from || 'API',
        callsign_to: body.callsign_to || 'Control',
        timestamp: body.timestamp || new Date().toISOString(),
        is_closed: body.is_closed || false,
        entry_type: body.entry_type || 'contemporaneous',
        logged_by_callsign: body.logged_by_callsign || 'API',
        time_of_occurrence: body.time_of_occurrence || new Date().toISOString(),
        time_logged: new Date().toISOString()
      })
      .select('id, event_id, incident_type, priority, occurrence, action_taken, timestamp, is_closed, logged_by_callsign, callsign_from, callsign_to, time_logged')
      .single()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Database error', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data,
      meta: {
        timestamp: new Date().toISOString(),
        version: '1.0'
      }
    }, { status: 201 })

  } catch (error: any) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}
