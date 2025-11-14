import React from 'react'
import { CrowdIntelligenceSummary } from '@/types/crowdIntelligence'

interface Props {
  alerts: CrowdIntelligenceSummary['criticalAlerts']
  loading?: boolean
}

const alertIcons: Record<string, string> = {
  behavior: '🎥',
  welfare: '❤️',
}

export function CrowdAlertsList({ alerts, loading = false }: Props) {
  if (loading) {
    return (
      <div className="card-depth rounded-2xl border border-border/60 bg-background p-4">
        <div className="animate-pulse space-y-2">
          <div className="h-4 w-24 rounded bg-muted" />
          <div className="h-12 rounded bg-muted" />
        </div>
      </div>
    )
  }

  if (alerts.length === 0) {
    return (
      <div className="card-depth rounded-2xl border border-border/60 bg-background p-4 text-sm text-muted-foreground">
        No critical alerts in the last hour.
      </div>
    )
  }

  return (
    <div className="card-depth rounded-2xl border border-border/60 bg-background p-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-semibold text-foreground">Critical Alerts</p>
        <span className="text-xs text-muted-foreground">{alerts.length} active</span>
      </div>

      <div className="space-y-3">
        {alerts.map((alert, index) => (
          <div key={`${alert.type}-${index}`} className="rounded-xl border border-border/50 bg-muted/40 p-3">
            <div className="flex items-center gap-2">
              <span className="text-lg">{alertIcons[alert.type] ?? '⚠️'}</span>
              <div>
                <p className="text-sm font-semibold text-foreground">{alert.message}</p>
                <p className="text-xs text-muted-foreground">
                  {alert.zoneLabel || 'General area'} • {new Date(alert.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}


