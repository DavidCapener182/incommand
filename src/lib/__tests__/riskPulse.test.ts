import { calculateRiskStatus, transformHistoryToChartData } from '../riskPulse';
import type { RiskMetricsPayload } from '@/types/riskPulse';

describe('riskPulse helpers', () => {
  const baseMetrics: RiskMetricsPayload = {
    incident_counts: { high: 0, medium: 0, low: 0 },
    avg_response_time: 5,
    incidents_per_hour: 2,
    active_staff_count: 10,
    timestamp: new Date().toISOString(),
    history: [
      { time: new Date(Date.now() - 600000).toISOString(), count: 1 },
      { time: new Date().toISOString(), count: 2 },
    ],
  };

  it('returns Escalate when high incidents present', () => {
    expect(
      calculateRiskStatus({
        ...baseMetrics,
        incident_counts: { high: 1, medium: 0, low: 0 },
      })
    ).toBe('Escalate');
  });

  it('returns Escalate when medium incidents exceed threshold', () => {
    expect(
      calculateRiskStatus({
        ...baseMetrics,
        incident_counts: { high: 0, medium: 4, low: 0 },
      })
    ).toBe('Escalate');
  });

  it('returns Escalate when response time exceeds 10 minutes', () => {
    expect(
      calculateRiskStatus({
        ...baseMetrics,
        avg_response_time: 12,
      })
    ).toBe('Escalate');
  });

  it('returns Monitor when medium incidents present but below threshold', () => {
    expect(
      calculateRiskStatus({
        ...baseMetrics,
        incident_counts: { high: 0, medium: 1, low: 0 },
      })
    ).toBe('Monitor');
  });

  it('returns Stable when counts low and response time normal', () => {
    expect(calculateRiskStatus(baseMetrics)).toBe('Stable');
  });

  it('transforms history into chart points sorted chronologically', () => {
    const points = transformHistoryToChartData([
      { time: '2025-01-01T12:05:00Z', count: 2 },
      { time: '2025-01-01T12:00:00Z', count: 1 },
    ]);

    expect(points).toHaveLength(2);
    expect(points[0].count).toBe(1);
    expect(points[1].count).toBe(2);
    expect(points[0].timeLabel).toBeTruthy();
  });
});
