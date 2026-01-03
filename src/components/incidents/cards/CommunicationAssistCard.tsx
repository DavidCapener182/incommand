'use client'

import React, { useState } from 'react'
import { SignalIcon } from '@heroicons/react/24/outline'
import { callOpenAI } from '@/services/incidentAIService'

interface CommunicationAssistCardProps {
  factsObserved: string | undefined
  onScriptChange?: (script: string | null) => void
}

export default function CommunicationAssistCard({ factsObserved, onScriptChange }: CommunicationAssistCardProps) {
  const [script, setScript] = useState<string | null>(null)
  const [generating, setGenerating] = useState(false)

  const handleGenerateScript = async () => {
    if (!factsObserved) return
    setGenerating(true)
    try {
      const systemPrompt = `You are drafting a radio message. Create a concise, standard radio transmission script following proper radio protocol (callsigns, clear language, priority indicators).`
      const result = await callOpenAI(`Draft radio message for: ${factsObserved}`, systemPrompt, false)
      setScript(result)
      if (onScriptChange) onScriptChange(result)
    } finally {
      setGenerating(false)
    }
  }

  if (!factsObserved) return null

  return (
    <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2 text-xs uppercase tracking-wider">
          <SignalIcon className="w-4 h-4" /> Radio Assist
        </h3>
        <button
          onClick={handleGenerateScript}
          disabled={generating}
          className="text-[10px] text-blue-600 hover:text-blue-800 font-medium"
        >
          {generating ? 'Drafting...' : 'Draft Script'}
        </button>
      </div>
      {script ? (
        <div className="p-2 bg-white dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-700 text-xs font-mono text-slate-600 dark:text-slate-300">
          {script}
        </div>
      ) : (
        <p className="text-[10px] text-slate-400 italic">Generate a standard radio transmission script based on this log.</p>
      )}
    </div>
  )
}

