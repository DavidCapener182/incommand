'use client'

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { StandConfig, StandsSetup } from '@/types/football'
import { Download, Cog } from 'lucide-react'
import StatusIndicator, { StatusDot, StatusType } from '@/components/football/StatusIndicator'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { useEventContext } from '@/contexts/EventContext'
import { supabase } from '@/lib/supabase'
import { predictStandFlow, type StandFlowPrediction, STAND_COUNTDOWN_OFFSETS } from '@/lib/analytics/crowdFlowPrediction'
import { useCompanyEventContext } from '@/hooks/useCompanyEventContext'
const buildContextQuery = (ctx: { companyId: string; eventId: string }) =>
  `?company_id=${ctx.companyId}&event_id=${ctx.eventId}`

const deriveCountdownBucket = (kickoffTime: Date | null) => {
  if (!kickoffTime) return null
  const minutesToKickoff = Math.round((kickoffTime.getTime() - Date.now()) / 60000)
  if (minutesToKickoff >= 55) return 60
  if (minutesToKickoff >= 45) return 50
  if (minutesToKickoff >= 35) return 40
  if (minutesToKickoff >= 25) return 30
  if (minutesToKickoff >= 15) return 20
  if (minutesToKickoff >= 5) return 10
  if (minutesToKickoff >= 0) return 0
  return null
}


interface FootballCard_StandOccupancyProps {
  className?: string
  onOpenModal?: () => void
}

export default function FootballCard_StandOccupancy({ className, onOpenModal }: FootballCard_StandOccupancyProps) {
  const { eventId, eventData } = useEventContext()
  const { context, loading: contextLoading } = useCompanyEventContext(eventId)
  const [standsSetup, setStandsSetup] = useState<StandsSetup | null>(null)
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [thresholds, setThresholds] = useState({
    default_green_threshold: 90,
    default_amber_threshold: 97,
    default_red_threshold: 100,
    stand_overrides: {} as Record<string, { amber?: number; red?: number }>,
  })
  const [standPredictions, setStandPredictions] = useState<Record<string, StandFlowPrediction>>({})

  const kickoffTime = useMemo(() => {
    if (eventData?.start_datetime) {
      return new Date(eventData.start_datetime)
    }
    if (eventData?.event_date && eventData?.main_act_start_time) {
      const time = eventData.main_act_start_time.includes(':')
        ? eventData.main_act_start_time
        : `${eventData.main_act_start_time}:00`
      const normalizedTime = time.length === 5 ? `${time}:00` : time
      return new Date(`${eventData.event_date}T${normalizedTime}`)
    }
    return null
  }, [eventData?.start_datetime, eventData?.event_date, eventData?.main_act_start_time])

  const kickoffTimestamp = kickoffTime?.getTime() ?? null

  useEffect(() => {
    if (!context) return
    let mounted = true

    const computeHorizonMinutes = () => {
      if (!kickoffTime) return 60
      const minutesUntilKickoff = Math.max(0, Math.round((kickoffTime.getTime() - Date.now()) / 60000))
      const padded = Math.ceil(minutesUntilKickoff / 10) * 10 + 10
      return Math.min(Math.max(60, padded), 360)
    }

    const loadStands = async () => {
      try {
        const res = await fetch(`/api/football/stands${buildContextQuery(context)}`)
        if (!res.ok) {
          console.error('Failed to load stand occupancy:', res.status, res.statusText)
          return
        }
        const payload = await res.json()
        if (mounted) {
          setStandsSetup(payload.standsSetup)
        }

        if (eventId && payload.standsSetup?.stands) {
          const predictions: Record<string, StandFlowPrediction> = {}
          const horizonMinutes = computeHorizonMinutes()
          for (const stand of payload.standsSetup.stands as StandConfig[]) {
            try {
              const prediction = await predictStandFlow(
                supabase,
                eventId,
                stand.id,
                stand.name,
                stand.capacity,
                horizonMinutes,
                stand.current || 0,
                context.companyId,
                kickoffTime || undefined
              )
              predictions[stand.name] = prediction
            } catch (err) {
              console.warn(`Failed to predict flow for stand ${stand.name}:`, err)
            }
          }
          if (mounted) setStandPredictions(predictions)
        } else if (mounted) {
          setStandPredictions({})
        }
      } catch (error) {
        console.error('Error loading stand occupancy:', error)
      }
    }

    const loadThresholds = async () => {
      try {
        const res = await fetch(`/api/football/thresholds${buildContextQuery(context)}`)
        if (!res.ok) return
        const data = await res.json()
        if (mounted) {
          setThresholds({
            default_green_threshold: data.default_green_threshold || 90,
            default_amber_threshold: data.default_amber_threshold || 97,
            default_red_threshold: data.default_red_threshold || 100,
            stand_overrides: data.stand_overrides || {},
          })
        }
      } catch (error) {
        console.error('Failed to load thresholds:', error)
      }
    }

    loadStands()
    loadThresholds()

    if (autoRefresh) {
      const id = setInterval(() => {
        loadStands()
        loadThresholds()
      }, 30000)
      return () => {
        mounted = false
        clearInterval(id)
      }
    }

    return () => {
      mounted = false
    }
  }, [context, autoRefresh, eventId, kickoffTimestamp])

  const getColorForStand = (standName: string, percent: number): string => {
    const override = thresholds.stand_overrides[standName]
    const amberThreshold = override?.amber ?? thresholds.default_amber_threshold
    const redThreshold = override?.red ?? thresholds.default_red_threshold
    const greenThreshold = thresholds.default_green_threshold

    if (percent >= redThreshold) return 'bg-red-500'
    if (percent >= amberThreshold) return 'bg-amber-500'
    if (percent >= greenThreshold) return 'bg-amber-500'
    return 'bg-green-500'
  }

  const getStatusTypeForStand = (standName: string, percent: number): StatusType => {
    const override = thresholds.stand_overrides[standName]
    const amberThreshold = override?.amber ?? thresholds.default_amber_threshold
    const redThreshold = override?.red ?? thresholds.default_red_threshold
    const greenThreshold = thresholds.default_green_threshold

    if (percent >= redThreshold) return 'alert'
    if (percent >= amberThreshold) return 'busy'
    if (percent >= greenThreshold) return 'busy'
    return 'normal'
  }

  const totals = useMemo(() => {
    if (!standsSetup?.stands) return { current: 0, capacity: 0, percent: 0 }
    const current = standsSetup.stands.reduce((sum, stand) => sum + (stand.current || 0), 0)
    const capacity = standsSetup.stands.reduce((sum, stand) => sum + (stand.capacity || 0), 0)
    const percent = capacity ? (current / capacity) * 100 : 0
    return { current, capacity, percent }
  }, [standsSetup])

  const statusType = useMemo(() => {
    if (!standsSetup) return 'normal' as StatusType
    const override = thresholds.stand_overrides['Overall']
    const amberThreshold = override?.amber ?? thresholds.default_amber_threshold
    const redThreshold = override?.red ?? thresholds.default_red_threshold
    const greenThreshold = thresholds.default_green_threshold

    if (totals.percent >= redThreshold) return 'alert'
    if (totals.percent >= amberThreshold) return 'busy'
    if (totals.percent >= greenThreshold) return 'busy'
    return 'normal'
  }, [standsSetup, totals.percent, thresholds])

  const handleExportReport = useCallback(async () => {
    if (!context) return
    try {
      const response = await fetch(`/api/football/export/stand${buildContextQuery(context)}`)
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `stand-occupancy-report-${new Date().toISOString()}.csv`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      }
    } catch (error) {
      console.error('Failed to export report:', error)
    }
  }, [context]);

  const statusLabelMap: Record<StatusType, string> = {
    normal: 'Normal',
    busy: 'Busy',
    alert: 'Alert',
  }

  const statusToneMap: Record<StatusType, string> = {
    normal: 'bg-emerald-100 text-emerald-700',
    busy: 'bg-amber-100 text-amber-700',
    alert: 'bg-red-100 text-red-700',
  }

  return (
    <div className={`h-full card-depth p-4 space-y-3 relative overflow-hidden flex flex-col ${className || ''}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          {standsSetup && <StatusDot status={statusType} />}
          <h3 className="text-gray-800 font-semibold text-lg leading-tight">Stand Occupancy</h3>
        </div>

        {(onOpenModal || context) && (
          <div className="flex items-center gap-2 shrink-0">
            {standsSetup && (
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-semibold ${statusToneMap[statusType]}`}
              >
                {statusLabelMap[statusType]}
              </span>
            )}
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                void handleExportReport()
              }}
              className="h-7 w-7 rounded-full bg-white/70 text-gray-700 shadow hover:bg-white transition"
              title="Export occupancy report"
            >
              <Download className="h-4 w-4 mx-auto" />
            </button>
            {onOpenModal && (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  onOpenModal()
                }}
                className="h-7 w-7 opacity-60 hover:opacity-100 transition-opacity flex items-center justify-center"
                title="Open Stand Occupancy settings"
              >
                <Cog className="h-4 w-4" />
              </button>
            )}
          </div>
        )}
      </div>

      {!standsSetup ? (
        <div className="text-xs text-gray-500">
          {contextLoading ? 'Loading event context…' : 'Loading stand occupancy…'}
        </div>
      ) : (
        <div className="flex-1 overflow-hidden flex flex-col min-h-0">
          <div className="text-xs text-gray-600 mb-2">
            Overall:{' '}
            <span className="font-semibold text-gray-900">
              {totals.current.toLocaleString()} / {totals.capacity.toLocaleString()} ({totals.percent.toFixed(1)}
              %)
            </span>
          </div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 overflow-y-auto flex-1 pr-1">
            {standsSetup.stands.map((stand) => {
              const percent = stand.capacity ? Math.min(100, ((stand.current || 0) / stand.capacity) * 100) : 0
              const colour = getColorForStand(stand.name, percent)
              const prediction = standPredictions[stand.name]
              const hasHighRisk = prediction?.predictedOccupancy.some(
                (p) => p.riskLevel === 'high' || p.riskLevel === 'critical'
              )
              const trend = (() => {
                if (!prediction || !kickoffTime) return null
                const minutesToKickoff = Math.max(0, Math.round((kickoffTime.getTime() - Date.now()) / 60000))
                const nearest = prediction.predictedOccupancy.reduce(
                  (closest, entry) => {
                    const diff = Math.abs(entry.minutesAhead - minutesToKickoff)
                    if (diff < closest.diff) {
                      return { diff, entry }
                    }
                    return closest
                  },
                  { diff: Infinity, entry: null as (typeof prediction.predictedOccupancy)[0] | null }
                ).entry
                if (!nearest || stand.capacity === 0) return null
                const bucket = deriveCountdownBucket(kickoffTime)
                const actualBasis =
                  bucket != null && stand.snapshots?.[bucket] != null
                    ? (stand.snapshots?.[bucket] as number)
                    : stand.current || 0
                const actualPercent = (actualBasis / stand.capacity) * 100
                const predictedPercent = (nearest.predictedOccupancy / stand.capacity) * 100
                const diff = actualPercent - predictedPercent
                if (Math.abs(diff) < 3) {
                  return { label: 'on track', className: 'text-emerald-600' }
                }
                if (diff > 0) {
                  return { label: `+${diff.toFixed(1)}% vs plan`, className: 'text-emerald-600' }
                }
                return { label: `${diff.toFixed(1)}% vs plan`, className: 'text-amber-600' }
              })()

              return (
                <div
                  key={stand.id}
                  className="rounded-md border border-gray-100 px-2.5 py-1.5 dark:border-gray-800"
                >
                  <button
                    onClick={() => {
                      if (onOpenModal) onOpenModal()
                    }}
                    className="w-full text-left"
                    type="button"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1 min-w-0">
                          <span className="font-medium text-sm text-gray-900 dark:text-gray-100 truncate">
                            {stand.name}
                          </span>
                          {hasHighRisk && <span className="text-amber-500 text-xs">⚠</span>}
                        </div>
                        <span className="text-xs font-semibold text-gray-900 dark:text-gray-100">
                          {percent.toFixed(0)}%
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="h-1 flex-1 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${colour} rounded-full transition-all duration-500`}
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                        <span className="text-[10px] text-muted-foreground">
                          {stand.current?.toLocaleString() || 0} / {stand.capacity.toLocaleString()}
                        </span>
                      </div>
                      {trend && (
                        <p className={`text-[10px] font-medium ${trend.className}`}>
                          {trend.label}
                        </p>
                      )}
                    </div>
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}



