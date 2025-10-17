/**
 * Voice Input Hook
 * Provides voice-to-text functionality using Web Speech API
 */

import { useState, useEffect, useCallback, useRef } from 'react'

export interface VoiceInputState {
  isListening: boolean
  isSupported: boolean
  transcript: string
  interimTranscript: string
  error: string | null
  isSpeaking: boolean
}

export interface VoiceInputOptions {
  language?: string
  continuous?: boolean
  interimResults?: boolean
  maxAlternatives?: number
  silenceTimeout?: number // Customizable silence timeout
  noiseThreshold?: number // Minimum confidence for results
  onResult?: (transcript: string, isFinal: boolean, confidence?: number) => void
  onEnd?: () => void
  onError?: (error: string) => void
  onSilenceDetected?: () => void
}

export function useVoiceInput(options: VoiceInputOptions = {}) {
  const {
    language = 'en-GB',
    continuous = false,
    interimResults = true,
    maxAlternatives = 1,
    silenceTimeout = 3000, // Default 3 seconds
    noiseThreshold = 0.5, // Default confidence threshold
    onResult,
    onEnd,
    onError,
    onSilenceDetected
  } = options

  const [state, setState] = useState<VoiceInputState>({
    isListening: false,
    isSupported: false,
    transcript: '',
    interimTranscript: '',
    error: null,
    isSpeaking: false
  })

  const recognitionRef = useRef<any>(null)
  const synthRef = useRef<SpeechSynthesis | null>(null)
  const restartTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null)
  // Keep latest callbacks in refs to avoid effect re-subscribing on every render
  const onResultRef = useRef<typeof onResult | undefined>(onResult)
  const onEndRef = useRef<typeof onEnd | undefined>(onEnd)
  const onErrorRef = useRef<typeof onError | undefined>(onError)
  const onSilenceDetectedRef = useRef<typeof onSilenceDetected | undefined>(onSilenceDetected)

  onResultRef.current = onResult
  onEndRef.current = onEnd
  onErrorRef.current = onError
  onSilenceDetectedRef.current = onSilenceDetected

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window === 'undefined') return

    // Check for browser support
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    const speechSynthesis = window.speechSynthesis

    if (!SpeechRecognition) {
      setState(prev => ({
        ...prev,
        isSupported: false,
        error: 'Speech recognition is not supported in this browser'
      }))
      return
    }

    setState(prev => ({ ...prev, isSupported: true }))

    // Initialize recognition
    const recognition = new SpeechRecognition()
    recognition.continuous = continuous
    recognition.interimResults = interimResults
    recognition.maxAlternatives = maxAlternatives
    recognition.lang = language

    // Event handlers
    recognition.onstart = () => {
      console.log('Voice recognition started')
      setState(prev => ({ ...prev, isListening: true, error: null }))
    }

    recognition.onresult = (event: any) => {
      let interimTranscriptText = ''
      let finalTranscriptText = ''
      let hasValidResult = false

      // Reset silence timer on each result
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current)
      }

      // Start new silence timer with customizable timeout
      if (continuous) {
        silenceTimerRef.current = setTimeout(() => {
          if (recognitionRef.current && state.isListening) {
            console.log('Stopping due to silence detection')
            onSilenceDetectedRef.current?.()
            recognition.stop()
          }
        }, silenceTimeout)
      }

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i]
        const transcript = result[0].transcript
        const confidence = result[0].confidence || 1.0
        
        // Filter out low-confidence results (likely noise)
        if (confidence < noiseThreshold) {
          console.log('Filtered low-confidence result:', transcript, 'confidence:', confidence)
          continue
        }
        
        hasValidResult = true
        
        if (result.isFinal) {
          finalTranscriptText += transcript + ' '
        } else {
          interimTranscriptText += transcript
        }
      }

      // Only process results if we have valid (high-confidence) speech
      if (hasValidResult) {
        if (finalTranscriptText) {
          setState(prev => ({
            ...prev,
            transcript: prev.transcript + finalTranscriptText,
            interimTranscript: ''
          }))
          onResultRef.current?.(finalTranscriptText.trim(), true, 1.0)
        } else if (interimTranscriptText) {
          setState(prev => ({
            ...prev,
            interimTranscript: interimTranscriptText
          }))
          onResultRef.current?.(interimTranscriptText, false, 1.0)
        }
      }
    }

    recognition.onerror = (event: any) => {
      console.error('Voice recognition error:', event.error)
      let errorMessage = 'Voice recognition error'
      
      switch (event.error) {
        case 'no-speech':
          errorMessage = 'No speech detected. Please try again.'
          break
        case 'audio-capture':
          errorMessage = 'No microphone found. Please check your device settings.'
          break
        case 'not-allowed':
          errorMessage = 'Microphone access denied. Please enable microphone permissions.'
          break
        case 'network':
          errorMessage = 'Network error. Please check your connection.'
          break
        case 'aborted':
          errorMessage = 'Voice recognition was aborted.'
          break
        default:
          errorMessage = `Voice recognition error: ${event.error}`
      }

      setState(prev => ({
        ...prev,
        isListening: false,
        error: errorMessage
      }))
      onErrorRef.current?.(errorMessage)
    }

    recognition.onend = () => {
      console.log('Voice recognition ended')
      setState(prev => ({ ...prev, isListening: false }))
      onEndRef.current?.()

      // Auto-restart if continuous mode and still should be listening
      if (continuous && state.isListening) {
        restartTimeoutRef.current = setTimeout(() => {
          try {
            recognition.start()
          } catch (error) {
            console.error('Failed to restart recognition:', error)
          }
        }, 100)
      }
    }

    recognitionRef.current = recognition
    synthRef.current = speechSynthesis

    return () => {
      if (restartTimeoutRef.current) {
        clearTimeout(restartTimeoutRef.current)
      }
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current)
      }
      if (recognitionRef.current) {
        recognitionRef.current.stop()
      }
    }
  }, [language, continuous, interimResults, maxAlternatives, silenceTimeout, noiseThreshold])

  // Start listening
  const startListening = useCallback(() => {
    if (!recognitionRef.current || state.isListening) return

    try {
      recognitionRef.current.start()
      setState(prev => ({ ...prev, error: null }))
    } catch (error: any) {
      console.error('Failed to start recognition:', error)
      setState(prev => ({
        ...prev,
        error: 'Failed to start voice recognition. Please try again.'
      }))
    }
  }, [state.isListening])

  // Stop listening
  const stopListening = useCallback(() => {
    if (!recognitionRef.current || !state.isListening) return

    try {
      if (restartTimeoutRef.current) {
        clearTimeout(restartTimeoutRef.current)
      }
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current)
      }
      recognitionRef.current.stop()
    } catch (error) {
      console.error('Failed to stop recognition:', error)
    }
  }, [state.isListening])

  // Toggle listening
  const toggleListening = useCallback(() => {
    if (state.isListening) {
      stopListening()
    } else {
      startListening()
    }
  }, [state.isListening, startListening, stopListening])

  // Reset transcript
  const resetTranscript = useCallback(() => {
    setState(prev => ({
      ...prev,
      transcript: '',
      interimTranscript: ''
    }))
  }, [])

  type SpeechOptions = {
    lang?: string
    rate?: number
    pitch?: number
    volume?: number
    voice?: SpeechSynthesisVoice | null
  }

  // Speak text (text-to-speech)
  const speak = useCallback((text: string, options: SpeechOptions = {}) => {
    if (!synthRef.current) {
      console.error('Speech synthesis not supported')
      return
    }

    // Cancel any ongoing speech
    synthRef.current.cancel()

    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = options.lang || language
    utterance.rate = options.rate || 1.0
    utterance.pitch = options.pitch || 1.0
    utterance.volume = options.volume || 1.0

    utterance.onstart = () => {
      setState(prev => ({ ...prev, isSpeaking: true }))
    }

    utterance.onend = () => {
      setState(prev => ({ ...prev, isSpeaking: false }))
    }

    utterance.onerror = (event) => {
      console.error('Speech synthesis error:', event)
      setState(prev => ({ ...prev, isSpeaking: false }))
    }

    synthRef.current.speak(utterance)
  }, [language])

  // Stop speaking
  const stopSpeaking = useCallback(() => {
    if (synthRef.current) {
      synthRef.current.cancel()
      setState(prev => ({ ...prev, isSpeaking: false }))
    }
  }, [])

  // Get available voices
  const getVoices = useCallback(() => {
    if (synthRef.current) {
      return synthRef.current.getVoices()
    }
    return []
  }, [])

  return {
    ...state,
    startListening,
    stopListening,
    toggleListening,
    resetTranscript,
    speak,
    stopSpeaking,
    getVoices
  }
}

// Voice command parser for incident reporting
export interface ParsedVoiceCommand {
  action: 'create' | 'update' | 'close' | 'search' | 'unknown'
  incidentType?: string
  priority?: 'high' | 'medium' | 'low'
  location?: string
  description?: string
  raw: string
}

export function parseVoiceCommand(transcript: string): ParsedVoiceCommand {
  const lowerTranscript = transcript.toLowerCase().trim()
  
  const result: ParsedVoiceCommand = {
    action: 'unknown',
    raw: transcript
  }

  // Detect action
  if (lowerTranscript.match(/^(create|new|log|report)/)) {
    result.action = 'create'
  } else if (lowerTranscript.match(/^(update|amend|change)/)) {
    result.action = 'update'
  } else if (lowerTranscript.match(/^(close|resolve|complete)/)) {
    result.action = 'close'
  } else if (lowerTranscript.match(/^(search|find|show)/)) {
    result.action = 'search'
  }

  // Detect incident type
  const typePatterns = [
    { pattern: /medical|injury|first aid|ambulance/, type: 'Medical' },
    { pattern: /ejection|eject|remove|escort out/, type: 'Ejection' },
    { pattern: /refusal|refuse|deny|denied/, type: 'Refusal' },
    { pattern: /theft|steal|stolen|robbery/, type: 'Theft' },
    { pattern: /assault|fight|violence|attack/, type: 'Fight' },
    { pattern: /fire|smoke|flame/, type: 'Fire' },
    { pattern: /lost (child|person)|missing/, type: 'Missing Child/Person' },
    { pattern: /suspicious|concern|worried/, type: 'Suspicious Behaviour' },
    { pattern: /main act on stage|artist on stage|headliner on stage|band performing|performing/, type: 'Artist On Stage' },
    { pattern: /main act finished|set finished|artist off stage|performance ended/, type: 'Artist Off Stage' }
  ]

  for (const { pattern, type } of typePatterns) {
    if (lowerTranscript.match(pattern)) {
      result.incidentType = type
      break
    }
  }

  // Detect priority
  if (lowerTranscript.match(/urgent|emergency|critical|immediate|high priority/)) {
    result.priority = 'high'
  } else if (lowerTranscript.match(/medium|moderate|normal/)) {
    result.priority = 'medium'
  } else if (lowerTranscript.match(/low|minor|routine/)) {
    result.priority = 'low'
  }
  
  // Override priority for artist events - they should always be low priority
  if (result.incidentType === 'Artist On Stage' || result.incidentType === 'Artist Off Stage') {
    result.priority = 'low'
  }

  // Extract location (common patterns)
  const locationMatch = lowerTranscript.match(/(?:at|in|near|by|outside|inside)\s+([\w\s]+?)(?:\s+(?:for|with|about|regarding)|$)/i)
  if (locationMatch) {
    result.location = locationMatch[1].trim()
    // Capitalize first letter of each word in location
    result.location = result.location.replace(/\b\w/g, l => l.toUpperCase())
  }

  // Extract description (everything after the initial command)
  const descriptionMatch = lowerTranscript.match(/^(?:create|new|log|report|update|amend|change)\s+(?:incident\s+)?(?:at|in|near)?\s*(.+)/i)
  if (descriptionMatch) {
    result.description = descriptionMatch[1].trim()
  } else {
    result.description = transcript.trim()
  }

  return result
}

// Voice command examples for help/training
export const VOICE_COMMAND_EXAMPLES = [
  {
    category: 'Create Incident',
    examples: [
      'Create medical incident at main gate',
      'New ejection in section A',
      'Report theft at merchandise stand',
      'Log suspicious activity near entrance'
    ]
  },
  {
    category: 'Set Priority',
    examples: [
      'High priority medical incident',
      'Urgent fire alarm at backstage',
      'Medium priority lost child',
      'Low priority noise complaint'
    ]
  },
  {
    category: 'Search',
    examples: [
      'Search medical incidents',
      'Find incidents at main gate',
      'Show high priority incidents'
    ]
  },
  {
    category: 'Update',
    examples: [
      'Update incident one two three',
      'Amend last incident',
      'Change incident priority to high'
    ]
  }
]
