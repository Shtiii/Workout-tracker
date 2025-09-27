/**
 * Utility functions for workout-related operations
 * 
 * @description This module provides comprehensive utility functions for workout calculations,
 * data processing, validation, and formatting. It includes functions for calculating
 * one-rep max, workout volume, progress tracking, and data validation.
 * 
 * @example
 * ```tsx
 * import { 
 *   calculateOneRepMax, 
 *   calculateWorkoutVolume, 
 *   getWorkoutSummary,
 *   validateWorkout 
 * } from '@/lib/utils/workoutUtils';
 * 
 * const oneRepMax = calculateOneRepMax(100, 5); // 116.67
 * const volume = calculateWorkoutVolume(workout);
 * const summary = getWorkoutSummary(workout);
 * const errors = validateWorkout(workout);
 * ```
 */

import type { WorkoutSession, Exercise, Set } from '@/types';

/**
 * Calculate one-rep max using Epley formula
 * 
 * @description The Epley formula is: 1RM = weight × (1 + reps/30)
 * This is a commonly used formula for estimating one-rep max from submaximal lifts.
 * 
 * @param weight - The weight lifted
 * @param reps - The number of repetitions performed
 * @returns The estimated one-rep max
 * 
 * @example
 * ```tsx
 * const oneRepMax = calculateOneRepMax(100, 5); // 116.67
 * ```
 */
export function calculateOneRepMax(weight: number, reps: number): number {
  if (reps <= 0 || weight <= 0) return 0;
  if (reps === 1) return weight;
  
  return weight * (1 + reps / 30);
}

/**
 * Calculate total volume for a workout
 * 
 * @description Total volume is the sum of all weight × reps for completed sets
 * across all exercises in the workout.
 * 
 * @param workout - The workout session to calculate volume for
 * @returns The total volume in kg
 * 
 * @example
 * ```tsx
 * const totalVolume = calculateWorkoutVolume(workout); // 2500
 * ```
 */
export function calculateWorkoutVolume(workout: WorkoutSession): number {
  return workout.exercises.reduce((totalVolume, exercise) => {
    return totalVolume + calculateExerciseVolume(exercise);
  }, 0);
}

/**
 * Calculate total volume for an exercise
 * 
 * @description Volume for an exercise is the sum of weight × reps for all completed sets.
 * 
 * @param exercise - The exercise to calculate volume for
 * @returns The total volume in kg
 * 
 * @example
 * ```tsx
 * const exerciseVolume = calculateExerciseVolume(exercise); // 500
 * ```
 */
export function calculateExerciseVolume(exercise: Exercise): number {
  return exercise.sets.reduce((totalVolume, set) => {
    if (set.completed) {
      return totalVolume + (set.weight * set.reps);
    }
    return totalVolume;
  }, 0);
}

/**
 * Calculate total reps for an exercise
 * 
 * @description Total reps is the sum of all repetitions from completed sets.
 * 
 * @param exercise - The exercise to calculate reps for
 * @returns The total number of repetitions
 * 
 * @example
 * ```tsx
 * const totalReps = calculateExerciseReps(exercise); // 25
 * ```
 */
export function calculateExerciseReps(exercise: Exercise): number {
  return exercise.sets.reduce((totalReps, set) => {
    if (set.completed) {
      return totalReps + set.reps;
    }
    return totalReps;
  }, 0);
}

/**
 * Calculate average weight for an exercise
 * 
 * @description Average weight is calculated from all completed sets.
 * 
 * @param exercise - The exercise to calculate average weight for
 * @returns The average weight in kg
 * 
 * @example
 * ```tsx
 * const avgWeight = calculateExerciseAverageWeight(exercise); // 85.5
 * ```
 */
export function calculateExerciseAverageWeight(exercise: Exercise): number {
  const completedSets = exercise.sets.filter(set => set.completed);
  if (completedSets.length === 0) return 0;
  
  const totalWeight = completedSets.reduce((sum, set) => sum + set.weight, 0);
  return totalWeight / completedSets.length;
}

/**
 * Calculate workout duration in minutes
 * 
 * @description Calculates the duration between start and end times.
 * 
 * @param workout - The workout session to calculate duration for
 * @returns The duration in minutes
 * 
 * @example
 * ```tsx
 * const duration = calculateWorkoutDuration(workout); // 75
 * ```
 */
export function calculateWorkoutDuration(workout: WorkoutSession): number {
  if (!workout.startTime || !workout.endTime) return 0;
  
  const start = workout.startTime instanceof Date ? workout.startTime : new Date(workout.startTime);
  const end = workout.endTime instanceof Date ? workout.endTime : new Date(workout.endTime);
  
  return Math.round((end.getTime() - start.getTime()) / (1000 * 60));
}

/**
 * Get the best set for an exercise (highest weight)
 * 
 * @description Finds the set with the highest weight among completed sets.
 * 
 * @param exercise - The exercise to find the best set for
 * @returns The best set or null if no completed sets
 * 
 * @example
 * ```tsx
 * const bestSet = getBestSet(exercise); // { weight: 100, reps: 5, completed: true }
 * ```
 */
export function getBestSet(exercise: Exercise): Set | null {
  const completedSets = exercise.sets.filter(set => set.completed);
  if (completedSets.length === 0) return null;
  
  return completedSets.reduce((best, current) => 
    current.weight > best.weight ? current : best
  );
}

/**
 * Get the best one-rep max for an exercise
 * 
 * @description Calculates the one-rep max from the best set (highest weight).
 * 
 * @param exercise - The exercise to calculate one-rep max for
 * @returns The estimated one-rep max
 * 
 * @example
 * ```tsx
 * const oneRepMax = getBestOneRepMax(exercise); // 116.67
 * ```
 */
export function getBestOneRepMax(exercise: Exercise): number {
  const bestSet = getBestSet(exercise);
  if (!bestSet) return 0;
  
  return calculateOneRepMax(bestSet.weight, bestSet.reps);
}

/**
 * Calculate total sets completed in a workout
 * 
 * @description Counts all completed sets across all exercises.
 * 
 * @param workout - The workout session to count sets for
 * @returns The total number of completed sets
 * 
 * @example
 * ```tsx
 * const totalSets = calculateTotalSets(workout); // 15
 * ```
 */
export function calculateTotalSets(workout: WorkoutSession): number {
  return workout.exercises.reduce((total, exercise) => {
    return total + exercise.sets.filter(set => set.completed).length;
  }, 0);
}

/**
 * Calculate total exercises in a workout
 * 
 * @description Counts the number of exercises in the workout.
 * 
 * @param workout - The workout session to count exercises for
 * @returns The total number of exercises
 * 
 * @example
 * ```tsx
 * const totalExercises = calculateTotalExercises(workout); // 5
 * ```
 */
export function calculateTotalExercises(workout: WorkoutSession): number {
  return workout.exercises.length;
}

/**
 * Get workout summary statistics
 * 
 * @description Provides a comprehensive summary of workout statistics including
 * duration, volume, sets, exercises, and per-exercise breakdowns.
 * 
 * @param workout - The workout session to summarize
 * @returns Object containing workout summary statistics
 * 
 * @example
 * ```tsx
 * const summary = getWorkoutSummary(workout);
 * console.log(summary.totalVolume); // 2500
 * console.log(summary.exercises[0].bestOneRepMax); // 116.67
 * ```
 */
export function getWorkoutSummary(workout: WorkoutSession) {
  return {
    duration: calculateWorkoutDuration(workout),
    totalVolume: calculateWorkoutVolume(workout),
    totalSets: calculateTotalSets(workout),
    totalExercises: calculateTotalExercises(workout),
    exercises: workout.exercises.map(exercise => ({
      name: exercise.name,
      sets: exercise.sets.filter(set => set.completed).length,
      volume: calculateExerciseVolume(exercise),
      reps: calculateExerciseReps(exercise),
      averageWeight: calculateExerciseAverageWeight(exercise),
      bestOneRepMax: getBestOneRepMax(exercise),
    })),
  };
}

/**
 * Sort workouts by date (newest first)
 * 
 * @description Sorts workouts by completion date in descending order.
 * 
 * @param workouts - Array of workout sessions to sort
 * @returns Sorted array of workouts (newest first)
 * 
 * @example
 * ```tsx
 * const sortedWorkouts = sortWorkoutsByDate(workouts);
 * ```
 */
export function sortWorkoutsByDate(workouts: WorkoutSession[]): WorkoutSession[] {
  return [...workouts].sort((a, b) => {
    const dateA = a.completedAt instanceof Date ? a.completedAt : new Date(a.completedAt);
    const dateB = b.completedAt instanceof Date ? b.completedAt : new Date(b.completedAt);
    return dateB.getTime() - dateA.getTime();
  });
}

/**
 * Filter workouts by date range
 * 
 * @description Filters workouts to include only those completed within the specified date range.
 * 
 * @param workouts - Array of workout sessions to filter
 * @param startDate - Start date of the range (inclusive)
 * @param endDate - End date of the range (inclusive)
 * @returns Filtered array of workouts within the date range
 * 
 * @example
 * ```tsx
 * const filteredWorkouts = filterWorkoutsByDateRange(workouts, startDate, endDate);
 * ```
 */
export function filterWorkoutsByDateRange(
  workouts: WorkoutSession[], 
  startDate: Date, 
  endDate: Date
): WorkoutSession[] {
  return workouts.filter(workout => {
    const workoutDate = workout.completedAt instanceof Date ? workout.completedAt : new Date(workout.completedAt);
    return workoutDate >= startDate && workoutDate <= endDate;
  });
}

/**
 * Filter workouts by program
 * 
 * @description Filters workouts to include only those from the specified program.
 * 
 * @param workouts - Array of workout sessions to filter
 * @param programName - Name of the program to filter by
 * @returns Filtered array of workouts from the specified program
 * 
 * @example
 * ```tsx
 * const programWorkouts = filterWorkoutsByProgram(workouts, 'Push/Pull/Legs');
 * ```
 */
export function filterWorkoutsByProgram(workouts: WorkoutSession[], programName: string): WorkoutSession[] {
  return workouts.filter(workout => workout.programName === programName);
}

/**
 * Get unique exercise names from workouts
 * 
 * @description Extracts all unique exercise names from a collection of workouts.
 * 
 * @param workouts - Array of workout sessions to extract names from
 * @returns Sorted array of unique exercise names
 * 
 * @example
 * ```tsx
 * const exerciseNames = getUniqueExerciseNames(workouts);
 * // ['Bench Press', 'Deadlift', 'Squat']
 * ```
 */
export function getUniqueExerciseNames(workouts: WorkoutSession[]): string[] {
  const exerciseNames = new Set<string>();
  
  workouts.forEach(workout => {
    workout.exercises.forEach(exercise => {
      exerciseNames.add(exercise.name);
    });
  });
  
  return Array.from(exerciseNames).sort();
}

/**
 * Get exercise progress data for analytics
 * 
 * @description Extracts progress data for a specific exercise across multiple workouts.
 * 
 * @param workouts - Array of workout sessions to analyze
 * @param exerciseName - Name of the exercise to get progress for
 * @returns Array of progress data points sorted by date
 * 
 * @example
 * ```tsx
 * const progressData = getExerciseProgressData(workouts, 'Bench Press');
 * // [{ date: Date, weight: 100, reps: 5, oneRepMax: 116.67, volume: 500 }]
 * ```
 */
export function getExerciseProgressData(workouts: WorkoutSession[], exerciseName: string) {
  const exerciseData: Array<{
    date: Date;
    weight: number;
    reps: number;
    oneRepMax: number;
    volume: number;
  }> = [];

  workouts.forEach(workout => {
    const exercise = workout.exercises.find(ex => ex.name === exerciseName);
    if (exercise) {
      const bestSet = getBestSet(exercise);
      if (bestSet) {
        exerciseData.push({
          date: workout.completedAt instanceof Date ? workout.completedAt : new Date(workout.completedAt),
          weight: bestSet.weight,
          reps: bestSet.reps,
          oneRepMax: calculateOneRepMax(bestSet.weight, bestSet.reps),
          volume: calculateExerciseVolume(exercise),
        });
      }
    }
  });

  return exerciseData.sort((a, b) => a.date.getTime() - b.date.getTime());
}

/**
 * Calculate progress between two workouts for the same exercise
 * 
 * @description Compares performance metrics between two workouts for the same exercise.
 * 
 * @param oldWorkout - The earlier workout session
 * @param newWorkout - The later workout session
 * @param exerciseName - Name of the exercise to compare
 * @returns Object containing improvement metrics
 * 
 * @example
 * ```tsx
 * const progress = calculateExerciseProgress(oldWorkout, newWorkout, 'Bench Press');
 * console.log(progress.weightImprovement); // 5 (kg improvement)
 * ```
 */
export function calculateExerciseProgress(
  oldWorkout: WorkoutSession, 
  newWorkout: WorkoutSession, 
  exerciseName: string
): {
  weightImprovement: number;
  repsImprovement: number;
  volumeImprovement: number;
  oneRepMaxImprovement: number;
} {
  const oldExercise = oldWorkout.exercises.find(ex => ex.name === exerciseName);
  const newExercise = newWorkout.exercises.find(ex => ex.name === exerciseName);

  if (!oldExercise || !newExercise) {
    return {
      weightImprovement: 0,
      repsImprovement: 0,
      volumeImprovement: 0,
      oneRepMaxImprovement: 0,
    };
  }

  const oldBestSet = getBestSet(oldExercise);
  const newBestSet = getBestSet(newExercise);

  if (!oldBestSet || !newBestSet) {
    return {
      weightImprovement: 0,
      repsImprovement: 0,
      volumeImprovement: 0,
      oneRepMaxImprovement: 0,
    };
  }

  const oldVolume = calculateExerciseVolume(oldExercise);
  const newVolume = calculateExerciseVolume(newExercise);
  const oldOneRepMax = calculateOneRepMax(oldBestSet.weight, oldBestSet.reps);
  const newOneRepMax = calculateOneRepMax(newBestSet.weight, newBestSet.reps);

  return {
    weightImprovement: newBestSet.weight - oldBestSet.weight,
    repsImprovement: newBestSet.reps - oldBestSet.reps,
    volumeImprovement: newVolume - oldVolume,
    oneRepMaxImprovement: newOneRepMax - oldOneRepMax,
  };
}

/**
 * Validate workout data
 * 
 * @description Validates workout data and returns an array of error messages.
 * 
 * @param workout - The workout data to validate
 * @returns Array of validation error messages
 * 
 * @example
 * ```tsx
 * const errors = validateWorkout(workout);
 * if (errors.length > 0) {
 *   console.log('Validation errors:', errors);
 * }
 * ```
 */
export function validateWorkout(workout: Partial<WorkoutSession>): string[] {
  const errors: string[] = [];

  if (!workout.exercises || workout.exercises.length === 0) {
    errors.push('Workout must have at least one exercise');
  }

  if (workout.exercises) {
    workout.exercises.forEach((exercise, index) => {
      if (!exercise.name || exercise.name.trim() === '') {
        errors.push(`Exercise ${index + 1} must have a name`);
      }

      if (!exercise.sets || exercise.sets.length === 0) {
        errors.push(`Exercise "${exercise.name}" must have at least one set`);
      }

      if (exercise.sets) {
        exercise.sets.forEach((set, setIndex) => {
          if (set.weight < 0) {
            errors.push(`Exercise "${exercise.name}" set ${setIndex + 1} weight cannot be negative`);
          }
          if (set.reps < 0) {
            errors.push(`Exercise "${exercise.name}" set ${setIndex + 1} reps cannot be negative`);
          }
        });
      }
    });
  }

  if (workout.startTime && workout.endTime) {
    const start = workout.startTime instanceof Date ? workout.startTime : new Date(workout.startTime);
    const end = workout.endTime instanceof Date ? workout.endTime : new Date(workout.endTime);
    
    if (end <= start) {
      errors.push('End time must be after start time');
    }
  }

  return errors;
}

/**
 * Format workout duration for display
 * 
 * @description Formats duration in minutes to a human-readable string.
 * 
 * @param minutes - Duration in minutes
 * @returns Formatted duration string
 * 
 * @example
 * ```tsx
 * const formatted = formatWorkoutDuration(75); // "1h 15m"
 * const formatted = formatWorkoutDuration(45); // "45m"
 * ```
 */
export function formatWorkoutDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes}m`;
  }
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  if (remainingMinutes === 0) {
    return `${hours}h`;
  }
  
  return `${hours}h ${remainingMinutes}m`;
}

/**
 * Format weight for display
 * 
 * @description Formats weight to a human-readable string with appropriate units.
 * 
 * @param weight - Weight in kg
 * @returns Formatted weight string
 * 
 * @example
 * ```tsx
 * const formatted = formatWeight(85.5); // "85.5 kg"
 * const formatted = formatWeight(0.5); // "500 g"
 * ```
 */
export function formatWeight(weight: number): string {
  if (weight === 0) return '0 kg';
  if (weight < 1) return `${(weight * 1000).toFixed(0)} g`;
  return `${weight.toFixed(1)} kg`;
}

/**
 * Format volume for display
 * 
 * @description Formats volume to a human-readable string with appropriate units.
 * 
 * @param volume - Volume in kg
 * @returns Formatted volume string
 * 
 * @example
 * ```tsx
 * const formatted = formatVolume(2500); // "2.5t"
 * const formatted = formatVolume(500); // "500 kg"
 * ```
 */
export function formatVolume(volume: number): string {
  if (volume === 0) return '0 kg';
  if (volume < 1000) return `${volume.toFixed(0)} kg`;
  return `${(volume / 1000).toFixed(1)}t`;
}
