'use client'

import React from 'react'
import Joyride, { CallBackProps, STATUS, Step } from 'react-joyride'
import CustomTooltip from './joyride/CustomTooltip'
import { useTooltipOnboarding } from '@/hooks/useTooltipOnboarding'

interface OnboardingTooltipsProps {
  run?: boolean
}

export default function OnboardingTooltips({ run }: OnboardingTooltipsProps) {
  const { shouldShow, completeTour, skipTour } = useTooltipOnboarding()

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

  const handleCallback = (data: CallBackProps) => {
    const { status, action } = data
    if ([STATUS.FINISHED].includes(status)) {
      completeTour()
    }
    if (action === 'skip') {
      skipTour()
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


