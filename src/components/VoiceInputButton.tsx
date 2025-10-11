'use client'

import React, { useState, useEffect } from 'react'
import { 
  MicrophoneIcon,
  StopIcon,
  SpeakerWaveIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XMarkIcon
} from '@heroicons/react/24/outline'
import { motion, AnimatePresence } from 'framer-motion'
import { useVoiceInput, parseVoiceCommand, VOICE_COMMAND_EXAMPLES } from '@/hooks/useVoiceInput'

interface VoiceInputButtonProps {
  onTranscript: (transcript: string, parsed: ReturnType<typeof parseVoiceCommand>) => void
  onFinalTranscript?: (transcript: string) => void
  language?: string
  continuous?: boolean
  className?: string
  size?: 'small' | 'medium' | 'large'
  variant?: 'primary' | 'secondary' | 'floating'
  showTranscript?: boolean
  autoSubmit?: boolean
}

export default function VoiceInputButton({
  onTranscript,
  onFinalTranscript,
  language = 'en-GB',
  continuous = false,
  className = '',
  size = 'medium',
  variant = 'primary',
  showTranscript = true,
  autoSubmit = false
}: VoiceInputButtonProps) {
  const [showHelp, setShowHelp] = useState(false)
  const [parsedCommand, setParsedCommand] = useState<ReturnType<typeof parseVoiceCommand> | null>(null)

  const {
    isListening,
    isSupported,
    transcript,
    interimTranscript,
    error,
    isSpeaking,
    startListening,
    stopListening,
    toggleListening,
    resetTranscript,
    speak
  } = useVoiceInput({
    language,
    continuous,
    interimResults: true,
    onResult: (text, isFinal) => {
      const parsed = parseVoiceCommand(text)
      setParsedCommand(parsed)
      onTranscript(text, parsed)
      
      if (isFinal) {
        onFinalTranscript?.(text)
        
        // Auto-submit if enabled and command is recognized
        if (autoSubmit && parsed.action !== 'unknown') {
          setTimeout(() => {
            stopListening()
          }, 500)
        }
      }
    },
    onError: (errorMessage) => {
      console.error('Voice input error:', errorMessage)
      speak('Voice input error. Please try again.')
    }
  })

  // Button size classes
  const sizeClasses = {
    small: 'w-10 h-10',
    medium: 'w-14 h-14',
    large: 'w-20 h-20'
  }

  const iconSizeClasses = {
    small: 'h-5 w-5',
    medium: 'h-7 w-7',
    large: 'h-10 w-10'
  }

  // Variant classes
  const variantClasses = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg',
    secondary: 'bg-gray-600 hover:bg-gray-700 text-white shadow-lg',
    floating: 'bg-gradient-to-br from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-2xl'
  }

  if (!isSupported) {
    return (
      <div className={`flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg ${className}`}>
        <ExclamationTriangleIcon className="h-5 w-5 text-gray-400" />
        <span className="text-sm text-gray-600 dark:text-gray-400">Voice input not supported</span>
      </div>
    )
  }

  return (
    <div className={`relative ${className}`}>
      {/* Main Voice Button */}
      <motion.button
        onClick={toggleListening}
        className={`${sizeClasses[size]} ${variantClasses[variant]} rounded-full flex items-center justify-center transition-all duration-200 relative overflow-hidden`}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        disabled={isSpeaking}
      >
        {/* Pulse animation when listening */}
        {isListening && (
          <>
            <motion.div
              className="absolute inset-0 bg-red-500 rounded-full"
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.5, 0.2, 0.5]
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
            <motion.div
              className="absolute inset-0 bg-red-400 rounded-full"
              animate={{
                scale: [1, 1.4, 1],
                opacity: [0.3, 0, 0.3]
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 0.2
              }}
            />
          </>
        )}

        {/* Icon */}
        <div className="relative z-10">
          {isSpeaking ? (
            <SpeakerWaveIcon className={`${iconSizeClasses[size]} animate-pulse`} />
          ) : isListening ? (
            <StopIcon className={iconSizeClasses[size]} />
          ) : (
            <MicrophoneIcon className={iconSizeClasses[size]} />
          )}
        </div>
      </motion.button>

      {/* Status Indicator */}
      <AnimatePresence>
        {isListening && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white dark:border-gray-900 animate-pulse"
          />
        )}
      </AnimatePresence>

      {/* Transcript Display */}
      <AnimatePresence>
        {showTranscript && (isListening || transcript || interimTranscript) && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute top-full mt-4 left-1/2 transform -translate-x-1/2 min-w-[300px] max-w-[500px] bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 p-4 z-50"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {isListening ? 'Listening...' : 'Voice Input'}
                </span>
              </div>
              <button
                onClick={() => {
                  stopListening()
                  resetTranscript()
                }}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>

            {/* Transcript */}
            <div className="space-y-2">
              {transcript && (
                <div className="text-gray-900 dark:text-white">
                  {transcript}
                </div>
              )}
              {interimTranscript && (
                <div className="text-gray-500 dark:text-gray-400 italic">
                  {interimTranscript}
                </div>
              )}
              {!transcript && !interimTranscript && isListening && (
                <div className="text-gray-400 dark:text-gray-500 text-center py-2">
                  Start speaking...
                </div>
              )}
            </div>

            {/* Parsed Command */}
            {parsedCommand && parsedCommand.action !== 'unknown' && (
              <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircleIcon className="h-4 w-4 text-green-500" />
                  <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                    Command Recognized
                  </span>
                </div>
                <div className="text-xs space-y-1">
                  <div className="flex gap-2">
                    <span className="text-gray-500 dark:text-gray-400">Action:</span>
                    <span className="text-gray-900 dark:text-white capitalize">{parsedCommand.action}</span>
                  </div>
                  {parsedCommand.incidentType && (
                    <div className="flex gap-2">
                      <span className="text-gray-500 dark:text-gray-400">Type:</span>
                      <span className="text-gray-900 dark:text-white">{parsedCommand.incidentType}</span>
                    </div>
                  )}
                  {parsedCommand.priority && (
                    <div className="flex gap-2">
                      <span className="text-gray-500 dark:text-gray-400">Priority:</span>
                      <span className={`capitalize ${
                        parsedCommand.priority === 'high' ? 'text-red-600 dark:text-red-400' :
                        parsedCommand.priority === 'medium' ? 'text-yellow-600 dark:text-yellow-400' :
                        'text-blue-600 dark:text-blue-400'
                      }`}>
                        {parsedCommand.priority}
                      </span>
                    </div>
                  )}
                  {parsedCommand.location && (
                    <div className="flex gap-2">
                      <span className="text-gray-500 dark:text-gray-400">Location:</span>
                      <span className="text-gray-900 dark:text-white">{parsedCommand.location}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Help Button */}
            <button
              onClick={() => setShowHelp(!showHelp)}
              className="mt-3 w-full text-xs text-blue-600 dark:text-blue-400 hover:underline"
            >
              {showHelp ? 'Hide' : 'Show'} voice command examples
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Help Modal */}
      <AnimatePresence>
        {showHelp && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            onClick={() => setShowHelp(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Voice Command Examples
                </h3>
                <button
                  onClick={() => setShowHelp(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-6">
                {VOICE_COMMAND_EXAMPLES.map((category, index) => (
                  <div key={index}>
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
                      {category.category}
                    </h4>
                    <div className="space-y-2">
                      {category.examples.map((example, i) => (
                        <div
                          key={i}
                          className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 text-sm text-gray-700 dark:text-gray-300"
                        >
                          <MicrophoneIcon className="h-4 w-4 inline-block mr-2 text-blue-500" />
                          &quot;{example}&quot;
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  <strong>Tip:</strong> Speak clearly and naturally. The system will automatically detect incident types, priorities, and locations from your speech.
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error Display */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute top-full mt-4 left-1/2 transform -translate-x-1/2 min-w-[300px] bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 z-50"
          >
            <div className="flex items-start gap-3">
              <ExclamationTriangleIcon className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
              </div>
              <button
                onClick={resetTranscript}
                className="text-red-400 hover:text-red-600 dark:hover:text-red-300"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// Compact voice button for forms
export function VoiceInputCompact({
  onTranscript,
  className = ''
}: {
  onTranscript: (transcript: string) => void
  className?: string
}) {
  const { isListening, isSupported, toggleListening } = useVoiceInput({
    language: 'en-GB',
    continuous: false,
    onResult: (text, isFinal) => {
      if (isFinal) {
        onTranscript(text)
      }
    }
  })

  if (!isSupported) return null

  return (
    <button
      type="button"
      onClick={toggleListening}
      className={`p-2 rounded-lg transition-colors ${
        isListening
          ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 animate-pulse'
          : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
      } ${className}`}
      title={isListening ? 'Stop listening' : 'Start voice input'}
    >
      {isListening ? (
        <StopIcon className="h-5 w-5" />
      ) : (
        <MicrophoneIcon className="h-5 w-5" />
      )}
    </button>
  )
}
