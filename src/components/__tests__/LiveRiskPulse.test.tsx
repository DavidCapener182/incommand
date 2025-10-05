import React from 'react';
import { render, screen } from '@testing-library/react';
import LiveRiskPulse from '../LiveRiskPulse';
import { useWebSocket } from '@/hooks/useWebSocket';
import { act } from 'react-dom/test-utils';
import type { RiskMetricsPayload } from '@/types/riskPulse';

jest.mock('@/hooks/useWebSocket');

const mockMetrics: RiskMetricsPayload = {
  incident_counts: { high: 1, medium: 0, low: 2 },
  avg_response_time: 6,
  incidents_per_hour: 12,
  active_staff_count: 22,
  timestamp: new Date().toISOString(),
  history: [
    { time: new Date(Date.now() - 300000).toISOString(), count: 8 },
    { time: new Date().toISOString(), count: 12 },
  ],
};

describe('LiveRiskPulse', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    (useWebSocket as jest.Mock).mockReturnValue({
      subscribe: (handler: any) => {
        setTimeout(() => {
          handler({
            type: 'risk_metrics_update',
            payload: mockMetrics,
            timestamp: Date.now(),
          });
        }, 0);
      },
      unsubscribe: jest.fn(),
      isConnected: true,
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('renders metrics received via websocket', async () => {
    await act(async () => {
      render(<LiveRiskPulse />);
      jest.runAllTimers();
    });

    expect(await screen.findByText('Escalate')).toBeInTheDocument();
    expect(screen.getByText('12')).toBeInTheDocument();
    expect(screen.getByText('22')).toBeInTheDocument();
  });
});
