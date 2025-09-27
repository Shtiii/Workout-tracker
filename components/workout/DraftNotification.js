'use client';

import {
  Paper,
  Typography,
  Box,
  Button
} from '@mui/material';

/**
 * DraftNotification Component
 * Shows notification when a draft workout is loaded
 */
export default function DraftNotification({
  hasDraftLoaded,
  activeWorkout,
  onClearDraft
}) {
  if (!hasDraftLoaded || activeWorkout.exercises.length === 0) {
    return null;
  }

  return (
    <Paper
      sx={{
        background: 'linear-gradient(135deg, #1a1a1a, rgba(0, 255, 136, 0.1))',
        border: '2px solid #00ff88',
        p: 2,
        mb: 3
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h6" sx={{ color: '#00ff88', fontWeight: 700, mb: 0.5 }}>
            🔄 Draft Workout Loaded
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Your previous workout was restored. Auto-saving every 2 seconds.
          </Typography>
        </Box>
        <Button
          variant="outlined"
          onClick={onClearDraft}
          sx={{
            color: '#00ff88',
            borderColor: '#00ff88',
            '&:hover': {
              backgroundColor: 'rgba(0, 255, 136, 0.1)',
              borderColor: '#00ff88'
            }
          }}
        >
          Clear Draft
        </Button>
      </Box>
    </Paper>
  );
}
