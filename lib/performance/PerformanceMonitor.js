/**
 * Performance Monitoring System
 * Tracks and analyzes application performance metrics
 */

// Performance metrics storage
const performanceMetrics = {
  // Page load metrics
  pageLoadTimes: new Map(),
  componentRenderTimes: new Map(),
  
  // Network metrics
  apiResponseTimes: new Map(),
  networkErrors: new Map(),
  
  // User interaction metrics
  userActions: new Map(),
  clickTimes: new Map(),
  
  // Memory usage
  memoryUsage: [],
  
  // Custom metrics
  customMetrics: new Map(),
  
  // Error tracking
  errors: [],
  
  // Performance budgets
  budgets: {
    pageLoad: 3000, // 3 seconds
    componentRender: 100, // 100ms
    apiResponse: 2000, // 2 seconds
    userInteraction: 100 // 100ms
  }
};

/**
 * Performance Monitor Class
 * Comprehensive performance tracking and analysis
 */
export class PerformanceMonitor {
  constructor() {
    this.isEnabled = process.env.NODE_ENV === 'development' || 
                    localStorage.getItem('performance_monitoring') === 'true';
    this.observers = new Map();
    this.thresholds = {
      warning: 0.8, // 80% of budget
      critical: 1.0 // 100% of budget
    };
    
    this.initialize();
  }

  /**
   * Initialize performance monitoring
   */
  initialize() {
    if (!this.isEnabled) return;

    // Set up performance observers
    this.setupPerformanceObserver();
    this.setupMemoryObserver();
    this.setupNetworkObserver();
    this.setupErrorObserver();
    
    // Set up periodic reporting
    this.setupPeriodicReporting();
    
    console.log('Performance Monitor initialized');
  }

  /**
   * Setup Performance Observer
   */
  setupPerformanceObserver() {
    if (!('PerformanceObserver' in window)) return;

    try {
      // Observe navigation timing
      const navObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach(entry => {
          if (entry.entryType === 'navigation') {
            this.recordPageLoad(entry);
          }
        });
      });
      navObserver.observe({ entryTypes: ['navigation'] });

      // Observe paint timing
      const paintObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach(entry => {
          if (entry.entryType === 'paint') {
            this.recordPaintTiming(entry);
          }
        });
      });
      paintObserver.observe({ entryTypes: ['paint'] });

      // Observe long tasks
      const longTaskObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach(entry => {
          this.recordLongTask(entry);
        });
      });
      longTaskObserver.observe({ entryTypes: ['longtask'] });

      // Observe layout shifts
      const clsObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach(entry => {
          this.recordLayoutShift(entry);
        });
      });
      clsObserver.observe({ entryTypes: ['layout-shift'] });

      // Store observers for cleanup
      this.observers.set('navigation', navObserver);
      this.observers.set('paint', paintObserver);
      this.observers.set('longtask', longTaskObserver);
      this.observers.set('layout-shift', clsObserver);
    } catch (error) {
      console.error('Failed to setup Performance Observer:', error);
    }
  }

  /**
   * Setup Memory Observer
   */
  setupMemoryObserver() {
    if (!('memory' in performance)) return;

    const recordMemory = () => {
      const memory = performance.memory;
      const memoryData = {
        timestamp: Date.now(),
        used: memory.usedJSHeapSize,
        total: memory.totalJSHeapSize,
        limit: memory.jsHeapSizeLimit
      };
      
      performanceMetrics.memoryUsage.push(memoryData);
      
      // Keep only last 100 measurements
      if (performanceMetrics.memoryUsage.length > 100) {
        performanceMetrics.memoryUsage.shift();
      }
    };

    // Record memory every 30 seconds
    setInterval(recordMemory, 30000);
    recordMemory(); // Initial measurement
  }

  /**
   * Setup Network Observer
   */
  setupNetworkObserver() {
    if (!('PerformanceObserver' in window)) return;

    try {
      const networkObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach(entry => {
          if (entry.entryType === 'resource') {
            this.recordNetworkRequest(entry);
          }
        });
      });
      networkObserver.observe({ entryTypes: ['resource'] });
      
      this.observers.set('network', networkObserver);
    } catch (error) {
      console.error('Failed to setup Network Observer:', error);
    }
  }

  /**
   * Setup Error Observer
   */
  setupErrorObserver() {
    // Global error handler
    window.addEventListener('error', (event) => {
      this.recordError({
        type: 'javascript',
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: event.error?.stack,
        timestamp: Date.now()
      });
    });

    // Unhandled promise rejection handler
    window.addEventListener('unhandledrejection', (event) => {
      this.recordError({
        type: 'promise',
        message: event.reason?.message || 'Unhandled promise rejection',
        stack: event.reason?.stack,
        timestamp: Date.now()
      });
    });
  }

  /**
   * Setup periodic reporting
   */
  setupPeriodicReporting() {
    // Report performance metrics every 5 minutes
    setInterval(() => {
      this.generateReport();
    }, 5 * 60 * 1000);
  }

  /**
   * Record page load performance
   */
  recordPageLoad(entry) {
    const metrics = {
      timestamp: Date.now(),
      url: entry.name,
      loadTime: entry.loadEventEnd - entry.loadEventStart,
      domContentLoaded: entry.domContentLoadedEventEnd - entry.domContentLoadedEventStart,
      firstByte: entry.responseStart - entry.requestStart,
      dns: entry.domainLookupEnd - entry.domainLookupStart,
      tcp: entry.connectEnd - entry.connectStart,
      ssl: entry.secureConnectionStart ? entry.connectEnd - entry.secureConnectionStart : 0
    };

    performanceMetrics.pageLoadTimes.set(entry.name, metrics);
    
    // Check against budget
    this.checkBudget('pageLoad', metrics.loadTime, entry.name);
  }

  /**
   * Record paint timing
   */
  recordPaintTiming(entry) {
    const metrics = {
      timestamp: Date.now(),
      name: entry.name,
      startTime: entry.startTime,
      duration: entry.duration
    };

    if (!performanceMetrics.customMetrics.has('paint')) {
      performanceMetrics.customMetrics.set('paint', []);
    }
    performanceMetrics.customMetrics.get('paint').push(metrics);
  }

  /**
   * Record long task
   */
  recordLongTask(entry) {
    const metrics = {
      timestamp: Date.now(),
      duration: entry.duration,
      startTime: entry.startTime
    };

    if (!performanceMetrics.customMetrics.has('longTasks')) {
      performanceMetrics.customMetrics.set('longTasks', []);
    }
    performanceMetrics.customMetrics.get('longTasks').push(metrics);
    
    console.warn('Long task detected:', entry.duration + 'ms');
  }

  /**
   * Record layout shift
   */
  recordLayoutShift(entry) {
    if (entry.hadRecentInput) return; // Ignore user-initiated shifts

    const metrics = {
      timestamp: Date.now(),
      value: entry.value,
      sources: entry.sources?.map(source => ({
        node: source.node,
        previousRect: source.previousRect,
        currentRect: source.currentRect
      }))
    };

    if (!performanceMetrics.customMetrics.has('layoutShifts')) {
      performanceMetrics.customMetrics.set('layoutShifts', []);
    }
    performanceMetrics.customMetrics.get('layoutShifts').push(metrics);
  }

  /**
   * Record network request
   */
  recordNetworkRequest(entry) {
    const metrics = {
      timestamp: Date.now(),
      url: entry.name,
      duration: entry.duration,
      transferSize: entry.transferSize,
      encodedBodySize: entry.encodedBodySize,
      decodedBodySize: entry.decodedBodySize,
      responseTime: entry.responseEnd - entry.responseStart,
      requestTime: entry.requestStart - entry.startTime
    };

    performanceMetrics.apiResponseTimes.set(entry.name, metrics);
    
    // Check against budget
    this.checkBudget('apiResponse', metrics.duration, entry.name);
  }

  /**
   * Record component render time
   */
  recordComponentRender(componentName, renderTime) {
    const metrics = {
      timestamp: Date.now(),
      renderTime,
      componentName
    };

    performanceMetrics.componentRenderTimes.set(componentName, metrics);
    
    // Check against budget
    this.checkBudget('componentRender', renderTime, componentName);
  }

  /**
   * Record user action
   */
  recordUserAction(action, duration) {
    const metrics = {
      timestamp: Date.now(),
      action,
      duration
    };

    performanceMetrics.userActions.set(action, metrics);
    
    // Check against budget
    this.checkBudget('userInteraction', duration, action);
  }

  /**
   * Record click time
   */
  recordClickTime(element, clickTime) {
    const metrics = {
      timestamp: Date.now(),
      element: element.tagName + (element.id ? '#' + element.id : ''),
      clickTime
    };

    performanceMetrics.clickTimes.set(element, metrics);
  }

  /**
   * Record error
   */
  recordError(error) {
    performanceMetrics.errors.push(error);
    
    // Keep only last 100 errors
    if (performanceMetrics.errors.length > 100) {
      performanceMetrics.errors.shift();
    }
    
    console.error('Error recorded:', error);
  }

  /**
   * Record custom metric
   */
  recordCustomMetric(name, value, metadata = {}) {
    const metrics = {
      timestamp: Date.now(),
      value,
      metadata
    };

    if (!performanceMetrics.customMetrics.has(name)) {
      performanceMetrics.customMetrics.set(name, []);
    }
    performanceMetrics.customMetrics.get(name).push(metrics);
  }

  /**
   * Check performance budget
   */
  checkBudget(type, value, identifier) {
    const budget = performanceMetrics.budgets[type];
    if (!budget) return;

    const percentage = (value / budget) * 100;
    
    if (percentage >= this.thresholds.critical * 100) {
      console.error(`Critical performance budget exceeded for ${type}:`, {
        identifier,
        value: value + 'ms',
        budget: budget + 'ms',
        percentage: percentage.toFixed(2) + '%'
      });
    } else if (percentage >= this.thresholds.warning * 100) {
      console.warn(`Performance budget warning for ${type}:`, {
        identifier,
        value: value + 'ms',
        budget: budget + 'ms',
        percentage: percentage.toFixed(2) + '%'
      });
    }
  }

  /**
   * Generate performance report
   */
  generateReport() {
    const report = {
      timestamp: Date.now(),
      summary: this.getSummary(),
      pageLoad: this.getPageLoadMetrics(),
      components: this.getComponentMetrics(),
      network: this.getNetworkMetrics(),
      memory: this.getMemoryMetrics(),
      errors: this.getErrorMetrics(),
      custom: this.getCustomMetrics()
    };

    // Store report
    this.storeReport(report);
    
    // Log summary
    console.log('Performance Report:', report.summary);
    
    return report;
  }

  /**
   * Get performance summary
   */
  getSummary() {
    const pageLoadAvg = this.getAveragePageLoadTime();
    const componentAvg = this.getAverageComponentRenderTime();
    const networkAvg = this.getAverageNetworkTime();
    const memoryUsage = this.getCurrentMemoryUsage();
    const errorCount = performanceMetrics.errors.length;

    return {
      pageLoadAverage: pageLoadAvg,
      componentRenderAverage: componentAvg,
      networkAverage: networkAvg,
      memoryUsage,
      errorCount,
      overallScore: this.calculateOverallScore()
    };
  }

  /**
   * Get page load metrics
   */
  getPageLoadMetrics() {
    const metrics = Array.from(performanceMetrics.pageLoadTimes.values());
    return {
      count: metrics.length,
      average: this.getAveragePageLoadTime(),
      slowest: Math.max(...metrics.map(m => m.loadTime)),
      fastest: Math.min(...metrics.map(m => m.loadTime)),
      details: metrics
    };
  }

  /**
   * Get component metrics
   */
  getComponentMetrics() {
    const metrics = Array.from(performanceMetrics.componentRenderTimes.values());
    return {
      count: metrics.length,
      average: this.getAverageComponentRenderTime(),
      slowest: Math.max(...metrics.map(m => m.renderTime)),
      fastest: Math.min(...metrics.map(m => m.renderTime)),
      details: metrics
    };
  }

  /**
   * Get network metrics
   */
  getNetworkMetrics() {
    const metrics = Array.from(performanceMetrics.apiResponseTimes.values());
    return {
      count: metrics.length,
      average: this.getAverageNetworkTime(),
      slowest: Math.max(...metrics.map(m => m.duration)),
      fastest: Math.min(...metrics.map(m => m.duration)),
      details: metrics
    };
  }

  /**
   * Get memory metrics
   */
  getMemoryMetrics() {
    const metrics = performanceMetrics.memoryUsage;
    const current = this.getCurrentMemoryUsage();
    
    return {
      current,
      average: metrics.reduce((sum, m) => sum + m.used, 0) / metrics.length,
      peak: Math.max(...metrics.map(m => m.used)),
      trend: this.getMemoryTrend()
    };
  }

  /**
   * Get error metrics
   */
  getErrorMetrics() {
    const errors = performanceMetrics.errors;
    const errorTypes = errors.reduce((acc, error) => {
      acc[error.type] = (acc[error.type] || 0) + 1;
      return acc;
    }, {});

    return {
      total: errors.length,
      types: errorTypes,
      recent: errors.slice(-10)
    };
  }

  /**
   * Get custom metrics
   */
  getCustomMetrics() {
    const custom = {};
    performanceMetrics.customMetrics.forEach((metrics, name) => {
      custom[name] = {
        count: metrics.length,
        average: metrics.reduce((sum, m) => sum + m.value, 0) / metrics.length,
        latest: metrics[metrics.length - 1]
      };
    });
    return custom;
  }

  /**
   * Calculate overall performance score
   */
  calculateOverallScore() {
    const pageLoadScore = Math.max(0, 100 - (this.getAveragePageLoadTime() / 100));
    const componentScore = Math.max(0, 100 - (this.getAverageComponentRenderTime() / 10));
    const networkScore = Math.max(0, 100 - (this.getAverageNetworkTime() / 50));
    const errorScore = Math.max(0, 100 - (performanceMetrics.errors.length * 5));
    
    return Math.round((pageLoadScore + componentScore + networkScore + errorScore) / 4);
  }

  /**
   * Helper methods
   */
  getAveragePageLoadTime() {
    const metrics = Array.from(performanceMetrics.pageLoadTimes.values());
    return metrics.reduce((sum, m) => sum + m.loadTime, 0) / metrics.length || 0;
  }

  getAverageComponentRenderTime() {
    const metrics = Array.from(performanceMetrics.componentRenderTimes.values());
    return metrics.reduce((sum, m) => sum + m.renderTime, 0) / metrics.length || 0;
  }

  getAverageNetworkTime() {
    const metrics = Array.from(performanceMetrics.apiResponseTimes.values());
    return metrics.reduce((sum, m) => sum + m.duration, 0) / metrics.length || 0;
  }

  getCurrentMemoryUsage() {
    if (!performance.memory) return 0;
    return performance.memory.usedJSHeapSize;
  }

  getMemoryTrend() {
    const metrics = performanceMetrics.memoryUsage;
    if (metrics.length < 2) return 'stable';
    
    const recent = metrics.slice(-5);
    const trend = recent[recent.length - 1].used - recent[0].used;
    
    if (trend > 1000000) return 'increasing';
    if (trend < -1000000) return 'decreasing';
    return 'stable';
  }

  /**
   * Store performance report
   */
  storeReport(report) {
    try {
      const reports = JSON.parse(localStorage.getItem('performance_reports') || '[]');
      reports.push(report);
      
      // Keep only last 10 reports
      if (reports.length > 10) {
        reports.shift();
      }
      
      localStorage.setItem('performance_reports', JSON.stringify(reports));
    } catch (error) {
      console.error('Failed to store performance report:', error);
    }
  }

  /**
   * Get stored reports
   */
  getStoredReports() {
    try {
      return JSON.parse(localStorage.getItem('performance_reports') || '[]');
    } catch (error) {
      console.error('Failed to get stored reports:', error);
      return [];
    }
  }

  /**
   * Clear all metrics
   */
  clearMetrics() {
    performanceMetrics.pageLoadTimes.clear();
    performanceMetrics.componentRenderTimes.clear();
    performanceMetrics.apiResponseTimes.clear();
    performanceMetrics.userActions.clear();
    performanceMetrics.clickTimes.clear();
    performanceMetrics.memoryUsage.length = 0;
    performanceMetrics.customMetrics.clear();
    performanceMetrics.errors.length = 0;
    
    localStorage.removeItem('performance_reports');
  }

  /**
   * Enable/disable monitoring
   */
  setEnabled(enabled) {
    this.isEnabled = enabled;
    localStorage.setItem('performance_monitoring', enabled.toString());
    
    if (enabled) {
      this.initialize();
    } else {
      this.cleanup();
    }
  }

  /**
   * Cleanup resources
   */
  cleanup() {
    this.observers.forEach(observer => observer.disconnect());
    this.observers.clear();
  }
}

// Singleton instance
let performanceMonitorInstance = null;

/**
 * Get PerformanceMonitor instance
 */
export const getPerformanceMonitor = () => {
  if (!performanceMonitorInstance) {
    performanceMonitorInstance = new PerformanceMonitor();
  }
  return performanceMonitorInstance;
};

/**
 * React hook for performance monitoring
 */
export const usePerformanceMonitor = (componentName) => {
  const monitor = getPerformanceMonitor();
  
  const startRender = () => {
    return performance.now();
  };
  
  const endRender = (startTime) => {
    const renderTime = performance.now() - startTime;
    monitor.recordComponentRender(componentName, renderTime);
  };
  
  const recordAction = (action, duration) => {
    monitor.recordUserAction(action, duration);
  };
  
  const recordMetric = (name, value, metadata) => {
    monitor.recordCustomMetric(name, value, metadata);
  };
  
  return {
    startRender,
    endRender,
    recordAction,
    recordMetric,
    getMetrics: () => monitor.generateReport()
  };
};

export default PerformanceMonitor;
