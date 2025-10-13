import React, { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MicrophoneIcon, SparklesIcon } from '@heroicons/react/24/outline'
import VoiceInputButton from '../VoiceInputButton'
import ParsedFieldsPreview from './ParsedFieldsPreview'

export interface ParsedIncidentData {
  incidentType?: string
  location?: string
  callsign?: string
  priority?: 'low' | 'medium' | 'high' | 'urgent'
  description?: string
  confidence?: number
}

interface QuickAddInputProps {
  aiSource?: 'local' | 'cloud' | 'browser' | null
  onQuickAdd: (value: string) => Promise<void>
  onParsedData?: (data: ParsedIncidentData) => void
  isProcessing?: boolean
  showParseButton?: boolean
  autoParseOnEnter?: boolean
  onChangeValue?: (value: string) => void
  className?: string
}

export default function QuickAddInput({
  aiSource,
  onQuickAdd,
  onParsedData,
  isProcessing = false,
  showParseButton = true,
  autoParseOnEnter = false,
  onChangeValue,
  className = ""
}: QuickAddInputProps) {
  const [value, setValue] = useState('')
  const [isParsing, setIsParsing] = useState(false)
  const [parsedData, setParsedData] = useState<ParsedIncidentData | null>(null)
  const [showParsedPreview, setShowParsedPreview] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const parseIncident = async (text: string) => {
    if (!text.trim()) return

    console.log('parseIncident called with:', text); // Debug log
    setIsParsing(true)
    try {
      const response = await fetch('/api/ai-insights', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: `Parse this incident description into structured data: "${text}"
          
          Extract and return a JSON object with these fields:
          - incidentType: The type of incident. Look for these specific types:
            * "Fight" - for fights, altercations, physical confrontations
            * "Medical" - for medical emergencies, injuries, health issues
            * "Security" - for security breaches, suspicious behavior, threats
            * "Theft" - for stolen items, property crimes
            * "Entry Breach" - for unauthorized access, gate violations
            * "Weapon Related" - for weapons, dangerous objects
            * "Crowd Control" - for crowd issues, overcrowding
            * "Fire Safety" - for fire alarms, smoke, fire incidents
            * "Technical" - for equipment failures, technical issues
            * "Attendance" - for attendance updates, headcounts
            * "Other" - only if none of the above match
          - location: The location mentioned (e.g., "main stage", "north gate", "parking area", "entrance")
          - callsign: Any callsign mentioned (e.g., "A1", "R3", "S1", "Security Team", "Medical Team")
          - priority: Priority level based on severity ("low", "medium", "high", "urgent")
          - description: A detailed, factual description of what happened, including:
            * What was observed
            * Who was involved
            * When it occurred (if mentioned)
            * Current status
          - confidence: Confidence score 0-100
          
          Priority guidelines:
          - urgent: Fights, medical emergencies, fires, weapon incidents, security threats
          - high: Theft, entry breaches, major crowd issues
          - medium: Minor medical, suspicious behavior, technical failures
          - low: Routine updates, attendance, minor issues
          
          IMPORTANT: Be very specific about incident types. If the text mentions "fight", "altercation", "confrontation", etc., use "Fight". If it mentions medical terms, use "Medical". Match the most specific type possible.
          
          If a field is not mentioned, omit it from the response.
          Return only valid JSON, no other text.`,
          context: 'incident_parsing'
        })
      })

      if (!response.ok) {
        throw new Error('Failed to parse incident')
      }

      const result = await response.json()
      const parsed = result.response || result.content || result

      // Try to parse the JSON response
      let incidentData: ParsedIncidentData
      try {
        incidentData = JSON.parse(parsed)
      } catch {
        // If parsing fails, try to extract JSON from the response
        const jsonMatch = parsed.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          incidentData = JSON.parse(jsonMatch[0])
        } else {
          throw new Error('Could not parse AI response')
        }
      }

      setParsedData(incidentData)
      setShowParsedPreview(true)
      
      if (onParsedData) {
        onParsedData(incidentData)
      }
    } catch (error) {
      console.error('Failed to parse incident:', error)
      // Fallback to basic parsing
      const fallbackData = parseIncidentFallback(text)
      setParsedData(fallbackData)
      setShowParsedPreview(true)
    } finally {
      setIsParsing(false)
    }
  }

  const parseIncidentFallback = (text: string): ParsedIncidentData => {
    const lowerText = text.toLowerCase()
    
    // Enhanced incident type detection with more specific patterns
    let incidentType = 'Other'
    
    // Check for specific incident types in order of specificity
    if (lowerText.includes('fight') || lowerText.includes('altercation') || lowerText.includes('confrontation') || lowerText.includes('brawl')) {
      incidentType = 'Fight'
    } else if (lowerText.includes('medical') || lowerText.includes('injury') || lowerText.includes('hurt') || lowerText.includes('illness')) {
      incidentType = 'Medical'
    } else if (lowerText.includes('theft') || lowerText.includes('stolen') || lowerText.includes('robbery') || lowerText.includes('pickpocket')) {
      incidentType = 'Theft'
    } else if (lowerText.includes('weapon') || lowerText.includes('knife') || lowerText.includes('gun') || lowerText.includes('blade')) {
      incidentType = 'Weapon Related'
    } else if (lowerText.includes('breach') || lowerText.includes('unauthorized') || lowerText.includes('gate') || lowerText.includes('entry')) {
      incidentType = 'Entry Breach'
    } else if (lowerText.includes('suspicious') || lowerText.includes('security') || lowerText.includes('threat')) {
      incidentType = 'Security'
    } else if (lowerText.includes('crowd') || lowerText.includes('overcrowd') || lowerText.includes('congestion')) {
      incidentType = 'Crowd Control'
    } else if (lowerText.includes('fire') || lowerText.includes('smoke') || lowerText.includes('alarm')) {
      incidentType = 'Fire Safety'
    } else if (lowerText.includes('technical') || lowerText.includes('equipment') || lowerText.includes('failure')) {
      incidentType = 'Technical'
    } else if (lowerText.includes('attendance') || lowerText.includes('headcount') || lowerText.includes('capacity')) {
      incidentType = 'Attendance'
    }

    // Enhanced priority detection based on incident type and keywords
    let priority: 'low' | 'medium' | 'high' | 'urgent' = 'medium'
    
    // Urgent priority for serious incidents
    if (lowerText.includes('urgent') || lowerText.includes('emergency') || 
        incidentType === 'Fight' || incidentType === 'Weapon Related' ||
        lowerText.includes('life') || lowerText.includes('danger')) {
      priority = 'urgent'
    } else if (lowerText.includes('high') || incidentType === 'Theft' || incidentType === 'Entry Breach') {
      priority = 'high'
    } else if (lowerText.includes('low') || incidentType === 'Attendance') {
      priority = 'low'
    }

    // Extract callsign (enhanced pattern matching)
    const callsignMatch = text.match(/\b[A-Z]\d+\b|\b[A-Z]{2,3}\b/)
    const callsign = callsignMatch ? callsignMatch[0] : undefined

    // Extract location (enhanced location detection)
    const locationMatch = text.match(/(main stage|north gate|south gate|east gate|west gate|parking|entrance|exit|pit|arena|stadium|bar|food court|restroom|toilet|stage|backstage)/i)
    const location = locationMatch ? locationMatch[1] : undefined

    return {
      incidentType,
      location,
      callsign,
      priority,
      description: text,
      confidence: 70 // Increased confidence for better fallback
    }
  }

  const submit = async () => {
    if (autoParseOnEnter && value.trim()) {
      await parseIncident(value)
      } else {
      await onQuickAdd(value)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      submit()
    }
  }

  const handleVoiceTranscript = (transcript: string) => {
    setValue(transcript)
    if (onChangeValue) {
      onChangeValue(transcript)
    }
    if (autoParseOnEnter) {
      parseIncident(transcript)
    }
  }

  const handleApplyParsedData = () => {
    if (parsedData && onParsedData) {
      onParsedData(parsedData)
    }
    setShowParsedPreview(false)
    setParsedData(null)
    setValue('')
    if (onChangeValue) {
      onChangeValue('')
    }
  }

  const handleEditParsedData = () => {
    setShowParsedPreview(false)
    // Keep the parsed data for manual editing
  }

  const handleCancelParsedData = () => {
    setShowParsedPreview(false)
    setParsedData(null)
  }

  return (
    <div className="space-y-3">
      <div className="relative" data-tour="quick-add-ai">
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => {
            setValue(e.target.value)
            if (onChangeValue) {
              onChangeValue(e.target.value)
            }
          }}
          onKeyPress={handleKeyPress}
          placeholder="Type incident details and press Enter or click ✨ to parse... (e.g., Medical at main stage, A1 responding)"
          className={`w-full px-4 py-3 pr-24 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base ${className}`}
          disabled={isProcessing || isParsing}
        />
        
        {/* Action buttons */}
        <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-2">
          {/* Parse button */}
          {showParseButton && value.trim() && (
            <button
              onClick={() => parseIncident(value)}
              disabled={isParsing || isProcessing}
              className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors disabled:opacity-50"
              title={isParsing ? "Parsing with AI..." : "Parse with AI (or press Enter)"}
            >
              {isParsing ? (
                <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
              ) : (
                <SparklesIcon className="w-5 h-5" />
              )}
            </button>
          )}
          
          {/* Voice input button */}
          <VoiceInputButton
            onTranscript={handleVoiceTranscript}
            size="small"
            continuous={true}
          />
        </div>
      </div>

      {/* Parsed data preview */}
      <AnimatePresence>
        {showParsedPreview && parsedData && (
          <ParsedFieldsPreview
            data={parsedData}
            onApply={handleApplyParsedData}
            onEdit={handleEditParsedData}
            onCancel={handleCancelParsedData}
          />
        )}
      </AnimatePresence>

      {/* Processing indicator */}
      <AnimatePresence>
      {isProcessing && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400"
          >
            <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            Processing incident...
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}