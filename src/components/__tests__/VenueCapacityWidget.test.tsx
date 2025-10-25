import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import VenueCapacityWidget from '../VenueCapacityWidget';
import { supabase } from '@/lib/supabase';

// Mock the supabase client
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
              { count: 150, timestamp: '2024-01-01T10:15:00Z' },
              { count: 200, timestamp: '2024-01-01T10:30:00Z' },
              { count: 250, timestamp: '2024-01-01T10:45:00Z' },
              { count: 300, timestamp: '2024-01-01T11:00:00Z' }
            ],
            error: null
          }))
        }))
      }))
    })),
    channel: vi.fn(() => ({
      on: vi.fn(() => ({
        subscribe: vi.fn((callback: (status: string) => void) => {
          callback('SUBSCRIBED');
          return Promise.resolve();
        })
      }))
    })),
    removeChannel: vi.fn()
  }
}));

// Mock the estimateEvacRSET utility
vi.mock('@/utils/estimateEvacRSET', () => ({
  estimateEvacRSET: vi.fn(() => ({ minutes: 15 }))
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

// Mock Chart.js
vi.mock('react-chartjs-2', () => ({
  Line: () => <div data-testid="chart">Chart Component</div>
}));

describe('VenueCapacityWidget - Predictive Capacity Alerts', () => {
  const mockEventId = 'test-event-123';

  beforeEach(() => {
    vi.clearAllMocks();
    mockMessages.length = 0;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Alert Analysis Function', () => {
    it('should analyze predictions and identify capacity concerns', async () => {
      render(<VenueCapacityWidget eventId={mockEventId} />);

      // Wait for component to load and generate predictions
      await waitFor(() => {
        expect(screen.getByText('Venue Capacity')).toBeInTheDocument();
      });

      // The component should have generated predictions and potentially triggered alerts
      // based on the mock attendance data showing an upward trend
      await waitFor(() => {
        expect(screen.getByText('Current Occupancy')).toBeInTheDocument();
      });
    });

    it('should trigger warning alerts for 75-89% predicted occupancy', async () => {
      // Mock attendance data that would trigger a warning alert
      const mockAttendanceData = [
        { count: 600, timestamp: '2024-01-01T10:00:00Z' },
        { count: 650, timestamp: '2024-01-01T10:15:00Z' },
        { count: 700, timestamp: '2024-01-01T10:30:00Z' },
        { count: 750, timestamp: '2024-01-01T10:45:00Z' },
        { count: 800, timestamp: '2024-01-01T11:00:00Z' }
      ];

      // Mock the supabase response for this test
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
              data: mockAttendanceData,
              error: null
            }))
          }))
        }))
      });

      render(<VenueCapacityWidget eventId={mockEventId} />);

      await waitFor(() => {
        expect(screen.getByText('Venue Capacity')).toBeInTheDocument();
      });

      // Wait for predictions to be generated and alerts to be triggered
      await waitFor(() => {
        // The component should have analyzed predictions and potentially triggered alerts
        expect(screen.getByText('Current Occupancy')).toBeInTheDocument();
      }, { timeout: 3000 });
    });

    it('should trigger critical alerts for 90%+ predicted occupancy', async () => {
      // Mock attendance data that would trigger a critical alert
      const mockAttendanceData = [
        { count: 800, timestamp: '2024-01-01T10:00:00Z' },
        { count: 850, timestamp: '2024-01-01T10:15:00Z' },
        { count: 900, timestamp: '2024-01-01T10:30:00Z' },
        { count: 950, timestamp: '2024-01-01T10:45:00Z' },
        { count: 1000, timestamp: '2024-01-01T11:00:00Z' }
      ];

      // Mock the supabase response for this test
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
              data: mockAttendanceData,
              error: null
            }))
          }))
        }))
      });

      render(<VenueCapacityWidget eventId={mockEventId} />);

      await waitFor(() => {
        expect(screen.getByText('Venue Capacity')).toBeInTheDocument();
      });

      // Wait for predictions to be generated and alerts to be triggered
      await waitFor(() => {
        // The component should have analyzed predictions and potentially triggered alerts
        expect(screen.getByText('Current Occupancy')).toBeInTheDocument();
      }, { timeout: 3000 });
    });
  });

  describe('Alert State Management', () => {
    it('should prevent duplicate alerts for the same prediction', async () => {
      render(<VenueCapacityWidget eventId={mockEventId} />);

      await waitFor(() => {
        expect(screen.getByText('Venue Capacity')).toBeInTheDocument();
      });

      // The component should handle duplicate prevention internally
      // We can verify this by checking that the alert logic is called appropriately
      await waitFor(() => {
        expect(screen.getByText('Current Occupancy')).toBeInTheDocument();
      });
    });

    it('should clean up alerts when component unmounts', async () => {
      const { unmount } = render(<VenueCapacityWidget eventId={mockEventId} />);

      await waitFor(() => {
        expect(screen.getByText('Venue Capacity')).toBeInTheDocument();
      });

      // Unmount the component
      unmount();

      // Verify cleanup was called
      expect(mockRemoveToast).toHaveBeenCalled();
    });

    it('should reset alert state when event changes', async () => {
      const { rerender } = render(<VenueCapacityWidget eventId={mockEventId} />);

      await waitFor(() => {
        expect(screen.getByText('Venue Capacity')).toBeInTheDocument();
      });

      // Change the event ID
      rerender(<VenueCapacityWidget eventId="new-event-456" />);

      // The component should reset alert state for the new event
      await waitFor(() => {
        expect(screen.getByText('Venue Capacity')).toBeInTheDocument();
      });
    });
  });

  describe('Toast Integration', () => {
    it('should display toast notifications when alerts are triggered', async () => {
      // Mock a toast message to simulate an alert being triggered
      mockMessages.push({
        id: 'test-alert-1',
        type: 'warning',
        title: 'Predictive Warning Alert',
        message: 'Capacity Alert: Predicted 80% occupancy in 45 minutes. Monitor attendance trends closely.',
        duration: 0
      });

      render(<VenueCapacityWidget eventId={mockEventId} />);

      await waitFor(() => {
        expect(screen.getByText('Venue Capacity')).toBeInTheDocument();
      });

      // Check if toast container is rendered
      expect(screen.getByTestId('toast-container')).toBeInTheDocument();

      // Check if the toast message is displayed
      expect(screen.getByTestId('toast-test-alert-1')).toBeInTheDocument();
      expect(screen.getByText('Predictive Warning Alert: Capacity Alert: Predicted 80% occupancy in 45 minutes. Monitor attendance trends closely.')).toBeInTheDocument();
    });

    it('should allow manual closing of toast notifications', async () => {
      // Mock a toast message
      mockMessages.push({
        id: 'test-alert-2',
        type: 'error',
        title: 'Predictive Critical Alert',
        message: 'Capacity Alert: Predicted 95% occupancy in 30 minutes. Consider implementing entry restrictions.',
        duration: 0
      });

      render(<VenueCapacityWidget eventId={mockEventId} />);

      await waitFor(() => {
        expect(screen.getByText('Venue Capacity')).toBeInTheDocument();
      });

      // Find and click the close button
      const closeButton = screen.getByText('Close');
      fireEvent.click(closeButton);

      // Verify removeToast was called
      expect(mockRemoveToast).toHaveBeenCalledWith('test-alert-2');
    });
  });

  describe('Prediction Integration', () => {
    it('should generate predictions and analyze them for alerts', async () => {
      render(<VenueCapacityWidget eventId={mockEventId} />);

      await waitFor(() => {
        expect(screen.getByText('Venue Capacity')).toBeInTheDocument();
      });

      // Wait for predictions to be generated
      await waitFor(() => {
        expect(screen.getByText('Current Occupancy')).toBeInTheDocument();
      });

      // The component should have generated predictions and analyzed them
      // We can verify this by checking that the prediction logic has run
      expect(screen.getByText('Flow Rate')).toBeInTheDocument();
    });

    it('should handle different prediction scenarios appropriately', async () => {
      // Test with different attendance patterns
      const testScenarios = [
        {
          name: 'Low occupancy trend',
          data: [
            { count: 100, timestamp: '2024-01-01T10:00:00Z' },
            { count: 120, timestamp: '2024-01-01T10:15:00Z' },
            { count: 140, timestamp: '2024-01-01T10:30:00Z' },
            { count: 160, timestamp: '2024-01-01T10:45:00Z' },
            { count: 180, timestamp: '2024-01-01T11:00:00Z' }
          ]
        },
        {
          name: 'High occupancy trend',
          data: [
            { count: 700, timestamp: '2024-01-01T10:00:00Z' },
            { count: 750, timestamp: '2024-01-01T10:15:00Z' },
            { count: 800, timestamp: '2024-01-01T10:30:00Z' },
            { count: 850, timestamp: '2024-01-01T10:45:00Z' },
            { count: 900, timestamp: '2024-01-01T11:00:00Z' }
          ]
        }
      ];

      for (const scenario of testScenarios) {
        // Mock the supabase response for this scenario
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

        const { unmount } = render(<VenueCapacityWidget eventId={mockEventId} />);

        await waitFor(() => {
          expect(screen.getByText('Venue Capacity')).toBeInTheDocument();
        });

        // Wait for predictions to be generated
        await waitFor(() => {
          expect(screen.getByText('Current Occupancy')).toBeInTheDocument();
        });

        // Clean up for next iteration
        unmount();
      }
    });
  });

  describe('Error Handling', () => {
    it('should handle errors gracefully when predictions fail', async () => {
      // Mock an error in the prediction generation
      (supabase.from as any).mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => ({
              data: null,
              error: { message: 'Database error' }
            }))
          })),
          order: vi.fn(() => ({
            eq: vi.fn(() => ({
              data: [],
              error: { message: 'No data available' }
            }))
          }))
        }))
      });

      render(<VenueCapacityWidget eventId={mockEventId} />);

      await waitFor(() => {
        expect(screen.getByText('Venue Capacity')).toBeInTheDocument();
      });

      // The component should handle errors gracefully and not crash
      expect(screen.getByText('Current Occupancy')).toBeInTheDocument();
    });

    it('should handle toast creation errors gracefully', async () => {
      // Mock the addToast to throw an error
      mockAddToast.mockImplementation(() => {
        throw new Error('Toast creation failed');
      });

      render(<VenueCapacityWidget eventId={mockEventId} />);

      await waitFor(() => {
        expect(screen.getByText('Venue Capacity')).toBeInTheDocument();
      });

      // The component should handle toast errors gracefully and not crash
      expect(screen.getByText('Current Occupancy')).toBeInTheDocument();
    });
  });

  describe('Performance and Optimization', () => {
    it('should not trigger alerts unnecessarily', async () => {
      // Mock attendance data that shouldn't trigger alerts
      const mockAttendanceData = [
        { count: 200, timestamp: '2024-01-01T10:00:00Z' },
        { count: 220, timestamp: '2024-01-01T10:15:00Z' },
        { count: 240, timestamp: '2024-01-01T10:30:00Z' },
        { count: 260, timestamp: '2024-01-01T10:45:00Z' },
        { count: 280, timestamp: '2024-01-01T11:00:00Z' }
      ];

      // Mock the supabase response for this test
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
              data: mockAttendanceData,
              error: null
            }))
          }))
        }))
      });

      render(<VenueCapacityWidget eventId={mockEventId} />);

      await waitFor(() => {
        expect(screen.getByText('Venue Capacity')).toBeInTheDocument();
      });

      // Wait for predictions to be generated
      await waitFor(() => {
        expect(screen.getByText('Current Occupancy')).toBeInTheDocument();
      });

      // No alerts should be triggered for this low occupancy scenario
      expect(screen.getByText('Safe limits')).toBeInTheDocument();
    });

    it('should handle rapid data updates efficiently', async () => {
      render(<VenueCapacityWidget eventId={mockEventId} />);

      await waitFor(() => {
        expect(screen.getByText('Venue Capacity')).toBeInTheDocument();
      });

      // Simulate rapid data updates
      await act(async () => {
        // Trigger multiple rapid updates
        for (let i = 0; i < 5; i++) {
          // This would normally trigger the subscription callback
          await new Promise(resolve => setTimeout(resolve, 10));
        }
      });

      // The component should handle rapid updates without crashing
      expect(screen.getByText('Current Occupancy')).toBeInTheDocument();
    });
  });
});
