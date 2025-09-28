/**
 * @fileoverview Offline storage utilities for workout data backup and synchronization
 * Provides localStorage-based persistence for offline functionality
 *
 * @author Workout Tracker Team
 * @version 1.0.0
 */

import { STORAGE_CONFIG, SW_CONFIG } from './constants.js';
import { encryptData, decryptData } from './security.js';

// Use constants for storage keys
const {
  OFFLINE_WORKOUTS_KEY,
  OFFLINE_PROGRAMS_KEY,
  MAX_OFFLINE_WORKOUTS,
  MAX_OFFLINE_PROGRAMS
} = STORAGE_CONFIG;

/**
 * Saves workout data to localStorage as a backup when online sync fails
 *
 * @param {Object} workoutData - The workout data to save offline
 * @param {string} workoutData.name - Name of the workout
 * @param {Array} workoutData.exercises - Array of exercise data
 * @param {Date} workoutData.date - Date when workout was performed
 * @param {number} workoutData.duration - Duration in minutes
 *
 * @returns {Object|null} The saved workout with offline metadata, or null if failed
 *
 * @example
 * const workout = {
 *   name: 'Morning Cardio',
 *   exercises: [{ name: 'Running', duration: 30 }],
 *   date: new Date(),
 *   duration: 30
 * };
 * const savedWorkout = saveWorkoutOffline(workout);
 */
export const saveWorkoutOffline = async (workoutData) => {
  // Check if we're running on the client side
  if (typeof window === 'undefined') {
    console.warn('localStorage not available on server side');
    return null;
  }

  try {
    const existingWorkouts = await getOfflineWorkouts();

    // Enforce storage limits to prevent quota issues
    if (existingWorkouts.length >= MAX_OFFLINE_WORKOUTS) {
      console.warn('Maximum offline workouts reached, removing oldest entry');
      existingWorkouts.shift(); // Remove oldest workout
    }

    const workoutWithId = {
      ...workoutData,
      offlineId: generateOfflineId(), // More robust ID generation
      savedOffline: true,
      timestamp: new Date().toISOString(),
      version: '1.0', // For future migration purposes
      syncAttempts: 0 // Track sync retry attempts
    };

    existingWorkouts.push(workoutWithId);

    // Validate storage before saving
    const dataSize = JSON.stringify(existingWorkouts).length;
    if (dataSize > 5 * 1024 * 1024) { // 5MB limit
      throw new Error('Storage quota exceeded');
    }

    // Encrypt data before storing
    const encryptedData = await encryptData(existingWorkouts);
    localStorage.setItem(OFFLINE_WORKOUTS_KEY, encryptedData);
    console.log('Workout saved offline:', workoutWithId.offlineId);

    // Trigger service worker sync if available
    triggerBackgroundSync();

    return workoutWithId;
  } catch (error) {
    console.error('Failed to save workout offline:', error);
    return null;
  }
};

/**
 * Retrieves all offline workouts from localStorage
 *
 * @returns {Array<Object>} Array of offline workout objects
 *
 * @example
 * const offlineWorkouts = getOfflineWorkouts();
 * console.log(`Found ${offlineWorkouts.length} offline workouts`);
 */
export const getOfflineWorkouts = async () => {
  // Check if we're running on the client side
  if (typeof window === 'undefined') {
    return [];
  }

  try {
    const stored = localStorage.getItem(OFFLINE_WORKOUTS_KEY);
    if (!stored) return [];
    
    // Try to decrypt the data
    const decryptedData = await decryptData(stored);
    return Array.isArray(decryptedData) ? decryptedData : [];
  } catch (error) {
    console.error('Failed to get offline workouts:', error);
    return [];
  }
};

/**
 * Removes a successfully synced workout from offline storage
 *
 * @param {string|number} offlineId - The offline ID of the workout to remove
 *
 * @example
 * removeOfflineWorkout('1640995200000-0.123');
 */
export const removeOfflineWorkout = async (offlineId) => {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    const workouts = await getOfflineWorkouts();
    const updated = workouts.filter(w => w.offlineId !== offlineId);
    const encryptedData = await encryptData(updated);
    localStorage.setItem(OFFLINE_WORKOUTS_KEY, encryptedData);
    console.log('Removed offline workout:', offlineId);
  } catch (error) {
    console.error('Failed to remove offline workout:', error);
  }
};

/**
 * Attempts to save workout to Firebase with localStorage backup fallback
 *
 * @param {Object} workoutData - The workout data to save
 * @param {Function} firebaseFunction - The Firebase save function to call
 *
 * @returns {Promise<Object>} Result object with success status and data
 *
 * @example
 * const result = await saveWorkoutWithBackup(workoutData, saveToFirebase);
 * if (result.success) {
 *   console.log('Saved to Firebase');
 * } else {
 *   console.log('Saved offline for later sync');
 * }
 */
export const saveWorkoutWithBackup = async (workoutData, firebaseFunction) => {
  // Always save to localStorage first as backup
  const offlineWorkout = await saveWorkoutOffline(workoutData);

  try {
    // Try to save to Firebase
    const result = await firebaseFunction(workoutData);

    // If successful, remove from offline storage
    if (offlineWorkout) {
      await removeOfflineWorkout(offlineWorkout.offlineId);
    }

    return { success: true, result };
  } catch (error) {
    console.error('Firebase save failed, workout saved offline:', error);
    return { success: false, error, offlineWorkout };
  }
};

/**
 * Synchronizes all offline workouts with Firebase when connection is restored
 *
 * @param {Function} firebaseFunction - The Firebase sync function to call for each workout
 *
 * @returns {Promise<Object>} Sync results with counts of successful and failed syncs
 *
 * @example
 * const result = await syncOfflineWorkouts(syncWorkoutToFirebase);
 * console.log(`Synced: ${result.synced}, Failed: ${result.failed}`);
 */
export const syncOfflineWorkouts = async (firebaseFunction) => {
  const offlineWorkouts = await getOfflineWorkouts();

  if (offlineWorkouts.length === 0) return { synced: 0, failed: 0 };

  let synced = 0;
  let failed = 0;

  for (const workout of offlineWorkouts) {
    try {
      await firebaseFunction(workout);
      await removeOfflineWorkout(workout.offlineId);
      synced++;

      // Add delay to respect rate limits
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
      console.error('Failed to sync workout:', error);

      // Increment sync attempts counter
      await incrementSyncAttempts(workout.offlineId);
      failed++;
    }
  }

  return { synced, failed };
};

/**
 * Checks if there are pending offline workouts waiting for sync
 *
 * @returns {boolean} True if there are pending workouts
 */
export const hasPendingWorkouts = async () => {
  const workouts = await getOfflineWorkouts();
  return workouts.length > 0;
};

/**
 * Gets the count of offline workouts
 *
 * @returns {number} Number of workouts stored offline
 */
export const getOfflineWorkoutCount = async () => {
  const workouts = await getOfflineWorkouts();
  return workouts.length;
};

/**
 * Gets detailed statistics about offline storage
 *
 * @returns {Object} Storage statistics including counts, sizes, and oldest entry
 */
export const getOfflineStorageStats = async () => {
  const workouts = await getOfflineWorkouts();
  const programs = await getOfflinePrograms();

  const workoutData = JSON.stringify(workouts);
  const programData = JSON.stringify(programs);

  const oldestWorkout = workouts.length > 0
    ? workouts.reduce((oldest, current) =>
        new Date(current.timestamp) < new Date(oldest.timestamp) ? current : oldest
      )
    : null;

  return {
    workoutCount: workouts.length,
    programCount: programs.length,
    workoutSizeBytes: workoutData.length,
    programSizeBytes: programData.length,
    totalSizeBytes: workoutData.length + programData.length,
    oldestWorkout: oldestWorkout ? oldestWorkout.timestamp : null,
    isNearLimit: workouts.length >= MAX_OFFLINE_WORKOUTS * 0.8
  };
};

/**
 * Saves program data to localStorage for offline access
 *
 * @param {Object} programData - The program data to save offline
 * @param {string} programData.name - Name of the program
 * @param {Array} programData.workouts - Array of workout data
 * @param {string} programData.description - Program description
 *
 * @returns {Object|null} The saved program with offline metadata, or null if failed
 */
export const saveProgramOffline = async (programData) => {
  if (typeof window === 'undefined') {
    console.warn('localStorage not available on server side');
    return null;
  }

  try {
    const existingPrograms = await getOfflinePrograms();

    // Enforce storage limits
    if (existingPrograms.length >= MAX_OFFLINE_PROGRAMS) {
      console.warn('Maximum offline programs reached, removing oldest entry');
      existingPrograms.shift();
    }

    const programWithId = {
      ...programData,
      offlineId: generateOfflineId(),
      savedOffline: true,
      timestamp: new Date().toISOString(),
      version: '1.0',
      syncAttempts: 0
    };

    existingPrograms.push(programWithId);
    const encryptedData = await encryptData(existingPrograms);
    localStorage.setItem(OFFLINE_PROGRAMS_KEY, encryptedData);

    console.log('Program saved offline:', programWithId.offlineId);
    return programWithId;
  } catch (error) {
    console.error('Failed to save program offline:', error);
    return null;
  }
};

/**
 * Retrieves all offline programs from localStorage
 *
 * @returns {Array<Object>} Array of offline program objects
 */
export const getOfflinePrograms = async () => {
  if (typeof window === 'undefined') {
    return [];
  }

  try {
    const stored = localStorage.getItem(OFFLINE_PROGRAMS_KEY);
    if (!stored) return [];
    
    // Try to decrypt the data
    const decryptedData = await decryptData(stored);
    return Array.isArray(decryptedData) ? decryptedData : [];
  } catch (error) {
    console.error('Failed to get offline programs:', error);
    return [];
  }
};

/**
 * Clears all offline data (useful for testing or reset)
 *
 * @param {boolean} confirm - Safety confirmation to prevent accidental clearing
 *
 * @example
 * clearOfflineData(true); // Clear all offline data
 */
export const clearOfflineData = (confirm = false) => {
  if (typeof window === 'undefined') {
    return;
  }

  if (!confirm) {
    console.warn('clearOfflineData requires explicit confirmation');
    return;
  }

  localStorage.removeItem(OFFLINE_WORKOUTS_KEY);
  localStorage.removeItem(OFFLINE_PROGRAMS_KEY);
  console.log('Offline data cleared');
};

// UTILITY FUNCTIONS

/**
 * Generates a unique offline ID
 *
 * @returns {string} Unique offline identifier
 * @private
 */
function generateOfflineId() {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Triggers background sync if service worker is available
 *
 * @private
 */
function triggerBackgroundSync() {
  if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
    navigator.serviceWorker.ready.then((registration) => {
      return registration.sync.register(SW_CONFIG.WORKOUT_SYNC_TAG);
    }).catch((error) => {
      console.warn('Background sync registration failed:', error);
    });
  }
}

/**
 * Increments sync attempt counter for a workout
 *
 * @param {string} offlineId - The offline ID of the workout
 * @private
 */
async function incrementSyncAttempts(offlineId) {
  try {
    const workouts = await getOfflineWorkouts();
    const workoutIndex = workouts.findIndex(w => w.offlineId === offlineId);

    if (workoutIndex !== -1) {
      workouts[workoutIndex].syncAttempts = (workouts[workoutIndex].syncAttempts || 0) + 1;
      workouts[workoutIndex].lastSyncAttempt = new Date().toISOString();

      const encryptedData = await encryptData(workouts);
      localStorage.setItem(OFFLINE_WORKOUTS_KEY, encryptedData);
    }
  } catch (error) {
    console.error('Failed to increment sync attempts:', error);
  }
}

/**
 * Gets workouts that have failed sync attempts
 *
 * @returns {Array<Object>} Array of workouts with failed sync attempts
 */
export const getFailedSyncWorkouts = async () => {
  const workouts = await getOfflineWorkouts();
  return workouts.filter(workout =>
    (workout.syncAttempts || 0) >= SW_CONFIG.MAX_RETRY_ATTEMPTS
  );
};

/**
 * Service worker message handler setup
 * Sets up communication with service worker for offline data management
 */
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  navigator.serviceWorker.addEventListener('message', async (event) => {
    const { type, workoutId } = event.data;

    switch (type) {
      case 'GET_OFFLINE_WORKOUTS':
        const workouts = await getOfflineWorkouts();
        event.ports[0]?.postMessage(workouts);
        break;

      case 'REMOVE_OFFLINE_WORKOUT':
        await removeOfflineWorkout(workoutId);
        break;

      default:
        break;
    }
  });
}