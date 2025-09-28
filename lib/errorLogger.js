/**
 * @fileoverview Comprehensive error logging and monitoring utility
 * Provides centralized error handling, categorization, and reporting
 *
 * @author Workout Tracker Team
 * @version 1.0.0
 */

import { ERROR_CONFIG } from './constants.js';

/**
 * Error types for better categorization and handling
 * @enum {string}
 */
export const ErrorTypes = {
  NETWORK: 'NETWORK',
  FIREBASE: 'FIREBASE',
  STORAGE: 'STORAGE',
  COMPONENT: 'COMPONENT',
  AUTHENTICATION: 'AUTHENTICATION',
  VALIDATION: 'VALIDATION',
  UNKNOWN: 'UNKNOWN'
};

/**
 * Centralized error logging and monitoring class
 * Handles error categorization, storage, and reporting
 *
 * @class ErrorLogger
 */
class ErrorLogger {
  /**
   * Initialize the error logger
   */
  constructor() {
    this.isClient = typeof window !== 'undefined';
    this.errors = [];
    this.maxErrors = ERROR_CONFIG.MAX_ERRORS_IN_MEMORY;
    this.maxStorageErrors = ERROR_CONFIG.MAX_ERRORS_IN_STORAGE;
  }

  /**
   * Main error logging method
   *
   * @param {Error|string} error - The error to log
   * @param {Object} context - Additional context information
   * @param {string} [context.component] - Component where error occurred
   * @param {string} [context.action] - Action being performed when error occurred
   * @param {boolean} [context.critical] - Whether this is a critical error
   * @param {Object} [context.metadata] - Additional metadata
   *
   * @returns {Object} The created error entry
   *
   * @example
   * errorLogger.log(new Error('Firebase connection failed'), {
   *   component: 'auth',
   *   action: 'login',
   *   critical: true
   * });
   */
  log(error, context = {}) {
    const errorEntry = this.createErrorEntry(error, context);

    // Add to memory storage
    this.addToMemory(errorEntry);

    // Console logging with proper formatting
    this.logToConsole(errorEntry);

    // Store in localStorage for debugging (client-side only)
    if (this.isClient) {
      this.saveToLocalStorage(errorEntry);
    }

    // In production, you might want to send to external service
    if (process.env.NODE_ENV === 'production') {
      this.sendToExternalService(errorEntry);
    }

    return errorEntry;
  }

  /**
   * Creates a structured error entry with metadata
   *
   * @param {Error|string} error - The error to process
   * @param {Object} context - Additional context information
   *
   * @returns {Object} Structured error entry
   * @private
   */
  createErrorEntry(error, context) {
    return {
      id: Date.now() + Math.random(),
      timestamp: new Date().toISOString(),
      message: error.message || String(error),
      stack: error.stack,
      type: this.categorizeError(error),
      context: {
        ...context,
        url: this.isClient ? window.location.href : 'server',
        userAgent: this.isClient ? navigator.userAgent : 'server',
        timestamp: Date.now()
      },
      severity: this.getSeverity(error, context)
    };
  }

  /**
   * Categorizes an error based on its message and properties
   *
   * @param {Error|string} error - The error to categorize
   *
   * @returns {string} Error category from ErrorTypes enum
   * @private
   */
  categorizeError(error) {
    const message = error.message?.toLowerCase() || String(error).toLowerCase();

    if (message.includes('network') || message.includes('fetch')) {
      return ErrorTypes.NETWORK;
    }
    if (message.includes('firebase') || message.includes('firestore')) {
      return ErrorTypes.FIREBASE;
    }
    if (message.includes('localstorage') || message.includes('storage')) {
      return ErrorTypes.STORAGE;
    }
    if (message.includes('auth') || message.includes('permission')) {
      return ErrorTypes.AUTHENTICATION;
    }
    if (message.includes('validation') || message.includes('invalid')) {
      return ErrorTypes.VALIDATION;
    }
    if (error.name === 'ChunkLoadError' || message.includes('loading chunk')) {
      return ErrorTypes.COMPONENT;
    }

    return ErrorTypes.UNKNOWN;
  }

  /**
   * Determines the severity level of an error
   *
   * @param {Error|string} error - The error to assess
   * @param {Object} context - Error context
   *
   * @returns {string} Severity level (critical, high, medium, low)
   * @private
   */
  getSeverity(error, context) {
    const message = error.message?.toLowerCase() || '';

    // Critical errors
    if (message.includes('firebase') && message.includes('not initialized')) {
      return 'critical';
    }
    if (message.includes('chunkloaderror')) {
      return 'critical';
    }

    // High priority
    if (context.component === 'auth' || context.critical === true) {
      return 'high';
    }

    // Medium priority (default)
    if (message.includes('network') || message.includes('timeout')) {
      return 'medium';
    }

    return 'low';
  }

  /**
   * Adds error entry to in-memory storage with size management
   *
   * @param {Object} errorEntry - The error entry to store
   * @private
   */
  addToMemory(errorEntry) {
    this.errors.unshift(errorEntry);
    if (this.errors.length > this.maxErrors) {
      this.errors = this.errors.slice(0, this.maxErrors);
    }
  }

  /**
   * Logs error to browser console with formatting
   *
   * @param {Object} errorEntry - The error entry to log
   * @private
   */
  logToConsole(errorEntry) {
    const style = this.getConsoleStyle(errorEntry.severity);
    const prefix = `[${errorEntry.type}] [${errorEntry.severity.toUpperCase()}]`;

    console.group(`%c${prefix} ${errorEntry.message}`, style);
    console.log('Time:', new Date(errorEntry.timestamp).toLocaleTimeString());
    console.log('Context:', errorEntry.context);
    if (errorEntry.stack) {
      console.log('Stack:', errorEntry.stack);
    }
    console.groupEnd();
  }

  /**
   * Gets CSS styling for console output based on severity
   *
   * @param {string} severity - Error severity level
   *
   * @returns {string} CSS style string
   * @private
   */
  getConsoleStyle(severity) {
    switch (severity) {
      case 'critical':
        return 'color: white; background: #cc0000; font-weight: bold; padding: 2px 4px;';
      case 'high':
        return 'color: white; background: #ff4444; font-weight: bold; padding: 2px 4px;';
      case 'medium':
        return 'color: white; background: #ffaa00; font-weight: bold; padding: 2px 4px;';
      default:
        return 'color: white; background: #666666; padding: 2px 4px;';
    }
  }

  /**
   * Saves error entry to localStorage for persistence
   *
   * @param {Object} errorEntry - The error entry to save
   * @private
   */
  saveToLocalStorage(errorEntry) {
    try {
      const key = 'app-error-logs';
      const existing = localStorage.getItem(key);
      const logs = existing ? JSON.parse(existing) : [];

      logs.unshift(errorEntry);

      // Keep only last N errors in localStorage based on config
      if (logs.length > this.maxStorageErrors) {
        logs.splice(this.maxStorageErrors);
      }

      localStorage.setItem(key, JSON.stringify(logs));
    } catch (err) {
      console.warn('Failed to save error to localStorage:', err);
    }
  }

  /**
   * Sends error to external monitoring service
   * In production, this would integrate with services like Sentry, LogRocket, etc.
   *
   * @param {Object} errorEntry - The error entry to send
   * @private
   */
  sendToExternalService(errorEntry) {
    // Placeholder for external service integration
    if (process.env.NODE_ENV === 'development') {
      console.log('Would send to external service:', errorEntry);
    }

    // In production, you might do something like:
    // Sentry.captureException(errorEntry);
    // LogRocket.captureMessage(errorEntry.message);
  }

  /**
   * Gets recent errors for debugging purposes
   *
   * @param {number} [limit=10] - Maximum number of errors to return
   *
   * @returns {Array<Object>} Array of recent error entries
   */
  getRecentErrors(limit = 10) {
    return this.errors.slice(0, limit);
  }

  /**
   * Gets errors filtered by type
   *
   * @param {string} type - Error type from ErrorTypes enum
   *
   * @returns {Array<Object>} Array of errors matching the type
   */
  getErrorsByType(type) {
    return this.errors.filter(error => error.type === type);
  }

  /**
   * Clears all stored errors from memory and localStorage
   */
  clearErrors() {
    this.errors = [];
    if (this.isClient) {
      localStorage.removeItem(ERROR_CONFIG.ERROR_LOGS_KEY || 'app-error-logs');
    }
  }

  /**
   * Gets comprehensive error statistics
   *
   * @returns {Object} Error statistics including counts by type, severity, and time
   */
  getErrorStats() {
    const stats = {
      total: this.errors.length,
      byType: {},
      bySeverity: {},
      last24Hours: 0
    };

    const day = 24 * 60 * 60 * 1000;
    const now = Date.now();

    this.errors.forEach(error => {
      // Count by type
      stats.byType[error.type] = (stats.byType[error.type] || 0) + 1;

      // Count by severity
      stats.bySeverity[error.severity] = (stats.bySeverity[error.severity] || 0) + 1;

      // Count recent errors
      if (now - new Date(error.timestamp).getTime() < day) {
        stats.last24Hours++;
      }
    });

    return stats;
  }
}

// Create singleton instance
const errorLogger = new ErrorLogger();

/**
 * Convenience function to log an error
 *
 * @param {Error|string} error - The error to log
 * @param {Object} [context] - Additional context information
 *
 * @returns {Object} The created error entry
 *
 * @example
 * import { logError } from './errorLogger';
 *
 * try {
 *   // Some risky operation
 * } catch (error) {
 *   logError(error, { component: 'workout-form', action: 'save' });
 * }
 */
export const logError = (error, context) => errorLogger.log(error, context);

/**
 * Gets recent errors for debugging
 *
 * @param {number} [limit] - Maximum number of errors to return
 *
 * @returns {Array<Object>} Array of recent error entries
 */
export const getRecentErrors = (limit) => errorLogger.getRecentErrors(limit);

/**
 * Gets comprehensive error statistics
 *
 * @returns {Object} Error statistics
 */
export const getErrorStats = () => errorLogger.getErrorStats();

/**
 * Clears all stored errors
 */
export const clearErrors = () => errorLogger.clearErrors();

/**
 * Gets errors by type
 *
 * @param {string} type - Error type from ErrorTypes enum
 *
 * @returns {Array<Object>} Array of errors matching the type
 */
export const getErrorsByType = (type) => errorLogger.getErrorsByType(type);

/**
 * Auto-setup for unhandled error and promise rejection logging
 * Automatically captures uncaught errors and promise rejections
 */
if (typeof window !== 'undefined') {
  window.addEventListener('error', (event) => {
    logError(event.error || new Error(event.message), {
      type: ErrorTypes.COMPONENT,
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      critical: true
    });
  });

  window.addEventListener('unhandledrejection', (event) => {
    logError(event.reason || new Error('Unhandled promise rejection'), {
      type: ErrorTypes.UNKNOWN,
      promise: true,
      critical: true
    });
  });
}

/**
 * Default export of the ErrorLogger singleton instance
 * Provides access to the full ErrorLogger API
 *
 * @example
 * import errorLogger from './errorLogger';
 *
 * errorLogger.log(error, context);
 * const stats = errorLogger.getErrorStats();
 */
export default errorLogger;