'use client'

import React, { useEffect, useMemo, useState, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FootballData, FootballPhase } from '@/types/football'
import { RefreshCw, Download, Settings } from 'lucide-react'
import QuickSettingsDropdown, { QuickSettingItem } from '@/components/football/QuickSettingsDropdown'
import StatusIndicator, { StatusDot, StatusType } from '@/components/football/StatusIndicator'
import { useMatchTimer } from '@/hooks/useMatchTimer'
import { useEventContext } from '@/contexts/EventContext'
import { supabase } from '@/lib/supabase'
import { syncMatchFlowToStore, getEventMetadata } from '@/lib/football/matchFlowSync'
import { motion } from 'framer-motion'

interface FootballCard_LiveScoreProps {
  className?: string
  onOpenModal?: () => void
}

export default function FootballCard_LiveScore({ className, onOpenModal }: FootballCard_LiveScoreProps) {
  const { eventId, eventData } = useEventContext()
  const [data, setData] = useState<FootballData | null>(null)
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [fixtureChecklist, setFixtureChecklist] = useState<any>(null)
  const [previousScore, setPreviousScore] = useState<{ home: number; away: number } | null>(null)
  const [scoreChanged, setScoreChanged] = useState(false)
  const subscriptionRef = useRef<any>(null)
  
  // Use match timer hook for live timer calculation
  const matchTimer = useMatchTimer({
    eventId: eventId || '',
    refreshInterval: 1000,
    enabled: !!eventId && autoRefresh,
  })

  const matchDuration = 90
  
  // Calculate minutes from timer display (handles extra time format like "45+1", "90+2")
  const minutesFromTime = useMemo(() => {
    if (matchTimer.displayTime) {
      // Handle extra time format (e.g., "45+1" -> 46)
      const match = matchTimer.displayTime.match(/^(\d+)\+(\d+)$/)
      if (match) {
        return parseInt(match[1]) + parseInt(match[2])
      }
      return parseInt(matchTimer.displayTime) || 0
    }
    // Fallback to data time if timer not available
    const t = data?.liveScore.time || '0:00'
    const [mm, ss] = t.split(':').map(Number)
    return (mm || 0) + (ss ? ss / 60 : 0)
  }, [matchTimer.displayTime, data?.liveScore.time])

  const load = async () => {
    try {
      // Only load if we don't have eventId (fallback for non-football events)
      // For football events, syncMatchFlow() handles the data loading
      if (!eventId) {
        const res = await fetch('/api/football/data')
        if (!res.ok) {
          console.error('Failed to load football data:', res.status)
          return
        }
        const json = await res.json()
        // Only update if we have valid data and scores
        if (json.data && json.data.liveScore) {
          setData(json.data)
        }
      }
    } catch (error) {
      console.error('Error loading football data:', error)
    }
  }

  // Sync match flow data from database
  const syncMatchFlow = async () => {
    if (!eventId) return

    try {
      const metadata = await getEventMetadata(eventId)
      const syncedData = await syncMatchFlowToStore(
        eventId,
        metadata?.homeTeam,
        metadata?.awayTeam,
        metadata?.competition
      )

      // Always update data with synced scores
      if (syncedData) {
        // Check for score changes
        const currentScore = {
          home: syncedData.liveScore.home ?? 0,
          away: syncedData.liveScore.away ?? 0,
        }

        // Only update if score actually changed or if we don't have previous score
        if (!previousScore || 
            currentScore.home !== previousScore.home ||
            currentScore.away !== previousScore.away) {
          
          if (previousScore && (
            currentScore.home !== previousScore.home ||
            currentScore.away !== previousScore.away
          )) {
            setScoreChanged(true)
            setTimeout(() => setScoreChanged(false), 2000) // Reset after animation
          }

          setPreviousScore(currentScore)
          setData(syncedData)
          console.log('[FootballCard] Updated score from sync:', currentScore)
        }
      } else {
        // If sync fails, don't reset to 0-0 - keep current data
        console.warn('[FootballCard] Sync returned null, keeping current data')
      }
    } catch (error) {
      console.error('Error syncing match flow:', error)
      // Don't reset scores on error - keep current data
    }
  }

  useEffect(() => {
    let mounted = true
    const wrapped = async () => { 
      if (mounted) {
        // For football events, sync from database (this handles all data loading)
        // For non-football events, use the API endpoint
        if (eventId) {
          await syncMatchFlow()
        } else {
          await load()
        }
      }
    }
    wrapped()
    
    // Load fixture checklist for next checkpoint
    const loadChecklist = async () => {
      try {
        const res = await fetch('/api/football/fixture?company_id=550e8400-e29b-41d4-a716-446655440000&event_id=550e8400-e29b-41d4-a716-446655440001')
        if (res.ok && mounted) {
          const json = await res.json()
          setFixtureChecklist(json)
        }
      } catch (error) {
        console.error('Failed to load fixture checklist:', error)
      }
    }
    loadChecklist()

    // Set up real-time subscription for match flow logs
    if (eventId) {
      // Debounce sync calls to prevent rapid updates
      let syncTimeout: NodeJS.Timeout | null = null
      
      subscriptionRef.current = supabase
        .channel(`match_flow_${eventId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'incident_logs',
            filter: `event_id=eq.${eventId} AND type=eq.match_log`,
          },
          () => {
            // Debounce sync calls - wait 500ms before syncing to batch rapid updates
            if (syncTimeout) {
              clearTimeout(syncTimeout)
            }
            syncTimeout = setTimeout(() => {
              syncMatchFlow()
            }, 500)
          }
        )
        .subscribe()
    }

    if (autoRefresh) {
      const id = setInterval(() => {
        // Only sync, don't call load() to avoid conflicts
        if (eventId) {
          syncMatchFlow()
        } else {
          load()
        }
        loadChecklist()
      }, 30000)
      return () => { 
        mounted = false
        clearInterval(id)
        if (subscriptionRef.current) {
          subscriptionRef.current.unsubscribe()
        }
      }
    }
    
    return () => { 
      mounted = false
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe()
      }
    }
  }, [autoRefresh, eventId])

  const circumference = 2 * Math.PI * 45
  const progress = Math.min(minutesFromTime / matchDuration, 1)

  // Use match timer phase if available, otherwise fallback to data phase
  const currentPhase = matchTimer.phase !== 'Pre-Match' ? matchTimer.phase : (data?.liveScore.phase || 'Pre-Match')
  const isLive = matchTimer.isRunning && (currentPhase === 'First Half' || currentPhase === 'Second Half')

  const statusType = useMemo((): StatusType => {
    if (!fixtureChecklist?.tasks) return 'normal'
    const completedCount = fixtureChecklist.tasks.filter((t: any) => t.completed).length
    const totalCount = fixtureChecklist.tasks.length
    const percentComplete = totalCount > 0 ? (completedCount / totalCount) * 100 : 0
    // Alert if less than 50% complete, busy if 50-80%, normal if 80%+
    if (percentComplete < 50) return 'alert'
    if (percentComplete < 80) return 'busy'
    return 'normal'
  }, [fixtureChecklist])

  const taskPhases = useMemo(() => {
    if (!fixtureChecklist?.tasks) {
      return {
        preMatch: { completed: 0, total: 0, pending: [] },
        duringMatch: { completed: 0, total: 0, pending: [] },
        postMatch: { completed: 0, total: 0, pending: [] }
      }
    }
    
    const tasks = fixtureChecklist.tasks
    const preMatch = tasks.filter((t: any) => t.minute < 0)
    const duringMatch = tasks.filter((t: any) => t.minute >= 0 && t.minute <= 90)
    const postMatch = tasks.filter((t: any) => t.minute > 90)
    
    return {
      preMatch: {
        completed: preMatch.filter((t: any) => t.completed).length,
        total: preMatch.length,
        pending: preMatch.filter((t: any) => !t.completed).slice(0, 2)
      },
      duringMatch: {
        completed: duringMatch.filter((t: any) => t.completed).length,
        total: duringMatch.length,
        pending: duringMatch.filter((t: any) => !t.completed && t.minute >= minutesFromTime).slice(0, 2)
      },
      postMatch: {
        completed: postMatch.filter((t: any) => t.completed).length,
        total: postMatch.length,
        pending: postMatch.filter((t: any) => !t.completed).slice(0, 2)
      }
    }
  }, [fixtureChecklist, minutesFromTime])

  const handleExportReport = async () => {
    try {
      const response = await fetch('/api/football/export/fixture?company_id=550e8400-e29b-41d4-a716-446655440000&event_id=550e8400-e29b-41d4-a716-446655440001')
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `match-report-${new Date().toISOString()}.csv`
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
      label: 'Export Match Report',
      action: handleExportReport,
      icon: <Download className="h-4 w-4" />
    }
  ]

  return (
    <div className={`relative w-full h-full overflow-hidden card-depth bg-gradient-to-br from-green-700/90 to-green-900/90 text-white flex items-center justify-center ${className || ''}`}>
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
                className="h-7 w-7 opacity-60 hover:opacity-100 transition-opacity flex items-center justify-center text-white hover:text-white"
                title="Quick Settings"
        >
          <Settings className="h-4 w-4" />
              </button>
            </div>
      )}
      {/* Perfectly centred pitch SVG */}
      <svg viewBox="0 0 120 72" className="absolute opacity-25" style={{ 
        top: '50%', 
        left: '50%', 
        transform: 'translate(-50%, -50%)',
        width: '100%',
        height: '100%'
      }} preserveAspectRatio="xMidYMid meet">
        <rect width="120" height="72" fill="none" stroke="white" strokeWidth="0.5" />
        <line x1="60" y1="0" x2="60" y2="72" stroke="white" strokeWidth="0.5" />
        <circle cx="60" cy="36" r="6" stroke="white" fill="none" strokeWidth="0.5" />
        <rect x="0" y="24" width="6" height="24" stroke="white" fill="none" strokeWidth="0.5" />
        <rect x="114" y="24" width="6" height="24" stroke="white" fill="none" strokeWidth="0.5" />
      </svg>

      {/* Overlay content */}
      <div className="relative z-10 flex flex-col items-center justify-center text-center w-full px-4">
        {/* Header - Left aligned at top */}
        <div className="absolute top-3 left-4 text-left flex items-center gap-2">
          <div className="text-xs text-gray-200">{data?.liveScore.competition || 'Match'}</div>
          {isLive && (
            <span className="inline-flex items-center gap-1">
              <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" title="Live Match"></span>
              <span className="text-[10px] text-red-200">LIVE</span>
            </span>
          )}
        </div>

        {!data ? (
          <div className="text-xs text-gray-200">Loading…</div>
        ) : (
          <>
            <h3 className="text-white font-semibold text-base mt-8">{data.liveScore.homeTeam} v {data.liveScore.awayTeam}</h3>

            {/* Progress Ring directly aligned with centre circle */}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
              <div className="relative w-20 h-20">
                <svg viewBox="0 0 100 100" className="w-full h-full rotate-[-90deg]">
                  <circle
                    cx="50"
                    cy="50"
                    r="45"
                    stroke="rgba(255,255,255,0.1)"
                    strokeWidth="6"
                    fill="none"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="45"
                    stroke="#38bdf8"
                    strokeWidth="6"
                    fill="none"
                    strokeDasharray={`${2 * Math.PI * 45}`}
                    strokeDashoffset={`${2 * Math.PI * 45 * (1 - progress)}`}
                    strokeLinecap="round"
                    className="transition-all duration-1000 ease-linear"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-white text-sm font-mono">
                  <span>{matchTimer.displayTime || Math.floor(minutesFromTime)}&apos;</span>
                </div>
              </div>
            </div>

            {/* Score & phase */}
            <div className="mt-24">
              <motion.p 
                className="text-3xl font-bold"
                animate={scoreChanged ? { scale: [1, 1.1, 1] } : {}}
                transition={{ duration: 0.5 }}
              >
                {data.liveScore.home ?? 0} – {data.liveScore.away ?? 0}
              </motion.p>
              <p className="text-xs text-gray-200">{currentPhase}</p>
            </div>
          </>
        )}
      </div>
    </div>
  )
}


