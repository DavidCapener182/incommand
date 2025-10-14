/**
 * Incident types that should automatically be marked as closed when parsed
 * These are typically completed events or informational logs that don't require follow-up
 * 
 * Categories:
 * - Show completion/event timing: Showdown (show completion code), Artist Movement, Artist On/Off Stage, Event Timing, Timings
 * - Information/reporting: Sit Rep, Attendance  
 * - Completed items: Lost Property, Staffing, Accessibility, Accreditation
 * - Other completed events: Environmental, Noise Complaint
 */

export const AUTO_CLOSE_INCIDENT_TYPES = [
  // Event timing and completion
  'Showdown',
  'Artist Movement', 
  'Artist On Stage',
  'Artist Off Stage',
  'Event Timing',
  'Timings',
  
  // Information and reporting
  'Sit Rep',
  'Attendance',
  
  // Completed items
  'Lost Property',
  'Staffing',
  'Accsessablity', // Accessibility
  
  // Other completed events that don't need follow-up
  'Accreditation',
  'Environmental',
  'Noise Complaint'
] as const;

export type AutoCloseIncidentType = typeof AUTO_CLOSE_INCIDENT_TYPES[number];

/**
 * Check if an incident type should automatically be marked as closed
 */
export function shouldAutoClose(incidentType: string): boolean {
  return AUTO_CLOSE_INCIDENT_TYPES.includes(incidentType as AutoCloseIncidentType);
}

/**
 * Get a human-readable explanation of why an incident type auto-closes
 */
export function getAutoCloseReason(incidentType: string): string {
  const reasons: Record<string, string> = {
    'Showdown': 'Show completion code - not an incident',
    'Artist Movement': 'Artist movement completed - no follow-up needed',
    'Artist On Stage': 'Artist performance event - no follow-up needed',
    'Artist Off Stage': 'Artist performance completed - no follow-up needed',
    'Event Timing': 'Timing milestone reached - no follow-up needed',
    'Timings': 'Timing update completed - no follow-up needed',
    'Sit Rep': 'Situation report provided - no follow-up needed',
    'Attendance': 'Attendance count recorded - no follow-up needed',
    'Lost Property': 'Lost property logged - no follow-up needed',
    'Staffing': 'Staffing issue logged - no follow-up needed',
    'Accsessablity': 'Accessibility concern logged - no follow-up needed',
    'Accreditation': 'Accreditation issue logged - no follow-up needed',
    'Environmental': 'Environmental issue logged - no follow-up needed',
    'Noise Complaint': 'Noise complaint logged - no follow-up needed'
  };
  
  return reasons[incidentType] || 'Completed event - no follow-up needed';
}
