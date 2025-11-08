// @ts-nocheck
/**
 * Subscription Management Utilities
 * Server-side functions for managing user subscriptions and quotas
 */

import { getServiceSupabaseClient } from '@/lib/supabaseServer'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'

export interface SubscriptionTier {
  id: string
  monthlyTokenAllowance: number
  monthlyCostCapUsd: number
  overagePolicy: 'block' | 'warn'
}

export interface UserSubscription {
  userId: string
  tierId: string
  renewalAnchor: Date
}

export interface QuotaCheck {
  withinAllowance: boolean
  remainingTokens: number
  policy: 'block' | 'warn'
  hardBlocked: boolean
  usagePercentage: number
}

/**
 * Get user's subscription tier
 */
export async function getUserTier(userId: string): Promise<SubscriptionTier> {
  const supabase = getServiceSupabaseClient()

  // Get user's subscription
  const { data: subscription, error: subError } = await supabase
    .from<any, any>('user_subscriptions')
    .select('tier_id')
    .eq('user_id', userId)
    .single()

  if (subError || !subscription) {
    // Default to free tier if no subscription found
    const { data: freeTier, error: tierError } = await supabase
      .from<any, any>('subscription_tiers')
      .select('*')
      .eq('id', 'free')
      .single()

    if (tierError || !freeTier) {
      // Fallback defaults
      return {
        id: 'free',
        monthlyTokenAllowance: 10000,
        monthlyCostCapUsd: 0,
        overagePolicy: 'block',
      }
    }

    return {
      id: freeTier.id,
      monthlyTokenAllowance: freeTier.monthly_token_allowance,
      monthlyCostCapUsd: parseFloat(String(freeTier.monthly_cost_cap_usd || 0)),
      overagePolicy: freeTier.overage_policy as 'block' | 'warn',
    }
  }

  // Get tier details
  const { data: tier, error: tierError } = await supabase
    .from<any, any>('subscription_tiers')
    .select('*')
    .eq('id', subscription.tier_id)
    .single()

  if (tierError || !tier) {
    // Fallback to free tier
    return {
      id: 'free',
      monthlyTokenAllowance: 10000,
      monthlyCostCapUsd: 0,
      overagePolicy: 'block',
    }
  }

  return {
    id: tier.id,
    monthlyTokenAllowance: tier.monthly_token_allowance,
    monthlyCostCapUsd: parseFloat(String(tier.monthly_cost_cap_usd || 0)),
    overagePolicy: tier.overage_policy as 'block' | 'warn',
  }
}

/**
 * Check if user is within quota limits
 */
export async function checkQuota(params: { userId: string }): Promise<QuotaCheck> {
  const supabase = getServiceSupabaseClient()

  // Get user's tier
  const tier = await getUserTier(params.userId)

  // Get user's subscription to find renewal anchor
  const { data: subscription } = await supabase
    .from<any, any>('user_subscriptions')
    .select('renewal_anchor')
    .eq('user_id', params.userId)
    .single()

  const renewalAnchor = subscription?.renewal_anchor
    ? new Date(subscription.renewal_anchor)
    : new Date()

  // Calculate current period start (month containing renewal anchor)
  const periodStart = new Date(renewalAnchor.getFullYear(), renewalAnchor.getMonth(), renewalAnchor.getDate())
  const periodEnd = new Date(periodStart)
  periodEnd.setMonth(periodEnd.getMonth() + 1)

  // Get usage for current period
  const { data: usage, error } = await supabase
    .from<Database['public']['Tables']['ai_usage_logs']['Row'], Database['public']['Tables']['ai_usage_logs']['Update']>('ai_usage_logs')
    .select('tokens_total, cost_usd')
    .eq('user_id', params.userId)
    .gte('timestamp', periodStart.toISOString())
    .lt('timestamp', periodEnd.toISOString())

  if (error) {
    console.error('Failed to check quota:', error)
    // On error, allow usage but log it
    return {
      withinAllowance: true,
      remainingTokens: tier.monthlyTokenAllowance,
      policy: tier.overagePolicy,
      hardBlocked: false,
      usagePercentage: 0,
    }
  }

  const tokensUsed = usage?.reduce((sum, log) => sum + (log.tokens_total || 0), 0) || 0
  const costUsed = usage?.reduce((sum, log) => sum + parseFloat(String(log.cost_usd || 0)), 0) || 0

  const remainingTokens = Math.max(0, tier.monthlyTokenAllowance - tokensUsed)
  const withinAllowance = tokensUsed < tier.monthlyTokenAllowance
  const withinCostCap = tier.monthlyCostCapUsd === 0 || costUsed < tier.monthlyCostCapUsd

  const hardBlocked =
    !withinAllowance && tier.overagePolicy === 'block' && tier.monthlyTokenAllowance > 0

  const usagePercentage = tier.monthlyTokenAllowance > 0
    ? (tokensUsed / tier.monthlyTokenAllowance) * 100
    : 0

  return {
    withinAllowance: withinAllowance && withinCostCap,
    remainingTokens,
    policy: tier.overagePolicy,
    hardBlocked,
    usagePercentage: Math.round(usagePercentage * 100) / 100,
  }
}

/**
 * Set user's subscription tier
 */
export async function setUserSubscription(
  userId: string,
  tierId: string,
  renewalAnchor?: Date
): Promise<void> {
  const supabase = getServiceSupabaseClient()

  const { error } = await supabase
    .from<any, any>('user_subscriptions')
    .upsert({
      user_id: userId,
      tier_id: tierId,
      renewal_anchor: renewalAnchor?.toISOString().split('T')[0] || new Date().toISOString().split('T')[0],
    })

  if (error) {
    console.error('Failed to set user subscription:', error)
    throw error
  }
}

