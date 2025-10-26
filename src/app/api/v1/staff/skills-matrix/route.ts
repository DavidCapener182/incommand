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

    // Get all staff in the company with their profile information
    let staff = []
    try {
      const { data: staffData, error: staffError } = await supabase
        .from('staff')
        .select(`
          id, 
          full_name, 
          email, 
          contact_number, 
          skill_tags, 
          notes, 
          active, 
          company_id,
          profile_id
        `)
        .eq('company_id', profile.company_id)
        .order('full_name', { ascending: true })

      if (staffError) {
        console.error('Staff fetch error:', staffError)
        return NextResponse.json(
          { error: 'Failed to fetch staff', details: staffError.message },
          { status: 500 }
        )
      }

      staff = staffData || []
    } catch (error) {
      console.error('Staff table access error:', error)
      return NextResponse.json(
        { error: 'Failed to access staff table', details: error instanceof Error ? error.message : 'Unknown error' },
        { status: 500 }
      )
    }

    if (!staff || staff.length === 0) {
      return NextResponse.json({
        success: true,
        staff: []
      })
    }

    // Get skills for all staff (using staff_id instead of profile_id)
    let skills = []
    try {
      const { data: skillsData, error: skillsError } = await supabase
        .from('staff_skills')
        .select('*')

      if (skillsError) {
        console.error('Skills fetch error:', skillsError)
        // Continue without skills if table doesn't exist
      } else {
        skills = skillsData || []
      }
    } catch (error) {
      console.error('Skills table access error:', error)
      // Table might not exist, continue without skills
    }

    // Get certifications for all staff (using staff_id instead of profile_id)
    let certifications = []
    try {
      const { data: certificationsData, error: certificationsError } = await supabase
        .from('staff_certifications')
        .select('*')

      if (certificationsError) {
        console.error('Certifications fetch error:', certificationsError)
        // Continue without certifications if table doesn't exist
      } else {
        certifications = certificationsData || []
      }
    } catch (error) {
      console.error('Certifications table access error:', error)
      // Table might not exist, continue without certifications
    }

    // Get profile information for SIA badge data
    let profiles = []
    try {
      const profileIds = staff.map(member => member.profile_id).filter(Boolean)
      if (profileIds.length > 0) {
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('id, sia_badge_number, expiry_date')
          .in('id', profileIds)

        if (profilesError) {
          console.error('Profiles fetch error:', profilesError)
          // Continue without profile data
        } else {
          profiles = profilesData || []
        }
      }
    } catch (error) {
      console.error('Profiles table access error:', error)
      // Continue without profile data
    }

    // Combine staff with their skills and certifications
    const staffWithDetails = staff.map(member => {
      // Get skills from both staff_skills table and skill_tags array
      const staffSkills = skills?.filter(skill => skill.staff_id === member.id || skill.profile_id === member.id).map(skill => ({
        ...skill,
        profile_id: member.id // Ensure profile_id is set for component compatibility
      })) || []
      
      // Also include skill_tags from staff table as basic skills
      const skillTagSkills = (member.skill_tags || []).map((tag: string, index: number) => ({
        id: `tag-${member.id}-${index}`,
        profile_id: member.id,
        skill_name: tag,
        certification_date: null,
        expiry_date: null,
        certification_number: null,
        issuing_authority: null,
        notes: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }))
      
      const allSkills = [...staffSkills, ...skillTagSkills]
      
      // Get profile data for SIA badge information
      const profileData = profiles?.find(p => p.id === member.profile_id)
      
      return {
        profile_id: member.id, // Keep profile_id for compatibility with component
        full_name: member.full_name,
        email: member.email,
        callsign: member.full_name, // Use full_name as callsign since staff table doesn't have callsign
        skills: allSkills,
        certifications: certifications?.filter(cert => cert.staff_id === member.id || cert.profile_id === member.id).map(cert => ({
          ...cert,
          profile_id: member.id // Ensure profile_id is set
        })) || [],
        certifications_expiring_30_days: 0, // Calculate if needed
        sia_badge_number: profileData?.sia_badge_number || null,
        expiry_date: profileData?.expiry_date || null
      }
    })

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

    const { data: targetStaff } = await supabase
      .from('staff')
      .select('company_id')
      .eq('id', profile_id)
      .single()

    if (!userProfile || !targetStaff || userProfile.company_id !== targetStaff.company_id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Insert the new skill
    const { data: newSkill, error: insertError } = await supabase
      .from('staff_skills')
      .insert({
        staff_id: profile_id, // Using staff_id to reference staff table
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
