/**
 * API Route: Ensure User Profile Exists
 * POST /api/ensure-profile
 * 
 * Creates a minimal user profile if it doesn't exist
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServiceClient } from '@/lib/supabaseServer'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const { userId, email } = await request.json()

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    const supabase = getServiceClient()

    // Check if profile already exists
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .single()

    if (existingProfile) {
      return NextResponse.json({
        success: true,
        message: 'Profile already exists',
        profile: existingProfile
      })
    }

    // Create minimal profile
    const { data: newProfile, error } = await supabase
      .from('profiles')
      .insert({
        id: userId,
        email: email || '',
        first_name: '',
        last_name: '',
        full_name: '',
        company: 'Default Company', // TODO: Get from user input or settings
        role: 'user',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating profile:', error)
      return NextResponse.json(
        { error: 'Failed to create profile', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Profile created successfully',
      profile: newProfile
    })

  } catch (error: any) {
    console.error('Ensure profile API error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}
