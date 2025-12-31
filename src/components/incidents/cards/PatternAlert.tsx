'use client'

import React, { useState, useEffect } from 'react'
import { BellAlertIcon } from '@heroicons/react/24/outline'
import { callOpenAI } from '@/services/incidentAIService'

interface PatternAlertProps {
  incidentType: string
  location: string | undefined
}

interface Pattern {
  detected: boolean
  count?: number
  message?: string
}

export default function PatternAlert({ incidentType, location }: PatternAlertProps) {
  const [pattern, setPattern] = useState<Pattern | null>(null)

  useEffect(() => {
    if (incidentType && location) {
      const checkPatterns = async () => {
        try {
          const systemPrompt = `You are a pattern detection system. Check if similar incidents have occurred recently. Return a JSON object with "detected" (boolean), "count" (number if detected), and "message" (string if detected).`
          const result = await callOpenAI(
            `Check patterns for ${incidentType} at ${location}`,
            systemPrompt,
            true
          )
          try {
            const parsed = JSON.parse(result)
            setPattern(parsed)
          } catch {
            setPattern(null)
          }
        } catch (e) {
          setPattern(null)
        }
      }
      const timer = setTimeout(checkPatterns, 2000)
      return () => clearTimeout(timer)
    }
  }, [incidentType, location])

  if (!pattern?.detected) return null

  return (
    <div className="mb-6 mx-6 sm:mx-8 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
      <div className="p-1.5 bg-amber-100 dark:bg-amber-800 rounded-lg shrink-0">
        <BellAlertIcon className="w-5 h-5 text-amber-700 dark:text-amber-200" />
      </div>
      <div>
        <h4 className="text-sm font-bold text-amber-900 dark:text-amber-100 flex items-center gap-2">
          Pattern Alert
          <span className="text-[10px] bg-amber-200 dark:bg-amber-800 px-1.5 py-0.5 rounded-full text-amber-800 dark:text-amber-100">
            {pattern.count} Matches
          </span>
        </h4>
        <p className="text-xs text-amber-800 dark:text-amber-200 mt-1">{pattern.message}</p>
      </div>
    </div>
  )
}

