'use client';

import { useState, useEffect, memo } from 'react';
import {
  Paper,
  Typography,
  Button,
  Box,
  IconButton
} from '@mui/material';
import {
  PlayArrow as PlayIcon,
  Pause as PauseIcon,
  Stop as StopIcon,
  Timer as TimerIcon
} from '@mui/icons-material';
import { motion } from 'framer-motion';

/**
 * Workout Timer Component
 * Handles the main workout timer functionality
 */
const WorkoutTimer = memo(function WorkoutTimer({
  timer,
  onStartTimer,
  onPauseTimer,
  onStopTimer,
  onResetTimer
}) {
  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Paper
      sx={{
        background: 'linear-gradient(135deg, #1a1a1a, rgba(255, 68, 68, 0.1))',
        border: '1px solid #333',
        p: 3,
        mb: 3,
        textAlign: 'center'
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2 }}>
        <TimerIcon sx={{ mr: 1, color: 'primary.main' }} aria-hidden="true" />
        <Typography
          variant="h6"
          component="h2"
          sx={{
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: 1
          }}
        >
          Workout Timer
        </Typography>
      </Box>

      <Typography
        variant="h2"
        component="div"
        role="timer"
        aria-live="polite"
        aria-label={`Workout time: ${formatTime(timer.time)}`}
        sx={{
          fontWeight: 900,
          background: 'linear-gradient(135deg, #ff4444, #ffaa00)',
          backgroundClip: 'text',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          mb: 3,
          fontSize: { xs: '2.5rem', sm: '3.5rem' },
          lineHeight: 1
        }}
      >
        {formatTime(timer.time)}
      </Typography>

      <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
        {!timer.isRunning ? (
          <Button
            variant="contained"
            onClick={onStartTimer}
            startIcon={<PlayIcon aria-hidden="true" />}
            aria-label="Start workout timer"
            sx={{
              background: 'linear-gradient(135deg, #00ff88, #00cc66)',
              color: '#000',
              fontWeight: 700,
              px: 4,
              py: 1.5,
              '&:hover': {
                background: 'linear-gradient(135deg, #00ff99, #00dd77)',
                transform: 'translateY(-2px)'
              }
            }}
          >
            Start
          </Button>
        ) : (
          <Button
            variant="contained"
            onClick={onPauseTimer}
            startIcon={<PauseIcon aria-hidden="true" />}
            aria-label="Pause workout timer"
            sx={{
              background: 'linear-gradient(135deg, #ffaa00, #ff8800)',
              color: '#000',
              fontWeight: 700,
              px: 4,
              py: 1.5,
              '&:hover': {
                background: 'linear-gradient(135deg, #ffbb11, #ff9911)',
                transform: 'translateY(-2px)'
              }
            }}
          >
            Pause
          </Button>
        )}

        <Button
          variant="outlined"
          onClick={onStopTimer}
          startIcon={<StopIcon aria-hidden="true" />}
          aria-label="Stop workout timer"
          sx={{
            borderColor: '#ff4444',
            color: '#ff4444',
            fontWeight: 700,
            px: 4,
            py: 1.5,
            '&:hover': {
              borderColor: '#ff6666',
              backgroundColor: 'rgba(255, 68, 68, 0.1)',
              transform: 'translateY(-2px)'
            }
          }}
        >
          Stop
        </Button>

        {timer.time > 0 && (
          <Button
            variant="text"
            onClick={onResetTimer}
            aria-label="Reset workout timer"
            sx={{
              color: 'text.secondary',
              fontWeight: 600,
              '&:hover': {
                color: 'text.primary',
                backgroundColor: 'rgba(255, 255, 255, 0.05)'
              }
            }}
          >
            Reset
          </Button>
        )}
      </Box>
    </Paper>
  );
});

export default WorkoutTimer;