/**
 * Utility functions for detecting incident types from text
 */

import { detectIncidentFromText } from './incidentLogic';

export function detectIncidentType(text: string): string {
  if (!text) return '';
  
  const result = detectIncidentFromText(text);
  return result.incidentType || '';
}

/**
 * Enhanced incident type detection with confidence scoring
 */
export function detectIncidentTypeWithConfidence(text: string): { type: string; confidence: number } {
  if (!text) return { type: '', confidence: 0 };
  
  const result = detectIncidentFromText(text);
  const confidence = result.incidentType ? 0.8 : 0.3; // Basic confidence scoring
  
  return {
    type: result.incidentType || '',
    confidence
  };
}

/**
 * Get alternative incident types based on text analysis
 */
export function getAlternativeIncidentTypes(text: string): string[] {
  if (!text) return [];
  
  const alternatives: string[] = [];
  const lowerText = text.toLowerCase();
  
  // Medical-related alternatives
  if (lowerText.includes('medical') || lowerText.includes('injury') || lowerText.includes('first aid')) {
    alternatives.push('Medical', 'Welfare');
  }
  
  // Security-related alternatives
  if (lowerText.includes('security') || lowerText.includes('suspicious') || lowerText.includes('theft')) {
    alternatives.push('Security', 'Suspicious Behaviour', 'Theft');
  }
  
  // Crowd-related alternatives
  if (lowerText.includes('crowd') || lowerText.includes('queue') || lowerText.includes('surge')) {
    alternatives.push('Crowd Management', 'Welfare');
  }
  
  // Technical alternatives
  if (lowerText.includes('tech') || lowerText.includes('equipment') || lowerText.includes('power')) {
    alternatives.push('Tech Issue', 'Site Issue');
  }
  
  // Remove duplicates and return
  return [...new Set(alternatives)];
}
