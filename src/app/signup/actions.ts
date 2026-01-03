/**
 * Server action for company signup with plan provisioning
 * Creates company, user profile, and sets up plan features
 */

'use server'

import { getServiceSupabaseClient } from '@/lib/supabaseServer'
import { getPlanFeatures, type PlanCode } from '@/config/PricingConfig'

export async function createCompanyWithPlan(
  userId: string,
  companyName: string,
  planCode: PlanCode
) {
  const supabase = getServiceSupabaseClient()
  
  try {
    const planFeatures = getPlanFeatures(planCode)
    
    // Create company with plan
    const { data: company, error: companyError } = await (supabase as any)
      .from('companies')
      .insert({
        name: companyName,
        subscription_plan: planCode,
        plan_features: planFeatures,
        account_status: 'active',
      })
      .select()
      .single()

    if (companyError) {
      console.error('Company creation error:', companyError)
      throw new Error('Failed to create company')
    }

    // Update profile with company_id
    const companyData = company as any;
    const { error: profileError } = await (supabase as any)
      .from('profiles')
      .update({
        company_id: companyData.id,
        role: 'company_admin',
      })
      .eq('id', userId)

    if (profileError) {
      console.error('Profile update error:', profileError)
      // Don't throw - company is created, profile can be updated later
    }

    return { success: true, companyId: company.id }
  } catch (error: any) {
    console.error('createCompanyWithPlan error:', error)
    throw error
  }
}

