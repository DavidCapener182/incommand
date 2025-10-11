import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// GET endpoint to fetch radio signouts for an event
export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { searchParams } = new URL(request.url)
    const eventId = searchParams.get('event_id')

    if (!eventId) {
      return NextResponse.json({ error: 'event_id is required' }, { status: 400 })
    }

    // Get user's company
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: userProfile } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', user.id)
      .single()

    if (!userProfile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    // Get radio signouts with staff information
    const { data: signOuts, error: signOutsError } = await supabase
      .from('radio_signouts')
      .select(`
        *,
        staff:user_id (
          id,
          full_name,
          email,
          contact_number
        )
      `)
      .eq('event_id', eventId)
      .order('signed_out_at', { ascending: false })

    if (signOutsError) {
      console.error('Radio signouts fetch error:', signOutsError)
      return NextResponse.json(
        { error: 'Failed to fetch radio signouts' },
        { status: 500 }
      )
    }

    // Transform the data to match the expected interface
    const transformedSignOuts = signOuts.map(signOut => ({
      ...signOut,
      profile: {
        id: signOut.staff?.id || signOut.user_id,
        full_name: signOut.staff?.full_name || 'Unknown Staff',
        email: signOut.staff?.email || '',
        callsign: null // Staff table doesn't have callsign
      }
    }))

    return NextResponse.json({
      success: true,
      signOuts: transformedSignOuts
    })
  } catch (error) {
    console.error('Radio signouts API error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch radio signouts',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

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
