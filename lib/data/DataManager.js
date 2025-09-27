/**
 * Comprehensive Data Management System
 * Handles data operations, caching, synchronization, and performance optimization
 */

import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  startAfter,
  onSnapshot,
  writeBatch,
  serverTimestamp,
  enableNetwork,
  disableNetwork
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

// Data types and collections
export const DATA_TYPES = {
  WORKOUT_SESSION: 'workoutSessions',
  EXERCISE: 'exercises',
  PROGRAM: 'programs',
  PERSONAL_RECORD: 'personalRecords',
  BODY_MEASUREMENT: 'bodyMeasurements',
  GOAL: 'goals',
  ACHIEVEMENT: 'achievements',
  USER_PROFILE: 'userProfiles',
  SETTINGS: 'settings',
  ANALYTICS: 'analytics'
};

// Cache configuration
const CACHE_CONFIG = {
  TTL: 5 * 60 * 1000, // 5 minutes
  MAX_SIZE: 100, // Maximum number of cached items
  PERSISTENT: true, // Persist cache to localStorage
  COMPRESSION: true // Enable data compression
};

// Performance monitoring
const PERFORMANCE_METRICS = {
  queryTimes: new Map(),
  cacheHits: 0,
  cacheMisses: 0,
  syncOperations: 0,
  errorCount: 0
};

/**
 * Data Manager Class
 * Centralized data management with caching, synchronization, and performance optimization
 */
export class DataManager {
  constructor() {
    this.cache = new Map();
    this.pendingOperations = new Map();
    this.syncQueue = [];
    this.isOnline = navigator.onLine;
    this.listeners = new Map();
    this.batchOperations = [];
    this.isInitialized = false;
    
    this.initialize();
  }

  /**
   * Initialize the data manager
   */
  async initialize() {
    try {
      // Load cache from localStorage
      await this.loadCache();
      
      // Set up online/offline listeners
      this.setupNetworkListeners();
      
      // Initialize performance monitoring
      this.initializePerformanceMonitoring();
      
      // Start background sync
      this.startBackgroundSync();
      
      this.isInitialized = true;
      console.log('DataManager initialized successfully');
    } catch (error) {
      console.error('Failed to initialize DataManager:', error);
      throw error;
    }
  }

  /**
   * Setup network status listeners
   */
  setupNetworkListeners() {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.handleOnline();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.handleOffline();
    });
  }

  /**
   * Handle online status
   */
  async handleOnline() {
    console.log('Network online - starting sync');
    try {
      await enableNetwork();
      await this.processSyncQueue();
      await this.syncPendingOperations();
    } catch (error) {
      console.error('Error handling online status:', error);
    }
  }

  /**
   * Handle offline status
   */
  async handleOffline() {
    console.log('Network offline - queuing operations');
    try {
      await disableNetwork();
    } catch (error) {
      console.error('Error handling offline status:', error);
    }
  }

  /**
   * Initialize performance monitoring
   */
  initializePerformanceMonitoring() {
    // Monitor cache performance
    setInterval(() => {
      const hitRate = PERFORMANCE_METRICS.cacheHits / 
        (PERFORMANCE_METRICS.cacheHits + PERFORMANCE_METRICS.cacheMisses) * 100;
      
      if (hitRate < 70) {
        console.warn('Low cache hit rate:', hitRate.toFixed(2) + '%');
      }
    }, 60000); // Check every minute

    // Monitor query performance
    setInterval(() => {
      const avgQueryTime = Array.from(PERFORMANCE_METRICS.queryTimes.values())
        .reduce((sum, time) => sum + time, 0) / PERFORMANCE_METRICS.queryTimes.size;
      
      if (avgQueryTime > 1000) {
        console.warn('Slow query performance:', avgQueryTime.toFixed(2) + 'ms');
      }
    }, 30000); // Check every 30 seconds
  }

  /**
   * Start background synchronization
   */
  startBackgroundSync() {
    setInterval(async () => {
      if (this.isOnline && this.syncQueue.length > 0) {
        await this.processSyncQueue();
      }
    }, 30000); // Sync every 30 seconds
  }

  /**
   * Load cache from localStorage
   */
  async loadCache() {
    try {
      const cachedData = localStorage.getItem('workoutTracker_cache');
      if (cachedData) {
        const parsed = JSON.parse(cachedData);
        this.cache = new Map(parsed);
        console.log('Cache loaded from localStorage:', this.cache.size, 'items');
      }
    } catch (error) {
      console.error('Failed to load cache:', error);
    }
  }

  /**
   * Save cache to localStorage
   */
  async saveCache() {
    try {
      const cacheArray = Array.from(this.cache.entries());
      localStorage.setItem('workoutTracker_cache', JSON.stringify(cacheArray));
    } catch (error) {
      console.error('Failed to save cache:', error);
    }
  }

  /**
   * Generate cache key
   */
  generateCacheKey(collection, query = null, options = {}) {
    const key = `${collection}_${JSON.stringify(query)}_${JSON.stringify(options)}`;
    return btoa(key).replace(/[^a-zA-Z0-9]/g, '');
  }

  /**
   * Get data from cache
   */
  getFromCache(key) {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < CACHE_CONFIG.TTL) {
      PERFORMANCE_METRICS.cacheHits++;
      return cached.data;
    }
    
    if (cached) {
      this.cache.delete(key);
    }
    
    PERFORMANCE_METRICS.cacheMisses++;
    return null;
  }

  /**
   * Set data in cache
   */
  setCache(key, data) {
    // Implement LRU eviction if cache is full
    if (this.cache.size >= CACHE_CONFIG.MAX_SIZE) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });

    // Save to localStorage asynchronously
    this.saveCache();
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.cache.clear();
    localStorage.removeItem('workoutTracker_cache');
  }

  /**
   * Invalidate cache for specific collection
   */
  invalidateCache(collection) {
    const keysToDelete = [];
    for (const key of this.cache.keys()) {
      if (key.startsWith(collection)) {
        keysToDelete.push(key);
      }
    }
    
    keysToDelete.forEach(key => this.cache.delete(key));
    this.saveCache();
  }

  /**
   * Execute query with caching
   */
  async query(collectionName, queryConstraints = [], options = {}) {
    const startTime = Date.now();
    const cacheKey = this.generateCacheKey(collectionName, queryConstraints, options);
    
    // Check cache first
    const cachedData = this.getFromCache(cacheKey);
    if (cachedData) {
      return cachedData;
    }

    try {
      if (!this.isOnline) {
        throw new Error('Offline - cannot execute query');
      }

      const collectionRef = collection(db, collectionName);
      let q = query(collectionRef, ...queryConstraints);

      // Apply options
      if (options.orderBy) {
        q = query(q, orderBy(options.orderBy.field, options.orderBy.direction || 'asc'));
      }
      
      if (options.limit) {
        q = query(q, limit(options.limit));
      }
      
      if (options.startAfter) {
        q = query(q, startAfter(options.startAfter));
      }

      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        // Convert Firestore timestamps
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate()
      }));

      // Cache the result
      this.setCache(cacheKey, data);

      // Record performance
      const queryTime = Date.now() - startTime;
      PERFORMANCE_METRICS.queryTimes.set(cacheKey, queryTime);

      return data;
    } catch (error) {
      PERFORMANCE_METRICS.errorCount++;
      console.error('Query error:', error);
      throw error;
    }
  }

  /**
   * Get single document
   */
  async getDocument(collectionName, docId) {
    const startTime = Date.now();
    const cacheKey = this.generateCacheKey(collectionName, { docId });
    
    // Check cache first
    const cachedData = this.getFromCache(cacheKey);
    if (cachedData) {
      return cachedData;
    }

    try {
      if (!this.isOnline) {
        throw new Error('Offline - cannot get document');
      }

      const docRef = doc(db, collectionName, docId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = {
          id: docSnap.id,
          ...docSnap.data(),
          createdAt: docSnap.data().createdAt?.toDate(),
          updatedAt: docSnap.data().updatedAt?.toDate()
        };

        // Cache the result
        this.setCache(cacheKey, data);

        // Record performance
        const queryTime = Date.now() - startTime;
        PERFORMANCE_METRICS.queryTimes.set(cacheKey, queryTime);

        return data;
      } else {
        return null;
      }
    } catch (error) {
      PERFORMANCE_METRICS.errorCount++;
      console.error('Get document error:', error);
      throw error;
    }
  }

  /**
   * Add document
   */
  async addDocument(collectionName, data) {
    try {
      if (!this.isOnline) {
        // Queue for offline sync
        this.syncQueue.push({
          type: 'add',
          collection: collectionName,
          data: { ...data, createdAt: new Date(), updatedAt: new Date() }
        });
        return { id: 'pending_' + Date.now(), ...data };
      }

      const collectionRef = collection(db, collectionName);
      const docData = {
        ...data,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      const docRef = await addDoc(collectionRef, docData);
      
      // Invalidate cache
      this.invalidateCache(collectionName);

      return { id: docRef.id, ...data };
    } catch (error) {
      PERFORMANCE_METRICS.errorCount++;
      console.error('Add document error:', error);
      throw error;
    }
  }

  /**
   * Update document
   */
  async updateDocument(collectionName, docId, data) {
    try {
      if (!this.isOnline) {
        // Queue for offline sync
        this.syncQueue.push({
          type: 'update',
          collection: collectionName,
          docId,
          data: { ...data, updatedAt: new Date() }
        });
        return { id: docId, ...data };
      }

      const docRef = doc(db, collectionName, docId);
      const updateData = {
        ...data,
        updatedAt: serverTimestamp()
      };

      await updateDoc(docRef, updateData);
      
      // Invalidate cache
      this.invalidateCache(collectionName);

      return { id: docId, ...data };
    } catch (error) {
      PERFORMANCE_METRICS.errorCount++;
      console.error('Update document error:', error);
      throw error;
    }
  }

  /**
   * Delete document
   */
  async deleteDocument(collectionName, docId) {
    try {
      if (!this.isOnline) {
        // Queue for offline sync
        this.syncQueue.push({
          type: 'delete',
          collection: collectionName,
          docId
        });
        return true;
      }

      const docRef = doc(db, collectionName, docId);
      await deleteDoc(docRef);
      
      // Invalidate cache
      this.invalidateCache(collectionName);

      return true;
    } catch (error) {
      PERFORMANCE_METRICS.errorCount++;
      console.error('Delete document error:', error);
      throw error;
    }
  }

  /**
   * Batch operations
   */
  async batchOperation(operations) {
    try {
      if (!this.isOnline) {
        // Queue for offline sync
        this.syncQueue.push({
          type: 'batch',
          operations
        });
        return true;
      }

      const batch = writeBatch(db);
      
      operations.forEach(op => {
        const { type, collection, docId, data } = op;
        const docRef = doc(db, collection, docId);
        
        switch (type) {
          case 'set':
            batch.set(docRef, { ...data, updatedAt: serverTimestamp() });
            break;
          case 'update':
            batch.update(docRef, { ...data, updatedAt: serverTimestamp() });
            break;
          case 'delete':
            batch.delete(docRef);
            break;
        }
      });

      await batch.commit();
      
      // Invalidate cache for all affected collections
      const affectedCollections = [...new Set(operations.map(op => op.collection))];
      affectedCollections.forEach(col => this.invalidateCache(col));

      return true;
    } catch (error) {
      PERFORMANCE_METRICS.errorCount++;
      console.error('Batch operation error:', error);
      throw error;
    }
  }

  /**
   * Real-time listener
   */
  subscribeToCollection(collectionName, callback, queryConstraints = []) {
    try {
      const collectionRef = collection(db, collectionName);
      let q = query(collectionRef, ...queryConstraints);
      
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const data = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate(),
          updatedAt: doc.data().updatedAt?.toDate()
        }));
        
        callback(data);
      }, (error) => {
        console.error('Real-time listener error:', error);
        PERFORMANCE_METRICS.errorCount++;
      });

      // Store listener for cleanup
      const listenerId = `${collectionName}_${Date.now()}`;
      this.listeners.set(listenerId, unsubscribe);

      return () => {
        unsubscribe();
        this.listeners.delete(listenerId);
      };
    } catch (error) {
      console.error('Subscribe error:', error);
      throw error;
    }
  }

  /**
   * Process sync queue
   */
  async processSyncQueue() {
    if (this.syncQueue.length === 0) return;

    console.log('Processing sync queue:', this.syncQueue.length, 'operations');
    
    const operations = [...this.syncQueue];
    this.syncQueue = [];

    for (const operation of operations) {
      try {
        switch (operation.type) {
          case 'add':
            await this.addDocument(operation.collection, operation.data);
            break;
          case 'update':
            await this.updateDocument(operation.collection, operation.docId, operation.data);
            break;
          case 'delete':
            await this.deleteDocument(operation.collection, operation.docId);
            break;
          case 'batch':
            await this.batchOperation(operation.operations);
            break;
        }
        
        PERFORMANCE_METRICS.syncOperations++;
      } catch (error) {
        console.error('Sync operation failed:', error);
        // Re-queue failed operations
        this.syncQueue.push(operation);
      }
    }
  }

  /**
   * Sync pending operations
   */
  async syncPendingOperations() {
    // Implementation for syncing pending operations
    console.log('Syncing pending operations');
  }

  /**
   * Get performance metrics
   */
  getPerformanceMetrics() {
    const avgQueryTime = Array.from(PERFORMANCE_METRICS.queryTimes.values())
      .reduce((sum, time) => sum + time, 0) / PERFORMANCE_METRICS.queryTimes.size || 0;
    
    const cacheHitRate = PERFORMANCE_METRICS.cacheHits / 
      (PERFORMANCE_METRICS.cacheHits + PERFORMANCE_METRICS.cacheMisses) * 100 || 0;

    return {
      cacheSize: this.cache.size,
      cacheHitRate: cacheHitRate.toFixed(2) + '%',
      avgQueryTime: avgQueryTime.toFixed(2) + 'ms',
      syncOperations: PERFORMANCE_METRICS.syncOperations,
      errorCount: PERFORMANCE_METRICS.errorCount,
      pendingOperations: this.syncQueue.length,
      isOnline: this.isOnline,
      activeListeners: this.listeners.size
    };
  }

  /**
   * Cleanup resources
   */
  cleanup() {
    // Unsubscribe all listeners
    this.listeners.forEach(unsubscribe => unsubscribe());
    this.listeners.clear();
    
    // Save cache
    this.saveCache();
    
    console.log('DataManager cleaned up');
  }
}

// Singleton instance
let dataManagerInstance = null;

/**
 * Get DataManager instance
 */
export const getDataManager = () => {
  if (!dataManagerInstance) {
    dataManagerInstance = new DataManager();
  }
  return dataManagerInstance;
};

/**
 * Data validation utilities
 */
export const validateData = {
  workoutSession: (data) => {
    const required = ['exercises', 'completedAt'];
    return required.every(field => data[field] !== undefined);
  },
  
  exercise: (data) => {
    const required = ['name', 'sets'];
    return required.every(field => data[field] !== undefined);
  },
  
  personalRecord: (data) => {
    const required = ['exercise', 'weight', 'reps'];
    return required.every(field => data[field] !== undefined);
  },
  
  bodyMeasurement: (data) => {
    const required = ['weight', 'date'];
    return required.every(field => data[field] !== undefined);
  },
  
  goal: (data) => {
    const required = ['title', 'target', 'category'];
    return required.every(field => data[field] !== undefined);
  }
};

/**
 * Data sanitization utilities
 */
export const sanitizeData = {
  workoutSession: (data) => {
    return {
      ...data,
      exercises: data.exercises?.map(exercise => ({
        ...exercise,
        name: exercise.name?.trim(),
        sets: exercise.sets?.map(set => ({
          ...set,
          weight: Math.max(0, Number(set.weight) || 0),
          reps: Math.max(0, Number(set.reps) || 0)
        }))
      }))
    };
  },
  
  personalRecord: (data) => {
    return {
      ...data,
      exercise: data.exercise?.trim(),
      weight: Math.max(0, Number(data.weight) || 0),
      reps: Math.max(0, Number(data.reps) || 0)
    };
  },
  
  bodyMeasurement: (data) => {
    return {
      ...data,
      weight: Math.max(0, Number(data.weight) || 0),
      bodyFat: Math.max(0, Math.min(100, Number(data.bodyFat) || 0)),
      muscleMass: Math.max(0, Number(data.muscleMass) || 0)
    };
  },
  
  goal: (data) => {
    return {
      ...data,
      title: data.title?.trim(),
      description: data.description?.trim(),
      target: Math.max(0, Number(data.target) || 0),
      current: Math.max(0, Number(data.current) || 0)
    };
  }
};

export default DataManager;
