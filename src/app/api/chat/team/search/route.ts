import { NextRequest, NextResponse } from 'next/server'
import { getServiceSupabaseClient } from '@/lib/supabaseServer'

const supabase = getServiceSupabaseClient()

/**
 * Search messages in Event+Company scope
 * POST /api/chat/team/search
 */
export async function POST(request: NextRequest) {
  try {
    const { eventId, companyId, query, limit = 20 } = await request.json()

    if (!eventId || !companyId || !query) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Search messages
    const { data, error } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('event_id', eventId)
      .eq('company_id', companyId)
      .eq('channel_type', 'team')
      .textSearch('message', query)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Error searching messages:', error)
      return NextResponse.json(
        { error: 'Failed to search messages' },
        { status: 500 }
      )
    }

    return NextResponse.json({ messages: data || [] })
  } catch (error) {
    console.error('Search error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

