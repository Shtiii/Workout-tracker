'use client';

import { useState, useEffect } from 'react';
import {
  Container,
  AppBar,
  Toolbar,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Button,
  TextField,
  Box,
  Grid,
  Snackbar,
  Alert,
  Divider
} from '@mui/material';
import { ExpandMore as ExpandMoreIcon, Add as AddIcon } from '@mui/icons-material';
import { collection, getDocs, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export default function WorkoutPage() {
  const [programs, setPrograms] = useState([]);
  const [selectedProgramId, setSelectedProgramId] = useState('');
  const [selectedProgram, setSelectedProgram] = useState(null);
  const [loading, setLoading] = useState(true);
  const [workoutSession, setWorkoutSession] = useState({
    programId: '',
    programName: '',
    exercises: [],
    startTime: null,
    endTime: null
  });
  const [snackbarOpen, setSnackbarOpen] = useState(false);

  useEffect(() => {
    fetchPrograms();
  }, []);

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
    } finally {
      setLoading(false);
    }
  };

  const handleProgramSelect = (event) => {
    const programId = event.target.value;
    setSelectedProgramId(programId);

    const program = programs.find(p => p.id === programId);
    setSelectedProgram(program);

    if (program) {
      const exercisesWithSets = program.exercises.map(exerciseName => ({
        name: exerciseName,
        sets: []
      }));

      setWorkoutSession({
        programId: program.id,
        programName: program.name,
        exercises: exercisesWithSets,
        startTime: new Date(),
        endTime: null
      });
    }
  };

  const addSet = (exerciseIndex) => {
    const updatedSession = { ...workoutSession };
    updatedSession.exercises[exerciseIndex].sets.push({
      weight: '',
      reps: ''
    });
    setWorkoutSession(updatedSession);
  };

  const updateSet = (exerciseIndex, setIndex, field, value) => {
    const updatedSession = { ...workoutSession };
    updatedSession.exercises[exerciseIndex].sets[setIndex][field] = value;
    setWorkoutSession(updatedSession);
  };

  const finishWorkout = async () => {
    if (!workoutSession.programId) return;

    const sessionToSave = {
      ...workoutSession,
      endTime: new Date(),
      completedAt: new Date()
    };

    try {
      await addDoc(collection(db, 'workoutSessions'), sessionToSave);
      setSnackbarOpen(true);

      // Reset the workout session
      setWorkoutSession({
        programId: '',
        programName: '',
        exercises: [],
        startTime: null,
        endTime: null
      });
      setSelectedProgramId('');
      setSelectedProgram(null);
    } catch (error) {
      console.error('Error saving workout session:', error);
    }
  };

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  return (
    <>
      <AppBar position="sticky">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Live Workout
          </Typography>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <FormControl fullWidth sx={{ mb: 4 }}>
          <InputLabel id="program-select-label">Choose a Program</InputLabel>
          <Select
            labelId="program-select-label"
            id="program-select"
            value={selectedProgramId}
            label="Choose a Program"
            onChange={handleProgramSelect}
            disabled={loading}
          >
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

        {selectedProgram && (
          <Box sx={{ mb: 4 }}>
            <Typography variant="h5" gutterBottom>
              {selectedProgram.name}
            </Typography>
            <Divider sx={{ mb: 3 }} />

            {workoutSession.exercises.map((exercise, exerciseIndex) => (
              <Accordion key={exerciseIndex} sx={{ mb: 2 }}>
                <AccordionSummary
                  expandIcon={<ExpandMoreIcon />}
                  aria-controls={`exercise-${exerciseIndex}-content`}
                  id={`exercise-${exerciseIndex}-header`}
                >
                  <Typography variant="h6">{exercise.name}</Typography>
                  {exercise.sets.length > 0 && (
                    <Typography variant="body2" sx={{ ml: 2, color: 'text.secondary' }}>
                      ({exercise.sets.length} set{exercise.sets.length !== 1 ? 's' : ''})
                    </Typography>
                  )}
                </AccordionSummary>
                <AccordionDetails>
                  <Box sx={{ width: '100%' }}>
                    {exercise.sets.length > 0 && (
                      <Box sx={{ mb: 2 }}>
                        <Grid container spacing={2} sx={{ mb: 1 }}>
                          <Grid item xs={2}>
                            <Typography variant="body2" fontWeight="bold">Set</Typography>
                          </Grid>
                          <Grid item xs={5}>
                            <Typography variant="body2" fontWeight="bold">Weight (lbs)</Typography>
                          </Grid>
                          <Grid item xs={5}>
                            <Typography variant="body2" fontWeight="bold">Reps</Typography>
                          </Grid>
                        </Grid>

                        {exercise.sets.map((set, setIndex) => (
                          <Grid container spacing={2} key={setIndex} sx={{ mb: 1 }}>
                            <Grid item xs={2}>
                              <Typography variant="body2" sx={{ mt: 1 }}>
                                {setIndex + 1}
                              </Typography>
                            </Grid>
                            <Grid item xs={5}>
                              <TextField
                                size="small"
                                type="number"
                                value={set.weight}
                                onChange={(e) => updateSet(exerciseIndex, setIndex, 'weight', e.target.value)}
                                placeholder="Weight"
                                fullWidth
                              />
                            </Grid>
                            <Grid item xs={5}>
                              <TextField
                                size="small"
                                type="number"
                                value={set.reps}
                                onChange={(e) => updateSet(exerciseIndex, setIndex, 'reps', e.target.value)}
                                placeholder="Reps"
                                fullWidth
                              />
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
                    >
                      Add Set
                    </Button>
                  </Box>
                </AccordionDetails>
              </Accordion>
            ))}

            <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
              <Button
                variant="contained"
                size="large"
                onClick={finishWorkout}
                disabled={!workoutSession.exercises.some(ex => ex.sets.length > 0)}
                sx={{ minWidth: 200, py: 1.5 }}
              >
                Finish & Save Workout
              </Button>
            </Box>
          </Box>
        )}
      </Container>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleSnackbarClose} severity="success" sx={{ width: '100%' }}>
          Workout Saved!
        </Alert>
      </Snackbar>
    </>
  );
}