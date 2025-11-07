'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { Settings } from 'lucide-react'
import StatusIndicator, { StatusDot, StatusType } from '@/components/football/StatusIndicator'

interface FootballCard_GateStatusProps {
  className?: string
  onOpenModal?: () => void
}

interface GateData {
  gates: Array<{
    id: string
    name: string
    status: 'active' | 'delayed' | 'closed'
    entryRate: number
    threshold: number
    currentEntryRate?: number
  }>
  summary: {
    totalGates: number
    activeGates: number
    totalEntryRate: number
    averageEntryRate: number
    queueAlerts: string[]
  }
}

export default function FootballCard_GateStatus({ className, onOpenModal }: FootballCard_GateStatusProps) {
  const [gateData, setGateData] = useState<GateData | null>(null)
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [loading, setLoading] = useState(true)

  const load = async () => {
    try {
      const res = await fetch('/api/football/crowd?company_id=550e8400-e29b-41d4-a716-446655440000&event_id=550e8400-e29b-41d4-a716-446655440001')
      if (!res.ok) {
        setLoading(false)
        return
      }
    const json = await res.json()
      setGateData(json)
    } catch (error) {
      console.error('Failed to load gate data:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let mounted = true
    const wrapped = async () => { if (mounted) await load() }
    wrapped()
    if (autoRefresh) {
    const id = setInterval(wrapped, 30000)
    return () => { mounted = false; clearInterval(id) }
    }
    return () => { mounted = false }
  }, [autoRefresh])

  const statusType = useMemo((): StatusType => {
    if (!gateData?.summary) return 'normal'
    // Alert if queue alerts exist, busy if high activity, normal otherwise
    if (gateData.summary.queueAlerts && gateData.summary.queueAlerts.length > 0) return 'alert'
    const utilization = gateData.summary.totalGates > 0 
      ? (gateData.summary.activeGates / gateData.summary.totalGates) * 100
      : 0
    if (utilization >= 90) return 'busy'
    return 'normal'
  }, [gateData])

  const handleExportReport = async () => {
    try {
      const response = await fetch('/api/football/export/crowd?company_id=550e8400-e29b-41d4-a716-446655440000&event_id=550e8400-e29b-41d4-a716-446655440001')
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `gate-status-report-${new Date().toISOString()}.csv`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      }
    } catch (error) {
      console.error('Failed to export report:', error)
    }
  }

  return (
    <div className={`h-full card-depth p-4 space-y-1.5 relative overflow-hidden flex flex-col ${className || ''}`}>
      {/* Status indicator dot */}
      {gateData && <StatusDot status={statusType} />}
      
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
          Crowd & Gates
        </h3>
        {gateData?.summary && (
          <StatusIndicator 
            status={statusType} 
            message={statusType === 'alert' ? `${gateData.summary.queueAlerts?.length || 0} Alert(s)` : statusType === 'busy' ? 'High Activity' : 'Normal'}
            showIcon={false}
            className="text-xs"
          />
        )}
      </div>

      {loading ? (
          <div className="text-xs text-gray-500">Loading…</div>
      ) : !gateData?.summary ? (
        <div className="text-xs text-gray-500">No gate data configured</div>
      ) : (
        <div className="flex-1 overflow-hidden flex flex-col min-h-0">
          {/* Gate status summary badges */}
          <div className="flex gap-2 mb-1.5 flex-shrink-0">
            <div className="text-xs px-2 py-1 rounded bg-green-100 text-green-800 border border-green-200">
              Active: {gateData.summary.activeGates}
            </div>
            {gateData.summary.queueAlerts && gateData.summary.queueAlerts.length > 0 && (
              <div className="text-xs px-2 py-1 rounded bg-red-100 text-red-800 border border-red-200">
                Alerts: {gateData.summary.queueAlerts.length}
              </div>
            )}
          </div>

          <div className="space-y-1 text-sm text-gray-700 flex-shrink-0">
            <p>
              Gates Active: <strong className="text-gray-900">{gateData.summary.activeGates} / {gateData.summary.totalGates}</strong>
            </p>
            <p>
              Entry Rate: <strong className="text-gray-900">{Math.round(gateData.summary.averageEntryRate || 0).toLocaleString()}/hr</strong>
            </p>
            {gateData.summary.totalEntryRate > 0 && (
              <p>
                Total Rate: <strong className="text-gray-900">{Math.round(gateData.summary.totalEntryRate).toLocaleString()}/hr</strong>
              </p>
            )}
          </div>
          
          {gateData.summary.queueAlerts && gateData.summary.queueAlerts.length > 0 && (
            <div className="mt-1.5 flex-shrink-0">
              <p className="text-xs text-red-600 font-semibold truncate">
                Gate Alerts: {gateData.summary.queueAlerts.map((alert, idx) => (
                  <span key={idx}>
                    {alert}{idx < gateData.summary.queueAlerts.length - 1 ? ', ' : ''}
                  </span>
                ))}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}


