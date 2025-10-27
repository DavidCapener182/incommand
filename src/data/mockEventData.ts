/**
 * Centralized mock data for all event types
 * Used during development and for demos before real data integration
 */

export const mockEventData = {
  concert: {
    ejections: 0,
    incidents: 12,
    stewardInterventions: 3,
    pitchInvasionAlerts: 0,
    currentCapacityPercentage: 75,
    entryExitRate: 120,
    turnstileFlow: 800,
    activeMedicalIncidents: 5,
    averageMedicalResponseTime: '4m 30s',
    criticalMedicalIncidents: 1,
    stageOccupancy: {
      mainStage: 80,
      sideStage: 60,
      tentStage: 40,
    },
    overlappingCrowdDensity: 70,
    scheduleAdherence: 'On Time',
    crowdDensityHeatmap: 'Moderate',
    zoneCongestionAlerts: 2,
    flowRateBetweenStages: 'High',
    routeSegmentStatus: {
      segment1: 'Clear',
      segment2: 'Congested',
      segment3: 'Clear',
    },
    estimatedTravelTime: '1h 15m',
    sectorCompletionPercentage: 60,
    publicSafetyIncidents: 3,
    missingPersons: {
      logged: 2,
      resolved: 1,
    },
    crowdDensityKeyPoints: 'Medium',
  },
  football: {
    ejections: 4,
    incidents: 8,
    stewardInterventions: 15,
    pitchInvasionAlerts: 1,
    currentCapacityPercentage: 85,
    entryExitRate: 300,
    turnstileFlow: 2500,
    activeMedicalIncidents: 7,
    averageMedicalResponseTime: '3m 22s',
    criticalMedicalIncidents: 2,
  },
  festival: {
    ejections: 2,
    incidents: 25,
    stewardInterventions: 10,
    pitchInvasionAlerts: 0,
    currentCapacityPercentage: 90,
    entryExitRate: 200,
    turnstileFlow: 1500,
    activeMedicalIncidents: 10,
    averageMedicalResponseTime: '5m 10s',
    criticalMedicalIncidents: 3,
    stageOccupancy: {
      mainStage: 95,
      sideStage: 70,
      tentStage: 50,
    },
    overlappingCrowdDensity: 85,
    scheduleAdherence: 'Minor Delays',
    crowdDensityHeatmap: 'High',
    zoneCongestionAlerts: 5,
  },
  parade: {
    ejections: 0,
    incidents: 5,
    stewardInterventions: 8,
    pitchInvasionAlerts: 0,
    currentCapacityPercentage: 70,
    entryExitRate: 50,
    turnstileFlow: 300,
    activeMedicalIncidents: 3,
    averageMedicalResponseTime: '6m 0s',
    criticalMedicalIncidents: 0,
    routeSegmentStatus: {
      segment1: 'Clear',
      segment2: 'Clear',
      segment3: 'Congested',
    },
    estimatedTravelTime: '2h 0m',
    sectorCompletionPercentage: 80,
    publicSafetyIncidents: 1,
    missingPersons: {
      logged: 1,
      resolved: 0,
    },
    crowdDensityKeyPoints: 'High',
  },
};

export type MockEventData = typeof mockEventData;
export type ConcertData = typeof mockEventData.concert;
export type FootballData = typeof mockEventData.football;
export type FestivalData = typeof mockEventData.festival;
export type ParadeData = typeof mockEventData.parade;
