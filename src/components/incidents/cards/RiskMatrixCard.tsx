'use client'

import React, { useState, useEffect } from 'react'
import { ChartBarIcon } from '@heroicons/react/24/outline'
import { callOpenAI } from '@/services/incidentAIService'

interface RiskMatrixCardProps {
  factsObserved: string | undefined
  currentPriority?: string
  onRiskMatrixChange?: (matrix: RiskMatrix | null) => void
}

interface RiskMatrix {
  likelihood: number
  impact: number
  score: number
  level: string
  reasoning: string
}

export default function RiskMatrixCard({ factsObserved, currentPriority, onRiskMatrixChange }: RiskMatrixCardProps) {
  const [matrix, setMatrix] = useState<RiskMatrix | null>(null)
  const [calculating, setCalculating] = useState(false)

  useEffect(() => {
    if (factsObserved && factsObserved.length > 15 && !matrix) {
      const calculate = async () => {
        setCalculating(true)
        try {
          const systemPrompt = `You are a risk assessment analyst. Calculate a risk matrix (likelihood 1-5, impact 1-5, score = likelihood × impact, level: Low/Medium/High/Critical). Return JSON with "likelihood", "impact", "score", "level", and "reasoning".`
          const result = await callOpenAI(
            `Calculate risk matrix for: ${factsObserved}`,
            systemPrompt,
            true
          )
          try {
            const parsed = JSON.parse(result)
            setMatrix(parsed)
            if (onRiskMatrixChange) onRiskMatrixChange(parsed)
          } catch {
            setMatrix(null)
            if (onRiskMatrixChange) onRiskMatrixChange(null)
          }
        } finally {
          setCalculating(false)
        }
      }
      const timer = setTimeout(calculate, 2500)
      return () => clearTimeout(timer)
    }
  }, [factsObserved, matrix])

  if (!matrix && !calculating) return null

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-4 mb-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2 text-xs uppercase tracking-wider">
          <ChartBarIcon className="w-4 h-4" /> Risk Matrix
        </h3>
        {calculating && <span className="text-[10px] text-blue-500 animate-pulse">Calculating...</span>}
      </div>
      {matrix && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-slate-100 dark:bg-slate-800 rounded p-2 text-center">
              <span className="block text-[10px] text-slate-500">Likelihood</span>
              <span className="font-bold text-slate-800 dark:text-white">{matrix.likelihood}/5</span>
            </div>
            <span className="text-slate-400">×</span>
            <div className="flex-1 bg-slate-100 dark:bg-slate-800 rounded p-2 text-center">
              <span className="block text-[10px] text-slate-500">Impact</span>
              <span className="font-bold text-slate-800 dark:text-white">{matrix.impact}/5</span>
            </div>
            <span className="text-slate-400">=</span>
            <div
              className={`flex-1 rounded p-2 text-center ${
                matrix.score >= 15
                  ? 'bg-red-100 text-red-800'
                  : matrix.score >= 8
                  ? 'bg-amber-100 text-amber-800'
                  : 'bg-green-100 text-green-800'
              }`}
            >
              <span className="block text-[10px] opacity-80">Score</span>
              <span className="font-black">{matrix.score}</span>
            </div>
          </div>
          <p className="text-[10px] text-slate-500 italic leading-tight">{matrix.reasoning}</p>
          {/* Priority Adjustment Notification */}
          {currentPriority && (() => {
            const riskLevel = matrix.level?.toLowerCase()
            const currentPriorityLower = currentPriority.toLowerCase()
            let message = null
            let isAutoAdjustment = false
            
            // If risk is Low and current priority is High/Urgent, show auto-adjustment message
            if (riskLevel === 'low' && (currentPriorityLower === 'high' || currentPriorityLower === 'urgent')) {
              message = 'Priority automatically adjusted to Medium based on low risk assessment'
              isAutoAdjustment = true
            }
            // If risk is Medium with low score and current priority is High/Urgent, show auto-adjustment
            else if (riskLevel === 'medium' && matrix.score <= 8 && (currentPriorityLower === 'high' || currentPriorityLower === 'urgent')) {
              message = 'Priority automatically adjusted to Medium based on moderate risk assessment'
              isAutoAdjustment = true
            }
            // If risk is High/Critical and current priority is Low/Medium, suggest (but don't auto-adjust)
            else if ((riskLevel === 'high' || riskLevel === 'critical') && (currentPriorityLower === 'low' || currentPriorityLower === 'medium')) {
              message = 'Consider increasing priority to High based on risk assessment'
              isAutoAdjustment = false
            }
            
            if (message) {
              return (
                <div className="mt-2 pt-2 border-t border-slate-200">
                  <p className={`text-[10px] px-2 py-1 rounded border ${
                    isAutoAdjustment 
                      ? 'text-blue-600 bg-blue-50 border-blue-200' 
                      : 'text-amber-600 bg-amber-50 border-amber-200'
                  }`}>
                    {isAutoAdjustment ? '✓' : '⚠️'} {message}
                  </p>
                </div>
              )
            }
            return null
          })()}
        </div>
      )}
    </div>
  )
}

