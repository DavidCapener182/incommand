import { NextRequest, NextResponse } from 'next/server'
import { getServiceSupabaseClient } from '@/lib/supabaseServer'
import { createClient } from '@supabase/supabase-js'

// Initialize Supabase client
const supabase = getServiceSupabaseClient()

/**
 * Send team message
 * POST /api/chat/team/send
 */
export async function POST(request: NextRequest) {
  try {
    const { eventId, companyId, channelName, message, metadata, userId, userCallsign } = await request.json()

    // Validate required fields
    if (!eventId || !companyId || !channelName || !message || !userId || !userCallsign) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Verify user has access to this company and event
    const { data: userAccess, error: accessError } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', userId)
      .single()

    if (accessError || !userAccess) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    if (userAccess.company_id !== companyId) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    // Check if user is assigned to this event
    const { data: eventAccess, error: eventError } = await supabase
      .from('event_staff')
      .select('event_id')
      .eq('user_id', userId)
      .eq('event_id', eventId)
      .single()

    if (eventError || !eventAccess) {
      return NextResponse.json(
        { error: 'User not assigned to this event' },
        { status: 403 }
      )
    }

    // Insert message
    const { data, error } = await supabase
      .from('chat_messages')
      .insert({
        channel_id: `${eventId}_${companyId}_${channelName}`,
        user_id: userId,
        user_callsign: userCallsign,
        message,
        message_type: metadata?.fileUrl ? 'file' : metadata?.latitude ? 'location' : 'text',
        metadata,
        channel_type: 'team',
        channel_name: channelName,
        company_id: companyId,
        event_id: eventId,
        created_at: new Date().toISOString(),
        read_by: [userId]
      })
      .select()
      .single()

    if (error) {
      console.error('Error inserting message:', error)
      return NextResponse.json(
        { error: 'Failed to send message' },
        { status: 500 }
      )
    }

    return NextResponse.json({ message: data })
  } catch (error) {
    console.error('Team chat send error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * Get channel history
 * GET /api/chat/team/history?eventId=&companyId=&channel=&limit=&before=
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const eventId = searchParams.get('eventId')
    const companyId = searchParams.get('companyId')
    const channel = searchParams.get('channel')
    const limit = parseInt(searchParams.get('limit') || '50')
    const before = searchParams.get('before')

    if (!eventId || !companyId || !channel) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      )
    }

    // Build query
    let query = supabase
      .from('chat_messages')
      .select('*')
      .eq('event_id', eventId)
      .eq('company_id', companyId)
      .eq('channel_name', channel)
      .eq('channel_type', 'team')
      .order('created_at', { ascending: false })
      .limit(limit)

    if (before) {
      query = query.lt('created_at', before)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching history:', error)
      return NextResponse.json(
        { error: 'Failed to fetch history' },
        { status: 500 }
      )
    }

    return NextResponse.json({ messages: data?.reverse() || [] })
  } catch (error) {
    console.error('Team chat history error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
