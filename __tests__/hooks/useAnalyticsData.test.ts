/**
 * Unit tests for useAnalyticsData hook
 */

import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useAnalyticsData, useProgressData, useExerciseProgressCharts } from '@/lib/hooks/useAnalyticsData'
import { mockData } from '../utils/test-utils'
import type { WorkoutSession, Program } from '@/types'

// Mock Firebase
jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  getDocs: jest.fn(),
  deleteDoc: jest.fn(),
  doc: jest.fn(),
  query: jest.fn(),
  orderBy: jest.fn(),
}))

// Mock Firebase db
jest.mock('@/lib/firebase', () => ({
  db: {},
}))

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })
  
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}

describe('useAnalyticsData', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should initialize with default values', () => {
    const { result } = renderHook(() => useAnalyticsData(), {
      wrapper: createWrapper(),
    })

    expect(result.current.workouts).toEqual([])
    expect(result.current.programs).toEqual([])
    expect(result.current.exerciseList).toEqual([])
    expect(result.current.allWorkouts).toEqual([])
    expect(result.current.loading).toBe(true)
    expect(result.current.error).toBe(null)
  })

  it('should fetch data successfully', async () => {
    const mockWorkouts = [mockData.createWorkout()]
    const mockPrograms = [mockData.createProgram()]

    const { getDocs } = require('firebase/firestore')
    getDocs.mockResolvedValueOnce({
      docs: mockWorkouts.map(workout => ({
        id: workout.id,
        data: () => workout,
      })),
    }).mockResolvedValueOnce({
      docs: mockPrograms.map(program => ({
        id: program.id,
        data: () => program,
      })),
    })

    const { result } = renderHook(() => useAnalyticsData(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.workouts).toHaveLength(1)
    expect(result.current.programs).toHaveLength(1)
    expect(result.current.exerciseList).toContain('Bench Press')
    expect(result.current.allWorkouts).toHaveLength(1)
  })

  it('should handle fetch errors', async () => {
    const { getDocs } = require('firebase/firestore')
    getDocs.mockRejectedValue(new Error('Firebase error'))

    const { result } = renderHook(() => useAnalyticsData(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.error).toBeInstanceOf(Error)
    expect(result.current.error?.message).toBe('Firebase error')
  })

  it('should delete workout successfully', async () => {
    const mockWorkouts = [mockData.createWorkout()]
    const { getDocs, deleteDoc } = require('firebase/firestore')
    
    getDocs.mockResolvedValue({
      docs: mockWorkouts.map(workout => ({
        id: workout.id,
        data: () => workout,
      })),
    })
    deleteDoc.mockResolvedValue(undefined)

    // Mock confirm dialog
    global.confirm = jest.fn(() => true)

    const { result } = renderHook(() => useAnalyticsData(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    await result.current.deleteWorkout('workout-1')

    expect(deleteDoc).toHaveBeenCalled()
  })

  it('should not delete workout when user cancels', async () => {
    const mockWorkouts = [mockData.createWorkout()]
    const { getDocs, deleteDoc } = require('firebase/firestore')
    
    getDocs.mockResolvedValue({
      docs: mockWorkouts.map(workout => ({
        id: workout.id,
        data: () => workout,
      })),
    })

    // Mock confirm dialog to return false
    global.confirm = jest.fn(() => false)

    const { result } = renderHook(() => useAnalyticsData(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    await result.current.deleteWorkout('workout-1')

    expect(deleteDoc).not.toHaveBeenCalled()
  })
})

describe('useProgressData', () => {
  it('should process workout data correctly', () => {
    const workouts = [
      mockData.createWorkout({
        programName: 'Test Program',
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
    ]

    const { result } = renderHook(() => 
      useProgressData(workouts, 'all', 'all')
    )

    expect(result.current).toHaveProperty('Bench Press')
    expect(result.current['Bench Press']).toHaveLength(1)
    expect(result.current['Bench Press'][0]).toMatchObject({
      weight: 100,
      reps: 10,
      oneRepMax: expect.any(Number),
      volume: 1000,
    })
  })

  it('should filter by program', () => {
    const workouts = [
      mockData.createWorkout({
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

    const { result } = renderHook(() => 
      useProgressData(workouts, 'Program A', 'all')
    )

    expect(result.current).toHaveProperty('Bench Press')
    expect(result.current).not.toHaveProperty('Squat')
  })

  it('should filter by exercise', () => {
    const workouts = [
      mockData.createWorkout({
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

    const { result } = renderHook(() => 
      useProgressData(workouts, 'all', 'Bench Press')
    )

    expect(result.current).toHaveProperty('Bench Press')
    expect(result.current).not.toHaveProperty('Squat')
  })

  it('should handle empty workouts', () => {
    const { result } = renderHook(() => 
      useProgressData([], 'all', 'all')
    )

    expect(result.current).toEqual({})
  })

  it('should handle workouts without exercises', () => {
    const workouts = [
      mockData.createWorkout({
        exercises: [],
      }),
    ]

    const { result } = renderHook(() => 
      useProgressData(workouts, 'all', 'all')
    )

    expect(result.current).toEqual({})
  })

  it('should handle exercises without sets', () => {
    const workouts = [
      mockData.createWorkout({
        exercises: [
          {
            id: 'exercise-1',
            name: 'Bench Press',
            sets: [],
          },
        ],
      }),
    ]

    const { result } = renderHook(() => 
      useProgressData(workouts, 'all', 'all')
    )

    expect(result.current).toEqual({})
  })
})

describe('useExerciseProgressCharts', () => {
  it('should generate chart data correctly', () => {
    const workouts = [
      mockData.createWorkout({
        programName: 'Test Program',
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
    ]

    const { result } = renderHook(() => 
      useExerciseProgressCharts(workouts, 'all', 'all')
    )

    expect(result.current).toHaveLength(1)
    expect(result.current[0]).toMatchObject({
      name: 'Bench Press',
      data: expect.arrayContaining([
        expect.objectContaining({
          date: expect.any(String),
          weight: 100,
          fullDate: expect.any(Date),
        }),
      ]),
    })
  })

  it('should filter by program', () => {
    const workouts = [
      mockData.createWorkout({
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

    const { result } = renderHook(() => 
      useExerciseProgressCharts(workouts, 'Program A', 'all')
    )

    expect(result.current).toHaveLength(1)
    expect(result.current[0].name).toBe('Bench Press')
  })

  it('should filter by exercise', () => {
    const workouts = [
      mockData.createWorkout({
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

    const { result } = renderHook(() => 
      useExerciseProgressCharts(workouts, 'all', 'Bench Press')
    )

    expect(result.current).toHaveLength(1)
    expect(result.current[0].name).toBe('Bench Press')
  })

  it('should limit to top 4 exercises', () => {
    const workouts = Array.from({ length: 10 }, (_, i) => 
      mockData.createWorkout({
        exercises: [
          {
            id: `exercise-${i}`,
            name: `Exercise ${i}`,
            sets: [
              {
                id: `set-${i}`,
                weight: 100 + i,
                reps: 10,
                completed: true,
              },
            ],
          },
        ],
      })
    )

    const { result } = renderHook(() => 
      useExerciseProgressCharts(workouts, 'all', 'all')
    )

    expect(result.current).toHaveLength(4)
  })

  it('should only include exercises with at least 2 data points', () => {
    const workouts = [
      mockData.createWorkout({
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
    ]

    const { result } = renderHook(() => 
      useExerciseProgressCharts(workouts, 'all', 'all')
    )

    expect(result.current).toHaveLength(0)
  })

  it('should sort exercises by data point count', () => {
    const workouts = [
      // Exercise with 1 data point
      mockData.createWorkout({
        exercises: [
          {
            id: 'exercise-1',
            name: 'Exercise A',
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
      // Exercise with 3 data points
      ...Array.from({ length: 3 }, (_, i) => 
        mockData.createWorkout({
          exercises: [
            {
              id: 'exercise-2',
              name: 'Exercise B',
              sets: [
                {
                  id: `set-${i}`,
                  weight: 100,
                  reps: 10,
                  completed: true,
                },
              ],
            },
          ],
        })
      ),
    ]

    const { result } = renderHook(() => 
      useExerciseProgressCharts(workouts, 'all', 'all')
    )

    expect(result.current).toHaveLength(1)
    expect(result.current[0].name).toBe('Exercise B')
  })

  it('should limit data points to last 10', () => {
    const workouts = Array.from({ length: 15 }, (_, i) => 
      mockData.createWorkout({
        exercises: [
          {
            id: 'exercise-1',
            name: 'Bench Press',
            sets: [
              {
                id: `set-${i}`,
                weight: 100,
                reps: 10,
                completed: true,
              },
            ],
          },
        ],
      })
    )

    const { result } = renderHook(() => 
      useExerciseProgressCharts(workouts, 'all', 'all')
    )

    expect(result.current[0].data).toHaveLength(10)
  })

  it('should handle empty workouts', () => {
    const { result } = renderHook(() => 
      useExerciseProgressCharts([], 'all', 'all')
    )

    expect(result.current).toEqual([])
  })
})
