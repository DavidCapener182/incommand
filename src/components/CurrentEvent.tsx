'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import EventCreationModal from './EventCreationModal'
import { useEventContext } from '@/contexts/EventContext'
import { 
  MapPin, 
  Calendar, 
  Sparkles, 
  MoreHorizontal, 
  AlertCircle,
  TrendingUp,
  Music // Added Music icon import
} from 'lucide-react'
import { cn } from '@/lib/utils'

// --- Types ---
interface Event {
  id: string
  event_name: string
  venue_name: string
  event_type: string
  event_description?: string
  support_acts?: any[]
  event_brief?: string
  event_date?: string
}

interface EventTiming {
  title: string
  time: string
}

interface CurrentEventProps {
  currentTime?: string
  currentEvent: Event | null
  loading: boolean
  error: string | null
  onEventCreated: () => void
  eventTimings: EventTiming[]
}

interface AIInsight {
  title: string
  content: string
}

// --- Helper Components ---
const CardFrame = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <div className={cn("group relative flex h-full flex-col justify-between overflow-hidden rounded-2xl border border-slate-200/90 bg-gradient-to-br from-white via-white to-slate-50/80 p-5 shadow-[0_16px_34px_-22px_rgba(15,23,42,0.45)] ring-1 ring-white/70 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_22px_42px_-24px_rgba(15,23,42,0.45)] dark:border-[#2d437a]/70 dark:bg-gradient-to-br dark:from-[#162346] dark:via-[#14203f] dark:to-[#0f1934] dark:ring-white/5", className)}>
    <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-blue-500/75 via-cyan-400/60 to-transparent" />
    {children}
  </div>
)

const CardHeader = ({ icon: Icon, title, action }: { icon: any; title: string; action?: () => void }) => (
  <div className="flex items-center justify-between mb-4">
    <div className="flex items-center gap-2.5">
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-100 to-cyan-100 text-blue-700 ring-1 ring-blue-200/70 dark:from-blue-500/25 dark:to-cyan-500/20 dark:text-blue-200 dark:ring-blue-400/35">
        <Icon className="h-4 w-4" />
      </div>
      <span className="text-sm font-semibold text-slate-700 dark:text-slate-100">{title}</span>
    </div>
    {action && (
      <button onClick={action} className="text-slate-400 transition-colors hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-200">
        <MoreHorizontal className="h-5 w-5" />
      </button>
    )}
  </div>
)

export default function CurrentEvent({
  currentEvent,
  loading,
  onEventCreated,
  eventTimings,
}: CurrentEventProps) {
  const [showModal, setShowModal] = useState(false)
  const [aiInsights, setAiInsights] = useState<AIInsight[]>([])
  const [currentInsightIndex, setCurrentInsightIndex] = useState(0)
  const [aiLoading, setAiLoading] = useState(true)
  const [aiError, setAiError] = useState<string | null>(null)
  const [autoAdvance, setAutoAdvance] = useState(true)
  const { eventType } = useEventContext()

  const currentEventId = currentEvent?.id

  // --- Logic: Check if Live ---
  const isEventLive = useCallback(() => {
    if (!eventTimings || eventTimings.length === 0) return false
    const now = new Date()
    const today = now.toDateString()
    
    const sortedTimings = [...eventTimings].sort((a, b) => {
      return new Date(`${today} ${a.time}`).getTime() - new Date(`${today} ${b.time}`).getTime()
    })

    if (sortedTimings.length === 0) return false
    const startTime = new Date(`${today} ${sortedTimings[0].time}`)
    const endTime = new Date(`${today} ${sortedTimings[sortedTimings.length - 1].time}`)
    
    return now >= startTime && now <= endTime
  }, [eventTimings])

  // --- Logic: Extract Title ---
  const extractTitleFromParagraph = (paragraph: string): string => {
    const headerMatch = paragraph.match(/^#{1,6}\s*(.+)$/m)
    if (headerMatch) return headerMatch[1].trim()

    const lower = paragraph.toLowerCase()
    if (lower.includes('attendance') || lower.includes('capacity')) return 'Attendance Analysis'
    if (lower.includes('security') || lower.includes('safety')) return 'Security Alert'
    if (lower.includes('urgent') || lower.includes('critical')) return 'Critical Update'
    if (lower.includes('weather')) return 'Weather Impact'
    if (lower.includes('crowd')) return 'Crowd Dynamics'
    return 'Event Summary'
  }

  // --- Logic: Fetch AI ---
  const fetchAiInsights = useCallback(async () => {
    try {
      setAiLoading(true)
      setAiError(null)
      if (!currentEventId) throw new Error('No event')

      const response = await fetch(`/api/notifications/ai-summary?eventId=${currentEventId}`)
      if (!response.ok) throw new Error('Failed to fetch')
      
      const data = await response.json()
      const summary = data.summary || ''
      
      const paragraphs = summary.split('\n\n').filter((p: string) => p.trim().length > 0)
      
      const insights = paragraphs.map((p: string) => ({
        title: extractTitleFromParagraph(p),
        content: p.replace(/[#*`_]/g, '').trim() // Simple cleanup
      }))

      setAiInsights(insights.length > 0 ? insights : [{ title: 'Status', content: 'No AI insights generated yet.' }])
    } catch (err) {
      console.error(err)
      setAiError('Unable to load AI insights')
    } finally {
      setAiLoading(false)
    }
  }, [currentEventId])

  useEffect(() => {
    if (currentEventId) {
      fetchAiInsights()
      const interval = setInterval(fetchAiInsights, 5 * 60 * 1000)
      return () => clearInterval(interval)
    }
  }, [currentEventId, fetchAiInsights])

  // --- Logic: Auto Advance ---
  useEffect(() => {
    if (aiInsights.length > 1 && autoAdvance) {
      const interval = setInterval(() => {
        setCurrentInsightIndex((prev) => (prev + 1) % aiInsights.length)
      }, 15000) // 15 seconds per slide
      return () => clearInterval(interval)
    }
  }, [aiInsights.length, autoAdvance])

  const handleManualChange = (index: number) => {
    setAutoAdvance(false)
    setCurrentInsightIndex(index)
    setTimeout(() => setAutoAdvance(true), 60000)
  }

  // --- Render: Loading State ---
  if (loading) {
    return (
      <CardFrame className="animate-pulse">
        <div className="h-8 w-32 bg-slate-100 rounded mb-4" />
        <div className="h-6 w-3/4 bg-slate-100 rounded mb-2" />
        <div className="h-4 w-1/2 bg-slate-100 rounded" />
      </CardFrame>
    )
  }

  // --- Render: No Event State ---
  if (!currentEvent) {
    return (
      <CardFrame className="border-dashed border-2 border-slate-300 bg-slate-50/50">
        <div className="flex flex-col items-center justify-center h-full text-center py-8">
          <div className="h-12 w-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mb-4">
            <Calendar className="h-6 w-6" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900">No Active Event</h3>
          <p className="text-sm text-slate-500 max-w-[200px] mt-2 mb-6">
            There is no event currently selected or live right now.
          </p>
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            Create Event
          </button>
        </div>
        <EventCreationModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          onEventCreated={() => {
            onEventCreated()
            setShowModal(false)
          }}
        />
      </CardFrame>
    )
  }

  // --- Render: Main Card ---
  const currentInsight = aiInsights[currentInsightIndex]

  return (
    <CardFrame>
      {/* Header Section */}
      <div>
        <CardHeader 
           icon={MapPin} 
           title="Venue Status" 
        />
        
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h3 className="text-2xl font-bold text-slate-900 tracking-tight">
              {currentEvent.venue_name}
            </h3>
            {isEventLive() && (
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 ring-2 ring-white"></span>
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-2 text-sm font-medium text-blue-600">
            <Calendar className="h-4 w-4" />
            <span>
              {eventType === 'football'
                ? currentEvent.event_name.replace(/\s*-\s*\d{2}\/\d{2}\/\d{4}$/, '')
                : currentEvent.event_name}
            </span>
          </div>

          {/* ------------------------------------------------------- */}
          {/*  SUPPORT ACTS SECTION (INSERTED HERE)                   */}
          {/* ------------------------------------------------------- */}
          {(() => {
             let hasActs = false;
             try {
               const acts = typeof currentEvent.support_acts === 'string' 
                 ? JSON.parse(currentEvent.support_acts) 
                 : currentEvent.support_acts;
               hasActs = Array.isArray(acts) && acts.length > 0;
             } catch { hasActs = false }

             if (!hasActs) return null;

             return (
               <div className="flex items-center gap-2 text-xs text-slate-400 pl-6 mt-1">
                  <Music className="h-3 w-3" />
                  <span className="truncate max-w-[250px]">
                    {typeof currentEvent.support_acts === 'string'
                      ? JSON.parse(currentEvent.support_acts).map((a: any) => a.act_name).join(', ')
                      : (currentEvent.support_acts as any[]).map((a: any) => a.act_name).join(', ')}
                  </span>
               </div>
             );
          })()}
          {/* ------------------------------------------------------- */}

        </div>
      </div>

      {/* AI Status Box */}
      <div className="mt-6 flex-1">
        <AnimatePresence mode='wait'>
          <motion.div
            key={currentInsightIndex}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="min-h-[100px] rounded-xl border border-slate-200/80 bg-white/85 p-4 shadow-sm dark:border-[#2d437a]/55 dark:bg-[#0f1a35]/70"
          >
            {aiLoading ? (
               <div className="space-y-2 w-full">
                 <div className="h-4 w-1/3 bg-slate-200 rounded animate-pulse" />
                 <div className="h-3 w-full bg-slate-200 rounded animate-pulse" />
                 <div className="h-3 w-2/3 bg-slate-200 rounded animate-pulse" />
               </div>
            ) : aiError ? (
               <div className="flex gap-3 text-red-600">
                 <AlertCircle className="h-5 w-5 shrink-0" />
                 <div className="text-xs">
                   <p className="font-bold">Analysis Failed</p>
                   <button onClick={fetchAiInsights} className="underline mt-1">Retry connection</button>
                 </div>
               </div>
            ) : (
               <>
                 <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white shadow-sm text-blue-600 ring-1 ring-slate-200 dark:bg-[#13213f] dark:text-blue-200 dark:ring-[#2d437a]/50">
                   {currentInsight?.title.includes('Security') ? <AlertCircle className="h-5 w-5" /> :
                    currentInsight?.title.includes('Crowd') ? <TrendingUp className="h-5 w-5" /> :
                    <Sparkles className="h-5 w-5" />}
                 </div>
                 <div className="flex-1 min-w-0">
                    <div className="mb-0.5 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">
                      {currentInsight?.title || 'Event Update'}
                    </div>
                    <div className="line-clamp-3 text-sm font-medium leading-snug text-slate-900 dark:text-slate-100">
                      {currentInsight?.content}
                    </div>
                 </div>
               </>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Pagination / Progress Bars */}
      <div className="mt-5 flex items-center gap-1.5 h-2">
         {aiInsights.length > 1 && aiInsights.map((_, i) => (
           <button
             key={i}
             onClick={() => handleManualChange(i)}
             className={cn(
               "h-1.5 rounded-full transition-all duration-500",
               i === currentInsightIndex ? "w-8 bg-blue-600" : "w-1.5 bg-slate-200 hover:bg-slate-300"
             )}
             aria-label={`View insight ${i + 1}`}
           />
         ))}
      </div>

      <EventCreationModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onEventCreated={() => {
          onEventCreated()
          setShowModal(false)
        }}
      />
    </CardFrame>
  )
}
