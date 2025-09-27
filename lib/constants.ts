/**
 * Shared constants and configuration values for the workout tracker application
 * @fileoverview Contains all hardcoded values, cache settings, storage keys, and configuration
 */

// Cache Configuration
export const CACHE_CONFIG = {
  CACHE_NAME: 'workout-tracker-v1',
  STATIC_CACHE: 'workout-tracker-static-v1',
  DYNAMIC_CACHE: 'workout-tracker-dynamic-v1',
  MAX_CACHE_SIZE: 50,
  MAX_STATIC_CACHE_SIZE: 20,
  MAX_DYNAMIC_CACHE_SIZE: 30,
  CACHE_TTL: 7 * 24 * 60 * 60 * 1000, // 7 days
  STATIC_CACHE_TTL: 30 * 24 * 60 * 60 * 1000, // 30 days
  MAX_CACHED_ITEMS: 100,
  MAX_STATIC_CACHED_ITEMS: 50
} as const;

// Storage Configuration
export const STORAGE_CONFIG = {
  OFFLINE_WORKOUTS_KEY: 'offline-workouts',
  OFFLINE_PROGRAMS_KEY: 'offline-programs',
  ERROR_LOGS_KEY: 'app-error-logs',
  USER_PREFERENCES_KEY: 'user-preferences',
  THEME_KEY: 'app-theme',
  MAX_OFFLINE_WORKOUTS: 50,
  MAX_OFFLINE_PROGRAMS: 20,
  MAX_ERROR_LOGS: 50,
  MAX_STORAGE_QUOTA: 100,
  WARNING_THRESHOLD: 80
} as const;

// Service Worker Configuration
export const SW_CONFIG = {
  WORKOUT_SYNC_TAG: 'workout-sync',
  PROGRAM_SYNC_TAG: 'program-sync',
  MAX_RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 5000, // 5 seconds
  NETWORK_TIMEOUT: 10000, // 10 seconds
  UPDATE_CHECK_INTERVAL: 60000 // 1 minute
} as const;

// Error Logging Configuration
export const ERROR_CONFIG = {
  MAX_ERRORS_IN_MEMORY: 100,
  MAX_ERRORS_IN_STORAGE: 50,
  SEVERITY_LEVELS: {
    CRITICAL: 'critical',
    HIGH: 'high',
    MEDIUM: 'medium',
    LOW: 'low'
  } as const,
  ERROR_TYPES: {
    NETWORK: 'NETWORK',
    FIREBASE: 'FIREBASE',
    STORAGE: 'STORAGE',
    COMPONENT: 'COMPONENT',
    AUTHENTICATION: 'AUTHENTICATION',
    VALIDATION: 'VALIDATION',
    CACHE: 'CACHE',
    SYNC: 'SYNC',
    UNKNOWN: 'UNKNOWN'
  } as const
} as const;

// Application URLs for caching
export const APP_URLS = {
  CORE_PAGES: [
    '/',
    '/dashboard',
    '/workout',
    '/programs',
    '/analytics',
    '/goals-records'
  ],
  STATIC_ASSETS: [
    '/manifest.json',
    '/workout-icon-192.svg',
    '/workout-icon-512.svg'
  ],
  API_ENDPOINTS: {
    SYNC_WORKOUT: '/api/sync-workout',
    SYNC_PROGRAM: '/api/sync-program',
    HEALTH_CHECK: '/api/health'
  }
} as const;

// Performance Configuration
export const PERFORMANCE_CONFIG = {
  SEARCH_DEBOUNCE: 300,
  SAVE_DEBOUNCE: 1000,
  SYNC_DEBOUNCE: 2000,
  BATCH_SIZE: 10,
  MAX_CONCURRENT_REQUESTS: 3,
  DEFAULT_TIMEOUT: 5000,
  UPLOAD_TIMEOUT: 30000,
  SYNC_TIMEOUT: 15000
} as const;

// Firebase Configuration Constants
export const FIREBASE_CONFIG = {
  COLLECTIONS: {
    WORKOUTS: 'workouts',
    PROGRAMS: 'programs',
    USERS: 'users',
    GOALS: 'goals',
    RECORDS: 'records'
  },
  BATCH_SIZE: 500,
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000
} as const;

// UI Configuration
export const UI_CONFIG = {
  TOAST_DURATION: 3000,
  LOADING_DELAY: 200,
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
  CHART_COLORS: [
    '#3B82F6', // Blue
    '#10B981', // Green
    '#F59E0B', // Yellow
    '#EF4444', // Red
    '#8B5CF6', // Purple
    '#06B6D4'  // Cyan
  ]
} as const;

// Network Configuration
export const NETWORK_CONFIG = {
  SLOW_CONNECTIONS: ['slow-2g', '2g'],
  FAST_TIMEOUT: 3000,
  SLOW_TIMEOUT: 10000,
  RETRY_INTERVALS: [1000, 2000, 5000] // Progressive backoff
} as const;

// Validation Rules
export const VALIDATION_RULES = {
  // Workout validation
  WORKOUT: {
    MIN_DURATION: 1, // minutes
    MAX_DURATION: 480, // 8 hours
    MAX_EXERCISES: 50,
    MAX_SETS_PER_EXERCISE: 20
  },

  // Program validation
  PROGRAM: {
    MIN_NAME_LENGTH: 1,
    MAX_NAME_LENGTH: 100,
    MAX_DESCRIPTION_LENGTH: 500,
    MAX_WORKOUTS: 20
  },

  // Exercise validation
  EXERCISE: {
    MIN_NAME_LENGTH: 1,
    MAX_NAME_LENGTH: 100,
    MAX_SETS: 20,
    MAX_REPS: 1000,
    MAX_WEIGHT: 1000, // kg
    MIN_WEIGHT: 0
  },

  // Goal validation
  GOAL: {
    MIN_NAME_LENGTH: 1,
    MAX_NAME_LENGTH: 100,
    MAX_DESCRIPTION_LENGTH: 500,
    MIN_TARGET: 1,
    MAX_TARGET: 10000
  }
} as const;

// Development Configuration
export const DEV_CONFIG = {
  // Debug flags
  ENABLE_CONSOLE_LOGS: process.env.NODE_ENV === 'development',
  ENABLE_PERFORMANCE_MONITORING: true,

  // Mock data flags
  USE_MOCK_DATA: false,
  SIMULATE_SLOW_NETWORK: false,
  
  // Development tools
  ENABLE_HOT_RELOAD: true,
  ENABLE_DEVTOOLS: true,
  LOG_LEVEL: 'debug'
} as const;

// Export combined configuration object
export const CONFIG = {
  CACHE: CACHE_CONFIG,
  STORAGE: STORAGE_CONFIG,
  SW: SW_CONFIG,
  ERROR: ERROR_CONFIG,
  URLS: APP_URLS,
  PERFORMANCE: PERFORMANCE_CONFIG,
  FIREBASE: FIREBASE_CONFIG,
  UI: UI_CONFIG,
  NETWORK: NETWORK_CONFIG,
  VALIDATION: VALIDATION_RULES,
  DEV: DEV_CONFIG
} as const;

export default CONFIG;
