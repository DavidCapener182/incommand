// src/hooks/useVoiceFeedback.ts

import React, { useState, useCallback, useRef, useEffect, createContext, useContext } from 'react'

interface VoiceFeedbackConfig {
  enableAudioCues: boolean
  enableAnnouncements: boolean
  enableHapticFeedback: boolean
  volume: number
  speechRate: number
  speechPitch: number
}

interface VoiceFeedbackState {
  isListening: boolean
  isProcessing: boolean
  lastTranscript: string | null
  lastError: string | null
  feedbackEnabled: boolean
}

interface VoiceFeedbackActions {
  startListening: () => void
  stopListening: () => void
  playStartCue: () => void
  playStopCue: () => void
  playSuccessCue: () => void
  playErrorCue: () => void
  announceTranscript: (text: string) => void
  announceError: (error: string) => void
  announceSuccess: (message: string) => void
  updateConfig: (config: Partial<VoiceFeedbackConfig>) => void
}

const defaultConfig: VoiceFeedbackConfig = {
  enableAudioCues: true,
  enableAnnouncements: true,
  enableHapticFeedback: true,
  volume: 0.7,
  speechRate: 1.0,
  speechPitch: 1.0
}

// Audio cue URLs (we'll use Web Audio API to generate these)
const generateAudioCue = (frequency: number, duration: number, type: 'sine' | 'square' | 'sawtooth' = 'sine') => {
  return new Promise<AudioBuffer>((resolve) => {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
    const sampleRate = audioContext.sampleRate
    const buffer = audioContext.createBuffer(1, sampleRate * duration, sampleRate)
    const data = buffer.getChannelData(0)
    
    for (let i = 0; i < buffer.length; i++) {
      const t = i / sampleRate
      let sample = 0
      
      switch (type) {
        case 'sine':
          sample = Math.sin(2 * Math.PI * frequency * t)
          break
        case 'square':
          sample = Math.sign(Math.sin(2 * Math.PI * frequency * t))
          break
        case 'sawtooth':
          sample = 2 * (t * frequency - Math.floor(t * frequency + 0.5))
          break
      }
      
      // Apply envelope to prevent clicks
      const envelope = Math.min(1, Math.min(t * 10, (duration - t) * 10))
      data[i] = sample * envelope * 0.3
    }
    
    resolve(buffer)
  })
}

export const useVoiceFeedback = (initialConfig: Partial<VoiceFeedbackConfig> = {}): VoiceFeedbackState & VoiceFeedbackActions => {
  const [config, setConfig] = useState<VoiceFeedbackConfig>({ ...defaultConfig, ...initialConfig })
  const [state, setState] = useState<VoiceFeedbackState>({
    isListening: false,
    isProcessing: false,
    lastTranscript: null,
    lastError: null,
    feedbackEnabled: true
  })

  const audioContextRef = useRef<AudioContext | null>(null)
  const speechSynthesisRef = useRef<SpeechSynthesisUtterance | null>(null)
  const audioBuffersRef = useRef<{
    start?: AudioBuffer
    stop?: AudioBuffer
    success?: AudioBuffer
    error?: AudioBuffer
  }>({})

  // Initialize audio context and generate cues
  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') return
    
    if (config.enableAudioCues) {
      try {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
        
        // Generate audio cues
        Promise.all([
          generateAudioCue(800, 0.1, 'sine'), // Start cue - high pitch
          generateAudioCue(400, 0.2, 'sine'), // Stop cue - low pitch
          generateAudioCue(600, 0.15, 'sine').then(async (buffer) => {
            // Success cue - ascending tone
            const successBuffer = audioContextRef.current!.createBuffer(1, buffer.length * 2, buffer.sampleRate)
            const data = successBuffer.getChannelData(0)
            const sourceData = buffer.getChannelData(0)
            
            for (let i = 0; i < buffer.length; i++) {
              data[i] = sourceData[i] // First tone
              data[i + buffer.length] = sourceData[i] * (1 + i / buffer.length) // Ascending
            }
            return successBuffer
          }),
          generateAudioCue(300, 0.3, 'square') // Error cue - low square wave
        ]).then(([start, stop, success, error]) => {
          audioBuffersRef.current = { start, stop, success, error }
        }).catch((error) => {
          console.warn('Failed to initialize audio cues:', error)
        })
      } catch (error) {
        console.warn('Web Audio API not supported:', error)
      }
    }
  }, [config.enableAudioCues])

  // Play audio cue
  const playAudioCue = useCallback(async (type: 'start' | 'stop' | 'success' | 'error') => {
    if (!config.enableAudioCues || !audioContextRef.current || !audioBuffersRef.current[type]) {
      return
    }

    try {
      const buffer = audioBuffersRef.current[type]!
      const source = audioContextRef.current.createBufferSource()
      const gainNode = audioContextRef.current.createGain()
      
      source.buffer = buffer
      gainNode.gain.value = config.volume
      
      source.connect(gainNode)
      gainNode.connect(audioContextRef.current.destination)
      
      source.start()
    } catch (error) {
      console.warn('Failed to play audio cue:', error)
    }
  }, [config.enableAudioCues, config.volume])

  // Haptic feedback
  const triggerHaptic = useCallback((pattern: 'light' | 'medium' | 'heavy' = 'light') => {
    if (typeof window === 'undefined' || !config.enableHapticFeedback || !('vibrate' in navigator)) {
      return
    }

    const patterns = {
      light: [50],
      medium: [100],
      heavy: [50, 50, 100]
    }

    navigator.vibrate(patterns[pattern])
  }, [config.enableHapticFeedback])

  // Speech synthesis
  const speak = useCallback((text: string, options: { rate?: number; pitch?: number; volume?: number } = {}) => {
    if (typeof window === 'undefined' || !config.enableAnnouncements || !('speechSynthesis' in window)) {
      return
    }

    // Cancel any existing speech
    if (speechSynthesisRef.current) {
      window.speechSynthesis.cancel()
    }

    const utterance = new SpeechSynthesisUtterance(text)
    utterance.rate = options.rate ?? config.speechRate
    utterance.pitch = options.pitch ?? config.speechPitch
    utterance.volume = options.volume ?? config.volume

    speechSynthesisRef.current = utterance
    
    utterance.onend = () => {
      speechSynthesisRef.current = null
    }

    utterance.onerror = (event) => {
      console.warn('Speech synthesis error:', event.error)
      speechSynthesisRef.current = null
    }

    window.speechSynthesis.speak(utterance)
  }, [config.enableAnnouncements, config.speechRate, config.speechPitch, config.volume])

  // Voice feedback actions
  const startListening = useCallback(() => {
    setState(prev => ({ ...prev, isListening: true, isProcessing: false }))
    playAudioCue('start')
    triggerHaptic('light')
    speak('Voice input started', { rate: 1.2 })
  }, [playAudioCue, triggerHaptic, speak])

  const stopListening = useCallback(() => {
    setState(prev => ({ ...prev, isListening: false }))
    playAudioCue('stop')
    triggerHaptic('light')
    speak('Voice input stopped', { rate: 1.2 })
  }, [playAudioCue, triggerHaptic, speak])

  const playStartCue = useCallback(() => {
    playAudioCue('start')
    triggerHaptic('light')
  }, [playAudioCue, triggerHaptic])

  const playStopCue = useCallback(() => {
    playAudioCue('stop')
    triggerHaptic('light')
  }, [playAudioCue, triggerHaptic])

  const playSuccessCue = useCallback(() => {
    playAudioCue('success')
    triggerHaptic('medium')
  }, [playAudioCue, triggerHaptic])

  const playErrorCue = useCallback(() => {
    playAudioCue('error')
    triggerHaptic('heavy')
  }, [playAudioCue, triggerHaptic])

  const announceTranscript = useCallback((text: string) => {
    setState(prev => ({ ...prev, lastTranscript: text }))
    
    // Only announce if text is meaningful (not just single words or very short)
    if (text.trim().split(' ').length >= 2) {
      speak(`Transcript: ${text}`, { rate: 0.9 })
    }
  }, [speak])

  const announceError = useCallback((error: string) => {
    setState(prev => ({ ...prev, lastError: error }))
    playErrorCue()
    speak(`Error: ${error}`, { rate: 0.8, pitch: 0.8 })
  }, [playErrorCue, speak])

  const announceSuccess = useCallback((message: string) => {
    playSuccessCue()
    speak(message, { rate: 1.1, pitch: 1.1 })
  }, [playSuccessCue, speak])

  const updateConfig = useCallback((newConfig: Partial<VoiceFeedbackConfig>) => {
    setConfig(prev => ({ ...prev, ...newConfig }))
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (speechSynthesisRef.current) {
        window.speechSynthesis.cancel()
      }
      if (audioContextRef.current) {
        audioContextRef.current.close()
      }
    }
  }, [])

  return {
    ...state,
    startListening,
    stopListening,
    playStartCue,
    playStopCue,
    playSuccessCue,
    playErrorCue,
    announceTranscript,
    announceError,
    announceSuccess,
    updateConfig
  }
}

// Voice feedback context for global state
export const VoiceFeedbackProvider = ({ children, config = {} }: {
  children: React.ReactNode
  config?: Partial<VoiceFeedbackConfig>
}) => {
  const voiceFeedback = useVoiceFeedback(config)
  
  return React.createElement(
    VoiceFeedbackContext.Provider,
    { value: voiceFeedback },
    children
  )
}

// Context for accessing voice feedback globally
const VoiceFeedbackContext = createContext<ReturnType<typeof useVoiceFeedback> | null>(null)

export const useVoiceFeedbackContext = () => {
  const context = useContext(VoiceFeedbackContext)
  if (!context) {
    throw new Error('useVoiceFeedbackContext must be used within VoiceFeedbackProvider')
  }
  return context
}

// Utility functions for common voice feedback patterns
export const voiceFeedbackUtils = {
  // Announce incident creation
  announceIncidentCreated: (type: string, priority: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return
    const utterance = new SpeechSynthesisUtterance(`Incident created: ${type}, ${priority} priority`)
    utterance.rate = 1.0
    utterance.pitch = 1.1
    window.speechSynthesis.speak(utterance)
  },

  // Announce search results
  announceSearchResults: (count: number) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return
    const utterance = new SpeechSynthesisUtterance(`Found ${count} ${count === 1 ? 'incident' : 'incidents'}`)
    utterance.rate = 1.0
    window.speechSynthesis.speak(utterance)
  },

  // Announce status changes
  announceStatusChange: (from: string, to: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return
    const utterance = new SpeechSynthesisUtterance(`Status changed from ${from} to ${to}`)
    utterance.rate = 1.0
    window.speechSynthesis.speak(utterance)
  },

  // Announce bulk operations
  announceBulkOperation: (action: string, count: number) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return
    const utterance = new SpeechSynthesisUtterance(`${action} ${count} ${count === 1 ? 'incident' : 'incidents'}`)
    utterance.rate = 1.0
    window.speechSynthesis.speak(utterance)
  }
}
