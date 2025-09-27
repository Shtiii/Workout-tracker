'use client';

import {
  Paper,
  Typography,
  Button
} from '@mui/material';

/**
 * WorkoutActions Component
 * Displays finish workout button and empty state
 */
export default function WorkoutActions({
  activeWorkout,
  onFinishWorkout
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
        <Typography color="text.secondary">
          Select a program or add custom exercises to start your workout! 💪
        </Typography>
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
      <Typography
        variant="h6"
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

      <Button
        variant="contained"
        onClick={onFinishWorkout}
        disabled={!activeWorkout.exercises.some(ex => ex.sets.length > 0)}
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
}
