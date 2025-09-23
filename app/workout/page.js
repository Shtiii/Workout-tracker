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
  Modal
} from '@mui/material';
import {
  Add as AddIcon,
  PlayArrow as PlayIcon,
  Pause as PauseIcon,
  Stop as StopIcon,
  Delete as DeleteIcon,
  KeyboardArrowUp as ArrowUpIcon,
  KeyboardArrowDown as ArrowDownIcon,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { collection, getDocs, addDoc, query, orderBy, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { saveWorkoutWithBackup } from '@/lib/offlineStorage';
import { useDebounce } from '@/lib/performance';

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

  useEffect(() => {
    fetchPrograms();
    fetchExercises();
  }, []);

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
      const querySnapshot = await getDocs(collection(db, 'programs'));
      const programsData = [];
      querySnapshot.forEach((doc) => {
        programsData.push({ id: doc.id, ...doc.data() });
      });
      setPrograms(programsData);
    } catch (error) {
      console.error('Error fetching programs:', error);
      setSnackbarMessage('Error fetching programs');
      setSnackbarOpen(true);
    } finally {
      setLoading(false);
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

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const startTimer = () => {
    setTimer(prev => ({
      ...prev,
      isRunning: true,
      startTime: Date.now() - (prev.time * 1000)
    }));
    if (!activeWorkout.startTime) {
      setActiveWorkout(prev => ({ ...prev, startTime: new Date() }));
    }
  };

  const pauseTimer = () => {
    setTimer(prev => ({ ...prev, isRunning: false }));
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
            completed: false
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
    let newSet = { weight: '', reps: '', completed: false };

    // If there are existing sets, use the last completed set as reference
    const completedSets = exercise.sets.filter(set => set.completed && set.weight && set.reps);
    if (completedSets.length > 0) {
      const lastSet = completedSets[completedSets.length - 1];
      newSet = {
        weight: lastSet.weight,
        reps: lastSet.reps,
        completed: false
      };
    } else {
      // Use exercise history for smart defaults
      const smartDefaults = getSmartDefaults(exercise.name);
      newSet = {
        weight: smartDefaults.weight,
        reps: smartDefaults.reps,
        completed: false
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
        sx={{
          background: 'linear-gradient(135deg, rgba(26, 26, 26, 0.9), rgba(255, 68, 68, 0.05))',
          border: '1px solid #333',
          mb: 2,
          '&:hover': {
            borderColor: 'primary.main',
            boxShadow: '0 0 20px rgba(255, 68, 68, 0.2)'
          }
        }}
      >
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              {exercise.name}
            </Typography>
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
                <Grid item xs={2}>
                  <Typography variant="caption" sx={{ fontWeight: 600 }}>SET</Typography>
                </Grid>
                <Grid item xs={4}>
                  <Typography variant="caption" sx={{ fontWeight: 600 }}>WEIGHT (LBS)</Typography>
                </Grid>
                <Grid item xs={3}>
                  <Typography variant="caption" sx={{ fontWeight: 600 }}>REPS</Typography>
                </Grid>
                <Grid item xs={3}>
                  <Typography variant="caption" sx={{ fontWeight: 600 }}>DONE</Typography>
                </Grid>
              </Grid>

              {exercise.sets.map((set, setIndex) => (
                <Grid container spacing={1} key={setIndex} sx={{ mb: 2 }}>
                  <Grid item xs={2}>
                    <Box sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      height: { xs: '48px', sm: '40px' },
                      bgcolor: set.completed ? 'rgba(0, 255, 136, 0.1)' : 'rgba(255, 68, 68, 0.1)',
                      borderRadius: 1,
                      border: `1px solid ${set.completed ? '#00ff88' : '#333'}`
                    }}>
                      <Typography variant="h6" sx={{ fontWeight: 700, color: set.completed ? '#00ff88' : 'text.primary' }}>
                        {setIndex + 1}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={4}>
                    <TextField
                      size="medium"
                      type="number"
                      value={set.weight}
                      onChange={(e) => updateSet(exerciseIndex, setIndex, 'weight', e.target.value)}
                      placeholder="Weight"
                      fullWidth
                      inputProps={{
                        style: {
                          fontSize: { xs: '1.1rem', sm: '1rem' },
                          textAlign: 'center',
                          fontWeight: 600
                        },
                        inputMode: 'decimal',
                        pattern: '[0-9]*'
                      }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          backgroundColor: '#0a0a0a',
                          height: { xs: '48px', sm: '40px' },
                          fontSize: { xs: '1.1rem', sm: '1rem' },
                          '&:hover .MuiOutlinedInput-notchedOutline': {
                            borderColor: 'primary.main'
                          },
                          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                            borderColor: 'primary.main',
                            borderWidth: '2px'
                          }
                        },
                        '& input': {
                          textAlign: 'center',
                          fontWeight: 600
                        }
                      }}
                    />
                  </Grid>
                  <Grid item xs={3}>
                    <TextField
                      size="medium"
                      type="number"
                      value={set.reps}
                      onChange={(e) => updateSet(exerciseIndex, setIndex, 'reps', e.target.value)}
                      placeholder="Reps"
                      fullWidth
                      inputProps={{
                        style: {
                          fontSize: { xs: '1.1rem', sm: '1rem' },
                          textAlign: 'center',
                          fontWeight: 600
                        },
                        inputMode: 'numeric',
                        pattern: '[0-9]*'
                      }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          backgroundColor: '#0a0a0a',
                          height: { xs: '48px', sm: '40px' },
                          fontSize: { xs: '1.1rem', sm: '1rem' },
                          '&:hover .MuiOutlinedInput-notchedOutline': {
                            borderColor: 'primary.main'
                          },
                          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                            borderColor: 'primary.main',
                            borderWidth: '2px'
                          }
                        },
                        '& input': {
                          textAlign: 'center',
                          fontWeight: 600
                        }
                      }}
                    />
                  </Grid>
                  <Grid item xs={3}>
                    <Button
                      variant={set.completed ? "contained" : "outlined"}
                      onClick={() => completeSet(exerciseIndex, setIndex)}
                      fullWidth
                      sx={{
                        height: { xs: '48px', sm: '40px' },
                        minWidth: 'unset',
                        fontWeight: 700,
                        fontSize: { xs: '1.2rem', sm: '1rem' },
                        background: set.completed ? 'linear-gradient(135deg, #00ff88, #00cc66)' : 'transparent',
                        color: set.completed ? '#000' : 'primary.main',
                        border: set.completed ? 'none' : '2px solid',
                        borderColor: 'primary.main',
                        '&:hover': {
                          background: set.completed
                            ? 'linear-gradient(135deg, #00ff88, #00cc66)'
                            : 'rgba(255, 68, 68, 0.1)',
                          borderColor: 'primary.main',
                          transform: 'scale(1.02)'
                        },
                        '&:active': {
                          transform: 'scale(0.98)'
                        },
                        transition: 'all 0.1s ease'
                      }}
                    >
                      {set.completed ? '✅' : '⭕'}
                    </Button>
                  </Grid>
                </Grid>
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
          variant="h4"
          sx={{
            fontWeight: 900,
            background: 'linear-gradient(135deg, #ff4444, #ffaa00)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            textTransform: 'uppercase',
            letterSpacing: 2,
            textAlign: 'center'
          }}
        >
          💪 ACTIVE TRAINING SESSION
        </Typography>
      </Paper>

      <Container maxWidth="lg">
        {/* Timer */}
        <Paper
          sx={{
            background: 'linear-gradient(135deg, #1a1a1a, rgba(255, 68, 68, 0.05))',
            border: '1px solid #333',
            p: 4,
            mb: 3,
            textAlign: 'center'
          }}
        >
          <Typography
            variant="h2"
            sx={{
              fontWeight: 900,
              background: 'linear-gradient(135deg, #ff4444, #ffaa00)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              mb: 3,
              fontSize: { xs: '3rem', md: '4rem' }
            }}
          >
            {formatTime(timer.time)}
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'center', gap: { xs: 2, sm: 2 }, mb: 3, flexWrap: 'wrap' }}>
            <Button
              variant="contained"
              startIcon={<PlayIcon />}
              onClick={startTimer}
              disabled={timer.isRunning}
              sx={{
                background: 'linear-gradient(135deg, #ff4444, #cc0000)',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: 1,
                minWidth: { xs: '100px', sm: '120px' },
                height: { xs: '48px', sm: '40px' },
                fontSize: { xs: '0.9rem', sm: '0.875rem' },
                '&:hover': {
                  transform: 'scale(1.05)'
                },
                transition: 'all 0.2s ease'
              }}
            >
              START
            </Button>
            <Button
              variant="contained"
              startIcon={<PauseIcon />}
              onClick={pauseTimer}
              disabled={!timer.isRunning}
              sx={{
                background: 'linear-gradient(135deg, #ffaa00, #ff8800)',
                color: '#000',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: 1,
                minWidth: { xs: '100px', sm: '120px' },
                height: { xs: '48px', sm: '40px' },
                fontSize: { xs: '0.9rem', sm: '0.875rem' },
                '&:hover': {
                  transform: 'scale(1.05)'
                },
                transition: 'all 0.2s ease'
              }}
            >
              PAUSE
            </Button>
            <Button
              variant="contained"
              startIcon={<StopIcon />}
              onClick={stopTimer}
              sx={{
                background: 'linear-gradient(135deg, #ff3333, #cc0000)',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: 1,
                minWidth: { xs: '100px', sm: '120px' },
                height: { xs: '48px', sm: '40px' },
                fontSize: { xs: '0.9rem', sm: '0.875rem' },
                '&:hover': {
                  transform: 'scale(1.05)'
                },
                transition: 'all 0.2s ease'
              }}
            >
              END
            </Button>
          </Box>
        </Paper>

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

          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Button
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={() => setModalOpen(true)}
              sx={{
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: 1,
                flex: 1,
                minWidth: '140px'
              }}
            >
              Add Exercise
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
                fontSize: '0.8rem',
                minWidth: '100px'
              }}
            >
              ⏱️ Rest: {restSettings.duration}s
            </Button>
          </Box>
        </Paper>

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
            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
              <Button
                variant="contained"
                onClick={stopRestTimer}
                sx={{
                  background: 'linear-gradient(135deg, #ff4444, #cc0000)',
                  fontWeight: 700
                }}
              >
                SKIP REST
              </Button>
              <Button
                variant="outlined"
                onClick={() => startRestTimer(30)}
                sx={{ borderColor: '#ffaa00', color: '#ffaa00' }}
              >
                +30s
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
            <Typography variant="h5" sx={{ mb: 3, fontWeight: 700, textTransform: 'uppercase' }}>
              🔥 EXERCISES
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