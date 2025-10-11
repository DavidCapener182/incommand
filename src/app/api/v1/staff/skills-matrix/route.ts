import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Get user's organization
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

    // Get all staff in the company
    const { data: staff, error: staffError } = await supabase
      .from('profiles')
      .select('id, full_name, email, callsign, experience_level, staff_role, company_id')
      .eq('company_id', profile.company_id)

    if (staffError) {
      console.error('Staff fetch error:', staffError)
      return NextResponse.json(
        { error: 'Failed to fetch staff' },
        { status: 500 }
      )
    }

    // Get skills for all staff
    const { data: skills, error: skillsError } = await supabase
      .from('staff_skills')
      .select('*')

    if (skillsError) {
      console.error('Skills fetch error:', skillsError)
      // Continue without skills if table doesn't exist
    }

    // Get certifications for all staff
    const { data: certifications, error: certificationsError } = await supabase
      .from('staff_certifications')
      .select('*')

    if (certificationsError) {
      console.error('Certifications fetch error:', certificationsError)
      // Continue without certifications if table doesn't exist
    }

    // Combine staff with their skills and certifications
    const staffWithDetails = staff.map(member => ({
      ...member,
      skills: skills?.filter(skill => skill.profile_id === member.id) || [],
      certifications: certifications?.filter(cert => cert.profile_id === member.id) || []
    }))

    return NextResponse.json({
      success: true,
      staff: staffWithDetails
    })
  } catch (error) {
    console.error('Skills matrix API error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch skills matrix',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// POST endpoint to add a new skill
export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const body = await request.json()
    const { profile_id, skill_name, certification_date, expiry_date, certification_number, issuing_authority, notes } = body

    // Validate required fields
    if (!profile_id || !skill_name) {
      return NextResponse.json(
        { error: 'profile_id and skill_name are required' },
        { status: 400 }
      )
    }

    // Check if user has permission to add skills for this profile
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: userProfile } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', user.id)
      .single()

    const { data: targetProfile } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', profile_id)
      .single()

    if (!userProfile || !targetProfile || userProfile.company_id !== targetProfile.company_id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Insert the new skill
    const { data: newSkill, error: insertError } = await supabase
      .from('staff_skills')
      .insert({
        profile_id,
        skill_name,
        certification_date,
        expiry_date,
        certification_number,
        issuing_authority,
        notes,
        verified: false
      })
      .select()
      .single()

    if (insertError) {
      console.error('Skill insert error:', insertError)
      return NextResponse.json(
        { error: 'Failed to add skill' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      skill: newSkill
    })
  } catch (error) {
    console.error('Add skill API error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to add skill',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
