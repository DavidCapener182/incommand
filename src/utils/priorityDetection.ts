/**
 * Optimized Priority Detection
 * 
 * Improvements:
 * - Context-aware severity mapping
 * - Multiple signal integration
 * - Confidence scoring
 * - Keyword and phrase matching
 * - Dynamic priority calculation
 */

export type Priority = 'urgent' | 'high' | 'medium' | 'low'

export interface PriorityMatch {
  priority: Priority
  confidence: number
  signals: string[]
  reasoning: string
}

// Urgent priority indicators
const URGENT_SIGNALS = {
  keywords: [
    'urgent', 'critical', 'emergency', 'immediate', 'life threatening',
    'serious injury', 'unconscious', 'not breathing', 'cardiac', 'collapse',
    'bomb', 'terror', 'weapon', 'gun', 'knife', 'shooting', 'stabbing',
    'fire', 'flames', 'evacuation', 'evacuate', 'show stop'
  ],
  phrases: [
    'life threatening', 'critical condition', 'immediate response required',
    'emergency response', 'urgent assistance', 'code red', 'serious injury',
    'suspected weapon', 'armed person', 'fire outbreak', 'evacuation required'
  ],
  incidentTypes: [
    'Counter-Terror Alert', 'Fire', 'Emergency Show Stop', 'Evacuation',
    'Sexual Misconduct', 'Weapon Related'
  ],
  weight: 1.0
}

// High priority indicators
const HIGH_SIGNALS = {
  keywords: [
    'high priority', 'serious', 'major', 'significant', 'security',
    'medical', 'injury', 'injured', 'fight', 'hostile', 'aggressive',
    'breach', 'surge', 'crush', 'missing child', 'assault', 'attack'
  ],
  phrases: [
    'medical attention', 'security response', 'high priority', 'major incident',
    'crowd surge', 'hostile behavior', 'missing child', 'serious concern',
    'gate breach', 'significant damage'
  ],
  incidentTypes: [
    'Medical', 'Fight', 'Hostile Act', 'Fire Alarm', 'Suspected Fire',
    'Missing Child/Person', 'Entry Breach', 'Crowd Management'
  ],
  weight: 0.9
}

// Medium priority indicators
const MEDIUM_SIGNALS = {
  keywords: [
    'moderate', 'attention needed', 'issue', 'problem', 'concern',
    'assistance', 'support', 'help', 'drunk', 'intoxicated', 'theft',
    'complaint', 'welfare', 'suspicious'
  ],
  phrases: [
    'requires attention', 'assistance needed', 'welfare concern',
    'moderate priority', 'standard response', 'routine incident'
  ],
  incidentTypes: [
    'Ejection', 'Refusal', 'Theft', 'Suspicious Behaviour', 'Welfare',
    'Alcohol / Drug Related', 'Environmental', 'Tech Issue', 'Site Issue',
    'Staffing', 'Accessibility'
  ],
  weight: 0.7
}

// Low priority indicators  
const LOW_SIGNALS = {
  keywords: [
    'low priority', 'minor', 'routine', 'information', 'update',
    'lost property', 'found', 'timing', 'attendance', 'noise'
  ],
  phrases: [
    'low priority', 'routine update', 'information only', 'minor issue',
    'non-urgent', 'standard procedure'
  ],
  incidentTypes: [
    'Lost Property', 'Artist On Stage', 'Artist Off Stage', 'Event Timing',
    'Timings', 'Sit Rep', 'Attendance', 'Noise Complaint', 'Accreditation',
    'Animal Incident'
  ],
  weight: 0.5
}

/**
 * Calculate match score for priority signals
 */
function calculateSignalScore(
  text: string,
  signals: typeof URGENT_SIGNALS
): { score: number; matched: string[] } {
  const lowerText = text.toLowerCase()
  const matched: string[] = []
  let score = 0
  
  // Check phrases (higher weight)
  for (const phrase of signals.phrases) {
    if (lowerText.includes(phrase.toLowerCase())) {
      score += 0.3 * signals.weight
      matched.push(phrase)
    }
  }
  
  // Check keywords
  for (const keyword of signals.keywords) {
    if (lowerText.includes(keyword.toLowerCase())) {
      score += 0.15 * signals.weight
      matched.push(keyword)
    }
  }
  
  return { score, matched }
}

/**
 * Get priority from incident type
 */
function getPriorityFromIncidentType(incidentType: string): Priority | null {
  if (!incidentType) return null
  
  if (URGENT_SIGNALS.incidentTypes.includes(incidentType)) return 'urgent'
  if (HIGH_SIGNALS.incidentTypes.includes(incidentType)) return 'high'
  if (MEDIUM_SIGNALS.incidentTypes.includes(incidentType)) return 'medium'
  if (LOW_SIGNALS.incidentTypes.includes(incidentType)) return 'low'
  
  return null
}

/**
 * Detect numbers in text that might indicate quantity/severity
 */
function detectQuantitySignals(text: string): { multiplier: number; signals: string[] } {
  const lowerText = text.toLowerCase()
  const signals: string[] = []
  let multiplier = 1.0
  
  // Multiple people involved
  if (/(multiple|several|many)\s+(people|persons|individuals)/i.test(text)) {
    multiplier *= 1.2
    signals.push('multiple people involved')
  }
  
  // Large numbers
  const numberMatch = text.match(/(\d+)\s+(people|persons|injured|affected)/i)
  if (numberMatch) {
    const count = parseInt(numberMatch[1])
    if (count > 10) {
      multiplier *= 1.3
      signals.push(`${count} people affected`)
    } else if (count > 5) {
      multiplier *= 1.15
      signals.push(`${count} people involved`)
    }
  }
  
  // Escalation indicators
  if (/(escalating|worsening|deteriorating|spreading)/i.test(text)) {
    multiplier *= 1.25
    signals.push('escalating situation')
  }
  
  return { multiplier, signals }
}

/**
 * Detect temporal urgency signals
 */
function detectTemporalSignals(text: string): { boost: number; signals: string[] } {
  const lowerText = text.toLowerCase()
  const signals: string[] = []
  let boost = 0
  
  if (/(now|immediately|asap|right now|urgent response)/i.test(text)) {
    boost += 0.2
    signals.push('immediate action required')
  }
  
  if (/(ongoing|continuing|in progress|still happening)/i.test(text)) {
    boost += 0.1
    signals.push('ongoing situation')
  }
  
  return { boost, signals }
}

/**
 * Optimized priority detection with confidence scoring
 */
export function detectPriorityOptimized(
  text: string,
  incidentType?: string
): PriorityMatch {
  if (!text && !incidentType) {
    return {
      priority: 'medium',
      confidence: 0.3,
      signals: ['default priority (no context)'],
      reasoning: 'No text or incident type provided, defaulting to medium'
    }
  }
  
  const allSignals: string[] = []
  let reasoning: string[] = []
  
  // Score each priority level
  const urgentMatch = calculateSignalScore(text, URGENT_SIGNALS)
  const highMatch = calculateSignalScore(text, HIGH_SIGNALS)
  const mediumMatch = calculateSignalScore(text, MEDIUM_SIGNALS)
  const lowMatch = calculateSignalScore(text, LOW_SIGNALS)
  
  // Get quantity and temporal signals
  const { multiplier, signals: quantitySignals } = detectQuantitySignals(text)
  const { boost, signals: temporalSignals } = detectTemporalSignals(text)
  
  allSignals.push(...quantitySignals, ...temporalSignals)
  
  // Apply multipliers and boosts
  let urgentScore = urgentMatch.score * multiplier + boost
  let highScore = highMatch.score * multiplier + boost * 0.5
  let mediumScore = mediumMatch.score
  let lowScore = lowMatch.score
  
  // Factor in incident type priority
  const typePriority = getPriorityFromIncidentType(incidentType || '')
  if (typePriority) {
    reasoning.push(`incident type "${incidentType}" suggests ${typePriority} priority`)
    
    switch (typePriority) {
      case 'urgent':
        urgentScore += 0.4
        break
      case 'high':
        highScore += 0.3
        break
      case 'medium':
        mediumScore += 0.2
        break
      case 'low':
        lowScore += 0.2
        break
    }
  }
  
  // Determine final priority based on highest score
  const scores = {
    urgent: { priority: 'urgent' as Priority, score: urgentScore, matched: urgentMatch.matched },
    high: { priority: 'high' as Priority, score: highScore, matched: highMatch.matched },
    medium: { priority: 'medium' as Priority, score: mediumScore, matched: mediumMatch.matched },
    low: { priority: 'low' as Priority, score: lowScore, matched: lowMatch.matched }
  }
  
  // Sort by score
  const sorted = Object.values(scores).sort((a, b) => b.score - a.score)
  const winner = sorted[0]
  
  // Add matched signals
  allSignals.push(...winner.matched)
  
  // Calculate confidence
  let confidence = winner.score
  
  // Boost confidence if there's a clear winner
  if (winner.score > sorted[1].score * 1.5) {
    confidence = Math.min(confidence * 1.1, 1.0)
    reasoning.push('clear priority indicators')
  } else if (winner.score > sorted[1].score) {
    reasoning.push('moderate priority confidence')
  } else {
    reasoning.push('ambiguous signals, using best match')
    confidence *= 0.8
  }
  
  // Normalize confidence
  confidence = Math.max(0.3, Math.min(1.0, confidence))
  
  if (quantitySignals.length > 0) {
    reasoning.push(quantitySignals.join(', '))
  }
  
  if (temporalSignals.length > 0) {
    reasoning.push(temporalSignals.join(', '))
  }
  
  return {
    priority: winner.priority,
    confidence,
    signals: [...new Set(allSignals)], // Deduplicate
    reasoning: reasoning.join('; ')
  }
}

/**
 * Backward compatible function
 */
export function detectPriority(text: string, incidentType?: string): Priority {
  const result = detectPriorityOptimized(text, incidentType)
  return result.priority
}

/**
 * Get priority with confidence score
 */
export function detectPriorityWithConfidence(
  text: string,
  incidentType?: string
): { priority: Priority; confidence: number } {
  const result = detectPriorityOptimized(text, incidentType)
  return {
    priority: result.priority,
    confidence: result.confidence
  }
}

