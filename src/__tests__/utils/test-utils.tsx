import React, { ReactElement } from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { AuthProvider } from '@/contexts/AuthContext'
import { NotificationDrawerProvider } from '@/contexts/NotificationDrawerContext'

// Custom render function that includes providers
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    <AuthProvider>
      <NotificationDrawerProvider>
        {children}
      </NotificationDrawerProvider>
    </AuthProvider>
  )
}

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options })

// Re-export everything
export * from '@testing-library/react'
export { customRender as render }

// Mock data for tests
export const mockUser = {
  id: 'test-user-id',
  email: 'test@example.com',
  full_name: 'Test User',
  role: 'admin',
  company_id: 'test-company-id',
}

export const mockEvent = {
  id: 'test-event-id',
  event_name: 'Test Event',
  venue_name: 'Test Venue',
  event_type: 'Concert',
  event_date: '2024-12-31',
  venue_address: '123 Test Street, London',
  is_current: true,
  company_id: 'test-company-id',
}

export const mockIncidents = [
  {
    id: 'incident-1',
    log_number: 'INC-001',
    incident_type: 'medical',
    priority: 'high',
    status: 'open',
    description: 'Test medical incident',
    timestamp: '2024-12-31T10:00:00Z',
    assigned_staff_ids: [],
  },
  {
    id: 'incident-2',
    log_number: 'INC-002',
    incident_type: 'ejection',
    priority: 'medium',
    status: 'in-progress',
    description: 'Test ejection incident',
    timestamp: '2024-12-31T11:00:00Z',
    assigned_staff_ids: ['staff-1'],
  },
]

export const mockStaff = [
  {
    id: 'staff-1',
    full_name: 'John Doe',
    email: 'john@example.com',
    skill_tags: ['medical', 'security'],
    availability_status: 'available',
    active_assignments: 1,
  },
  {
    id: 'staff-2',
    full_name: 'Jane Smith',
    email: 'jane@example.com',
    skill_tags: ['medical'],
    availability_status: 'available',
    active_assignments: 0,
  },
]
