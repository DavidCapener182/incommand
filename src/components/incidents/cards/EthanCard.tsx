'use client'

import React, { useState } from 'react'
import { FireIcon } from '@heroicons/react/24/outline'
import { callOpenAI } from '@/services/incidentAIService'

interface EthanCardProps {
  factsObserved: string | undefined
  location: string | undefined
  onEthaneChange?: (ethane: any | null) => void
}

export default function EthanCard({ factsObserved, location, onEthaneChange }: EthanCardProps) {
  const [ethane, setEthane] = useState<any | null>(null)
  const [loading, setLoading] = useState(false)

  const handleGenerate = async () => {
    if (!factsObserved && !location) return
    setLoading(true)
    try {
      const systemPrompt = `You are generating an ETHANE report (Exact location, Type, Hazards, Access, Number, Emergency services). Return a JSON object with keys: E (Exact location), T (Type), H (Hazards), A (Access), N (Number), E_services (Emergency services).`
      const result = await callOpenAI(
        `Generate ETHANE report for: ${factsObserved} at ${location || 'unknown location'}`,
        systemPrompt,
        true
      )
      try {
        const parsed = JSON.parse(result)
        setEthane(parsed)
        if (onEthaneChange) onEthaneChange(parsed)
      } catch {
        setEthane(null)
        if (onEthaneChange) onEthaneChange(null)
      }
    } catch (e) {
      setEthane(null)
    } finally {
      setLoading(false)
    }
  }

  if (!factsObserved) return null

  return (
    <div className="bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 rounded-xl p-4 mb-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-red-800 dark:text-red-200 flex items-center gap-2 text-xs uppercase tracking-wider">
          <FireIcon className="w-4 h-4" /> ETHANE Report
        </h3>
        <button
          onClick={handleGenerate}
          disabled={loading}
          className="text-[10px] text-red-600 hover:text-red-800 font-medium disabled:opacity-50"
        >
          {loading ? '...' : 'Generate'}
        </button>
      </div>
      {ethane ? (
        <div className="space-y-2 text-[10px]">
          {Object.entries(ethane).map(([k, v]: any) => (
            <div key={k} className="grid grid-cols-[20px_1fr] gap-2">
              <span className="font-bold text-red-700">{k[0]}</span>
              <span className="text-slate-700 dark:text-slate-300">{v}</span>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-[10px] text-red-400 italic">Major incident reporting format.</p>
      )}
    </div>
  )
}

