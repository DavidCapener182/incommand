/**
 * Doctrine Assistant API
 * Feature 2: Live Doctrine Assistant & Dynamic SOP Adjustment Engine
 * 
 * GET /api/doctrine/assistant?event_id={id} - Get assistant state
 */

import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import type { Database } from '@/types/supabase'
import { DoctrineAssistant } from '@/lib/doctrine/assistant'

export const dynamic = 'force-dynamic'

// Cache for assistant state
const assistantCache = new Map<string, { data: any; timestamp: number }>()
const CACHE_DURATION = 30 * 1000 // 30 seconds

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient<any>({ cookies })

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

    if (!eventId) {
      return NextResponse.json({ error: 'event_id is required' }, { status: 400 })
    }

    // Get user's company
    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', user.id)
      .single()

    if (!profile?.company_id) {
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

    if (eventAccess.company_id !== profile.company_id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Check cache
    const cacheKey = `${eventId}-${user.id}`
    const cachedData = assistantCache.get(cacheKey)
    if (cachedData && Date.now() - cachedData.timestamp < CACHE_DURATION) {
      return NextResponse.json({
        success: true,
        state: cachedData.data,
        cached: true,
      })
    }

    // Get assistant state
    try {
      const assistant = new DoctrineAssistant(eventId, profile.company_id, supabase)
      const state = await assistant.getState()

      // Cache the result
      assistantCache.set(cacheKey, {
        data: state,
        timestamp: Date.now(),
      })

      // Clean up old cache entries
      if (assistantCache.size > 100) {
        const entries = Array.from(assistantCache.entries())
        entries.sort((a, b) => a[1].timestamp - b[1].timestamp)
        entries.slice(0, entries.length - 100).forEach(([key]) => {
          assistantCache.delete(key)
        })
      }

      return NextResponse.json({
        success: true,
        state,
        cached: false,
      })
    } catch (dbError: any) {
      // If tables don't exist yet, return empty state
      if (dbError?.message?.includes('does not exist') || dbError?.code === '42P01') {
        return NextResponse.json({
          success: true,
          state: {
            active_sops: [],
            pending_adjustments: [],
            suggestions: [],
            monitored_conditions: [],
            last_updated: new Date().toISOString(),
          },
          cached: false,
          note: 'SOP tables not yet initialized',
        })
      }
      throw dbError
    }
  } catch (error) {
    console.error('Doctrine assistant API error:', error)
    return NextResponse.json(
      {
        error: 'Failed to get assistant state',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

