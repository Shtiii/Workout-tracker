/**
 * Integration tests for Analytics page
 */

import React from 'react'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { render as customRender, mockData } from '../utils/test-utils'
import AnalyticsPage from '@/app/analytics/page-refactored'

// Mock the analytics hooks
jest.mock('@/lib/hooks/useAnalyticsData', () => ({
  useAnalyticsData: jest.fn(),
  useProgressData: jest.fn(),
  useExerciseProgressCharts: jest.fn(),
}))

// Mock the analytics components
jest.mock('@/components/analytics/WorkoutCalendar', () => {
  return function MockWorkoutCalendar({ workouts, onMonthChange, onGoToCurrentMonth }: any) {
    return (
      <div data-testid="workout-calendar">
        <div>Workout Calendar</div>
        <div>Workouts: {workouts.length}</div>
        <button onClick={() => onMonthChange(0, 2024)}>Change Month</button>
        <button onClick={onGoToCurrentMonth}>Go to Current</button>
      </div>
    )
  }
})

jest.mock('@/components/analytics/ProgressView', () => {
  return function MockProgressView({ exerciseData, chartData, onProgramChange, onExerciseChange }: any) {
    return (
      <div data-testid="progress-view">
        <div>Progress View</div>
        <div>Exercises: {Object.keys(exerciseData).length}</div>
        <div>Charts: {chartData.length}</div>
        <button onClick={() => onProgramChange('Program A')}>Change Program</button>
        <button onClick={() => onExerciseChange('Bench Press')}>Change Exercise</button>
      </div>
    )
  }
})

jest.mock('@/components/analytics/HistoryView', () => {
  return function MockHistoryView({ allWorkouts, onDeleteWorkout }: any) {
    return (
      <div data-testid="history-view">
        <div>History View</div>
        <div>Workouts: {allWorkouts.length}</div>
        <button onClick={() => onDeleteWorkout('workout-1')}>Delete Workout</button>
      </div>
    )
  }
})

describe('Analytics Page Integration', () => {
  const mockWorkouts = [
    mockData.createWorkout({
      id: 'workout-1',
      programName: 'Program A',
      exercises: [
        {
          id: 'exercise-1',
          name: 'Bench Press',
          sets: [
            {
              id: 'set-1',
              weight: 100,
              reps: 10,
              completed: true,
            },
          ],
        },
      ],
    }),
    mockData.createWorkout({
      id: 'workout-2',
      programName: 'Program B',
      exercises: [
        {
          id: 'exercise-2',
          name: 'Squat',
          sets: [
            {
              id: 'set-2',
              weight: 150,
              reps: 8,
              completed: true,
            },
          ],
        },
      ],
    }),
  ]

  const mockPrograms = [
    mockData.createProgram({ id: 'program-1', name: 'Program A' }),
    mockData.createProgram({ id: 'program-2', name: 'Program B' }),
  ]

  const mockExerciseData = {
    'Bench Press': [
      {
        date: new Date('2024-01-01'),
        weight: 100,
        reps: 10,
        oneRepMax: 133.33,
        volume: 1000,
      },
    ],
    'Squat': [
      {
        date: new Date('2024-01-02'),
        weight: 150,
        reps: 8,
        oneRepMax: 180,
        volume: 1200,
      },
    ],
  }

  const mockChartData = [
    {
      name: 'Bench Press',
      data: [
        {
          date: 'Jan 1',
          weight: 100,
          fullDate: new Date('2024-01-01'),
        },
      ],
    },
  ]

  beforeEach(() => {
    const { useAnalyticsData, useProgressData, useExerciseProgressCharts } = require('@/lib/hooks/useAnalyticsData')
    
    useAnalyticsData.mockReturnValue({
      workouts: mockWorkouts,
      programs: mockPrograms,
      exerciseList: ['Bench Press', 'Squat'],
      allWorkouts: mockWorkouts,
      loading: false,
      error: null,
      fetchData: jest.fn(),
      deleteWorkout: jest.fn(),
    })

    useProgressData.mockReturnValue(mockExerciseData)
    useExerciseProgressCharts.mockReturnValue(mockChartData)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('renders analytics page with all tabs', async () => {
    customRender(<AnalyticsPage />)

    await waitFor(() => {
      expect(screen.getByText('ANALYTICS')).toBeInTheDocument()
    })

    // Check tabs
    expect(screen.getByRole('tab', { name: /calendar/i })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /progress/i })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /history/i })).toBeInTheDocument()
  })

  it('shows calendar view by default', async () => {
    customRender(<AnalyticsPage />)

    await waitFor(() => {
      expect(screen.getByTestId('workout-calendar')).toBeInTheDocument()
    })

    expect(screen.getByText('Workout Calendar')).toBeInTheDocument()
    expect(screen.getByText('Workouts: 2')).toBeInTheDocument()
  })

  it('switches to progress view when progress tab is clicked', async () => {
    customRender(<AnalyticsPage />)

    const progressTab = screen.getByRole('tab', { name: /progress/i })
    fireEvent.click(progressTab)

    await waitFor(() => {
      expect(screen.getByTestId('progress-view')).toBeInTheDocument()
    })

    expect(screen.getByText('Progress View')).toBeInTheDocument()
    expect(screen.getByText('Exercises: 2')).toBeInTheDocument()
    expect(screen.getByText('Charts: 1')).toBeInTheDocument()
  })

  it('switches to history view when history tab is clicked', async () => {
    customRender(<AnalyticsPage />)

    const historyTab = screen.getByRole('tab', { name: /history/i })
    fireEvent.click(historyTab)

    await waitFor(() => {
      expect(screen.getByTestId('history-view')).toBeInTheDocument()
    })

    expect(screen.getByText('History View')).toBeInTheDocument()
    expect(screen.getByText('Workouts: 2')).toBeInTheDocument()
  })

  it('handles calendar month navigation', async () => {
    customRender(<AnalyticsPage />)

    await waitFor(() => {
      expect(screen.getByTestId('workout-calendar')).toBeInTheDocument()
    })

    const changeMonthButton = screen.getByText('Change Month')
    fireEvent.click(changeMonthButton)

    // Calendar should still be visible
    expect(screen.getByTestId('workout-calendar')).toBeInTheDocument()
  })

  it('handles progress view filter changes', async () => {
    customRender(<AnalyticsPage />)

    const progressTab = screen.getByRole('tab', { name: /progress/i })
    fireEvent.click(progressTab)

    await waitFor(() => {
      expect(screen.getByTestId('progress-view')).toBeInTheDocument()
    })

    const changeProgramButton = screen.getByText('Change Program')
    fireEvent.click(changeProgramButton)

    // Progress view should still be visible
    expect(screen.getByTestId('progress-view')).toBeInTheDocument()
  })

  it('handles history view workout deletion', async () => {
    const mockDeleteWorkout = jest.fn()
    const { useAnalyticsData } = require('@/lib/hooks/useAnalyticsData')
    
    useAnalyticsData.mockReturnValue({
      workouts: mockWorkouts,
      programs: mockPrograms,
      exerciseList: ['Bench Press', 'Squat'],
      allWorkouts: mockWorkouts,
      loading: false,
      error: null,
      fetchData: jest.fn(),
      deleteWorkout: mockDeleteWorkout,
    })

    customRender(<AnalyticsPage />)

    const historyTab = screen.getByRole('tab', { name: /history/i })
    fireEvent.click(historyTab)

    await waitFor(() => {
      expect(screen.getByTestId('history-view')).toBeInTheDocument()
    })

    const deleteButton = screen.getByText('Delete Workout')
    fireEvent.click(deleteButton)

    expect(mockDeleteWorkout).toHaveBeenCalledWith('workout-1')
  })

  it('shows loading state', async () => {
    const { useAnalyticsData } = require('@/lib/hooks/useAnalyticsData')
    
    useAnalyticsData.mockReturnValue({
      workouts: [],
      programs: [],
      exerciseList: [],
      allWorkouts: [],
      loading: true,
      error: null,
      fetchData: jest.fn(),
      deleteWorkout: jest.fn(),
    })

    customRender(<AnalyticsPage />)

    await waitFor(() => {
      expect(screen.getByRole('progressbar')).toBeInTheDocument()
    })
  })

  it('shows error state', async () => {
    const { useAnalyticsData } = require('@/lib/hooks/useAnalyticsData')
    
    useAnalyticsData.mockReturnValue({
      workouts: [],
      programs: [],
      exerciseList: [],
      allWorkouts: [],
      loading: false,
      error: new Error('Test error'),
      fetchData: jest.fn(),
      deleteWorkout: jest.fn(),
    })

    customRender(<AnalyticsPage />)

    await waitFor(() => {
      expect(screen.getByText(/failed to load analytics data/i)).toBeInTheDocument()
    })
  })

  it('handles tab switching with different data', async () => {
    customRender(<AnalyticsPage />)

    // Start with calendar
    await waitFor(() => {
      expect(screen.getByTestId('workout-calendar')).toBeInTheDocument()
    })

    // Switch to progress
    const progressTab = screen.getByRole('tab', { name: /progress/i })
    fireEvent.click(progressTab)

    await waitFor(() => {
      expect(screen.getByTestId('progress-view')).toBeInTheDocument()
    })

    // Switch to history
    const historyTab = screen.getByRole('tab', { name: /history/i })
    fireEvent.click(historyTab)

    await waitFor(() => {
      expect(screen.getByTestId('history-view')).toBeInTheDocument()
    })

    // Switch back to calendar
    const calendarTab = screen.getByRole('tab', { name: /calendar/i })
    fireEvent.click(calendarTab)

    await waitFor(() => {
      expect(screen.getByTestId('workout-calendar')).toBeInTheDocument()
    })
  })

  it('maintains state across tab switches', async () => {
    customRender(<AnalyticsPage />)

    // Start with calendar
    await waitFor(() => {
      expect(screen.getByTestId('workout-calendar')).toBeInTheDocument()
    })

    // Switch to progress and change filters
    const progressTab = screen.getByRole('tab', { name: /progress/i })
    fireEvent.click(progressTab)

    await waitFor(() => {
      expect(screen.getByTestId('progress-view')).toBeInTheDocument()
    })

    const changeProgramButton = screen.getByText('Change Program')
    fireEvent.click(changeProgramButton)

    // Switch to history
    const historyTab = screen.getByRole('tab', { name: /history/i })
    fireEvent.click(historyTab)

    await waitFor(() => {
      expect(screen.getByTestId('history-view')).toBeInTheDocument()
    })

    // Switch back to progress - should maintain filter state
    fireEvent.click(progressTab)

    await waitFor(() => {
      expect(screen.getByTestId('progress-view')).toBeInTheDocument()
    })
  })

  it('handles empty data gracefully', async () => {
    const { useAnalyticsData, useProgressData, useExerciseProgressCharts } = require('@/lib/hooks/useAnalyticsData')
    
    useAnalyticsData.mockReturnValue({
      workouts: [],
      programs: [],
      exerciseList: [],
      allWorkouts: [],
      loading: false,
      error: null,
      fetchData: jest.fn(),
      deleteWorkout: jest.fn(),
    })

    useProgressData.mockReturnValue({})
    useExerciseProgressCharts.mockReturnValue([])

    customRender(<AnalyticsPage />)

    await waitFor(() => {
      expect(screen.getByTestId('workout-calendar')).toBeInTheDocument()
    })

    expect(screen.getByText('Workouts: 0')).toBeInTheDocument()
  })
})

