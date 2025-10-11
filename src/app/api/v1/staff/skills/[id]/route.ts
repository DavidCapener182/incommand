import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// PATCH endpoint to update a skill
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const body = await request.json()
    const { verified, skill_name, certification_date, expiry_date, certification_number, issuing_authority, notes } = body
    const skillId = parseInt(params.id)

    if (isNaN(skillId)) {
      return NextResponse.json({ error: 'Invalid skill ID' }, { status: 400 })
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

    // Check if the skill exists and user has permission to modify it
    const { data: existingSkill } = await supabase
      .from('staff_skills')
      .select(`
        id,
        profile_id,
        profiles!inner(organization_id)
      `)
      .eq('id', skillId)
      .single()

    if (!existingSkill) {
      return NextResponse.json({ error: 'Skill not found' }, { status: 404 })
    }

    if (existingSkill.profiles.organization_id !== userProfile.organization_id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Prepare update data
    const updateData: any = {
      updated_at: new Date().toISOString()
    }

    if (verified !== undefined) {
      updateData.verified = verified
      if (verified) {
        updateData.verified_by = user.id
        updateData.verified_at = new Date().toISOString()
      } else {
        updateData.verified_by = null
        updateData.verified_at = null
      }
    }

    if (skill_name !== undefined) updateData.skill_name = skill_name
    if (certification_date !== undefined) updateData.certification_date = certification_date
    if (expiry_date !== undefined) updateData.expiry_date = expiry_date
    if (certification_number !== undefined) updateData.certification_number = certification_number
    if (issuing_authority !== undefined) updateData.issuing_authority = issuing_authority
    if (notes !== undefined) updateData.notes = notes

    // Update the skill
    const { data: updatedSkill, error: updateError } = await supabase
      .from('staff_skills')
      .update(updateData)
      .eq('id', skillId)
      .select()
      .single()

    if (updateError) {
      console.error('Skill update error:', updateError)
      return NextResponse.json(
        { error: 'Failed to update skill' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      skill: updatedSkill
    })
  } catch (error) {
    console.error('Update skill API error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to update skill',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// DELETE endpoint to remove a skill
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const skillId = parseInt(params.id)

    if (isNaN(skillId)) {
      return NextResponse.json({ error: 'Invalid skill ID' }, { status: 400 })
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

    // Check if the skill exists and user has permission to delete it
    const { data: existingSkill } = await supabase
      .from('staff_skills')
      .select(`
        id,
        profile_id,
        profiles!inner(organization_id)
      `)
      .eq('id', skillId)
      .single()

    if (!existingSkill) {
      return NextResponse.json({ error: 'Skill not found' }, { status: 404 })
    }

    if (existingSkill.profiles.organization_id !== userProfile.organization_id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Delete the skill
    const { error: deleteError } = await supabase
      .from('staff_skills')
      .delete()
      .eq('id', skillId)

    if (deleteError) {
      console.error('Skill delete error:', deleteError)
      return NextResponse.json(
        { error: 'Failed to delete skill' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Skill deleted successfully'
    })
  } catch (error) {
    console.error('Delete skill API error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to delete skill',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
