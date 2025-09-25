'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Container,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Button,
  TextField,
  Box,
  Grid,
  Snackbar,
  Alert,
  Paper,
  Card,
  CardContent,
  IconButton,
  Chip,
  Modal,
  Checkbox
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  KeyboardArrowUp as ArrowUpIcon,
  KeyboardArrowDown as ArrowDownIcon,
  DragIndicator as DragIcon,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { collection, getDocs, addDoc, query, orderBy, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { saveWorkoutWithBackup } from '@/lib/offlineStorage';
import { useDebounce } from '@/lib/performance';
import ErrorBoundary from '@/components/ErrorBoundary';

const modalStyle = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 500,
  maxHeight: '80vh',
  overflow: 'auto',
  bgcolor: '#1a1a1a',
  border: '2px solid #ff4444',
  borderRadius: 2,
  boxShadow: '0 0 50px rgba(255, 68, 68, 0.3)',
  p: 4,
};

export default function WorkoutPage() {
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
    duration: 90 // Default 90 seconds
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

  // Screen wake lock for mobile during workouts
  const [wakeLock, setWakeLock] = useState(null);

  // Auto-advance settings
  const [autoAdvanceEnabled, setAutoAdvanceEnabled] = useState(true);

  // Drag and drop state
  const [draggedExercise, setDraggedExercise] = useState(null);

  // Bulk set operations
  const [selectedSets, setSelectedSets] = useState({});
  const [bulkModeEnabled, setBulkModeEnabled] = useState(false);

  // Draft workout state
  const [hasDraftLoaded, setHasDraftLoaded] = useState(false);

  // Quick stats for header
  const [quickStats, setQuickStats] = useState({
    totalWorkouts: 0,
    currentStreak: 0,
    weeklyProgress: '0/3'
  });

  // Weekly goal settings
  const [weeklyGoal, setWeeklyGoal] = useState(3);
  const [weeklyGoalModalOpen, setWeeklyGoalModalOpen] = useState(false);

  // Recent workouts for quick selection
  const [recentWorkouts, setRecentWorkouts] = useState([]);

  // Auto-save functionality
  const DRAFT_STORAGE_KEY = 'workoutDraft';

  // Load draft workout from localStorage
  const loadDraftWorkout = () => {
    try {
      const saved = localStorage.getItem(DRAFT_STORAGE_KEY);
      if (saved) {
        const draft = JSON.parse(saved);
        setActiveWorkout(draft);
        setHasDraftLoaded(true);
        return true;
      }
    } catch (error) {
      console.error('Error loading draft workout:', error);
    }
    return false;
  };

  // Save current workout as draft
  const saveDraftWorkout = () => {
    if (activeWorkout.exercises.length > 0) {
      try {
        localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(activeWorkout));
      } catch (error) {
        console.error('Error saving draft workout:', error);
      }
    }
  };

  // Clear draft from storage
  const clearDraftWorkout = () => {
    try {
      localStorage.removeItem(DRAFT_STORAGE_KEY);
      setHasDraftLoaded(false);
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
    }, 2000); // Auto-save after 2 seconds of inactivity

    return () => clearTimeout(autoSaveTimer);
  }, [activeWorkout, saveDraftWorkout]);

  useEffect(() => {
    fetchPrograms();
    fetchExercises();
    fetchWeeklyGoal();
    fetchRecentWorkouts();

    // Load draft workout if it exists
    if (typeof window !== 'undefined') {
      loadDraftWorkout();
    }
  }, []);

  useEffect(() => {
    if (weeklyGoal > 0) {
      fetchQuickStats();
    }
  }, [weeklyGoal, fetchQuickStats]);

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

    // Cleanup on unmount
    return () => {
      releaseWakeLock();
    };
  }, [timer.isRunning, wakeLock]);

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
    let interval = null;
    if (restTimer.isActive && restTimer.timeLeft > 0) {
      interval = setInterval(() => {
        setRestTimer(prev => ({
          ...prev,
          timeLeft: prev.timeLeft - 1
        }));
      }, 1000);
    } else if (restTimer.timeLeft === 0 && restTimer.isActive) {
      // Timer finished
      setRestTimer(prev => ({ ...prev, isActive: false }));
      // Play notification sound or vibration
      if ('vibrate' in navigator) {
        navigator.vibrate([200, 100, 200]);
      }
    }
    return () => clearInterval(interval);
  }, [restTimer.isActive, restTimer.timeLeft]);

  const fetchPrograms = async () => {
    try {
      setLoading(true);
      setError(null);

      // Check if Firebase is available
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

  const fetchWeeklyGoal = async () => {
    try {
      if (!db) return;

      const settingsQuery = query(collection(db, 'settings'));
      const settingsSnapshot = await getDocs(settingsQuery);

      if (!settingsSnapshot.empty) {
        const goalDoc = settingsSnapshot.docs.find(doc => doc.data().type === 'weeklyGoal');
        if (goalDoc) {
          setWeeklyGoal(goalDoc.data().value);
        }
      }
    } catch (error) {
      console.error('Error fetching weekly goal:', error);
    }
  };

  const saveWeeklyGoal = async (newGoal) => {
    try {
      if (!db) return;

      const settingsQuery = query(collection(db, 'settings'));
      const settingsSnapshot = await getDocs(settingsQuery);

      let goalDocId = null;
      if (!settingsSnapshot.empty) {
        const goalDoc = settingsSnapshot.docs.find(doc => doc.data().type === 'weeklyGoal');
        if (goalDoc) {
          goalDocId = goalDoc.id;
        }
      }

      const goalData = {
        type: 'weeklyGoal',
        value: newGoal,
        updatedAt: new Date()
      };

      if (goalDocId) {
        await updateDoc(doc(db, 'settings', goalDocId), goalData);
      } else {
        await addDoc(collection(db, 'settings'), goalData);
      }

      setWeeklyGoal(newGoal);
      fetchQuickStats(); // Refresh stats with new goal
    } catch (error) {
      console.error('Error saving weekly goal:', error);
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

      // Get last 5 workouts
      setRecentWorkouts(workouts.slice(0, 5));
    } catch (error) {
      console.error('Error fetching recent workouts:', error);
    }
  };

  const fetchQuickStats = async () => {
    try {
      if (!db) return;

      const workoutsQuery = query(
        collection(db, 'workoutSessions'),
        orderBy('completedAt', 'desc')
      );
      const workoutsSnapshot = await getDocs(workoutsQuery);
      const workouts = workoutsSnapshot.docs.map(doc => ({
        ...doc.data(),
        completedAt: doc.data().completedAt?.toDate() || new Date()
      }));

      // Calculate stats
      const totalWorkouts = workouts.length;

      // Calculate current streak
      let currentStreak = 0;
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      for (let i = 0; i < workouts.length; i++) {
        const workoutDate = new Date(workouts[i].completedAt);
        workoutDate.setHours(0, 0, 0, 0);

        const daysDiff = Math.floor((today - workoutDate) / (1000 * 60 * 60 * 24));

        if (daysDiff === i) {
          currentStreak++;
        } else {
          break;
        }
      }

      // Calculate weekly progress with current goal
      const weekStart = new Date(today.getFullYear(), today.getMonth(), today.getDate() - today.getDay());
      const weekWorkouts = workouts.filter(w => new Date(w.completedAt) >= weekStart).length;
      const weeklyProgress = `${weekWorkouts}/${weeklyGoal}`;

      setQuickStats({
        totalWorkouts,
        currentStreak,
        weeklyProgress
      });
    } catch (error) {
      console.error('Error fetching quick stats:', error);
    }
  };

  const fetchExercises = async () => {
    // Comprehensive exercise database
    const exerciseDatabase = [
      // Chest
      'Bench Press', 'Incline Bench Press', 'Decline Bench Press', 'Dumbbell Press', 'Incline Dumbbell Press',
      'Chest Flyes', 'Incline Flyes', 'Push-ups', 'Dips', 'Cable Crossovers',
      // Back
      'Deadlift', 'Barbell Row', 'T-Bar Row', 'Seated Row', 'Lat Pulldown',
      'Pull-ups', 'Chin-ups', 'One Arm Row', 'Face Pulls', 'Reverse Flyes',
      // Legs
      'Squat', 'Front Squat', 'Leg Press', 'Romanian Deadlift', 'Bulgarian Split Squat',
      'Lunges', 'Leg Curls', 'Leg Extensions', 'Calf Raises', 'Hip Thrusts',
      // Shoulders
      'Overhead Press', 'Dumbbell Press', 'Lateral Raises', 'Front Raises', 'Rear Delt Flyes',
      'Arnold Press', 'Pike Push-ups', 'Handstand Push-ups', 'Upright Rows', 'Shrugs',
      // Arms
      'Bicep Curls', 'Hammer Curls', 'Preacher Curls', 'Cable Curls', 'Concentration Curls',
      'Tricep Extensions', 'Close Grip Bench', 'Tricep Dips', 'Overhead Tricep Extension', 'Diamond Push-ups',
      // Core
      'Plank', 'Side Plank', 'Crunches', 'Russian Twists', 'Mountain Climbers',
      'Dead Bug', 'Bird Dog', 'Hanging Leg Raises', 'Ab Wheel', 'Cable Crunches'
    ];
    setAvailableExercises(exerciseDatabase);

    // Fetch recent exercises from workout history
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

      // Build exercise history for smart defaults
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

      // Sort by date and keep recent data
      Object.keys(history).forEach(exerciseName => {
        history[exerciseName] = history[exerciseName]
          .sort((a, b) => b.date - a.date)
          .slice(0, 15); // Keep last 15 sets for calculation
      });

      setExerciseHistory(history);
    } catch (error) {
      console.error('Error fetching recent exercises:', error);
    }
  };


  const stopTimer = () => {
    setTimer({ time: 0, isRunning: false, startTime: null });
  };

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

  const addSet = (exerciseIndex) => {
    const updatedWorkout = { ...activeWorkout };
    const exercise = updatedWorkout.exercises[exerciseIndex];

    // Get smart defaults for the new set
    let newSet = { weight: '', reps: '', completed: false, rpe: '' };

    // If there are existing sets, use the last completed set as reference
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
      // Use exercise history for smart defaults
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

    // Haptic feedback on completion
    if (!wasCompleted && 'vibrate' in navigator) {
      navigator.vibrate([50, 50, 50]);
    }

    // Auto-advance: Add next set if this was the last incomplete set
    if (!wasCompleted && autoAdvanceEnabled) {
      const currentExercise = updatedWorkout.exercises[exerciseIndex];
      const incompleteSets = currentExercise.sets.filter(set => !set.completed);
      if (incompleteSets.length === 0) {
        // All sets completed, add a new set
        setTimeout(() => addSet(exerciseIndex), 100);
      }
    }

    // Start rest timer if set was just completed and auto-start is enabled
    if (!wasCompleted && restSettings.enabled && restSettings.autoStart) {
      startRestTimer();
    }
  };

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

  const formatRestTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getSmartDefaults = (exerciseName) => {
    const history = exerciseHistory[exerciseName];
    if (!history || history.length === 0) {
      return { weight: '', reps: '', targetSets: 3, targetReps: 10 };
    }

    // Calculate smart defaults based on recent performance
    const recentSets = history.slice(0, 6); // Last 6 sets
    const avgWeight = recentSets.reduce((sum, set) => sum + set.weight, 0) / recentSets.length;
    const avgReps = recentSets.reduce((sum, set) => sum + set.reps, 0) / recentSets.length;

    // Suggest slight progression
    const suggestedWeight = Math.round((avgWeight + 1.25) * 4) / 4; // Round to nearest 1.25kg
    const suggestedReps = Math.round(avgReps);

    return {
      weight: suggestedWeight.toString(),
      reps: suggestedReps.toString(),
      targetSets: 3,
      targetReps: suggestedReps
    };
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

  // Debounce search for better performance
  const debouncedSetSearch = useDebounce((value) => {
    setDebouncedSearch(value);
  }, 300);

  useEffect(() => {
    debouncedSetSearch(exerciseSearch);
  }, [exerciseSearch, debouncedSetSearch]);

  const filteredExercises = useMemo(() =>
    availableExercises.filter(exercise =>
      exercise.toLowerCase().includes(debouncedSearch.toLowerCase())
    ).slice(0, 12), // Show top 12 matches
    [availableExercises, debouncedSearch]
  );

  const removeExercise = (exerciseIndex) => {
    const updatedWorkout = { ...activeWorkout };
    updatedWorkout.exercises.splice(exerciseIndex, 1);
    setActiveWorkout(updatedWorkout);
  };

  const moveExerciseUp = (exerciseIndex) => {
    if (exerciseIndex === 0) return; // Can't move first exercise up

    const updatedWorkout = { ...activeWorkout };
    const exercises = [...updatedWorkout.exercises];

    // Swap with previous exercise
    [exercises[exerciseIndex - 1], exercises[exerciseIndex]] = [exercises[exerciseIndex], exercises[exerciseIndex - 1]];

    updatedWorkout.exercises = exercises;
    setActiveWorkout(updatedWorkout);
  };

  const moveExerciseDown = (exerciseIndex) => {
    if (exerciseIndex === activeWorkout.exercises.length - 1) return; // Can't move last exercise down

    const updatedWorkout = { ...activeWorkout };
    const exercises = [...updatedWorkout.exercises];

    // Swap with next exercise
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

    // Remove dragged exercise
    const [draggedItem] = exercises.splice(draggedExercise, 1);

    // Insert at new position
    exercises.splice(dropIndex, 0, draggedItem);

    updatedWorkout.exercises = exercises;
    setActiveWorkout(updatedWorkout);
    setDraggedExercise(null);
  };

  // Bulk set operations
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

    // Sort by exercise and set index in descending order to avoid index shifts
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

    // Remove sets from back to front
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

  const bulkCompletesets = () => {
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

  const updateGoalsBasedOnPerformance = async (workout) => {
    try {
      // Get current goals
      const goalsSnapshot = await getDocs(collection(db, 'goals'));
      const goals = goalsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // Check for goal updates based on workout performance
      for (const exercise of workout.exercises) {
        for (const set of exercise.sets) {
          if (set.completed && set.weight && set.reps) {
            const weight = parseFloat(set.weight);
            const reps = parseInt(set.reps);

            // Find matching strength goals for this exercise
            const strengthGoals = goals.filter(goal =>
              goal.category === 'Strength' &&
              goal.name.toLowerCase().includes(exercise.name.toLowerCase()) &&
              goal.unit === 'kg'
            );

            for (const goal of strengthGoals) {
              if (weight > goal.current) {
                // Update goal progress
                await updateDoc(doc(db, 'goals', goal.id), {
                  current: weight,
                  updatedAt: new Date()
                });

                // Show achievement notification if goal completed
                if (weight >= goal.target && goal.current < goal.target) {
                  setSnackbarMessage(`🎉 Goal Achieved: ${goal.name}! New PR: ${weight}kg`);
                  setSnackbarOpen(true);

                  // Vibrate if available
                  if ('vibrate' in navigator) {
                    navigator.vibrate([200, 100, 200, 100, 200]);
                  }
                } else if (weight > goal.current) {
                  setSnackbarMessage(`📈 Goal Updated: ${goal.name} - New PR: ${weight}kg!`);
                  setSnackbarOpen(true);
                }
              }
            }

            // Check for rep-based goals
            const repGoals = goals.filter(goal =>
              goal.category === 'Strength' &&
              goal.name.toLowerCase().includes(exercise.name.toLowerCase()) &&
              goal.unit === 'reps'
            );

            for (const goal of repGoals) {
              if (reps > goal.current) {
                await updateDoc(doc(db, 'goals', goal.id), {
                  current: reps,
                  updatedAt: new Date()
                });

                if (reps >= goal.target && goal.current < goal.target) {
                  setSnackbarMessage(`🎯 Goal Achieved: ${goal.name}! New record: ${reps} reps`);
                  setSnackbarOpen(true);
                }
              }
            }
          }
        }
      }

      // Update general fitness goals (workout streak, frequency)
      const fitnessGoals = goals.filter(goal => goal.category === 'General Fitness');

      for (const goal of fitnessGoals) {
        if (goal.unit === 'workouts/week') {
          // Calculate current week's workouts
          const today = new Date();
          const weekStart = new Date(today.setDate(today.getDate() - today.getDay()));
          weekStart.setHours(0, 0, 0, 0);

          const weekWorkouts = await getDocs(query(
            collection(db, 'workoutSessions'),
            orderBy('completedAt', 'desc')
          ));

          const thisWeekCount = weekWorkouts.docs.filter(doc => {
            const workoutDate = doc.data().completedAt?.toDate();
            return workoutDate >= weekStart;
          }).length;

          if (thisWeekCount > goal.current) {
            await updateDoc(doc(db, 'goals', goal.id), {
              current: thisWeekCount,
              updatedAt: new Date()
            });

            if (thisWeekCount >= goal.target && goal.current < goal.target) {
              setSnackbarMessage(`🔥 Weekly Goal Achieved: ${thisWeekCount} workouts this week!`);
              setSnackbarOpen(true);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error updating goals:', error);
    }
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

    try {
      const result = await saveWorkoutWithBackup(
        sessionToSave,
        (data) => addDoc(collection(db, 'workoutSessions'), data)
      );

      if (result.success) {
        setSnackbarMessage('Workout Saved! 💪');

        // Update goals based on workout performance
        await updateGoalsBasedOnPerformance(sessionToSave);
      } else {
        setSnackbarMessage('Saved offline - will sync when online! 📱');
      }
      setSnackbarOpen(true);

      // Clear draft workout and reset state
      clearDraftWorkout();
      setActiveWorkout({
        programId: '',
        programName: '',
        exercises: [],
        startTime: null,
        endTime: null
      });
      setSelectedProgramId('');
      stopTimer();
    } catch (error) {
      console.error('Error saving workout:', error);
      setSnackbarMessage('Error saving workout');
      setSnackbarOpen(true);
    }
  };

  const ExerciseCard = ({ exercise, exerciseIndex }) => (
    <motion.div
      whileHover={{ x: 5 }}
      transition={{ duration: 0.2 }}
    >
      <Card
        draggable
        onDragStart={(e) => handleDragStart(e, exerciseIndex)}
        onDragEnd={handleDragEnd}
        onDragOver={handleDragOver}
        onDrop={(e) => handleDrop(e, exerciseIndex)}
        sx={{
          background: 'linear-gradient(135deg, rgba(26, 26, 26, 0.9), rgba(255, 68, 68, 0.05))',
          border: draggedExercise === exerciseIndex ? '2px dashed #ff4444' : '1px solid #333',
          mb: 2,
          cursor: 'move',
          transition: 'all 0.2s ease',
          '&:hover': {
            borderColor: 'primary.main',
            boxShadow: '0 0 20px rgba(255, 68, 68, 0.2)'
          }
        }}
      >
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: '1 1 auto', minWidth: 0 }}>
              <DragIcon sx={{ color: 'text.secondary', fontSize: '1.2rem', cursor: 'grab' }} />
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 700,
                  fontSize: { xs: '1rem', sm: '1.25rem' },
                  lineHeight: 1.2,
                  flex: '1 1 auto',
                  minWidth: 0
                }}
              >
                {exercise.name}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', flex: 1 }}>
                <Chip
                  label={`Target: ${exercise.targetSets}×${exercise.targetReps}`}
                  size="small"
                  color="primary"
                  variant="outlined"
                />
                {exerciseHistory[exercise.name] && exerciseHistory[exercise.name].length > 0 && (
                  <Chip
                    label={`Last: ${exerciseHistory[exercise.name][0].weight}kg × ${exerciseHistory[exercise.name][0].reps}`}
                    size="small"
                    color="secondary"
                    variant="outlined"
                    sx={{ fontSize: '0.7rem' }}
                  />
                )}
              </Box>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                <IconButton
                  onClick={() => moveExerciseUp(exerciseIndex)}
                  disabled={exerciseIndex === 0}
                  size="small"
                  sx={{
                    color: exerciseIndex === 0 ? 'text.disabled' : 'primary.main',
                    minWidth: '32px',
                    height: '32px'
                  }}
                >
                  <ArrowUpIcon fontSize="small" />
                </IconButton>
                <IconButton
                  onClick={() => moveExerciseDown(exerciseIndex)}
                  disabled={exerciseIndex === activeWorkout.exercises.length - 1}
                  size="small"
                  sx={{
                    color: exerciseIndex === activeWorkout.exercises.length - 1 ? 'text.disabled' : 'primary.main',
                    minWidth: '32px',
                    height: '32px'
                  }}
                >
                  <ArrowDownIcon fontSize="small" />
                </IconButton>
              </Box>
              <IconButton
                onClick={() => removeExercise(exerciseIndex)}
                color="error"
                size="small"
                sx={{ minWidth: '32px', height: '32px' }}
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Box>
          </Box>

          {exercise.sets.length > 0 && (
            <Box sx={{ mb: 2 }}>
              <Grid container spacing={1} sx={{ mb: 1 }}>
                {bulkModeEnabled && (
                  <Grid item xs={0.8}>
                    <Typography variant="caption" sx={{ fontWeight: 600, fontSize: '0.6rem' }}>✓</Typography>
                  </Grid>
                )}
                <Grid item xs={bulkModeEnabled ? 0.8 : 1}>
                  <Typography variant="caption" sx={{ fontWeight: 600, fontSize: '0.65rem' }}>SET</Typography>
                </Grid>
                <Grid item xs={bulkModeEnabled ? 3.2 : 3.5}>
                  <Typography variant="caption" sx={{ fontWeight: 600, fontSize: '0.65rem' }}>WEIGHT (KG)</Typography>
                </Grid>
                <Grid item xs={2.5}>
                  <Typography variant="caption" sx={{ fontWeight: 600, fontSize: '0.65rem' }}>REPS</Typography>
                </Grid>
                <Grid item xs={2}>
                  <Typography variant="caption" sx={{ fontWeight: 600, fontSize: '0.65rem' }}>RPE</Typography>
                </Grid>
                <Grid item xs={bulkModeEnabled ? 2.7 : 3}>
                  <Typography variant="caption" sx={{ fontWeight: 600, fontSize: '0.65rem' }}>DONE</Typography>
                </Grid>
              </Grid>

              {exercise.sets.map((set, setIndex) => (
                <Box key={setIndex} sx={{ mb: 3, p: 2, border: '1px solid #333', borderRadius: 2, bgcolor: 'rgba(26, 26, 26, 0.5)' }}>
                  <Grid container spacing={1} alignItems="stretch">
                    {/* Checkbox for bulk operations */}
                    {bulkModeEnabled && (
                      <Grid item xs={0.8}>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '56px' }}>
                          <Checkbox
                            checked={selectedSets[`${exerciseIndex}-${setIndex}`] || false}
                            onChange={() => toggleSetSelection(exerciseIndex, setIndex)}
                            sx={{
                              color: '#ffaa00',
                              '&.Mui-checked': {
                                color: '#ffaa00'
                              },
                              '&:hover': {
                                backgroundColor: 'rgba(255, 170, 0, 0.1)'
                              }
                            }}
                          />
                        </Box>
                      </Grid>
                    )}
                    {/* Set Number */}
                    <Grid item xs={bulkModeEnabled ? 0.8 : 1}>
                      <Box sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        height: '56px',
                        bgcolor: set.completed ? 'rgba(0, 255, 136, 0.2)' : 'rgba(255, 68, 68, 0.1)',
                        borderRadius: 1,
                        border: `2px solid ${set.completed ? '#00ff88' : '#ff4444'}`
                      }}>
                        <Typography variant="h6" sx={{ fontWeight: 900, color: set.completed ? '#00ff88' : '#ff4444' }}>
                          {setIndex + 1}
                        </Typography>
                      </Box>
                    </Grid>

                    {/* Weight */}
                    <Grid item xs={bulkModeEnabled ? 3.2 : 3.5}>
                      <Box sx={{ position: 'relative' }}>
                        <TextField
                          type="number"
                          value={set.weight}
                          onChange={(e) => updateSet(exerciseIndex, setIndex, 'weight', e.target.value)}
                          placeholder="kg"
                          fullWidth
                          inputProps={{
                            inputMode: 'decimal',
                            pattern: '[0-9]*',
                            style: {
                              fontSize: '1.2rem',
                              textAlign: 'center',
                              fontWeight: 700,
                              padding: '8px'
                            }
                          }}
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              backgroundColor: '#0a0a0a',
                              height: '56px',
                              fontSize: '1.2rem',
                              '&:hover .MuiOutlinedInput-notchedOutline': {
                                borderColor: 'primary.main'
                              },
                              '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                borderColor: 'primary.main',
                                borderWidth: '2px'
                              }
                            }
                          }}
                        />
                        {exerciseHistory[exercise.name] && exerciseHistory[exercise.name][0] && !set.weight && (
                          <Typography
                            variant="caption"
                            sx={{
                              position: 'absolute',
                              top: '50%',
                              left: '50%',
                              transform: 'translate(-50%, -50%)',
                              color: '#666',
                              fontWeight: 600,
                              fontSize: '1rem',
                              pointerEvents: 'none',
                              opacity: 0.7
                            }}
                          >
                            {exerciseHistory[exercise.name][0].weight}kg
                          </Typography>
                        )}
                      </Box>
                    </Grid>

                    {/* Reps */}
                    <Grid item xs={2.5}>
                      <Box sx={{ position: 'relative' }}>
                        <TextField
                          type="number"
                          value={set.reps}
                          onChange={(e) => updateSet(exerciseIndex, setIndex, 'reps', e.target.value)}
                          placeholder="reps"
                          fullWidth
                          inputProps={{
                            inputMode: 'numeric',
                            pattern: '[0-9]*',
                            style: {
                              fontSize: '1.2rem',
                              textAlign: 'center',
                              fontWeight: 700,
                              padding: '8px'
                            }
                          }}
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              backgroundColor: '#0a0a0a',
                              height: '56px',
                              fontSize: '1.2rem',
                              '&:hover .MuiOutlinedInput-notchedOutline': {
                                borderColor: 'primary.main'
                              },
                              '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                borderColor: 'primary.main',
                                borderWidth: '2px'
                              }
                            }
                          }}
                        />
                        {exerciseHistory[exercise.name] && exerciseHistory[exercise.name][0] && !set.reps && (
                          <Typography
                            variant="caption"
                            sx={{
                              position: 'absolute',
                              top: '50%',
                              left: '50%',
                              transform: 'translate(-50%, -50%)',
                              color: '#666',
                              fontWeight: 600,
                              fontSize: '1rem',
                              pointerEvents: 'none',
                              opacity: 0.7
                            }}
                          >
                            {exerciseHistory[exercise.name][0].reps}
                          </Typography>
                        )}
                      </Box>
                    </Grid>

                    {/* RPE */}
                    <Grid item xs={2}>
                      <TextField
                        select
                        value={set.rpe || ''}
                        onChange={(e) => updateSet(exerciseIndex, setIndex, 'rpe', e.target.value)}
                        placeholder="RPE"
                        fullWidth
                        SelectProps={{
                          displayEmpty: true,
                          renderValue: (value) => value || 'RPE'
                        }}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            backgroundColor: '#0a0a0a',
                            height: '56px',
                            fontSize: '1rem',
                            '&:hover .MuiOutlinedInput-notchedOutline': {
                              borderColor: 'primary.main'
                            }
                          }
                        }}
                      >
                        <MenuItem value="">-</MenuItem>
                        {[6, 6.5, 7, 7.5, 8, 8.5, 9, 9.5, 10].map(rpe => (
                          <MenuItem key={rpe} value={rpe.toString()}>{rpe}</MenuItem>
                        ))}
                      </TextField>
                    </Grid>

                    {/* Complete Button */}
                    <Grid item xs={bulkModeEnabled ? 2.7 : 3}>
                      <Button
                        variant={set.completed ? "contained" : "outlined"}
                        onClick={() => completeSet(exerciseIndex, setIndex)}
                        fullWidth
                        sx={{
                          height: '56px',
                          minWidth: 'unset',
                          fontWeight: 900,
                          fontSize: { xs: '0.9rem', sm: '1rem' },
                          background: set.completed ? 'linear-gradient(135deg, #00ff88, #00cc66)' : 'transparent',
                          color: set.completed ? '#000' : 'primary.main',
                          border: set.completed ? 'none' : '2px solid',
                          borderColor: 'primary.main',
                          borderRadius: 2,
                          textTransform: 'uppercase',
                          letterSpacing: 1,
                          '&:hover': {
                            background: set.completed
                              ? 'linear-gradient(135deg, #00ff88, #00cc66)'
                              : 'rgba(255, 68, 68, 0.1)',
                            borderColor: 'primary.main',
                            transform: 'scale(1.02)',
                            boxShadow: '0 4px 20px rgba(255, 68, 68, 0.3)'
                          },
                          '&:active': {
                            transform: 'scale(0.98)'
                          },
                          transition: 'all 0.15s ease'
                        }}
                      >
                        {set.completed ? '✅ DONE' : '⭕ SET'}
                      </Button>
                    </Grid>
                  </Grid>
                </Box>
              ))}
            </Box>
          )}

          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={() => addSet(exerciseIndex)}
            fullWidth
            sx={{
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: 1,
              height: { xs: '48px', sm: '40px' },
              fontSize: { xs: '0.9rem', sm: '0.875rem' },
              mt: 1,
              '&:hover': {
                background: 'rgba(255, 68, 68, 0.1)',
                borderColor: 'primary.main',
                transform: 'translateY(-1px)'
              },
              transition: 'all 0.2s ease'
            }}
          >
            Add Set
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );

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
      {/* Header */}
      <Paper
        sx={{
          background: 'linear-gradient(135deg, #1a1a1a, rgba(255, 68, 68, 0.1))',
          border: '1px solid #333',
          p: 3,
          mb: 3,
          backdropFilter: 'blur(10px)'
        }}
      >
        <Typography
          variant="h5"
          sx={{
            fontWeight: 800,
            background: 'linear-gradient(135deg, #ff4444, #ffaa00)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            textTransform: 'uppercase',
            letterSpacing: 1,
            textAlign: 'center',
            mb: 2,
            fontSize: { xs: '1.4rem', sm: '1.5rem' },
            lineHeight: 1.2
          }}
        >
          SHTII PLANNER
        </Typography>

        {/* Quick Stats Row */}
        <Grid container spacing={1} justifyContent="center" sx={{ maxWidth: 500, mx: 'auto' }}>
          <Grid item xs={4}>
            <Box sx={{
              textAlign: 'center',
              p: { xs: 1, sm: 1.5 },
              bgcolor: 'rgba(255, 68, 68, 0.1)',
              borderRadius: 1,
              border: '1px solid #333',
              minHeight: { xs: '50px', sm: '55px' },
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center'
            }}>
              <Typography variant="h6" sx={{ fontWeight: 900, color: '#ff4444', fontSize: { xs: '1rem', sm: '1.2rem' }, lineHeight: 1 }}>
                {quickStats.totalWorkouts}
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, fontSize: { xs: '0.65rem', sm: '0.7rem' }, mt: 0.5 }}>
                WORKOUTS
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={4}>
            <Box sx={{
              textAlign: 'center',
              p: { xs: 1, sm: 1.5 },
              bgcolor: 'rgba(255, 170, 0, 0.1)',
              borderRadius: 1,
              border: '1px solid #333',
              minHeight: { xs: '50px', sm: '55px' },
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center'
            }}>
              <Typography variant="h6" sx={{ fontWeight: 900, color: '#ffaa00', fontSize: { xs: '1rem', sm: '1.2rem' }, lineHeight: 1 }}>
                {quickStats.currentStreak}
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, fontSize: { xs: '0.65rem', sm: '0.7rem' }, mt: 0.5 }}>
                STREAK
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={4}>
            <Box
              onClick={() => setWeeklyGoalModalOpen(true)}
              sx={{
                textAlign: 'center',
                p: { xs: 1, sm: 1.5 },
                bgcolor: 'rgba(0, 255, 136, 0.1)',
                borderRadius: 1,
                border: '1px solid #333',
                minHeight: { xs: '50px', sm: '55px' },
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                '&:hover': {
                  bgcolor: 'rgba(0, 255, 136, 0.2)',
                  transform: 'scale(1.05)',
                  boxShadow: '0 4px 15px rgba(0, 255, 136, 0.3)'
                }
              }}
            >
              <Typography variant="h6" sx={{ fontWeight: 900, color: '#00ff88', fontSize: { xs: '1rem', sm: '1.2rem' }, lineHeight: 1 }}>
                {quickStats.weeklyProgress}
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, fontSize: { xs: '0.65rem', sm: '0.7rem' }, mt: 0.5 }}>
                WEEKLY
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Paper>

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
        <Paper
          sx={{
            background: '#1a1a1a',
            border: '1px solid #333',
            p: 3,
            mb: 3
          }}
        >
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel
              sx={{
                color: 'text.secondary',
                textTransform: 'uppercase',
                fontWeight: 600,
                letterSpacing: 1
              }}
            >
              Training Program
            </InputLabel>
            <Select
              value={selectedProgramId}
              label="Training Program"
              onChange={handleProgramSelect}
              disabled={loading}
              sx={{
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#333',
                },
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'primary.main',
                },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'primary.main',
                }
              }}
            >
              <MenuItem value="">Custom Workout</MenuItem>
              {loading ? (
                <MenuItem disabled>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CircularProgress size={20} />
                    <Typography>Loading programs...</Typography>
                  </Box>
                </MenuItem>
              ) : (
                programs.map((program) => (
                  <MenuItem key={program.id} value={program.id}>
                    {program.name}
                  </MenuItem>
                ))
              )}
            </Select>
          </FormControl>

          <Box sx={{ display: 'flex', gap: { xs: 1, sm: 2 }, flexWrap: 'wrap', alignItems: 'center' }}>
            <Button
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={() => setModalOpen(true)}
              sx={{
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: 1,
                flex: { xs: '1 1 50%', sm: '1 1 auto' },
                minWidth: '120px',
                height: { xs: '44px', sm: '40px' },
                fontSize: { xs: '0.8rem', sm: '0.875rem' }
              }}
            >
              Add Exercise
            </Button>

            {/* Manage Programs Button */}
            <Button
              variant="outlined"
              onClick={() => window.location.href = '/programs'}
              sx={{
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: 1,
                flex: { xs: '1 1 50%', sm: '1 1 auto' },
                minWidth: '120px',
                height: { xs: '44px', sm: '40px' },
                fontSize: { xs: '0.8rem', sm: '0.875rem' },
                borderColor: '#ffaa00',
                color: '#ffaa00',
                '&:hover': {
                  borderColor: '#ffaa00',
                  bgcolor: 'rgba(255, 170, 0, 0.1)'
                }
              }}
            >
              Programs
            </Button>

            {/* Rest Settings Button */}
            <Button
              variant="outlined"
              onClick={() => {
                const newDuration = prompt('Rest duration (seconds):', restSettings.duration);
                if (newDuration && !isNaN(newDuration)) {
                  setRestSettings(prev => ({ ...prev, duration: parseInt(newDuration) }));
                }
              }}
              sx={{
                fontWeight: 600,
                fontSize: { xs: '0.75rem', sm: '0.8rem' },
                minWidth: { xs: '90px', sm: '100px' },
                height: { xs: '36px', sm: '40px' }
              }}
            >
              Rest: {restSettings.duration}s
            </Button>

            {/* Auto-advance Toggle */}
            <Button
              variant={autoAdvanceEnabled ? "contained" : "outlined"}
              onClick={() => setAutoAdvanceEnabled(!autoAdvanceEnabled)}
              sx={{
                fontWeight: 600,
                fontSize: { xs: '0.75rem', sm: '0.8rem' },
                minWidth: { xs: '80px', sm: '100px' },
                height: { xs: '36px', sm: '40px' },
                background: autoAdvanceEnabled ? 'linear-gradient(135deg, #00ff88, #00cc66)' : 'transparent',
                color: autoAdvanceEnabled ? '#000' : 'primary.main',
                '&:hover': {
                  background: autoAdvanceEnabled ? 'linear-gradient(135deg, #00ff88, #00cc66)' : 'rgba(255, 68, 68, 0.1)'
                }
              }}
            >
              Auto: {autoAdvanceEnabled ? 'ON' : 'OFF'}
            </Button>

            {/* Bulk Mode Toggle */}
            <Button
              variant={bulkModeEnabled ? "contained" : "outlined"}
              onClick={() => {
                setBulkModeEnabled(!bulkModeEnabled);
                if (bulkModeEnabled) clearSelectedSets();
              }}
              sx={{
                fontWeight: 600,
                fontSize: { xs: '0.75rem', sm: '0.8rem' },
                minWidth: { xs: '80px', sm: '100px' },
                height: { xs: '36px', sm: '40px' },
                background: bulkModeEnabled ? 'linear-gradient(135deg, #ffaa00, #ff8800)' : 'transparent',
                color: bulkModeEnabled ? '#000' : '#ffaa00',
                borderColor: '#ffaa00',
                '&:hover': {
                  background: bulkModeEnabled ? 'linear-gradient(135deg, #ffaa00, #ff8800)' : 'rgba(255, 170, 0, 0.1)',
                  borderColor: '#ffaa00'
                }
              }}
            >
              Bulk: {bulkModeEnabled ? 'ON' : 'OFF'}
            </Button>
          </Box>
        </Paper>

        {/* Draft Workout Notification */}
        {hasDraftLoaded && activeWorkout.exercises.length > 0 && (
          <Paper
            sx={{
              background: 'linear-gradient(135deg, #1a1a1a, rgba(0, 255, 136, 0.1))',
              border: '2px solid #00ff88',
              p: 2,
              mb: 3
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Typography variant="h6" sx={{ color: '#00ff88', fontWeight: 700, mb: 0.5 }}>
                  🔄 Draft Workout Loaded
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  Your previous workout was restored. Auto-saving every 2 seconds.
                </Typography>
              </Box>
              <Button
                variant="outlined"
                onClick={clearDraftManually}
                sx={{
                  color: '#00ff88',
                  borderColor: '#00ff88',
                  '&:hover': {
                    backgroundColor: 'rgba(0, 255, 136, 0.1)',
                    borderColor: '#00ff88'
                  }
                }}
              >
                Clear Draft
              </Button>
            </Box>
          </Paper>
        )}

        {/* Recent Workouts */}
        {recentWorkouts.length > 0 && (
          <Paper
            sx={{
              background: '#1a1a1a',
              border: '1px solid #333',
              p: 3,
              mb: 3
            }}
          >
            <Typography
              variant="h6"
              sx={{
                mb: 2,
                fontWeight: 700,
                textTransform: 'uppercase',
                fontSize: { xs: '1rem', sm: '1.25rem' },
                textAlign: 'center',
                background: 'linear-gradient(135deg, #ff4444, #ffaa00)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}
            >
              Recent Workouts
            </Typography>
            <Grid container spacing={2}>
              {recentWorkouts.map((workout) => (
                <Grid item xs={12} key={workout.id}>
                  <Card
                    onClick={() => {
                      const exercisesWithSets = workout.exercises.map(exercise => {
                        const smartDefaults = getSmartDefaults(exercise.name);
                        return {
                          name: exercise.name,
                          targetSets: exercise.targetSets || 3,
                          targetReps: exercise.targetReps || 10,
                          sets: [{
                            weight: smartDefaults.weight,
                            reps: smartDefaults.reps,
                            completed: false,
                            rpe: ''
                          }]
                        };
                      });

                      setActiveWorkout({
                        programId: workout.programId || '',
                        programName: workout.programName || 'Recent Workout',
                        exercises: exercisesWithSets,
                        startTime: new Date(),
                        endTime: null
                      });
                      setSelectedProgramId('');
                    }}
                    sx={{
                      background: 'linear-gradient(135deg, rgba(26, 26, 26, 0.9), rgba(255, 68, 68, 0.05))',
                      border: '1px solid #333',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        borderColor: 'primary.main',
                        boxShadow: '0 0 20px rgba(255, 68, 68, 0.2)',
                        transform: 'translateY(-2px)'
                      }
                    }}
                  >
                    <CardContent sx={{ py: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Box sx={{ flex: 1 }}>
                          <Typography
                            variant="subtitle1"
                            sx={{
                              fontWeight: 700,
                              color: '#ff4444',
                              fontSize: { xs: '0.9rem', sm: '1rem' },
                              mb: 0.5
                            }}
                          >
                            {workout.programName || 'Custom Workout'}
                          </Typography>
                          <Typography
                            variant="body2"
                            sx={{
                              color: 'text.secondary',
                              fontSize: { xs: '0.75rem', sm: '0.8rem' },
                              mb: 1
                            }}
                          >
                            {workout.completedAt.toLocaleDateString()} • {workout.exercises?.length || 0} exercises
                          </Typography>
                          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                            {workout.exercises?.slice(0, 3).map((exercise, idx) => (
                              <Chip
                                key={idx}
                                label={exercise.name}
                                size="small"
                                sx={{
                                  bgcolor: 'rgba(255, 170, 0, 0.1)',
                                  color: '#ffaa00',
                                  fontSize: '0.65rem',
                                  height: '20px',
                                  '& .MuiChip-label': {
                                    px: 1
                                  }
                                }}
                              />
                            ))}
                            {workout.exercises?.length > 3 && (
                              <Chip
                                label={`+${workout.exercises.length - 3} more`}
                                size="small"
                                sx={{
                                  bgcolor: 'rgba(255, 68, 68, 0.1)',
                                  color: '#ff4444',
                                  fontSize: '0.65rem',
                                  height: '20px',
                                  '& .MuiChip-label': {
                                    px: 1
                                  }
                                }}
                              />
                            )}
                          </Box>
                        </Box>
                        <Box sx={{ ml: 2 }}>
                          <Typography
                            variant="caption"
                            sx={{
                              color: '#00ff88',
                              fontWeight: 700,
                              fontSize: '0.7rem',
                              textTransform: 'uppercase'
                            }}
                          >
                            Click to Load
                          </Typography>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Paper>
        )}

        {/* Rest Timer */}
        {restTimer.isActive && (
          <Paper
            sx={{
              background: 'linear-gradient(135deg, #1a1a1a, rgba(255, 170, 0, 0.1))',
              border: '2px solid #ffaa00',
              p: 3,
              mb: 3,
              textAlign: 'center',
              position: 'sticky',
              top: 16,
              zIndex: 100
            }}
          >
            <Typography variant="h6" sx={{ mb: 1, color: '#ffaa00', fontWeight: 700 }}>
              💤 REST TIME
            </Typography>
            <Typography
              variant="h2"
              sx={{
                fontWeight: 900,
                color: restTimer.timeLeft <= 10 ? '#ff4444' : '#ffaa00',
                mb: 2,
                fontSize: { xs: '2rem', sm: '3rem' },
                animation: restTimer.timeLeft <= 10 ? 'pulse 1s infinite' : 'none'
              }}
            >
              {formatRestTime(restTimer.timeLeft)}
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'center', gap: { xs: 1, sm: 2 }, flexWrap: 'wrap' }}>
              <Button
                variant="contained"
                onClick={stopRestTimer}
                sx={{
                  background: 'linear-gradient(135deg, #ff4444, #cc0000)',
                  fontWeight: 700,
                  fontSize: { xs: '0.8rem', sm: '0.9rem' },
                  px: { xs: 2, sm: 3 }
                }}
              >
                SKIP REST
              </Button>
              <Button
                variant="outlined"
                onClick={() => startRestTimer(60)}
                sx={{
                  borderColor: '#ffaa00',
                  color: '#ffaa00',
                  fontSize: { xs: '0.8rem', sm: '0.9rem' },
                  px: { xs: 1.5, sm: 2 }
                }}
              >
                60s
              </Button>
              <Button
                variant="outlined"
                onClick={() => startRestTimer(90)}
                sx={{
                  borderColor: '#ffaa00',
                  color: '#ffaa00',
                  fontSize: { xs: '0.8rem', sm: '0.9rem' },
                  px: { xs: 1.5, sm: 2 }
                }}
              >
                90s
              </Button>
              <Button
                variant="outlined"
                onClick={() => startRestTimer(120)}
                sx={{
                  borderColor: '#ffaa00',
                  color: '#ffaa00',
                  fontSize: { xs: '0.8rem', sm: '0.9rem' },
                  px: { xs: 1.5, sm: 2 }
                }}
              >
                120s
              </Button>
              <Button
                variant="outlined"
                onClick={() => startRestTimer(restTimer.timeLeft + 30)}
                sx={{
                  borderColor: '#00ff88',
                  color: '#00ff88',
                  fontSize: { xs: '0.8rem', sm: '0.9rem' },
                  px: { xs: 1.5, sm: 2 }
                }}
              >
                +30s
              </Button>
            </Box>
          </Paper>
        )}

        {/* Bulk Actions Bar */}
        {bulkModeEnabled && getSelectedSetsCount() > 0 && (
          <Paper
            sx={{
              background: 'linear-gradient(135deg, #1a1a1a, rgba(255, 170, 0, 0.1))',
              border: '2px solid #ffaa00',
              p: 2,
              mb: 3,
              position: 'sticky',
              top: 16,
              zIndex: 100
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" sx={{ color: '#ffaa00', fontWeight: 700 }}>
                {getSelectedSetsCount()} sets selected
              </Typography>
              <Button
                variant="outlined"
                onClick={clearSelectedSets}
                sx={{ color: '#ffaa00', borderColor: '#ffaa00' }}
              >
                Clear Selection
              </Button>
            </Box>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', justifyContent: 'center' }}>
              <Button
                variant="contained"
                onClick={bulkCompletesets}
                sx={{
                  background: 'linear-gradient(135deg, #00ff88, #00cc66)',
                  color: '#000',
                  fontWeight: 700
                }}
              >
                Complete All
              </Button>
              <Button
                variant="contained"
                onClick={bulkDuplicateSets}
                sx={{
                  background: 'linear-gradient(135deg, #ffaa00, #ff8800)',
                  color: '#000',
                  fontWeight: 700
                }}
              >
                Duplicate All
              </Button>
              <Button
                variant="contained"
                onClick={bulkDeleteSets}
                sx={{
                  background: 'linear-gradient(135deg, #ff4444, #cc0000)',
                  fontWeight: 700
                }}
              >
                Delete All
              </Button>
            </Box>
          </Paper>
        )}

        {/* Active Exercises */}
        {activeWorkout.exercises.length > 0 && (
          <Paper
            sx={{
              background: '#1a1a1a',
              border: '1px solid #333',
              p: 3,
              mb: 3
            }}
          >
            <Typography
              variant="h6"
              sx={{
                mb: 3,
                fontWeight: 700,
                textTransform: 'uppercase',
                fontSize: { xs: '1.1rem', sm: '1.25rem' },
                lineHeight: 1.2,
                textAlign: 'center',
                background: 'linear-gradient(135deg, #ff4444, #ffaa00)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}
            >
              EXERCISES
            </Typography>
            {activeWorkout.exercises.map((exercise, index) => (
              <ExerciseCard key={index} exercise={exercise} exerciseIndex={index} />
            ))}

            <Button
              variant="contained"
              onClick={finishWorkout}
              disabled={!activeWorkout.exercises.some(ex => ex.sets.length > 0)}
              sx={{
                background: 'linear-gradient(135deg, #ff4444, #cc0000)',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: 1,
                width: '100%',
                height: { xs: '64px', sm: '56px' },
                fontSize: { xs: '1.3rem', sm: '1.2rem' },
                boxShadow: '0 4px 20px rgba(255, 68, 68, 0.3)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #ff6666, #ee0000)',
                  boxShadow: '0 6px 25px rgba(255, 68, 68, 0.4)',
                  transform: 'translateY(-2px)'
                },
                '&:active': {
                  transform: 'translateY(0px)'
                },
                transition: 'all 0.2s ease'
              }}
            >
              🏆 FINISH & SAVE WORKOUT
            </Button>
          </Paper>
        )}

        {activeWorkout.exercises.length === 0 && (
          <Paper
            sx={{
              background: '#1a1a1a',
              border: '1px solid #333',
              p: 4,
              textAlign: 'center'
            }}
          >
            <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
              No exercises added yet
            </Typography>
            <Typography color="text.secondary">
              Select a program or add custom exercises to start your workout! 💪
            </Typography>
          </Paper>
        )}
      </Container>

      {/* Add Exercise Modal */}
      <Modal open={modalOpen} onClose={() => {setModalOpen(false); setExerciseSearch('');}}>
        <Box sx={{
          ...modalStyle,
          width: { xs: '95vw', sm: 600 },
          maxWidth: '600px'
        }}>
          <Typography variant="h6" sx={{ mb: 3, fontWeight: 700, textTransform: 'uppercase' }}>
            🔍 Add Exercise
          </Typography>

          {/* Search Input */}
          <TextField
            fullWidth
            label="Search exercises..."
            value={exerciseSearch}
            onChange={(e) => setExerciseSearch(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && exerciseSearch.trim()) {
                addCustomExerciseFromSearch();
              }
            }}
            autoFocus
            sx={{
              mb: 3,
              '& .MuiOutlinedInput-root': {
                backgroundColor: '#0a0a0a',
                fontSize: { xs: '1rem', sm: '1rem' },
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'primary.main'
                }
              }
            }}
            InputProps={{
              sx: {
                fontSize: { xs: '1rem', sm: '1rem' },
                height: { xs: '56px', sm: '56px' }
              }
            }}
          />

          {/* Quick Add Button for Custom Exercise */}
          {exerciseSearch.trim() && !availableExercises.some(ex =>
            ex.toLowerCase() === exerciseSearch.toLowerCase()
          ) && (
            <Button
              variant="contained"
              onClick={addCustomExerciseFromSearch}
              fullWidth
              sx={{
                mb: 2,
                background: 'linear-gradient(135deg, #ff4444, #cc0000)',
                fontWeight: 700,
                py: { xs: 1.5, sm: 1.5 },
                fontSize: { xs: '0.9rem', sm: '1rem' }
              }}
            >
              ➕ Add &quot;{exerciseSearch}&quot; as Custom Exercise
            </Button>
          )}

          {/* Recent Exercises */}
          {recentExercises.length > 0 && exerciseSearch === '' && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" sx={{ mb: 2, color: 'primary.main', fontWeight: 700 }}>
                🕒 Recently Used
              </Typography>
              <Grid container spacing={1}>
                {recentExercises.map((exercise, index) => (
                  <Grid item xs={6} sm={4} key={index}>
                    <Button
                      variant="outlined"
                      onClick={() => addCustomExercise(exercise)}
                      size="small"
                      sx={{
                        width: '100%',
                        py: { xs: 1.5, sm: 1 },
                        px: { xs: 1, sm: 1.5 },
                        fontSize: { xs: '0.75rem', sm: '0.8rem' },
                        fontWeight: 600,
                        borderColor: '#ffaa00',
                        color: '#ffaa00',
                        textTransform: 'none',
                        '&:hover': {
                          background: 'rgba(255, 170, 0, 0.1)',
                          borderColor: '#ffaa00'
                        }
                      }}
                    >
                      {exercise}
                    </Button>
                  </Grid>
                ))}
              </Grid>
            </Box>
          )}

          {/* Exercise Grid */}
          <Box sx={{ maxHeight: '400px', overflow: 'auto' }}>
            <Grid container spacing={1}>
              {filteredExercises.map((exercise, index) => (
                <Grid item xs={6} sm={4} key={index}>
                  <Button
                    variant="outlined"
                    onClick={() => addCustomExercise(exercise)}
                    sx={{
                      width: '100%',
                      py: { xs: 1.5, sm: 1.5 },
                      px: { xs: 1, sm: 1.5 },
                      fontSize: { xs: '0.75rem', sm: '0.8rem' },
                      fontWeight: 600,
                      textTransform: 'none',
                      minHeight: { xs: '48px', sm: '52px' },
                      '&:hover': {
                        background: 'rgba(255, 68, 68, 0.1)',
                        borderColor: 'primary.main'
                      }
                    }}
                  >
                    {exercise}
                  </Button>
                </Grid>
              ))}
            </Grid>

            {filteredExercises.length === 0 && exerciseSearch && (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography color="text.secondary">
                  No exercises found. Press Enter to add &quot;{exerciseSearch}&quot; as custom.
                </Typography>
              </Box>
            )}
          </Box>
        </Box>
      </Modal>

      {/* Weekly Goal Modal */}
      <Modal
        open={weeklyGoalModalOpen}
        onClose={() => setWeeklyGoalModalOpen(false)}
        aria-labelledby="weekly-goal-modal"
      >
        <Box sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: { xs: '90vw', sm: 400 },
          maxWidth: '400px',
          bgcolor: '#1a1a1a',
          border: '2px solid #ff4444',
          boxShadow: '0 0 50px rgba(255, 68, 68, 0.3)',
          p: 4,
          borderRadius: 2
        }}>
          <Typography variant="h6" sx={{ mb: 3, fontWeight: 700, textAlign: 'center' }}>
            SET WEEKLY GOAL
          </Typography>

          <Typography variant="body2" sx={{ mb: 3, color: 'text.secondary', textAlign: 'center' }}>
            How many workouts do you want to complete each week?
          </Typography>

          <Box sx={{ display: 'flex', gap: 2, mb: 4, justifyContent: 'center' }}>
            {[1, 2, 3, 4, 5, 6, 7].map(goal => (
              <Button
                key={goal}
                variant={weeklyGoal === goal ? "contained" : "outlined"}
                onClick={() => setWeeklyGoal(goal)}
                sx={{
                  minWidth: '40px',
                  height: '40px',
                  p: 0,
                  fontWeight: 700,
                  background: weeklyGoal === goal ? 'linear-gradient(135deg, #00ff88, #00cc66)' : 'transparent',
                  color: weeklyGoal === goal ? '#000' : 'primary.main'
                }}
              >
                {goal}
              </Button>
            ))}
          </Box>

          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              onClick={() => setWeeklyGoalModalOpen(false)}
              variant="outlined"
              fullWidth
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                saveWeeklyGoal(weeklyGoal);
                setWeeklyGoalModalOpen(false);
              }}
              variant="contained"
              fullWidth
              sx={{
                background: 'linear-gradient(135deg, #ff4444, #cc0000)',
                fontWeight: 700
              }}
            >
              Save Goal
            </Button>
          </Box>
        </Box>
      </Modal>

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