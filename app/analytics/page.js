'use client';

import { useState, useEffect, useCallback, useMemo, memo } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Grid,
  Card,
  CardContent,
  Tabs,
  Tab,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress
} from '@mui/material';
import { CalendarMonth as CalendarIcon, TrendingUp as TrendingUpIcon } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export default function AnalyticsPage() {
  const [activeTab, setActiveTab] = useState(0);
  const [workouts, setWorkouts] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProgram, setSelectedProgram] = useState('all');
  const [selectedExercise, setSelectedExercise] = useState('all');
  const [exerciseList, setExerciseList] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    // Extract unique exercises from workouts
    const exercises = new Set();
    workouts.forEach(workout => {
      workout.exercises?.forEach(exercise => {
        exercises.add(exercise.name);
      });
    });
    setExerciseList(Array.from(exercises));
  }, [workouts]);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch workouts
      const workoutsQuery = query(
        collection(db, 'workoutSessions'),
        orderBy('completedAt', 'asc')
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

    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getWorkoutCalendar = () => {
    const workoutDates = new Set();
    workouts.forEach(workout => {
      if (workout.completedAt) {
        const dateStr = workout.completedAt.toDateString();
        workoutDates.add(dateStr);
      }
    });

    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());

    const calendar = [];
    let week = [];

    for (let i = 0; i < 42; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);

      const hasWorkout = workoutDates.has(date.toDateString());
      const isCurrentMonth = date.getMonth() === currentMonth;
      const isToday = date.toDateString() === today.toDateString();

      week.push({
        date: date.getDate(),
        fullDate: new Date(date),
        hasWorkout,
        isCurrentMonth,
        isToday
      });

      if (week.length === 7) {
        calendar.push(week);
        week = [];
      }
    }

    return calendar;
  };

  const getProgressData = () => {
    let filteredWorkouts = workouts;

    // Filter by program if selected
    if (selectedProgram !== 'all') {
      filteredWorkouts = filteredWorkouts.filter(w => w.programName === selectedProgram);
    }

    // Aggregate exercise data
    const exerciseData = {};

    filteredWorkouts.forEach(workout => {
      workout.exercises?.forEach(exercise => {
        if (selectedExercise === 'all' || exercise.name === selectedExercise) {
          if (!exerciseData[exercise.name]) {
            exerciseData[exercise.name] = [];
          }

          exercise.sets?.forEach(set => {
            const weight = parseFloat(set.weight);
            const reps = parseInt(set.reps);
            if (weight && reps) {
              const oneRepMax = weight * (1 + reps / 30);
              exerciseData[exercise.name].push({
                date: workout.completedAt,
                weight,
                reps,
                oneRepMax,
                volume: weight * reps
              });
            }
          });
        }
      });
    });

    return exerciseData;
  };

  const CalendarView = () => {
    const calendar = getWorkoutCalendar();
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    return (
      <Paper
        sx={{
          background: '#1a1a1a',
          border: '1px solid #333',
          p: 3
        }}
      >
        <Typography variant="h5" sx={{ mb: 3, fontWeight: 700, textAlign: 'center' }}>
          WORKOUT CALENDAR
        </Typography>

        <Grid container sx={{ mb: 2 }}>
          {dayNames.map(day => (
            <Grid item xs key={day} sx={{ textAlign: 'center' }}>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{
                  fontWeight: 600,
                  fontSize: { xs: '0.6rem', sm: '0.75rem' }
                }}
              >
                {day}
              </Typography>
            </Grid>
          ))}
        </Grid>

        {calendar.map((week, weekIndex) => (
          <Grid container key={weekIndex} sx={{ mb: { xs: 0.5, sm: 1 } }}>
            {week.map((day, dayIndex) => (
              <Grid item xs key={dayIndex} sx={{ p: { xs: 0.25, sm: 0.5 } }}>
                <Box
                  sx={{
                    height: { xs: 35, sm: 40 },
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: 1,
                    cursor: 'pointer',
                    backgroundColor: day.hasWorkout ? '#ff4444' : 'transparent',
                    border: day.isToday ? '2px solid #ffaa00' : day.hasWorkout ? '1px solid #ff4444' : '1px solid #333',
                    opacity: day.isCurrentMonth ? 1 : 0.3,
                    '&:hover': {
                      backgroundColor: day.hasWorkout ? '#ff6666' : '#333'
                    },
                    // Better touch targets on mobile
                    minHeight: { xs: 35, sm: 40 },
                    minWidth: { xs: 35, sm: 40 }
                  }}
                >
                  <Typography
                    variant="body2"
                    sx={{
                      color: day.hasWorkout ? '#000' : 'text.primary',
                      fontWeight: day.isToday ? 700 : day.hasWorkout ? 600 : 400
                    }}
                  >
                    {day.date}
                  </Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        ))}

        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center', gap: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ width: 16, height: 16, backgroundColor: '#ff4444', borderRadius: 1 }} />
            <Typography variant="caption">Workout Day</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ width: 16, height: 16, border: '2px solid #ffaa00', borderRadius: 1 }} />
            <Typography variant="caption">Today</Typography>
          </Box>
        </Box>
      </Paper>
    );
  };

  const ProgressView = () => {
    const exerciseData = getProgressData();

    return (
      <Paper
        sx={{
          background: '#1a1a1a',
          border: '1px solid #333',
          p: 3
        }}
      >
        <Typography variant="h5" sx={{ mb: 3, fontWeight: 700, textAlign: 'center' }}>
          PROGRESS TRACKING
        </Typography>

        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel sx={{ color: 'text.secondary' }}>Program</InputLabel>
              <Select
                value={selectedProgram}
                onChange={(e) => setSelectedProgram(e.target.value)}
                label="Program"
                sx={{
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#333'
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'primary.main'
                  }
                }}
              >
                <MenuItem value="all">All Programs</MenuItem>
                {programs.map(program => (
                  <MenuItem key={program.id} value={program.name}>
                    {program.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel sx={{ color: 'text.secondary' }}>Exercise</InputLabel>
              <Select
                value={selectedExercise}
                onChange={(e) => setSelectedExercise(e.target.value)}
                label="Exercise"
                sx={{
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#333'
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'primary.main'
                  }
                }}
              >
                <MenuItem value="all">All Exercises</MenuItem>
                {exerciseList.map(exercise => (
                  <MenuItem key={exercise} value={exercise}>
                    {exercise}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>

        <Box sx={{ backgroundColor: '#0a0a0a', borderRadius: 2, p: 3 }}>
          <Grid container spacing={3}>
            {Object.entries(exerciseData).map(([exerciseName, data]) => {
              if (data.length === 0) return null;

              // Calculate progress metrics
              const sortedData = data.sort((a, b) => a.date - b.date);
              const firstRecord = sortedData[0];
              const lastRecord = sortedData[sortedData.length - 1];
              const improvement = lastRecord.oneRepMax - firstRecord.oneRepMax;
              const improvementPercent = ((improvement / firstRecord.oneRepMax) * 100).toFixed(1);

              return (
                <Grid item xs={12} md={6} lg={4} key={exerciseName}>
                  <motion.div
                    whileHover={{ y: -5 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Card
                      sx={{
                        background: 'linear-gradient(135deg, rgba(26, 26, 26, 0.9), rgba(255, 68, 68, 0.05))',
                        border: '1px solid #333',
                        '&:hover': {
                          borderColor: 'primary.main',
                          boxShadow: '0 0 20px rgba(255, 68, 68, 0.3)'
                        }
                      }}
                    >
                      <CardContent>
                        <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                          {exerciseName}
                        </Typography>

                        <Box sx={{ mb: 2 }}>
                          <Typography variant="body2" color="text.secondary">
                            Best 1RM
                          </Typography>
                          <Typography
                            variant="h4"
                            sx={{
                              fontWeight: 900,
                              background: 'linear-gradient(135deg, #ff4444, #ffaa00)',
                              backgroundClip: 'text',
                              WebkitBackgroundClip: 'text',
                              WebkitTextFillColor: 'transparent'
                            }}
                          >
                            {Math.max(...data.map(d => d.oneRepMax)).toFixed(1)} lbs
                          </Typography>
                        </Box>

                        <Box sx={{ mb: 2 }}>
                          <Typography variant="body2" color="text.secondary">
                            Total Sessions
                          </Typography>
                          <Typography variant="h6">
                            {new Set(data.map(d => d.date.toDateString())).size}
                          </Typography>
                        </Box>

                        {improvement > 0 && (
                          <Box>
                            <Typography variant="body2" color="text.secondary">
                              Improvement
                            </Typography>
                            <Typography
                              variant="body1"
                              sx={{ color: '#00ff88', fontWeight: 600 }}
                            >
                              +{improvement.toFixed(1)} lbs ({improvementPercent}%)
                            </Typography>
                          </Box>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                </Grid>
              );
            })}
          </Grid>

          {Object.keys(exerciseData).length === 0 && (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', py: 8 }}>
              <Typography color="text.secondary" variant="h6">
                No progress data available. Complete more workouts to see your progress! 💪
              </Typography>
            </Box>
          )}
        </Box>
      </Paper>
    );
  };

  if (loading) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          background: `
            radial-gradient(circle at 20% 50%, rgba(255, 68, 68, 0.1) 0%, transparent 50%),
            radial-gradient(circle at 80% 80%, rgba(255, 170, 0, 0.05) 0%, transparent 50%)
          `,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <CircularProgress size={60} sx={{ color: 'primary.main' }} />
      </Box>
    );
  }

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
        <Typography
          variant="h4"
          sx={{
            fontWeight: 900,
            background: 'linear-gradient(135deg, #ff4444, #ffaa00)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            textTransform: 'uppercase',
            letterSpacing: 2,
            textAlign: 'center'
          }}
        >
          📊 ANALYTICS
        </Typography>
      </Paper>

      <Container maxWidth="lg" sx={{ px: { xs: 2, sm: 3 } }}>
        <Paper
          sx={{
            background: '#1a1a1a',
            border: '1px solid #333',
            borderRadius: 2,
            overflow: 'hidden'
          }}
        >
          <Tabs
            value={activeTab}
            onChange={(e, newValue) => setActiveTab(newValue)}
            sx={{
              borderBottom: '1px solid #333',
              '& .MuiTab-root': {
                textTransform: 'uppercase',
                fontWeight: 700,
                letterSpacing: 1
              }
            }}
          >
            <Tab label="📅 Calendar" />
            <Tab label="📈 Progress" />
          </Tabs>

          <Box sx={{ p: 3 }}>
            {activeTab === 0 && <CalendarView />}
            {activeTab === 1 && <ProgressView />}
          </Box>
        </Paper>
      </Container>
    </Box>
  );
}