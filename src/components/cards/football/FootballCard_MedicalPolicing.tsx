'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { Users, Shield, Stethoscope, Siren } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { FootballData } from '@/types/football'
import { StatusDot, StatusType } from '@/components/football/StatusIndicator'
import type { StaffingIngestionBundle } from '@/lib/staffing/dataIngestion'
import { CardFrame, CardHeader } from '@/components/ui/InCommandCard'

interface FootballCard_MedicalPolicingProps {
  className?: string
  onOpenModal?: () => void
}

// --- Constants ---
const ITEMS_PER_PAGE = 2
const AUTO_SCROLL_INTERVAL = 3000 // 3 seconds per slide

// --- Helper Components ---
const StaffingBar = ({ 
  label, 
  actual, 
  planned, 
  icon: Icon, 
  colorClass 
}: { 
  label: string
  actual: number
  planned: number
  icon: any
  colorClass: string
}) => {
  const percent = planned > 0 ? Math.min((actual / planned) * 100, 100) : 0
  
  return (
    <div className="w-full rounded-lg border border-slate-100 bg-slate-50/50 px-2.5 py-2 hover:bg-white hover:shadow-sm transition-all animate-in fade-in slide-in-from-right-2 duration-300">
      <div className="flex justify-between items-center mb-1.5">
        <div className="flex items-center gap-2">
           <Icon className="h-4 w-4 text-slate-400 group-hover:text-slate-600 transition-colors" />
           <span className="text-xs font-semibold text-slate-700">{label}</span>
        </div>
        <div className="text-[10px] font-mono font-medium text-slate-500 bg-white px-1.5 py-0.5 rounded border border-slate-100">
           <span className="text-slate-900 font-bold">{actual}</span>
           <span className="opacity-50"> / {planned}</span>
        </div>
      </div>
      <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden relative">
         <div 
           className={cn("h-full rounded-full transition-all duration-500", colorClass)} 
           style={{ width: `${percent}%` }} 
         />
      </div>
    </div>
  )
}

export default function FootballCard_MedicalPolicing({ className, onOpenModal }: FootballCard_MedicalPolicingProps) {
  const [data, setData] = useState<FootballData | null>(null)
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [staffingSnapshot, setStaffingSnapshot] = useState<StaffingIngestionBundle | null>(null)

  // --- Carousel State ---
  const [pageIndex, setPageIndex] = useState(0)
  const [isHovered, setIsHovered] = useState(false)

  // --- Data Fetching ---
  useEffect(() => {
    let mounted = true
    const load = async () => {
      try {
        const res = await fetch('/api/football/data')
        if (res.ok) {
           const json = await res.json()
           if (mounted) setData(json.data)
        }
      } catch (e) { console.error(e) }
    }
    load()

    const loadSnapshot = async () => {
      try {
        const eventRes = await fetch('/api/get-current-event')
        if (eventRes.ok) {
           const { event } = await eventRes.json()
           if (event?.id) {
             const snapRes = await fetch(`/api/staffing/insights?eventId=${event.id}`)
             if (snapRes.ok) {
               const payload = await snapRes.json()
               if (mounted) setStaffingSnapshot(payload.data)
             }
           }
        }
      } catch (e) {}
    }
    loadSnapshot()

    if (autoRefresh) {
      const id = setInterval(() => { load(); loadSnapshot() }, 30000)
      return () => { mounted = false; clearInterval(id) }
    }
    return () => { mounted = false }
  }, [autoRefresh])

  // --- Calculations ---
  const staffingTotals = useMemo(() => {
    const fallbackSecurity = data?.medicalPolicing.stewards ?? 0
    const fallbackPolice = data?.medicalPolicing.policeDeployed ?? 0
    const fallbackMedical = data?.medicalPolicing.medicalTeams ?? 0

    if (!staffingSnapshot) {
      const total = fallbackSecurity + fallbackPolice + fallbackMedical
      return {
        totalActual: total,
        totalPlanned: total,
        items: [
          { id: 'sec', label: 'Security', actual: fallbackSecurity, planned: fallbackSecurity, icon: Shield },
          { id: 'med', label: 'Medical', actual: fallbackMedical, planned: fallbackMedical, icon: Stethoscope },
          { id: 'pol', label: 'Police', actual: fallbackPolice, planned: fallbackPolice, icon: Siren },
        ]
      }
    }

    const findDiscipline = (name: string) => staffingSnapshot.disciplines.find((d) => d.discipline === name)
    const security = findDiscipline('security')
    const police = findDiscipline('police')
    const medical = findDiscipline('medical')
    
    // Fallbacks if discipline missing in snapshot
    const secActual = security?.actual ?? fallbackSecurity
    const secPlanned = security?.planned ?? secActual
    const polActual = police?.actual ?? fallbackPolice
    const polPlanned = police?.planned ?? polActual
    const medActual = medical?.actual ?? fallbackMedical
    const medPlanned = medical?.planned ?? medActual

    return {
      totalActual: staffingSnapshot.disciplines.reduce((sum, disc) => sum + disc.actual, 0),
      totalPlanned: staffingSnapshot.disciplines.reduce((sum, disc) => sum + disc.planned, 0),
      items: [
        { id: 'sec', label: 'Security', actual: secActual, planned: secPlanned, icon: Shield },
        { id: 'med', label: 'Medical', actual: medActual, planned: medPlanned, icon: Stethoscope },
        { id: 'pol', label: 'Police', actual: polActual, planned: polPlanned, icon: Siren },
      ]
    }
  }, [data, staffingSnapshot])

  const statusType = useMemo((): StatusType => {
    if (staffingTotals.totalPlanned === 0) return 'normal'
    const percent = (staffingTotals.totalActual / staffingTotals.totalPlanned) * 100
    if (percent < 90) return 'alert'
    if (percent < 100) return 'busy'
    return 'normal'
  }, [staffingTotals])

  const getProgressColor = (actual: number, planned: number) => {
     if (planned === 0) return 'bg-slate-300'
     const pct = (actual / planned) * 100
     if (pct < 80) return 'bg-red-500'
     if (pct < 95) return 'bg-amber-400'
     return 'bg-emerald-500'
  }

  // --- Carousel Logic ---
  const totalPages = Math.ceil(staffingTotals.items.length / ITEMS_PER_PAGE)

  useEffect(() => {
    if (totalPages <= 1 || isHovered) return
    const interval = setInterval(() => {
      setPageIndex((prev) => (prev + 1) % totalPages)
    }, AUTO_SCROLL_INTERVAL)
    return () => clearInterval(interval)
  }, [totalPages, isHovered])

  const visibleItems = staffingTotals.items.slice(
    pageIndex * ITEMS_PER_PAGE,
    (pageIndex * ITEMS_PER_PAGE) + ITEMS_PER_PAGE
  )

  return (
    <CardFrame 
      className={className}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <CardHeader 
        icon={Users} 
        title="Staffing Levels" 
        action={() => onOpenModal?.()} 
      />

      {!data ? (
        <div className="flex-1 flex flex-col items-center justify-center text-slate-400 text-xs animate-pulse">
           <div className="h-8 w-8 rounded bg-slate-100 mb-2" />
           Loading data...
        </div>
      ) : (
        <div className="flex flex-col h-full min-h-0 justify-between">
           
           {/* Top Summary */}
           <div className="flex items-center justify-between mb-3 pb-3 border-b border-slate-100">
              <div>
                 <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Deployment</p>
                 <div className="flex items-baseline gap-1.5 mt-0.5">
                    <span className="text-xl font-bold text-slate-900">
                      {((staffingTotals.totalActual / (staffingTotals.totalPlanned || 1)) * 100).toFixed(0)}%
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium">
                      ({staffingTotals.totalActual}/{staffingTotals.totalPlanned})
                    </span>
                 </div>
              </div>
              <div className={cn(
                "px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wide",
                statusType === 'alert' ? "bg-red-100 text-red-700" :
                statusType === 'busy' ? "bg-amber-100 text-amber-700" :
                "bg-emerald-100 text-emerald-700"
              )}>
                {statusType === 'normal' ? 'On Target' : statusType}
              </div>
           </div>

           {/* Paged List - Fixed height container to prevent jumping */}
           <div className="flex-1 flex flex-col gap-2 min-h-[110px]">
              {visibleItems.map((item) => (
                 <StaffingBar 
                   key={item.id}
                   label={item.label}
                   actual={item.actual}
                   planned={item.planned}
                   icon={item.icon}
                   colorClass={getProgressColor(item.actual, item.planned)}
                 />
              ))}
           </div>

           {/* Pagination Dots */}
           {totalPages > 1 && (
             <div className="flex justify-center gap-1.5 mt-2">
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
