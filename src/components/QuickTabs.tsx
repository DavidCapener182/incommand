'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  UserGroupIcon, 
  HeartIcon, 
  DocumentTextIcon,
  CheckCircleIcon,
  XMarkIcon
} from '@heroicons/react/24/outline'
import { supabase } from '../lib/supabase'
import VoiceInputButton from './VoiceInputButton'

interface QuickTabsProps {
  eventId: string
  onIncidentLogged: () => void
  currentUser?: any
  availableCallsigns?: Array<{ short_code: string; callsign: string }>
}

type QuickTabType = 'attendance' | 'medical' | 'sitrep' | null

interface QuickLogData {
  type: QuickTabType
  occurrence: string
  action: string
  incidentType: string
}

export default function QuickTabs({ 
  eventId, 
  onIncidentLogged, 
  currentUser,
  availableCallsigns = []
}: QuickTabsProps) {
  const [activeTab, setActiveTab] = useState<QuickTabType>(null)
  const [isLogging, setIsLogging] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  
  // Form states for each quick tab
  const [attendanceNumber, setAttendanceNumber] = useState('')
  const [medicalLocation, setMedicalLocation] = useState('')
  const [medicalDescription, setMedicalDescription] = useState('')
  const [medicalSeverity, setMedicalSeverity] = useState<'minor' | 'moderate' | 'serious' | 'critical'>('moderate')
  const [sitrepLocation, setSitrepLocation] = useState('')
  const [sitrepDescription, setSitrepDescription] = useState('')

  // Get event capacity for attendance calculations
  const [eventCapacity] = useState(24000) // This should come from event data

  const resetForm = () => {
    setAttendanceNumber('')
    setMedicalLocation('')
    setMedicalDescription('')
    setMedicalSeverity('moderate')
    setSitrepLocation('')
    setSitrepDescription('')
  }

  const handleQuickLog = async () => {
    if (!eventId) return

    let logData: QuickLogData | null = null

    // Prepare log data based on active tab
    switch (activeTab) {
      case 'attendance':
        if (!attendanceNumber) return
        const attendance = parseInt(attendanceNumber)
        const percentCapacity = ((attendance / eventCapacity) * 100).toFixed(1)
        const remaining = eventCapacity - attendance
        
        logData = {
          type: 'attendance',
          occurrence: `Current attendance: ${attendance.toLocaleString()}`,
          action: `Attendance at ${attendance.toLocaleString()} people (${percentCapacity}% of capacity). ${remaining.toLocaleString()} people remaining to reach capacity.`,
          incidentType: 'Attendance'
        }
        break

      case 'medical':
        if (!medicalLocation) return
        const severityText = {
          'minor': 'Minor medical incident',
          'moderate': 'Moderate medical incident',
          'serious': 'Serious medical incident',
          'critical': 'Critical medical incident'
        }[medicalSeverity]
        
        logData = {
          type: 'medical',
          occurrence: `${severityText} at ${medicalLocation}${medicalDescription ? `: ${medicalDescription}` : ''}`,
          action: `Medical incident logged. ${severityText} at ${medicalLocation}. ${medicalDescription || 'Medical team notified.'}`,
          incidentType: 'Medical'
        }
        break

      case 'sitrep':
        if (!sitrepLocation) return
        logData = {
          type: 'sitrep',
          occurrence: `Situation report from ${sitrepLocation}${sitrepDescription ? `: ${sitrepDescription}` : ''}`,
          action: `Situation report logged. Location: ${sitrepLocation}. ${sitrepDescription || 'General status update.'}`,
          incidentType: 'Sit Rep'
        }
        break

      default:
        return
    }

    if (!logData) return

    setIsLogging(true)

    try {
      // Generate log number
      const { data: existingLogs } = await supabase
        .from('incident_logs')
        .select('log_number')
        .eq('event_id', eventId)
        .order('timestamp', { ascending: false })
        .limit(1)

      let nextLogNumber = 1
      if (existingLogs && existingLogs.length > 0) {
        const lastNumber = parseInt(existingLogs[0].log_number.split('-').pop() || '0')
        nextLogNumber = lastNumber + 1
      }

      const logNumber = `LOG-${String(nextLogNumber).padStart(4, '0')}`

      // Determine callsigns
      const callsignFrom = currentUser?.callsign || 'Control'
      const callsignTo = 'All'

      // Insert the incident
      const { error } = await supabase
        .from('incident_logs')
        .insert({
          event_id: eventId,
          log_number: logNumber,
          callsign_from: callsignFrom,
          callsign_to: callsignTo,
          occurrence: logData.occurrence,
          action_taken: logData.action,
          incident_type: logData.incidentType,
          priority: 'low',
          status: 'logged',
          is_closed: logData.type === 'attendance', // Auto-close attendance logs
          timestamp: new Date().toISOString(),
          time_of_occurrence: new Date().toISOString(),
          time_logged: new Date().toISOString(),
          entry_type: 'contemporaneous',
          logged_by_user_id: currentUser?.id || null,
          logged_by_callsign: callsignFrom
        })

      if (error) throw error

      // Show success message
      setSuccessMessage(`${logData.incidentType} logged successfully!`)
      
      // Reset form
      resetForm()
      
      // Close tab after delay
      setTimeout(() => {
        setActiveTab(null)
        setSuccessMessage(null)
        onIncidentLogged()
      }, 2000)

    } catch (error) {
      console.error('Error logging quick incident:', error)
      alert('Failed to log incident. Please try again.')
    } finally {
      setIsLogging(false)
    }
  }

  const handleVoiceTranscript = (text: string) => {
    // Auto-fill based on active tab
    switch (activeTab) {
      case 'attendance':
        const numbers = text.match(/\d+/g)
        if (numbers && numbers.length > 0) {
          setAttendanceNumber(numbers[0])
        }
        break
      case 'medical':
        if (!medicalLocation) {
          setMedicalLocation(text)
        } else {
          setMedicalDescription(text)
        }
        break
      case 'sitrep':
        if (!sitrepLocation) {
          setSitrepLocation(text)
        } else {
          setSitrepDescription(text)
        }
        break
    }
  }

  const tabs = [
    { id: 'attendance' as QuickTabType, label: 'Attendance', icon: UserGroupIcon, color: 'blue' },
    { id: 'medical' as QuickTabType, label: 'Medical', icon: HeartIcon, color: 'red' },
    { id: 'sitrep' as QuickTabType, label: 'Sit Rep', icon: DocumentTextIcon, color: 'green' }
  ]

  const colorClasses = {
    blue: 'bg-blue-500 hover:bg-blue-600 text-white',
    red: 'bg-red-500 hover:bg-red-600 text-white',
    green: 'bg-green-500 hover:bg-green-600 text-white'
  }

  return (
    <div className="space-y-4">
      {/* Quick Tab Buttons */}
      <div className="flex flex-wrap gap-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-300 self-center mr-2">
          Quick Log:
        </span>
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          
          return (
            <motion.button
              key={tab.id}
              type="button"
              onClick={() => {
                if (isActive) {
                  setActiveTab(null)
                  resetForm()
                } else {
                  setActiveTab(tab.id)
                  setSuccessMessage(null)
                }
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                isActive 
                  ? colorClasses[tab.color as keyof typeof colorClasses] + ' shadow-lg'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </motion.button>
          )
        })}
      </div>

      {/* Quick Entry Forms */}
      <AnimatePresence mode="wait">
        {activeTab && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="bg-white dark:bg-gray-800 rounded-xl border-2 border-gray-200 dark:border-gray-700 p-6 shadow-lg">
              {/* Close button */}
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                  {tabs.find(t => t.id === activeTab)?.label} Quick Log
                </h3>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab(null)
                    resetForm()
                  }}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>

              {/* Success Message */}
              {successMessage && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-4 flex items-center gap-2 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 px-4 py-3 rounded-lg"
                >
                  <CheckCircleIcon className="h-5 w-5" />
                  {successMessage}
                </motion.div>
              )}

              {/* Attendance Form */}
              {activeTab === 'attendance' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Current Attendance Number
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        value={attendanceNumber}
                        onChange={(e) => setAttendanceNumber(e.target.value)}
                        placeholder="e.g., 2400"
                        className="flex-1 px-4 py-3 text-lg border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                        autoFocus
                      />
                      <VoiceInputButton
                        onTranscript={handleVoiceTranscript}
                        size="medium"
                        variant="secondary"
                        showTranscript={false}
                      />
                    </div>
                    {attendanceNumber && (
                      <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                        {((parseInt(attendanceNumber) / eventCapacity) * 100).toFixed(1)}% of capacity ({eventCapacity.toLocaleString()} max)
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Medical Form */}
              {activeTab === 'medical' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Location
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={medicalLocation}
                        onChange={(e) => setMedicalLocation(e.target.value)}
                        placeholder="e.g., Main Stage, Gate 3, Medical Tent"
                        className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 dark:bg-gray-700 dark:text-white"
                        autoFocus
                      />
                      <VoiceInputButton
                        onTranscript={handleVoiceTranscript}
                        size="medium"
                        variant="secondary"
                        showTranscript={false}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Severity
                    </label>
                    <select
                      value={medicalSeverity}
                      onChange={(e) => setMedicalSeverity(e.target.value as any)}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 dark:bg-gray-700 dark:text-white"
                    >
                      <option value="minor">Minor</option>
                      <option value="moderate">Moderate</option>
                      <option value="serious">Serious</option>
                      <option value="critical">Critical</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Description (Optional)
                    </label>
                    <textarea
                      value={medicalDescription}
                      onChange={(e) => setMedicalDescription(e.target.value)}
                      placeholder="e.g., Person collapsed, injury, medical assistance needed"
                      rows={2}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                </div>
              )}

              {/* Sit Rep Form */}
              {activeTab === 'sitrep' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Location
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={sitrepLocation}
                        onChange={(e) => setSitrepLocation(e.target.value)}
                        placeholder="e.g., Main Stage, Gate Area, Overall Site"
                        className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-white"
                        autoFocus
                      />
                      <VoiceInputButton
                        onTranscript={handleVoiceTranscript}
                        size="medium"
                        variant="secondary"
                        showTranscript={false}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Description
                    </label>
                    <textarea
                      value={sitrepDescription}
                      onChange={(e) => setSitrepDescription(e.target.value)}
                      placeholder="e.g., All clear, crowd flowing well, no issues"
                      rows={3}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                </div>
              )}

              {/* Quick Log Button */}
              <motion.button
                type="button"
                onClick={handleQuickLog}
                disabled={isLogging}
                className="mt-6 w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold py-4 px-6 rounded-xl shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {isLogging ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Logging...
                  </span>
                ) : (
                  'Quick Log Incident'
                )}
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

