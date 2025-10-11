import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// GET assigned staff for an event
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

    // Get assigned staff with their positions
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
          contact_number,
          skill_tags
        )
      `)
      .eq('event_id', eventId)
      .order('callsign', { ascending: true })

    if (error) {
      console.error('Failed to fetch assigned staff:', error)
      return NextResponse.json(
        { error: 'Failed to fetch assigned staff' },
        { status: 500 }
      )
    }

    // Transform the data to match the expected format
    const assignedStaff = (assignments || []).map(assignment => ({
      id: assignment.staff?.id,
      full_name: assignment.staff?.full_name,
      email: assignment.staff?.email,
      contact_number: assignment.staff?.contact_number,
      callsign: assignment.callsign,
      position: assignment.position_name,
      department: assignment.department,
      position_id: assignment.position_id,
      assigned_at: assignment.assigned_at,
      skill_tags: assignment.staff?.skill_tags || []
    }))

    return NextResponse.json({
      success: true,
      assignedStaff
    })
  } catch (error) {
    console.error('Assigned staff API error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch assigned staff',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}