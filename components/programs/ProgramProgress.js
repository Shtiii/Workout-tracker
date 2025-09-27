'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  LinearProgress,
  Chip,
  Button,
  IconButton,
  Tooltip,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Divider,
  Avatar,
  Badge
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  CheckCircle as CheckIcon,
  RadioButtonUnchecked as UncheckIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  TrendingFlat as TrendingFlatIcon,
  CalendarToday as CalendarIcon,
  FitnessCenter as FitnessIcon,
  Timer as TimerIcon,
  Assessment as AssessmentIcon
} from '@mui/icons-material';
import { motion } from 'framer-motion';

/**
 * Program Progress Component
 * Tracks and displays progress through a workout program
 */
export default function ProgramProgress({
  program,
  workoutHistory = [],
  currentWeek = 1,
  onCompleteWorkout,
  onSkipWorkout,
  onMarkComplete
}) {
  const [expandedWorkout, setExpandedWorkout] = useState(null);
  const [completedWorkouts, setCompletedWorkouts] = useState(new Set());

  // Calculate program progress
  const programProgress = useMemo(() => {
    if (!program || !workoutHistory) return null;

    const totalWorkouts = program.workouts.length;
    const completedCount = workoutHistory.filter(workout => 
      workout.programName === program.name
    ).length;

    const progressPercentage = (completedCount / totalWorkouts) * 100;

    // Calculate weekly progress
    const weeklyProgress = Math.ceil(progressPercentage / (100 / Math.ceil(totalWorkouts / 7)));

    return {
      totalWorkouts,
      completedCount,
      progressPercentage,
      weeklyProgress,
      remainingWorkouts: totalWorkouts - completedCount
    };
  }, [program, workoutHistory]);

  // Calculate exercise progress
  const exerciseProgress = useMemo(() => {
    if (!program || !workoutHistory) return {};

    const progress = {};
    
    program.workouts.forEach(workout => {
      workout.exercises.forEach(exercise => {
        const exerciseHistory = workoutHistory
          .filter(w => w.programName === program.name)
          .flatMap(w => w.exercises)
          .filter(ex => ex.name === exercise.name);

        if (exerciseHistory.length > 0) {
          const latestWorkout = exerciseHistory[exerciseHistory.length - 1];
          const bestSet = latestWorkout.sets
            .filter(set => set.completed)
            .reduce((best, set) => set.weight > best.weight ? set : best, { weight: 0, reps: 0 });

          progress[exercise.name] = {
            bestWeight: bestSet.weight,
            bestReps: bestSet.reps,
            totalWorkouts: exerciseHistory.length,
            lastWorkout: latestWorkout.completedAt
          };
        }
      });
    });

    return progress;
  }, [program, workoutHistory]);

  // Get progress color
  const getProgressColor = (percentage) => {
    if (percentage >= 80) return '#00ff88';
    if (percentage >= 60) return '#ffaa00';
    if (percentage >= 40) return '#ff8800';
    return '#ff4444';
  };

  // Get progress icon
  const getProgressIcon = (change) => {
    if (change > 0) return <TrendingUpIcon sx={{ color: '#00ff88' }} />;
    if (change < 0) return <TrendingDownIcon sx={{ color: '#ff4444' }} />;
    return <TrendingFlatIcon sx={{ color: '#ffaa00' }} />;
  };

  // Format date
  const formatDate = (date) => {
    return new Date(date).toLocaleDateString();
  };

  // Handle workout completion
  const handleCompleteWorkout = (workoutIndex) => {
    if (onCompleteWorkout) {
      onCompleteWorkout(workoutIndex);
    }
    setCompletedWorkouts(prev => new Set([...prev, workoutIndex]));
  };

  // Handle workout skip
  const handleSkipWorkout = (workoutIndex) => {
    if (onSkipWorkout) {
      onSkipWorkout(workoutIndex);
    }
  };

  // Handle mark complete
  const handleMarkComplete = (workoutIndex) => {
    if (onMarkComplete) {
      onMarkComplete(workoutIndex);
    }
    setCompletedWorkouts(prev => new Set([...prev, workoutIndex]));
  };

  if (!program || !programProgress) {
    return (
      <Card sx={{ background: '#1a1a1a', border: '1px solid #333' }}>
        <CardContent>
          <Typography variant="h6" sx={{ textAlign: 'center' }}>
            No program selected
          </Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Box>
      {/* Program Header */}
      <Card sx={{ mb: 3, background: 'linear-gradient(135deg, #1a1a1a, #2a2a2a)', border: '1px solid #333' }}>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
                {program.name}
              </Typography>
              <Typography variant="body1" color="text.secondary">
                {program.description}
              </Typography>
            </Box>
            <Box textAlign="center">
              <Typography variant="h4" sx={{ fontWeight: 900, color: getProgressColor(programProgress.progressPercentage) }}>
                {Math.round(programProgress.progressPercentage)}%
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Complete
              </Typography>
            </Box>
          </Box>

          {/* Progress Bar */}
          <LinearProgress
            variant="determinate"
            value={programProgress.progressPercentage}
            sx={{
              height: 12,
              borderRadius: 6,
              background: '#333',
              mb: 3,
              '& .MuiLinearProgress-bar': {
                background: `linear-gradient(90deg, ${getProgressColor(programProgress.progressPercentage)}, ${getProgressColor(programProgress.progressPercentage)}88)`,
                borderRadius: 6
              }
            }}
          />

          {/* Progress Stats */}
          <Grid container spacing={3}>
            <Grid item xs={6} sm={3}>
              <Box textAlign="center">
                <Typography variant="h6" sx={{ fontWeight: 700, color: '#00ff88' }}>
                  {programProgress.completedCount}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Completed
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Box textAlign="center">
                <Typography variant="h6" sx={{ fontWeight: 700, color: '#ffaa00' }}>
                  {programProgress.remainingWorkouts}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Remaining
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Box textAlign="center">
                <Typography variant="h6" sx={{ fontWeight: 700, color: '#0088ff' }}>
                  {currentWeek}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Current Week
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Box textAlign="center">
                <Typography variant="h6" sx={{ fontWeight: 700, color: '#ff4444' }}>
                  {program.workouts.length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total Workouts
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Workout Progress */}
      <Card sx={{ mb: 3, background: '#1a1a1a', border: '1px solid #333' }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
            Workout Progress
          </Typography>

          {program.workouts.map((workout, index) => {
            const isCompleted = completedWorkouts.has(index);
            const isExpanded = expandedWorkout === index;

            return (
              <Accordion
                key={index}
                expanded={isExpanded}
                onChange={() => setExpandedWorkout(isExpanded ? null : index)}
                sx={{
                  mb: 2,
                  background: '#2a2a2a',
                  border: '1px solid #444',
                  '&:before': { display: 'none' }
                }}
              >
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Box display="flex" alignItems="center" gap={2} flex={1}>
                    <Avatar
                      sx={{
                        background: isCompleted ? '#00ff88' : '#666',
                        color: isCompleted ? '#000' : '#fff',
                        fontWeight: 700
                      }}
                    >
                      {index + 1}
                    </Avatar>
                    <Box flex={1}>
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        {workout.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {workout.exercises.length} exercises
                      </Typography>
                    </Box>
                    <Box display="flex" gap={1}>
                      {isCompleted ? (
                        <Chip
                          label="Completed"
                          size="small"
                          sx={{ background: 'rgba(0, 255, 136, 0.2)', color: '#00ff88' }}
                        />
                      ) : (
                        <Chip
                          label="Pending"
                          size="small"
                          sx={{ background: 'rgba(255, 170, 0, 0.2)', color: '#ffaa00' }}
                        />
                      )}
                    </Box>
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  {/* Exercises */}
                  <List>
                    {workout.exercises.map((exercise, exIndex) => {
                      const progress = exerciseProgress[exercise.name];
                      
                      return (
                        <ListItem key={exIndex} sx={{ px: 0 }}>
                          <ListItemText
                            primary={exercise.name}
                            secondary={
                              <Box>
                                <Typography variant="body2" color="text.secondary">
                                  {exercise.sets} sets × {exercise.reps} reps
                                </Typography>
                                {progress && (
                                  <Box display="flex" gap={2} mt={1}>
                                    <Typography variant="caption" color="text.secondary">
                                      Best: {progress.bestWeight}lbs × {progress.bestReps} reps
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                      Workouts: {progress.totalWorkouts}
                                    </Typography>
                                  </Box>
                                )}
                              </Box>
                            }
                          />
                          <ListItemSecondaryAction>
                            {progress && (
                              <Tooltip title="Progress">
                                <IconButton size="small">
                                  {getProgressIcon(0)}
                                </IconButton>
                              </Tooltip>
                            )}
                          </ListItemSecondaryAction>
                        </ListItem>
                      );
                    })}
                  </List>

                  <Divider sx={{ my: 2 }} />

                  {/* Workout Actions */}
                  <Box display="flex" gap={2}>
                    {!isCompleted ? (
                      <>
                        <Button
                          variant="contained"
                          startIcon={<CheckIcon />}
                          onClick={() => handleCompleteWorkout(index)}
                          sx={{
                            background: 'linear-gradient(135deg, #00ff88, #00cc66)',
                            fontWeight: 700
                          }}
                        >
                          Complete Workout
                        </Button>
                        <Button
                          variant="outlined"
                          onClick={() => handleSkipWorkout(index)}
                          sx={{ borderColor: '#ffaa00', color: '#ffaa00' }}
                        >
                          Skip
                        </Button>
                        <Button
                          variant="text"
                          onClick={() => handleMarkComplete(index)}
                          sx={{ color: '#666' }}
                        >
                          Mark Complete
                        </Button>
                      </>
                    ) : (
                      <Box display="flex" alignItems="center" gap={1}>
                        <CheckIcon sx={{ color: '#00ff88' }} />
                        <Typography variant="body2" color="text.secondary">
                          Workout completed
                        </Typography>
                      </Box>
                    )}
                  </Box>
                </AccordionDetails>
              </Accordion>
            );
          })}
        </CardContent>
      </Card>

      {/* Exercise Progress Summary */}
      <Card sx={{ background: '#1a1a1a', border: '1px solid #333' }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
            Exercise Progress Summary
          </Typography>

          <Grid container spacing={2}>
            {Object.entries(exerciseProgress).map(([exerciseName, progress]) => (
              <Grid item xs={12} sm={6} md={4} key={exerciseName}>
                <Card sx={{ background: '#2a2a2a', border: '1px solid #444' }}>
                  <CardContent>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                      {exerciseName}
                    </Typography>
                    <Box display="flex" gap={2} mb={1}>
                      <Typography variant="body2" color="text.secondary">
                        Best: {progress.bestWeight}lbs × {progress.bestReps}
                      </Typography>
                    </Box>
                    <Box display="flex" gap={2}>
                      <Typography variant="caption" color="text.secondary">
                        {progress.totalWorkouts} workouts
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Last: {formatDate(progress.lastWorkout)}
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          {Object.keys(exerciseProgress).length === 0 && (
            <Box textAlign="center" py={4}>
              <Typography variant="body1" color="text.secondary">
                No exercise progress data available
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Complete some workouts to see progress tracking
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
