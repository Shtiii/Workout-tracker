/**
 * Integration Manager
 * Centralized integration layer connecting all sub-agent components
 */

import { getSecurityManager } from '@/lib/security/SecurityManager';
import { getEncryptionManager } from '@/lib/security/EncryptionManager';
import { getPrivacyManager } from '@/lib/security/PrivacyManager';
import { getDataManager } from '@/lib/data/DataManager';
import { getPerformanceMonitor } from '@/lib/performance/PerformanceMonitor';
import { getAnalyticsTracker } from '@/lib/analytics/AnalyticsTracker';

// Integration configuration
const INTEGRATION_CONFIG = {
  SYNC_INTERVAL: 5000, // 5 seconds
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000, // 1 second
  HEALTH_CHECK_INTERVAL: 30000, // 30 seconds
  ERROR_THRESHOLD: 5,
  PERFORMANCE_THRESHOLD: 1000, // 1 second
  CACHE_TTL: 300000, // 5 minutes
  BATCH_SIZE: 100
};

// Component status
export const COMPONENT_STATUS = {
  INITIALIZING: 'initializing',
  READY: 'ready',
  ERROR: 'error',
  OFFLINE: 'offline',
  SYNCING: 'syncing',
  MAINTENANCE: 'maintenance'
};

// Integration events
export const INTEGRATION_EVENTS = {
  COMPONENT_READY: 'component_ready',
  COMPONENT_ERROR: 'component_error',
  DATA_SYNC_START: 'data_sync_start',
  DATA_SYNC_COMPLETE: 'data_sync_complete',
  DATA_SYNC_ERROR: 'data_sync_error',
  PERFORMANCE_ALERT: 'performance_alert',
  SECURITY_ALERT: 'security_alert',
  PRIVACY_ALERT: 'privacy_alert',
  INTEGRATION_HEALTH_CHECK: 'integration_health_check'
};

/**
 * Integration Manager Class
 * Centralized integration and coordination of all system components
 */
export class IntegrationManager {
  constructor() {
    this.components = new Map();
    this.componentStatus = new Map();
    this.integrationStatus = COMPONENT_STATUS.INITIALIZING;
    this.syncQueue = [];
    this.errorCount = 0;
    this.performanceMetrics = new Map();
    this.healthChecks = new Map();
    this.eventListeners = new Map();
    this.isInitialized = false;
    
    this.initialize();
  }

  /**
   * Initialize integration manager
   */
  async initialize() {
    try {
      console.log('Initializing IntegrationManager...');
      
      // Register all components
      await this.registerComponents();
      
      // Initialize component health checks
      this.initializeHealthChecks();
      
      // Set up event listeners
      this.setupEventListeners();
      
      // Start integration monitoring
      this.startIntegrationMonitoring();
      
      // Perform initial health check
      await this.performHealthCheck();
      
      this.integrationStatus = COMPONENT_STATUS.READY;
      this.isInitialized = true;
      
      console.log('IntegrationManager initialized successfully');
      this.emitEvent(INTEGRATION_EVENTS.COMPONENT_READY, {
        component: 'IntegrationManager',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Failed to initialize IntegrationManager:', error);
      this.integrationStatus = COMPONENT_STATUS.ERROR;
      throw error;
    }
  }

  /**
   * Register all system components
   */
  async registerComponents() {
    const componentConfigs = [
      {
        name: 'SecurityManager',
        instance: getSecurityManager(),
        dependencies: [],
        critical: true
      },
      {
        name: 'EncryptionManager',
        instance: getEncryptionManager(),
        dependencies: [],
        critical: true
      },
      {
        name: 'PrivacyManager',
        instance: getPrivacyManager(),
        dependencies: ['EncryptionManager'],
        critical: true
      },
      {
        name: 'DataManager',
        instance: getDataManager(),
        dependencies: ['SecurityManager', 'EncryptionManager'],
        critical: true
      },
      {
        name: 'PerformanceMonitor',
        instance: getPerformanceMonitor(),
        dependencies: [],
        critical: false
      },
      {
        name: 'AnalyticsTracker',
        instance: getAnalyticsTracker(),
        dependencies: ['SecurityManager', 'PrivacyManager'],
        critical: false
      }
    ];

    for (const config of componentConfigs) {
      await this.registerComponent(config);
    }
  }

  /**
   * Register individual component
   */
  async registerComponent(config) {
    try {
      console.log(`Registering component: ${config.name}`);
      
      // Check dependencies
      for (const dep of config.dependencies) {
        if (!this.components.has(dep)) {
          throw new Error(`Dependency ${dep} not found for ${config.name}`);
        }
      }
      
      // Initialize component if needed
      if (config.instance.initialize && typeof config.instance.initialize === 'function') {
        await config.instance.initialize();
      }
      
      // Register component
      this.components.set(config.name, {
        instance: config.instance,
        config: config,
        status: COMPONENT_STATUS.READY,
        lastHealthCheck: new Date(),
        errorCount: 0
      });
      
      this.componentStatus.set(config.name, COMPONENT_STATUS.READY);
      
      console.log(`Component ${config.name} registered successfully`);
    } catch (error) {
      console.error(`Failed to register component ${config.name}:`, error);
      this.componentStatus.set(config.name, COMPONENT_STATUS.ERROR);
      throw error;
    }
  }

  /**
   * Initialize health checks
   */
  initializeHealthChecks() {
    // Set up health check intervals for each component
    for (const [name, component] of this.components.entries()) {
      this.healthChecks.set(name, {
        interval: setInterval(() => {
          this.checkComponentHealth(name);
        }, INTEGRATION_CONFIG.HEALTH_CHECK_INTERVAL),
        lastCheck: new Date(),
        consecutiveFailures: 0
      });
    }
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Listen for component events
    this.components.forEach((component, name) => {
      if (component.instance.on) {
        component.instance.on('error', (error) => {
          this.handleComponentError(name, error);
        });
        
        component.instance.on('statusChange', (status) => {
          this.handleComponentStatusChange(name, status);
        });
      }
    });
  }

  /**
   * Start integration monitoring
   */
  startIntegrationMonitoring() {
    // Monitor sync queue
    setInterval(() => {
      this.processSyncQueue();
    }, INTEGRATION_CONFIG.SYNC_INTERVAL);
    
    // Monitor performance
    setInterval(() => {
      this.monitorPerformance();
    }, 10000); // Every 10 seconds
    
    // Monitor error rates
    setInterval(() => {
      this.monitorErrorRates();
    }, 30000); // Every 30 seconds
  }

  /**
   * Check component health
   */
  async checkComponentHealth(componentName) {
    try {
      const component = this.components.get(componentName);
      if (!component) return;
      
      // Check if component has health check method
      if (component.instance.getHealthStatus) {
        const healthStatus = component.instance.getHealthStatus();
        if (!healthStatus.isHealthy) {
          throw new Error(`Health check failed: ${healthStatus.reason}`);
        }
      }
      
      // Update health check record
      const healthCheck = this.healthChecks.get(componentName);
      healthCheck.lastCheck = new Date();
      healthCheck.consecutiveFailures = 0;
      
      // Update component status
      if (component.status !== COMPONENT_STATUS.READY) {
        component.status = COMPONENT_STATUS.READY;
        this.componentStatus.set(componentName, COMPONENT_STATUS.READY);
        
        this.emitEvent(INTEGRATION_EVENTS.COMPONENT_READY, {
          component: componentName,
          timestamp: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error(`Health check failed for ${componentName}:`, error);
      this.handleComponentError(componentName, error);
    }
  }

  /**
   * Handle component error
   */
  handleComponentError(componentName, error) {
    const component = this.components.get(componentName);
    if (!component) return;
    
    component.errorCount++;
    component.status = COMPONENT_STATUS.ERROR;
    this.componentStatus.set(componentName, COMPONENT_STATUS.ERROR);
    
    const healthCheck = this.healthChecks.get(componentName);
    healthCheck.consecutiveFailures++;
    
    this.emitEvent(INTEGRATION_EVENTS.COMPONENT_ERROR, {
      component: componentName,
      error: error.message,
      errorCount: component.errorCount,
      timestamp: new Date().toISOString()
    });
    
    // Check if component is critical
    if (component.config.critical && healthCheck.consecutiveFailures >= 3) {
      this.integrationStatus = COMPONENT_STATUS.ERROR;
      console.error(`Critical component ${componentName} has failed multiple times`);
    }
  }

  /**
   * Handle component status change
   */
  handleComponentStatusChange(componentName, status) {
    const component = this.components.get(componentName);
    if (!component) return;
    
    component.status = status;
    this.componentStatus.set(componentName, status);
    
    this.emitEvent(INTEGRATION_EVENTS.COMPONENT_READY, {
      component: componentName,
      status: status,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Process sync queue
   */
  async processSyncQueue() {
    if (this.syncQueue.length === 0) return;
    
    const batch = this.syncQueue.splice(0, INTEGRATION_CONFIG.BATCH_SIZE);
    
    for (const syncItem of batch) {
      try {
        await this.processSyncItem(syncItem);
      } catch (error) {
        console.error('Sync item processing failed:', error);
        // Retry logic
        if (syncItem.retryCount < INTEGRATION_CONFIG.RETRY_ATTEMPTS) {
          syncItem.retryCount++;
          this.syncQueue.push(syncItem);
        }
      }
    }
  }

  /**
   * Process individual sync item
   */
  async processSyncItem(syncItem) {
    const { component, operation, data, callback } = syncItem;
    
    try {
      let result;
      
      switch (operation) {
        case 'create':
          result = await component.instance.create(data);
          break;
        case 'update':
          result = await component.instance.update(data.id, data);
          break;
        case 'delete':
          result = await component.instance.delete(data.id);
          break;
        case 'sync':
          result = await component.instance.sync(data);
          break;
        default:
          throw new Error(`Unknown operation: ${operation}`);
      }
      
      if (callback) {
        callback(null, result);
      }
      
      this.emitEvent(INTEGRATION_EVENTS.DATA_SYNC_COMPLETE, {
        component: component.config.name,
        operation,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      if (callback) {
        callback(error, null);
      }
      
      this.emitEvent(INTEGRATION_EVENTS.DATA_SYNC_ERROR, {
        component: component.config.name,
        operation,
        error: error.message,
        timestamp: new Date().toISOString()
      });
      
      throw error;
    }
  }

  /**
   * Monitor performance
   */
  monitorPerformance() {
    for (const [name, component] of this.components.entries()) {
      if (component.instance.getPerformanceMetrics) {
        const metrics = component.instance.getPerformanceMetrics();
        this.performanceMetrics.set(name, metrics);
        
        // Check for performance alerts
        if (metrics.averageResponseTime > INTEGRATION_CONFIG.PERFORMANCE_THRESHOLD) {
          this.emitEvent(INTEGRATION_EVENTS.PERFORMANCE_ALERT, {
            component: name,
            metric: 'responseTime',
            value: metrics.averageResponseTime,
            threshold: INTEGRATION_CONFIG.PERFORMANCE_THRESHOLD,
            timestamp: new Date().toISOString()
          });
        }
      }
    }
  }

  /**
   * Monitor error rates
   */
  monitorErrorRates() {
    let totalErrors = 0;
    let totalComponents = 0;
    
    for (const [name, component] of this.components.entries()) {
      totalErrors += component.errorCount;
      totalComponents++;
    }
    
    const errorRate = totalErrors / totalComponents;
    
    if (errorRate > INTEGRATION_CONFIG.ERROR_THRESHOLD) {
      this.emitEvent(INTEGRATION_EVENTS.SECURITY_ALERT, {
        type: 'high_error_rate',
        errorRate,
        threshold: INTEGRATION_CONFIG.ERROR_THRESHOLD,
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Perform comprehensive health check
   */
  async performHealthCheck() {
    const healthStatus = {
      overall: 'healthy',
      components: {},
      timestamp: new Date().toISOString(),
      issues: []
    };
    
    for (const [name, component] of this.components.entries()) {
      try {
        const componentHealth = component.instance.getHealthStatus ? 
          component.instance.getHealthStatus() : 
          { isHealthy: component.status === COMPONENT_STATUS.READY };
        
        healthStatus.components[name] = {
          status: component.status,
          healthy: componentHealth.isHealthy,
          lastCheck: component.lastHealthCheck,
          errorCount: component.errorCount
        };
        
        if (!componentHealth.isHealthy) {
          healthStatus.issues.push({
            component: name,
            issue: componentHealth.reason || 'Unknown issue'
          });
        }
      } catch (error) {
        healthStatus.components[name] = {
          status: COMPONENT_STATUS.ERROR,
          healthy: false,
          error: error.message
        };
        healthStatus.issues.push({
          component: name,
          issue: error.message
        });
      }
    }
    
    if (healthStatus.issues.length > 0) {
      healthStatus.overall = 'degraded';
    }
    
    this.emitEvent(INTEGRATION_EVENTS.INTEGRATION_HEALTH_CHECK, healthStatus);
    return healthStatus;
  }

  /**
   * Get component instance
   */
  getComponent(name) {
    const component = this.components.get(name);
    return component ? component.instance : null;
  }

  /**
   * Get component status
   */
  getComponentStatus(name) {
    return this.componentStatus.get(name) || COMPONENT_STATUS.ERROR;
  }

  /**
   * Get all component statuses
   */
  getAllComponentStatuses() {
    const statuses = {};
    for (const [name, status] of this.componentStatus.entries()) {
      statuses[name] = status;
    }
    return statuses;
  }

  /**
   * Get integration status
   */
  getIntegrationStatus() {
    return {
      status: this.integrationStatus,
      isInitialized: this.isInitialized,
      componentCount: this.components.size,
      errorCount: this.errorCount,
      syncQueueLength: this.syncQueue.length,
      performanceMetrics: Object.fromEntries(this.performanceMetrics),
      healthChecks: Object.fromEntries(
        Array.from(this.healthChecks.entries()).map(([name, check]) => [
          name,
          {
            lastCheck: check.lastCheck,
            consecutiveFailures: check.consecutiveFailures
          }
        ])
      )
    };
  }

  /**
   * Add sync item to queue
   */
  addSyncItem(componentName, operation, data, callback = null) {
    const component = this.components.get(componentName);
    if (!component) {
      throw new Error(`Component ${componentName} not found`);
    }
    
    const syncItem = {
      component,
      operation,
      data,
      callback,
      retryCount: 0,
      timestamp: new Date()
    };
    
    this.syncQueue.push(syncItem);
    
    this.emitEvent(INTEGRATION_EVENTS.DATA_SYNC_START, {
      component: componentName,
      operation,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Emit integration event
   */
  emitEvent(eventType, data) {
    const event = {
      type: eventType,
      data,
      timestamp: new Date().toISOString()
    };
    
    // Notify event listeners
    const listeners = this.eventListeners.get(eventType) || [];
    listeners.forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        console.error('Event listener error:', error);
      }
    });
    
    // Log event
    console.log('Integration event:', event);
  }

  /**
   * Add event listener
   */
  on(eventType, listener) {
    if (!this.eventListeners.has(eventType)) {
      this.eventListeners.set(eventType, []);
    }
    this.eventListeners.get(eventType).push(listener);
  }

  /**
   * Remove event listener
   */
  off(eventType, listener) {
    const listeners = this.eventListeners.get(eventType) || [];
    const index = listeners.indexOf(listener);
    if (index > -1) {
      listeners.splice(index, 1);
    }
  }

  /**
   * Cleanup resources
   */
  cleanup() {
    // Clear health check intervals
    for (const [name, healthCheck] of this.healthChecks.entries()) {
      clearInterval(healthCheck.interval);
    }
    
    // Cleanup components
    for (const [name, component] of this.components.entries()) {
      if (component.instance.cleanup) {
        component.instance.cleanup();
      }
    }
    
    // Clear all data
    this.components.clear();
    this.componentStatus.clear();
    this.healthChecks.clear();
    this.eventListeners.clear();
    this.performanceMetrics.clear();
    this.syncQueue = [];
    
    console.log('IntegrationManager cleaned up');
  }
}

// Singleton instance
let integrationManagerInstance = null;

/**
 * Get IntegrationManager instance
 */
export const getIntegrationManager = () => {
  if (!integrationManagerInstance) {
    integrationManagerInstance = new IntegrationManager();
  }
  return integrationManagerInstance;
};

export default IntegrationManager;


