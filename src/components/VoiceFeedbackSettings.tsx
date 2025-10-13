// src/components/VoiceFeedbackSettings.tsx

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  SpeakerWaveIcon, 
  SpeakerXMarkIcon,
  VolumeUpIcon,
  VolumeDownIcon,
  Cog6ToothIcon,
  XMarkIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline'
import { useVoiceFeedback } from '../hooks/useVoiceFeedback'

interface VoiceFeedbackSettingsProps {
  isOpen: boolean
  onClose: () => void
}

export default function VoiceFeedbackSettings({ isOpen, onClose }: VoiceFeedbackSettingsProps) {
  const voiceFeedback = useVoiceFeedback()
  const [localConfig, setLocalConfig] = useState({
    enableAudioCues: true,
    enableAnnouncements: true,
    enableHapticFeedback: true,
    volume: 0.7,
    speechRate: 1.0,
    speechPitch: 1.0
  })

  const handleConfigChange = (key: string, value: any) => {
    const newConfig = { ...localConfig, [key]: value }
    setLocalConfig(newConfig)
    voiceFeedback.updateConfig(newConfig)
  }

  const testAudioCue = (type: 'start' | 'stop' | 'success' | 'error') => {
    switch (type) {
      case 'start':
        voiceFeedback.playStartCue()
        break
      case 'stop':
        voiceFeedback.playStopCue()
        break
      case 'success':
        voiceFeedback.playSuccessCue()
        break
      case 'error':
        voiceFeedback.playErrorCue()
        break
    }
  }

  const testAnnouncement = () => {
    voiceFeedback.announceSuccess('This is a test announcement. Voice feedback is working correctly.')
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <SpeakerWaveIcon className="h-6 w-6 text-blue-600" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Voice Feedback Settings
              </h2>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          {/* Settings */}
          <div className="p-6 space-y-6">
            {/* Audio Cues */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white">Audio Cues</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Play sounds for voice input events
                  </p>
                </div>
                <button
                  onClick={() => handleConfigChange('enableAudioCues', !localConfig.enableAudioCues)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    localConfig.enableAudioCues ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      localConfig.enableAudioCues ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {localConfig.enableAudioCues && (
                <div className="ml-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Test Audio Cues</span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => testAudioCue('start')}
                        className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200"
                      >
                        Start
                      </button>
                      <button
                        onClick={() => testAudioCue('stop')}
                        className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200"
                      >
                        Stop
                      </button>
                      <button
                        onClick={() => testAudioCue('success')}
                        className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                      >
                        Success
                      </button>
                      <button
                        onClick={() => testAudioCue('error')}
                        className="px-2 py-1 text-xs bg-orange-100 text-orange-700 rounded hover:bg-orange-200"
                      >
                        Error
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Voice Announcements */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white">Voice Announcements</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Speak feedback messages aloud
                  </p>
                </div>
                <button
                  onClick={() => handleConfigChange('enableAnnouncements', !localConfig.enableAnnouncements)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    localConfig.enableAnnouncements ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      localConfig.enableAnnouncements ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {localConfig.enableAnnouncements && (
                <div className="ml-4 space-y-3">
                  <button
                    onClick={testAnnouncement}
                    className="w-full px-3 py-2 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 flex items-center justify-center gap-2"
                  >
                    <SpeakerWaveIcon className="h-4 w-4" />
                    Test Announcement
                  </button>

                  {/* Speech Rate */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Speech Rate: {localConfig.speechRate.toFixed(1)}x
                    </label>
                    <input
                      type="range"
                      min="0.5"
                      max="2.0"
                      step="0.1"
                      value={localConfig.speechRate}
                      onChange={(e) => handleConfigChange('speechRate', parseFloat(e.target.value))}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                    />
                  </div>

                  {/* Speech Pitch */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Speech Pitch: {localConfig.speechPitch.toFixed(1)}x
                    </label>
                    <input
                      type="range"
                      min="0.5"
                      max="2.0"
                      step="0.1"
                      value={localConfig.speechPitch}
                      onChange={(e) => handleConfigChange('speechPitch', parseFloat(e.target.value))}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Haptic Feedback */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white">Haptic Feedback</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Device vibration for touch feedback
                  </p>
                </div>
                <button
                  onClick={() => handleConfigChange('enableHapticFeedback', !localConfig.enableHapticFeedback)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    localConfig.enableHapticFeedback ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      localConfig.enableHapticFeedback ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Volume */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Volume: {Math.round(localConfig.volume * 100)}%
              </label>
              <div className="flex items-center gap-3">
                <VolumeDownIcon className="h-5 w-5 text-gray-400" />
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={localConfig.volume}
                  onChange={(e) => handleConfigChange('volume', parseFloat(e.target.value))}
                  className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                />
                <VolumeUpIcon className="h-5 w-5 text-gray-400" />
              </div>
            </div>

            {/* Accessibility Note */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <CheckCircleIcon className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100">
                    Accessibility Features
                  </h4>
                  <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                    Voice feedback helps users with visual impairments and provides audio confirmation 
                    for voice commands. All settings are automatically saved.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              Done
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
