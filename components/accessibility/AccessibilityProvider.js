'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { LiveRegion } from './LiveRegion';

const AccessibilityContext = createContext();

/**
 * AccessibilityProvider Component
 * Provides accessibility context and utilities throughout the app
 */
export function AccessibilityProvider({ children }) {
  const [announcements, setAnnouncements] = useState([]);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [highContrast, setHighContrast] = useState(false);
  const [fontSize, setFontSize] = useState('normal');

  useEffect(() => {
    // Check for user's motion preferences
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mediaQuery.matches);

    const handleChange = (e) => setReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handleChange);

    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  useEffect(() => {
    // Check for user's contrast preferences
    const mediaQuery = window.matchMedia('(prefers-contrast: high)');
    setHighContrast(mediaQuery.matches);

    const handleChange = (e) => setHighContrast(e.matches);
    mediaQuery.addEventListener('change', handleChange);

    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const announce = (message, politeness = 'polite') => {
    setAnnouncements(prev => [...prev, { message, politeness, id: Date.now() }]);
  };

  const contextValue = {
    announce,
    reducedMotion,
    highContrast,
    fontSize,
    setFontSize
  };

  return (
    <AccessibilityContext.Provider value={contextValue}>
      {children}
      
      {/* Live regions for announcements */}
      {announcements.map(({ message, politeness, id }) => (
        <LiveRegion
          key={id}
          message={message}
          politeness={politeness}
        />
      ))}
    </AccessibilityContext.Provider>
  );
}

/**
 * useAccessibility Hook
 * Hook to access accessibility context
 */
export function useAccessibility() {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error('useAccessibility must be used within an AccessibilityProvider');
  }
  return context;
}
