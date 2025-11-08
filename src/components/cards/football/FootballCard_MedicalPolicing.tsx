'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FootballData } from '@/types/football'
import { RefreshCw, Download, Settings } from 'lucide-react'
import QuickSettingsDropdown, { QuickSettingItem } from '@/components/football/QuickSettingsDropdown'
import StatusIndicator, { StatusDot, StatusType } from '@/components/football/StatusIndicator'

interface FootballCard_MedicalPolicingProps {
  className?: string
  onOpenModal?: () => void
}

export default function FootballCard_MedicalPolicing({ className, onOpenModal }: FootballCard_MedicalPolicingProps) {
  const [data, setData] = useState<FootballData | null>(null)
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [staffingData, setStaffingData] = useState<any>(null)

  useEffect(() => {
    let mounted = true
    const load = async () => {
      try {
        const res = await fetch('/api/football/data')
        if (!res.ok) {
          console.error('Failed to load football data:', res.status, res.statusText)
          return
        }
        const json = await res.json()
        if (mounted) setData(json.data)
      } catch (error) {
        console.error('Error loading football data:', error)
        // Set fallback data to prevent component crash
        if (mounted) {
          setData({
            fixture: '',
            matchDate: '',
            liveScore: {
              home: 0,
              away: 0,
              time: '0:00',
              phase: 'Pre-Match',
              cards: { yellow: 0, red: 0 },
              subs: 0,
              homeTeam: '',
              awayTeam: '',
              competition: '',
            },
            occupancy: {},
            gateStatus: {
              openTime: '',
              totalTurnstiles: 0,
              activeTurnstiles: 0,
              entryRate: 0,
              queueAlerts: [],
              predictedFullEntry: '',
            },
            medicalPolicing: {
              medicalTeams: 0,
              policeDeployed: 0,
              stewards: 0,
            },
            transportWeather: {
              transport: {
                rail: 'Normal service',
                buses: 'Normal service',
                taxi: 'Operating normally',
                roadClosures: [],
              },
              weather: {
                temp: 0,
                wind: 'Calm',
                condition: 'Clear',
                risk: 'Low',
              },
            },
          })
        }
      }
    }
    load()
    
    // Load staffing data for planned numbers
    const loadStaffing = async () => {
      try {
        const res = await fetch('/api/football/staffing?company_id=550e8400-e29b-41d4-a716-446655440000&event_id=550e8400-e29b-41d4-a716-446655440001')
        if (res.ok && mounted) {
          const json = await res.json()
          setStaffingData(json)
        }
      } catch (error) {
        console.error('Failed to load staffing data:', error)
      }
    }
    loadStaffing()

    if (autoRefresh) {
      const id = setInterval(() => {
        load()
        loadStaffing()
      }, 30000)
      return () => { mounted = false; clearInterval(id) }
    }
    return () => { mounted = false }
  }, [autoRefresh])

  const totalDeployed = useMemo(() => {
    if (!data) return 0
    return (data.medicalPolicing.medicalTeams || 0) + 
           (data.medicalPolicing.policeDeployed || 0) + 
           (data.medicalPolicing.stewards || 0)
  }, [data])

  const totalPlanned = useMemo(() => {
    if (!staffingData?.roles) return 0
    return staffingData.roles.reduce((sum: number, role: any) => sum + (role.planned || 0), 0)
  }, [staffingData])

  const statusType = useMemo((): StatusType => {
    if (!data || !staffingData?.roles || totalPlanned === 0) return 'normal'
    const percentOfPlanned = (totalDeployed / totalPlanned) * 100
    // 90% threshold - below is alert, 90-100% is busy, 100%+ is normal
    if (percentOfPlanned < 90) return 'alert'
    if (percentOfPlanned < 100) return 'busy'
    return 'normal'
  }, [data, staffingData, totalDeployed, totalPlanned])

  const handleExportReport = async () => {
    try {
      const response = await fetch('/api/football/export/staffing?company_id=550e8400-e29b-41d4-a716-446655440000&event_id=550e8400-e29b-41d4-a716-446655440001')
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `staffing-report-${new Date().toISOString()}.csv`
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
      label: 'Export Staffing Report',
      action: handleExportReport,
      icon: <Download className="h-4 w-4" />
    }
  ]

  return (
    <div className={`h-full card-depth p-4 space-y-2 relative overflow-hidden flex flex-col ${className || ''}`}>
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
          Staffing Levels
        </h3>
        {data && staffingData && (
          <StatusIndicator 
            status={statusType} 
            message={statusType === 'alert' ? 'Below Target' : statusType === 'busy' ? 'Near Target' : 'At Target'}
            showIcon={false}
            className="text-xs"
          />
        )}
      </div>

      {!data ? (
        <div className="text-xs text-gray-500">Loading…</div>
      ) : (
        <div className="flex-1 flex flex-col min-h-0">
          <div className="text-sm text-gray-600 mb-2 flex-shrink-0">
            Total Deployed: <span className="font-semibold text-gray-900">{totalDeployed}</span>
            {staffingData && totalPlanned > 0 && (
              <span className="text-xs text-gray-500 ml-2">
                ({((totalDeployed / totalPlanned) * 100).toFixed(0)}% of planned)
              </span>
            )}
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm flex-shrink-0">
            <span className="text-gray-700">Police</span>
            <span className="font-medium text-gray-900 text-right">{data.medicalPolicing.policeDeployed}</span>
            <span className="text-gray-700">Stewards</span>
            <span className="font-medium text-gray-900 text-right">{data.medicalPolicing.stewards}</span>
            <span className="text-gray-700">Med Teams</span>
            <span className="font-medium text-gray-900 text-right">{data.medicalPolicing.medicalTeams}</span>
          </div>
        </div>
      )}
    </div>
  )
}


