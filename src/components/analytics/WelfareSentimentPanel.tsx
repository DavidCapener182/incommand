import React from 'react'
import { WelfareSentimentInsight } from '@/types/crowdIntelligence'

interface Props {
  insights: WelfareSentimentInsight[]
  loading?: boolean
}

const concernColors: Record<string, string> = {
  critical: 'text-red-600 bg-red-50 border-red-200',
  warning: 'text-amber-600 bg-amber-50 border-amber-200',
  watch: 'text-yellow-600 bg-yellow-50 border-yellow-200',
  normal: 'text-emerald-600 bg-emerald-50 border-emerald-200',
}

export function WelfareSentimentPanel({ insights, loading = false }: Props) {
  if (loading) {
    return (
      <div className="card-depth rounded-2xl border border-border/60 bg-background p-4">
        <div className="animate-pulse space-y-3">
          <div className="h-4 w-40 rounded bg-muted" />
          <div className="h-16 rounded-lg bg-muted" />
        </div>
      </div>
    )
  }

  if (insights.length === 0) {
    return (
      <div className="card-depth rounded-2xl border border-border/60 bg-background p-6 text-center text-sm text-muted-foreground">
        No welfare sentiment signals detected.
      </div>
    )
  }

  return (
    <div className="card-depth rounded-2xl border border-border/60 bg-background p-4">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-foreground">Welfare Sentiment</p>
          <p className="text-xs text-muted-foreground">App feedback, social feeds & crowd sensors</p>
        </div>
        <span className="text-xs text-muted-foreground">{insights.length} monitored zones</span>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {insights.map((insight, index) => (
          <div key={`${insight.zoneId ?? insight.zoneLabel ?? 'unknown'}-${index}`} className="space-y-3 rounded-2xl border border-border/50 bg-muted/40 p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-foreground">{insight.zoneLabel || 'General Area'}</p>
                <p className="text-xs text-muted-foreground">
                  {insight.sampleCount.toLocaleString()} samples • Avg sentiment {insight.averageSentiment.toFixed(2)}
                </p>
              </div>
              <span
                className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${
                  concernColors[insight.concernLevel] || concernColors.normal
                }`}
              >
                {insight.concernLevel}
              </span>
            </div>

            {insight.keywords.length > 0 && (
              <div className="flex flex-wrap gap-1 text-[11px] text-muted-foreground">
                {insight.keywords.slice(0, 6).map(keyword => (
                  <span key={keyword} className="rounded-full bg-background px-2 py-0.5">
                    #{keyword}
                  </span>
                ))}
              </div>
            )}

            <div className="space-y-1 text-[11px] text-muted-foreground">
              {Object.entries(insight.sourceBreakdown)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 3)
                .map(([source, count]) => (
                  <div key={source} className="flex items-center justify-between">
                    <span>{source}</span>
                    <span className="font-medium text-foreground">{count}</span>
                  </div>
                ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}


