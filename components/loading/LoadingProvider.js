'use client';

import { createContext, useContext, useState, useCallback } from 'react';
import { LoadingOverlay } from './LoadingOverlay';

const LoadingContext = createContext();

/**
 * LoadingProvider Component
 * Provides loading state management throughout the app
 */
export function LoadingProvider({ children }) {
  const [loadingStates, setLoadingStates] = useState({});

  const setLoading = useCallback((key, loading, options = {}) => {
    setLoadingStates(prev => ({
      ...prev,
      [key]: {
        loading,
        text: options.text,
        size: options.size,
        color: options.color
      }
    }));
  }, []);

  const isLoading = useCallback((key) => {
    return loadingStates[key]?.loading || false;
  }, [loadingStates]);

  const getLoadingState = useCallback((key) => {
    return loadingStates[key] || { loading: false };
  }, [loadingStates]);

  const clearLoading = useCallback((key) => {
    setLoadingStates(prev => {
      const newStates = { ...prev };
      delete newStates[key];
      return newStates;
    });
  }, []);

  const clearAllLoading = useCallback(() => {
    setLoadingStates({});
  }, []);

  const contextValue = {
    setLoading,
    isLoading,
    getLoadingState,
    clearLoading,
    clearAllLoading,
    loadingStates
  };

  return (
    <LoadingContext.Provider value={contextValue}>
      {children}
      
      {/* Render loading overlays */}
      {Object.entries(loadingStates).map(([key, state]) => (
        <LoadingOverlay
          key={key}
          open={state.loading}
          text={state.text}
          size={state.size}
          color={state.color}
        />
      ))}
    </LoadingContext.Provider>
  );
}

/**
 * useLoading Hook
 * Hook to access loading state management
 */
export function useLoading() {
  const context = useContext(LoadingContext);
  if (!context) {
    throw new Error('useLoading must be used within a LoadingProvider');
  }
  return context;
}
