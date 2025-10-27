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
      'StandCapacityCard',
      'MatchScoreCard',
      'StadiumSecurityCard',
      'MedicalResponseCard',
      'TurnstileStatusCard'
    ],
    aiFocus: 'crowd control, supporter safety, steward coordination, and pitch security',
    incidentCategories: ['Pitch Invasion', 'Fan Disorder', 'Medical', 'Security', 'Ejection'],
    priorityMetrics: ['stand_capacity', 'security_alerts', 'medical_response', 'turnstile_flow']
  },
  festival: {
    name: 'Festival',
    dashboardCards: [
      'MultiStageOverviewCard',
      'CrowdFlowCard',
      'WelfareCard',
      'ScheduleAdherenceCard',
      'IncidentSummaryCard'
    ],
    aiFocus: 'multi-stage crowd management, welfare monitoring, and performance coordination',
    incidentCategories: ['Medical', 'Crowd Control', 'Stage Incident', 'Lost Property', 'Welfare'],
    priorityMetrics: ['stage_occupancy', 'crowd_flow_alerts', 'welfare_cases', 'schedule_adherence']
  },
  parade: {
    name: 'Parade / Procession',
    dashboardCards: [
      'RouteStatusCard',
      'PublicSafetyCard',
      'CrowdFlowCard',
      'VehicleTrackerCard',
      'DispersalMonitorCard'
    ],
    aiFocus: 'route safety, dispersal management, and public order',
    incidentCategories: ['Route Blockage', 'Medical', 'Lost Child', 'Crowd Pressure', 'Public Safety'],
    priorityMetrics: ['route_progress', 'public_safety_alerts', 'vehicle_status', 'dispersal_progress']
  },
  marathon: {
    name: 'Marathon',
    dashboardCards: [
      'RunnerProgressCard',
      'AidStationStatusCard',
      'CourseWeatherCard',
      'MedicalZoneMapCard'
    ],
    aiFocus: 'Support participant safety, hydration logistics, and medical readiness along the course',
    incidentCategories: ['Medical', 'Hydration', 'Logistics', 'Route Issue', 'Weather'],
    priorityMetrics: ['lead_runner_gap', 'aid_station_status', 'course_weather_alerts', 'medical_incidents']
  },
  airshow: {
    name: 'Airshow',
    dashboardCards: [
      'FlightScheduleCard',
      'AirfieldCapacityCard',
      'CrowdSafetyCard',
      'WeatherAviationCard'
    ],
    aiFocus: 'Monitor flight operations, exclusion zones, and emergency readiness for aviation displays',
    incidentCategories: ['Flight Delay', 'Crowd Safety', 'Medical', 'Security', 'Airfield Operations'],
    priorityMetrics: ['flight_schedule_adherence', 'airfield_capacity', 'crowd_safety_alerts', 'aviation_weather']
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
