/**
 * Enhanced Voice-to-Log AI Extraction
 * Processes natural speech input and extracts structured incident data
 */

import { generateText } from 'ai'
import { createOpenAI } from '@ai-sdk/openai'
import { createAnthropic } from '@ai-sdk/anthropic'
import { getIncidentTypesForEvent } from '@/config/incidentTypes'

const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY || ''
})

const anthropic = createAnthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || ''
})

export interface VoiceIncidentData {
  incidentType: string
  occurrence: string
  location: string
  callsignFrom: string
  callsignTo: string
  actionTaken: string
  priority: 'urgent' | 'high' | 'medium' | 'low'
  confidence: number
  extractedFields: {
    time?: string
    witnesses?: string[]
    injuries?: string
    suspects?: string
  }
}

const VOICE_EXTRACTION_SYSTEM = `You are an expert at extracting structured incident data from natural speech. 
You understand security and event management terminology. You ALWAYS return valid JSON.

Key rules:
1. Incident types must match the allowed list exactly
2. Descriptions should be clear, professional, and factual
3. Extract all callsigns mentioned (format: A1, R2, Security 1, etc.)
4. Locations should be specific and clean (remove filler words)
5. Priority based on severity: urgent (life-threatening), high (serious), medium (moderate), low (minor)
6. Confidence 0-1 based on clarity of speech
7. Action taken should be specific and actionable`

const buildVoiceExtractionPrompt = (transcript: string, incidentTypes: string[]): string => {
  return `Extract incident data from this voice transcript. Return strict JSON only.

Allowed incident types: ${incidentTypes.join(', ')}

Extract these fields:
{
  "incidentType": "exact match from allowed types",
  "occurrence": "professional description of what happened (1-2 sentences)",
  "location": "specific location name only",
  "callsignFrom": "reporting callsign (empty if not mentioned)",
  "callsignTo": "receiving callsign (empty if not mentioned, default to Control if unclear)",
  "actionTaken": "5 numbered specific actions based on incident type, plus 'Other:' line",
  "priority": "urgent|high|medium|low",
  "confidence": 0.0-1.0,
  "extractedFields": {
    "time": "if time of occurrence mentioned",
    "witnesses": ["witness names or descriptions"],
    "injuries": "injury details if mentioned",
    "suspects": "suspect descriptions if mentioned"
  }
}

Voice transcript: "${transcript}"

Examples:
Input: "This is Alpha 1 to Control, we have a medical emergency at the main stage, male collapsed, not breathing, CPR started"
Output: {
  "incidentType": "Medical",
  "occurrence": "Male patient collapsed and is not breathing. CPR has been initiated.",
  "location": "main stage",
  "callsignFrom": "Alpha 1",
  "callsignTo": "Control",
  "actionTaken": "1. Continue CPR and monitor patient condition. 2. Call emergency services immediately (999). 3. Prepare AED and emergency medical equipment. 4. Clear the area and maintain scene safety. 5. Document patient status and response times. Other:",
  "priority": "urgent",
  "confidence": 0.95,
  "extractedFields": {
    "injuries": "Not breathing, requires CPR"
  }
}

Input: "Romeo 2 reporting from north gate, we've got a fight between two males, broken up now, one guy has a cut on his head"
Output: {
  "incidentType": "Fight",
  "occurrence": "Physical altercation between two males. Incident has been de-escalated. One male sustained a head laceration.",
  "location": "north gate",
  "callsignFrom": "Romeo 2",
  "callsignTo": "Control",
  "actionTaken": "1. Separate and secure both individuals. 2. Provide first aid for head injury. 3. Obtain statements from both parties. 4. Identify any witnesses. 5. Consider ejection or police involvement. Other:",
  "priority": "high",
  "confidence": 0.9,
  "extractedFields": {
    "injuries": "One male with head laceration"
  }
}

Return ONLY the JSON, no other text.`
}

/**
 * Extract incident data from voice transcript using AI
 * @param transcript - The voice transcript text
 * @param eventType - Optional event type to filter available incident types
 * @param provider - AI provider to use ('openai' or 'anthropic')
 */
export async function extractIncidentFromVoice(
  transcript: string,
  eventType: string | null = null,
  provider: 'openai' | 'anthropic' = 'openai'
): Promise<VoiceIncidentData> {
  try {
    // Get incident types based on event type
    const incidentTypes = getIncidentTypesForEvent(eventType)
    
    const model = provider === 'openai' 
      ? openai('gpt-4o-mini')
      : anthropic('claude-3-5-sonnet-20241022')

    const { text } = await generateText({
      model,
      system: VOICE_EXTRACTION_SYSTEM,
      prompt: buildVoiceExtractionPrompt(transcript, incidentTypes),
      temperature: 0.3,
      maxOutputTokens: 1000
    })

    // Parse the JSON response
    const cleaned = text.trim().replace(/```json\n?/g, '').replace(/```\n?/g, '')
    const extracted = JSON.parse(cleaned) as VoiceIncidentData

    // Validate and set defaults
    return {
      incidentType: incidentTypes.includes(extracted.incidentType) 
        ? extracted.incidentType 
        : 'Other',
      occurrence: extracted.occurrence || transcript,
      location: extracted.location || '',
      callsignFrom: extracted.callsignFrom || '',
      callsignTo: extracted.callsignTo || 'Control',
      actionTaken: extracted.actionTaken || '1. Assess situation. 2. Take appropriate action. 3. Document details. 4. Report to supervisor. 5. Monitor for developments. Other:',
      priority: extracted.priority || 'medium',
      confidence: Math.max(0, Math.min(1, extracted.confidence || 0.5)),
      extractedFields: extracted.extractedFields || {}
    }
  } catch (error) {
    console.error('Voice extraction error:', error)
    
    // Fallback: return basic structure
    return {
      incidentType: 'Other',
      occurrence: transcript,
      location: '',
      callsignFrom: '',
      callsignTo: 'Control',
      actionTaken: '1. Assess situation. 2. Take appropriate action. 3. Document details. 4. Report to supervisor. 5. Monitor for developments. Other:',
      priority: 'medium',
      confidence: 0.3,
      extractedFields: {}
    }
  }
}

/**
 * Voice confirmation generation
 */
export async function generateVoiceConfirmation(data: VoiceIncidentData): Promise<string> {
  const priority = data.priority === 'urgent' ? 'URGENT priority' : `${data.priority} priority`
  const location = data.location ? ` at ${data.location}` : ''
  const callsign = data.callsignFrom ? ` reported by ${data.callsignFrom}` : ''
  
  return `Understood. Logging ${data.incidentType} incident${location}${callsign}. ${priority}. Confirm to submit.`
}

/**
 * Structured field detection for continuous dictation
 */
export interface FieldDetection {
  field: 'occurrence' | 'location' | 'actionTaken' | 'callsign' | 'complete'
  value: string
  confidence: number
}

export async function detectFieldFromSpeech(transcript: string): Promise<FieldDetection> {
  try {
    const { text } = await generateText({
      model: openai('gpt-4o-mini'),
      prompt: `Analyze this speech segment and determine which incident field it belongs to.

Transcript: "${transcript}"

Return JSON: {"field": "occurrence|location|actionTaken|callsign|complete", "value": "extracted value", "confidence": 0.0-1.0}

Rules:
- "occurrence" = description of what happened
- "location" = where it happened
- "actionTaken" = actions taken or needed
- "callsign" = radio callsigns (A1, R2, etc.)
- "complete" = speaker says "done", "finished", "submit", "that's all"

Return ONLY JSON.`,
      temperature: 0.2,
      maxOutputTokens: 200
    })

    const cleaned = text.trim().replace(/```json\n?/g, '').replace(/```\n?/g, '')
    return JSON.parse(cleaned) as FieldDetection
  } catch (error) {
    console.error('Field detection error:', error)
    return {
      field: 'occurrence',
      value: transcript,
      confidence: 0.3
    }
  }
}
