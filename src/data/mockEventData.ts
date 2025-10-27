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
    stands: [
      { name: 'North Stand', capacity: 15000, occupancy: 14280 },
      { name: 'South Stand', capacity: 16000, occupancy: 14820 },
      { name: 'East Stand', capacity: 17000, occupancy: 15840 },
      { name: 'West Stand', capacity: 17000, occupancy: 15110 },
    ],
    match: {
      homeTeam: 'Liverpool',
      awayTeam: 'Everton',
      homeScore: 2,
      awayScore: 1,
      clock: "72'",
      status: 'Second Half',
      referee: 'Michael Oliver',
      addedTime: '+2m',
    },
    crowd: {
      expectedAttendance: 64000,
      turnstileEntryRate: 2850,
      occupancyTrend: 'increasing',
    },
    security: {
      stewardInterventions: 18,
      ejections: 4,
      arrests: 2,
      pitchInvasionAlerts: 1,
      disorderIncidents: 3,
    },
    medical: {
      active: 4,
      critical: 1,
      nonCritical: 6,
      avgResponseTime: '3m 20s',
      responseTrend: 'improving',
    },
    turnstiles: {
      open: 48,
      total: 60,
      throughputPerMinute: 2450,
      queueTime: {
        average: '6m',
        longest: '12m',
      },
      closedGates: ['E4', 'E5'],
      alerts: 2,
    },
  },
  festival: {
    stages: [
      { name: 'Main Stage', occupancy: 92, nextAct: 'Aurora Waves', startTime: '21:15', status: 'On Time' },
      { name: 'River Stage', occupancy: 74, nextAct: 'Neon Trails', startTime: '20:45', status: 'Delayed 10m' },
      { name: 'Forest Tent', occupancy: 63, nextAct: 'Echo Drift', startTime: '20:30', status: 'On Time' },
      { name: 'Wellbeing Dome', occupancy: 38, nextAct: 'Sound Bath', startTime: '21:00', status: 'On Time' },
    ],
    crowdFlow: {
      overall: 'High',
      mainToSecondary: 'Heavy',
      foodCourtToMain: 'Moderate',
      exitFlow: 'Light',
      alerts: 2,
    },
    crowdDensityZones: [
      { zone: 'Main Stage Pit', density: 94, status: 'congested' },
      { zone: 'River Stage', density: 76, status: 'moderate' },
      { zone: 'Camping Gate', density: 58, status: 'comfortable' },
    ],
    welfare: {
      lostPersons: 4,
      reunions: 2,
      welfareIncidents: 6,
      activeAidTents: [
        { name: 'North Aid', status: 'Busy', waitTime: '8m' },
        { name: 'East Aid', status: 'Stable', waitTime: '4m' },
        { name: 'Wellbeing Hub', status: 'Calm', waitTime: '2m' },
      ],
    },
    schedule: {
      onTime: 18,
      delayed: 3,
      cancelled: 0,
      adherence: 86,
    },
    incidentsByZone: [
      { zone: 'Main Stage Pit', count: 5, type: 'Medical' },
      { zone: 'East Gate', count: 3, type: 'Security' },
      { zone: 'Camping', count: 2, type: 'Welfare' },
      { zone: 'Food Court', count: 1, type: 'Lost Property' },
    ],
  },
  parade: {
    routeStatus: {
      totalDistance: '5.2km',
      completedDistance: '3.9km',
      nextCheckpoint: 'City Hall',
      averageSpeed: '4.5 km/h',
      estimatedTime: 'Approx 35m remaining',
    },
    routeSegments: [
      { name: 'Assembly Point', status: 'clear', completion: 100, estimatedTime: 'Completed' },
      { name: 'High Street', status: 'congested', completion: 72, estimatedTime: '12m delay' },
      { name: 'Riverside Walk', status: 'moderate', completion: 54, estimatedTime: 'On Schedule' },
      { name: 'Grandstand Finish', status: 'pending', completion: 0, estimatedTime: 'Scheduled 18:30' },
    ],
    crowdZones: [
      { zone: 'Grandstand', density: 88, status: 'congested' },
      { zone: 'Bridge Overlook', density: 64, status: 'moderate' },
      { zone: 'Market Square', density: 42, status: 'comfortable' },
    ],
    publicSafety: {
      crowdIncidents: 3,
      missingPersons: { active: 1, resolved: 1 },
      firstAidResponses: 4,
      crowdPressureNotes: ['High Street barrier line', 'Bridge Overlook north steps'],
    },
    vehicles: {
      floatsInRoute: 18,
      emergencyVehicles: 4,
      delays: 1,
      monitoring: [
        { name: 'Float 5 - City Schools', status: 'On Schedule', location: 'High Street' },
        { name: 'Float 9 - Veterans', status: 'Delayed', location: 'Assembly Hold' },
        { name: 'EMS Unit 2', status: 'Shadowing', location: 'Riverside Walk' },
      ],
    },
    dispersal: {
      expectedClear: '18:45',
      status: 'Staggered Release',
      zones: [
        { zone: 'North Exit', completion: 55 },
        { zone: 'West Gate', completion: 32 },
        { zone: 'Park & Ride', completion: 78 },
      ],
    },
  },
  marathon: {
    runnerProgress: {
      averagePace: '3:05/km',
      leadPack: [
        { name: 'E. Kim', bib: '1021', split: '2:15:33', location: '32km' },
        { name: 'R. Silva', bib: '1043', split: '2:15:39', location: '32km' },
        { name: 'T. Osei', bib: '1102', split: '2:16:04', location: '31.5km' },
      ],
      chasingPackGap: '48s',
      lastUpdate: '12:42',
    },
    aidStations: [
      { name: 'AS12 - Riverside', status: 'Busy', hydrationLevel: 68, medicalIncidents: 1 },
      { name: 'AS14 - Summit Hill', status: 'Strained', hydrationLevel: 42, medicalIncidents: 2 },
      { name: 'AS16 - City Gate', status: 'Stable', hydrationLevel: 76, medicalIncidents: 0 },
    ],
    courseWeather: {
      segments: [
        { location: 'Start Line', temperature: '16°C', wind: '8 km/h SW', condition: 'Overcast' },
        { location: 'Harbourfront', temperature: '17°C', wind: '12 km/h S', condition: 'Humid' },
        { location: 'Summit Hill', temperature: '14°C', wind: '18 km/h W', condition: 'Gusty' },
      ],
      alerts: ['Crosswind gusts increasing at Summit Hill', 'Humidity rising at Harbourfront sector'],
    },
    medicalZones: [
      { zone: 'Checkpoint 8', incidents: 2, status: 'Responding', eta: '3m' },
      { zone: 'Finish Line', incidents: 1, status: 'Stabilised', eta: '—' },
      { zone: 'Checkpoint 5', incidents: 0, status: 'Ready', eta: '—' },
    ],
  },
  airshow: {
    flightSchedule: [
      { slot: '14:05', aircraft: 'Red Arrows', status: 'Airborne', remarks: 'Display Run 1' },
      { slot: '14:25', aircraft: 'RAF Typhoon', status: 'Holding', remarks: 'Awaiting clearance' },
      { slot: '14:40', aircraft: 'Boeing 737 Demo', status: 'On Stand', remarks: 'Taxi in 10m' },
      { slot: '15:00', aircraft: 'Historic Spitfire', status: 'Crew Briefing', remarks: 'Fuel top up' },
    ],
    airfieldCapacity: {
      standsAvailable: 6,
      standsTotal: 12,
      runwayStatus: 'Active',
      groundMovements: {
        taxiing: 3,
        holding: 1,
        departuresQueued: 2,
      },
      fuelStatus: 'Sufficient',
    },
    crowdSafety: {
      fencingAlerts: 1,
      incidents: [
        { type: 'Minor Medical', location: 'North Viewing Line', status: 'Resolved' },
        { type: 'Heat Exhaustion', location: 'Family Zone', status: 'Monitoring' },
      ],
      restrictedZones: ['Runway', 'Hangar 3 Apron', 'Fuel Farm'],
      publicAnnouncements: ['Weather update at 14:20', 'Crowd dispersal drill at 16:00'],
    },
    weather: {
      visibility: '8 km',
      cloudCeiling: '2,500 ft',
      wind: '12 kt SW',
      temperature: '19°C',
      qnh: '1014 hPa',
      notes: 'Monitor crosswind for light aircraft',
    },
  },
} as const

export type MockEventData = typeof mockEventData
export type ConcertData = typeof mockEventData.concert
export type FootballData = typeof mockEventData.football
export type FestivalData = typeof mockEventData.festival
export type ParadeData = typeof mockEventData.parade
export type MarathonData = typeof mockEventData.marathon
export type AirshowData = typeof mockEventData.airshow
