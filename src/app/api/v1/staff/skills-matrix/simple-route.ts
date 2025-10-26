import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Simple fallback API that just returns basic staff data
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

    // Get basic staff data only
    const { data: staff, error: staffError } = await supabase
      .from('staff')
      .select('id, full_name, email, skill_tags')
      .eq('company_id', profile.company_id)
      .order('full_name', { ascending: true })

    if (staffError) {
      console.error('Staff fetch error:', staffError)
      return NextResponse.json(
        { error: 'Failed to fetch staff', details: staffError.message },
        { status: 500 }
      )
    }

    // Convert to the expected format
    const staffWithDetails = (staff || []).map(member => {
      // Convert skill_tags to skills format
      const skills = (member.skill_tags || []).map((tag: string, index: number) => ({
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

      return {
        profile_id: member.id,
        full_name: member.full_name,
        email: member.email,
        callsign: member.full_name,
        skills: skills,
        certifications: [],
        certifications_expiring_30_days: 0,
        sia_badge_number: null,
        expiry_date: null
      }
    })

    return NextResponse.json({
      success: true,
      staff: staffWithDetails
    })
  } catch (error) {
    console.error('Simple skills matrix API error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch skills matrix',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
