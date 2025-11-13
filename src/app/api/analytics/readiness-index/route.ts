/**
 * Operational Readiness Index API
 * Feature 1: Real-Time Operational Readiness Index
 * 
 * GET /api/analytics/readiness-index?event_id={id}
 * GET /api/analytics/readiness-index?event_id={id}&historical=true&hours=24
 */

import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { ReadinessEngine } from '@/lib/analytics/readinessEngine'
import type { Database } from '@/types/supabase'

export const dynamic = 'force-dynamic'

// Cache for storing readiness scores
const readinessCache = new Map<string, { data: any; timestamp: number }>()
const CACHE_DURATION = 30 * 1000 // 30 seconds (real-time updates)

export async function GET(request: NextRequest) {
  try {
      const supabase = createRouteHandlerClient<any>({ cookies }) as any

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const eventId = searchParams.get('event_id')
    const historical = searchParams.get('historical') === 'true'
    const hours = parseInt(searchParams.get('hours') || '24', 10)

    if (!eventId) {
      return NextResponse.json({ error: 'event_id is required' }, { status: 400 })
    }

      // Get user's company
      const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user.id)
        .single()

      const profileData = (profile ?? null) as { company_id?: string } | null

      if (!profileData?.company_id) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 })
    }

    // Check if user has access to this event
    const { data: eventAccess, error: accessError } = await supabase
      .from('events')
      .select('id, company_id')
      .eq('id', eventId)
      .single()

    if (accessError || !eventAccess) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

      const eventAccessRecord = (eventAccess ?? null) as { company_id?: string } | null

      if (eventAccessRecord?.company_id !== profileData.company_id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Handle historical data request
    if (historical) {
      const cutoffTime = new Date(Date.now() - hours * 60 * 60 * 1000)

      const { data: historicalScores, error: historyError } = await supabase
        .from('operational_readiness')
        .select('*')
        .eq('event_id', eventId)
        .gte('timestamp', cutoffTime.toISOString())
        .order('timestamp', { ascending: true })

      if (historyError) {
        console.error('Error fetching historical readiness:', historyError)
        return NextResponse.json(
          { error: 'Failed to fetch historical data' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        historical: historicalScores || [],
        period_hours: hours,
      })
    }

    // Check cache first
    const cacheKey = `${eventId}-${user.id}`
    const cachedData = readinessCache.get(cacheKey)
    if (cachedData && Date.now() - cachedData.timestamp < CACHE_DURATION) {
      return NextResponse.json({
        success: true,
        readiness: cachedData.data,
        cached: true,
      })
    }

    // Calculate current readiness
      const engine = new ReadinessEngine(eventId, profileData.company_id, supabase)
    const readiness = await engine.calculateOverallReadiness()

    // Store in database for historical tracking
    try {
        await supabase.from('operational_readiness').insert({
          company_id: profileData.company_id,
        event_id: eventId,
        overall_score: readiness.overall_score,
        staffing_score: readiness.component_scores.staffing.score,
        incident_pressure_score: readiness.component_scores.incident_pressure.score,
        weather_score: readiness.component_scores.weather.score,
        transport_score: readiness.component_scores.transport.score,
        asset_status_score: readiness.component_scores.assets.score,
        crowd_density_score: readiness.component_scores.crowd_density.score,
        staffing_details: readiness.component_scores.staffing.details,
        incident_details: readiness.component_scores.incident_pressure.details,
        weather_details: readiness.component_scores.weather.details,
        transport_details: readiness.component_scores.transport.details,
        asset_details: readiness.component_scores.assets.details,
        crowd_details: readiness.component_scores.crowd_density.details,
        calculated_by_user_id: user.id,
        calculation_version: '1.0',
      })
    } catch (dbError) {
      // Log error but don't fail the request if DB insert fails
      console.error('Error storing readiness score:', dbError)
    }

    // Cache the result
    readinessCache.set(cacheKey, {
      data: readiness,
      timestamp: Date.now(),
    })

    // Clean up old cache entries (keep last 100)
    if (readinessCache.size > 100) {
      const entries = Array.from(readinessCache.entries())
      entries.sort((a, b) => a[1].timestamp - b[1].timestamp)
      entries.slice(0, entries.length - 100).forEach(([key]) => {
        readinessCache.delete(key)
      })
    }

    return NextResponse.json({
      success: true,
      readiness,
      cached: false,
    })
  } catch (error) {
    console.error('Readiness index API error:', error)
    return NextResponse.json(
      {
        error: 'Failed to calculate readiness index',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

