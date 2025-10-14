'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { XMarkIcon, SparklesIcon, CheckIcon } from '@heroicons/react/24/outline'
import { useGuidedActions, type GuidedQuestion, type IncidentData } from '@/hooks/useGuidedActions'
import greenGuideBestPractices from '@/data/greenGuideBestPractices.json'

interface GuidedActionsModalProps {
  isOpen: boolean
  onClose: () => void
  incidentType: string
  incidentData: IncidentData
  onApply: (actions: string, outcome: string) => void
}

export default function GuidedActionsModal({
  isOpen,
  onClose,
  incidentType,
  incidentData,
  onApply
}: GuidedActionsModalProps) {
  const [userAnswers, setUserAnswers] = useState<Record<string, any>>({})
  const [generatedResult, setGeneratedResult] = useState<{ actions: string; outcome: string } | null>(null)
  const [showPreview, setShowPreview] = useState(false)
  const [customOtherActions, setCustomOtherActions] = useState('')

  const {
    generateGuidedActions,
    getQuestionsForIncidentType,
    isLoading,
    error
  } = useGuidedActions()

  const questions = getQuestionsForIncidentType(incidentType)
  const guide = (greenGuideBestPractices as any)[incidentType]

  // Reset state when modal opens/closes or incident type changes
  useEffect(() => {
    if (isOpen) {
      setUserAnswers({})
      setGeneratedResult(null)
      setShowPreview(false)
      setCustomOtherActions('')
    }
  }, [isOpen, incidentType])

  const handleAnswerChange = (questionId: string, value: any) => {
    setUserAnswers(prev => ({
      ...prev,
      [questionId]: value
    }))
  }

  const handleGenerate = async (skipQuestions: boolean = false) => {
    try {
      const result = await generateGuidedActions({
        incidentType,
        incidentData,
        userAnswers: skipQuestions ? {} : userAnswers
      })
      
      setGeneratedResult({
        actions: result.actions,
        outcome: result.outcome
      })
      setShowPreview(true)
    } catch (err) {
      console.error('Failed to generate guided actions:', err)
    }
  }

  const handleApply = () => {
    if (generatedResult) {
      // Combine generated actions with custom actions if provided
      const combinedActions = customOtherActions.trim() 
        ? `${generatedResult.actions}\n\nAdditional Actions: ${customOtherActions.trim()}`
        : generatedResult.actions
      
      onApply(combinedActions, generatedResult.outcome)
      onClose()
    }
  }

  const handleEdit = (field: 'actions' | 'outcome', value: string) => {
    if (generatedResult) {
      setGeneratedResult({
        ...generatedResult,
        [field]: value
      })
    }
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-gray-900 rounded-xl shadow-2xl border border-gray-700"
        >
          {/* Header */}
          <div className="sticky top-0 z-10 bg-gray-900 border-b border-gray-700 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/10 rounded-lg">
                  <SparklesIcon className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-white">Guided Actions Builder</h2>
                  <p className="text-sm text-gray-400">{incidentType} - Green Guide Assisted</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
                aria-label="Close"
              >
                <XMarkIcon className="w-5 h-5 text-gray-400" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            {!showPreview ? (
              <>
                {/* Summary */}
                {guide?.summary && (
                  <div className="mb-6 p-4 bg-blue-500/5 border border-blue-500/20 rounded-lg">
                    <h3 className="text-sm font-semibold text-blue-400 mb-2">Green Guide Best Practices</h3>
                    <ul className="space-y-1">
                      {guide.summary.map((item: string, idx: number) => (
                        <li key={idx} className="text-sm text-gray-300 flex items-start gap-2">
                          <span className="text-blue-400 mt-0.5">•</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Questions */}
                {questions.length > 0 ? (
                  <div className="space-y-4 mb-6">
                    <h3 className="text-sm font-semibold text-white">Additional Details (Optional)</h3>
                    <p className="text-xs text-gray-400 -mt-2">
                      Answer these questions for more accurate suggestions, or skip to generate based on incident data only.
                    </p>
                    
                    {questions.map((question) => (
                      <div key={question.id} className="space-y-2">
                        <label className="block text-sm font-medium text-gray-300">
                          {question.text}
                        </label>
                        
                        {question.type === 'boolean' && (
                          <div className="flex gap-3">
                            <button
                              onClick={() => handleAnswerChange(question.id, true)}
                              className={`flex-1 px-4 py-2 rounded-lg border transition-colors ${
                                userAnswers[question.id] === true
                                  ? 'bg-green-500/20 border-green-500 text-green-400'
                                  : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-600'
                              }`}
                            >
                              Yes
                            </button>
                            <button
                              onClick={() => handleAnswerChange(question.id, false)}
                              className={`flex-1 px-4 py-2 rounded-lg border transition-colors ${
                                userAnswers[question.id] === false
                                  ? 'bg-red-500/20 border-red-500 text-red-400'
                                  : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-600'
                              }`}
                            >
                              No
                            </button>
                          </div>
                        )}

                        {question.type === 'text' && (
                          <input
                            type="text"
                            value={userAnswers[question.id] || ''}
                            onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                            className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                            placeholder="Enter details..."
                          />
                        )}

                        {question.type === 'select' && question.options && (
                          <select
                            value={userAnswers[question.id] || ''}
                            onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                            className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                          >
                            <option value="">Select an option...</option>
                            {question.options.map((option) => (
                              <option key={option} value={option}>
                                {option}
                              </option>
                            ))}
                          </select>
                        )}

                        {question.type === 'number' && (
                          <input
                            type="number"
                            value={userAnswers[question.id] || ''}
                            onChange={(e) => handleAnswerChange(question.id, parseInt(e.target.value) || '')}
                            className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                            placeholder={question.placeholder || "Enter number..."}
                            min="0"
                          />
                        )}

                        {question.type === 'multiselect' && question.options && (
                          <div className="space-y-2">
                            {question.options.map((option) => (
                              <label key={option} className="flex items-center gap-3 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={userAnswers[question.id]?.includes(option) || false}
                                  onChange={(e) => {
                                    const currentValues = userAnswers[question.id] || [];
                                    if (e.target.checked) {
                                      handleAnswerChange(question.id, [...currentValues, option]);
                                    } else {
                                      handleAnswerChange(question.id, currentValues.filter((v: string) => v !== option));
                                    }
                                  }}
                                  className="h-4 w-4 rounded border-gray-600 bg-gray-800 text-blue-500 focus:ring-blue-500 focus:ring-2"
                                />
                                <span className="text-sm text-gray-300">{option}</span>
                              </label>
                            ))}
                            {question.options.includes('Other') && (
                              <div className="ml-7 mt-2">
                                <input
                                  type="text"
                                  value={userAnswers[`${question.id}_other`] || ''}
                                  onChange={(e) => handleAnswerChange(`${question.id}_other`, e.target.value)}
                                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 text-sm"
                                  placeholder="Specify other..."
                                />
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="mb-6 p-4 bg-gray-800/50 border border-gray-700 rounded-lg">
                    <p className="text-sm text-gray-400">
                      No additional questions for this incident type. Click Generate to create suggestions based on your incident data.
                    </p>
                  </div>
                )}

                {/* Error */}
                {error && (
                  <div className="mb-4 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                    <p className="text-sm text-red-400">{error}</p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-3">
                  {questions.length > 0 && (
                    <button
                      onClick={() => handleGenerate(true)}
                      disabled={isLoading}
                      className="flex-1 px-4 py-3 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed border border-gray-700"
                    >
                      {isLoading ? 'Generating...' : 'Skip & Generate'}
                    </button>
                  )}
                  <button
                    onClick={() => handleGenerate(false)}
                    disabled={isLoading}
                    className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isLoading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <SparklesIcon className="w-5 h-5" />
                        Generate Suggestions
                      </>
                    )}
                  </button>
                </div>
              </>
            ) : (
              <>
                {/* Preview */}
                <div className="space-y-6">
                  <div className="p-4 bg-green-500/5 border border-green-500/20 rounded-lg flex items-start gap-3">
                    <CheckIcon className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <h3 className="text-sm font-semibold text-green-400 mb-1">Suggestions Generated</h3>
                      <p className="text-xs text-gray-400">
                        Review and edit the suggestions below before applying them to your incident report.
                      </p>
                    </div>
                  </div>

                  {/* Actions Taken */}
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-white">Actions Taken</label>
                    <textarea
                      value={generatedResult?.actions || ''}
                      onChange={(e) => handleEdit('actions', e.target.value)}
                      rows={4}
                      className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 resize-none"
                    />
                  </div>

                  {/* Outcome */}
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-white">Outcome</label>
                    <textarea
                      value={generatedResult?.outcome || ''}
                      onChange={(e) => handleEdit('outcome', e.target.value)}
                      rows={3}
                      className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 resize-none"
                    />
                  </div>

                  {/* Custom Other Actions */}
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-white">Additional Actions (Optional)</label>
                    <textarea
                      value={customOtherActions}
                      onChange={(e) => setCustomOtherActions(e.target.value)}
                      placeholder="Add any additional actions or details not covered by the suggestions above..."
                      rows={3}
                      className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 resize-none"
                    />
                    <p className="text-xs text-gray-400">
                      This will be appended to the Actions Taken field when you apply the suggestions.
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3">
                    <button
                      onClick={() => setShowPreview(false)}
                      className="flex-1 px-4 py-3 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors border border-gray-700"
                    >
                      Back
                    </button>
                    <button
                      onClick={handleApply}
                      className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                    >
                      <CheckIcon className="w-5 h-5" />
                      Apply to Incident
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}

