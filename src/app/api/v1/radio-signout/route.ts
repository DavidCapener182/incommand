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

    // Get radio signouts with staff information from profiles table
    const { data: signOuts, error: signOutsError } = await supabase
      .from('radio_signouts')
      .select(`
        *,
        profile:user_id (
          id,
          full_name,
          email
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

    // Get assigned staff for this event (for radio assignment)
    const { data: assignedStaff, error: assignedStaffError } = await supabase
      .from('position_assignments')
      .select(`
        *,
        staff:staff_id (
          id,
          full_name,
          email,
          contact_number
        )
      `)
      .eq('event_id', eventId)
      .order('assigned_at', { ascending: false })

    if (assignedStaffError) {
      console.error('Assigned staff fetch error:', assignedStaffError)
      // Continue without assigned staff data
    }

    // Transform the data to match the expected interface
    const transformedSignOuts = signOuts.map(signOut => ({
      ...signOut,
      profile: {
        id: signOut.profile?.id || signOut.user_id,
        full_name: signOut.profile?.full_name || 'Unknown Staff',
        email: signOut.profile?.email || '',
        callsign: null
      }
    }))

    // Transform assigned staff data
    const transformedAssignedStaff = assignedStaff?.map(assignment => ({
      ...assignment,
      profile: {
        id: assignment.staff?.id || assignment.staff_id,
        full_name: assignment.staff?.full_name || 'Unknown Staff',
        email: assignment.staff?.email || '',
        callsign: assignment.callsign
      }
    })) || []

    return NextResponse.json({
      success: true,
      signOuts: transformedSignOuts,
      assignedStaff: transformedAssignedStaff
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
    const { radio_number, event_id, staff_id, equipment } = body

    // Validate required fields
    if (!radio_number || !event_id || !staff_id) {
      return NextResponse.json(
        { error: 'radio_number, event_id, and staff_id are required' },
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
        user_id: user.id, // Use current user's profile ID
        equipment_signed_out: equipment || {},
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

// PATCH endpoint to sign in a radio
export async function PATCH(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const body = await request.json()
    const { signout_id, signed_in_at, status, equipment_returned } = body

    // Validate required fields
    if (!signout_id) {
      return NextResponse.json(
        { error: 'signout_id is required' },
        { status: 400 }
      )
    }

    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Update sign-in record
    const { data: signIn, error: signInError } = await supabase
      .from('radio_signouts')
      .update({
        signed_in_at: signed_in_at || new Date().toISOString(),
        status: status || 'returned',
        equipment_returned: equipment_returned || {}
      })
      .eq('id', signout_id)
      .select()
      .single()

    if (signInError) {
      console.error('Sign-in error:', signInError)
      return NextResponse.json(
        { error: 'Failed to sign in radio' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      signin: signIn
    })
  } catch (error) {
    console.error('Radio sign-in API error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to sign in radio',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}


// DELETE endpoint to delete a radio signout record
export async function DELETE(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { searchParams } = new URL(request.url)
    const signoutId = searchParams.get('id')

    if (!signoutId) {
      return NextResponse.json({ error: 'Signout ID is required' }, { status: 400 })
    }

    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Delete the signout record
    const { error: deleteError } = await supabase
      .from('radio_signouts')
      .delete()
      .eq('id', signoutId)

    if (deleteError) {
      console.error('Delete signout error:', deleteError)
      return NextResponse.json(
        { error: 'Failed to delete radio signout' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Radio signout deleted successfully'
    })
  } catch (error) {
    console.error('Delete radio signout API error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to delete radio signout',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
