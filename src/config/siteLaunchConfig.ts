const SIX_MONTHS_MS = 1000 * 60 * 60 * 24 * 30 * 6

const computeDefaultLaunchDate = () => {
  const now = new Date()
  const launch = new Date(now)
  launch.setMonth(launch.getMonth() + 6)
  return launch.toISOString()
}

const defaultLaunchDateIso = computeDefaultLaunchDate()

const configuredLaunchDate = process.env.NEXT_PUBLIC_LAUNCH_DATE
const configuredCountdownStart = process.env.NEXT_PUBLIC_LAUNCH_COUNTDOWN_START

export const siteLaunchConfig = {
  launchDate: configuredLaunchDate ?? defaultLaunchDateIso,
  preLaunch: process.env.NEXT_PUBLIC_SITE_PRELAUNCH !== 'false',
  countdownStart: configuredCountdownStart ?? null,
}

export const getLaunchDate = () => {
  const parsed = new Date(siteLaunchConfig.launchDate)
  if (Number.isNaN(parsed.getTime())) {
    return new Date(defaultLaunchDateIso)
  }
  return parsed
}

export const getCountdownStartDate = (launchDate: Date) => {
  if (siteLaunchConfig.countdownStart) {
    const parsed = new Date(siteLaunchConfig.countdownStart)
    if (!Number.isNaN(parsed.getTime())) {
      return parsed
    }
  }

  const fallbackStart = new Date(launchDate)
  fallbackStart.setTime(launchDate.getTime() - SIX_MONTHS_MS)
  return fallbackStart
}

export const COUNTDOWN_TOTAL_DURATION_MS = SIX_MONTHS_MS
