// API Route: Update Channel Health Metrics
// POST /api/radio/channels/update-health
// Manually trigger health calculation for all channels or a specific channel

import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { Database } from '@/types/supabase'
import { updateChannelHealth, updateAllChannelHealth } from '@/lib/radio/channelHealth'

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient<any>({ cookies })
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's company from profiles
    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', user.id)
      .single()

    if (!profile || !profile.company_id) {
      return NextResponse.json({ error: 'No company found' }, { status: 403 })
    }

    const body = await request.json()
    const { channel, event_id, time_window_minutes = 5 } = body

    // If channel is specified, update that channel only
    if (channel) {
      const result = await updateChannelHealth(
        supabase,
        channel,
        event_id || null,
        profile.company_id,
        time_window_minutes
      )

      if (!result.success) {
        return NextResponse.json(
          { error: result.error || 'Failed to update channel health' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        channel,
        metrics: result.metrics,
      })
    }

    // Otherwise, update all channels
    const result = await updateAllChannelHealth(
      supabase,
      event_id || null,
      profile.company_id,
      time_window_minutes
    )

    return NextResponse.json({
      success: result.success,
      updated: result.updated,
      errors: result.errors,
    })
  } catch (error: any) {
    console.error('Error in POST /api/radio/channels/update-health:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

