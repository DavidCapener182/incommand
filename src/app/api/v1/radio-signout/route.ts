import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// POST endpoint to sign out a radio
export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const body = await request.json()
    const { radio_number, event_id, signed_out_signature, signed_out_notes } = body

    // Validate required fields
    if (!radio_number || !event_id || !signed_out_signature) {
      return NextResponse.json(
        { error: 'radio_number, event_id, and signed_out_signature are required' },
        { status: 400 }
      )
    }

    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Create sign-out record
    const { data: signOut, error: signOutError } = await supabase
      .from('radio_signouts')
      .insert({
        radio_number,
        event_id,
        user_id: user.id,
        signed_out_signature,
        signed_out_notes: signed_out_notes || null,
        status: 'out'
      })
      .select()
      .single()

    if (signOutError) {
      console.error('Sign-out error:', signOutError)
      return NextResponse.json(
        { error: 'Failed to sign out radio' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      signout: signOut
    })
  } catch (error) {
    console.error('Radio sign-out API error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to sign out radio',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
