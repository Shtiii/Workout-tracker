/**
 * Unit tests for LoadingSpinner component
 */

import React from 'react'
import { render, screen } from '@testing-library/react'
import { render as customRender } from '../../utils/test-utils'
import LoadingSpinner from '@/components/loading/LoadingSpinner'

describe('LoadingSpinner', () => {
  it('renders loading spinner with default props', () => {
    customRender(<LoadingSpinner />)
    
    // Check for circular progress indicator
    const spinner = screen.getByRole('progressbar')
    expect(spinner).toBeInTheDocument()
  })

  it('renders with custom text', () => {
    customRender(<LoadingSpinner text="Loading workouts..." />)
    
    expect(screen.getByText('Loading workouts...')).toBeInTheDocument()
  })

  it('renders with custom size', () => {
    customRender(<LoadingSpinner size={60} />)
    
    const spinner = screen.getByRole('progressbar')
    expect(spinner).toBeInTheDocument()
  })

  it('renders with custom color', () => {
    customRender(<LoadingSpinner color="secondary" />)
    
    const spinner = screen.getByRole('progressbar')
    expect(spinner).toBeInTheDocument()
  })

  it('renders with overlay when fullScreen is true', () => {
    customRender(<LoadingSpinner fullScreen />)
    
    const spinner = screen.getByRole('progressbar')
    expect(spinner).toBeInTheDocument()
  })

  it('renders without text when text is not provided', () => {
    customRender(<LoadingSpinner />)
    
    const spinner = screen.getByRole('progressbar')
    expect(spinner).toBeInTheDocument()
    
    // Should not have any text content
    expect(screen.queryByText(/loading/i)).not.toBeInTheDocument()
  })

  it('applies custom className', () => {
    customRender(<LoadingSpinner className="custom-spinner" />)
    
    const spinner = screen.getByRole('progressbar')
    expect(spinner).toBeInTheDocument()
  })

  it('renders with different variants', () => {
    const { rerender } = customRender(<LoadingSpinner variant="determinate" value={50} />)
    
    let spinner = screen.getByRole('progressbar')
    expect(spinner).toBeInTheDocument()
    
    rerender(<LoadingSpinner variant="indeterminate" />)
    
    spinner = screen.getByRole('progressbar')
    expect(spinner).toBeInTheDocument()
  })

  it('handles fullScreen with custom text', () => {
    customRender(<LoadingSpinner fullScreen text="Please wait..." />)
    
    expect(screen.getByText('Please wait...')).toBeInTheDocument()
    const spinner = screen.getByRole('progressbar')
    expect(spinner).toBeInTheDocument()
  })

  it('renders with all props combined', () => {
    customRender(
      <LoadingSpinner 
        text="Loading data..."
        size={80}
        color="primary"
        fullScreen
        className="custom-class"
      />
    )
    
    expect(screen.getByText('Loading data...')).toBeInTheDocument()
    const spinner = screen.getByRole('progressbar')
    expect(spinner).toBeInTheDocument()
  })
})

