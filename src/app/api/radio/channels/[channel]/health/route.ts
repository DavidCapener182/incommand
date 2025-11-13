import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { Database } from '@/types/supabase'
import { RadioChannelHealthInsert } from '@/types/radio'

export async function GET(
  request: NextRequest,
  { params }: { params: { channel: string } }
) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies })
    
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

    const companyIds = [profile.company_id]
    const eventId = request.nextUrl.searchParams.get('event_id')
    const hours = parseInt(request.nextUrl.searchParams.get('hours') || '24')

    const timeWindow = new Date()
    timeWindow.setHours(timeWindow.getHours() - hours)

    // Build query
    let query = supabase
      .from('radio_channel_health')
      .select('*')
      .eq('channel', decodeURIComponent(params.channel))
      .in('company_id', companyIds)
      .gte('timestamp', timeWindow.toISOString())
      .order('timestamp', { ascending: false })

    if (eventId) {
      query = query.eq('event_id', eventId)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching channel health:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data: data || [] })
  } catch (error: any) {
    console.error('Error in GET /api/radio/channels/[channel]/health:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { channel: string } }
) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies })
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's company from profiles (for POST)
    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', user.id)
      .single()

    if (!profile || !profile.company_id) {
      return NextResponse.json({ error: 'No company found' }, { status: 403 })
    }

    const body = await request.json()
    const healthData: RadioChannelHealthInsert = {
      company_id: body.company_id || profile.company_id,
      event_id: body.event_id || null,
      channel: decodeURIComponent(params.channel),
      message_count: body.message_count || 0,
      avg_response_time_seconds: body.avg_response_time_seconds || null,
      overload_indicator: body.overload_indicator || false,
      health_score: body.health_score || null,
      metadata: body.metadata || {},
    }

    // Verify company access
    if (healthData.company_id !== profile.company_id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const { data, error } = await supabase
      .from('radio_channel_health')
      .insert(healthData)
      .select()
      .single()

    if (error) {
      console.error('Error creating channel health record:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data }, { status: 201 })
  } catch (error: any) {
    console.error('Error in POST /api/radio/channels/[channel]/health:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

