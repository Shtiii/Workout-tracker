'use client';

import { useState } from 'react';
import {
  Paper,
  Typography,
  Box,
  Grid,
  IconButton
} from '@mui/material';
import {
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon
} from '@mui/icons-material';
import { motion } from 'framer-motion';

/**
 * WorkoutCalendar component displays a calendar view of workout sessions
 * @param {Object} props - Component props
 * @param {Array} props.workouts - Array of workout sessions
 * @param {number} props.currentMonth - Current month (0-11)
 * @param {number} props.currentYear - Current year
 * @param {Function} props.onMonthChange - Callback for month navigation
 * @param {Function} props.onGoToCurrentMonth - Callback to go to current month
 */
export default function WorkoutCalendar({ 
  workouts, 
  currentMonth, 
  currentYear, 
  onMonthChange, 
  onGoToCurrentMonth 
}) {
  const getWorkoutCalendar = () => {
    const workoutDates = new Set();
    workouts.forEach(workout => {
      if (workout.completedAt) {
        const dateStr = workout.completedAt.toDateString();
        workoutDates.add(dateStr);
      }
    });

    const today = new Date();
    const firstDay = new Date(currentYear, currentMonth, 1);

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

  const calendar = getWorkoutCalendar();
  const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  const goToPreviousMonth = () => {
    if (currentMonth === 0) {
      onMonthChange(11, currentYear - 1);
    } else {
      onMonthChange(currentMonth - 1, currentYear);
    }
  };

  const goToNextMonth = () => {
    if (currentMonth === 11) {
      onMonthChange(0, currentYear + 1);
    } else {
      onMonthChange(currentMonth + 1, currentYear);
    }
  };

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
            {new Date(currentYear, currentMonth).toLocaleDateString('en-US', {
              month: 'long',
              year: 'numeric'
            })}
          </Typography>
          {(currentMonth !== new Date().getMonth() || currentYear !== new Date().getFullYear()) && (
            <Typography
              variant="caption"
              onClick={onGoToCurrentMonth}
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
}
