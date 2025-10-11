import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// POST endpoint to update staff availability
export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const body = await request.json()
    const { profile_id, event_id, is_available, availability_reason, shift_start, shift_end } = body

    // Validate required fields
    if (!profile_id || !event_id || typeof is_available !== 'boolean') {
      return NextResponse.json(
        { error: 'profile_id, event_id, and is_available are required' },
        { status: 400 }
      )
    }

    // Get user's organization
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: userProfile } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', user.id)
      .single()

    if (!userProfile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    // Verify the profile and event belong to the same organization
    const { data: profileCheck } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', profile_id)
      .single()

    const { data: eventCheck } = await supabase
      .from('events')
      .select('organization_id')
      .eq('id', event_id)
      .single()

    if (!profileCheck || !eventCheck) {
      return NextResponse.json({ error: 'Profile or event not found' }, { status: 404 })
    }

    if (profileCheck.organization_id !== userProfile.organization_id || 
        eventCheck.organization_id !== userProfile.organization_id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Upsert the availability record
    const { data: availability, error: upsertError } = await supabase
      .from('staff_availability')
      .upsert({
        profile_id,
        event_id,
        is_available,
        availability_reason: availability_reason || (is_available ? 'on-shift' : 'off-shift'),
        shift_start: shift_start || (is_available ? new Date().toISOString() : null),
        shift_end: shift_end || (!is_available ? new Date().toISOString() : null),
        last_status_change: new Date().toISOString()
      }, {
        onConflict: 'profile_id,event_id'
      })
      .select()
      .single()

    if (upsertError) {
      console.error('Availability upsert error:', upsertError)
      return NextResponse.json(
        { error: 'Failed to update availability' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      availability
    })
  } catch (error) {
    console.error('Availability API error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to update availability',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// GET endpoint to fetch availability for an event
export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { searchParams } = new URL(request.url)
    const eventId = searchParams.get('event_id')

    if (!eventId) {
      return NextResponse.json(
        { error: 'event_id is required' },
        { status: 400 }
      )
    }

    // Get user's organization
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: userProfile } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', user.id)
      .single()

    if (!userProfile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    // Get staff availability using the database function
    const { data: staffAvailability, error: availabilityError } = await supabase
      .rpc('get_staff_availability', { p_event_id: eventId })

    if (availabilityError) {
      console.error('Staff availability error:', availabilityError)
      return NextResponse.json(
        { error: 'Failed to fetch staff availability' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      staff: staffAvailability || []
    })
  } catch (error) {
    console.error('Staff availability API error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch staff availability',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
