'use client'

import React from 'react'
import { Activity, AlertTriangle, Eye, Users, TrendingUp } from 'lucide-react'
import {
  CrowdIntelligenceSummary,
  KeywordHighlight,
  SentimentTrendPoint,
} from '@/types/crowdIntelligence'

interface CrowdIntelligenceOverviewProps {
  metrics?: CrowdIntelligenceSummary['metrics']
  sentimentTrend?: SentimentTrendPoint[]
  keywordHighlights?: KeywordHighlight[]
}

export function CrowdIntelligenceOverview({
  metrics,
  sentimentTrend = [],
  keywordHighlights = [],
}: CrowdIntelligenceOverviewProps) {
  const metricCards = [
    {
      label: 'Signals Ingested',
      value: metrics?.totalSignals ?? 0,
      icon: Activity,
      accent: 'text-blue-600 bg-blue-50 dark:bg-blue-900/30 dark:text-blue-200',
    },
    {
      label: 'High / Critical',
      value: metrics?.highSeveritySignals ?? 0,
      icon: AlertTriangle,
      accent: 'text-red-600 bg-red-50 dark:bg-red-900/30 dark:text-red-200',
    },
    {
      label: 'Avg Sentiment',
      value:
        typeof metrics?.averageSentiment === 'number'
          ? metrics.averageSentiment.toFixed(2)
          : '—',
      icon: TrendingUp,
      accent: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 dark:text-emerald-200',
    },
    {
      label: 'Concern Zones',
      value: metrics?.concernZones ?? 0,
      icon: Eye,
      accent: 'text-purple-600 bg-purple-50 dark:bg-purple-900/30 dark:text-purple-200',
    },
  ]

  const hasTrend = sentimentTrend.length > 1
  const trendValues = hasTrend ? sentimentTrend.map(point => point.value) : [0]
  const max = Math.max(...trendValues)
  const min = Math.min(...trendValues)
  const range = max - min || 1

  const trendPoints = sentimentTrend
    .map((point, index) => {
      const x = (index / (sentimentTrend.length - 1 || 1)) * 100
      const y = 80 - ((point.value - min) / range) * 60
      return `${x},${y}`
    })
    .join(' ')

  const trendFill = sentimentTrend
    .map((point, index) => {
      const x = (index / (sentimentTrend.length - 1 || 1)) * 100
      const y = 80 - ((point.value - min) / range) * 60
      return `${x},${y}`
    })
    .concat(['100,80', '0,80'])
    .join(' ')

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900/60">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Live Overview</p>
            <p className="text-lg font-semibold text-gray-900 dark:text-white">Crowd Signals</p>
          </div>
          <Users className="h-5 w-5 text-gray-400" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          {metricCards.map(card => {
            const Icon = card.icon
            return (
              <div
                key={card.label}
                className="rounded-xl border border-gray-100 bg-gray-50/90 p-3 text-sm dark:border-white/5 dark:bg-white/5"
              >
                <div className={`mb-2 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs ${card.accent}`}>
                  <Icon className="h-3.5 w-3.5" />
                  <span>{card.label}</span>
                </div>
                <p className="text-2xl font-semibold text-gray-900 dark:text-white">{card.value}</p>
              </div>
            )
          })}
        </div>
        <div className="mt-5">
          <div className="flex items-center justify-between text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">
            <span>Sentiment Trend</span>
            {hasTrend && <span>Last {sentimentTrend.length * 10} mins</span>}
          </div>
          <div className="mt-3 h-28 w-full rounded-xl bg-gradient-to-b from-blue-50 to-blue-100/40 p-2 dark:from-blue-900/20 dark:to-blue-900/10">
            {hasTrend ? (
              <svg viewBox="0 0 100 80" className="h-full w-full text-blue-500 dark:text-blue-300">
                <polyline
                  points={trendFill}
                  fill="currentColor"
                  opacity={0.15}
                  stroke="none"
                />
                <polyline
                  points={trendPoints}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-gray-500 dark:text-gray-400">
                Waiting for welfare sentiment data
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="lg:col-span-2 space-y-4">
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900/60">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Keyword Pulse</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                Live Welfare Mentions
              </p>
            </div>
            <div className="rounded-full bg-rose-50 px-3 py-1 text-xs font-semibold uppercase text-rose-600 dark:bg-rose-900/30 dark:text-rose-200">
              {keywordHighlights.length} topics
            </div>
          </div>
          {keywordHighlights.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              No keyword signals in the selected window. Ingest more data to surface crowd
              sentiment insights.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {keywordHighlights.map(highlight => (
                <div
                  key={highlight.keyword}
                  className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-gray-50/80 px-3 py-1 text-sm font-medium text-gray-700 dark:border-white/10 dark:bg-white/5 dark:text-gray-100"
                >
                  <span className="text-xs uppercase tracking-wide text-gray-400">
                    {highlight.mentions}×
                  </span>
                  {highlight.keyword}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

