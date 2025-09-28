'use client';

import {
  Paper,
  Typography,
  Box,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton
} from '@mui/material';
import { Delete as DeleteIcon } from '@mui/icons-material';
import { motion } from 'framer-motion';

/**
 * HistoryView component displays workout history
 * @param {Object} props - Component props
 * @param {Array} props.allWorkouts - Array of all workout sessions
 * @param {Function} props.onDeleteWorkout - Callback for deleting a workout
 */
export default function HistoryView({ allWorkouts, onDeleteWorkout }) {
  const sortedWorkouts = [...allWorkouts].sort((a, b) => b.completedAt - a.completedAt);

  if (sortedWorkouts.length === 0) {
    return (
      <Paper
        sx={{
          background: 'rgba(26, 26, 26, 0.5)',
          border: '1px solid #333',
          p: 4,
          textAlign: 'center'
        }}
      >
        <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
          No workout history found
        </Typography>
        <Typography color="text.secondary">
          Complete some workouts to see your history here!
        </Typography>
      </Paper>
    );
  }

  return (
    <Paper
      sx={{
        background: '#1a1a1a',
        border: '1px solid #333',
        p: 3
      }}
    >
      <Typography
        variant="h6"
        sx={{
          mb: 3,
          fontWeight: 700,
          textAlign: 'center',
          fontSize: { xs: '1.1rem', sm: '1.25rem' },
          lineHeight: 1.2
        }}
      >
        WORKOUT HISTORY
      </Typography>

      <List>
        {sortedWorkouts.map((workout) => (
          <motion.div
            key={workout.id}
            whileHover={{ x: 5 }}
            transition={{ duration: 0.2 }}
          >
            <ListItem
              sx={{
                bgcolor: 'rgba(26, 26, 26, 0.5)',
                border: '1px solid #333',
                borderRadius: 1,
                mb: 2,
                '&:hover': {
                  borderColor: 'primary.main',
                  bgcolor: 'rgba(255, 68, 68, 0.05)'
                }
              }}
            >
              <ListItemText
                primary={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>
                      {workout.programName || 'Custom Workout'}
                    </Typography>
                    <Typography variant="caption" sx={{
                      color: 'text.secondary',
                      fontSize: '0.75rem',
                      bgcolor: 'rgba(255, 68, 68, 0.1)',
                      px: 1,
                      py: 0.5,
                      borderRadius: 1
                    }}>
                      {workout.completedAt.toLocaleDateString('en-GB', {
                        weekday: 'short',
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric'
                      })}
                    </Typography>
                  </Box>
                }
                secondary={
                  <Box sx={{ mt: 1 }}>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      Duration: {Math.round((workout.endTime?.toDate() - workout.startTime?.toDate()) / (1000 * 60))} min |
                      Exercises: {workout.exercises?.length || 0}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      {workout.exercises?.slice(0, 3).map((exercise, idx) => (
                        <Typography
                          key={idx}
                          variant="caption"
                          sx={{
                            bgcolor: 'rgba(255, 170, 0, 0.1)',
                            color: '#ffaa00',
                            px: 1,
                            py: 0.5,
                            borderRadius: 1,
                            fontSize: '0.7rem'
                          }}
                        >
                          {exercise.name}
                        </Typography>
                      ))}
                      {workout.exercises?.length > 3 && (
                        <Typography
                          variant="caption"
                          sx={{
                            color: 'text.secondary',
                            fontStyle: 'italic'
                          }}
                        >
                          +{workout.exercises.length - 3} more
                        </Typography>
                      )}
                    </Box>
                  </Box>
                }
              />
              <ListItemSecondaryAction>
                <IconButton
                  edge="end"
                  onClick={() => onDeleteWorkout(workout.id)}
                  aria-label={`Delete workout: ${workout.programName || 'Custom Workout'}`}
                  sx={{
                    color: '#ff4444',
                    '&:focus': {
                      outline: '2px solid #ff4444',
                      outlineOffset: '2px'
                    }
                  }}
                >
                  <DeleteIcon />
                </IconButton>
              </ListItemSecondaryAction>
            </ListItem>
          </motion.div>
        ))}
      </List>
    </Paper>
  );
}
