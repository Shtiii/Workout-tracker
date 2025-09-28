'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Chip,
  Button,
  IconButton,
  Tooltip,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Avatar,
  LinearProgress,
  Alert,
  Collapse
} from '@mui/material';
import {
  Lightbulb as LightbulbIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  TrendingFlat as TrendingFlatIcon,
  FitnessCenter as FitnessIcon,
  Timer as TimerIcon,
  Assessment as AssessmentIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Info as InfoIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon
} from '@mui/icons-material';
import { motion } from 'framer-motion';

/**
 * Workout Insights Component
 * Provides AI-powered insights and recommendations based on workout data
 */
export default function WorkoutInsights({
  workoutHistory = [],
  personalRecords = [],
  bodyMeasurements = [],
  goals = []
}) {
  const [expandedInsights, setExpandedInsights] = useState(new Set());
  const [insights, setInsights] = useState([]);

  // Calculate workout statistics
  const workoutStats = useMemo(() => {
    if (workoutHistory.length === 0) return null;

    const totalWorkouts = workoutHistory.length;
    const totalVolume = workoutHistory.reduce((sum, workout) => {
      return sum + workout.exercises.reduce((exerciseSum, exercise) => {
        return exerciseSum + exercise.sets
          .filter(set => set.completed)
          .reduce((setSum, set) => setSum + (set.weight * set.reps), 0);
      }, 0);
    }, 0);

    const totalSets = workoutHistory.reduce((sum, workout) => {
      return sum + workout.exercises.reduce((exerciseSum, exercise) => {
        return exerciseSum + exercise.sets.filter(set => set.completed).length;
      }, 0);
    }, 0);

    const totalReps = workoutHistory.reduce((sum, workout) => {
      return sum + workout.exercises.reduce((exerciseSum, exercise) => {
        return exerciseSum + exercise.sets
          .filter(set => set.completed)
          .reduce((setSum, set) => setSum + set.reps, 0);
      }, 0);
    }, 0);

    const averageWorkoutDuration = workoutHistory.reduce((sum, workout) => {
      if (workout.startTime && workout.endTime) {
        const duration = (new Date(workout.endTime) - new Date(workout.startTime)) / (1000 * 60);
        return sum + duration;
      }
      return sum;
    }, 0) / totalWorkouts;

    const uniqueExercises = new Set();
    workoutHistory.forEach(workout => {
      workout.exercises.forEach(exercise => {
        uniqueExercises.add(exercise.name);
      });
    });

    return {
      totalWorkouts,
      totalVolume,
      totalSets,
      totalReps,
      averageWorkoutDuration,
      uniqueExercises: uniqueExercises.size
    };
  }, [workoutHistory]);

  // Calculate exercise frequency
  const exerciseFrequency = useMemo(() => {
    const frequency = new Map();
    
    workoutHistory.forEach(workout => {
      workout.exercises.forEach(exercise => {
        const count = frequency.get(exercise.name) || 0;
        frequency.set(exercise.name, count + 1);
      });
    });

    return Array.from(frequency.entries())
      .map(([exercise, count]) => ({ exercise, count }))
      .sort((a, b) => b.count - a.count);
  }, [workoutHistory]);

  // Calculate progress trends
  const progressTrends = useMemo(() => {
    const trends = new Map();
    
    workoutHistory.forEach(workout => {
      workout.exercises.forEach(exercise => {
        const bestSet = exercise.sets
          .filter(set => set.completed)
          .reduce((best, set) => set.weight > best.weight ? set : best, { weight: 0, reps: 0 });
        
        if (bestSet.weight > 0) {
          const existing = trends.get(exercise.name) || [];
          existing.push({
            date: workout.completedAt,
            weight: bestSet.weight,
            reps: bestSet.reps
          });
          trends.set(exercise.name, existing);
        }
      });
    });

    return trends;
  }, [workoutHistory]);

  // Generate insights
  useEffect(() => {
    const generatedInsights = [];

    if (!workoutStats) return;

    // Workout frequency insight
    const daysSinceLastWorkout = workoutHistory.length > 0 
      ? (new Date() - new Date(workoutHistory[0].completedAt)) / (1000 * 60 * 60 * 24)
      : 0;

    if (daysSinceLastWorkout > 7) {
      generatedInsights.push({
        id: 'workout-frequency',
        type: 'warning',
        title: 'Workout Gap Detected',
        description: `It's been ${Math.round(daysSinceLastWorkout)} days since your last workout. Consider getting back to your routine!`,
        recommendation: 'Schedule your next workout today to maintain consistency.',
        icon: <WarningIcon />,
        priority: 'high'
      });
    } else if (workoutStats.totalWorkouts >= 4) {
      generatedInsights.push({
        id: 'workout-consistency',
        type: 'success',
        title: 'Great Consistency!',
        description: `You've completed ${workoutStats.totalWorkouts} workouts recently. Keep up the excellent work!`,
        recommendation: 'Consider increasing workout intensity or adding new exercises.',
        icon: <CheckCircleIcon />,
        priority: 'medium'
      });
    }

    // Volume progression insight
    if (workoutHistory.length >= 4) {
      const recentWorkouts = workoutHistory.slice(0, 4);
      const olderWorkouts = workoutHistory.slice(4, 8);
      
      const recentVolume = recentWorkouts.reduce((sum, workout) => {
        return sum + workout.exercises.reduce((exerciseSum, exercise) => {
          return exerciseSum + exercise.sets
            .filter(set => set.completed)
            .reduce((setSum, set) => setSum + (set.weight * set.reps), 0);
        }, 0);
      }, 0);

      const olderVolume = olderWorkouts.reduce((sum, workout) => {
        return sum + workout.exercises.reduce((exerciseSum, exercise) => {
          return exerciseSum + exercise.sets
            .filter(set => set.completed)
            .reduce((setSum, set) => setSum + (set.weight * set.reps), 0);
        }, 0);
      }, 0);

      const volumeChange = ((recentVolume - olderVolume) / olderVolume) * 100;

      if (volumeChange > 10) {
        generatedInsights.push({
          id: 'volume-progression',
          type: 'success',
          title: 'Volume Progression',
          description: `Your training volume has increased by ${volumeChange.toFixed(1)}% in recent workouts.`,
          recommendation: 'This is great progress! Consider maintaining this intensity.',
          icon: <TrendingUpIcon />,
          priority: 'medium'
        });
      } else if (volumeChange < -10) {
        generatedInsights.push({
          id: 'volume-decline',
          type: 'warning',
          title: 'Volume Decline',
          description: `Your training volume has decreased by ${Math.abs(volumeChange).toFixed(1)}% recently.`,
          recommendation: 'Consider increasing workout intensity or frequency.',
          icon: <TrendingDownIcon />,
          priority: 'high'
        });
      }
    }

    // Exercise variety insight
    if (workoutStats.uniqueExercises < 10) {
      generatedInsights.push({
        id: 'exercise-variety',
        type: 'info',
        title: 'Exercise Variety',
        description: `You've used ${workoutStats.uniqueExercises} different exercises. Consider adding more variety.`,
        recommendation: 'Try incorporating new exercises to target different muscle groups.',
        icon: <FitnessIcon />,
        priority: 'medium'
      });
    }

    // Most performed exercise insight
    if (exerciseFrequency.length > 0) {
      const mostPerformed = exerciseFrequency[0];
      generatedInsights.push({
        id: 'favorite-exercise',
        type: 'info',
        title: 'Most Performed Exercise',
        description: `${mostPerformed.exercise} is your most performed exercise (${mostPerformed.count} times).`,
        recommendation: 'Consider adding variations or complementary exercises.',
        icon: <FitnessIcon />,
        priority: 'low'
      });
    }

    // Progress insights for specific exercises
    progressTrends.forEach((data, exercise) => {
      if (data.length >= 3) {
        const recent = data.slice(0, 3);
        const older = data.slice(3, 6);
        
        if (older.length > 0) {
          const recentAvg = recent.reduce((sum, d) => sum + d.weight, 0) / recent.length;
          const olderAvg = older.reduce((sum, d) => sum + d.weight, 0) / older.length;
          const improvement = ((recentAvg - olderAvg) / olderAvg) * 100;

          if (improvement > 5) {
            generatedInsights.push({
              id: `progress-${exercise}`,
              type: 'success',
              title: `${exercise} Progress`,
              description: `You've improved your ${exercise} by ${improvement.toFixed(1)}% recently.`,
              recommendation: 'Keep up the great work! Consider increasing the weight gradually.',
              icon: <TrendingUpIcon />,
              priority: 'medium'
            });
          }
        }
      }
    });

    // Workout duration insight
    if (workoutStats.averageWorkoutDuration > 0) {
      if (workoutStats.averageWorkoutDuration > 90) {
        generatedInsights.push({
          id: 'workout-duration',
          type: 'info',
          title: 'Workout Duration',
          description: `Your average workout duration is ${workoutStats.averageWorkoutDuration.toFixed(0)} minutes.`,
          recommendation: 'Consider optimizing rest periods to maintain intensity.',
          icon: <TimerIcon />,
          priority: 'low'
        });
      }
    }

    setInsights(generatedInsights);
  }, [workoutStats, exerciseFrequency, progressTrends, workoutHistory]);

  // Toggle insight expansion
  const toggleInsight = (insightId) => {
    const newExpanded = new Set(expandedInsights);
    if (newExpanded.has(insightId)) {
      newExpanded.delete(insightId);
    } else {
      newExpanded.add(insightId);
    }
    setExpandedInsights(newExpanded);
  };

  // Get insight color
  const getInsightColor = (type) => {
    switch (type) {
      case 'success': return '#00ff88';
      case 'warning': return '#ffaa00';
      case 'error': return '#ff4444';
      case 'info': return '#0088ff';
      default: return '#666';
    }
  };

  // Get priority color
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return '#ff4444';
      case 'medium': return '#ffaa00';
      case 'low': return '#00ff88';
      default: return '#666';
    }
  };

  // Sort insights by priority
  const sortedInsights = insights.sort((a, b) => {
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    return priorityOrder[b.priority] - priorityOrder[a.priority];
  });

  return (
    <Box>
      {/* Header */}
      <Box mb={3}>
        <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
          Workout Insights
        </Typography>
        <Typography variant="body1" color="text.secondary">
          AI-powered insights and recommendations based on your workout data.
        </Typography>
      </Box>

      {/* Insights List */}
      {sortedInsights.length === 0 ? (
        <Card sx={{ background: '#1a1a1a', border: '1px solid #333' }}>
          <CardContent>
            <Box textAlign="center" py={4}>
              <Typography variant="body1" color="text.secondary" mb={2}>
                No insights available yet
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Complete more workouts to get personalized insights and recommendations
              </Typography>
            </Box>
          </CardContent>
        </Card>
      ) : (
        <Box>
          {sortedInsights.map((insight, index) => {
            const isExpanded = expandedInsights.has(insight.id);
            
            return (
              <motion.div
                key={insight.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
              >
                <Card
                  sx={{
                    mb: 2,
                    background: '#1a1a1a',
                    border: '1px solid #333',
                    '&:hover': {
                      borderColor: getInsightColor(insight.type)
                    }
                  }}
                >
                  <CardContent>
                    <Box display="flex" alignItems="flex-start" gap={2}>
                      <Avatar
                        sx={{
                          background: getInsightColor(insight.type),
                          color: 'white'
                        }}
                      >
                        {insight.icon}
                      </Avatar>
                      
                      <Box flex={1}>
                        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
                          <Typography variant="h6" sx={{ fontWeight: 600 }}>
                            {insight.title}
                          </Typography>
                          <Box display="flex" gap={1}>
                            <Chip
                              label={insight.priority}
                              size="small"
                              sx={{
                                background: `${getPriorityColor(insight.priority)}20`,
                                color: getPriorityColor(insight.priority)
                              }}
                            />
                            <IconButton
                              size="small"
                              onClick={() => toggleInsight(insight.id)}
                              sx={{ color: '#666' }}
                            >
                              {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                            </IconButton>
                          </Box>
                        </Box>
                        
                        <Typography variant="body2" color="text.secondary" mb={2}>
                          {insight.description}
                        </Typography>
                        
                        <Collapse in={isExpanded}>
                          <Alert
                            severity={insight.type}
                            sx={{
                              background: `${getInsightColor(insight.type)}10`,
                              border: `1px solid ${getInsightColor(insight.type)}30`,
                              '& .MuiAlert-icon': {
                                color: getInsightColor(insight.type)
                              }
                            }}
                          >
                            <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
                              Recommendation:
                            </Typography>
                            <Typography variant="body2">
                              {insight.recommendation}
                            </Typography>
                          </Alert>
                        </Collapse>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </Box>
      )}

      {/* Workout Statistics */}
      {workoutStats && (
        <Card sx={{ mt: 3, background: '#1a1a1a', border: '1px solid #333' }}>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
              Workout Statistics
            </Typography>
            
            <Grid container spacing={3}>
              <Grid item xs={6} sm={3}>
                <Box textAlign="center">
                  <Typography variant="h4" sx={{ fontWeight: 700, color: '#ff4444' }}>
                    {workoutStats.totalWorkouts}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Workouts
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Box textAlign="center">
                  <Typography variant="h4" sx={{ fontWeight: 700, color: '#00ff88' }}>
                    {workoutStats.totalVolume.toFixed(0)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Volume (lbs)
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Box textAlign="center">
                  <Typography variant="h4" sx={{ fontWeight: 700, color: '#ffaa00' }}>
                    {workoutStats.uniqueExercises}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Unique Exercises
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Box textAlign="center">
                  <Typography variant="h4" sx={{ fontWeight: 700, color: '#0088ff' }}>
                    {workoutStats.averageWorkoutDuration.toFixed(0)}m
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Avg Duration
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}
    </Box>
  );
}

