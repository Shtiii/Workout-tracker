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
  Badge
} from '@mui/material';
import {
  LocalFireDepartment as FireIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  CalendarToday as CalendarIcon,
  Timer as TimerIcon,
  EmojiEvents as TrophyIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Add as AddIcon,
  Remove as RemoveIcon
} from '@mui/icons-material';
import { motion } from 'framer-motion';

/**
 * Streak Tracker Component
 * Tracks workout streaks with gamification and motivation features
 */
export default function StreakTracker({
  workoutHistory = [],
  onAddWorkout,
  onBreakStreak,
  streakGoal = 30
}) {
  const [showStreakBreakDialog, setShowStreakBreakDialog] = useState(false);
  const [streakData, setStreakData] = useState({
    current: 0,
    longest: 0,
    total: 0,
    breaks: 0,
    average: 0
  });

  // Calculate streak data
  const calculatedStreakData = useMemo(() => {
    if (workoutHistory.length === 0) {
      return {
        current: 0,
        longest: 0,
        total: 0,
        breaks: 0,
        average: 0,
        daysSinceLastWorkout: 0,
        streakHistory: [],
        upcomingMilestones: []
      };
    }

    // Sort workouts by date (newest first)
    const sortedWorkouts = workoutHistory
      .sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt));

    // Calculate current streak
    let currentStreak = 0;
    let currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);

    for (const workout of sortedWorkouts) {
      const workoutDate = new Date(workout.completedAt);
      workoutDate.setHours(0, 0, 0, 0);

      if (workoutDate.getTime() === currentDate.getTime()) {
        currentStreak++;
        currentDate.setDate(currentDate.getDate() - 1);
      } else if (workoutDate.getTime() < currentDate.getTime()) {
        break;
      }
    }

    // Calculate longest streak
    let longestStreak = 0;
    let tempStreak = 0;
    let lastWorkoutDate = null;

    for (let i = sortedWorkouts.length - 1; i >= 0; i--) {
      const workoutDate = new Date(sortedWorkouts[i].completedAt);
      workoutDate.setHours(0, 0, 0, 0);

      if (lastWorkoutDate === null) {
        tempStreak = 1;
      } else {
        const daysDiff = Math.floor((workoutDate - lastWorkoutDate) / (1000 * 60 * 60 * 24));
        if (daysDiff === 1) {
          tempStreak++;
        } else {
          longestStreak = Math.max(longestStreak, tempStreak);
          tempStreak = 1;
        }
      }
      lastWorkoutDate = workoutDate;
    }
    longestStreak = Math.max(longestStreak, tempStreak);

    // Calculate total workouts and breaks
    const totalWorkouts = sortedWorkouts.length;
    const breaks = Math.max(0, totalWorkouts - currentStreak - 1);
    const average = totalWorkouts > 0 ? totalWorkouts / 30 : 0; // Average per month

    // Calculate days since last workout
    const lastWorkout = sortedWorkouts[0];
    const daysSinceLastWorkout = lastWorkout 
      ? Math.floor((new Date() - new Date(lastWorkout.completedAt)) / (1000 * 60 * 60 * 24))
      : 0;

    // Generate streak history (last 30 days)
    const streakHistory = [];
    const today = new Date();
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);

      const hasWorkout = sortedWorkouts.some(workout => {
        const workoutDate = new Date(workout.completedAt);
        workoutDate.setHours(0, 0, 0, 0);
        return workoutDate.getTime() === date.getTime();
      });

      streakHistory.push({
        date,
        hasWorkout,
        isToday: i === 0,
        isFuture: i < 0
      });
    }

    // Calculate upcoming milestones
    const milestones = [3, 7, 14, 30, 60, 100, 365];
    const upcomingMilestones = milestones
      .filter(milestone => milestone > currentStreak)
      .slice(0, 3)
      .map(milestone => ({
        target: milestone,
        remaining: milestone - currentStreak,
        percentage: (currentStreak / milestone) * 100
      }));

    return {
      current: currentStreak,
      longest: longestStreak,
      total: totalWorkouts,
      breaks,
      average,
      daysSinceLastWorkout,
      streakHistory,
      upcomingMilestones
    };
  }, [workoutHistory]);

  // Update streak data
  useEffect(() => {
    setStreakData(calculatedStreakData);
  }, [calculatedStreakData]);

  // Get streak status
  const getStreakStatus = () => {
    if (streakData.current === 0) return 'broken';
    if (streakData.daysSinceLastWorkout === 0) return 'active';
    if (streakData.daysSinceLastWorkout === 1) return 'warning';
    return 'broken';
  };

  // Get streak color
  const getStreakColor = (status) => {
    switch (status) {
      case 'active': return '#00ff88';
      case 'warning': return '#ffaa00';
      case 'broken': return '#ff4444';
      default: return '#666';
    }
  };

  // Get streak icon
  const getStreakIcon = (status) => {
    switch (status) {
      case 'active': return <FireIcon sx={{ color: '#ff4444' }} />;
      case 'warning': return <WarningIcon sx={{ color: '#ffaa00' }} />;
      case 'broken': return <RemoveIcon sx={{ color: '#ff4444' }} />;
      default: return <FireIcon sx={{ color: '#666' }} />;
    }
  };

  // Format date
  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
  };

  // Get day of week
  const getDayOfWeek = (date) => {
    return date.toLocaleDateString('en-US', { weekday: 'short' });
  };

  // Handle add workout
  const handleAddWorkout = () => {
    if (onAddWorkout) {
      onAddWorkout();
    }
  };

  // Handle break streak
  const handleBreakStreak = () => {
    if (onBreakStreak) {
      onBreakStreak();
    }
    setShowStreakBreakDialog(false);
  };

  const status = getStreakStatus();

  return (
    <Box>
      {/* Header */}
      <Box mb={3}>
        <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
          Workout Streak
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Track your consistency and build momentum with streak tracking.
        </Typography>
      </Box>

      {/* Current Streak */}
      <Card sx={{ mb: 3, background: 'linear-gradient(135deg, #1a1a1a, #2a2a2a)', border: '1px solid #333' }}>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
            <Box>
              <Typography variant="h3" sx={{ fontWeight: 900, color: getStreakColor(status) }}>
                {streakData.current}
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Day Streak
              </Typography>
            </Box>
            <Box textAlign="center">
              {getStreakIcon(status)}
              <Typography variant="body2" color="text.secondary" mt={1}>
                {status === 'active' ? 'Active' : status === 'warning' ? 'At Risk' : 'Broken'}
              </Typography>
            </Box>
          </Box>

          {/* Streak Status Alert */}
          {status === 'warning' && (
            <Alert severity="warning" sx={{ mb: 3 }}>
              Your streak is at risk! Complete a workout today to keep it alive.
            </Alert>
          )}

          {status === 'broken' && (
            <Alert severity="error" sx={{ mb: 3 }}>
              Your streak has been broken. Start a new one today!
            </Alert>
          )}

          {/* Action Buttons */}
          <Box display="flex" gap={2}>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleAddWorkout}
              sx={{
                background: 'linear-gradient(135deg, #00ff88, #00cc66)',
                fontWeight: 700
              }}
            >
              Log Workout
            </Button>
            {status === 'broken' && (
              <Button
                variant="outlined"
                onClick={() => setShowStreakBreakDialog(true)}
                sx={{ borderColor: '#ff4444', color: '#ff4444' }}
              >
                Break Streak
              </Button>
            )}
          </Box>
        </CardContent>
      </Card>

      {/* Streak Stats */}
      <Grid container spacing={2} mb={3}>
        <Grid item xs={6} sm={3}>
          <Card sx={{ background: '#1a1a1a', border: '1px solid #333' }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" sx={{ fontWeight: 700, color: '#ffaa00' }}>
                {streakData.longest}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Longest Streak
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card sx={{ background: '#1a1a1a', border: '1px solid #333' }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" sx={{ fontWeight: 700, color: '#00ff88' }}>
                {streakData.total}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Workouts
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card sx={{ background: '#1a1a1a', border: '1px solid #333' }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" sx={{ fontWeight: 700, color: '#0088ff' }}>
                {streakData.breaks}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Breaks
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card sx={{ background: '#1a1a1a', border: '1px solid #333' }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" sx={{ fontWeight: 700, color: '#ff4444' }}>
                {streakData.average.toFixed(1)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Avg/Month
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Streak Calendar */}
      <Card sx={{ mb: 3, background: '#1a1a1a', border: '1px solid #333' }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
            30-Day Streak Calendar
          </Typography>
          
          <Grid container spacing={1}>
            {streakData.streakHistory.map((day, index) => (
              <Grid item xs={1.7} key={index}>
                <Tooltip title={`${formatDate(day.date)} - ${day.hasWorkout ? 'Workout completed' : 'No workout'}`}>
                  <Box
                    sx={{
                      aspectRatio: '1',
                      borderRadius: 1,
                      background: day.hasWorkout 
                        ? '#00ff88' 
                        : day.isToday 
                          ? '#ffaa00' 
                          : day.isFuture 
                            ? '#333' 
                            : '#666',
                      border: day.isToday ? '2px solid #ffaa00' : '1px solid #444',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      '&:hover': {
                        opacity: 0.8
                      }
                    }}
                  >
                    <Typography 
                      variant="caption" 
                      sx={{ 
                        color: day.hasWorkout || day.isToday ? '#000' : '#fff',
                        fontWeight: day.isToday ? 700 : 400
                      }}
                    >
                      {day.date.getDate()}
                    </Typography>
                  </Box>
                </Tooltip>
              </Grid>
            ))}
          </Grid>
          
          <Box display="flex" gap={2} mt={2} justifyContent="center">
            <Box display="flex" alignItems="center" gap={1}>
              <Box width={12} height={12} borderRadius="50%" sx={{ background: '#00ff88' }} />
              <Typography variant="caption" color="text.secondary">
                Workout
              </Typography>
            </Box>
            <Box display="flex" alignItems="center" gap={1}>
              <Box width={12} height={12} borderRadius="50%" sx={{ background: '#666' }} />
              <Typography variant="caption" color="text.secondary">
                No Workout
              </Typography>
            </Box>
            <Box display="flex" alignItems="center" gap={1}>
              <Box width={12} height={12} borderRadius="50%" sx={{ background: '#ffaa00' }} />
              <Typography variant="caption" color="text.secondary">
                Today
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Upcoming Milestones */}
      {streakData.upcomingMilestones.length > 0 && (
        <Card sx={{ background: '#1a1a1a', border: '1px solid #333' }}>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
              Upcoming Milestones
            </Typography>
            
            <Grid container spacing={2}>
              {streakData.upcomingMilestones.map((milestone, index) => (
                <Grid item xs={12} sm={6} md={4} key={index}>
                  <Card sx={{ background: '#2a2a2a', border: '1px solid #444' }}>
                    <CardContent>
                      <Box display="flex" alignItems="center" gap={2} mb={2}>
                        <Avatar
                          sx={{
                            background: '#ffaa00',
                            color: 'white',
                            fontWeight: 700
                          }}
                        >
                          {milestone.target}
                        </Avatar>
                        <Box flex={1}>
                          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                            {milestone.target} Day Streak
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {milestone.remaining} days to go
                          </Typography>
                        </Box>
                      </Box>
                      
                      <LinearProgress
                        variant="determinate"
                        value={milestone.percentage}
                        sx={{
                          height: 8,
                          borderRadius: 4,
                          background: '#333',
                          '& .MuiLinearProgress-bar': {
                            background: 'linear-gradient(90deg, #ffaa00, #ff8800)',
                            borderRadius: 4
                          }
                        }}
                      />
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </CardContent>
        </Card>
      )}
    </Box>
  );
}
