'use client'

import React, { useState, useRef, useEffect } from 'react'
import { 
  MicrophoneIcon,
  StopIcon,
  SpeakerWaveIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XMarkIcon
} from '@heroicons/react/24/outline'
import { motion, AnimatePresence } from 'framer-motion'
import { useVoiceInput, parseVoiceCommand } from '@/hooks/useVoiceInput'

interface VoiceInputFieldProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  disabled?: boolean
  showVoiceButton?: boolean
  silenceTimeout?: number
  noiseThreshold?: number
  onVoiceResult?: (transcript: string, confidence: number) => void
}

export default function VoiceInputField({
  value,
  onChange,
  placeholder = "Type or speak...",
  className = "",
  disabled = false,
  showVoiceButton = true,
  silenceTimeout = 3000,
  noiseThreshold = 0.7,
  onVoiceResult
}: VoiceInputFieldProps) {
  const [isListening, setIsListening] = useState(false)
  const [voiceError, setVoiceError] = useState<string | null>(null)
  const [lastVoiceResult, setLastVoiceResult] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const {
    isSupported,
    transcript,
    interimTranscript,
    error,
    isSpeaking,
    startListening,
    stopListening,
    resetTranscript,
    speak
  } = useVoiceInput({
    language: 'en-GB',
    continuous: true,
    interimResults: true,
    silenceTimeout,
    noiseThreshold,
    onResult: (text, isFinal, confidence) => {
      if (isFinal && confidence && confidence > noiseThreshold) {
        const newValue = value ? `${value} ${text}` : text
        onChange(newValue)
        setLastVoiceResult(text)
        onVoiceResult?.(text, confidence)
        
        // Provide audio feedback for successful recognition
        if (confidence > 0.8) {
          speak('Got it.')
        }
        
        // Clear the result after a delay
        setTimeout(() => setLastVoiceResult(null), 2000)
      }
    },
    onError: (errorMessage) => {
      setVoiceError(errorMessage)
      speak('Voice input error. Please try again.')
      setTimeout(() => setVoiceError(null), 3000)
    },
    onSilenceDetected: () => {
      speak('Voice input complete.')
      setIsListening(false)
    }
  })

  const handleVoiceToggle = () => {
    if (isListening) {
      stopListening()
      setIsListening(false)
    } else {
      resetTranscript()
      startListening()
      setIsListening(true)
      setVoiceError(null)
    }
  }

  const handleVoiceResult = (text: string, confidence: number) => {
    const newValue = value ? `${value} ${text}` : text
    onChange(newValue)
    setLastVoiceResult(text)
    onVoiceResult?.(text, confidence)
  }

  // Focus input when voice input is complete
  useEffect(() => {
    if (!isListening && transcript) {
      inputRef.current?.focus()
    }
  }, [isListening, transcript])

  if (!isSupported) {
    return (
      <div className={`relative ${className}`}>
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          className="w-full px-4 py-3 pr-12 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
        />
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
          <ExclamationTriangleIcon className="h-5 w-5 text-gray-400" title="Voice input not supported" />
        </div>
      </div>
    )
  }

  return (
    <div className={`relative ${className}`}>
      {/* Input Field */}
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled || isSpeaking}
        className="w-full px-4 py-3 pr-12 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base transition-all duration-200"
      />

      {/* Voice Button */}
      {showVoiceButton && (
        <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
          <motion.button
            type="button"
            onClick={handleVoiceToggle}
            disabled={disabled || isSpeaking}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 ${
              isListening
                ? 'bg-red-500 hover:bg-red-600 text-white shadow-lg animate-pulse'
                : isSpeaking
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-400'
            }`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {isSpeaking ? (
              <SpeakerWaveIcon className="h-5 w-5 animate-pulse" />
            ) : isListening ? (
              <StopIcon className="h-5 w-5" />
            ) : (
              <MicrophoneIcon className="h-5 w-5" />
            )}
          </motion.button>
        </div>
      )}

      {/* Voice Status Indicators */}
      <AnimatePresence>
        {isListening && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute -top-8 left-0 right-0 flex items-center justify-center"
          >
            <div className="bg-red-500 text-white px-3 py-1 rounded-full text-xs font-medium flex items-center gap-2">
              <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
              Listening...
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Voice Result Feedback */}
      <AnimatePresence>
        {lastVoiceResult && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute -bottom-8 left-0 right-0 flex items-center justify-center"
          >
            <div className="bg-green-500 text-white px-3 py-1 rounded-full text-xs font-medium flex items-center gap-2">
              <CheckCircleIcon className="h-3 w-3" />
              Added: &quot;{lastVoiceResult}&quot;
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Voice Error */}
      <AnimatePresence>
        {voiceError && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute -bottom-8 left-0 right-0 flex items-center justify-center"
          >
            <div className="bg-red-500 text-white px-3 py-1 rounded-full text-xs font-medium flex items-center gap-2">
              <ExclamationTriangleIcon className="h-3 w-3" />
              {voiceError}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Interim Transcript */}
      <AnimatePresence>
        {interimTranscript && isListening && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute -bottom-8 left-0 right-0 flex items-center justify-center"
          >
            <div className="bg-blue-500 text-white px-3 py-1 rounded-full text-xs font-medium flex items-center gap-2">
              <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
              "{interimTranscript}"
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// Textarea version for longer text input
export function VoiceTextareaField({
  value,
  onChange,
  placeholder = "Type or speak...",
  className = "",
  disabled = false,
  rows = 3,
  showVoiceButton = true,
  silenceTimeout = 4000,
  noiseThreshold = 0.7,
  onVoiceResult
}: VoiceInputFieldProps & { rows?: number }) {
  const [isListening, setIsListening] = useState(false)
  const [voiceError, setVoiceError] = useState<string | null>(null)
  const [lastVoiceResult, setLastVoiceResult] = useState<string | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const {
    isSupported,
    transcript,
    interimTranscript,
    error,
    isSpeaking,
    startListening,
    stopListening,
    resetTranscript,
    speak
  } = useVoiceInput({
    language: 'en-GB',
    continuous: true,
    interimResults: true,
    silenceTimeout,
    noiseThreshold,
    onResult: (text, isFinal, confidence) => {
      if (isFinal && confidence && confidence > noiseThreshold) {
        const newValue = value ? `${value} ${text}` : text
        onChange(newValue)
        setLastVoiceResult(text)
        onVoiceResult?.(text, confidence)
        
        // Provide audio feedback for successful recognition
        if (confidence > 0.8) {
          speak('Got it.')
        }
        
        // Clear the result after a delay
        setTimeout(() => setLastVoiceResult(null), 2000)
      }
    },
    onError: (errorMessage) => {
      setVoiceError(errorMessage)
      speak('Voice input error. Please try again.')
      setTimeout(() => setVoiceError(null), 3000)
    },
    onSilenceDetected: () => {
      speak('Voice input complete.')
      setIsListening(false)
    }
  })

  const handleVoiceToggle = () => {
    if (isListening) {
      stopListening()
      setIsListening(false)
    } else {
      resetTranscript()
      startListening()
      setIsListening(true)
      setVoiceError(null)
    }
  }

  // Focus textarea when voice input is complete
  useEffect(() => {
    if (!isListening && transcript) {
      textareaRef.current?.focus()
    }
  }, [isListening, transcript])

  if (!isSupported) {
    return (
      <div className={`relative ${className}`}>
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          rows={rows}
          className="w-full px-4 py-3 pr-12 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base resize-none"
        />
        <div className="absolute right-3 top-3">
          <ExclamationTriangleIcon className="h-5 w-5 text-gray-400" title="Voice input not supported" />
        </div>
      </div>
    )
  }

  return (
    <div className={`relative ${className}`}>
      {/* Textarea Field */}
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled || isSpeaking}
        rows={rows}
        className="w-full px-4 py-3 pr-12 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base resize-none transition-all duration-200"
      />

      {/* Voice Button */}
      {showVoiceButton && (
        <div className="absolute right-2 top-2">
          <motion.button
            type="button"
            onClick={handleVoiceToggle}
            disabled={disabled || isSpeaking}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 ${
              isListening
                ? 'bg-red-500 hover:bg-red-600 text-white shadow-lg animate-pulse'
                : isSpeaking
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-400'
            }`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {isSpeaking ? (
              <SpeakerWaveIcon className="h-5 w-5 animate-pulse" />
            ) : isListening ? (
              <StopIcon className="h-5 w-5" />
            ) : (
              <MicrophoneIcon className="h-5 w-5" />
            )}
          </motion.button>
        </div>
      )}

      {/* Voice Status Indicators */}
      <AnimatePresence>
        {isListening && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute -top-8 left-0 right-0 flex items-center justify-center"
          >
            <div className="bg-red-500 text-white px-3 py-1 rounded-full text-xs font-medium flex items-center gap-2">
              <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
              Listening...
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Voice Result Feedback */}
      <AnimatePresence>
        {lastVoiceResult && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute -bottom-8 left-0 right-0 flex items-center justify-center"
          >
            <div className="bg-green-500 text-white px-3 py-1 rounded-full text-xs font-medium flex items-center gap-2">
              <CheckCircleIcon className="h-3 w-3" />
              Added: &quot;{lastVoiceResult}&quot;
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Voice Error */}
      <AnimatePresence>
        {voiceError && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute -bottom-8 left-0 right-0 flex items-center justify-center"
          >
            <div className="bg-red-500 text-white px-3 py-1 rounded-full text-xs font-medium flex items-center gap-2">
              <ExclamationTriangleIcon className="h-3 w-3" />
              {voiceError}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Interim Transcript */}
      <AnimatePresence>
        {interimTranscript && isListening && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute -bottom-8 left-0 right-0 flex items-center justify-center"
          >
            <div className="bg-blue-500 text-white px-3 py-1 rounded-full text-xs font-medium flex items-center gap-2">
              <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
              "{interimTranscript}"
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
