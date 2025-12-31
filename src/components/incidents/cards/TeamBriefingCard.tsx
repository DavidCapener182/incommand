'use client'

import React, { useState } from 'react'
import { MegaphoneIcon } from '@heroicons/react/24/outline'
import { callOpenAI } from '@/services/incidentAIService'

interface TeamBriefingCardProps {
  factsObserved: string | undefined
  location: string | undefined
  incidentType: string
}

export default function TeamBriefingCard({ factsObserved, location, incidentType }: TeamBriefingCardProps) {
  const [briefing, setBriefing] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleGenerate = async () => {
    if (!factsObserved || !location) return
    setLoading(true)
    try {
      const systemPrompt = `You are generating a team briefing (SITREP). Create a concise, clear briefing script for responding teams. Use standard radio terminology.`
      const result = await callOpenAI(
        `Generate briefing for: ${incidentType} at ${location}. Facts: ${factsObserved}`,
        systemPrompt,
        false
      )
      setBriefing(result)
    } finally {
      setLoading(false)
    }
  }

  if (!factsObserved) return null

  return (
    <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2 text-xs uppercase tracking-wider">
          <MegaphoneIcon className="w-4 h-4" /> Team Briefing
        </h3>
        <button
          onClick={handleGenerate}
          disabled={loading}
          className="text-[10px] text-blue-600 hover:text-blue-800 font-medium disabled:opacity-50"
        >
          {loading ? 'Drafting...' : 'Draft Brief'}
        </button>
      </div>
      {briefing ? (
        <div className="p-2.5 bg-white dark:bg-slate-900 rounded border-l-4 border-l-blue-500 border-y border-r border-slate-200 dark:border-slate-700 text-xs font-mono text-slate-600 dark:text-slate-300 shadow-sm">
          {briefing}
        </div>
      ) : (
        <p className="text-[10px] text-slate-400 italic">Generate a clear SITREP script for responding teams.</p>
      )}
    </div>
  )
}

