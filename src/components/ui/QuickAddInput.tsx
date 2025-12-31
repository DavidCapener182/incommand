import React, { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { SparklesIcon, PaperAirplaneIcon, ArrowPathIcon } from '@heroicons/react/24/outline'
import ParsedFieldsPreview from './ParsedFieldsPreview'
import { detectMatchFlowType } from '@/utils/matchFlowParser'

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
  eventType?: string
  homeTeam?: string
  awayTeam?: string
}

export default function QuickAddInput({
  aiSource,
  onQuickAdd,
  onParsedData,
  isProcessing = false,
  showParseButton = true,
  autoParseOnEnter = false,
  onChangeValue,
  className = "",
  eventType,
  homeTeam,
  awayTeam
}: QuickAddInputProps) {
  const [value, setValue] = useState('')
  const [isParsing, setIsParsing] = useState(false)
  const [parsedData, setParsedData] = useState<ParsedIncidentData | null>(null)
  const [showParsedPreview, setShowParsedPreview] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const parseIncident = async (text: string) => {
    if (!text.trim()) return

    console.log('parseIncident called with:', text, 'v2.0'); // Debug log
    console.log('Event type:', eventType, 'Home team:', homeTeam, 'Away team:', awayTeam); // Debug log
    
    // Check for match flow types FIRST (only for football events)
    if (eventType && eventType.toLowerCase() === 'football') {
      console.log('Checking for match flow types...'); // Debug log
      const matchFlowResult = detectMatchFlowType(text, homeTeam, awayTeam);
      console.log('Match flow result:', matchFlowResult); // Debug log
      if (matchFlowResult.type && matchFlowResult.confidence >= 0.5) {
        // Format callsign from match flow type
        const callsign = matchFlowResult.type
          .replace(/\(/g, '')
          .replace(/\)/g, '')
          .replace(/\s+/g, ' ')
          .trim();
        
        const incidentData: ParsedIncidentData = {
          incidentType: matchFlowResult.type,
          location: '',
          callsign: callsign,
          priority: 'low',
          description: matchFlowResult.occurrence || text,
          confidence: matchFlowResult.confidence * 100
        }
        
        setParsedData(incidentData)
        setShowParsedPreview(true)
        return; // Don't call AI API for match flow incidents
      }
    }
    
    setIsParsing(true)
    try {
      const response = await fetch('/api/enhanced-incident-parsing', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          input: text,
          incidentTypes: [
            'Fight', 'Medical', 'Security', 'Theft', 'Entry Breach', 'Weapon Related',
            'Crowd Control', 'Fire Safety', 'Technical', 'Artist On Stage', 'Artist Off Stage',
            'Artist Movement', 'Attendance', 'Ejection', 'Refusal', 'Welfare', 'Suspicious Behaviour',
            'Lost Property', 'Missing Child/Person', 'Site Issue', 'Environmental', 'Crowd Management', 'Evacuation',
            'Fire Alarm', 'Suspected Fire', 'Noise Complaint', 'Animal Incident', 'Alcohol / Drug Related',
            'Hostile Act', 'Counter-Terror Alert', 'Sexual Misconduct', 'Emergency Show Stop',
            'Event Timing', 'Timings', 'Sit Rep', 'Showdown', 'Accreditation', 'Staffing',
            'Accsessablity', 'Other'
          ]
        })
      })

      if (!response.ok) {
        throw new Error('Failed to parse incident')
      }

      const data = await response.json()
      
      // The enhanced-incident-parsing API returns the parsed data directly
      const incidentData: ParsedIncidentData = {
        incidentType: data.incidentType || 'Other',
        location: data.location || '',
        callsign: data.callsign || '',
        priority: data.priority || 'medium',
        description: data.description || text,
        confidence: data.confidence || 80
      }

      setParsedData(incidentData)
      setShowParsedPreview(true)
      
      // Don't call onParsedData here - wait for user to click "Apply All"
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

  const handleUpdateCallsign = (newCallsign: string) => {
    if (parsedData) {
      setParsedData({
        ...parsedData,
        callsign: newCallsign
      })
    }
  }

  return (
    <div className="space-y-3">
      <div className="relative flex items-center w-full shadow-2xl rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent transition-all" data-tour="quick-add-ai">
        {/* Sparkle icon on left */}
        <div className="absolute left-4 text-slate-400">
          {isProcessing || isParsing ? (
            <ArrowPathIcon className="w-5 h-5 animate-spin text-blue-500" />
          ) : (
            <SparklesIcon className="w-5 h-5" />
          )}
        </div>
        
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
          placeholder={isProcessing || isParsing ? "AI is thinking..." : "✨ Ask AI to log details... (e.g. 'Medical at main stage')"}
          className={`w-full pl-12 pr-14 py-4 bg-transparent border-none focus:ring-0 text-slate-900 dark:text-white placeholder:text-slate-400 text-base ${className}`}
          disabled={isProcessing || isParsing}
        />
        
        {/* Send button on right */}
            <button
          onClick={() => {
            if (showParseButton && value.trim()) {
              parseIncident(value)
            } else {
              submit()
            }
          }}
          disabled={isParsing || isProcessing || !value.trim()}
          className="absolute right-2 p-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 dark:disabled:bg-slate-600 text-white rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title={isParsing || isProcessing ? "Processing..." : "Send"}
            >
          <PaperAirplaneIcon className="w-4 h-4" />
            </button>
      </div>

      {/* Parsed data preview */}
      <AnimatePresence>
        {showParsedPreview && parsedData && (
          <ParsedFieldsPreview
            data={parsedData}
            onApply={handleApplyParsedData}
            onEdit={handleEditParsedData}
            onCancel={handleCancelParsedData}
            onUpdateCallsign={handleUpdateCallsign}
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