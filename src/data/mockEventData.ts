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
    currentOccupancy: 42500,
    totalCapacity: 50000,
    entryExitRate: 300,
    turnstileFlow: 2500,
    activeMedicalIncidents: 7,
    averageMedicalResponseTime: '3m 22s',
    criticalMedicalIncidents: 2,
    arrests: 2,
    securityAlerts: 1,
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
    flowRate: 'High',
    crowdDensityZones: [
      { name: 'Main Stage', density: 95, status: 'congested' },
      { name: 'Food Court', density: 60, status: 'normal' },
      { name: 'Exit Gates', density: 85, status: 'congested' }
    ],
    crowdFlow: {
      mainToSecondary: 'High',
      secondaryToTent: 'Medium',
      tentToExit: 'Low'
    },
    crowdPressurePoints: [
      { name: 'Main Stage Entrance', pressure: 'High' },
      { name: 'Food Court', pressure: 'Medium' },
      { name: 'Exit Gates', pressure: 'High' }
    ],
    safetyMetrics: {
      dispersalTime: '20m'
    },
    stageDetails: [
      { name: 'Main Stage', status: 'active', artist: 'Headliner', nextAct: 'Encore', timeRemaining: '15m' },
      { name: 'Side Stage', status: 'active', artist: 'Support Act', nextAct: 'Break', timeRemaining: '5m' },
      { name: 'Tent Stage', status: 'inactive', artist: 'TBC', nextAct: 'TBC', timeRemaining: 'TBC' }
    ],
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
    flowRate: 'Medium',
    crowdDensityZones: [
      { name: 'Start Point', density: 40, status: 'normal' },
      { name: 'Main Route', density: 60, status: 'normal' },
      { name: 'Finish Point', density: 80, status: 'congested' }
    ],
    crowdFlow: {
      mainToSecondary: 'Medium',
      secondaryToTent: 'Low',
      tentToExit: 'High'
    },
    crowdPressurePoints: [
      { name: 'Start Point', pressure: 'Low' },
      { name: 'Main Route', pressure: 'Medium' },
      { name: 'Finish Point', pressure: 'High' }
    ],
    safetyMetrics: {
      crowdDensity: 'Medium',
      lostChildren: 0,
      medicalIncidents: 2,
      dispersalTime: '15m'
    },
    routeStatus: {
      completedDistance: '2.5km',
      totalDistance: '5.0km',
      nextCheckpoint: 'City Hall',
      averageSpeed: '2.5 km/h'
    },
    routeSegments: [
      { name: 'Start', status: 'clear', completion: 100, estimatedTime: '0m' },
      { name: 'Main Street', status: 'congested', completion: 75, estimatedTime: '15m' },
      { name: 'City Hall', status: 'pending', completion: 0, estimatedTime: '30m' }
    ],
  },
};

export type MockEventData = typeof mockEventData;
export type ConcertData = typeof mockEventData.concert;
export type FootballData = typeof mockEventData.football;
export type FestivalData = typeof mockEventData.festival;
export type ParadeData = typeof mockEventData.parade;
