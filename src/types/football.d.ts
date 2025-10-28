// Football domain types for event-specific dashboards and APIs

export type FootballPhase =
  | 'Pre-Match'
  | 'First Half'
  | 'Half-Time'
  | 'Second Half'
  | 'Full Time';

export interface FootballCardsDiscipline {
  yellow: number;
  red: number;
}

export interface FootballLiveScore {
  home: number;
  away: number;
  time: string; // mm:ss or hh:mm:ss when needed
  phase: FootballPhase;
  cards: FootballCardsDiscipline;
  subs: number;
  homeTeam: string;
  awayTeam: string;
  competition: string;
}

export interface StandOccupancy {
  current: number;
  capacity: number;
}

export type StandOccupancyMap = Record<string, StandOccupancy>;

export interface FootballGateStatus {
  openTime?: string; // HH:mm
  totalTurnstiles: number;
  activeTurnstiles: number;
  entryRate: number; // people/hour
  queueAlerts: string[];
  predictedFullEntry?: string; // HH:mm
}

export interface FootballMedicalCase {
  type: string; // Minor | Moderate | Severe | etc.
  status: 'Ongoing' | 'Resolved';
}

export interface FootballMedicalPolicing {
  medicalTeams: number;
  policeDeployed: number;
  stewards: number;
}

export type WeatherRisk = 'Low' | 'Medium' | 'High';

export interface FootballTransportInfo {
  rail: string;
  buses: string;
  taxi: string;
  roadClosures: string[];
}

export interface FootballWeatherInfo {
  temp: number; // Celsius
  wind: string; // e.g., "5m/s"
  condition: string; // e.g., Clear, Overcast
  risk: WeatherRisk;
}

export interface FootballTransportWeather {
  transport: FootballTransportInfo;
  weather: FootballWeatherInfo;
}

export interface FootballData {
  fixture: string; // e.g., "Liverpool v Everton"
  matchDate: string; // ISO date string
  liveScore: FootballLiveScore;
  occupancy: StandOccupancyMap;
  gateStatus: FootballGateStatus;
  medicalPolicing: FootballMedicalPolicing;
  transportWeather: FootballTransportWeather;
}

// Overrides structure for manual operator input; partial and deeply nested
export type FootballManualOverrides = Partial<FootballData> & {
  liveScore?: Partial<FootballLiveScore> & { cards?: Partial<FootballCardsDiscipline> };
  occupancy?: Partial<StandOccupancyMap>;
  gateStatus?: Partial<FootballGateStatus>;
  medicalPolicing?: Partial<FootballMedicalPolicing> & { cases?: Partial<FootballMedicalCase>[] };
  transportWeather?: Partial<FootballTransportWeather> & {
    transport?: Partial<FootballTransportInfo>;
    weather?: Partial<FootballWeatherInfo>;
  };
};

export interface FootballDataResponse {
  data: FootballData;
}

export interface FootballUpdateManualRequest {
  overrides: FootballManualOverrides;
}

export interface FootballUpdateManualResponse {
  success: true;
  data: FootballData;
}

// New types for Support Tool Modals

export interface StandConfig {
  id: string;
  name: string;
  capacity: number;
  order: number;
}

export interface StandsSetup {
  stands: StandConfig[];
  totalCapacity: number;
}

export interface StaffingRole {
  id: string;
  name: string;
  planned: number;
  actual: number;
  icon?: string;
  color?: string;
}

export interface StaffingData {
  roles: StaffingRole[];
}

export interface FixtureTask {
  id: string;
  minute: number;
  description: string;
  assignedRole?: string;
  completed: boolean;
  completedAt?: string;
  completedBy?: string;
}

export interface FixtureChecklist {
  fixture: string;
  tasks: FixtureTask[];
}

export interface GateConfig {
  id: string;
  name: string;
  status: 'active' | 'delayed' | 'closed';
  entryRate: number;
  threshold: number;
  sensorId?: string;
}

export interface GatesSetup {
  gates: GateConfig[];
}

export interface TransportConfig {
  location: string;
  postcode?: string;
  coordinates?: { lat: number; lng: number };
  providers: string[];
  radius: number;
  issues?: TransportIssue[];
}

export interface TransportIssue {
  id: string;
  type: string;
  description: string;
  severity: 'low' | 'medium' | 'high';
  timestamp: string;
}


