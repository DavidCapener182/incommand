import { NextRequest, NextResponse } from 'next/server'
import { getServiceSupabaseClient } from '@/lib/supabaseServer'

const supabase = getServiceSupabaseClient()

/**
 * Archive AI conversation to database
 * POST /api/chat/ai/archive
 */
export async function POST(request: NextRequest) {
  try {
    const { conversationId, eventId, companyId, userId, messages, metadata } = await request.json()

    if (!conversationId || !eventId || !companyId || !userId || !messages) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Verify user has access
    const { data: userAccess, error: accessError } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', userId)
      .single()

    if (accessError || !userAccess || userAccess.company_id !== companyId) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    // Archive conversation
    const { data, error } = await supabase
      .from('chat_messages')
      .insert({
        channel_id: `ai_archive_${conversationId}`,
        user_id: userId,
        user_callsign: 'AI Assistant',
        message: JSON.stringify(messages),
        message_type: 'system',
        channel_type: 'ai-archive',
        channel_name: 'AI Archive',
        company_id: companyId,
        event_id: eventId,
        metadata: {
          conversationId,
          messageCount: messages.length,
          archivedAt: new Date().toISOString(),
          ...metadata
        },
        created_at: new Date().toISOString(),
        read_by: [userId]
      })
      .select()
      .single()

    if (error) {
      console.error('Error archiving conversation:', error)
      return NextResponse.json(
        { error: 'Failed to archive conversation' },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      success: true,
      archivedMessage: data
    })
  } catch (error) {
    console.error('Archive error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * Get archived AI conversations
 * GET /api/chat/ai/archive?eventId=&userId=
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const eventId = searchParams.get('eventId')
    const userId = searchParams.get('userId')

    if (!eventId || !userId) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      )
    }

    // Get archived conversations
    const { data, error } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('event_id', eventId)
      .eq('user_id', userId)
      .eq('channel_type', 'ai-archive')
      .order('created_at', { ascending: false })
      .limit(20)

    if (error) {
      console.error('Error fetching archived conversations:', error)
      return NextResponse.json(
        { error: 'Failed to fetch archived conversations' },
        { status: 500 }
      )
    }

    // Parse archived messages
    const conversations: any[] = []
    data?.forEach(row => {
      try {
        const messages = JSON.parse(row.message)
        conversations.push({
          id: row.id,
          conversationId: (row.metadata as any)?.conversationId,
          messages,
          archivedAt: (row.metadata as any)?.archivedAt,
          messageCount: (row.metadata as any)?.messageCount,
          metadata: row.metadata
        })
      } catch (parseError) {
        console.warn('Error parsing archived conversation:', parseError)
      }
    })

    return NextResponse.json({ conversations })
  } catch (error) {
    console.error('Get archived error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
