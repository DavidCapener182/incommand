'use client'

import React from 'react'
import dynamic from 'next/dynamic'
import type { CallBackProps, Step } from 'react-joyride'
import { STATUS } from 'react-joyride'
import CustomTooltip from './joyride/CustomTooltip'
import { useTooltipOnboarding } from '@/hooks/useTooltipOnboarding'
import { usePathname } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'

const Joyride = dynamic(() => import('react-joyride'), { ssr: false })

interface OnboardingTooltipsProps {
  run?: boolean
}

export default function OnboardingTooltips({ run }: OnboardingTooltipsProps) {
  const { shouldShow, completeTour, skipTour } = useTooltipOnboarding()
  const pathname = usePathname() || '/'
  const { user } = useAuth()

  const steps: Step[] = [
    {
      target: '[data-tour="dashboard"]',
      title: 'Dashboard',
      content: 'Your live operational picture with key metrics and alerts.',
      disableBeacon: true,
      placement: 'bottom',
      // @ts-ignore - pass link to tutorial section
      data: { href: '/help/tutorial#dashboard' }
    },
    {
      target: '[data-tour="log-incident"]',
      title: 'Log Incident',
      content: 'Create and track incidents with status, photos and tags.',
      placement: 'bottom',
      // @ts-ignore
      data: { href: '/help/tutorial#incidents' }
    },
    {
      target: '[data-tour="quick-add-ai"]',
      title: 'Quick Add (AI)',
      content: 'Use natural language or voice to create structured entries.',
      placement: 'bottom',
      // @ts-ignore
      data: { href: '/help/tutorial#quickadd' }
    },
    {
      target: '[data-tour="analytics"]',
      title: 'Analytics & Risk Pulse',
      content: 'Spot trends and risk in real-time across your operation.',
      placement: 'bottom',
      // @ts-ignore
      data: { href: '/help/tutorial#analytics' }
    },
  ]

  const handleCallback = async (data: CallBackProps) => {
    const { status, action } = data
    if (status === STATUS.FINISHED) {
      completeTour()
      try { await supabase.from('onboarding_events').insert({ user_id: user?.id || null, event_type: 'finished', step_index: data.index ?? null, route: pathname }) } catch {}
    }
    if (action === 'skip') {
      skipTour()
      try { await supabase.from('onboarding_events').insert({ user_id: user?.id || null, event_type: 'skipped', step_index: data.index ?? null, route: pathname }) } catch {}
    }
    if (action === 'start') {
      try { await supabase.from('onboarding_events').insert({ user_id: user?.id || null, event_type: 'started', step_index: data.index ?? 0, route: pathname }) } catch {}
    }
    if (action === 'next' || action === 'prev' || action === 'update') {
      try { await supabase.from('onboarding_events').insert({ user_id: user?.id || null, event_type: 'step', step_index: data.index ?? null, route: pathname }) } catch {}
    }
  }

  return (
    <Joyride
      steps={steps}
      run={run ?? shouldShow}
      continuous
      showSkipButton
      showProgress
      disableOverlayClose
      disableOverlay
      spotlightClicks
      disableScrolling
      callback={handleCallback}
      tooltipComponent={CustomTooltip}
      styles={{
        options: {
          primaryColor: '#3b82f6',
          textColor: '#111827',
          zIndex: 10000,
          // soften overlay to match glass UI
          overlayColor: 'rgba(17,24,39,0.45)'
        },
        overlay: {
          mixBlendMode: 'normal',
        },
        spotlight: {
          borderRadius: 12,
          boxShadow: '0 0 0 2px rgba(59,130,246,0.35)'
        },
      }}
    />
  )
}


