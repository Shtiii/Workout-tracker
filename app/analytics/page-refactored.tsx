'use client';

import { useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Tabs,
  Tab,
  CircularProgress
} from '@mui/material';
import ErrorBoundary from '@/components/ErrorBoundary';
import WorkoutCalendar from '@/components/analytics/WorkoutCalendar';
import ProgressView from '@/components/analytics/ProgressView';
import HistoryView from '@/components/analytics/HistoryView';
import { 
  useAnalyticsData, 
  useProgressData, 
  useExerciseProgressCharts 
} from '@/lib/hooks/useAnalyticsData';

export default function AnalyticsPage(): JSX.Element {
  const [activeTab, setActiveTab] = useState<number>(0);
  const [selectedProgram, setSelectedProgram] = useState<string>('all');
  const [selectedExercise, setSelectedExercise] = useState<string>('all');
  
  // Calendar navigation state
  const [currentCalendarMonth, setCurrentCalendarMonth] = useState<number>(new Date().getMonth());
  const [currentCalendarYear, setCurrentCalendarYear] = useState<number>(new Date().getFullYear());

  // Fetch analytics data
  const {
    workouts,
    programs,
    exerciseList,
    allWorkouts,
    loading,
    error,
    fetchData,
    deleteWorkout
  } = useAnalyticsData();

  // Process progress data
  const exerciseData = useProgressData(workouts, selectedProgram, selectedExercise);
  const chartData = useExerciseProgressCharts(workouts, selectedProgram, selectedExercise);

  // Calendar navigation functions
  const handleMonthChange = (month: number, year: number): void => {
    setCurrentCalendarMonth(month);
    setCurrentCalendarYear(year);
  };

  const goToCurrentMonth = (): void => {
    const today = new Date();
    setCurrentCalendarMonth(today.getMonth());
    setCurrentCalendarYear(today.getFullYear());
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
                  <WorkoutCalendar
                    workouts={workouts}
                    currentMonth={currentCalendarMonth}
                    currentYear={currentCalendarYear}
                    onMonthChange={handleMonthChange}
                    onGoToCurrentMonth={goToCurrentMonth}
                  />
                </Box>
              )}
            </ErrorBoundary>
            <ErrorBoundary fallbackMessage="Progress charts failed to load. Please check your workout data and try again.">
              {activeTab === 1 && (
                <ProgressView
                  exerciseData={exerciseData}
                  chartData={chartData}
                  selectedProgram={selectedProgram}
                  selectedExercise={selectedExercise}
                  programs={programs}
                  exerciseList={exerciseList}
                  onProgramChange={setSelectedProgram}
                  onExerciseChange={setSelectedExercise}
                />
              )}
            </ErrorBoundary>
            <ErrorBoundary fallbackMessage="Workout history failed to load. Please refresh the page and try again.">
              {activeTab === 2 && (
                <HistoryView
                  allWorkouts={allWorkouts}
                  onDeleteWorkout={deleteWorkout}
                />
              )}
            </ErrorBoundary>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
}
