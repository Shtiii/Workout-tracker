// Performance optimization utilities

// Debounce hook for search inputs
import { useCallback, useRef, useState, useEffect } from 'react';

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