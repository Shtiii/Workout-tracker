'use client';

import { memo } from 'react';
import {
  Paper,
  Typography,
  Button,
  Box
} from '@mui/material';
import { motion } from 'framer-motion';

/**
 * Workout Actions Component
 * Handles workout completion and empty state
 */
const WorkoutActions = memo(function WorkoutActions({
  activeWorkout,
  onFinishWorkout,
  onAddExercise
}) {
  if (activeWorkout.exercises.length === 0) {
    return (
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
        <Typography color="text.secondary" sx={{ mb: 3 }}>
          Select a program or add custom exercises to start your workout! 💪
        </Typography>
        <Button
          variant="contained"
          onClick={onAddExercise}
          aria-label="Add exercise to workout"
          sx={{
            background: 'linear-gradient(135deg, #ff4444, #cc0000)',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: 1,
            px: 4,
            py: 1.5,
            '&:hover': {
              background: 'linear-gradient(135deg, #ff6666, #ee0000)',
              transform: 'translateY(-2px)'
            }
          }}
        >
          Add Exercise
        </Button>
      </Paper>
    );
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
      <Button
        variant="contained"
        onClick={onFinishWorkout}
        disabled={!activeWorkout.exercises.some(ex => ex.sets.length > 0)}
        aria-label="Finish and save workout"
        sx={{
          background: 'linear-gradient(135deg, #ff4444, #cc0000)',
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: 1,
          width: '100%',
          height: { xs: '64px', sm: '56px' },
          fontSize: { xs: '1.3rem', sm: '1.2rem' },
          boxShadow: '0 4px 20px rgba(255, 68, 68, 0.3)',
          '&:hover': {
            background: 'linear-gradient(135deg, #ff6666, #ee0000)',
            boxShadow: '0 6px 25px rgba(255, 68, 68, 0.4)',
            transform: 'translateY(-2px)'
          },
          '&:active': {
            transform: 'translateY(0px)'
          },
          transition: 'all 0.2s ease'
        }}
      >
        🏆 FINISH & SAVE WORKOUT
      </Button>
    </Paper>
  );
});

export default WorkoutActions;