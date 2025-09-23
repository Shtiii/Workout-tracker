'use client';

import { useState, useEffect, memo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Container,
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Paper,
  IconButton,
  Modal,
  TextField,
  Snackbar,
  Alert
} from '@mui/material';
import {
  FitnessCenter as FitnessCenterIcon,
  EmojiEvents as TrophyIcon,
  TrendingUp as TrendingUpIcon,
  PlayArrow as PlayIcon,
  Pause as PauseIcon,
  Stop as StopIcon,
  Add as AddIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { collection, getDocs, orderBy, query, deleteDoc, doc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

const modalStyle = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 400,
  bgcolor: '#1a1a1a',
  border: '2px solid #ff4444',
  borderRadius: 2,
  boxShadow: '0 0 50px rgba(255, 68, 68, 0.3)',
  p: 4,
};

export default function DashboardPage() {
  const router = useRouter();
  // const [activeTab, setActiveTab] = useState(0);
  const [workouts, setWorkouts] = useState([]);
  // const [programs, setPrograms] = useState([]);
  // const [goals, setGoals] = useState([]);
  const [records, setRecords] = useState({});
  const [stats, setStats] = useState({
    totalWorkouts: 0,
    currentStreak: 0,
    weeklyGoal: '0/3',
    totalExercises: 0
  });
  const [weeklyGoalTarget, setWeeklyGoalTarget] = useState(3);
  const [goalModalOpen, setGoalModalOpen] = useState(false);
  const [newGoalTarget, setNewGoalTarget] = useState(3);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [achievements, setAchievements] = useState([]);
  const [timer, setTimer] = useState({
    time: 0,
    isRunning: false,
    startTime: null
  });

  const fetchWeeklyGoal = useCallback(async () => {
    try {
      const goalDoc = await getDocs(query(collection(db, 'settings')));
      const settings = goalDoc.docs.find(doc => doc.id === 'weeklyGoal');
      if (settings) {
        const target = settings.data().target || 3;
        setWeeklyGoalTarget(target);
        setNewGoalTarget(target);
      }
    } catch (error) {
      console.error('Error fetching weekly goal:', error);
    }
  }, []);

  const fetchData = useCallback(async () => {
    try {
      // Fetch workouts
      const workoutsQuery = query(
        collection(db, 'workoutSessions'),
        orderBy('completedAt', 'desc')
      );
      const workoutsSnapshot = await getDocs(workoutsQuery);
      const workoutsData = workoutsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        completedAt: doc.data().completedAt?.toDate()
      }));
      setWorkouts(workoutsData);

      // Fetch programs (commented out as programs state is not used)
      // const programsSnapshot = await getDocs(collection(db, 'programs'));
      // const programsData = programsSnapshot.docs.map(doc => ({
      //   id: doc.id,
      //   ...doc.data()
      // }));
      // setPrograms(programsData);

      // Fetch weekly goal target
      await fetchWeeklyGoal();

      // Calculate stats
      calculateStats(workoutsData);
      calculateRecords(workoutsData);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  }, [fetchWeeklyGoal]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    let interval = null;
    if (timer.isRunning) {
      interval = setInterval(() => {
        setTimer(prev => ({
          ...prev,
          time: Math.floor((Date.now() - prev.startTime) / 1000)
        }));
      }, 1000);
    } else if (!timer.isRunning) {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [timer.isRunning, timer.startTime]);

  const deleteWorkout = useCallback(async (workoutId) => {
    if (confirm('Are you sure you want to delete this workout? This action cannot be undone.')) {
      try {
        await deleteDoc(doc(db, 'workoutSessions', workoutId));
        // Refresh data after deletion
        fetchData();
      } catch (error) {
        console.error('Error deleting workout:', error);
      }
    }
  }, [fetchData]);

  const calculateStats = (workoutsData) => {
    const totalWorkouts = workoutsData.length;
    const currentStreak = calculateStreak(workoutsData);
    const weeklyGoal = calculateWeeklyProgress(workoutsData);

    setStats({
      totalWorkouts,
      currentStreak,
      weeklyGoal,
      totalExercises: calculateUniqueExercises(workoutsData)
    });

    // Calculate achievements
    const userAchievements = calculateAchievements(workoutsData);
    setAchievements(userAchievements);
  };

  const calculateStreak = (workoutsData) => {
    if (workoutsData.length === 0) return 0;

    let streak = 0;
    let currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);

    for (let workout of workoutsData) {
      const workoutDate = new Date(workout.completedAt);
      workoutDate.setHours(0, 0, 0, 0);

      const dayDiff = Math.floor((currentDate - workoutDate) / (1000 * 60 * 60 * 24));

      if (dayDiff === streak) {
        streak++;
      } else {
        break;
      }
    }

    return streak;
  };

  const calculateWeeklyProgress = (workoutsData) => {
    const now = new Date();
    const weekStart = new Date(now.setDate(now.getDate() - now.getDay()));
    weekStart.setHours(0, 0, 0, 0);

    const weekWorkouts = workoutsData.filter(w =>
      new Date(w.completedAt) >= weekStart
    ).length;

    return `${weekWorkouts}/${weeklyGoalTarget}`;
  };

  const calculateUniqueExercises = (workoutsData) => {
    const exercises = new Set();
    workoutsData.forEach(workout => {
      workout.exercises?.forEach(exercise => {
        exercises.add(exercise.name);
      });
    });
    return exercises.size;
  };

  const calculateRecords = (workoutsData) => {
    const recordsMap = {};

    workoutsData.forEach(workout => {
      workout.exercises?.forEach(exercise => {
        exercise.sets?.forEach(set => {
          const weight = parseFloat(set.weight);
          if (weight && (!recordsMap[exercise.name] || weight > recordsMap[exercise.name])) {
            recordsMap[exercise.name] = weight;
          }
        });
      });
    });

    setRecords(recordsMap);
  };

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const startTimer = () => {
    setTimer(prev => ({
      ...prev,
      isRunning: true,
      startTime: Date.now() - (prev.time * 1000)
    }));
  };

  const pauseTimer = () => {
    setTimer(prev => ({
      ...prev,
      isRunning: false
    }));
  };

  const stopTimer = () => {
    setTimer({
      time: 0,
      isRunning: false,
      startTime: null
    });
  };

  const handleGoalModalOpen = () => {
    setNewGoalTarget(weeklyGoalTarget);
    setGoalModalOpen(true);
  };

  const handleGoalModalClose = () => {
    setGoalModalOpen(false);
    setNewGoalTarget(weeklyGoalTarget);
  };

  const saveWeeklyGoal = async () => {
    try {
      await setDoc(doc(db, 'settings', 'weeklyGoal'), {
        target: parseInt(newGoalTarget),
        updatedAt: new Date()
      });

      setWeeklyGoalTarget(parseInt(newGoalTarget));
      setSnackbar({ open: true, message: 'Weekly goal updated! 🎯', severity: 'success' });
      setGoalModalOpen(false);

      // Recalculate stats with new goal
      calculateStats(workouts);
    } catch (error) {
      console.error('Error saving weekly goal:', error);
      setSnackbar({ open: true, message: 'Error saving goal', severity: 'error' });
    }
  };

  const handleSnackbarClose = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const calculateAchievements = useCallback((workoutsData) => {
    const achievementsList = [];

    // First Workout
    if (workoutsData.length >= 1) {
      achievementsList.push({
        id: 'first_workout',
        title: 'First Steps',
        description: 'Completed your first workout',
        icon: '🏃‍♂️',
        earned: true,
        date: workoutsData[workoutsData.length - 1]?.completedAt
      });
    }

    // Workout Milestones
    const milestones = [5, 10, 25, 50, 100];
    milestones.forEach(milestone => {
      if (workoutsData.length >= milestone) {
        achievementsList.push({
          id: `workouts_${milestone}`,
          title: `${milestone} Workouts`,
          description: `Completed ${milestone} total workouts`,
          icon: milestone === 100 ? '💯' : milestone >= 50 ? '🏆' : milestone >= 25 ? '🥇' : milestone >= 10 ? '🥈' : '🥉',
          earned: true,
          date: workoutsData[workoutsData.length - milestone]?.completedAt
        });
      }
    });

    // Calculate current streak
    const today = new Date();
    let currentStreak = 0;
    const sortedWorkouts = [...workoutsData].sort((a, b) => b.completedAt - a.completedAt);

    for (let workout of sortedWorkouts) {
      const workoutDate = new Date(workout.completedAt);
      const daysDiff = Math.floor((today - workoutDate) / (1000 * 60 * 60 * 24));

      if (daysDiff <= currentStreak + 1) {
        currentStreak++;
      } else {
        break;
      }
    }

    // Streak Achievements
    const streakMilestones = [3, 7, 14, 30];
    streakMilestones.forEach(streak => {
      if (currentStreak >= streak) {
        achievementsList.push({
          id: `streak_${streak}`,
          title: `${streak} Day Streak`,
          description: `Worked out for ${streak} consecutive days`,
          icon: streak >= 30 ? '🔥🔥🔥' : streak >= 14 ? '🔥🔥' : '🔥',
          earned: true,
          date: new Date()
        });
      }
    });

    // Volume Achievements
    const totalVolume = workoutsData.reduce((sum, workout) => sum + (workout.totalVolume || 0), 0);
    const volumeMilestones = [1000, 5000, 10000, 25000, 50000];
    volumeMilestones.forEach(volume => {
      if (totalVolume >= volume) {
        achievementsList.push({
          id: `volume_${volume}`,
          title: `${volume.toLocaleString()}kg Moved`,
          description: `Lifted ${volume.toLocaleString()}kg total volume`,
          icon: volume >= 50000 ? '💪💪💪' : volume >= 25000 ? '💪💪' : '💪',
          earned: true,
          date: new Date()
        });
      }
    });

    return achievementsList.sort((a, b) => b.date - a.date).slice(0, 6); // Latest 6 achievements
  }, []);

  // Memoized StatCard component for better performance
  const StatCard = memo(({ title, value, icon, gradient, onClick }) => (
    <motion.div
      whileHover={{ scale: 1.02, y: -2 }}
      transition={{ duration: 0.2 }}
    >
      <Card
        sx={{
          background: `linear-gradient(135deg, ${gradient})`,
          border: '1px solid rgba(255, 68, 68, 0.2)',
          position: 'relative',
          overflow: 'hidden',
          cursor: onClick ? 'pointer' : 'default',
          height: { xs: 120, sm: 140 }, // Fixed height for consistency
          '&:hover': {
            border: '1px solid #ff4444',
            boxShadow: '0 0 30px rgba(255, 68, 68, 0.3)'
          }
        }}
        onClick={onClick}
      >
        <CardContent sx={{
          textAlign: 'center',
          py: { xs: 2, sm: 3 },
          px: { xs: 1.5, sm: 3 },
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center'
        }}>
          <Box sx={{ mb: { xs: 1, sm: 2 }, color: 'primary.main' }}>
            {icon}
          </Box>
          <Typography
            variant="h3"
            sx={{
              fontWeight: 900,
              background: 'linear-gradient(135deg, #ff4444, #ffaa00)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              mb: { xs: 0.5, sm: 1 },
              fontSize: { xs: '1.5rem', sm: '2rem', md: '3rem' },
              lineHeight: 1.2
            }}
          >
            {value}
          </Typography>
          <Typography
            variant="caption"
            sx={{
              color: 'text.secondary',
              textTransform: 'uppercase',
              letterSpacing: 1,
              fontWeight: 600,
              fontSize: { xs: '0.6rem', sm: '0.75rem' }
            }}
          >
            {title}
          </Typography>
        </CardContent>
      </Card>
    </motion.div>
  ));

  StatCard.displayName = 'StatCard';

  // Memoized WorkoutCard component
  const WorkoutCard = memo(({ workout, onDelete }) => (
    <motion.div
      whileHover={{ x: 3 }}
      transition={{ duration: 0.2 }}
    >
      <Card
        sx={{
          background: 'linear-gradient(135deg, rgba(26, 26, 26, 0.9), rgba(255, 68, 68, 0.05))',
          border: '1px solid #333',
          mb: { xs: 1.5, sm: 2 },
          '&:hover': {
            borderColor: 'primary.main',
            boxShadow: '0 0 20px rgba(255, 68, 68, 0.2)'
          }
        }}
      >
        <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
          <Box sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            mb: { xs: 1.5, sm: 2 },
            flexWrap: 'wrap',
            gap: 1
          }}>
            <Typography
              variant="h6"
              sx={{
                fontSize: { xs: '1rem', sm: '1.25rem' },
                fontWeight: 600,
                flex: 1,
                minWidth: 'fit-content'
              }}
            >
              {workout.programName || 'Workout'}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{
                  fontSize: { xs: '0.7rem', sm: '0.75rem' },
                  whiteSpace: 'nowrap'
                }}
              >
                {workout.completedAt?.toLocaleDateString()}
              </Typography>
              <IconButton
                onClick={() => onDelete(workout.id)}
                color="error"
                size="small"
                sx={{ opacity: 0.7, '&:hover': { opacity: 1 } }}
              >
                <DeleteIcon sx={{ fontSize: 16 }} />
              </IconButton>
            </Box>
          </Box>
          <Box sx={{ mb: 2 }}>
            {workout.exercises?.slice(0, 3).map((exercise, index) => (
              <Box key={index} sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2">{exercise.name}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {exercise.sets?.length || 0} sets
                </Typography>
              </Box>
            ))}
            {workout.exercises?.length > 3 && (
              <Typography variant="body2" color="text.secondary">
                +{workout.exercises.length - 3} more exercises
              </Typography>
            )}
          </Box>
          <Typography variant="caption" color="text.secondary">
            Duration: {formatTime(Math.floor((workout.endTime - workout.startTime) / 1000) || 0)}
          </Typography>
        </CardContent>
      </Card>
    </motion.div>
  ));

  WorkoutCard.displayName = 'WorkoutCard';

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: `
          radial-gradient(circle at 20% 50%, rgba(255, 68, 68, 0.1) 0%, transparent 50%),
          radial-gradient(circle at 80% 80%, rgba(255, 170, 0, 0.05) 0%, transparent 50%)
        `,
        pb: 10
      }}
    >
      {/* Header */}
      <Paper
        sx={{
          background: 'linear-gradient(135deg, #1a1a1a, rgba(255, 68, 68, 0.1))',
          border: '1px solid #333',
          p: 3,
          mb: 3,
          backdropFilter: 'blur(10px)'
        }}
      >
        <Box sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 2,
          px: { xs: 2, sm: 0 }
        }}>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 900,
              background: 'linear-gradient(135deg, #ff4444, #ffaa00)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              textTransform: 'uppercase',
              letterSpacing: { xs: 1, sm: 2 },
              fontSize: { xs: '1.5rem', sm: '2rem', md: '2.5rem' },
              lineHeight: 1.2
            }}
          >
            SHTII PLANNER
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => router.push('/workout')}
            sx={{
              background: 'linear-gradient(135deg, #ff4444, #cc0000)',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: 1,
              minWidth: { xs: 'auto', sm: 120 },
              px: { xs: 2, sm: 3 },
              py: { xs: 1, sm: 1.5 },
              fontSize: { xs: '0.8rem', sm: '0.875rem' }
            }}
          >
            {/* Hide text on very small screens, show icon only */}
            <Box sx={{ display: { xs: 'none', sm: 'inline' } }}>Quick Add</Box>
            <Box sx={{ display: { xs: 'inline', sm: 'none' } }}>+</Box>
          </Button>
        </Box>
      </Paper>

      <Container maxWidth="lg" sx={{ px: { xs: 2, sm: 3 } }}>
        {/* Stats Bar */}
        <Grid
          container
          spacing={{ xs: 1.5, sm: 2 }}
          sx={{ mb: 3 }}
          justifyContent="center"
        >
          <Grid item xs={6} md={3}>
            <StatCard
              title="Total Workouts"
              value={stats.totalWorkouts}
              icon={<FitnessCenterIcon sx={{ fontSize: 40 }} />}
              gradient="rgba(26, 26, 26, 0.9), rgba(255, 68, 68, 0.05)"
            />
          </Grid>
          <Grid item xs={6} md={3}>
            <StatCard
              title="Day Streak 🔥"
              value={stats.currentStreak}
              icon={<TrendingUpIcon sx={{ fontSize: 40 }} />}
              gradient="rgba(26, 26, 26, 0.9), rgba(255, 68, 68, 0.05)"
            />
          </Grid>
          <Grid item xs={6} md={3}>
            <StatCard
              title="Weekly Goal"
              value={stats.weeklyGoal}
              icon={<TrophyIcon sx={{ fontSize: 40 }} />}
              gradient="rgba(26, 26, 26, 0.9), rgba(255, 68, 68, 0.05)"
              onClick={handleGoalModalOpen}
            />
          </Grid>
          <Grid item xs={6} md={3}>
            <StatCard
              title="Exercises"
              value={stats.totalExercises}
              icon={<FitnessCenterIcon sx={{ fontSize: 40 }} />}
              gradient="rgba(26, 26, 26, 0.9), rgba(255, 68, 68, 0.05)"
            />
          </Grid>
        </Grid>

        {/* Current Streak Highlight */}
        {stats.currentStreak > 0 && (
          <Paper
            sx={{
              background: 'linear-gradient(135deg, #1a1a1a, rgba(255, 170, 0, 0.1))',
              border: '2px solid #ffaa00',
              p: 3,
              mb: 3,
              textAlign: 'center'
            }}
          >
            <Typography variant="h6" sx={{ mb: 1, color: '#ffaa00', fontWeight: 700 }}>
              🔥 CURRENT STREAK
            </Typography>
            <Typography
              variant="h2"
              sx={{
                fontWeight: 900,
                background: 'linear-gradient(135deg, #ffaa00, #ff8800)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                mb: 1,
                fontSize: { xs: '2.5rem', md: '3.5rem' }
              }}
            >
              {stats.currentStreak} {stats.currentStreak === 1 ? 'Day' : 'Days'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Keep it up! You&apos;re building a strong fitness habit 💪
            </Typography>
          </Paper>
        )}

        {/* Workout Timer */}
        <Paper
          sx={{
            background: 'linear-gradient(135deg, #1a1a1a, rgba(255, 68, 68, 0.05))',
            border: '1px solid #333',
            p: { xs: 3, sm: 4 },
            mb: 3,
            textAlign: 'center'
          }}
        >
          <Typography
            variant="h2"
            sx={{
              fontWeight: 900,
              background: 'linear-gradient(135deg, #ff4444, #ffaa00)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              mb: { xs: 2, sm: 3 },
              fontSize: { xs: '2.5rem', sm: '3rem', md: '4rem' },
              lineHeight: 1.1
            }}
          >
            {formatTime(timer.time)}
          </Typography>
          <Box sx={{
            display: 'flex',
            justifyContent: 'center',
            gap: { xs: 1.5, sm: 2 },
            flexWrap: 'wrap'
          }}>
            <Button
              variant="contained"
              startIcon={<PlayIcon />}
              onClick={startTimer}
              disabled={timer.isRunning}
              sx={{
                background: 'linear-gradient(135deg, #ff4444, #cc0000)',
                fontWeight: 700,
                minWidth: { xs: 80, sm: 100 },
                py: { xs: 1, sm: 1.5 },
                fontSize: { xs: '0.8rem', sm: '0.875rem' }
              }}
            >
              START
            </Button>
            <Button
              variant="contained"
              startIcon={<PauseIcon />}
              onClick={pauseTimer}
              disabled={!timer.isRunning}
              sx={{
                background: 'linear-gradient(135deg, #ffaa00, #ff8800)',
                color: '#000',
                fontWeight: 700,
                minWidth: { xs: 80, sm: 100 },
                py: { xs: 1, sm: 1.5 },
                fontSize: { xs: '0.8rem', sm: '0.875rem' }
              }}
            >
              PAUSE
            </Button>
            <Button
              variant="contained"
              startIcon={<StopIcon />}
              onClick={stopTimer}
              sx={{
                background: 'linear-gradient(135deg, #ff3333, #cc0000)',
                fontWeight: 700,
                minWidth: { xs: 80, sm: 100 },
                py: { xs: 1, sm: 1.5 },
                fontSize: { xs: '0.8rem', sm: '0.875rem' }
              }}
            >
              END
            </Button>
          </Box>
        </Paper>

        {/* Recent Activity */}
        <Paper
          sx={{
            background: '#1a1a1a',
            border: '1px solid #333',
            p: 3
          }}
        >
          <Typography variant="h5" sx={{ mb: 3, fontWeight: 700, textAlign: 'center' }}>
            RECENT ACTIVITY & PERSONAL RECORDS
          </Typography>
          <Grid container spacing={3} alignItems="flex-start">
            <Grid item xs={12} md={8}>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>
                🔥 RECENT WORKOUTS
              </Typography>
              {workouts.slice(0, 5).map((workout) => (
                <WorkoutCard key={workout.id} workout={workout} onDelete={deleteWorkout} />
              ))}
              {workouts.length === 0 && (
                <Typography color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                  No workouts yet. Time to hit the iron! 💪
                </Typography>
              )}
            </Grid>
            <Grid item xs={12} md={4}>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>
                💪 PERSONAL RECORDS
              </Typography>
              {Object.entries(records).slice(0, 5).map(([exercise, weight]) => (
                <motion.div
                  key={exercise}
                  whileHover={{ x: 3 }}
                  transition={{ duration: 0.2 }}
                >
                  <Card
                    sx={{
                      background: 'linear-gradient(135deg, rgba(26, 26, 26, 0.9), rgba(255, 68, 68, 0.05))',
                      border: '1px solid #333',
                      mb: { xs: 1.5, sm: 2 },
                      '&:hover': {
                        borderColor: 'primary.main',
                        boxShadow: '0 0 20px rgba(255, 68, 68, 0.2)'
                      }
                    }}
                  >
                    <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                      <Typography variant="body1" sx={{ fontWeight: 600, mb: 1 }}>
                        {exercise}
                      </Typography>
                      <Typography variant="h6" color="primary.main">
                        {weight} kg
                      </Typography>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
              {Object.keys(records).length === 0 && (
                <Typography color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                  No PRs yet. Start lifting heavy! 🏋️‍♂️
                </Typography>
              )}
            </Grid>
          </Grid>
        </Paper>

        {/* Achievements Section */}
        {achievements.length > 0 && (
          <Paper
            sx={{
              background: '#1a1a1a',
              border: '1px solid #333',
              p: 3,
              mt: 3
            }}
          >
            <Typography variant="h5" sx={{ mb: 3, fontWeight: 700, textAlign: 'center' }}>
              🏆 ACHIEVEMENTS
            </Typography>
            <Grid container spacing={2}>
              {achievements.map((achievement) => (
                <Grid item xs={12} sm={6} md={4} key={achievement.id}>
                  <motion.div
                    whileHover={{ y: -2, scale: 1.02 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Card
                      sx={{
                        background: 'linear-gradient(135deg, rgba(26, 26, 26, 0.9), rgba(255, 215, 0, 0.1))',
                        border: '2px solid #FFD700',
                        position: 'relative',
                        overflow: 'hidden',
                        '&:hover': {
                          boxShadow: '0 0 30px rgba(255, 215, 0, 0.3)'
                        },
                        transition: 'all 0.3s'
                      }}
                    >
                      <CardContent sx={{ textAlign: 'center', p: 2 }}>
                        <Typography
                          variant="h2"
                          sx={{
                            fontSize: '2.5rem',
                            mb: 1
                          }}
                        >
                          {achievement.icon}
                        </Typography>
                        <Typography
                          variant="h6"
                          sx={{
                            fontWeight: 700,
                            mb: 1,
                            color: '#FFD700'
                          }}
                        >
                          {achievement.title}
                        </Typography>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ fontSize: '0.8rem' }}
                        >
                          {achievement.description}
                        </Typography>

                        {/* Shine effect */}
                        <Box
                          sx={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            height: 4,
                            background: 'linear-gradient(90deg, #FFD700, #FFA500)',
                          }}
                        />
                      </CardContent>
                    </Card>
                  </motion.div>
                </Grid>
              ))}
            </Grid>
          </Paper>
        )}
      </Container>

      {/* Weekly Goal Modal */}
      <Modal open={goalModalOpen} onClose={handleGoalModalClose}>
        <Box sx={modalStyle}>
          <Typography variant="h6" sx={{ mb: 3, fontWeight: 700, textTransform: 'uppercase' }}>
            Set Weekly Goal 🎯
          </Typography>

          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            How many workouts do you want to complete per week?
          </Typography>

          <TextField
            fullWidth
            label="Weekly Workout Target"
            type="number"
            value={newGoalTarget}
            onChange={(e) => setNewGoalTarget(e.target.value)}
            inputProps={{ min: 1, max: 14 }}
            sx={{
              mb: 3,
              '& .MuiOutlinedInput-root': {
                backgroundColor: '#0a0a0a',
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'primary.main'
                }
              }
            }}
          />

          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
            <Button onClick={handleGoalModalClose}>
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={saveWeeklyGoal}
              disabled={!newGoalTarget || newGoalTarget < 1}
              sx={{
                background: 'linear-gradient(135deg, #ff4444, #cc0000)',
                fontWeight: 700
              }}
            >
              Save Goal
            </Button>
          </Box>
        </Box>
      </Modal>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleSnackbarClose} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}