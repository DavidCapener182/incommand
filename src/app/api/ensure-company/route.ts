import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { getPlanFeatures } from '@/config/PricingConfig'
import { getServiceSupabaseClient } from '@/lib/supabaseServer'

export const dynamic = 'force-dynamic'

/**
 * API route to ensure user has a profile and company
 * Creates missing profile and/or company if needed
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if profile exists
    let { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, company_id, company, role')
      .eq('id', user.id)
      .single()

    // Create profile if it doesn't exist
    if (profileError && profileError.code === 'PGRST116') {
      const { data: newProfile, error: createError } = await supabase
        .from('profiles')
        .insert({
          id: user.id,
          email: user.email || '',
          company: user.user_metadata?.company || 'Default Company',
          role: 'user',
        })
        .select('id, company_id, company, role')
        .single()

      if (createError) {
        return NextResponse.json(
          { error: 'Failed to create profile', details: createError.message },
          { status: 500 }
        )
      }

      profile = newProfile
    }

    // If profile exists but no company_id, create a company
    if (profile && !profile.company_id) {
      // Use service client to bypass RLS for company creation
      const serviceSupabase = getServiceSupabaseClient()

      const companyName = profile.company || user.user_metadata?.company || `${user.email?.split('@')[0]}'s Company`
      
      const { data: newCompany, error: companyError } = await (serviceSupabase as any)
        .from('companies')
        .insert({
          name: companyName,
          subscription_plan: 'starter',
          account_status: 'active',
          plan_features: getPlanFeatures('starter'),
        })
        .select('id')
        .single()

      if (companyError || !newCompany) {
        return NextResponse.json(
          { error: 'Failed to create company', details: companyError?.message },
          { status: 500 }
        )
      }

      // Update profile with company_id
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ company_id: newCompany.id })
        .eq('id', user.id)

      if (updateError) {
        return NextResponse.json(
          { error: 'Failed to link company to profile', details: updateError.message },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        company_id: newCompany.id,
        message: 'Company created and linked successfully'
      })
    }

    return NextResponse.json({
      success: true,
      company_id: profile?.company_id,
      message: 'Profile and company already exist'
    })

  } catch (error: any) {
    console.error('Ensure company API error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

