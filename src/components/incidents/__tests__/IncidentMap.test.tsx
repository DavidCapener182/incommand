/**
 * @jest-environment jsdom
 */
import React from 'react'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import IncidentMap from '../IncidentMap'

describe('IncidentMap', () => {
  it('shows loading state when map library is not loaded', () => {
    render(<IncidentMap incidents={[]} />)
    expect(screen.getByText(/Loading map/)).toBeInTheDocument()
  })

  it('accepts incidents with coordinates without throwing', () => {
    const incidents = [
      {
        id: '1',
        latitude: 51.5074,
        longitude: -0.1278,
        incident_type: 'Test',
        priority: 'high',
      },
    ]
    render(<IncidentMap incidents={incidents} />)
    expect(screen.getByText(/Loading map/)).toBeInTheDocument()
  })
})
