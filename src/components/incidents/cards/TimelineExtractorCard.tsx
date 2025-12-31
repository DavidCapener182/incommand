'use client'

import React, { useState } from 'react'
import { ClockIcon, SparklesIcon, ArrowPathIcon } from '@heroicons/react/24/outline'
import { callOpenAI } from '@/services/incidentAIService'

interface TimelineItem {
  time: string
  event: string
}

interface TimelineExtractorCardProps {
  factsObserved: string | undefined
  onTimelineChange?: (timeline: TimelineItem[]) => void
}

export default function TimelineExtractorCard({ factsObserved, onTimelineChange }: TimelineExtractorCardProps) {
  const [timeline, setTimeline] = useState<TimelineItem[]>([])
  const [loading, setLoading] = useState(false)

  const handleExtract = async () => {
    if (!factsObserved) return
    setLoading(true)
    try {
      const systemPrompt = `You are a timeline extractor. Extract chronological events from the incident report. Return a JSON array of objects with "time" and "event" fields. Example: [{"time": "14:05", "event": "Subject first observed"}]. If times are not specified, estimate based on context or use "Unknown".`
      const result = await callOpenAI(
        `Extract timeline from: ${factsObserved}`,
        systemPrompt,
        true
      )
      try {
        const parsed = JSON.parse(result)
        const timelineArray = Array.isArray(parsed) ? parsed : []
        setTimeline(timelineArray)
        if (onTimelineChange) onTimelineChange(timelineArray)
      } catch {
        setTimeline([])
        if (onTimelineChange) onTimelineChange([])
      }
    } catch (e) {
      setTimeline([])
    } finally {
      setLoading(false)
    }
  }

  if (!factsObserved) return null

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-4 mb-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2 text-xs uppercase tracking-wider">
          <ClockIcon className="w-4 h-4" /> Chronology
        </h3>
        <button
          onClick={handleExtract}
          disabled={loading}
          className="text-[10px] text-purple-600 hover:text-purple-800 font-medium disabled:opacity-50 flex items-center gap-1"
        >
          {loading ? (
            <>
              <ArrowPathIcon className="w-3 h-3 animate-spin" />
              Extracting...
            </>
          ) : (
            <>
              <SparklesIcon className="w-3 h-3" />
              Build Timeline
            </>
          )}
        </button>
      </div>
      {timeline.length > 0 ? (
        <div className="relative border-l-2 border-slate-100 dark:border-slate-700 ml-2 space-y-4 pl-4 py-1">
          {timeline.map((item, i) => (
            <div key={i} className="relative">
              <div className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full bg-purple-400 border-2 border-white dark:border-slate-900"></div>
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-purple-700 dark:text-purple-300">{item.time}</span>
                <span className="text-xs text-slate-600 dark:text-slate-300">{item.event}</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-[10px] text-slate-400 italic">Extract structured timeline.</p>
      )}
    </div>
  )
}

