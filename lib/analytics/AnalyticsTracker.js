/**
 * Analytics Tracking System
 * Comprehensive analytics and user behavior tracking
 */

// Analytics configuration
const ANALYTICS_CONFIG = {
  ENABLED: true,
  DEBUG: process.env.NODE_ENV === 'development',
  BATCH_SIZE: 10,
  FLUSH_INTERVAL: 30000, // 30 seconds
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000
};

// Event types
export const EVENT_TYPES = {
  // User actions
  USER_LOGIN: 'user_login',
  USER_LOGOUT: 'user_logout',
  USER_REGISTER: 'user_register',
  
  // Workout events
  WORKOUT_START: 'workout_start',
  WORKOUT_COMPLETE: 'workout_complete',
  WORKOUT_PAUSE: 'workout_pause',
  WORKOUT_RESUME: 'workout_resume',
  EXERCISE_ADD: 'exercise_add',
  EXERCISE_REMOVE: 'exercise_remove',
  SET_COMPLETE: 'set_complete',
  SET_UPDATE: 'set_update',
  
  // Program events
  PROGRAM_CREATE: 'program_create',
  PROGRAM_UPDATE: 'program_update',
  PROGRAM_DELETE: 'program_delete',
  PROGRAM_START: 'program_start',
  PROGRAM_COMPLETE: 'program_complete',
  
  // Analytics events
  ANALYTICS_VIEW: 'analytics_view',
  CHART_INTERACTION: 'chart_interaction',
  FILTER_APPLY: 'filter_apply',
  EXPORT_DATA: 'export_data',
  
  // Achievement events
  ACHIEVEMENT_UNLOCK: 'achievement_unlock',
  GOAL_CREATE: 'goal_create',
  GOAL_COMPLETE: 'goal_complete',
  STREAK_UPDATE: 'streak_update',
  
  // UI events
  PAGE_VIEW: 'page_view',
  BUTTON_CLICK: 'button_click',
  FORM_SUBMIT: 'form_submit',
  MODAL_OPEN: 'modal_open',
  MODAL_CLOSE: 'modal_close',
  
  // Error events
  ERROR_OCCURRED: 'error_occurred',
  API_ERROR: 'api_error',
  VALIDATION_ERROR: 'validation_error',
  
  // Performance events
  PERFORMANCE_ISSUE: 'performance_issue',
  SLOW_QUERY: 'slow_query',
  MEMORY_WARNING: 'memory_warning'
};

// Event storage
let eventQueue = [];
let isFlushing = false;
let flushTimer = null;

/**
 * Analytics Tracker Class
 * Comprehensive analytics and user behavior tracking
 */
export class AnalyticsTracker {
  constructor() {
    this.isEnabled = ANALYTICS_CONFIG.ENABLED;
    this.debug = ANALYTICS_CONFIG.DEBUG;
    this.sessionId = this.generateSessionId();
    this.userId = null;
    this.userProperties = {};
    this.customDimensions = {};
    
    this.initialize();
  }

  /**
   * Initialize analytics tracker
   */
  initialize() {
    if (!this.isEnabled) return;

    // Set up automatic event flushing
    this.setupAutoFlush();
    
    // Track session start
    this.track(EVENT_TYPES.PAGE_VIEW, {
      page: window.location.pathname,
      referrer: document.referrer,
      user_agent: navigator.userAgent,
      screen_resolution: `${screen.width}x${screen.height}`,
      viewport_size: `${window.innerWidth}x${window.innerHeight}`
    });

    // Track page visibility changes
    this.setupPageVisibilityTracking();
    
    // Track unload events
    this.setupUnloadTracking();
    
    if (this.debug) {
      console.log('Analytics Tracker initialized');
    }
  }

  /**
   * Setup automatic event flushing
   */
  setupAutoFlush() {
    flushTimer = setInterval(() => {
      this.flush();
    }, ANALYTICS_CONFIG.FLUSH_INTERVAL);
  }

  /**
   * Setup page visibility tracking
   */
  setupPageVisibilityTracking() {
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.track('page_hidden', {
          time_on_page: Date.now() - this.sessionStartTime
        });
      } else {
        this.track('page_visible', {
          time_away: Date.now() - this.lastHiddenTime
        });
      }
    });
  }

  /**
   * Setup unload tracking
   */
  setupUnloadTracking() {
    window.addEventListener('beforeunload', () => {
      this.track('session_end', {
        session_duration: Date.now() - this.sessionStartTime,
        events_sent: this.eventsSent
      });
      this.flush(true); // Force flush on unload
    });
  }

  /**
   * Set user ID
   */
  setUserId(userId) {
    this.userId = userId;
    this.track(EVENT_TYPES.USER_LOGIN, {
      user_id: userId
    });
  }

  /**
   * Set user properties
   */
  setUserProperties(properties) {
    this.userProperties = { ...this.userProperties, ...properties };
  }

  /**
   * Set custom dimensions
   */
  setCustomDimensions(dimensions) {
    this.customDimensions = { ...this.customDimensions, ...dimensions };
  }

  /**
   * Track event
   */
  track(eventType, properties = {}) {
    if (!this.isEnabled) return;

    const event = {
      event_type: eventType,
      properties: {
        ...properties,
        ...this.userProperties,
        ...this.customDimensions
      },
      timestamp: Date.now(),
      session_id: this.sessionId,
      user_id: this.userId,
      page: window.location.pathname,
      url: window.location.href,
      user_agent: navigator.userAgent,
      screen_resolution: `${screen.width}x${screen.height}`,
      viewport_size: `${window.innerWidth}x${window.innerHeight}`,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      language: navigator.language
    };

    // Add to queue
    eventQueue.push(event);

    if (this.debug) {
      console.log('Analytics event tracked:', event);
    }

    // Auto-flush if queue is full
    if (eventQueue.length >= ANALYTICS_CONFIG.BATCH_SIZE) {
      this.flush();
    }
  }

  /**
   * Track page view
   */
  trackPageView(page, title = null) {
    this.track(EVENT_TYPES.PAGE_VIEW, {
      page,
      title: title || document.title,
      referrer: document.referrer
    });
  }

  /**
   * Track user action
   */
  trackUserAction(action, element = null, properties = {}) {
    this.track(EVENT_TYPES.BUTTON_CLICK, {
      action,
      element: element?.tagName || null,
      element_id: element?.id || null,
      element_class: element?.className || null,
      ...properties
    });
  }

  /**
   * Track workout event
   */
  trackWorkoutEvent(eventType, workoutData = {}) {
    this.track(eventType, {
      workout_id: workoutData.id,
      exercise_count: workoutData.exercises?.length || 0,
      total_sets: workoutData.exercises?.reduce((sum, ex) => sum + ex.sets.length, 0) || 0,
      duration: workoutData.duration,
      ...workoutData
    });
  }

  /**
   * Track exercise event
   */
  trackExerciseEvent(eventType, exerciseData = {}) {
    this.track(eventType, {
      exercise_name: exerciseData.name,
      exercise_category: exerciseData.category,
      set_count: exerciseData.sets?.length || 0,
      ...exerciseData
    });
  }

  /**
   * Track set event
   */
  trackSetEvent(eventType, setData = {}) {
    this.track(eventType, {
      exercise_name: setData.exerciseName,
      weight: setData.weight,
      reps: setData.reps,
      is_pr: setData.isPR || false,
      ...setData
    });
  }

  /**
   * Track program event
   */
  trackProgramEvent(eventType, programData = {}) {
    this.track(eventType, {
      program_id: programData.id,
      program_name: programData.name,
      program_type: programData.type,
      exercise_count: programData.exercises?.length || 0,
      ...programData
    });
  }

  /**
   * Track achievement event
   */
  trackAchievementEvent(eventType, achievementData = {}) {
    this.track(eventType, {
      achievement_id: achievementData.id,
      achievement_name: achievementData.name,
      achievement_category: achievementData.category,
      achievement_rarity: achievementData.rarity,
      ...achievementData
    });
  }

  /**
   * Track goal event
   */
  trackGoalEvent(eventType, goalData = {}) {
    this.track(eventType, {
      goal_id: goalData.id,
      goal_title: goalData.title,
      goal_category: goalData.category,
      goal_target: goalData.target,
      goal_current: goalData.current,
      goal_progress: goalData.current / goalData.target * 100,
      ...goalData
    });
  }

  /**
   * Track error event
   */
  trackError(error, context = {}) {
    this.track(EVENT_TYPES.ERROR_OCCURRED, {
      error_message: error.message,
      error_stack: error.stack,
      error_type: error.constructor.name,
      context,
      page: window.location.pathname,
      user_agent: navigator.userAgent
    });
  }

  /**
   * Track performance event
   */
  trackPerformance(metric, value, context = {}) {
    this.track(EVENT_TYPES.PERFORMANCE_ISSUE, {
      metric,
      value,
      context,
      page: window.location.pathname
    });
  }

  /**
   * Track custom event
   */
  trackCustom(eventName, properties = {}) {
    this.track(eventName, properties);
  }

  /**
   * Flush events to server
   */
  async flush(force = false) {
    if (isFlushing && !force) return;
    if (eventQueue.length === 0) return;

    isFlushing = true;
    const eventsToSend = [...eventQueue];
    eventQueue = [];

    try {
      await this.sendEvents(eventsToSend);
      this.eventsSent += eventsToSend.length;
      
      if (this.debug) {
        console.log(`Analytics events flushed: ${eventsToSend.length}`);
      }
    } catch (error) {
      console.error('Failed to flush analytics events:', error);
      
      // Re-queue events on failure
      eventQueue.unshift(...eventsToSend);
      
      // Retry logic
      if (this.retryCount < ANALYTICS_CONFIG.RETRY_ATTEMPTS) {
        this.retryCount++;
        setTimeout(() => this.flush(), ANALYTICS_CONFIG.RETRY_DELAY * this.retryCount);
      }
    } finally {
      isFlushing = false;
    }
  }

  /**
   * Send events to server
   */
  async sendEvents(events) {
    // In a real implementation, this would send to your analytics service
    // For now, we'll simulate the API call
    
    if (this.debug) {
      console.log('Sending analytics events:', events);
    }

    // Simulate API call
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        // Simulate occasional failures
        if (Math.random() < 0.1) {
          reject(new Error('Simulated API failure'));
        } else {
          resolve();
        }
      }, 100);
    });
  }

  /**
   * Generate session ID
   */
  generateSessionId() {
    return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  /**
   * Get analytics data
   */
  getAnalyticsData() {
    return {
      sessionId: this.sessionId,
      userId: this.userId,
      userProperties: this.userProperties,
      customDimensions: this.customDimensions,
      eventsInQueue: eventQueue.length,
      eventsSent: this.eventsSent || 0
    };
  }

  /**
   * Clear analytics data
   */
  clearAnalyticsData() {
    eventQueue = [];
    this.userId = null;
    this.userProperties = {};
    this.customDimensions = {};
    this.eventsSent = 0;
    this.retryCount = 0;
  }

  /**
   * Enable/disable analytics
   */
  setEnabled(enabled) {
    this.isEnabled = enabled;
    
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
    if (flushTimer) {
      clearInterval(flushTimer);
      flushTimer = null;
    }
    
    // Flush remaining events
    this.flush(true);
  }
}

// Singleton instance
let analyticsTrackerInstance = null;

/**
 * Get AnalyticsTracker instance
 */
export const getAnalyticsTracker = () => {
  if (!analyticsTrackerInstance) {
    analyticsTrackerInstance = new AnalyticsTracker();
  }
  return analyticsTrackerInstance;
};

/**
 * React hook for analytics tracking
 */
export const useAnalytics = () => {
  const tracker = getAnalyticsTracker();
  
  const track = (eventType, properties) => {
    tracker.track(eventType, properties);
  };
  
  const trackPageView = (page, title) => {
    tracker.trackPageView(page, title);
  };
  
  const trackUserAction = (action, element, properties) => {
    tracker.trackUserAction(action, element, properties);
  };
  
  const trackWorkoutEvent = (eventType, workoutData) => {
    tracker.trackWorkoutEvent(eventType, workoutData);
  };
  
  const trackExerciseEvent = (eventType, exerciseData) => {
    tracker.trackExerciseEvent(eventType, exerciseData);
  };
  
  const trackSetEvent = (eventType, setData) => {
    tracker.trackSetEvent(eventType, setData);
  };
  
  const trackProgramEvent = (eventType, programData) => {
    tracker.trackProgramEvent(eventType, programData);
  };
  
  const trackAchievementEvent = (eventType, achievementData) => {
    tracker.trackAchievementEvent(eventType, achievementData);
  };
  
  const trackGoalEvent = (eventType, goalData) => {
    tracker.trackGoalEvent(eventType, goalData);
  };
  
  const trackError = (error, context) => {
    tracker.trackError(error, context);
  };
  
  const trackPerformance = (metric, value, context) => {
    tracker.trackPerformance(metric, value, context);
  };
  
  const trackCustom = (eventName, properties) => {
    tracker.trackCustom(eventName, properties);
  };
  
  return {
    track,
    trackPageView,
    trackUserAction,
    trackWorkoutEvent,
    trackExerciseEvent,
    trackSetEvent,
    trackProgramEvent,
    trackAchievementEvent,
    trackGoalEvent,
    trackError,
    trackPerformance,
    trackCustom,
    setUserId: tracker.setUserId.bind(tracker),
    setUserProperties: tracker.setUserProperties.bind(tracker),
    setCustomDimensions: tracker.setCustomDimensions.bind(tracker)
  };
};

export default AnalyticsTracker;


