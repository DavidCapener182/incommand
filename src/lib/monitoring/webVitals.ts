/**
 * Web Vitals reporting using the browser Performance API.
 * Reports CLS, FID, FCP, LCP, TTFB metrics to the console and
 * optionally to an analytics endpoint.
 *
 * This avoids adding the `web-vitals` npm package by using
 * PerformanceObserver directly (same underlying API).
 */

export interface WebVitalMetric {
  name: string
  value: number
  rating: 'good' | 'needs-improvement' | 'poor'
  timestamp: number
}

type MetricHandler = (metric: WebVitalMetric) => void

const handlers: MetricHandler[] = []

export function onWebVital(handler: MetricHandler) {
  handlers.push(handler)
}

function emit(metric: WebVitalMetric) {
  for (const h of handlers) {
    try {
      h(metric)
    } catch {
      // Don't let consumer errors break monitoring
    }
  }
}

function rate(name: string, value: number): WebVitalMetric['rating'] {
  const thresholds: Record<string, [number, number]> = {
    CLS: [0.1, 0.25],
    FID: [100, 300],
    FCP: [1800, 3000],
    LCP: [2500, 4000],
    TTFB: [800, 1800],
    INP: [200, 500],
  }
  const [good, poor] = thresholds[name] || [Infinity, Infinity]
  if (value <= good) return 'good'
  if (value <= poor) return 'needs-improvement'
  return 'poor'
}

/**
 * Initialise Web Vitals collection. Call once on app start.
 * Safe to call in any environment (SSR guard included).
 */
export function initWebVitals() {
  if (typeof window === 'undefined' || typeof PerformanceObserver === 'undefined') return

  // LCP
  try {
    const lcpObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries()
      const last = entries[entries.length - 1] as any
      if (last) {
        const value = last.startTime
        emit({ name: 'LCP', value, rating: rate('LCP', value), timestamp: Date.now() })
      }
    })
    lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true })
  } catch { /* unsupported */ }

  // FID
  try {
    const fidObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        const e = entry as any
        const value = e.processingStart - e.startTime
        emit({ name: 'FID', value, rating: rate('FID', value), timestamp: Date.now() })
      }
    })
    fidObserver.observe({ type: 'first-input', buffered: true })
  } catch { /* unsupported */ }

  // CLS
  try {
    let clsValue = 0
    const clsObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        const e = entry as any
        if (!e.hadRecentInput) {
          clsValue += e.value
        }
      }
      emit({ name: 'CLS', value: clsValue, rating: rate('CLS', clsValue), timestamp: Date.now() })
    })
    clsObserver.observe({ type: 'layout-shift', buffered: true })
  } catch { /* unsupported */ }

  // FCP
  try {
    const fcpObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.name === 'first-contentful-paint') {
          emit({ name: 'FCP', value: entry.startTime, rating: rate('FCP', entry.startTime), timestamp: Date.now() })
        }
      }
    })
    fcpObserver.observe({ type: 'paint', buffered: true })
  } catch { /* unsupported */ }

  // TTFB
  try {
    const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined
    if (nav) {
      const value = nav.responseStart - nav.requestStart
      emit({ name: 'TTFB', value, rating: rate('TTFB', value), timestamp: Date.now() })
    }
  } catch { /* unsupported */ }

  // INP (Interaction to Next Paint)
  try {
    const inpObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        const e = entry as any
        const value = e.duration
        emit({ name: 'INP', value, rating: rate('INP', value), timestamp: Date.now() })
      }
    })
    inpObserver.observe({ type: 'event', buffered: true, durationThreshold: 40 } as any)
  } catch { /* unsupported */ }
}
