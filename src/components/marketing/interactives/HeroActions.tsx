'use client'

import { useState } from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { useLaunchMode } from '@/hooks/useLaunchMode'
import { LaunchCountdown } from '@/components/marketing/LaunchCountdown'
import { cn } from '@/lib/utils'

const RegisterInterestModal = dynamic(
  () => import('@/components/marketing/RegisterInterestModal').then((mod) => mod.RegisterInterestModal),
  { ssr: false },
)

interface HeroActionsProps {
  className?: string
  primaryHref?: string
  secondaryHref?: string
  preLaunchLabel?: string
  postLaunchLabel?: string
  secondaryLabel?: string
  primaryButtonClassName?: string
  secondaryButtonClassName?: string
  countdownClassName?: string
  showCountdown?: boolean
}

export const HeroActions = ({
  className,
  primaryHref = '/signup',
  secondaryHref = '/features',
  preLaunchLabel = 'Book a Demo',
  postLaunchLabel = 'Book a Demo',
  secondaryLabel = 'Explore Features',
  primaryButtonClassName = '',
  secondaryButtonClassName = '',
  countdownClassName,
  showCountdown = true,
}: HeroActionsProps) => {
  const { isPreLaunch, preLaunchConfigured, launchDate, countdownStart, totalDurationMs } = useLaunchMode()
  const [open, setOpen] = useState(false)

  return (
    <div className={cn('flex flex-col items-center gap-4', className)}>
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        {isPreLaunch ? (
          <>
            <button
              type="button"
              onClick={() => setOpen(true)}
              className={cn(
                'bg-white text-blue-700 hover:bg-blue-100 hover:-translate-y-0.5 hover:shadow-xl px-8 py-4 rounded-xl text-lg font-semibold shadow-lg transition-all duration-300 active:scale-95',
                primaryButtonClassName,
              )}
            >
              {preLaunchLabel}
            </button>
            <RegisterInterestModal open={open} onOpenChange={setOpen} />
          </>
        ) : (
          <Link
            href={primaryHref}
            className={cn(
              'bg-white text-blue-700 hover:bg-blue-100 hover:-translate-y-0.5 hover:shadow-xl px-8 py-4 rounded-xl text-lg font-semibold shadow-lg transition-all duration-300 active:scale-95',
              primaryButtonClassName,
            )}
          >
            {postLaunchLabel}
          </Link>
        )}
        {secondaryHref && (
          <Link
            href={secondaryHref}
            className={cn(
              'bg-transparent border border-white text-white hover:bg-white/10 hover:-translate-y-0.5 hover:shadow-lg px-8 py-4 rounded-xl text-lg font-semibold shadow-md transition-all duration-300 active:scale-95',
              secondaryButtonClassName,
            )}
          >
            {secondaryLabel}
          </Link>
        )}
      </div>
      {preLaunchConfigured && showCountdown && (
        <div className={cn('flex items-center justify-center', countdownClassName)}>
          <LaunchCountdown
            launchDate={launchDate}
            countdownStart={countdownStart}
            totalDurationMs={totalDurationMs}
          />
        </div>
      )}
    </div>
  )
}
