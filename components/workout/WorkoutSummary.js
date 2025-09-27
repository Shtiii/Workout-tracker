'use client';

import { useMemo } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Chip,
  LinearProgress,
  Divider
} from '@mui/material';
import {
  Timer as TimerIcon,
  FitnessCenter as FitnessIcon,
  TrendingUp as TrendingUpIcon,
  LocalFireDepartment as FireIcon,
  Speed as SpeedIcon
} from '@mui/icons-material';
import { motion } from 'framer-motion';

/**
 * Workout Summary Component
 * Displays comprehensive workout statistics and insights
 */
export default function WorkoutSummary({
  workout,
  previousWorkout = null,
  showProgress = true
}) {
  // Calculate workout statistics
  const workoutStats = useMemo(() => {
    if (!workout) return null;

    const totalSets = workout.exercises.reduce((sum, exercise) => 
      sum + exercise.sets.filter(set => set.completed).length, 0
    );

    const totalReps = workout.exercises.reduce((sum, exercise) => 
      sum + exercise.sets
        .filter(set => set.completed)
        .reduce((exerciseSum, set) => exerciseSum + set.reps, 0), 0
    );

    const totalVolume = workout.exercises.reduce((sum, exercise) => 
      sum + exercise.sets
        .filter(set => set.completed)
        .reduce((exerciseSum, set) => exerciseSum + (set.weight * set.reps), 0), 0
    );

    const totalExercises = workout.exercises.length;

    const duration = workout.startTime && workout.endTime 
      ? Math.round((new Date(workout.endTime) - new Date(workout.startTime)) / (1000 * 60))
      : 0;

    const averageWeight = totalSets > 0 
      ? workout.exercises.reduce((sum, exercise) => 
          sum + exercise.sets
            .filter(set => set.completed)
            .reduce((exerciseSum, set) => exerciseSum + set.weight, 0), 0
        ) / totalSets
      : 0;

    const bestSet = workout.exercises.reduce((best, exercise) => {
      const exerciseBest = exercise.sets
        .filter(set => set.completed)
        .reduce((currentBest, set) => 
          set.weight > currentBest.weight ? set : currentBest, 
          { weight: 0, reps: 0 }
        );
      return exerciseBest.weight > best.weight ? exerciseBest : best;
    }, { weight: 0, reps: 0 });

    return {
      totalSets,
      totalReps,
      totalVolume,
      totalExercises,
      duration,
      averageWeight,
      bestSet
    };
  }, [workout]);

  // Calculate progress compared to previous workout
  const progressData = useMemo(() => {
    if (!workoutStats || !previousWorkout || !showProgress) return null;

    const prevStats = {
      totalSets: previousWorkout.exercises.reduce((sum, exercise) => 
        sum + exercise.sets.filter(set => set.completed).length, 0
      ),
      totalReps: previousWorkout.exercises.reduce((sum, exercise) => 
        sum + exercise.sets
          .filter(set => set.completed)
          .reduce((exerciseSum, set) => exerciseSum + set.reps, 0), 0
      ),
      totalVolume: previousWorkout.exercises.reduce((sum, exercise) => 
        sum + exercise.sets
          .filter(set => set.completed)
          .reduce((exerciseSum, set) => exerciseSum + (set.weight * set.reps), 0), 0
      ),
      duration: previousWorkout.startTime && previousWorkout.endTime 
        ? Math.round((new Date(previousWorkout.endTime) - new Date(previousWorkout.startTime)) / (1000 * 60))
        : 0
    };

    return {
      setsChange: workoutStats.totalSets - prevStats.totalSets,
      repsChange: workoutStats.totalReps - prevStats.totalReps,
      volumeChange: workoutStats.totalVolume - prevStats.totalVolume,
      durationChange: workoutStats.duration - prevStats.duration,
      setsChangePercent: prevStats.totalSets > 0 
        ? ((workoutStats.totalSets - prevStats.totalSets) / prevStats.totalSets) * 100
        : 0,
      repsChangePercent: prevStats.totalReps > 0 
        ? ((workoutStats.totalReps - prevStats.totalReps) / prevStats.totalReps) * 100
        : 0,
      volumeChangePercent: prevStats.totalVolume > 0 
        ? ((workoutStats.totalVolume - prevStats.totalVolume) / prevStats.totalVolume) * 100
        : 0
    };
  }, [workoutStats, previousWorkout, showProgress]);

  // Format time
  const formatTime = (minutes) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  // Format weight
  const formatWeight = (weight) => {
    return `${weight.toFixed(1)} lbs`;
  };

  // Format volume
  const formatVolume = (volume) => {
    if (volume < 1000) return `${volume.toFixed(0)} lbs`;
    return `${(volume / 1000).toFixed(1)}k lbs`;
  };

  // Get progress color
  const getProgressColor = (change) => {
    if (change > 0) return '#00ff88';
    if (change < 0) return '#ff4444';
    return '#ffaa00';
  };

  // Get progress icon
  const getProgressIcon = (change) => {
    if (change > 0) return <TrendingUpIcon sx={{ color: '#00ff88' }} />;
    if (change < 0) return <TrendingUpIcon sx={{ color: '#ff4444', transform: 'rotate(180deg)' }} />;
    return <TrendingUpIcon sx={{ color: '#ffaa00' }} />;
  };

  // Get progress text
  const getProgressText = (change, isPercent = false) => {
    const absChange = Math.abs(change);
    const sign = change > 0 ? '+' : change < 0 ? '-' : '';
    const unit = isPercent ? '%' : '';
    return `${sign}${absChange.toFixed(isPercent ? 1 : 0)}${unit}`;
  };

  if (!workoutStats) {
    return (
      <Card
        sx={{
          background: 'linear-gradient(135deg, #1a1a1a, #2a2a2a)',
          border: '1px solid #333',
          borderRadius: 2
        }}
      >
        <CardContent>
          <Typography variant="h6" sx={{ fontWeight: 700, textAlign: 'center' }}>
            No workout data available
          </Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      sx={{
        background: 'linear-gradient(135deg, #1a1a1a, #2a2a2a)',
        border: '1px solid #333',
        borderRadius: 2
      }}
    >
      <CardContent>
        {/* Header */}
        <Typography variant="h6" sx={{ fontWeight: 700, mb: 3, textAlign: 'center' }}>
          🏋️ Workout Summary
        </Typography>

        {/* Main Stats Grid */}
        <Grid container spacing={3} mb={3}>
          {/* Total Sets */}
          <Grid item xs={6} sm={3}>
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <Box textAlign="center">
                <Typography variant="h4" sx={{ fontWeight: 900, color: '#ff4444', mb: 1 }}>
                  {workoutStats.totalSets}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  Total Sets
                </Typography>
                {progressData && (
                  <Box display="flex" alignItems="center" justifyContent="center" gap={1}>
                    {getProgressIcon(progressData.setsChange)}
                    <Typography 
                      variant="caption" 
                      sx={{ color: getProgressColor(progressData.setsChange) }}
                    >
                      {getProgressText(progressData.setsChange)}
                    </Typography>
                  </Box>
                )}
              </Box>
            </motion.div>
          </Grid>

          {/* Total Reps */}
          <Grid item xs={6} sm={3}>
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <Box textAlign="center">
                <Typography variant="h4" sx={{ fontWeight: 900, color: '#00ff88', mb: 1 }}>
                  {workoutStats.totalReps}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  Total Reps
                </Typography>
                {progressData && (
                  <Box display="flex" alignItems="center" justifyContent="center" gap={1}>
                    {getProgressIcon(progressData.repsChange)}
                    <Typography 
                      variant="caption" 
                      sx={{ color: getProgressColor(progressData.repsChange) }}
                    >
                      {getProgressText(progressData.repsChange)}
                    </Typography>
                  </Box>
                )}
              </Box>
            </motion.div>
          </Grid>

          {/* Total Volume */}
          <Grid item xs={6} sm={3}>
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <Box textAlign="center">
                <Typography variant="h4" sx={{ fontWeight: 900, color: '#ffaa00', mb: 1 }}>
                  {formatVolume(workoutStats.totalVolume)}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  Total Volume
                </Typography>
                {progressData && (
                  <Box display="flex" alignItems="center" justifyContent="center" gap={1}>
                    {getProgressIcon(progressData.volumeChange)}
                    <Typography 
                      variant="caption" 
                      sx={{ color: getProgressColor(progressData.volumeChange) }}
                    >
                      {getProgressText(progressData.volumeChange)}
                    </Typography>
                  </Box>
                )}
              </Box>
            </motion.div>
          </Grid>

          {/* Duration */}
          <Grid item xs={6} sm={3}>
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <Box textAlign="center">
                <Typography variant="h4" sx={{ fontWeight: 900, color: '#0088ff', mb: 1 }}>
                  {formatTime(workoutStats.duration)}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  Duration
                </Typography>
                {progressData && (
                  <Box display="flex" alignItems="center" justifyContent="center" gap={1}>
                    {getProgressIcon(progressData.durationChange)}
                    <Typography 
                      variant="caption" 
                      sx={{ color: getProgressColor(progressData.durationChange) }}
                    >
                      {getProgressText(progressData.durationChange)}
                    </Typography>
                  </Box>
                )}
              </Box>
            </motion.div>
          </Grid>
        </Grid>

        <Divider sx={{ mb: 3, borderColor: '#333' }} />

        {/* Additional Stats */}
        <Grid container spacing={3} mb={3}>
          {/* Exercises */}
          <Grid item xs={6} sm={3}>
            <Box textAlign="center">
              <Typography variant="h6" sx={{ fontWeight: 700, color: '#ff4444', mb: 1 }}>
                {workoutStats.totalExercises}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Exercises
              </Typography>
            </Box>
          </Grid>

          {/* Average Weight */}
          <Grid item xs={6} sm={3}>
            <Box textAlign="center">
              <Typography variant="h6" sx={{ fontWeight: 700, color: '#00ff88', mb: 1 }}>
                {formatWeight(workoutStats.averageWeight)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Avg Weight
              </Typography>
            </Box>
          </Grid>

          {/* Best Set */}
          <Grid item xs={6} sm={3}>
            <Box textAlign="center">
              <Typography variant="h6" sx={{ fontWeight: 700, color: '#ffaa00', mb: 1 }}>
                {formatWeight(workoutStats.bestSet.weight)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Best Set
              </Typography>
            </Box>
          </Grid>

          {/* Workout Intensity */}
          <Grid item xs={6} sm={3}>
            <Box textAlign="center">
              <Typography variant="h6" sx={{ fontWeight: 700, color: '#ff00ff', mb: 1 }}>
                {workoutStats.duration > 0 
                  ? Math.round(workoutStats.totalVolume / workoutStats.duration)
                  : 0
                }
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Volume/min
              </Typography>
            </Box>
          </Grid>
        </Grid>

        {/* Progress Summary */}
        {progressData && showProgress && (
          <Box>
            <Divider sx={{ mb: 3, borderColor: '#333' }} />
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2, textAlign: 'center' }}>
              Progress vs Previous Workout
            </Typography>
            
            <Grid container spacing={2}>
              <Grid item xs={12} sm={4}>
                <Box textAlign="center">
                  <Typography variant="body2" color="text.secondary" mb={1}>
                    Sets Progress
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={Math.min(Math.abs(progressData.setsChangePercent), 100)}
                    sx={{
                      height: 8,
                      borderRadius: 4,
                      background: '#333',
                      '& .MuiLinearProgress-bar': {
                        background: getProgressColor(progressData.setsChange)
                      }
                    }}
                  />
                  <Typography variant="caption" sx={{ color: getProgressColor(progressData.setsChange), mt: 1, display: 'block' }}>
                    {getProgressText(progressData.setsChangePercent, true)}
                  </Typography>
                </Box>
              </Grid>

              <Grid item xs={12} sm={4}>
                <Box textAlign="center">
                  <Typography variant="body2" color="text.secondary" mb={1}>
                    Reps Progress
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={Math.min(Math.abs(progressData.repsChangePercent), 100)}
                    sx={{
                      height: 8,
                      borderRadius: 4,
                      background: '#333',
                      '& .MuiLinearProgress-bar': {
                        background: getProgressColor(progressData.repsChange)
                      }
                    }}
                  />
                  <Typography variant="caption" sx={{ color: getProgressColor(progressData.repsChange), mt: 1, display: 'block' }}>
                    {getProgressText(progressData.repsChangePercent, true)}
                  </Typography>
                </Box>
              </Grid>

              <Grid item xs={12} sm={4}>
                <Box textAlign="center">
                  <Typography variant="body2" color="text.secondary" mb={1}>
                    Volume Progress
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={Math.min(Math.abs(progressData.volumeChangePercent), 100)}
                    sx={{
                      height: 8,
                      borderRadius: 4,
                      background: '#333',
                      '& .MuiLinearProgress-bar': {
                        background: getProgressColor(progressData.volumeChange)
                      }
                    }}
                  />
                  <Typography variant="caption" sx={{ color: getProgressColor(progressData.volumeChange), mt: 1, display: 'block' }}>
                    {getProgressText(progressData.volumeChangePercent, true)}
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Box>
        )}

        {/* Workout Date */}
        <Box mt={3} textAlign="center">
          <Typography variant="caption" color="text.secondary">
            Completed: {new Date(workout.completedAt).toLocaleDateString()} at{' '}
            {new Date(workout.completedAt).toLocaleTimeString()}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
}
