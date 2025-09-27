/**
 * Service layer for program-related API operations
 */

import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, orderBy, where, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { getErrorLogger } from '@/lib/errorLogger';
import { getOfflineStorageManager } from '@/lib/offlineStorage';
import type { Program } from '@/types';

export interface ProgramServiceResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface ProgramFilters {
  name?: string;
  limit?: number;
}

/**
 * Program service class
 */
export class ProgramService {
  private static instance: ProgramService;
  private errorLogger = getErrorLogger();
  private offlineStorage = getOfflineStorageManager();

  private constructor() {}

  public static getInstance(): ProgramService {
    if (!ProgramService.instance) {
      ProgramService.instance = new ProgramService();
    }
    return ProgramService.instance;
  }

  /**
   * Get all programs with optional filters
   */
  public async getPrograms(filters: ProgramFilters = {}): Promise<ProgramServiceResponse<Program[]>> {
    try {
      if (!db) {
        throw new Error('Firebase not initialized');
      }

      let programsQuery = query(
        collection(db, 'programs'),
        orderBy('createdAt', 'desc')
      );

      // Apply filters
      if (filters.name) {
        programsQuery = query(programsQuery, where('name', '==', filters.name));
      }

      if (filters.limit) {
        programsQuery = query(programsQuery, limit(filters.limit));
      }

      const snapshot = await getDocs(programsQuery);
      const programs: Program[] = snapshot.docs.map(doc => {
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

      return {
        success: true,
        data: programs,
      };
    } catch (error) {
      const err = error as Error;
      await this.errorLogger.logFirebaseError(err, 'getPrograms', 'programs');
      
      return {
        success: false,
        error: err.message,
      };
    }
  }

  /**
   * Get program by ID
   */
  public async getProgramById(id: string): Promise<ProgramServiceResponse<Program>> {
    try {
      if (!db) {
        throw new Error('Firebase not initialized');
      }

      const programsQuery = query(
        collection(db, 'programs'),
        where('__name__', '==', id)
      );

      const snapshot = await getDocs(programsQuery);
      
      if (snapshot.empty) {
        return {
          success: false,
          error: 'Program not found',
        };
      }

      const doc = snapshot.docs[0];
      const program: Program = {
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate(),
      } as Program;

      return {
        success: true,
        data: program,
      };
    } catch (error) {
      const err = error as Error;
      await this.errorLogger.logFirebaseError(err, 'getProgramById', 'programs', id);
      
      return {
        success: false,
        error: err.message,
      };
    }
  }

  /**
   * Get program by name
   */
  public async getProgramByName(name: string): Promise<ProgramServiceResponse<Program>> {
    try {
      if (!db) {
        throw new Error('Firebase not initialized');
      }

      const programsQuery = query(
        collection(db, 'programs'),
        where('name', '==', name)
      );

      const snapshot = await getDocs(programsQuery);
      
      if (snapshot.empty) {
        return {
          success: false,
          error: 'Program not found',
        };
      }

      const doc = snapshot.docs[0];
      const program: Program = {
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate(),
      } as Program;

      return {
        success: true,
        data: program,
      };
    } catch (error) {
      const err = error as Error;
      await this.errorLogger.logFirebaseError(err, 'getProgramByName', 'programs');
      
      return {
        success: false,
        error: err.message,
      };
    }
  }

  /**
   * Create new program
   */
  public async createProgram(programData: Omit<Program, 'id'>): Promise<ProgramServiceResponse<string>> {
    try {
      if (!db) {
        throw new Error('Firebase not initialized');
      }

      const docRef = await addDoc(collection(db, 'programs'), {
        ...programData,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      return {
        success: true,
        data: docRef.id,
      };
    } catch (error) {
      const err = error as Error;
      await this.errorLogger.logFirebaseError(err, 'createProgram', 'programs');
      
      // Try to save offline
      try {
        const offlineProgram = {
          ...programData,
          offlineId: `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        };
        
        const saved = await this.offlineStorage.saveProgramOffline(offlineProgram);
        if (saved) {
          return {
            success: true,
            data: offlineProgram.offlineId,
          };
        }
      } catch (offlineError) {
        console.error('Failed to save program offline:', offlineError);
      }
      
      return {
        success: false,
        error: err.message,
      };
    }
  }

  /**
   * Update program
   */
  public async updateProgram(id: string, updates: Partial<Program>): Promise<ProgramServiceResponse<boolean>> {
    try {
      if (!db) {
        throw new Error('Firebase not initialized');
      }

      await updateDoc(doc(db, 'programs', id), {
        ...updates,
        updatedAt: new Date(),
      });

      return {
        success: true,
        data: true,
      };
    } catch (error) {
      const err = error as Error;
      await this.errorLogger.logFirebaseError(err, 'updateProgram', 'programs', id);
      
      return {
        success: false,
        error: err.message,
      };
    }
  }

  /**
   * Delete program
   */
  public async deleteProgram(id: string): Promise<ProgramServiceResponse<boolean>> {
    try {
      if (!db) {
        throw new Error('Firebase not initialized');
      }

      await deleteDoc(doc(db, 'programs', id));

      return {
        success: true,
        data: true,
      };
    } catch (error) {
      const err = error as Error;
      await this.errorLogger.logFirebaseError(err, 'deleteProgram', 'programs', id);
      
      return {
        success: false,
        error: err.message,
      };
    }
  }

  /**
   * Get recent programs
   */
  public async getRecentPrograms(limitCount: number = 10): Promise<ProgramServiceResponse<Program[]>> {
    return this.getPrograms({ limit: limitCount });
  }

  /**
   * Search programs by name
   */
  public async searchPrograms(searchTerm: string): Promise<ProgramServiceResponse<Program[]>> {
    try {
      if (!db) {
        throw new Error('Firebase not initialized');
      }

      // Get all programs and filter client-side for now
      // In a real app, you might want to use a search service like Algolia
      const allProgramsResponse = await this.getPrograms();
      
      if (!allProgramsResponse.success || !allProgramsResponse.data) {
        return {
          success: false,
          error: 'Failed to fetch programs for search',
        };
      }

      const filteredPrograms = allProgramsResponse.data.filter(program =>
        program.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (program.description && program.description.toLowerCase().includes(searchTerm.toLowerCase()))
      );

      return {
        success: true,
        data: filteredPrograms,
      };
    } catch (error) {
      const err = error as Error;
      await this.errorLogger.logFirebaseError(err, 'searchPrograms', 'programs');
      
      return {
        success: false,
        error: err.message,
      };
    }
  }

  /**
   * Get program statistics
   */
  public async getProgramStats(): Promise<ProgramServiceResponse<{
    totalPrograms: number;
    mostRecentProgram: Program | null;
    programsWithWorkouts: number;
  }>> {
    try {
      const allProgramsResponse = await this.getPrograms();
      
      if (!allProgramsResponse.success || !allProgramsResponse.data) {
        return {
          success: false,
          error: 'Failed to fetch programs for statistics',
        };
      }

      const programs = allProgramsResponse.data;
      const totalPrograms = programs.length;
      const mostRecentProgram = programs.length > 0 ? programs[0] : null;

      // Note: This would require a join with workouts collection
      // For now, we'll return 0 as a placeholder
      const programsWithWorkouts = 0;

      return {
        success: true,
        data: {
          totalPrograms,
          mostRecentProgram,
          programsWithWorkouts,
        },
      };
    } catch (error) {
      const err = error as Error;
      await this.errorLogger.logFirebaseError(err, 'getProgramStats', 'programs');
      
      return {
        success: false,
        error: err.message,
      };
    }
  }

  /**
   * Sync offline programs
   */
  public async syncOfflinePrograms(): Promise<ProgramServiceResponse<{
    synced: number;
    failed: number;
  }>> {
    try {
      const offlinePrograms = await this.offlineStorage.getOfflinePrograms();
      let synced = 0;
      let failed = 0;

      for (const program of offlinePrograms) {
        try {
          const result = await this.createProgram(program);
          if (result.success) {
            // Remove from offline storage
            // Note: This would need to be implemented in offlineStorage
            synced++;
          } else {
            failed++;
          }
        } catch (error) {
          console.error('Failed to sync program:', program.offlineId, error);
          failed++;
        }
      }

      return {
        success: true,
        data: { synced, failed },
      };
    } catch (error) {
      const err = error as Error;
      await this.errorLogger.logSyncError(err, 'program', undefined, 1);
      
      return {
        success: false,
        error: err.message,
      };
    }
  }
}

/**
 * Get program service instance
 */
export function getProgramService(): ProgramService {
  return ProgramService.getInstance();
}
