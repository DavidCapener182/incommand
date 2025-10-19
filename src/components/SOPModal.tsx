'use client'

import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { XMarkIcon, ClipboardDocumentListIcon, CheckIcon, ArrowPathIcon } from '@heroicons/react/24/outline'
import type { IncidentSOPStep } from '@/types/sop'

interface SOPModalProps {
  isOpen: boolean
  onClose: () => void
  incidentType: string
  steps: IncidentSOPStep[]
  isLoading: boolean
  error?: string | null
  onCopyStep: (step: IncidentSOPStep) => void
  onCopyAll?: (steps: IncidentSOPStep[]) => void
}

export default function SOPModal({
  isOpen,
  onClose,
  incidentType,
  steps,
  isLoading,
  error,
  onCopyStep,
  onCopyAll
}: SOPModalProps) {
  const [completed, setCompleted] = useState<Record<string, boolean>>({})

  useEffect(() => {
    if (isOpen) {
      setCompleted({})
    }
  }, [isOpen, incidentType])

  const requiredSteps = useMemo(() => steps.filter(step => step.is_required), [steps])

  const handleToggleComplete = (step: IncidentSOPStep) => {
    setCompleted(prev => ({
      ...prev,
      [step.id]: !prev[step.id]
    }))
  }

  const handleCopyAll = () => {
    if (onCopyAll) {
      onCopyAll(steps)
      return
    }
    steps.forEach(onCopyStep)
  }

  if (!isOpen) {
    return null
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
        <motion.div
          className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        />

        <motion.div
          className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#0f172a] shadow-2xl"
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
        >
          <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-gray-200 dark:border-gray-700 bg-white/95 dark:bg-[#0f172a]/95 px-6 py-5 backdrop-blur">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-blue-500/15 p-2">
                <ClipboardDocumentListIcon className="h-6 w-6 text-blue-500" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Standard Operating Procedure</h2>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  {incidentType} • {steps.length} steps
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-[#141d3a]"
              aria-label="Close SOP modal"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>

          <div className="px-6 py-5 space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600 dark:text-gray-300">
                <span className="module-pill-info">Dynamic guidance</span>
                {requiredSteps.length > 0 && (
                  <span className="module-pill-warning">{requiredSteps.length} required</span>
                )}
              </div>
              {steps.length > 0 && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCopyAll}
                    className="button-secondary text-sm"
                  >
                    Copy all steps
                  </button>
                </div>
              )}
            </div>

            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 dark:border-red-500/40 dark:bg-red-500/10 dark:text-red-200">
                {error}
              </div>
            )}

            {isLoading && (
              <div className="incident-map-loading">
                <ArrowPathIcon className="h-5 w-5 animate-spin" />
                <span>Loading SOP steps…</span>
              </div>
            )}

            {!isLoading && steps.length === 0 && !error && (
              <div className="module-empty">
                No SOP steps configured yet for this incident type. Add steps in the vendor portal to see them here.
              </div>
            )}

            {!isLoading && steps.length > 0 && (
              <div className="space-y-3">
                {steps.map((step) => {
                  const isComplete = !!completed[step.id]
                  return (
                    <div key={step.id} className="sop-modal-step" aria-live="polite">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-gray-900 dark:text-white">Step {step.step_order}</span>
                          {step.is_required && (
                            <span className="module-pill-warning">Required</span>
                          )}
                        </div>
                        <p className={`text-sm leading-relaxed ${isComplete ? 'text-gray-400 line-through decoration-2' : 'text-gray-700 dark:text-gray-200'}`}>
                          {step.description}
                        </p>
                      </div>
                      <div className="sop-modal-actions">
                        <button
                          type="button"
                          onClick={() => handleToggleComplete(step)}
                          className={`button-secondary text-xs ${isComplete ? '!bg-emerald-500/20 !text-emerald-300' : ''}`}
                        >
                          <span className="flex items-center gap-1">
                            <CheckIcon className="h-4 w-4" />
                            {isComplete ? 'Completed' : 'Mark complete'}
                          </span>
                        </button>
                        <button
                          type="button"
                          onClick={() => onCopyStep(step)}
                          className="button-primary text-xs"
                        >
                          Add to guided actions
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
