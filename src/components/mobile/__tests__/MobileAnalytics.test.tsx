/**
 * @jest-environment jsdom
 */
import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import MobileAnalytics from '../MobileAnalytics'

jest.mock('@/contexts/EventContext', () => ({
  useEventContext: () => ({ eventId: 'test-event-id' }),
}))

jest.mock('@/hooks/useIncidents', () => ({
  useIncidents: () => ({ incidents: [], loading: false }),
}))

describe('MobileAnalytics', () => {
  it('renders analytics section with title', () => {
    render(<MobileAnalytics onBack={() => {}} />)
    expect(screen.getByText('Analytics')).toBeInTheDocument()
  })

  it('shows link to full analytics dashboard', async () => {
    render(<MobileAnalytics onBack={() => {}} />)
    const link = await waitFor(() => screen.getByRole('link', { name: /Full analytics dashboard/i }))
    expect(link).toBeInTheDocument()
    expect(link.getAttribute('href')).toBe('/analytics')
  })
})
