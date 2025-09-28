'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Card,
  CardContent,
  Grid,
  IconButton,
  Tooltip,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  Alert,
  Snackbar
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  ExpandMore as ExpandMoreIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  DragIndicator as DragIcon,
  FitnessCenter as FitnessIcon,
  Schedule as ScheduleIcon,
  TrendingUp as TrendingUpIcon
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { 
  EXERCISE_DATABASE, 
  EXERCISE_CATEGORIES, 
  EQUIPMENT_TYPES, 
  DIFFICULTY_LEVELS,
  searchExercises
} from '@/lib/data/exerciseDatabase';
import { 
  PROGRAM_GOALS, 
  PROGRAM_DURATION, 
  PROGRAM_FREQUENCY,
  validateProgram,
  createCustomProgram
} from '@/lib/data/programTemplates';

/**
 * Program Builder Component
 * Allows users to create and customize workout programs
 */
export default function ProgramBuilder({
  initialProgram = null,
  onSave,
  onCancel,
  isEditing = false
}) {
  const [program, setProgram] = useState({
    name: '',
    description: '',
    goal: PROGRAM_GOALS.GENERAL_FITNESS,
    difficulty: DIFFICULTY_LEVELS.BEGINNER,
    duration: PROGRAM_DURATION.WEEK_8,
    frequency: PROGRAM_FREQUENCY.WEEKLY_3,
    equipment: [],
    targetMuscles: [],
    workouts: [],
    progression: {
      type: 'linear',
      increment: 2.5,
      deload: 10,
      maxAttempts: 3
    },
    notes: [],
    tags: []
  });

  const [editingWorkout, setEditingWorkout] = useState(null);
  const [editingExercise, setEditingExercise] = useState(null);
  const [showExerciseSearch, setShowExerciseSearch] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Initialize program if editing
  useEffect(() => {
    if (initialProgram) {
      setProgram(initialProgram);
    }
  }, [initialProgram]);

  // Search exercises
  useEffect(() => {
    if (searchQuery) {
      const results = searchExercises(searchQuery);
      setSearchResults(results.slice(0, 10));
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);

  // Add workout
  const handleAddWorkout = () => {
    const newWorkout = {
      id: Date.now().toString(),
      name: `Workout ${program.workouts.length + 1}`,
      exercises: []
    };
    
    setProgram(prev => ({
      ...prev,
      workouts: [...prev.workouts, newWorkout]
    }));
  };

  // Update workout
  const handleUpdateWorkout = (workoutId, updates) => {
    setProgram(prev => ({
      ...prev,
      workouts: prev.workouts.map(workout =>
        workout.id === workoutId ? { ...workout, ...updates } : workout
      )
    }));
  };

  // Delete workout
  const handleDeleteWorkout = (workoutId) => {
    setProgram(prev => ({
      ...prev,
      workouts: prev.workouts.filter(workout => workout.id !== workoutId)
    }));
  };

  // Add exercise to workout
  const handleAddExercise = (workoutId, exercise) => {
    const newExercise = {
      id: Date.now().toString(),
      name: exercise.name,
      category: exercise.category,
      equipment: exercise.equipment,
      sets: 3,
      reps: 8,
      weight: 0,
      rest: 120
    };

    setProgram(prev => ({
      ...prev,
      workouts: prev.workouts.map(workout =>
        workout.id === workoutId
          ? { ...workout, exercises: [...workout.exercises, newExercise] }
          : workout
      )
    }));

    setShowExerciseSearch(false);
    setSearchQuery('');
  };

  // Update exercise
  const handleUpdateExercise = (workoutId, exerciseId, updates) => {
    setProgram(prev => ({
      ...prev,
      workouts: prev.workouts.map(workout =>
        workout.id === workoutId
          ? {
              ...workout,
              exercises: workout.exercises.map(exercise =>
                exercise.id === exerciseId ? { ...exercise, ...updates } : exercise
              )
            }
          : workout
      )
    }));
  };

  // Delete exercise
  const handleDeleteExercise = (workoutId, exerciseId) => {
    setProgram(prev => ({
      ...prev,
      workouts: prev.workouts.map(workout =>
        workout.id === workoutId
          ? { ...workout, exercises: workout.exercises.filter(ex => ex.id !== exerciseId) }
          : workout
      )
    }));
  };

  // Add note
  const handleAddNote = () => {
    const newNote = {
      id: Date.now().toString(),
      text: '',
      isEditing: true
    };
    
    setProgram(prev => ({
      ...prev,
      notes: [...prev.notes, newNote]
    }));
  };

  // Update note
  const handleUpdateNote = (noteId, text) => {
    setProgram(prev => ({
      ...prev,
      notes: prev.notes.map(note =>
        note.id === noteId ? { ...note, text, isEditing: false } : note
      )
    }));
  };

  // Delete note
  const handleDeleteNote = (noteId) => {
    setProgram(prev => ({
      ...prev,
      notes: prev.notes.filter(note => note.id !== noteId)
    }));
  };

  // Add tag
  const handleAddTag = (tag) => {
    if (tag && !program.tags.includes(tag)) {
      setProgram(prev => ({
        ...prev,
        tags: [...prev.tags, tag]
      }));
    }
  };

  // Remove tag
  const handleRemoveTag = (tag) => {
    setProgram(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag)
    }));
  };

  // Save program
  const handleSave = () => {
    try {
      const errors = validateProgram(program);
      if (errors.length > 0) {
        setError(`Validation failed: ${errors.join(', ')}`);
        return;
      }

      const customProgram = createCustomProgram(program);
      onSave(customProgram);
      setSuccess('Program saved successfully!');
    } catch (err) {
      setError(err.message);
    }
  };

  // Get program stats
  const getProgramStats = () => {
    const totalWorkouts = program.workouts.length;
    const totalExercises = program.workouts.reduce((sum, workout) => sum + workout.exercises.length, 0);
    const totalSets = program.workouts.reduce((sum, workout) => 
      sum + workout.exercises.reduce((exSum, exercise) => exSum + exercise.sets, 0), 0
    );
    
    return { totalWorkouts, totalExercises, totalSets };
  };

  const stats = getProgramStats();

  return (
    <Box>
      {/* Header */}
      <Box mb={3}>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 2 }}>
          {isEditing ? 'Edit Program' : 'Create New Program'}
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Build a custom workout program tailored to your goals and preferences.
        </Typography>
      </Box>

      {/* Program Basic Info */}
      <Card sx={{ mb: 3, background: '#1a1a1a', border: '1px solid #333' }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
            Program Information
          </Typography>
          
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Program Name"
                value={program.name}
                onChange={(e) => setProgram(prev => ({ ...prev, name: e.target.value }))}
                sx={{ mb: 2 }}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Goal</InputLabel>
                <Select
                  value={program.goal}
                  onChange={(e) => setProgram(prev => ({ ...prev, goal: e.target.value }))}
                  label="Goal"
                >
                  {Object.values(PROGRAM_GOALS).map(goal => (
                    <MenuItem key={goal} value={goal}>{goal}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Description"
                value={program.description}
                onChange={(e) => setProgram(prev => ({ ...prev, description: e.target.value }))}
                sx={{ mb: 2 }}
              />
            </Grid>
            
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth>
                <InputLabel>Difficulty</InputLabel>
                <Select
                  value={program.difficulty}
                  onChange={(e) => setProgram(prev => ({ ...prev, difficulty: e.target.value }))}
                  label="Difficulty"
                >
                  {Object.values(DIFFICULTY_LEVELS).map(difficulty => (
                    <MenuItem key={difficulty} value={difficulty}>{difficulty}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth>
                <InputLabel>Duration</InputLabel>
                <Select
                  value={program.duration}
                  onChange={(e) => setProgram(prev => ({ ...prev, duration: e.target.value }))}
                  label="Duration"
                >
                  {Object.values(PROGRAM_DURATION).map(duration => (
                    <MenuItem key={duration} value={duration}>{duration}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth>
                <InputLabel>Frequency</InputLabel>
                <Select
                  value={program.frequency}
                  onChange={(e) => setProgram(prev => ({ ...prev, frequency: e.target.value }))}
                  label="Frequency"
                >
                  {Object.values(PROGRAM_FREQUENCY).map(frequency => (
                    <MenuItem key={frequency} value={frequency}>{frequency}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Program Stats */}
      <Grid container spacing={2} mb={3}>
        <Grid item xs={4}>
          <Card sx={{ background: '#1a1a1a', border: '1px solid #333' }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" sx={{ fontWeight: 700, color: '#ff4444' }}>
                {stats.totalWorkouts}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Workouts
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={4}>
          <Card sx={{ background: '#1a1a1a', border: '1px solid #333' }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" sx={{ fontWeight: 700, color: '#00ff88' }}>
                {stats.totalExercises}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Exercises
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={4}>
          <Card sx={{ background: '#1a1a1a', border: '1px solid #333' }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" sx={{ fontWeight: 700, color: '#ffaa00' }}>
                {stats.totalSets}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Sets
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Workouts */}
      <Card sx={{ mb: 3, background: '#1a1a1a', border: '1px solid #333' }}>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Workouts
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleAddWorkout}
              sx={{
                background: 'linear-gradient(135deg, #ff4444, #cc0000)',
                fontWeight: 700
              }}
            >
              Add Workout
            </Button>
          </Box>

          {program.workouts.map((workout, index) => (
            <Accordion key={workout.id} sx={{ mb: 2, background: '#2a2a2a', border: '1px solid #444' }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Box display="flex" alignItems="center" gap={2} flex={1}>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    {workout.name}
                  </Typography>
                  <Chip
                    label={`${workout.exercises.length} exercises`}
                    size="small"
                    sx={{ background: 'rgba(255, 68, 68, 0.2)', color: '#ff4444' }}
                  />
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                {/* Workout Header */}
                <Box display="flex" gap={2} mb={3}>
                  <TextField
                    label="Workout Name"
                    value={workout.name}
                    onChange={(e) => handleUpdateWorkout(workout.id, { name: e.target.value })}
                    size="small"
                    sx={{ flex: 1 }}
                  />
                  <Button
                    variant="outlined"
                    startIcon={<AddIcon />}
                    onClick={() => setShowExerciseSearch(workout.id)}
                    sx={{ borderColor: '#ff4444', color: '#ff4444' }}
                  >
                    Add Exercise
                  </Button>
                  <IconButton
                    onClick={() => handleDeleteWorkout(workout.id)}
                    sx={{ color: '#ff4444' }}
                  >
                    <DeleteIcon />
                  </IconButton>
                </Box>

                {/* Exercise Search */}
                {showExerciseSearch === workout.id && (
                  <Box mb={3} p={2} sx={{ background: '#1a1a1a', borderRadius: 2 }}>
                    <TextField
                      fullWidth
                      label="Search exercises..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      sx={{ mb: 2 }}
                    />
                    <Grid container spacing={1}>
                      {searchResults.map((exercise) => (
                        <Grid item xs={12} sm={6} md={4} key={exercise.id}>
                          <Card
                            sx={{
                              cursor: 'pointer',
                              '&:hover': { borderColor: '#ff4444' }
                            }}
                            onClick={() => handleAddExercise(workout.id, exercise)}
                          >
                            <CardContent sx={{ p: 2 }}>
                              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                                {exercise.name}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {exercise.category} • {exercise.equipment}
                              </Typography>
                            </CardContent>
                          </Card>
                        </Grid>
                      ))}
                    </Grid>
                  </Box>
                )}

                {/* Exercises */}
                <List>
                  {workout.exercises.map((exercise, exIndex) => (
                    <ListItem key={exercise.id} sx={{ px: 0 }}>
                      <ListItemText
                        primary={exercise.name}
                        secondary={`${exercise.sets} sets × ${exercise.reps} reps • ${exercise.rest}s rest`}
                      />
                      <ListItemSecondaryAction>
                        <IconButton
                          onClick={() => handleDeleteExercise(workout.id, exercise.id)}
                          sx={{ color: '#ff4444' }}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                </List>
              </AccordionDetails>
            </Accordion>
          ))}
        </CardContent>
      </Card>

      {/* Progression Settings */}
      <Card sx={{ mb: 3, background: '#1a1a1a', border: '1px solid #333' }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
            Progression Settings
          </Typography>
          
          <Grid container spacing={3}>
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth>
                <InputLabel>Progression Type</InputLabel>
                <Select
                  value={program.progression.type}
                  onChange={(e) => setProgram(prev => ({
                    ...prev,
                    progression: { ...prev.progression, type: e.target.value }
                  }))}
                  label="Progression Type"
                >
                  <MenuItem value="linear">Linear</MenuItem>
                  <MenuItem value="double-progression">Double Progression</MenuItem>
                  <MenuItem value="periodized">Periodized</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Weight Increment (lbs)"
                type="number"
                value={program.progression.increment}
                onChange={(e) => setProgram(prev => ({
                  ...prev,
                  progression: { ...prev.progression, increment: parseFloat(e.target.value) }
                }))}
              />
            </Grid>
            
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Deload Percentage"
                type="number"
                value={program.progression.deload}
                onChange={(e) => setProgram(prev => ({
                  ...prev,
                  progression: { ...prev.progression, deload: parseFloat(e.target.value) }
                }))}
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Notes */}
      <Card sx={{ mb: 3, background: '#1a1a1a', border: '1px solid #333' }}>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Program Notes
            </Typography>
            <Button
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={handleAddNote}
              sx={{ borderColor: '#ff4444', color: '#ff4444' }}
            >
              Add Note
            </Button>
          </Box>
          
          {program.notes.map((note) => (
            <Box key={note.id} display="flex" gap={2} mb={2}>
              <TextField
                fullWidth
                multiline
                rows={2}
                placeholder="Add a note..."
                value={note.text}
                onChange={(e) => handleUpdateNote(note.id, e.target.value)}
                onBlur={() => handleUpdateNote(note.id, note.text)}
              />
              <IconButton
                onClick={() => handleDeleteNote(note.id)}
                sx={{ color: '#ff4444' }}
              >
                <DeleteIcon />
              </IconButton>
            </Box>
          ))}
        </CardContent>
      </Card>

      {/* Tags */}
      <Card sx={{ mb: 3, background: '#1a1a1a', border: '1px solid #333' }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
            Tags
          </Typography>
          
          <Box display="flex" gap={1} flexWrap="wrap" mb={2}>
            {program.tags.map((tag) => (
              <Chip
                key={tag}
                label={tag}
                onDelete={() => handleRemoveTag(tag)}
                sx={{ background: 'rgba(255, 68, 68, 0.2)', color: '#ff4444' }}
              />
            ))}
          </Box>
          
          <TextField
            label="Add tag"
            size="small"
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleAddTag(e.target.value);
                e.target.value = '';
              }
            }}
            sx={{ maxWidth: 200 }}
          />
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <Box display="flex" gap={2} justifyContent="flex-end">
        <Button
          variant="outlined"
          onClick={onCancel}
          sx={{ borderColor: '#666', color: '#666' }}
        >
          Cancel
        </Button>
        <Button
          variant="contained"
          startIcon={<SaveIcon />}
          onClick={handleSave}
          sx={{
            background: 'linear-gradient(135deg, #00ff88, #00cc66)',
            fontWeight: 700
          }}
        >
          Save Program
        </Button>
      </Box>

      {/* Success/Error Messages */}
      <Snackbar
        open={!!success}
        autoHideDuration={4000}
        onClose={() => setSuccess(null)}
      >
        <Alert severity="success" onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      </Snackbar>

      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={() => setError(null)}
      >
        <Alert severity="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      </Snackbar>
    </Box>
  );
}

