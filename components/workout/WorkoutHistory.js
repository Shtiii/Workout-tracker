'use client';

import {
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  Box,
  Chip
} from '@mui/material';

/**
 * WorkoutHistory Component
 * Displays recent workouts for quick selection
 */
export default function WorkoutHistory({
  recentWorkouts,
  onLoadWorkout,
  getSmartDefaults
}) {
  if (recentWorkouts.length === 0) {
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
        sx={{
          mb: 2,
          fontWeight: 700,
          textTransform: 'uppercase',
          fontSize: { xs: '1rem', sm: '1.25rem' },
          textAlign: 'center',
          background: 'linear-gradient(135deg, #ff4444, #ffaa00)',
          backgroundClip: 'text',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}
      >
        Recent Workouts
      </Typography>
      <Grid container spacing={2}>
        {recentWorkouts.map((workout) => (
          <Grid item xs={12} key={workout.id}>
            <Card
              onClick={() => {
                const exercisesWithSets = workout.exercises.map(exercise => {
                  const smartDefaults = getSmartDefaults(exercise.name);
                  return {
                    name: exercise.name,
                    targetSets: exercise.targetSets || 3,
                    targetReps: exercise.targetReps || 10,
                    sets: [{
                      weight: smartDefaults.weight,
                      reps: smartDefaults.reps,
                      completed: false,
                      rpe: ''
                    }]
                  };
                });

                onLoadWorkout({
                  programId: workout.programId || '',
                  programName: workout.programName || 'Recent Workout',
                  exercises: exercisesWithSets,
                  startTime: new Date(),
                  endTime: null
                });
              }}
              sx={{
                background: 'linear-gradient(135deg, rgba(26, 26, 26, 0.9), rgba(255, 68, 68, 0.05))',
                border: '1px solid #333',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                '&:hover': {
                  borderColor: 'primary.main',
                  boxShadow: '0 0 20px rgba(255, 68, 68, 0.2)',
                  transform: 'translateY(-2px)'
                }
              }}
            >
              <CardContent sx={{ py: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box sx={{ flex: 1 }}>
                    <Typography
                      variant="subtitle1"
                      sx={{
                        fontWeight: 700,
                        color: '#ff4444',
                        fontSize: { xs: '0.9rem', sm: '1rem' },
                        mb: 0.5
                      }}
                    >
                      {workout.programName || 'Custom Workout'}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        color: 'text.secondary',
                        fontSize: { xs: '0.75rem', sm: '0.8rem' },
                        mb: 1
                      }}
                    >
                      {workout.completedAt.toLocaleDateString()} • {workout.exercises?.length || 0} exercises
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      {workout.exercises?.slice(0, 3).map((exercise, idx) => (
                        <Chip
                          key={idx}
                          label={exercise.name}
                          size="small"
                          sx={{
                            bgcolor: 'rgba(255, 170, 0, 0.1)',
                            color: '#ffaa00',
                            fontSize: '0.65rem',
                            height: '20px',
                            '& .MuiChip-label': {
                              px: 1
                            }
                          }}
                        />
                      ))}
                      {workout.exercises?.length > 3 && (
                        <Chip
                          label={`+${workout.exercises.length - 3} more`}
                          size="small"
                          sx={{
                            bgcolor: 'rgba(255, 68, 68, 0.1)',
                            color: '#ff4444',
                            fontSize: '0.65rem',
                            height: '20px',
                            '& .MuiChip-label': {
                              px: 1
                            }
                          }}
                        />
                      )}
                    </Box>
                  </Box>
                  <Box sx={{ ml: 2 }}>
                    <Typography
                      variant="caption"
                      sx={{
                        color: '#00ff88',
                        fontWeight: 700,
                        fontSize: '0.7rem',
                        textTransform: 'uppercase'
                      }}
                    >
                      Click to Load
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Paper>
  );
}