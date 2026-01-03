'use client'

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { 
  Download, 
  MoreHorizontal, 
  Users,
  AlertTriangle
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useEventContext } from '@/contexts/EventContext'
import { useCompanyEventContext } from '@/hooks/useCompanyEventContext'
import { StandsSetup } from '@/types/football'

// --- Constants ---
const ITEMS_PER_PAGE = 2
const AUTO_SCROLL_INTERVAL = 3000 

// --- Helpers ---
const buildContextQuery = (ctx: { companyId: string; eventId: string }) =>
  `?company_id=${ctx.companyId}&event_id=${ctx.eventId}`

// --- Components ---
const CardFrame = ({ children, className, onMouseEnter, onMouseLeave }: { children: React.ReactNode; className?: string; onMouseEnter?: () => void; onMouseLeave?: () => void }) => (
  <div 
    onMouseEnter={onMouseEnter}
    onMouseLeave={onMouseLeave}
    className={cn("flex flex-col rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all hover:shadow-md h-full relative overflow-hidden", className)}
  >
    {children}
  </div>
)

const CardHeader = ({ icon: Icon, title, action }: { icon: any; title: string; action?: () => void }) => (
  <div className="flex items-center justify-between mb-3 shrink-0">
    <div className="flex items-center gap-2">
      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
        <Icon className="h-3.5 w-3.5" />
      </div>
      <span className="text-sm font-semibold text-slate-700">{title}</span>
    </div>
    {action && (
      <button onClick={action} className="text-slate-400 hover:text-slate-600 transition-colors">
        <MoreHorizontal className="h-4 w-4" />
      </button>
    )}
  </div>
)

// --- Main Component ---
interface FootballCard_StandOccupancyProps {
  className?: string
  onOpenModal?: () => void
}

export default function FootballCard_StandOccupancy({ className, onOpenModal }: FootballCard_StandOccupancyProps) {
  const { eventId, eventData } = useEventContext()
  const { context } = useCompanyEventContext(eventId)
  const [standsSetup, setStandsSetup] = useState<StandsSetup | null>(null)
  const [autoRefresh] = useState(true)
  const [thresholds, setThresholds] = useState({
    default_green_threshold: 90,
    default_amber_threshold: 97,
    default_red_threshold: 100,
    stand_overrides: {} as Record<string, { amber?: number; red?: number }>,
  })

  // --- Carousel State ---
  const [pageIndex, setPageIndex] = useState(0)
  const [isHovered, setIsHovered] = useState(false)

  // Fetch Logic (Abbreviated for brevity - same as before)
  useEffect(() => {
    if (!context) return
    let mounted = true
    const loadStands = async () => {
      try {
        const res = await fetch(`/api/football/stands${buildContextQuery(context)}`)
        if (!res.ok) return
        const payload = await res.json()
        if (mounted) setStandsSetup(payload.standsSetup)
      } catch (err) { console.error(err) }
    }
    const loadThresholds = async () => {
       try {
          const res = await fetch(`/api/football/thresholds${buildContextQuery(context)}`)
          if (res.ok && mounted) {
             const data = await res.json()
             setThresholds({
               default_green_threshold: data.default_green_threshold || 90,
               default_amber_threshold: data.default_amber_threshold || 97,
               default_red_threshold: data.default_red_threshold || 100,
               stand_overrides: data.stand_overrides || {},
             })
          }
       } catch (e) {}
    }
    loadStands(); loadThresholds();
    if (autoRefresh) {
      const id = setInterval(() => { loadStands(); loadThresholds() }, 30000)
      return () => { mounted = false; clearInterval(id) }
    }
    return () => { mounted = false }
  }, [context, autoRefresh])

  // --- Carousel Logic ---
  const stands = standsSetup?.stands || []
  const totalPages = useMemo(() => Math.ceil(stands.length / ITEMS_PER_PAGE), [stands.length])

  useEffect(() => {
    if (totalPages <= 1 || isHovered) return
    const interval = setInterval(() => {
      setPageIndex((prev) => (prev + 1) % totalPages)
    }, AUTO_SCROLL_INTERVAL)
    return () => clearInterval(interval)
  }, [totalPages, isHovered])

  // --- Calculations ---
  const totals = useMemo(() => {
    if (!standsSetup?.stands) return { current: 0, capacity: 0, percent: 0 }
    const current = standsSetup.stands.reduce((sum, s) => sum + (s.current || 0), 0)
    const capacity = standsSetup.stands.reduce((sum, s) => sum + (s.capacity || 0), 0)
    return { current, capacity, percent: capacity ? (current / capacity) * 100 : 0 }
  }, [standsSetup])

  const getColor = (name: string, pct: number) => {
    const ovr = thresholds.stand_overrides[name]
    const amber = ovr?.amber ?? thresholds.default_amber_threshold
    const red = ovr?.red ?? thresholds.default_red_threshold
    if (pct >= red) return 'bg-red-500'
    if (pct >= amber) return 'bg-amber-500'
    return 'bg-emerald-500' 
  }

  const handleExport = useCallback(async () => {
    if (!context) return
    try {
      const res = await fetch(`/api/football/export/stand${buildContextQuery(context)}`)
      if (res.ok) { /* Download logic */ }
    } catch (e) {}
  }, [context])


  const visibleStands = stands.slice(
    pageIndex * ITEMS_PER_PAGE, 
    (pageIndex * ITEMS_PER_PAGE) + ITEMS_PER_PAGE
  )

  return (
    <CardFrame 
      className={className}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Header */}
      <CardHeader 
        icon={Users} 
        title="Stand Occupancy" 
        action={() => handleExport()} 
      />

      {!standsSetup ? (
        <div className="flex-1 flex flex-col items-center justify-center text-slate-400 text-xs animate-pulse">
           <div className="h-8 w-8 rounded bg-slate-100 mb-2" />
           Loading data...
        </div>
      ) : (
        <div className="flex flex-col h-full min-h-0 justify-between">
           
           {/* Top: Compact Summary */}
           <div className="flex items-center justify-between mb-3 pb-3 border-b border-slate-100">
              <div>
                 <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Total Capacity</p>
                 <div className="flex items-baseline gap-1.5 mt-0.5">
                    <span className="text-xl font-bold text-slate-900">{totals.percent.toFixed(1)}%</span>
                    <span className="text-[10px] text-slate-400 font-medium">
                      ({totals.current.toLocaleString()})
                    </span>
                 </div>
              </div>
              
              {/* Mini Radial Chart - Reduced Size */}
              <div className="relative h-9 w-9 flex items-center justify-center">
                 <svg className="h-full w-full -rotate-90" viewBox="0 0 36 36">
                    <path className="text-slate-100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="4"/>
                    <path 
                      className={cn("transition-all duration-500", totals.percent > 95 ? "text-red-500" : "text-blue-600")} 
                      strokeDasharray={`${totals.percent}, 100`} 
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" 
                      fill="none" stroke="currentColor" strokeWidth="4" 
                    />
                 </svg>
              </div>
           </div>

           {/* Middle: Compact List */}
           <div className="flex-1 flex flex-col gap-2 min-h-0">
              {visibleStands.map((stand) => {
                 const pct = stand.capacity ? Math.min(100, ((stand.current || 0) / stand.capacity) * 100) : 0
                 const colorClass = getColor(stand.name, pct)
                 const isHigh = pct > 95
                 
                 return (
                   <div 
                     key={stand.id} 
                     className="group rounded-md border border-slate-100 bg-slate-50/50 px-3 py-2 hover:bg-white hover:border-blue-100 hover:shadow-sm transition-all cursor-pointer animate-in fade-in slide-in-from-right-2 duration-300"
                     onClick={onOpenModal}
                   >
                      <div className="flex justify-between items-center mb-1.5">
                         <div className="flex items-center gap-1.5 min-w-0">
                            <span className="text-xs font-semibold text-slate-700 group-hover:text-blue-700 truncate max-w-[100px]">{stand.name}</span>
                            {isHigh && <AlertTriangle className="h-3 w-3 text-amber-500 shrink-0" />}
                         </div>
                         <span className={cn("text-[10px] font-bold", pct > 95 ? "text-red-600" : "text-slate-600")}>
                           {pct.toFixed(0)}%
                         </span>
                      </div>
                      
                      <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                         <div 
                           className={cn("h-full rounded-full transition-all duration-500", colorClass)} 
                           style={{ width: `${pct}%` }} 
                         />
                      </div>
                   </div>
                 )
              })}
           </div>

           {/* Bottom: Pagination Dots */}
           {totalPages > 1 && (
             <div className="flex justify-center gap-1 mt-2 shrink-0">
               {Array.from({ length: totalPages }).map((_, idx) => (
                 <button
                   key={idx}
                   onClick={() => setPageIndex(idx)}
                   className={cn(
                     "h-1 rounded-full transition-all duration-300",
                     pageIndex === idx ? "w-4 bg-blue-500" : "w-1 bg-slate-200 hover:bg-slate-300"
                   )}
                   aria-label={`Go to page ${idx + 1}`}
                 />
               ))}
             </div>
           )}
        </div>
      )}
    </CardFrame>
  )
}