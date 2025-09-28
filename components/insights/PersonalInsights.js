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
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Badge
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
  Star as StarIcon,
  EmojiEvents as TrophyIcon,
  Speed as SpeedIcon,
  Psychology as PsychologyIcon
} from '@mui/icons-material';
import { motion } from 'framer-motion';

/**
 * Personal Insights Component
 * Provides comprehensive personal analytics and workout insights
 */
export default function PersonalInsights({
  workoutHistory = [],
  personalRecords = [],
  bodyMeasurements = [],
  goals = [],
  achievements = []
}) {
  const [expandedInsights, setExpandedInsights] = useState(new Set());
  const [insights, setInsights] = useState([]);

  // Calculate comprehensive workout statistics
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

    // Calculate workout frequency
    const workoutFrequency = totalWorkouts / 30; // workouts per month

    // Calculate consistency score
    const consistencyScore = Math.min(workoutFrequency / 4 * 100, 100); // 4 workouts per week = 100%

    return {
      totalWorkouts,
      totalVolume,
      totalSets,
      totalReps,
      averageWorkoutDuration,
      uniqueExercises: uniqueExercises.size,
      workoutFrequency,
      consistencyScore
    };
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
            reps: bestSet.reps,
            volume: bestSet.weight * bestSet.reps
          });
          trends.set(exercise.name, existing);
        }
      });
    });

    return trends;
  }, [workoutHistory]);

  // Calculate body composition trends
  const bodyTrends = useMemo(() => {
    if (bodyMeasurements.length === 0) return null;

    const sortedMeasurements = bodyMeasurements.sort((a, b) => new Date(a.date) - new Date(b.date));
    const first = sortedMeasurements[0];
    const latest = sortedMeasurements[sortedMeasurements.length - 1];

    return {
      weightChange: latest.weight - first.weight,
      bodyFatChange: latest.bodyFat - first.bodyFat,
      muscleMassChange: latest.muscleMass - first.muscleMass,
      totalMeasurements: bodyMeasurements.length
    };
  }, [bodyMeasurements]);

  // Generate comprehensive insights
  useEffect(() => {
    const generatedInsights = [];

    if (!workoutStats) return;

    // Workout frequency insight
    if (workoutStats.workoutFrequency < 2) {
      generatedInsights.push({
        id: 'low-frequency',
        type: 'warning',
        title: 'Low Workout Frequency',
        description: `You're averaging ${workoutStats.workoutFrequency.toFixed(1)} workouts per month.`,
        recommendation: 'Consider increasing your workout frequency to 3-4 times per week for better results.',
        icon: <WarningIcon />,
        priority: 'high',
        category: 'consistency'
      });
    } else if (workoutStats.workoutFrequency >= 4) {
      generatedInsights.push({
        id: 'excellent-frequency',
        type: 'success',
        title: 'Excellent Workout Frequency',
        description: `You're averaging ${workoutStats.workoutFrequency.toFixed(1)} workouts per month.`,
        recommendation: 'Great consistency! Consider adding variety to your workouts.',
        icon: <CheckCircleIcon />,
        priority: 'medium',
        category: 'consistency'
      });
    }

    // Volume progression insight
    if (workoutHistory.length >= 8) {
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

      if (volumeChange > 15) {
        generatedInsights.push({
          id: 'volume-surge',
          type: 'success',
          title: 'Volume Surge Detected',
          description: `Your training volume has increased by ${volumeChange.toFixed(1)}% recently.`,
          recommendation: 'Excellent progress! Monitor recovery to avoid overtraining.',
          icon: <TrendingUpIcon />,
          priority: 'medium',
          category: 'progress'
        });
      } else if (volumeChange < -15) {
        generatedInsights.push({
          id: 'volume-decline',
          type: 'warning',
          title: 'Volume Decline',
          description: `Your training volume has decreased by ${Math.abs(volumeChange).toFixed(1)}% recently.`,
          recommendation: 'Consider increasing workout intensity or frequency.',
          icon: <TrendingDownIcon />,
          priority: 'high',
          category: 'progress'
        });
      }
    }

    // Exercise variety insight
    if (workoutStats.uniqueExercises < 15) {
      generatedInsights.push({
        id: 'low-variety',
        type: 'info',
        title: 'Limited Exercise Variety',
        description: `You've used ${workoutStats.uniqueExercises} different exercises.`,
        recommendation: 'Try incorporating new exercises to target different muscle groups and prevent plateaus.',
        icon: <FitnessIcon />,
        priority: 'medium',
        category: 'variety'
      });
    } else if (workoutStats.uniqueExercises >= 30) {
      generatedInsights.push({
        id: 'high-variety',
        type: 'success',
        title: 'Excellent Exercise Variety',
        description: `You've used ${workoutStats.uniqueExercises} different exercises.`,
        recommendation: 'Great variety! This helps prevent plateaus and keeps workouts interesting.',
        icon: <FitnessIcon />,
        priority: 'low',
        category: 'variety'
      });
    }

    // Workout duration insight
    if (workoutStats.averageWorkoutDuration > 0) {
      if (workoutStats.averageWorkoutDuration > 90) {
        generatedInsights.push({
          id: 'long-workouts',
          type: 'info',
          title: 'Long Workout Sessions',
          description: `Your average workout duration is ${workoutStats.averageWorkoutDuration.toFixed(0)} minutes.`,
          recommendation: 'Consider optimizing rest periods or splitting into shorter, more intense sessions.',
          icon: <TimerIcon />,
          priority: 'low',
          category: 'efficiency'
        });
      } else if (workoutStats.averageWorkoutDuration < 30) {
        generatedInsights.push({
          id: 'short-workouts',
          type: 'info',
          title: 'Short Workout Sessions',
          description: `Your average workout duration is ${workoutStats.averageWorkoutDuration.toFixed(0)} minutes.`,
          recommendation: 'Consider adding more exercises or sets to maximize your time.',
          icon: <TimerIcon />,
          priority: 'medium',
          category: 'efficiency'
        });
      }
    }

    // Body composition insights
    if (bodyTrends) {
      if (bodyTrends.weightChange > 5) {
        generatedInsights.push({
          id: 'weight-gain',
          type: 'info',
          title: 'Weight Gain Trend',
          description: `You've gained ${bodyTrends.weightChange.toFixed(1)} lbs since your first measurement.`,
          recommendation: 'Monitor if this aligns with your goals. Consider adjusting nutrition or training.',
          icon: <TrendingUpIcon />,
          priority: 'medium',
          category: 'body'
        });
      } else if (bodyTrends.weightChange < -5) {
        generatedInsights.push({
          id: 'weight-loss',
          type: 'info',
          title: 'Weight Loss Trend',
          description: `You've lost ${Math.abs(bodyTrends.weightChange).toFixed(1)} lbs since your first measurement.`,
          recommendation: 'Monitor if this aligns with your goals. Ensure adequate nutrition for recovery.',
          icon: <TrendingDownIcon />,
          priority: 'medium',
          category: 'body'
        });
      }

      if (bodyTrends.muscleMassChange > 2) {
        generatedInsights.push({
          id: 'muscle-gain',
          type: 'success',
          title: 'Muscle Mass Increase',
          description: `You've gained ${bodyTrends.muscleMassChange.toFixed(1)} lbs of muscle mass.`,
          recommendation: 'Excellent progress! Keep up the consistent training and nutrition.',
          icon: <TrophyIcon />,
          priority: 'low',
          category: 'body'
        });
      }
    }

    // Goal progress insights
    if (goals.length > 0) {
      const completedGoals = goals.filter(goal => {
        // Simple completion check - would need more sophisticated logic
        return goal.status === 'completed';
      }).length;

      const goalCompletionRate = (completedGoals / goals.length) * 100;

      if (goalCompletionRate >= 80) {
        generatedInsights.push({
          id: 'goal-master',
          type: 'success',
          title: 'Goal Achievement Master',
          description: `You've completed ${goalCompletionRate.toFixed(0)}% of your goals.`,
          recommendation: 'Outstanding goal achievement! Consider setting more challenging goals.',
          icon: <TrophyIcon />,
          priority: 'low',
          category: 'goals'
        });
      } else if (goalCompletionRate < 30) {
        generatedInsights.push({
          id: 'goal-struggle',
          type: 'warning',
          title: 'Goal Achievement Challenge',
          description: `You've completed ${goalCompletionRate.toFixed(0)}% of your goals.`,
          recommendation: 'Consider breaking down large goals into smaller, achievable milestones.',
          icon: <WarningIcon />,
          priority: 'high',
          category: 'goals'
        });
      }
    }

    // Achievement insights
    if (achievements.length > 0) {
      const unlockedAchievements = achievements.filter(a => a.unlocked).length;
      const achievementRate = (unlockedAchievements / achievements.length) * 100;

      if (achievementRate >= 50) {
        generatedInsights.push({
          id: 'achievement-hunter',
          type: 'success',
          title: 'Achievement Hunter',
          description: `You've unlocked ${achievementRate.toFixed(0)}% of available achievements.`,
          recommendation: 'Great progress! Keep pushing for those rare and epic achievements.',
          icon: <StarIcon />,
          priority: 'low',
          category: 'achievements'
        });
      }
    }

    // Progress insights for specific exercises
    progressTrends.forEach((data, exercise) => {
      if (data.length >= 5) {
        const recent = data.slice(0, 3);
        const older = data.slice(3, 6);
        
        if (older.length > 0) {
          const recentAvg = recent.reduce((sum, d) => sum + d.weight, 0) / recent.length;
          const olderAvg = older.reduce((sum, d) => sum + d.weight, 0) / older.length;
          const improvement = ((recentAvg - olderAvg) / olderAvg) * 100;

          if (improvement > 10) {
            generatedInsights.push({
              id: `progress-${exercise}`,
              type: 'success',
              title: `${exercise} Progress`,
              description: `You've improved your ${exercise} by ${improvement.toFixed(1)}% recently.`,
              recommendation: 'Excellent progress! Consider increasing the weight gradually.',
              icon: <TrendingUpIcon />,
              priority: 'medium',
              category: 'progress'
            });
          } else if (improvement < -10) {
            generatedInsights.push({
              id: `regression-${exercise}`,
              type: 'warning',
              title: `${exercise} Regression`,
              description: `Your ${exercise} performance has decreased by ${Math.abs(improvement).toFixed(1)}% recently.`,
              recommendation: 'Consider deloading or focusing on form and recovery.',
              icon: <TrendingDownIcon />,
              priority: 'high',
              category: 'progress'
            });
          }
        }
      }
    });

    setInsights(generatedInsights);
  }, [workoutStats, progressTrends, bodyTrends, goals, achievements, workoutHistory]);

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

  // Get category icon
  const getCategoryIcon = (category) => {
    switch (category) {
      case 'consistency': return '🔥';
      case 'progress': return '📈';
      case 'variety': return '🎯';
      case 'efficiency': return '⚡';
      case 'body': return '📏';
      case 'goals': return '🏆';
      case 'achievements': return '⭐';
      default: return '💡';
    }
  };

  // Sort insights by priority
  const sortedInsights = insights.sort((a, b) => {
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    return priorityOrder[b.priority] - priorityOrder[a.priority];
  });

  // Group insights by category
  const insightsByCategory = sortedInsights.reduce((acc, insight) => {
    if (!acc[insight.category]) {
      acc[insight.category] = [];
    }
    acc[insight.category].push(insight);
    return acc;
  }, {});

  return (
    <Box>
      {/* Header */}
      <Box mb={3}>
        <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
          Personal Insights
        </Typography>
        <Typography variant="body1" color="text.secondary">
          AI-powered insights and recommendations based on your workout data and progress.
        </Typography>
      </Box>

      {/* Insights by Category */}
      {Object.entries(insightsByCategory).map(([category, categoryInsights]) => (
        <Card key={category} sx={{ mb: 3, background: '#1a1a1a', border: '1px solid #333' }}>
          <CardContent>
            <Box display="flex" alignItems="center" gap={2} mb={3}>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                {getCategoryIcon(category)} {category.charAt(0).toUpperCase() + category.slice(1)} Insights
              </Typography>
              <Chip
                label={categoryInsights.length}
                size="small"
                sx={{ background: 'rgba(255, 68, 68, 0.2)', color: '#ff4444' }}
              />
            </Box>

            {categoryInsights.map((insight, index) => {
              const isExpanded = expandedInsights.has(insight.id);
              
              return (
                <motion.div
                  key={insight.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                >
                  <Accordion
                    expanded={isExpanded}
                    onChange={() => toggleInsight(insight.id)}
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
                            background: getInsightColor(insight.type),
                            color: 'white'
                          }}
                        >
                          {insight.icon}
                        </Avatar>
                        
                        <Box flex={1}>
                          <Box display="flex" alignItems="center" gap={2} mb={1}>
                            <Typography variant="h6" sx={{ fontWeight: 600 }}>
                              {insight.title}
                            </Typography>
                            <Chip
                              label={insight.priority}
                              size="small"
                              sx={{
                                background: `${getPriorityColor(insight.priority)}20`,
                                color: getPriorityColor(insight.priority)
                              }}
                            />
                          </Box>
                          <Typography variant="body2" color="text.secondary">
                            {insight.description}
                          </Typography>
                        </Box>
                      </Box>
                    </AccordionSummary>
                    
                    <AccordionDetails>
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
                    </AccordionDetails>
                  </Accordion>
                </motion.div>
              );
            })}
          </CardContent>
        </Card>
      ))}

      {/* No Insights State */}
      {insights.length === 0 && (
        <Card sx={{ background: '#1a1a1a', border: '1px solid #333' }}>
          <CardContent>
            <Box textAlign="center" py={4}>
              <Typography variant="body1" color="text.secondary" mb={2}>
                No insights available yet
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Complete more workouts and track your progress to get personalized insights
              </Typography>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Workout Statistics Summary */}
      {workoutStats && (
        <Card sx={{ mt: 3, background: '#1a1a1a', border: '1px solid #333' }}>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
              Workout Statistics Summary
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
                    {workoutStats.consistencyScore.toFixed(0)}%
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Consistency Score
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

