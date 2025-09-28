'use client';

import { createContext, useContext, useState, useCallback } from 'react';
import { ErrorToast } from './ErrorToast';

const ErrorContext = createContext();

/**
 * ErrorProvider Component
 * Provides error handling context and utilities throughout the app
 */
export function ErrorProvider({ children }) {
  const [errors, setErrors] = useState([]);

  const showError = useCallback((error, options = {}) => {
    const errorId = Date.now() + Math.random();
    const newError = {
      id: errorId,
      error,
      ...options
    };

    setErrors(prev => [...prev, newError]);
  }, []);

  const hideError = useCallback((errorId) => {
    setErrors(prev => prev.filter(error => error.id !== errorId));
  }, []);

  const clearAllErrors = useCallback(() => {
    setErrors([]);
  }, []);

  const handleRetry = useCallback((errorId, onRetry) => {
    if (onRetry) {
      onRetry();
    }
    hideError(errorId);
  }, [hideError]);

  const contextValue = {
    showError,
    hideError,
    clearAllErrors,
    errors
  };

  return (
    <ErrorContext.Provider value={contextValue}>
      {children}
      
      {/* Render error toasts */}
      {errors.map(({ id, error, onRetry, ...options }) => (
        <ErrorToast
          key={id}
          open={true}
          error={error}
          onClose={() => hideError(id)}
          onRetry={onRetry ? () => handleRetry(id, onRetry) : undefined}
          {...options}
        />
      ))}
    </ErrorContext.Provider>
  );
}

/**
 * useError Hook
 * Hook to access error handling context
 */
export function useError() {
  const context = useContext(ErrorContext);
  if (!context) {
    throw new Error('useError must be used within an ErrorProvider');
  }
  return context;
}
