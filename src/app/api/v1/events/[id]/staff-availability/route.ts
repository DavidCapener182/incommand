import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// GET endpoint to fetch staff availability for a specific event
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const eventId = params.id

    if (!eventId) {
      return NextResponse.json({ error: 'Event ID is required' }, { status: 400 })
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

    // Verify the event belongs to the user's organization
    const { data: event } = await supabase
      .from('events')
      .select('organization_id')
      .eq('id', eventId)
      .single()

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    if (event.organization_id !== userProfile.organization_id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
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
    console.error('Event staff availability API error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch staff availability',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
