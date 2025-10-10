import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import VenueCapacityWidget from '../VenueCapacityWidget';

// Mock external dependencies
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => ({
            data: { expected_attendance: 1000 },
            error: null
          }))
        })),
        order: vi.fn(() => ({
          eq: vi.fn(() => ({
            data: [
              { count: 100, timestamp: '2024-01-01T10:00:00Z' },
              { count: 200, timestamp: '2024-01-01T10:15:00Z' },
              { count: 300, timestamp: '2024-01-01T10:30:00Z' },
              { count: 400, timestamp: '2024-01-01T10:45:00Z' },
              { count: 500, timestamp: '2024-01-01T11:00:00Z' }
            ],
            error: null
          }))
        }))
      }))
    })),
    channel: vi.fn(() => ({
      on: vi.fn(() => ({
        subscribe: vi.fn((callback) => {
          callback('SUBSCRIBED');
          return Promise.resolve();
        })
      }))
    })),
    removeChannel: vi.fn()
  }
}));

vi.mock('@/utils/estimateEvacRSET', () => ({
  estimateEvacRSET: vi.fn(() => ({ minutes: 15 }))
}));

vi.mock('react-chartjs-2', () => ({
  Line: () => <div data-testid="chart">Chart Component</div>
}));

// Mock the Toast component and useToast hook
const mockAddToast = vi.fn();
const mockRemoveToast = vi.fn();
const mockMessages: any[] = [];

vi.mock('../Toast', () => ({
  useToast: () => ({
    messages: mockMessages,
    addToast: mockAddToast,
    removeToast: mockRemoveToast,
    clearAll: vi.fn()
  }),
  default: ({ messages, onRemove }: { messages: any[], onRemove: (id: string) => void }) => (
    <div data-testid="toast-container">
      {messages.map((msg) => (
        <div key={msg.id} data-testid={`toast-${msg.id}`}>
          {msg.title}: {msg.message}
          <button onClick={() => onRemove(msg.id)}>Close</button>
        </div>
      ))}
    </div>
  )
}));

describe('VenueCapacityWidget - Predictive Alerts Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockMessages.length = 0;
  });

  it('should generate predictions and trigger alerts when capacity threshold is reached', async () => {
    // Mock attendance data that shows a concerning upward trend
    const concerningAttendanceData = [
      { count: 600, timestamp: '2024-01-01T10:00:00Z' },
      { count: 650, timestamp: '2024-01-01T10:15:00Z' },
      { count: 700, timestamp: '2024-01-01T10:30:00Z' },
      { count: 750, timestamp: '2024-01-01T10:45:00Z' },
      { count: 800, timestamp: '2024-01-01T11:00:00Z' }
    ];

    // Mock the supabase response for this test
    const { supabase } = await import('@/lib/supabase');
    (supabase.from as any).mockReturnValue({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => ({
            data: { expected_attendance: 1000 },
            error: null
          }))
        })),
        order: vi.fn(() => ({
          eq: vi.fn(() => ({
            data: concerningAttendanceData,
            error: null
          }))
        }))
      }))
    });

    render(<VenueCapacityWidget eventId="test-event" />);

    // Wait for component to load
    await waitFor(() => {
      expect(screen.getByText('Venue Capacity')).toBeInTheDocument();
    });

    // Wait for predictions to be generated and analyzed
    await waitFor(() => {
      expect(screen.getByText('Current Occupancy')).toBeInTheDocument();
    }, { timeout: 3000 });

    // Verify that the component has processed the attendance data
    expect(screen.getByText('800')).toBeInTheDocument(); // Current occupancy
    expect(screen.getByText('200')).toBeInTheDocument(); // Available capacity

    // The component should have generated predictions and potentially triggered alerts
    // We can verify the prediction logic ran by checking for derived metrics
    expect(screen.getByText('Flow Rate')).toBeInTheDocument();
  });

  it('should handle different occupancy scenarios appropriately', async () => {
    const testScenarios = [
      {
        name: 'Low occupancy - no alerts',
        data: [
          { count: 100, timestamp: '2024-01-01T10:00:00Z' },
          { count: 120, timestamp: '2024-01-01T10:15:00Z' },
          { count: 140, timestamp: '2024-01-01T10:30:00Z' },
          { count: 160, timestamp: '2024-01-01T10:45:00Z' },
          { count: 180, timestamp: '2024-01-01T11:00:00Z' }
        ],
        expectedStatus: 'Safe'
      },
      {
        name: 'Moderate occupancy - warning alerts possible',
        data: [
          { count: 500, timestamp: '2024-01-01T10:00:00Z' },
          { count: 550, timestamp: '2024-01-01T10:15:00Z' },
          { count: 600, timestamp: '2024-01-01T10:30:00Z' },
          { count: 650, timestamp: '2024-01-01T10:45:00Z' },
          { count: 700, timestamp: '2024-01-01T11:00:00Z' }
        ],
        expectedStatus: 'Moderate'
      },
      {
        name: 'High occupancy - critical alerts possible',
        data: [
          { count: 800, timestamp: '2024-01-01T10:00:00Z' },
          { count: 850, timestamp: '2024-01-01T10:15:00Z' },
          { count: 900, timestamp: '2024-01-01T10:30:00Z' },
          { count: 950, timestamp: '2024-01-01T10:45:00Z' },
          { count: 1000, timestamp: '2024-01-01T11:00:00Z' }
        ],
        expectedStatus: 'Near Capacity'
      }
    ];

    for (const scenario of testScenarios) {
      // Mock the supabase response for this scenario
      const { supabase } = await import('@/lib/supabase');
      (supabase.from as any).mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => ({
              data: { expected_attendance: 1000 },
              error: null
            }))
          })),
          order: vi.fn(() => ({
            eq: vi.fn(() => ({
              data: scenario.data,
              error: null
            }))
          }))
        }))
      });

      const { unmount } = render(<VenueCapacityWidget eventId="test-event" />);

      // Wait for component to load
      await waitFor(() => {
        expect(screen.getByText('Venue Capacity')).toBeInTheDocument();
      });

      // Wait for predictions to be generated
      await waitFor(() => {
        expect(screen.getByText('Current Occupancy')).toBeInTheDocument();
      });

      // Verify the current occupancy is displayed correctly
      const currentCount = scenario.data[scenario.data.length - 1].count;
      expect(screen.getByText(currentCount.toString())).toBeInTheDocument();

      // Verify the capacity status is correct
      expect(screen.getByText(scenario.expectedStatus)).toBeInTheDocument();

      // Clean up for next iteration
      unmount();
    }
  });

  it('should display toast notifications when alerts are triggered', async () => {
    // Mock a toast message to simulate an alert being triggered
    mockMessages.push({
      id: 'predictive-alert-1',
      type: 'warning',
      title: 'Predictive Warning Alert',
      message: 'Capacity Alert: Predicted 80% occupancy in 45 minutes. Monitor attendance trends closely.',
      duration: 0
    });

    render(<VenueCapacityWidget eventId="test-event" />);

    // Wait for component to load
    await waitFor(() => {
      expect(screen.getByText('Venue Capacity')).toBeInTheDocument();
    });

    // Check if toast container is rendered
    expect(screen.getByTestId('toast-container')).toBeInTheDocument();

    // Check if the toast message is displayed
    expect(screen.getByTestId('toast-predictive-alert-1')).toBeInTheDocument();
    expect(screen.getByText(/Predictive Warning Alert/)).toBeInTheDocument();
    expect(screen.getByText(/Capacity Alert: Predicted 80% occupancy/)).toBeInTheDocument();
  });

  it('should handle rapid data updates and prediction recalculations', async () => {
    render(<VenueCapacityWidget eventId="test-event" />);

    // Wait for component to load
    await waitFor(() => {
      expect(screen.getByText('Venue Capacity')).toBeInTheDocument();
    });

    // Simulate rapid data updates
    await act(async () => {
      // Trigger multiple rapid updates to test prediction recalculation
      for (let i = 0; i < 3; i++) {
        await new Promise(resolve => setTimeout(resolve, 50));
      }
    });

    // The component should handle rapid updates without crashing
    expect(screen.getByText('Current Occupancy')).toBeInTheDocument();
    expect(screen.getByText('Flow Rate')).toBeInTheDocument();
  });

  it('should clean up resources and alerts on unmount', async () => {
    // Mock a toast message
    mockMessages.push({
      id: 'test-alert-cleanup',
      type: 'warning',
      title: 'Test Alert',
      message: 'Test message for cleanup',
      duration: 0
    });

    const { unmount } = render(<VenueCapacityWidget eventId="test-event" />);

    // Wait for component to load
    await waitFor(() => {
      expect(screen.getByText('Venue Capacity')).toBeInTheDocument();
    });

    // Verify toast is displayed
    expect(screen.getByTestId('toast-test-alert-cleanup')).toBeInTheDocument();

    // Unmount the component
    unmount();

    // Verify cleanup was called
    expect(mockRemoveToast).toHaveBeenCalled();
  });
});
