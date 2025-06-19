'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '../lib/supabase'
import debounce from 'lodash/debounce'
import imageCompression from 'browser-image-compression'
import { useAuth } from '../contexts/AuthContext'

interface Props {
  isOpen: boolean
  onClose: () => void
  onIncidentCreated: (incident?: any) => Promise<void>
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
  'Drug Related': 'Drug Related Incident',
  'Weapon Related': 'Weapon Related Incident',
  'Artist Movement': 'Artist Movement',
  'Sexual Misconduct': 'Sexual Misconduct',
  'Site Issue': 'Site Maintenance Issue',
  'Attendance': 'Attendance Update',
  'Timings': 'Timing Update',
  'Event Timing': 'Event Timing',
  'Lost Property': 'Lost Property',
  'Suspicious Behaviour': 'Suspicious Behaviour',
  'Aggressive Behaviour': 'Aggressive Behaviour',
  'Queue Build-Up': 'Queue Build-Up',
  'Technical Issue': 'Technical Issue',
  'Weather Disruption': 'Weather Disruption',
  'Other': 'Other',
  'Sit Rep': 'Situation Report'
} as const

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
  const text = input.toLowerCase();
  
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
      return 'Aggressive Behaviour';
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
  
  // Check for lost property keywords but exclude if contains refusal/ejection terms
  if (lostPropertyKeywords.some(keyword => text.includes(keyword))) {
    // Check for exclusion terms
    const exclusionTerms = ['refused', 'ejected', 'removed'];
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
    /\b([rsa][0-9]+)\b/i,  // R1, S1, A1, etc.
    /\b(response\s*[0-9]+)\b/i,  // Response 1, Response2
    /\b(security\s*[0-9]+)\b/i,  // Security 1, Security2
    /\b(admin\s*[0-9]+)\b/i,  // Admin 1, Admin2
    /\b([rsa][0-9]+)\b/i,  // r1, s1, a1, etc.
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

const parseAttendanceIncident = async (input: string): Promise<IncidentParserResult | null> => {
  // Extract number from input using various patterns
  const numbers = input.match(/\d+/);
  if (!numbers) return null;

  const count = numbers[0];
  const maxCapacity = 3500; // Assuming 3500 is max capacity
  const percentage = Math.round((parseInt(count) / maxCapacity) * 100);
  const remaining = maxCapacity - parseInt(count);

  return {
    occurrence: `Current Attendance: ${count}`,
    action_taken: `Current occupancy at ${count} people (${percentage}% of capacity). ${remaining} people remaining to reach capacity.`,
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
        incident_type: 'Aggressive Behaviour'
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
        incident_type: 'Aggressive Behaviour'
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

export default function IncidentCreationModal({ isOpen, onClose, onIncidentCreated }: Props) {
  const [formData, setFormData] = useState<IncidentFormData>({
    callsign_from: '',
    callsign_to: 'Event Control',
    occurrence: '',
    incident_type: '',
    action_taken: '',
    is_closed: false,
    status: 'open',
    log_number: ''
  });
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

  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState<string | null>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);

  const { user } = useAuth();
  const [events, setEvents] = useState<any[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    const fetchEvents = async () => {
      // Get company_id from profile
      const { data: profile } = await supabase.from('profiles').select('company_id').eq('id', user.id).single();
      if (!profile?.company_id) return;
      // Fetch all events for this company
      const { data: allEvents } = await supabase.from('events').select('id, event_name, artist_name, is_current').eq('company_id', profile.company_id).order('start_datetime', { ascending: false });
      setEvents(allEvents || []);
      // Default to current event
      const current = allEvents?.find((e: any) => e.is_current);
      setSelectedEventId(current?.id || (allEvents?.[0]?.id ?? null));
    };
    fetchEvents();
  }, [user]);

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
        let processedData;

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
            processedData = await parseAttendanceIncident(input);
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
                action_taken: data.action_taken || 'Incident logged and being monitored.',
                callsign_from: callsign,
                incident_type: incidentType
              };
            } catch (error) {
              console.error('Error generating incident details:', error);
              processedData = {
                occurrence: input,
                action_taken: 'Incident logged and being monitored.',
                callsign_from: callsign,
                incident_type: incidentType
              };
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
            log_number: safeLogNumber
          }));
        } else {
          setFormData(prev => ({ 
            ...prev,
            incident_type: incidentType,
            log_number: safeLogNumber
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
    setFormData(prev => ({ ...prev, ai_input: input }));

    // Just set the occurrence to the raw input immediately
    setFormData(prev => ({ 
      ...prev, 
      occurrence: input
    }));

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

      // Detect incident type
      const detectedType = detectIncidentType(input);
      setFormData(prev => ({ ...prev, incident_type: detectedType }));

      // Extract callsign
      const callsign = detectCallsign(input) || '';
      setFormData(prev => ({ ...prev, callsign_from: callsign }));

      try {
        let result: IncidentParserResult | null = null;

        // Custom handler for showdown
        if (detectedType === 'Event Timing' && input.toLowerCase().includes('showdown')) {
          result = {
            occurrence: 'Showdown',
            action_taken: 'The show has ended',
            callsign_from: 'PM',
            incident_type: 'Event Timing'
          };
        } else if (
          detectedType === 'Event Timing' &&
          (input.toLowerCase().includes('doors open') || input.toLowerCase().includes('doors green') || input.toLowerCase().includes('venue open'))
        ) {
          result = {
            occurrence: 'Doors Open',
            action_taken: 'The venue is now open and customers are entering',
            callsign_from: 'A1',
            incident_type: 'Event Timing'
          };
        } else if (
          detectedType === 'Event Timing' && input.toLowerCase().includes('venue clear')
        ) {
          result = {
            occurrence: 'Venue is clear of public',
            action_taken: 'Venue Clear',
            callsign_from: 'A1',
            incident_type: 'Event Timing'
          };
        } else if (
          (input.toLowerCase().includes('staff briefed') || input.toLowerCase().includes('staff briefed and in position'))
        ) {
          result = {
            occurrence: 'Staff fully briefed and in position ready for doors.',
            action_taken: 'Logged',
            callsign_from: 'A1',
            incident_type: 'Timings'
          };
        } else {
        // Handle different incident types
        switch (detectedType) {
          case 'Medical':
            result = await parseMedicalIncident(input);
            break;
          case 'Refusal':
            result = await parseRefusalIncident(input);
            break;
          case 'Ejection':
            result = await parseEjectionIncident(input);
            break;
          case 'Attendance':
            result = await parseAttendanceIncident(input);
            break;
          case 'Welfare':
            result = await parseWelfareIncident(input);
            break;
          case 'Lost Property':
            result = await parseLostPropertyIncident(input);
            break;
          case 'Suspicious Behaviour':
            result = await parseSuspiciousBehaviourIncident(input);
            break;
          case 'Aggressive Behaviour':
            result = await parseAggressiveBehaviourIncident(input);
            break;
          case 'Queue Build-Up':
            result = await parseQueueBuildUpIncident(input);
            break;
          case 'Technical Issue':
            result = await parseTechnicalIncident(input);
            break;
          case 'Weather Disruption':
            result = await parseWeatherDisruptionIncident(input);
            break;
          default:
            // Use the general incident endpoint for all other types
            try {
              const response = await fetch('/api/generate-incident-details', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                  input,
                  incident_type: detectedType,
                  location,
                  description: input,
                  callsign
                })
              });

              if (!response.ok) {
                throw new Error('Failed to generate incident details');
              }

              const data = await response.json();
              result = {
                occurrence: data.occurrence || input,
                action_taken: data.action_taken || 'Incident logged and being monitored.',
                callsign_from: callsign,
                incident_type: detectedType
              };
            } catch (error) {
              console.error('Error generating incident details:', error);
              result = {
                occurrence: input,
                action_taken: 'Incident logged and being monitored.',
                callsign_from: callsign,
                incident_type: detectedType
              };
              }
            }
        }

        if (result) {
          setFormData(prev => ({
            ...prev,
            occurrence: result.occurrence,
            action_taken: result.action_taken,
            incident_type: result.incident_type,
            callsign_from: result.callsign_from
          }));

          // Update additional details based on incident type
          if (result.medicalDetails) {
            setMedicalDetails(result.medicalDetails);
          }
          if (result.refusalDetails) {
            setRefusalDetails(result.refusalDetails);
          }
          if (result.ejectionDetails) {
            setEjectionDetails(result.ejectionDetails);
          }
        }
      } catch (error) {
        console.error('Error processing quick input:', error);
        // Set basic details on error
        setFormData(prev => ({
          ...prev,
          occurrence: input,
          action_taken: getDefaultActionTaken(detectedType, input)
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
      if (!selectedEventId) {
        setError('Please select an event to log this incident.');
        setLoading(false);
        return;
      }
      // Get selected event (include artist_name)
      const selectedEvent = events.find(e => e.id === selectedEventId);
      if (!selectedEvent) throw new Error('Selected event not found');
      // Generate the next log number using the artist name
      const logNumber = await generateNextLogNumber(selectedEvent.artist_name, selectedEventId);
      if (!logNumber) {
        throw new Error('Failed to generate log number');
      }

      // Get current timestamp
      const now = new Date().toISOString();

      // Prepare the incident data
      const incidentData = {
        log_number: logNumber,
        callsign_from: formData.callsign_from.trim(),
        callsign_to: (formData.callsign_to || 'Event Control').trim(),
        occurrence: formData.occurrence.trim(),
        incident_type: formData.incident_type.trim(),
        action_taken: (formData.action_taken || '').trim(),
        is_closed: false,
        event_id: selectedEvent.id,
        status: formData.status || 'open',
        ai_input: formData.ai_input || null,
        created_at: now,
        updated_at: now,
        timestamp: now // Keep this for backward compatibility
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
      const { data: insertedIncident, error: insertError } = await supabase
        .from('incident_logs')
        .insert([incidentData])
        .select()
        .single();

      if (insertError) {
        console.error('Insert error:', insertError);
        throw insertError;
      }

      // If this is an attendance incident, also update the attendance_records table
      if (formData.incident_type === 'Attendance') {
        const count = parseInt(formData.occurrence.match(/\d+/)?.[0] || '0');
        if (count > 0) {
          const { error: attendanceError } = await supabase
            .from('attendance_records')
            .insert([{
              event_id: selectedEvent.id,
              count: count,
              timestamp: now
            }]);

          if (attendanceError) {
            console.error('Error updating attendance record:', attendanceError);
            // Don't throw here, as the incident was already created
          }
        }
      }

      console.log('Successfully created incident:', insertedIncident);

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
        log_number: ''
      });

      setRefusalDetails({
        policeRequired: false,
        description: '',
        location: '',
        reason: '',
        banned: false,
        aggressive: false
      });

      // Call onIncidentCreated callback with the created incident and close modal
      await onIncidentCreated(insertedIncident);
      onClose();

      let photoUrl = null;
      if (photoFile && insertedIncident) {
        // Upload to /[eventID]/[incidentID]/[filename]
        const ext = photoFile.name.split('.').pop();
        const path = `${selectedEvent.id}/${insertedIncident.id}/photo.${ext}`;
        const { error: uploadError } = await supabase.storage.from('incident-photos').upload(path, photoFile, { upsert: true, contentType: photoFile.type });
        if (!uploadError) {
          photoUrl = path;
          // Update incident log with photo_url
          await supabase.from('incident_logs').update({ photo_url: path }).eq('id', insertedIncident.id);
        }
      }
    } catch (error) {
      console.error('Error creating incident:', error);
      alert(error instanceof Error ? error.message : 'Failed to create incident. Please try again.');
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

        {events.length === 0 && (
          <div className="mb-4 text-red-600 font-semibold">No events found. Please create an event first.</div>
        )}
        {events.length > 1 && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">Event</label>
            <select
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              value={selectedEventId || ''}
              onChange={e => setSelectedEventId(e.target.value)}
            >
              <option value="" disabled>Select an event</option>
              {events.map(event => (
                <option key={event.id} value={event.id}>
                  {event.event_name} {event.is_current ? '(Current)' : ''}
                </option>
              ))}
            </select>
          </div>
        )}
        {!selectedEventId && events.length > 0 && (
          <div className="mb-4 text-red-600 font-semibold">Please select an event to log this incident.</div>
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
                onChange={handleQuickInputChange}
                placeholder="Enter incident details..."
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

          {formData.incident_type !== 'Attendance' && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700">Attach Photo (optional, max 5MB)</label>
              <input type="file" accept="image/jpeg,image/png,image/jpg,image/heic" onChange={handlePhotoChange} />
              {photoError && <div className="text-red-500 text-xs mt-1">{photoError}</div>}
              {photoPreviewUrl && (
                <div className="mt-2">
                  <img src={photoPreviewUrl} alt="Preview" className="h-24 rounded border" />
                </div>
              )}
            </div>
          )}

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
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              disabled={loading || !selectedEventId || events.length === 0}
            >
              {loading ? 'Creating...' : 'Create Incident'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
} 