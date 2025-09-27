/**
 * Main application context for shared state management
 */

import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import { useWorkoutData } from '@/lib/hooks/useWorkoutData';
import { useProgramData } from '@/lib/hooks/useProgramData';
import { initializeServiceWorker } from '@/lib/serviceWorker';
import { initializeOfflineStorage } from '@/lib/offlineStorage';
import { initializeErrorLogging } from '@/lib/errorLogger';
import type { User, WorkoutSession, Program } from '@/types';

export interface AppState {
  // User state
  user: User | null;
  isAuthenticated: boolean;
  
  // Data state
  workouts: WorkoutSession[];
  programs: Program[];
  
  // UI state
  isLoading: boolean;
  error: string | null;
  
  // Feature flags
  features: {
    offlineMode: boolean;
    analytics: boolean;
    programs: boolean;
    goals: boolean;
  };
  
  // App settings
  settings: {
    theme: 'light' | 'dark' | 'auto';
    language: string;
    notifications: boolean;
    autoSync: boolean;
  };
}

export interface AppContextType extends AppState {
  // Actions
  setUser: (user: User | null) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  updateSettings: (settings: Partial<AppState['settings']>) => void;
  refreshData: () => Promise<void>;
  
  // Workout actions
  addWorkout: (workout: Omit<WorkoutSession, 'id'>) => Promise<string | null>;
  updateWorkout: (id: string, updates: Partial<WorkoutSession>) => Promise<boolean>;
  deleteWorkout: (id: string) => Promise<boolean>;
  
  // Program actions
  addProgram: (program: Omit<Program, 'id'>) => Promise<string | null>;
  updateProgram: (id: string, updates: Partial<Program>) => Promise<boolean>;
  deleteProgram: (id: string) => Promise<boolean>;
}

// Action types
type AppAction =
  | { type: 'SET_USER'; payload: User | null }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'CLEAR_ERROR' }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_WORKOUTS'; payload: WorkoutSession[] }
  | { type: 'SET_PROGRAMS'; payload: Program[] }
  | { type: 'UPDATE_SETTINGS'; payload: Partial<AppState['settings']> }
  | { type: 'SET_FEATURES'; payload: Partial<AppState['features']> };

// Initial state
const initialState: AppState = {
  user: null,
  isAuthenticated: false,
  workouts: [],
  programs: [],
  isLoading: true,
  error: null,
  features: {
    offlineMode: true,
    analytics: true,
    programs: true,
    goals: true,
  },
  settings: {
    theme: 'dark',
    language: 'en',
    notifications: true,
    autoSync: true,
  },
};

// Reducer
function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_USER':
      return {
        ...state,
        user: action.payload,
        isAuthenticated: !!action.payload,
      };
    
    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
      };
    
    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null,
      };
    
    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload,
      };
    
    case 'SET_WORKOUTS':
      return {
        ...state,
        workouts: action.payload,
      };
    
    case 'SET_PROGRAMS':
      return {
        ...state,
        programs: action.payload,
      };
    
    case 'UPDATE_SETTINGS':
      return {
        ...state,
        settings: {
          ...state.settings,
          ...action.payload,
        },
      };
    
    case 'SET_FEATURES':
      return {
        ...state,
        features: {
          ...state.features,
          ...action.payload,
        },
      };
    
    default:
      return state;
  }
}

// Context
const AppContext = createContext<AppContextType | undefined>(undefined);

// Provider component
interface AppProviderProps {
  children: ReactNode;
}

export function AppProvider({ children }: AppProviderProps) {
  const [state, dispatch] = useReducer(appReducer, initialState);
  
  // Custom hooks
  const { user: authUser, loading: authLoading, error: authError } = useAuth();
  const { 
    workouts, 
    loading: workoutsLoading, 
    error: workoutsError,
    createWorkout,
    updateWorkout,
    deleteWorkout,
    refreshWorkouts,
  } = useWorkoutData();
  const { 
    programs, 
    loading: programsLoading, 
    error: programsError,
    createProgram,
    updateProgram,
    deleteProgram,
    refreshPrograms,
  } = useProgramData();

  // Initialize app services
  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Initialize error logging
        initializeErrorLogging();
        
        // Initialize service worker
        await initializeServiceWorker();
        
        // Initialize offline storage
        await initializeOfflineStorage();
        
        // Load settings from localStorage
        const savedSettings = localStorage.getItem('app-settings');
        if (savedSettings) {
          try {
            const settings = JSON.parse(savedSettings);
            dispatch({ type: 'UPDATE_SETTINGS', payload: settings });
          } catch (error) {
            console.warn('Failed to parse saved settings:', error);
          }
        }
        
        // Load feature flags from environment
        const features = {
          offlineMode: process.env.NEXT_PUBLIC_OFFLINE_MODE !== 'false',
          analytics: process.env.NEXT_PUBLIC_ANALYTICS !== 'false',
          programs: process.env.NEXT_PUBLIC_PROGRAMS !== 'false',
          goals: process.env.NEXT_PUBLIC_GOALS !== 'false',
        };
        dispatch({ type: 'SET_FEATURES', payload: features });
        
      } catch (error) {
        console.error('Failed to initialize app:', error);
        dispatch({ type: 'SET_ERROR', payload: 'Failed to initialize application' });
      }
    };

    initializeApp();
  }, []);

  // Update state when hooks change
  useEffect(() => {
    dispatch({ type: 'SET_USER', payload: authUser });
  }, [authUser]);

  useEffect(() => {
    dispatch({ type: 'SET_WORKOUTS', payload: workouts });
  }, [workouts]);

  useEffect(() => {
    dispatch({ type: 'SET_PROGRAMS', payload: programs });
  }, [programs]);

  useEffect(() => {
    const isLoading = authLoading || workoutsLoading || programsLoading;
    dispatch({ type: 'SET_LOADING', payload: isLoading });
  }, [authLoading, workoutsLoading, programsLoading]);

  useEffect(() => {
    const error = authError?.message || workoutsError?.message || programsError?.message || null;
    dispatch({ type: 'SET_ERROR', payload: error });
  }, [authError, workoutsError, programsError]);

  // Save settings to localStorage when they change
  useEffect(() => {
    localStorage.setItem('app-settings', JSON.stringify(state.settings));
  }, [state.settings]);

  // Context value
  const contextValue: AppContextType = {
    ...state,
    
    // Actions
    setUser: (user: User | null) => {
      dispatch({ type: 'SET_USER', payload: user });
    },
    
    setError: (error: string | null) => {
      dispatch({ type: 'SET_ERROR', payload: error });
    },
    
    clearError: () => {
      dispatch({ type: 'CLEAR_ERROR' });
    },
    
    updateSettings: (settings: Partial<AppState['settings']>) => {
      dispatch({ type: 'UPDATE_SETTINGS', payload: settings });
    },
    
    refreshData: async () => {
      try {
        await Promise.all([
          refreshWorkouts(),
          refreshPrograms(),
        ]);
      } catch (error) {
        console.error('Failed to refresh data:', error);
        dispatch({ type: 'SET_ERROR', payload: 'Failed to refresh data' });
      }
    },
    
    // Workout actions
    addWorkout: async (workout: Omit<WorkoutSession, 'id'>) => {
      try {
        const result = await createWorkout(workout);
        if (!result) {
          dispatch({ type: 'SET_ERROR', payload: 'Failed to create workout' });
        }
        return result;
      } catch (error) {
        console.error('Failed to add workout:', error);
        dispatch({ type: 'SET_ERROR', payload: 'Failed to add workout' });
        return null;
      }
    },
    
    updateWorkout: async (id: string, updates: Partial<WorkoutSession>) => {
      try {
        const result = await updateWorkout(id, updates);
        if (!result) {
          dispatch({ type: 'SET_ERROR', payload: 'Failed to update workout' });
        }
        return result;
      } catch (error) {
        console.error('Failed to update workout:', error);
        dispatch({ type: 'SET_ERROR', payload: 'Failed to update workout' });
        return false;
      }
    },
    
    deleteWorkout: async (id: string) => {
      try {
        const result = await deleteWorkout(id);
        if (!result) {
          dispatch({ type: 'SET_ERROR', payload: 'Failed to delete workout' });
        }
        return result;
      } catch (error) {
        console.error('Failed to delete workout:', error);
        dispatch({ type: 'SET_ERROR', payload: 'Failed to delete workout' });
        return false;
      }
    },
    
    // Program actions
    addProgram: async (program: Omit<Program, 'id'>) => {
      try {
        const result = await createProgram(program);
        if (!result) {
          dispatch({ type: 'SET_ERROR', payload: 'Failed to create program' });
        }
        return result;
      } catch (error) {
        console.error('Failed to add program:', error);
        dispatch({ type: 'SET_ERROR', payload: 'Failed to add program' });
        return null;
      }
    },
    
    updateProgram: async (id: string, updates: Partial<Program>) => {
      try {
        const result = await updateProgram(id, updates);
        if (!result) {
          dispatch({ type: 'SET_ERROR', payload: 'Failed to update program' });
        }
        return result;
      } catch (error) {
        console.error('Failed to update program:', error);
        dispatch({ type: 'SET_ERROR', payload: 'Failed to update program' });
        return false;
      }
    },
    
    deleteProgram: async (id: string) => {
      try {
        const result = await deleteProgram(id);
        if (!result) {
          dispatch({ type: 'SET_ERROR', payload: 'Failed to delete program' });
        }
        return result;
      } catch (error) {
        console.error('Failed to delete program:', error);
        dispatch({ type: 'SET_ERROR', payload: 'Failed to delete program' });
        return false;
      }
    },
  };

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
}

// Hook to use the context
export function useApp(): AppContextType {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}

// Selector hooks for specific parts of the state
export function useAppUser() {
  const { user, isAuthenticated } = useApp();
  return { user, isAuthenticated };
}

export function useAppWorkouts() {
  const { workouts, addWorkout, updateWorkout, deleteWorkout } = useApp();
  return { workouts, addWorkout, updateWorkout, deleteWorkout };
}

export function useAppPrograms() {
  const { programs, addProgram, updateProgram, deleteProgram } = useApp();
  return { programs, addProgram, updateProgram, deleteProgram };
}

export function useAppSettings() {
  const { settings, updateSettings } = useApp();
  return { settings, updateSettings };
}

export function useAppFeatures() {
  const { features } = useApp();
  return features;
}

export function useAppError() {
  const { error, setError, clearError } = useApp();
  return { error, setError, clearError };
}

export function useAppLoading() {
  const { isLoading } = useApp();
  return isLoading;
}
