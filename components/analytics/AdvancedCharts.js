'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  ButtonGroup,
  Chip,
  Tooltip,
  IconButton,
  Paper
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  TrendingFlat as TrendingFlatIcon,
  BarChart as BarChartIcon,
  LineChart as LineChartIcon,
  PieChart as PieChartIcon,
  ShowChart as ShowChartIcon,
  Download as DownloadIcon,
  Fullscreen as FullscreenIcon
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import dynamic from 'next/dynamic';

// Dynamically import Chart.js components to prevent SSR issues
const Chart = dynamic(() => import('react-chartjs-2'), {
  ssr: false,
  loading: () => (
    <Box sx={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Typography>Loading chart...</Typography>
    </Box>
  )
});

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip as ChartTooltip,
  Legend,
  ArcElement,
  Filler
} from 'chart.js';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  ChartTooltip,
  Legend,
  ArcElement,
  Filler
);

/**
 * Advanced Charts Component
 * Provides comprehensive workout analytics with multiple chart types
 */
export default function AdvancedCharts({
  workoutHistory = [],
  selectedExercise = null,
  selectedProgram = null,
  timeRange = '30d',
  onTimeRangeChange,
  onExerciseChange,
  onProgramChange
}) {
  const [chartType, setChartType] = useState('line');
  const [metric, setMetric] = useState('weight');
  const [showFullscreen, setShowFullscreen] = useState(false);

  // Filter workouts based on selections
  const filteredWorkouts = useMemo(() => {
    let workouts = workoutHistory;

    // Filter by program
    if (selectedProgram) {
      workouts = workouts.filter(workout => workout.programName === selectedProgram);
    }

    // Filter by time range
    const now = new Date();
    const daysAgo = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : timeRange === '90d' ? 90 : 365;
    const cutoffDate = new Date(now.getTime() - (daysAgo * 24 * 60 * 60 * 1000));
    workouts = workouts.filter(workout => new Date(workout.completedAt) >= cutoffDate);

    return workouts.sort((a, b) => new Date(a.completedAt) - new Date(b.completedAt));
  }, [workoutHistory, selectedProgram, timeRange]);

  // Calculate exercise progress data
  const exerciseProgressData = useMemo(() => {
    if (!selectedExercise || filteredWorkouts.length === 0) return null;

    const exerciseData = filteredWorkouts
      .flatMap(workout => workout.exercises)
      .filter(exercise => exercise.name === selectedExercise)
      .map(exercise => {
        const bestSet = exercise.sets
          .filter(set => set.completed)
          .reduce((best, set) => {
            if (metric === 'weight') {
              return set.weight > best.weight ? set : best;
            } else if (metric === 'volume') {
              const setVolume = set.weight * set.reps;
              const bestVolume = best.weight * best.reps;
              return setVolume > bestVolume ? set : best;
            } else {
              return set.reps > best.reps ? set : best;
            }
          }, { weight: 0, reps: 0 });

        return {
          date: exercise.completedAt,
          value: metric === 'volume' ? bestSet.weight * bestSet.reps : bestSet[metric],
          weight: bestSet.weight,
          reps: bestSet.reps,
          volume: bestSet.weight * bestSet.reps
        };
      })
      .filter(data => data.value > 0);

    return exerciseData;
  }, [filteredWorkouts, selectedExercise, metric]);

  // Calculate workout volume over time
  const volumeData = useMemo(() => {
    const volumeMap = new Map();
    
    filteredWorkouts.forEach(workout => {
      const date = new Date(workout.completedAt).toISOString().split('T')[0];
      const totalVolume = workout.exercises.reduce((sum, exercise) => {
        return sum + exercise.sets
          .filter(set => set.completed)
          .reduce((exerciseSum, set) => exerciseSum + (set.weight * set.reps), 0);
      }, 0);
      
      if (volumeMap.has(date)) {
        volumeMap.set(date, volumeMap.get(date) + totalVolume);
      } else {
        volumeMap.set(date, totalVolume);
      }
    });

    return Array.from(volumeMap.entries())
      .map(([date, volume]) => ({ date, volume }))
      .sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [filteredWorkouts]);

  // Calculate muscle group distribution
  const muscleGroupData = useMemo(() => {
    const muscleGroups = {};
    
    filteredWorkouts.forEach(workout => {
      workout.exercises.forEach(exercise => {
        const category = exercise.category || 'Other';
        const volume = exercise.sets
          .filter(set => set.completed)
          .reduce((sum, set) => sum + (set.weight * set.reps), 0);
        
        if (muscleGroups[category]) {
          muscleGroups[category] += volume;
        } else {
          muscleGroups[category] = volume;
        }
      });
    });

    return Object.entries(muscleGroups)
      .map(([muscle, volume]) => ({ muscle, volume }))
      .sort((a, b) => b.volume - a.volume);
  }, [filteredWorkouts]);

  // Calculate workout frequency
  const frequencyData = useMemo(() => {
    const frequencyMap = new Map();
    
    filteredWorkouts.forEach(workout => {
      const week = getWeekNumber(new Date(workout.completedAt));
      const weekKey = `${new Date(workout.completedAt).getFullYear()}-W${week}`;
      
      if (frequencyMap.has(weekKey)) {
        frequencyMap.set(weekKey, frequencyMap.get(weekKey) + 1);
      } else {
        frequencyMap.set(weekKey, 1);
      }
    });

    return Array.from(frequencyMap.entries())
      .map(([week, count]) => ({ week, count }))
      .sort((a, b) => a.week.localeCompare(b.week));
  }, [filteredWorkouts]);

  // Get week number
  const getWeekNumber = (date) => {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear = (date - firstDayOfYear) / 86400000;
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
  };

  // Chart configurations
  const chartConfigs = {
    line: {
      type: 'line',
      data: {
        labels: exerciseProgressData?.map(d => new Date(d.date).toLocaleDateString()) || [],
        datasets: [{
          label: `${selectedExercise} - ${metric}`,
          data: exerciseProgressData?.map(d => d.value) || [],
          borderColor: '#ff4444',
          backgroundColor: 'rgba(255, 68, 68, 0.1)',
          borderWidth: 3,
          fill: true,
          tension: 0.4,
          pointBackgroundColor: '#ff4444',
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          pointRadius: 6,
          pointHoverRadius: 8
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: `${selectedExercise} Progress`,
            font: { size: 16, weight: 'bold' }
          },
          legend: {
            display: false
          }
        },
        scales: {
          x: {
            grid: { color: 'rgba(255, 255, 255, 0.1)' },
            ticks: { color: '#fff' }
          },
          y: {
            grid: { color: 'rgba(255, 255, 255, 0.1)' },
            ticks: { color: '#fff' }
          }
        }
      }
    },
    bar: {
      type: 'bar',
      data: {
        labels: volumeData.map(d => new Date(d.date).toLocaleDateString()),
        datasets: [{
          label: 'Total Volume (lbs)',
          data: volumeData.map(d => d.volume),
          backgroundColor: 'rgba(0, 255, 136, 0.8)',
          borderColor: '#00ff88',
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: 'Workout Volume Over Time',
            font: { size: 16, weight: 'bold' }
          }
        },
        scales: {
          x: {
            grid: { color: 'rgba(255, 255, 255, 0.1)' },
            ticks: { color: '#fff' }
          },
          y: {
            grid: { color: 'rgba(255, 255, 255, 0.1)' },
            ticks: { color: '#fff' }
          }
        }
      }
    },
    pie: {
      type: 'doughnut',
      data: {
        labels: muscleGroupData.map(d => d.muscle),
        datasets: [{
          data: muscleGroupData.map(d => d.volume),
          backgroundColor: [
            '#ff4444',
            '#00ff88',
            '#ffaa00',
            '#0088ff',
            '#ff00ff',
            '#00ffff',
            '#ffff00',
            '#ff8800'
          ],
          borderWidth: 2,
          borderColor: '#1a1a1a'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: 'Muscle Group Volume Distribution',
            font: { size: 16, weight: 'bold' }
          },
          legend: {
            position: 'bottom',
            labels: { color: '#fff' }
          }
        }
      }
    },
    frequency: {
      type: 'bar',
      data: {
        labels: frequencyData.map(d => d.week),
        datasets: [{
          label: 'Workouts per Week',
          data: frequencyData.map(d => d.count),
          backgroundColor: 'rgba(255, 170, 0, 0.8)',
          borderColor: '#ffaa00',
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: 'Workout Frequency',
            font: { size: 16, weight: 'bold' }
          }
        },
        scales: {
          x: {
            grid: { color: 'rgba(255, 255, 255, 0.1)' },
            ticks: { color: '#fff' }
          },
          y: {
            grid: { color: 'rgba(255, 255, 255, 0.1)' },
            ticks: { color: '#fff' }
          }
        }
      }
    }
  };

  // Get current chart config
  const currentChartConfig = chartConfigs[chartType];

  // Calculate trend
  const calculateTrend = (data) => {
    if (!data || data.length < 2) return 0;
    
    const first = data[0].value;
    const last = data[data.length - 1].value;
    return ((last - first) / first) * 100;
  };

  const trend = exerciseProgressData ? calculateTrend(exerciseProgressData) : 0;

  // Get trend icon and color
  const getTrendIcon = (trend) => {
    if (trend > 0) return <TrendingUpIcon sx={{ color: '#00ff88' }} />;
    if (trend < 0) return <TrendingDownIcon sx={{ color: '#ff4444' }} />;
    return <TrendingFlatIcon sx={{ color: '#ffaa00' }} />;
  };

  const getTrendColor = (trend) => {
    if (trend > 0) return '#00ff88';
    if (trend < 0) return '#ff4444';
    return '#ffaa00';
  };

  return (
    <Box>
      {/* Chart Controls */}
      <Card sx={{ mb: 3, background: '#1a1a1a', border: '1px solid #333' }}>
        <CardContent>
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Chart Type</InputLabel>
                <Select
                  value={chartType}
                  onChange={(e) => setChartType(e.target.value)}
                  label="Chart Type"
                >
                  <MenuItem value="line">Line Chart</MenuItem>
                  <MenuItem value="bar">Bar Chart</MenuItem>
                  <MenuItem value="pie">Pie Chart</MenuItem>
                  <MenuItem value="frequency">Frequency</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {chartType === 'line' && (
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Metric</InputLabel>
                  <Select
                    value={metric}
                    onChange={(e) => setMetric(e.target.value)}
                    label="Metric"
                  >
                    <MenuItem value="weight">Weight</MenuItem>
                    <MenuItem value="reps">Reps</MenuItem>
                    <MenuItem value="volume">Volume</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            )}

            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Time Range</InputLabel>
                <Select
                  value={timeRange}
                  onChange={(e) => onTimeRangeChange(e.target.value)}
                  label="Time Range"
                >
                  <MenuItem value="7d">7 Days</MenuItem>
                  <MenuItem value="30d">30 Days</MenuItem>
                  <MenuItem value="90d">90 Days</MenuItem>
                  <MenuItem value="1y">1 Year</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Box display="flex" gap={1}>
                <Tooltip title="Download Chart">
                  <IconButton
                    onClick={() => {
                      // Implement chart download
                      console.log('Download chart');
                    }}
                    sx={{ color: '#666' }}
                  >
                    <DownloadIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Fullscreen">
                  <IconButton
                    onClick={() => setShowFullscreen(!showFullscreen)}
                    sx={{ color: '#666' }}
                  >
                    <FullscreenIcon />
                  </IconButton>
                </Tooltip>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Chart Display */}
      <Card sx={{ background: '#1a1a1a', border: '1px solid #333' }}>
        <CardContent>
          {/* Chart Header */}
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                {currentChartConfig.options.plugins.title.text}
              </Typography>
              {chartType === 'line' && exerciseProgressData && (
                <Box display="flex" alignItems="center" gap={2}>
                  <Chip
                    label={`${trend > 0 ? '+' : ''}${trend.toFixed(1)}%`}
                    size="small"
                    icon={getTrendIcon(trend)}
                    sx={{
                      background: `${getTrendColor(trend)}20`,
                      color: getTrendColor(trend)
                    }}
                  />
                  <Typography variant="body2" color="text.secondary">
                    {exerciseProgressData.length} data points
                  </Typography>
                </Box>
              )}
            </Box>
          </Box>

          {/* Chart */}
          <Box sx={{ height: showFullscreen ? '70vh' : '400px', position: 'relative' }}>
            <Chart {...currentChartConfig} />
          </Box>

          {/* Chart Stats */}
          {chartType === 'line' && exerciseProgressData && exerciseProgressData.length > 0 && (
            <Box mt={3} p={2} sx={{ background: '#2a2a2a', borderRadius: 2 }}>
              <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
                Progress Summary:
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6} sm={3}>
                  <Typography variant="body2" color="text.secondary">
                    Starting {metric}:
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 700, color: '#ff4444' }}>
                    {exerciseProgressData[0].value.toFixed(1)}
                  </Typography>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Typography variant="body2" color="text.secondary">
                    Current {metric}:
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 700, color: '#00ff88' }}>
                    {exerciseProgressData[exerciseProgressData.length - 1].value.toFixed(1)}
                  </Typography>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Typography variant="body2" color="text.secondary">
                    Best {metric}:
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 700, color: '#ffaa00' }}>
                    {Math.max(...exerciseProgressData.map(d => d.value)).toFixed(1)}
                  </Typography>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Typography variant="body2" color="text.secondary">
                    Improvement:
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 700, color: getTrendColor(trend) }}>
                    {trend > 0 ? '+' : ''}{trend.toFixed(1)}%
                  </Typography>
                </Grid>
              </Grid>
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
