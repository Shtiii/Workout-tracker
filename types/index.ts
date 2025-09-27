/**
 * TypeScript type definitions for the workout tracker application
 */

// Firebase types
export interface FirebaseTimestamp {
  toDate(): Date;
}

// Workout related types
export interface Set {
  id: string;
  weight: number;
  reps: number;
  completed: boolean;
  restTime?: number;
}

export interface Exercise {
  id: string;
  name: string;
  sets: Set[];
  notes?: string;
}

export interface WorkoutSession {
  id: string;
  programName?: string;
  exercises: Exercise[];
  startTime: FirebaseTimestamp;
  endTime: FirebaseTimestamp;
  completedAt: FirebaseTimestamp;
  duration?: number;
  notes?: string;
}

// Program related types
export interface Program {
  id: string;
  name: string;
  description?: string;
  workouts: WorkoutSession[];
  createdAt: FirebaseTimestamp;
  updatedAt: FirebaseTimestamp;
}

// Goal related types
export interface Goal {
  id: string;
  name: string;
  description?: string;
  target: number;
  current: number;
  unit: string;
  deadline?: FirebaseTimestamp;
  createdAt: FirebaseTimestamp;
  updatedAt: FirebaseTimestamp;
}

// User related types
export interface User {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  createdAt: FirebaseTimestamp;
  lastLoginAt: FirebaseTimestamp;
}

// Analytics related types
export interface ExerciseData {
  date: Date;
  weight: number;
  reps: number;
  oneRepMax: number;
  volume: number;
}

export interface ChartDataPoint {
  date: string;
  weight: number;
  fullDate: Date;
}

export interface ExerciseChartData {
  name: string;
  data: ChartDataPoint[];
}

export interface CalendarDay {
  date: number;
  fullDate: Date;
  hasWorkout: boolean;
  isCurrentMonth: boolean;
  isToday: boolean;
}

// Component prop types
export interface WorkoutCalendarProps {
  workouts: WorkoutSession[];
  currentMonth: number;
  currentYear: number;
  onMonthChange: (month: number, year: number) => void;
  onGoToCurrentMonth: () => void;
}

export interface AnalyticsFiltersProps {
  selectedProgram: string;
  selectedExercise: string;
  programs: Program[];
  exerciseList: string[];
  onProgramChange: (program: string) => void;
  onExerciseChange: (exercise: string) => void;
}

export interface ProgressChartsProps {
  chartData: ExerciseChartData[];
}

export interface ProgressViewProps {
  exerciseData: Record<string, ExerciseData[]>;
  chartData: ExerciseChartData[];
  selectedProgram: string;
  selectedExercise: string;
  programs: Program[];
  exerciseList: string[];
  onProgramChange: (program: string) => void;
  onExerciseChange: (exercise: string) => void;
}

export interface HistoryViewProps {
  allWorkouts: WorkoutSession[];
  onDeleteWorkout: (workoutId: string) => void;
}

// Hook return types
export interface UseAnalyticsDataReturn {
  workouts: WorkoutSession[];
  programs: Program[];
  exerciseList: string[];
  allWorkouts: WorkoutSession[];
  loading: boolean;
  error: Error | null;
  fetchData: () => Promise<void>;
  deleteWorkout: (workoutId: string) => Promise<void>;
}

// Error handling types
export interface ErrorInfo {
  message: string;
  stack?: string;
  componentStack?: string;
}

export interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallbackMessage?: string;
  onRetry?: () => void;
}

// Loading states
export interface LoadingState {
  isLoading: boolean;
  error: Error | null;
}

// Form types
export interface LoginFormData {
  email: string;
  password: string;
}

export interface SignupFormData {
  email: string;
  password: string;
  confirmPassword: string;
}

// API response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// Configuration types
export interface CacheConfig {
  CACHE_NAME: string;
  STATIC_CACHE: string;
  DYNAMIC_CACHE: string;
  MAX_CACHE_SIZE: number;
  MAX_STATIC_CACHE_SIZE: number;
  MAX_DYNAMIC_CACHE_SIZE: number;
  CACHE_TTL: number;
  STATIC_CACHE_TTL: number;
  MAX_CACHED_ITEMS: number;
  MAX_STATIC_CACHED_ITEMS: number;
}

export interface StorageConfig {
  OFFLINE_WORKOUTS_KEY: string;
  OFFLINE_PROGRAMS_KEY: string;
  ERROR_LOGS_KEY: string;
  USER_PREFERENCES_KEY: string;
  THEME_KEY: string;
  MAX_OFFLINE_WORKOUTS: number;
  MAX_OFFLINE_PROGRAMS: number;
  MAX_ERROR_LOGS: number;
  MAX_STORAGE_QUOTA: number;
  WARNING_THRESHOLD: number;
}

export interface PerformanceConfig {
  SEARCH_DEBOUNCE: number;
  SAVE_DEBOUNCE: number;
  SYNC_DEBOUNCE: number;
  BATCH_SIZE: number;
  MAX_CONCURRENT_REQUESTS: number;
  DEFAULT_TIMEOUT: number;
  UPLOAD_TIMEOUT: number;
  SYNC_TIMEOUT: number;
}

// Utility types
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

// Event types
export interface CustomEvent<T = any> {
  type: string;
  payload: T;
  timestamp: Date;
}

// Theme types
export interface ThemeColors {
  primary: string;
  secondary: string;
  error: string;
  warning: string;
  info: string;
  success: string;
  background: string;
  surface: string;
  text: string;
}

// Navigation types
export interface NavigationItem {
  label: string;
  path: string;
  icon?: React.ComponentType;
  children?: NavigationItem[];
}

// Chart types
export interface ChartDataset {
  label: string;
  data: number[];
  borderColor: string;
  backgroundColor: string;
  borderWidth: number;
  pointBackgroundColor: string;
  pointBorderColor: string;
  pointBorderWidth: number;
  pointRadius: number;
  tension: number;
  fill: boolean;
}

export interface ChartData {
  labels: string[];
  datasets: ChartDataset[];
}

export interface ChartOptions {
  plugins: {
    legend: {
      display: boolean;
    };
    tooltip: {
      backgroundColor: string;
      titleColor: string;
      bodyColor: string;
      borderColor: string;
      borderWidth: number;
    };
  };
  scales: {
    x: {
      grid: {
        color: string;
      };
      ticks: {
        color: string;
        maxTicksLimit: number;
      };
    };
    y: {
      grid: {
        color: string;
      };
      ticks: {
        color: string;
        callback: (value: number) => string;
      };
    };
  };
}
