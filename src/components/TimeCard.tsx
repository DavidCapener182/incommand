'use client'

import React from 'react'
import { 
  Clock, 
  Calendar, 
  Timer,
  MoreHorizontal,
  PlayCircle,
  Hourglass
} from 'lucide-react'
import { cn } from '@/lib/utils'

export interface EventTiming {
  title: string
  time: string
  isNext?: boolean
  isActuallyHappeningNow?: boolean
}

export interface TimeCardProps {
  companyId?: string | null
  currentTime: string
  eventTimings: EventTiming[]
  nextEvent: EventTiming | null
  countdown: string
  currentSlot?: EventTiming | null
  timeSinceLastIncident: string
}

// --- Helper Components ---
const CardFrame = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <div className={cn("flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:shadow-md h-full", className)}>
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
    <button className="text-slate-400 hover:text-slate-600 transition-colors">
      <MoreHorizontal className="h-5 w-5" />
    </button>
  </div>
)

const TimeCard: React.FC<TimeCardProps> = ({ 
  currentTime, 
  eventTimings, 
  nextEvent, 
  countdown, 
  currentSlot, 
  timeSinceLastIncident 
}) => {

  // Logic: Determine active next for display prioritization
  const activeNext = nextEvent || eventTimings.find(t => t.isNext);

  return (
    <CardFrame>
      {/* Header */}
      <CardHeader icon={Clock} title="Current Event" />

      {/* 2-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 min-h-0 mt-1">
        
        {/* LEFT COLUMN: Time & Active Status */}
        <div className="flex flex-col justify-between gap-4">
          
          {/* 1. Time & Incident Pulse */}
          <div>
            <h2 className="text-4xl font-mono font-bold tracking-tight text-slate-900 tabular-nums">
              {currentTime}
            </h2>
            <div className="mt-2 flex items-center gap-2">
               <div className="relative flex h-2 w-2">
                 <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75"></span>
                 <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
               </div>
               <p className="text-xs font-medium text-slate-500">
                 Last incident: <span className="font-mono font-bold text-slate-700">{timeSinceLastIncident}</span>
               </p>
            </div>
          </div>

          {/* 2. Highlight Card (Happening Now OR Up Next) */}
          {(currentSlot || activeNext) && (
             <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-4">
                <div className="flex items-center justify-between mb-2">
                   <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700">
                     {currentSlot?.isActuallyHappeningNow ? 'Happening Now' : 'Up Next'}
                   </span>
                   <span className="font-mono text-xs font-bold text-blue-800 bg-blue-100 px-2 py-0.5 rounded-md">
                     {currentSlot?.time || activeNext?.time}
                   </span>
                </div>
                
                <div className="flex items-center gap-3">
                   {currentSlot?.isActuallyHappeningNow ? (
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                        <PlayCircle className="h-5 w-5" />
                      </div>
                   ) : (
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500">
                        <Timer className="h-5 w-5" />
                      </div>
                   )}
                   
                   <div className="min-w-0">
                      <h3 className="text-base font-bold text-slate-900 leading-tight line-clamp-2">
                        {currentSlot?.title || activeNext?.title}
                      </h3>
                      {/* Show countdown only if looking at next event */}
                      {!currentSlot?.isActuallyHappeningNow && countdown && (
                        <p className="text-xs text-blue-600 mt-0.5 font-medium">
                          Starting in {countdown}
                        </p>
                      )}
                   </div>
                </div>
             </div>
          )}
        </div>

        {/* RIGHT COLUMN: Schedule List */}
        <div className="flex flex-col h-full min-h-0 border-l border-slate-100 pl-0 lg:pl-6 border-t lg:border-t-0 pt-4 lg:pt-0">
          <div className="flex items-center gap-2 mb-3">
             <Calendar className="h-4 w-4 text-blue-600" />
             <h3 className="text-sm font-semibold text-slate-900">Event Schedule</h3>
          </div>
          
          <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 space-y-1">
            {eventTimings.length > 0 ? (
              eventTimings.map((timing, index) => {
                const isHighlighted = timing.isNext;
                const isActive = timing.isActuallyHappeningNow;

                return (
                  <div 
                    key={index} 
                    className={cn(
                      "flex items-center justify-between py-2 px-2.5 rounded-lg transition-colors",
                      isHighlighted ? "bg-blue-50 border border-blue-100" : "hover:bg-slate-50 border border-transparent"
                    )}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                       <div className={cn(
                         "h-1.5 w-1.5 rounded-full shrink-0",
                         isActive ? "bg-blue-600 animate-pulse" : "bg-slate-300"
                       )} />
                       <span className={cn(
                         "text-sm font-medium truncate",
                         isHighlighted || isActive ? "text-slate-900" : "text-slate-600"
                       )}>
                         {timing.title}
                       </span>
                    </div>
                    <span className={cn(
                      "text-xs font-mono font-medium ml-2 whitespace-nowrap",
                      isHighlighted ? "text-blue-700" : "text-slate-400"
                    )}>
                      {timing.time}
                    </span>
                  </div>
                )
              })
            ) : (
              <p className="text-xs text-slate-400 italic text-center py-4">No schedule available</p>
            )}
          </div>
        </div>

      </div>
    </CardFrame>
  )
}

export default TimeCard