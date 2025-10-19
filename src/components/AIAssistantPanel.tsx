'use client'

import React, { useState, useEffect } from 'react'
import {
  SparklesIcon,
  LightBulbIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  XMarkIcon,
  ChevronDownIcon,
  ChevronUpIcon
} from '@heroicons/react/24/outline'
import { motion, AnimatePresence } from 'framer-motion'
import { decisionSupport, type SituationAssessment, type DecisionContext } from '@/lib/ai/decisionSupport'

interface AIAssistantPanelProps {
  context: DecisionContext
  className?: string
  position?: 'sidebar' | 'floating' | 'inline'
}

const SEVERITY_CONFIG = {
  normal: {
    color: 'text-green-600 dark:text-green-400',
    bgColor: 'bg-green-100 dark:bg-green-900/30',
    borderColor: 'border-green-500',
    icon: CheckCircleIcon,
    label: 'Normal Operations'
  },
  elevated: {
    color: 'text-yellow-600 dark:text-yellow-400',
    bgColor: 'bg-yellow-100 dark:bg-yellow-900/30',
    borderColor: 'border-yellow-500',
    icon: ExclamationTriangleIcon,
    label: 'Elevated Status'
  },
  serious: {
    color: 'text-orange-600 dark:text-orange-400',
    bgColor: 'bg-orange-100 dark:bg-orange-900/30',
    borderColor: 'border-orange-500',
    icon: ExclamationTriangleIcon,
    label: 'Serious Situation'
  },
  critical: {
    color: 'text-red-600 dark:text-red-400',
    bgColor: 'bg-red-100 dark:bg-red-900/30',
    borderColor: 'border-red-500',
    icon: ExclamationTriangleIcon,
    label: 'Critical Status'
  }
}

const PRIORITY_CONFIG = {
  immediate: { color: 'bg-red-600 text-white', label: 'IMMEDIATE' },
  urgent: { color: 'bg-orange-600 text-white', label: 'URGENT' },
  consider: { color: 'bg-blue-600 text-white', label: 'CONSIDER' },
  monitor: { color: 'bg-gray-600 text-white', label: 'MONITOR' }
}

export default function AIAssistantPanel({
  context,
  className = '',
  position = 'floating'
}: AIAssistantPanelProps) {
  const [assessment, setAssessment] = useState<SituationAssessment | null>(null)
  const [isExpanded, setIsExpanded] = useState(true)
  const [expandedRecommendations, setExpandedRecommendations] = useState<Set<number>>(new Set())

  useEffect(() => {
    // Update assessment when context changes
    const newAssessment = decisionSupport.assessSituation(context)
    setAssessment(newAssessment)
  }, [context])

  const toggleRecommendation = (index: number) => {
    const newExpanded = new Set(expandedRecommendations)
    if (newExpanded.has(index)) {
      newExpanded.delete(index)
    } else {
      newExpanded.add(index)
    }
    setExpandedRecommendations(newExpanded)
  }

  if (!assessment) {
    return null
  }

  const severityConfig = SEVERITY_CONFIG[assessment.severity]
  const SeverityIcon = severityConfig.icon

  const positionClasses = {
    sidebar: 'w-full',
    floating: 'fixed bottom-4 left-4 w-96 z-40',
    inline: 'w-full'
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: position === 'floating' ? -100 : 0 }}
      animate={{ opacity: 1, x: 0 }}
      className={`${positionClasses[position]} ${className}`}
    >
      <div className="card-depth shadow-2xl overflow-hidden">
        {/* Header */}
        <div
          className="bg-gradient-to-r from-purple-600 to-indigo-700 dark:from-purple-800 dark:to-indigo-900 text-white p-4 cursor-pointer"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <SparklesIcon className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold">AI Command Assistant</h3>
                <p className="text-xs text-purple-100">Real-time decision support</p>
              </div>
            </div>
            {isExpanded ? (
              <ChevronDownIcon className="h-5 w-5" />
            ) : (
              <ChevronUpIcon className="h-5 w-5" />
            )}
          </div>
        </div>

        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: 'auto' }}
              exit={{ height: 0 }}
              className="overflow-hidden"
            >
              <div className="p-4 space-y-4">
                {/* Situation Severity */}
                <div className={`${severityConfig.bgColor} border-2 ${severityConfig.borderColor} rounded-lg p-3`}>
                  <div className="flex items-center gap-2 mb-2">
                    <SeverityIcon className={`h-5 w-5 ${severityConfig.color}`} />
                    <span className={`font-semibold ${severityConfig.color}`}>
                      {severityConfig.label}
                    </span>
                  </div>
                  <div className="text-sm text-gray-700 dark:text-gray-300">
                    Next review in {assessment.nextReview}
                  </div>
                </div>

                {/* Alerts */}
                {assessment.alerts.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                      <ExclamationTriangleIcon className="h-4 w-4" />
                      Active Alerts
                    </h4>
                    {assessment.alerts.map((alert, index) => (
                      <div
                        key={index}
                        className="text-xs bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200 p-2 rounded-lg border border-red-200 dark:border-red-800"
                      >
                        {alert}
                      </div>
                    ))}
                  </div>
                )}

                {/* Trends */}
                {assessment.trends.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                      <ChartBarIcon className="h-4 w-4" />
                      Trends
                    </h4>
                    <div className="space-y-1">
                      {assessment.trends.map((trend, index) => (
                        <div key={index} className="flex items-center justify-between text-xs">
                          <span className="text-gray-700 dark:text-gray-300">{trend.metric}</span>
                          <span className={`px-2 py-1 rounded-full font-medium ${
                            trend.direction === 'improving' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200' :
                            trend.direction === 'worsening' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200' :
                            'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                          }`}>
                            {trend.direction}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recommendations */}
                {assessment.recommendations.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                      <LightBulbIcon className="h-4 w-4" />
                      Recommendations ({assessment.recommendations.length})
                    </h4>
                    {assessment.recommendations.map((rec, index) => {
                      const isExpanded = expandedRecommendations.has(index)
                      const priorityConfig = PRIORITY_CONFIG[rec.priority]

                      return (
                        <div key={index} className="bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600">
                          <button
                            onClick={() => toggleRecommendation(index)}
                            className="w-full p-3 text-left hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors rounded-lg"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className={`px-2 py-1 rounded-full text-xs font-bold ${priorityConfig.color}`}>
                                    {priorityConfig.label}
                                  </span>
                                  <span className="text-xs text-gray-500 dark:text-gray-400">
                                    {(rec.confidence * 100).toFixed(0)}% confidence
                                  </span>
                                </div>
                                <div className="text-sm font-medium text-gray-900 dark:text-white">
                                  {rec.action}
                                </div>
                              </div>
                              {isExpanded ? (
                                <ChevronUpIcon className="h-4 w-4 text-gray-400 flex-shrink-0" />
                              ) : (
                                <ChevronDownIcon className="h-4 w-4 text-gray-400 flex-shrink-0" />
                              )}
                            </div>
                          </button>

                          <AnimatePresence>
                            {isExpanded && (
                              <motion.div
                                initial={{ height: 0 }}
                                animate={{ height: 'auto' }}
                                exit={{ height: 0 }}
                                className="overflow-hidden"
                              >
                                <div className="px-3 pb-3 space-y-3 text-xs">
                                  {/* Reasoning */}
                                  <div>
                                    <div className="font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                      Reasoning:
                                    </div>
                                    <ul className="space-y-1 text-gray-600 dark:text-gray-400">
                                      {rec.reasoning.map((reason, i) => (
                                        <li key={i} className="flex items-start gap-1">
                                          <span>•</span>
                                          <span>{reason}</span>
                                        </li>
                                      ))}
                                    </ul>
                                  </div>

                                  {/* Expected Outcome */}
                                  <div className="bg-blue-50 dark:bg-blue-900/20 p-2 rounded">
                                    <div className="font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                      Expected Outcome:
                                    </div>
                                    <div className="text-gray-600 dark:text-gray-400">
                                      {rec.expectedOutcome}
                                    </div>
                                  </div>

                                  {/* Time & Resources */}
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <span className="text-gray-500 dark:text-gray-400">Time: </span>
                                      <span className="text-gray-700 dark:text-gray-300 font-medium">
                                        {rec.estimatedTime}
                                      </span>
                                    </div>
                                    <div>
                                      <span className="text-gray-500 dark:text-gray-400">Success: </span>
                                      <span className="text-gray-700 dark:text-gray-300 font-medium">
                                        {(rec.successProbability * 100).toFixed(0)}%
                                      </span>
                                    </div>
                                  </div>

                                  {/* Required Resources */}
                                  {rec.requiredResources.length > 0 && (
                                    <div>
                                      <div className="font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                        Required:
                                      </div>
                                      <div className="flex flex-wrap gap-1">
                                        {rec.requiredResources.map((resource, i) => (
                                          <span
                                            key={i}
                                            className="px-2 py-1 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-full"
                                          >
                                            {resource}
                                          </span>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}

// Import ChartBarIcon if missing
function ChartBarIcon(props: any) {
  return (
    <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  )
}
