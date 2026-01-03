'use client'

import React, { useState } from 'react'
import { ListBulletIcon, BookOpenIcon, SparklesIcon, ClipboardDocumentCheckIcon, CheckCircleIcon, UserMinusIcon, ArrowPathIcon } from '@heroicons/react/24/outline'
import { callOpenAI } from '@/services/incidentAIService'

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

  // Helper for dynamic textarea resizing (optional, simplified for now)
  const textareaClass = "w-full rounded-lg border-slate-200 bg-slate-50/50 text-sm focus:bg-white focus:border-blue-500 focus:ring-blue-500 transition-all resize-none p-3 min-h-[80px]"
  const inputClass = "w-full rounded-lg border-slate-200 bg-slate-50/50 text-sm focus:bg-white focus:border-blue-500 focus:ring-blue-500 transition-all h-10 px-3"

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      
      {/* Header */}
      <div className="px-5 py-3 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2">
        <div className="bg-indigo-100 p-1.5 rounded-md text-indigo-600">
          <ListBulletIcon className="h-4 w-4" />
        </div>
        <h3 className="font-semibold text-slate-800 text-sm">Detailed Information</h3>
      </div>

      <div className="p-5 space-y-5">
        
        {/* Row 1: Metadata (Headline & Source) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Headline */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
               <label htmlFor="headline" className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Headline</label>
               <div className="flex items-center gap-2">
                 <span className={`text-[10px] font-medium ${getHeadlineWordCount(headline || '') > 15 ? 'text-red-600' : 'text-slate-400'}`}>
                    {getHeadlineWordCount(headline || '')}/15 words
                 </span>
                 <button
                   onClick={handleGenerateHeadline}
                   disabled={generatingHeadline || !factsObserved}
                   className="flex items-center gap-1 text-[10px] text-blue-600 hover:text-blue-800 font-medium disabled:opacity-50"
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
            <label htmlFor="source" className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Source</label>
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
               <label htmlFor="facts" className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Facts Observed</label>
               <div className="flex items-center gap-2">
                 {factualValidationWarnings.length > 0 && (
                   <span className="text-[10px] text-amber-600 flex items-center gap-1 bg-amber-50 px-2 py-0.5 rounded-full">
                     ⚠️ Review Language
                   </span>
                 )}
                 <button
                   onClick={handleAnonymize}
                   disabled={anonymizing || !factsObserved}
                   className="flex items-center gap-1 text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full hover:bg-slate-200 transition-colors disabled:opacity-50"
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
                   className="flex items-center gap-1 text-[10px] bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full hover:bg-purple-100 transition-colors disabled:opacity-50"
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
              className={`${textareaClass} focus:ring-2 focus:ring-purple-500/20`}
              rows={3}
            />
            {/* Validation Warnings */}
            {factualValidationWarnings.length > 0 && (
              <div className="text-xs text-amber-700 bg-amber-50 p-2 rounded-md border border-amber-100">
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
               <label htmlFor="actions" className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Actions Taken</label>
               
               {/* Action Helpers */}
               <div className="flex gap-2">
                  {showSOPButton && (
                    <button
                      type="button"
                      onClick={onShowSOPModal}
                      disabled={sopLoading}
                      className="flex items-center gap-1 text-[10px] font-medium text-indigo-600 hover:bg-indigo-50 px-2 py-0.5 rounded transition-colors"
                    >
                      <BookOpenIcon className="h-3 w-3" />
                      {sopLoading ? 'Loading...' : 'View SOP'}
                    </button>
                  )}
                  {incidentType && hasGuidedActions(incidentType) && (
                    <button
                      type="button"
                      onClick={onShowGuidedActions}
                      className="flex items-center gap-1 text-[10px] font-medium text-blue-600 hover:bg-blue-50 px-2 py-0.5 rounded transition-colors"
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
                      className="px-2 py-0.5 text-[10px] font-medium bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 hover:text-blue-800 transition-colors cursor-pointer border border-blue-200 flex items-center gap-1 group"
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
            <label htmlFor="outcome" className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Current Outcome</label>
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
                 <div className="mt-3 p-3 bg-slate-50 border border-slate-200 rounded-md text-xs font-mono text-slate-700 whitespace-pre-wrap leading-relaxed">
                    {generateStructuredOccurrence({
                      headline, source, facts_observed: factsObserved, actions_taken: actionsTaken, outcome, use_structured_template: true
                    })}
                 </div>
              </details>
           </div>
        )}

      </div>
    </div>
  )
}