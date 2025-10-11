import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// GET endpoint to fetch staff assigned to positions for radio sign out
export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
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

    // Get all active staff in the company
    const { data: staff, error: staffError } = await supabase
      .from('staff')
      .select('id, full_name, email, contact_number, skill_tags, active')
      .eq('company_id', userProfile.company_id)
      .eq('active', true)
      .order('full_name', { ascending: true })

    if (staffError) {
      console.error('Staff fetch error:', staffError)
      return NextResponse.json(
        { error: 'Failed to fetch staff' },
        { status: 500 }
      )
    }

    // For now, we'll return all active staff as "assigned"
    // In a real implementation, you'd check against a positions/assignments table
    const assignedStaff = staff.map(member => ({
      id: member.id,
      full_name: member.full_name,
      email: member.email,
      contact_number: member.contact_number,
      skill_tags: member.skill_tags || [],
      position: 'General Staff', // Default position
      callsign: member.full_name // Use full_name as callsign
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
