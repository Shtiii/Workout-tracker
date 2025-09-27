/**
 * Custom hook for managing program data operations
 * 
 * @description This hook provides a comprehensive interface for program-related operations
 * including fetching, creating, updating, and deleting training programs. It handles
 * program data management with proper error handling and loading states.
 * 
 * @example
 * ```tsx
 * const {
 *   programs,
 *   loading,
 *   error,
 *   createProgram,
 *   updateProgram,
 *   deleteProgram,
 *   getProgramById,
 *   getProgramByName,
 *   refreshPrograms
 * } = useProgramData();
 * ```
 * 
 * @returns {UseProgramDataReturn} Hook return object containing program data and operations
 */

import { useState, useEffect, useCallback } from 'react';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { getErrorLogger } from '@/lib/errorLogger';
import type { Program } from '@/types';

/**
 * Return type for the useProgramData hook
 */
export interface UseProgramDataReturn {
  /** Array of all training programs */
  programs: Program[];
  /** Loading state for async operations */
  loading: boolean;
  /** Error state for failed operations */
  error: Error | null;
  /** Function to create a new training program */
  createProgram: (program: Omit<Program, 'id'>) => Promise<string | null>;
  /** Function to update an existing training program */
  updateProgram: (id: string, updates: Partial<Program>) => Promise<boolean>;
  /** Function to delete a training program */
  deleteProgram: (id: string) => Promise<boolean>;
  /** Function to get a program by its ID */
  getProgramById: (id: string) => Program | undefined;
  /** Function to get a program by its name */
  getProgramByName: (name: string) => Program | undefined;
  /** Function to manually refresh program data */
  refreshPrograms: () => Promise<void>;
}

/**
 * Custom hook for managing program data
 * 
 * @returns {UseProgramDataReturn} Object containing program data and operations
 */
export function useProgramData(): UseProgramDataReturn {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const errorLogger = getErrorLogger();

  /**
   * Fetches all training programs from Firebase
   * @private
   */
  const fetchPrograms = useCallback(async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      if (!db) {
        throw new Error('Firebase not initialized');
      }

      const programsQuery = query(
        collection(db, 'programs'),
        orderBy('createdAt', 'desc')
      );
      
      const snapshot = await getDocs(programsQuery);
      const programsData: Program[] = snapshot.docs.map(doc => {
        try {
          return {
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate(),
            updatedAt: doc.data().updatedAt?.toDate(),
          } as Program;
        } catch (docError) {
          console.warn('Error processing program document:', doc.id, docError);
          return null;
        }
      }).filter((program): program is Program => program !== null);

      setPrograms(programsData);
    } catch (err) {
      const error = err as Error;
      setError(error);
      await errorLogger.logFirebaseError(error, 'fetchPrograms', 'programs');
    } finally {
      setLoading(false);
    }
  }, [errorLogger]);

  /**
   * Creates a new training program
   * @param programData - The program data to create (without ID)
   * @returns Promise resolving to the new program ID or null if failed
   */
  const createProgram = useCallback(async (programData: Omit<Program, 'id'>): Promise<string | null> => {
    try {
      if (!db) {
        throw new Error('Firebase not initialized');
      }

      const docRef = await addDoc(collection(db, 'programs'), {
        ...programData,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Refresh programs to include the new one
      await fetchPrograms();
      
      return docRef.id;
    } catch (err) {
      const error = err as Error;
      setError(error);
      await errorLogger.logFirebaseError(error, 'createProgram', 'programs');
      return null;
    }
  }, [fetchPrograms, errorLogger]);

  /**
   * Updates an existing training program
   * @param id - The ID of the program to update
   * @param updates - Partial program data to update
   * @returns Promise resolving to true if successful, false otherwise
   */
  const updateProgram = useCallback(async (id: string, updates: Partial<Program>): Promise<boolean> => {
    try {
      if (!db) {
        throw new Error('Firebase not initialized');
      }

      await updateDoc(doc(db, 'programs', id), {
        ...updates,
        updatedAt: new Date(),
      });

      // Update local state
      setPrograms(prev => prev.map(program => 
        program.id === id ? { ...program, ...updates } : program
      ));
      
      return true;
    } catch (err) {
      const error = err as Error;
      setError(error);
      await errorLogger.logFirebaseError(error, 'updateProgram', 'programs', id);
      return false;
    }
  }, [errorLogger]);

  /**
   * Deletes a training program
   * @param id - The ID of the program to delete
   * @returns Promise resolving to true if successful, false otherwise
   */
  const deleteProgram = useCallback(async (id: string): Promise<boolean> => {
    try {
      if (!db) {
        throw new Error('Firebase not initialized');
      }

      await deleteDoc(doc(db, 'programs', id));

      // Update local state
      setPrograms(prev => prev.filter(program => program.id !== id));
      
      return true;
    } catch (err) {
      const error = err as Error;
      setError(error);
      await errorLogger.logFirebaseError(error, 'deleteProgram', 'programs', id);
      return false;
    }
  }, [errorLogger]);

  /**
   * Gets a training program by its ID
   * @param id - The ID of the program to find
   * @returns The program or undefined if not found
   */
  const getProgramById = useCallback((id: string): Program | undefined => {
    return programs.find(program => program.id === id);
  }, [programs]);

  /**
   * Gets a training program by its name
   * @param name - The name of the program to find
   * @returns The program or undefined if not found
   */
  const getProgramByName = useCallback((name: string): Program | undefined => {
    return programs.find(program => program.name === name);
  }, [programs]);

  /**
   * Manually refreshes the program data from Firebase
   * @returns Promise that resolves when refresh is complete
   */
  const refreshPrograms = useCallback(async (): Promise<void> => {
    await fetchPrograms();
  }, [fetchPrograms]);

  useEffect(() => {
    fetchPrograms();
  }, [fetchPrograms]);

  return {
    programs,
    loading,
    error,
    createProgram,
    updateProgram,
    deleteProgram,
    getProgramById,
    getProgramByName,
    refreshPrograms,
  };
}
