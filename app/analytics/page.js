'use client';

import { useState, useEffect } from 'react';
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
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton
} from '@mui/material';
import {
  Delete as DeleteIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { collection, getDocs, query, orderBy, deleteDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import dynamic from 'next/dynamic';
import ErrorBoundary from '@/components/ErrorBoundary';

// Dynamically import the Chart component to prevent SSR issues
const Chart = dynamic(() => import('@/components/Chart'), {
  ssr: false,
  loading: () => (
    <Box sx={{
      height: 280,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <CircularProgress size={40} sx={{ color: 'primary.main' }} />
    </Box>
  )
});

export default function AnalyticsPage() {
  const [activeTab, setActiveTab] = useState(0);
  const [workouts, setWorkouts] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedProgram, setSelectedProgram] = useState('all');
  const [selectedExercise, setSelectedExercise] = useState('all');
  const [exerciseList, setExerciseList] = useState([]);
  const [allWorkouts, setAllWorkouts] = useState([]);

  // Calendar navigation state
  const [currentCalendarMonth, setCurrentCalendarMonth] = useState(new Date().getMonth());
  const [currentCalendarYear, setCurrentCalendarYear] = useState(new Date().getFullYear());

  // Calendar navigation functions
  const goToPreviousMonth = () => {
    if (currentCalendarMonth === 0) {
      setCurrentCalendarMonth(11);
      setCurrentCalendarYear(currentCalendarYear - 1);
    } else {
      setCurrentCalendarMonth(currentCalendarMonth - 1);
    }
  };

  const goToNextMonth = () => {
    if (currentCalendarMonth === 11) {
      setCurrentCalendarMonth(0);
      setCurrentCalendarYear(currentCalendarYear + 1);
    } else {
      setCurrentCalendarMonth(currentCalendarMonth + 1);
    }
  };

  const goToCurrentMonth = () => {
    const today = new Date();
    setCurrentCalendarMonth(today.getMonth());
    setCurrentCalendarYear(today.getFullYear());
  };

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
      setError(null);

      // Check if Firebase is available
      if (!db) {
        throw new Error('Firebase not initialized. Check your configuration.');
      }

      // Fetch workouts
      const workoutsQuery = query(
        collection(db, 'workoutSessions'),
        orderBy('completedAt', 'asc')
      );
      const workoutsSnapshot = await getDocs(workoutsQuery);
      const workoutsData = workoutsSnapshot.docs.map(doc => {
        try {
          return {
            id: doc.id,
            ...doc.data(),
            completedAt: doc.data().completedAt?.toDate()
          };
        } catch (docError) {
          console.warn('Error processing workout document:', doc.id, docError);
          return null;
        }
      }).filter(Boolean); // Remove null entries

      setWorkouts(workoutsData);
      setAllWorkouts(workoutsData);

      // Fetch programs
      const programsSnapshot = await getDocs(collection(db, 'programs'));
      const programsData = programsSnapshot.docs.map(doc => {
        try {
          return {
            id: doc.id,
            ...doc.data()
          };
        } catch (docError) {
          console.warn('Error processing program document:', doc.id, docError);
          return null;
        }
      }).filter(Boolean); // Remove null entries

      setPrograms(programsData);

    } catch (error) {
      console.error('Error fetching data:', error);
      setError(error);
    } finally {
      setLoading(false);
    }
  };

  const deleteWorkout = async (workoutId) => {
    if (confirm('Are you sure you want to delete this workout? This action cannot be undone.')) {
      try {
        await deleteDoc(doc(db, 'workoutSessions', workoutId));
        // Refresh data
        await fetchData();
      } catch (error) {
        console.error('Error deleting workout:', error);
        alert('Error deleting workout. Please try again.');
      }
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
    const firstDay = new Date(currentCalendarYear, currentCalendarMonth, 1);

    // Calculate start date for Monday-based week
    const startDate = new Date(firstDay);
    const dayOfWeek = firstDay.getDay();
    // Adjust for Monday start: Sunday (0) becomes 6, Monday (1) becomes 0, etc.
    const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    startDate.setDate(startDate.getDate() - daysFromMonday);

    const calendar = [];
    let week = [];

    for (let i = 0; i < 42; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);

      const hasWorkout = workoutDates.has(date.toDateString());
      const isCurrentMonth = date.getMonth() === currentCalendarMonth;
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

  const getExerciseProgressCharts = () => {
    const exerciseData = {};

    const filteredWorkouts = workouts.filter(workout => {
      if (selectedProgram !== 'all' && workout.programName !== selectedProgram) return false;
      return true;
    });

    filteredWorkouts.forEach(workout => {
      workout.exercises?.forEach(exercise => {
        if (selectedExercise !== 'all' && exercise.name !== selectedExercise) return;

        if (!exerciseData[exercise.name]) {
          exerciseData[exercise.name] = [];
        }

        // Find the best set for this exercise in this workout
        let bestWeight = 0;
        exercise.sets?.forEach(set => {
          const weight = parseFloat(set.weight);
          if (weight && set.completed && weight > bestWeight) {
            bestWeight = weight;
          }
        });

        if (bestWeight > 0) {
          exerciseData[exercise.name].push({
            date: workout.completedAt.toLocaleDateString('en-GB', { month: 'short', day: 'numeric' }),
            weight: bestWeight,
            fullDate: workout.completedAt
          });
        }
      });
    });

    // Sort by date and limit to top exercises
    Object.keys(exerciseData).forEach(exercise => {
      exerciseData[exercise].sort((a, b) => a.fullDate - b.fullDate);
    });

    // Return top 4 exercises with most data points
    return Object.entries(exerciseData)
      .filter(([, data]) => data.length >= 2)
      .sort(([, a], [, b]) => b.length - a.length)
      .slice(0, 4)
      .map(([name, data]) => ({
        name,
        data: data.slice(-10) // Last 10 data points
      }));
  };

  const CalendarView = () => {
    const calendar = getWorkoutCalendar();
    const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    return (
      <Paper
        sx={{
          background: '#1a1a1a',
          border: '1px solid #333',
          p: 3,
          maxWidth: 600,
          mx: 'auto' // Center the calendar horizontally
        }}
      >
        <Typography variant="h5" sx={{ mb: 3, fontWeight: 700, textAlign: 'center' }}>
          WORKOUT CALENDAR
        </Typography>

        {/* Month Navigation Header */}
        <Box sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 3,
          px: 1
        }}>
          <IconButton
            onClick={goToPreviousMonth}
            sx={{
              color: '#ffaa00',
              '&:hover': { backgroundColor: 'rgba(255, 170, 0, 0.1)' }
            }}
          >
            <ChevronLeftIcon />
          </IconButton>

          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h6" sx={{ fontWeight: 700, color: '#ffaa00' }}>
              {new Date(currentCalendarYear, currentCalendarMonth).toLocaleDateString('en-US', {
                month: 'long',
                year: 'numeric'
              })}
            </Typography>
            {(currentCalendarMonth !== new Date().getMonth() || currentCalendarYear !== new Date().getFullYear()) && (
              <Typography
                variant="caption"
                onClick={goToCurrentMonth}
                sx={{
                  color: '#ff4444',
                  cursor: 'pointer',
                  textDecoration: 'underline',
                  fontSize: '0.7rem',
                  '&:hover': { color: '#ff6666' }
                }}
              >
                Go to current month
              </Typography>
            )}
          </Box>

          <IconButton
            onClick={goToNextMonth}
            sx={{
              color: '#ffaa00',
              '&:hover': { backgroundColor: 'rgba(255, 170, 0, 0.1)' }
            }}
          >
            <ChevronRightIcon />
          </IconButton>
        </Box>

        <Grid container sx={{ mb: 2 }}>
          {dayNames.map(day => (
            <Grid item xs key={day} sx={{ p: { xs: 0.5, sm: 0.75 } }}>
              <Box sx={{
                textAlign: 'center',
                height: { xs: 45, sm: 50, md: 55 }, // Match day cell heights exactly
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 2, // Match day cell border radius for perfect alignment
                minHeight: { xs: 45, sm: 50, md: 55 }, // Match day cell minimum heights
                minWidth: { xs: 45, sm: 50, md: 55 } // Match day cell minimum widths exactly
              }}>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{
                    fontWeight: 700,
                    fontSize: { xs: '0.75rem', sm: '0.875rem' },
                    textTransform: 'uppercase',
                    letterSpacing: 1
                  }}
                >
                  {day}
                </Typography>
              </Box>
            </Grid>
          ))}
        </Grid>

        {calendar.map((week, weekIndex) => (
          <Grid container key={weekIndex} sx={{ mb: { xs: 1, sm: 1.5 } }}>
            {week.map((day, dayIndex) => (
              <Grid item xs key={dayIndex} sx={{ p: { xs: 0.5, sm: 0.75 } }}>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                >
                  <Box
                    sx={{
                      height: { xs: 45, sm: 50, md: 55 },
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: 2,
                      cursor: 'pointer',
                      backgroundColor: day.hasWorkout ? '#ff4444' : 'rgba(26, 26, 26, 0.5)',
                      border: day.isToday ? '2px solid #ffaa00' : day.hasWorkout ? '1px solid #ff4444' : '1px solid #444',
                      opacity: day.isCurrentMonth ? 1 : 0.4,
                      position: 'relative',
                      transition: 'all 0.2s ease-in-out',
                      '&:hover': {
                        backgroundColor: day.hasWorkout ? '#ff6666' : 'rgba(255, 68, 68, 0.1)',
                        transform: 'translateY(-2px)',
                        boxShadow: day.hasWorkout
                          ? '0 4px 20px rgba(255, 68, 68, 0.4)'
                          : '0 4px 15px rgba(255, 68, 68, 0.2)'
                      },
                      minHeight: { xs: 45, sm: 50, md: 55 },
                      minWidth: { xs: 45, sm: 50, md: 55 }
                    }}
                  >
                    <Typography
                      variant="body1"
                      sx={{
                        color: day.hasWorkout ? '#000' : 'text.primary',
                        fontWeight: day.isToday ? 800 : day.hasWorkout ? 700 : 500,
                        fontSize: { xs: '0.875rem', sm: '1rem' }
                      }}
                    >
                      {day.date}
                    </Typography>
                    {day.hasWorkout && (
                      <Box
                        sx={{
                          position: 'absolute',
                          top: 4,
                          right: 4,
                          width: 6,
                          height: 6,
                          backgroundColor: '#000',
                          borderRadius: '50%'
                        }}
                      />
                    )}
                  </Box>
                </motion.div>
              </Grid>
            ))}
          </Grid>
        ))}

        <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center', gap: 4, flexWrap: 'wrap' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box sx={{
              width: 20,
              height: 20,
              backgroundColor: '#ff4444',
              borderRadius: 2,
              position: 'relative'
            }}>
              <Box
                sx={{
                  position: 'absolute',
                  top: 2,
                  right: 2,
                  width: 4,
                  height: 4,
                  backgroundColor: '#000',
                  borderRadius: '50%'
                }}
              />
            </Box>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>Workout Day</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box sx={{
              width: 20,
              height: 20,
              border: '2px solid #ffaa00',
              borderRadius: 2,
              backgroundColor: 'rgba(26, 26, 26, 0.5)'
            }} />
            <Typography variant="body2" sx={{ fontWeight: 600 }}>Today</Typography>
          </Box>
        </Box>
      </Paper>
    );
  };

  const ProgressView = () => {
    const exerciseData = getProgressData();
    const chartData = getExerciseProgressCharts();

    return (
      <Box>
        {/* Progress Charts */}
        {chartData.length > 0 && (
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
                mb: 3,
                fontWeight: 700,
                textAlign: 'center',
                fontSize: { xs: '1.1rem', sm: '1.25rem' },
                lineHeight: 1.2
              }}
            >
              STRENGTH PROGRESSION
            </Typography>
            <Grid container spacing={3}>
              {chartData.map((exercise) => (
                <Grid item xs={12} md={6} key={exercise.name}>
                  <Box
                    sx={{
                      p: 3,
                      background: 'linear-gradient(135deg, rgba(26, 26, 26, 0.9), rgba(255, 68, 68, 0.05))',
                      border: '1px solid #333',
                      borderRadius: 2,
                      height: 350
                    }}
                  >
                    <Typography variant="h6" sx={{ mb: 2, fontWeight: 700, textAlign: 'center' }}>
                      {exercise.name}
                    </Typography>
                    <Chart
                      data={{
                        labels: exercise.data.map(d => d.date),
                        datasets: [
                          {
                            label: 'Max Weight (kg)',
                            data: exercise.data.map(d => d.weight),
                            borderColor: '#ff4444',
                            backgroundColor: 'rgba(255, 68, 68, 0.1)',
                            borderWidth: 3,
                            pointBackgroundColor: '#ff4444',
                            pointBorderColor: '#ffffff',
                            pointBorderWidth: 2,
                            pointRadius: 6,
                            tension: 0.4,
                            fill: true
                          }
                        ]
                      }}
                      options={{
                        plugins: {
                          legend: {
                            display: false
                          },
                          tooltip: {
                            backgroundColor: '#1a1a1a',
                            titleColor: '#fff',
                            bodyColor: '#fff',
                            borderColor: '#ff4444',
                            borderWidth: 1
                          }
                        },
                        scales: {
                          x: {
                            grid: {
                              color: '#333'
                            },
                            ticks: {
                              color: '#ccc',
                              maxTicksLimit: 5
                            }
                          },
                          y: {
                            grid: {
                              color: '#333'
                            },
                            ticks: {
                              color: '#ccc',
                              callback: function(value) {
                                return value + ' kg';
                              }
                            }
                          }
                        }
                      }}
                      title={exercise.name}
                      height={280}
                    />
                  </Box>
                </Grid>
              ))}
            </Grid>
          </Paper>
        )}

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
            DETAILED PROGRESS
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
                            {Math.max(...data.map(d => d.oneRepMax)).toFixed(1)} kg
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
                              +{improvement.toFixed(1)} kg ({improvementPercent}%)
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
      </Box>
    );
  };

  const HistoryView = () => {
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
                    onClick={() => deleteWorkout(workout.id)}
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

  if (error) {
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
          justifyContent: 'center',
          p: 3
        }}
      >
        <ErrorBoundary
          fallbackMessage="Failed to load analytics data. Please check your internet connection and Firebase configuration."
          onRetry={() => {
            setError(null);
            fetchData();
          }}
        >
          <div></div>
        </ErrorBoundary>
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
          variant="h5"
          sx={{
            fontWeight: 800,
            background: 'linear-gradient(135deg, #ff4444, #ffaa00)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            textTransform: 'uppercase',
            letterSpacing: 1,
            textAlign: 'center',
            fontSize: { xs: '1.4rem', sm: '1.5rem' },
            lineHeight: 1.2
          }}
        >
          ANALYTICS
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
            <Tab label="Calendar" />
            <Tab label="Progress" />
            <Tab label="History" />
          </Tabs>

          <Box sx={{ p: 3, display: 'flex', justifyContent: 'center' }}>
            <ErrorBoundary fallbackMessage="Calendar view failed to load. Please refresh the page and try again.">
              {activeTab === 0 && (
                <Box sx={{ width: '100%', maxWidth: '800px' }}>
                  <CalendarView />
                </Box>
              )}
            </ErrorBoundary>
            <ErrorBoundary fallbackMessage="Progress charts failed to load. Please check your workout data and try again.">
              {activeTab === 1 && <ProgressView />}
            </ErrorBoundary>
            <ErrorBoundary fallbackMessage="Workout history failed to load. Please refresh the page and try again.">
              {activeTab === 2 && <HistoryView />}
            </ErrorBoundary>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
}