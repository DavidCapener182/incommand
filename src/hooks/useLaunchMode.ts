'use client'

import { useEffect, useMemo, useState } from 'react'
import { COUNTDOWN_TOTAL_DURATION_MS, getCountdownStartDate, getLaunchDate, siteLaunchConfig } from '@/config/siteLaunchConfig'

interface LaunchModeState {
  launchDate: Date
  countdownStart: Date
  isPreLaunch: boolean
  hasLaunched: boolean
  preLaunchConfigured: boolean
  totalDurationMs: number
}

export const useLaunchMode = (): LaunchModeState => {
  const launchDate = useMemo(() => getLaunchDate(), [])
  const countdownStart = useMemo(() => getCountdownStartDate(launchDate), [launchDate])
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const tick = () => setNow(Date.now())
    const interval = window.setInterval(tick, 1000)
    return () => window.clearInterval(interval)
  }, [])

  const launchTimestamp = launchDate.getTime()
  const hasValidLaunchDate = !Number.isNaN(launchTimestamp)
  const preLaunchConfigured = siteLaunchConfig.preLaunch && hasValidLaunchDate
  const hasLaunched = preLaunchConfigured ? now >= launchTimestamp : !siteLaunchConfig.preLaunch
  const isPreLaunch = preLaunchConfigured && !hasLaunched

  const computedDuration = Math.max(
    launchTimestamp - countdownStart.getTime(),
    COUNTDOWN_TOTAL_DURATION_MS,
  )

  return {
    launchDate,
    countdownStart,
    isPreLaunch,
    hasLaunched,
    preLaunchConfigured,
    totalDurationMs: computedDuration,
  }
}
