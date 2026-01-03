'use client'

import React, { useState } from 'react'
import { ExclamationTriangleIcon, ArrowPathIcon } from '@heroicons/react/24/outline'
import type { EntryType } from '../../../types/auditableLog'
import { validateEntryType } from '../../../lib/auditableLogging'
import { callOpenAI } from '@/services/incidentAIService'

export interface IncidentConfigurationCardProps {
  priority: string
  entryType: EntryType | undefined
  timeOfOccurrence: string | undefined
  timeLogged: string | undefined
  retrospectiveJustification: string | undefined
  onPriorityChange: (value: string) => void
  onEntryTypeChange: (value: EntryType) => void
  onTimeOfOccurrenceChange: (value: string) => void
  onTimeLoggedChange: (value: string) => void
  onRetrospectiveJustificationChange: (value: string) => void
  showAdvancedTimestamps: boolean
  onShowAdvancedTimestampsChange: (value: boolean) => void
  entryTypeWarnings: string[]
  onEntryTypeWarningsChange: (warnings: string[]) => void
  description?: string
}

export default function IncidentConfigurationCard({
  priority,
  entryType,
  timeOfOccurrence,
  timeLogged,
  retrospectiveJustification,
  onPriorityChange,
  onEntryTypeChange,
  onTimeOfOccurrenceChange,
  onTimeLoggedChange,
  onRetrospectiveJustificationChange,
  showAdvancedTimestamps,
  onShowAdvancedTimestampsChange,
  entryTypeWarnings,
  onEntryTypeWarningsChange,
  description,
}: IncidentConfigurationCardProps) {
  const [analyzing, setAnalyzing] = useState(false)

  const handleAssessRisk = async () => {
    if (!description) return
    setAnalyzing(true)
    try {
      const systemPrompt = `You are a risk assessment analyst for event management. Analyze the incident description and suggest an appropriate priority level based on these criteria:

PRIORITY GUIDELINES:
- LOW: Minor incidents, routine matters, no immediate threat (e.g., lost property, minor noise complaints, general inquiries)
- MEDIUM: Requires attention but not urgent, standard response needed (e.g., minor medical assistance, non-violent disputes, routine welfare checks, minor injuries like cuts/sprains)
- HIGH: Significant risk, requires immediate attention, potential for escalation (e.g., aggressive behavior, crowd control issues, serious medical incidents requiring ambulance, security threats)
- URGENT: Life-threatening or critical security breach, requires immediate response (e.g., cardiac arrest, major security incident, fire, active violence, mass casualty)

MEDICAL INCIDENTS:
- Minor injuries (cuts, bruises, sprains, twisted ankle, minor falls): MEDIUM
- Serious injuries requiring ambulance (broken bones, head injuries, severe bleeding): HIGH
- Life-threatening (cardiac arrest, unconscious, severe trauma): URGENT

Return JSON with "risk_score" (1-10), "reasoning" (string explaining why this priority), and "suggested_priority" (low/medium/high/urgent).`
      const result = await callOpenAI(`Assess risk for: ${description}`, systemPrompt, true)
      try {
        const data = JSON.parse(result)
        if (data.suggested_priority) {
          onPriorityChange(data.suggested_priority)
        }
      } catch {
        // Ignore parse errors
      }
    } finally {
      setAnalyzing(false)
    }
  }

  const getColor = (p: string) => {
    switch (p.toLowerCase()) {
      case 'high':
        return 'border-orange-200 bg-orange-50 text-orange-800'
      case 'urgent':
        return 'border-red-200 bg-red-50 text-red-800'
      default:
        return 'border-slate-200 bg-white dark:bg-slate-900'
    }
  }

  return (
    <div className={`${
      priority === 'high' ? 'border-l-4 border-l-red-500 pl-4' : ''
    }`} role="region" aria-labelledby="configuration-title">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center">
          <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>
        <h3 id="configuration-title" className="text-sm font-semibold text-gray-900 dark:text-white">Incident Configuration</h3>
      </div>
      <div className={`rounded-xl border shadow-sm p-4 flex items-center justify-between transition-colors ${getColor(priority)}`}>
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium">Priority Level</span>
          {description && (
            <button
              onClick={handleAssessRisk}
              disabled={analyzing}
              className="flex items-center gap-1 text-[10px] bg-white/50 border border-black/10 px-2 py-1 rounded-full hover:bg-white/80 transition-colors"
            >
              {analyzing ? (
                <>
                  <ArrowPathIcon className="w-3 h-3 animate-spin" />
                  Assessing...
                </>
              ) : (
                <>
                  <ExclamationTriangleIcon className="w-3 h-3" />
                  Assess
                </>
              )}
            </button>
          )}
        </div>
        <select
          value={priority}
          onChange={(e) => onPriorityChange(e.target.value)}
          className="rounded-lg border-black/10 bg-white/50 text-sm p-2 cursor-pointer font-semibold"
        >
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="urgent">Urgent</option>
        </select>
      </div>
      
      {/* Entry Type Section */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Entry Type
          <span className="ml-1 text-gray-400" title="Select whether this is being logged in real-time or retrospectively">ⓘ</span>
        </label>
        <div className="flex gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="entry_type"
              value="contemporaneous"
              checked={entryType === 'contemporaneous'}
              onChange={(e) => {
                onEntryTypeChange(e.target.value as EntryType)
                onEntryTypeWarningsChange([])
              }}
              className="text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">⏱️ Contemporaneous (Real-time)</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="entry_type"
              value="retrospective"
              checked={entryType === 'retrospective'}
              onChange={(e) => {
                onEntryTypeChange(e.target.value as EntryType)
                onShowAdvancedTimestampsChange(true)
              }}
              className="text-amber-600 focus:ring-amber-500"
            />
            <span className="text-sm text-gray-700">🕓 Retrospective (Delayed)</span>
          </label>
        </div>
        <p className="text-xs text-gray-500 mt-1">
          {entryType === 'contemporaneous' 
            ? 'This entry is being logged in real-time or shortly after the incident'
            : 'This entry is being logged after a significant delay from when the incident occurred'
          }
        </p>
      </div>

      {/* Retrospective Justification (Conditional) */}
      {entryType === 'retrospective' && (
        <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <label htmlFor="retro-justification" className="block text-sm font-medium text-amber-800 mb-2">
            Retrospective Justification *
          </label>
          <textarea
            id="retro-justification"
            value={retrospectiveJustification || ''}
            onChange={(e) => onRetrospectiveJustificationChange(e.target.value)}
            placeholder="Explain why this entry is being logged retrospectively (e.g., 'Live comms prevented immediate logging')"
            rows={2}
            className="w-full rounded-md border border-amber-300 px-3 py-2 text-sm text-gray-900 bg-white dark:bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-sm font-sans"
            required
          />
          <p className="text-xs text-amber-700 mt-1">Required for retrospective entries</p>
        </div>
      )}

      {/* Advanced Timestamps (Collapsible) */}
      {(showAdvancedTimestamps || entryType === 'retrospective') && (
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <button
            type="button"
            onClick={() => onShowAdvancedTimestampsChange(!showAdvancedTimestamps)}
            className="flex items-center gap-2 text-sm font-medium text-blue-800 mb-3"
          >
            {showAdvancedTimestamps ? '▼' : '▶'} Advanced Timestamps
          </button>
          {showAdvancedTimestamps && (
            <div className="space-y-3">
              <div>
                <label htmlFor="time-occurred" className="block text-xs font-medium text-blue-800 mb-1">
                  Time of Occurrence
                </label>
                <input
                  id="time-occurred"
                  type="datetime-local"
                  value={timeOfOccurrence?.slice(0, 16) || ''}
                  onChange={(e) => {
                    const newTime = e.target.value ? new Date(e.target.value).toISOString() : new Date().toISOString()
                    onTimeOfOccurrenceChange(newTime)

                    // Validate entry type
                    const validation = validateEntryType(
                      new Date(newTime),
                      new Date(timeLogged || new Date().toISOString()),
                      entryType || 'contemporaneous'
                    )
                    onEntryTypeWarningsChange(validation.warnings)
                  }}
                  className="w-full rounded-md border border-blue-300 px-3 py-2 text-sm text-gray-900 bg-white dark:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm font-sans"
                />
              </div>
              <div>
                <label htmlFor="time-logged" className="block text-xs font-medium text-blue-800 mb-1">
                  Time Logged
                </label>
                <input
                  id="time-logged"
                  type="datetime-local"
                  value={timeLogged?.slice(0, 16) || ''}
                  onChange={(e) => {
                    const newTime = e.target.value ? new Date(e.target.value).toISOString() : new Date().toISOString()
                    onTimeLoggedChange(newTime)
                  }}
                  className="w-full rounded-md border border-blue-300 px-3 py-2 text-sm text-gray-900 bg-white dark:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm font-sans"
                  disabled
                />
                <p className="text-xs text-blue-600 mt-1">Auto-set to current time</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Entry Type Warnings */}
      {entryTypeWarnings.length > 0 && (
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex gap-2">
            <svg className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div className="flex-1">
              <p className="text-sm font-semibold text-yellow-800 mb-1">Entry Type Warning</p>
              {entryTypeWarnings.map((warning, idx) => (
                <p key={idx} className="text-xs text-yellow-700">{warning}</p>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

