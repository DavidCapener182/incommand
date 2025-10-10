'use client'

import React, { useState, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  MicrophoneIcon, 
  StopIcon, 
  CheckIcon,
  XMarkIcon,
  SpeakerWaveIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline'
import { VoiceIncidentData } from '@/lib/ai/voiceIncidentExtraction'

interface VoiceToLogModalProps {
  isOpen: boolean
  onClose: () => void
  onIncidentExtracted: (data: VoiceIncidentData) => void
}

export default function VoiceToLogModal({ isOpen, onClose, onIncidentExtracted }: VoiceToLogModalProps) {
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [interimTranscript, setInterimTranscript] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [extractedData, setExtractedData] = useState<VoiceIncidentData | null>(null)
  const [confirmation, setConfirmation] = useState('')
  const [error, setError] = useState('')
  const [recognition, setRecognition] = useState<any>(null)

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window === 'undefined') return

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    
    if (!SpeechRecognition) {
      setError('Speech recognition not supported in this browser')
      return
    }

    const recog = new SpeechRecognition()
    recog.continuous = true
    recog.interimResults = true
    recog.lang = 'en-GB'
    recog.maxAlternatives = 1

    recog.onresult = (event: any) => {
      let finalTranscript = ''
      let interimTranscript = ''

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript
        if (event.results[i].isFinal) {
          finalTranscript += transcript + ' '
        } else {
          interimTranscript += transcript
        }
      }

      if (finalTranscript) {
        setTranscript(prev => prev + finalTranscript)
      }
      setInterimTranscript(interimTranscript)
    }

    recog.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error)
      setError(`Recognition error: ${event.error}`)
      setIsListening(false)
    }

    recog.onend = () => {
      setIsListening(false)
    }

    setRecognition(recog)

    return () => {
      if (recog) {
        recog.stop()
      }
    }
  }, [])

  const startListening = useCallback(() => {
    if (!recognition) {
      setError('Speech recognition not available')
      return
    }

    setTranscript('')
    setInterimTranscript('')
    setError('')
    setExtractedData(null)
    setConfirmation('')
    
    try {
      recognition.start()
      setIsListening(true)
    } catch (err) {
      console.error('Failed to start recognition:', err)
      setError('Failed to start voice input')
    }
  }, [recognition])

  const stopListening = useCallback(() => {
    if (recognition && isListening) {
      recognition.stop()
      setIsListening(false)
    }
  }, [recognition, isListening])

  const processTranscript = useCallback(async () => {
    if (!transcript.trim()) {
      setError('No speech detected. Please try again.')
      return
    }

    setIsProcessing(true)
    setError('')

    try {
      const response = await fetch('/api/v1/incidents/extract-voice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript: transcript.trim() })
      })

      if (!response.ok) {
        throw new Error('Failed to extract incident data')
      }

      const result = await response.json()
      
      if (result.success) {
        setExtractedData(result.data)
        setConfirmation(result.confirmation)
        
        // Speak confirmation
        if ('speechSynthesis' in window) {
          const utterance = new SpeechSynthesisUtterance(result.confirmation)
          utterance.lang = 'en-GB'
          utterance.rate = 0.9
          window.speechSynthesis.speak(utterance)
        }
      } else {
        setError('Failed to process voice input')
      }
    } catch (err) {
      console.error('Processing error:', err)
      setError('Failed to process voice input. Please try again.')
    } finally {
      setIsProcessing(false)
    }
  }, [transcript])

  const handleConfirm = useCallback(() => {
    if (extractedData) {
      onIncidentExtracted(extractedData)
      onClose()
    }
  }, [extractedData, onIncidentExtracted, onClose])

  const handleRetry = useCallback(() => {
    setTranscript('')
    setInterimTranscript('')
    setExtractedData(null)
    setConfirmation('')
    setError('')
    startListening()
  }, [startListening])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl mx-4 overflow-hidden"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <MicrophoneIcon className="h-6 w-6 text-white" />
            <h2 className="text-xl font-bold text-white">Voice-to-Log Incident</h2>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white transition-colors"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Microphone Control */}
          <div className="flex flex-col items-center gap-4">
            <button
              onClick={isListening ? stopListening : startListening}
              disabled={isProcessing || !!extractedData}
              className={`relative w-32 h-32 rounded-full flex items-center justify-center transition-all transform hover:scale-105 ${
                isListening
                  ? 'bg-red-500 animate-pulse shadow-lg shadow-red-500/50'
                  : 'bg-blue-600 hover:bg-blue-700 shadow-lg'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {isListening ? (
                <StopIcon className="h-16 w-16 text-white" />
              ) : (
                <MicrophoneIcon className="h-16 w-16 text-white" />
              )}
              
              {isListening && (
                <motion.div
                  className="absolute inset-0 rounded-full border-4 border-red-400"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                />
              )}
            </button>

            <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
              {isListening
                ? 'Listening... Speak clearly and naturally'
                : isProcessing
                ? 'Processing your voice input...'
                : extractedData
                ? 'Incident extracted! Confirm or retry'
                : 'Tap to start voice input'}
            </p>
          </div>

          {/* Transcript Display */}
          <AnimatePresence>
            {(transcript || interimTranscript) && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4"
              >
                <div className="flex items-start gap-3">
                  <DocumentTextIcon className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Transcript:
                    </p>
                    <p className="text-gray-900 dark:text-white">
                      {transcript}
                      <span className="text-gray-400 dark:text-gray-500 italic">
                        {interimTranscript}
                      </span>
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Extracted Data Preview */}
          <AnimatePresence>
            {extractedData && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 space-y-3"
              >
                <div className="flex items-start gap-3">
                  <CheckIcon className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                  <div className="flex-1 space-y-2">
                    <p className="text-sm font-medium text-blue-900 dark:text-blue-300">
                      Extracted Incident Data:
                    </p>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">Type:</span>
                        <span className="ml-2 font-medium text-gray-900 dark:text-white">
                          {extractedData.incidentType}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">Priority:</span>
                        <span className={`ml-2 font-medium capitalize ${
                          extractedData.priority === 'urgent' ? 'text-red-600 dark:text-red-400' :
                          extractedData.priority === 'high' ? 'text-orange-600 dark:text-orange-400' :
                          'text-gray-900 dark:text-white'
                        }`}>
                          {extractedData.priority}
                        </span>
                      </div>
                      {extractedData.location && (
                        <div className="col-span-2">
                          <span className="text-gray-600 dark:text-gray-400">Location:</span>
                          <span className="ml-2 font-medium text-gray-900 dark:text-white">
                            {extractedData.location}
                          </span>
                        </div>
                      )}
                      <div className="col-span-2">
                        <span className="text-gray-600 dark:text-gray-400">Description:</span>
                        <p className="mt-1 text-gray-900 dark:text-white">
                          {extractedData.occurrence}
                        </p>
                      </div>
                      <div className="col-span-2">
                        <span className="text-gray-600 dark:text-gray-400">Confidence:</span>
                        <div className="mt-1 flex items-center gap-2">
                          <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-blue-600 transition-all"
                              style={{ width: `${extractedData.confidence * 100}%` }}
                            />
                          </div>
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            {Math.round(extractedData.confidence * 100)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Voice Confirmation */}
          <AnimatePresence>
            {confirmation && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4"
              >
                <div className="flex items-start gap-3">
                  <SpeakerWaveIcon className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-green-900 dark:text-green-300 mb-1">
                      Confirmation:
                    </p>
                    <p className="text-green-800 dark:text-green-200">
                      {confirmation}
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Error Display */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4"
              >
                <p className="text-sm text-red-800 dark:text-red-200">
                  {error}
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            {!extractedData ? (
              <>
                <button
                  onClick={onClose}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                {transcript && !isListening && (
                  <button
                    onClick={processTranscript}
                    disabled={isProcessing}
                    className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50"
                  >
                    {isProcessing ? 'Processing...' : 'Process Voice Input'}
                  </button>
                )}
              </>
            ) : (
              <>
                <button
                  onClick={handleRetry}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Retry
                </button>
                <button
                  onClick={handleConfirm}
                  className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <CheckIcon className="h-5 w-5" />
                  Confirm & Create Incident
                </button>
              </>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  )
}

