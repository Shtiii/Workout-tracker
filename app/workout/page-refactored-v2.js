'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Container, Box, Snackbar, Alert } from '@mui/material';
import { motion } from 'framer-motion';
import { collection, getDocs, addDoc, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { saveWorkoutWithBackup } from '@/lib/offlineStorage';
import { useDebounce } from '@/lib/performance';
import { sanitizeInput, validateWorkoutData } from '@/lib/security';
import ErrorBoundary from '@/components/ErrorBoundary';

// Import refactored components
import WorkoutHeader from '@/components/workout/WorkoutHeader';
import WorkoutTimer from '@/components/workout/WorkoutTimer';
import ProgramSelector from '@/components/workout/ProgramSelector';
import RestTimer from '@/components/workout/RestTimer';
import BulkActionsBar from '@/components/workout/BulkActionsBar';
import ExerciseList from '@/components/workout/ExerciseList';
import ExerciseModal from '@/components/workout/ExerciseModal';
import WorkoutHistory from '@/components/workout/WorkoutHistory';
import DraftNotification from '@/components/workout/DraftNotification';
import WorkoutActions from '@/components/workout/WorkoutActions';

export default function WorkoutPage() {
  // State management
  const [programs, setPrograms] = useState([]);
  const [selectedProgramId, setSelectedProgramId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [availableExercises, setAvailableExercises] = useState([]);
  const [exerciseSearch, setExerciseSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [recentExercises, setRecentExercises] = useState([]);
  const [exerciseHistory, setExerciseHistory] = useState({});
  const [recentWorkouts, setRecentWorkouts] = useState([]);
  const [hasDraftLoaded, setHasDraftLoaded] = useState(false);

  // Timer states
  const [timer, setTimer] = useState({
    time: 0,
    isRunning: false,
    startTime: null
  });
  const [restTimer, setRestTimer] = useState({
    isActive: false,
    timeLeft: 0,
    duration: 90
  });
  const [wakeLock, setWakeLock] = useState(null);

  // Workout state
  const [activeWorkout, setActiveWorkout] = useState({
    programId: '',
    programName: '',
    exercises: [],
    startTime: null,
    endTime: null
  });

  // Settings
  const [restSettings, setRestSettings] = useState({
    enabled: true,
    duration: 90,
    autoStart: true
  });
  const [autoAdvanceEnabled, setAutoAdvanceEnabled] = useState(true);
  const [bulkModeEnabled, setBulkModeEnabled] = useState(false);
  const [selectedSets, setSelectedSets] = useState({});

  // Quick stats
  const [quickStats, setQuickStats] = useState({
    totalWorkouts: 0,
    currentStreak: 0,
    weeklyProgress: '0/3'
  });
  const [weeklyGoal, setWeeklyGoal] = useState(3);

  // Debounced search
  useDebounce(() => {
    setDebouncedSearch(exerciseSearch);
  }, [exerciseSearch], 300);

  // Memoized exercise count
  const exerciseCount = useMemo(() => 
    activeWorkout.exercises.length, 
    [activeWorkout.exercises.length]
  );

  // Memoized total sets count
  const totalSetsCount = useMemo(() => 
    activeWorkout.exercises.reduce((total, ex) => total + ex.sets.length, 0),
    [activeWorkout.exercises]
  );

  // Memoized completed sets count
  const completedSetsCount = useMemo(() => 
    activeWorkout.exercises.reduce((total, ex) => 
      total + ex.sets.filter(set => set.completed).length, 0
    ),
    [activeWorkout.exercises]
  );

  // Screen wake lock management
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const requestWakeLock = async () => {
      try {
        if ('wakeLock' in navigator && timer.isRunning) {
          const lock = await navigator.wakeLock.request('screen');
          setWakeLock(lock);
          console.log('Screen wake lock activated');

          lock.addEventListener('release', () => {
            console.log('Screen wake lock released');
          });
        }
      } catch (err) {
        console.log('Wake lock not supported or failed:', err);
      }
    };

    const releaseWakeLock = () => {
      if (wakeLock) {
        wakeLock.release();
        setWakeLock(null);
      }
    };

    if (timer.isRunning) {
      requestWakeLock();
    } else {
      releaseWakeLock();
    }

    return () => {
      releaseWakeLock();
    };
  }, [timer.isRunning, wakeLock]);

  // Main timer effect
  useEffect(() => {
    let interval = null;
    if (timer.isRunning) {
      interval = setInterval(() => {
        setTimer(prev => ({
          ...prev,
          time: Math.floor((Date.now() - prev.startTime) / 1000)
        }));
      }, 1000);
    } else if (!timer.isRunning) {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [timer.isRunning, timer.startTime]);

  // Rest timer effect
  useEffect(() => {
    if (typeof window === 'undefined') return;

    let interval = null;
    if (restTimer.isActive && restTimer.timeLeft > 0) {
      interval = setInterval(() => {
        setRestTimer(prev => ({
          ...prev,
          timeLeft: prev.timeLeft - 1
        }));
      }, 1000);
    } else if (restTimer.timeLeft === 0 && restTimer.isActive) {
      setRestTimer(prev => ({ ...prev, isActive: false }));
      if ('vibrate' in navigator) {
        navigator.vibrate([200, 100, 200]);
      }
    }
    return () => clearInterval(interval);
  }, [restTimer.isActive, restTimer.timeLeft]);

  // Initial data loading
  useEffect(() => {
    fetchPrograms();
    fetchExercises();
    fetchRecentWorkouts();
    loadDraftWorkout();
  }, []);

  // Data fetching functions
  const fetchPrograms = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      if (!db) {
        throw new Error('Firebase not initialized');
      }

      const querySnapshot = await getDocs(collection(db, 'programs'));
      const programsData = [];
      querySnapshot.forEach((doc) => {
        programsData.push({ id: doc.id, ...doc.data() });
      });
      setPrograms(programsData);
    } catch (error) {
      console.error('Error fetching programs:', error);
      setError('Failed to load programs');
      setSnackbarMessage('Error fetching programs');
      setSnackbarOpen(true);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchExercises = useCallback(async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'exercises'));
      const exercisesData = [];
      querySnapshot.forEach((doc) => {
        exercisesData.push({ id: doc.id, ...doc.data() });
      });
      setAvailableExercises(exercisesData);
    } catch (error) {
      console.error('Error fetching exercises:', error);
    }
  }, []);

  const fetchRecentWorkouts = useCallback(async () => {
    try {
      const q = query(collection(db, 'workoutSessions'), orderBy('completedAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const workoutsData = [];
      querySnapshot.forEach((doc) => {
        workoutsData.push({ id: doc.id, ...doc.data() });
      });
      setRecentWorkouts(workoutsData.slice(0, 5));
    } catch (error) {
      console.error('Error fetching recent workouts:', error);
    }
  }, []);

  const loadDraftWorkout = useCallback(() => {
    try {
      const draft = localStorage.getItem('draftWorkout');
      if (draft) {
        const parsedDraft = JSON.parse(draft);
        if (parsedDraft.exercises && parsedDraft.exercises.length > 0) {
          setActiveWorkout(parsedDraft);
          setHasDraftLoaded(true);
        }
      }
    } catch (error) {
      console.error('Error loading draft workout:', error);
    }
  }, []);

  // Timer functions
  const startTimer = useCallback(() => {
    setTimer(prev => ({
      ...prev,
      isRunning: true,
      startTime: prev.startTime || Date.now()
    }));
  }, []);

  const pauseTimer = useCallback(() => {
    setTimer(prev => ({
      ...prev,
      isRunning: false
    }));
  }, []);

  const stopTimer = useCallback(() => {
    setTimer({
      time: 0,
      isRunning: false,
      startTime: null
    });
  }, []);

  const resetTimer = useCallback(() => {
    setTimer({
      time: 0,
      isRunning: false,
      startTime: null
    });
  }, []);

  // Rest timer functions
  const startRestTimer = (duration = restSettings.duration) => {
    setRestTimer({
      isActive: true,
      timeLeft: duration,
      duration
    });
  };

  const stopRestTimer = () => {
    setRestTimer(prev => ({ ...prev, isActive: false }));
  };

  // Workout functions
  const handleProgramSelect = (programId) => {
    const program = programs.find(p => p.id === programId);
    if (program) {
      setActiveWorkout({
        programId: program.id,
        programName: program.name,
        exercises: program.exercises || [],
        startTime: new Date(),
        endTime: null
      });
      setSelectedProgramId(programId);
      
      if (!timer.isRunning) {
        startTimer();
      }
    }
  };

  const addCustomExercise = (exerciseName) => {
    // Sanitize input
    const sanitizedName = sanitizeInput(exerciseName);
    
    if (!sanitizedName || sanitizedName.length < 2) {
      setSnackbarMessage('Please enter a valid exercise name');
      setSnackbarOpen(true);
      return;
    }

    const newExercise = {
      name: sanitizedName,
      targetSets: 3,
      targetReps: 10,
      sets: []
    };

    setActiveWorkout(prev => ({
      ...prev,
      exercises: [...prev.exercises, newExercise]
    }));
    setModalOpen(false);
  };

  const finishWorkout = async () => {
    if (!activeWorkout.exercises.length) {
      setSnackbarMessage('Add at least one exercise to save workout!');
      setSnackbarOpen(true);
      return;
    }

    const sessionToSave = {
      ...activeWorkout,
      endTime: new Date(),
      completedAt: new Date(),
      duration: timer.time
    };

    // Validate workout data
    const validationResult = validateWorkoutData(sessionToSave);
    if (!validationResult.isValid) {
      setSnackbarMessage(`Validation error: ${validationResult.errors.join(', ')}`);
      setSnackbarOpen(true);
      return;
    }

    try {
      await addDoc(collection(db, 'workoutSessions'), sessionToSave);
      await saveWorkoutWithBackup(sessionToSave);
      
      setSnackbarMessage('Workout Saved! 💪');
      setSnackbarOpen(true);

      // Reset workout state
      setActiveWorkout({
        programId: '',
        programName: '',
        exercises: [],
        startTime: null,
        endTime: null
      });
      setSelectedProgramId('');
      stopTimer();
      
      // Clear draft
      localStorage.removeItem('draftWorkout');
      setHasDraftLoaded(false);
      
      // Refresh recent workouts
      fetchRecentWorkouts();
    } catch (error) {
      console.error('Error saving workout:', error);
      setSnackbarMessage('Error saving workout');
      setSnackbarOpen(true);
    }
  };

  const clearDraft = () => {
    localStorage.removeItem('draftWorkout');
    setHasDraftLoaded(false);
    setActiveWorkout({
      programId: '',
      programName: '',
      exercises: [],
      startTime: null,
      endTime: null
    });
  };

  // Exercise functions
  const updateSet = (exerciseIndex, setIndex, field, value) => {
    // Sanitize numeric inputs
    let sanitizedValue = value;
    if (field === 'weight' || field === 'reps') {
      sanitizedValue = Math.max(0, Math.min(9999, Number(value) || 0));
    } else if (field === 'name') {
      sanitizedValue = sanitizeInput(value);
    }

    const updatedWorkout = { ...activeWorkout };
    updatedWorkout.exercises[exerciseIndex].sets[setIndex][field] = sanitizedValue;
    setActiveWorkout(updatedWorkout);
  };

  const completeSet = (exerciseIndex, setIndex) => {
    const updatedWorkout = { ...activeWorkout };
    const wasCompleted = updatedWorkout.exercises[exerciseIndex].sets[setIndex].completed;
    updatedWorkout.exercises[exerciseIndex].sets[setIndex].completed = !wasCompleted;
    setActiveWorkout(updatedWorkout);

    if (!wasCompleted && typeof window !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate([50, 50, 50]);
    }
  };

  const addSet = (exerciseIndex) => {
    const updatedWorkout = { ...activeWorkout };
    const exercise = updatedWorkout.exercises[exerciseIndex];
    const lastSet = exercise.sets[exercise.sets.length - 1];
    
    const newSet = {
      weight: lastSet ? lastSet.weight : 0,
      reps: lastSet ? lastSet.reps : 10,
      completed: false
    };
    
    updatedWorkout.exercises[exerciseIndex].sets.push(newSet);
    setActiveWorkout(updatedWorkout);
  };

  const removeSet = (exerciseIndex, setIndex) => {
    const updatedWorkout = { ...activeWorkout };
    updatedWorkout.exercises[exerciseIndex].sets.splice(setIndex, 1);
    setActiveWorkout(updatedWorkout);
  };

  const removeExercise = (exerciseIndex) => {
    const updatedWorkout = { ...activeWorkout };
    updatedWorkout.exercises.splice(exerciseIndex, 1);
    setActiveWorkout(updatedWorkout);
  };

  const moveExercise = (fromIndex, toIndex) => {
    const updatedWorkout = { ...activeWorkout };
    const [movedExercise] = updatedWorkout.exercises.splice(fromIndex, 1);
    updatedWorkout.exercises.splice(toIndex, 0, movedExercise);
    setActiveWorkout(updatedWorkout);
  };

  // Bulk operations
  const toggleSetSelection = (exerciseIndex, setIndex) => {
    setSelectedSets(prev => ({
      ...prev,
      [exerciseIndex]: {
        ...prev[exerciseIndex],
        [setIndex]: !prev[exerciseIndex]?.[setIndex]
      }
    }));
  };

  const bulkDuplicateSets = () => {
    const updatedWorkout = { ...activeWorkout };
    
    Object.keys(selectedSets).forEach(exerciseIndex => {
      const exerciseSets = selectedSets[exerciseIndex];
      if (exerciseSets) {
        Object.keys(exerciseSets).forEach(setIndex => {
          if (exerciseSets[setIndex]) {
            const set = updatedWorkout.exercises[exerciseIndex].sets[setIndex];
            updatedWorkout.exercises[exerciseIndex].sets.push({
              ...set,
              completed: false
            });
          }
        });
      }
    });
    
    setActiveWorkout(updatedWorkout);
    setSelectedSets({});
  };

  const bulkDeleteSets = () => {
    const updatedWorkout = { ...activeWorkout };
    
    Object.keys(selectedSets).forEach(exerciseIndex => {
      const exerciseSets = selectedSets[exerciseIndex];
      if (exerciseSets) {
        const indicesToDelete = Object.keys(exerciseSets)
          .filter(setIndex => exerciseSets[setIndex])
          .map(Number)
          .sort((a, b) => b - a); // Sort in descending order
        
        indicesToDelete.forEach(setIndex => {
          updatedWorkout.exercises[exerciseIndex].sets.splice(setIndex, 1);
        });
      }
    });
    
    setActiveWorkout(updatedWorkout);
    setSelectedSets({});
  };

  return (
    <ErrorBoundary>
      <Box
        sx={{
          minHeight: '100vh',
          background: `
            radial-gradient(circle at 20% 50%, rgba(255, 68, 68, 0.1) 0%, transparent 50%),
            radial-gradient(circle at 80% 80%, rgba(255, 170, 0, 0.05) 0%, transparent 50%)
          `,
          pb: 10
        }}
      >
        <Container maxWidth="lg">
          {/* Draft Notification */}
          {hasDraftLoaded && (
            <DraftNotification onClearDraft={clearDraft} />
          )}

          {/* Workout Header */}
          <WorkoutHeader
            activeWorkout={activeWorkout}
            quickStats={quickStats}
            weeklyGoal={weeklyGoal}
          />

          {/* Workout Timer */}
          <WorkoutTimer
            timer={timer}
            onStartTimer={startTimer}
            onPauseTimer={pauseTimer}
            onStopTimer={stopTimer}
            onResetTimer={resetTimer}
          />

          {/* Program Selector */}
          <ProgramSelector
            programs={programs}
            selectedProgramId={selectedProgramId}
            loading={loading}
            onProgramSelect={handleProgramSelect}
            onAddExercise={() => setModalOpen(true)}
            onManagePrograms={() => {
              if (typeof window !== 'undefined') {
                window.location.href = '/programs';
              }
            }}
            onRestSettings={setRestSettings}
            restSettings={restSettings}
            autoAdvanceEnabled={autoAdvanceEnabled}
            onToggleAutoAdvance={() => setAutoAdvanceEnabled(!autoAdvanceEnabled)}
            bulkModeEnabled={bulkModeEnabled}
            onToggleBulkMode={() => setBulkModeEnabled(!bulkModeEnabled)}
          />

          {/* Rest Timer */}
          {restTimer.isActive && (
            <RestTimer
              restTimer={restTimer}
              onStop={stopRestTimer}
            />
          )}

          {/* Bulk Actions Bar */}
          {bulkModeEnabled && Object.keys(selectedSets).length > 0 && (
            <BulkActionsBar
              selectedCount={Object.values(selectedSets).reduce((total, sets) => 
                total + Object.values(sets).filter(Boolean).length, 0
              )}
              onDuplicate={bulkDuplicateSets}
              onDelete={bulkDeleteSets}
              onCancel={() => setSelectedSets({})}
            />
          )}

          {/* Exercise List */}
          <ExerciseList
            exercises={activeWorkout.exercises}
            onUpdateSet={updateSet}
            onCompleteSet={completeSet}
            onAddSet={addSet}
            onRemoveSet={removeSet}
            onRemoveExercise={removeExercise}
            onMoveExercise={moveExercise}
            exerciseHistory={exerciseHistory}
            restTimer={restTimer}
            onStartRestTimer={startRestTimer}
            onStopRestTimer={stopRestTimer}
            selectedSets={selectedSets}
            onToggleSetSelection={toggleSetSelection}
            bulkModeEnabled={bulkModeEnabled}
          />

          {/* Workout Actions */}
          <WorkoutActions
            activeWorkout={activeWorkout}
            onFinishWorkout={finishWorkout}
            onAddExercise={() => setModalOpen(true)}
          />

          {/* Recent Workouts */}
          {recentWorkouts.length > 0 && (
            <WorkoutHistory
              recentWorkouts={recentWorkouts}
              onLoadWorkout={(workout) => {
                setActiveWorkout(workout);
                setSelectedProgramId(workout.programId);
              }}
            />
          )}
        </Container>

        {/* Add Exercise Modal */}
        <ExerciseModal
          open={modalOpen}
          onClose={() => {
            setModalOpen(false);
            setExerciseSearch('');
          }}
          exerciseSearch={exerciseSearch}
          onSearchChange={setExerciseSearch}
          availableExercises={availableExercises}
          recentExercises={recentExercises}
          onAddExercise={addCustomExercise}
        />

        {/* Snackbar */}
        <Snackbar
          open={snackbarOpen}
          autoHideDuration={4000}
          onClose={() => setSnackbarOpen(false)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert
            onClose={() => setSnackbarOpen(false)}
            severity="success"
            sx={{ width: '100%' }}
          >
            {snackbarMessage}
          </Alert>
        </Snackbar>
      </Box>
    </ErrorBoundary>
  );
}
