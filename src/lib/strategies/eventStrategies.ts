/**
 * Event Strategies Configuration
 * Defines dashboard cards, AI focus, and incident categories for each event type
 */

export const eventStrategies = {
  concert: {
    name: 'Concert / Gig',
    dashboardCards: [
      'IncidentDashboardCard',
      'WeatherCard',
      'PerformanceChart',
      'CrowdDensityCard',
      'VenueOccupancy',
      'What3WordsSearchCard'
    ],
    aiFocus: 'artist safety, stage performance, crowd density, and venue security',
    incidentCategories: ['Medical', 'Security', 'Lost Property', 'Technical', 'Weather'],
    priorityMetrics: ['crowd_density', 'incident_volume', 'response_time', 'artist_safety']
  },
  football: {
    name: 'Football Match',
    dashboardCards: [
      'StadiumSecurityCard',
      'CapacityCard',
      'MedicalResponseCard',
      'WeatherCard',
      'What3WordsSearchCard'
    ],
    aiFocus: 'crowd control, supporter safety, steward coordination, and pitch security',
    incidentCategories: ['Pitch Invasion', 'Fan Disorder', 'Pyrotechnic Incident', 'Crowd Surge', 'Stand Conflict', 'Supporter Ejection', 'Steward Deployment', 'Segregation Breach', 'Disorder at Entry/Exit', 'Offensive Chanting', 'Throwing Objects', 'Use of Flares / Smoke Devices', 'Pitch Encroachment', 'Post-Match Incident', 'Half-Time Incident', 'Match Abandonment', 'On-Field Medical Emergency', 'Player Safety Concern', 'Referee / Official Abuse', 'Security Perimeter Breach', 'Medical', 'Security', 'Ejection'],
    priorityMetrics: ['ejections', 'stadium_capacity', 'medical_response', 'security_alerts']
  },
  festival: {
    name: 'Festival',
    dashboardCards: [
      'MultiStageCard',
      'CrowdFlowCard',
      'IncidentDashboardCard',
      'WeatherCard',
      'What3WordsSearchCard'
    ],
    aiFocus: 'multi-stage crowd management, welfare monitoring, and performance coordination',
    incidentCategories: ['Medical', 'Crowd Control', 'Stage Incident', 'Lost Property', 'Welfare'],
    priorityMetrics: ['stage_occupancy', 'crowd_flow', 'incident_volume', 'schedule_adherence']
  },
  parade: {
    name: 'Parade / Procession',
    dashboardCards: [
      'RouteStatusCard',
      'PublicSafetyCard',
      'CrowdFlowCard',
      'WeatherCard',
      'What3WordsSearchCard'
    ],
    aiFocus: 'route safety, dispersal management, and public order',
    incidentCategories: ['Route Blockage', 'Medical', 'Lost Child', 'Crowd Pressure', 'Public Safety'],
    priorityMetrics: ['route_progress', 'public_safety', 'crowd_flow', 'dispersal_time']
  }
} as const;

export type EventType = keyof typeof eventStrategies;
export type EventStrategy = typeof eventStrategies[EventType];

/**
 * Get event strategy for a given event type
 * Falls back to concert strategy if event type is not recognized
 */
export function getEventStrategy(eventType: string): EventStrategy {
  if (!eventType) return eventStrategies.concert;
  
  // Event type should already be normalized by EventContext, but normalize again for safety
  const normalizedEventType = eventType.toLowerCase() as EventType;
  
  return eventStrategies[normalizedEventType] || eventStrategies.concert;
}

/**
 * Get all supported event types
 */
export function getSupportedEventTypes(): EventType[] {
  return Object.keys(eventStrategies) as EventType[];
}

/**
 * Check if an event type is supported
 */
export function isEventTypeSupported(eventType: string): eventType is EventType {
  return eventType in eventStrategies;
}
