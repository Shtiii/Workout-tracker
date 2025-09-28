/**
 * Service layer for workout-related API operations
 */

import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, orderBy, where, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { getErrorLogger } from '@/lib/errorLogger';
import { getOfflineStorageManager } from '@/lib/offlineStorage';
import type { WorkoutSession } from '@/types';

export interface WorkoutServiceResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface WorkoutFilters {
  programName?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
}

/**
 * Workout service class
 */
export class WorkoutService {
  private static instance: WorkoutService;
  private errorLogger = getErrorLogger();
  private offlineStorage = getOfflineStorageManager();

  private constructor() {}

  public static getInstance(): WorkoutService {
    if (!WorkoutService.instance) {
      WorkoutService.instance = new WorkoutService();
    }
    return WorkoutService.instance;
  }

  /**
   * Get all workouts with optional filters
   */
  public async getWorkouts(filters: WorkoutFilters = {}): Promise<WorkoutServiceResponse<WorkoutSession[]>> {
    try {
      if (!db) {
        throw new Error('Firebase not initialized');
      }

      let workoutsQuery = query(
        collection(db, 'workoutSessions'),
        orderBy('completedAt', 'desc')
      );

      // Apply filters
      if (filters.programName) {
        workoutsQuery = query(workoutsQuery, where('programName', '==', filters.programName));
      }

      if (filters.startDate) {
        workoutsQuery = query(workoutsQuery, where('completedAt', '>=', filters.startDate));
      }

      if (filters.endDate) {
        workoutsQuery = query(workoutsQuery, where('completedAt', '<=', filters.endDate));
      }

      if (filters.limit) {
        workoutsQuery = query(workoutsQuery, limit(filters.limit));
      }

      const snapshot = await getDocs(workoutsQuery);
      const workouts: WorkoutSession[] = snapshot.docs.map(doc => {
        try {
          return {
            id: doc.id,
            ...doc.data(),
            completedAt: doc.data().completedAt?.toDate(),
            startTime: doc.data().startTime?.toDate(),
            endTime: doc.data().endTime?.toDate(),
          } as WorkoutSession;
        } catch (docError) {
          console.warn('Error processing workout document:', doc.id, docError);
          return null;
        }
      }).filter((workout): workout is WorkoutSession => workout !== null);

      return {
        success: true,
        data: workouts,
      };
    } catch (error) {
      const err = error as Error;
      await this.errorLogger.logFirebaseError(err, 'getWorkouts', 'workoutSessions');
      
      return {
        success: false,
        error: err.message,
      };
    }
  }

  /**
   * Get workout by ID
   */
  public async getWorkoutById(id: string): Promise<WorkoutServiceResponse<WorkoutSession>> {
    try {
      if (!db) {
        throw new Error('Firebase not initialized');
      }

      const workoutsQuery = query(
        collection(db, 'workoutSessions'),
        where('__name__', '==', id)
      );

      const snapshot = await getDocs(workoutsQuery);
      
      if (snapshot.empty) {
        return {
          success: false,
          error: 'Workout not found',
        };
      }

      const doc = snapshot.docs[0];
      const workout: WorkoutSession = {
        id: doc.id,
        ...doc.data(),
        completedAt: doc.data().completedAt?.toDate(),
        startTime: doc.data().startTime?.toDate(),
        endTime: doc.data().endTime?.toDate(),
      } as WorkoutSession;

      return {
        success: true,
        data: workout,
      };
    } catch (error) {
      const err = error as Error;
      await this.errorLogger.logFirebaseError(err, 'getWorkoutById', 'workoutSessions', id);
      
      return {
        success: false,
        error: err.message,
      };
    }
  }

  /**
   * Create new workout
   */
  public async createWorkout(workoutData: Omit<WorkoutSession, 'id'>): Promise<WorkoutServiceResponse<string>> {
    try {
      if (!db) {
        throw new Error('Firebase not initialized');
      }

      const docRef = await addDoc(collection(db, 'workoutSessions'), {
        ...workoutData,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      return {
        success: true,
        data: docRef.id,
      };
    } catch (error) {
      const err = error as Error;
      await this.errorLogger.logFirebaseError(err, 'createWorkout', 'workoutSessions');
      
      // Try to save offline
      try {
        const offlineWorkout = {
          ...workoutData,
          offlineId: `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        };
        
        const saved = await this.offlineStorage.saveWorkoutOffline(offlineWorkout);
        if (saved) {
          return {
            success: true,
            data: offlineWorkout.offlineId,
          };
        }
      } catch (offlineError) {
        console.error('Failed to save workout offline:', offlineError);
      }
      
      return {
        success: false,
        error: err.message,
      };
    }
  }

  /**
   * Update workout
   */
  public async updateWorkout(id: string, updates: Partial<WorkoutSession>): Promise<WorkoutServiceResponse<boolean>> {
    try {
      if (!db) {
        throw new Error('Firebase not initialized');
      }

      await updateDoc(doc(db, 'workoutSessions', id), {
        ...updates,
        updatedAt: new Date(),
      });

      return {
        success: true,
        data: true,
      };
    } catch (error) {
      const err = error as Error;
      await this.errorLogger.logFirebaseError(err, 'updateWorkout', 'workoutSessions', id);
      
      return {
        success: false,
        error: err.message,
      };
    }
  }

  /**
   * Delete workout
   */
  public async deleteWorkout(id: string): Promise<WorkoutServiceResponse<boolean>> {
    try {
      if (!db) {
        throw new Error('Firebase not initialized');
      }

      await deleteDoc(doc(db, 'workoutSessions', id));

      return {
        success: true,
        data: true,
      };
    } catch (error) {
      const err = error as Error;
      await this.errorLogger.logFirebaseError(err, 'deleteWorkout', 'workoutSessions', id);
      
      return {
        success: false,
        error: err.message,
      };
    }
  }

  /**
   * Get workouts by program
   */
  public async getWorkoutsByProgram(programName: string): Promise<WorkoutServiceResponse<WorkoutSession[]>> {
    return this.getWorkouts({ programName });
  }

  /**
   * Get recent workouts
   */
  public async getRecentWorkouts(limitCount: number = 10): Promise<WorkoutServiceResponse<WorkoutSession[]>> {
    return this.getWorkouts({ limit: limitCount });
  }

  /**
   * Get workouts by date range
   */
  public async getWorkoutsByDateRange(startDate: Date, endDate: Date): Promise<WorkoutServiceResponse<WorkoutSession[]>> {
    return this.getWorkouts({ startDate, endDate });
  }

  /**
   * Get workout statistics
   */
  public async getWorkoutStats(): Promise<WorkoutServiceResponse<{
    totalWorkouts: number;
    totalVolume: number;
    averageDuration: number;
    mostUsedProgram: string;
    recentWorkouts: WorkoutSession[];
  }>> {
    try {
      const allWorkoutsResponse = await this.getWorkouts();
      
      if (!allWorkoutsResponse.success || !allWorkoutsResponse.data) {
        return {
          success: false,
          error: 'Failed to fetch workouts for statistics',
        };
      }

      const workouts = allWorkoutsResponse.data;
      const totalWorkouts = workouts.length;
      
      // Calculate total volume
      const totalVolume = workouts.reduce((sum, workout) => {
        return sum + workout.exercises.reduce((exerciseSum, exercise) => {
          return exerciseSum + exercise.sets.reduce((setSum, set) => {
            return setSum + (set.completed ? set.weight * set.reps : 0);
          }, 0);
        }, 0);
      }, 0);

      // Calculate average duration
      const totalDuration = workouts.reduce((sum, workout) => {
        if (workout.startTime && workout.endTime) {
          const start = workout.startTime instanceof Date ? workout.startTime : new Date(workout.startTime);
          const end = workout.endTime instanceof Date ? workout.endTime : new Date(workout.endTime);
          return sum + (end.getTime() - start.getTime()) / (1000 * 60); // minutes
        }
        return sum;
      }, 0);
      const averageDuration = totalWorkouts > 0 ? totalDuration / totalWorkouts : 0;

      // Find most used program
      const programCounts = workouts.reduce((counts, workout) => {
        const programName = workout.programName || 'Custom';
        counts[programName] = (counts[programName] || 0) + 1;
        return counts;
      }, {} as Record<string, number>);
      
      const mostUsedProgram = Object.entries(programCounts).reduce((max, [program, count]) => 
        count > max.count ? { program, count } : max,
        { program: 'None', count: 0 }
      ).program;

      // Get recent workouts (last 5)
      const recentWorkouts = workouts.slice(0, 5);

      return {
        success: true,
        data: {
          totalWorkouts,
          totalVolume,
          averageDuration,
          mostUsedProgram,
          recentWorkouts,
        },
      };
    } catch (error) {
      const err = error as Error;
      await this.errorLogger.logFirebaseError(err, 'getWorkoutStats', 'workoutSessions');
      
      return {
        success: false,
        error: err.message,
      };
    }
  }

  /**
   * Sync offline workouts
   */
  public async syncOfflineWorkouts(): Promise<WorkoutServiceResponse<{
    synced: number;
    failed: number;
  }>> {
    try {
      const offlineWorkouts = await this.offlineStorage.getOfflineWorkouts();
      let synced = 0;
      let failed = 0;

      for (const workout of offlineWorkouts) {
        try {
          const result = await this.createWorkout(workout);
          if (result.success) {
            await this.offlineStorage.removeOfflineWorkout(workout.offlineId!);
            synced++;
          } else {
            failed++;
          }
        } catch (error) {
          console.error('Failed to sync workout:', workout.offlineId, error);
          failed++;
        }
      }

      return {
        success: true,
        data: { synced, failed },
      };
    } catch (error) {
      const err = error as Error;
      await this.errorLogger.logSyncError(err, 'workout', undefined, 1);
      
      return {
        success: false,
        error: err.message,
      };
    }
  }
}

/**
 * Get workout service instance
 */
export function getWorkoutService(): WorkoutService {
  return WorkoutService.getInstance();
}

