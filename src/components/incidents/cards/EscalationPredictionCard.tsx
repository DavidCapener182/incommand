'use client'

import React, { useState } from 'react'
import { ArrowTrendingUpIcon } from '@heroicons/react/24/outline'
import { callOpenAI } from '@/services/incidentAIService'

interface EscalationPredictionCardProps {
  factsObserved: string | undefined
}

interface Prediction {
  scenario: string
  likelihood: 'High' | 'Medium' | 'Low'
  mitigation: string
}

export default function EscalationPredictionCard({ factsObserved }: EscalationPredictionCardProps) {
  const [predictions, setPredictions] = useState<Prediction[]>([])
  const [loading, setLoading] = useState(false)

  const handlePredict = async () => {
    if (!factsObserved) return
    setLoading(true)
    try {
      const systemPrompt = `You are an incident escalation analyst. Analyze the incident and predict potential escalation scenarios. Return a JSON array of objects with "scenario", "likelihood" (High/Medium/Low), and "mitigation" fields.`
      const result = await callOpenAI(
        `Predict escalation scenarios for: ${factsObserved}`,
        systemPrompt,
        true
      )
      try {
        const parsed = JSON.parse(result)
        setPredictions(Array.isArray(parsed) ? parsed : [])
      } catch {
        setPredictions([])
      }
    } catch (e) {
      setPredictions([])
    } finally {
      setLoading(false)
    }
  }

  if (!factsObserved) return null

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-4 mb-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2 text-xs uppercase tracking-wider">
          <ArrowTrendingUpIcon className="w-4 h-4" /> Risks
        </h3>
        <button
          onClick={handlePredict}
          disabled={loading}
          className="text-[10px] text-purple-600 hover:text-purple-800 font-medium disabled:opacity-50 flex items-center gap-1"
        >
          {loading ? 'Thinking...' : 'Predict'}
        </button>
      </div>
      {predictions.length > 0 ? (
        <div className="space-y-2">
          {predictions.map((p, i) => (
            <div key={i} className="bg-slate-50 dark:bg-slate-800 rounded-lg p-2 border border-slate-100 dark:border-slate-700">
              <div className="flex justify-between items-start mb-1">
                <span className="text-[10px] font-bold text-slate-700 dark:text-slate-200">{p.scenario}</span>
                <span
                  className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium ${
                    p.likelihood === 'High'
                      ? 'bg-red-100 text-red-700'
                      : p.likelihood === 'Medium'
                      ? 'bg-amber-100 text-amber-700'
                      : 'bg-green-100 text-green-700'
                  }`}
                >
                  {p.likelihood}
                </span>
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">🛡️ {p.mitigation}</p>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-[10px] text-slate-400 italic">AI analysis of future developments.</p>
      )}
    </div>
  )
}

