'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  IconButton,
  Card,
  CardContent,
  Chip,
  Tooltip,
  MenuItem,
  Select,
  FormControl,
  InputLabel
} from '@mui/material';
import {
  Add as AddIcon,
  Remove as RemoveIcon,
  CheckCircle as CheckIcon,
  RadioButtonUnchecked as UncheckIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  TrendingFlat as TrendingFlatIcon
} from '@mui/icons-material';
import { motion } from 'framer-motion';

/**
 * Enhanced Set Tracker Component
 * Provides advanced set tracking with progress indicators and smart suggestions
 */
export default function SetTracker({
  exercise,
  exerciseIndex,
  onUpdateSet,
  onCompleteSet,
  onAddSet,
  onRemoveSet,
  exerciseHistory = [],
  showProgress = true
}) {
  const [editingSet, setEditingSet] = useState(null);
  const [tempWeight, setTempWeight] = useState('');
  const [tempReps, setTempReps] = useState('');

  // Get previous workout data for this exercise
  const previousWorkout = exerciseHistory
    .slice()
    .reverse()
    .find(workout => 
      workout.exercises.some(ex => ex.name === exercise.name)
    );

  const previousExercise = previousWorkout?.exercises.find(ex => ex.name === exercise.name);

  // Calculate progress indicators
  const getProgressIndicator = (setIndex, currentSet) => {
    if (!previousExercise || !showProgress) return null;

    const previousSet = previousExercise.sets[setIndex];
    if (!previousSet || !previousSet.completed) return null;

    const weightDiff = currentSet.weight - previousSet.weight;
    const repsDiff = currentSet.reps - previousSet.reps;

    if (weightDiff > 0) return { type: 'weight', direction: 'up', value: weightDiff };
    if (weightDiff < 0) return { type: 'weight', direction: 'down', value: Math.abs(weightDiff) };
    if (repsDiff > 0) return { type: 'reps', direction: 'up', value: repsDiff };
    if (repsDiff < 0) return { type: 'reps', direction: 'down', value: Math.abs(repsDiff) };
    
    return { type: 'maintained', direction: 'flat', value: 0 };
  };

  // Get suggested weight for next set
  const getSuggestedWeight = (setIndex) => {
    if (!previousExercise || setIndex === 0) return exercise.sets[setIndex]?.weight || 0;

    const previousSet = previousExercise.sets[setIndex];
    if (!previousSet || !previousSet.completed) return exercise.sets[setIndex]?.weight || 0;

    // Simple progression logic - can be enhanced
    if (previousSet.reps >= 8) {
      return previousSet.weight + 2.5; // Increase weight if reps were high
    } else if (previousSet.reps < 5) {
      return previousSet.weight - 2.5; // Decrease weight if reps were low
    }
    
    return previousSet.weight; // Maintain weight
  };

  // Get suggested reps for next set
  const getSuggestedReps = (setIndex) => {
    if (!previousExercise || setIndex === 0) return exercise.sets[setIndex]?.reps || 8;

    const previousSet = previousExercise.sets[setIndex];
    if (!previousSet || !previousSet.completed) return exercise.sets[setIndex]?.reps || 8;

    return previousSet.reps; // Maintain reps
  };

  // Handle set completion
  const handleCompleteSet = (setIndex) => {
    const set = exercise.sets[setIndex];
    onCompleteSet(exerciseIndex, setIndex, !set.completed);
  };

  // Handle weight change
  const handleWeightChange = (setIndex, value) => {
    onUpdateSet(exerciseIndex, setIndex, 'weight', parseFloat(value) || 0);
  };

  // Handle reps change
  const handleRepsChange = (setIndex, value) => {
    onUpdateSet(exerciseIndex, setIndex, 'reps', parseInt(value) || 0);
  };

  // Handle set removal
  const handleRemoveSet = (setIndex) => {
    onRemoveSet(exerciseIndex, setIndex);
  };

  // Handle add set
  const handleAddSet = () => {
    const lastSet = exercise.sets[exercise.sets.length - 1];
    const suggestedWeight = getSuggestedWeight(exercise.sets.length);
    const suggestedReps = getSuggestedReps(exercise.sets.length);
    
    onAddSet(exerciseIndex, {
      weight: suggestedWeight,
      reps: suggestedReps,
      completed: false
    });
  };

  // Start editing set
  const startEditing = (setIndex) => {
    const set = exercise.sets[setIndex];
    setEditingSet(setIndex);
    setTempWeight(set.weight.toString());
    setTempReps(set.reps.toString());
  };

  // Save editing
  const saveEditing = () => {
    if (editingSet !== null) {
      handleWeightChange(editingSet, tempWeight);
      handleRepsChange(editingSet, tempReps);
      setEditingSet(null);
      setTempWeight('');
      setTempReps('');
    }
  };

  // Cancel editing
  const cancelEditing = () => {
    setEditingSet(null);
    setTempWeight('');
    setTempReps('');
  };

  // Get progress icon
  const getProgressIcon = (progress) => {
    if (!progress) return null;

    switch (progress.direction) {
      case 'up':
        return <TrendingUpIcon sx={{ color: '#00ff88', fontSize: '1rem' }} />;
      case 'down':
        return <TrendingDownIcon sx={{ color: '#ff4444', fontSize: '1rem' }} />;
      case 'flat':
        return <TrendingFlatIcon sx={{ color: '#ffaa00', fontSize: '1rem' }} />;
      default:
        return null;
    }
  };

  // Get progress text
  const getProgressText = (progress) => {
    if (!progress) return '';

    const { type, direction, value } = progress;
    
    if (direction === 'flat') return 'Same as last time';
    
    const directionText = direction === 'up' ? '+' : '-';
    const unit = type === 'weight' ? 'lbs' : 'reps';
    
    return `${directionText}${value} ${unit}`;
  };

  return (
    <Card
      sx={{
        background: 'linear-gradient(135deg, #1a1a1a, #2a2a2a)',
        border: '1px solid #333',
        borderRadius: 2,
        mb: 2
      }}
    >
      <CardContent>
        {/* Exercise Header */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h6" sx={{ fontWeight: 700, color: '#ff4444' }}>
            {exercise.name}
          </Typography>
          <Box display="flex" gap={1}>
            <Chip
              label={`${exercise.sets.filter(set => set.completed).length}/${exercise.sets.length} sets`}
              size="small"
              sx={{ background: 'rgba(255, 68, 68, 0.2)', color: '#ff4444' }}
            />
            <Button
              variant="outlined"
              size="small"
              startIcon={<AddIcon />}
              onClick={handleAddSet}
              sx={{
                borderColor: '#ff4444',
                color: '#ff4444',
                '&:hover': {
                  borderColor: '#ff6666',
                  background: 'rgba(255, 68, 68, 0.1)'
                }
              }}
            >
              Add Set
            </Button>
          </Box>
        </Box>

        {/* Sets */}
        <Box>
          {exercise.sets.map((set, setIndex) => {
            const progress = getProgressIndicator(setIndex, set);
            const isEditing = editingSet === setIndex;

            return (
              <motion.div
                key={setIndex}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: setIndex * 0.1 }}
              >
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2,
                    p: 2,
                    mb: 2,
                    background: set.completed 
                      ? 'linear-gradient(135deg, rgba(0, 255, 136, 0.1), rgba(0, 204, 102, 0.1))'
                      : 'rgba(255, 255, 255, 0.02)',
                    border: set.completed 
                      ? '1px solid rgba(0, 255, 136, 0.3)'
                      : '1px solid #333',
                    borderRadius: 2,
                    '&:hover': {
                      background: set.completed 
                        ? 'linear-gradient(135deg, rgba(0, 255, 136, 0.15), rgba(0, 204, 102, 0.15))'
                        : 'rgba(255, 255, 255, 0.05)'
                    }
                  }}
                >
                  {/* Set Number */}
                  <Box
                    sx={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      background: set.completed 
                        ? 'linear-gradient(135deg, #00ff88, #00cc66)'
                        : 'linear-gradient(135deg, #333, #555)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                      color: set.completed ? '#000' : '#fff'
                    }}
                  >
                    {setIndex + 1}
                  </Box>

                  {/* Weight Input */}
                  <Box flex={1}>
                    <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                      Weight (lbs)
                    </Typography>
                    {isEditing ? (
                      <TextField
                        value={tempWeight}
                        onChange={(e) => setTempWeight(e.target.value)}
                        size="small"
                        type="number"
                        inputProps={{ min: 0, step: 0.5 }}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            background: '#1a1a1a',
                            border: '1px solid #333'
                          }
                        }}
                      />
                    ) : (
                      <TextField
                        value={set.weight}
                        onChange={(e) => handleWeightChange(setIndex, e.target.value)}
                        size="small"
                        type="number"
                        inputProps={{ min: 0, step: 0.5 }}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            background: '#1a1a1a',
                            border: '1px solid #333'
                          }
                        }}
                      />
                    )}
                  </Box>

                  {/* Reps Input */}
                  <Box flex={1}>
                    <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                      Reps
                    </Typography>
                    {isEditing ? (
                      <TextField
                        value={tempReps}
                        onChange={(e) => setTempReps(e.target.value)}
                        size="small"
                        type="number"
                        inputProps={{ min: 0, step: 1 }}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            background: '#1a1a1a',
                            border: '1px solid #333'
                          }
                        }}
                      />
                    ) : (
                      <TextField
                        value={set.reps}
                        onChange={(e) => handleRepsChange(setIndex, e.target.value)}
                        size="small"
                        type="number"
                        inputProps={{ min: 0, step: 1 }}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            background: '#1a1a1a',
                            border: '1px solid #333'
                          }
                        }}
                      />
                    )}
                  </Box>

                  {/* Progress Indicator */}
                  {progress && (
                    <Box display="flex" alignItems="center" gap={1}>
                      {getProgressIcon(progress)}
                      <Typography variant="caption" color="text.secondary">
                        {getProgressText(progress)}
                      </Typography>
                    </Box>
                  )}

                  {/* Action Buttons */}
                  <Box display="flex" gap={1}>
                    {isEditing ? (
                      <>
                        <Tooltip title="Save">
                          <IconButton
                            size="small"
                            onClick={saveEditing}
                            sx={{ color: '#00ff88' }}
                          >
                            <CheckIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Cancel">
                          <IconButton
                            size="small"
                            onClick={cancelEditing}
                            sx={{ color: '#ff4444' }}
                          >
                            <UncheckIcon />
                          </IconButton>
                        </Tooltip>
                      </>
                    ) : (
                      <>
                        <Tooltip title="Edit">
                          <IconButton
                            size="small"
                            onClick={() => startEditing(setIndex)}
                            sx={{ color: '#ffaa00' }}
                          >
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title={set.completed ? 'Mark as incomplete' : 'Mark as complete'}>
                          <IconButton
                            size="small"
                            onClick={() => handleCompleteSet(setIndex)}
                            sx={{ color: set.completed ? '#00ff88' : '#666' }}
                          >
                            {set.completed ? <CheckIcon /> : <UncheckIcon />}
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Remove set">
                          <IconButton
                            size="small"
                            onClick={() => handleRemoveSet(setIndex)}
                            sx={{ color: '#ff4444' }}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      </>
                    )}
                  </Box>
                </Box>
              </motion.div>
            );
          })}
        </Box>

        {/* Exercise Summary */}
        <Box mt={3} p={2} sx={{ background: 'rgba(255, 68, 68, 0.1)', borderRadius: 2 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
            Exercise Summary:
          </Typography>
          <Box display="flex" gap={2} flexWrap="wrap">
            <Chip
              label={`Total Volume: ${exercise.sets
                .filter(set => set.completed)
                .reduce((sum, set) => sum + (set.weight * set.reps), 0)} lbs`}
              size="small"
              sx={{ background: 'rgba(255, 68, 68, 0.2)', color: '#ff4444' }}
            />
            <Chip
              label={`Total Reps: ${exercise.sets
                .filter(set => set.completed)
                .reduce((sum, set) => sum + set.reps, 0)}`}
              size="small"
              sx={{ background: 'rgba(255, 68, 68, 0.2)', color: '#ff4444' }}
            />
            <Chip
              label={`Best Set: ${Math.max(...exercise.sets
                .filter(set => set.completed)
                .map(set => set.weight), 0)} lbs`}
              size="small"
              sx={{ background: 'rgba(255, 68, 68, 0.2)', color: '#ff4444' }}
            />
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}