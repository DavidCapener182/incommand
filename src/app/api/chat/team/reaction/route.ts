import { NextRequest, NextResponse } from 'next/server'
import { getServiceSupabaseClient } from '@/lib/supabaseServer'

const supabase = getServiceSupabaseClient()

/** Untyped supabase-like client for tables not in generated types (e.g. chat_message_reactions) */
type UntypedSupabase = {
  from: (table: string) => {
    upsert: (row: object) => Promise<{ error: Error | null }>
    delete: () => {
      eq: (c: string, v: unknown) => { eq: (c: string, v: unknown) => { eq: (c: string, v: unknown) => Promise<{ error: Error | null }> } }
    }
  }
}

/**
 * Add or remove reaction to message
 * POST /api/chat/team/reaction
 */
export async function POST(request: NextRequest) {
  try {
    const { messageId, userId, emoji, action = 'add' } = await request.json()

    if (!messageId || !userId || !emoji) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // chat_message_reactions not in generated DB types
    const db = supabase as unknown as UntypedSupabase

    if (action === 'add') {
      const { error } = await db
        .from('chat_message_reactions')
        .upsert({
          message_id: messageId,
          user_id: userId,
          emoji,
          created_at: new Date().toISOString()
        })

      if (error) {
        console.error('Error adding reaction:', error)
        return NextResponse.json(
          { error: 'Failed to add reaction' },
          { status: 500 }
        )
      }
    } else if (action === 'remove') {
      const { error } = await db
        .from('chat_message_reactions')
        .delete()
        .eq('message_id', messageId)
        .eq('user_id', userId)
        .eq('emoji', emoji)

      if (error) {
        console.error('Error removing reaction:', error)
        return NextResponse.json(
          { error: 'Failed to remove reaction' },
          { status: 500 }
        )
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Reaction error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
