// Radio Traffic Analysis Engine (Feature 10)

import { RadioMessage, RadioMessageCategory, RadioMessagePriority } from '@/types/radio'

// Emergency keywords that indicate high priority
const EMERGENCY_KEYWORDS = [
  'emergency', 'urgent', 'critical', 'immediate', 'asap', 'as soon as possible',
  'medical', 'ambulance', 'injury', 'accident', 'unconscious', 'bleeding',
  'fire', 'smoke', 'evacuate', 'evacuation',
  'fight', 'violence', 'assault', 'weapon', 'knife', 'gun',
  'bomb', 'threat', 'suspicious', 'package',
  'overdose', 'drug', 'alcohol',
]

// Incident keywords that suggest an incident should be created
const INCIDENT_KEYWORDS = [
  'incident', 'disturbance', 'disorder', 'breach', 'violation',
  'ejection', 'refusal', 'arrest', 'detained',
  'lost', 'found', 'missing', 'separated',
  'crowd', 'surge', 'stampede', 'crush',
  'barrier', 'fence', 'breach', 'broken',
]

// Routine keywords that indicate low priority
const ROUTINE_KEYWORDS = [
  'routine', 'normal', 'standard', 'regular',
  'update', 'status', 'check', 'confirm',
  'copy', 'received', 'understood', 'roger',
]

/**
 * Analyze a radio message and determine its category and priority
 */
export function analyzeRadioMessage(message: string): {
  category: RadioMessageCategory
  priority: RadioMessagePriority
  confidence: number
} {
  const lowerMessage = message.toLowerCase()
  
  // Check for emergency keywords
  const emergencyMatches = EMERGENCY_KEYWORDS.filter(keyword => 
    lowerMessage.includes(keyword)
  ).length
  
  // Check for incident keywords
  const incidentMatches = INCIDENT_KEYWORDS.filter(keyword => 
    lowerMessage.includes(keyword)
  ).length
  
  // Check for routine keywords
  const routineMatches = ROUTINE_KEYWORDS.filter(keyword => 
    lowerMessage.includes(keyword)
  ).length

  // Determine category
  let category: RadioMessageCategory = 'other'
  let priority: RadioMessagePriority = 'medium'
  let confidence = 0.5

  if (emergencyMatches > 0) {
    category = 'emergency'
    priority = emergencyMatches >= 2 ? 'critical' : 'high'
    confidence = Math.min(0.9, 0.5 + (emergencyMatches * 0.1))
  } else if (incidentMatches > 0) {
    category = 'incident'
    priority = incidentMatches >= 2 ? 'high' : 'medium'
    confidence = Math.min(0.85, 0.5 + (incidentMatches * 0.1))
  } else if (routineMatches > 0) {
    category = 'routine'
    priority = 'low'
    confidence = Math.min(0.8, 0.5 + (routineMatches * 0.1))
  } else {
    // Check message length and structure for coordination
    if (lowerMessage.includes('coordinate') || lowerMessage.includes('meet') || 
        lowerMessage.includes('location') || lowerMessage.includes('position')) {
      category = 'coordination'
      priority = 'medium'
      confidence = 0.6
    }
  }

  // Boost priority if message contains urgency indicators
  if (lowerMessage.includes('now') || lowerMessage.includes('immediately') || 
      lowerMessage.includes('urgent') || lowerMessage.includes('asap')) {
    if (priority === 'low') priority = 'medium'
    if (priority === 'medium') priority = 'high'
  }

  return { category, priority, confidence }
}

/**
 * Detect if a radio message should trigger incident creation
 */
export function shouldCreateIncident(message: RadioMessage): boolean {
  if (message.category === 'emergency' || message.category === 'incident') {
    return true
  }
  
  if (message.priority === 'critical' || message.priority === 'high') {
    return true
  }

  const lowerMessage = message.message.toLowerCase()
  return INCIDENT_KEYWORDS.some(keyword => lowerMessage.includes(keyword))
}

/**
 * Extract incident details from radio message
 */
export function extractIncidentDetails(message: RadioMessage): {
  type: string
  description: string
  priority: string
  location?: string
} {
  const analysis = analyzeRadioMessage(message.message)
  
  // Try to extract location from message
  const locationMatch = message.message.match(/(?:at|location|position|zone|stand|gate|area)\s+([A-Z0-9\s]+)/i)
  const location = locationMatch ? locationMatch[1].trim() : undefined

  // Determine incident type based on keywords
  let type = 'Other'
  const lowerMessage = message.message.toLowerCase()
  
  if (lowerMessage.includes('medical') || lowerMessage.includes('ambulance') || 
      lowerMessage.includes('injury') || lowerMessage.includes('unconscious')) {
    type = 'Medical'
  } else if (lowerMessage.includes('fight') || lowerMessage.includes('violence') || 
             lowerMessage.includes('assault')) {
    type = 'Disorder'
  } else if (lowerMessage.includes('fire') || lowerMessage.includes('smoke')) {
    type = 'Fire'
  } else if (lowerMessage.includes('lost') || lowerMessage.includes('missing') || 
             lowerMessage.includes('separated')) {
    type = 'Lost/Found'
  } else if (lowerMessage.includes('crowd') || lowerMessage.includes('surge') || 
             lowerMessage.includes('crush')) {
    type = 'Crowd Management'
  } else if (lowerMessage.includes('ejection') || lowerMessage.includes('refusal')) {
    type = 'Ejection/Refusal'
  }

  return {
    type,
    description: message.message,
    priority: analysis.priority,
    location,
  }
}

/**
 * Detect overload patterns in channel traffic
 */
export function detectOverloadPattern(messages: RadioMessage[], timeWindowMinutes: number = 5): {
  isOverloaded: boolean
  messageRate: number // messages per minute
  avgResponseTime: number | null
  overloadReason?: string
} {
  if (messages.length === 0) {
    return {
      isOverloaded: false,
      messageRate: 0,
      avgResponseTime: null,
    }
  }

  // Calculate message rate
  const timeWindow = timeWindowMinutes * 60 * 1000 // Convert to milliseconds
  const now = new Date().getTime()
  const recentMessages = messages.filter(msg => {
    const msgTime = new Date(msg.created_at).getTime()
    return (now - msgTime) <= timeWindow
  })

  const messageRate = recentMessages.length / timeWindowMinutes

  // Calculate average response time (if timestamps allow)
  let avgResponseTime: number | null = null
  if (recentMessages.length > 1) {
    const responseTimes: number[] = []
    for (let i = 1; i < recentMessages.length; i++) {
      const prevTime = new Date(recentMessages[i - 1].created_at).getTime()
      const currTime = new Date(recentMessages[i].created_at).getTime()
      responseTimes.push((currTime - prevTime) / 1000) // Convert to seconds
    }
    if (responseTimes.length > 0) {
      avgResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
    }
  }

  // Determine overload thresholds
  const highMessageRate = 10 // messages per minute
  const lowResponseTime = 5 // seconds average response time

  let isOverloaded = false
  let overloadReason: string | undefined

  if (messageRate > highMessageRate) {
    isOverloaded = true
    overloadReason = `High message rate: ${messageRate.toFixed(1)} messages/min`
  } else if (avgResponseTime !== null && avgResponseTime < lowResponseTime) {
    isOverloaded = true
    overloadReason = `Low response time: ${avgResponseTime.toFixed(1)}s average`
  }

  // Check for high priority message concentration
  const highPriorityCount = recentMessages.filter(
    msg => msg.priority === 'high' || msg.priority === 'critical'
  ).length
  const highPriorityRatio = highPriorityCount / recentMessages.length

  if (highPriorityRatio > 0.5 && recentMessages.length >= 5) {
    isOverloaded = true
    overloadReason = `High concentration of priority messages: ${(highPriorityRatio * 100).toFixed(0)}%`
  }

  return {
    isOverloaded,
    messageRate,
    avgResponseTime,
    overloadReason,
  }
}

/**
 * Calculate channel health score (0-100)
 */
export function calculateChannelHealthScore(
  messageRate: number,
  avgResponseTime: number | null,
  overloadIndicator: boolean,
  highPriorityRatio: number
): number {
  let score = 100

  // Penalize high message rate
  if (messageRate > 10) {
    score -= Math.min(30, (messageRate - 10) * 2)
  } else if (messageRate > 5) {
    score -= (messageRate - 5) * 2
  }

  // Penalize low response time (indicates overload)
  if (avgResponseTime !== null && avgResponseTime < 5) {
    score -= Math.min(20, (5 - avgResponseTime) * 4)
  }

  // Penalize overload indicator
  if (overloadIndicator) {
    score -= 25
  }

  // Penalize high priority message concentration
  if (highPriorityRatio > 0.5) {
    score -= Math.min(20, (highPriorityRatio - 0.5) * 40)
  }

  return Math.max(0, Math.min(100, Math.round(score)))
}

