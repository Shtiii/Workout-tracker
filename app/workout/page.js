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
    updatedWorkout.exercises[exerciseIndex].sets[setIndex].completed =
      !updatedWorkout.exercises[exerciseIndex].sets[setIndex].completed;
    setActiveWorkout(updatedWorkout);
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
                <Grid container spacing={1} key={setIndex} sx={{ mb: 1 }}>
                  <Grid item xs={2}>
                    <Typography variant="body2" sx={{ mt: 1, fontWeight: 600 }}>
                      {setIndex + 1}
                    </Typography>
                  </Grid>
                  <Grid item xs={4}>
                    <TextField
                      size="small"
                      type="number"
                      value={set.weight}
                      onChange={(e) => updateSet(exerciseIndex, setIndex, 'weight', e.target.value)}
                      placeholder="Weight"
                      fullWidth
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          backgroundColor: '#0a0a0a',
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
                      type="number"
                      value={set.reps}
                      onChange={(e) => updateSet(exerciseIndex, setIndex, 'reps', e.target.value)}
                      placeholder="Reps"
                      fullWidth
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          backgroundColor: '#0a0a0a',
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
                </Grid>
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
              mb: 3,
              fontSize: { xs: '3rem', md: '4rem' }
            }}
          >
            {formatTime(timer.time)}
          </Typography>
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