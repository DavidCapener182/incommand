/**
 * Optimized Incident Type Detection
 * 
 * Improvements:
 * - Multi-pattern matching with weights
 * - Confidence scoring
 * - Context-aware detection
 * - Phrase-based matching
 * - Priority-based ranking
 * - Better handling of ambiguous cases
 */

export interface IncidentTypeMatch {
  type: string
  confidence: number
  matchedKeywords: string[]
  priority?: string
}

// Enhanced incident type patterns with weights and priority
interface IncidentPattern {
  keywords: string[]
  phrases: string[] // Higher weight than keywords
  excludeKeywords?: string[] // Negative indicators
  priority?: 'urgent' | 'high' | 'medium' | 'low'
  weight: number // Base confidence weight
}

const INCIDENT_PATTERNS: Record<string, IncidentPattern> = {
  // Critical incidents (highest priority)
  'Counter-Terror Alert': {
    keywords: ['suspect', 'package', 'bomb', 'terror', 'explosive', 'device', 'threat'],
    phrases: ['suspect package', 'suspicious package', 'bomb threat', 'terror threat', 'unattended bag'],
    priority: 'urgent',
    weight: 1.0
  },
  
  'Fire': {
    keywords: ['fire', 'flames', 'burning', 'blaze'],
    phrases: ['fire outbreak', 'flames visible', 'building on fire'],
    excludeKeywords: ['suspected', 'alarm'],
    priority: 'urgent',
    weight: 1.0
  },
  
  'Suspected Fire': {
    keywords: ['suspected fire', 'smoke', 'burning smell', 'smoldering'],
    phrases: ['suspected fire', 'smell of smoke', 'burning smell'],
    priority: 'high',
    weight: 0.95
  },
  
  'Fire Alarm': {
    keywords: ['fire alarm', 'alarm activated', 'alarm sounding', 'fire bell'],
    phrases: ['fire alarm activated', 'alarm sounding', 'fire alarm triggered'],
    priority: 'high',
    weight: 0.9
  },
  
  'Evacuation': {
    keywords: ['evacuation', 'evacuate', 'clear area', 'assembly point'],
    phrases: ['emergency evacuation', 'evacuate area', 'evacuation procedure'],
    priority: 'urgent',
    weight: 1.0
  },
  
  'Emergency Show Stop': {
    keywords: ['show stop', 'stop performance', 'emergency stop'],
    phrases: ['stop the show', 'emergency show stop', 'halt performance'],
    priority: 'urgent',
    weight: 1.0
  },
  
  // High priority incidents
  'Sexual Misconduct': {
    keywords: ['sexual', 'harassment', 'inappropriate touching', 'rape', 'assault', 'grope', 'groping'],
    phrases: ['sexual assault', 'sexual harassment', 'inappropriate touching', 'sexual misconduct'],
    priority: 'urgent',
    weight: 1.0
  },
  
  'Weapon Related': {
    keywords: ['weapon', 'knife', 'gun', 'firearm', 'blade', 'armed'],
    phrases: ['person with weapon', 'armed individual', 'knife spotted', 'gun seen'],
    priority: 'urgent',
    weight: 1.0
  },
  
  'Hostile Act': {
    keywords: ['hostile', 'aggressive', 'attack', 'threat', 'violence'],
    phrases: ['hostile act', 'aggressive behavior', 'violent incident', 'threatening behavior'],
    priority: 'high',
    weight: 0.95
  },
  
  'Fight': {
    keywords: ['fight', 'altercation', 'brawl', 'fighting', 'physical confrontation'],
    phrases: ['physical fight', 'people fighting', 'violent altercation'],
    priority: 'high',
    weight: 0.9
  },
  
  'Missing Child/Person': {
    keywords: ['missing child', 'lost child', 'missing person', 'lost', 'missing'],
    phrases: ['missing child', 'lost child', 'child separated', 'missing person'],
    priority: 'high',
    weight: 0.95
  },
  
  'Entry Breach': {
    keywords: ['entry breach', 'gate breach', 'forced entry', 'unauthorized entry', 'jumped fence'],
    phrases: ['entry breach', 'gate breached', 'forced entry', 'jumped the fence'],
    priority: 'high',
    weight: 0.9
  },
  
  // Medical incidents
  'Medical': {
    keywords: ['medical', 'first aid', 'medic', 'injury', 'collapse', 'casualty', 'ambulance', 'injured', 'hurt'],
    phrases: ['medical emergency', 'first aid required', 'person injured', 'medical assistance', 'collapsed person'],
    priority: 'high',
    weight: 0.9
  },
  
  // Security incidents
  'Ejection': {
    keywords: ['ejection', 'removed from', 'escorted out', 'ejected', 'thrown out'],
    phrases: ['ejected from', 'removed from venue', 'escorted off site'],
    priority: 'medium',
    weight: 0.85
  },
  
  'Refusal': {
    keywords: ['refusal', 'refused entry', 'denied entry', 'turned away', 'refused service'],
    phrases: ['refused entry', 'denied access', 'entry refused'],
    priority: 'medium',
    weight: 0.85
  },
  
  'Theft': {
    keywords: ['theft', 'stolen', 'pickpocket', 'stealing', 'robbed'],
    phrases: ['item stolen', 'theft reported', 'pickpocket incident'],
    priority: 'medium',
    weight: 0.85
  },
  
  'Suspicious Behaviour': {
    keywords: ['suspicious', 'acting strangely', 'unusual behaviour', 'suspicious activity'],
    phrases: ['suspicious behavior', 'acting suspiciously', 'unusual activity'],
    priority: 'medium',
    weight: 0.8
  },
  
  // Crowd management
  'Crowd Management': {
    keywords: ['crowd', 'dense', 'surge', 'movement', 'queue', 'capacity', 'crowded'],
    phrases: ['crowd control', 'crowd surge', 'crowd density', 'queue management', 'crowd movement'],
    priority: 'high',
    weight: 0.85
  },
  
  // Welfare
  'Welfare': {
    keywords: ['welfare', 'wellbeing', 'support', 'assistance', 'distressed', 'upset'],
    phrases: ['welfare check', 'person distressed', 'welfare concern'],
    priority: 'medium',
    weight: 0.8
  },
  
  // Substance related
  'Alcohol / Drug Related': {
    keywords: ['alcohol', 'drunk', 'intoxicated', 'drugs', 'substance', 'overdose', 'inebriated'],
    phrases: ['intoxicated person', 'drug use', 'alcohol related', 'suspected overdose'],
    priority: 'medium',
    weight: 0.85
  },
  
  // Environmental
  'Environmental': {
    keywords: ['spill', 'weather', 'flood', 'ice', 'environmental', 'hazard', 'slip'],
    phrases: ['environmental hazard', 'weather incident', 'slippery surface'],
    priority: 'medium',
    weight: 0.75
  },
  
  // Technical/Site issues
  'Tech Issue': {
    keywords: ['tech issue', 'equipment failure', 'system down', 'power cut', 'technical problem'],
    phrases: ['technical issue', 'equipment failure', 'system failure', 'power outage'],
    priority: 'medium',
    weight: 0.75
  },
  
  'Site Issue': {
    keywords: ['site issue', 'damage', 'broken', 'hazard', 'maintenance'],
    phrases: ['site damage', 'infrastructure issue', 'maintenance required'],
    priority: 'medium',
    weight: 0.75
  },
  
  // Property
  'Lost Property': {
    keywords: ['lost property', 'missing', 'dropped', 'left behind', 'found item'],
    phrases: ['lost item', 'missing property', 'property found'],
    priority: 'low',
    weight: 0.7
  },
  
  // Artist/Performance
  'Artist Movement': {
    keywords: ['artist moving', 'escort artist', 'band move', 'artist escort', 'artist movement', 'artist arriving', 'artist leaving'],
    phrases: ['artist movement', 'escorting artist', 'band arriving', 'artist en route'],
    priority: 'medium',
    weight: 0.8
  },
  
  'Artist On Stage': {
    keywords: ['artist on stage', 'main act started', 'performance started', 'on stage', 'onstage', 'taking stage', 'stage now', 'performing', 'started performing', 'band on'],
    phrases: ['artist on stage', 'main act on', 'show started', 'taking the stage', 'now performing'],
    priority: 'low',
    weight: 0.85
  },
  
  'Artist Off Stage': {
    keywords: ['artist off stage', 'main act finished', 'performance ended', 'off stage', 'offstage', 'left stage', 'finished performing', 'band off', 'set finished'],
    phrases: ['artist off stage', 'show ended', 'performance finished', 'left the stage', 'finished set'],
    priority: 'low',
    weight: 0.85
  },
  
  // Operational
  'Event Timing': {
    keywords: ['timing', 'delayed', 'running late', 'schedule', 'postponed'],
    phrases: ['event delayed', 'running behind schedule', 'timing change'],
    priority: 'low',
    weight: 0.7
  },
  
  'Timings': {
    keywords: ['time', 'set time', 'stage time', 'schedule'],
    phrases: ['stage time', 'set times', 'schedule update'],
    priority: 'low',
    weight: 0.7
  },
  
  'Sit Rep': {
    keywords: ['sit rep', 'situation report', 'update', 'status update'],
    phrases: ['situation report', 'status update', 'operational update'],
    priority: 'low',
    weight: 0.75
  },
  
  'Attendance': {
    keywords: ['current attendance', 'current numbers', 'attendance count', 'head count'],
    phrases: ['attendance figure', 'current attendance', 'head count'],
    priority: 'low',
    weight: 0.8
  },
  
  'Noise Complaint': {
    keywords: ['noise', 'too loud', 'sound complaint', 'volume'],
    phrases: ['noise complaint', 'too loud', 'sound levels'],
    priority: 'low',
    weight: 0.75
  },
  
  'Accreditation': {
    keywords: ['accreditation', 'pass issue', 'credential problem', 'wristband'],
    phrases: ['accreditation issue', 'pass problem', 'credential issue'],
    priority: 'low',
    weight: 0.7
  },
  
  'Staffing': {
    keywords: ['staff', 'staff issue', 'staff shortage', 'understaffed'],
    phrases: ['staff shortage', 'staffing issue', 'staff problem'],
    priority: 'medium',
    weight: 0.75
  },
  
  'Accessibility': {
    keywords: ['accessibility', 'disabled access', 'wheelchair', 'accessibility issue'],
    phrases: ['accessibility concern', 'disabled access', 'wheelchair access'],
    priority: 'medium',
    weight: 0.8
  },
  
  'Animal Incident': {
    keywords: ['animal', 'dog', 'wildlife', 'pet'],
    phrases: ['animal incident', 'dog on site', 'wildlife spotted'],
    priority: 'low',
    weight: 0.7
  },
  
  // Football-specific incidents
  'Pitch Invasion': {
    keywords: ['pitch invasion', 'pitch invaded', 'on the pitch', 'entered pitch', 'pitch encroachment'],
    phrases: ['pitch invasion', 'invaded the pitch', 'entered the field', 'on the field'],
    priority: 'urgent',
    weight: 0.95
  },
  
  'Fan Disorder': {
    keywords: ['fan disorder', 'disorder', 'disturbance', 'unrest', 'trouble'],
    phrases: ['fan disorder', 'crowd disorder', 'supporters disorder', 'disorder in stand'],
    priority: 'high',
    weight: 0.9
  },
  
  'Pyrotechnic Incident': {
    keywords: ['pyrotechnic', 'flare', 'smoke bomb', 'firework', 'smoke device'],
    phrases: ['pyrotechnic device', 'flare activated', 'smoke bomb', 'firework set off'],
    priority: 'high',
    weight: 0.9
  },
  
  'Crowd Surge': {
    keywords: ['crowd surge', 'surge', 'crush', 'pressure', 'crowd movement'],
    phrases: ['crowd surge', 'crowd crush', 'surge forward', 'pressure building'],
    priority: 'urgent',
    weight: 0.95
  },
  
  'Stand Conflict': {
    keywords: ['stand conflict', 'stand trouble', 'stand disturbance', 'conflict in stand'],
    phrases: ['stand conflict', 'conflict in stand', 'trouble in stand', 'stand disturbance'],
    priority: 'high',
    weight: 0.85
  },
  
  'Supporter Ejection': {
    keywords: ['supporter ejection', 'fan ejected', 'supporter removed', 'fan thrown out'],
    phrases: ['supporter ejection', 'fan ejected', 'supporter removed from stadium'],
    priority: 'medium',
    weight: 0.85
  },
  
  'Steward Deployment': {
    keywords: ['steward deployment', 'deploy stewards', 'stewards needed', 'steward request'],
    phrases: ['steward deployment', 'deploy stewards', 'stewards to', 'steward assistance'],
    priority: 'medium',
    weight: 0.75
  },
  
  'Segregation Breach': {
    keywords: ['segregation breach', 'segregation broken', 'mixed fans', 'segregation issue'],
    phrases: ['segregation breach', 'breach of segregation', 'fans mixing', 'segregation broken'],
    priority: 'high',
    weight: 0.9
  },
  
  'Disorder at Entry/Exit': {
    keywords: ['entry disorder', 'exit disorder', 'gate disorder', 'turnstile trouble'],
    phrases: ['disorder at entry', 'disorder at exit', 'gate disorder', 'turnstile disorder'],
    priority: 'high',
    weight: 0.85
  },
  
  'Offensive Chanting': {
    keywords: ['offensive chanting', 'inappropriate chant', 'discriminatory chant', 'offensive song'],
    phrases: ['offensive chanting', 'inappropriate chanting', 'discriminatory chanting'],
    priority: 'medium',
    weight: 0.8
  },
  
  'Throwing Objects': {
    keywords: ['throwing objects', 'objects thrown', 'missiles', 'throwing items'],
    phrases: ['throwing objects', 'objects thrown', 'missiles thrown', 'throwing items'],
    priority: 'high',
    weight: 0.85
  },
  
  'Use of Flares / Smoke Devices': {
    keywords: ['flare', 'smoke device', 'smoke bomb', 'pyrotechnic'],
    phrases: ['flare activated', 'smoke device', 'smoke bomb set off', 'use of flares'],
    priority: 'high',
    weight: 0.9
  },
  
  'Pitch Encroachment': {
    keywords: ['pitch encroachment', 'encroached pitch', 'on pitch', 'field encroachment'],
    phrases: ['pitch encroachment', 'encroached the pitch', 'on the pitch', 'field encroachment'],
    priority: 'urgent',
    weight: 0.95
  },
  
  'Post-Match Incident': {
    keywords: ['post-match', 'after match', 'after game', 'post game'],
    phrases: ['post-match incident', 'after match incident', 'post game incident'],
    priority: 'medium',
    weight: 0.8
  },
  
  'Half-Time Incident': {
    keywords: ['half-time', 'half time', 'interval', 'break'],
    phrases: ['half-time incident', 'half time incident', 'interval incident'],
    priority: 'medium',
    weight: 0.8
  },
  
  'Match Abandonment': {
    keywords: ['match abandoned', 'game abandoned', 'abandoned', 'match stopped'],
    phrases: ['match abandoned', 'game abandoned', 'match called off', 'abandoned match'],
    priority: 'urgent',
    weight: 1.0
  },
  
  'On-Field Medical Emergency': {
    keywords: ['on-field medical', 'field medical', 'pitch medical', 'player medical'],
    phrases: ['on-field medical emergency', 'medical emergency on pitch', 'player medical emergency'],
    priority: 'urgent',
    weight: 1.0
  },
  
  'Player Safety Concern': {
    keywords: ['player safety', 'player concern', 'safety concern', 'player welfare'],
    phrases: ['player safety concern', 'concern for player', 'player safety issue'],
    priority: 'high',
    weight: 0.9
  },
  
  'Referee / Official Abuse': {
    keywords: ['referee abuse', 'official abuse', 'abuse referee', 'abuse official'],
    phrases: ['referee abuse', 'official abuse', 'abuse of referee', 'abuse of official'],
    priority: 'high',
    weight: 0.9
  },
  
  'Security Perimeter Breach': {
    keywords: ['perimeter breach', 'security breach', 'perimeter broken', 'security perimeter'],
    phrases: ['security perimeter breach', 'perimeter breach', 'breach of perimeter'],
    priority: 'urgent',
    weight: 0.95
  }
}

/**
 * Calculate match score for a given pattern
 */
function calculateMatchScore(text: string, pattern: IncidentPattern): {
  score: number
  matchedKeywords: string[]
} {
  const lowerText = text.toLowerCase()
  const matchedKeywords: string[] = []
  let score = 0
  
  // Check for phrase matches (higher weight)
  for (const phrase of pattern.phrases || []) {
    if (lowerText.includes(phrase.toLowerCase())) {
      score += 0.4 * pattern.weight
      matchedKeywords.push(phrase)
    }
  }
  
  // Check for keyword matches
  for (const keyword of pattern.keywords) {
    if (lowerText.includes(keyword.toLowerCase())) {
      score += 0.2 * pattern.weight
      matchedKeywords.push(keyword)
    }
  }
  
  // Penalize if exclude keywords are present
  if (pattern.excludeKeywords) {
    for (const excludeKeyword of pattern.excludeKeywords) {
      if (lowerText.includes(excludeKeyword.toLowerCase())) {
        score *= 0.5 // Reduce score by half
      }
    }
  }
  
  return { score, matchedKeywords }
}

/**
 * Detect incident type with confidence score and alternatives
 */
export function detectIncidentTypeOptimized(text: string): IncidentTypeMatch[] {
  if (!text) return []
  
  const matches: IncidentTypeMatch[] = []
  
  for (const [type, pattern] of Object.entries(INCIDENT_PATTERNS)) {
    const { score, matchedKeywords } = calculateMatchScore(text, pattern)
    
    if (score > 0) {
      matches.push({
        type,
        confidence: Math.min(score, 1.0),
        matchedKeywords,
        priority: pattern.priority
      })
    }
  }
  
  // Sort by confidence (highest first)
  matches.sort((a, b) => b.confidence - a.confidence)
  
  return matches
}

/**
 * Get the best incident type match
 */
export function detectIncidentType(text: string): string {
  const matches = detectIncidentTypeOptimized(text)
  return matches[0]?.type || ''
}

/**
 * Get incident type with confidence
 */
export function detectIncidentTypeWithConfidence(text: string): { type: string; confidence: number } {
  const matches = detectIncidentTypeOptimized(text)
  
  if (matches.length === 0) {
    return { type: '', confidence: 0 }
  }
  
  return {
    type: matches[0].type,
    confidence: matches[0].confidence
  }
}

/**
 * Get alternative incident types (top 3)
 */
export function getAlternativeIncidentTypes(text: string): string[] {
  const matches = detectIncidentTypeOptimized(text)
  return matches.slice(1, 4).map(m => m.type)
}

/**
 * Get all possible incident types with confidence scores
 */
export function getAllIncidentTypeMatches(text: string): IncidentTypeMatch[] {
  return detectIncidentTypeOptimized(text)
}

