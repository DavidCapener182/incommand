'use client'

import React, { useState, useEffect } from 'react'
import { UserGroupIcon } from '@heroicons/react/24/outline'
import { callOpenAI } from '@/services/incidentAIService'

interface DispatchAdvisorCardProps {
  incidentType: string
  priority: string
  onAdviceChange?: (advice: Advice | null) => void
}

interface Unit {
  role: string
  count: number
  reason: string
}

interface Advice {
  units: Unit[]
  priority_code: string
}

export default function DispatchAdvisorCard({ incidentType, priority, onAdviceChange }: DispatchAdvisorCardProps) {
  const [advice, setAdvice] = useState<Advice | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (incidentType && priority) {
      const getAdvice = async () => {
        setLoading(true)
        try {
          const systemPrompt = `You are a dispatch advisor. Recommend resources for the incident. Return JSON with "units" (array of {role, count, reason}) and "priority_code" (string like "Code 2").`
          const result = await callOpenAI(
            `Recommend resources for: ${incidentType} ${priority}`,
            systemPrompt,
            true
          )
          try {
            const parsed = JSON.parse(result)
            setAdvice(parsed)
            if (onAdviceChange) onAdviceChange(parsed)
          } catch {
            setAdvice(null)
            if (onAdviceChange) onAdviceChange(null)
          }
        } finally {
          setLoading(false)
        }
      }
      const timer = setTimeout(getAdvice, 1500)
      return () => clearTimeout(timer)
    }
  }, [incidentType, priority])

  if (!advice && !loading) return null

  return (
    <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800 rounded-xl p-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-bold text-blue-900 dark:text-blue-200 flex items-center gap-2 text-xs">
          <UserGroupIcon className="w-4 h-4" /> Dispatch Advisor
        </h3>
        {loading && <span className="text-xs text-blue-500 animate-pulse">Thinking...</span>}
      </div>
      {advice && (
        <div className="space-y-2">
          {advice.units.map((u: Unit, i: number) => (
            <div
              key={i}
              className="flex justify-between items-center text-xs bg-white/60 dark:bg-white/5 p-1.5 rounded border border-blue-100 dark:border-blue-800"
            >
              <span className="font-medium text-slate-700 dark:text-slate-300">
                {u.count}x {u.role}
              </span>
              <span className="text-[10px] text-slate-500">{u.reason}</span>
            </div>
          ))}
          <div className="mt-2 pt-2 border-t border-blue-200/50 flex justify-end">
            <span className="text-[10px] font-bold text-blue-800 dark:text-blue-300 bg-blue-200/50 px-2 py-0.5 rounded-full">
              {advice.priority_code}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}

