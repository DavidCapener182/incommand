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
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('company_id')
          .eq('id', user.id)
          .single()

        if (profileError || !profile?.company_id) {
          console.warn('No company found for user, defaulting to starter plan')
          setPlan('starter')
          setLoading(false)
          return
        }

        // Get company's subscription plan
        const { data: company, error: companyError } = await supabase
          .from('companies')
          .select('subscription_plan')
          .eq('id', profile.company_id)
          .single()

        if (companyError || !company) {
          console.warn('Company not found, defaulting to starter plan')
          setPlan('starter')
          setLoading(false)
          return
        }

        // Map legacy plan codes to new ones
        let planCode = company.subscription_plan
        if (planCode === 'trial' || planCode === 'basic') planCode = 'starter'
        if (planCode === 'premium' || planCode === 'professional') planCode = 'operational'

        // Validate plan code
        if (['starter', 'operational', 'command', 'enterprise'].includes(planCode)) {
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


