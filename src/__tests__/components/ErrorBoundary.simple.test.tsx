import React from 'react'
import { render, screen } from '@testing-library/react'
import { ErrorBoundary } from '../../components/ErrorBoundary'

// Mock logger
jest.mock('../../lib/logger', () => ({
  logger: {
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
    dev: jest.fn(),
  },
}))

// Component that throws an error
const ThrowError = ({ shouldThrow = false }: { shouldThrow?: boolean }) => {
  if (shouldThrow) {
    throw new Error('Test error message')
  }
  return <div>Normal Component</div>
}

describe('ErrorBoundary Component - Simple Test', () => {
  it('renders children when no error occurs', () => {
    render(
      <ErrorBoundary>
        <div>Test Child</div>
      </ErrorBoundary>
    )

    expect(screen.getByText('Test Child')).toBeInTheDocument()
  })

  it('renders fallback UI when error occurs', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    )

    expect(screen.getByText('Something went wrong')).toBeInTheDocument()
    expect(screen.getByText('An unexpected error occurred.')).toBeInTheDocument()
  })
})
