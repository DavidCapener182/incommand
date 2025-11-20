'use client'

import React from 'react'
import { ShieldCheckIcon, PlusSmallIcon, DocumentPlusIcon } from '@heroicons/react/24/outline'
import greenGuideBestPractices from '../../../data/greenGuideBestPractices.json'

export interface GreenGuideBestPracticesCardProps {
  incidentType: string
  showBestPracticeHints: boolean
  onShowBestPracticeHintsChange: (value: boolean) => void
  onOccurrenceAppend: (text: string) => void
  onActionsTakenAppend: (text: string) => void
}

export default function GreenGuideBestPracticesCard({
  incidentType,
  showBestPracticeHints,
  onShowBestPracticeHintsChange,
  onOccurrenceAppend,
  onActionsTakenAppend,
}: GreenGuideBestPracticesCardProps) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      
      {/* Header */}
      <div className="px-5 py-3 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="bg-emerald-100 p-1.5 rounded-md text-emerald-600">
            <ShieldCheckIcon className="h-4 w-4" />
          </div>
          <h3 id="best-practices-title" className="font-semibold text-slate-800 text-sm">Best Practices (Green Guide)</h3>
        </div>
        
        {/* Toggle Switch */}
        <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-600 hover:text-slate-900 transition-colors select-none">
          <input
            type="checkbox"
            checked={showBestPracticeHints}
            onChange={(e) => onShowBestPracticeHintsChange(e.target.checked)}
            className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 h-3.5 w-3.5"
          />
          Show
        </label>
      </div>

      {/* Content */}
      {showBestPracticeHints && (
        <div className="p-5 bg-slate-50/30 transition-all">
          {(() => {
            // @ts-ignore - JSON import typing
            const bp = incidentType ? (greenGuideBestPractices as any)[incidentType] : null
            
            if (!bp) {
              return (
                <div className="text-center py-2 px-1">
                  <p className="text-xs text-slate-500 mb-2">
                    Select a specific incident type to view brief best‑practice hints and quick‑insert templates.
                  </p>
                  <div className="flex flex-col gap-2">
                    <span className="text-[10px] text-slate-400 uppercase tracking-wide">Examples available</span>
                    <div className="flex flex-wrap justify-center gap-1">
                       {['Medical', 'Ejection', 'Refusal', 'Queue Build-Up'].map(t => (
                         <span key={t} className="px-2 py-0.5 bg-slate-100 border border-slate-200 rounded text-[10px] text-slate-600">
                           {t}
                         </span>
                       ))}
                    </div>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-200/60">
                     <a href="/green-guide" target="_blank" rel="noreferrer" className="text-xs text-emerald-600 hover:text-emerald-700 hover:underline font-medium">
                       Open Green Guide (PDF)
                     </a>
                  </div>
                </div>
              )
            }
            
            return (
              <div className="space-y-5">
                
                {/* Summary List */}
                {Array.isArray(bp.summary) && bp.summary.length > 0 && (
                  <div className="bg-emerald-50/50 border border-emerald-100 rounded-lg p-3">
                    <h4 className="text-[10px] font-bold text-emerald-800 uppercase tracking-wide mb-2">Key Actions</h4>
                    <ul className="space-y-1.5">
                      {bp.summary.slice(0, 3).map((s: string, i: number) => (
                        <li key={i} className="text-xs text-emerald-900 flex gap-2 items-start leading-relaxed">
                          <span className="block w-1 h-1 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                          {s}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Templates / Checklists */}
                {Array.isArray(bp.checklists) && bp.checklists.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wide px-1">Quick Templates</h4>
                    {bp.checklists.map((c: any, idx: number) => (
                      <div key={idx} className="group bg-white border border-slate-200 rounded-lg p-3 shadow-sm hover:border-blue-200 hover:shadow-md transition-all">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-semibold text-slate-700">{c.label}</span>
                        </div>
                        
                        <div className="flex gap-2">
                          {c.occurrence && (
                            <button
                              type="button"
                              onClick={() => onOccurrenceAppend(c.occurrence)}
                              className="flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 text-[10px] font-medium text-slate-600 bg-slate-50 hover:bg-blue-50 hover:text-blue-700 border border-slate-200 hover:border-blue-200 rounded transition-colors"
                              title="Append to Occurrence"
                            >
                              <DocumentPlusIcon className="h-3 w-3" />
                              Add Details
                            </button>
                          )}
                          {c.actions_taken && (
                            <button
                              type="button"
                              onClick={() => onActionsTakenAppend(c.actions_taken)}
                              className="flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 text-[10px] font-medium text-slate-600 bg-slate-50 hover:bg-indigo-50 hover:text-indigo-700 border border-slate-200 hover:border-indigo-200 rounded transition-colors"
                              title="Append to Actions Taken"
                            >
                              <PlusSmallIcon className="h-3 w-3" />
                              Add Action
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Footer Link */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-200/60">
                  <a href="/green-guide" target="_blank" rel="noreferrer" className="text-xs text-emerald-600 hover:underline font-medium">
                    Read Full Green Guide
                  </a>
                  {Array.isArray(bp.cautions) && bp.cautions.length > 0 && (
                    <span className="text-[10px] text-amber-600 font-medium bg-amber-50 px-2 py-0.5 rounded-full">
                      Amend, don&apos;t overwrite
                    </span>
                  )}
                </div>
              </div>
            )
          })()}
        </div>
      )}
    </div>
  )
}