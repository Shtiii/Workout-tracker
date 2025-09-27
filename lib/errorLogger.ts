/**
 * Enhanced error logging with service worker integration
 * Provides comprehensive error tracking and reporting
 */

import { getServiceWorkerManager } from './serviceWorker';
import { STORAGE_CONFIG, ERROR_CONFIG } from './constants';
import type { ErrorInfo } from '@/types';

export interface LoggedError {
  id: string;
  timestamp: Date;
  message: string;
  stack?: string;
  componentStack?: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  type: 'NETWORK' | 'FIREBASE' | 'STORAGE' | 'COMPONENT' | 'AUTHENTICATION' | 'VALIDATION' | 'CACHE' | 'SYNC' | 'UNKNOWN';
  context?: Record<string, any>;
  userAgent: string;
  url: string;
  userId?: string;
  resolved: boolean;
  resolvedAt?: Date;
}

export interface ErrorReport {
  totalErrors: number;
  criticalErrors: number;
  unresolvedErrors: number;
  errorsByType: Record<string, number>;
  errorsBySeverity: Record<string, number>;
  recentErrors: LoggedError[];
}

/**
 * Enhanced error logger with service worker integration
 */
export class ErrorLogger {
  private static instance: ErrorLogger;
  private errors: LoggedError[] = [];
  private swManager = getServiceWorkerManager();

  private constructor() {
    this.loadStoredErrors();
  }

  public static getInstance(): ErrorLogger {
    if (!ErrorLogger.instance) {
      ErrorLogger.instance = new ErrorLogger();
    }
    return ErrorLogger.instance;
  }

  /**
   * Log an error with enhanced context
   */
  public async logError(
    error: Error | string,
    context?: {
      severity?: 'critical' | 'high' | 'medium' | 'low';
      type?: 'NETWORK' | 'FIREBASE' | 'STORAGE' | 'COMPONENT' | 'AUTHENTICATION' | 'VALIDATION' | 'CACHE' | 'SYNC' | 'UNKNOWN';
      componentStack?: string;
      userId?: string;
      additionalContext?: Record<string, any>;
    }
  ): Promise<string> {
    const errorId = this.generateErrorId();
    const timestamp = new Date();

    const loggedError: LoggedError = {
      id: errorId,
      timestamp,
      message: typeof error === 'string' ? error : error.message,
      stack: typeof error === 'object' ? error.stack : undefined,
      componentStack: context?.componentStack,
      severity: context?.severity || 'medium',
      type: context?.type || 'UNKNOWN',
      context: context?.additionalContext,
      userAgent: navigator.userAgent,
      url: window.location.href,
      userId: context?.userId,
      resolved: false
    };

    // Add to memory
    this.errors.push(loggedError);

    // Store in localStorage
    await this.storeErrors();

    // Send to service worker for background processing
    await this.swManager.sendMessage({
      type: 'LOG_ERROR',
      data: loggedError
    });

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Logged Error:', loggedError);
    }

    return errorId;
  }

  /**
   * Log React error boundary error
   */
  public async logReactError(error: Error, errorInfo: ErrorInfo): Promise<string> {
    return await this.logError(error, {
      severity: 'high',
      type: 'COMPONENT',
      componentStack: errorInfo.componentStack,
      additionalContext: {
        errorBoundary: true,
        errorInfo
      }
    });
  }

  /**
   * Log network error
   */
  public async logNetworkError(
    error: Error,
    request: {
      url: string;
      method: string;
      status?: number;
      responseText?: string;
    }
  ): Promise<string> {
    return await this.logError(error, {
      severity: 'medium',
      type: 'NETWORK',
      additionalContext: {
        request,
        networkError: true
      }
    });
  }

  /**
   * Log Firebase error
   */
  public async logFirebaseError(
    error: Error,
    operation: string,
    collection?: string,
    documentId?: string
  ): Promise<string> {
    return await this.logError(error, {
      severity: 'high',
      type: 'FIREBASE',
      additionalContext: {
        operation,
        collection,
        documentId,
        firebaseError: true
      }
    });
  }

  /**
   * Log storage error
   */
  public async logStorageError(
    error: Error,
    operation: string,
    key?: string,
    data?: any
  ): Promise<string> {
    return await this.logError(error, {
      severity: 'medium',
      type: 'STORAGE',
      additionalContext: {
        operation,
        key,
        dataSize: data ? JSON.stringify(data).length : 0,
        storageError: true
      }
    });
  }

  /**
   * Log sync error
   */
  public async logSyncError(
    error: Error,
    syncType: 'workout' | 'program',
    itemId?: string,
    attempt?: number
  ): Promise<string> {
    return await this.logError(error, {
      severity: 'high',
      type: 'SYNC',
      additionalContext: {
        syncType,
        itemId,
        attempt,
        syncError: true
      }
    });
  }

  /**
   * Mark error as resolved
   */
  public async resolveError(errorId: string): Promise<boolean> {
    try {
      const error = this.errors.find(e => e.id === errorId);
      if (error) {
        error.resolved = true;
        error.resolvedAt = new Date();
        await this.storeErrors();
        return true;
      }
      return false;
    } catch (err) {
      console.error('Failed to resolve error:', err);
      return false;
    }
  }

  /**
   * Get error report
   */
  public getErrorReport(): ErrorReport {
    const totalErrors = this.errors.length;
    const criticalErrors = this.errors.filter(e => e.severity === 'critical').length;
    const unresolvedErrors = this.errors.filter(e => !e.resolved).length;

    const errorsByType = this.errors.reduce((acc, error) => {
      acc[error.type] = (acc[error.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const errorsBySeverity = this.errors.reduce((acc, error) => {
      acc[error.severity] = (acc[error.severity] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const recentErrors = this.errors
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, 10);

    return {
      totalErrors,
      criticalErrors,
      unresolvedErrors,
      errorsByType,
      errorsBySeverity,
      recentErrors
    };
  }

  /**
   * Get errors by severity
   */
  public getErrorsBySeverity(severity: 'critical' | 'high' | 'medium' | 'low'): LoggedError[] {
    return this.errors.filter(e => e.severity === severity);
  }

  /**
   * Get errors by type
   */
  public getErrorsByType(type: string): LoggedError[] {
    return this.errors.filter(e => e.type === type);
  }

  /**
   * Get unresolved errors
   */
  public getUnresolvedErrors(): LoggedError[] {
    return this.errors.filter(e => !e.resolved);
  }

  /**
   * Clear old errors
   */
  public async clearOldErrors(daysOld: number = 30): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      const initialCount = this.errors.length;
      this.errors = this.errors.filter(e => e.timestamp > cutoffDate);
      const removedCount = initialCount - this.errors.length;

      await this.storeErrors();
      return removedCount;
    } catch (error) {
      console.error('Failed to clear old errors:', error);
      return 0;
    }
  }

  /**
   * Clear all errors
   */
  public async clearAllErrors(): Promise<boolean> {
    try {
      this.errors = [];
      await this.storeErrors();
      return true;
    } catch (error) {
      console.error('Failed to clear all errors:', error);
      return false;
    }
  }

  /**
   * Export errors for analysis
   */
  public exportErrors(): string {
    return JSON.stringify(this.errors, null, 2);
  }

  /**
   * Import errors from backup
   */
  public async importErrors(exportedData: string): Promise<boolean> {
    try {
      const importedErrors = JSON.parse(exportedData);
      if (Array.isArray(importedErrors)) {
        this.errors = [...this.errors, ...importedErrors];
        await this.storeErrors();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to import errors:', error);
      return false;
    }
  }

  /**
   * Generate unique error ID
   */
  private generateErrorId(): string {
    return `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Load errors from localStorage
   */
  private async loadStoredErrors(): Promise<void> {
    try {
      const stored = localStorage.getItem(STORAGE_CONFIG.ERROR_LOGS_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        this.errors = parsed.map((error: any) => ({
          ...error,
          timestamp: new Date(error.timestamp),
          resolvedAt: error.resolvedAt ? new Date(error.resolvedAt) : undefined
        }));
      }
    } catch (error) {
      console.error('Failed to load stored errors:', error);
      this.errors = [];
    }
  }

  /**
   * Store errors in localStorage
   */
  private async storeErrors(): Promise<void> {
    try {
      // Limit stored errors to prevent localStorage bloat
      const errorsToStore = this.errors
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
        .slice(0, ERROR_CONFIG.MAX_ERRORS_IN_STORAGE);

      localStorage.setItem(STORAGE_CONFIG.ERROR_LOGS_KEY, JSON.stringify(errorsToStore));
    } catch (error) {
      console.error('Failed to store errors:', error);
    }
  }
}

/**
 * Get error logger instance
 */
export function getErrorLogger(): ErrorLogger {
  return ErrorLogger.getInstance();
}

/**
 * Initialize error logging
 */
export function initializeErrorLogging(): void {
  const logger = getErrorLogger();
  
  // Set up global error handlers
  window.addEventListener('error', (event) => {
    logger.logError(event.error, {
      severity: 'high',
      type: 'COMPONENT',
      additionalContext: {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        globalError: true
      }
    });
  });

  window.addEventListener('unhandledrejection', (event) => {
    logger.logError(event.reason, {
      severity: 'high',
      type: 'COMPONENT',
      additionalContext: {
        unhandledRejection: true,
        promise: event.promise
      }
    });
  });
}

// Legacy function exports for backward compatibility
export async function logError(
  error: Error | string,
  context?: {
    severity?: 'critical' | 'high' | 'medium' | 'low';
    type?: 'NETWORK' | 'FIREBASE' | 'STORAGE' | 'COMPONENT' | 'AUTHENTICATION' | 'VALIDATION' | 'CACHE' | 'SYNC' | 'UNKNOWN';
    componentStack?: string;
    userId?: string;
    additionalContext?: Record<string, any>;
  }
): Promise<string> {
  const logger = getErrorLogger();
  return await logger.logError(error, context);
}

export async function logReactError(error: Error, errorInfo: ErrorInfo): Promise<string> {
  const logger = getErrorLogger();
  return await logger.logReactError(error, errorInfo);
}

export async function logNetworkError(
  error: Error,
  request: {
    url: string;
    method: string;
    status?: number;
    responseText?: string;
  }
): Promise<string> {
  const logger = getErrorLogger();
  return await logger.logNetworkError(error, request);
}

export async function logFirebaseError(
  error: Error,
  operation: string,
  collection?: string,
  documentId?: string
): Promise<string> {
  const logger = getErrorLogger();
  return await logger.logFirebaseError(error, operation, collection, documentId);
}

export async function logStorageError(
  error: Error,
  operation: string,
  key?: string,
  data?: any
): Promise<string> {
  const logger = getErrorLogger();
  return await logger.logStorageError(error, operation, key, data);
}

export async function logSyncError(
  error: Error,
  syncType: 'workout' | 'program',
  itemId?: string,
  attempt?: number
): Promise<string> {
  const logger = getErrorLogger();
  return await logger.logSyncError(error, syncType, itemId, attempt);
}

export default ErrorLogger;
