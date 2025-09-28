'use client';

import {
  Paper,
  Typography,
  Box,
  Button
} from '@mui/material';

/**
 * RestTimer Component
 * Displays and manages rest timer functionality
 */
export default function RestTimer({
  restTimer,
  onStopRestTimer,
  onStartRestTimer
}) {
  const formatRestTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!restTimer.isActive) {
    return null;
  }

  return (
    <Paper
      sx={{
        background: 'linear-gradient(135deg, #1a1a1a, rgba(255, 170, 0, 0.1))',
        border: '2px solid #ffaa00',
        p: 3,
        mb: 3,
        textAlign: 'center',
        position: 'sticky',
        top: 16,
        zIndex: 100
      }}
    >
      <Typography variant="h6" sx={{ mb: 1, color: '#ffaa00', fontWeight: 700 }}>
        💤 REST TIME
      </Typography>
      <Typography
        variant="h2"
        sx={{
          fontWeight: 900,
          color: restTimer.timeLeft <= 10 ? '#ff4444' : '#ffaa00',
          mb: 2,
          fontSize: { xs: '2rem', sm: '3rem' },
          animation: restTimer.timeLeft <= 10 ? 'pulse 1s infinite' : 'none'
        }}
      >
        {formatRestTime(restTimer.timeLeft)}
      </Typography>
      <Box sx={{ display: 'flex', justifyContent: 'center', gap: { xs: 1, sm: 2 }, flexWrap: 'wrap' }}>
        <Button
          variant="contained"
          onClick={onStopRestTimer}
          sx={{
            background: 'linear-gradient(135deg, #ff4444, #cc0000)',
            fontWeight: 700,
            fontSize: { xs: '0.8rem', sm: '0.9rem' },
            px: { xs: 2, sm: 3 }
          }}
        >
          SKIP REST
        </Button>
        <Button
          variant="outlined"
          onClick={() => onStartRestTimer(60)}
          sx={{
            borderColor: '#ffaa00',
            color: '#ffaa00',
            fontSize: { xs: '0.8rem', sm: '0.9rem' },
            px: { xs: 1.5, sm: 2 }
          }}
        >
          60s
        </Button>
        <Button
          variant="outlined"
          onClick={() => onStartRestTimer(90)}
          sx={{
            borderColor: '#ffaa00',
            color: '#ffaa00',
            fontSize: { xs: '0.8rem', sm: '0.9rem' },
            px: { xs: 1.5, sm: 2 }
          }}
        >
          90s
        </Button>
        <Button
          variant="outlined"
          onClick={() => onStartRestTimer(120)}
          sx={{
            borderColor: '#ffaa00',
            color: '#ffaa00',
            fontSize: { xs: '0.8rem', sm: '0.9rem' },
            px: { xs: 1.5, sm: 2 }
          }}
        >
          120s
        </Button>
        <Button
          variant="outlined"
          onClick={() => onStartRestTimer(restTimer.timeLeft + 30)}
          sx={{
            borderColor: '#00ff88',
            color: '#00ff88',
            fontSize: { xs: '0.8rem', sm: '0.9rem' },
            px: { xs: 1.5, sm: 2 }
          }}
        >
          +30s
        </Button>
      </Box>
    </Paper>
  );
}