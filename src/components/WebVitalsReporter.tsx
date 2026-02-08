'use client'

import { useEffect } from 'react'

export default function WebVitalsReporter() {
  useEffect(() => {
    import('@/lib/monitoring/webVitals').then(({ initWebVitals, onWebVital }) => {
      onWebVital((metric) => {
        // Log to console in dev, could POST to an endpoint in prod
        if (process.env.NODE_ENV === 'development') {
          const color =
            metric.rating === 'good'
              ? 'green'
              : metric.rating === 'needs-improvement'
                ? 'orange'
                : 'red'
          console.log(
            `%c[Web Vital] ${metric.name}: ${Math.round(metric.value * 100) / 100} (${metric.rating})`,
            `color: ${color}; font-weight: bold`
          )
        }

        // Report to Vercel Analytics (if available)
        try {
          if (typeof window !== 'undefined' && (window as any).__VERCEL_INSIGHTS__?.queue) {
            (window as any).__VERCEL_INSIGHTS__.queue.push({
              type: 'vital',
              name: metric.name,
              value: metric.value,
              rating: metric.rating,
            })
          }
        } catch {
          // Ignore – Vercel Insights may not be present
        }
      })

      initWebVitals()
    })
  }, [])

  return null
}
