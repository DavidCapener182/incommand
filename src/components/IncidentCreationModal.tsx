'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import Image from 'next/image'
import { supabase } from '../lib/supabase'
import debounce from 'lodash/debounce'
import imageCompression from 'browser-image-compression'
import { useAuth } from '../contexts/AuthContext'
import { usePresence } from '@/hooks/usePresence'
import { ensureBrowserLLM, isBrowserLLMAvailable, parseIncidentWithBrowserLLM, rewriteIncidentFieldsWithBrowserLLM } from '@/services/browserLLMService'
import type { EnhancedIncidentParsingResponse } from '../types/ai'
import { CursorTracker } from '@/components/ui/CursorTracker'
import { TypingIndicator } from '@/components/ui/TypingIndicator'
import { QuickAddInput, ParsedIncidentData } from '@/components/ui/QuickAddInput'
import VoiceInputButton, { VoiceInputCompact } from '@/components/VoiceInputButton'
import { parseVoiceCommand } from '@/hooks/useVoiceInput'
import { detectPriority } from '@/utils/priorityDetection'
import { detectIncidentFromText } from '@/utils/incidentLogic'
import { getRequiredSkillsForIncidentType } from '../lib/incidentAssignment'
import { calculateEscalationTime } from '../lib/escalationEngine'
import IncidentDependencySelector from './IncidentDependencySelector'
import { useToast } from './Toast'
import EscalationTimer from './EscalationTimer'
import { useSwipeModal } from '../hooks/useSwipeGestures'
import { useOfflineSync } from '@/hooks/useOfflineSync'
import useWhat3Words from '@/hooks/useWhat3Words'
import { motion, AnimatePresence } from 'framer-motion'
import { MicrophoneIcon, ArrowPathIcon, CloudArrowUpIcon, WifiIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { validateEntryType, formatTimeDelta } from '@/lib/auditableLogging'
import { EntryType } from '@/types/auditableLog'
import QuickTabs from './QuickTabs'
import IncidentTypeCategories from './IncidentTypeCategories'

interface Props {
  isOpen: boolean
  onClose: () => void
  onIncidentCreated: (incident?: any) => Promise<void>
  initialIncidentType?: string
}

interface IncidentFormData {
  callsign_from: string
  callsign_to: string
  occurrence: string
  incident_type: string
  action_taken: string
  ai_input?: string
  is_closed: boolean
  status: string
  log_number: string
  what3words: string
  priority: string
  location_name?: string
  // Auditable logging fields
  time_of_occurrence?: string
  time_logged?: string
  entry_type?: 'contemporaneous' | 'retrospective'
  retrospective_justification?: string
  // Structured logging template fields
  headline?: string
  source?: string
  facts_observed?: string
  actions_taken?: string
  outcome?: string
  use_structured_template?: boolean
  // dependencies and auto_assign removed per requirements
}

interface RefusalDetails {
  policeRequired: boolean
  description: string
  location: string
  reason: string
  banned: boolean
  aggressive: boolean
}

interface EjectionDetails {
  location: string
  description: string
  reason: string
  policeInformed: boolean
  refusedReentry: boolean
  additionalInfo: {
    locationDetails?: string
    personDescription?: string
    reasonDetails?: string
    additionalSecurity?: boolean
  }
}

interface MedicalDetails {
  location: string;
  requiresAmbulance: boolean;
  refusedTreatment: boolean;
  transportedOffSite: boolean;
}

interface IncidentParserResult {
  occurrence: string;
  action_taken: string;
  callsign_from: string;
  incident_type: string;
  medicalDetails?: MedicalDetails;
  refusalDetails?: RefusalDetails;
  ejectionDetails?: EjectionDetails;
}

const INCIDENT_TYPES = {
  'Ejection': 'Ejection',
  'Refusal': 'Refusal',
  'Medical': 'Medical',
  'Welfare': 'Welfare',
  'Suspicious Behaviour': 'Suspicious Behaviour',
  'Lost Property': 'Lost Property',
  'Attendance': 'Attendance Update',
  'Site Issue': 'Site Issue',
  'Tech Issue': 'Tech Issue',
  'Environmental': 'Environmental',
  'Other': 'Other',
  'Alcohol / Drug Related': 'Alcohol / Drug Related',
  'Weapon Related': 'Weapon Related',
  'Artist Movement': 'Artist Movement',
  'Artist On Stage': 'Artist On Stage',
  'Artist Off Stage': 'Artist Off Stage',
  'Sexual Misconduct': 'Sexual Misconduct',
  'Event Timing': 'Event Timing',
  'Timings': 'Timing Update',
  'Sit Rep': 'Situation Report',
  'Crowd Management': 'Crowd Management',
  'Hostile Act': 'Hostile Act',
  'Fire Alarm': 'Fire Alarm',
  'Noise Complaint': 'Noise Complaint',
  'Evacuation': 'Evacuation',
  'Counter-Terror Alert': 'Counter-Terror Alert',
  'Entry Breach': 'Entry Breach',
  'Theft': 'Theft',
  'Emergency Show Stop': 'Emergency Show Stop',
  'Animal Incident': 'Animal Incident',
  'Missing Child/Person': 'Missing Child/Person',
  'Accreditation': 'Accreditation',
  'Staffing': 'Staffing',
  'Accsessablity': 'Accsessablity',
  'Suspected Fire': 'Suspected Fire',
  'Fire': 'Fire',
  'Showdown': 'Showdown',
  'Fight': 'Fight',
} as const

export const incidentTypes = Object.keys(INCIDENT_TYPES);

type IncidentType = keyof typeof INCIDENT_TYPES

const getIncidentColor = (type: string) => {
  switch(type) {
    case 'Ejection': return 'bg-red-100 text-red-800'
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
    case 'Ejection':
      return [
        'Location of ejection',
        'Description of person(s)',
        'Reason for ejection'
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
  const text = input.toLowerCase();
  
  // --- MISSING CHILD/PERSON DETECTION (PRIORITY) ---
  const missingChildPersonKeywords = [
    'missing child',
    'lost child',
    'missing person',
    'lost person',
    'child missing',
    'person missing',
    'child lost',
    'person lost',
    'runaway child',
    'runaway person',
    'missing kid',
    'lost kid',
    'kid missing',
    'kid lost',
    'unaccompanied child',
    'unaccompanied minor',
    'missing minor',
    'lost minor'
  ];
  if (missingChildPersonKeywords.some(keyword => text.includes(keyword))) {
    return 'Missing Child/Person';
  }

  // Weather Disruption detection
  const weatherKeywords = [
    'heavy rain',
    'strong winds',
    'lightning',
    'flooding',
    'wet ground',
    'stage wet',
    'muddy',
    'slippery',
    'weather warning',
    'high winds',
    'canopy blown',
    'gazebo down',
    'weather affecting',
    'tents collapsed',
    'equipment soaked',
    'unsafe due to rain',
    'wind',
    'canopy down',
    'gazebo blown'
  ];
  
  if (weatherKeywords.some(keyword => text.includes(keyword))) {
    return 'Weather Disruption';
  }

  // Technical Issue detection
  const technicalKeywords = [
    'radio not working',
    'radio failure',
    'no signal',
    'comms down',
    'scanner not working',
    'ticket not scanning',
    'tickets not scanning',
    'scanning issue',
    'scan problem',
    'scanner issue',
    'scanner problem',
    'technical issue',
    'power cut',
    'lights off',
    'systems offline',
    'pa not working',
    'generator tripped',
    'screen down',
    'equipment failure',
    'printer not working',
    'no comms',
    'tech issue',
    'scanner down',
    'lights out'
  ];
  
  if (technicalKeywords.some(keyword => text.includes(keyword))) {
    return 'Technical Issue';
  }

  // Attendance update detection - check this first
  if (/current numbers|clicker|attendance|numbers|capacity|occupancy|count/i.test(text)) {
    // Extract any number from the text
    const numbers = text.match(/\d+/);
    if (numbers) {
      return 'Attendance';
    }
  }

  // Suspicious Behaviour detection
  const suspiciousKeywords = [
    'suspicious',
    'acting strange',
    'unusual behaviour',
    'loitering',
    'following people',
    'won\'t leave',
    'taking pictures',
    'trying to get in',
    'unattended bag',
    'unattended package',
    'suspicious package',
    'abandoned bag',
    'left bag',
    'suspicious item',
    'unauthorised filming',
    'recording',
    'hanging around',
    'watching people',
    'scouting',
    'refusing to move',
    'drone'
  ];

  // Special handling for unattended bags/packages
  const unattendedBagKeywords = [
    'unattended bag',
    'unattended package',
    'suspicious package',
    'abandoned bag',
    'left bag',
    'suspicious item'
  ];
  
  if (suspiciousKeywords.some(keyword => text.includes(keyword))) {
    // If it's an unattended bag, set default action to HOT protocol
    if (unattendedBagKeywords.some(keyword => text.includes(keyword))) {
      return 'Suspicious Behaviour';
    }
    return 'Suspicious Behaviour';
  }

  // Aggressive Behaviour detection
  const aggressiveKeywords = [
    'aggressive',
    'fighting',
    'threatening',
    'shouting',
    'violence',
    'hit',
    'punched',
    'verbal abuse',
    'physical confrontation',
    'rowdy',
    'hostile',
    'kicked off',
    'pushed',
    'security intervened',
    'altercation',
    'argument'
  ];
  
  if (aggressiveKeywords.some(keyword => text.includes(keyword))) {
    // Check for historic references
    const historicTerms = ['previous', 'earlier', 'yesterday', 'last week', 'last time'];
    const isHistoric = historicTerms.some(term => text.includes(term));
    const isCurrentOrActive = /current|active|ongoing|now/i.test(text);
    
    if (!isHistoric || isCurrentOrActive) {
      return 'Suspicious Behaviour';
    }
  }

  // Queue Build-Up detection
  const queueBuildUpKeywords = [
    'queue build',
    'queue building',
    'queue is',
    'queue at',
    'getting busy',
    'crowding',
    'overcrowded',
    'congestion',
    'large queue',
    'backed up',
    'bottleneck',
    'too many people',
    'line forming',
    'packed',
    'crush',
    'gridlock',
    'flow issue',
    'no movement',
    'slow moving',
    'crowd control needed'
  ];
  
  if (queueBuildUpKeywords.some(keyword => text.includes(keyword))) {
    // Check for current tense or active conditions
    const currentTenseIndicators = [
      'is', 'are', 'currently', 'now', 'getting', 'becoming', 'building',
      'forming', 'developing', 'growing', 'increasing', 'will', 'monitor'
    ];
    
    const isCurrentOrActive = currentTenseIndicators.some(indicator => text.includes(indicator)) ||
      !/was|were|earlier|previous|yesterday|last/i.test(text);
    
    if (isCurrentOrActive) {
      return 'Queue Build-Up';
    }
  }

  // Lost Property detection
  const lostPropertyKeywords = [
    'lost',
    'missing',
    'left behind',
    'misplaced',
    'can\'t find',
    'lost property',
    'dropped',
    'phone gone',
    'wallet missing',
    'left my'
  ];
  
  // Check for lost property keywords but exclude if contains refusal/ejection/missing child/person terms
  const exclusionTerms = ['refused', 'ejected', 'removed', 'missing child', 'lost child', 'missing person', 'lost person', 'child missing', 'person missing', 'child lost', 'person lost', 'runaway child', 'runaway person', 'missing kid', 'lost kid', 'kid missing', 'kid lost', 'unaccompanied child', 'unaccompanied minor', 'missing minor', 'lost minor'];
  if (lostPropertyKeywords.some(keyword => text.includes(keyword))) {
    if (!exclusionTerms.some(term => text.includes(term))) {
      return 'Lost Property';
    }
  }

  // Welfare incident detection
  const welfareKeywords = [
    'welfare',
    'intoxicated',
    'drunk',
    'under the influence',
    'distressed',
    'confused',
    'vulnerable',
    'young person alone',
    'mental health',
    'safeguarding',
    'crying',
    'refused help',
    'support needed',
    'alone and unwell'
  ];
  
  if (welfareKeywords.some(keyword => text.includes(keyword))) {
    return 'Welfare';
  }

  // Medical incident detection
  const medicalKeywords = [
    'medical',
    'medic',
    'injury',
    'injured',
    'unwell',
    'collapsed',
    'bleeding',
    'cut',
    'hurt',
    'passed out',
    'seizure',
    'fainted',
    'chest pain',
    'head injury',
    'first aid',
    'ambulance',
    'paramedic'
  ];
  
  if (medicalKeywords.some(keyword => text.includes(keyword))) {
    return 'Medical';
  }

  // Ejection incident detection
  if (/ejected|removed|kicked out|escort(ed)? out|ejection/i.test(text)) {
    return 'Ejection';
  }

  // Refusal incident detection
  if (/refus(ed|al)|deny|denied|not allowed|reject(ed)?|turn(ed)? away/i.test(text)) {
    return 'Refusal';
  }

  // Showdown detection
  if (text.includes('showdown')) {
    return 'Event Timing';
  }

  // Event Timing detection
  if (text.includes('doors open') || text.includes('doors green') || text.includes('venue open')) {
    return 'Event Timing';
  }
  if (text.includes('venue clear')) {
    return 'Event Timing';
  }

  return 'Other';
};

const detectCallsign = (input: string): string => {
  const text = input.toLowerCase();
  
  // Look for common callsign patterns
  const callsignPatterns = [
    /\b([rsa][0-9]+[a-z]*)\b/i,  // R1, S1, A1, R1sc, etc.
    /\b(response\s*[0-9]+)\b/i,  // Response 1, Response2
    /\b(security\s*[0-9]+)\b/i,  // Security 1, Security2
    /\b(admin\s*[0-9]+)\b/i,  // Admin 1, Admin2
  ];

  for (const pattern of callsignPatterns) {
    const match = text.match(pattern);
    if (match) {
      // Standardize format (capitalize R/S/A, no space)
      return match[1].replace(/^(response|security|admin)\s*/i, letter => letter[0].toUpperCase())
                    .replace(/^[rsa]/i, letter => letter.toUpperCase())
                    .toUpperCase();
    }
  }

  return '';
};

// Sanitize location by removing trailing callsign phrases like "by R1", "by R1sc"
const sanitizeLocation = (raw: string | undefined | null): string => {
  if (!raw) return '';
  let loc = String(raw);
  // Remove trailing "by <callsign>" or similar
  loc = loc.replace(/\bby\s+[A-Za-z]*\d+[A-Za-z]*\b/gi, '').trim();
  // Remove duplicate whitespace and trailing punctuation
  loc = loc.replace(/\s+/g, ' ').replace(/[.,\s]+$/g, '').trim();
  return loc;
};

// Clean a sentence: remove callsigns, capitalize, ensure period
const cleanSentence = (raw: string, fallback: string): string => {
  const base = (raw || fallback || '').trim();
  if (!base) return '';
  let text = base;
  // Remove callsign phrases
  text = text.replace(/\bby\s+[A-Za-z]*\d+[A-Za-z]*\b/gi, '').trim();
  // Normalize spaces
  text = text.replace(/\s+/g, ' ').trim();
  // Capitalize first letter
  text = text.charAt(0).toUpperCase() + text.slice(1);
  // Ensure ending punctuation
  if (!/[.!?]$/.test(text)) text += '.';
  return text;
};

// Default action recommendations by incident type
const defaultActionsForType = (incidentType: string): string => {
  const type = (incidentType || '').toLowerCase();
  if (type === 'sexual misconduct' || type.includes('sexual')) {
    return '1. Secure the area and preserve evidence. 2. Contact police immediately. 3. Provide support to the victim and ensure a safe space. 4. Identify and separate any witnesses; document statements. 5. Coordinate medical support as needed. Other:';
  }
  if (type === 'medical') {
    return '1. Dispatch medical team. 2. Ensure scene safety. 3. Gather patient details and symptoms. 4. Prepare for ambulance handover if required. 5. Record timeline and treatments. Other:';
  }
  if (type === 'fight') {
    return '1. Dispatch security to de-escalate. 2. Separate involved parties. 3. Check for injuries and call medical if needed. 4. Identify witnesses/CCTV. 5. Consider removals or arrests. Other:';
  }
  return '1. Assess scene safety. 2. Dispatch appropriate resources. 3. Document key details and witnesses. 4. Communicate updates to control. 5. Review need for escalation. Other:';
};

const parseAttendanceIncident = async (input: string, expectedAttendance: number): Promise<IncidentParserResult | null> => {
  // Extract number from input using various patterns
  const numbers = input.match(/\d+/);
  if (!numbers) return null;

  const count = numbers[0];
  const maxCapacity = expectedAttendance > 0 ? expectedAttendance : 3500;
  const percentage = Math.round((parseInt(count) / maxCapacity) * 100);
  const remaining = maxCapacity - parseInt(count);

  return {
    occurrence: `Current Attendance: ${count}`,
    action_taken: `Attendance at ${count} people (${percentage}% of capacity). ${remaining} people remaining to reach capacity.`,
    callsign_from: 'Attendance',
    incident_type: 'Attendance'
  };
};

// Helper for minimal formatting
function minimalFormatOccurrence(input: string) {
  if (!input) return '';
  let formatted = input.trim();
  formatted = formatted.charAt(0).toUpperCase() + formatted.slice(1);
  if (!/[.!?]$/.test(formatted)) formatted += '.';
  return formatted;
}

const formatOccurrence = (text: string) => {
  if (!text.trim()) return '';
  
  // Extract key information using regex
  const location = text.match(/at\s+the\s+([^,\.]+)/i)?.[1] || '';
  const description = text.match(/male\s+wearing\s+([^,\.]+)/i)?.[1] || '';
  const reason = text.match(/due\s+to\s+([^,\.]+)/i)?.[1] || '';
  const callsign = detectCallsign(text);

  // Build a more detailed occurrence
  const parts = [];

  // Main incident description
  parts.push('Security incident resulted in ejection');

  // Location information
  if (location) {
    parts.push(`at the ${location}`);
  }

  // Reason for ejection
  if (reason) {
    parts.push(`following ${reason}`);
  }

  // Subject description
  if (description) {
    parts.push(`Subject identified as male wearing ${description}`);
  }

  // Action taken
  if (callsign) {
    parts.push(`Ejection carried out by ${callsign}`);
  }

  // Join all parts and ensure proper capitalization and punctuation
  let formatted = parts.join('. ');
  
  // Capitalize first letter of each sentence
  formatted = formatted.replace(/(^\w|\.\s+\w)/g, letter => letter.toUpperCase());
  
  // Ensure proper spacing after punctuation
  formatted = formatted.replace(/([.,!?])\s*/g, '$1 ');
  
  // Remove double spaces
  formatted = formatted.replace(/\s+/g, ' ');
  
  // Fix common security terms
  const securityTerms: {[key: string]: string} = {
    'kicked out': 'removed',
    'thrown out': 'removed',
    'kicked': 'ejected',
    'thrown': 'ejected',
    'fighting': 'physical altercation',
    'fight': 'physical altercation'
  };
  
  Object.entries(securityTerms).forEach(([incorrect, correct]) => {
    formatted = formatted.replace(new RegExp(`\\b${incorrect}\\b`, 'gi'), correct);
  });
  
  // Ensure the text ends with proper punctuation
  if (!/[.!?]$/.test(formatted)) {
    formatted += '.';
  }
  
  return formatted.trim();
};

const buildActionTaken = (input: string) => {
  const text = input.toLowerCase();
  const actions = ['Individual ejected from venue for safety and security reasons'];
  
  // Location context
  const locationMatch = text.match(/at\s+the\s+([^,.]+)/i);
  if (locationMatch) {
    actions[0] += ` from ${locationMatch[1]} area`;
  }

  if (/fight|altercation|aggressive/i.test(text)) {
    actions.push('Incident logged as physical altercation');
  }
  
  if (/police|authorities/i.test(text)) {
    actions.push('Police informed');
  }
  
  if (/refuse|ban|not allowed/i.test(text)) {
    actions.push('Re-entry refused');
  }
  
  if (/backup|support|additional security/i.test(text)) {
    actions.push('Additional security deployed');
  }

  return actions.join('. ') + '.';
};

const parseRefusalIncident = async (input: string): Promise<IncidentParserResult> => {
  const text = input.toLowerCase();
  
  // Extract location
  let location = '';
  const locationMatch = text.match(/(?:at|near|by)\s+(the\s+)?([^,\.]+)(?:,|\.|$)/i);
  if (locationMatch) {
    location = locationMatch[2].trim();
  }

  // Extract description (looking for clothing or appearance details)
  let description = '';
  const clothingMatch = text.match(/(?:wearing|in)\s+([^,\.]+)(?:,|\.|$)/i);
  const personMatch = text.match(/(?:male|female|person)\s+([^,\.]+)(?:,|\.|$)/i);
  if (clothingMatch) {
    description = clothingMatch[0];
  }
  if (personMatch) {
    description = description ? `${description}, ${personMatch[0]}` : personMatch[0];
  }

  // Extract reason
  let reason = '';
  const reasonMatch = text.match(/(?:for|due to)\s+([^,\.]+)(?:,|\.|$)/i);
  if (reasonMatch) {
    reason = reasonMatch[1].trim();
  }

  // Detect aggression
  const aggressive = /(?:aggress|violent|threat|fight)/i.test(text);

  // Extract callsign
  const callsign = detectCallsign(input);

  // Create the refusal details
  const refusalDetails: RefusalDetails = {
    location: location || 'Main entrance', // Default to main entrance if not specified
    description: description || 'Person',
    reason: reason || 'Intoxication', // Default to intoxication if not specified
    policeRequired: aggressive, // Set police required if aggressive
    banned: false, // Default to false
    aggressive: aggressive
  };

  try {
    // Generate a more detailed occurrence using GPT
    const response = await fetch('/api/generate-refusal-details', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        location: refusalDetails.location,
        description: refusalDetails.description,
        reason: refusalDetails.reason,
        aggressive: refusalDetails.aggressive
      })
    });

    if (!response.ok) {
      throw new Error('Failed to generate refusal details');
    }

    const data = await response.json();
    
    return {
      refusalDetails,
      occurrence: minimalFormatOccurrence(input),
      action_taken: data.action_taken || `Refusal logged and communicated to all radio holders. ${
        aggressive ? 'Police assistance requested. ' : ''
      }Security team monitoring situation.`,
      callsign_from: callsign || '',
      incident_type: 'Refusal'
    };
  } catch (error) {
    console.error('Error generating refusal details:', error);
    // Return basic details if AI generation fails
    return {
      refusalDetails,
      occurrence: minimalFormatOccurrence(input),
      action_taken: `Refusal logged and communicated to all radio holders. ${
        aggressive ? 'Police assistance requested. ' : ''
      }Security team monitoring situation.`,
      callsign_from: callsign || '',
      incident_type: 'Refusal'
    };
  }
};

const parseEjectionIncident = async (input: string): Promise<IncidentParserResult> => {
  try {
    const text = input.toLowerCase();
    const callsign = detectCallsign(input) || '';
    const location = extractLocation(input) || 'venue';

    // Extract description
    let description = '';
    const personMatch = text.match(/(?:male|female|person|individual)\s+([^,\.]+)(?:,|\.|$)/i);
    if (personMatch) {
      description = personMatch[0].trim();
    }

    // Extract reason
    let reason = '';
    const reasonMatch = text.match(/(?:for|after|due to)\s+([^,\.]+)(?:,|\.|$)/i);
    if (reasonMatch) {
      reason = reasonMatch[1].trim();
    }

    // Detect flags
    const policeInformed = /(?:police|authorities)\b/i.test(text);
    const refusedReentry = /(?:refused re-entry|banned|not allowed back)\b/i.test(text);
    const additionalSecurity = /(?:backup|assistance|support|additional security|more staff)\b/i.test(text);

    try {
      // Generate a more detailed occurrence using GPT
      const response = await fetch('/api/generate-ejection-details', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          input,
          location,
          description,
          reason,
          policeInformed,
          refusedReentry,
          additionalSecurity,
          callsign
        })
      });

      if (!response.ok) {
        throw new Error('Failed to generate ejection details');
      }

      const data = await response.json();

      const ejectionDetails: EjectionDetails = {
        location,
        description: description || 'Individual',
        reason: reason || 'unacceptable behavior',
        policeInformed,
        refusedReentry,
        additionalInfo: {
          additionalSecurity
        }
      };

      return {
        ejectionDetails,
        occurrence: minimalFormatOccurrence(input),
        action_taken: data.action_taken || 'Individual ejected from venue.',
        callsign_from: callsign,
        incident_type: 'Ejection'
      };
    } catch (error) {
      console.error('Error generating ejection details:', error);
      // Return basic details if AI generation fails
      return {
        ejectionDetails: {
          location,
          description: description || 'Individual',
          reason: reason || 'unacceptable behavior',
          policeInformed,
          refusedReentry,
          additionalInfo: {
            additionalSecurity
          }
        },
        occurrence: minimalFormatOccurrence(input),
        action_taken: 'Individual ejected from venue.',
        callsign_from: callsign,
        incident_type: 'Ejection'
      };
    }
  } catch (error: any) {
    console.error('Error in parseEjectionIncident:', error);
    return {
      ejectionDetails: {
        location: 'venue',
        description: 'Individual',
        reason: 'unacceptable behavior',
        policeInformed: false,
        refusedReentry: false,
        additionalInfo: {
          additionalSecurity: false
        }
      },
      occurrence: minimalFormatOccurrence(input),
      action_taken: 'Individual ejected from venue.',
      callsign_from: '',
      incident_type: 'Ejection'
    };
  }
};

const parseMedicalIncident = async (input: string): Promise<IncidentParserResult> => {
  try {
    const text = input.toLowerCase();
    const callsign = detectCallsign(input) || '';
    const location = extractLocation(input) || 'venue';

    // Detect flags
    const requiresAmbulance = /(?:ambulance|paramedic|emergency services)\b/i.test(text);
    const refusedTreatment = /(?:refused|declined|denies)\s+(?:treatment|assistance|help)\b/i.test(text);
    const transportedOffSite = /(?:transported|taken|moved)\s+(?:to|off site|hospital)\b/i.test(text);

    try {
      // Generate a more detailed occurrence using GPT
      const response = await fetch('/api/generate-medical-details', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          input,
          location,
          requiresAmbulance,
          refusedTreatment,
          transportedOffSite,
          callsign
        })
      });

      if (!response.ok) {
        throw new Error('Failed to generate medical details');
      }

      const data = await response.json();

      const medicalDetails: MedicalDetails = {
        location,
        requiresAmbulance,
        refusedTreatment,
        transportedOffSite
      };

      return {
        medicalDetails,
        occurrence: minimalFormatOccurrence(input),
        action_taken: data.action_taken || 'Medics dispatched to location.',
        callsign_from: callsign,
        incident_type: 'Medical'
      };
    } catch (error) {
      console.error('Error generating medical details:', error);
      // Return basic details if AI generation fails
      return {
        medicalDetails: {
          location,
          requiresAmbulance,
          refusedTreatment,
          transportedOffSite
        },
        occurrence: minimalFormatOccurrence(input),
        action_taken: 'Medics dispatched to location.',
        callsign_from: callsign,
        incident_type: 'Medical'
      };
    }
  } catch (error: any) {
    console.error('Error in parseMedicalIncident:', error);
    return {
      medicalDetails: {
        location: 'venue',
        requiresAmbulance: false,
        refusedTreatment: false,
        transportedOffSite: false
      },
      occurrence: minimalFormatOccurrence(input),
      action_taken: 'Medics dispatched to location.',
      callsign_from: '',
      incident_type: 'Medical'
    };
  }
};

const parseWelfareIncident = async (input: string): Promise<IncidentParserResult> => {
  try {
    const text = input.toLowerCase();
    const callsign = detectCallsign(input) || '';
    const location = extractLocation(input) || 'venue';

    try {
      // Generate a more detailed occurrence using GPT
      const response = await fetch('/api/generate-welfare-details', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          input,
          location,
          callsign
        })
      });

      if (!response.ok) {
        throw new Error('Failed to generate welfare details');
      }

      const data = await response.json();

      return {
        occurrence: minimalFormatOccurrence(input),
        action_taken: data.action_taken || 'Welfare team dispatched to assess and support.',
        callsign_from: callsign,
        incident_type: 'Welfare'
      };
    } catch (error) {
      console.error('Error generating welfare details:', error);
      // Return basic details if AI generation fails
      return {
        occurrence: minimalFormatOccurrence(input),
        action_taken: 'Welfare team dispatched to assess and support.',
        callsign_from: callsign,
        incident_type: 'Welfare'
      };
    }
  } catch (error: any) {
    console.error('Error in parseWelfareIncident:', error);
    return {
      occurrence: minimalFormatOccurrence(input),
      action_taken: 'Welfare team dispatched to assess and support.',
      callsign_from: '',
      incident_type: 'Welfare'
    };
  }
};

const parseLostPropertyIncident = async (input: string): Promise<IncidentParserResult> => {
  try {
    const text = input.toLowerCase();
    const callsign = detectCallsign(input) || '';
    const location = extractLocation(input) || 'venue';

    try {
      // Generate a more detailed occurrence using GPT
      const response = await fetch('/api/generate-lost-property-details', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          input,
          location,
          callsign
        })
      });

      if (!response.ok) {
        throw new Error('Failed to generate lost property details');
      }

      const data = await response.json();

      return {
        occurrence: minimalFormatOccurrence(`Lost Property: ${input}`),
        action_taken: data.action_taken || 'Lost property report created, awaiting update',
        callsign_from: callsign,
        incident_type: 'Lost Property'
      };
    } catch (error) {
      console.error('Error generating lost property details:', error);
      // Return basic details if AI generation fails
      return {
        occurrence: minimalFormatOccurrence(`Lost Property: ${input}`),
        action_taken: 'Lost property report created, awaiting update',
        callsign_from: callsign,
        incident_type: 'Lost Property'
      };
    }
  } catch (error: any) {
    console.error('Error in parseLostPropertyIncident:', error);
    return {
      occurrence: minimalFormatOccurrence(`Lost Property: ${input}`),
      action_taken: 'Lost property report created, awaiting update',
      callsign_from: '',
      incident_type: 'Lost Property'
    };
  }
};

const parseSuspiciousBehaviourIncident = async (input: string): Promise<IncidentParserResult> => {
  try {
    const text = input.toLowerCase();
    const callsign = detectCallsign(input) || '';
    const location = extractLocation(input) || 'venue';

    // Check if this is an unattended bag incident
    const isUnattendedBag = /unattended bag|unattended package|suspicious package|abandoned bag|left bag|suspicious item/i.test(text);

    try {
      // Generate a more detailed occurrence using GPT
      const response = await fetch('/api/generate-suspicious-details', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          input,
          location,
          callsign,
          isUnattendedBag
        })
      });

      if (!response.ok) {
        throw new Error('Failed to generate suspicious behaviour details');
      }

      const data = await response.json();

      // Default action taken for unattended bags if GPT fails
      const defaultActionTaken = isUnattendedBag
        ? 'HOT protocol initiated - Hidden: Assessing, Obviously suspicious: Checking, Typical: Evaluating. Area cordoned, awaiting assessment.'
        : 'Behaviour under observation';

      return {
        occurrence: data.occurrence || input,
        action_taken: data.actionTaken || defaultActionTaken,
        callsign_from: callsign || location,
        incident_type: 'Suspicious Behaviour'
      };
    } catch (error) {
      console.error('Error in suspicious behaviour GPT processing:', error);
      // Fallback to basic formatting if GPT fails
      const defaultActionTaken = isUnattendedBag
        ? 'HOT protocol initiated - Hidden: Assessing, Obviously suspicious: Checking, Typical: Evaluating. Area cordoned, awaiting assessment.'
        : 'Behaviour under observation';

      return {
        occurrence: input,
        action_taken: defaultActionTaken,
        callsign_from: callsign || location,
        incident_type: 'Suspicious Behaviour'
      };
    }
  } catch (error) {
    console.error('Error in suspicious behaviour parsing:', error);
    throw error;
  }
};

const parseAggressiveBehaviourIncident = async (input: string): Promise<IncidentParserResult> => {
  try {
    const text = input.toLowerCase();
    const callsign = detectCallsign(input) || '';
    const location = extractLocation(input) || 'venue';

    // Detect key flags
    const policeRequired = /police|authorities|emergency|backup/i.test(text);
    const physicalViolence = /fight|punch|hit|kick|push|physical|assault/i.test(text);
    const verbalAbuse = /shout|verbal|threat|abuse|aggressive language/i.test(text);
    const securityIntervention = /security|intervened|removed|separated|stopped/i.test(text);

    try {
      // Generate a more detailed occurrence using GPT
      const response = await fetch('/api/generate-aggressive-details', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          input,
          location,
          callsign,
          policeRequired,
          physicalViolence,
          verbalAbuse,
          securityIntervention
        })
      });

      if (!response.ok) {
        throw new Error('Failed to generate aggressive behaviour details');
      }

      const data = await response.json();

      // Default action taken based on severity
      let defaultActionTaken = 'Security monitoring situation. ';
      if (physicalViolence) {
        defaultActionTaken += 'Individuals separated and situation contained. ';
      }
      if (policeRequired) {
        defaultActionTaken += 'Police notified and en route. ';
      }
      if (securityIntervention) {
        defaultActionTaken += 'Security team has intervened. ';
      }
      defaultActionTaken = defaultActionTaken.trim();

      return {
        occurrence: data.occurrence || input,
        action_taken: data.actionTaken || defaultActionTaken,
        callsign_from: callsign || location,
        incident_type: 'Suspicious Behaviour'
      };
    } catch (error) {
      console.error('Error in aggressive behaviour GPT processing:', error);
      // Fallback to basic formatting if GPT fails
      let defaultActionTaken = 'Security monitoring situation. ';
      if (physicalViolence) {
        defaultActionTaken += 'Individuals separated and situation contained. ';
      }
      if (policeRequired) {
        defaultActionTaken += 'Police notified and en route. ';
      }
      if (securityIntervention) {
        defaultActionTaken += 'Security team has intervened. ';
      }
      defaultActionTaken = defaultActionTaken.trim();

      return {
        occurrence: input,
        action_taken: defaultActionTaken,
        callsign_from: callsign || location,
        incident_type: 'Suspicious Behaviour'
      };
    }
  } catch (error) {
    console.error('Error in aggressive behaviour parsing:', error);
    throw error;
  }
};

const parseQueueBuildUpIncident = async (input: string): Promise<IncidentParserResult> => {
  try {
    const text = input.toLowerCase();
    const callsign = detectCallsign(input) || '';
    const location = extractLocation(input) || 'venue';

    // Detect key flags
    const interventionNeeded = /assistance|help|support|backup|response|team|staff needed|open more|additional/i.test(text);
    const redirectionMentioned = /redirect|alternative|different|other|route|entry|gate|path/i.test(text);
    const stableFlow = /stable|steady|maintaining|controlled|managed|moving/i.test(text);
    const severeCrowding = /severe|critical|urgent|immediate|dangerous|crush|emergency/i.test(text);
    const monitoringSituation = /monitor|watch|observe|assess|check/i.test(text);

    try {
      // Generate a more detailed occurrence using GPT
      const response = await fetch('/api/generate-queue-details', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          input,
          location,
          callsign,
          interventionNeeded,
          redirectionMentioned,
          stableFlow,
          severeCrowding,
          monitoringSituation
        })
      });

      if (!response.ok) {
        throw new Error('Failed to generate queue build-up details');
      }

      const data = await response.json();

      // Default action taken based on conditions
      let defaultActionTaken = 'Monitoring ongoing, awaiting update from staff on ground. ';
      if (interventionNeeded) {
        defaultActionTaken = 'Response team dispatched to assist. Additional lanes to be opened based on monitoring results. ';
      }
      if (redirectionMentioned) {
        defaultActionTaken += 'Crowd redirected to alternate entry point. ';
      }
      if (stableFlow) {
        defaultActionTaken = 'Crowd monitored – flow maintained. ';
      }
      if (severeCrowding) {
        defaultActionTaken += 'Immediate crowd control measures implemented. ';
      }
      if (monitoringSituation) {
        defaultActionTaken = 'Security team monitoring situation and will implement additional measures if needed. ';
      }
      defaultActionTaken = defaultActionTaken.trim();

      return {
        occurrence: data.occurrence || `Queue build-up reported at ${location}`,
        action_taken: data.actionTaken || defaultActionTaken,
        callsign_from: callsign || location,
        incident_type: 'Queue Build-Up'
      };
    } catch (error) {
      console.error('Error in queue build-up GPT processing:', error);
      // Fallback to basic formatting if GPT fails
      let defaultActionTaken = 'Monitoring ongoing, awaiting update from staff on ground. ';
      if (interventionNeeded) {
        defaultActionTaken = 'Response team dispatched to assist. Additional lanes to be opened based on monitoring results. ';
      }
      if (redirectionMentioned) {
        defaultActionTaken += 'Crowd redirected to alternate entry point. ';
      }
      if (stableFlow) {
        defaultActionTaken = 'Crowd monitored – flow maintained. ';
      }
      if (severeCrowding) {
        defaultActionTaken += 'Immediate crowd control measures implemented. ';
      }
      if (monitoringSituation) {
        defaultActionTaken = 'Security team monitoring situation and will implement additional measures if needed. ';
      }
      defaultActionTaken = defaultActionTaken.trim();

      return {
        occurrence: `Queue build-up reported at ${location}`,
        action_taken: defaultActionTaken,
        callsign_from: callsign || location,
        incident_type: 'Queue Build-Up'
      };
    }
  } catch (error) {
    console.error('Error in queue build-up parsing:', error);
    throw error;
  }
};

const parseTechnicalIncident = async (input: string): Promise<IncidentParserResult> => {
  try {
    const text = input.toLowerCase();
    const callsign = detectCallsign(input) || '';
    const location = extractLocation(input) || 'venue';

    // Detect key flags
    const isResolved = /resolved|fixed|working|repaired|back up|restored/i.test(text);
    const needsTechTeam = /tech team|engineer|specialist|support needed|escalate/i.test(text);
    const hasWorkaround = /workaround|temporary|alternative|backup|manual|interim/i.test(text);
    const isSiteWide = /site wide|all|everywhere|entire|whole site|multiple/i.test(text);
    const isScanner = /scanner|scanning|ticket.*scan|scan.*ticket/i.test(text);
    const isUrgent = /urgent|asap|immediately|priority|critical/i.test(text);

    try {
      // Generate a more detailed occurrence using GPT
      const response = await fetch('/api/generate-technical-details', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          input,
          location,
          callsign,
          isResolved,
          needsTechTeam,
          hasWorkaround,
          isSiteWide,
          isScanner,
          isUrgent
        })
      });

      if (!response.ok) {
        throw new Error('Failed to generate technical issue details');
      }

      const data = await response.json();

      // Default action taken based on conditions
      let defaultActionTaken = '';
      if (isResolved) {
        defaultActionTaken = 'Issue resolved on site';
      } else if (needsTechTeam || isScanner) {
        defaultActionTaken = 'Technical team notified and en route. Security team monitoring situation.';
      } else if (hasWorkaround) {
        defaultActionTaken = 'Temporary workaround in place – awaiting technical support';
      } else {
        defaultActionTaken = 'Issue logged and being investigated. Technical team notified.';
      }

      // Add urgency to action taken if needed
      if (isUrgent && !isResolved) {
        defaultActionTaken = 'URGENT: ' + defaultActionTaken;
      }

      // Add monitoring note for scanner issues
      if (isScanner && !isResolved) {
        defaultActionTaken += ' Staff advised to implement manual checks if needed.';
      }

      return {
        occurrence: data.occurrence || `Technical issue: ${isScanner ? 'Ticket scanning system' : 'Equipment'} malfunction reported at ${location}`,
        action_taken: data.actionTaken || defaultActionTaken,
        callsign_from: callsign || location,
        incident_type: 'Technical Issue'
      };
    } catch (error) {
      console.error('Error in technical issue GPT processing:', error);
      // Fallback to basic formatting if GPT fails
      let defaultActionTaken = '';
      if (isResolved) {
        defaultActionTaken = 'Issue resolved on site';
      } else if (needsTechTeam || isScanner) {
        defaultActionTaken = 'Technical team notified and en route. Security team monitoring situation.';
      } else if (hasWorkaround) {
        defaultActionTaken = 'Temporary workaround in place – awaiting technical support';
      } else {
        defaultActionTaken = 'Issue logged and being investigated. Technical team notified.';
      }

      // Add urgency to action taken if needed
      if (isUrgent && !isResolved) {
        defaultActionTaken = 'URGENT: ' + defaultActionTaken;
      }

      // Add monitoring note for scanner issues
      if (isScanner && !isResolved) {
        defaultActionTaken += ' Staff advised to implement manual checks if needed.';
      }

      return {
        occurrence: `Technical issue: ${isScanner ? 'Ticket scanning system' : 'Equipment'} malfunction reported at ${location}`,
        action_taken: defaultActionTaken,
        callsign_from: callsign || location,
        incident_type: 'Technical Issue'
      };
    }
  } catch (error) {
    console.error('Error in technical issue parsing:', error);
    throw error;
  }
};

const parseWeatherDisruptionIncident = async (input: string): Promise<IncidentParserResult> => {
  try {
    const text = input.toLowerCase();
    const callsign = detectCallsign(input) || '';
    const location = extractLocation(input) || 'venue';

    // Detect key flags
    const isResolved = /contained|resolved|fixed|cleared|safe|secured/i.test(text);
    const needsSafetyTeam = /safety|risk|assessment|unsafe|dangerous|hazard/i.test(text);
    const requiresRouteChange = /route|divert|redirect|close|block|alternative|access/i.test(text);
    const isUrgent = /immediate|urgent|asap|emergency|critical/i.test(text);
    const isLightning = /lightning|thunder|strike/i.test(text);
    const isFlooding = /flood|water|submerged|pooling/i.test(text);
    const isWindRelated = /wind|blown|canopy|gazebo|tent/i.test(text);
    const isSlipperyConditions = /slip|mud|wet.*ground|ground.*wet/i.test(text);

    try {
      // Generate a more detailed occurrence using GPT
      const response = await fetch('/api/generate-weather-details', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          input,
          location,
          callsign,
          isResolved,
          needsSafetyTeam,
          requiresRouteChange,
          isUrgent,
          isLightning,
          isFlooding,
          isWindRelated,
          isSlipperyConditions
        })
      });

      if (!response.ok) {
        throw new Error('Failed to generate weather disruption details');
      }

      const data = await response.json();

      // Default action taken based on conditions
      let defaultActionTaken = '';
      if (isResolved) {
        defaultActionTaken = 'Hazard contained – area made safe';
      } else if (needsSafetyTeam || isLightning) {
        defaultActionTaken = 'Safety team notified – risk assessment ongoing';
        if (isLightning) {
          defaultActionTaken += '. Lightning procedure initiated.';
        }
      } else if (requiresRouteChange) {
        defaultActionTaken = 'Route or operation amended due to conditions';
      } else {
        defaultActionTaken = 'Weather impact being monitored. Safety measures in place.';
      }

      // Add specific safety measures based on conditions
      if (isFlooding && !isResolved) {
        defaultActionTaken += ' Drainage team deployed. Area cordoned off.';
      }
      if (isWindRelated && !isResolved) {
        defaultActionTaken += ' Structures being secured. Wind speeds monitored.';
      }
      if (isSlipperyConditions && !isResolved) {
        defaultActionTaken += ' Additional matting/grip measures implemented.';
      }

      // Add urgency prefix if needed
      if (isUrgent && !isResolved) {
        defaultActionTaken = 'URGENT: ' + defaultActionTaken;
      }

      return {
        occurrence: data.occurrence || `Weather disruption: ${location} affected by adverse conditions`,
        action_taken: data.actionTaken || defaultActionTaken,
        callsign_from: callsign || location,
        incident_type: 'Weather Disruption'
      };
    } catch (error) {
      console.error('Error in weather disruption GPT processing:', error);
      // Fallback to basic formatting if GPT fails
      let defaultActionTaken = '';
      if (isResolved) {
        defaultActionTaken = 'Hazard contained – area made safe';
      } else if (needsSafetyTeam || isLightning) {
        defaultActionTaken = 'Safety team notified – risk assessment ongoing';
        if (isLightning) {
          defaultActionTaken += '. Lightning procedure initiated.';
        }
      } else if (requiresRouteChange) {
        defaultActionTaken = 'Route or operation amended due to conditions';
      } else {
        defaultActionTaken = 'Weather impact being monitored. Safety measures in place.';
      }

      // Add specific safety measures based on conditions
      if (isFlooding && !isResolved) {
        defaultActionTaken += ' Drainage team deployed. Area cordoned off.';
      }
      if (isWindRelated && !isResolved) {
        defaultActionTaken += ' Structures being secured. Wind speeds monitored.';
      }
      if (isSlipperyConditions && !isResolved) {
        defaultActionTaken += ' Additional matting/grip measures implemented.';
      }

      // Add urgency prefix if needed
      if (isUrgent && !isResolved) {
        defaultActionTaken = 'URGENT: ' + defaultActionTaken;
      }

      return {
        occurrence: `Weather disruption: ${location} affected by adverse conditions`,
        action_taken: defaultActionTaken,
        callsign_from: callsign || location,
        incident_type: 'Weather Disruption'
      };
    }
  } catch (error) {
    console.error('Error in weather disruption parsing:', error);
    throw error;
  }
};

// Helper function to extract location from input
const extractLocation = (input: string): string | null => {
  const locationMatch = input.match(/(?:at|in|near|by|from|to)\s+(the\s+)?([^,\.]+)(?:,|\.|$)/i);
  return locationMatch ? locationMatch[2].trim() : null;
};

// Utility to normalise artist name for log number prefix
function normaliseArtistName(name: string) {
  if (!name) return 'event';
  let cleaned = name.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
  if (cleaned.length > 9) cleaned = cleaned.slice(0, 9);
  return cleaned;
}

// Add the INCIDENT_ACTIONS mapping at the top-level (outside the component)
const INCIDENT_ACTIONS: Record<string, string[]> = {
  'Ejection': [
    'Individual removed from site',
    'Police notified',
    'Banned for duration of event',
    'Details shared with all staff',
    'First aid provided to ejected person',
    'Physical intervention required',
    'Incident logged with CCTV evidence',
    'Parent/guardian informed (if under 18)',
    'Suspect refused to leave; police intervened',
    'Other (specify)'
  ],
  'Refusal': [
    'Entry refused at gate',
    'Reason explained to attendee',
    'Police notified (if aggressive)',
    'Radio communication sent',
    'Details recorded in log',
    'Refused due to intoxication',
    'Refused due to lack of ticket',
    'Refused due to banned item',
    'Attempted re-entry after refusal',
    'Escalated to supervisor/manager',
    'Other'
  ],
  'Medical': [
    'First aid deployed',
    'Ambulance called',
    'Treated on scene',
    'Refused treatment',
    'Hospitalised',
    'Medical team monitoring',
    'Family/next of kin contacted',
    'Incident logged for insurance',
    'Area cleared for emergency access',
    'Medical notes attached',
    'Defibrillator used',
    'Other'
  ],
  'Welfare': [
    'Welfare team deployed',
    'Assessed by team',
    'Escorted to safe area',
    'Awaiting collection by friend/family',
    'Provided with water/refreshments',
    'Transport arranged',
    'Supported until recovered',
    'Referred to medical team',
    'Referred to police/social services',
    'Escalated to safeguarding lead',
    'Mental health crisis support provided',
    'Self-harm incident managed',
    'Suicide risk assessed',
    'Referred to mental health team',
    'Family/guardian informed',
    'Ongoing monitoring',
    'Confidential support offered',
    'Other'
  ],
  'Suspicious Behaviour': [
    'Person monitored',
    'Security notified',
    'Bag searched',
    'Police informed',
    'CCTV reviewed',
    'Unattended bag reported',
    'Area evacuated',
    'Other'
  ],
  'Lost Property': [
    'Item details recorded',
    'Owner contacted',
    'Police notified (if required)',
    'CCTV reviewed',
    'Item returned to owner',
    'Other'
  ],
  'Attendance': [
    
  ],
  'Site Issue': [
    'Maintenance team notified',
    'Area cordoned off',
    'Issue logged for repair',
    'Temporary fix applied',
    'Structural engineer called',
    'Hazard signage placed',
    'Other',
    'Unsafe structure reported',
    'Barrier/fence issue',
    'Stage/platform checked',
    'Venue management informed',
    'Other (specify)'
  ],
  'Tech Issue': [
    'Technical team dispatched',
    'Issue escalated to IT',
    'Temporary workaround applied',
    'Equipment replaced',
    'System rebooted',
    'Other',
    'Power outage reported',
    'Backup generator started',
    'Utilities provider contacted',
    'Area evacuated (if required)',
    'Power restored',
    'Other (specify)'
  ],
  'Environmental': [
    'Weather warning issued',
    'Event paused',
    'Shelter provided',
    'Area closed due to flooding',
    'Slips/trips monitored',
    'Other',
    'Hazard identified',
    'Spill contained',
    'Environmental team notified',
    'Area ventilated',
    'Other (specify)'
  ],
  'Other': [
    'Other (specify)'
  ],
  'Alcohol / Drug Related': [
    'Alcohol confiscated',
    'Intoxicated person monitored',
    'Medical team notified',
    'Police informed',
    'Ejection considered',
    'Other',
    'Drugs seized',
    'Item bagged as evidence',
    'Police notified',
    'Person ejected',
    'Drugs disposed (with witness)',
    'Evidence log completed',
    'Search of person conducted',
    'Refusal to hand over drugs',
    'Drugs found during routine search',
    'Suspect detained for police',
    'Tested for substance type',
    'Other (specify)'
  ],
  'Weapon Related': [
    'Weapon seized',
    'Police notified',
    'Evidence bagged',
    'Person detained',
    'Ejected from site',
    'CCTV footage reviewed',
    'Security supervisor informed',
    'Incident reported to event control',
    'Refusal to surrender weapon',
    'Weapon handed to police',
    'Sweep for further weapons',
    'Other'
  ],
  'Artist Movement': [
    'Artist escorted by security',
    'Movement logged',
    'Venue informed of movement',
    'Cleared crowd routes for movement',
    'Artist entered/exited stage',
    'Secure route maintained',
    'Artist left site',
    'VIP vehicle used',
    'Other',
    'VIP escorted by security',
    'VIP arrival/departure logged',
    'Crowd managed for VIP',
    'VIP entered/exited stage',
    'VIP left site',
    'VIP vehicle used',
    'Other (specify)'
  ],
  'Artist On Stage': [
    'Artist on stage',
    'Artist off stage',
    'Issues?',
    'Crowd surfer numbers',
  ],
  'Artist Off Stage': [
    'Artist on stage',
    'Artist off stage',
    'Issues?',
    'Crowd surfer numbers',
  ],
  'Sexual Misconduct': [
    'Allegation recorded',
    'Police notified',
    'Person removed/separated',
    'Support provided to victim',
    'CCTV footage preserved',
    'Safeguarding lead notified',
    'Incident logged confidentially',
    'Statement taken from victim/witness',
    'Venue ban issued',
    'Other'
  ],
  'Event Timing': [
    'Event start time updated',
    'Event end time updated',
    'Curfew time updated',
    'Other'
  ],
  'Crowd Management': [
    'Crowd monitored',
    'Barriers adjusted',
    'Entry restricted',
    'Additional staff deployed',
    'Queue monitored',
    'Barriers adjusted',
    'Entry rate increased',
    'Additional staff deployed',
    'Other'
  ],
  'Timings': [
    'Show timings updated',
    'Venue timings updated',
    'Other'
  ],
  'Sit Rep': [
    'Situation report provided',
    'Update sent to team',
    'Other'
  ],
  'Hostile Act': [
    'Police notified',
    'Medical team deployed',
    'Suspect detained',
    'Area secured',
    'CCTV reviewed',
    'Other'
  ],
  'Fire Alarm': [
    'Fire alarm activated',
    'Evacuation started',
    'Fire service called',
    'Area checked',
    'All clear given',
    'Other'
  ],
  'Noise Complaint': [
    'Noise levels monitored',
    'Sound reduced',
    'Complainant updated',
    'Other'
  ],
  'Evacuation': [
    'Evacuation started',
    'Assembly point checked',
    'All clear given',
    'Other'
  ],
  'Counter-Terror Alert': [
    'Police notified',
    'Area secured',
    'Staff briefed',
    'Other'
  ],
  'Entry Breach': [
    'Entry breach detected',
    'Security responded',
    'Person detained',
    'Police notified',
    'Fence repaired',
    'Other'
  ],
  'Theft': [
    'Cash handling incident recorded',
    'Police notified',
    'Suspect detained',
    'CCTV reviewed',
    'Other',
    'Equipment reported lost',
    'Equipment reported stolen',
    'Police notified',
    'CCTV reviewed',
    'Other (specify)'
  ],
  'Emergency Show Stop': [
    'Show stopped',
    'Crowd managed away from stage',
    'Emergency services notified',
    'All staff briefed',
    'Other'
  ],
  'Animal Incident': [
    'Animal contained',
    'Owner located',
    'Animal removed from site',
    'Incident logged',
    'Other'
  ],
  'Missing Child/Person': [
    'Missing child/person reported',
    'Description obtained',
    'Search initiated',
    'Police notified',
    'Parent/guardian informed',
    'CCTV reviewed',
    'Found child/person reunited',
    'Medical check performed',
    'Other'
  ],
  'Showdown': [
    'Showdown incident logged',
    'Event control notified',
    'Other'
  ],
} as const

// Helper to get usage counts from localStorage
function getUsageCounts() {
  try {
    const stored = localStorage.getItem('incidentTypeUsage');
    if (stored) return JSON.parse(stored);
  } catch {}
  // Default: all types 0
  return Object.fromEntries(Object.keys(INCIDENT_TYPES).map(type => [type, 0]));
}

// Helper to save usage counts
function saveUsageCounts(counts: Record<string, number>) {
  try {
    localStorage.setItem('incidentTypeUsage', JSON.stringify(counts));
  } catch {}
}

export default function IncidentCreationModal({
  isOpen,
  onClose,
  onIncidentCreated,
  initialIncidentType,
}: Props) {
  const { addToast } = useToast();

  // Swipe gestures for modal interaction
  const swipeGestures = useSwipeModal(
    onClose, // Swipe down to close
    undefined, // No next/previous for incident creation
    undefined,
    { minSwipeDistance: 80 } // Require longer swipe for modal close
  );

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      // Store original overflow style
      const originalStyle = window.getComputedStyle(document.body).overflow;
      // Prevent scrolling
      document.body.style.overflow = 'hidden';
      
      // Cleanup function to restore scrolling when modal closes
      return () => {
        document.body.style.overflow = originalStyle;
      };
    }
  }, [isOpen]);

  // Helper function to generate structured occurrence text
  const generateStructuredOccurrence = (data: IncidentFormData): string => {
    if (!data.use_structured_template) {
      return data.occurrence || ''
    }

    const parts = []
    
    if (data.headline?.trim()) {
      parts.push(`HEADLINE: ${data.headline.trim()}`)
    }
    
    if (data.source?.trim()) {
      parts.push(`SOURCE: ${data.source.trim()}`)
    }
    
    if (data.facts_observed?.trim()) {
      parts.push(`FACTS: ${data.facts_observed.trim()}`)
    }
    
    if (data.actions_taken?.trim()) {
      parts.push(`ACTIONS: ${data.actions_taken.trim()}`)
    }
    
    if (data.outcome?.trim()) {
      parts.push(`OUTCOME: ${data.outcome.trim()}`)
    }

    return parts.length > 0 ? parts.join('\n\n') : data.occurrence || ''
  }

  // Helper function to count words in headline
  const getHeadlineWordCount = (text: string): number => {
    return text.trim() ? text.trim().split(/\s+/).length : 0
  }

  // AI validation for factual language
  const validateFactualLanguage = (text: string): { warnings: string[], isFactual: boolean } => {
    if (!text.trim()) return { warnings: [], isFactual: true }

    const warnings: string[] = []
    const lowerText = text.toLowerCase()

    // Emotional language patterns
    const emotionalPatterns = [
      { pattern: /\b(chaotic|disaster|terrible|awful|horrible|nightmare)\b/, message: "Avoid emotional language like 'chaotic', 'terrible', 'awful'" },
      { pattern: /\b(thankfully|fortunately|unfortunately|luckily)\b/, message: "Avoid subjective opinions like 'thankfully', 'fortunately'" },
      { pattern: /\b(massive|huge|tiny|enormous|gigantic)\b/, message: "Use specific measurements instead of subjective size descriptors" },
      { pattern: /\b(very|extremely|incredibly|absolutely)\b/, message: "Avoid intensifiers - be specific instead" },
      { pattern: /\b(seems|appears|looks like|probably|maybe)\b/, message: "Avoid speculation - state only what you observed directly" },
      { pattern: /\b(i think|i believe|i feel|i guess)\b/, message: "Avoid personal opinions - stick to facts" }
    ]

    // Check for emotional patterns
    emotionalPatterns.forEach(({ pattern, message }) => {
      if (pattern.test(lowerText)) {
        warnings.push(message)
      }
    })

    // Check for missing key information
    if (text.length > 50 && !lowerText.includes('time') && !lowerText.includes(':')) {
      warnings.push("Consider including specific time references")
    }

    if (text.length > 50 && !lowerText.includes('location') && !lowerText.includes('gate') && !lowerText.includes('stage') && !lowerText.includes('area')) {
      warnings.push("Consider including location details")
    }

    return {
      warnings,
      isFactual: warnings.length === 0
    }
  }

  const [formData, setFormData] = useState<IncidentFormData>({
    callsign_from: '',
    callsign_to: 'Event Control',
    occurrence: '',
    incident_type: initialIncidentType || '',
    action_taken: '',
    is_closed: false,
    status: 'open',
    log_number: '',
    what3words: '///',
    priority: 'medium',
    location_name: '',
    // Auditable logging defaults
    time_of_occurrence: new Date().toISOString(),
    time_logged: new Date().toISOString(),
    entry_type: 'contemporaneous',
    retrospective_justification: '',
    // Structured template defaults
    headline: '',
    source: '',
    facts_observed: '',
    actions_taken: '',
    outcome: '',
    use_structured_template: true
  });
  const [w3wInput, setW3wInput] = useState('')
  const [refusalDetails, setRefusalDetails] = useState<RefusalDetails>({
    policeRequired: false,
    description: '',
    location: '',
    reason: '',
    banned: false,
    aggressive: false
  });
  const [medicalDetails, setMedicalDetails] = useState<MedicalDetails>({
    location: '',
    requiresAmbulance: false,
    refusedTreatment: false,
    transportedOffSite: false
  });
  const [ejectionDetails, setEjectionDetails] = useState<EjectionDetails>({
    location: '',
    description: '',
    reason: '',
    policeInformed: false,
    refusedReentry: false,
    additionalInfo: {
      additionalSecurity: false
    }
  });
  const [quickAddValue, setQuickAddValue] = useState<string>('');
  const [isQuickAddProcessing, setIsQuickAddProcessing] = useState<boolean>(false);
  const [quickAddAISource, setQuickAddAISource] = useState<'local' | 'cloud' | 'browser' | null>(null);
  const [showRefusalActions, setShowRefusalActions] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [entryTypeWarnings, setEntryTypeWarnings] = useState<string[]>([])
  
  // New state for tabbed interface and AI parsing
  const [currentTab, setCurrentTab] = useState<'quick' | 'details' | 'people' | 'priority' | 'additional'>('quick')
  const [incidentTypeUsageStats, setIncidentTypeUsageStats] = useState<Record<string, number>>({})
  
  // Load usage stats on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('incidentTypeUsageStats')
      if (saved) {
        setIncidentTypeUsageStats(JSON.parse(saved))
      }
    } catch {}
  }, [])
  const [showAdvancedTimestamps, setShowAdvancedTimestamps] = useState(false)
  const [factualValidationWarnings, setFactualValidationWarnings] = useState<string[]>([])
  const [nextLogNumber, setNextLogNumber] = useState<string>('')
  const [followUpAnswers, setFollowUpAnswers] = useState<Record<string, string>>({})
  const [processingAI, setProcessingAI] = useState(false)
  const [missingCallsign, setMissingCallsign] = useState(false)
  const [isEditing, setIsEditing] = useState({
    occurrence: false,
    action_taken: false
  })
  const {
    coordinates: w3wCoordinates,
    isLoading: isValidatingWhat3Words,
    error: what3WordsError,
    validate: validateWhat3Words,
    reset: resetWhat3Words,
  } = useWhat3Words()
  const [w3wManuallyEdited, setW3wManuallyEdited] = useState(false);
  const [showMoreTypes, setShowMoreTypes] = useState(false);
  const [usageCounts, setUsageCounts] = useState(() => getUsageCounts());
  const [typeSearchQuery, setTypeSearchQuery] = useState('');
  // Removed auto-assignment state

  // Voice-to-text functionality
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [recognition, setRecognition] = useState<any>(null);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const [recognitionTimeout, setRecognitionTimeout] = useState<NodeJS.Timeout | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);

  // Offline sync functionality
  const [offlineState, offlineActions] = useOfflineSync();
  const [isOfflineMode, setIsOfflineMode] = useState(false);
  const [offlineIncidents, setOfflineIncidents] = useState<any[]>([]);

  // Mobile gesture support
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);
  const [touchEnd, setTouchEnd] = useState<{ x: number; y: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // Enhanced voice recognition setup with fallback
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      
      // Enhanced settings for better voice capture
      recognition.continuous = true; // Keep listening for longer input
      recognition.interimResults = true;
      recognition.lang = 'en-US';
      recognition.maxAlternatives = 1;
      
      // Add a flag to track if we're manually stopping
      let isManuallyStopping = false;
      let audioChunks: Blob[] = [];
      let mediaRecorder: MediaRecorder | null = null;
      let audioContext: AudioContext | null = null;
      
      recognition.onstart = () => {
        setIsListening(true);
        setVoiceError(null);
        isManuallyStopping = false;
        console.log('Voice recognition started');
        
        // Also start audio recording as backup
        startAudioRecording();
        
        // Set a timeout to automatically stop after 30 seconds of continuous listening
        const timeout = setTimeout(() => {
          if (isListening) {
            console.log('Auto-stopping voice recognition after timeout');
            isManuallyStopping = true;
            recognition.stop();
            stopAudioRecording();
          }
        }, 30000); // 30 seconds timeout for continuous listening
        
        setRecognitionTimeout(timeout);
      };
      
      recognition.onresult = (event: any) => {
        let finalTranscript = '';
        let interimTranscript = '';
        
        // Process all results from the current event
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript + ' ';
          } else {
            interimTranscript = transcript;
          }
        }
        
        // Update transcript: replace with accumulated final results + current interim
        if (finalTranscript) {
          setTranscript(prev => {
            const cleanPrev = prev.replace(/\s*\[interim\].*$/, '').trim();
            return cleanPrev + ' ' + finalTranscript.trim();
          });
        }
        
        // Show interim results separately
        if (interimTranscript) {
          setTranscript(prev => {
            const base = prev.replace(/\s*\[interim\].*$/, '').trim();
            return base + ' [interim] ' + interimTranscript;
          });
        }
      };
      
      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        
        // Don't show error if we manually stopped
        if (isManuallyStopping) {
          return;
        }
        
        // Handle specific error types
        let errorMessage = 'Voice recognition error';
        switch (event.error) {
          case 'aborted':
            errorMessage = 'Voice recognition was interrupted. Please try again.';
            break;
          case 'audio-capture':
            errorMessage = 'No microphone found. Please check your microphone permissions.';
            break;
          case 'bad-grammar':
            errorMessage = 'Speech recognition grammar error. Please try again.';
            break;
          case 'language-not-supported':
            errorMessage = 'Language not supported. Please use English.';
            break;
          case 'network':
            errorMessage = 'Network error. Please check your connection.';
            break;
          case 'no-speech':
            errorMessage = 'No speech detected. Please speak clearly.';
            break;
          case 'speech-not-detected':
            errorMessage = 'Speech not detected. Please try again.';
            break;
          case 'not-allowed':
            errorMessage = 'Microphone access denied. Please allow microphone permissions.';
            break;
          case 'service-not-allowed':
            errorMessage = 'Voice recognition service not allowed. Please check browser settings.';
            break;
          default:
            errorMessage = `Voice recognition error: ${event.error}`;
        }
        
        setVoiceError(errorMessage);
        setIsListening(false);
        stopAudioRecording();
        
        // Auto-clear error after 5 seconds
        setTimeout(() => {
          setVoiceError(null);
        }, 5000);
      };
      
      recognition.onend = () => {
        console.log('Voice recognition ended');
        setIsListening(false);
        stopAudioRecording();
        
        // Clear the timeout
        if (recognitionTimeout) {
          clearTimeout(recognitionTimeout);
          setRecognitionTimeout(null);
        }
        
        // Check if we got a very short transcript (likely cut off)
        const cleanTranscript = transcript.replace(/\s*\[interim\].*$/, '').trim();
        if (cleanTranscript && cleanTranscript.split(' ').length < 3 && !isManuallyStopping) {
          console.log('Short transcript detected, likely cut off. Retrying...');
          setIsRetrying(true);
          // Auto-retry for short transcripts
          setTimeout(() => {
            if (!isListening && !isManuallyStopping) {
              setIsRetrying(false);
              startListening();
            }
          }, 500);
          return;
        }
        
        // Only process transcript if it's not empty and no error occurred
        if (cleanTranscript && !voiceError && !isManuallyStopping) {
          handleQuickAdd(cleanTranscript);
          setTranscript('');
        }
      };
      
      // Audio recording functions
      const startAudioRecording = async () => {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ 
            audio: {
              sampleRate: 44100,
              channelCount: 1,
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true
            } 
          });
          
          audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
          const source = audioContext.createMediaStreamSource(stream);
          const processor = audioContext.createScriptProcessor(4096, 1, 1);
          
          processor.onaudioprocess = (event) => {
            const inputBuffer = event.inputBuffer;
            const inputData = inputBuffer.getChannelData(0);
            
            // Convert to blob for storage
            const audioData = new Float32Array(inputData.length);
            audioData.set(inputData);
            
            // Store audio chunks
            const blob = new Blob([audioData], { type: 'audio/wav' });
            audioChunks.push(blob);
          };
          
          source.connect(processor);
          processor.connect(audioContext.destination);
          
          mediaRecorder = new MediaRecorder(stream);
          mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
              audioChunks.push(event.data);
            }
          };
          
          mediaRecorder.start(100); // Small timeslice for better capture
          console.log('Audio recording started as backup');
          
        } catch (error) {
          console.error('Failed to start audio recording:', error);
        }
      };
      
      const stopAudioRecording = () => {
        if (mediaRecorder && mediaRecorder.state !== 'inactive') {
          mediaRecorder.stop();
        }
        if (audioContext) {
          audioContext.close();
          audioContext = null;
        }
        if (mediaRecorder && mediaRecorder.stream) {
          mediaRecorder.stream.getTracks().forEach(track => track.stop());
        }
        console.log('Audio recording stopped');
      };
      
      // Store the manual stopping flag in the recognition object
      recognition.isManuallyStopping = false;
      
      setRecognition(recognition);
    } else {
      setVoiceError('Voice recognition is not supported in this browser. Please use Chrome, Edge, or Safari.');
    }

    // Cleanup function
    return () => {
      if (recognition) {
        try {
          recognition.isManuallyStopping = true;
          recognition.stop();
        } catch (error) {
          console.log('Error stopping recognition during cleanup:', error);
        }
      }
      
      // Clear any pending timeout
      if (recognitionTimeout) {
        clearTimeout(recognitionTimeout);
      }
    };
  }, [transcript, voiceError]);

  // Offline mode detection and local storage
  useEffect(() => {
    const checkOfflineMode = () => {
      const isOffline = !navigator.onLine || offlineState.queueStatus.pending > 0;
      setIsOfflineMode(isOffline);
      
      // Load offline incidents from localStorage
      if (isOffline) {
        const stored = localStorage.getItem('offline_incidents');
        if (stored) {
          try {
            setOfflineIncidents(JSON.parse(stored));
          } catch (error) {
            console.error('Error parsing offline incidents:', error);
          }
        }
      }
    };

    checkOfflineMode();
    window.addEventListener('online', checkOfflineMode);
    window.addEventListener('offline', checkOfflineMode);

    return () => {
      window.removeEventListener('online', checkOfflineMode);
      window.removeEventListener('offline', checkOfflineMode);
    };
  }, [offlineState.queueStatus.pending]);

  // Save offline incidents to localStorage
  const saveOfflineIncident = useCallback((incident: any) => {
    const updated = [...offlineIncidents, { ...incident, id: Date.now(), isOffline: true }];
    setOfflineIncidents(updated);
    localStorage.setItem('offline_incidents', JSON.stringify(updated));
  }, [offlineIncidents]);

  // Voice control functions
  const startListening = useCallback(() => {
    if (!recognition) {
      setVoiceError('Voice recognition not available. Please refresh the page and try again.');
      return;
    }
    
    if (isListening) {
      return; // Already listening
    }
    
    try {
      // Clear any previous errors
      setVoiceError(null);
      setTranscript('');
      
      // Set manual stopping flag to false
      recognition.isManuallyStopping = false;
      
      // Request microphone permission first
      navigator.mediaDevices.getUserMedia({ audio: true })
        .then(() => {
          // Add a small delay to ensure proper initialization
          setTimeout(() => {
            try {
              recognition.start();
            } catch (error) {
              console.error('Error starting recognition after permission:', error);
              setVoiceError('Failed to start voice recognition. Please try again.');
            }
          }, 100);
        })
        .catch((error) => {
          console.error('Microphone permission error:', error);
          setVoiceError('Microphone access denied. Please allow microphone permissions in your browser settings.');
        });
    } catch (error) {
      console.error('Error starting voice recognition:', error);
      setVoiceError('Failed to start voice recognition. Please try again.');
    }
  }, [recognition, isListening]);

  const stopListening = useCallback(() => {
    if (recognition && isListening) {
      try {
        // Add a delay to ensure all audio is captured before stopping
        setTimeout(() => {
          // Set manual stopping flag to prevent error messages
          recognition.isManuallyStopping = true;
          recognition.stop();
          
          // Clear the timeout
          if (recognitionTimeout) {
            clearTimeout(recognitionTimeout);
            setRecognitionTimeout(null);
          }
        }, 800); // 800ms delay to capture remaining audio
      } catch (error) {
        console.error('Error stopping voice recognition:', error);
        setIsListening(false);
      }
    }
  }, [recognition, isListening, recognitionTimeout]);

  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  // AssignmentReasoningDisplay component
  const AssignmentReasoningDisplay = ({ details }: { details: any }) => {
    if (!details) return null;

    return (
      <div className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-700">
        <h5 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
          <span className="h-5 w-5 rounded-lg bg-blue-500 flex items-center justify-center">
            <span className="text-white text-xs">🎯</span>
          </span>
          Auto-Assignment Details
        </h5>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Staff Assigned:</span>
            <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">
              {details.assignedStaff.length} member(s)
            </span>
          </div>
          {details.assignmentNotes && (
            <div className="bg-white dark:bg-[#182447] rounded-lg p-3 border border-gray-200 dark:border-gray-600">
              <p className="text-sm text-gray-700 dark:text-gray-200">{details.assignmentNotes}</p>
            </div>
          )}
          {details.reasoning && details.reasoning.length > 0 && (
            <div>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-200 block mb-2">Assignment Reasoning:</span>
              <div className="space-y-1">
                {details.reasoning.map((reason: string, index: number) => (
                  <div key={index} className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-green-500"></span>
                    <span className="text-sm text-gray-600 dark:text-gray-300">{reason}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white dark:bg-[#182447] rounded-lg p-3 border border-gray-200 dark:border-gray-600">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Skill Match</span>
                <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">
                  {Math.round(details.skillMatch * 100)}%
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${details.skillMatch * 100}%` }}
                ></div>
              </div>
            </div>
            <div className="bg-white dark:bg-[#182447] rounded-lg p-3 border border-gray-200 dark:border-gray-600">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Availability</span>
                <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">
                  {Math.round(details.availability * 100)}%
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${details.availability * 100}%` }}
                ></div>
              </div>
            </div>
            <div className="bg-white dark:bg-[#182447] rounded-lg p-3 border border-gray-200 dark:border-gray-600">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Workload</span>
                <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">
                  {Math.round(details.workload * 100)}%
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${details.workload * 100}%` }}
                ></div>
              </div>
            </div>
            <div className="bg-white dark:bg-[#182447] rounded-lg p-3 border border-gray-200 dark:border-gray-600">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Distance</span>
                <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">
                  {Math.round(details.distance * 100)}%
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${details.distance * 100}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Auto-assignment removed per requirements

  useEffect(() => {
    if (initialIncidentType) {
      setFormData(prev => ({ ...prev, incident_type: initialIncidentType }))
    }
  }, [initialIncidentType])

  // Timer ref for debouncing
  const processTimer = useRef<NodeJS.Timeout>()

  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState<string | null>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);

  const { user } = useAuth();
  const [events, setEvents] = useState<any[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [currentEventFallback, setCurrentEventFallback] = useState<any | null>(null);
  
  // Real-time collaboration
  const modalRef = useRef<HTMLDivElement>(null);
  const { users: presenceUsers, updateCursor, updateTyping, updateFocus, isConnected } = usePresence(
    isOpen ? `incident-creation:${selectedEventId || 'global'}` : ''
  );

  useEffect(() => {
    if (!user) return;
    // Quick path: resolve current event immediately so UI never blocks on "Loading..."
    (async () => {
      try {
        const { data: profile } = await supabase.from('profiles').select('company_id').eq('id', user.id).single();
        const companyId = profile?.company_id;
        if (!companyId) return;
        let chosen: any = null;
        const { data: current } = await supabase
          .from('events')
          .select('id, event_name, artist_name, expected_attendance, is_current, company_id')
          .eq('company_id', companyId)
          .eq('is_current', true)
          .maybeSingle();
        if (current?.id) {
          chosen = current;
        } else {
          const { data: latest } = await supabase
            .from('events')
            .select('id, event_name, artist_name, expected_attendance, is_current, company_id')
            .eq('company_id', companyId)
            .order('start_datetime', { ascending: false })
            .limit(1);
          if (latest && latest[0]?.id) chosen = latest[0];
        }
        if (chosen) {
          setCurrentEventFallback(chosen);
          setSelectedEventId(prev => prev || chosen.id);
        }
      } catch {}
    })();
    const fetchEvents = async () => {
      setEventsLoading(true);
      try {
        // Get company_id from profile
        const { data: profile } = await supabase.from('profiles').select('company_id').eq('id', user.id).single();
        if (!profile?.company_id) return;
         // Fetch all events for this company
         const { data: allEvents } = await supabase
           .from('events')
           .select('id, event_name, artist_name, is_current, expected_attendance')
           .eq('company_id', profile.company_id)
           .order('start_datetime', { ascending: false });
        setEvents(allEvents || []);
        // Default to current event
        const current = allEvents?.find((e: any) => e.is_current);
        setSelectedEventId(prev => prev || current?.id || (allEvents?.[0]?.id ?? null));
      } catch (error) {
        console.error('Error fetching events:', error);
        setEvents([]);
      } finally {
        setEventsLoading(false);
      }
    };
    fetchEvents();
  }, [user]);
  
  // Map AI outputs into the incident form in one place to avoid duplication
  type AICommonData = { incidentType?: string; description?: string; callsign?: string; location?: string; priority?: string; confidence?: number; actionTaken?: string };
  
  const normalizeIncidentType = (candidate: string | undefined | null, allowed: string[]): string => {
    const c = (candidate || '').trim();
    if (!c) return '';
    const lower = c.toLowerCase();
    const synonymMap: Record<string, string> = {
      'fight': 'Aggressive Behaviour',
      'fighting': 'Aggressive Behaviour',
      'assault': 'Aggressive Behaviour',
      'violent incident': 'Aggressive Behaviour',
      'suspicious behavior': 'Suspicious Behaviour',
      'suspicious behaviour': 'Suspicious Behaviour',
      'queue buildup': 'Queue Build-Up',
      'queue build up': 'Queue Build-Up',
      'lost property': 'Lost Property',
      'tech issue': 'Technical Issue',
      'weather': 'Weather Disruption',
    };
    let mapped = c;
    if (synonymMap[lower]) mapped = synonymMap[lower];
    if (allowed.includes(mapped)) return mapped;
    const ci = allowed.find(a => a.toLowerCase() === mapped.toLowerCase());
    return ci || '';
  };

  function applyAIIncidentResult(aiData: AICommonData, rawInput: string, incidentTypes: string[], prev: IncidentFormData): IncidentFormData {
    let normalizedPriority = ['urgent', 'high', 'medium', 'low'].includes((aiData.priority || '').toLowerCase())
      ? (aiData.priority as string).toLowerCase()
      : (prev.priority || 'medium');
    const lowerValue = rawInput.toLowerCase();
    if (lowerValue.includes('rape') || lowerValue.includes('sexual assault') || lowerValue.includes('assault')) {
      normalizedPriority = 'urgent';
    } else if (lowerValue.includes('fight') || lowerValue.includes('violence') || lowerValue.includes('weapon')) {
      normalizedPriority = 'high';
    }

    const cleanedOccurrence = cleanSentence(aiData.description || prev.occurrence, prev.occurrence);
    const cleanedLocation = sanitizeLocation(aiData.location || '');
    const candidateType = normalizeIncidentType(aiData.incidentType || '', incidentTypes);
    const detectedFromText = detectIncidentType(rawInput);
    const aiType = candidateType || detectedFromText || prev.incident_type;

    const normalizeActions = (raw: string): string => {
      if (!raw) return defaultActionsForType(aiType);
      const lines = String(raw)
        .split(/\n|\r|\.|;|,/)
        .map(s => s.replace(/^\s*(?:\d+\.|[-*])\s*/, '').trim())
        .filter(Boolean);
      if (lines.length === 0) return defaultActionsForType(aiType);
      const unique = Array.from(new Set(lines));
      return unique.slice(0, 4).map(s => (/[.!?]$/.test(s) ? s : s + '.')).join(' ');
    };

    const recommendedActions = normalizeActions(
      (aiData.actionTaken && (aiData.actionTaken as string).length > 3) ? (aiData.actionTaken as string) : defaultActionsForType(aiType)
    );
    const reporter = (aiData.callsign || prev.callsign_from || '').trim();
    let enrichedOccurrence = cleanedOccurrence;
    if (cleanedLocation && !enrichedOccurrence.toLowerCase().includes(cleanedLocation.toLowerCase())) {
      enrichedOccurrence = enrichedOccurrence.replace(/\.$/, '');
      enrichedOccurrence = `${enrichedOccurrence} at ${cleanedLocation}.`;
    }
    if (reporter && !new RegExp(`\\b${reporter}\\b`, 'i').test(enrichedOccurrence)) {
      enrichedOccurrence = enrichedOccurrence.replace(/\.$/, '');
      enrichedOccurrence = `${enrichedOccurrence} Reported by ${reporter}.`;
    }

    const isW3W = !!cleanedLocation && /^(?:\s*\/{0,3})?[a-zA-Z]+\.[a-zA-Z]+\.[a-zA-Z]+$/.test(cleanedLocation);
    const normalizedW3W = isW3W ? (`///${cleanedLocation.replace(/^\/*/, '')}`) : prev.what3words;

    return {
      ...prev,
      occurrence: enrichedOccurrence,
      incident_type: aiType,
      callsign_from: aiData.callsign || prev.callsign_from,
      priority: normalizedPriority,
      what3words: normalizedW3W,
      location_name: cleanedLocation,
      action_taken: recommendedActions
    };
  }

  async function parseIncidentUnified(input: string, incidentTypes: string[]): Promise<{ data: AICommonData | null; source: 'cloud' | 'browser' | null }> {
    const toAICommon = (d: any): AICommonData => ({
      incidentType: d.incidentType,
      description: d.description,
      callsign: d.callsign,
      location: d.location,
      priority: d.priority,
      confidence: d.confidence,
      actionTaken: d.actionTaken,
    });
    try {
      const resp = await fetch('/api/enhanced-incident-parsing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input, incidentTypes })
      });
      if (resp.ok) {
        const d: EnhancedIncidentParsingResponse & { fallback?: 'browser-recommended' } = await resp.json();
        if (d.aiSource === 'openai') {
          return { data: toAICommon(d), source: 'cloud' };
        }
        // Server suggests browser fallback when it cannot use OpenAI
        if (d.aiSource === 'none' && d.fallback === 'browser-recommended') {
          try {
            await ensureBrowserLLM();
            if (isBrowserLLMAvailable()) {
              const browser = await parseIncidentWithBrowserLLM(input, incidentTypes);
              if (browser) return { data: toAICommon(browser), source: 'browser' };
            }
          } catch {}
        }
        // Use whatever heuristics came from server if present
        return { data: toAICommon(d), source: null };
      }
    } catch {}
    // Network/API failure → attempt browser fallback
    try {
      await ensureBrowserLLM();
      if (isBrowserLLMAvailable()) {
        const browser = await parseIncidentWithBrowserLLM(input, incidentTypes);
        if (browser) return { data: toAICommon(browser), source: 'browser' };
      }
    } catch {}
    return { data: null, source: null };
  }
  // Handler for parsed AI data from QuickAddInput
  const handleParsedData = (data: ParsedIncidentData) => {
    setFormData(prev => ({
      ...prev,
      incident_type: data.incidentType || prev.incident_type,
      location_name: data.location || prev.location_name,
      callsign_from: data.callsignFrom || prev.callsign_from,
      callsign_to: data.callsignTo || prev.callsign_to,
      priority: data.priority || prev.priority,
      occurrence: data.occurrence || prev.occurrence,
      action_taken: data.actionTaken || prev.action_taken
    }));
    
    // Switch to details tab after applying parsed data
    setCurrentTab('details');
    
    // Update usage stats for the incident type
    if (data.incidentType) {
      const newStats = { ...incidentTypeUsageStats };
      newStats[data.incidentType] = (newStats[data.incidentType] || 0) + 1;
      setIncidentTypeUsageStats(newStats);
      try {
        localStorage.setItem('incidentTypeUsageStats', JSON.stringify(newStats));
      } catch {}
    }
  };

  const handleQuickAdd = async (value: string) => {
    setIsQuickAddProcessing(true);
    setQuickAddAISource(null);
    setQuickAddValue(value);

    // Immediate local parsing for responsiveness
    const logic = detectIncidentFromText(value);
    const explicitType = incidentTypes.find(t => value.toLowerCase().includes(t.toLowerCase())) || '';
    const localType = logic.incidentType || explicitType || detectIncidentType(value);
    const localCallsign = detectCallsign(value) || '';
    
    // Enhanced priority detection for serious incidents
    let localPriority = logic.priority || detectPriority(value);
    const lowerValue = value.toLowerCase();
    if (lowerValue.includes('rape') || lowerValue.includes('sexual assault') || lowerValue.includes('assault')) {
      localPriority = 'urgent';
    } else if (lowerValue.includes('fight') || lowerValue.includes('violence') || lowerValue.includes('weapon')) {
      localPriority = 'high';
    }
    
    setFormData(prev => ({
      ...prev,
      ai_input: value,
      occurrence: logic.occurrence || value,
      incident_type: localType || prev.incident_type,
      callsign_from: localCallsign || prev.callsign_from,
      priority: localPriority || prev.priority
    }));

    if (localType === 'Attendance') {
      const selectedEvent = events.find(e => e.id === selectedEventId);
      const expectedAttendance = selectedEvent?.expected_attendance || 3500;
      const result = await parseAttendanceIncident(value, expectedAttendance);
      if (result) {
        setFormData(prev => ({
          ...prev,
          occurrence: result.occurrence,
          action_taken: result.action_taken,
          incident_type: result.incident_type,
          callsign_from: result.callsign_from
        }));
      }
    }

    // Unified AI processing entry point
    let applied = false;
    try {
      const { data, source } = await parseIncidentUnified(value, incidentTypes);
      // UI state for source indicator
      // cloud: API succeeded with OpenAI; browser: client-side WebLLM; null: heuristics/no AI
      setQuickAddAISource(source);
      if (data) {
        setFormData(prev => applyAIIncidentResult(data, value, incidentTypes, prev));
        applied = true;
      }
    } finally {
      setIsQuickAddProcessing(false);
      if (!applied) setQuickAddAISource(null);
    }
  };


  // Create a debounced function for processing input
  const debouncedProcessInput = useCallback(
    debounce(async (input: string) => {
      if (!input.trim()) {
        setFormData(prev => ({ 
          ...prev, 
          occurrence: '', 
          action_taken: '',
          incident_type: 'Select Type',
          callsign_from: '',
          log_number: ''
        }));
        return;
      }

      try {
        const incidentType = detectIncidentType(input);
        const callsign = detectCallsign(input) || '';
        const location = extractLocation(input) || '';
        const priorityDetected = detectPriority(input);
        let processedData: IncidentParserResult | null = null;

        // Custom handler for showdown
        if (incidentType === 'Event Timing' && input.toLowerCase().includes('showdown')) {
          processedData = {
            occurrence: 'Showdown',
            action_taken: 'The show has ended',
            callsign_from: 'PM',
            incident_type: 'Event Timing'
          };
        } else if (
          incidentType === 'Event Timing' &&
          (input.toLowerCase().includes('doors open') || input.toLowerCase().includes('doors green') || input.toLowerCase().includes('venue open'))
        ) {
          processedData = {
            occurrence: 'Doors Open',
            action_taken: 'The venue is now open and customers are entering',
            callsign_from: 'A1',
            incident_type: 'Event Timing'
          };
        } else if (
          incidentType === 'Event Timing' && input.toLowerCase().includes('venue clear')
        ) {
          processedData = {
            occurrence: 'Venue is clear of public',
            action_taken: 'Venue Clear',
            callsign_from: 'A1',
            incident_type: 'Event Timing'
          };
        } else if (
          incidentType === 'Event Timing' && (input.toLowerCase().includes('staff briefed') || input.toLowerCase().includes('staff briefed and in position'))
        ) {
          processedData = {
            occurrence: 'Staff briefed and in position',
            action_taken: 'All staff have been briefed and are in position',
            callsign_from: 'A1',
            incident_type: 'Event Timing'
          };
        } else {
        switch (incidentType) {
          case 'Medical':
            processedData = await parseMedicalIncident(input);
            break;
          case 'Ejection':
            processedData = await parseEjectionIncident(input);
            break;
          case 'Refusal':
            processedData = await parseRefusalIncident(input);
            break;
          case 'Attendance':
            const selectedEvent = events.find(e => e.id === selectedEventId);
            const expectedAttendance = selectedEvent?.expected_attendance || 3500;
            processedData = await parseAttendanceIncident(input, expectedAttendance);
            break;
          case 'Welfare':
            processedData = await parseWelfareIncident(input);
            break;
          case 'Lost Property':
            processedData = await parseLostPropertyIncident(input);
            break;
          case 'Suspicious Behaviour':
            processedData = await parseSuspiciousBehaviourIncident(input);
            break;
          case 'Aggressive Behaviour':
            processedData = await parseAggressiveBehaviourIncident(input);
            break;
          case 'Queue Build-Up':
            processedData = await parseQueueBuildUpIncident(input);
            break;
          case 'Technical Issue':
            processedData = await parseTechnicalIncident(input);
            break;
          case 'Weather Disruption':
            processedData = await parseWeatherDisruptionIncident(input);
            break;
          default:
            // Use the general incident endpoint for all other types
            try {
              const response = await fetch('/api/generate-incident-details', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                  input,
                  incident_type: incidentType,
                  location,
                  description: input,
                  callsign
                })
              });

              if (!response.ok) {
                throw new Error('Failed to generate incident details');
              }

              const data = await response.json();
               processedData = {
                occurrence: data.occurrence || input,
                action_taken: data.action_taken || '',
                callsign_from: callsign,
                incident_type: incidentType
              };
              } catch (error) {
              console.error('Error generating incident details:', error);
              // Unified fallback using parseIncidentUnified; keep local heuristics as backup
              try {
                const { data, source } = await parseIncidentUnified(input, incidentTypes);
                if (data) {
                  processedData = {
                    occurrence: data.description || input,
                    action_taken: '',
                    callsign_from: detectCallsign(input) || '',
                    incident_type: normalizeIncidentType(data.incidentType || '', incidentTypes) || incidentType,
                  } as IncidentParserResult;
                  if (data.priority) setFormData(prev => ({ ...prev, priority: data.priority || prev.priority }));
                } else {
                  processedData = {
                    occurrence: input,
                    action_taken: '',
                    callsign_from: callsign,
                    incident_type: incidentType
                  };
                }
              } catch (err2) {
                processedData = {
                  occurrence: input,
                  action_taken: '',
                  callsign_from: callsign,
                  incident_type: incidentType
                };
              }
              }
            }
        }

        // Get current event for log number generation
        const { data: currentEvent } = await supabase
          .from('events')
          .select('id, event_name')
          .eq('is_current', true)
          .single();

        if (!currentEvent) {
          console.error('No current event found');
          return;
        }

        // Generate log number
        const logNumber = await generateNextLogNumber(currentEvent.event_name);
        const safeLogNumber = logNumber || '';

        if (processedData) {
          setFormData(prev => ({
            ...prev,
            occurrence: processedData.occurrence,
            action_taken: processedData.action_taken,
            incident_type: processedData.incident_type || incidentType,
            callsign_from: processedData.callsign_from || prev.callsign_from,
            log_number: safeLogNumber,
            priority: priorityDetected || prev.priority
          }));
        } else {
          setFormData(prev => ({ 
            ...prev,
            incident_type: incidentType,
            log_number: safeLogNumber,
            priority: priorityDetected || prev.priority
          }));
        }
      } catch (error) {
        console.error('Error processing input:', error);
      }
    }, 500),
    []
  );

  // Handle input change
  const handleQuickInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const input = e.target.value;
    if (input.trim().toLowerCase() === 'showdown') {
      setFormData(prev => ({
        ...prev,
        ai_input: input,
        incident_type: 'Showdown',
        occurrence: 'Showdown',
        action_taken: 'The show has ended',
      }));
      return;
    }
    setFormData(prev => ({ ...prev, ai_input: input }));

    // Just set the occurrence to the raw input immediately
    setFormData(prev => ({ 
      ...prev, 
      occurrence: input
    }));

    // Set quick local detections immediately for responsiveness
    const localType = detectIncidentType(input);
    const localCallsign = detectCallsign(input) || '';
    const localPriority = detectPriority(input);
    setFormData(prev => ({
      ...prev,
      incident_type: localType || prev.incident_type,
      callsign_from: localCallsign || prev.callsign_from,
      priority: localPriority || prev.priority
    }));

    // Auto-extract w3w if not manually edited
    if (!w3wManuallyEdited) {
      // Ensure extractW3WFromQuickInput is declared before use
      const w3wMatch = extractW3WFromQuickInput(input) || '';
      if (w3wMatch) {
        setFormData(prev => {
          // Remove any existing w3w location at the end
          let newOccurrence = prev.occurrence.replace(/Location \(\/{0,3}[a-zA-Z0-9]+\.[a-zA-Z0-9]+\.[a-zA-Z0-9]+\)$/i, '').trim();
          // Append the new w3w location
          newOccurrence = newOccurrence ? `${newOccurrence} Location (${w3wMatch})` : `Location (${w3wMatch})`;
          return { ...prev, what3words: w3wMatch, occurrence: newOccurrence };
        });
        setW3wInput(w3wMatch.replace(/^\/*/, ''))
      }
    }

    // Clear any previous timer
    if (processTimer.current) {
      clearTimeout(processTimer.current);
    }

    // Set a new timer to process the input after 3 seconds of no typing
    processTimer.current = setTimeout(async () => {
      if (!input.trim()) {
        setFormData(prev => ({ 
          ...prev, 
          occurrence: '', 
          action_taken: '',
          incident_type: 'Select Type',
          callsign_from: '',
          log_number: ''
        }));
        return;
      }

      let aiIncidentType = '';
      let fixedOccurrence = input;
      try {
        // Call AI endpoint to get best incident type and grammar/spelling fix
        const response = await fetch('/api/generate-incident-description', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ input, incidentTypes: incidentTypes, extractPriority: true })
              });
        if (response.ok) {
              const data = await response.json();
          console.debug('AI response from /api/generate-incident-description:', data);
          if (data.incidentType) aiIncidentType = data.incidentType;
          if (data.description) fixedOccurrence = data.description;
          if (data.priority) {
            setFormData(prev => ({ ...prev, priority: data.priority || prev.priority }));
          } else {
            const localPriority = detectPriority(input);
            setFormData(prev => ({ ...prev, priority: localPriority || prev.priority }));
          }
          // If Ejection, autofill additional fields
          if (data.incidentType === 'Ejection' && data.ejectionInfo) {
            setEjectionDetails(prev => ({
              ...prev,
              location: data.ejectionInfo.location || '',
              description: data.ejectionInfo.description || '',
              reason: data.ejectionInfo.reason || ''
            }));
            if (data.ejectionRaw) {
              console.debug('Raw ejection extraction response:', data.ejectionRaw);
            }
          }
        } else {
          console.debug('AI endpoint returned non-OK response:', response.status);
          const localPriority = detectPriority(input);
          setFormData(prev => ({ ...prev, priority: localPriority || prev.priority }));
        }
      } catch (err) {
        console.debug('Error calling AI endpoint:', err);
        const localPriority = detectPriority(input);
        setFormData(prev => ({ ...prev, priority: localPriority || prev.priority }));
      }

      // For attendance incidents, always use local detection and bypass AI
      const localDetection = detectIncidentType(input);
      const detectedType = localDetection === 'Attendance' ? 'Attendance' : (aiIncidentType || localDetection);
      console.debug('Incident type chosen (AI or fallback):', detectedType);
      setFormData(prev => ({ ...prev, incident_type: detectedType }));

      // Extract callsign
      const callsign = detectCallsign(input) || '';
      setFormData(prev => ({ ...prev, callsign_from: callsign }));

      if (detectedType === 'Attendance') {
        const selectedEvent = events.find(e => e.id === selectedEventId);
        const expectedAttendance = selectedEvent?.expected_attendance || 3500;
        const result = await parseAttendanceIncident(input, expectedAttendance);
        if (result !== null) {
          setFormData(prev => ({
            ...prev,
            occurrence: result.occurrence,
            action_taken: result.action_taken,
            incident_type: result.incident_type,
            callsign_from: result.callsign_from
          }));
        }
      } else {
        console.debug('Occurrence after grammar/spell check:', fixedOccurrence);
        setFormData(prev => ({
          ...prev,
          occurrence: fixedOccurrence,
          action_taken: '', // Do not autofill
          incident_type: detectedType,
          callsign_from: callsign
        }));
      }
    }, 3000); // 3 second delay
  };

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

  const generateNextLogNumber = async (artistName: string = '', eventId?: string) => {
    try {
      if (!eventId) return null;
      // Get the current count of logs for this event
      const { count, error: countError } = await supabase
        .from('incident_logs')
        .select('id', { count: 'exact', head: true })
        .eq('event_id', eventId);
      if (countError) {
        console.error('Error getting incident count:', countError);
        throw countError;
      }
      // Normalise artist name for prefix
      const prefix = normaliseArtistName(artistName);
      const nextSequence = (count ?? 0) + 1;
      const sequentialNumber = String(nextSequence).padStart(3, '0');
      return `${prefix}-${sequentialNumber}`;
    } catch (error) {
      console.error('Error generating log number:', error);
      return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Resolve effective event synchronously for this submission
      let effectiveEventId = selectedEventId;
      let effectiveEvent = effectiveEventId ? events.find(e => e.id === effectiveEventId) : undefined;
      if (!effectiveEvent) {
        if (currentEventFallback?.id) {
          effectiveEventId = currentEventFallback.id;
          effectiveEvent = currentEventFallback;
        } else if (events[0]?.id) {
          effectiveEventId = events[0].id;
          effectiveEvent = events[0];
        } else {
          const { data: currentEvent } = await supabase
            .from('events')
            .select('id, event_name, artist_name, expected_attendance')
            .eq('is_current', true)
            .single();
          if (currentEvent?.id) {
            effectiveEventId = currentEvent.id;
            effectiveEvent = currentEvent;
          }
        }
        if (!effectiveEvent) {
          setError('Please select an event to log this incident.');
          setLoading(false);
          return;
        }
      }

      // Check if we're in offline mode
      if (isOfflineMode || !navigator.onLine) {
        // Save to offline storage
        const offlineIncident = {
          ...formData,
          event_id: effectiveEvent.id,
          created_at: new Date().toISOString(),
          is_offline: true,
          sync_status: 'pending'
        };
        
        saveOfflineIncident(offlineIncident);
        
        // Queue for sync when online
        await offlineActions.queueOperation({
          type: 'incident_create',
          data: offlineIncident,
          maxRetries: 5,
          priority: 'high'
        });

        addToast({
          type: 'info',
          title: 'Incident Saved Offline',
          message: 'Your incident has been saved locally and will sync when you\'re back online.',
          duration: 5000
        });

        // Clear form and close modal
        setFormData({
          callsign_from: '',
          callsign_to: 'Event Control',
          occurrence: '',
          incident_type: '',
          action_taken: '',
          is_closed: false,
          status: 'open',
          ai_input: '',
          log_number: '',
          what3words: '///',
          priority: 'medium',
          location_name: '',
          time_of_occurrence: new Date().toISOString(),
          time_logged: new Date().toISOString(),
          entry_type: 'contemporaneous',
          retrospective_justification: ''
        });

        await onIncidentCreated();
        onClose();
        setLoading(false);
        return;
      }

      // Generate the next log number using the artist name
      const logNumber = await generateNextLogNumber(effectiveEvent.artist_name, effectiveEventId || undefined);
      if (!logNumber) {
        throw new Error('Failed to generate log number');
      }

      // Get current timestamp
      const now = new Date().toISOString();

      // Generate structured occurrence text or use legacy occurrence field
      const structuredOccurrence = generateStructuredOccurrence(formData);
      
      // Ensure required fields (incident_type, occurrence) are populated
      const sourceText = (structuredOccurrence || formData.occurrence || formData.ai_input || '').trim();
      let resolvedType = (formData.incident_type || '').trim();
      let resolvedOccurrence = structuredOccurrence || (formData.occurrence || '').trim();
      if (!resolvedType || !resolvedOccurrence) {
        const logic = detectIncidentFromText(sourceText);
        if (!resolvedType || resolvedType.toLowerCase() === 'select type') {
          resolvedType = logic.incidentType || detectIncidentType(sourceText) || 'Other';
        }
        if (!resolvedOccurrence) {
          resolvedOccurrence = (logic.occurrence || sourceText || 'New incident reported.').trim();
        }
      }

      // Get user info for logged_by fields
      const { data: { user } } = await supabase.auth.getUser()
      const { data: userProfile } = await supabase
        .from('profiles')
        .select('first_name, last_name')
        .eq('id', user?.id || '')
        .single()
      
      const userCallsign = formData.callsign_from || 
        `${userProfile?.first_name?.[0]}${userProfile?.last_name?.[0]}`.toUpperCase() ||
        'Unknown'

      // Prepare the incident data
      const incidentData = {
        log_number: logNumber,
        callsign_from: formData.callsign_from.trim(),
        callsign_to: (formData.callsign_to || 'Event Control').trim(),
        occurrence: resolvedOccurrence,
        incident_type: resolvedType,
        action_taken: (formData.action_taken || '').trim(),
        is_closed: formData.is_closed,
        event_id: effectiveEvent.id,
        status: formData.status || 'open',
        ai_input: formData.ai_input || null,
        created_at: now,
        updated_at: now, // Keep this for backward compatibility
        timestamp: now, // Keep this for backward compatibility
        what3words: formData.what3words && formData.what3words.length > 6 ? formData.what3words : null,
        // Auditable logging fields
        time_of_occurrence: formData.time_of_occurrence || now,
        time_logged: formData.time_logged || now,
        entry_type: formData.entry_type || 'contemporaneous',
        retrospective_justification: formData.retrospective_justification || null,
        logged_by_user_id: user?.id || null,
        logged_by_callsign: userCallsign,
        is_amended: false,
        // Add GPS coordinates if what3words coordinates are available
        ...(w3wCoordinates && {
          latitude: w3wCoordinates.lat,
          longitude: w3wCoordinates.lng
        })
      };

      // First, check if the log number already exists
      const { data: existingIncident } = await supabase
        .from('incident_logs')
        .select('id')
        .eq('log_number', logNumber)
        .single();

      if (existingIncident) {
        throw new Error('Log number already exists. Please try again.');
      }

      // Insert the incident
      let insertedIncident: { id: number } | null = null;
      const { data: insertReturn, error: insertError } = await supabase
        .from('incident_logs')
        .insert([incidentData])
        .select('id')
        .maybeSingle();
      if (insertError) {
        console.error('Insert error:', insertError);
        throw new Error((insertError as any)?.message || 'Insert failed');
      }
      insertedIncident = insertReturn as any;
      if (!insertedIncident?.id) {
        // Some RLS policies disable returning representation; fetch by unique log_number as fallback
        const { data: fetchedByLog, error: fetchByLogError } = await supabase
          .from('incident_logs')
          .select('id')
          .eq('log_number', logNumber)
          .eq('event_id', effectiveEvent.id)
          .single();
        if (!fetchByLogError) {
          insertedIncident = fetchedByLog as any;
        }
      }

      // If still no id, proceed without post-insert updates

      // If this is an attendance incident, also update the attendance_records table
      if (formData.incident_type === 'Attendance') {
        const count = parseInt(formData.occurrence.match(/\d+/)?.[0] || '0');
        console.log('🎯 Attendance incident - extracted count:', count, 'from:', formData.occurrence);
        if (count > 0) {
          console.log('🎯 Inserting attendance record:', { event_id: effectiveEvent.id, count, timestamp: now });
          const { error: attendanceError, data: attendanceData } = await supabase
            .from('attendance_records')
            .insert([{
              event_id: effectiveEvent.id,
              count: count,
              timestamp: now
            }])
            .select();

          if (attendanceError) {
            console.error('❌ Error updating attendance record:', attendanceError);
            // Don't throw here, as the incident was already created
          } else {
            console.log('✅ Successfully inserted attendance record:', attendanceData);
          }
        } else {
          console.log('⚠️ No valid count found in attendance incident');
        }
      }

      console.log('Successfully created incident:', insertedIncident);

      // Auto-assignment removed per requirements

      // Removed required skills/assignment feedback updates per requirements

      // Calculate escalation time only for medium/high/urgent
      if (insertedIncident?.id && ['medium', 'high', 'urgent'].includes((formData.priority || '').toLowerCase())) {
        try {
          const escalationTime = await calculateEscalationTime(
            formData.incident_type,
            formData.priority
          );

          if (escalationTime) {
            // Update incident with escalation time
          await supabase
            .from('incident_logs')
            .update({
              escalate_at: escalationTime.toISOString()
            })
            .eq('id', insertedIncident.id);
          }
        } catch (escalationError) {
          console.error('Error calculating escalation time:', escalationError);
          // Don't fail the incident creation if escalation calculation fails
        }
      }

      // Dependencies removed per requirements

      // Clear form and close modal
      setFormData({
        callsign_from: '',
        callsign_to: 'Event Control',
        occurrence: '',
        incident_type: '',
        action_taken: '',
        is_closed: false,
        status: 'open',
        ai_input: '',
        log_number: '',
        what3words: '///',
        priority: 'medium',
        location_name: '',
        time_of_occurrence: new Date().toISOString(),
        time_logged: new Date().toISOString(),
        entry_type: 'contemporaneous',
        retrospective_justification: ''
      });

      setRefusalDetails({
        policeRequired: false,
        description: '',
        location: '',
        reason: '',
        banned: false,
        aggressive: false
      });

      // Broadcast incident summary update
      try {
        const { broadcastIncidentSummaryUpdate } = await import('@/lib/incidentSummaryBroadcast')
        await broadcastIncidentSummaryUpdate(effectiveEvent.id)
      } catch (broadcastError) {
        console.warn('Failed to broadcast incident summary update:', broadcastError)
        // Don't fail the incident creation if broadcast fails
      }

      // Call onIncidentCreated callback with the created incident and close modal
      await onIncidentCreated(insertedIncident);
      onClose();

      let photoUrl = null;
      if (photoFile && insertedIncident?.id) {
        // Upload to /[eventID]/[incidentID]/[filename]
        const ext = photoFile.name.split('.').pop();
        const path = `${effectiveEvent.id}/${insertedIncident.id}/photo.${ext}`;
        const { error: uploadError } = await supabase.storage.from('incident-photos').upload(path, photoFile, { upsert: true, contentType: photoFile.type });
        if (!uploadError) {
          photoUrl = path;
          // Update incident log with photo_url
          await supabase.from('incident_logs').update({ photo_url: path }).eq('id', insertedIncident.id);
        }
      }
    } catch (error) {
      console.error('Error creating incident:', error);
      const message = (error as any)?.message || (error instanceof Error ? error.message : null) || 'Failed to create incident. Please try again.';
      alert(message);
    } finally {
      setLoading(false);
    }
  };

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
      case 'Ejection':
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

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // Validate type
    const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/heic'];
    if (!validTypes.includes(file.type)) {
      setPhotoError('Only JPG, PNG, or HEIC images are allowed.');
      return;
    }
    // Validate size
    if (file.size > 5 * 1024 * 1024) {
      // Try to compress
      try {
        const compressed = await imageCompression(file, { maxSizeMB: 5, maxWidthOrHeight: 1920 });
        setPhotoFile(compressed);
        setPhotoPreviewUrl(URL.createObjectURL(compressed));
        setPhotoError(null);
      } catch (err) {
        setPhotoError('Image is too large and could not be compressed.');
        return;
      }
    } else {
      setPhotoFile(file);
      setPhotoPreviewUrl(URL.createObjectURL(file));
      setPhotoError(null);
    }
  };

  // Add a function to reset the form to its initial state
  const resetForm = () => {
    setFormData({
      callsign_from: '',
      callsign_to: 'Event Control',
      occurrence: '',
      incident_type: initialIncidentType || '',
      action_taken: '',
      is_closed: false,
      status: 'open',
      log_number: '',
      what3words: '///',
      priority: 'medium',
      location_name: '',
      // Auditable logging defaults
      time_of_occurrence: new Date().toISOString(),
      time_logged: new Date().toISOString(),
      entry_type: 'contemporaneous',
      retrospective_justification: '',
      // Structured template defaults
      headline: '',
      source: '',
      facts_observed: '',
      actions_taken: '',
      outcome: '',
      use_structured_template: true
    });
    setW3wInput('')
    resetWhat3Words()
    setFactualValidationWarnings([])
    setRefusalDetails({
      policeRequired: false,
      description: '',
      location: '',
      reason: '',
      banned: false,
      aggressive: false
    });
    setMedicalDetails({
      location: '',
      requiresAmbulance: false,
      refusedTreatment: false,
      transportedOffSite: false
    });
    setEjectionDetails({
      location: '',
      description: '',
      reason: '',
      policeInformed: false,
      refusedReentry: false,
      additionalInfo: { additionalSecurity: false }
    });
    setPhotoFile(null);
    setPhotoPreviewUrl(null);
    setPhotoError(null);
    setShowRefusalActions(false);
    setFollowUpAnswers({});
    setProcessingAI(false);
    setMissingCallsign(false);
    setIsEditing({ occurrence: false, action_taken: false });
    setW3wManuallyEdited(false);
    setShowMoreTypes(false);
  };

  const followUpQuestions = getFollowUpQuestions(formData.incident_type)

  // What3Words input logic

  // Update handleW3WChange to set the manual edit flag
  const handleW3WChange = (value: string) => {
    setW3wManuallyEdited(true)
    const sanitized = value
      .toLowerCase()
      .replace(/[^a-z0-9.\s]/g, '')
      .replace(/\s+/g, '.')
      .replace(/\.+/g, '.')
      .replace(/^\.+/, '')

    setW3wInput(sanitized)
    setFormData((prev) => ({
      ...prev,
      what3words: sanitized ? `///${sanitized}` : '',
    }))
  }

  useEffect(() => {
    if (!isOpen) {
      return
    }

    if (!w3wInput) {
      resetWhat3Words()
      return
    }

    const normalized = w3wInput.replace(/^\/*/, '')
    let isActive = true

    const timeout = setTimeout(async () => {
      const success = await validateWhat3Words(normalized)
      if (!isActive) {
        return
      }

      if (success) {
        try {
          window.localStorage?.setItem('last_w3w_location', normalized)
        } catch (error) {
          console.warn('Unable to persist last what3words location', error)
        }

        setFormData((prev) => ({
          ...prev,
          what3words: `///${normalized}`,
        }))
      }
    }, 500)

    return () => {
      isActive = false
      clearTimeout(timeout)
    }
  }, [isOpen, resetWhat3Words, validateWhat3Words, w3wInput])

  useEffect(() => {
    if (!isOpen) {
      return
    }

    const existing = formData.what3words?.replace(/^\/*/, '').replace(/^\.+/, '') || ''
    let initialValue = existing

    if (!initialValue && typeof window !== 'undefined') {
      try {
        const stored = window.localStorage.getItem('last_w3w_location')
        if (stored) {
          initialValue = stored
        }
      } catch (error) {
        console.warn('Unable to read last what3words location', error)
      }
    }

    setW3wInput(initialValue)
    if (initialValue) {
      setFormData((prev) =>
        prev.what3words === `///${initialValue}`
          ? prev
          : { ...prev, what3words: `///${initialValue}` }
      )
    }
  }, [formData.what3words, isOpen])

  // Extract w3w from Quick Input
  const extractW3WFromQuickInput = (input: string) => {
    // Only match if input contains ///word.word.word
    const regex = /\/\/\/([a-zA-Z0-9]+)\.([a-zA-Z0-9]+)\.([a-zA-Z0-9]+)/;
    const match = input.match(regex);
    if (match) {
      return `///${match[1]}.${match[2]}.${match[3]}`;
    }
    return null;
  };

  // Responsive incident type grid: 8x3 (desktop), 4x3 (mobile)
  const desktopVisibleCount = 24;
const mobileVisibleCount = 11;

// Sort types by usage count (desc), then name
const sortedIncidentTypes = React.useMemo(() => {
  return Object.keys(INCIDENT_TYPES)
    .sort((a, b) => {
      const diff = (usageCounts[b] || 0) - (usageCounts[a] || 0);
      if (diff !== 0) return diff;
      return a.localeCompare(b);
    });
}, [usageCounts]);

// Use sortedIncidentTypes for grid
const desktopVisibleTypes = sortedIncidentTypes.slice(0, desktopVisibleCount);
const mobileVisibleTypes = sortedIncidentTypes.slice(0, mobileVisibleCount);
const desktopPlaceholdersNeeded = desktopVisibleCount - desktopVisibleTypes.length;
const mobilePlaceholdersNeeded = mobileVisibleCount - mobileVisibleTypes.length;

  const handleIncidentTypeSelect = (type: string) => {
    setFormData(prev => ({
      ...prev,
      incident_type: type,
      occurrence: `${type}: `
    }));
    // Attendance prefill
    if (type === 'Attendance' && !formData.ai_input) {
      setFormData(prev => ({
        ...prev,
        ai_input: 'Current Attendance: '
      }));
    }
    // Increment usage
    setUsageCounts((prev: Record<string, number>) => {
      const updated = { ...prev, [type]: (prev[type] || 0) + 1 };
      saveUsageCounts(updated);
      return updated;
    });
    document.getElementById('occurrence-input')?.focus();
  };

  useEffect(() => {
    if (formData.incident_type === 'Ejection') {
      let baseOccurrence = formData.occurrence.split('Location:')[0].trim();
      let details = [];
      if (ejectionDetails.location) details.push(`Location: ${ejectionDetails.location}`);
      if (ejectionDetails.description) details.push(`Description: ${ejectionDetails.description}`);
      if (ejectionDetails.reason) details.push(`Reason: ${ejectionDetails.reason}`);
      const appended = details.length > 0 ? `${baseOccurrence}${baseOccurrence ? ' ' : ''}${details.join(' ')}` : baseOccurrence;
      if (formData.occurrence !== appended) {
        setFormData(prev => ({ ...prev, occurrence: appended }));
      }
    }
  }, [ejectionDetails.location, ejectionDetails.description, ejectionDetails.reason, formData.incident_type, formData.occurrence]);

  if (!isOpen) {
    return null;
  }

  return (
    <div 
      ref={modalRef}
      className={`fixed inset-0 bg-black/60 backdrop-blur-md overflow-y-auto h-full w-full z-[60] ${isOpen ? '' : 'hidden'}`}
      style={{
        paddingLeft: 'max(env(safe-area-inset-left), 0px)',
        paddingRight: 'max(env(safe-area-inset-right), 0px)',
      }}
      {...swipeGestures}
      onMouseMove={(e) => {
        if (modalRef.current) {
          const rect = modalRef.current.getBoundingClientRect();
          updateCursor(e.clientX - rect.left, e.clientY - rect.top);
        }
      }}
    >
      <div className="relative md:max-h-[85vh] h-full md:h-auto overflow-hidden mx-auto p-0 border w-full md:w-[95%] max-w-6xl shadow-2xl md:rounded-xl md:my-8 bg-white dark:bg-[#23408e] dark:border-[#2d437a] md:mx-auto md:my-8">
        {/* Mobile: Full-screen modal */}
        <div className="block md:hidden h-full flex flex-col">
          {/* Mobile Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-[#2d437a] bg-white dark:bg-[#23408e] sticky top-0 z-10">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Create Incident</h2>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors touch-target min-h-[44px] min-w-[44px] flex items-center justify-center"
              aria-label="Close modal"
            >
              <XMarkIcon className="h-6 w-6 text-gray-500 dark:text-gray-400" />
            </button>
          </div>
          
          {/* Mobile Content */}
          <div className="flex-1 overflow-y-auto p-4">
            {/* Mobile Form Content */}
            <div className="space-y-6">
              {/* Quick Add Section - Mobile Optimized */}
              <div className="bg-gray-50 dark:bg-[#1a2f6b] rounded-xl p-4 space-y-4">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Quick Entry</h3>
                
                <QuickTabs
                  eventId={selectedEventId || ''}
                  onIncidentLogged={async () => {
                    await onIncidentCreated();
                  }}
                  currentUser={user}
                />
                
                <div className="flex items-center gap-2">
                  <div className="flex-1 border-t border-gray-300 dark:border-gray-600"></div>
                  <span className="text-xs text-gray-500 dark:text-gray-400">OR</span>
                  <div className="flex-1 border-t border-gray-300 dark:border-gray-600"></div>
                </div>
                
                <div className="space-y-3">
                  <QuickAddInput
                    onQuickAdd={handleQuickAdd}
                    onParsedData={handleParsedData}
                    showParseButton={true}
                    className="w-full"
                  />
                  <div className="flex gap-2">
                    <VoiceInputCompact
                      onTranscript={(transcript) => {
                        setFormData(prev => ({ ...prev, occurrence: prev.occurrence + (prev.occurrence ? ' ' : '') + transcript }));
                      }}
                      className="flex-1"
                    />
                    <motion.button
                      type="button"
                      onClick={() => {
                        // Simple AI assist - just clear the form for now
                        setFormData(prev => ({ ...prev, occurrence: '', action_taken: '' }));
                      }}
                      disabled={loading}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors touch-target min-h-[44px]"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <CloudArrowUpIcon className="h-5 w-5" />
                      <span className="text-sm font-medium">
                        Clear Form
                      </span>
                    </motion.button>
                  </div>
                </div>
              </div>
              
              {/* Mobile Form Fields */}
              <div className="space-y-4">
                {/* Incident Type - Mobile Optimized */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Incident Type *
                  </label>
                  <select
                    value={formData.incident_type}
                    onChange={(e) => {
                      const incidentType = e.target.value;
                      setFormData(prev => ({ 
                        ...prev, 
                        incident_type: incidentType,
                        // Auto-set Attendance incidents to low priority
                        priority: incidentType === 'Attendance' ? 'low' : prev.priority
                      }));
                    }}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-[#2d437a] rounded-lg bg-white dark:bg-[#1a2f6b] text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 touch-target min-h-[44px] text-base"
                    required
                  >
                    <option value="">Select incident type</option>
                    <option value="Medical">Medical</option>
                    <option value="Security">Security</option>
                    <option value="Crowd Control">Crowd Control</option>
                    <option value="Fire Safety">Fire Safety</option>
                    <option value="Traffic">Traffic</option>
                    <option value="Technical">Technical</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                
                {/* Occurrence - Mobile Optimized */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Occurrence *
                  </label>
                  <textarea
                    value={formData.occurrence}
                    onChange={(e) => setFormData(prev => ({ ...prev, occurrence: e.target.value }))}
                    placeholder="Describe what happened..."
                    className="w-full px-4 py-3 border border-gray-300 dark:border-[#2d437a] rounded-lg bg-white dark:bg-[#1a2f6b] text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none touch-target min-h-[120px] text-base"
                    rows={4}
                    required
                  />
                </div>
                
                {/* Callsigns - Mobile Optimized */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      From *
                    </label>
                    <input
                      type="text"
                      value={formData.callsign_from}
                      onChange={(e) => setFormData(prev => ({ ...prev, callsign_from: e.target.value }))}
                      placeholder="Your callsign"
                      className="w-full px-4 py-3 border border-gray-300 dark:border-[#2d437a] rounded-lg bg-white dark:bg-[#1a2f6b] text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 touch-target min-h-[44px] text-base"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      To *
                    </label>
                    <input
                      type="text"
                      value={formData.callsign_to}
                      onChange={(e) => setFormData(prev => ({ ...prev, callsign_to: e.target.value }))}
                      placeholder="Target callsign"
                      className="w-full px-4 py-3 border border-gray-300 dark:border-[#2d437a] rounded-lg bg-white dark:bg-[#1a2f6b] text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 touch-target min-h-[44px] text-base"
                      required
                    />
                  </div>
                </div>
                
                {/* Action Taken - Mobile Optimized */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Action Taken
                  </label>
                  <textarea
                    value={formData.action_taken}
                    onChange={(e) => setFormData(prev => ({ ...prev, action_taken: e.target.value }))}
                    placeholder="What action was taken?"
                    className="w-full px-4 py-3 border border-gray-300 dark:border-[#2d437a] rounded-lg bg-white dark:bg-[#1a2f6b] text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none touch-target min-h-[100px] text-base"
                    rows={3}
                  />
                </div>
              </div>
            </div>
          </div>
          
          {/* Mobile Footer */}
          <div className="border-t border-gray-200 dark:border-[#2d437a] bg-white dark:bg-[#23408e] p-4 sticky bottom-0">
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-3 border border-gray-300 dark:border-[#2d437a] text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors touch-target min-h-[44px] text-base font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="flex-1 px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors touch-target min-h-[44px] text-base font-medium"
              >
                {loading ? 'Creating...' : 'Create Incident'}
              </button>
            </div>
          </div>
        </div>
        
        {/* Desktop: Original Modal Content */}
        <div className="hidden md:block">
        {/* Real-time collaboration indicators */}
        {isConnected && (
          <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
            <div className="flex items-center gap-1">
              {presenceUsers.filter(u => u.id !== user?.id).map((presenceUser) => (
                <div
                  key={presenceUser.id}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white"
                  style={{ backgroundColor: presenceUser.color }}
                  title={presenceUser.name}
                >
                  {presenceUser.name.charAt(0).toUpperCase()}
                </div>
              ))}
            </div>
            <span className="text-xs text-gray-500">
              {presenceUsers.filter(u => u.id !== user?.id).length} collaborating
            </span>
          </div>
        )}
        
        {/* Cursor tracker */}
        <CursorTracker users={presenceUsers} containerRef={modalRef} />

        {/* Header - Mobile Optimized */}
        <header className="px-4 sm:px-6 pt-4 sm:pt-5 pb-3 border-b sticky top-0 bg-white dark:bg-[#23408e] z-30" style={{
          paddingTop: 'max(env(safe-area-inset-top), 1rem)',
        }}>
          <div className="flex justify-between items-center">
          <div className="flex items-center gap-3 sm:gap-4">
              <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-xl bg-gradient-to-br from-red-500 via-red-600 to-red-700 flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-base sm:text-lg">🚨</span>
            </div>
            <div>
                <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">New Incident</h3>
                <div className="flex items-center gap-4 mt-1">
                <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-gray-600 dark:text-gray-300">Event:</span>
                    <span className="text-xs font-semibold text-gray-900 dark:text-white">
                  {(() => {
                    const chosen = events.find(e => e.id === selectedEventId)
                      || events.find(e => e.is_current)
                      || currentEventFallback
                      || events[0];
                    if (chosen?.event_name) return chosen.event_name;
                    return eventsLoading ? 'Loading...' : 'No events available';
                  })()}
                </span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-gray-600 dark:text-gray-300">Log #:</span>
                    <span className="text-xs font-semibold text-gray-900 dark:text-white">
                    {nextLogNumber}
                  </span>
                </div>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
              className="touch-target h-10 w-10 md:h-8 md:w-8 rounded-lg bg-gray-100 dark:bg-[#2d437a] hover:bg-gray-200 dark:hover:bg-[#1e3555] active:scale-95 flex items-center justify-center transition-all duration-200 shadow-sm hover:shadow-md"
          >
              <svg className="h-5 w-5 md:h-4 md:w-4 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        </header>

                {/* Quick Add Bar - Full Width */}
        <div className="px-6 py-4 border-b bg-gray-50 dark:bg-[#1a2a57] space-y-4">
          {/* Quick Tabs for Common Logs */}
          <QuickTabs
            eventId={selectedEventId || ''}
            onIncidentLogged={async () => {
              await onIncidentCreated();
            }}
            currentUser={user}
          />
          
          {/* Divider */}
          <div className="flex items-center gap-4">
            <div className="flex-1 border-t border-gray-300 dark:border-gray-600"></div>
            <span className="text-sm text-gray-500 dark:text-gray-400 font-medium">OR use natural language</span>
            <div className="flex-1 border-t border-gray-300 dark:border-gray-600"></div>
          </div>
          
          <div className="relative">
            <QuickAddInput 
              aiSource={quickAddAISource} 
              onQuickAdd={async (val) => { await handleQuickAdd(val); }} 
              onParsedData={handleParsedData}
              isProcessing={isQuickAddProcessing} 
              showParseButton={true}
              autoParseOnEnter={false}
              onChangeValue={(txt) => {
                if (!txt || !txt.trim()) {
                  setFormData(prev => ({
                    ...prev,
                    occurrence: '',
                    action_taken: '',
                    incident_type: 'Select Type',
                    callsign_from: '',
                    what3words: ''
                  }));
                }
              }} 
            />
            <div aria-live="polite" className="sr-only">
              {quickAddAISource && `Processing with ${quickAddAISource === 'cloud' ? 'cloud AI' : 'browser AI'}`}
            </div>
            
                         {/* Voice-to-Text Button */}
             <motion.button
               type="button"
               onClick={toggleListening}
               disabled={!recognition}
               className={`absolute right-4 top-1/2 transform -translate-y-1/2 p-3 rounded-full transition-all duration-200 touch-target-large ${
                 isListening 
                   ? 'bg-red-500 text-white shadow-lg shadow-red-500/50 animate-pulse' 
                   : voiceError
                   ? 'bg-yellow-500 text-white shadow-lg shadow-yellow-500/50'
                   : 'bg-blue-500 text-white hover:bg-blue-600 shadow-md hover:shadow-lg'
               } ${!recognition ? 'opacity-50 cursor-not-allowed' : 'hover:scale-110'}`}
               whileHover={{ scale: recognition ? 1.1 : 1 }}
               whileTap={{ scale: 0.95 }}
               title={
                 recognition 
                   ? (isListening 
                       ? 'Stop recording (will process for 800ms)' 
                       : voiceError 
                         ? 'Voice recognition error - click to try again' 
                         : 'Start voice recording')
                   : 'Voice recognition not available'
               }
             >
               <MicrophoneIcon className="h-5 w-5" />
             </motion.button>
          </div>

          {/* Voice Transcript Display */}
          <AnimatePresence>
            {transcript && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-xl"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <MicrophoneIcon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    <span className="text-sm font-medium text-blue-700 dark:text-blue-300">Voice Input:</span>
                  </div>
                                     {isListening && (
                     <div className="flex items-center gap-2">
                       <div className="flex items-center gap-1">
                         <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                         <span className="text-xs text-green-600 dark:text-green-400">Listening...</span>
                       </div>
                       <button
                         onClick={() => {
                           if (recognition && isListening) {
                             recognition.isManuallyStopping = true;
                             recognition.stop();
                           }
                         }}
                         className="px-2 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600 transition-colors"
                         title="Stop listening"
                       >
                         Stop
                       </button>
                     </div>
                   )}
                   {transcript && !isListening && (
                     <div className="flex items-center gap-1">
                       <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                       <span className="text-xs text-blue-600 dark:text-blue-400">Ready to submit</span>
                     </div>
                   )}
                   {isRetrying && (
                     <div className="flex items-center gap-1">
                       <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
                       <span className="text-xs text-yellow-600 dark:text-yellow-400">Retrying...</span>
                     </div>
                   )}
                </div>
                <p className="text-sm text-blue-800 dark:text-blue-200">{transcript}</p>
                
                {/* Manual Submit Button */}
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={() => {
                      const cleanTranscript = transcript.replace(/\s*\[interim\].*$/, '').trim();
                      if (cleanTranscript) {
                        handleQuickAdd(cleanTranscript);
                        setTranscript('');
                      }
                    }}
                    className="px-3 py-1 bg-green-600 text-white text-xs rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Use This Text
                  </button>
                  <button
                    onClick={() => setTranscript('')}
                    className="px-3 py-1 bg-gray-500 text-white text-xs rounded-lg hover:bg-gray-600 transition-colors"
                  >
                    Clear
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Voice Error Display */}
          <AnimatePresence>
            {voiceError && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mt-3 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-xl"
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-medium text-yellow-800 dark:text-yellow-300 mb-1">Voice Recognition Error</h4>
                    <p className="text-sm text-yellow-700 dark:text-yellow-400 mb-3">{voiceError}</p>
                    <div className="flex space-x-3">
                      <button
                        onClick={() => setVoiceError(null)}
                        className="text-xs text-yellow-600 dark:text-yellow-400 hover:text-yellow-800 dark:hover:text-yellow-200 underline"
                      >
                        Dismiss
                      </button>
                      <button
                        onClick={() => {
                          setVoiceError(null);
                          startListening();
                        }}
                        className="text-xs text-yellow-600 dark:text-yellow-400 hover:text-yellow-800 dark:hover:text-yellow-200 underline"
                      >
                        Try Again
                      </button>
                      {voiceError.includes('permission') && (
                        <button
                          onClick={() => {
                            // Open browser settings help
                            window.open('https://support.google.com/chrome/answer/2693767?hl=en', '_blank');
                          }}
                          className="text-xs text-yellow-600 dark:text-yellow-400 hover:text-yellow-800 dark:hover:text-yellow-200 underline"
                        >
                          Fix Permissions
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Offline Status Indicator */}
          <AnimatePresence>
            {isOfflineMode && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mt-3 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-xl"
              >
                <div className="flex items-center gap-3">
                  <WifiIcon className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                  <div className="flex-1">
                    <h4 className="text-sm font-medium text-yellow-800 dark:text-yellow-300">Offline Mode</h4>
                    <p className="text-sm text-yellow-700 dark:text-yellow-400">
                      You&apos;re currently offline. Incidents will be saved locally and synced when you&apos;re back online.
                    </p>
                  </div>
                  <motion.button
                    type="button"
                    onClick={() => offlineActions.triggerManualSync()}
                    disabled={offlineState.isSyncInProgress}
                    className="p-2 bg-yellow-100 dark:bg-yellow-800 rounded-lg hover:bg-yellow-200 dark:hover:bg-yellow-700 transition-colors duration-200 touch-target"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <ArrowPathIcon className={`h-4 w-4 text-yellow-600 dark:text-yellow-400 ${offlineState.isSyncInProgress ? 'animate-spin' : ''}`} />
                  </motion.button>
                </div>
                
                {/* Sync Progress */}
                {offlineState.isSyncInProgress && (
                  <div className="mt-3">
                    <div className="flex justify-between text-xs text-yellow-600 dark:text-yellow-400 mb-1">
                      <span>Syncing...</span>
                      <span>{offlineState.syncProgress.completed}/{offlineState.syncProgress.total}</span>
                    </div>
                    <div className="w-full bg-yellow-200 dark:bg-yellow-800 rounded-full h-2">
                      <motion.div
                        className="bg-yellow-500 h-2 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ 
                          width: offlineState.syncProgress.total > 0 
                            ? `${(offlineState.syncProgress.completed / offlineState.syncProgress.total) * 100}%` 
                            : 0 
                        }}
                        transition={{ duration: 0.3 }}
                      />
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Content scroll area */}
        <div className="px-6 pb-24 overflow-auto h-[calc(85vh-120px)]">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 h-full">
            {/* Left Column - Incident Type (scrollable) */}
            <section className="lg:col-span-3 h-full">
              <div className="bg-white rounded-lg shadow-sm border p-4 h-full flex flex-col">
                <div className="flex items-center gap-2 mb-4 flex-shrink-0">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                    <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                  </div>
                  <h3 className="text-sm font-semibold text-gray-900">Incident Type</h3>
                </div>
                
                <div className="mb-3 flex-shrink-0">
                  <input
                    type="text"
                    placeholder="Search types..."
                    value={typeSearchQuery}
                    onChange={(e) => setTypeSearchQuery(e.target.value)}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div className="flex-1 overflow-y-auto pr-1 min-h-0">
                  <IncidentTypeCategories
                    selectedType={formData.incident_type}
                    onTypeSelect={handleIncidentTypeSelect}
                    usageStats={incidentTypeUsageStats}
                  />
              </div>
            </div>
            </section>

            {/* Middle Column - Callsign, Configuration, Detailed Info */}
            <section className="lg:col-span-5 space-y-4 h-full">
              {/* Callsign Information Card */}
              <div className="bg-white rounded-lg shadow-sm border p-4" role="region" aria-labelledby="callsign-title">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
                    <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </div>
                  <h3 id="callsign-title" className="text-sm font-semibold text-gray-900">Callsign Information</h3>
                </div>
                <div className="grid grid-cols-2 gap-3">
                <div>
                    <label htmlFor="callsign-from" className="block text-sm font-medium text-gray-700 mb-1">From</label>
                  <div className="relative">
                    <input
                        id="callsign-from"
                      type="text"
                      value={formData.callsign_from || ''}
                      onChange={(e) => setFormData({ ...formData, callsign_from: e.target.value })}
                      onFocus={() => updateFocus('callsign-from')}
                      onBlur={() => updateTyping('callsign-from', false)}
                      onKeyDown={() => updateTyping('callsign-from', true)}
                      placeholder="Enter callsign..."
                        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <TypingIndicator users={presenceUsers} fieldName="callsign-from" position="bottom" />
                  </div>
                </div>
                <div>
                    <label htmlFor="callsign-to" className="block text-sm font-medium text-gray-700 mb-1">To</label>
                  <input
                      id="callsign-to"
                    type="text"
                    value={formData.callsign_to || 'Event Control'}
                    onChange={(e) => setFormData({ ...formData, callsign_to: e.target.value })}
                      className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

              {/* Incident Configuration Card */}
              <div className={`bg-white rounded-lg shadow-sm border p-4 ${
                formData.priority === 'high' ? 'border-l-4 border-l-red-500' : ''
              }`} role="region" aria-labelledby="configuration-title">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
                    <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <h3 id="configuration-title" className="text-sm font-semibold text-gray-900">Incident Configuration</h3>
                </div>
                <div>
                  <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-1">Priority Level</label>
                  <div className="relative">
                  <select
                      id="priority"
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                      className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                </div>
                    </div>
                  </div>
                
                {/* Entry Type Section */}
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Entry Type
                    <span className="ml-1 text-gray-400" title="Select whether this is being logged in real-time or retrospectively">ⓘ</span>
                  </label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="entry_type"
                        value="contemporaneous"
                        checked={formData.entry_type === 'contemporaneous'}
                        onChange={(e) => {
                          setFormData({ ...formData, entry_type: e.target.value as EntryType })
                          setEntryTypeWarnings([])
                        }}
                        className="text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">⏱️ Contemporaneous (Real-time)</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="entry_type"
                        value="retrospective"
                        checked={formData.entry_type === 'retrospective'}
                        onChange={(e) => {
                          setFormData({ ...formData, entry_type: e.target.value as EntryType })
                          setShowAdvancedTimestamps(true)
                        }}
                        className="text-amber-600 focus:ring-amber-500"
                      />
                      <span className="text-sm text-gray-700">🕓 Retrospective (Delayed)</span>
                    </label>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {formData.entry_type === 'contemporaneous' 
                      ? 'This entry is being logged in real-time or shortly after the incident'
                      : 'This entry is being logged after a significant delay from when the incident occurred'
                    }
                  </p>
                </div>

                {/* Retrospective Justification (Conditional) */}
                {formData.entry_type === 'retrospective' && (
                  <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <label htmlFor="retro-justification" className="block text-sm font-medium text-amber-800 mb-2">
                      Retrospective Justification *
                    </label>
                    <textarea
                      id="retro-justification"
                      value={formData.retrospective_justification || ''}
                      onChange={(e) => setFormData({ ...formData, retrospective_justification: e.target.value })}
                      placeholder="Explain why this entry is being logged retrospectively (e.g., 'Live comms prevented immediate logging')"
                      rows={2}
                      className="w-full rounded-lg border border-amber-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
                      required
                    />
                    <p className="text-xs text-amber-700 mt-1">Required for retrospective entries</p>
                  </div>
                )}

                {/* Advanced Timestamps (Collapsible) */}
                {(showAdvancedTimestamps || formData.entry_type === 'retrospective') && (
                  <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <button
                      type="button"
                      onClick={() => setShowAdvancedTimestamps(!showAdvancedTimestamps)}
                      className="flex items-center gap-2 text-sm font-medium text-blue-800 mb-3"
                    >
                      {showAdvancedTimestamps ? '▼' : '▶'} Advanced Timestamps
                    </button>
                    {showAdvancedTimestamps && (
                      <div className="space-y-3">
                        <div>
                          <label htmlFor="time-occurred" className="block text-xs font-medium text-blue-800 mb-1">
                            Time of Occurrence
                          </label>
                          <input
                            id="time-occurred"
                            type="datetime-local"
                            value={formData.time_of_occurrence?.slice(0, 16) || ''}
                            onChange={(e) => {
                              const newTime = e.target.value ? new Date(e.target.value).toISOString() : new Date().toISOString()
                              setFormData({ ...formData, time_of_occurrence: newTime })
                              
                              // Validate entry type
                              const validation = validateEntryType(
                                new Date(newTime),
                                new Date(formData.time_logged || new Date().toISOString()),
                                formData.entry_type || 'contemporaneous'
                              )
                              setEntryTypeWarnings(validation.warnings)
                            }}
                            className="w-full rounded-lg border border-blue-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                          />
                        </div>
                        <div>
                          <label htmlFor="time-logged" className="block text-xs font-medium text-blue-800 mb-1">
                            Time Logged
                          </label>
                          <input
                            id="time-logged"
                            type="datetime-local"
                            value={formData.time_logged?.slice(0, 16) || ''}
                            onChange={(e) => {
                              const newTime = e.target.value ? new Date(e.target.value).toISOString() : new Date().toISOString()
                              setFormData({ ...formData, time_logged: newTime })
                            }}
                            className="w-full rounded-lg border border-blue-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                            disabled
                          />
                          <p className="text-xs text-blue-600 mt-1">Auto-set to current time</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Entry Type Warnings */}
                {entryTypeWarnings.length > 0 && (
                  <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex gap-2">
                      <svg className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-yellow-800 mb-1">Entry Type Warning</p>
                        {entryTypeWarnings.map((warning, idx) => (
                          <p key={idx} className="text-xs text-yellow-700">{warning}</p>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Detailed Information Card */}
              <div className="bg-white rounded-lg shadow-sm border p-4" role="region" aria-labelledby="detailed-info-title">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center">
                    <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
              </div>
                  <h3 id="detailed-info-title" className="text-sm font-semibold text-gray-900">Detailed Information</h3>
            </div>
              <div className="space-y-4">
                <div>
                    <label htmlFor="incident-type" className="block text-sm font-medium text-gray-700 mb-1">Incident Type</label>
                    <div className="relative">
                  <select
                        id="incident-type"
                    value={formData.incident_type || ''}
                    onChange={(e) => {
                      const incidentType = e.target.value;
                      setFormData({ 
                        ...formData, 
                        incident_type: incidentType,
                        // Auto-set Attendance incidents to low priority
                        priority: incidentType === 'Attendance' ? 'low' : formData.priority
                      });
                    }}
                        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white"
                  >
                    <option value="">Select Type</option>
                    {incidentTypes.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                </div>
                {/* Logging Template Toggle */}
                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-blue-800">📝 Logging Template</span>
                      <span className="text-xs text-blue-600">
                        {formData.use_structured_template ? 'Structured (Recommended)' : 'Legacy Format'}
                      </span>
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.use_structured_template || false}
                        onChange={(e) => setFormData({ ...formData, use_structured_template: e.target.checked })}
                        className="text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-blue-700">Use Structured Template</span>
                    </label>
                  </div>
                </div>

                {formData.use_structured_template ? (
                  /* Structured Template */
                  <div className="space-y-4">
                    {/* Headline */}
                    <div>
                      <label htmlFor="headline" className="block text-sm font-medium text-gray-700 mb-1">
                        Headline (≤15 words)
                        <span className="ml-2 text-xs text-blue-600 font-normal" title="Brief summary of the incident">💡 Brief summary</span>
                      </label>
                      <input
                        id="headline"
                        type="text"
                        value={formData.headline || ''}
                        onChange={(e) => setFormData({ ...formData, headline: e.target.value })}
                        placeholder="e.g., Medical incident at north gate - person collapsed"
                        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                        maxLength={150}
                      />
                      <div className="flex justify-between items-center mt-1">
                        <p className="text-xs text-gray-500">Brief, factual headline</p>
                        <span className={`text-xs font-medium ${getHeadlineWordCount(formData.headline || '') > 15 ? 'text-red-600' : 'text-green-600'}`}>
                          {getHeadlineWordCount(formData.headline || '')}/15 words
                        </span>
                      </div>
                      {/* Debug info */}
                      <div className="text-xs text-gray-400 mt-1">
                        Debug: headline=&quot;{formData.headline || ''}&quot; wordCount={getHeadlineWordCount(formData.headline || '')}
                      </div>
                    </div>

                    {/* Source */}
                    <div>
                      <label htmlFor="source" className="block text-sm font-medium text-gray-700 mb-1">
                        Source
                        <span className="ml-2 text-xs text-blue-600 font-normal" title="Who reported this or where did the information come from">💡 Who/what reported</span>
                      </label>
                      <input
                        id="source"
                        type="text"
                        value={formData.source || ''}
                        onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                        placeholder="e.g., R3, CCTV North Gate, Security Team"
                        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                      />
                      <p className="text-xs text-gray-500 mt-1">Callsign, person, or source of information</p>
                    </div>

                    {/* Facts Observed */}
                    <div>
                      <label htmlFor="facts-observed" className="block text-sm font-medium text-gray-700 mb-1">
                        Facts Observed
                        <span className="ml-2 text-xs text-blue-600 font-normal" title="Stick to verifiable facts - avoid opinions or adjectives">💡 Stick to facts</span>
                      </label>
                      <textarea
                        id="facts-observed"
                        value={formData.facts_observed || ''}
                        onChange={(e) => {
                          const newValue = e.target.value
                          setFormData({ ...formData, facts_observed: newValue })
                          
                          // Validate factual language
                          const validation = validateFactualLanguage(newValue)
                          setFactualValidationWarnings(validation.warnings)
                        }}
                        placeholder="e.g., 15:03 - Person collapsed near north gate entrance. Crowd of approximately 20 people present. Person appears unconscious, not responsive to voice. No visible injuries observed."
                        rows={4}
                        className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:border-blue-500 resize-none bg-white ${
                          factualValidationWarnings.length > 0 
                            ? 'border-amber-300 focus:ring-amber-500' 
                            : 'border-gray-200 focus:ring-blue-500'
                        }`}
                      />
                      <p className="text-xs text-gray-500 mt-1">What was actually observed - who, what, where, when (no opinions)</p>
                      
                      {/* Factual Validation Warnings */}
                      {factualValidationWarnings.length > 0 && (
                        <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded text-xs">
                          <div className="flex gap-1">
                            <span className="text-amber-600 font-semibold">⚠️ Factual Language Check:</span>
                          </div>
                          <ul className="mt-1 space-y-1">
                            {factualValidationWarnings.map((warning, idx) => (
                              <li key={idx} className="text-amber-700">• {warning}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>

                    {/* Actions Taken */}
                    <div>
                      <label htmlFor="actions-taken" className="block text-sm font-medium text-gray-700 mb-1">
                        Actions Taken
                        <span className="ml-2 text-xs text-blue-600 font-normal" title="What was done and by whom">💡 What was done</span>
                      </label>
                      <textarea
                        id="actions-taken"
                        value={formData.actions_taken || ''}
                        onChange={(e) => setFormData({ ...formData, actions_taken: e.target.value })}
                        placeholder="e.g., R3 called medical team at 15:04. Crowd control established by security. Medical team arrived at 15:06. Person assessed and transported to medical tent at 15:08."
                        rows={3}
                        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none bg-white"
                      />
                      <p className="text-xs text-gray-500 mt-1">What actions were taken and by whom</p>
                    </div>

                    {/* Outcome */}
                    <div>
                      <label htmlFor="outcome" className="block text-sm font-medium text-gray-700 mb-1">
                        Outcome
                        <span className="ml-2 text-xs text-blue-600 font-normal" title="Final state or current status">💡 Current status</span>
                      </label>
                      <textarea
                        id="outcome"
                        value={formData.outcome || ''}
                        onChange={(e) => setFormData({ ...formData, outcome: e.target.value })}
                        placeholder="e.g., Person transported to medical tent. Incident ongoing. Crowd dispersed. Medical team monitoring."
                        rows={3}
                        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none bg-white"
                      />
                      <p className="text-xs text-gray-500 mt-1">Current status or final outcome</p>
                    </div>

                    {/* Preview of Structured Output */}
                    {(formData.headline || formData.source || formData.facts_observed || formData.actions_taken || formData.outcome) && (
                      <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                        <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                          📋 Preview of Log Entry
                          <span className="text-xs text-gray-500 font-normal">(How this will appear in the system)</span>
                        </h4>
                        <div className="bg-white p-3 rounded border text-sm font-mono whitespace-pre-wrap text-gray-800">
                          {generateStructuredOccurrence(formData)}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  /* Legacy Format */
                  <div>
                    <label htmlFor="occurrence" className="block text-sm font-medium text-gray-700 mb-1">
                      Occurrence Description
                      <span className="ml-2 text-xs text-blue-600 font-normal" title="Stick to verifiable facts - avoid opinions or adjectives">💡 Stick to facts</span>
                    </label>
                    <textarea
                      id="occurrence"
                      value={formData.occurrence || ''}
                      onChange={(e) => setFormData({ ...formData, occurrence: e.target.value })}
                      placeholder="Provide detailed factual description of the incident... (who, what, where, when)"
                      rows={4}
                      className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none bg-gray-50"
                    />
                    <p className="text-xs text-gray-500 mt-1">Describe what happened in detail - stick to verifiable facts only</p>
                  </div>
                )}
              </div>
            </div>
            </section>

            {/* Right Column - Location & Actions, Additional Options */}
            <section className="lg:col-span-4 space-y-4 h-full">
              {/* Location & Actions Card */}
              <div className="bg-white rounded-lg shadow-sm border p-4" role="region" aria-labelledby="location-actions-title">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-teal-100 flex items-center justify-center">
                    <svg className="w-4 h-4 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <h3 id="location-actions-title" className="text-sm font-semibold text-gray-900">Location & Actions</h3>
                </div>
              <div className="space-y-4">
                <div>
                    <label htmlFor="w3w" className="block text-sm font-medium text-gray-700 mb-1">
                      What3Words Location
                      <span className="ml-1 text-gray-400" title="Three-word address for precise location">ⓘ</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="text-gray-400">{'///'}</span>
                      </div>
                  <input
                        id="w3w"
                    type="text"
                        value={w3wInput}
                        onChange={(e) => handleW3WChange(e.target.value)}
                        placeholder="word.word.word"
                        className="w-full rounded-lg border border-gray-200 pl-8 pr-9 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                      {isValidatingWhat3Words && (
                        <span className="absolute inset-y-0 right-2 flex items-center">
                          <svg
                            className="h-4 w-4 animate-spin text-blue-500"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            aria-hidden
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            />
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                            />
                          </svg>
                        </span>
                      )}
                    </div>
                    <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 space-y-1" aria-live="polite">
                      {what3WordsError && (
                        <p className="font-semibold text-red-600 dark:text-red-400">{what3WordsError}</p>
                      )}
                      {w3wCoordinates && !what3WordsError && !isValidatingWhat3Words && (
                        <p className="text-gray-600 dark:text-gray-300">
                          Coordinates: <span className="font-semibold">{w3wCoordinates.lat.toFixed(5)}</span>,{' '}
                          <span className="font-semibold">{w3wCoordinates.lng.toFixed(5)}</span>
                        </p>
                      )}
                      {!what3WordsError && !w3wCoordinates && !isValidatingWhat3Words && (
                        <p>Enter a valid what3words address</p>
                      )}
                    </div>
                </div>
                {/* Legacy Actions Taken Field - Only show when structured template is disabled */}
                {!formData.use_structured_template && (
                <div>
                    <div className="flex items-center justify-between mb-2">
                      <label htmlFor="action-taken" className="block text-sm font-medium text-gray-700">Actions Taken</label>
                      <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, action_taken: (prev.action_taken ? prev.action_taken + ' ' : '') + 'Other:' }))}
                          className="px-2 py-1 text-xs rounded border border-gray-200 hover:bg-gray-50 focus:ring-1 focus:ring-blue-500 transition-colors"
                    >
                      Other
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          let rewrite = null as null | { occurrence: string; actionTaken: string };
                          if (isBrowserLLMAvailable()) {
                            try {
                              rewrite = await rewriteIncidentFieldsWithBrowserLLM(formData.occurrence || '', formData.action_taken || '');
                            } catch {}
                          }
                          if (!rewrite) {
                            const input = `${formData.occurrence || ''}\nActions: ${formData.action_taken || ''}`;
                            const resp = await fetch('/api/enhanced-incident-parsing', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ input, incidentTypes }) });
                            if (resp.ok) {
                              const data = await resp.json();
                              rewrite = { occurrence: data.description || formData.occurrence || '', actionTaken: data.actionTaken || formData.action_taken || '' };
                            }
                          }
                          if (rewrite) {
                            setFormData(prev => ({
                              ...prev,
                              occurrence: cleanSentence(rewrite!.occurrence, prev.occurrence),
                              action_taken: cleanSentence(rewrite!.actionTaken, prev.action_taken)
                            }));
                          }
                        } catch (e) {
                          console.log('Rewrite failed', e);
                        }
                      }}
                          className="px-2 py-1 text-xs rounded border border-gray-200 hover:bg-gray-50 focus:ring-1 focus:ring-blue-500 transition-colors"
                    >
                      Rewrite with AI
                    </button>
                      </div>
                  </div>
                  <div className="relative">
                    <textarea
                        id="action-taken"
                      value={formData.action_taken || ''}
                      onChange={(e) => setFormData({ ...formData, action_taken: e.target.value })}
                      onFocus={() => updateFocus('action-taken')}
                      onBlur={() => updateTyping('action-taken', false)}
                      onKeyDown={() => updateTyping('action-taken', true)}
                      placeholder="Describe actions taken in response to the incident..."
                      rows={3}
                        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none bg-gray-50"
                    />
                    <TypingIndicator users={presenceUsers} fieldName="action-taken" position="bottom" />
                  </div>
                </div>
                )}
              </div>
            </div>

              {/* Additional Options Card */}
              <div className="bg-white rounded-lg shadow-sm border p-4" role="region" aria-labelledby="additional-options-title">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
                    <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </div>
                  <h3 id="additional-options-title" className="text-sm font-semibold text-gray-900">Additional Options</h3>
                </div>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="closed"
                    checked={formData.is_closed || false}
                    onChange={(e) => setFormData({ ...formData, is_closed: e.target.checked })}
                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 focus:ring-2"
                  />
                    <label htmlFor="closed" className="text-sm font-medium text-gray-700">
                    Mark as Closed
                  </label>
                </div>
                <div>
                    <label htmlFor="photo-upload" className="block text-sm font-medium text-gray-700 mb-2">Attach Photo (optional, max 5MB)</label>
                    <input
                      id="photo-upload"
                      type="file"
                      accept="image/jpeg,image/png,image/jpg,image/heic"
                      onChange={handlePhotoChange}
                      className="hidden"
                    />
                    <label htmlFor="photo-upload" className="border-2 border-dashed border-gray-200 rounded-lg p-4 text-center hover:border-gray-300 transition-colors cursor-pointer block">
                      <div className="text-gray-500">
                        {photoPreviewUrl ? (
                          <div className="space-y-2">
                            <Image
                              src={photoPreviewUrl}
                              alt="Selected incident attachment preview"
                              width={64}
                              height={64}
                              className="mx-auto h-16 w-16 object-cover rounded"
                              unoptimized
                            />
                            <p className="text-sm">Photo selected</p>
                          </div>
                        ) : (
                          <>
                            <svg className="mx-auto h-8 w-8 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      <p className="text-sm">Click to upload or drag and drop</p>
                      <p className="text-xs mt-1">PNG, JPG, GIF up to 5MB</p>
                          </>
                        )}
                    </div>
                    </label>
                    {photoError && (
                      <p className="text-xs text-red-600 mt-1">{photoError}</p>
                    )}
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>

        {/* Sticky Footer - Mobile Optimized */}
        <footer className="sticky md:absolute bottom-0 left-0 right-0 border-t bg-white/95 dark:bg-[#23408e]/95 backdrop-blur px-3 sm:px-6 py-3 sm:py-4" style={{
          paddingBottom: 'max(env(safe-area-inset-bottom), 0.75rem)',
        }}>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="hidden sm:block text-xs text-gray-500 dark:text-gray-400">Auto-saved</div>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          <button
            onClick={onClose}
                className="touch-target w-full sm:w-auto px-4 py-3 sm:py-2 text-sm text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-[#2d437a] focus:ring-2 focus:ring-gray-500 rounded-lg transition-colors font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
                className="touch-target hidden sm:flex w-full sm:w-auto px-4 py-3 sm:py-2 text-sm border border-blue-600 dark:border-blue-500 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 focus:ring-2 focus:ring-blue-500 rounded-lg transition-colors font-medium"
              >
                Save as Draft
              </button>
              <button
                onClick={handleSubmit}
                className="touch-target w-full sm:w-auto px-6 py-3 sm:py-2 text-sm bg-red-600 text-white hover:bg-red-700 active:bg-red-800 focus:ring-2 focus:ring-red-500 rounded-lg transition-colors flex items-center justify-center gap-2 font-semibold shadow-lg"
              >
                <svg className="w-5 h-5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            Log Incident
          </button>
        </div>
          </div>
        </footer>
      </div>
      </div>
    </div>
  );
} 
