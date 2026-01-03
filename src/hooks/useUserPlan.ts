'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { PlanCode } from '@/config/PricingConfig'
import { supabase } from '@/lib/supabase'

/**
 * Hook to get the current user's subscription plan
 * Fetches plan from user's company
 */
export function useUserPlan(): PlanCode | null {
  const { user } = useAuth()
  const [plan, setPlan] = useState<PlanCode | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchPlan() {
      if (!user?.id) {
        setPlan(null)
        setLoading(false)
        return
      }

      try {
        // Get user's profile to find company_id
        const { data: profile, error: profileError } = await (supabase as any)
          .from('profiles')
          .select('company_id')
          .eq('id', user.id)
          .single()

        const profileData = profile as any;
        if (profileError || !profileData?.company_id) {
          console.warn('No company found for user, defaulting to starter plan')
          setPlan('starter')
          setLoading(false)
          return
        }

        // Get company's subscription plan
        const { data: company, error: companyError } = await (supabase as any)
          .from('companies')
          .select('subscription_plan')
          .eq('id', profileData.company_id)
          .single()

        if (companyError || !company) {
          console.warn('Company not found, defaulting to starter plan')
          setPlan('starter')
          setLoading(false)
          return
        }

        // Map legacy plan codes to new ones
        let planCode = (company as any)?.subscription_plan as string | undefined
        if (planCode === 'trial' || planCode === 'basic') planCode = 'starter'
        if (planCode === 'premium' || planCode === 'professional') planCode = 'operational'

        // Validate plan code
        const validPlanCodes: PlanCode[] = ['starter', 'operational', 'command', 'enterprise']
        if (planCode && validPlanCodes.includes(planCode as PlanCode)) {
          setPlan(planCode as PlanCode)
        } else {
          setPlan('starter') // Default fallback
        }
      } catch (error) {
        console.error('Error fetching user plan:', error)
        setPlan('starter') // Default fallback on error
      } finally {
        setLoading(false)
      }
    }

    fetchPlan()
  }, [user?.id])

  return plan
}


