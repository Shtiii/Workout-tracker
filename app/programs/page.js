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
  Snackbar
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon, Edit as EditIcon } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { collection, getDocs, addDoc, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

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
      const querySnapshot = await getDocs(collection(db, 'programs'));
      const programsData = [];
      querySnapshot.forEach((doc) => {
        programsData.push({ id: doc.id, ...doc.data() });
      });
      console.log('Programs fetched:', programsData);
      setPrograms(programsData);
    } catch (error) {
      console.error('Error fetching programs:', error);
      showSnackbar('Error fetching programs: ' + error.message, 'error');
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

  const handleOpenModal = (program = null) => {
    if (program) {
      setEditingProgram(program);
      setNewProgram({
        name: program.name,
        exercises: program.exercises || [{ name: '', sets: 3, reps: 10 }]
      });
    } else {
      setEditingProgram(null);
      setNewProgram({
        name: '',
        exercises: [{ name: '', sets: 3, reps: 10 }]
      });
    }
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
    setNewProgram({ ...newProgram, name: event.target.value });
  };

  const handleExerciseChange = (index, field, value) => {
    const updatedExercises = [...newProgram.exercises];
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
    console.log('Attempting to save program:', newProgram);

    // Validation
    if (!newProgram.name.trim()) {
      showSnackbar('Please enter a program name', 'error');
      return;
    }

    const validExercises = newProgram.exercises.filter(exercise => exercise.name.trim() !== '');
    if (validExercises.length === 0) {
      showSnackbar('Please add at least one exercise with a name', 'error');
      return;
    }

    try {
      setLoading(true);
      console.log('Saving to Firestore...');

      const programData = {
        name: newProgram.name.trim(),
        exercises: validExercises.map(ex => ({
          name: ex.name.trim(),
          sets: parseInt(ex.sets) || 3,
          reps: parseInt(ex.reps) || 10
        })),
        updatedAt: new Date()
      };

      if (editingProgram) {
        // Update existing program
        programData.createdAt = editingProgram.createdAt || new Date();
        await updateDoc(doc(db, 'programs', editingProgram.id), programData);
        console.log('Program updated with ID:', editingProgram.id);
        showSnackbar('Program updated successfully!', 'success');
      } else {
        // Create new program
        programData.createdAt = new Date();
        const docRef = await addDoc(collection(db, 'programs'), programData);
        console.log('Program saved with ID:', docRef.id);
        showSnackbar('Program created successfully!', 'success');
      }
      fetchPrograms(); // Refresh the list
      handleCloseModal();
    } catch (error) {
      console.error('Error saving program:', error);
      showSnackbar('Error saving program: ' + error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const deleteProgram = async (programId) => {
    if (confirm('Are you sure you want to delete this program?')) {
      try {
        await deleteDoc(doc(db, 'programs', programId));
        showSnackbar('Program deleted successfully!', 'success');
        fetchPrograms(); // Refresh the list
      } catch (error) {
        console.error('Error deleting program:', error);
        showSnackbar('Error deleting program: ' + error.message, 'error');
      }
    }
  };

  return (
    <>
      <AppBar position="sticky">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            My Programs
          </Typography>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ mt: { xs: 2, sm: 4 }, mb: 4, px: { xs: 2, sm: 3 } }}>
        {programs.length === 0 ? (
          <Box textAlign="center" mt={4}>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No programs yet
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Create your first workout program to get started!
            </Typography>
          </Box>
        ) : (
          <Grid container spacing={3}>
            {programs.map((program) => (
              <Grid item xs={12} sm={6} md={4} key={program.id}>
                <motion.div
                  whileHover={{ scale: 1.03 }}
                  transition={{ duration: 0.2 }}
                >
                  <Card>
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                        <Typography variant="h5" component="div">
                          {program.name}
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <IconButton
                            onClick={() => handleOpenModal(program)}
                            color="primary"
                            size="small"
                          >
                            <EditIcon />
                          </IconButton>
                          <IconButton
                            onClick={() => deleteProgram(program.id)}
                            color="error"
                            size="small"
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Box>
                      </Box>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Exercises:
                      </Typography>
                      <List dense>
                        {program.exercises.map((exercise, index) => (
                          <ListItem key={index} disablePadding>
                            <ListItemText
                              primary={
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <Typography variant="body2">
                                    {exercise.name || exercise}
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
        aria-label="add"
        sx={{
          position: 'fixed',
          bottom: 80,
          right: 16,
        }}
        onClick={handleOpenModal}
      >
        <AddIcon />
      </Fab>

      <Modal
        open={modalOpen}
        onClose={handleCloseModal}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Box sx={modalStyle}>
          <Typography id="modal-modal-title" variant="h6" component="h2" gutterBottom>
            {editingProgram ? 'Edit Program' : 'Create New Program'}
          </Typography>

          <TextField
            fullWidth
            label="Program Name"
            value={newProgram.name}
            onChange={handleProgramNameChange}
            margin="normal"
            required
          />

          <Typography variant="subtitle1" sx={{ mt: 3, mb: 2 }}>
            Exercises
          </Typography>

          {newProgram.exercises.map((exercise, index) => (
            <Box key={index} sx={{ mb: 3, p: 2, border: 1, borderColor: 'divider', borderRadius: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Typography variant="subtitle2" sx={{ flexGrow: 1 }}>
                  Exercise {index + 1}
                </Typography>
                {newProgram.exercises.length > 1 && (
                  <IconButton
                    onClick={() => removeExercise(index)}
                    color="error"
                    size="small"
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
              />

              <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                <TextField
                  label="Sets"
                  type="number"
                  value={exercise.sets}
                  onChange={(e) => handleExerciseChange(index, 'sets', e.target.value)}
                  size="small"
                  inputProps={{ min: 1, max: 10 }}
                  sx={{ flex: 1 }}
                />
                <TextField
                  label="Reps"
                  type="number"
                  value={exercise.reps}
                  onChange={(e) => handleExerciseChange(index, 'reps', e.target.value)}
                  size="small"
                  inputProps={{ min: 1, max: 50 }}
                  sx={{ flex: 1 }}
                />
              </Box>
            </Box>
          ))}

          <Button
            variant="outlined"
            onClick={addExercise}
            startIcon={<AddIcon />}
            sx={{ mb: 3 }}
            fullWidth
          >
            Add Another Exercise
          </Button>

          <Divider sx={{ mb: 2 }} />

          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
            <Button onClick={handleCloseModal} disabled={loading}>
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={saveProgram}
              disabled={loading || !newProgram.name.trim() || newProgram.exercises.every(ex => ex.name.trim() === '')}
            >
              {loading ? 'Saving...' : editingProgram ? 'Update Program' : 'Save Program'}
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