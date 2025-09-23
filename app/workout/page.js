'use client';

import { useState, useEffect } from 'react';
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
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { collection, getDocs, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { saveWorkoutWithBackup } from '@/lib/offlineStorage';

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
  const [exerciseHistory, setExerciseHistory] = useState({});

  const [timer, setTimer] = useState({
    time: 0,
    isRunning: false,
    startTime: null
  });

  const [restTimer, setRestTimer] = useState({
    time: 0,
    isRunning: false,
    startTime: null,
    duration: 90, // Default 90 seconds
    exerciseIndex: null,
    setIndex: null
  });

  const [restTimerSettings, setRestTimerSettings] = useState({
    isOpen: false,
    defaultDuration: 90
  });

  const [numberPad, setNumberPad] = useState({
    isOpen: false,
    value: '',
    field: '', // 'weight' or 'reps'
    exerciseIndex: null,
    setIndex: null,
    onSave: null
  });

  const [plateCalculator, setPlateCalculator] = useState({
    isOpen: false,
    targetWeight: 0
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
    fetchExerciseHistory();
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
    if (restTimer.isRunning) {
      interval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - restTimer.startTime) / 1000);
        const remaining = Math.max(0, restTimer.duration - elapsed);

        setRestTimer(prev => ({
          ...prev,
          time: remaining
        }));

        // Play sound when timer finishes
        if (remaining === 0) {
          setRestTimer(prev => ({ ...prev, isRunning: false }));
          // Play notification sound
          if (typeof window !== 'undefined' && 'AudioContext' in window) {
            playRestCompleteSound();
          }
          // Show notification
          setSnackbarMessage('Rest time complete! 💪');
          setSnackbarOpen(true);
        }
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [restTimer.isRunning, restTimer.startTime, restTimer.duration]);

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
    // Default exercises for the modal
    setAvailableExercises([
      'Bench Press', 'Squat', 'Deadlift', 'Overhead Press', 'Barbell Row',
      'Pull-ups', 'Dips', 'Bicep Curls', 'Tricep Extensions', 'Lateral Raises'
    ]);
  };

  const fetchExerciseHistory = async () => {
    try {
      const workoutsQuery = query(
        collection(db, 'workoutSessions'),
        orderBy('completedAt', 'desc')
      );
      const workoutsSnapshot = await getDocs(workoutsQuery);

      const history = {};

      workoutsSnapshot.docs.forEach(doc => {
        const workout = doc.data();
        workout.exercises?.forEach(exercise => {
          if (!history[exercise.name]) {
            history[exercise.name] = {
              lastSession: workout.completedAt?.toDate(),
              bestSet: null,
              lastSets: []
            };
          }

          const exerciseData = history[exercise.name];

          // Store the most recent sets for this exercise
          if (!exerciseData.lastSession || workout.completedAt?.toDate() > exerciseData.lastSession) {
            exerciseData.lastSession = workout.completedAt?.toDate();
            exerciseData.lastSets = exercise.sets || [];
          }

          // Find the best set (highest weight)
          exercise.sets?.forEach(set => {
            const weight = parseFloat(set.weight);
            const reps = parseInt(set.reps);
            if (weight && reps) {
              if (!exerciseData.bestSet || weight > parseFloat(exerciseData.bestSet.weight)) {
                exerciseData.bestSet = { ...set, weight, reps };
              }
            }
          });
        });
      });

      setExerciseHistory(history);
    } catch (error) {
      console.error('Error fetching exercise history:', error);
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

  const playRestCompleteSound = () => {
    // Create a simple beep sound using Web Audio API
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = 800; // 800 Hz tone
      oscillator.type = 'sine';

      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
    } catch (error) {
      console.log('Audio not supported');
    }
  };

  const startRestTimer = (exerciseIndex, setIndex, duration = restTimerSettings.defaultDuration) => {
    setRestTimer({
      time: duration,
      isRunning: true,
      startTime: Date.now(),
      duration: duration,
      exerciseIndex,
      setIndex
    });
  };

  const stopRestTimer = () => {
    setRestTimer(prev => ({ ...prev, isRunning: false, time: 0 }));
  };

  const formatRestTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const openNumberPad = (field, exerciseIndex, setIndex, currentValue = '') => {
    setNumberPad({
      isOpen: true,
      value: currentValue,
      field,
      exerciseIndex,
      setIndex,
      onSave: (value) => {
        updateSet(exerciseIndex, setIndex, field, value);
        closeNumberPad();
      }
    });
  };

  const closeNumberPad = () => {
    setNumberPad({
      isOpen: false,
      value: '',
      field: '',
      exerciseIndex: null,
      setIndex: null,
      onSave: null
    });
  };

  const handleNumberPadInput = (input) => {
    if (input === 'backspace') {
      setNumberPad(prev => ({ ...prev, value: prev.value.slice(0, -1) }));
    } else if (input === 'clear') {
      setNumberPad(prev => ({ ...prev, value: '' }));
    } else if (input === '.') {
      if (!numberPad.value.includes('.')) {
        setNumberPad(prev => ({ ...prev, value: prev.value + input }));
      }
    } else {
      // Limit to reasonable length
      if (numberPad.value.length < 6) {
        setNumberPad(prev => ({ ...prev, value: prev.value + input }));
      }
    }
  };

  const saveNumberPadValue = () => {
    if (numberPad.value && numberPad.onSave) {
      numberPad.onSave(numberPad.value);
    }
  };

  const calculateSessionVolume = () => {
    let totalVolume = 0;
    let completedSets = 0;

    activeWorkout.exercises.forEach(exercise => {
      exercise.sets.forEach(set => {
        if (set.completed && set.weight && set.reps) {
          const weight = parseFloat(set.weight);
          const reps = parseInt(set.reps);
          if (weight > 0 && reps > 0) {
            totalVolume += weight * reps;
            completedSets += 1;
          }
        }
      });
    });

    return { totalVolume, completedSets };
  };

  const calculatePlates = (targetWeight) => {
    const barWeight = 20; // Standard Olympic barbell
    const weightPerSide = (targetWeight - barWeight) / 2;

    if (weightPerSide <= 0) {
      return { plates: [], impossible: false, message: 'Just the bar (20kg)' };
    }

    // Available plate weights in kg
    const availablePlates = [25, 20, 15, 10, 5, 2.5, 1.25];
    const platesNeeded = [];
    let remainingWeight = weightPerSide;

    for (const plate of availablePlates) {
      const plateCount = Math.floor(remainingWeight / plate);
      if (plateCount > 0) {
        platesNeeded.push({ weight: plate, count: plateCount });
        remainingWeight -= plateCount * plate;
      }
    }

    // Check if we can achieve exact weight
    const impossible = remainingWeight > 0.1; // Allow for small rounding errors

    return {
      plates: platesNeeded,
      impossible,
      message: impossible ? `Cannot make exactly ${targetWeight}kg` : null,
      totalPerSide: weightPerSide,
      actualWeight: barWeight + (weightPerSide - remainingWeight) * 2
    };
  };

  const openPlateCalculator = (targetWeight = 60) => {
    setPlateCalculator({
      isOpen: true,
      targetWeight
    });
  };

  const closePlateCalculator = () => {
    setPlateCalculator({
      isOpen: false,
      targetWeight: 0
    });
  };

  const handleProgramSelect = (event) => {
    const programId = event.target.value;
    setSelectedProgramId(programId);

    const program = programs.find(p => p.id === programId);
    if (program) {
      const exercisesWithSets = program.exercises.map(exercise => ({
        name: exercise.name,
        targetSets: exercise.sets || 3,
        targetReps: exercise.reps || 10,
        sets: []
      }));

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
    updatedWorkout.exercises[exerciseIndex].sets.push({
      weight: '',
      reps: '',
      completed: false
    });
    setActiveWorkout(updatedWorkout);
  };

  const updateSet = (exerciseIndex, setIndex, field, value) => {
    const updatedWorkout = { ...activeWorkout };
    updatedWorkout.exercises[exerciseIndex].sets[setIndex][field] = value;
    setActiveWorkout(updatedWorkout);
  };

  const completeSet = (exerciseIndex, setIndex) => {
    const updatedWorkout = { ...activeWorkout };
    const isCompleting = !updatedWorkout.exercises[exerciseIndex].sets[setIndex].completed;

    updatedWorkout.exercises[exerciseIndex].sets[setIndex].completed = isCompleting;
    setActiveWorkout(updatedWorkout);

    // Start rest timer when completing a set (not when uncompleting)
    if (isCompleting) {
      startRestTimer(exerciseIndex, setIndex);
      // Haptic feedback if available
      if (navigator.vibrate) {
        navigator.vibrate(50);
      }
    }
  };

  const addCustomExercise = (exerciseName) => {
    const newExercise = {
      name: exerciseName,
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

  const removeExercise = (exerciseIndex) => {
    const updatedWorkout = { ...activeWorkout };
    updatedWorkout.exercises.splice(exerciseIndex, 1);
    setActiveWorkout(updatedWorkout);
  };

  const finishWorkout = async () => {
    if (!activeWorkout.exercises.length) {
      setSnackbarMessage('Add at least one exercise to save workout!');
      setSnackbarOpen(true);
      return;
    }

    const volumeStats = calculateSessionVolume();
    const sessionToSave = {
      ...activeWorkout,
      endTime: new Date(),
      completedAt: new Date(),
      duration: timer.time,
      totalVolume: volumeStats.totalVolume,
      completedSets: volumeStats.completedSets
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

  const ExerciseCard = ({ exercise, exerciseIndex }) => {
    const history = exerciseHistory[exercise.name];

    const handleSwipe = (setIndex, direction) => {
      if (direction === 'right') {
        // Swipe right to complete/uncomplete set
        completeSet(exerciseIndex, setIndex);
      }
    };

    return (
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
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  {exercise.name}
                </Typography>
                {history?.lastSets?.length > 0 && (
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                    Last: {history.lastSets.map(set =>
                      `${set.weight}kg × ${set.reps}`
                    ).join(', ')}
                  </Typography>
                )}
                {history?.bestSet && (
                  <Typography variant="caption" sx={{ display: 'block', color: '#00ff88', fontWeight: 600 }}>
                    Best: {history.bestSet.weight}kg × {history.bestSet.reps} reps 💪
                  </Typography>
                )}
              </Box>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Chip
                  label={`Target: ${exercise.targetSets}×${exercise.targetReps}`}
                  size="small"
                  color="primary"
                  variant="outlined"
                />
                <IconButton
                  onClick={() => removeExercise(exerciseIndex)}
                  color="error"
                  size="small"
                >
                  <DeleteIcon />
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
                <motion.div
                  key={setIndex}
                  drag="x"
                  dragConstraints={{ left: -100, right: 100 }}
                  dragElastic={0.2}
                  onDragEnd={(event, info) => {
                    if (info.offset.x > 50) {
                      handleSwipe(setIndex, 'right');
                    }
                  }}
                  whileDrag={{
                    x: 0,
                    backgroundColor: 'rgba(0, 255, 136, 0.1)',
                    scale: 1.02
                  }}
                  style={{
                    x: 0
                  }}
                >
                  <Grid container spacing={1} sx={{
                    mb: 1,
                    p: 1,
                    borderRadius: 1,
                    position: 'relative',
                    '&:hover': {
                      backgroundColor: 'rgba(255, 68, 68, 0.05)'
                    }
                  }}>
                    <Grid item xs={2}>
                      <Typography variant="body2" sx={{ mt: 1, fontWeight: 600 }}>
                        {setIndex + 1}
                      </Typography>
                    </Grid>
                    <Grid item xs={4}>
                      <TextField
                        size="small"
                        value={set.weight}
                        placeholder="Weight"
                        fullWidth
                        onClick={() => openNumberPad('weight', exerciseIndex, setIndex, set.weight)}
                        InputProps={{
                          readOnly: true,
                          endAdornment: 'kg'
                        }}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            backgroundColor: '#0a0a0a',
                            cursor: 'pointer',
                            '&:hover .MuiOutlinedInput-notchedOutline': {
                              borderColor: 'primary.main'
                            }
                          }
                        }}
                      />
                    </Grid>
                    <Grid item xs={3}>
                      <TextField
                        size="small"
                        value={set.reps}
                        placeholder="Reps"
                        fullWidth
                        onClick={() => openNumberPad('reps', exerciseIndex, setIndex, set.reps)}
                        InputProps={{
                          readOnly: true
                        }}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            backgroundColor: '#0a0a0a',
                            cursor: 'pointer',
                            '&:hover .MuiOutlinedInput-notchedOutline': {
                              borderColor: 'primary.main'
                            }
                          }
                        }}
                      />
                    </Grid>
                    <Grid item xs={3}>
                      <Button
                        variant={set.completed ? "contained" : "outlined"}
                        size="small"
                        onClick={() => completeSet(exerciseIndex, setIndex)}
                        sx={{
                          minWidth: '60px',
                          fontWeight: 700,
                          background: set.completed ? 'linear-gradient(135deg, #00ff88, #00cc66)' : 'transparent',
                          color: set.completed ? '#000' : 'primary.main'
                        }}
                      >
                        ✓
                      </Button>
                    </Grid>

                    {/* Swipe indicator */}
                    <Box sx={{
                      position: 'absolute',
                      right: -10,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      opacity: 0.5,
                      pointerEvents: 'none'
                    }}>
                      <Typography variant="caption" sx={{ color: '#00ff88' }}>
                        →
                      </Typography>
                    </Box>
                  </Grid>
                </motion.div>
              ))}
            </Box>
          )}

          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={() => addSet(exerciseIndex)}
            size="small"
            sx={{
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: 1
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
              mb: 2,
              fontSize: { xs: '3rem', md: '4rem' }
            }}
          >
            {formatTime(timer.time)}
          </Typography>

          {/* Volume Stats */}
          {activeWorkout.exercises.length > 0 && (
            <Box sx={{ mb: 3, display: 'flex', justifyContent: 'center', gap: 4, flexWrap: 'wrap' }}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h4" sx={{
                  fontWeight: 900,
                  color: '#00ff88',
                  fontSize: { xs: '1.5rem', md: '2rem' }
                }}>
                  {calculateSessionVolume().totalVolume.toLocaleString()}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{
                  textTransform: 'uppercase',
                  fontWeight: 600,
                  letterSpacing: 1
                }}>
                  Total Volume (kg)
                </Typography>
              </Box>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h4" sx={{
                  fontWeight: 900,
                  color: '#ffaa00',
                  fontSize: { xs: '1.5rem', md: '2rem' }
                }}>
                  {calculateSessionVolume().completedSets}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{
                  textTransform: 'uppercase',
                  fontWeight: 600,
                  letterSpacing: 1
                }}>
                  Sets Completed
                </Typography>
              </Box>
            </Box>
          )}

          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mb: 3 }}>
            <Button
              variant="contained"
              startIcon={<PlayIcon />}
              onClick={startTimer}
              disabled={timer.isRunning}
              sx={{
                background: 'linear-gradient(135deg, #ff4444, #cc0000)',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: 1
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
                letterSpacing: 1
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
                letterSpacing: 1
              }}
            >
              END
            </Button>
          </Box>
        </Paper>

        {/* Rest Timer */}
        {restTimer.isRunning && (
          <Paper
            sx={{
              background: 'linear-gradient(135deg, #1a1a1a, rgba(255, 170, 0, 0.1))',
              border: '2px solid #ffaa00',
              p: 3,
              mb: 3,
              textAlign: 'center',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            <Typography variant="h6" sx={{ mb: 1, color: '#ffaa00', fontWeight: 700 }}>
              ⏰ REST TIME
            </Typography>
            <Typography
              variant="h1"
              sx={{
                fontWeight: 900,
                background: 'linear-gradient(135deg, #ffaa00, #ff8800)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                mb: 2,
                fontSize: { xs: '2.5rem', md: '3.5rem' }
              }}
            >
              {formatRestTime(restTimer.time)}
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
              <Button
                variant="outlined"
                onClick={stopRestTimer}
                size="small"
                sx={{
                  borderColor: '#ffaa00',
                  color: '#ffaa00',
                  '&:hover': {
                    borderColor: '#ff8800',
                    backgroundColor: 'rgba(255, 170, 0, 0.1)'
                  }
                }}
              >
                Skip Rest
              </Button>
              <Button
                variant="outlined"
                onClick={() => setRestTimer(prev => ({ ...prev, time: prev.time + 30, duration: prev.duration + 30 }))}
                size="small"
                sx={{
                  borderColor: '#ffaa00',
                  color: '#ffaa00',
                  '&:hover': {
                    borderColor: '#ff8800',
                    backgroundColor: 'rgba(255, 170, 0, 0.1)'
                  }
                }}
              >
                +30s
              </Button>
            </Box>

            {/* Progress bar */}
            <Box
              sx={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                height: 4,
                width: `${((restTimer.duration - restTimer.time) / restTimer.duration) * 100}%`,
                background: 'linear-gradient(90deg, #ffaa00, #ff8800)',
                transition: 'width 1s linear'
              }}
            />
          </Paper>
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

          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={() => setModalOpen(true)}
            sx={{
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: 1
            }}
          >
            Add Exercise
          </Button>
        </Paper>

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
                py: 2,
                fontSize: '1.2rem'
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
      <Modal open={modalOpen} onClose={() => setModalOpen(false)}>
        <Box sx={modalStyle}>
          <Typography variant="h6" sx={{ mb: 3, fontWeight: 700, textTransform: 'uppercase' }}>
            Add Exercise
          </Typography>
          <Grid container spacing={2}>
            {availableExercises.map((exercise, index) => (
              <Grid item xs={12} sm={6} key={index}>
                <Button
                  variant="outlined"
                  onClick={() => addCustomExercise(exercise)}
                  sx={{
                    width: '100%',
                    p: 2,
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: 1,
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
        </Box>
      </Modal>

      {/* Number Pad Modal */}
      <Modal open={numberPad.isOpen} onClose={closeNumberPad}>
        <Box sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: { xs: '90vw', sm: 350 },
          maxWidth: 350,
          bgcolor: '#1a1a1a',
          border: '2px solid #ff4444',
          borderRadius: 2,
          boxShadow: '0 0 50px rgba(255, 68, 68, 0.3)',
          p: 3,
        }}>
          <Typography variant="h6" sx={{ mb: 3, fontWeight: 700, textAlign: 'center' }}>
            Enter {numberPad.field === 'weight' ? 'Weight (kg)' : 'Reps'}
          </Typography>

          {/* Display */}
          <Box sx={{
            mb: 3,
            p: 2,
            bgcolor: '#0a0a0a',
            borderRadius: 1,
            border: '1px solid #333',
            textAlign: 'center'
          }}>
            <Typography variant="h4" sx={{
              fontWeight: 700,
              color: numberPad.value ? 'primary.main' : 'text.secondary',
              minHeight: '1.5em'
            }}>
              {numberPad.value || '0'}
              {numberPad.field === 'weight' && numberPad.value && ' kg'}
            </Typography>
          </Box>

          {/* Number Pad */}
          <Grid container spacing={1} sx={{ mb: 3 }}>
            {['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', '⌫'].map((btn) => (
              <Grid item xs={4} key={btn}>
                <Button
                  variant="outlined"
                  fullWidth
                  onClick={() => handleNumberPadInput(btn === '⌫' ? 'backspace' : btn)}
                  sx={{
                    height: 50,
                    fontSize: '1.2rem',
                    fontWeight: 700,
                    borderColor: '#333',
                    color: 'text.primary',
                    '&:hover': {
                      borderColor: 'primary.main',
                      backgroundColor: 'rgba(255, 68, 68, 0.1)'
                    }
                  }}
                >
                  {btn}
                </Button>
              </Grid>
            ))}
          </Grid>

          {/* Action Buttons */}
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="outlined"
              fullWidth
              onClick={() => handleNumberPadInput('clear')}
              sx={{
                borderColor: '#666',
                color: '#666',
                '&:hover': {
                  borderColor: '#888',
                  backgroundColor: 'rgba(102, 102, 102, 0.1)'
                }
              }}
            >
              Clear
            </Button>
            <Button
              variant="contained"
              fullWidth
              onClick={saveNumberPadValue}
              disabled={!numberPad.value}
              sx={{
                background: 'linear-gradient(135deg, #ff4444, #cc0000)',
                fontWeight: 700
              }}
            >
              Save
            </Button>
          </Box>
        </Box>
      </Modal>

      {/* Plate Calculator Modal */}
      <Modal open={plateCalculator.isOpen} onClose={closePlateCalculator}>
        <Box sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: { xs: '90vw', sm: 400 },
          maxWidth: 400,
          bgcolor: '#1a1a1a',
          border: '2px solid #ffaa00',
          borderRadius: 2,
          boxShadow: '0 0 50px rgba(255, 170, 0, 0.3)',
          p: 3,
        }}>
          <Typography variant="h6" sx={{ mb: 3, fontWeight: 700, textAlign: 'center', color: '#ffaa00' }}>
            🏋️ Plate Calculator
          </Typography>

          {/* Weight Input */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="body2" sx={{ mb: 1 }}>Target Weight (kg):</Typography>
            <TextField
              fullWidth
              type="number"
              value={plateCalculator.targetWeight}
              onChange={(e) => setPlateCalculator(prev => ({ ...prev, targetWeight: parseFloat(e.target.value) || 0 }))}
              inputProps={{ min: 20, max: 300, step: 2.5 }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  backgroundColor: '#0a0a0a',
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#ffaa00'
                  }
                }
              }}
            />
          </Box>

          {/* Plate Calculation Result */}
          {plateCalculator.targetWeight > 0 && (
            <Box sx={{
              p: 2,
              bgcolor: '#0a0a0a',
              borderRadius: 1,
              border: '1px solid #333',
              mb: 3
            }}>
              {(() => {
                const result = calculatePlates(plateCalculator.targetWeight);

                if (result.message) {
                  return (
                    <Typography variant="body1" sx={{ textAlign: 'center', color: '#ffaa00' }}>
                      {result.message}
                    </Typography>
                  );
                }

                return (
                  <Box>
                    <Typography variant="h6" sx={{ mb: 2, textAlign: 'center', color: '#ffaa00' }}>
                      Each Side: {result.totalPerSide}kg
                    </Typography>

                    {result.plates.map((plate, index) => (
                      <Box key={index} sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        mb: 1,
                        p: 1,
                        bgcolor: 'rgba(255, 170, 0, 0.1)',
                        borderRadius: 1
                      }}>
                        <Typography variant="body1">
                          {plate.weight}kg plates:
                        </Typography>
                        <Typography variant="h6" sx={{ color: '#ffaa00', fontWeight: 700 }}>
                          {plate.count}
                        </Typography>
                      </Box>
                    ))}

                    <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid #333', textAlign: 'center' }}>
                      <Typography variant="body2" color="text.secondary">
                        Bar (20kg) + {result.totalPerSide}kg each side = {plateCalculator.targetWeight}kg total
                      </Typography>
                    </Box>
                  </Box>
                );
              })()}
            </Box>
          )}

          {/* Common Weight Buttons */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="body2" sx={{ mb: 2 }}>Quick Weights:</Typography>
            <Grid container spacing={1}>
              {[60, 80, 100, 120, 140, 160, 180, 200].map(weight => (
                <Grid item xs={3} key={weight}>
                  <Button
                    variant="outlined"
                    size="small"
                    fullWidth
                    onClick={() => setPlateCalculator(prev => ({ ...prev, targetWeight: weight }))}
                    sx={{
                      borderColor: '#333',
                      color: 'text.primary',
                      fontSize: '0.7rem',
                      '&:hover': {
                        borderColor: '#ffaa00',
                        backgroundColor: 'rgba(255, 170, 0, 0.1)'
                      }
                    }}
                  >
                    {weight}
                  </Button>
                </Grid>
              ))}
            </Grid>
          </Box>

          {/* Close Button */}
          <Button
            variant="contained"
            fullWidth
            onClick={closePlateCalculator}
            sx={{
              background: 'linear-gradient(135deg, #ffaa00, #ff8800)',
              color: '#000',
              fontWeight: 700
            }}
          >
            Close
          </Button>
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