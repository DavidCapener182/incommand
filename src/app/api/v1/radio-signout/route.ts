import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { env } from '@/config/env'

const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY
)

export async function GET(request: NextRequest) {
  try {
    console.log('Radio signout API called')
    const { searchParams } = new URL(request.url)
    const eventId = searchParams.get('event_id')
    const id = searchParams.get('id')

    console.log('Event ID:', eventId, 'ID:', id)

    if (id) {
      // Get specific radio signout
      const { data, error } = await supabase
        .from('radio_signouts')
        .select(`
          *,
          profile:profiles(id, full_name, email, callsign)
        `)
        .eq('id', id)
        .single()

      if (error) {
        console.error('Error fetching specific signout:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      return NextResponse.json({ signOut: data })
    }

    if (!eventId) {
      console.log('No event ID provided')
      return NextResponse.json({ error: 'Event ID is required' }, { status: 400 })
    }

    // Get all radio signouts for event
    console.log('Fetching radio signouts for event:', eventId)
    const { data: signOuts, error: signOutsError } = await supabase
      .from('radio_signouts')
      .select(`
        *,
        profile:profiles(id, full_name, email, callsign)
      `)
      .eq('event_id', eventId)
      .order('created_at', { ascending: false })

    if (signOutsError) {
      console.error('Error fetching signouts:', signOutsError)
      return NextResponse.json({ error: signOutsError.message }, { status: 500 })
    }

    console.log('Found signouts:', signOuts?.length || 0)

    // Get staff members from the staff table (not profiles)
    console.log('Fetching staff members for radio signout...')
    
    // For now, get all active staff (we can add company filtering later)
    const { data: allStaff, error: staffError } = await supabase
      .from('staff')
      .select('id, full_name, contact_number, email, skill_tags, notes, active')
      .eq('active', true)
      .order('full_name')
      .limit(50)

    if (staffError) {
      console.error('Error fetching staff:', staffError)
      return NextResponse.json({ error: staffError.message }, { status: 500 })
    }

    console.log('Found staff:', allStaff?.length || 0, 'staff members')
    
    // Transform the data to match expected format
    const assignedStaff = allStaff?.map(staff => ({ profile: staff })) || []

    console.log('Returning data with', assignedStaff.length, 'staff members')
    return NextResponse.json({
      signOuts: signOuts || [],
      assignedStaff: assignedStaff || []
    })
  } catch (error) {
    console.error('Error in radio-signout GET:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { radio_number, event_id, staff_id, equipment } = body

    if (!radio_number || !event_id || !staff_id) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    console.log('Creating radio signout for staff:', staff_id)

    // Get staff member details
    const { data: staffMember, error: staffError } = await supabase
      .from('staff')
      .select('id, full_name, email')
      .eq('id', staff_id)
      .single()

    if (staffError || !staffMember) {
      console.error('Staff member not found:', staffError)
      return NextResponse.json({ error: 'Staff member not found' }, { status: 404 })
    }

    // Get a valid user_id from the profiles table (we'll use the first available user)
    const { data: validUser } = await supabase
      .from('profiles')
      .select('id')
      .limit(1)
      .single()

    if (!validUser) {
      return NextResponse.json({ error: 'No valid user found for radio signout' }, { status: 500 })
    }

    // Create the radio signout with staff information
    const { data, error } = await supabase
      .from('radio_signouts')
      .insert({
        radio_number,
        event_id,
        user_id: validUser.id, // Use a valid user_id for the foreign key
        staff_id: staff_id,
        staff_name: staffMember.full_name,
        signed_out_at: new Date().toISOString(),
        signed_out_signature: 'Digital signature placeholder',
        status: 'out',
        equipment_signed_out: equipment || {}
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating radio signout:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log('Radio signout created successfully:', data.id)
    return NextResponse.json({ signOut: data })
  } catch (error) {
    console.error('Error in radio-signout POST:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { signout_id, signed_in_at, status, equipment_returned } = body

    if (!signout_id) {
      return NextResponse.json({ error: 'Signout ID is required' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('radio_signouts')
      .update({
        signed_in_at: signed_in_at || new Date().toISOString(),
        signed_in_signature: 'Digital signature placeholder',
        status: status || 'returned',
        equipment_returned: equipment_returned || {}
      })
      .eq('id', signout_id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ signOut: data })
  } catch (error) {
    console.error('Error in radio-signout PATCH:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 })
    }

    const { error } = await supabase
      .from('radio_signouts')
      .delete()
      .eq('id', id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Radio signout deleted successfully' 
    })
  } catch (error) {
    console.error('Error in radio-signout DELETE:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
