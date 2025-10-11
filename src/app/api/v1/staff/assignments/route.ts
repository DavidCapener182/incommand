import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// GET assignments for an event
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

    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', user.id)
      .single()

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    // Get assignments with staff details
    const { data: assignments, error } = await supabase
      .from('staff_assignments')
      .select(`
        id,
        position_id,
        callsign,
        position_name,
        department,
        assigned_at,
        staff:staff_id (
          id,
          full_name,
          email,
          contact_number
        )
      `)
      .eq('event_id', eventId)
      .order('department', { ascending: true })
      .order('callsign', { ascending: true })

    if (error) {
      console.error('Failed to fetch assignments:', error)
      return NextResponse.json(
        { error: 'Failed to fetch assignments' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      assignments: assignments || []
    })
  } catch (error) {
    console.error('Assignments API error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch assignments',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// POST new assignment
export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const body = await request.json()
    const { event_id, staff_id, position_id, callsign, position_name, department } = body

    // Validate required fields
    if (!event_id || !staff_id || !position_id || !callsign || !position_name || !department) {
      return NextResponse.json(
        { error: 'All fields are required: event_id, staff_id, position_id, callsign, position_name, department' },
        { status: 400 }
      )
    }

    // Get user's company
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', user.id)
      .single()

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    // Verify event belongs to user's company
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('id, company_id')
      .eq('id', event_id)
      .single()

    if (eventError || !event || event.company_id !== profile.company_id) {
      return NextResponse.json({ error: 'Event not found or access denied' }, { status: 404 })
    }

    // Verify staff belongs to user's company
    const { data: staff, error: staffError } = await supabase
      .from('staff')
      .select('id, company_id')
      .eq('id', staff_id)
      .single()

    if (staffError || !staff || staff.company_id !== profile.company_id) {
      return NextResponse.json({ error: 'Staff not found or access denied' }, { status: 404 })
    }

    // Remove any existing assignments for this position or staff member
    await supabase
      .from('staff_assignments')
      .delete()
      .or(`position_id.eq.${position_id},staff_id.eq.${staff_id}`)
      .eq('event_id', event_id)

    // Create new assignment
    const { data: assignment, error: insertError } = await supabase
      .from('staff_assignments')
      .insert({
        event_id,
        staff_id,
        position_id,
        callsign,
        position_name,
        department,
        assigned_by: user.id
      })
      .select()
      .single()

    if (insertError) {
      console.error('Failed to create assignment:', insertError)
      return NextResponse.json(
        { error: 'Failed to create assignment' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      assignment
    })
  } catch (error) {
    console.error('Create assignment API error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to create assignment',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// DELETE assignment
export async function DELETE(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { searchParams } = new URL(request.url)
    const assignmentId = searchParams.get('id')

    if (!assignmentId) {
      return NextResponse.json({ error: 'assignment id is required' }, { status: 400 })
    }

    // Get user's company
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', user.id)
      .single()

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    // Verify assignment belongs to user's company
    const { data: assignment, error: fetchError } = await supabase
      .from('staff_assignments')
      .select(`
        id,
        event_id,
        event:event_id (
          company_id
        )
      `)
      .eq('id', assignmentId)
      .single()

    if (fetchError || !assignment || (assignment.event as any)?.company_id !== profile.company_id) {
      return NextResponse.json({ error: 'Assignment not found or access denied' }, { status: 404 })
    }

    // Delete assignment
    const { error: deleteError } = await supabase
      .from('staff_assignments')
      .delete()
      .eq('id', assignmentId)

    if (deleteError) {
      console.error('Failed to delete assignment:', deleteError)
      return NextResponse.json(
        { error: 'Failed to delete assignment' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Assignment deleted successfully'
    })
  } catch (error) {
    console.error('Delete assignment API error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to delete assignment',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
