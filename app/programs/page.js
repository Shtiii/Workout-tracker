'use client';

import { useState, useEffect } from 'react';
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
  ListItemText
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { collection, getDocs, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

const modalStyle = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 400,
  bgcolor: 'background.paper',
  border: '2px solid #000',
  boxShadow: 24,
  p: 4,
  borderRadius: 2,
};

export default function ProgramsPage() {
  const [programs, setPrograms] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [newProgram, setNewProgram] = useState({
    name: '',
    exercises: ['']
  });

  useEffect(() => {
    fetchPrograms();
  }, []);

  const fetchPrograms = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'programs'));
      const programsData = [];
      querySnapshot.forEach((doc) => {
        programsData.push({ id: doc.id, ...doc.data() });
      });
      setPrograms(programsData);
    } catch (error) {
      console.error('Error fetching programs:', error);
    }
  };

  const handleOpenModal = () => {
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setNewProgram({ name: '', exercises: [''] });
  };

  const handleProgramNameChange = (event) => {
    setNewProgram({ ...newProgram, name: event.target.value });
  };

  const handleExerciseChange = (index, value) => {
    const updatedExercises = [...newProgram.exercises];
    updatedExercises[index] = value;
    setNewProgram({ ...newProgram, exercises: updatedExercises });
  };

  const addExercise = () => {
    setNewProgram({
      ...newProgram,
      exercises: [...newProgram.exercises, '']
    });
  };

  const removeExercise = (index) => {
    const updatedExercises = newProgram.exercises.filter((_, i) => i !== index);
    setNewProgram({ ...newProgram, exercises: updatedExercises });
  };

  const saveProgram = async () => {
    if (newProgram.name.trim() === '') return;

    const filteredExercises = newProgram.exercises.filter(exercise => exercise.trim() !== '');
    if (filteredExercises.length === 0) return;

    try {
      await addDoc(collection(db, 'programs'), {
        name: newProgram.name,
        exercises: filteredExercises,
        createdAt: new Date()
      });

      fetchPrograms();
      handleCloseModal();
    } catch (error) {
      console.error('Error saving program:', error);
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

      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Grid container spacing={3}>
          {programs.map((program) => (
            <Grid item xs={12} sm={6} md={4} key={program.id}>
              <motion.div
                whileHover={{ scale: 1.03 }}
                transition={{ duration: 0.2 }}
              >
                <Card>
                  <CardContent>
                    <Typography variant="h5" component="div" gutterBottom>
                      {program.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Exercises:
                    </Typography>
                    <List dense>
                      {program.exercises.map((exercise, index) => (
                        <ListItem key={index} disablePadding>
                          <ListItemText
                            primary={exercise}
                            primaryTypographyProps={{ variant: 'body2' }}
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
            Create New Program
          </Typography>

          <TextField
            fullWidth
            label="Program Name"
            value={newProgram.name}
            onChange={handleProgramNameChange}
            margin="normal"
          />

          <Typography variant="subtitle1" sx={{ mt: 2, mb: 1 }}>
            Exercises
          </Typography>

          {newProgram.exercises.map((exercise, index) => (
            <Box key={index} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <TextField
                fullWidth
                label={`Exercise ${index + 1}`}
                value={exercise}
                onChange={(e) => handleExerciseChange(index, e.target.value)}
                size="small"
              />
              {newProgram.exercises.length > 1 && (
                <IconButton
                  onClick={() => removeExercise(index)}
                  color="error"
                  size="small"
                  sx={{ ml: 1 }}
                >
                  <DeleteIcon />
                </IconButton>
              )}
            </Box>
          ))}

          <Button
            variant="outlined"
            onClick={addExercise}
            startIcon={<AddIcon />}
            sx={{ mt: 1, mb: 2 }}
          >
            Add Exercise
          </Button>

          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
            <Button onClick={handleCloseModal}>
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={saveProgram}
              disabled={!newProgram.name.trim() || newProgram.exercises.every(ex => ex.trim() === '')}
            >
              Save Program
            </Button>
          </Box>
        </Box>
      </Modal>
    </>
  );
}