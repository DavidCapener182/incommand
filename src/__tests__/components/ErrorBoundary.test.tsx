import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { ErrorBoundary, withErrorBoundary, useErrorHandler } from '@/components/ErrorBoundary'

// Component that throws an error
const ThrowError = ({ shouldThrow = false }: { shouldThrow?: boolean }) => {
  if (shouldThrow) {
    throw new Error('Test error message')
  }
  return <div data-testid="normal-component">Normal Component</div>
}

// Component that throws an error in render
const ThrowErrorInRender = () => {
  throw new Error('Render error')
}

// Component that throws an error in useEffect
const ThrowErrorInEffect = () => {
  React.useEffect(() => {
    throw new Error('Effect error')
  }, [])
  return <div data-testid="effect-component">Effect Component</div>
}

describe('ErrorBoundary Component', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('ErrorBoundary Class Component', () => {
    it('renders children when no error occurs', () => {
      render(
        <ErrorBoundary>
          <div data-testid="test-child">Test Child</div>
        </ErrorBoundary>
      )

      expect(screen.getByTestId('test-child')).toBeInTheDocument()
    })

    it('renders fallback UI when error occurs', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      )

      expect(screen.getByText('Something went wrong')).toBeInTheDocument()
      expect(screen.getByText('An unexpected error occurred.')).toBeInTheDocument()
      expect(screen.getByText('Reload Page')).toBeInTheDocument()
    })

    it('renders custom fallback when provided', () => {
      const CustomFallback = () => <div data-testid="custom-fallback">Custom Error UI</div>

      render(
        <ErrorBoundary fallback={<CustomFallback />}>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      )

      expect(screen.getByTestId('custom-fallback')).toBeInTheDocument()
      expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument()
    })

    it('shows component name in error message when provided', () => {
      render(
        <ErrorBoundary componentName="TestComponent">
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      )

      expect(screen.getByText('An error occurred in TestComponent.')).toBeInTheDocument()
    })

    it('logs error with structured logging', () => {
      render(
        <ErrorBoundary componentName="TestComponent">
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      )

      const { logger } = require('@/lib/logger')
      expect(logger.error).toHaveBeenCalledWith(
        'React Error Boundary caught an error',
        expect.any(Error),
        expect.objectContaining({
          component: 'ErrorBoundary',
          action: 'componentDidCatch',
          componentName: 'TestComponent',
          errorInfo: expect.objectContaining({
            componentStack: expect.any(String),
            errorName: 'Error',
            errorMessage: 'Test error message',
            errorStack: expect.any(String),
          }),
        })
      )
    })

    it('calls onError callback when provided', () => {
      const onError = jest.fn()

      render(
        <ErrorBoundary onError={onError}>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      )

      expect(onError).toHaveBeenCalledWith(
        expect.any(Error),
        expect.objectContaining({
          componentStack: expect.any(String),
        })
      )
    })

    it('handles reload button click', () => {
      const reloadSpy = jest.spyOn(window.location, 'reload').mockImplementation(() => {})

      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      )

      const reloadButton = screen.getByText('Reload Page')
      fireEvent.click(reloadButton)

      expect(reloadSpy).toHaveBeenCalled()

      reloadSpy.mockRestore()
    })

    it('shows error details in development mode', () => {
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'development'

      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      )

      expect(screen.getByText('Error Details (Development)')).toBeInTheDocument()
      expect(screen.getByText('Test error message')).toBeInTheDocument()

      process.env.NODE_ENV = originalEnv
    })

    it('hides error details in production mode', () => {
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'production'

      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      )

      expect(screen.queryByText('Error Details (Development)')).not.toBeInTheDocument()

      process.env.NODE_ENV = originalEnv
    })

    it('handles errors in useEffect', () => {
      render(
        <ErrorBoundary>
          <ThrowErrorInEffect />
        </ErrorBoundary>
      )

      expect(screen.getByText('Something went wrong')).toBeInTheDocument()
    })

    it('handles errors in render', () => {
      render(
        <ErrorBoundary>
          <ThrowErrorInRender />
        </ErrorBoundary>
      )

      expect(screen.getByText('Something went wrong')).toBeInTheDocument()
    })

    it('resets error state when error is cleared', () => {
      const { rerender } = render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      )

      expect(screen.getByText('Something went wrong')).toBeInTheDocument()

      // Re-render without error
      rerender(
        <ErrorBoundary>
          <ThrowError shouldThrow={false} />
        </ErrorBoundary>
      )

      expect(screen.getByTestId('normal-component')).toBeInTheDocument()
      expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument()
    })
  })

  describe('withErrorBoundary HOC', () => {
    it('wraps component with error boundary', () => {
      const WrappedComponent = withErrorBoundary(ThrowError, {
        componentName: 'WrappedTestComponent',
      })

      render(<WrappedComponent shouldThrow={true} />)

      expect(screen.getByText('An error occurred in WrappedTestComponent.')).toBeInTheDocument()
    })

    it('passes through props to wrapped component', () => {
      const WrappedComponent = withErrorBoundary(ThrowError)

      render(<WrappedComponent shouldThrow={false} />)

      expect(screen.getByTestId('normal-component')).toBeInTheDocument()
    })

    it('sets correct display name', () => {
      const TestComponent = () => <div>Test</div>
      TestComponent.displayName = 'TestComponent'

      const WrappedComponent = withErrorBoundary(TestComponent)

      expect(WrappedComponent.displayName).toBe('withErrorBoundary(TestComponent)')
    })

    it('handles components without display name', () => {
      const TestComponent = () => <div>Test</div>

      const WrappedComponent = withErrorBoundary(TestComponent)

      expect(WrappedComponent.displayName).toBe('withErrorBoundary(TestComponent)')
    })
  })

  describe('useErrorHandler Hook', () => {
    it('returns a function that logs errors', () => {
      const TestComponent = () => {
        const handleError = useErrorHandler()

        const triggerError = () => {
          handleError(new Error('Hook error'), {
            componentStack: 'Test stack',
          })
        }

        return (
          <div>
            <button data-testid="error-button" onClick={triggerError}>
              Trigger Error
            </button>
          </div>
        )
      }

      render(<TestComponent />)

      const errorButton = screen.getByTestId('error-button')
      fireEvent.click(errorButton)

      const { logger } = require('@/lib/logger')
      expect(logger.error).toHaveBeenCalledWith(
        'Error caught by useErrorHandler',
        expect.any(Error),
        expect.objectContaining({
          component: 'useErrorHandler',
          action: 'handleError',
          errorInfo: {
            componentStack: 'Test stack',
          },
        })
      )
    })

    it('handles errors without errorInfo', () => {
      const TestComponent = () => {
        const handleError = useErrorHandler()

        const triggerError = () => {
          handleError(new Error('Hook error'))
        }

        return (
          <div>
            <button data-testid="error-button" onClick={triggerError}>
              Trigger Error
            </button>
          </div>
        )
      }

      render(<TestComponent />)

      const errorButton = screen.getByTestId('error-button')
      fireEvent.click(errorButton)

      const { logger } = require('@/lib/logger')
      expect(logger.error).toHaveBeenCalledWith(
        'Error caught by useErrorHandler',
        expect.any(Error),
        expect.objectContaining({
          component: 'useErrorHandler',
          action: 'handleError',
        })
      )
    })
  })

  describe('Accessibility', () => {
    it('has proper ARIA attributes', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      )

      const reloadButton = screen.getByText('Reload Page')
      expect(reloadButton).toHaveAttribute('type', 'button')
    })

    it('has proper semantic structure', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      )

      expect(screen.getByRole('heading', { level: 3 })).toHaveTextContent('Something went wrong')
    })
  })

  describe('Styling', () => {
    it('applies correct CSS classes', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      )

      const container = screen.getByText('Something went wrong').closest('div')
      expect(container).toHaveClass('min-h-screen', 'flex', 'items-center', 'justify-center')
    })

    it('applies dark mode classes', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      )

      const container = screen.getByText('Something went wrong').closest('div')
      expect(container).toHaveClass('bg-gray-50')
    })
  })

  describe('Error Recovery', () => {
    it('allows component to recover from errors', () => {
      const { rerender } = render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      )

      expect(screen.getByText('Something went wrong')).toBeInTheDocument()

      // Simulate error recovery by re-rendering without error
      rerender(
        <ErrorBoundary>
          <ThrowError shouldThrow={false} />
        </ErrorBoundary>
      )

      expect(screen.getByTestId('normal-component')).toBeInTheDocument()
      expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument()
    })

    it('maintains error state until explicitly reset', () => {
      const { rerender } = render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      )

      expect(screen.getByText('Something went wrong')).toBeInTheDocument()

      // Re-render with same error condition
      rerender(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      )

      expect(screen.getByText('Something went wrong')).toBeInTheDocument()
    })
  })
})
