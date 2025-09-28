'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Container,
  Typography,
  Box,
  Grid,
  Button,
  Snackbar,
  Alert,
  Paper,
  Card,
  CardContent,
  IconButton,
  Tooltip,
  Fab
} from '@mui/material';
import {
  Add as AddIcon,
  Save as SaveIcon,
  PlayArrow as PlayIcon,
  Pause as PauseIcon,
  Stop as StopIcon,
  Timer as TimerIcon,
  Notes as NotesIcon,
  Assessment as AssessmentIcon,
  FitnessCenter as FitnessIcon
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { collection, getDocs, addDoc, query, orderBy, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { saveWorkoutWithBackup } from '@/lib/offlineStorage';
import { useDebounce } from '@/lib/performance';
import ErrorBoundary from '@/components/error/ErrorBoundary';
import LoadingOverlay from '@/components/loading/LoadingOverlay';

// Enhanced workout components
import WorkoutHeader from '@/components/workout/WorkoutHeader';
import ProgramSelector from '@/components/workout/ProgramSelector';
import ExerciseSearch from '@/components/workout/ExerciseSearch';
import SetTracker from '@/components/workout/SetTracker';
import SmartRestTimer from '@/components/workout/SmartRestTimer';
import PlateCalculator from '@/components/workout/PlateCalculator';
import WorkoutNotes from '@/components/workout/WorkoutNotes';
import WorkoutSummary from '@/components/workout/WorkoutSummary';
import WorkoutHistory from '@/components/workout/WorkoutHistory';
import DraftNotification from '@/components/workout/DraftNotification';

/**
 * Enhanced Workout Page
 * Comprehensive workout tracking with advanced features
 */
export default function EnhancedWorkoutPage() {
  // Core workout state
  const [workout, setWorkout] = useState({
    id: null,
    programName: '',
    exercises: [],
    startTime: null,
    endTime: null,
    completedAt: null,
    notes: [],
    draft: true
  });

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [showExerciseSearch, setShowExerciseSearch] = useState(false);
  const [showRestTimer, setShowRestTimer] = useState(false);
  const [showPlateCalculator, setShowPlateCalculator] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [currentExercise, setCurrentExercise] = useState(null);
  const [workoutHistory, setWorkoutHistory] = useState([]);
  const [favoriteExercises, setFavoriteExercises] = useState([]);
  const [recentExercises, setRecentExercises] = useState([]);

  // Workout timer state
  const [workoutTimer, setWorkoutTimer] = useState({
    isRunning: false,
    startTime: null,
    elapsed: 0
  });

  // Load workout history and favorites
  useEffect(() => {
    loadWorkoutHistory();
    loadFavorites();
    loadRecentExercises();
  }, []);

  // Workout timer effect
  useEffect(() => {
    let interval = null;
    if (workoutTimer.isRunning) {
      interval = setInterval(() => {
        setWorkoutTimer(prev => ({
          ...prev,
          elapsed: Date.now() - prev.startTime
        }));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [workoutTimer.isRunning, workoutTimer.startTime]);

  // Load workout history
  const loadWorkoutHistory = async () => {
    try {
      if (!db) return;
      
      const workoutsQuery = query(
        collection(db, 'workoutSessions'),
        orderBy('completedAt', 'desc')
      );
      const snapshot = await getDocs(workoutsQuery);
      const workouts = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        completedAt: doc.data().completedAt?.toDate(),
        startTime: doc.data().startTime?.toDate(),
        endTime: doc.data().endTime?.toDate(),
      }));
      setWorkoutHistory(workouts);
    } catch (err) {
      console.error('Error loading workout history:', err);
    }
  };

  // Load favorite exercises
  const loadFavorites = () => {
    try {
      const favorites = JSON.parse(localStorage.getItem('favoriteExercises') || '[]');
      setFavoriteExercises(favorites);
    } catch (err) {
      console.error('Error loading favorites:', err);
    }
  };

  // Load recent exercises
  const loadRecentExercises = () => {
    try {
      const recent = JSON.parse(localStorage.getItem('recentExercises') || '[]');
      setRecentExercises(recent);
    } catch (err) {
      console.error('Error loading recent exercises:', err);
    }
  };

  // Start workout timer
  const startWorkoutTimer = () => {
    if (!workoutTimer.isRunning) {
      setWorkoutTimer({
        isRunning: true,
        startTime: Date.now(),
        elapsed: 0
      });
      setWorkout(prev => ({
        ...prev,
        startTime: new Date()
      }));
    }
  };

  // Pause workout timer
  const pauseWorkoutTimer = () => {
    setWorkoutTimer(prev => ({
      ...prev,
      isRunning: false
    }));
  };

  // Stop workout timer
  const stopWorkoutTimer = () => {
    setWorkoutTimer({
      isRunning: false,
      startTime: null,
      elapsed: 0
    });
    setWorkout(prev => ({
      ...prev,
      endTime: new Date()
    }));
  };

  // Add exercise to workout
  const handleAddExercise = (exercise) => {
    const newExercise = {
      id: Date.now().toString(),
      name: exercise.name,
      category: exercise.category,
      equipment: exercise.equipment,
      sets: [
        {
          weight: 0,
          reps: 8,
          completed: false
        }
      ]
    };

    setWorkout(prev => ({
      ...prev,
      exercises: [...prev.exercises, newExercise]
    }));

    // Add to recent exercises
    const updatedRecent = [exercise, ...recentExercises.filter(ex => ex.id !== exercise.id)].slice(0, 10);
    setRecentExercises(updatedRecent);
    localStorage.setItem('recentExercises', JSON.stringify(updatedRecent));

    setShowExerciseSearch(false);
    setSuccess(`Added ${exercise.name} to workout`);
  };

  // Update set
  const handleUpdateSet = (exerciseIndex, setIndex, field, value) => {
    setWorkout(prev => ({
      ...prev,
      exercises: prev.exercises.map((exercise, index) => {
        if (index === exerciseIndex) {
          return {
            ...exercise,
            sets: exercise.sets.map((set, sIndex) => {
              if (sIndex === setIndex) {
                return { ...set, [field]: value };
              }
              return set;
            })
          };
        }
        return exercise;
      })
    }));
  };

  // Complete set
  const handleCompleteSet = (exerciseIndex, setIndex, completed) => {
    handleUpdateSet(exerciseIndex, setIndex, 'completed', completed);
  };

  // Add set
  const handleAddSet = (exerciseIndex, newSet) => {
    setWorkout(prev => ({
      ...prev,
      exercises: prev.exercises.map((exercise, index) => {
        if (index === exerciseIndex) {
          return {
            ...exercise,
            sets: [...exercise.sets, newSet]
          };
        }
        return exercise;
      })
    }));
  };

  // Remove set
  const handleRemoveSet = (exerciseIndex, setIndex) => {
    setWorkout(prev => ({
      ...prev,
      exercises: prev.exercises.map((exercise, index) => {
        if (index === exerciseIndex) {
          return {
            ...exercise,
            sets: exercise.sets.filter((_, sIndex) => sIndex !== setIndex)
          };
        }
        return exercise;
      })
    }));
  };

  // Remove exercise
  const handleRemoveExercise = (exerciseIndex) => {
    setWorkout(prev => ({
      ...prev,
      exercises: prev.exercises.filter((_, index) => index !== exerciseIndex)
    }));
  };

  // Toggle favorite exercise
  const handleToggleFavorite = (exerciseId) => {
    const updatedFavorites = favoriteExercises.includes(exerciseId)
      ? favoriteExercises.filter(id => id !== exerciseId)
      : [...favoriteExercises, exerciseId];
    
    setFavoriteExercises(updatedFavorites);
    localStorage.setItem('favoriteExercises', JSON.stringify(updatedFavorites));
  };

  // Add note
  const handleAddNote = (note) => {
    setWorkout(prev => ({
      ...prev,
      notes: [...prev.notes, note]
    }));
  };

  // Update note
  const handleUpdateNote = (noteId, updates) => {
    setWorkout(prev => ({
      ...prev,
      notes: prev.notes.map(note => 
        note.id === noteId ? { ...note, ...updates } : note
      )
    }));
  };

  // Delete note
  const handleDeleteNote = (noteId) => {
    setWorkout(prev => ({
      ...prev,
      notes: prev.notes.filter(note => note.id !== noteId)
    }));
  };

  // Save workout
  const handleSaveWorkout = async () => {
    try {
      setLoading(true);
      setError(null);

      const workoutData = {
        ...workout,
        completedAt: new Date(),
        endTime: new Date(),
        draft: false
      };

      // Save to Firebase
      if (db) {
        const docRef = await addDoc(collection(db, 'workoutSessions'), workoutData);
        workoutData.id = docRef.id;
      }

      // Save to offline storage
      await saveWorkoutWithBackup(workoutData);

      setSuccess('Workout saved successfully!');
      setShowSummary(true);
      
      // Reset workout
      setWorkout({
        id: null,
        programName: '',
        exercises: [],
        startTime: null,
        endTime: null,
        completedAt: null,
        notes: [],
        draft: true
      });

      // Reload history
      await loadWorkoutHistory();

    } catch (err) {
      console.error('Error saving workout:', err);
      setError('Failed to save workout. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Format workout time
  const formatWorkoutTime = (elapsed) => {
    const minutes = Math.floor(elapsed / 60000);
    const seconds = Math.floor((elapsed % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Get workout progress
  const workoutProgress = useMemo(() => {
    const totalSets = workout.exercises.reduce((sum, exercise) => 
      sum + exercise.sets.length, 0
    );
    const completedSets = workout.exercises.reduce((sum, exercise) => 
      sum + exercise.sets.filter(set => set.completed).length, 0
    );
    return totalSets > 0 ? (completedSets / totalSets) * 100 : 0;
  }, [workout.exercises]);

  return (
    <ErrorBoundary>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        {/* Header */}
        <WorkoutHeader
          workout={workout}
          workoutTimer={workoutTimer}
          onStartTimer={startWorkoutTimer}
          onPauseTimer={pauseWorkoutTimer}
          onStopTimer={stopWorkoutTimer}
          formatTime={formatWorkoutTime}
          progress={workoutProgress}
        />

        {/* Program Selector */}
        <ProgramSelector
          selectedProgram={workout.programName}
          onProgramChange={(program) => 
            setWorkout(prev => ({ ...prev, programName: program }))
          }
        />

        {/* Main Content */}
        <Grid container spacing={3}>
          {/* Left Column - Exercises */}
          <Grid item xs={12} lg={8}>
            {/* Exercise Search */}
            <AnimatePresence>
              {showExerciseSearch && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Paper sx={{ p: 3, mb: 3, background: '#1a1a1a', border: '1px solid #333' }}>
                    <ExerciseSearch
                      onAddExercise={handleAddExercise}
                      recentExercises={recentExercises}
                      favoriteExercises={favoriteExercises}
                      onToggleFavorite={handleToggleFavorite}
                      workoutHistory={workoutHistory}
                    />
                  </Paper>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Exercises */}
            <Box mb={3}>
              {workout.exercises.length === 0 ? (
                <Card sx={{ p: 4, textAlign: 'center', background: '#1a1a1a', border: '1px solid #333' }}>
                  <Typography variant="h6" color="text.secondary" mb={2}>
                    No exercises added yet
                  </Typography>
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => setShowExerciseSearch(true)}
                    sx={{
                      background: 'linear-gradient(135deg, #ff4444, #cc0000)',
                      fontWeight: 700
                    }}
                  >
                    Add Exercise
                  </Button>
                </Card>
              ) : (
                workout.exercises.map((exercise, index) => (
                  <SetTracker
                    key={exercise.id}
                    exercise={exercise}
                    exerciseIndex={index}
                    onUpdateSet={handleUpdateSet}
                    onCompleteSet={handleCompleteSet}
                    onAddSet={handleAddSet}
                    onRemoveSet={handleRemoveSet}
                    onRemoveExercise={handleRemoveExercise}
                    exerciseHistory={workoutHistory}
                    showProgress={true}
                  />
                ))
              )}
            </Box>

            {/* Save Workout Button */}
            {workout.exercises.length > 0 && (
              <Box textAlign="center" mb={3}>
                <Button
                  variant="contained"
                  size="large"
                  startIcon={<SaveIcon />}
                  onClick={handleSaveWorkout}
                  disabled={loading}
                  sx={{
                    background: 'linear-gradient(135deg, #00ff88, #00cc66)',
                    fontWeight: 700,
                    px: 6,
                    py: 2,
                    fontSize: '1.1rem'
                  }}
                >
                  {loading ? 'Saving...' : 'Finish & Save Workout'}
                </Button>
              </Box>
            )}
          </Grid>

          {/* Right Column - Tools */}
          <Grid item xs={12} lg={4}>
            {/* Rest Timer */}
            <Box mb={3}>
              <SmartRestTimer
                currentExercise={currentExercise}
                onTimerComplete={() => setSuccess('Rest time complete!')}
                onTimerUpdate={() => {}}
                isActive={showRestTimer}
              />
            </Box>

            {/* Plate Calculator */}
            <Box mb={3}>
              <PlateCalculator
                onWeightChange={(weight) => {
                  // Update current set weight if editing
                  console.log('Weight changed:', weight);
                }}
                initialWeight={0}
                barWeight={45}
                availablePlates={[45, 35, 25, 10, 5, 2.5]}
              />
            </Box>

            {/* Workout Notes */}
            <Box mb={3}>
              <WorkoutNotes
                notes={workout.notes}
                onAddNote={handleAddNote}
                onUpdateNote={handleUpdateNote}
                onDeleteNote={handleDeleteNote}
              />
            </Box>

            {/* Workout History */}
            <Box mb={3}>
              <WorkoutHistory
                workouts={workoutHistory.slice(0, 5)}
                onLoadWorkout={(workout) => {
                  setWorkout(workout);
                  setSuccess('Workout loaded successfully!');
                }}
              />
            </Box>
          </Grid>
        </Grid>

        {/* Floating Action Buttons */}
        <Box
          sx={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            display: 'flex',
            flexDirection: 'column',
            gap: 2
          }}
        >
          <Tooltip title="Add Exercise">
            <Fab
              color="primary"
              onClick={() => setShowExerciseSearch(!showExerciseSearch)}
              sx={{
                background: 'linear-gradient(135deg, #ff4444, #cc0000)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #ff6666, #ee0000)'
                }
              }}
            >
              <AddIcon />
            </Fab>
          </Tooltip>

          <Tooltip title="Rest Timer">
            <Fab
              color="secondary"
              onClick={() => setShowRestTimer(!showRestTimer)}
              sx={{
                background: 'linear-gradient(135deg, #ffaa00, #cc8800)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #ffcc00, #eeaa00)'
                }
              }}
            >
              <TimerIcon />
            </Fab>
          </Tooltip>

          <Tooltip title="Workout Summary">
            <Fab
              color="info"
              onClick={() => setShowSummary(!showSummary)}
              sx={{
                background: 'linear-gradient(135deg, #0088ff, #0066cc)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #00aaff, #0088ee)'
                }
              }}
            >
              <AssessmentIcon />
            </Fab>
          </Tooltip>
        </Box>

        {/* Workout Summary Modal */}
        <AnimatePresence>
          {showSummary && workout.exercises.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(0, 0, 0, 0.8)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1300
              }}
            >
              <Box
                sx={{
                  maxWidth: '600px',
                  maxHeight: '80vh',
                  overflow: 'auto',
                  background: '#1a1a1a',
                  borderRadius: 2,
                  p: 3
                }}
              >
                <WorkoutSummary
                  workout={workout}
                  previousWorkout={workoutHistory[0]}
                  showProgress={true}
                />
                <Box textAlign="center" mt={3}>
                  <Button
                    variant="outlined"
                    onClick={() => setShowSummary(false)}
                    sx={{ borderColor: '#ff4444', color: '#ff4444' }}
                  >
                    Close
                  </Button>
                </Box>
              </Box>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Loading Overlay */}
        <LoadingOverlay loading={loading} />

        {/* Success/Error Messages */}
        <Snackbar
          open={!!success}
          autoHideDuration={4000}
          onClose={() => setSuccess(null)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
          <Alert severity="success" onClose={() => setSuccess(null)}>
            {success}
          </Alert>
        </Snackbar>

        <Snackbar
          open={!!error}
          autoHideDuration={6000}
          onClose={() => setError(null)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
          <Alert severity="error" onClose={() => setError(null)}>
            {error}
          </Alert>
        </Snackbar>
      </Container>
    </ErrorBoundary>
  );
}

