'use client'

import { useCallback, useMemo } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useUpdatePreference } from '@/hooks/useUserPreferences'

export const TOUR_VERSION = 1

type OnboardingUIPrefs = {
  onboarding?: {
    show_tooltips?: boolean
    tour_version?: number
  }
}

export function useTooltipOnboarding() {
  const { userPreferences } = useAuth()
  const { updatePreference } = useUpdatePreference()

  const uiPrefs: OnboardingUIPrefs = useMemo(() => {
    return (userPreferences?.ui_preferences as any) || {}
  }, [userPreferences?.ui_preferences])

  const current = uiPrefs.onboarding || {}

  const shouldShow = useMemo(() => {
    // Always return false to disable popup tutorials
    return false
  }, [])

  const startTour = useCallback(async () => {
    const next = {
      ...(userPreferences?.ui_preferences || {}),
      onboarding: {
        show_tooltips: true,
        tour_version: current.tour_version ?? 0,
      },
    }
    await updatePreference('ui_preferences', next as any)
  }, [userPreferences?.ui_preferences, current.tour_version, updatePreference])

  const completeTour = useCallback(async () => {
    const next = {
      ...(userPreferences?.ui_preferences || {}),
      onboarding: {
        show_tooltips: false,
        tour_version: TOUR_VERSION,
      },
    }
    await updatePreference('ui_preferences', next as any)
  }, [userPreferences?.ui_preferences, updatePreference])

  const skipTour = useCallback(async () => {
    const next = {
      ...(userPreferences?.ui_preferences || {}),
      onboarding: {
        show_tooltips: false,
        tour_version: current.tour_version ?? TOUR_VERSION,
      },
    }
    await updatePreference('ui_preferences', next as any)
  }, [userPreferences?.ui_preferences, current.tour_version, updatePreference])

  const restartTour = useCallback(async () => {
    const next = {
      ...(userPreferences?.ui_preferences || {}),
      onboarding: {
        show_tooltips: true,
        tour_version: 0,
      },
    }
    await updatePreference('ui_preferences', next as any)
  }, [userPreferences?.ui_preferences, updatePreference])

  return {
    isReady: true,
    shouldShow,
    startTour,
    completeTour,
    skipTour,
    restartTour,
  }
}


