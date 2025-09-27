'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Container,
  CircularProgress,
  Snackbar,
  Alert,
  Box
} from '@mui/material';
import { collection, getDocs, addDoc, query, orderBy, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { saveWorkoutWithBackup } from '@/lib/offlineStorage';
import { useDebounce } from '@/lib/performance';
import ErrorBoundary from '@/components/ErrorBoundary';

// Import new components
import WorkoutHeader from '@/components/workout/WorkoutHeader';
import ProgramSelector from '@/components/workout/ProgramSelector';
import RestTimer from '@/components/workout/RestTimer';
import BulkActionsBar from '@/components/workout/BulkActionsBar';
import ExerciseCard from '@/components/workout/ExerciseCard';
import ExerciseModal from '@/components/workout/ExerciseModal';
import WorkoutHistory from '@/components/workout/WorkoutHistory';
import DraftNotification from '@/components/workout/DraftNotification';
import WorkoutActions from '@/components/workout/WorkoutActions';
import WorkoutTimer from '@/components/workout/WorkoutTimer';

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
  const [restTimer, setRestTimer] = useState({
    isActive: false,
    timeLeft: 0,
    duration: 90
  });
  const [restSettings, setRestSettings] = useState({
    enabled: true,
    duration: 90,
    autoStart: true
  });
  const [timer, setTimer] = useState({
    time: 0,
    isRunning: false,
    startTime: null
  });
  const [activeWorkout, setActiveWorkout] = useState({
    programId: '',
    programName: '',
    exercises: [],
    startTime: null,
    endTime: null
  });
  const [wakeLock, setWakeLock] = useState(null);
  const [autoAdvanceEnabled, setAutoAdvanceEnabled] = useState(true);
  const [draggedExercise, setDraggedExercise] = useState(null);
  const [selectedSets, setSelectedSets] = useState({});
  const [bulkModeEnabled, setBulkModeEnabled] = useState(false);
  const [hasDraftLoaded, setHasDraftLoaded] = useState(false);
  const [quickStats, setQuickStats] = useState({
    totalWorkouts: 0,
    currentStreak: 0,
    weeklyProgress: '0/3'
  });
  const [weeklyGoal, setWeeklyGoal] = useState(3);
  const [recentWorkouts, setRecentWorkouts] = useState([]);

  // Draft storage
  const DRAFT_STORAGE_KEY = 'workoutDraft';

  // Load draft workout from localStorage
  const loadDraftWorkout = () => {
    try {
      if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
        const saved = localStorage.getItem(DRAFT_STORAGE_KEY);
        if (saved) {
          const draft = JSON.parse(saved);
          setActiveWorkout(draft);
          setHasDraftLoaded(true);
          return true;
        }
      }
    } catch (error) {
      console.error('Error loading draft workout:', error);
    }
    return false;
  };

  // Save current workout as draft
  const saveDraftWorkout = useCallback(() => {
    if (activeWorkout.exercises.length > 0) {
      try {
        if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
          localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(activeWorkout));
        }
      } catch (error) {
        console.error('Error saving draft workout:', error);
      }
    }
  }, [activeWorkout]);

  // Clear draft from storage
  const clearDraftWorkout = () => {
    try {
      if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
        localStorage.removeItem(DRAFT_STORAGE_KEY);
        setHasDraftLoaded(false);
      }
    } catch (error) {
      console.error('Error clearing draft workout:', error);
    }
  };

  // Manually clear draft and reset workout
  const clearDraftManually = () => {
    clearDraftWorkout();
    setActiveWorkout({
      programId: '',
      programName: '',
      exercises: [],
      startTime: null,
      endTime: null
    });
    setSelectedProgramId('');
    setSnackbarMessage('Draft workout cleared');
    setSnackbarOpen(true);
  };

  // Auto-save effect
  useEffect(() => {
    const autoSaveTimer = setTimeout(() => {
      if (activeWorkout.exercises.length > 0) {
        saveDraftWorkout();
      }
    }, 2000);

    return () => clearTimeout(autoSaveTimer);
  }, [activeWorkout, saveDraftWorkout]);

  // Initial data loading
  useEffect(() => {
    fetchPrograms();
    fetchExercises();
    fetchRecentWorkouts();

    if (typeof window !== 'undefined') {
      loadDraftWorkout();
    }
  }, []);

  // Rest timer effect
  useEffect(() => {
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

  // Screen wake lock management
  useEffect(() => {
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

  // Data fetching functions
  const fetchPrograms = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!db) {
        throw new Error('Firebase not initialized. Check your configuration.');
      }

      const querySnapshot = await getDocs(collection(db, 'programs'));
      const programsData = [];
      querySnapshot.forEach((doc) => {
        try {
          programsData.push({ id: doc.id, ...doc.data() });
        } catch (docError) {
          console.warn('Error processing program document:', doc.id, docError);
        }
      });
      setPrograms(programsData);
    } catch (error) {
      console.error('Error fetching programs:', error);
      setError(error);
      setSnackbarMessage('Error fetching programs. Please check your connection.');
      setSnackbarOpen(true);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecentWorkouts = async () => {
    try {
      if (!db) return;

      const workoutsQuery = query(
        collection(db, 'workoutSessions'),
        orderBy('completedAt', 'desc')
      );
      const workoutsSnapshot = await getDocs(workoutsQuery);
      const workouts = workoutsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        completedAt: doc.data().completedAt?.toDate() || new Date()
      }));

      setRecentWorkouts(workouts.slice(0, 5));
    } catch (error) {
      console.error('Error fetching recent workouts:', error);
    }
  };

  const fetchExercises = async () => {
    const exerciseDatabase = [
      'Bench Press', 'Incline Bench Press', 'Decline Bench Press', 'Dumbbell Press', 'Incline Dumbbell Press',
      'Chest Flyes', 'Incline Flyes', 'Push-ups', 'Dips', 'Cable Crossovers',
      'Deadlift', 'Barbell Row', 'T-Bar Row', 'Seated Row', 'Lat Pulldown',
      'Pull-ups', 'Chin-ups', 'One Arm Row', 'Face Pulls', 'Reverse Flyes',
      'Squat', 'Front Squat', 'Leg Press', 'Romanian Deadlift', 'Bulgarian Split Squat',
      'Lunges', 'Leg Curls', 'Leg Extensions', 'Calf Raises', 'Hip Thrusts',
      'Overhead Press', 'Dumbbell Press', 'Lateral Raises', 'Front Raises', 'Rear Delt Flyes',
      'Arnold Press', 'Pike Push-ups', 'Handstand Push-ups', 'Upright Rows', 'Shrugs',
      'Bicep Curls', 'Hammer Curls', 'Preacher Curls', 'Cable Curls', 'Concentration Curls',
      'Tricep Extensions', 'Close Grip Bench', 'Tricep Dips', 'Overhead Tricep Extension', 'Diamond Push-ups',
      'Plank', 'Side Plank', 'Crunches', 'Russian Twists', 'Mountain Climbers',
      'Dead Bug', 'Bird Dog', 'Hanging Leg Raises', 'Ab Wheel', 'Cable Crunches'
    ];
    setAvailableExercises(exerciseDatabase);

    try {
      const workoutsQuery = query(
        collection(db, 'workoutSessions'),
        orderBy('completedAt', 'desc')
      );
      const workoutsSnapshot = await getDocs(workoutsQuery);
      const exerciseFrequency = {};

      workoutsSnapshot.docs.slice(0, 10).forEach(doc => {
        const workout = doc.data();
        workout.exercises?.forEach(exercise => {
          exerciseFrequency[exercise.name] = (exerciseFrequency[exercise.name] || 0) + 1;
        });
      });

      const sortedRecent = Object.entries(exerciseFrequency)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 8)
        .map(([name]) => name);

      setRecentExercises(sortedRecent);

      const history = {};
      workoutsSnapshot.docs.forEach(doc => {
        const workout = doc.data();
        workout.exercises?.forEach(exercise => {
          if (!history[exercise.name]) {
            history[exercise.name] = [];
          }

          exercise.sets?.forEach(set => {
            if (set.weight && set.reps && set.completed) {
              history[exercise.name].push({
                weight: parseFloat(set.weight),
                reps: parseInt(set.reps),
                date: workout.completedAt?.toDate() || new Date()
              });
            }
          });
        });
      });

      Object.keys(history).forEach(exerciseName => {
        history[exerciseName] = history[exerciseName]
          .sort((a, b) => b.date - a.date)
          .slice(0, 15);
      });

      setExerciseHistory(history);
    } catch (error) {
      console.error('Error fetching recent exercises:', error);
    }
  };

  // Workout management functions
  const handleProgramSelect = (event) => {
    const programId = event.target.value;
    setSelectedProgramId(programId);

    const program = programs.find(p => p.id === programId);
    if (program) {
      const exercisesWithSets = program.exercises.map(exercise => {
        const smartDefaults = getSmartDefaults(exercise.name);
        return {
          name: exercise.name,
          targetSets: exercise.sets || 3,
          targetReps: exercise.reps || 10,
          sets: [{
            weight: smartDefaults.weight,
            reps: smartDefaults.reps,
            completed: false,
            rpe: ''
          }]
        };
      });

      setActiveWorkout({
        programId: program.id,
        programName: program.name,
        exercises: exercisesWithSets,
        startTime: new Date(),
        endTime: null
      });
    }
  };

  const getSmartDefaults = (exerciseName) => {
    const history = exerciseHistory[exerciseName];
    if (!history || history.length === 0) {
      return { weight: '', reps: '', targetSets: 3, targetReps: 10 };
    }

    const recentSets = history.slice(0, 6);
    const avgWeight = recentSets.reduce((sum, set) => sum + set.weight, 0) / recentSets.length;
    const avgReps = recentSets.reduce((sum, set) => sum + set.reps, 0) / recentSets.length;

    const suggestedWeight = Math.round((avgWeight + 1.25) * 4) / 4;
    const suggestedReps = Math.round(avgReps);

    return {
      weight: suggestedWeight.toString(),
      reps: suggestedReps.toString(),
      targetSets: 3,
      targetReps: suggestedReps
    };
  };

  const addSet = (exerciseIndex) => {
    const updatedWorkout = { ...activeWorkout };
    const exercise = updatedWorkout.exercises[exerciseIndex];

    let newSet = { weight: '', reps: '', completed: false, rpe: '' };

    const completedSets = exercise.sets.filter(set => set.completed && set.weight && set.reps);
    if (completedSets.length > 0) {
      const lastSet = completedSets[completedSets.length - 1];
      newSet = {
        weight: lastSet.weight,
        reps: lastSet.reps,
        completed: false,
        rpe: lastSet.rpe || ''
      };
    } else {
      const smartDefaults = getSmartDefaults(exercise.name);
      newSet = {
        weight: smartDefaults.weight,
        reps: smartDefaults.reps,
        completed: false,
        rpe: ''
      };
    }

    updatedWorkout.exercises[exerciseIndex].sets.push(newSet);
    setActiveWorkout(updatedWorkout);
  };

  const updateSet = (exerciseIndex, setIndex, field, value) => {
    const updatedWorkout = { ...activeWorkout };
    updatedWorkout.exercises[exerciseIndex].sets[setIndex][field] = value;
    setActiveWorkout(updatedWorkout);
  };

  const completeSet = (exerciseIndex, setIndex) => {
    const updatedWorkout = { ...activeWorkout };
    const wasCompleted = updatedWorkout.exercises[exerciseIndex].sets[setIndex].completed;
    updatedWorkout.exercises[exerciseIndex].sets[setIndex].completed = !wasCompleted;
    setActiveWorkout(updatedWorkout);

    if (!wasCompleted && 'vibrate' in navigator) {
      navigator.vibrate([50, 50, 50]);
    }

    if (!wasCompleted && autoAdvanceEnabled) {
      const currentExercise = updatedWorkout.exercises[exerciseIndex];
      const incompleteSets = currentExercise.sets.filter(set => !set.completed);
      if (incompleteSets.length === 0) {
        setTimeout(() => addSet(exerciseIndex), 100);
      }
    }

    if (!wasCompleted && restSettings.enabled && restSettings.autoStart) {
      startRestTimer();
    }
  };

  const addCustomExercise = (exerciseName) => {
    const smartDefaults = getSmartDefaults(exerciseName);

    const newExercise = {
      name: exerciseName,
      targetSets: smartDefaults.targetSets,
      targetReps: smartDefaults.targetReps,
      sets: [{
        weight: smartDefaults.weight,
        reps: smartDefaults.reps,
        completed: false
      }]
    };

    setActiveWorkout(prev => ({
      ...prev,
      exercises: [...prev.exercises, newExercise]
    }));
    setExerciseSearch('');
    setModalOpen(false);
  };

  const addCustomExerciseFromSearch = () => {
    if (exerciseSearch.trim()) {
      addCustomExercise(exerciseSearch.trim());
    }
  };

  const removeExercise = (exerciseIndex) => {
    const updatedWorkout = { ...activeWorkout };
    updatedWorkout.exercises.splice(exerciseIndex, 1);
    setActiveWorkout(updatedWorkout);
  };

  const moveExerciseUp = (exerciseIndex) => {
    if (exerciseIndex === 0) return;

    const updatedWorkout = { ...activeWorkout };
    const exercises = [...updatedWorkout.exercises];
    [exercises[exerciseIndex - 1], exercises[exerciseIndex]] = [exercises[exerciseIndex], exercises[exerciseIndex - 1]];
    updatedWorkout.exercises = exercises;
    setActiveWorkout(updatedWorkout);
  };

  const moveExerciseDown = (exerciseIndex) => {
    if (exerciseIndex === activeWorkout.exercises.length - 1) return;

    const updatedWorkout = { ...activeWorkout };
    const exercises = [...updatedWorkout.exercises];
    [exercises[exerciseIndex], exercises[exerciseIndex + 1]] = [exercises[exerciseIndex + 1], exercises[exerciseIndex]];
    updatedWorkout.exercises = exercises;
    setActiveWorkout(updatedWorkout);
  };

  // Drag and drop handlers
  const handleDragStart = (e, exerciseIndex) => {
    setDraggedExercise(exerciseIndex);
    e.dataTransfer.effectAllowed = 'move';
    e.target.style.opacity = '0.5';
  };

  const handleDragEnd = (e) => {
    e.target.style.opacity = '1';
    setDraggedExercise(null);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e, dropIndex) => {
    e.preventDefault();

    if (draggedExercise === null || draggedExercise === dropIndex) {
      return;
    }

    const updatedWorkout = { ...activeWorkout };
    const exercises = [...updatedWorkout.exercises];
    const [draggedItem] = exercises.splice(draggedExercise, 1);
    exercises.splice(dropIndex, 0, draggedItem);
    updatedWorkout.exercises = exercises;
    setActiveWorkout(updatedWorkout);
    setDraggedExercise(null);
  };

  // Bulk operations
  const toggleSetSelection = (exerciseIndex, setIndex) => {
    const key = `${exerciseIndex}-${setIndex}`;
    setSelectedSets(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const clearSelectedSets = () => {
    setSelectedSets({});
  };

  const getSelectedSetsCount = () => {
    return Object.values(selectedSets).filter(Boolean).length;
  };

  const bulkDeleteSets = () => {
    const updatedWorkout = { ...activeWorkout };
    const selectedKeys = Object.keys(selectedSets).filter(key => selectedSets[key]);
    const sortedKeys = selectedKeys
      .map(key => {
        const [exerciseIndex, setIndex] = key.split('-').map(Number);
        return { exerciseIndex, setIndex, key };
      })
      .sort((a, b) => {
        if (a.exerciseIndex !== b.exerciseIndex) {
          return b.exerciseIndex - a.exerciseIndex;
        }
        return b.setIndex - a.setIndex;
      });

    sortedKeys.forEach(({ exerciseIndex, setIndex }) => {
      if (updatedWorkout.exercises[exerciseIndex]?.sets[setIndex]) {
        updatedWorkout.exercises[exerciseIndex].sets.splice(setIndex, 1);
      }
    });

    setActiveWorkout(updatedWorkout);
    clearSelectedSets();
  };

  const bulkDuplicateSets = () => {
    const updatedWorkout = { ...activeWorkout };

    Object.keys(selectedSets).forEach(key => {
      if (selectedSets[key]) {
        const [exerciseIndex, setIndex] = key.split('-').map(Number);
        const originalSet = updatedWorkout.exercises[exerciseIndex]?.sets[setIndex];
        if (originalSet) {
          const duplicateSet = { ...originalSet, completed: false };
          updatedWorkout.exercises[exerciseIndex].sets.push(duplicateSet);
        }
      }
    });

    setActiveWorkout(updatedWorkout);
    clearSelectedSets();
  };

  const bulkCompleteSets = () => {
    const updatedWorkout = { ...activeWorkout };

    Object.keys(selectedSets).forEach(key => {
      if (selectedSets[key]) {
        const [exerciseIndex, setIndex] = key.split('-').map(Number);
        if (updatedWorkout.exercises[exerciseIndex]?.sets[setIndex]) {
          updatedWorkout.exercises[exerciseIndex].sets[setIndex].completed = true;
        }
      }
    });

    setActiveWorkout(updatedWorkout);
    clearSelectedSets();
  };

  // Rest timer functions
  const startRestTimer = (customDuration) => {
    const duration = customDuration || restSettings.duration;
    setRestTimer({
      isActive: true,
      timeLeft: duration,
      duration: duration
    });
  };

  const stopRestTimer = () => {
    setRestTimer(prev => ({ ...prev, isActive: false, timeLeft: 0 }));
  };

  // Workout completion
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

    try {
      const result = await saveWorkoutWithBackup(
        sessionToSave,
        (data) => addDoc(collection(db, 'workoutSessions'), data)
      );

      if (result.success) {
        setSnackbarMessage('Workout Saved! 💪');
      } else {
        setSnackbarMessage('Saved offline - will sync when online! 📱');
      }
      setSnackbarOpen(true);

      clearDraftWorkout();
      setActiveWorkout({
        programId: '',
        programName: '',
        exercises: [],
        startTime: null,
        endTime: null
      });
      setSelectedProgramId('');
      setTimer({ time: 0, isRunning: false, startTime: null });
    } catch (error) {
      console.error('Error saving workout:', error);
      setSnackbarMessage('Error saving workout');
      setSnackbarOpen(true);
    }
  };

  // Debounce search
  const debouncedSetSearch = useDebounce((value) => {
    setDebouncedSearch(value);
  }, 300);

  useEffect(() => {
    debouncedSetSearch(exerciseSearch);
  }, [exerciseSearch, debouncedSetSearch]);

  const filteredExercises = useMemo(() =>
    availableExercises.filter(exercise =>
      exercise.toLowerCase().includes(debouncedSearch.toLowerCase())
    ).slice(0, 12),
    [availableExercises, debouncedSearch]
  );

  // Timer handlers
  const handleTimeUpdate = (newTime) => {
    setTimer(prev => ({ ...prev, time: newTime }));
  };

  const handleRestSettings = () => {
    const newDuration = prompt('Rest duration (seconds):', restSettings.duration);
    if (newDuration && !isNaN(newDuration)) {
      setRestSettings(prev => ({ ...prev, duration: parseInt(newDuration) }));
    }
  };

  const handleLoadWorkout = (workoutData) => {
    setActiveWorkout(workoutData);
    setSelectedProgramId('');
  };

  return (
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
      {/* Timer Display */}
      {timer.isRunning && (
        <WorkoutTimer isRunning={timer.isRunning} onTimeUpdate={handleTimeUpdate} />
      )}

      {/* Header */}
      <WorkoutHeader
        quickStats={quickStats}
        setQuickStats={setQuickStats}
        weeklyGoal={weeklyGoal}
        setWeeklyGoal={setWeeklyGoal}
      />

      <Container maxWidth="lg">
        {/* Error State */}
        {error && (
          <ErrorBoundary
            fallbackMessage="Failed to load workout data. Please check your connection and try again."
            onRetry={() => {
              setError(null);
              fetchPrograms();
            }}
          >
            <div></div>
          </ErrorBoundary>
        )}

        {/* Program Selection */}
        <ProgramSelector
          programs={programs}
          selectedProgramId={selectedProgramId}
          loading={loading}
          onProgramSelect={handleProgramSelect}
          onAddExercise={() => setModalOpen(true)}
          onManagePrograms={() => window.location.href = '/programs'}
          onRestSettings={handleRestSettings}
          restSettings={restSettings}
          autoAdvanceEnabled={autoAdvanceEnabled}
          onToggleAutoAdvance={() => setAutoAdvanceEnabled(!autoAdvanceEnabled)}
          bulkModeEnabled={bulkModeEnabled}
          onToggleBulkMode={() => {
            setBulkModeEnabled(!bulkModeEnabled);
            if (bulkModeEnabled) clearSelectedSets();
          }}
        />

        {/* Draft Workout Notification */}
        <DraftNotification
          hasDraftLoaded={hasDraftLoaded}
          activeWorkout={activeWorkout}
          onClearDraft={clearDraftManually}
        />

        {/* Recent Workouts */}
        <WorkoutHistory
          recentWorkouts={recentWorkouts}
          onLoadWorkout={handleLoadWorkout}
          getSmartDefaults={getSmartDefaults}
        />

        {/* Rest Timer */}
        <RestTimer
          restTimer={restTimer}
          onStopRestTimer={stopRestTimer}
          onStartRestTimer={startRestTimer}
        />

        {/* Bulk Actions Bar */}
        <BulkActionsBar
          selectedSetsCount={getSelectedSetsCount()}
          onClearSelectedSets={clearSelectedSets}
          onBulkCompleteSets={bulkCompleteSets}
          onBulkDuplicateSets={bulkDuplicateSets}
          onBulkDeleteSets={bulkDeleteSets}
        />

        {/* Active Exercises */}
        {activeWorkout.exercises.length > 0 && (
          <Box sx={{ mb: 3 }}>
            {activeWorkout.exercises.map((exercise, index) => (
              <ExerciseCard
                key={index}
                exercise={exercise}
                exerciseIndex={index}
                exerciseHistory={exerciseHistory}
                bulkModeEnabled={bulkModeEnabled}
                selectedSets={selectedSets}
                onToggleSetSelection={toggleSetSelection}
                onUpdateSet={updateSet}
                onCompleteSet={completeSet}
                onAddSet={addSet}
                onRemoveExercise={removeExercise}
                onMoveExerciseUp={moveExerciseUp}
                onMoveExerciseDown={moveExerciseDown}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                draggedExercise={draggedExercise}
              />
            ))}
          </Box>
        )}

        {/* Workout Actions */}
        <WorkoutActions
          activeWorkout={activeWorkout}
          onFinishWorkout={finishWorkout}
        />
      </Container>

      {/* Add Exercise Modal */}
      <ExerciseModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setExerciseSearch(''); }}
        exerciseSearch={exerciseSearch}
        onExerciseSearchChange={(e) => setExerciseSearch(e.target.value)}
        onAddCustomExerciseFromSearch={addCustomExerciseFromSearch}
        availableExercises={availableExercises}
        recentExercises={recentExercises}
        filteredExercises={filteredExercises}
        onAddCustomExercise={addCustomExercise}
      />

      {/* Snackbar */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setSnackbarOpen(false)} severity="success" sx={{ width: '100%' }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
}
