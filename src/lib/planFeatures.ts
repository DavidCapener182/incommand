/**
 * Plan Feature Enforcement Utilities
 * Server-side helpers for checking plan limits and features
 */

import { getServiceSupabaseClient } from '@/lib/supabaseServer'
import { getPlan, getPlanFeatures, canCreateEvent, canCreateUser, canCreateStaff, withinAttendeeLimit, hasFeature, type PlanCode } from '@/config/PricingConfig'

/**
 * Get plan code from company or organization
 */
export async function getPlanCodeFromCompany(companyId: string): Promise<PlanCode | null> {
  const supabase = getServiceSupabaseClient() as any
  
  const { data: company, error } = await supabase
    .from('companies')
    .select('subscription_plan')
    .eq('id', companyId)
    .single()

  if (error || !company) return null

  const planCode = (company as { subscription_plan?: string } | null)?.subscription_plan
  if (!planCode) return 'starter'
  // Map legacy plan codes to new ones
  if (planCode === 'trial' || planCode === 'basic') return 'starter'
  if (planCode === 'premium' || planCode === 'professional') return 'operational'
  
  // Validate plan code
  if (['starter', 'operational', 'command', 'enterprise'].includes(planCode)) {
    return planCode as PlanCode
  }

  return 'starter' // Default fallback
}

/**
 * Get plan code from organization
 */
export async function getPlanCodeFromOrganization(organizationId: string): Promise<PlanCode | null> {
  const supabase = getServiceSupabaseClient() as any
  
  const { data: org, error } = await supabase
    .from('organizations')
    .select('tier')
    .eq('id', organizationId)
    .single()

  if (error || !org) return null

  const tier = org.tier
  // Map legacy tiers to new plan codes
  if (tier === 'free') return 'starter'
  if (tier === 'professional') return 'operational'
  
  // Validate tier
  if (['starter', 'operational', 'command', 'enterprise'].includes(tier)) {
    return tier as PlanCode
  }

  return 'starter' // Default fallback
}

/**
 * Get plan features for a company
 */
export async function getPlanFeaturesForCompany(companyId: string) {
  const planCode = await getPlanCodeFromCompany(companyId)
  if (!planCode) return null
  
  return getPlanFeatures(planCode)
}

/**
 * Check if company can create an event
 */
export async function checkCanCreateEvent(companyId: string, currentEventCount: number): Promise<{ allowed: boolean; reason?: string }> {
  const planCode = await getPlanCodeFromCompany(companyId)
  if (!planCode) {
    return { allowed: false, reason: 'Company not found' }
  }
  
  const allowed = canCreateEvent(planCode, currentEventCount)
  if (!allowed) {
    const plan = getPlan(planCode)
    const limit = plan.features.maxEvents
    return { 
      allowed: false, 
      reason: `Plan limit reached: ${limit} events maximum` 
    }
  }
  
  return { allowed: true }
}

/**
 * Check if company can create a user
 */
export async function checkCanCreateUser(companyId: string, currentUserCount: number): Promise<{ allowed: boolean; reason?: string }> {
  const planCode = await getPlanCodeFromCompany(companyId)
  if (!planCode) {
    return { allowed: false, reason: 'Company not found' }
  }
  
  const allowed = canCreateUser(planCode, currentUserCount)
  if (!allowed) {
    const plan = getPlan(planCode)
    const limit = plan.features.maxUsers
    return { 
      allowed: false, 
      reason: `Plan limit reached: ${limit} users maximum` 
    }
  }
  
  return { allowed: true }
}

/**
 * Check if company can create staff member
 */
export async function checkCanCreateStaff(companyId: string, currentStaffCount: number): Promise<{ allowed: boolean; reason?: string }> {
  const planCode = await getPlanCodeFromCompany(companyId)
  if (!planCode) {
    return { allowed: false, reason: 'Company not found' }
  }
  
  const allowed = canCreateStaff(planCode, currentStaffCount)
  if (!allowed) {
    const plan = getPlan(planCode)
    const limit = plan.features.maxStaff
    return { 
      allowed: false, 
      reason: `Plan limit reached: ${limit} staff members maximum` 
    }
  }
  
  return { allowed: true }
}

/**
 * Check if event attendee count is within plan limits
 */
export async function checkAttendeeLimit(companyId: string, attendeeCount: number): Promise<{ allowed: boolean; reason?: string }> {
  const planCode = await getPlanCodeFromCompany(companyId)
  if (!planCode) {
    return { allowed: false, reason: 'Company not found' }
  }
  
  const allowed = withinAttendeeLimit(planCode, attendeeCount)
  if (!allowed) {
    const plan = getPlan(planCode)
    const limit = plan.features.maxAttendees
    return { 
      allowed: false, 
      reason: `Plan limit exceeded: ${limit} attendees maximum` 
    }
  }
  
  return { allowed: true }
}

/**
 * Check if company has a specific feature
 */
export async function checkHasFeature(companyId: string, feature: string): Promise<boolean> {
  const planCode = await getPlanCodeFromCompany(companyId)
  if (!planCode) return false
  
  return hasFeature(planCode, feature)
}

/**
 * Get current usage metrics for a company
 * Used for telemetry and analytics
 */
export async function getCompanyUsageMetrics(companyId: string) {
  const supabase = getServiceSupabaseClient()
  
  const [eventsResult, usersResult, staffResult] = await Promise.all([
    supabase.from('events').select('id', { count: 'exact', head: true }).eq('company_id', companyId),
    supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('company_id', companyId),
    supabase.from('staff').select('id', { count: 'exact', head: true }).eq('company_id', companyId),
  ])
  
  return {
    eventCount: eventsResult.count || 0,
    userCount: usersResult.count || 0,
    staffCount: staffResult.count || 0,
    timestamp: new Date().toISOString(),
  }
}

