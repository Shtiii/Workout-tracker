/**
 * @fileoverview Centralized utility functions for the workout tracker application
 * Provides reusable helper functions for common operations
 *
 * @author Workout Tracker Team
 * @version 1.0.0
 */

import { PERFORMANCE_CONFIG, VALIDATION_RULES, UI_CONFIG } from '../constants.js';

// =============================================================================
// VALIDATION UTILITIES
// =============================================================================

/**
 * Validates workout data structure and values
 *
 * @param {Object} workoutData - The workout data to validate
 * @param {string} workoutData.name - Workout name
 * @param {Array} workoutData.exercises - Array of exercises
 * @param {number} workoutData.duration - Duration in minutes
 *
 * @returns {Object} Validation result with isValid boolean and errors array
 *
 * @example
 * const result = validateWorkout({
 *   name: 'Morning Run',
 *   exercises: [{ name: 'Running', duration: 30 }],
 *   duration: 30
 * });
 * if (!result.isValid) {
 *   console.error('Validation errors:', result.errors);
 * }
 */
export const validateWorkout = (workoutData) => {
  const errors = [];

  if (!workoutData) {
    errors.push('Workout data is required');
    return { isValid: false, errors };
  }

  // Validate name
  if (!workoutData.name || typeof workoutData.name !== 'string') {
    errors.push('Workout name is required and must be a string');
  }

  // Validate duration
  const duration = parseFloat(workoutData.duration);
  if (isNaN(duration) || duration < VALIDATION_RULES.WORKOUT.MIN_DURATION) {
    errors.push(`Duration must be at least ${VALIDATION_RULES.WORKOUT.MIN_DURATION} minute(s)`);
  }
  if (duration > VALIDATION_RULES.WORKOUT.MAX_DURATION) {
    errors.push(`Duration cannot exceed ${VALIDATION_RULES.WORKOUT.MAX_DURATION} minutes`);
  }

  // Validate exercises
  if (!Array.isArray(workoutData.exercises)) {
    errors.push('Exercises must be an array');
  } else {
    if (workoutData.exercises.length === 0) {
      errors.push('At least one exercise is required');
    }
    if (workoutData.exercises.length > VALIDATION_RULES.WORKOUT.MAX_EXERCISES) {
      errors.push(`Cannot exceed ${VALIDATION_RULES.WORKOUT.MAX_EXERCISES} exercises`);
    }

    workoutData.exercises.forEach((exercise, index) => {
      if (!exercise.name) {
        errors.push(`Exercise ${index + 1} must have a name`);
      }
      if (exercise.sets && exercise.sets.length > VALIDATION_RULES.WORKOUT.MAX_SETS_PER_EXERCISE) {
        errors.push(`Exercise ${index + 1} cannot exceed ${VALIDATION_RULES.WORKOUT.MAX_SETS_PER_EXERCISE} sets`);
      }
    });
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Validates program data structure and values
 *
 * @param {Object} programData - The program data to validate
 *
 * @returns {Object} Validation result with isValid boolean and errors array
 */
export const validateProgram = (programData) => {
  const errors = [];

  if (!programData) {
    errors.push('Program data is required');
    return { isValid: false, errors };
  }

  // Validate name
  if (!programData.name || typeof programData.name !== 'string') {
    errors.push('Program name is required and must be a string');
  } else {
    if (programData.name.length < VALIDATION_RULES.PROGRAM.MIN_NAME_LENGTH) {
      errors.push(`Program name must be at least ${VALIDATION_RULES.PROGRAM.MIN_NAME_LENGTH} character(s)`);
    }
    if (programData.name.length > VALIDATION_RULES.PROGRAM.MAX_NAME_LENGTH) {
      errors.push(`Program name cannot exceed ${VALIDATION_RULES.PROGRAM.MAX_NAME_LENGTH} characters`);
    }
  }

  // Validate description
  if (programData.description && programData.description.length > VALIDATION_RULES.PROGRAM.MAX_DESCRIPTION_LENGTH) {
    errors.push(`Description cannot exceed ${VALIDATION_RULES.PROGRAM.MAX_DESCRIPTION_LENGTH} characters`);
  }

  // Validate workouts
  if (programData.workouts && programData.workouts.length > VALIDATION_RULES.PROGRAM.MAX_WORKOUTS) {
    errors.push(`Program cannot exceed ${VALIDATION_RULES.PROGRAM.MAX_WORKOUTS} workouts`);
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

// =============================================================================
// DEBOUNCE AND THROTTLE UTILITIES
// =============================================================================

/**
 * Creates a debounced function that delays execution until after delay milliseconds
 *
 * @param {Function} func - The function to debounce
 * @param {number} delay - The delay in milliseconds
 *
 * @returns {Function} The debounced function
 *
 * @example
 * const debouncedSearch = debounce((query) => {
 *   performSearch(query);
 * }, 300);
 */
export const debounce = (func, delay) => {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(null, args), delay);
  };
};

/**
 * Creates a throttled function that only executes at most once per delay period
 *
 * @param {Function} func - The function to throttle
 * @param {number} delay - The delay in milliseconds
 *
 * @returns {Function} The throttled function
 */
export const throttle = (func, delay) => {
  let timeoutId;
  let lastExecTime = 0;
  return (...args) => {
    const currentTime = Date.now();
    if (currentTime - lastExecTime > delay) {
      func.apply(null, args);
      lastExecTime = currentTime;
    } else {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        func.apply(null, args);
        lastExecTime = Date.now();
      }, delay - (currentTime - lastExecTime));
    }
  };
};

// =============================================================================
// DATE AND TIME UTILITIES
// =============================================================================

/**
 * Formats a date for display
 *
 * @param {Date|string} date - The date to format
 * @param {Object} [options] - Formatting options
 * @param {boolean} [options.includeTime=false] - Whether to include time
 * @param {string} [options.locale='en-US'] - Locale for formatting
 *
 * @returns {string} Formatted date string
 */
export const formatDate = (date, options = {}) => {
  const { includeTime = false, locale = 'en-US' } = options;

  const dateObj = date instanceof Date ? date : new Date(date);

  if (isNaN(dateObj.getTime())) {
    return 'Invalid Date';
  }

  const formatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...(includeTime && {
      hour: '2-digit',
      minute: '2-digit'
    })
  };

  return dateObj.toLocaleDateString(locale, formatOptions);
};

/**
 * Formats duration in minutes to human-readable string
 *
 * @param {number} minutes - Duration in minutes
 *
 * @returns {string} Human-readable duration
 *
 * @example
 * formatDuration(90) // "1h 30m"
 * formatDuration(45) // "45m"
 */
export const formatDuration = (minutes) => {
  if (isNaN(minutes) || minutes < 0) {
    return '0m';
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (hours === 0) {
    return `${remainingMinutes}m`;
  }

  if (remainingMinutes === 0) {
    return `${hours}h`;
  }

  return `${hours}h ${remainingMinutes}m`;
};

/**
 * Gets relative time string (e.g., "2 hours ago", "yesterday")
 *
 * @param {Date|string} date - The date to compare
 *
 * @returns {string} Relative time string
 */
export const getRelativeTime = (date) => {
  const now = new Date();
  const dateObj = date instanceof Date ? date : new Date(date);
  const diffMs = now - dateObj;
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMinutes < 1) return 'Just now';
  if (diffMinutes < 60) return `${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;

  return formatDate(dateObj);
};

// =============================================================================
// NUMBER AND MATH UTILITIES
// =============================================================================

/**
 * Safely parses a number with fallback
 *
 * @param {any} value - Value to parse
 * @param {number} [fallback=0] - Fallback value if parsing fails
 *
 * @returns {number} Parsed number or fallback
 */
export const safeParseNumber = (value, fallback = 0) => {
  const parsed = parseFloat(value);
  return isNaN(parsed) ? fallback : parsed;
};

/**
 * Rounds a number to specified decimal places
 *
 * @param {number} number - Number to round
 * @param {number} [decimals=2] - Number of decimal places
 *
 * @returns {number} Rounded number
 */
export const roundTo = (number, decimals = 2) => {
  const factor = Math.pow(10, decimals);
  return Math.round(number * factor) / factor;
};

/**
 * Clamps a number between min and max values
 *
 * @param {number} value - Value to clamp
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 *
 * @returns {number} Clamped value
 */
export const clamp = (value, min, max) => {
  return Math.min(Math.max(value, min), max);
};

// =============================================================================
// STRING UTILITIES
// =============================================================================

/**
 * Capitalizes the first letter of a string
 *
 * @param {string} str - String to capitalize
 *
 * @returns {string} Capitalized string
 */
export const capitalize = (str) => {
  if (!str || typeof str !== 'string') return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

/**
 * Truncates text to specified length with ellipsis
 *
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum length
 * @param {string} [suffix='...'] - Suffix to add when truncated
 *
 * @returns {string} Truncated text
 */
export const truncateText = (text, maxLength, suffix = '...') => {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength - suffix.length) + suffix;
};

/**
 * Generates a random ID string
 *
 * @param {number} [length=8] - Length of the ID
 *
 * @returns {string} Random ID
 */
export const generateId = (length = 8) => {
  return Math.random().toString(36).substr(2, length);
};

// =============================================================================
// ARRAY UTILITIES
// =============================================================================

/**
 * Groups array items by a specified key
 *
 * @param {Array} array - Array to group
 * @param {string|Function} keyOrFn - Key or function to group by
 *
 * @returns {Object} Grouped object
 *
 * @example
 * const workouts = [
 *   { name: 'Run', type: 'cardio' },
 *   { name: 'Squat', type: 'strength' }
 * ];
 * const grouped = groupBy(workouts, 'type');
 * // { cardio: [...], strength: [...] }
 */
export const groupBy = (array, keyOrFn) => {
  return array.reduce((groups, item) => {
    const key = typeof keyOrFn === 'function' ? keyOrFn(item) : item[keyOrFn];
    (groups[key] = groups[key] || []).push(item);
    return groups;
  }, {});
};

/**
 * Removes duplicate items from array
 *
 * @param {Array} array - Array to deduplicate
 * @param {string|Function} [keyOrFn] - Key or function for comparison
 *
 * @returns {Array} Deduplicated array
 */
export const unique = (array, keyOrFn) => {
  if (!keyOrFn) {
    return [...new Set(array)];
  }

  const seen = new Set();
  return array.filter(item => {
    const key = typeof keyOrFn === 'function' ? keyOrFn(item) : item[keyOrFn];
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
};

/**
 * Sorts array by multiple criteria
 *
 * @param {Array} array - Array to sort
 * @param {Array} sortConfig - Array of sort configurations
 *
 * @returns {Array} Sorted array
 *
 * @example
 * const sorted = sortBy(workouts, [
 *   { key: 'date', direction: 'desc' },
 *   { key: 'name', direction: 'asc' }
 * ]);
 */
export const sortBy = (array, sortConfig) => {
  return [...array].sort((a, b) => {
    for (const { key, direction = 'asc' } of sortConfig) {
      const aVal = typeof key === 'function' ? key(a) : a[key];
      const bVal = typeof key === 'function' ? key(b) : b[key];

      if (aVal < bVal) return direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return direction === 'asc' ? 1 : -1;
    }
    return 0;
  });
};

// =============================================================================
// STORAGE UTILITIES
// =============================================================================

/**
 * Safely gets item from localStorage with JSON parsing
 *
 * @param {string} key - Storage key
 * @param {any} [defaultValue=null] - Default value if key doesn't exist
 *
 * @returns {any} Parsed value or default
 */
export const getStorageItem = (key, defaultValue = null) => {
  if (typeof window === 'undefined') return defaultValue;

  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.warn(`Failed to get storage item '${key}':`, error);
    return defaultValue;
  }
};

/**
 * Safely sets item to localStorage with JSON stringification
 *
 * @param {string} key - Storage key
 * @param {any} value - Value to store
 *
 * @returns {boolean} Success status
 */
export const setStorageItem = (key, value) => {
  if (typeof window === 'undefined') return false;

  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.warn(`Failed to set storage item '${key}':`, error);
    return false;
  }
};

// =============================================================================
// ASYNC UTILITIES
// =============================================================================

/**
 * Creates a promise that resolves after specified delay
 *
 * @param {number} ms - Delay in milliseconds
 *
 * @returns {Promise} Promise that resolves after delay
 */
export const sleep = (ms) => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

/**
 * Retries an async function with exponential backoff
 *
 * @param {Function} fn - Async function to retry
 * @param {number} [maxAttempts=3] - Maximum retry attempts
 * @param {number} [baseDelay=1000] - Base delay in milliseconds
 *
 * @returns {Promise} Promise that resolves with function result
 */
export const retryWithBackoff = async (fn, maxAttempts = 3, baseDelay = 1000) => {
  let lastError;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      if (attempt === maxAttempts) {
        throw error;
      }

      const delay = baseDelay * Math.pow(2, attempt - 1);
      await sleep(delay);
    }
  }

  throw lastError;
};

/**
 * Executes async functions in batches with concurrency control
 *
 * @param {Array} items - Items to process
 * @param {Function} asyncFn - Async function to apply to each item
 * @param {number} [batchSize=5] - Number of concurrent operations
 *
 * @returns {Promise<Array>} Promise that resolves with all results
 */
export const batchProcess = async (items, asyncFn, batchSize = PERFORMANCE_CONFIG.BATCH_SIZE) => {
  const results = [];

  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchResults = await Promise.all(batch.map(asyncFn));
    results.push(...batchResults);
  }

  return results;
};

// =============================================================================
// DOM UTILITIES (Client-side only)
// =============================================================================

/**
 * Copies text to clipboard
 *
 * @param {string} text - Text to copy
 *
 * @returns {Promise<boolean>} Success status
 */
export const copyToClipboard = async (text) => {
  if (typeof window === 'undefined') return false;

  try {
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(text);
      return true;
    }

    // Fallback for older browsers
    const textArea = document.createElement('textarea');
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand('copy');
    document.body.removeChild(textArea);
    return true;
  } catch (error) {
    console.warn('Failed to copy to clipboard:', error);
    return false;
  }
};

/**
 * Downloads data as a file
 *
 * @param {string} data - Data to download
 * @param {string} filename - Filename for download
 * @param {string} [mimeType='text/plain'] - MIME type
 */
export const downloadAsFile = (data, filename, mimeType = 'text/plain') => {
  if (typeof window === 'undefined') return;

  const blob = new Blob([data], { type: mimeType });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
};

// =============================================================================
// PREDEFINED DEBOUNCED FUNCTIONS
// =============================================================================

/**
 * Pre-configured debounced function for search operations
 */
export const debouncedSearch = debounce((searchFn, query) => {
  searchFn(query);
}, PERFORMANCE_CONFIG.SEARCH_DEBOUNCE);

/**
 * Pre-configured debounced function for save operations
 */
export const debouncedSave = debounce((saveFn, data) => {
  saveFn(data);
}, PERFORMANCE_CONFIG.SAVE_DEBOUNCE);

/**
 * Pre-configured debounced function for sync operations
 */
export const debouncedSync = debounce((syncFn) => {
  syncFn();
}, PERFORMANCE_CONFIG.SYNC_DEBOUNCE);

export default {
  // Validation
  validateWorkout,
  validateProgram,

  // Timing
  debounce,
  throttle,
  debouncedSearch,
  debouncedSave,
  debouncedSync,

  // Date/Time
  formatDate,
  formatDuration,
  getRelativeTime,

  // Numbers
  safeParseNumber,
  roundTo,
  clamp,

  // Strings
  capitalize,
  truncateText,
  generateId,

  // Arrays
  groupBy,
  unique,
  sortBy,

  // Storage
  getStorageItem,
  setStorageItem,

  // Async
  sleep,
  retryWithBackoff,
  batchProcess,

  // DOM
  copyToClipboard,
  downloadAsFile
};