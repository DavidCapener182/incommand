'use client'

import React from 'react'
import { AlertTriangle, Shield } from 'lucide-react'
import { ZoneRiskScore } from '@/types/crowdIntelligence'

interface CrowdRiskMatrixProps {
  zones?: ZoneRiskScore[]
}

const severityBadge: Record<string, string> = {
  critical: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-200',
  high: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-200',
  medium: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-200',
  low: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200',
  warning: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-200',
  watch: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-200',
  normal: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200',
}

export function CrowdRiskMatrix({ zones = [] }: CrowdRiskMatrixProps) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900/60">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Priority Focus</p>
          <p className="text-lg font-semibold text-gray-900 dark:text-white">Crowd Risk Matrix</p>
        </div>
        <AlertTriangle className="h-5 w-5 text-red-500" />
      </div>

      {zones.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">
          No recent zones flagged. Keep ingesting radio, CCTV and welfare signals to populate this
          list.
        </p>
      ) : (
        <div className="space-y-3">
          {zones.slice(0, 6).map(zone => (
            <div
              key={`${zone.zoneId}-${zone.zoneLabel}`}
              className="rounded-xl border border-gray-100 bg-gray-50/80 p-3 dark:border-white/5 dark:bg-white/5"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    {zone.zoneLabel || 'Unmapped Zone'}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {(zone.dominantBehavior && `Behavior: ${zone.dominantBehavior}`) || 'Monitoring'}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs uppercase text-gray-400">Risk</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">
                    {(zone.combinedScore * 100).toFixed(0)}%
                  </p>
                </div>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                {zone.behaviorSeverity && (
                  <span className={`rounded-full px-2 py-0.5 ${severityBadge[zone.behaviorSeverity]}`}>
                    Crowd {zone.behaviorSeverity}
                  </span>
                )}
                {zone.concernLevel && (
                  <span className={`rounded-full px-2 py-0.5 ${severityBadge[zone.concernLevel]}`}>
                    Welfare {zone.concernLevel}
                  </span>
                )}
                {typeof zone.averageSentiment === 'number' && (
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-slate-700 dark:bg-white/10 dark:text-slate-200">
                    Sentiment {zone.averageSentiment.toFixed(2)}
                  </span>
                )}
                <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-slate-700 dark:bg-white/10 dark:text-slate-200">
                  <Shield className="h-3.5 w-3.5" />
                  {zone.signalCount} signals
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

