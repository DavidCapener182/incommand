import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// POST endpoint to add a new skill to a staff member
export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const body = await request.json()
    const { profile_id, skill_name, certification_date, expiry_date, certification_number, issuing_authority, notes } = body

    if (!profile_id || !skill_name) {
      return NextResponse.json({ error: 'Profile ID and skill name are required' }, { status: 400 })
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

    // Check if the target profile belongs to the same organization
    const { data: targetProfile } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', profile_id)
      .single()

    if (!targetProfile) {
      return NextResponse.json({ error: 'Target profile not found' }, { status: 404 })
    }

    if (targetProfile.organization_id !== userProfile.organization_id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Check if the skill already exists for this staff member
    const { data: existingSkill } = await supabase
      .from('staff_skills')
      .select('id')
      .eq('profile_id', profile_id)
      .eq('skill_name', skill_name)
      .single()

    if (existingSkill) {
      return NextResponse.json({ error: 'Skill already exists for this staff member' }, { status: 409 })
    }

    // Prepare skill data
    const skillData = {
      profile_id,
      skill_name,
      certification_date: certification_date || null,
      expiry_date: expiry_date || null,
      certification_number: certification_number || null,
      issuing_authority: issuing_authority || null,
      notes: notes || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    // Insert the new skill
    const { data: newSkill, error: insertError } = await supabase
      .from('staff_skills')
      .insert(skillData)
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
