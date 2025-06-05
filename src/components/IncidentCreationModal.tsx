'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '../lib/supabase'

// Custom debounce implementation
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };
    
    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);
  };
}

interface Props {
  isOpen: boolean
  onClose: () => void
  onIncidentCreated: () => void
}

interface IncidentFormData {
  callsign_from: string
  callsign_to: string
  occurrence: string
  incident_type: string
  action_taken: string
  ai_input?: string
  is_closed: boolean
}

interface RefusalDetails {
  policeRequired: boolean
  description: string
  location: string
  reason: string
  banned: boolean
  aggressive: boolean
}

const INCIDENT_TYPES = {
  'Code Red': 'Ejection',
  'Refusal': 'Refusal',
  'Code Green': 'Urgent Medical Incident',
  'Code Purple': 'Non-urgent Medical Incident',
  'Code White': 'Drugs',
  'Code Black': 'Weapon',
  'Artist Movement': 'Artist Movement',
  'Other': 'Other',
  'Sit Rep': 'Sit Rep',
  'Site Issue': 'Maintenance site issue/Cleaner',
  'Timings': 'Timings',
  'Code Pink': 'Sexual Conduct',
  'Attendance': 'Attendance Update'
} as const

type IncidentType = keyof typeof INCIDENT_TYPES

const getIncidentColor = (type: string) => {
  switch(type) {
    case 'Code Red': return 'bg-red-100 text-red-800'
    case 'Refusal': return 'bg-yellow-100 text-yellow-800'
    case 'Code Green': return 'bg-green-100 text-green-800'
    case 'Code Purple': return 'bg-purple-100 text-purple-800'
    case 'Code White': return 'bg-gray-100 text-gray-800'
    case 'Code Black': return 'bg-black text-white'
    case 'Artist Movement': return 'bg-blue-100 text-blue-800'
    case 'Code Pink': return 'bg-pink-100 text-pink-800'
    case 'Attendance': return 'bg-gray-100 text-gray-800'
    default: return 'bg-gray-100 text-gray-800'
  }
}

const getFollowUpQuestions = (incidentType: string): string[] => {
  // Don't show duplicate fields for refusals since they're handled in the Refusal Details section
  if (incidentType === 'Refusal') {
    return [];
  }

  switch (incidentType) {
    case 'Code Red':
      return [
        'Location of incident',
        'Description of person(s)',
        'Reason for ejection',
        'Additional security required?'
      ];
    case 'Code Green':
    case 'Code Purple':
      return [
        'Location of casualty',
        'Nature of injury/illness',
        'Casualty description',
        'Additional resources required?'
      ];
    case 'Code White':
      return [
        'Location of incident',
        'Description of substance',
        'Description of person(s)',
        'Evidence secured?'
      ];
    case 'Code Black':
      return [
        'Location of incident',
        'Description of weapon',
        'Description of person(s)',
        'Police reference number'
      ];
    case 'Code Pink':
      return [
        'Location of incident',
        'Description of person(s)',
        'Nature of incident',
        'Welfare team notified?'
      ];
    case 'Site Issue':
      return [
        'Location of issue',
        'Nature of problem',
        'Priority level',
        'Safety impact'
      ];
    default:
      return [];
  }
};

const detectIncidentType = (input: string): string => {
  const text = input.toLowerCase()
  
  // Check for timing patterns
  if (text.match(/\b(doors|show|curfew|soundcheck)\b/i)) {
    return 'Timings'
  }

  // Check for refusal patterns first
  if (text.match(/\b(refuse|refusing|refusal|denied entry|not allowed|won't comply|non-compliant)\b/i)) {
    return 'Refusal'
  }

  // Check for attendance/current numbers patterns
  const numberPattern = /\b(\d+)\s*(people|pax|capacity|attendance|entered|inside|venue)\b/i
  const currentNumbersPattern = /\bcurrent\s*numbers?\b/i
  const attendancePattern = /\battendance\b/i
  if (text.match(numberPattern) || 
      text.match(currentNumbersPattern) ||
      text.match(attendancePattern) ||
      text.includes('clicker')) {
    return 'Attendance'
  }

  // Check for other sit rep patterns
  if (text.match(/\bsit\s*rep\b/i) || 
      text.match(/\bstatus\b/i) || 
      text.match(/\bposition\b/i) ||
      text.match(/\bcheck\b/i)) {
    return 'Sit Rep'
  }

  // Medical incidents
  if (text.includes('medical')) {
    if (text.includes('urgent') || 
        text.includes('emergency') || 
        text.includes('immediate') ||
        text.includes('critical')) {
      return 'Code Green'
    }
    return 'Code Purple'
  }

  // Security incidents
  if (text.includes('eject') || 
      text.includes('remove') || 
      text.includes('kick out') ||
      text.includes('fighting') ||
      text.includes('aggressive')) {
    return 'Code Red'
  }

  if (text.includes('weapon') || 
      text.includes('knife') || 
      text.includes('gun') ||
      text.includes('armed')) {
    return 'Code Black'
  }

  if (text.includes('drug') || 
      text.includes('substance') || 
      text.includes('pills') ||
      text.includes('powder')) {
    return 'Code White'
  }

  // Artist related
  if (text.includes('artist') || 
      text.includes('performer') || 
      text.includes('band') ||
      text.includes('talent')) {
    return 'Artist Movement'
  }

  // Site issues
  if (text.includes('maintenance') || 
      text.includes('broken') || 
      text.includes('damage') ||
      text.includes('repair') ||
      text.includes('clean') ||
      text.includes('spill') ||
      text.includes('toilet') ||
      text.includes('facility')) {
    return 'Site Issue'
  }

  // Sexual conduct
  if (text.includes('sexual') || 
      text.includes('inappropriate touching') || 
      text.includes('harassment')) {
    return 'Code Pink'
  }

  return 'Other'
}

export default function IncidentCreationModal({ isOpen, onClose, onIncidentCreated }: Props) {
  const [formData, setFormData] = useState<IncidentFormData>({
    callsign_from: '',
    callsign_to: '',
    occurrence: '',
    incident_type: '',
    action_taken: '',
    ai_input: '',
    is_closed: false
  })
  const [refusalDetails, setRefusalDetails] = useState<RefusalDetails>({
    policeRequired: false,
    description: '',
    location: '',
    reason: '',
    banned: false,
    aggressive: false
  })
  const [showRefusalActions, setShowRefusalActions] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [nextLogNumber, setNextLogNumber] = useState<string>('')
  const [followUpAnswers, setFollowUpAnswers] = useState<Record<string, string>>({})
  const [processingAI, setProcessingAI] = useState(false)
  const [missingCallsign, setMissingCallsign] = useState(false)
  const [isEditing, setIsEditing] = useState({
    occurrence: false,
    action_taken: false
  })

  // Timer ref for debouncing
  const processTimer = useRef<NodeJS.Timeout>()

  // Process AI input with debouncing
  const processAIInput = useCallback(async (input: string) => {
    if (!input) {
      setShowRefusalActions(false)
      return
    }

    setProcessingAI(true)
    try {
      // Check for attendance-related input
      const isAttendanceInput = input.toLowerCase().includes('current numbers') || 
                               input.toLowerCase().includes('clicker') ||
                               input.toLowerCase().includes('attendance');

      if (isAttendanceInput) {
        try {
          const numberMatch = input.match(/\b(\d+)\b/);
          
          if (numberMatch) {
            const currentCount = parseInt(numberMatch[1]);
            
            // Get current event for capacity calculation
            const { data: currentEvent } = await supabase
              .from('events')
              .select('id, expected_attendance')
              .eq('is_current', true)
              .single();

            if (currentEvent) {
              const percentageEntered = Math.round((currentCount / currentEvent.expected_attendance) * 100);
              const remaining = currentEvent.expected_attendance - currentCount;

              // Set form data without ai_input field
              setFormData({
                callsign_from: 'Attendance',
                callsign_to: 'Event Control',
                incident_type: 'Attendance',
                occurrence: `Current attendance ${currentCount}.`,
                action_taken: `Current occupancy at ${currentCount} people (${percentageEntered}% of capacity). ${remaining} people remaining to reach capacity.`,
                is_closed: false
              });

              // Update attendance in database
              await supabase
                .from('attendance')
                .upsert({
                  event_id: currentEvent.id,
                  current_count: currentCount,
                  percentage: percentageEntered,
                  remaining: remaining,
                  timestamp: new Date().toISOString()
                }, {
                  onConflict: 'event_id'
                });
            }
          }
        } catch (error) {
          console.error('Error processing attendance:', error);
        }
        setProcessingAI(false);
        return;
      }

      // For non-attendance incidents, proceed with normal processing
      const detectedType = detectIncidentType(input)
      setShowRefusalActions(detectedType === 'Refusal')

      let correctedText = input
        .split('. ')
        .map(sentence => sentence.trim())
        .map(sentence => sentence.charAt(0).toUpperCase() + sentence.slice(1))
        .join('. ');
      
      if (!correctedText.endsWith('.') && !correctedText.endsWith('!') && !correctedText.endsWith('?')) {
        correctedText += '.';
      }

      setFormData(prev => ({
        ...prev,
        incident_type: detectedType,
        occurrence: correctedText,
        action_taken: getDefaultActionTaken(detectedType, correctedText),
        is_closed: detectedType === 'Sit Rep'
      }));

    } catch (error) {
      console.error('Error processing AI input:', error)
      setError('Failed to process input with AI')
    } finally {
      setProcessingAI(false)
    }
  }, [])

  // Handle AI input changes with debouncing
  const handleAIInputChange = (input: string) => {
    // Update the AI input field
    setFormData(prev => ({ ...prev, ai_input: input }))

    // Clear the timer if it exists
    if (processTimer.current) {
      clearTimeout(processTimer.current)
    }

    // Set a new timer
    processTimer.current = setTimeout(() => {
      const detectedType = detectIncidentType(input)
      
      // Update form data with detected type
      setFormData(prev => ({
        ...prev,
        incident_type: detectedType
      }))
      
      // Process the input
      processAIInput(input)
    }, 1000) // 1 second delay
  }

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (processTimer.current) {
        clearTimeout(processTimer.current)
      }
    }
  }, [])

  useEffect(() => {
    if (isOpen) {
      generateNextLogNumber()
    }
  }, [isOpen])

  const generateNextLogNumber = async () => {
    try {
      const { data: currentEvent } = await supabase
        .from('events')
        .select('id, event_name')
        .eq('is_current', true)
        .single()

      if (!currentEvent) {
        setError('No current event found')
        return
      }

      const { count } = await supabase
        .from('incident_logs')
        .select('id', { count: 'exact' })
        .eq('event_id', currentEvent.id)

      const eventPrefix = currentEvent.event_name.replace(/\s+/g, '-').toUpperCase()
      const incidentNumber = String(count ? count + 1 : 1).padStart(3, '0')
      setNextLogNumber(`${eventPrefix}-${incidentNumber}`)
    } catch (err) {
      console.error('Error generating log number:', err)
      setError('Failed to generate log number')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.callsign_from) {
      setMissingCallsign(true)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const { data: currentEvent } = await supabase
        .from('events')
        .select('id')
        .eq('is_current', true)
        .single()

      if (!currentEvent) {
        setError('No current event found')
        return
      }

      // Ensure we're using the correct incident type
      const incidentData = {
        ...formData,
        event_id: currentEvent.id,
        log_number: nextLogNumber,
        timestamp: new Date().toISOString(),
        incident_type: formData.incident_type || detectIncidentType(formData.ai_input || '')
      }

      const { error: insertError } = await supabase
        .from('incident_logs')
        .insert([incidentData])

      if (insertError) throw insertError

      onIncidentCreated?.()
      onClose()
    } catch (err) {
      console.error('Error creating incident:', err)
      setError('Failed to create incident')
    } finally {
      setLoading(false)
    }
  }

  const getDefaultActionTaken = (incidentType: string, occurrence: string): string => {
    switch(incidentType) {
      case 'Timings':
        return 'Time logged and relevant teams notified.'
      case 'Sit Rep':
        return 'Status update logged and acknowledged.'
      case 'Code Green':
        return 'Medical team dispatched. Awaiting further updates.'
      case 'Code Purple':
        return 'Medical team notified. Monitoring situation.'
      case 'Code Red':
        return 'Security team responding. Situation being monitored.'
      case 'Refusal':
        return 'Refusal logged and communicated to all radio holders. Security team monitoring situation.'
      case 'Code Black':
        return 'Security team responding. Police notified if required.'
      case 'Code White':
        return 'Security team responding. Evidence being secured.'
      case 'Artist Movement':
        return 'Security team notified. Movement in progress.'
      case 'Site Issue':
        return 'Maintenance team notified. Awaiting resolution.'
      case 'Code Pink':
        return 'Security team responding. Welfare team notified.'
      case 'Attendance':
        return 'Venue occupancy updated.'
      default:
        return 'Initial report logged, awaiting follow-up actions.'
    }
  }

  const updateRefusalOccurrence = () => {
    // Build a natural language description
    const details = [];
    
    // Start with the basic refusal information
    let mainDescription = 'Refusal';
    
    // Add location if available
    if (refusalDetails.location) {
      mainDescription += ` at ${refusalDetails.location}`;
    }
    
    // Add description of the person
    if (refusalDetails.description) {
      details.push(`Individual described as: ${refusalDetails.description}`);
    }
    
    // Add reason for refusal
    if (refusalDetails.reason) {
      details.push(`Reason for refusal: ${refusalDetails.reason}`);
    }
    
    // Add status flags
    const flags = [];
    if (refusalDetails.banned) {
      flags.push('Individual is banned from the venue');
    }
    if (refusalDetails.aggressive) {
      flags.push('Individual displaying aggressive behavior');
    }
    if (flags.length > 0) {
      details.push(flags.join('. '));
    }

    // Combine all parts
    const occurrence = [mainDescription, ...details]
      .filter(Boolean)
      .join('. ');
    
    // Update form data with the new occurrence
    setFormData(prev => ({
      ...prev,
      occurrence: occurrence,
      action_taken: `Refusal logged and communicated to all radio holders. ${
        refusalDetails.policeRequired ? 'Police assistance requested. ' : ''
      }Security team monitoring situation.`
    }));
  }

  if (!isOpen) return null

  const followUpQuestions = getFollowUpQuestions(formData.incident_type)

  return (
    <div className={`fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 ${isOpen ? '' : 'hidden'}`}>
      <div className="relative top-20 mx-auto p-5 border w-[95%] max-w-4xl shadow-lg rounded-md bg-white">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium">New Incident</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <span className="sr-only">Close</span>
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="bg-gray-50 p-3 rounded">
            <p className="text-sm font-medium text-gray-500">Log Number</p>
            <p className="text-lg font-bold text-gray-900">{nextLogNumber}</p>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">Quick Input</label>
            <div className="space-y-2">
              <textarea
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                value={formData.ai_input}
                onChange={(e) => handleAIInputChange(e.target.value)}
                placeholder="Type your incident details here..."
              />
              
              {/* Quick Actions for Refusals */}
              {showRefusalActions && (
                <div className="space-y-4 border-t border-gray-200 pt-4">
                  <h4 className="font-medium text-gray-900">Refusal Details</h4>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Location</label>
                      <input
                        type="text"
                        value={refusalDetails.location}
                        onChange={(e) => {
                          setRefusalDetails(prev => ({...prev, location: e.target.value}))
                          updateRefusalOccurrence()
                        }}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        placeholder="e.g., Main entrance"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Description</label>
                      <input
                        type="text"
                        value={refusalDetails.description}
                        onChange={(e) => {
                          setRefusalDetails(prev => ({...prev, description: e.target.value}))
                          updateRefusalOccurrence()
                        }}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        placeholder="e.g., Male, red shirt, jeans"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Reason</label>
                    <input
                      type="text"
                      value={refusalDetails.reason}
                      onChange={(e) => {
                        setRefusalDetails(prev => ({...prev, reason: e.target.value}))
                        updateRefusalOccurrence()
                      }}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      placeholder="e.g., Intoxicated, No ID"
                    />
                  </div>

                  <div className="flex space-x-4">
                    <button
                      type="button"
                      onClick={() => {
                        setRefusalDetails(prev => ({...prev, policeRequired: !prev.policeRequired}))
                        updateRefusalOccurrence()
                      }}
                      className={`px-3 py-2 rounded-md text-sm font-medium ${
                        refusalDetails.policeRequired 
                          ? 'bg-red-100 text-red-800 hover:bg-red-200' 
                          : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                      }`}
                    >
                      Police Required
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => {
                        setRefusalDetails(prev => ({...prev, banned: !prev.banned}))
                        updateRefusalOccurrence()
                      }}
                      className={`px-3 py-2 rounded-md text-sm font-medium ${
                        refusalDetails.banned 
                          ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200' 
                          : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                      }`}
                    >
                      Banned Person
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => {
                        setRefusalDetails(prev => ({...prev, aggressive: !prev.aggressive}))
                        updateRefusalOccurrence()
                      }}
                      className={`px-3 py-2 rounded-md text-sm font-medium ${
                        refusalDetails.aggressive 
                          ? 'bg-orange-100 text-orange-800 hover:bg-orange-200' 
                          : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                      }`}
                    >
                      Showing Aggression
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={`block text-sm font-medium ${missingCallsign ? 'text-red-600' : 'text-gray-700'}`}>
                Callsign From {missingCallsign && '(Required)'}
              </label>
              <input
                type="text"
                required
                value={formData.callsign_from}
                onChange={(e) => {
                  setFormData(prev => ({ ...prev, callsign_from: e.target.value }))
                  setMissingCallsign(false)
                }}
                className={`mt-1 block w-full rounded-lg shadow-sm focus:ring-blue-500 ${
                  missingCallsign 
                    ? 'border-red-300 bg-red-50 focus:border-red-500' 
                    : 'border-gray-300 focus:border-blue-500'
                }`}
              />
              {missingCallsign && (
                <p className="mt-1 text-sm text-red-600">Please enter the reporting callsign</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Callsign To</label>
              <input
                type="text"
                required
                value={formData.callsign_to}
                onChange={(e) => setFormData(prev => ({ ...prev, callsign_to: e.target.value }))}
                className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Incident Type</label>
            <select
              required
              value={formData.incident_type}
              onChange={(e) => setFormData(prev => ({ ...prev, incident_type: e.target.value }))}
              className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="">Select Type</option>
              {Object.entries(INCIDENT_TYPES).map(([code, description]) => (
                <option key={code} value={code}>
                  {code}
                </option>
              ))}
            </select>
          </div>

          {/* Only show Additional Information if it's not a refusal and there are follow-up questions */}
          {formData.incident_type !== 'Refusal' && followUpQuestions.length > 0 && (
            <div className="space-y-4 border-t border-gray-200 pt-4">
              <h4 className="font-medium text-gray-900">Additional Information</h4>
              {followUpQuestions.map((question, index) => (
                <div key={index}>
                  <label className="block text-sm font-medium text-gray-700">{question}</label>
                  <input
                    type="text"
                    value={followUpAnswers[question] || ''}
                    onChange={(e) => setFollowUpAnswers(prev => ({
                      ...prev,
                      [question]: e.target.value
                    }))}
                    className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
              ))}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700">Occurrence</label>
            <textarea
              required
              value={formData.occurrence}
              onChange={(e) => setFormData(prev => ({ ...prev, occurrence: e.target.value }))}
              rows={3}
              className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Action Taken</label>
            <textarea
              required
              value={formData.action_taken}
              onChange={(e) => setFormData(prev => ({ ...prev, action_taken: e.target.value }))}
              rows={3}
              className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div className="flex justify-end space-x-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              {loading ? 'Creating...' : 'Create Incident'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
} 