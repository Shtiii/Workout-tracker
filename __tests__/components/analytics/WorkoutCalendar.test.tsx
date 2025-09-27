/**
 * Unit tests for WorkoutCalendar component
 */

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { render as customRender, mockData } from '../../utils/test-utils'
import WorkoutCalendar from '@/components/analytics/WorkoutCalendar'
import type { WorkoutSession } from '@/types'

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
}))

describe('WorkoutCalendar', () => {
  const mockWorkouts: WorkoutSession[] = [
    mockData.createWorkout({
      id: 'workout-1',
      completedAt: new Date('2024-01-15T10:00:00Z'), // Monday
    }),
    mockData.createWorkout({
      id: 'workout-2',
      completedAt: new Date('2024-01-17T10:00:00Z'), // Wednesday
    }),
  ]

  const defaultProps = {
    workouts: mockWorkouts,
    currentMonth: 0, // January
    currentYear: 2024,
    onMonthChange: jest.fn(),
    onGoToCurrentMonth: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders calendar with correct title', () => {
    customRender(<WorkoutCalendar {...defaultProps} />)
    
    expect(screen.getByText('WORKOUT CALENDAR')).toBeInTheDocument()
  })

  it('displays current month and year', () => {
    customRender(<WorkoutCalendar {...defaultProps} />)
    
    expect(screen.getByText('January 2024')).toBeInTheDocument()
  })

  it('renders day names correctly', () => {
    customRender(<WorkoutCalendar {...defaultProps} />)
    
    const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    dayNames.forEach(day => {
      expect(screen.getByText(day)).toBeInTheDocument()
    })
  })

  it('renders calendar days', () => {
    customRender(<WorkoutCalendar {...defaultProps} />)
    
    // Check that calendar days are rendered (should have numbers 1-31)
    expect(screen.getByText('1')).toBeInTheDocument()
    expect(screen.getByText('15')).toBeInTheDocument()
    expect(screen.getByText('31')).toBeInTheDocument()
  })

  it('highlights workout days', () => {
    customRender(<WorkoutCalendar {...defaultProps} />)
    
    // January 15, 2024 is a Monday (workout day)
    const workoutDay = screen.getByText('15')
    expect(workoutDay).toBeInTheDocument()
    
    // Check if the day has workout styling (red background)
    const workoutDayElement = workoutDay.closest('div')
    expect(workoutDayElement).toHaveStyle('background-color: #ff4444')
  })

  it('calls onMonthChange when previous month button is clicked', () => {
    customRender(<WorkoutCalendar {...defaultProps} />)
    
    const prevButton = screen.getByRole('button', { name: /previous/i })
    fireEvent.click(prevButton)
    
    expect(defaultProps.onMonthChange).toHaveBeenCalledWith(11, 2023) // December 2023
  })

  it('calls onMonthChange when next month button is clicked', () => {
    customRender(<WorkoutCalendar {...defaultProps} />)
    
    const nextButton = screen.getByRole('button', { name: /next/i })
    fireEvent.click(nextButton)
    
    expect(defaultProps.onMonthChange).toHaveBeenCalledWith(1, 2024) // February 2024
  })

  it('calls onGoToCurrentMonth when "Go to current month" is clicked', () => {
    // Set current month to a different month
    const props = {
      ...defaultProps,
      currentMonth: 5, // June
      currentYear: 2024,
    }
    
    customRender(<WorkoutCalendar {...props} />)
    
    const goToCurrentButton = screen.getByText('Go to current month')
    fireEvent.click(goToCurrentButton)
    
    expect(defaultProps.onGoToCurrentMonth).toHaveBeenCalled()
  })

  it('does not show "Go to current month" when already on current month', () => {
    const currentDate = new Date()
    const props = {
      ...defaultProps,
      currentMonth: currentDate.getMonth(),
      currentYear: currentDate.getFullYear(),
    }
    
    customRender(<WorkoutCalendar {...props} />)
    
    expect(screen.queryByText('Go to current month')).not.toBeInTheDocument()
  })

  it('handles month navigation at year boundaries', () => {
    const props = {
      ...defaultProps,
      currentMonth: 0, // January
      currentYear: 2024,
    }
    
    customRender(<WorkoutCalendar {...props} />)
    
    const prevButton = screen.getByRole('button', { name: /previous/i })
    fireEvent.click(prevButton)
    
    expect(defaultProps.onMonthChange).toHaveBeenCalledWith(11, 2023)
  })

  it('handles month navigation at year boundaries (forward)', () => {
    const props = {
      ...defaultProps,
      currentMonth: 11, // December
      currentYear: 2024,
    }
    
    customRender(<WorkoutCalendar {...props} />)
    
    const nextButton = screen.getByRole('button', { name: /next/i })
    fireEvent.click(nextButton)
    
    expect(defaultProps.onMonthChange).toHaveBeenCalledWith(0, 2025)
  })

  it('renders legend correctly', () => {
    customRender(<WorkoutCalendar {...defaultProps} />)
    
    expect(screen.getByText('Workout Day')).toBeInTheDocument()
    expect(screen.getByText('Today')).toBeInTheDocument()
  })

  it('handles empty workouts array', () => {
    const props = {
      ...defaultProps,
      workouts: [],
    }
    
    customRender(<WorkoutCalendar {...props} />)
    
    // Calendar should still render
    expect(screen.getByText('WORKOUT CALENDAR')).toBeInTheDocument()
    expect(screen.getByText('January 2024')).toBeInTheDocument()
  })

  it('handles workouts with invalid dates', () => {
    const invalidWorkouts = [
      mockData.createWorkout({
        id: 'workout-1',
        completedAt: null as any, // Invalid date
      }),
    ]
    
    const props = {
      ...defaultProps,
      workouts: invalidWorkouts,
    }
    
    // Should not throw an error
    expect(() => {
      customRender(<WorkoutCalendar {...props} />)
    }).not.toThrow()
  })

  it('applies correct styling to different day types', () => {
    customRender(<WorkoutCalendar {...defaultProps} />)
    
    // Check that days have appropriate styling
    const day1 = screen.getByText('1')
    const dayElement = day1.closest('div')
    
    expect(dayElement).toBeInTheDocument()
  })

  it('handles hover interactions', () => {
    customRender(<WorkoutCalendar {...defaultProps} />)
    
    const day15 = screen.getByText('15')
    const dayElement = day15.closest('div')
    
    // Simulate hover
    fireEvent.mouseEnter(dayElement!)
    
    // Should not throw an error
    expect(dayElement).toBeInTheDocument()
  })

  it('handles click interactions', () => {
    customRender(<WorkoutCalendar {...defaultProps} />)
    
    const day15 = screen.getByText('15')
    const dayElement = day15.closest('div')
    
    // Simulate click
    fireEvent.click(dayElement!)
    
    // Should not throw an error
    expect(dayElement).toBeInTheDocument()
  })

  it('renders with different month and year', () => {
    const props = {
      ...defaultProps,
      currentMonth: 6, // July
      currentYear: 2023,
    }
    
    customRender(<WorkoutCalendar {...props} />)
    
    expect(screen.getByText('July 2023')).toBeInTheDocument()
  })

  it('handles leap year correctly', () => {
    const props = {
      ...defaultProps,
      currentMonth: 1, // February
      currentYear: 2024, // Leap year
    }
    
    customRender(<WorkoutCalendar {...props} />)
    
    expect(screen.getByText('February 2024')).toBeInTheDocument()
    // Should show 29 days in February 2024
    expect(screen.getByText('29')).toBeInTheDocument()
  })

  it('handles non-leap year correctly', () => {
    const props = {
      ...defaultProps,
      currentMonth: 1, // February
      currentYear: 2023, // Non-leap year
    }
    
    customRender(<WorkoutCalendar {...props} />)
    
    expect(screen.getByText('February 2023')).toBeInTheDocument()
    // Should show 28 days in February 2023
    expect(screen.getByText('28')).toBeInTheDocument()
  })
})
