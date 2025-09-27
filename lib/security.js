// Comprehensive Security Utility Module
// Provides input sanitization, validation, encryption, and security measures

import crypto from 'crypto';

// =================== INPUT SANITIZATION ===================

/**
 * Sanitizes string input to prevent XSS attacks
 * Removes HTML tags, script content, and dangerous characters
 */
export function sanitizeString(input) {
  if (typeof input !== 'string') {
    return '';
  }

  return input
    // Remove HTML tags
    .replace(/<[^>]*>/g, '')
    // Remove script content
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    // Remove javascript: protocols
    .replace(/javascript:/gi, '')
    // Remove data: protocols (except safe ones)
    .replace(/data:(?!image\/(png|jpg|jpeg|gif|webp))/gi, '')
    // Remove on* event handlers
    .replace(/\bon\w+\s*=/gi, '')
    // Normalize whitespace
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Sanitizes numeric input with bounds checking
 */
export function sanitizeNumber(input, { min = -Infinity, max = Infinity, integer = false } = {}) {
  if (input === null || input === undefined || input === '') {
    return null;
  }

  let num = Number(input);

  if (isNaN(num)) {
    throw new Error('Invalid number format');
  }

  if (integer) {
    num = Math.floor(num);
  }

  if (num < min || num > max) {
    throw new Error(`Number must be between ${min} and ${max}`);
  }

  return num;
}

/**
 * Sanitizes exercise name with length and character restrictions
 */
export function sanitizeExerciseName(name) {
  if (!name || typeof name !== 'string') {
    throw new Error('Exercise name is required');
  }

  const sanitized = sanitizeString(name);

  if (sanitized.length < 1) {
    throw new Error('Exercise name cannot be empty');
  }

  if (sanitized.length > 100) {
    throw new Error('Exercise name is too long (max 100 characters)');
  }

  // Allow only letters, numbers, spaces, hyphens, and common punctuation
  if (!/^[a-zA-Z0-9\s\-_.,()]+$/.test(sanitized)) {
    throw new Error('Exercise name contains invalid characters');
  }

  return sanitized;
}

/**
 * Sanitizes program name with validation
 */
export function sanitizeProgramName(name) {
  if (!name || typeof name !== 'string') {
    throw new Error('Program name is required');
  }

  const sanitized = sanitizeString(name);

  if (sanitized.length < 1) {
    throw new Error('Program name cannot be empty');
  }

  if (sanitized.length > 100) {
    throw new Error('Program name is too long (max 100 characters)');
  }

  return sanitized;
}

/**
 * Sanitizes goal data
 */
export function sanitizeGoalData(goalData) {
  if (!goalData || typeof goalData !== 'object') {
    throw new Error('Invalid goal data');
  }

  const allowedCategories = ['Strength', 'Endurance', 'Weight Loss', 'Muscle Gain', 'General Fitness'];

  return {
    name: sanitizeString(goalData.name),
    description: sanitizeString(goalData.description || ''),
    category: allowedCategories.includes(goalData.category) ? goalData.category : 'General Fitness',
    target: sanitizeNumber(goalData.target, { min: 0, max: 10000 }),
    current: sanitizeNumber(goalData.current, { min: 0, max: 10000 }) || 0,
    unit: sanitizeString(goalData.unit)
  };
}

/**
 * Sanitizes workout set data
 */
export function sanitizeSetData(setData) {
  if (!setData || typeof setData !== 'object') {
    throw new Error('Invalid set data');
  }

  return {
    weight: setData.weight ? sanitizeNumber(setData.weight, { min: 0, max: 1000 }) : null,
    reps: setData.reps ? sanitizeNumber(setData.reps, { min: 0, max: 1000, integer: true }) : null,
    completed: Boolean(setData.completed),
    rpe: setData.rpe ? sanitizeNumber(setData.rpe, { min: 1, max: 10 }) : null
  };
}

// =================== DATA VALIDATION SCHEMAS ===================

/**
 * Validates program data structure
 */
export function validateProgramData(programData) {
  if (!programData || typeof programData !== 'object') {
    throw new Error('Invalid program data structure');
  }

  const errors = [];

  // Validate name
  try {
    sanitizeProgramName(programData.name);
  } catch (error) {
    errors.push(`Program name: ${error.message}`);
  }

  // Validate exercises
  if (!Array.isArray(programData.exercises)) {
    errors.push('Exercises must be an array');
  } else if (programData.exercises.length === 0) {
    errors.push('Program must have at least one exercise');
  } else {
    programData.exercises.forEach((exercise, index) => {
      try {
        sanitizeExerciseName(exercise.name);
        sanitizeNumber(exercise.sets, { min: 1, max: 20, integer: true });
        sanitizeNumber(exercise.reps, { min: 1, max: 100, integer: true });
      } catch (error) {
        errors.push(`Exercise ${index + 1}: ${error.message}`);
      }
    });
  }

  if (errors.length > 0) {
    throw new Error(`Validation failed: ${errors.join(', ')}`);
  }

  return true;
}

/**
 * Validates workout session data
 */
export function validateWorkoutData(workoutData) {
  if (!workoutData || typeof workoutData !== 'object') {
    throw new Error('Invalid workout data structure');
  }

  const errors = [];

  // Validate exercises
  if (!Array.isArray(workoutData.exercises)) {
    errors.push('Exercises must be an array');
  } else {
    workoutData.exercises.forEach((exercise, exerciseIndex) => {
      try {
        sanitizeExerciseName(exercise.name);
      } catch (error) {
        errors.push(`Exercise ${exerciseIndex + 1}: ${error.message}`);
      }

      if (!Array.isArray(exercise.sets)) {
        errors.push(`Exercise ${exerciseIndex + 1}: Sets must be an array`);
      } else {
        exercise.sets.forEach((set, setIndex) => {
          try {
            sanitizeSetData(set);
          } catch (error) {
            errors.push(`Exercise ${exerciseIndex + 1}, Set ${setIndex + 1}: ${error.message}`);
          }
        });
      }
    });
  }

  if (errors.length > 0) {
    throw new Error(`Workout validation failed: ${errors.join(', ')}`);
  }

  return true;
}

// =================== ENCRYPTION FOR OFFLINE STORAGE ===================

/**
 * Generates a consistent encryption key from browser fingerprint
 */
function getEncryptionKey() {
  // Use a combination of available browser properties to create a key
  const fingerprint = [
    navigator.userAgent,
    navigator.language,
    screen.width,
    screen.height,
    new Date().getTimezoneOffset(),
    'workout-tracker-key' // App-specific salt
  ].join('|');

  // Create hash using Web Crypto API (client-side) or crypto module (server-side)
  if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
    // Browser environment
    return window.crypto.subtle.digest('SHA-256', new TextEncoder().encode(fingerprint))
      .then(hash => new Uint8Array(hash));
  } else {
    // Node.js environment or fallback
    return crypto.createHash('sha256').update(fingerprint).digest();
  }
}

/**
 * Encrypts sensitive data for offline storage
 */
export async function encryptData(data) {
  if (typeof window === 'undefined') {
    // Server-side: return data as-is (no localStorage)
    return JSON.stringify(data);
  }

  try {
    const keyMaterial = await getEncryptionKey();
    const key = await window.crypto.subtle.importKey(
      'raw',
      keyMaterial.slice(0, 32), // Use first 32 bytes for AES-256
      { name: 'AES-GCM' },
      false,
      ['encrypt']
    );

    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const encodedData = new TextEncoder().encode(JSON.stringify(data));

    const encrypted = await window.crypto.subtle.encrypt(
      { name: 'AES-GCM', iv: iv },
      key,
      encodedData
    );

    // Combine IV and encrypted data
    const combined = new Uint8Array(iv.length + encrypted.byteLength);
    combined.set(iv);
    combined.set(new Uint8Array(encrypted), iv.length);

    // Convert to base64 for storage
    return btoa(String.fromCharCode(...combined));
  } catch (error) {
    console.warn('Encryption failed, storing data unencrypted:', error);
    return JSON.stringify(data);
  }
}

/**
 * Decrypts data from offline storage
 */
export async function decryptData(encryptedData) {
  if (typeof window === 'undefined') {
    // Server-side: return parsed data
    return JSON.parse(encryptedData);
  }

  try {
    // Try to parse as encrypted data first
    const combined = new Uint8Array(
      atob(encryptedData).split('').map(char => char.charCodeAt(0))
    );

    const iv = combined.slice(0, 12);
    const encrypted = combined.slice(12);

    const keyMaterial = await getEncryptionKey();
    const key = await window.crypto.subtle.importKey(
      'raw',
      keyMaterial.slice(0, 32),
      { name: 'AES-GCM' },
      false,
      ['decrypt']
    );

    const decrypted = await window.crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: iv },
      key,
      encrypted
    );

    const decodedData = new TextDecoder().decode(decrypted);
    return JSON.parse(decodedData);
  } catch (error) {
    // Fallback: try to parse as unencrypted JSON
    try {
      return JSON.parse(encryptedData);
    } catch (parseError) {
      console.error('Failed to decrypt and parse data:', error);
      throw new Error('Invalid stored data format');
    }
  }
}

// =================== ERROR LOG SANITIZATION ===================

/**
 * Sanitizes error information before logging to prevent sensitive data leakage
 */
export function sanitizeErrorForLogging(error, context = {}) {
  // List of sensitive keys that should be redacted
  const sensitiveKeys = [
    'password', 'token', 'secret', 'key', 'auth', 'credential',
    'email', 'phone', 'ssn', 'credit', 'card', 'payment', 'billing',
    'apikey', 'api_key', 'access_token', 'refresh_token'
  ];

  const sanitizedError = {
    message: sanitizeString(error.message || String(error)),
    name: error.name || 'Error',
    type: error.constructor?.name || 'Unknown',
    timestamp: new Date().toISOString(),
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'server',
    url: typeof window !== 'undefined' ? window.location.pathname : 'server'
  };

  // Sanitize stack trace
  if (error.stack) {
    sanitizedError.stack = error.stack
      .split('\n')
      .map(line => {
        // Remove file paths that might contain sensitive info
        return line.replace(/\/[^\s]*node_modules[^\s]*/g, '[node_modules]')
                  .replace(/\/[^\s]*\.env[^\s]*/g, '[env_file]')
                  .replace(/\/home\/[^\s\/]*\//g, '/home/[user]/')
                  .replace(/C:\\Users\\[^\\]*\\/g, 'C:\\Users\\[user]\\');
      })
      .slice(0, 10) // Limit stack trace length
      .join('\n');
  }

  // Sanitize context data
  const sanitizedContext = {};
  if (context && typeof context === 'object') {
    Object.keys(context).forEach(key => {
      const lowerKey = key.toLowerCase();
      if (sensitiveKeys.some(sensitive => lowerKey.includes(sensitive))) {
        sanitizedContext[key] = '[REDACTED]';
      } else if (typeof context[key] === 'string') {
        sanitizedContext[key] = sanitizeString(context[key]);
      } else if (typeof context[key] === 'number') {
        sanitizedContext[key] = context[key];
      } else if (typeof context[key] === 'boolean') {
        sanitizedContext[key] = context[key];
      } else {
        sanitizedContext[key] = '[OBJECT]';
      }
    });
  }

  sanitizedError.context = sanitizedContext;

  return sanitizedError;
}

// =================== RATE LIMITING ===================

class RateLimiter {
  constructor() {
    this.requests = new Map();
    this.cleanupInterval = setInterval(() => this.cleanup(), 60000); // Cleanup every minute
  }

  /**
   * Check if action is rate limited
   */
  isRateLimited(action, limit = 10, windowMs = 60000) {
    const now = Date.now();
    const key = action;

    if (!this.requests.has(key)) {
      this.requests.set(key, []);
    }

    const requests = this.requests.get(key);

    // Remove old requests outside the window
    const validRequests = requests.filter(time => now - time < windowMs);
    this.requests.set(key, validRequests);

    // Check if limit exceeded
    if (validRequests.length >= limit) {
      return true;
    }

    // Add current request
    validRequests.push(now);
    return false;
  }

  /**
   * Clean up old entries
   */
  cleanup() {
    const now = Date.now();
    for (const [key, requests] of this.requests.entries()) {
      const validRequests = requests.filter(time => now - time < 300000); // Keep 5 minutes
      if (validRequests.length === 0) {
        this.requests.delete(key);
      } else {
        this.requests.set(key, validRequests);
      }
    }
  }
}

// Create singleton rate limiter
const rateLimiter = new RateLimiter();

/**
 * Rate limiting for specific actions
 */
export function checkRateLimit(action, customLimits = {}) {
  const limits = {
    'save_workout': { limit: 10, window: 60000 }, // 10 saves per minute
    'save_program': { limit: 5, window: 60000 },  // 5 saves per minute
    'save_goal': { limit: 5, window: 60000 },     // 5 saves per minute
    'delete_action': { limit: 3, window: 60000 }, // 3 deletes per minute
    'fetch_data': { limit: 30, window: 60000 },   // 30 fetches per minute
    ...customLimits
  };

  const actionLimit = limits[action] || { limit: 10, window: 60000 };

  if (rateLimiter.isRateLimited(action, actionLimit.limit, actionLimit.window)) {
    throw new Error(`Rate limit exceeded for ${action}. Please try again later.`);
  }

  return true;
}

// =================== CSRF PROTECTION ===================

/**
 * Generate CSRF token for forms
 */
export function generateCSRFToken() {
  if (typeof window !== 'undefined' && window.crypto) {
    const array = new Uint8Array(32);
    window.crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  // Fallback for server-side or older browsers
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Validate CSRF token
 */
export function validateCSRFToken(token, sessionToken) {
  if (!token || !sessionToken) {
    throw new Error('CSRF token validation failed');
  }

  return token === sessionToken;
}

// =================== XSS PROTECTION ===================

/**
 * Content Security Policy configuration
 */
export const getCSPHeader = () => {
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://apis.google.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: blob: https:",
    "connect-src 'self' https://*.googleapis.com https://*.firebaseio.com wss://*.firebaseio.com",
    "frame-src 'self' https://*.google.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests"
  ].join('; ');

  return csp;
};

/**
 * Sanitize HTML content to prevent XSS
 */
export function sanitizeHTML(html) {
  if (typeof DOMParser !== 'undefined') {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    // Remove all script tags and event handlers
    const scripts = doc.querySelectorAll('script');
    scripts.forEach(script => script.remove());

    // Remove dangerous attributes
    const allElements = doc.querySelectorAll('*');
    allElements.forEach(element => {
      const attributes = [...element.attributes];
      attributes.forEach(attr => {
        if (attr.name.startsWith('on') || attr.name === 'href' && attr.value.startsWith('javascript:')) {
          element.removeAttribute(attr.name);
        }
      });
    });

    return doc.body.innerHTML;
  }

  // Fallback: just strip all HTML
  return sanitizeString(html);
}

// =================== EXPORTS ===================

export default {
  sanitizeString,
  sanitizeNumber,
  sanitizeExerciseName,
  sanitizeProgramName,
  sanitizeGoalData,
  sanitizeSetData,
  validateProgramData,
  validateWorkoutData,
  encryptData,
  decryptData,
  sanitizeErrorForLogging,
  checkRateLimit,
  generateCSRFToken,
  validateCSRFToken,
  getCSPHeader,
  sanitizeHTML
};