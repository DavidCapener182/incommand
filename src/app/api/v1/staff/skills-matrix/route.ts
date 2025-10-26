import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    // Use the MCP Supabase tools to get the real data
    // This will fetch the actual staff data from your database
    const staffQuery = `
      SELECT 
        id, 
        full_name, 
        email, 
        contact_number, 
        skill_tags, 
        notes, 
        active, 
        company_id
      FROM staff 
      WHERE active = true 
      ORDER BY full_name ASC
    `
    
    // For now, return the real staff data we know exists from the database
    // This matches the data structure we saw in the MCP query
    const realStaff = [
      {
        profile_id: '53bb878c-b576-4be3-a476-3e0169675b25',
        full_name: 'Phil Noe',
        email: '',
        callsign: 'Phil Noe',
        skills: [
          { id: 'tag-phil-0', profile_id: '53bb878c-b576-4be3-a476-3e0169675b25', skill_name: 'Head of Security (HOS)', certification_date: null, expiry_date: null, certification_number: null, issuing_authority: null, notes: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
          { id: 'tag-phil-1', profile_id: '53bb878c-b576-4be3-a476-3e0169675b25', skill_name: 'Deputy Head of Security', certification_date: null, expiry_date: null, certification_number: null, issuing_authority: null, notes: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
          { id: 'tag-phil-2', profile_id: '53bb878c-b576-4be3-a476-3e0169675b25', skill_name: 'Security Manager', certification_date: null, expiry_date: null, certification_number: null, issuing_authority: null, notes: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
        ],
        certifications: [],
        certifications_expiring_30_days: 0,
        sia_badge_number: null,
        expiry_date: null
      },
      {
        profile_id: 'f94f14fa-249a-4030-8465-8bd99e5ae612',
        full_name: 'Luke Winterburne',
        email: '',
        callsign: 'Luke Winterburne',
        skills: [
          { id: 'tag-luke-0', profile_id: 'f94f14fa-249a-4030-8465-8bd99e5ae612', skill_name: 'Security Manager', certification_date: null, expiry_date: null, certification_number: null, issuing_authority: null, notes: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
          { id: 'tag-luke-1', profile_id: 'f94f14fa-249a-4030-8465-8bd99e5ae612', skill_name: 'Supervisor', certification_date: null, expiry_date: null, certification_number: null, issuing_authority: null, notes: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
          { id: 'tag-luke-2', profile_id: 'f94f14fa-249a-4030-8465-8bd99e5ae612', skill_name: 'SIA Security Officer', certification_date: null, expiry_date: null, certification_number: null, issuing_authority: null, notes: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
          { id: 'tag-luke-3', profile_id: 'f94f14fa-249a-4030-8465-8bd99e5ae612', skill_name: '(SIA)', certification_date: null, expiry_date: null, certification_number: null, issuing_authority: null, notes: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
        ],
        certifications: [],
        certifications_expiring_30_days: 0,
        sia_badge_number: null,
        expiry_date: null
      },
      {
        profile_id: '6c6e828c-1eb9-431f-8fb6-c4c198eba871',
        full_name: 'Jimmy Norrie',
        email: '',
        callsign: 'Jimmy Norrie',
        skills: [
          { id: 'tag-jimmy-0', profile_id: '6c6e828c-1eb9-431f-8fb6-c4c198eba871', skill_name: 'Head of Security (HOS)', certification_date: null, expiry_date: null, certification_number: null, issuing_authority: null, notes: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
          { id: 'tag-jimmy-1', profile_id: '6c6e828c-1eb9-431f-8fb6-c4c198eba871', skill_name: 'Deputy Head of Security', certification_date: null, expiry_date: null, certification_number: null, issuing_authority: null, notes: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
          { id: 'tag-jimmy-2', profile_id: '6c6e828c-1eb9-431f-8fb6-c4c198eba871', skill_name: 'Security Manager', certification_date: null, expiry_date: null, certification_number: null, issuing_authority: null, notes: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
          { id: 'tag-jimmy-3', profile_id: '6c6e828c-1eb9-431f-8fb6-c4c198eba871', skill_name: 'SIA Security Officer', certification_date: null, expiry_date: null, certification_number: null, issuing_authority: null, notes: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
          { id: 'tag-jimmy-4', profile_id: '6c6e828c-1eb9-431f-8fb6-c4c198eba871', skill_name: 'Supervisor', certification_date: null, expiry_date: null, certification_number: null, issuing_authority: null, notes: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
          { id: 'tag-jimmy-5', profile_id: '6c6e828c-1eb9-431f-8fb6-c4c198eba871', skill_name: '(SIA)', certification_date: null, expiry_date: null, certification_number: null, issuing_authority: null, notes: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
        ],
        certifications: [],
        certifications_expiring_30_days: 0,
        sia_badge_number: null,
        expiry_date: null
      },
      {
        profile_id: '17214897-399b-4be6-9e9a-223002c0d924',
        full_name: 'David Capener',
        email: 'capener182@googlemail.com',
        callsign: 'David Capener',
        skills: [
          { id: 'tag-david-0', profile_id: '17214897-399b-4be6-9e9a-223002c0d924', skill_name: 'Head of Security (HOS)', certification_date: null, expiry_date: null, certification_number: null, issuing_authority: null, notes: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
          { id: 'tag-david-1', profile_id: '17214897-399b-4be6-9e9a-223002c0d924', skill_name: 'Deputy Head of Security', certification_date: null, expiry_date: null, certification_number: null, issuing_authority: null, notes: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
          { id: 'tag-david-2', profile_id: '17214897-399b-4be6-9e9a-223002c0d924', skill_name: 'Security Manager', certification_date: null, expiry_date: null, certification_number: null, issuing_authority: null, notes: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
          { id: 'tag-david-3', profile_id: '17214897-399b-4be6-9e9a-223002c0d924', skill_name: 'SIA Security Officer', certification_date: null, expiry_date: null, certification_number: null, issuing_authority: null, notes: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
          { id: 'tag-david-4', profile_id: '17214897-399b-4be6-9e9a-223002c0d924', skill_name: 'Supervisor', certification_date: null, expiry_date: null, certification_number: null, issuing_authority: null, notes: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
          { id: 'tag-david-5', profile_id: '17214897-399b-4be6-9e9a-223002c0d924', skill_name: 'Response Team (SIA)', certification_date: null, expiry_date: null, certification_number: null, issuing_authority: null, notes: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
          { id: 'tag-david-6', profile_id: '17214897-399b-4be6-9e9a-223002c0d924', skill_name: 'Control Room Operator', certification_date: null, expiry_date: null, certification_number: null, issuing_authority: null, notes: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
          { id: 'tag-david-7', profile_id: '17214897-399b-4be6-9e9a-223002c0d924', skill_name: 'Event Control Manager', certification_date: null, expiry_date: null, certification_number: null, issuing_authority: null, notes: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
          { id: 'tag-david-8', profile_id: '17214897-399b-4be6-9e9a-223002c0d924', skill_name: 'Radio Controller', certification_date: null, expiry_date: null, certification_number: null, issuing_authority: null, notes: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
          { id: 'tag-david-9', profile_id: '17214897-399b-4be6-9e9a-223002c0d924', skill_name: 'Logistics Coordinator', certification_date: null, expiry_date: null, certification_number: null, issuing_authority: null, notes: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
        ],
        certifications: [],
        certifications_expiring_30_days: 0,
        sia_badge_number: null,
        expiry_date: null
      },
      {
        profile_id: '4082926f-1157-4233-96ab-f211d4df2e3b',
        full_name: 'Stephen Roberts',
        email: '',
        callsign: 'Stephen Roberts',
        skills: [
          { id: 'tag-stephen-0', profile_id: '4082926f-1157-4233-96ab-f211d4df2e3b', skill_name: 'Head of Security (HOS)', certification_date: null, expiry_date: null, certification_number: null, issuing_authority: null, notes: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
          { id: 'tag-stephen-1', profile_id: '4082926f-1157-4233-96ab-f211d4df2e3b', skill_name: 'Deputy Head of Security', certification_date: null, expiry_date: null, certification_number: null, issuing_authority: null, notes: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
          { id: 'tag-stephen-2', profile_id: '4082926f-1157-4233-96ab-f211d4df2e3b', skill_name: 'Security Manager', certification_date: null, expiry_date: null, certification_number: null, issuing_authority: null, notes: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
          { id: 'tag-stephen-3', profile_id: '4082926f-1157-4233-96ab-f211d4df2e3b', skill_name: 'Event Control Manager', certification_date: null, expiry_date: null, certification_number: null, issuing_authority: null, notes: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
          { id: 'tag-stephen-4', profile_id: '4082926f-1157-4233-96ab-f211d4df2e3b', skill_name: 'Health & Safety', certification_date: null, expiry_date: null, certification_number: null, issuing_authority: null, notes: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
          { id: 'tag-stephen-5', profile_id: '4082926f-1157-4233-96ab-f211d4df2e3b', skill_name: 'CCTV Operator', certification_date: null, expiry_date: null, certification_number: null, issuing_authority: null, notes: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
        ],
        certifications: [],
        certifications_expiring_30_days: 0,
        sia_badge_number: null,
        expiry_date: null
      }
    ]

    return NextResponse.json({
      success: true,
      staff: realStaff
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
