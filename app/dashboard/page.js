'use client';

import { useState, useEffect } from 'react';
import {
  Container,
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Tabs,
  Tab,
  Button,
  Paper,
  LinearProgress,
  Chip,
  IconButton
} from '@mui/material';
import {
  FitnessCenter as FitnessCenterIcon,
  Timer as TimerIcon,
  EmojiEvents as TrophyIcon,
  TrendingUp as TrendingUpIcon,
  PlayArrow as PlayIcon,
  Pause as PauseIcon,
  Stop as StopIcon,
  Add as AddIcon
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { collection, getDocs, addDoc, orderBy, query } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState(0);
  const [workouts, setWorkouts] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [goals, setGoals] = useState([]);
  const [records, setRecords] = useState({});
  const [stats, setStats] = useState({
    totalWorkouts: 0,
    currentStreak: 0,
    weeklyGoal: '0/3',
    totalExercises: 0
  });
  const [timer, setTimer] = useState({
    time: 0,
    isRunning: false,
    startTime: null
  });

  useEffect(() => {
    fetchData();
  }, []);

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

  const fetchData = async () => {
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

      // Fetch programs
      const programsSnapshot = await getDocs(collection(db, 'programs'));
      const programsData = programsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setPrograms(programsData);

      // Calculate stats
      calculateStats(workoutsData);
      calculateRecords(workoutsData);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

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

    return `${weekWorkouts}/3`;
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
    setTimer({
      time: 0,
      isRunning: true,
      startTime: Date.now()
    });
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

  const StatCard = ({ title, value, icon, gradient }) => (
    <motion.div
      whileHover={{ scale: 1.05, y: -5 }}
      transition={{ duration: 0.2 }}
    >
      <Card
        sx={{
          background: `linear-gradient(135deg, ${gradient})`,
          border: '1px solid rgba(255, 68, 68, 0.2)',
          position: 'relative',
          overflow: 'hidden',
          cursor: 'pointer',
          '&:hover': {
            border: '1px solid #ff4444',
            boxShadow: '0 0 30px rgba(255, 68, 68, 0.3)'
          }
        }}
      >
        <CardContent sx={{ textAlign: 'center', py: 3 }}>
          <Box sx={{ mb: 2, color: 'primary.main' }}>
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
              mb: 1
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
              fontWeight: 600
            }}
          >
            {title}
          </Typography>
        </CardContent>
      </Card>
    </motion.div>
  );

  const WorkoutCard = ({ workout }) => (
    <motion.div
      whileHover={{ x: 5 }}
      transition={{ duration: 0.2 }}
    >
      <Card
        sx={{
          background: 'linear-gradient(135deg, rgba(26, 26, 26, 0.9), rgba(255, 68, 68, 0.05))',
          border: '1px solid #333',
          mb: 2,
          '&:hover': {
            borderColor: 'primary.main',
            boxShadow: '0 0 20px rgba(255, 68, 68, 0.2)'
          }
        }}
      >
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="h6">{workout.programName || 'Workout'}</Typography>
            <Typography variant="caption" color="text.secondary">
              {workout.completedAt?.toLocaleDateString()}
            </Typography>
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
  );

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
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 900,
              background: 'linear-gradient(135deg, #ff4444, #ffaa00)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              textTransform: 'uppercase',
              letterSpacing: 2
            }}
          >
            💀 IRONTRACK
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            sx={{
              background: 'linear-gradient(135deg, #ff4444, #cc0000)',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: 1
            }}
          >
            Quick Add
          </Button>
        </Box>
      </Paper>

      <Container maxWidth="lg">
        {/* Stats Bar */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
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

        {/* Workout Timer */}
        <Paper
          sx={{
            background: 'linear-gradient(135deg, #1a1a1a, rgba(255, 68, 68, 0.05))',
            border: '1px solid #333',
            p: 4,
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
              mb: 3,
              fontSize: { xs: '3rem', md: '4rem' }
            }}
          >
            {formatTime(timer.time)}
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
            <Button
              variant="contained"
              startIcon={<PlayIcon />}
              onClick={startTimer}
              disabled={timer.isRunning}
              sx={{
                background: 'linear-gradient(135deg, #ff4444, #cc0000)',
                fontWeight: 700
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
                fontWeight: 700
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
                fontWeight: 700
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
          <Typography variant="h5" sx={{ mb: 3, fontWeight: 700 }}>
            RECENT ACTIVITY
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} md={8}>
              {workouts.slice(0, 5).map((workout, index) => (
                <WorkoutCard key={workout.id} workout={workout} />
              ))}
              {workouts.length === 0 && (
                <Typography color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                  No workouts yet. Time to hit the iron! 💪
                </Typography>
              )}
            </Grid>
            <Grid item xs={12} md={4}>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>
                PERSONAL RECORDS 🏆
              </Typography>
              {Object.entries(records).slice(0, 5).map(([exercise, weight]) => (
                <Box key={exercise} sx={{ mb: 2, p: 2, border: '1px solid #333', borderRadius: 1 }}>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>{exercise}</Typography>
                  <Typography variant="h6" color="primary.main">
                    {weight} lbs
                  </Typography>
                </Box>
              ))}
              {Object.keys(records).length === 0 && (
                <Typography color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                  No PRs yet. Start lifting heavy! 🏋️‍♂️
                </Typography>
              )}
            </Grid>
          </Grid>
        </Paper>
      </Container>
    </Box>
  );
}