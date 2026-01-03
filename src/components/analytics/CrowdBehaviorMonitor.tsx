import React from 'react'
import { CrowdBehaviorInsight } from '@/types/crowdIntelligence'

interface Props {
  insights: CrowdBehaviorInsight[]
  loading?: boolean
}

const severityColors: Record<string, string> = {
  critical: 'bg-red-100 text-red-700 border-red-200',
  high: 'bg-amber-100 text-amber-700 border-amber-200',
  medium: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  low: 'bg-emerald-50 text-emerald-700 border-emerald-200',
}

export function CrowdBehaviorMonitor({ insights, loading = false }: Props) {
  if (loading) {
    return (
      <div className="card-depth rounded-2xl border border-border/60 bg-background p-4">
        <div className="animate-pulse space-y-3">
          <div className="h-4 w-32 rounded bg-muted" />
          <div className="h-24 rounded-lg bg-muted" />
        </div>
      </div>
    )
  }

  if (insights.length === 0) {
    return (
      <div className="card-depth rounded-2xl border border-border/60 bg-background p-6 text-center text-sm text-muted-foreground">
        No recent crowd behaviour signals.
      </div>
    )
  }

  return (
    <div className="card-depth rounded-2xl border border-border/60 bg-background p-4">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-foreground">Crowd Behaviour Monitor</p>
          <p className="text-xs text-muted-foreground">Signals from the last hour</p>
        </div>
        <span className="text-xs text-muted-foreground">{insights.length} zones</span>
      </div>

      <div className="space-y-3">
        {insights.map((insight, index) => (
          <div
            key={`${insight.zoneId ?? insight.zoneLabel ?? 'unknown'}-${index}`}
            className="rounded-xl border border-border/50 bg-muted/40 p-3"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-foreground">{insight.zoneLabel || 'General Area'}</p>
                <p className="text-xs text-muted-foreground">
                  {insight.dominantBehavior ?? 'Unusual activity detected'}
                </p>
              </div>
              <span
                className={`rounded-full border px-2 py-0.5 text-xs font-medium ${
                  severityColors[insight.severity] || severityColors.low
                }`}
              >
                {insight.severity}
              </span>
            </div>

            <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-muted-foreground">
              {insight.supportingSources.map(source => (
                <span key={source} className="rounded-full bg-background px-2 py-0.5">
                  {source}
                </span>
              ))}
            </div>

            {insight.lastDetected && (
              <p className="mt-2 text-[11px] text-muted-foreground">
                Last detected {new Date(insight.lastDetected).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}


