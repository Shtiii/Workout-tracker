'use client';

import { useEffect, useRef } from 'react';
import { usePerformanceMonitor } from '@/lib/performance';

/**
 * PerformanceMonitor Component
 * Monitors and displays performance metrics for development
 */
export default function PerformanceMonitor({ 
  componentName, 
  showMetrics = false,
  children 
}) {
  const { renderCount } = usePerformanceMonitor(componentName);
  const mountTime = useRef(Date.now());

  useEffect(() => {
    if (process.env.NODE_ENV === 'development' && showMetrics) {
      const now = Date.now();
      const mountDuration = now - mountTime.current;
      
      console.log(`Performance Metrics for ${componentName}:`, {
        renderCount,
        mountDuration: `${mountDuration}ms`,
        timestamp: new Date().toISOString()
      });
    }
  }, [componentName, renderCount, showMetrics]);

  if (process.env.NODE_ENV !== 'development') {
    return children;
  }

  return (
    <div>
      {children}
      {showMetrics && (
        <div
          style={{
            position: 'fixed',
            top: '10px',
            right: '10px',
            background: 'rgba(0, 0, 0, 0.8)',
            color: 'white',
            padding: '8px',
            borderRadius: '4px',
            fontSize: '12px',
            zIndex: 9999,
            fontFamily: 'monospace'
          }}
        >
          <div>{componentName}</div>
          <div>Renders: {renderCount}</div>
        </div>
      )}
    </div>
  );
}
