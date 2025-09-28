import { lazy, Suspense } from 'react';

// Lazy load non-critical components
export const LazyAnalytics = lazy(() => import('../app/analytics/page'));
export const LazyGoalsRecords = lazy(() => import('../app/goals-records/page'));
export const LazyBests = lazy(() => import('../app/bests/page'));

// Component wrapper for better error handling
export const withLazyLoading = (Component, fallback = null) => {
  const LazyWrapper = (props) => (
    <Suspense fallback={fallback || <div>Loading...</div>}>
      <Component {...props} />
    </Suspense>
  );

  LazyWrapper.displayName = `withLazyLoading(${Component.displayName || Component.name || 'Component'})`;

  return LazyWrapper;
};