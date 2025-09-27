'use client';

import { memo } from 'react';
import {
  Paper,
  Typography
} from '@mui/material';
import { motion } from 'framer-motion';
import ExerciseCard from './ExerciseCard';

/**
 * Exercise List Component
 * Displays the list of exercises in the workout
 */
const ExerciseList = memo(function ExerciseList({
  exercises,
  onUpdateSet,
  onCompleteSet,
  onAddSet,
  onRemoveSet,
  onRemoveExercise,
  onMoveExercise,
  exerciseHistory = {},
  restTimer,
  onStartRestTimer,
  onStopRestTimer,
  selectedSets = {},
  onToggleSetSelection,
  bulkModeEnabled = false
}) {
  if (exercises.length === 0) {
    return null;
  }

  return (
    <Paper
      sx={{
        background: '#1a1a1a',
        border: '1px solid #333',
        p: 3,
        mb: 3
      }}
    >
      <Typography
        variant="h6"
        component="h2"
        sx={{
          mb: 3,
          fontWeight: 700,
          textTransform: 'uppercase',
          fontSize: { xs: '1.1rem', sm: '1.25rem' },
          lineHeight: 1.2,
          textAlign: 'center',
          background: 'linear-gradient(135deg, #ff4444, #ffaa00)',
          backgroundClip: 'text',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}
      >
        EXERCISES
      </Typography>
      
      {exercises.map((exercise, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          <ExerciseCard
            exercise={exercise}
            exerciseIndex={index}
            onUpdateSet={onUpdateSet}
            onCompleteSet={onCompleteSet}
            onAddSet={onAddSet}
            onRemoveSet={onRemoveSet}
            onRemoveExercise={onRemoveExercise}
            onMoveExercise={onMoveExercise}
            exerciseHistory={exerciseHistory[exercise.name] || []}
            restTimer={restTimer}
            onStartRestTimer={onStartRestTimer}
            onStopRestTimer={onStopRestTimer}
            selectedSets={selectedSets[index] || {}}
            onToggleSetSelection={onToggleSetSelection}
            bulkModeEnabled={bulkModeEnabled}
          />
        </motion.div>
      ))}
    </Paper>
  );
});

export default ExerciseList;
