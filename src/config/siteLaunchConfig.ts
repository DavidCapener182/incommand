const SIX_MONTHS_MS = 1000 * 60 * 60 * 24 * 30 * 6

const computeDefaultLaunchDate = () => {
  // Set a fixed launch date instead of always calculating 6 months from now
  // This ensures the countdown is consistent and actually counts down
  const launch = new Date('2026-04-26T00:00:00.000Z')
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
