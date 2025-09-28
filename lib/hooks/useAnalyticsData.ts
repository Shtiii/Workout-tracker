'use client';

import { useState, useEffect, useMemo } from 'react';
import { collection, getDocs, query, orderBy, deleteDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { 
  WorkoutSession, 
  Program, 
  UseAnalyticsDataReturn, 
  ExerciseData, 
  ExerciseChartData 
} from '@/types';

/**
 * Custom hook for managing analytics data
 * @returns Analytics data and functions
 */
export function useAnalyticsData(): UseAnalyticsDataReturn {
  const [workouts, setWorkouts] = useState<WorkoutSession[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [allWorkouts, setAllWorkouts] = useState<WorkoutSession[]>([]);

  // Extract unique exercises from workouts
  const exerciseList = useMemo<string[]>(() => {
    const exercises = new Set<string>();
    workouts.forEach(workout => {
      workout.exercises?.forEach(exercise => {
        exercises.add(exercise.name);
      });
    });
    return Array.from(exercises);
  }, [workouts]);

  const fetchData = async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      // Check if Firebase is available
      if (!db) {
        throw new Error('Firebase not initialized. Check your configuration.');
      }

      // Fetch workouts
      const workoutsQuery = query(
        collection(db, 'workoutSessions'),
        orderBy('completedAt', 'asc')
      );
      const workoutsSnapshot = await getDocs(workoutsQuery);
      const workoutsData: WorkoutSession[] = workoutsSnapshot.docs.map(doc => {
        try {
          return {
            id: doc.id,
            ...doc.data(),
            completedAt: doc.data().completedAt?.toDate()
          } as WorkoutSession;
        } catch (docError) {
          console.warn('Error processing workout document:', doc.id, docError);
          return null;
        }
      }).filter((workout): workout is WorkoutSession => workout !== null);

      setWorkouts(workoutsData);
      setAllWorkouts(workoutsData);

      // Fetch programs
      const programsSnapshot = await getDocs(collection(db, 'programs'));
      const programsData: Program[] = programsSnapshot.docs.map(doc => {
        try {
          return {
            id: doc.id,
            ...doc.data()
          } as Program;
        } catch (docError) {
          console.warn('Error processing program document:', doc.id, docError);
          return null;
        }
      }).filter((program): program is Program => program !== null);

      setPrograms(programsData);

    } catch (error) {
      console.error('Error fetching data:', error);
      setError(error as Error);
    } finally {
      setLoading(false);
    }
  };

  const deleteWorkout = async (workoutId: string): Promise<void> => {
    if (confirm('Are you sure you want to delete this workout? This action cannot be undone.')) {
      try {
        await deleteDoc(doc(db, 'workoutSessions', workoutId));
        // Refresh data
        await fetchData();
      } catch (error) {
        console.error('Error deleting workout:', error);
        alert('Error deleting workout. Please try again.');
      }
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return {
    workouts,
    programs,
    exerciseList,
    allWorkouts,
    loading,
    error,
    fetchData,
    deleteWorkout
  };
}

/**
 * Custom hook for processing progress data
 * @param workouts Array of workout sessions
 * @param selectedProgram Selected program filter
 * @param selectedExercise Selected exercise filter
 * @returns Processed progress data
 */
export function useProgressData(
  workouts: WorkoutSession[], 
  selectedProgram: string, 
  selectedExercise: string
): Record<string, ExerciseData[]> {
  return useMemo<Record<string, ExerciseData[]>>(() => {
    let filteredWorkouts = workouts;

    // Filter by program if selected
    if (selectedProgram !== 'all') {
      filteredWorkouts = filteredWorkouts.filter(w => w.programName === selectedProgram);
    }

    // Aggregate exercise data
    const exerciseData: Record<string, ExerciseData[]> = {};

    filteredWorkouts.forEach(workout => {
      workout.exercises?.forEach(exercise => {
        if (selectedExercise === 'all' || exercise.name === selectedExercise) {
          if (!exerciseData[exercise.name]) {
            exerciseData[exercise.name] = [];
          }

          exercise.sets?.forEach(set => {
            const weight = parseFloat(set.weight.toString());
            const reps = parseInt(set.reps.toString());
            if (weight && reps) {
              const oneRepMax = weight * (1 + reps / 30);
              exerciseData[exercise.name].push({
                date: workout.completedAt,
                weight,
                reps,
                oneRepMax,
                volume: weight * reps
              });
            }
          });
        }
      });
    });

    return exerciseData;
  }, [workouts, selectedProgram, selectedExercise]);
}

/**
 * Custom hook for generating exercise progress charts
 * @param workouts Array of workout sessions
 * @param selectedProgram Selected program filter
 * @param selectedExercise Selected exercise filter
 * @returns Chart data for exercises
 */
export function useExerciseProgressCharts(
  workouts: WorkoutSession[], 
  selectedProgram: string, 
  selectedExercise: string
): ExerciseChartData[] {
  return useMemo<ExerciseChartData[]>(() => {
    const exerciseData: Record<string, Array<{ date: string; weight: number; fullDate: Date }>> = {};

    const filteredWorkouts = workouts.filter(workout => {
      if (selectedProgram !== 'all' && workout.programName !== selectedProgram) return false;
      return true;
    });

    filteredWorkouts.forEach(workout => {
      workout.exercises?.forEach(exercise => {
        if (selectedExercise !== 'all' && exercise.name !== selectedExercise) return;

        if (!exerciseData[exercise.name]) {
          exerciseData[exercise.name] = [];
        }

        // Find the best set for this exercise in this workout
        let bestWeight = 0;
        exercise.sets?.forEach(set => {
          const weight = parseFloat(set.weight.toString());
          if (weight && set.completed && weight > bestWeight) {
            bestWeight = weight;
          }
        });

        if (bestWeight > 0) {
          exerciseData[exercise.name].push({
            date: workout.completedAt.toLocaleDateString('en-GB', { month: 'short', day: 'numeric' }),
            weight: bestWeight,
            fullDate: workout.completedAt
          });
        }
      });
    });

    // Sort by date and limit to top exercises
    Object.keys(exerciseData).forEach(exercise => {
      exerciseData[exercise].sort((a, b) => a.fullDate.getTime() - b.fullDate.getTime());
    });

    // Return top 4 exercises with most data points
    return Object.entries(exerciseData)
      .filter(([, data]) => data.length >= 2)
      .sort(([, a], [, b]) => b.length - a.length)
      .slice(0, 4)
      .map(([name, data]) => ({
        name,
        data: data.slice(-10) // Last 10 data points
      }));
  }, [workouts, selectedProgram, selectedExercise]);
}
