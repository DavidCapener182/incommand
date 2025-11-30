'use client'

import React from 'react'
import { ListBulletIcon, BookOpenIcon, SparklesIcon, ClipboardDocumentCheckIcon, CheckCircleIcon } from '@heroicons/react/24/outline'

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
               <span className={`text-[10px] font-medium ${getHeadlineWordCount(headline || '') > 15 ? 'text-red-600' : 'text-slate-400'}`}>
                  {getHeadlineWordCount(headline || '')}/15 words
               </span>
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
               {factualValidationWarnings.length > 0 && (
                 <span className="text-[10px] text-amber-600 flex items-center gap-1 bg-amber-50 px-2 py-0.5 rounded-full">
                   ⚠️ Review Language
                 </span>
               )}
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