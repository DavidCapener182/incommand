'use client'

import * as React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export interface MetricCardHighlight {
  label: string
  value: React.ReactNode
  emphasis?: 'default' | 'success' | 'warning' | 'danger'
}

export interface MetricCardProps {
  title: string
  icon?: React.ReactNode
  primaryMetric: MetricCardHighlight
  secondaryMetrics?: MetricCardHighlight[]
  footer?: React.ReactNode
  className?: string
}

const emphasisStyles: Record<NonNullable<MetricCardHighlight['emphasis']>, string> = {
  default: 'text-gray-900 dark:text-white',
  success: 'text-emerald-600 dark:text-emerald-400',
  warning: 'text-amber-600 dark:text-amber-400',
  danger: 'text-rose-600 dark:text-rose-400',
}

export function MetricCard({
  title,
  icon,
  primaryMetric,
  secondaryMetrics,
  footer,
  className,
}: MetricCardProps) {
  const emphasis = primaryMetric.emphasis ?? 'default'

  return (
    <Card className={`card-depth ${className ?? ''}`}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg font-semibold">
          {icon}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="text-center">
          <div className={`text-2xl font-bold ${emphasisStyles[emphasis]}`}>
            {primaryMetric.value}
          </div>
          <p className="text-xs text-muted-foreground mt-1">{primaryMetric.label}</p>
        </div>

        {secondaryMetrics?.length ? (
          <div className="grid grid-cols-2 gap-2">
            {secondaryMetrics.map((metric, index) => (
              <div
                key={`${metric.label}-${index}`}
                className="rounded-lg border border-border/60 p-2 text-center"
              >
                <div
                  className={`text-sm font-semibold ${
                    emphasisStyles[metric.emphasis ?? 'default']
                  }`}
                >
                  {metric.value}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">{metric.label}</p>
              </div>
            ))}
          </div>
        ) : null}

        {footer ? <div className="pt-2 border-t border-border/60 text-xs">{footer}</div> : null}
      </CardContent>
    </Card>
  )
}

MetricCard.displayName = 'MetricCard'

export default MetricCard
