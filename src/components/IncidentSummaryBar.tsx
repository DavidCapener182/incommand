'use client'

import React, { useEffect, useRef, useState } from 'react'
import { 
  Activity,
  ShieldAlert,
  AlertCircle,
  Clock,
  CheckCircle2
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useIncidentSummary } from '@/contexts/IncidentSummaryContext'

export type SummaryStatus = 'open' | 'in_progress' | 'closed'

interface IncidentSummaryBarProps {
  onFilter?: (status: SummaryStatus | null) => void
  activeStatus?: SummaryStatus | null
  className?: string
}

const CardFrame = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <div className={cn("flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:shadow-md h-full", className)}>
    {children}
  </div>
)

const CardHeader = ({ icon: Icon, title }: { icon: any; title: string }) => (
  <div className="flex items-center justify-between mb-4">
    <div className="flex items-center gap-2.5">
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
        <Icon className="h-4 w-4" />
      </div>
      <span className="text-sm font-semibold text-slate-700">{title}</span>
    </div>
  </div>
)

export function IncidentSummaryBar({ onFilter, activeStatus, className }: IncidentSummaryBarProps) {
  const { counts } = useIncidentSummary()
  const statusCounts = counts as Record<SummaryStatus, number>
  const [changedStatuses, setChangedStatuses] = useState<Set<SummaryStatus>>(new Set())
  const previousCountsRef = useRef(counts)

  useEffect(() => {
    const prev = previousCountsRef.current
    const changed: SummaryStatus[] = []
    ;(['open', 'in_progress', 'closed'] as const).forEach((key) => {
      if (prev[key] !== counts[key]) changed.push(key)
    })
    previousCountsRef.current = counts
    if (changed.length > 0) {
      setChangedStatuses(new Set(changed))
      const timeout = setTimeout(() => setChangedStatuses(new Set()), 1200)
      return () => clearTimeout(timeout)
    }
  }, [counts])

  return (
    <CardFrame className={className}>
      <CardHeader icon={ShieldAlert} title="Incident Summary" />
      
      <div className="grid grid-cols-2 gap-4">
         {/* Big Total Hero Card - SOFTENED BORDER */}
         <div 
           onClick={() => onFilter?.(null)}
           className={cn(
             "col-span-2 flex items-center justify-between rounded-xl border p-4 transition-all cursor-pointer hover:scale-[1.01]",
             activeStatus === null 
               ? "bg-slate-50 border-blue-300 shadow-sm" // Removed thick ring
               : "bg-white border-slate-200 hover:border-blue-200 hover:bg-slate-50"
           )}
         >
           <div>
             <p className={cn(
               "text-xs font-bold uppercase tracking-wide",
               activeStatus === null ? "text-blue-700" : "text-slate-500"
             )}>Total Incidents</p>
             <p className="text-3xl font-bold mt-1 text-slate-900">{counts.total}</p>
           </div>
           <div className={cn(
             "flex h-10 w-10 items-center justify-center rounded-full transition-colors",
             activeStatus === null ? "bg-blue-100 text-blue-600" : "bg-slate-100 text-slate-500"
           )}>
              <Activity className="h-5 w-5" />
           </div>
         </div>

         {/* Open Incidents Card */}
         <button
            onClick={() => onFilter?.('open')}
            className={cn(
              "flex flex-col justify-center gap-1 rounded-lg border p-3 text-center transition-all hover:shadow-sm",
              activeStatus === 'open' 
                ? "border-red-200 bg-red-50 ring-1 ring-red-200" 
                : "border-red-100 bg-red-50/50 hover:bg-red-50",
              changedStatuses.has('open') && "animate-pulse bg-red-100"
            )}
         >
            <span className="text-2xl font-bold text-red-700">{statusCounts.open}</span>
            <span className="flex items-center justify-center gap-1.5 text-[10px] font-bold uppercase text-red-600">
               <AlertCircle className="h-3 w-3" />
               Open
            </span>
         </button>

         {/* In Progress Card */}
         <button
            onClick={() => onFilter?.('in_progress')}
            className={cn(
              "flex flex-col justify-center gap-1 rounded-lg border p-3 text-center transition-all hover:shadow-sm",
              activeStatus === 'in_progress' 
                ? "border-amber-200 bg-amber-50 ring-1 ring-amber-200" 
                : "border-amber-100 bg-amber-50/50 hover:bg-amber-50",
              changedStatuses.has('in_progress') && "animate-pulse bg-amber-100"
            )}
         >
            <span className="text-2xl font-bold text-amber-700">{statusCounts.in_progress}</span>
            <span className="flex items-center justify-center gap-1.5 text-[10px] font-bold uppercase text-amber-600">
               <Clock className="h-3 w-3" />
               In Progress
            </span>
         </button>
      </div>
      
      <div className="mt-3 flex items-center justify-between text-xs">
         <button 
           onClick={() => onFilter?.('closed')}
           className={cn(
             "flex items-center gap-1.5 px-2 py-1.5 rounded-md transition-colors",
             activeStatus === 'closed' 
               ? "bg-emerald-100 text-emerald-800 font-bold" 
               : "text-slate-500 hover:bg-slate-100 hover:text-slate-700"
           )}
         >
           <CheckCircle2 className={cn("h-3.5 w-3.5", activeStatus === 'closed' ? "text-emerald-600" : "text-emerald-500")} />
           <span>{statusCounts.closed} closed incidents</span>
         </button>
      </div>
    </CardFrame>
  )
}

export default IncidentSummaryBar