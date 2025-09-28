'use client';

import { useState, useEffect, useMemo } from 'react';
import { collection, getDocs, query, orderBy, deleteDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

/**
 * Custom hook for managing analytics data
 * @returns {Object} Analytics data and functions
 */
export function useAnalyticsData() {
  const [workouts, setWorkouts] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [allWorkouts, setAllWorkouts] = useState([]);

  // Extract unique exercises from workouts
  const exerciseList = useMemo(() => {
    const exercises = new Set();
    workouts.forEach(workout => {
      workout.exercises?.forEach(exercise => {
        exercises.add(exercise.name);
      });
    });
    return Array.from(exercises);
  }, [workouts]);

  const fetchData = async () => {
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
      const workoutsData = workoutsSnapshot.docs.map(doc => {
        try {
          return {
            id: doc.id,
            ...doc.data(),
            completedAt: doc.data().completedAt?.toDate()
          };
        } catch (docError) {
          console.warn('Error processing workout document:', doc.id, docError);
          return null;
        }
      }).filter(Boolean); // Remove null entries

      setWorkouts(workoutsData);
      setAllWorkouts(workoutsData);

      // Fetch programs
      const programsSnapshot = await getDocs(collection(db, 'programs'));
      const programsData = programsSnapshot.docs.map(doc => {
        try {
          return {
            id: doc.id,
            ...doc.data()
          };
        } catch (docError) {
          console.warn('Error processing program document:', doc.id, docError);
          return null;
        }
      }).filter(Boolean); // Remove null entries

      setPrograms(programsData);

    } catch (error) {
      console.error('Error fetching data:', error);
      setError(error);
    } finally {
      setLoading(false);
    }
  };

  const deleteWorkout = async (workoutId) => {
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
 * @param {Array} workouts - Array of workout sessions
 * @param {string} selectedProgram - Selected program filter
 * @param {string} selectedExercise - Selected exercise filter
 * @returns {Object} Processed progress data
 */
export function useProgressData(workouts, selectedProgram, selectedExercise) {
  return useMemo(() => {
    let filteredWorkouts = workouts;

    // Filter by program if selected
    if (selectedProgram !== 'all') {
      filteredWorkouts = filteredWorkouts.filter(w => w.programName === selectedProgram);
    }

    // Aggregate exercise data
    const exerciseData = {};

    filteredWorkouts.forEach(workout => {
      workout.exercises?.forEach(exercise => {
        if (selectedExercise === 'all' || exercise.name === selectedExercise) {
          if (!exerciseData[exercise.name]) {
            exerciseData[exercise.name] = [];
          }

          exercise.sets?.forEach(set => {
            const weight = parseFloat(set.weight);
            const reps = parseInt(set.reps);
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
 * @param {Array} workouts - Array of workout sessions
 * @param {string} selectedProgram - Selected program filter
 * @param {string} selectedExercise - Selected exercise filter
 * @returns {Array} Chart data for exercises
 */
export function useExerciseProgressCharts(workouts, selectedProgram, selectedExercise) {
  return useMemo(() => {
    const exerciseData = {};

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
          const weight = parseFloat(set.weight);
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
      exerciseData[exercise].sort((a, b) => a.fullDate - b.fullDate);
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
