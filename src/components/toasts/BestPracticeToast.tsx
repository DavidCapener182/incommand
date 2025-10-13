'use client'

import React, { useState } from 'react'
import { BestPracticePayload } from '@/types/bestPractice'

export function BestPracticeToast({
  incidentType,
  payload,
  onClose,
  onLearnMore
}: {
  incidentType: string
  payload: BestPracticePayload
  onClose?: () => void
  onLearnMore?: () => void
}) {
  const risk = payload.risk_level
  const color = risk === 'high' ? 'red' : risk === 'medium' ? 'amber' : 'blue'
  const duration = risk === 'high' ? 20000 : risk === 'medium' ? 15000 : 12000
  const [open, setOpen] = useState(false)

  return (
    <div className={`rounded-lg shadow-lg border bg-white dark:bg-[#0f1b3d] border-${color}-200 dark:border-${color}-500/50 ring-1 ring-${color}-400`}> 
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div className="flex-1">
            <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">Best practice: {incidentType}</div>
            <div className="mt-1 text-sm text-gray-800 dark:text-gray-200">{payload.summary}</div>
            {payload.citations?.length > 0 && (
              <div className="mt-1 text-xs text-gray-600 dark:text-gray-300">GG {payload.citations.join(', ')}</div>
            )}
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
        </div>
        <div className="mt-3 flex gap-2">
          <button onClick={() => setOpen(true)} className={`px-3 py-1.5 rounded bg-${color}-600 text-white text-xs hover:bg-${color}-700`}>Open checklist</button>
          {onLearnMore && (
            <button onClick={onLearnMore} className="px-3 py-1.5 rounded bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-xs hover:bg-gray-300 dark:hover:bg-gray-600">Learn more</button>
          )}
        </div>
      </div>

      {open && (
        <div className="fixed inset-0 z-[3000] flex items-center justify-center bg-black/40" role="dialog" aria-modal="true">
          <div className="bg-white dark:bg-[#0f1b3d] rounded-lg shadow-xl w-full max-w-md">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">Checklist</div>
              <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <div className="p-4">
              <ul className="list-disc pl-5 space-y-2">
                {(payload.checklist || []).slice(0, 6).map((item, idx) => (
                  <li key={idx} className="text-sm text-gray-800 dark:text-gray-200">{item}</li>
                ))}
              </ul>
            </div>
            <div className="p-3 border-t border-gray-200 dark:border-gray-700 flex items-center justify-end">
              {onLearnMore && (
                <button onClick={onLearnMore} className="mr-2 px-3 py-1.5 rounded bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-xs hover:bg-gray-300 dark:hover:bg-gray-600">Open guide</button>
              )}
              <button onClick={() => setOpen(false)} className={`px-3 py-1.5 rounded bg-${color}-600 text-white text-xs hover:bg-${color}-700`}>Done</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}


