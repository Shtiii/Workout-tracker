'use client';

import { memo } from 'react';
import {
  Paper,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  Chip
} from '@mui/material';
import {
  FitnessCenter as FitnessCenterIcon,
  Timer as TimerIcon,
  TrendingUp as TrendingUpIcon,
  EmojiEvents as TrophyIcon
} from '@mui/icons-material';
import { motion } from 'framer-motion';

/**
 * Workout Header Component
 * Displays workout session header with quick stats
 */
const WorkoutHeader = memo(function WorkoutHeader({
  activeWorkout,
  quickStats,
  weeklyGoal
}) {
  const StatCard = ({ title, value, icon, color = '#ff4444' }) => (
    <motion.div
      whileHover={{ scale: 1.02, y: -2 }}
      transition={{ duration: 0.2 }}
    >
      <Card
        role="region"
        aria-label={`${title}: ${value}`}
        sx={{
          background: `linear-gradient(135deg, ${color}20, ${color}10)`,
          border: `1px solid ${color}40`,
          height: '100%',
          '&:hover': {
            border: `1px solid ${color}`,
            boxShadow: `0 0 20px ${color}30`
          }
        }}
      >
        <CardContent sx={{ textAlign: 'center', py: 2 }}>
          <Box sx={{ mb: 1, color }} aria-hidden="true">
            {icon}
          </Box>
          <Typography
            variant="h4"
            component="div"
            sx={{
              fontWeight: 900,
              color,
              mb: 0.5,
              fontSize: { xs: '1.5rem', sm: '2rem' }
            }}
          >
            {value}
          </Typography>
          <Typography
            variant="caption"
            component="div"
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

  return (
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
        component="h1"
        sx={{
          fontWeight: 900,
          background: 'linear-gradient(135deg, #ff4444, #ffaa00)',
          backgroundClip: 'text',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          textTransform: 'uppercase',
          letterSpacing: 2,
          textAlign: 'center',
          mb: 3
        }}
      >
        💪 ACTIVE TRAINING SESSION
      </Typography>

      {activeWorkout.programName && (
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <Chip
            label={`Program: ${activeWorkout.programName}`}
            aria-label={`Current program: ${activeWorkout.programName}`}
            sx={{
              background: 'linear-gradient(135deg, #ff4444, #ffaa00)',
              color: '#000',
              fontWeight: 700,
              fontSize: '0.9rem',
              px: 2,
              py: 1
            }}
          />
        </Box>
      )}

      <Grid container spacing={2}>
        <Grid item xs={6} sm={3}>
          <StatCard
            title="Exercises"
            value={activeWorkout.exercises.length}
            icon={<FitnessCenterIcon sx={{ fontSize: '2rem' }} />}
            color="#ff4444"
          />
        </Grid>
        <Grid item xs={6} sm={3}>
          <StatCard
            title="Total Sets"
            value={activeWorkout.exercises.reduce((total, ex) => total + ex.sets.length, 0)}
            icon={<TimerIcon sx={{ fontSize: '2rem' }} />}
            color="#ffaa00"
          />
        </Grid>
        <Grid item xs={6} sm={3}>
          <StatCard
            title="Completed"
            value={activeWorkout.exercises.reduce((total, ex) => 
              total + ex.sets.filter(set => set.completed).length, 0
            )}
            icon={<TrendingUpIcon sx={{ fontSize: '2rem' }} />}
            color="#00ff88"
          />
        </Grid>
        <Grid item xs={6} sm={3}>
          <StatCard
            title="Weekly Goal"
            value={quickStats.weeklyProgress}
            icon={<TrophyIcon sx={{ fontSize: '2rem' }} />}
            color="#0088ff"
          />
        </Grid>
      </Grid>
    </Paper>
  );
});

export default WorkoutHeader;