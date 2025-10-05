export type RiskStatus = 'Escalate' | 'Monitor' | 'Stable';

export interface RiskHistoryPoint {
  time: string; // ISO8601 string representing the bucket start time
  count: number; // incidents per hour (or equivalent) for the bucket
}

export interface RiskMetricsPayload {
  incident_counts: {
    high: number;
    medium: number;
    low: number;
  };
  avg_response_time: number; // minutes, rolling 60 minute view
  incidents_per_hour: number; // rolling 60 minute view
  active_staff_count: number;
  timestamp: string; // ISO8601 timestamp of the snapshot
  history: RiskHistoryPoint[];
}

export interface RiskMetricsMessage {
  type: 'risk_metrics_update';
  payload: RiskMetricsPayload;
  timestamp: number;
}
