/**
 * Custom hook for managing authentication state and operations
 * 
 * @description This hook provides a comprehensive interface for authentication operations
 * including sign in, sign up, sign out, and anonymous authentication. It manages
 * user state, loading states, and error handling for all authentication operations.
 * 
 * @example
 * ```tsx
 * const {
 *   user,
 *   loading,
 *   error,
 *   signIn,
 *   signUp,
 *   signOut,
 *   signInAnonymously,
 *   clearError
 * } = useAuth();
 * ```
 * 
 * @returns {UseAuthReturn} Hook return object containing auth state and operations
 */

import { useState, useEffect, useCallback } from 'react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  signInAnonymously,
  User as FirebaseUser
} from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { getErrorLogger } from '@/lib/errorLogger';
import type { User } from '@/types';

/**
 * Return type for the useAuth hook
 */
export interface UseAuthReturn {
  /** Current authenticated user or null if not authenticated */
  user: User | null;
  /** Loading state for async operations */
  loading: boolean;
  /** Error state for failed operations */
  error: Error | null;
  /** Function to sign in with email and password */
  signIn: (email: string, password: string) => Promise<boolean>;
  /** Function to create a new user account */
  signUp: (email: string, password: string) => Promise<boolean>;
  /** Function to sign out the current user */
  signOut: () => Promise<boolean>;
  /** Function to sign in anonymously */
  signInAnonymously: () => Promise<boolean>;
  /** Function to clear the current error state */
  clearError: () => void;
}

/**
 * Custom hook for managing authentication
 * 
 * @returns {UseAuthReturn} Object containing auth state and operations
 */
export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const errorLogger = getErrorLogger();

  /**
   * Converts a Firebase user to our User type
   * @param firebaseUser - The Firebase user object
   * @returns Our User type or null if no user
   * @private
   */
  const convertFirebaseUser = useCallback((firebaseUser: FirebaseUser | null): User | null => {
    if (!firebaseUser) return null;

    return {
      uid: firebaseUser.uid,
      email: firebaseUser.email || '',
      displayName: firebaseUser.displayName || undefined,
      photoURL: firebaseUser.photoURL || undefined,
      createdAt: firebaseUser.metadata.creationTime ? new Date(firebaseUser.metadata.creationTime) : new Date(),
      lastLoginAt: firebaseUser.metadata.lastSignInTime ? new Date(firebaseUser.metadata.lastSignInTime) : new Date(),
    };
  }, []);

  /**
   * Signs in a user with email and password
   * @param email - User's email address
   * @param password - User's password
   * @returns Promise resolving to true if successful, false otherwise
   */
  const signIn = useCallback(async (email: string, password: string): Promise<boolean> => {
    try {
      setError(null);
      setLoading(true);

      if (!auth) {
        throw new Error('Firebase auth not initialized');
      }

      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      setUser(convertFirebaseUser(userCredential.user));
      
      return true;
    } catch (err) {
      const error = err as Error;
      setError(error);
      await errorLogger.logError(error, {
        severity: 'high',
        type: 'AUTHENTICATION',
        additionalContext: { operation: 'signIn', email }
      });
      return false;
    } finally {
      setLoading(false);
    }
  }, [convertFirebaseUser, errorLogger]);

  /**
   * Creates a new user account with email and password
   * @param email - User's email address
   * @param password - User's password
   * @returns Promise resolving to true if successful, false otherwise
   */
  const signUp = useCallback(async (email: string, password: string): Promise<boolean> => {
    try {
      setError(null);
      setLoading(true);

      if (!auth) {
        throw new Error('Firebase auth not initialized');
      }

      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      setUser(convertFirebaseUser(userCredential.user));
      
      return true;
    } catch (err) {
      const error = err as Error;
      setError(error);
      await errorLogger.logError(error, {
        severity: 'high',
        type: 'AUTHENTICATION',
        additionalContext: { operation: 'signUp', email }
      });
      return false;
    } finally {
      setLoading(false);
    }
  }, [convertFirebaseUser, errorLogger]);

  /**
   * Signs out the current user
   * @returns Promise resolving to true if successful, false otherwise
   */
  const signOutUser = useCallback(async (): Promise<boolean> => {
    try {
      setError(null);
      setLoading(true);

      if (!auth) {
        throw new Error('Firebase auth not initialized');
      }

      await signOut(auth);
      setUser(null);
      
      return true;
    } catch (err) {
      const error = err as Error;
      setError(error);
      await errorLogger.logError(error, {
        severity: 'high',
        type: 'AUTHENTICATION',
        additionalContext: { operation: 'signOut' }
      });
      return false;
    } finally {
      setLoading(false);
    }
  }, [errorLogger]);

  /**
   * Signs in a user anonymously
   * @returns Promise resolving to true if successful, false otherwise
   */
  const signInAnonymouslyUser = useCallback(async (): Promise<boolean> => {
    try {
      setError(null);
      setLoading(true);

      if (!auth) {
        throw new Error('Firebase auth not initialized');
      }

      const userCredential = await signInAnonymously(auth);
      setUser(convertFirebaseUser(userCredential.user));
      
      return true;
    } catch (err) {
      const error = err as Error;
      setError(error);
      await errorLogger.logError(error, {
        severity: 'high',
        type: 'AUTHENTICATION',
        additionalContext: { operation: 'signInAnonymously' }
      });
      return false;
    } finally {
      setLoading(false);
    }
  }, [convertFirebaseUser, errorLogger]);

  /**
   * Clears the current error state
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(convertFirebaseUser(firebaseUser));
      setLoading(false);
    });

    return () => unsubscribe();
  }, [convertFirebaseUser]);

  return {
    user,
    loading,
    error,
    signIn,
    signUp,
    signOut: signOutUser,
    signInAnonymously: signInAnonymouslyUser,
    clearError,
  };
}
