// Comprehensive error logging and monitoring utility

// Error types for better categorization
export const ErrorTypes = {
  NETWORK: 'NETWORK',
  FIREBASE: 'FIREBASE',
  STORAGE: 'STORAGE',
  COMPONENT: 'COMPONENT',
  AUTHENTICATION: 'AUTHENTICATION',
  VALIDATION: 'VALIDATION',
  UNKNOWN: 'UNKNOWN'
};

// Error logger class
class ErrorLogger {
  constructor() {
    this.isClient = typeof window !== 'undefined';
    this.errors = [];
    this.maxErrors = 100; // Keep last 100 errors in memory
  }

  // Main logging method
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

  getSeverity(error, context) {
    const message = error.message?.toLowerCase() || '';

    // Critical errors
    if (message.includes('firebase') && message.includes('not initialized')) {
      return 'critical';
    }
    if (message.includes('chunklaoderror')) {
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

  addToMemory(errorEntry) {
    this.errors.unshift(errorEntry);
    if (this.errors.length > this.maxErrors) {
      this.errors = this.errors.slice(0, this.maxErrors);
    }
  }

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

  saveToLocalStorage(errorEntry) {
    try {
      const key = 'app-error-logs';
      const existing = localStorage.getItem(key);
      const logs = existing ? JSON.parse(existing) : [];

      logs.unshift(errorEntry);

      // Keep only last 50 errors in localStorage
      if (logs.length > 50) {
        logs.splice(50);
      }

      localStorage.setItem(key, JSON.stringify(logs));
    } catch (err) {
      console.warn('Failed to save error to localStorage:', err);
    }
  }

  sendToExternalService(errorEntry) {
    // In a real app, you might send to services like Sentry, LogRocket, etc.
    // For now, just a placeholder
    console.log('Would send to external service:', errorEntry);
  }

  // Get recent errors for debugging
  getRecentErrors(limit = 10) {
    return this.errors.slice(0, limit);
  }

  // Get errors by type
  getErrorsByType(type) {
    return this.errors.filter(error => error.type === type);
  }

  // Clear all errors
  clearErrors() {
    this.errors = [];
    if (this.isClient) {
      localStorage.removeItem('app-error-logs');
    }
  }

  // Get error statistics
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

// Export convenience functions
export const logError = (error, context) => errorLogger.log(error, context);
export const getRecentErrors = (limit) => errorLogger.getRecentErrors(limit);
export const getErrorStats = () => errorLogger.getErrorStats();
export const clearErrors = () => errorLogger.clearErrors();

// Auto-log unhandled errors and promise rejections (client-side only)
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

export default errorLogger;