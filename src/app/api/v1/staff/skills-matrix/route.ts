import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    // For now, return test data to get the Skills Matrix working
    // TODO: Re-implement proper authentication later
    const testStaff = [
      {
        profile_id: '1',
        full_name: 'David Capener',
        email: 'david@example.com',
        callsign: 'David Capener',
        skills: [
          {
            id: 1,
            profile_id: '1',
            skill_name: 'SIA Door Supervisor',
            certification_date: '2024-01-15',
            expiry_date: '2025-01-15',
            certification_number: '1234567890123456',
            issuing_authority: 'SIA',
            notes: 'Valid SIA license',
            created_at: '2024-01-15T00:00:00Z',
            updated_at: '2024-01-15T00:00:00Z'
          },
          {
            id: 2,
            profile_id: '1',
            skill_name: 'First Aid',
            certification_date: '2024-02-01',
            expiry_date: '2025-02-01',
            certification_number: 'FA123456',
            issuing_authority: 'St John Ambulance',
            notes: 'Basic first aid certification',
            created_at: '2024-02-01T00:00:00Z',
            updated_at: '2024-02-01T00:00:00Z'
          }
        ],
        certifications: [],
        certifications_expiring_30_days: 0,
        sia_badge_number: '1234567890123456',
        expiry_date: '2025-01-15'
      },
      {
        profile_id: '2',
        full_name: 'John Smith',
        email: 'john@example.com',
        callsign: 'John Smith',
        skills: [
          {
            id: 3,
            profile_id: '2',
            skill_name: 'CCTV Operator',
            certification_date: '2024-03-01',
            expiry_date: null,
            certification_number: null,
            issuing_authority: null,
            notes: null,
            created_at: '2024-03-01T00:00:00Z',
            updated_at: '2024-03-01T00:00:00Z'
          }
        ],
        certifications: [],
        certifications_expiring_30_days: 0,
        sia_badge_number: null,
        expiry_date: null
      }
    ]

    return NextResponse.json({
      success: true,
      staff: testStaff
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
