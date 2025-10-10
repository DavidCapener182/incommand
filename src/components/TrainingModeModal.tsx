/**
 * Training Mode Modal Component
 * Allows loggists to practice incident logging without affecting live data
 */

'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  AcademicCapIcon,
  XMarkIcon,
  PlayIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  DocumentTextIcon,
  LightBulbIcon,
  EyeIcon
} from '@heroicons/react/24/outline'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from './Toast'

interface TrainingModeModalProps {
  isOpen: boolean
  onClose: () => void
}

interface TrainingScenario {
  id: string
  title: string
  description: string
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  estimatedTime: string
  learningObjectives: string[]
  scenarioData: {
    callsign_from: string
    callsign_to: string
    occurrence: string
    incident_type: string
    action_taken: string
    what3words: string
    priority: string
    entry_type: 'contemporaneous' | 'retrospective'
    retrospective_justification?: string
    time_of_occurrence?: string
  }
  expectedElements: string[]
  commonMistakes: string[]
}

const trainingScenarios: TrainingScenario[] = [
  {
    id: 'medical-basic',
    title: 'Basic Medical Incident',
    description: 'A person has collapsed near the main entrance. Practice logging this incident contemporaneously.',
    difficulty: 'beginner',
    estimatedTime: '5 minutes',
    learningObjectives: [
      'Use structured template format',
      'Write factual, objective language',
      'Include specific times and locations',
      'Avoid emotional language'
    ],
    scenarioData: {
      callsign_from: 'R3',
      callsign_to: 'Event Control',
      occurrence: 'Person collapsed near main entrance at 15:30. Crowd of approximately 15 people present. Individual appears unconscious.',
      incident_type: 'Medical',
      action_taken: 'Called medical team immediately. Security established crowd control. Area cordoned off.',
      what3words: '///table.book.page',
      priority: 'high',
      entry_type: 'contemporaneous',
      time_of_occurrence: new Date().toISOString()
    },
    expectedElements: [
      'Specific time (15:30)',
      'Exact location (main entrance)',
      'Measurable crowd size (15 people)',
      'Objective observations (appears unconscious)',
      'Clear actions taken'
    ],
    commonMistakes: [
      'Using emotional language like "terrible" or "scary"',
      'Vague locations like "near the entrance"',
      'Opinions instead of facts',
      'Missing specific times'
    ]
  },
  {
    id: 'security-retrospective',
    title: 'Security Incident - Retrospective',
    description: 'A fight broke out 20 minutes ago but you were busy with another incident. Log this retrospectively with proper justification.',
    difficulty: 'intermediate',
    estimatedTime: '8 minutes',
    learningObjectives: [
      'Understand retrospective logging requirements',
      'Provide clear justification for delay',
      'Maintain factual accuracy despite delay',
      'Use proper retrospective indicators'
    ],
    scenarioData: {
      callsign_from: 'Security Lead',
      callsign_to: 'Event Control',
      occurrence: 'Physical altercation between two individuals at food court area at 14:45. Approximately 8 people witnessed incident. Both parties appeared intoxicated.',
      incident_type: 'Security',
      action_taken: 'Security team intervened within 2 minutes. Both individuals escorted from venue. No injuries reported.',
      what3words: '///food.court.area',
      priority: 'medium',
      entry_type: 'retrospective',
      retrospective_justification: 'Live incident response prevented immediate logging. Entry made as soon as situation was resolved.',
      time_of_occurrence: new Date(Date.now() - 20 * 60 * 1000).toISOString()
    },
    expectedElements: [
      'Clear retrospective justification',
      'Accurate time of occurrence (14:45)',
      'Specific location (food court area)',
      'Objective witness count (8 people)',
      'Professional language despite delay'
    ],
    commonMistakes: [
      'Weak or missing justification',
      'Inaccurate time reporting',
      'Emotional language due to stress',
      'Forgetting to mark as retrospective'
    ]
  },
  {
    id: 'evacuation-complex',
    title: 'Complex Evacuation Scenario',
    description: 'A fire alarm has been triggered. Multiple incidents are occurring simultaneously. Practice logging the main evacuation incident.',
    difficulty: 'advanced',
    estimatedTime: '12 minutes',
    learningObjectives: [
      'Handle complex multi-incident scenarios',
      'Prioritize critical information',
      'Maintain clarity under pressure',
      'Use appropriate priority levels'
    ],
    scenarioData: {
      callsign_from: 'Fire Marshal',
      callsign_to: 'Event Control',
      occurrence: 'Fire alarm activated at 16:20 due to smoke detected in kitchen area. Full venue evacuation initiated. Estimated 2,500 people being evacuated via all exits.',
      incident_type: 'Fire/Evacuation',
      action_taken: 'Emergency services notified. All exits opened. Staff deployed to assist evacuation. Crowd flow being monitored and directed.',
      what3words: '///kitchen.fire.alarm',
      priority: 'critical',
      entry_type: 'contemporaneous',
      time_of_occurrence: new Date().toISOString()
    },
    expectedElements: [
      'Clear cause (smoke in kitchen)',
      'Specific evacuation numbers (2,500 people)',
      'All exits mentioned',
      'Emergency services notification',
      'Ongoing status updates'
    ],
    commonMistakes: [
      'Panic language or emotional terms',
      'Missing critical details',
      'Unclear evacuation procedures',
      'Incorrect priority assignment'
    ]
  }
]

export default function TrainingModeModal({ isOpen, onClose }: TrainingModeModalProps) {
  const { user } = useAuth()
  const { addToast } = useToast()
  
  const [selectedScenario, setSelectedScenario] = useState<TrainingScenario | null>(null)
  const [trainingSession, setTrainingSession] = useState<{
    scenario: TrainingScenario | null
    userEntry: any
    startTime: Date | null
    endTime: Date | null
    isActive: boolean
  }>({
    scenario: null,
    userEntry: null,
    startTime: null,
    endTime: null,
    isActive: false
  })

  const [showResults, setShowResults] = useState(false)
  const [userScore, setUserScore] = useState<{
    score: number
    feedback: string[]
    suggestions: string[]
  }>({
    score: 0,
    feedback: [],
    suggestions: []
  })

  const handleStartTraining = (scenario: TrainingScenario) => {
    setSelectedScenario(scenario)
    setTrainingSession({
      scenario,
      userEntry: null,
      startTime: new Date(),
      endTime: null,
      isActive: true
    })
    setShowResults(false)
  }

  const handleCompleteTraining = (userEntry: any) => {
    const endTime = new Date()
    const startTime = trainingSession.startTime || new Date()
    const duration = Math.round((endTime.getTime() - startTime.getTime()) / 1000 / 60) // minutes

    // Simple scoring system based on expected elements
    const score = calculateScore(userEntry, trainingSession.scenario!)
    const feedback = generateFeedback(userEntry, trainingSession.scenario!)
    const suggestions = generateSuggestions(userEntry, trainingSession.scenario!)

    setUserScore({ score, feedback, suggestions })
    setTrainingSession(prev => ({ ...prev, userEntry, endTime, isActive: false }))
    setShowResults(true)

    addToast({
      type: 'success',
      title: 'Training Completed!',
      message: `You scored ${score}% on the ${trainingSession.scenario?.title} scenario`
    })
  }

  const calculateScore = (userEntry: any, scenario: TrainingScenario): number => {
    let score = 0
    const totalElements = scenario.expectedElements.length

    // Check for expected elements in user entry
    scenario.expectedElements.forEach(element => {
      if (userEntry.occurrence?.toLowerCase().includes(element.toLowerCase()) ||
          userEntry.action_taken?.toLowerCase().includes(element.toLowerCase())) {
        score += 1
      }
    })

    // Bonus points for proper structure
    if (userEntry.entry_type === scenario.scenarioData.entry_type) score += 1
    if (userEntry.priority === scenario.scenarioData.priority) score += 1

    return Math.min(Math.round((score / (totalElements + 2)) * 100), 100)
  }

  const generateFeedback = (userEntry: any, scenario: TrainingScenario): string[] => {
    const feedback: string[] = []

    // Check for factual language
    const emotionalWords = ['terrible', 'awful', 'scary', 'chaotic', 'horrible', 'amazing', 'great']
    const hasEmotionalLanguage = emotionalWords.some(word => 
      userEntry.occurrence?.toLowerCase().includes(word) ||
      userEntry.action_taken?.toLowerCase().includes(word)
    )

    if (!hasEmotionalLanguage) {
      feedback.push('✅ Used factual, objective language')
    } else {
      feedback.push('❌ Avoid emotional language - stick to facts')
    }

    // Check for specific details
    if (userEntry.occurrence?.includes('15:') || userEntry.occurrence?.includes('14:') || userEntry.occurrence?.includes('16:')) {
      feedback.push('✅ Included specific times')
    } else {
      feedback.push('❌ Missing specific times')
    }

    // Check for measurable quantities
    if (/\d+/.test(userEntry.occurrence || '')) {
      feedback.push('✅ Included measurable quantities')
    } else {
      feedback.push('❌ Missing specific numbers or quantities')
    }

    return feedback
  }

  const generateSuggestions = (userEntry: any, scenario: TrainingScenario): string[] => {
    const suggestions: string[] = []

    // Add scenario-specific suggestions
    suggestions.push(...scenario.commonMistakes.map(mistake => `💡 ${mistake}`))

    // General suggestions based on entry
    if (!userEntry.retrospective_justification && scenario.scenarioData.entry_type === 'retrospective') {
      suggestions.push('💡 Remember to provide justification for retrospective entries')
    }

    if (userEntry.priority !== scenario.scenarioData.priority) {
      suggestions.push(`💡 Consider if this should be priority: ${scenario.scenarioData.priority}`)
    }

    return suggestions
  }

  const resetTraining = () => {
    setSelectedScenario(null)
    setTrainingSession({
      scenario: null,
      userEntry: null,
      startTime: null,
      endTime: null,
      isActive: false
    })
    setShowResults(false)
    setUserScore({ score: 0, feedback: [], suggestions: [] })
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300'
      case 'intermediate': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300'
      case 'advanced': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300'
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50"
              onClick={onClose}
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <AcademicCapIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                        Training Mode
                      </h2>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        Practice incident logging without affecting live data
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={onClose}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
                {!trainingSession.isActive && !showResults && (
                  <div>
                    <div className="mb-6">
                      <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4 mb-4">
                        <div className="flex items-start gap-3">
                          <LightBulbIcon className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                          <div className="text-sm text-amber-800 dark:text-amber-200">
                            <p className="font-semibold mb-1">Training Mode Benefits</p>
                            <ul className="space-y-1">
                              <li>• Practice without affecting live incident logs</li>
                              <li>• Receive instant feedback on your entries</li>
                              <li>• Learn from common mistakes</li>
                              <li>• Build confidence before live logging</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>

                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                      Choose a Training Scenario
                    </h3>

                    <div className="grid gap-4">
                      {trainingScenarios.map((scenario) => (
                        <div
                          key={scenario.id}
                          className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:border-blue-300 dark:hover:border-blue-600 transition-colors"
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <h4 className="text-base font-semibold text-gray-900 dark:text-white">
                                  {scenario.title}
                                </h4>
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(scenario.difficulty)}`}>
                                  {scenario.difficulty}
                                </span>
                                <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                                  <ClockIcon className="h-3 w-3" />
                                  {scenario.estimatedTime}
                                </span>
                              </div>
                              <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                                {scenario.description}
                              </p>
                              <div className="mb-3">
                                <h5 className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                  Learning Objectives:
                                </h5>
                                <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                                  {scenario.learningObjectives.map((objective, idx) => (
                                    <li key={idx} className="flex items-start gap-2">
                                      <CheckCircleIcon className="h-3 w-3 text-green-600 flex-shrink-0 mt-0.5" />
                                      {objective}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            </div>
                            <button
                              onClick={() => handleStartTraining(scenario)}
                              className="ml-4 flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
                            >
                              <PlayIcon className="h-4 w-4" />
                              Start
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {trainingSession.isActive && trainingSession.scenario && (
                  <div>
                    <div className="mb-6">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            {trainingSession.scenario.title}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-300">
                            {trainingSession.scenario.description}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                            Training Time
                          </div>
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {trainingSession.startTime && 
                              Math.floor((Date.now() - trainingSession.startTime.getTime()) / 1000 / 60)
                            } minutes
                          </div>
                        </div>
                      </div>

                      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                        <h4 className="text-sm font-semibold text-blue-800 dark:text-blue-200 mb-2">
                          Scenario Information:
                        </h4>
                        <div className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                          <p><strong>From:</strong> {trainingSession.scenario.scenarioData.callsign_from}</p>
                          <p><strong>To:</strong> {trainingSession.scenario.scenarioData.callsign_to}</p>
                          <p><strong>Type:</strong> {trainingSession.scenario.scenarioData.incident_type}</p>
                          <p><strong>Priority:</strong> {trainingSession.scenario.scenarioData.priority}</p>
                          <p><strong>Entry Type:</strong> {trainingSession.scenario.scenarioData.entry_type}</p>
                        </div>
                      </div>
                    </div>

                    {/* Training Form would go here - simplified for this example */}
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-4">
                      <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                        Practice Log Entry:
                      </h4>
                      <div className="space-y-3 text-sm text-gray-600 dark:text-gray-300">
                        <p><strong>Occurrence:</strong> {trainingSession.scenario.scenarioData.occurrence}</p>
                        <p><strong>Actions Taken:</strong> {trainingSession.scenario.scenarioData.action_taken}</p>
                        <p><strong>Location:</strong> {trainingSession.scenario.scenarioData.what3words}</p>
                        {trainingSession.scenario.scenarioData.retrospective_justification && (
                          <p><strong>Justification:</strong> {trainingSession.scenario.scenarioData.retrospective_justification}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={() => handleCompleteTraining(trainingSession.scenario!.scenarioData)}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors"
                      >
                        <CheckCircleIcon className="h-4 w-4" />
                        Submit Training Entry
                      </button>
                      <button
                        onClick={resetTraining}
                        className="px-4 py-2 text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 font-medium rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {showResults && (
                  <div>
                    <div className="mb-6">
                      <div className="text-center mb-6">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full mb-4">
                          <CheckCircleIcon className="h-8 w-8 text-green-600 dark:text-green-400" />
                        </div>
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                          Training Complete!
                        </h3>
                        <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                          {userScore.score}%
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                          Score for {trainingSession.scenario?.title}
                        </p>
                      </div>

                      <div className="grid md:grid-cols-2 gap-6">
                        <div>
                          <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                            Feedback:
                          </h4>
                          <div className="space-y-2">
                            {userScore.feedback.map((item, idx) => (
                              <div key={idx} className="text-sm text-gray-700 dark:text-gray-300">
                                {item}
                              </div>
                            ))}
                          </div>
                        </div>

                        <div>
                          <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                            Suggestions for Improvement:
                          </h4>
                          <div className="space-y-2">
                            {userScore.suggestions.map((suggestion, idx) => (
                              <div key={idx} className="text-sm text-gray-700 dark:text-gray-300">
                                {suggestion}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={resetTraining}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
                      >
                        <AcademicCapIcon className="h-4 w-4" />
                        Try Another Scenario
                      </button>
                      <button
                        onClick={onClose}
                        className="px-4 py-2 text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 font-medium rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      >
                        Close Training
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  )
}
