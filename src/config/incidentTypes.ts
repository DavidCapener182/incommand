/**
 * Modular Incident Type Configuration
 * Organizes incident types by event type for conditional display
 */

// Shared incident types available for all event types
export const sharedIncidentTypes = [
  'Medical',
  'Ejection',
  'Refusal',
  'Welfare',
  'Suspicious Behaviour',
  'Lost Property',
  'Attendance',
  'Site Issue',
  'Tech Issue',
  'Environmental',
  'Other',
  'Alcohol / Drug Related',
  'Weapon Related',
  'Sexual Misconduct',
  'Crowd Management',
  'Hostile Act',
  'Fire Alarm',
  'Noise Complaint',
  'Evacuation',
  'Counter-Terror Alert',
  'Entry Breach',
  'Theft',
  'Animal Incident',
  'Missing Child/Person',
  'Accreditation',
  'Staffing',
  'Accsessablity',
  'Suspected Fire',
  'Fire',
  'Fight',
] as const;

// Concert-specific incident types
export const concertIncidentTypes = [
  'Artist Movement',
  'Artist On Stage',
  'Artist Off Stage',
  'Event Timing',
  'Timings',
  'Sit Rep',
  'Showdown',
  'Emergency Show Stop',
  'Queue Build-Up',
] as const;

// Football-specific incident types
export const footballIncidentTypes = [
  'Pitch Invasion',
  'Fan Disorder',
  'Pyrotechnic Incident',
  'Crowd Surge',
  'Stand Conflict',
  'Supporter Ejection',
  'Steward Deployment',
  'Segregation Breach',
  'Disorder at Entry/Exit',
  'Offensive Chanting',
  'Throwing Objects',
  'Use of Flares / Smoke Devices',
  'Pitch Encroachment',
  'Post-Match Incident',
  'Half-Time Incident',
  'Match Abandonment',
  'On-Field Medical Emergency',
  'Player Safety Concern',
  'Referee / Official Abuse',
  'Security Perimeter Breach',
] as const;

// Festival-specific incident types (placeholder for future)
export const festivalIncidentTypes = [] as const;

// Parade-specific incident types (placeholder for future)
export const paradeIncidentTypes = [] as const;

/**
 * Incident types organized by event type
 */
export const incidentTypesByEvent = {
  shared: [...sharedIncidentTypes],
  concert: [...concertIncidentTypes],
  football: [...footballIncidentTypes],
  festival: [...festivalIncidentTypes],
  parade: [...paradeIncidentTypes],
} as const;

/**
 * Get all incident types available for a specific event type
 * @param eventType - The event type ('concert', 'football', 'festival', 'parade', or null)
 * @returns Array of incident type strings
 */
export function getIncidentTypesForEvent(eventType: string | null): string[] {
  if (!eventType) {
    // Fallback to concert + shared if event type is null/unknown
    return [...sharedIncidentTypes, ...concertIncidentTypes];
  }

  const normalizedEventType = eventType.toLowerCase() as keyof typeof incidentTypesByEvent;
  
  // Get event-specific types if available, otherwise fallback to concert
  const eventSpecificTypes = incidentTypesByEvent[normalizedEventType] || incidentTypesByEvent.concert;
  
  return [...sharedIncidentTypes, ...eventSpecificTypes];
}

/**
 * Get all incident types as a flat array (for backward compatibility)
 * @param eventType - Optional event type to filter
 * @returns Array of all incident type strings
 */
export function getAllIncidentTypes(eventType?: string | null): string[] {
  if (eventType) {
    return getIncidentTypesForEvent(eventType);
  }
  
  // Return all types if no event type specified
  return [
    ...sharedIncidentTypes,
    ...concertIncidentTypes,
    ...footballIncidentTypes,
    ...festivalIncidentTypes,
    ...paradeIncidentTypes,
  ];
}

/**
 * Check if an incident type is available for a specific event type
 * @param incidentType - The incident type to check
 * @param eventType - The event type to check against
 * @returns True if the incident type is available for the event type
 */
export function isIncidentTypeAvailableForEvent(
  incidentType: string,
  eventType: string | null
): boolean {
  const availableTypes = getIncidentTypesForEvent(eventType);
  return availableTypes.includes(incidentType);
}

/**
 * Get display name mapping for incident types
 * Maintains backward compatibility with existing INCIDENT_TYPES object structure
 */
export const INCIDENT_TYPE_DISPLAY_NAMES: Record<string, string> = {
  'Ejection': 'Ejection',
  'Refusal': 'Refusal',
  'Medical': 'Medical',
  'Welfare': 'Welfare',
  'Suspicious Behaviour': 'Suspicious Behaviour',
  'Lost Property': 'Lost Property',
  'Attendance': 'Attendance Update',
  'Site Issue': 'Site Issue',
  'Tech Issue': 'Tech Issue',
  'Environmental': 'Environmental',
  'Other': 'Other',
  'Alcohol / Drug Related': 'Alcohol / Drug Related',
  'Weapon Related': 'Weapon Related',
  'Artist Movement': 'Artist Movement',
  'Artist On Stage': 'Artist On Stage',
  'Artist Off Stage': 'Artist Off Stage',
  'Sexual Misconduct': 'Sexual Misconduct',
  'Event Timing': 'Event Timing',
  'Timings': 'Timing Update',
  'Sit Rep': 'Situation Report',
  'Crowd Management': 'Crowd Management',
  'Hostile Act': 'Hostile Act',
  'Fire Alarm': 'Fire Alarm',
  'Noise Complaint': 'Noise Complaint',
  'Evacuation': 'Evacuation',
  'Counter-Terror Alert': 'Counter-Terror Alert',
  'Entry Breach': 'Entry Breach',
  'Theft': 'Theft',
  'Emergency Show Stop': 'Emergency Show Stop',
  'Animal Incident': 'Animal Incident',
  'Missing Child/Person': 'Missing Child/Person',
  'Accreditation': 'Accreditation',
  'Staffing': 'Staffing',
  'Accsessablity': 'Accsessablity',
  'Suspected Fire': 'Suspected Fire',
  'Fire': 'Fire',
  'Showdown': 'Showdown',
  'Fight': 'Fight',
  // Football-specific types
  'Pitch Invasion': 'Pitch Invasion',
  'Fan Disorder': 'Fan Disorder',
  'Pyrotechnic Incident': 'Pyrotechnic Incident',
  'Crowd Surge': 'Crowd Surge',
  'Stand Conflict': 'Stand Conflict',
  'Supporter Ejection': 'Supporter Ejection',
  'Steward Deployment': 'Steward Deployment',
  'Segregation Breach': 'Segregation Breach',
  'Disorder at Entry/Exit': 'Disorder at Entry/Exit',
  'Offensive Chanting': 'Offensive Chanting',
  'Throwing Objects': 'Throwing Objects',
  'Use of Flares / Smoke Devices': 'Use of Flares / Smoke Devices',
  'Pitch Encroachment': 'Pitch Encroachment',
  'Post-Match Incident': 'Post-Match Incident',
  'Half-Time Incident': 'Half-Time Incident',
  'Match Abandonment': 'Match Abandonment',
  'On-Field Medical Emergency': 'On-Field Medical Emergency',
  'Player Safety Concern': 'Player Safety Concern',
  'Referee / Official Abuse': 'Referee / Official Abuse',
  'Security Perimeter Breach': 'Security Perimeter Breach',
};

