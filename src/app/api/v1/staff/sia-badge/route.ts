import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

// POST endpoint to save SIA badge information (company-wide, not event-specific)
export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const body = await request.json()
    const { profile_id, sia_badge_number, expiry_date } = body

    // Validate required fields
    if (!profile_id || !sia_badge_number || !expiry_date) {
      return NextResponse.json(
        { error: 'profile_id, sia_badge_number, and expiry_date are required' },
        { status: 400 }
      )
    }

    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Update or insert SIA badge information in profiles table
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .update({
        sia_badge_number,
        expiry_date
      })
      .eq('id', profile_id)
      .select()
      .single()

    if (profileError) {
      console.error('SIA badge update error:', profileError)
      return NextResponse.json(
        { error: 'Failed to save SIA badge information' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      profile
    })
  } catch (error) {
    console.error('SIA badge API error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to save SIA badge information',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
