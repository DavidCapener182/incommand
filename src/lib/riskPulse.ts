import type { RiskHistoryPoint, RiskMetricsPayload, RiskStatus } from '@/types/riskPulse';

export const calculateRiskStatus = (metrics: RiskMetricsPayload): RiskStatus => {
  const { incident_counts, avg_response_time } = metrics;

  if (
    incident_counts.high > 0 ||
    incident_counts.medium > 3 ||
    avg_response_time > 10
  ) {
    return 'Escalate';
  }

  if (incident_counts.medium > 0) {
    return 'Monitor';
  }

  return 'Stable';
};

export interface ChartPoint {
  timeLabel: string;
  count: number;
}

export const transformHistoryToChartData = (history: RiskHistoryPoint[]): ChartPoint[] =>
  history
    .slice()
    .sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime())
    .map((point) => ({
      timeLabel: new Date(point.time).toLocaleTimeString('en-GB', {
        hour: '2-digit',
        minute: '2-digit',
      }),
      count: point.count,
    }));

export const getStatusConfig = (status: RiskStatus) => {
  switch (status) {
    case 'Escalate':
      return {
        label: 'Escalate',
        colorClass: 'bg-red-600 text-white',
        message: 'Immediate attention required',
        action: 'Review high-priority incidents',
        icon: 'alert-triangle',
      } as const;
    case 'Monitor':
      return {
        label: 'Monitor',
        colorClass: 'bg-yellow-500 text-black',
        message: 'Elevated activity detected',
        action: 'Monitor situation closely',
        icon: 'eye',
      } as const;
    default:
      return {
        label: 'Stable',
        colorClass: 'bg-green-500 text-white',
        message: 'Operations normal',
        action: 'Continue routine monitoring',
        icon: 'check-circle',
      } as const;
  }
};
