/**
 * Utility functions for detecting callsigns from incident text
 */

export function detectCallsign(text: string): string {
  if (!text) return '';
  
  // Common callsign patterns
  const patterns = [
    // Standard format: A1, R2, S1, etc.
    /\b([A-Z]\d+)\b/g,
    // With prefixes: Alpha 1, Romeo 2, etc.
    /\b(Alpha|Bravo|Charlie|Delta|Echo|Foxtrot|Golf|Hotel|India|Juliet|Kilo|Lima|Mike|November|Oscar|Papa|Quebec|Romeo|Sierra|Tango|Uniform|Victor|Whiskey|Xray|Yankee|Zulu)\s+(\d+)\b/gi,
    // Security formats: Security 1, Sec 1, etc.
    /\b(Security|Sec)\s+(\d+)\b/gi,
    // Control formats: Control, Event Control, etc.
    /\b(Event\s+Control|Control)\b/gi,
    // Staff formats: Staff 1, Manager 1, etc.
    /\b(Staff|Manager|Supervisor)\s+(\d+)\b/gi
  ];
  
  const matches: string[] = [];
  
  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      if (pattern.source.includes('Alpha|Bravo')) {
        // NATO phonetic alphabet
        const letter = match[1].charAt(0).toUpperCase();
        const number = match[2];
        matches.push(`${letter}${number}`);
      } else if (pattern.source.includes('Security|Sec')) {
        // Security format
        matches.push(`S${match[2]}`);
      } else if (pattern.source.includes('Staff|Manager')) {
        // Staff format
        const prefix = match[1].charAt(0).toUpperCase();
        matches.push(`${prefix}${match[2]}`);
      } else if (pattern.source.includes('Event\\s+Control|Control')) {
        // Control format
        matches.push('Control');
      } else {
        // Standard format (A1, R2, S1, etc.)
        matches.push(match[1]);
      }
    }
  }
  
  // Return the first valid callsign found
  return matches.length > 0 ? matches[0] : '';
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
