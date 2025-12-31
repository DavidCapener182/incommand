'use client'

import React, { useEffect, useMemo, useState, useRef, useCallback } from 'react'
import { Settings, MapPin, Users } from 'lucide-react'
import StatusIndicator, { StatusDot, StatusType } from '@/components/football/StatusIndicator'
import { useMatchTimer } from '@/hooks/useMatchTimer'
import { useEventContext } from '@/contexts/EventContext'
import { useCompanyEventContext } from '@/hooks/useCompanyEventContext'
import { supabase } from '@/lib/supabase'
import { syncMatchFlowToStore, getEventMetadata } from '@/lib/football/matchFlowSync'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface FootballCard_LiveScoreProps {
  className?: string
  onOpenModal?: () => void
}

export default function FootballCard_LiveScore({ className, onOpenModal }: FootballCard_LiveScoreProps) {
  const { eventId, eventData } = useEventContext()
  const { context } = useCompanyEventContext(eventId)
  const [data, setData] = useState<any>(null)
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [previousScore, setPreviousScore] = useState<{ home: number; away: number } | null>(null)
  const [scoreChanged, setScoreChanged] = useState(false)
  const [attendance, setAttendance] = useState<number | null>(null)
  const subscriptionRef = useRef<any>(null)
  
  // Match Timer Logic (Preserved)
  const matchTimer = useMatchTimer({
    eventId: eventId || '',
    refreshInterval: 1000,
    enabled: !!eventId && autoRefresh,
  })

  const matchDuration = 90
  
  const minutesFromTime = useMemo(() => {
    if (matchTimer.displayTime) {
      const match = matchTimer.displayTime.match(/^(\d+)\+(\d+)$/)
      if (match) return parseInt(match[1]) + parseInt(match[2])
      return parseInt(matchTimer.displayTime) || 0
    }
    return 0
  }, [matchTimer.displayTime])

  const load = useCallback(async () => {
    if (!eventId) {
      try {
         const res = await fetch('/api/football/data')
         if (res.ok) {
           const json = await res.json()
           if (json.data?.liveScore) setData(json.data)
         }
      } catch (e) {}
    }
  }, [eventId])

  const syncMatchFlow = useCallback(async () => {
    if (!eventId) return
    try {
      const metadata = await getEventMetadata(eventId)
      const syncedData = await syncMatchFlowToStore(eventId, metadata?.homeTeam, metadata?.awayTeam, metadata?.competition)

      if (syncedData) {
        const currentScore = { home: syncedData.liveScore.home ?? 0, away: syncedData.liveScore.away ?? 0 }
        if (!previousScore || currentScore.home !== previousScore.home || currentScore.away !== previousScore.away) {
          if (previousScore) {
            setScoreChanged(true)
            setTimeout(() => setScoreChanged(false), 2000)
          }
          setPreviousScore(currentScore)
          setData(syncedData)
        }
      }
    } catch (e) {}
  }, [eventId, previousScore])

  // Fetch attendance from both attendance_records and stand occupancy, use the latest
  const fetchAttendance = useCallback(async () => {
    if (!eventId) return
    try {
      let attendanceFromRecords: { count: number; timestamp: string } | null = null
      let attendanceFromStands: { count: number; timestamp: string } | null = null

      // Fetch from attendance_records table
      try {
        const { data: recordsData, error: recordsError } = await (supabase as any)
          .from('attendance_records')
          .select('count, timestamp')
          .eq('event_id', eventId)
          .order('timestamp', { ascending: false })
          .limit(1)
          .maybeSingle()

        const recordsDataTyped = recordsData as any;
        if (!recordsError && recordsDataTyped) {
          attendanceFromRecords = {
            count: recordsDataTyped.count,
            timestamp: recordsDataTyped.timestamp
          }
        }
      } catch (e) {
        console.warn('Failed to fetch attendance from records:', e)
      }

      // Fetch from stand occupancy
      if (context) {
        try {
          const res = await fetch(`/api/football/stands?company_id=${context.companyId}&event_id=${context.eventId}`)
          if (res.ok) {
            const payload = await res.json()
            if (payload.standsSetup?.stands) {
              const totalAttendance = payload.standsSetup.stands.reduce(
                (sum: number, stand: any) => sum + (stand.current || 0),
                0
              )
              if (totalAttendance > 0) {
                attendanceFromStands = {
                  count: totalAttendance,
                  timestamp: new Date().toISOString() // Stand occupancy is current time
                }
              }
            }
          }
        } catch (e) {
          console.warn('Failed to fetch attendance from stands:', e)
        }
      }

      // Use whichever is latest
      if (attendanceFromRecords && attendanceFromStands) {
        const recordsTime = new Date(attendanceFromRecords.timestamp).getTime()
        const standsTime = new Date(attendanceFromStands.timestamp).getTime()
        if (standsTime > recordsTime) {
          setAttendance(attendanceFromStands.count)
        } else {
          setAttendance(attendanceFromRecords.count)
        }
      } else if (attendanceFromRecords) {
        setAttendance(attendanceFromRecords.count)
      } else if (attendanceFromStands) {
        setAttendance(attendanceFromStands.count)
      } else {
        setAttendance(null)
      }
    } catch (e) {
      console.error('Failed to fetch attendance:', e)
      setAttendance(null)
    }
  }, [eventId, context])

  useEffect(() => {
    fetchAttendance()
    if (autoRefresh) {
      const id = setInterval(fetchAttendance, 30000)
      return () => clearInterval(id)
    }
  }, [fetchAttendance, autoRefresh])

  // Subscribe to attendance_records changes for real-time updates
  useEffect(() => {
    if (!eventId) return

    const attendanceChannel = supabase
      .channel(`attendance_${eventId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'attendance_records',
          filter: `event_id=eq.${eventId}`,
        },
        () => {
          // Refresh attendance when records change
          fetchAttendance()
        }
      )
      .subscribe()

    return () => {
      attendanceChannel.unsubscribe()
    }
  }, [eventId, fetchAttendance])

  useEffect(() => {
    let mounted = true
    const init = async () => { if (mounted) eventId ? await syncMatchFlow() : await load() }
    init()

    if (eventId) {
      subscriptionRef.current = supabase
        .channel(`match_flow_${eventId}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'incident_logs', filter: `event_id=eq.${eventId} AND type=eq.match_log`, }, () => {
           setTimeout(syncMatchFlow, 500)
        })
        .subscribe()
    }

    if (autoRefresh) {
      const id = setInterval(() => eventId ? syncMatchFlow() : load(), 30000)
      return () => { mounted = false; clearInterval(id); subscriptionRef.current?.unsubscribe() }
    }
    return () => { mounted = false; subscriptionRef.current?.unsubscribe() }
  }, [autoRefresh, eventId, load, syncMatchFlow])

  const progress = Math.min(minutesFromTime / matchDuration, 1)
  const currentPhase = matchTimer.phase !== 'Pre-Match' ? matchTimer.phase : (data?.liveScore.phase || 'Pre-Match')
  const isLive = matchTimer.isRunning && (currentPhase === 'First Half' || currentPhase === 'Second Half')
  const getInitials = (name: string) => name ? name.substring(0, 3).toUpperCase() : 'HOM'

  return (
    <div className={`relative w-full h-full overflow-hidden rounded-2xl shadow-sm border border-green-900/30 bg-[#1a3c27] text-white ${className || ''}`}>
      
      {/* 1. PITCH BACKGROUND (Centered Perfectly) */}
      <div className="absolute inset-0 flex items-center justify-center opacity-40 pointer-events-none">
         <svg width="100%" height="100%" viewBox="0 0 120 80" preserveAspectRatio="xMidYMid meet">
            <rect x="0" y="0" width="120" height="80" fill="none" /> 
            <g stroke="white" strokeWidth="0.6" fill="none" opacity="0.7">
               <rect x="5" y="5" width="110" height="70" />
               <line x1="60" y1="5" x2="60" y2="75" />
               <circle cx="60" cy="40" r="9" />
               <circle cx="60" cy="40" r="0.6" fill="white" />
               <rect x="5" y="20" width="16" height="40" />
               <rect x="5" y="30" width="6" height="20" />
               <rect x="99" y="20" width="16" height="40" />
               <rect x="109" y="30" width="6" height="20" />
               <path d="M10,5 A5,5 0 0 0 5,10" />
               <path d="M110,5 A5,5 0 0 1 115,10" />
               <path d="M5,70 A5,5 0 0 0 10,75" />
               <path d="M115,70 A5,5 0 0 1 110,75" />
            </g>
         </svg>
      </div>

      {/* 2. FOREGROUND CONTENT */}
      <div className="relative z-10 h-full flex flex-col justify-between p-4">
         
         {/* TOP BAR */}
         <div className="flex justify-between items-start">
            <div className="flex items-center gap-2 bg-black/30 px-2 py-1 rounded backdrop-blur-md border border-white/5">
               <div className="h-3 w-3 text-yellow-400">
                  <svg viewBox="0 0 24 24" fill="currentColor"><path d="M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2m14 2H5v14h14V5M7 7h2v2H7V7m4 0h2v2h-2V7m4 0h2v2h-2V7M7 11h2v2H7v-2m4 0h2v2h-2v-2m4 0h2v2h-2v-2M7 15h2v2H7v-2m4 0h2v2h-2v-2m4 0h2v2h-2v-2"/></svg>
               </div>
               <span className="text-[10px] font-bold uppercase tracking-wider text-green-100/90">
                 {data?.liveScore.competition || 'Premier League'}
               </span>
            </div>
            
            {/* Status Badge */}
            {isLive ? (
               <div className="flex items-center gap-1.5 bg-green-900/80 border border-green-500/30 px-2 py-1 rounded text-[10px] font-bold text-green-400">
                 <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                 {currentPhase}
               </div>
            ) : (
               <div className="bg-black/30 border border-white/10 px-2 py-1 rounded text-[10px] font-medium text-slate-300">
                 {currentPhase}
               </div>
            )}
         </div>

         {/* CENTER: TEAMS & ABSOLUTE SCORE */}
         <div className="flex-1 relative w-full">
            
            {/* ABSOLUTE CENTER: Score & Timer */}
            {/* Pinned to the exact center of the card container */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 flex flex-col items-center justify-center">
               <div className="relative w-24 h-24 flex items-center justify-center">
                  {/* Ring */}
                  <svg className="absolute w-full h-full rotate-[-90deg]" viewBox="0 0 100 100">
                     <circle cx="50" cy="50" r="46" stroke="rgba(0,0,0,0.3)" strokeWidth="8" fill="rgba(0,0,0,0.4)" />
                     <circle cx="50" cy="50" r="46" stroke="rgba(255,255,255,0.1)" strokeWidth="2" fill="none" />
                     <circle
                        cx="50"
                        cy="50"
                        r="46"
                        stroke="#38bdf8"
                        strokeWidth="4"
                        fill="none"
                        strokeDasharray={`${2 * Math.PI * 46}`}
                        strokeDashoffset={`${2 * Math.PI * 46 * (1 - progress)}`}
                        strokeLinecap="round"
                        className="transition-all duration-1000 ease-linear drop-shadow-[0_0_4px_rgba(56,189,248,0.8)]"
                     />
                  </svg>
                  
                  {/* Score Text */}
                  <motion.div 
                     className="text-4xl font-black text-white drop-shadow-2xl z-10 tracking-tighter tabular-nums pb-1"
                     animate={scoreChanged ? { scale: [1, 1.2, 1] } : {}}
                     transition={{ duration: 0.4 }}
                  >
                     {data?.liveScore.home ?? 0}-{data?.liveScore.away ?? 0}
                  </motion.div>

                  {/* Time Badge (Overlapping Bottom) */}
                  <div className="absolute -bottom-2 px-2.5 py-0.5 bg-green-950/90 border border-green-500/30 rounded-full shadow-lg backdrop-blur-sm">
                     <span className="text-xs font-mono font-bold text-green-400">
                       {matchTimer.displayTime || `${Math.floor(minutesFromTime)}'`}
                     </span>
                  </div>
               </div>
            </div>

            {/* TEAMS: Positioned relative to sides */}
            <div className="absolute inset-0 flex items-center justify-between px-4">
               {/* Home */}
               <div className="flex flex-col items-center gap-2 text-center w-24">
                  <div className="w-12 h-12 rounded-full bg-red-700 ring-4 ring-black/20 flex items-center justify-center shadow-xl">
                     <span className="text-sm font-bold">{getInitials(data?.liveScore.homeTeam)}</span>
                  </div>
                  <span className="text-sm font-bold leading-tight drop-shadow-md line-clamp-2">
                    {data?.liveScore.homeTeam || 'Home'}
                  </span>
               </div>
               
               {/* Away */}
               <div className="flex flex-col items-center gap-2 text-center w-24">
                  <div className="w-12 h-12 rounded-full bg-blue-700 ring-4 ring-black/20 flex items-center justify-center shadow-xl">
                     <span className="text-sm font-bold">{getInitials(data?.liveScore.awayTeam)}</span>
                  </div>
                  <span className="text-sm font-bold leading-tight drop-shadow-md line-clamp-2">
                    {data?.liveScore.awayTeam || 'Away'}
                  </span>
               </div>
            </div>
         </div>

         {/* FOOTER: METRICS (2 Columns) */}
         <div className="grid grid-cols-2 gap-px bg-black/20 rounded-lg overflow-hidden border border-white/5 mt-2">
            <div className="bg-black/20 p-2 text-center">
               <p className="text-[9px] text-green-200/70 uppercase font-bold mb-0.5">Venue</p>
               <div className="flex items-center justify-center gap-1 text-xs font-semibold">
                  <MapPin className="h-3 w-3 text-green-400" />
                  <span className="truncate">Anfield</span>
               </div>
            </div>
            <div className="bg-black/20 p-2 text-center border-l border-white/5">
               <p className="text-[9px] text-green-200/70 uppercase font-bold mb-0.5">Attendance</p>
               <div className="flex items-center justify-center gap-1 text-xs font-semibold">
                  <Users className="h-3 w-3 text-green-400" />
                  <span>{attendance !== null ? attendance.toLocaleString() : '—'}</span>
               </div>
            </div>
         </div>

         {/* SETTINGS (Absolute) */}
         {onOpenModal && (
           <button
             onClick={(e) => { e.preventDefault(); onOpenModal(); }}
             className="absolute top-4 right-4 text-white/30 hover:text-white transition-colors"
           >
             <Settings className="h-4 w-4" />
           </button>
         )}

      </div>
    </div>
  )
}