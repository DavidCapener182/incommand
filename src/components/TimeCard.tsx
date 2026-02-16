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
import { CardFrame, CardHeader } from '@/components/ui/InCommandCard'

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
      <CardHeader
        icon={Clock}
        title="Current Event"
        action={() => {}}
        actionNode={<MoreHorizontal className="h-4 w-4" />}
      />

      {/* 2-Column Layout */}
      <div className="mt-0.5 grid flex-1 min-h-0 grid-cols-1 gap-4 lg:grid-cols-2">
        
        {/* LEFT COLUMN: Time & Active Status */}
        <div className="flex flex-col justify-between gap-3">
          
          {/* 1. Time & Incident Pulse */}
          <div>
            <h2 className="text-[2.45rem] font-mono font-bold tracking-tight text-slate-900 tabular-nums dark:text-white">
              {currentTime}
            </h2>
            <div className="mt-2 flex items-center gap-2">
               <div className="relative flex h-2 w-2">
                 <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75"></span>
                 <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
               </div>
               <p className="text-xs font-medium text-slate-500 dark:text-slate-300">
                 Last incident: <span className="font-mono font-bold text-slate-700 dark:text-slate-100">{timeSinceLastIncident}</span>
               </p>
            </div>
          </div>

          {/* 2. Highlight Card (Happening Now OR Up Next) */}
          {(currentSlot || activeNext) && (
             <div className="rounded-xl border border-blue-200/80 bg-gradient-to-br from-blue-50/90 to-cyan-50/75 p-3 shadow-sm dark:border-blue-400/35 dark:bg-gradient-to-br dark:from-blue-900/25 dark:to-cyan-900/20">
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
                      <h3 className="line-clamp-2 text-[15px] font-bold leading-tight text-slate-900 dark:text-slate-100">
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
        <div className="flex h-full min-h-0 flex-col border-t border-slate-100 pt-2 lg:border-t-0 lg:border-l lg:pl-4 lg:pt-0">
          <div className="mb-3 flex items-center gap-2">
             <Calendar className="h-4 w-4 text-blue-600" />
             <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Event Schedule</h3>
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
                      "flex items-center justify-between rounded-lg px-2 py-1.5 transition-colors",
                      isHighlighted ? "border border-blue-200 bg-blue-50/80 dark:border-blue-400/35 dark:bg-blue-900/20" : "border border-transparent hover:bg-slate-50 dark:hover:bg-[#1a2a52]/50"
                    )}
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                       <div className={cn(
                         "h-1.5 w-1.5 rounded-full shrink-0",
                         isActive ? "bg-blue-600 animate-pulse" : "bg-slate-300"
                       )} />
                       <span className={cn(
                         "text-sm font-medium break-words",
                         isHighlighted || isActive ? "text-slate-900 dark:text-slate-100" : "text-slate-600 dark:text-slate-300"
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
