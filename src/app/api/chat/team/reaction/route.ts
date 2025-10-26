import { NextRequest, NextResponse } from 'next/server'
import { getServiceSupabaseClient } from '@/lib/supabaseServer'

const supabase = getServiceSupabaseClient()

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

    // TODO: Implement when chat_message_reactions table is created
    console.log('Reaction action:', { messageId, userId, emoji, action })
    
    // if (action === 'add') {
    //   // Add reaction
    //   const { error } = await supabase
    //     .from('chat_message_reactions')
    //     .upsert({
    //       message_id: messageId,
    //       user_id: userId,
    //       emoji,
    //       created_at: new Date().toISOString()
    //     })

    //   if (error) {
    //     console.error('Error adding reaction:', error)
    //     return NextResponse.json(
    //       { error: 'Failed to add reaction' },
    //       { status: 500 }
    //     )
    //   }
    // } else if (action === 'remove') {
    //   // Remove reaction
    //   const { error } = await supabase
    //     .from('chat_message_reactions')
    //     .delete()
    //     .eq('message_id', messageId)
    //     .eq('user_id', userId)
    //     .eq('emoji', emoji)

    //   if (error) {
    //     console.error('Error removing reaction:', error)
    //     return NextResponse.json(
    //       { error: 'Failed to remove reaction' },
    //       { status: 500 }
    //     )
    //   }
    // }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Reaction error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
