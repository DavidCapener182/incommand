'use client'

import React, { useState } from 'react'
import { ListBulletIcon, BookOpenIcon, SparklesIcon, ClipboardDocumentCheckIcon, CheckCircleIcon, UserMinusIcon, ArrowPathIcon } from '@heroicons/react/24/outline'
import { callOpenAI } from '@/services/incidentAIService'
import { CardFrame, CardHeader } from '@/components/ui/InCommandCard'

export interface DetailedInformationCardProps {
  headline: string | undefined
  source: string | undefined
  factsObserved: string | undefined
  actionsTaken: string | undefined
  outcome: string | undefined
  incidentType: string
  onHeadlineChange: (value: string) => void
  onSourceChange: (value: string) => void
  onFactsObservedChange: (value: string) => void
  onActionsTakenChange: (value: string) => void
  onOutcomeChange: (value: string) => void
  getHeadlineWordCount: (text: string) => number
  factualValidationWarnings: string[]
  onFactualValidationWarningsChange: (warnings: string[]) => void
  validateFactualLanguage: (text: string) => { warnings: string[]; isFactual: boolean }
  generateStructuredOccurrence: (data: {
    headline?: string
    source?: string
    facts_observed?: string
    actions_taken?: string
    outcome?: string
    use_structured_template?: boolean
    occurrence?: string
  }) => string
  showSOPButton: boolean
  sopLoading: boolean
  onShowSOPModal: () => void
  hasGuidedActions: (incidentType: string) => boolean
  onShowGuidedActions: () => void
  guidedActionsGenerated: boolean
}

export default function DetailedInformationCard({
  headline,
  source,
  factsObserved,
  actionsTaken,
  outcome,
  incidentType,
  onHeadlineChange,
  onSourceChange,
  onFactsObservedChange,
  onActionsTakenChange,
  onOutcomeChange,
  getHeadlineWordCount,
  factualValidationWarnings,
  onFactualValidationWarningsChange,
  validateFactualLanguage,
  generateStructuredOccurrence,
  showSOPButton,
  sopLoading,
  onShowSOPModal,
  hasGuidedActions,
  onShowGuidedActions,
  guidedActionsGenerated,
}: DetailedInformationCardProps) {
  const [refining, setRefining] = useState(false)
  const [anonymizing, setAnonymizing] = useState(false)
  const [generatingHeadline, setGeneratingHeadline] = useState(false)

  const handleAnonymize = async () => {
    if (!factsObserved) return
    setAnonymizing(true)
    try {
      const systemPrompt = `You are anonymizing an incident report. Replace names, personal identifiers, and specific identifying details with generic terms (e.g., "Subject A", "Person B", "Individual"). Maintain the factual content and structure.`
      const result = await callOpenAI(`Anonymize this text: ${factsObserved}`, systemPrompt, false)
      onFactsObservedChange(result)
    } catch (e) {
      console.error('Anonymization error:', e)
    } finally {
      setAnonymizing(false)
    }
  }

  const handleGenerateHeadline = async () => {
    if (!factsObserved) return
    setGeneratingHeadline(true)
    try {
      const systemPrompt = `You are generating a concise headline (max 15 words) for an incident report. Extract the key incident type and location. Return only the headline text.`
      const result = await callOpenAI(`Generate headline for: ${factsObserved}`, systemPrompt, false)
      onHeadlineChange(result.trim())
    } catch (e) {
      console.error('Headline generation error:', e)
    } finally {
      setGeneratingHeadline(false)
    }
  }

  const textareaClass = "min-h-[90px] w-full resize-none rounded-xl border border-slate-200 bg-slate-50/70 p-3 text-sm text-slate-800 shadow-sm transition-all placeholder:text-slate-400 hover:border-slate-300 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
  const inputClass = "h-11 w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3 text-sm text-slate-800 shadow-sm transition-all placeholder:text-slate-400 hover:border-slate-300 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"

  return (
    <CardFrame>
      <CardHeader
        icon={ListBulletIcon}
        title="Detailed Information"
        variant="indigo"
      />
      <div className="space-y-5">
        
        {/* Row 1: Metadata (Headline & Source) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Headline */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
               <label htmlFor="headline" className="text-xs font-semibold uppercase tracking-wide text-slate-500">Headline</label>
               <div className="flex items-center gap-2">
                 <span className={`text-[10px] font-medium ${getHeadlineWordCount(headline || '') > 15 ? 'text-red-600' : 'text-slate-400'}`}>
                    {getHeadlineWordCount(headline || '')}/15 words
                 </span>
                 <button
                   onClick={handleGenerateHeadline}
                   disabled={generatingHeadline || !factsObserved}
                   className="flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-600 transition-colors hover:bg-blue-100 hover:text-blue-800 disabled:opacity-50"
                 >
                   {generatingHeadline ? (
                     <>
                       <ArrowPathIcon className="w-3 h-3 animate-spin" />
                       Generating...
                     </>
                   ) : (
                     <>
                       <SparklesIcon className="w-3 h-3" />
                       Auto-Generate
                     </>
                   )}
                 </button>
               </div>
            </div>
            <input
              id="headline"
              type="text"
              value={headline || ''}
              onChange={(e) => onHeadlineChange(e.target.value)}
              placeholder="e.g., Medical incident at North Gate"
              className={inputClass}
              maxLength={150}
            />
          </div>

          {/* Source */}
          <div className="space-y-1.5">
            <label htmlFor="source" className="text-xs font-semibold uppercase tracking-wide text-slate-500">Source</label>
            <input
              id="source"
              type="text"
              value={source || ''}
              onChange={(e) => onSourceChange(e.target.value)}
              placeholder="e.g., CCTV, Steward 12, Radio"
              className={inputClass}
            />
          </div>
        </div>

        <div className="h-px bg-slate-100" />

        {/* Row 2: Core Narrative */}
        <div className="space-y-5">
          
          {/* Facts Observed */}
          <div className="space-y-1.5 relative group">
            <div className="flex justify-between items-end mb-1">
               <label htmlFor="facts" className="text-xs font-semibold uppercase tracking-wide text-slate-500">Facts Observed</label>
               <div className="flex items-center gap-2">
                 {factualValidationWarnings.length > 0 && (
                   <span className="flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-600">
                     ⚠️ Review Language
                   </span>
                 )}
                 <button
                   onClick={handleAnonymize}
                   disabled={anonymizing || !factsObserved}
                   className="flex items-center gap-1 rounded-full border border-slate-200 bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-700 transition-colors hover:bg-slate-200 disabled:opacity-50"
                   title="Anonymize Names"
                 >
                   {anonymizing ? (
                     <>
                       <ArrowPathIcon className="w-3 h-3 animate-spin" />
                       ...
                     </>
                   ) : (
                     <>
                       <UserMinusIcon className="w-3 h-3" />
                       Anonymize
                     </>
                   )}
                 </button>
                 <button
                   onClick={() => {
                     if (!factsObserved) return
                     setRefining(true)
                     callOpenAI(
                       `Rewrite this incident log to be more professional and clear while preserving all important information: ${factsObserved}`,
                       `You are refining an incident report. Improve clarity and professionalism while preserving ALL facts, details, and information. Do not add, remove, or change any factual content.`,
                       false
                     )
                       .then((result) => {
                         onFactsObservedChange(result)
                       })
                       .catch((e) => console.error('Refine error:', e))
                       .finally(() => setRefining(false))
                   }}
                   disabled={refining || !factsObserved}
                   className="flex items-center gap-1 rounded-full border border-purple-200 bg-purple-50 px-2 py-0.5 text-[10px] font-medium text-purple-700 transition-colors hover:bg-purple-100 disabled:opacity-50"
                 >
                   {refining ? (
                     <>
                       <ArrowPathIcon className="w-3 h-3 animate-spin" />
                       Refining...
                     </>
                   ) : (
                     <>
                       <SparklesIcon className="w-3 h-3" />
                       Magic Refine
                     </>
                   )}
                 </button>
               </div>
            </div>
            <textarea
              id="facts"
              value={factsObserved || ''}
              onChange={(e) => {
                const val = e.target.value
                onFactsObservedChange(val)
                const validation = validateFactualLanguage(val)
                onFactualValidationWarningsChange(validation.warnings)
              }}
              placeholder="Describe exactly what was observed (who, what, where). Avoid opinions."
              className={`${textareaClass} focus:ring-purple-500/20`}
              rows={3}
            />
            {/* Validation Warnings */}
            {factualValidationWarnings.length > 0 && (
              <div className="rounded-lg border border-amber-100 bg-amber-50 p-2 text-xs text-amber-700">
                <p className="font-medium mb-1">Language check:</p>
                <ul className="list-disc list-inside space-y-0.5 opacity-90">
                  {factualValidationWarnings.map((w, i) => <li key={i}>{w}</li>)}
                </ul>
              </div>
            )}
          </div>

          {/* Actions Taken */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
               <label htmlFor="actions" className="text-xs font-semibold uppercase tracking-wide text-slate-500">Actions Taken</label>
               
               {/* Action Helpers */}
               <div className="flex gap-2">
                  {showSOPButton && (
                    <button
                      type="button"
                      onClick={onShowSOPModal}
                      disabled={sopLoading}
                      className="flex items-center gap-1 rounded-full border border-indigo-200 bg-indigo-50 px-2 py-0.5 text-[10px] font-medium text-indigo-600 transition-colors hover:bg-indigo-100"
                    >
                      <BookOpenIcon className="h-3 w-3" />
                      {sopLoading ? 'Loading...' : 'View SOP'}
                    </button>
                  )}
                  {incidentType && hasGuidedActions(incidentType) && (
                    <button
                      type="button"
                      onClick={onShowGuidedActions}
                      className="flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-[10px] font-medium text-blue-600 transition-colors hover:bg-blue-100"
                    >
                      <SparklesIcon className="h-3 w-3" />
                      Guided Actions
                    </button>
                  )}
               </div>
            </div>
            <textarea
              id="actions"
              value={actionsTaken || ''}
              onChange={(e) => onActionsTakenChange(e.target.value)}
              placeholder="Chronological list of actions taken by staff."
              className={textareaClass}
              rows={3}
            />
            {/* Removable Tags Display */}
            {actionsTaken && (() => {
              // Extract tags (words starting with #)
              const tagRegex = /#(\w+)/g
              const matches = [...actionsTaken.matchAll(tagRegex)]
              const tags = Array.from(new Set(matches.map(m => m[0]))) // Remove duplicates
              
              if (tags.length === 0) return null
              
              return (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {tags.map((tag, idx) => (
                    <button
                      key={idx}
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        // Remove this specific tag from the text (handle multiple occurrences)
                        const tagRegex = new RegExp(`\\s*${tag.replace('#', '\\#')}\\s*`, 'g')
                        const newText = actionsTaken.replace(tagRegex, ' ').replace(/\s+/g, ' ').trim()
                        onActionsTakenChange(newText)
                      }}
                      className="group flex cursor-pointer items-center gap-1 rounded-md border border-blue-200 bg-blue-100 px-2 py-0.5 text-[10px] font-medium text-blue-700 transition-colors hover:bg-blue-200 hover:text-blue-800"
                      title="Click to remove"
                    >
                      {tag}
                      <span className="text-blue-500 group-hover:text-blue-700 opacity-70 group-hover:opacity-100 transition-opacity text-xs">×</span>
                    </button>
                  ))}
                </div>
              )
            })()}
            {guidedActionsGenerated && (
               <p className="text-[10px] text-emerald-600 flex items-center gap-1">
                 <CheckCircleIcon className="h-3 w-3" /> Actions generated from best practices
               </p>
            )}
          </div>

          {/* Outcome */}
          <div className="space-y-1.5">
            <label htmlFor="outcome" className="text-xs font-semibold uppercase tracking-wide text-slate-500">Current Outcome</label>
            <textarea
              id="outcome"
              value={outcome || ''}
              onChange={(e) => onOutcomeChange(e.target.value)}
              placeholder="Current status (e.g. Resolved, Ongoing, Handed over)."
              className={textareaClass}
              rows={2}
            />
          </div>

        </div>

        {/* Preview Toggle (Optional) */}
        {(headline || factsObserved) && (
           <div className="pt-3 mt-2 border-t border-slate-100">
              <details className="group">
                 <summary className="flex items-center gap-2 text-xs font-medium text-slate-500 cursor-pointer hover:text-slate-800 select-none">
                    <ClipboardDocumentCheckIcon className="h-4 w-4" />
                    <span>Preview Log Entry</span>
                 </summary>
                 <div className="mt-3 whitespace-pre-wrap rounded-lg border border-slate-200 bg-slate-50 p-3 font-mono text-xs leading-relaxed text-slate-700">
                    {generateStructuredOccurrence({
                      headline, source, facts_observed: factsObserved, actions_taken: actionsTaken, outcome, use_structured_template: true
                    })}
                 </div>
              </details>
           </div>
        )}

      </div>
    </CardFrame>
  )
}
