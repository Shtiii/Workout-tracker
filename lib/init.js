/**
 * Application Initialization
 * Initialize all managers and services
 */

import { getIntegrationManager } from './integration/IntegrationManager';
import { getSecurityManager } from './security/SecurityManager';
import { getEncryptionManager } from './security/EncryptionManager';
import { getPrivacyManager } from './security/PrivacyManager';
import { getDataManager } from './data/DataManager';
import { getPerformanceMonitor } from './performance/PerformanceMonitor';
import { getAnalyticsTracker } from './analytics/AnalyticsTracker';

let isInitialized = false;
let initializationPromise = null;

/**
 * Initialize all application managers and services
 */
export async function initializeApp() {
  if (isInitialized) {
    return;
  }

  if (initializationPromise) {
    return initializationPromise;
  }

  initializationPromise = initializeManagers();
  return initializationPromise;
}

/**
 * Initialize all managers
 */
async function initializeManagers() {
  try {
    console.log('Initializing application managers...');
    
    // Initialize core managers first
    const encryptionManager = getEncryptionManager();
    const securityManager = getSecurityManager();
    const privacyManager = getPrivacyManager();
    
    // Wait for core managers to initialize
    await Promise.all([
      encryptionManager.initialize(),
      securityManager.initialize(),
      privacyManager.initialize()
    ]);
    
    // Initialize dependent managers
    const dataManager = getDataManager();
    const performanceMonitor = getPerformanceMonitor();
    const analyticsTracker = getAnalyticsTracker();
    
    await Promise.all([
      dataManager.initialize(),
      performanceMonitor.initialize(),
      analyticsTracker.initialize()
    ]);
    
    // Initialize integration manager last (depends on all others)
    const integrationManager = getIntegrationManager();
    await integrationManager.initialize();
    
    isInitialized = true;
    console.log('All managers initialized successfully');
    
    // Log initialization success
    if (analyticsTracker.trackEvent) {
      analyticsTracker.trackEvent('app_initialized', {
        timestamp: new Date().toISOString(),
        managers: [
          'SecurityManager',
          'EncryptionManager', 
          'PrivacyManager',
          'DataManager',
          'PerformanceMonitor',
          'AnalyticsTracker',
          'IntegrationManager'
        ]
      });
    }
    
  } catch (error) {
    console.error('Failed to initialize managers:', error);
    
    // Track initialization error
    try {
      const analyticsTracker = getAnalyticsTracker();
      if (analyticsTracker.trackError) {
        analyticsTracker.trackError('app_initialization_failed', error);
      }
    } catch (trackingError) {
      console.error('Failed to track initialization error:', trackingError);
    }
    
    throw error;
  }
}

/**
 * Check if app is initialized
 */
export function isAppInitialized() {
  return isInitialized;
}

/**
 * Get initialization status
 */
export function getInitializationStatus() {
  return {
    isInitialized,
    hasPromise: !!initializationPromise
  };
}

/**
 * Reset initialization state (for testing)
 */
export function resetInitialization() {
  isInitialized = false;
  initializationPromise = null;
}


