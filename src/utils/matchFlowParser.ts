/**
 * Match Flow Parser
 * Detects and parses match flow terms from text input
 * Supports variations like "Kick-Off", "Kickoff", "Half-Time", "Halftime", etc.
 */

import { matchFlowIncidentTypes } from '@/config/incidentTypes';

export type MatchFlowType = 
  | 'Kick-Off (First Half)'
  | 'Half-Time'
  | 'Kick-Off (Second Half)'
  | 'Full-Time'
  | 'Home Goal'
  | 'Away Goal';

export interface MatchFlowParseResult {
  type: MatchFlowType | null;
  confidence: number;
  occurrence: string;
  detectedText: string;
}

/**
 * Normalize text for matching (lowercase, remove punctuation, handle variations)
 */
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ') // Remove punctuation
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();
}

/**
 * Detect match flow type from text input
 */
export function detectMatchFlowType(
  input: string,
  homeTeam?: string,
  awayTeam?: string
): MatchFlowParseResult {
  const normalized = normalizeText(input);
  const originalInput = input.trim();

  // Match patterns for each type
  const patterns: Array<{
    type: MatchFlowType;
    keywords: string[];
    phrases: string[];
    priority: number; // Higher = more specific
  }> = [
    {
      type: 'Kick-Off (First Half)',
      keywords: ['kickoff', 'kick off', 'first half', 'start', 'match start', 'game start'],
      phrases: ['kick-off first half', 'kickoff first half', 'first half kick-off', 'first half kickoff', 'kick off first half'],
      priority: 3,
    },
    {
      type: 'Half-Time',
      keywords: ['halftime', 'half time', 'half-time', 'interval'],
      phrases: ['half time', 'half-time', 'halftime'],
      priority: 3,
    },
    {
      type: 'Kick-Off (Second Half)',
      keywords: ['kickoff', 'kick off', 'second half', 'restart'],
      phrases: ['kick-off second half', 'kickoff second half', 'second half kick-off', 'second half kickoff'],
      priority: 3,
    },
    {
      type: 'Full-Time',
      keywords: ['fulltime', 'full time', 'full-time', 'end', 'match end', 'game end', 'final whistle'],
      phrases: ['full time', 'full-time', 'fulltime', 'end of match', 'end of game'],
      priority: 3,
    },
    {
      type: 'Home Goal',
      keywords: ['home goal', 'home scored', 'home team goal'],
      phrases: ['home goal', 'home team goal', 'home scored'],
      priority: 2,
    },
    {
      type: 'Away Goal',
      keywords: ['away goal', 'away scored', 'away team goal'],
      phrases: ['away goal', 'away team goal', 'away scored'],
      priority: 2,
    },
  ];

  // Check for team name variations in goal detection
  if (homeTeam || awayTeam) {
    const homeTeamLower = homeTeam?.toLowerCase().trim() || '';
    const awayTeamLower = awayTeam?.toLowerCase().trim() || '';

    // Check if input contains team name + "goal"
    if (homeTeamLower && normalized.includes(homeTeamLower) && normalized.includes('goal')) {
      return {
        type: 'Home Goal',
        confidence: 0.9,
        occurrence: `${homeTeam} Goal`,
        detectedText: originalInput,
      };
    }

    if (awayTeamLower && normalized.includes(awayTeamLower) && normalized.includes('goal')) {
      return {
        type: 'Away Goal',
        confidence: 0.9,
        occurrence: `${awayTeam} Goal`,
        detectedText: originalInput,
      };
    }
  }

  let bestMatch: MatchFlowParseResult | null = null;
  let bestScore = 0;

  // Check each pattern
  for (const pattern of patterns) {
    let score = 0;
    let matchedText = '';

    // Check for phrase matches (higher weight)
    for (const phrase of pattern.phrases) {
      if (normalized.includes(phrase)) {
        score = pattern.priority * 2; // Phrases are more specific
        matchedText = phrase;
        break;
      }
    }

    // Check for keyword matches if no phrase match
    if (score === 0) {
      for (const keyword of pattern.keywords) {
        const normalizedKeyword = normalizeText(keyword);
        if (normalized.includes(normalizedKeyword)) {
          // Boost score for exact keyword matches
          score = pattern.priority * 1.5;
          matchedText = keyword;
          break;
        }
      }
    }

    // Update best match if this is better
    if (score > bestScore) {
      bestScore = score;
      bestMatch = {
        type: pattern.type,
        confidence: Math.min(score / 6, 1), // Normalize to 0-1
        occurrence: generateOccurrenceText(pattern.type, homeTeam, awayTeam),
        detectedText: matchedText || originalInput,
      };
    }
  }

  return bestMatch || {
    type: null,
    confidence: 0,
    occurrence: '',
    detectedText: originalInput,
  };
}

/**
 * Generate occurrence text for match flow log
 */
function generateOccurrenceText(
  type: MatchFlowType,
  homeTeam?: string,
  awayTeam?: string
): string {
  const teamInfo = homeTeam && awayTeam ? `${homeTeam} v ${awayTeam}` : 'Match';

  switch (type) {
    case 'Kick-Off (First Half)':
      return `Kick-Off (First Half) - ${teamInfo}`;
    case 'Half-Time':
      return `Half-Time - ${teamInfo}`;
    case 'Kick-Off (Second Half)':
      return `Kick-Off (Second Half) - ${teamInfo}`;
    case 'Full-Time':
      return `Full-Time - ${teamInfo}`;
    case 'Home Goal':
      return homeTeam ? `${homeTeam} Goal` : 'Home Goal';
    case 'Away Goal':
      return awayTeam ? `${awayTeam} Goal` : 'Away Goal';
    default:
      return type;
  }
}

/**
 * Check if text input is likely a match flow log
 */
export function isMatchFlowInput(input: string): boolean {
  const result = detectMatchFlowType(input);
  return result.type !== null && result.confidence > 0.5;
}

/**
 * Get all match flow types as array
 */
export function getAllMatchFlowTypes(): MatchFlowType[] {
  return [...matchFlowIncidentTypes] as MatchFlowType[];
}

/**
 * Check if an incident type is a match flow type
 */
export function isMatchFlowType(type: string): type is MatchFlowType {
  return matchFlowIncidentTypes.includes(type as MatchFlowType);
}

