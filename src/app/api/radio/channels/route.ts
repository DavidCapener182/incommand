import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { Database } from '@/types/supabase'
import { RadioChannel } from '@/types/radio'

export async function GET(request: NextRequest) {
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

    // Build query to get distinct channels with latest health data
    let query = supabase
      .from('radio_messages')
      .select('channel, created_at')
      .in('company_id', companyIds)

    if (eventId) {
      query = query.eq('event_id', eventId)
    }

    const { data: messages, error: messagesError } = await query

    if (messagesError) {
      console.error('Error fetching radio channels:', messagesError)
      return NextResponse.json({ error: messagesError.message }, { status: 500 })
    }

    // Get unique channels
    const channels = new Set(messages?.map(m => m.channel) || [])
    
    // Get latest health data for each channel
    const channelData: RadioChannel[] = []
    
    for (const channel of channels) {
      // Get message count for this channel
      let channelQuery = supabase
        .from('radio_messages')
        .select('created_at', { count: 'exact', head: false })
        .eq('channel', channel)
        .in('company_id', companyIds)

      if (eventId) {
        channelQuery = channelQuery.eq('event_id', eventId)
      }

      const { count: messageCount } = await channelQuery

      // Get latest message timestamp
      let latestQuery = supabase
        .from('radio_messages')
        .select('created_at')
        .eq('channel', channel)
        .in('company_id', companyIds)
        .order('created_at', { ascending: false })
        .limit(1)

      if (eventId) {
        latestQuery = latestQuery.eq('event_id', eventId)
      }

      const { data: latestMessage } = await latestQuery

      // Get latest health score
      let healthQuery = supabase
        .from('radio_channel_health')
        .select('health_score, overload_indicator, timestamp')
        .eq('channel', channel)
        .in('company_id', companyIds)
        .order('timestamp', { ascending: false })
        .limit(1)

      if (eventId) {
        healthQuery = healthQuery.eq('event_id', eventId)
      }

      const { data: healthData } = await healthQuery

      channelData.push({
        channel,
        message_count: messageCount || 0,
        latest_message_at: latestMessage?.[0]?.created_at || null,
        health_score: healthData?.[0]?.health_score || null,
        overload_indicator: healthData?.[0]?.overload_indicator || false,
      })
    }

    return NextResponse.json({ data: channelData })
  } catch (error: any) {
    console.error('Error in GET /api/radio/channels:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

