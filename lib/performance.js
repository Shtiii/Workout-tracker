// Performance optimization utilities

// Debounce hook for search inputs
import { useCallback, useRef, useState, useEffect, useMemo, memo } from 'react';

export const useDebounce = (callback, delay) => {
  const timeoutRef = useRef(null);

  return useCallback((...args) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => callback(...args), delay);
  }, [callback, delay]);
};

// Memoized date formatter
export const formatDate = (() => {
  const cache = new Map();

  return (date, options = {}) => {
    const key = `${date.getTime()}-${JSON.stringify(options)}`;
    if (cache.has(key)) {
      return cache.get(key);
    }

    const formatted = date.toLocaleDateString('en-GB', {
      month: 'short',
      day: 'numeric',
      ...options
    });

    cache.set(key, formatted);
    return formatted;
  };
})();

// Virtual scrolling helper for large lists
export const useVirtualScrolling = (items, itemHeight = 50, containerHeight = 400) => {
  const [scrollTop, setScrollTop] = useState(0);

  const visibleStart = Math.floor(scrollTop / itemHeight);
  const visibleEnd = Math.min(
    visibleStart + Math.ceil(containerHeight / itemHeight) + 1,
    items.length
  );

  const visibleItems = items.slice(visibleStart, visibleEnd);
  const totalHeight = items.length * itemHeight;
  const offsetY = visibleStart * itemHeight;

  return {
    visibleItems,
    totalHeight,
    offsetY,
    onScroll: (e) => setScrollTop(e.target.scrollTop)
  };
};

// Image lazy loading
export const useIntersectionObserver = (options = {}) => {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const ref = useRef();

  useEffect(() => {
    if (!ref.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => setIsIntersecting(entry.isIntersecting),
      { threshold: 0.1, ...options }
    );

    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [options]);

  return [ref, isIntersecting];
};

// Bundle size analyzer (development only)
export const logBundleSize = () => {
  if (process.env.NODE_ENV === 'development') {
    console.log('Bundle analysis available at: https://bundlephobia.com/package/your-package');
  }
};

// Advanced memoization utilities
export const useMemoizedCallback = (callback, deps) => {
  return useCallback(callback, deps);
};

export const useMemoizedValue = (value, deps) => {
  return useMemo(() => value, deps);
};

// Expensive calculation memoization with cache
export const useMemoizedCalculation = (calculation, deps, cacheKey) => {
  const cache = useRef(new Map());
  
  return useMemo(() => {
    const key = cacheKey ? `${cacheKey}-${JSON.stringify(deps)}` : JSON.stringify(deps);
    
    if (cache.current.has(key)) {
      return cache.current.get(key);
    }
    
    const result = calculation();
    cache.current.set(key, result);
    
    // Limit cache size to prevent memory leaks
    if (cache.current.size > 100) {
      const firstKey = cache.current.keys().next().value;
      cache.current.delete(firstKey);
    }
    
    return result;
  }, deps);
};

// Virtual scrolling with improved performance
export const useAdvancedVirtualScrolling = (items, itemHeight = 50, containerHeight = 400, overscan = 5) => {
  const [scrollTop, setScrollTop] = useState(0);
  const [containerRef, setContainerRef] = useState(null);

  const visibleStart = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const visibleEnd = Math.min(
    items.length,
    Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
  );

  const visibleItems = useMemo(() => 
    items.slice(visibleStart, visibleEnd).map((item, index) => ({
      ...item,
      index: visibleStart + index
    })), 
    [items, visibleStart, visibleEnd]
  );

  const totalHeight = items.length * itemHeight;
  const offsetY = visibleStart * itemHeight;

  const handleScroll = useCallback((e) => {
    setScrollTop(e.target.scrollTop);
  }, []);

  return {
    visibleItems,
    totalHeight,
    offsetY,
    onScroll: handleScroll,
    containerRef: setContainerRef
  };
};

// Performance monitoring hook
export const usePerformanceMonitor = (componentName) => {
  const renderCount = useRef(0);
  const startTime = useRef(performance.now());

  useEffect(() => {
    renderCount.current += 1;
    const endTime = performance.now();
    const renderTime = endTime - startTime.current;
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`${componentName} rendered ${renderCount.current} times, took ${renderTime.toFixed(2)}ms`);
    }
    
    startTime.current = performance.now();
  });

  return { renderCount: renderCount.current };
};

// Memoized component wrapper
export const withMemo = (Component, areEqual) => {
  return memo(Component, areEqual);
};

// Throttle hook for high-frequency events
export const useThrottle = (callback, delay) => {
  const lastRun = useRef(Date.now());

  return useCallback((...args) => {
    if (Date.now() - lastRun.current >= delay) {
      callback(...args);
      lastRun.current = Date.now();
    }
  }, [callback, delay]);
};

// Batch state updates
export const useBatchedUpdates = () => {
  const [updates, setUpdates] = useState([]);
  const timeoutRef = useRef(null);

  const batchUpdate = useCallback((update) => {
    setUpdates(prev => [...prev, update]);
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      setUpdates([]);
    }, 0);
  }, []);

  return { updates, batchUpdate };
};

// Memory-efficient list rendering
export const useInfiniteScroll = (items, loadMore, hasMore, threshold = 200) => {
  const [loading, setLoading] = useState(false);
  const observerRef = useRef();

  const lastItemRef = useCallback((node) => {
    if (loading) return;
    if (observerRef.current) observerRef.current.disconnect();
    
    observerRef.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        setLoading(true);
        loadMore().finally(() => setLoading(false));
      }
    }, { threshold });
    
    if (node) observerRef.current.observe(node);
  }, [loading, hasMore, loadMore, threshold]);

  return { lastItemRef, loading };
};

// Optimized data processing
export const useDataProcessor = (data, processor, deps) => {
  return useMemo(() => {
    if (!data || !Array.isArray(data)) return [];
    return processor(data);
  }, [data, ...deps]);
};

// Cache management utilities
export const createCache = (maxSize = 100, ttl = 300000) => { // 5 minutes default TTL
  const cache = new Map();
  const timestamps = new Map();

  const get = (key) => {
    const timestamp = timestamps.get(key);
    if (timestamp && Date.now() - timestamp > ttl) {
      cache.delete(key);
      timestamps.delete(key);
      return undefined;
    }
    return cache.get(key);
  };

  const set = (key, value) => {
    if (cache.size >= maxSize) {
      const firstKey = cache.keys().next().value;
      cache.delete(firstKey);
      timestamps.delete(firstKey);
    }
    cache.set(key, value);
    timestamps.set(key, Date.now());
  };

  const clear = () => {
    cache.clear();
    timestamps.clear();
  };

  return { get, set, clear, size: () => cache.size };
};

// Performance-optimized component patterns
export const createOptimizedComponent = (Component, options = {}) => {
  const {
    memoize = true,
    customAreEqual,
    displayName
  } = options;

  let OptimizedComponent = Component;

  if (memoize) {
    OptimizedComponent = memo(Component, customAreEqual);
  }

  if (displayName) {
    OptimizedComponent.displayName = displayName;
  }

  return OptimizedComponent;
};