'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FootballData } from '@/types/football'
import { RefreshCw, Download, AlertTriangle, Settings } from 'lucide-react'
import QuickSettingsDropdown, { QuickSettingItem } from '@/components/football/QuickSettingsDropdown'
import StatusIndicator, { StatusDot, StatusType } from '@/components/football/StatusIndicator'

interface FootballCard_TransportProps {
  className?: string
  onOpenModal?: () => void
}

function parseTransportStatus(status: string): StatusType {
  const lower = status.toLowerCase()
  if (lower.includes('delay') || lower.includes('disruption') || lower.includes('closed') || lower.includes('cancelled')) {
    return 'alert'
  }
  if (lower.includes('busy') || lower.includes('wait') || lower.includes('capacity') || lower.includes('%')) {
    return 'busy'
  }
  return 'normal'
}

export default function FootballCard_Transport({ className = '', onOpenModal }: FootballCard_TransportProps) {
  const [data, setData] = useState<FootballData | null>(null)
  const [autoRefresh, setAutoRefresh] = useState(true)

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
      const id = setInterval(load, 60000)
      return () => { mounted = false; clearInterval(id) }
    }
    return () => { mounted = false }
  }, [autoRefresh])

  const statusType = useMemo((): StatusType => {
    if (!data) return 'normal'
    const transport = data.transportWeather.transport
    // Check if any transport has alerts
    const statuses = [transport.rail, transport.buses, transport.taxi]
    const hasAlert = statuses.some(s => parseTransportStatus(s) === 'alert')
    const hasBusy = statuses.some(s => parseTransportStatus(s) === 'busy')
    if (hasAlert || (transport.roadClosures && transport.roadClosures.length > 0)) return 'alert'
    if (hasBusy) return 'busy'
    return 'normal'
  }, [data])

  const handleExportReport = async () => {
    try {
      const response = await fetch('/api/football/export/transport?company_id=550e8400-e29b-41d4-a716-446655440000&event_id=550e8400-e29b-41d4-a716-446655440001')
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `transport-report-${new Date().toISOString()}.csv`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      }
    } catch (error) {
      console.error('Failed to export report:', error)
    }
  }

  const handleReportIssue = () => {
    onOpenModal?.()
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
      label: 'Report Transport Issue',
      action: handleReportIssue,
      icon: <AlertTriangle className="h-4 w-4" />
    },
    {
      type: 'action',
      label: 'Export Transport Report',
      action: handleExportReport,
      icon: <Download className="h-4 w-4" />
    }
  ]


  return (
    <div className={`h-full card-depth p-4 space-y-1.5 relative overflow-hidden flex flex-col ${className || ''}`}>
      {/* Status indicator dot */}
      {data && <StatusDot status={statusType} />}
      
          {/* Quick Settings Button */}
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
          Transport Status
        </h3>
        {data && (
          <StatusIndicator 
            status={statusType} 
            message={statusType === 'alert' ? 'Issues Reported' : statusType === 'busy' ? 'Delays' : 'Normal'}
            showIcon={false}
            className="text-xs"
          />
        )}
      </div>

      {!data ? (
        <div className="text-xs text-gray-500">Loading…</div>
      ) : (
        <ul className="text-sm space-y-1 flex-1 overflow-y-auto">
          <li className="text-gray-700 flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full flex-shrink-0 ${parseTransportStatus(data.transportWeather.transport.rail) === 'alert' ? 'bg-red-500' : parseTransportStatus(data.transportWeather.transport.rail) === 'busy' ? 'bg-amber-500' : 'bg-green-500'}`} />
            Rail: <strong className="text-gray-900">{data.transportWeather.transport.rail}</strong>
          </li>
          <li className="text-gray-700 flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full flex-shrink-0 ${parseTransportStatus(data.transportWeather.transport.buses) === 'alert' ? 'bg-red-500' : parseTransportStatus(data.transportWeather.transport.buses) === 'busy' ? 'bg-amber-500' : 'bg-green-500'}`} />
            Buses: <strong className="text-gray-900">{data.transportWeather.transport.buses}</strong>
          </li>
          <li className="text-gray-700 flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full flex-shrink-0 ${parseTransportStatus(data.transportWeather.transport.taxi) === 'alert' ? 'bg-red-500' : parseTransportStatus(data.transportWeather.transport.taxi) === 'busy' ? 'bg-amber-500' : 'bg-green-500'}`} />
            Taxi: <strong className="text-gray-900">{data.transportWeather.transport.taxi}</strong>
          </li>
          {data.transportWeather.transport.roadClosures && data.transportWeather.transport.roadClosures.length > 0 && (
            <li className="text-gray-700 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full flex-shrink-0 bg-red-500" />
              Closures: <strong className="text-gray-900 truncate">{data.transportWeather.transport.roadClosures.join(', ')}</strong>
            </li>
          )}
        </ul>
      )}
    </div>
  )
}


