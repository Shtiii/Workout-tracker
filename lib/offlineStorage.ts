/**
 * Enhanced offline storage with service worker integration
 * Provides encrypted storage and background sync capabilities
 */

import { encryptData, decryptData } from './security';
import { getServiceWorkerManager } from './serviceWorker';
import { STORAGE_CONFIG } from './constants';
import type { WorkoutSession, Program } from '@/types';

/**
 * Enhanced offline storage manager with service worker integration
 */
export class OfflineStorageManager {
  private static instance: OfflineStorageManager;
  private swManager = getServiceWorkerManager();

  private constructor() {}

  public static getInstance(): OfflineStorageManager {
    if (!OfflineStorageManager.instance) {
      OfflineStorageManager.instance = new OfflineStorageManager();
    }
    return OfflineStorageManager.instance;
  }

  /**
   * Save workout offline with enhanced error handling
   */
  public async saveWorkoutOffline(workoutData: WorkoutSession): Promise<boolean> {
    try {
      const existingWorkouts = await this.getOfflineWorkouts();
      
      // Add offline ID if not present
      if (!workoutData.offlineId) {
        workoutData.offlineId = `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      }

      // Add sync metadata
      workoutData.syncAttempts = 0;
      workoutData.lastSyncAttempt = null;
      workoutData.createdOffline = new Date();

      existingWorkouts.push(workoutData);

      // Check storage limits
      if (existingWorkouts.length > STORAGE_CONFIG.MAX_OFFLINE_WORKOUTS) {
        // Remove oldest workouts
        existingWorkouts.sort((a, b) => 
          new Date(a.createdOffline || 0).getTime() - new Date(b.createdOffline || 0).getTime()
        );
        existingWorkouts.splice(0, existingWorkouts.length - STORAGE_CONFIG.MAX_OFFLINE_WORKOUTS);
      }

      const encryptedData = await encryptData(existingWorkouts);
      localStorage.setItem(STORAGE_CONFIG.OFFLINE_WORKOUTS_KEY, encryptedData);

      // Notify service worker of new offline data
      await this.swManager.sendMessage({
        type: 'OFFLINE_DATA_UPDATED',
        data: { type: 'workout', count: existingWorkouts.length }
      });

      return true;
    } catch (error) {
      console.error('Failed to save workout offline:', error);
      return false;
    }
  }

  /**
   * Get offline workouts with decryption
   */
  public async getOfflineWorkouts(): Promise<WorkoutSession[]> {
    try {
      const stored = localStorage.getItem(STORAGE_CONFIG.OFFLINE_WORKOUTS_KEY);
      if (!stored) return [];

      const decryptedData = await decryptData(stored);
      return Array.isArray(decryptedData) ? decryptedData : [];
    } catch (error) {
      console.error('Failed to get offline workouts:', error);
      return [];
    }
  }

  /**
   * Remove offline workout
   */
  public async removeOfflineWorkout(offlineId: string): Promise<boolean> {
    try {
      const workouts = await this.getOfflineWorkouts();
      const updated = workouts.filter(workout => workout.offlineId !== offlineId);
      
      const encryptedData = await encryptData(updated);
      localStorage.setItem(STORAGE_CONFIG.OFFLINE_WORKOUTS_KEY, encryptedData);

      // Notify service worker
      await this.swManager.sendMessage({
        type: 'OFFLINE_DATA_UPDATED',
        data: { type: 'workout', count: updated.length }
      });

      return true;
    } catch (error) {
      console.error('Failed to remove offline workout:', error);
      return false;
    }
  }

  /**
   * Save program offline
   */
  public async saveProgramOffline(programData: Program): Promise<boolean> {
    try {
      const existingPrograms = await this.getOfflinePrograms();
      
      // Add offline ID if not present
      if (!programData.offlineId) {
        programData.offlineId = `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      }

      // Add sync metadata
      programData.syncAttempts = 0;
      programData.lastSyncAttempt = null;
      programData.createdOffline = new Date();

      existingPrograms.push(programData);

      // Check storage limits
      if (existingPrograms.length > STORAGE_CONFIG.MAX_OFFLINE_PROGRAMS) {
        existingPrograms.sort((a, b) => 
          new Date(a.createdOffline || 0).getTime() - new Date(b.createdOffline || 0).getTime()
        );
        existingPrograms.splice(0, existingPrograms.length - STORAGE_CONFIG.MAX_OFFLINE_PROGRAMS);
      }

      const encryptedData = await encryptData(existingPrograms);
      localStorage.setItem(STORAGE_CONFIG.OFFLINE_PROGRAMS_KEY, encryptedData);

      // Notify service worker
      await this.swManager.sendMessage({
        type: 'OFFLINE_DATA_UPDATED',
        data: { type: 'program', count: existingPrograms.length }
      });

      return true;
    } catch (error) {
      console.error('Failed to save program offline:', error);
      return false;
    }
  }

  /**
   * Get offline programs
   */
  public async getOfflinePrograms(): Promise<Program[]> {
    try {
      const stored = localStorage.getItem(STORAGE_CONFIG.OFFLINE_PROGRAMS_KEY);
      if (!stored) return [];

      const decryptedData = await decryptData(stored);
      return Array.isArray(decryptedData) ? decryptedData : [];
    } catch (error) {
      console.error('Failed to get offline programs:', error);
      return [];
    }
  }

  /**
   * Increment sync attempts for a workout
   */
  public async incrementSyncAttempts(offlineId: string): Promise<boolean> {
    try {
      const workouts = await this.getOfflineWorkouts();
      const workout = workouts.find(w => w.offlineId === offlineId);
      
      if (workout) {
        workout.syncAttempts = (workout.syncAttempts || 0) + 1;
        workout.lastSyncAttempt = new Date();
        
        const encryptedData = await encryptData(workouts);
        localStorage.setItem(STORAGE_CONFIG.OFFLINE_WORKOUTS_KEY, encryptedData);
      }

      return true;
    } catch (error) {
      console.error('Failed to increment sync attempts:', error);
      return false;
    }
  }

  /**
   * Get failed sync workouts
   */
  public async getFailedSyncWorkouts(): Promise<WorkoutSession[]> {
    try {
      const workouts = await this.getOfflineWorkouts();
      return workouts.filter(workout => 
        (workout.syncAttempts || 0) > 0 && 
        (workout.syncAttempts || 0) < 3 // Less than max attempts
      );
    } catch (error) {
      console.error('Failed to get failed sync workouts:', error);
      return [];
    }
  }

  /**
   * Check if there are pending workouts
   */
  public async hasPendingWorkouts(): Promise<boolean> {
    try {
      const workouts = await this.getOfflineWorkouts();
      return workouts.length > 0;
    } catch (error) {
      console.error('Failed to check pending workouts:', error);
      return false;
    }
  }

  /**
   * Get offline workout count
   */
  public async getOfflineWorkoutCount(): Promise<number> {
    try {
      const workouts = await this.getOfflineWorkouts();
      return workouts.length;
    } catch (error) {
      console.error('Failed to get offline workout count:', error);
      return 0;
    }
  }

  /**
   * Get offline storage statistics
   */
  public async getOfflineStorageStats(): Promise<{
    workouts: number;
    programs: number;
    totalSize: number;
    failedSyncs: number;
  }> {
    try {
      const workouts = await this.getOfflineWorkouts();
      const programs = await this.getOfflinePrograms();
      const failedSyncs = await this.getFailedSyncWorkouts();

      // Estimate storage size
      const workoutSize = JSON.stringify(workouts).length;
      const programSize = JSON.stringify(programs).length;
      const totalSize = workoutSize + programSize;

      return {
        workouts: workouts.length,
        programs: programs.length,
        totalSize,
        failedSyncs: failedSyncs.length
      };
    } catch (error) {
      console.error('Failed to get storage stats:', error);
      return {
        workouts: 0,
        programs: 0,
        totalSize: 0,
        failedSyncs: 0
      };
    }
  }

  /**
   * Clear all offline data
   */
  public async clearAllOfflineData(): Promise<boolean> {
    try {
      localStorage.removeItem(STORAGE_CONFIG.OFFLINE_WORKOUTS_KEY);
      localStorage.removeItem(STORAGE_CONFIG.OFFLINE_PROGRAMS_KEY);

      // Notify service worker
      await this.swManager.sendMessage({
        type: 'OFFLINE_DATA_CLEARED',
        data: {}
      });

      return true;
    } catch (error) {
      console.error('Failed to clear offline data:', error);
      return false;
    }
  }

  /**
   * Setup message handling for service worker communication
   */
  public setupMessageHandling(): void {
    // Handle requests from service worker
    navigator.serviceWorker?.addEventListener('message', async (event) => {
      const { type, data } = event.data;

      switch (type) {
        case 'GET_OFFLINE_WORKOUTS':
          try {
            const workouts = await this.getOfflineWorkouts();
            event.ports[0]?.postMessage(workouts);
          } catch (error) {
            event.ports[0]?.postMessage([]);
          }
          break;

        case 'REMOVE_OFFLINE_WORKOUT':
          try {
            await this.removeOfflineWorkout(data.workoutId);
            event.ports[0]?.postMessage({ success: true });
          } catch (error) {
            event.ports[0]?.postMessage({ success: false, error: error.message });
          }
          break;

        case 'GET_OFFLINE_PROGRAMS':
          try {
            const programs = await this.getOfflinePrograms();
            event.ports[0]?.postMessage(programs);
          } catch (error) {
            event.ports[0]?.postMessage([]);
          }
          break;

        case 'REMOVE_OFFLINE_PROGRAM':
          try {
            // Implementation for removing offline programs
            event.ports[0]?.postMessage({ success: true });
          } catch (error) {
            event.ports[0]?.postMessage({ success: false, error: error.message });
          }
          break;
      }
    });
  }
}

/**
 * Get offline storage manager instance
 */
export function getOfflineStorageManager(): OfflineStorageManager {
  return OfflineStorageManager.getInstance();
}

/**
 * Initialize offline storage with service worker integration
 */
export async function initializeOfflineStorage(): Promise<void> {
  const manager = getOfflineStorageManager();
  manager.setupMessageHandling();
}

// Legacy function exports for backward compatibility
export async function saveWorkoutOffline(workoutData: WorkoutSession): Promise<boolean> {
  const manager = getOfflineStorageManager();
  return await manager.saveWorkoutOffline(workoutData);
}

export async function getOfflineWorkouts(): Promise<WorkoutSession[]> {
  const manager = getOfflineStorageManager();
  return await manager.getOfflineWorkouts();
}

export async function removeOfflineWorkout(offlineId: string): Promise<boolean> {
  const manager = getOfflineStorageManager();
  return await manager.removeOfflineWorkout(offlineId);
}

export async function saveProgramOffline(programData: Program): Promise<boolean> {
  const manager = getOfflineStorageManager();
  return await manager.saveProgramOffline(programData);
}

export async function getOfflinePrograms(): Promise<Program[]> {
  const manager = getOfflineStorageManager();
  return await manager.getOfflinePrograms();
}

export async function hasPendingWorkouts(): Promise<boolean> {
  const manager = getOfflineStorageManager();
  return await manager.hasPendingWorkouts();
}

export async function getOfflineWorkoutCount(): Promise<number> {
  const manager = getOfflineStorageManager();
  return await manager.getOfflineWorkoutCount();
}

export async function getOfflineStorageStats(): Promise<{
  workouts: number;
  programs: number;
  totalSize: number;
  failedSyncs: number;
}> {
  const manager = getOfflineStorageManager();
  return await manager.getOfflineStorageStats();
}

export default OfflineStorageManager;
