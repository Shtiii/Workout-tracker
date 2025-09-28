/**
 * Testing utilities and helpers for the workout tracker application
 */

import React, { ReactElement } from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { ThemeProvider } from '@mui/material/styles'
import { createTheme } from '@mui/material/styles'
import { CssBaseline } from '@mui/material'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ErrorBoundary } from '@/components/error/ErrorBoundary'
import { ErrorProvider } from '@/components/error/ErrorProvider'
import { LoadingProvider } from '@/components/loading/LoadingProvider'
import { AccessibilityProvider } from '@/components/accessibility/AccessibilityProvider'
import type { WorkoutSession, Program, User } from '@/types'

// Create a test theme
const testTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#ff4444',
    },
    secondary: {
      main: '#ffaa00',
    },
    background: {
      default: '#1a1a1a',
      paper: '#2a2a2a',
    },
    text: {
      primary: '#ffffff',
      secondary: '#cccccc',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
  },
})

// Create a test query client
const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      cacheTime: 0,
    },
    mutations: {
      retry: false,
    },
  },
})

// Custom render function with providers
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  theme?: typeof testTheme
  queryClient?: QueryClient
  withErrorBoundary?: boolean
  withErrorProvider?: boolean
  withLoadingProvider?: boolean
  withAccessibilityProvider?: boolean
}

const AllTheProviders: React.FC<{
  children: React.ReactNode
  theme?: typeof testTheme
  queryClient?: QueryClient
  withErrorBoundary?: boolean
  withErrorProvider?: boolean
  withLoadingProvider?: boolean
  withAccessibilityProvider?: boolean
}> = ({
  children,
  theme = testTheme,
  queryClient = createTestQueryClient(),
  withErrorBoundary = false,
  withErrorProvider = false,
  withLoadingProvider = false,
  withAccessibilityProvider = false,
}) => {
  let content = children

  if (withAccessibilityProvider) {
    content = <AccessibilityProvider>{content}</AccessibilityProvider>
  }

  if (withLoadingProvider) {
    content = <LoadingProvider>{content}</LoadingProvider>
  }

  if (withErrorProvider) {
    content = <ErrorProvider>{content}</ErrorProvider>
  }

  if (withErrorBoundary) {
    content = (
      <ErrorBoundary fallbackMessage="Test error boundary">
        {content}
      </ErrorBoundary>
    )
  }

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {content}
      </ThemeProvider>
    </QueryClientProvider>
  )
}

const customRender = (
  ui: ReactElement,
  options: CustomRenderOptions = {}
) => {
  const {
    theme,
    queryClient,
    withErrorBoundary,
    withErrorProvider,
    withLoadingProvider,
    withAccessibilityProvider,
    ...renderOptions
  } = options

  return render(ui, {
    wrapper: (props) => (
      <AllTheProviders
        {...props}
        theme={theme}
        queryClient={queryClient}
        withErrorBoundary={withErrorBoundary}
        withErrorProvider={withErrorProvider}
        withLoadingProvider={withLoadingProvider}
        withAccessibilityProvider={withAccessibilityProvider}
      />
    ),
    ...renderOptions,
  })
}

// Mock data generators
export const mockData = {
  createWorkout: (overrides: Partial<WorkoutSession> = {}): WorkoutSession => ({
    id: 'workout-1',
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
          {
            id: 'set-2',
            weight: 105,
            reps: 8,
            completed: true,
          },
        ],
      },
      {
        id: 'exercise-2',
        name: 'Squat',
        sets: [
          {
            id: 'set-3',
            weight: 150,
            reps: 12,
            completed: true,
          },
        ],
      },
    ],
    startTime: new Date('2024-01-01T10:00:00Z'),
    endTime: new Date('2024-01-01T11:00:00Z'),
    completedAt: new Date('2024-01-01T11:00:00Z'),
    duration: 60,
    notes: 'Great workout!',
    ...overrides,
  }),

  createProgram: (overrides: Partial<Program> = {}): Program => ({
    id: 'program-1',
    name: 'Test Program',
    description: 'A comprehensive test program',
    workouts: [],
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-01T00:00:00Z'),
    ...overrides,
  }),

  createUser: (overrides: Partial<User> = {}): User => ({
    uid: 'user-1',
    email: 'test@example.com',
    displayName: 'Test User',
    photoURL: 'https://example.com/avatar.jpg',
    createdAt: new Date('2024-01-01T00:00:00Z'),
    lastLoginAt: new Date('2024-01-01T00:00:00Z'),
    ...overrides,
  }),

  createExercise: (overrides = {}) => ({
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
    notes: 'Test exercise',
    ...overrides,
  }),

  createSet: (overrides = {}) => ({
    id: 'set-1',
    weight: 100,
    reps: 10,
    completed: true,
    restTime: 60,
    ...overrides,
  }),
}

// Mock Firebase responses
export const mockFirebase = {
  createFirestoreResponse: (data: any[]) => ({
    docs: data.map((item, index) => ({
      id: item.id || `mock-id-${index}`,
      data: () => item,
      exists: () => true,
      ref: {
        id: item.id || `mock-id-${index}`,
      },
    })),
    empty: data.length === 0,
    size: data.length,
    forEach: (callback: (doc: any) => void) => {
      data.forEach((item, index) => {
        callback({
          id: item.id || `mock-id-${index}`,
          data: () => item,
        })
      })
    },
  }),

  createFirestoreDoc: (data: any, id?: string) => ({
    id: id || 'mock-doc-id',
    data: () => data,
    exists: () => true,
    ref: {
      id: id || 'mock-doc-id',
    },
  }),
}

// Mock service worker
export const mockServiceWorker = {
  createMessageChannel: () => ({
    port1: {
      onmessage: jest.fn(),
      postMessage: jest.fn(),
    },
    port2: {
      onmessage: jest.fn(),
      postMessage: jest.fn(),
    },
  }),

  createServiceWorkerRegistration: () => ({
    active: {
      postMessage: jest.fn(),
    },
    installing: null,
    waiting: null,
    update: jest.fn(),
    unregister: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
  }),
}

// Mock localStorage
export const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  key: jest.fn(),
  length: 0,
}

// Mock sessionStorage
export const mockSessionStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  key: jest.fn(),
  length: 0,
}

// Mock fetch responses
export const mockFetch = {
  success: (data: any) => Promise.resolve({
    ok: true,
    status: 200,
    json: () => Promise.resolve(data),
    text: () => Promise.resolve(JSON.stringify(data)),
  }),

  error: (status: number = 500, message: string = 'Internal Server Error') => Promise.resolve({
    ok: false,
    status,
    json: () => Promise.resolve({ error: message }),
    text: () => Promise.resolve(JSON.stringify({ error: message })),
  }),

  networkError: () => Promise.reject(new Error('Network error')),
}

// Test helpers
export const testHelpers = {
  waitFor: (ms: number) => new Promise(resolve => setTimeout(resolve, ms)),

  waitForElement: async (getter: () => HTMLElement | null, timeout = 1000) => {
    const start = Date.now()
    while (Date.now() - start < timeout) {
      const element = getter()
      if (element) return element
      await testHelpers.waitFor(10)
    }
    throw new Error(`Element not found within ${timeout}ms`)
  },

  waitForText: async (text: string, timeout = 1000) => {
    const start = Date.now()
    while (Date.now() - start < timeout) {
      if (document.body.textContent?.includes(text)) {
        return true
      }
      await testHelpers.waitFor(10)
    }
    throw new Error(`Text "${text}" not found within ${timeout}ms`)
  },

  simulateUserEvent: {
    click: (element: HTMLElement) => {
      element.click()
    },
    type: (element: HTMLInputElement, text: string) => {
      element.value = text
      element.dispatchEvent(new Event('input', { bubbles: true }))
    },
    keyDown: (element: HTMLElement, key: string) => {
      element.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }))
    },
    keyUp: (element: HTMLElement, key: string) => {
      element.dispatchEvent(new KeyboardEvent('keyup', { key, bubbles: true }))
    },
  },

  createMockEvent: (type: string, options: any = {}) => {
    const event = new Event(type, { bubbles: true, ...options })
    return event
  },

  createMockKeyboardEvent: (type: string, key: string, options: any = {}) => {
    const event = new KeyboardEvent(type, { key, bubbles: true, ...options })
    return event
  },

  createMockMouseEvent: (type: string, options: any = {}) => {
    const event = new MouseEvent(type, { bubbles: true, ...options })
    return event
  },
}

// Custom matchers
export const customMatchers = {
  toBeInTheDocument: (received: HTMLElement) => {
    const pass = document.body.contains(received)
    return {
      pass,
      message: () => `Expected element ${pass ? 'not ' : ''}to be in the document`,
    }
  },

  toHaveTextContent: (received: HTMLElement, expected: string) => {
    const pass = received.textContent?.includes(expected) || false
    return {
      pass,
      message: () => `Expected element to ${pass ? 'not ' : ''}have text content "${expected}"`,
    }
  },

  toHaveClass: (received: HTMLElement, expected: string) => {
    const pass = received.classList.contains(expected)
    return {
      pass,
      message: () => `Expected element to ${pass ? 'not ' : ''}have class "${expected}"`,
    }
  },
}

// Export everything
export * from '@testing-library/react'
export { customRender as render }
export { testTheme }
export { createTestQueryClient }

