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


