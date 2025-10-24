'use client'

import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

interface LaunchCountdownProps {
  launchDate: Date
  countdownStart?: Date
  onLaunch?: () => void
  className?: string
  progressBarClassName?: string
  totalDurationMs?: number
}

interface TimeLeft {
  days: number
  hours: number
  minutes: number
  seconds: number
  expired: boolean
}

const calculateTimeLeft = (target: Date): TimeLeft => {
  const difference = target.getTime() - Date.now()

  if (difference <= 0) {
    return {
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      expired: true,
    }
  }

  const totalSeconds = Math.floor(difference / 1000)
  const days = Math.floor(totalSeconds / 86400)
  const hours = Math.floor((totalSeconds % 86400) / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  return {
    days,
    hours,
    minutes,
    seconds,
    expired: false,
  }
}

export const LaunchCountdown = ({
  launchDate,
  countdownStart,
  onLaunch,
  className,
  progressBarClassName,
  totalDurationMs,
}: LaunchCountdownProps) => {
  const [timeLeft, setTimeLeft] = useState(() => calculateTimeLeft(launchDate))

  useEffect(() => {
    const update = () => {
      setTimeLeft((prev) => {
        const next = calculateTimeLeft(launchDate)
        if (!prev.expired && next.expired) {
          onLaunch?.()
        }
        return next
      })
    }

    const timer = window.setInterval(update, 1000)
    update()

    return () => window.clearInterval(timer)
  }, [launchDate, onLaunch])

  let progress: number | null = null
  if (countdownStart) {
    const launchTs = launchDate.getTime()
    const startTs = countdownStart.getTime()
    const duration = totalDurationMs ?? Math.max(launchTs - startTs, 1)

    if (duration > 0) {
      const remaining = Math.max(launchTs - Date.now(), 0)
      progress = Math.min(Math.max(1 - remaining / duration, 0), 1)
    }
  }

  if (Number.isNaN(launchDate.getTime())) {
    return null
  }

  if (timeLeft.expired) {
    return (
      <p className={cn('text-blue-100 text-lg mt-4 font-semibold', className)}>
        We&apos;re live! <span className="text-white font-bold">Sign up now to get started.</span>
      </p>
    )
  }

  return (
    <div className={cn('mt-4 text-blue-100 text-lg font-semibold', className)}>
      <p>
        Launching InCommand in{' '}
        <span className="text-white font-bold">
          {timeLeft.days} days, {timeLeft.hours} hours, {timeLeft.minutes} minutes
        </span>
      </p>
    </div>
  )
}
