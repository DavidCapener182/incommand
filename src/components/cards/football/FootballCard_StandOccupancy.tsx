'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FootballData, StandOccupancyMap } from '@/types/football'
import { RefreshCw, Download, Settings } from 'lucide-react'
import QuickSettingsDropdown, { QuickSettingItem } from '@/components/football/QuickSettingsDropdown'
import StatusIndicator, { StatusDot, StatusType } from '@/components/football/StatusIndicator'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'


interface FootballCard_StandOccupancyProps {
  className?: string
  onOpenModal?: () => void
}

export default function FootballCard_StandOccupancy({ className, onOpenModal }: FootballCard_StandOccupancyProps) {
  const [data, setData] = useState<FootballData | null>(null)
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [thresholds, setThresholds] = useState({
    default_green_threshold: 90,
    default_amber_threshold: 97,
    default_red_threshold: 100,
    stand_overrides: {} as Record<string, { amber?: number; red?: number }>
  })

  useEffect(() => {
    let mounted = true
    const load = async () => {
      const res = await fetch('/api/football/data')
      if (!res.ok) return
      const json = await res.json()
      if (mounted) setData(json.data)
    }
    load()
    if (autoRefresh) {
      const id = setInterval(load, 30000)
      return () => { mounted = false; clearInterval(id) }
    }
    return () => { mounted = false }
  }, [autoRefresh])

  useEffect(() => {
    const loadThresholds = async () => {
      try {
        const res = await fetch('/api/football/thresholds?company_id=550e8400-e29b-41d4-a716-446655440000&event_id=550e8400-e29b-41d4-a716-446655440001')
        if (res.ok) {
          const data = await res.json()
          setThresholds({
            default_green_threshold: data.default_green_threshold || 90,
            default_amber_threshold: data.default_amber_threshold || 97,
            default_red_threshold: data.default_red_threshold || 100,
            stand_overrides: data.stand_overrides || {}
          })
        }
      } catch (error) {
        console.error('Failed to load thresholds:', error)
      }
    }
    loadThresholds()
  }, [])

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
    if (!data?.occupancy) return { current: 0, capacity: 0, percent: 0 }
    const values = Object.values(data.occupancy as StandOccupancyMap)
    const current = values.reduce((sum, v) => sum + (v.current || 0), 0)
    const capacity = values.reduce((sum, v) => sum + (v.capacity || 0), 0)
    const percent = capacity ? (current / capacity) * 100 : 0
    return { current, capacity, percent }
  }, [data])

  const statusType = useMemo(() => {
    if (!data) return 'normal' as StatusType
    // Use thresholds to determine overall status
    const override = thresholds.stand_overrides['Overall']
    const amberThreshold = override?.amber ?? thresholds.default_amber_threshold
    const redThreshold = override?.red ?? thresholds.default_red_threshold
    const greenThreshold = thresholds.default_green_threshold

    if (totals.percent >= redThreshold) return 'alert'
    if (totals.percent >= amberThreshold) return 'busy'
    if (totals.percent >= greenThreshold) return 'busy'
    return 'normal'
  }, [data, totals.percent, thresholds])

  const handleExportReport = async () => {
    try {
      const response = await fetch('/api/football/export/stand?company_id=550e8400-e29b-41d4-a716-446655440000&event_id=550e8400-e29b-41d4-a716-446655440001')
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
  }

  const settingsItems: QuickSettingItem[] = [
    {
      type: 'checkbox',
      label: 'Auto-Refresh',
      checked: autoRefresh,
      onCheckedChange: setAutoRefresh,
      icon: <RefreshCw className="h-4 w-4" />
    },
    {
      type: 'separator'
    },
    {
      type: 'action',
      label: 'Export Occupancy Report',
      action: handleExportReport,
      icon: <Download className="h-4 w-4" />
    }
  ]

  return (
    <div className={`h-full card-depth p-4 space-y-2 relative overflow-hidden flex flex-col ${className || ''}`}>
      {/* Status indicator dot */}
      {data && <StatusDot status={statusType} />}
      
      {/* Quick Settings Dropdown */}
      {onOpenModal && (
        <div className="absolute top-3 right-3 z-50">
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              console.log('Settings button clicked directly')
              onOpenModal()
            }}
            className="h-7 w-7 opacity-60 hover:opacity-100 transition-opacity flex items-center justify-center"
            title="Quick Settings"
          >
            <Settings className="h-4 w-4" />
          </button>
        </div>
      )}

      <div className="flex items-start justify-between pr-10">
        <h3 className="text-gray-800 font-semibold text-lg">
          Stand Occupancy
        </h3>
        {data && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div>
                  <StatusIndicator status={statusType} showIcon={false} className="text-xs" />
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <div className="text-xs space-y-1">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded"></div>
                    <span>Normal (&lt;85%)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-amber-500 rounded"></div>
                    <span>Busy (85-95%)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-red-500 rounded"></div>
                    <span>Full (&gt;95%)</span>
                  </div>
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>

      {!data ? (
        <div className="text-xs text-gray-500">Loading…</div>
      ) : (
        <div className="flex-1 overflow-hidden flex flex-col min-h-0">
          <div className="text-xs text-gray-600 mb-2">
            Overall: <span className="font-semibold text-gray-900">{totals.current.toLocaleString()} / {totals.capacity.toLocaleString()} ({totals.percent.toFixed(1)}%)</span>
          </div>
              <div className="space-y-1.5 overflow-y-auto flex-1 pr-1">
                {Object.entries(data.occupancy).map(([name, val]) => {
                  const percent = val.capacity ? Math.min(100, (val.current / val.capacity) * 100) : 0
                  const colour = getColorForStand(name, percent)
                  const truncatedName = name.length > 12 ? name.substring(0, 10) + '…' : name
                  return (
                    <div key={name} className="flex justify-between items-center text-sm">
                      <span className="text-gray-700 flex-1 min-w-0 truncate">{truncatedName}</span>
                      <div className="flex items-center gap-2 flex-1 max-w-32 mx-2">
                        <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden flex-1">
                          <div
                            className={`h-2 ${colour} rounded-full transition-all duration-700`}
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                        <span className="font-medium text-gray-900 text-xs min-w-[35px] text-right">{percent.toFixed(0)}%</span>
                      </div>
                    </div>
                  )
                })}
              </div>
        </div>
      )}
    </div>
  )
}


