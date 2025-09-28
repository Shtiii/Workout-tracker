'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Container,
  AppBar,
  Toolbar,
  Typography,
  Grid,
  Card,
  CardContent,
  Fab,
  Modal,
  Box,
  TextField,
  Button,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Divider,
  Chip,
  Alert,
  Snackbar,
  CircularProgress
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon, Edit as EditIcon } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { collection, getDocs, addDoc, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import {
  sanitizeProgramName,
  sanitizeExerciseName,
  sanitizeNumber,
  validateProgramData,
  checkRateLimit,
  sanitizeErrorForLogging,
  sanitizeString
} from '@/lib/security';
import { logError } from '@/lib/errorLogger';

const modalStyle = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: { xs: '90vw', sm: 500 },
  maxWidth: '500px',
  maxHeight: '90vh',
  overflow: 'auto',
  bgcolor: '#1a1a1a',
  border: '2px solid #ff4444',
  boxShadow: '0 0 50px rgba(255, 68, 68, 0.3)',
  p: { xs: 3, sm: 4 },
  borderRadius: 2,
};

export default function ProgramsPage() {

  const [programs, setPrograms] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalTitleId] = useState('program-modal-title');

  // Focus management for modal
  useEffect(() => {
    if (modalOpen) {
      // Focus the first input when modal opens
      const timer = setTimeout(() => {
        const firstInput = document.querySelector('#program-name-input');
        if (firstInput) {
          firstInput.focus();
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [modalOpen]);

  // Escape key handler for modal
  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === 'Escape' && modalOpen) {
        handleCloseModal();
      }
    };

    if (modalOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [modalOpen]);
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [editingProgram, setEditingProgram] = useState(null);
  const [newProgram, setNewProgram] = useState({
    name: '',
    exercises: [{ name: '', sets: 3, reps: 10 }]
  });


  const fetchPrograms = useCallback(async () => {
    try {
      console.log('Fetching programs...');

      // Check if Firebase is initialized
      if (!db) {
        throw new Error('Firebase not initialized. Check your environment variables.');
      }

      const querySnapshot = await getDocs(collection(db, 'programs'));
      const programsData = [];
      querySnapshot.forEach((doc) => {
        programsData.push({ id: doc.id, ...doc.data() });
      });
      console.log('Programs fetched:', programsData);
      setPrograms(programsData);
    } catch (error) {
      console.error('Error fetching programs:', error);

      // More detailed error message
      let errorMessage = 'Error fetching programs: ' + error.message;
      if (error.code === 'permission-denied') {
        errorMessage = 'Permission denied. Check your Firestore security rules.';
      } else if (error.code === 'unavailable') {
        errorMessage = 'Firebase service unavailable. Check your internet connection.';
      } else if (error.message.includes('Missing or insufficient permissions')) {
        errorMessage = 'Firestore permissions error. Check your security rules.';
      } else if (error.message.includes('Firebase not initialized')) {
        errorMessage = 'Firebase is not properly configured. Please check your environment variables.';
      }

      showSnackbar(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPrograms();
  }, [fetchPrograms]);

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const handleOpenNewProgramModal = () => {
    setEditingProgram(null);
    setNewProgram({
      name: '',
      exercises: [{ name: '', sets: 3, reps: 10 }]
    });
    setModalOpen(true);
  };

  const handleOpenEditProgramModal = (program) => {
    if (!program || !program.id) {
      console.error('Invalid program for editing:', program);
      return;
    }
    setEditingProgram(program);
    setNewProgram({
      name: program.name || '',
      exercises: program.exercises || [{ name: '', sets: 3, reps: 10 }]
    });
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setEditingProgram(null);
    setNewProgram({
      name: '',
      exercises: [{ name: '', sets: 3, reps: 10 }]
    });
  };

  const handleProgramNameChange = (event) => {
    const rawValue = event.target.value;
    // Allow typing but limit length during input
    const limitedValue = rawValue.slice(0, 100);
    setNewProgram({ ...newProgram, name: limitedValue });
  };

  const handleExerciseChange = (index, field, value) => {
    const updatedExercises = [...newProgram.exercises];

    if (field === 'name') {
      // Limit exercise name length during input
      value = value.slice(0, 100);
    } else if (field === 'sets' || field === 'reps') {
      // Ensure numeric values are within bounds
      const numValue = parseInt(value);
      if (field === 'sets') {
        value = Math.min(Math.max(numValue || 1, 1), 20);
      } else if (field === 'reps') {
        value = Math.min(Math.max(numValue || 1, 1), 100);
      }
    }

    updatedExercises[index] = { ...updatedExercises[index], [field]: value };
    setNewProgram({ ...newProgram, exercises: updatedExercises });
  };

  const addExercise = () => {
    setNewProgram({
      ...newProgram,
      exercises: [...newProgram.exercises, { name: '', sets: 3, reps: 10 }]
    });
  };

  const removeExercise = (index) => {
    if (newProgram.exercises.length > 1) {
      const updatedExercises = newProgram.exercises.filter((_, i) => i !== index);
      setNewProgram({ ...newProgram, exercises: updatedExercises });
    }
  };

  const saveProgram = async () => {
    // Check if Firebase is available
    if (!db) {
      showSnackbar('Firebase is not properly configured. Please check your environment variables and try again.', 'error');
      return;
    }

    try {
      // Rate limiting check
      checkRateLimit('save_program');

      // Sanitize and validate program data
      const sanitizedName = sanitizeProgramName(newProgram?.name);

      if (!newProgram?.exercises || newProgram.exercises.length === 0) {
        showSnackbar('Please add at least one exercise', 'error');
        return;
      }

      // Sanitize and validate exercises
      const sanitizedExercises = [];
      for (const exercise of newProgram.exercises) {
        if (!exercise?.name?.trim()) {
          continue; // Skip empty exercises
        }

        try {
          const sanitizedExercise = {
            name: sanitizeExerciseName(exercise.name),
            sets: sanitizeNumber(exercise.sets, { min: 1, max: 20, integer: true }),
            reps: sanitizeNumber(exercise.reps, { min: 1, max: 100, integer: true })
          };
          sanitizedExercises.push(sanitizedExercise);
        } catch (exerciseError) {
          showSnackbar(`Invalid exercise data: ${exerciseError.message}`, 'error');
          return;
        }
      }

      if (sanitizedExercises.length === 0) {
        showSnackbar('Please add at least one valid exercise', 'error');
        return;
      }

      const programData = {
        name: sanitizedName,
        exercises: sanitizedExercises,
        updatedAt: new Date()
      };

      // Final validation
      validateProgramData(programData);

      setLoading(true);

      if (editingProgram && editingProgram.id) {
        // UPDATE existing program
        programData.createdAt = editingProgram.createdAt || new Date();
        await updateDoc(doc(db, 'programs', editingProgram.id), programData);
        showSnackbar('Program updated successfully!', 'success');
      } else {
        // CREATE new program
        programData.createdAt = new Date();
        await addDoc(collection(db, 'programs'), programData);
        showSnackbar('Program created successfully!', 'success');
      }

      fetchPrograms(); // Refresh the list
      handleCloseModal();
    } catch (error) {
      const sanitizedError = sanitizeErrorForLogging(error, {
        action: 'save_program',
        programName: newProgram?.name,
        exerciseCount: newProgram?.exercises?.length
      });

      logError(error, sanitizedError.context);

      if (error.message.includes('Rate limit')) {
        showSnackbar('Too many requests. Please wait before trying again.', 'error');
      } else if (error.message.includes('validation')) {
        showSnackbar(error.message, 'error');
      } else {
        showSnackbar('Error saving program. Please try again.', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  const deleteProgram = async (programId) => {
    if (!db) {
      showSnackbar('Firebase is not properly configured. Please check your environment variables and try again.', 'error');
      return;
    }

    if (!programId || typeof programId !== 'string') {
      showSnackbar('Invalid program ID', 'error');
      return;
    }

    if (confirm('Are you sure you want to delete this program?')) {
      try {
        // Rate limiting check
        checkRateLimit('delete_action');

        await deleteDoc(doc(db, 'programs', programId));
        showSnackbar('Program deleted successfully!', 'success');
        fetchPrograms(); // Refresh the list
      } catch (error) {
        const sanitizedError = sanitizeErrorForLogging(error, {
          action: 'delete_program',
          programId: programId.substring(0, 8) + '...' // Only log partial ID
        });

        logError(error, sanitizedError.context);

        if (error.message.includes('Rate limit')) {
          showSnackbar('Too many delete requests. Please wait before trying again.', 'error');
        } else {
          showSnackbar('Error deleting program. Please try again.', 'error');
        }
      }
    }
  };

  // Safety guard to prevent undefined state errors
  if (!newProgram || !newProgram.exercises) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <>
      <AppBar position="sticky">
        <Toolbar>
          <Typography
            variant="h6"
            component="h1"
            sx={{ flexGrow: 1 }}
          >
            My Programs
          </Typography>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ mt: { xs: 2, sm: 4 }, mb: 4, px: { xs: 2, sm: 3 } }}>
        {programs.length === 0 ? (
          <Box
            textAlign="center"
            mt={4}
            role="region"
            aria-labelledby="empty-state-title"
          >
            <Typography
              id="empty-state-title"
              variant="h6"
              color="text.secondary"
              gutterBottom
            >
              No programs yet
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Create your first workout program to get started!
            </Typography>
          </Box>
        ) : (
          <Grid
            container
            spacing={3}
            component="section"
            aria-labelledby="programs-list-title"
          >
            <Typography
              id="programs-list-title"
              variant="h2"
              component="h2"
              sx={{ position: 'absolute', left: '-10000px' }}
            >
              Workout Programs List
            </Typography>
            {programs.map((program) => (
              <Grid item xs={12} sm={6} md={4} key={program.id}>
                <motion.div
                  whileHover={{ scale: 1.03 }}
                  transition={{ duration: 0.2 }}
                >
                  <Card
                    component="article"
                    aria-labelledby={`program-title-${program.id}`}
                  >
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                        <Typography
                          id={`program-title-${program.id}`}
                          variant="h5"
                          component="h3"
                        >
                          {sanitizeString(program.name)}
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <IconButton
                            onClick={() => handleOpenEditProgramModal(program)}
                            aria-label={`Edit ${program.name} program`}
                            color="primary"
                            size="small"
                            sx={{
                              '&:focus': {
                                outline: '2px solid',
                                outlineColor: 'primary.main',
                                outlineOffset: '2px'
                              }
                            }}
                          >
                            <EditIcon />
                          </IconButton>
                          <IconButton
                            onClick={() => deleteProgram(program.id)}
                            aria-label={`Delete ${program.name} program`}
                            color="error"
                            size="small"
                            sx={{
                              '&:focus': {
                                outline: '2px solid',
                                outlineColor: 'error.main',
                                outlineOffset: '2px'
                              }
                            }}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Box>
                      </Box>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Exercises:
                      </Typography>
                      <List
                        dense
                        aria-label={`Exercises in ${program.name}`}
                      >
                        {program.exercises.map((exercise, index) => (
                          <ListItem key={index} disablePadding>
                            <ListItemText
                              primary={
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <Typography variant="body2">
                                    {sanitizeString(exercise.name || exercise)}
                                  </Typography>
                                  {exercise.sets && exercise.reps && (
                                    <Chip
                                      size="small"
                                      label={`${exercise.sets}x${exercise.reps}`}
                                      variant="outlined"
                                      color="primary"
                                    />
                                  )}
                                </Box>
                              }
                            />
                          </ListItem>
                        ))}
                      </List>
                    </CardContent>
                  </Card>
                </motion.div>
              </Grid>
            ))}
          </Grid>
        )}
      </Container>

      <Fab
        color="primary"
        aria-label="Create new workout program"
        sx={{
          position: 'fixed',
          bottom: 80,
          right: 16,
          '&:focus': {
            outline: '3px solid',
            outlineColor: 'primary.main',
            outlineOffset: '2px'
          }
        }}
        onClick={handleOpenNewProgramModal}
      >
        <AddIcon />
      </Fab>

      <Modal
        open={modalOpen}
        onClose={handleCloseModal}
        aria-labelledby={modalTitleId}
        aria-describedby="modal-description"
        closeAfterTransition
        disableAutoFocus={false}
        disableEnforceFocus={false}
        disableRestoreFocus={false}
      >
        <Box sx={modalStyle}>
          <Typography
            id={modalTitleId}
            variant="h6"
            component="h2"
            gutterBottom
          >
            {editingProgram ? 'Edit Program' : 'Create New Program'}
          </Typography>
          <Typography
            id="modal-description"
            variant="body2"
            color="text.secondary"
            sx={{ mb: 2, sr: 'only' }}
          >
            {editingProgram ? 'Modify the program details below' : 'Fill out the form below to create a new workout program'}
          </Typography>

          <TextField
            id="program-name-input"
            fullWidth
            label="Program Name"
            value={newProgram.name}
            onChange={handleProgramNameChange}
            margin="normal"
            required
            inputProps={{
              'aria-describedby': 'program-name-help',
              maxLength: 100
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                  borderWidth: '2px'
                }
              }
            }}
          />
          <Typography
            id="program-name-help"
            variant="caption"
            color="text.secondary"
            sx={{ display: 'block', mt: 0.5, mb: 2 }}
          >
            Give your workout program a descriptive name
          </Typography>

          <Typography
            variant="subtitle1"
            component="h3"
            sx={{ mt: 3, mb: 2 }}
          >
            Exercises
          </Typography>

          {newProgram.exercises.map((exercise, index) => (
            <Box key={index} sx={{ mb: 3, p: 2, border: 1, borderColor: 'divider', borderRadius: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Typography
                  variant="subtitle2"
                  component="h4"
                  sx={{ flexGrow: 1 }}
                >
                  Exercise {index + 1}
                </Typography>
                {newProgram.exercises.length > 1 && (
                  <IconButton
                    onClick={() => removeExercise(index)}
                    aria-label={`Remove exercise ${index + 1}`}
                    color="error"
                    size="small"
                    sx={{
                      '&:focus': {
                        outline: '2px solid',
                        outlineColor: 'error.main',
                        outlineOffset: '2px'
                      }
                    }}
                  >
                    <DeleteIcon />
                  </IconButton>
                )}
              </Box>

              <TextField
                fullWidth
                label="Exercise Name"
                value={exercise.name}
                onChange={(e) => handleExerciseChange(index, 'name', e.target.value)}
                margin="normal"
                size="small"
                required
                inputProps={{
                  'aria-describedby': `exercise-name-help-${index}`,
                  maxLength: 100
                }}
              />
              <Typography
                id={`exercise-name-help-${index}`}
                variant="caption"
                color="text.secondary"
                sx={{ display: 'block', mt: 0.5, fontSize: '0.7rem' }}
              >
                Enter the name of the exercise (e.g., Bench Press, Squats)
              </Typography>

              <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                <TextField
                  label="Sets"
                  type="number"
                  value={exercise.sets}
                  onChange={(e) => handleExerciseChange(index, 'sets', e.target.value)}
                  size="small"
                  inputProps={{
                    min: 1,
                    max: 20,
                    'aria-describedby': `sets-help-${index}`
                  }}
                  sx={{ flex: 1 }}
                />
                <TextField
                  label="Reps"
                  type="number"
                  value={exercise.reps}
                  onChange={(e) => handleExerciseChange(index, 'reps', e.target.value)}
                  size="small"
                  inputProps={{
                    min: 1,
                    max: 100,
                    'aria-describedby': `reps-help-${index}`
                  }}
                  sx={{ flex: 1 }}
                />
              </Box>
              <Typography
                id={`sets-help-${index}`}
                variant="caption"
                color="text.secondary"
                sx={{ display: 'block', mt: 0.5, fontSize: '0.6rem' }}
              >
                Number of sets (1-20) and repetitions (1-100) for this exercise
              </Typography>
            </Box>
          ))}

          <Button
            variant="outlined"
            onClick={addExercise}
            startIcon={<AddIcon />}
            aria-label="Add another exercise to the program"
            sx={{
              mb: 3,
              '&:focus': {
                outline: '2px solid',
                outlineColor: 'primary.main',
                outlineOffset: '2px'
              }
            }}
            fullWidth
          >
            Add Another Exercise
          </Button>

          <Divider sx={{ mb: 2 }} />

          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
            <Button
              onClick={handleCloseModal}
              disabled={loading}
              sx={{
                '&:focus': {
                  outline: '2px solid',
                  outlineColor: 'text.primary',
                  outlineOffset: '2px'
                }
              }}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={saveProgram}
              disabled={
                loading ||
                !newProgram?.name?.trim() ||
                !(newProgram?.exercises || []).every(ex => {
                  try {
                    return ex && typeof ex.name === 'string' && ex.name.trim() !== '';
                  } catch (err) {
                    console.warn('Button validation error for exercise:', ex, err);
                    return false;
                  }
                })
              }
              sx={{
                '&:focus': {
                  outline: '2px solid',
                  outlineColor: 'primary.light',
                  outlineOffset: '2px'
                }
              }}
            >
              {loading ? 'Saving...' : editingProgram ? 'Update Program' : 'Create Program'}
            </Button>
          </Box>
        </Box>
      </Modal>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
}