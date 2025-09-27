'use client';

import {
  Paper,
  Typography,
  Box,
  Grid,
  Card,
  CardContent
} from '@mui/material';
import { motion } from 'framer-motion';
import AnalyticsFilters from './AnalyticsFilters';
import ProgressCharts from './ProgressCharts';

/**
 * ProgressView component displays detailed progress analytics
 * @param {Object} props - Component props
 * @param {Object} props.exerciseData - Processed exercise data
 * @param {Array} props.chartData - Chart data for exercises
 * @param {string} props.selectedProgram - Currently selected program
 * @param {string} props.selectedExercise - Currently selected exercise
 * @param {Array} props.programs - Array of available programs
 * @param {Array} props.exerciseList - Array of available exercises
 * @param {Function} props.onProgramChange - Callback for program selection change
 * @param {Function} props.onExerciseChange - Callback for exercise selection change
 */
export default function ProgressView({
  exerciseData,
  chartData,
  selectedProgram,
  selectedExercise,
  programs,
  exerciseList,
  onProgramChange,
  onExerciseChange
}) {
  return (
    <Box>
      {/* Progress Charts */}
      <ProgressCharts chartData={chartData} />

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

        <AnalyticsFilters
          selectedProgram={selectedProgram}
          selectedExercise={selectedExercise}
          programs={programs}
          exerciseList={exerciseList}
          onProgramChange={onProgramChange}
          onExerciseChange={onExerciseChange}
        />

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
}
