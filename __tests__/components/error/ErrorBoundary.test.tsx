/**
 * Unit tests for ErrorBoundary component
 */

import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { render as customRender } from '../../utils/test-utils'
import ErrorBoundary from '@/components/error/ErrorBoundary'

// Component that throws an error
const ThrowError: React.FC<{ shouldThrow?: boolean }> = ({ shouldThrow = true }) => {
  if (shouldThrow) {
    throw new Error('Test error')
  }
  return <div>No error</div>
}

// Component that throws an error in useEffect
const ThrowErrorInEffect: React.FC = () => {
  React.useEffect(() => {
    throw new Error('Effect error')
  }, [])
  return <div>Component with effect error</div>
}

describe('ErrorBoundary', () => {
  beforeEach(() => {
    // Suppress console.error for these tests
    jest.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('renders children when there is no error', () => {
    customRender(
      <ErrorBoundary>
        <div>Test content</div>
      </ErrorBoundary>
    )

    expect(screen.getByText('Test content')).toBeInTheDocument()
  })

  it('renders fallback UI when there is an error', () => {
    customRender(
      <ErrorBoundary fallbackMessage="Something went wrong">
        <ThrowError />
      </ErrorBoundary>
    )

    expect(screen.getByText('Something went wrong')).toBeInTheDocument()
    expect(screen.queryByText('No error')).not.toBeInTheDocument()
  })

  it('renders default fallback message when no custom message is provided', () => {
    customRender(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    )

    expect(screen.getByText('Something went wrong. Please refresh the page and try again.')).toBeInTheDocument()
  })

  it('calls onRetry when retry button is clicked', () => {
    const onRetry = jest.fn()
    
    customRender(
      <ErrorBoundary onRetry={onRetry}>
        <ThrowError />
      </ErrorBoundary>
    )

    const retryButton = screen.getByRole('button', { name: /retry/i })
    fireEvent.click(retryButton)

    expect(onRetry).toHaveBeenCalledTimes(1)
  })

  it('does not show retry button when onRetry is not provided', () => {
    customRender(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    )

    expect(screen.queryByRole('button', { name: /retry/i })).not.toBeInTheDocument()
  })

  it('handles errors thrown in useEffect', () => {
    customRender(
      <ErrorBoundary fallbackMessage="Effect error caught">
        <ThrowErrorInEffect />
      </ErrorBoundary>
    )

    expect(screen.getByText('Effect error caught')).toBeInTheDocument()
  })

  it('renders custom fallback component when provided', () => {
    const CustomFallback: React.FC<{ error: Error; retry: () => void }> = ({ error, retry }) => (
      <div>
        <p>Custom error: {error.message}</p>
        <button onClick={retry}>Custom Retry</button>
      </div>
    )

    customRender(
      <ErrorBoundary fallbackComponent={CustomFallback}>
        <ThrowError />
      </ErrorBoundary>
    )

    expect(screen.getByText('Custom error: Test error')).toBeInTheDocument()
    expect(screen.getByText('Custom Retry')).toBeInTheDocument()
  })

  it('logs error information', () => {
    const consoleSpy = jest.spyOn(console, 'error')
    
    customRender(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    )

    expect(consoleSpy).toHaveBeenCalled()
  })

  it('handles multiple errors', () => {
    const { rerender } = customRender(
      <ErrorBoundary fallbackMessage="First error">
        <ThrowError />
      </ErrorBoundary>
    )

    expect(screen.getByText('First error')).toBeInTheDocument()

    // Rerender with different error
    rerender(
      <ErrorBoundary fallbackMessage="Second error">
        <ThrowError />
      </ErrorBoundary>
    )

    expect(screen.getByText('Second error')).toBeInTheDocument()
  })

  it('recovers from error when child component stops throwing', () => {
    const { rerender } = customRender(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    )

    expect(screen.getByText('Something went wrong. Please refresh the page and try again.')).toBeInTheDocument()

    // Rerender with component that doesn't throw
    rerender(
      <ErrorBoundary>
        <ThrowError shouldThrow={false} />
      </ErrorBoundary>
    )

    expect(screen.getByText('No error')).toBeInTheDocument()
  })

  it('handles nested error boundaries', () => {
    customRender(
      <ErrorBoundary fallbackMessage="Outer boundary">
        <div>
          <ErrorBoundary fallbackMessage="Inner boundary">
            <ThrowError />
          </ErrorBoundary>
        </div>
      </ErrorBoundary>
    )

    // Inner boundary should catch the error
    expect(screen.getByText('Inner boundary')).toBeInTheDocument()
    expect(screen.queryByText('Outer boundary')).not.toBeInTheDocument()
  })

  it('provides error details to fallback component', () => {
    const CustomFallback: React.FC<{ error: Error; errorInfo: any }> = ({ error, errorInfo }) => (
      <div>
        <p>Error: {error.message}</p>
        <p>Stack: {error.stack}</p>
        <p>Component Stack: {errorInfo?.componentStack}</p>
      </div>
    )

    customRender(
      <ErrorBoundary fallbackComponent={CustomFallback}>
        <ThrowError />
      </ErrorBoundary>
    )

    expect(screen.getByText('Error: Test error')).toBeInTheDocument()
    expect(screen.getByText(/Stack:/)).toBeInTheDocument()
  })

  it('handles async errors', async () => {
    const AsyncErrorComponent: React.FC = () => {
      const [shouldThrow, setShouldThrow] = React.useState(false)

      React.useEffect(() => {
        const timer = setTimeout(() => {
          setShouldThrow(true)
        }, 100)
        return () => clearTimeout(timer)
      }, [])

      if (shouldThrow) {
        throw new Error('Async error')
      }

      return <div>Loading...</div>
    }

    customRender(
      <ErrorBoundary fallbackMessage="Async error caught">
        <AsyncErrorComponent />
      </ErrorBoundary>
    )

    expect(screen.getByText('Loading...')).toBeInTheDocument()

    // Wait for async error
    await new Promise(resolve => setTimeout(resolve, 150))

    expect(screen.getByText('Async error caught')).toBeInTheDocument()
  })

  it('handles errors in event handlers', () => {
    const EventHandlerError: React.FC = () => {
      const handleClick = () => {
        throw new Error('Event handler error')
      }

      return <button onClick={handleClick}>Click me</button>
    }

    customRender(
      <ErrorBoundary fallbackMessage="Event handler error caught">
        <EventHandlerError />
      </ErrorBoundary>
    )

    const button = screen.getByRole('button', { name: /click me/i })
    fireEvent.click(button)

    expect(screen.getByText('Event handler error caught')).toBeInTheDocument()
  })

  it('maintains error state across re-renders', () => {
    const { rerender } = customRender(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    )

    expect(screen.getByText('Something went wrong. Please refresh the page and try again.')).toBeInTheDocument()

    // Rerender with same props
    rerender(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    )

    // Should still show error
    expect(screen.getByText('Something went wrong. Please refresh the page and try again.')).toBeInTheDocument()
  })
})
