/**
 * Optimized utility functions for detecting callsigns from incident text
 * 
 * Improvements:
 * - More comprehensive pattern matching
 * - Better handling of edge cases
 * - Confidence scoring
 * - Context-aware detection
 * - Support for international formats
 */

export interface CallsignMatch {
  callsign: string
  confidence: number
  context: string
}

// NATO phonetic alphabet mapping
const NATO_PHONETIC: Record<string, string> = {
  'ALPHA': 'A', 'BRAVO': 'B', 'CHARLIE': 'C', 'DELTA': 'D', 'ECHO': 'E',
  'FOXTROT': 'F', 'GOLF': 'G', 'HOTEL': 'H', 'INDIA': 'I', 'JULIET': 'J',
  'KILO': 'K', 'LIMA': 'L', 'MIKE': 'M', 'NOVEMBER': 'N', 'OSCAR': 'O',
  'PAPA': 'P', 'QUEBEC': 'Q', 'ROMEO': 'R', 'SIERRA': 'S', 'TANGO': 'T',
  'UNIFORM': 'U', 'VICTOR': 'V', 'WHISKEY': 'W', 'XRAY': 'X', 'YANKEE': 'Y', 'ZULU': 'Z'
}

// Common callsign prefixes and their meanings
const CALLSIGN_PREFIXES: Record<string, { letter: string; priority: number }> = {
  'Security': { letter: 'S', priority: 10 },
  'Sec': { letter: 'S', priority: 10 },
  'Medical': { letter: 'M', priority: 10 },
  'Med': { letter: 'M', priority: 10 },
  'Medic': { letter: 'M', priority: 10 },
  'Staff': { letter: 'S', priority: 5 },
  'Manager': { letter: 'M', priority: 5 },
  'Supervisor': { letter: 'S', priority: 5 },
  'Steward': { letter: 'S', priority: 8 },
  'Response': { letter: 'R', priority: 8 },
  'Team': { letter: 'T', priority: 5 },
  'Unit': { letter: 'U', priority: 5 },
  'Officer': { letter: 'O', priority: 7 }
}

/**
 * Detect callsign with improved pattern matching
 */
export function detectCallsign(text: string): string {
  if (!text) return ''
  
  const match = detectCallsignWithConfidence(text)
  return match?.callsign || ''
}

/**
 * Detect callsign with confidence score
 */
export function detectCallsignWithConfidence(text: string): CallsignMatch | null {
  if (!text) return null
  
  const matches: CallsignMatch[] = []
  
  // Pattern 1: Standard format (A1, R2, S1, etc.) with word boundaries
  const standardPattern = /\b([A-Z])(\d{1,3})\b/g
  let match
  while ((match = standardPattern.exec(text)) !== null) {
    const callsign = `${match[1]}${match[2]}`
    const contextStart = Math.max(0, match.index - 20)
    const contextEnd = Math.min(text.length, match.index + match[0].length + 20)
    const context = text.substring(contextStart, contextEnd)
    
    // Higher confidence if preceded by "reported by", "from", "callsign", etc.
    const beforeText = text.substring(Math.max(0, match.index - 30), match.index).toLowerCase()
    let confidence = 0.7
    
    if (/(reported by|from|callsign|radio|comms|by)\s*$/i.test(beforeText)) {
      confidence = 0.95
    } else if (/(officer|security|staff|team)\s*$/i.test(beforeText)) {
      confidence = 0.85
    }
    
    matches.push({ callsign, confidence, context })
  }
  
  // Pattern 2: NATO phonetic alphabet (Alpha 1, Romeo 2, etc.)
  const natoPattern = new RegExp(
    `\\b(${Object.keys(NATO_PHONETIC).join('|')})\\s+(\\d{1,3})\\b`,
    'gi'
  )
  while ((match = natoPattern.exec(text)) !== null) {
    const letter = NATO_PHONETIC[match[1].toUpperCase()]
    const number = match[2]
    const callsign = `${letter}${number}`
    const contextStart = Math.max(0, match.index - 20)
    const contextEnd = Math.min(text.length, match.index + match[0].length + 20)
    const context = text.substring(contextStart, contextEnd)
    
    matches.push({ callsign, confidence: 0.9, context })
  }
  
  // Pattern 3: Prefix-based (Security 1, Medical 2, etc.)
  for (const [prefix, config] of Object.entries(CALLSIGN_PREFIXES)) {
    const prefixPattern = new RegExp(`\\b${prefix}\\s+(\\d{1,3})\\b`, 'gi')
    while ((match = prefixPattern.exec(text)) !== null) {
      const callsign = `${config.letter}${match[1]}`
      const contextStart = Math.max(0, match.index - 20)
      const contextEnd = Math.min(text.length, match.index + match[0].length + 20)
      const context = text.substring(contextStart, contextEnd)
      
      const confidence = 0.85 + (config.priority / 100)
      matches.push({ callsign, confidence, context })
    }
  }
  
  // Pattern 4: Control/Event Control (special case)
  const controlPattern = /\b(Event\s+)?Control\b/gi
  if (controlPattern.test(text)) {
    const controlMatch = controlPattern.exec(text)
    if (controlMatch) {
      const contextStart = Math.max(0, controlMatch.index - 20)
      const contextEnd = Math.min(text.length, controlMatch.index + controlMatch[0].length + 20)
      const context = text.substring(contextStart, contextEnd)
      
      matches.push({ callsign: 'Control', confidence: 0.95, context })
    }
  }
  
  // Pattern 5: Two-letter callsigns (AB1, XY2, etc.)
  const twoLetterPattern = /\b([A-Z]{2})(\d{1,3})\b/g
  while ((match = twoLetterPattern.exec(text)) !== null) {
    const callsign = `${match[1]}${match[2]}`
    const contextStart = Math.max(0, match.index - 20)
    const contextEnd = Math.min(text.length, match.index + match[0].length + 20)
    const context = text.substring(contextStart, contextEnd)
    
    // Lower confidence for two-letter callsigns as they might be false positives
    matches.push({ callsign, confidence: 0.6, context })
  }
  
  // Pattern 6: Callsign with dash or slash (A-1, S/1, etc.)
  const dashPattern = /\b([A-Z])[\/\-](\d{1,3})\b/g
  while ((match = dashPattern.exec(text)) !== null) {
    const callsign = `${match[1]}${match[2]}`
    const contextStart = Math.max(0, match.index - 20)
    const contextEnd = Math.min(text.length, match.index + match[0].length + 20)
    const context = text.substring(contextStart, contextEnd)
    
    matches.push({ callsign, confidence: 0.75, context })
  }
  
  if (matches.length === 0) return null
  
  // Sort by confidence and return the best match
  matches.sort((a, b) => b.confidence - a.confidence)
  
  // If we have multiple matches with similar confidence, prefer the first one in the text
  const topConfidence = matches[0].confidence
  const topMatches = matches.filter(m => m.confidence >= topConfidence - 0.1)
  
  return topMatches[0]
}

/**
 * Extract all callsigns from text
 */
export function extractAllCallsigns(text: string): string[] {
  if (!text) return [];
  
  const callsigns = new Set<string>();
  
  // Standard format: A1, R2, S1, etc.
  const standardPattern = /\b([A-Z]\d+)\b/g;
  let match;
  while ((match = standardPattern.exec(text)) !== null) {
    callsigns.add(match[1]);
  }
  
  // NATO phonetic alphabet
  const natoPattern = /\b(Alpha|Bravo|Charlie|Delta|Echo|Foxtrot|Golf|Hotel|India|Juliet|Kilo|Lima|Mike|November|Oscar|Papa|Quebec|Romeo|Sierra|Tango|Uniform|Victor|Whiskey|Xray|Yankee|Zulu)\s+(\d+)\b/gi;
  while ((match = natoPattern.exec(text)) !== null) {
    const letter = match[1].charAt(0).toUpperCase();
    const number = match[2];
    callsigns.add(`${letter}${number}`);
  }
  
  // Security formats
  const securityPattern = /\b(Security|Sec)\s+(\d+)\b/gi;
  while ((match = securityPattern.exec(text)) !== null) {
    callsigns.add(`S${match[2]}`);
  }
  
  // Control formats
  const controlPattern = /\b(Event\s+Control|Control)\b/gi;
  while ((match = controlPattern.exec(text)) !== null) {
    callsigns.add('Control');
  }
  
  return Array.from(callsigns);
}

/**
 * Normalize callsign format (convert to standard format)
 */
export function normalizeCallsign(callsign: string): string {
  if (!callsign) return '';
  
  const upper = callsign.toUpperCase();
  
  // Already in standard format
  if (/^[A-Z]\d+$/.test(upper)) {
    return upper;
  }
  
  // Convert NATO phonetic to standard
  const natoMap: Record<string, string> = {
    'ALPHA': 'A', 'BRAVO': 'B', 'CHARLIE': 'C', 'DELTA': 'D', 'ECHO': 'E',
    'FOXTROT': 'F', 'GOLF': 'G', 'HOTEL': 'H', 'INDIA': 'I', 'JULIET': 'J',
    'KILO': 'K', 'LIMA': 'L', 'MIKE': 'M', 'NOVEMBER': 'N', 'OSCAR': 'O',
    'PAPA': 'P', 'QUEBEC': 'Q', 'ROMEO': 'R', 'SIERRA': 'S', 'TANGO': 'T',
    'UNIFORM': 'U', 'VICTOR': 'V', 'WHISKEY': 'W', 'XRAY': 'X', 'YANKEE': 'Y', 'ZULU': 'Z'
  };
  
  for (const [phonetic, letter] of Object.entries(natoMap)) {
    if (upper.startsWith(phonetic)) {
      const number = upper.replace(phonetic, '').trim();
      if (number) {
        return `${letter}${number}`;
      }
    }
  }
  
  return upper;
}
