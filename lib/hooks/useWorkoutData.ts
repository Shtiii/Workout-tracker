/**
 * Custom hook for managing workout data operations
 * 
 * @description This hook provides a comprehensive interface for workout-related operations
 * including fetching, creating, updating, and deleting workouts. It also handles
 * workout statistics and recent workout retrieval.
 * 
 * @example
 * ```tsx
 * const {
 *   workouts,
 *   loading,
 *   error,
 *   createWorkout,
 *   updateWorkout,
 *   deleteWorkout,
 *   getWorkoutById,
 *   getWorkoutsByProgram,
 *   refreshWorkouts
 * } = useWorkoutData();
 * ```
 * 
 * @returns {UseWorkoutDataReturn} Hook return object containing workout data and operations
 */

import { useState, useEffect, useCallback } from 'react';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, orderBy, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { getErrorLogger } from '@/lib/errorLogger';
import type { WorkoutSession } from '@/types';

/**
 * Return type for the useWorkoutData hook
 */
export interface UseWorkoutDataReturn {
  /** Array of all workout sessions */
  workouts: WorkoutSession[];
  /** Loading state for async operations */
  loading: boolean;
  /** Error state for failed operations */
  error: Error | null;
  /** Function to create a new workout session */
  createWorkout: (workout: Omit<WorkoutSession, 'id'>) => Promise<string | null>;
  /** Function to update an existing workout session */
  updateWorkout: (id: string, updates: Partial<WorkoutSession>) => Promise<boolean>;
  /** Function to delete a workout session */
  deleteWorkout: (id: string) => Promise<boolean>;
  /** Function to get a workout session by ID */
  getWorkoutById: (id: string) => WorkoutSession | undefined;
  /** Function to get workouts filtered by program name */
  getWorkoutsByProgram: (programName: string) => WorkoutSession[];
  /** Function to manually refresh workout data */
  refreshWorkouts: () => Promise<void>;
}

/**
 * Custom hook for managing workout data
 * 
 * @returns {UseWorkoutDataReturn} Object containing workout data and operations
 */
export function useWorkoutData(): UseWorkoutDataReturn {
  const [workouts, setWorkouts] = useState<WorkoutSession[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const errorLogger = getErrorLogger();

  /**
   * Fetches all workout sessions from Firebase
   * @private
   */
  const fetchWorkouts = useCallback(async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      if (!db) {
        throw new Error('Firebase not initialized');
      }

      const workoutsQuery = query(
        collection(db, 'workoutSessions'),
        orderBy('completedAt', 'desc')
      );
      
      const snapshot = await getDocs(workoutsQuery);
      const workoutsData: WorkoutSession[] = snapshot.docs.map(doc => {
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

      setWorkouts(workoutsData);
    } catch (err) {
      const error = err as Error;
      setError(error);
      await errorLogger.logFirebaseError(error, 'fetchWorkouts', 'workoutSessions');
    } finally {
      setLoading(false);
    }
  }, [errorLogger]);

  /**
   * Creates a new workout session
   * @param workoutData - The workout data to create (without ID)
   * @returns Promise resolving to the new workout ID or null if failed
   */
  const createWorkout = useCallback(async (workoutData: Omit<WorkoutSession, 'id'>): Promise<string | null> => {
    try {
      if (!db) {
        throw new Error('Firebase not initialized');
      }

      const docRef = await addDoc(collection(db, 'workoutSessions'), {
        ...workoutData,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Refresh workouts to include the new one
      await fetchWorkouts();
      
      return docRef.id;
    } catch (err) {
      const error = err as Error;
      setError(error);
      await errorLogger.logFirebaseError(error, 'createWorkout', 'workoutSessions');
      return null;
    }
  }, [fetchWorkouts, errorLogger]);

  /**
   * Updates an existing workout session
   * @param id - The ID of the workout to update
   * @param updates - Partial workout data to update
   * @returns Promise resolving to true if successful, false otherwise
   */
  const updateWorkout = useCallback(async (id: string, updates: Partial<WorkoutSession>): Promise<boolean> => {
    try {
      if (!db) {
        throw new Error('Firebase not initialized');
      }

      await updateDoc(doc(db, 'workoutSessions', id), {
        ...updates,
        updatedAt: new Date(),
      });

      // Update local state
      setWorkouts(prev => prev.map(workout => 
        workout.id === id ? { ...workout, ...updates } : workout
      ));
      
      return true;
    } catch (err) {
      const error = err as Error;
      setError(error);
      await errorLogger.logFirebaseError(error, 'updateWorkout', 'workoutSessions', id);
      return false;
    }
  }, [errorLogger]);

  /**
   * Deletes a workout session
   * @param id - The ID of the workout to delete
   * @returns Promise resolving to true if successful, false otherwise
   */
  const deleteWorkout = useCallback(async (id: string): Promise<boolean> => {
    try {
      if (!db) {
        throw new Error('Firebase not initialized');
      }

      await deleteDoc(doc(db, 'workoutSessions', id));

      // Update local state
      setWorkouts(prev => prev.filter(workout => workout.id !== id));
      
      return true;
    } catch (err) {
      const error = err as Error;
      setError(error);
      await errorLogger.logFirebaseError(error, 'deleteWorkout', 'workoutSessions', id);
      return false;
    }
  }, [errorLogger]);

  /**
   * Gets a workout session by its ID
   * @param id - The ID of the workout to find
   * @returns The workout session or undefined if not found
   */
  const getWorkoutById = useCallback((id: string): WorkoutSession | undefined => {
    return workouts.find(workout => workout.id === id);
  }, [workouts]);

  /**
   * Gets all workouts for a specific program
   * @param programName - The name of the program to filter by
   * @returns Array of workout sessions for the specified program
   */
  const getWorkoutsByProgram = useCallback((programName: string): WorkoutSession[] => {
    return workouts.filter(workout => workout.programName === programName);
  }, [workouts]);

  /**
   * Manually refreshes the workout data from Firebase
   * @returns Promise that resolves when refresh is complete
   */
  const refreshWorkouts = useCallback(async (): Promise<void> => {
    await fetchWorkouts();
  }, [fetchWorkouts]);

  useEffect(() => {
    fetchWorkouts();
  }, [fetchWorkouts]);

  return {
    workouts,
    loading,
    error,
    createWorkout,
    updateWorkout,
    deleteWorkout,
    getWorkoutById,
    getWorkoutsByProgram,
    refreshWorkouts,
  };
}
