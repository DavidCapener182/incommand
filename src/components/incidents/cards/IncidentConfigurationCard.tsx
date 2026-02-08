'use client'

import React, { useState } from 'react'
import { ExclamationTriangleIcon, ArrowPathIcon, Cog6ToothIcon } from '@heroicons/react/24/outline'
import type { EntryType } from '../../../types/auditableLog'
import { validateEntryType } from '../../../lib/auditableLogging'
import { callOpenAI } from '@/services/incidentAIService'
import { CardFrame, CardHeader } from '@/components/ui/InCommandCard'

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
        return 'border-orange-200 bg-orange-50/80 text-orange-800'
      case 'urgent':
        return 'border-red-200 bg-red-50/80 text-red-800'
      default:
        return 'border-slate-200 bg-white'
    }
  }

  return (
    <CardFrame
      className={priority === 'high' ? 'ring-1 ring-red-200' : ''}
      role="region"
      aria-labelledby="configuration-title"
    >
      <CardHeader
        icon={Cog6ToothIcon}
        title="Incident Configuration"
        titleId="configuration-title"
        variant="amber"
      />
      <div className="space-y-4">
        <div className={`flex items-center justify-between rounded-xl border p-4 shadow-sm transition-colors ${getColor(priority)}`}>
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold text-slate-700">Priority Level</span>
          {description && (
            <button
              onClick={handleAssessRisk}
              disabled={analyzing}
              className="flex items-center gap-1 rounded-full border border-black/10 bg-white/70 px-2.5 py-1 text-[10px] font-medium transition-colors hover:bg-white disabled:opacity-60"
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
          className="cursor-pointer rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10"
        >
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="urgent">Urgent</option>
        </select>
      </div>
      
      {/* Entry Type Section */}
        <div className="rounded-xl border border-slate-200 bg-slate-50/55 p-4">
        <label className="mb-2 block text-sm font-semibold text-slate-700">
          Entry Type
          <span className="ml-1 text-slate-400" title="Select whether this is being logged in real-time or retrospectively">ⓘ</span>
        </label>
        <div className="flex flex-col gap-2 md:flex-row md:gap-4">
          <label className="flex cursor-pointer items-center gap-2 rounded-lg bg-white px-2.5 py-2 shadow-sm">
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
            <span className="text-sm text-slate-700">⏱️ Contemporaneous (Real-time)</span>
          </label>
          <label className="flex cursor-pointer items-center gap-2 rounded-lg bg-white px-2.5 py-2 shadow-sm">
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
            <span className="text-sm text-slate-700">🕓 Retrospective (Delayed)</span>
          </label>
        </div>
        <p className="mt-1 text-xs text-slate-500">
          {entryType === 'contemporaneous' 
            ? 'This entry is being logged in real-time or shortly after the incident'
            : 'This entry is being logged after a significant delay from when the incident occurred'
          }
        </p>
      </div>
      </div>

      {/* Retrospective Justification (Conditional) */}
      {entryType === 'retrospective' && (
        <div className="mx-5 mb-5 rounded-xl border border-amber-200 bg-amber-50 p-3">
          <label htmlFor="retro-justification" className="mb-2 block text-sm font-semibold text-amber-800">
            Retrospective Justification *
          </label>
          <textarea
            id="retro-justification"
            value={retrospectiveJustification || ''}
            onChange={(e) => onRetrospectiveJustificationChange(e.target.value)}
            placeholder="Explain why this entry is being logged retrospectively (e.g., 'Live comms prevented immediate logging')"
            rows={2}
            className="w-full rounded-lg border border-amber-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            required
          />
          <p className="mt-1 text-xs text-amber-700">Required for retrospective entries</p>
        </div>
      )}

      {/* Advanced Timestamps (Collapsible) */}
      {(showAdvancedTimestamps || entryType === 'retrospective') && (
        <div className="mx-5 mb-5 rounded-xl border border-blue-200 bg-blue-50/80 p-3">
          <button
            type="button"
            onClick={() => onShowAdvancedTimestampsChange(!showAdvancedTimestamps)}
            className="mb-3 flex items-center gap-2 text-sm font-semibold text-blue-800"
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
                  className="w-full rounded-lg border border-blue-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  className="w-full rounded-lg border border-blue-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
        <div className="mx-5 mb-5 rounded-xl border border-yellow-200 bg-yellow-50 p-3">
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
    </CardFrame>
  )
}
