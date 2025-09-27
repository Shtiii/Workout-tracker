/**
 * Shared constants and configuration values for the workout tracker application
 * @fileoverview Contains all hardcoded values, cache settings, storage keys, and configuration
 */

// Cache Configuration
export const CACHE_CONFIG = {
  // Service Worker Cache Names
  CACHE_NAME: 'workout-tracker-v1',
  STATIC_CACHE: 'workout-tracker-static-v1',
  DYNAMIC_CACHE: 'workout-tracker-dynamic-v1',

  // Cache Size Limits (in MB)
  MAX_CACHE_SIZE: 50,
  MAX_STATIC_CACHE_SIZE: 20,
  MAX_DYNAMIC_CACHE_SIZE: 30,

  // Cache TTL (Time To Live) in milliseconds
  CACHE_TTL: 7 * 24 * 60 * 60 * 1000, // 7 days
  STATIC_CACHE_TTL: 30 * 24 * 60 * 60 * 1000, // 30 days

  // Maximum number of cached items
  MAX_CACHED_ITEMS: 100,
  MAX_STATIC_CACHED_ITEMS: 50
};

// Storage Configuration
export const STORAGE_CONFIG = {
  // localStorage Keys
  OFFLINE_WORKOUTS_KEY: 'offline-workouts',
  OFFLINE_PROGRAMS_KEY: 'offline-programs',
  ERROR_LOGS_KEY: 'app-error-logs',
  USER_PREFERENCES_KEY: 'user-preferences',
  THEME_KEY: 'app-theme',

  // Storage Limits
  MAX_OFFLINE_WORKOUTS: 50,
  MAX_OFFLINE_PROGRAMS: 20,
  MAX_ERROR_LOGS: 50,

  // Storage Quotas (in MB)
  MAX_STORAGE_QUOTA: 100,
  WARNING_THRESHOLD: 80 // Warn when 80% full
};

// Service Worker Configuration
export const SW_CONFIG = {
  // Background Sync Tags
  WORKOUT_SYNC_TAG: 'workout-sync',
  PROGRAM_SYNC_TAG: 'program-sync',

  // Retry Configuration
  MAX_RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 5000, // 5 seconds

  // Network Timeout
  NETWORK_TIMEOUT: 10000, // 10 seconds

  // Update Check Interval
  UPDATE_CHECK_INTERVAL: 60000 // 1 minute
};

// Error Logging Configuration
export const ERROR_CONFIG = {
  // Maximum errors to keep in memory
  MAX_ERRORS_IN_MEMORY: 100,
  MAX_ERRORS_IN_STORAGE: 50,

  // Error severity levels
  SEVERITY_LEVELS: {
    CRITICAL: 'critical',
    HIGH: 'high',
    MEDIUM: 'medium',
    LOW: 'low'
  },

  // Error types
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
  }
};

// Application URLs for caching
export const APP_URLS = {
  // Core pages to cache
  CORE_PAGES: [
    '/',
    '/dashboard',
    '/workout',
    '/programs',
    '/analytics',
    '/goals-records'
  ],

  // Static assets to cache
  STATIC_ASSETS: [
    '/manifest.json',
    '/workout-icon-192.svg',
    '/workout-icon-512.svg'
  ],

  // API endpoints
  API_ENDPOINTS: {
    SYNC_WORKOUT: '/api/sync-workout',
    SYNC_PROGRAM: '/api/sync-program',
    HEALTH_CHECK: '/api/health'
  }
};

// Performance Configuration
export const PERFORMANCE_CONFIG = {
  // Debounce delays (in milliseconds)
  SEARCH_DEBOUNCE: 300,
  SAVE_DEBOUNCE: 1000,
  SYNC_DEBOUNCE: 2000,

  // Batch processing
  BATCH_SIZE: 10,
  MAX_CONCURRENT_REQUESTS: 3,

  // Timeouts
  DEFAULT_TIMEOUT: 5000,
  UPLOAD_TIMEOUT: 30000,
  SYNC_TIMEOUT: 15000
};

// Firebase Configuration Constants
export const FIREBASE_CONFIG = {
  // Collection names
  COLLECTIONS: {
    WORKOUTS: 'workouts',
    PROGRAMS: 'programs',
    USERS: 'users',
    GOALS: 'goals',
    RECORDS: 'records'
  },

  // Batch size for Firestore operations
  BATCH_SIZE: 500,

  // Retry configuration
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000
};

// UI Configuration
export const UI_CONFIG = {
  // Animation durations (in milliseconds)
  TOAST_DURATION: 3000,
  LOADING_DELAY: 200,

  // Pagination
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,

  // Chart configuration
  CHART_COLORS: [
    '#3B82F6', // Blue
    '#10B981', // Green
    '#F59E0B', // Yellow
    '#EF4444', // Red
    '#8B5CF6', // Purple
    '#06B6D4'  // Cyan
  ]
};

// Network Configuration
export const NETWORK_CONFIG = {
  // Connection types to consider offline
  SLOW_CONNECTIONS: ['slow-2g', '2g'],

  // Network timeouts
  FAST_TIMEOUT: 3000,
  SLOW_TIMEOUT: 10000,

  // Retry intervals
  RETRY_INTERVALS: [1000, 2000, 5000] // Progressive backoff
};

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
};

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
};

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
};

export default CONFIG;