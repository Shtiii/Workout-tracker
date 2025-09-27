'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Paper,
  Typography,
  Grid,
  Box,
  Button,
  Modal
} from '@mui/material';
import { collection, getDocs, query, orderBy, addDoc, updateDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

/**
 * WorkoutHeader Component
 * Displays quick stats, weekly goal, and manages workout statistics
 */
export default function WorkoutHeader({ quickStats, setQuickStats, weeklyGoal, setWeeklyGoal }) {
  const [weeklyGoalModalOpen, setWeeklyGoalModalOpen] = useState(false);

  const fetchQuickStats = useCallback(async () => {
    try {
      if (!db) return;

      const workoutsQuery = query(
        collection(db, 'workoutSessions'),
        orderBy('completedAt', 'desc')
      );
      const workoutsSnapshot = await getDocs(workoutsQuery);
      const workouts = workoutsSnapshot.docs.map(doc => ({
        ...doc.data(),
        completedAt: doc.data().completedAt?.toDate() || new Date()
      }));

      // Calculate stats
      const totalWorkouts = workouts.length;

      // Calculate current streak
      let currentStreak = 0;
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      for (let i = 0; i < workouts.length; i++) {
        const workoutDate = new Date(workouts[i].completedAt);
        workoutDate.setHours(0, 0, 0, 0);

        const daysDiff = Math.floor((today - workoutDate) / (1000 * 60 * 60 * 24));

        if (daysDiff === i) {
          currentStreak++;
        } else {
          break;
        }
      }

      // Calculate weekly progress with current goal
      const weekStart = new Date(today.getFullYear(), today.getMonth(), today.getDate() - today.getDay());
      const weekWorkouts = workouts.filter(w => new Date(w.completedAt) >= weekStart).length;
      const weeklyProgress = `${weekWorkouts}/${weeklyGoal}`;

      setQuickStats({
        totalWorkouts,
        currentStreak,
        weeklyProgress
      });
    } catch (error) {
      console.error('Error fetching quick stats:', error);
    }
  }, [weeklyGoal, setQuickStats]);

  const fetchWeeklyGoal = async () => {
    try {
      if (!db) return;

      const settingsQuery = query(collection(db, 'settings'));
      const settingsSnapshot = await getDocs(settingsQuery);

      if (!settingsSnapshot.empty) {
        const goalDoc = settingsSnapshot.docs.find(doc => doc.data().type === 'weeklyGoal');
        if (goalDoc) {
          setWeeklyGoal(goalDoc.data().value);
        }
      }
    } catch (error) {
      console.error('Error fetching weekly goal:', error);
    }
  };

  const saveWeeklyGoal = async (newGoal) => {
    try {
      if (!db) return;

      const settingsQuery = query(collection(db, 'settings'));
      const settingsSnapshot = await getDocs(settingsQuery);

      let goalDocId = null;
      if (!settingsSnapshot.empty) {
        const goalDoc = settingsSnapshot.docs.find(doc => doc.data().type === 'weeklyGoal');
        if (goalDoc) {
          goalDocId = goalDoc.id;
        }
      }

      const goalData = {
        type: 'weeklyGoal',
        value: newGoal,
        updatedAt: new Date()
      };

      if (goalDocId) {
        await updateDoc(doc(db, 'settings', goalDocId), goalData);
      } else {
        await addDoc(collection(db, 'settings'), goalData);
      }

      setWeeklyGoal(newGoal);
      fetchQuickStats(); // Refresh stats with new goal
    } catch (error) {
      console.error('Error saving weekly goal:', error);
    }
  };

  useEffect(() => {
    if (weeklyGoal > 0) {
      fetchQuickStats();
    }
  }, [weeklyGoal, fetchQuickStats]);

  useEffect(() => {
    fetchWeeklyGoal();
  }, []);

  return (
    <>
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
            mb: 2,
            fontSize: { xs: '1.4rem', sm: '1.5rem' },
            lineHeight: 1.2
          }}
        >
          SHTII PLANNER
        </Typography>

        {/* Quick Stats Row */}
        <Grid container spacing={1} justifyContent="center" sx={{ maxWidth: 500, mx: 'auto' }}>
          <Grid item xs={4}>
            <Box sx={{
              textAlign: 'center',
              p: { xs: 1, sm: 1.5 },
              bgcolor: 'rgba(255, 68, 68, 0.1)',
              borderRadius: 1,
              border: '1px solid #333',
              minHeight: { xs: '50px', sm: '55px' },
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center'
            }}>
              <Typography variant="h6" sx={{ fontWeight: 900, color: '#ff4444', fontSize: { xs: '1rem', sm: '1.2rem' }, lineHeight: 1 }}>
                {quickStats.totalWorkouts}
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, fontSize: { xs: '0.65rem', sm: '0.7rem' }, mt: 0.5 }}>
                WORKOUTS
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={4}>
            <Box sx={{
              textAlign: 'center',
              p: { xs: 1, sm: 1.5 },
              bgcolor: 'rgba(255, 170, 0, 0.1)',
              borderRadius: 1,
              border: '1px solid #333',
              minHeight: { xs: '50px', sm: '55px' },
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center'
            }}>
              <Typography variant="h6" sx={{ fontWeight: 900, color: '#ffaa00', fontSize: { xs: '1rem', sm: '1.2rem' }, lineHeight: 1 }}>
                {quickStats.currentStreak}
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, fontSize: { xs: '0.65rem', sm: '0.7rem' }, mt: 0.5 }}>
                STREAK
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={4}>
            <Box
              onClick={() => setWeeklyGoalModalOpen(true)}
              sx={{
                textAlign: 'center',
                p: { xs: 1, sm: 1.5 },
                bgcolor: 'rgba(0, 255, 136, 0.1)',
                borderRadius: 1,
                border: '1px solid #333',
                minHeight: { xs: '50px', sm: '55px' },
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                '&:hover': {
                  bgcolor: 'rgba(0, 255, 136, 0.2)',
                  transform: 'scale(1.05)',
                  boxShadow: '0 4px 15px rgba(0, 255, 136, 0.3)'
                }
              }}
            >
              <Typography variant="h6" sx={{ fontWeight: 900, color: '#00ff88', fontSize: { xs: '1rem', sm: '1.2rem' }, lineHeight: 1 }}>
                {quickStats.weeklyProgress}
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, fontSize: { xs: '0.65rem', sm: '0.7rem' }, mt: 0.5 }}>
                WEEKLY
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Weekly Goal Modal */}
      <Modal
        open={weeklyGoalModalOpen}
        onClose={() => setWeeklyGoalModalOpen(false)}
        aria-labelledby="weekly-goal-modal"
      >
        <Box sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: { xs: '90vw', sm: 400 },
          maxWidth: '400px',
          bgcolor: '#1a1a1a',
          border: '2px solid #ff4444',
          boxShadow: '0 0 50px rgba(255, 68, 68, 0.3)',
          p: 4,
          borderRadius: 2
        }}>
          <Typography variant="h6" sx={{ mb: 3, fontWeight: 700, textAlign: 'center' }}>
            SET WEEKLY GOAL
          </Typography>

          <Typography variant="body2" sx={{ mb: 3, color: 'text.secondary', textAlign: 'center' }}>
            How many workouts do you want to complete each week?
          </Typography>

          <Box sx={{ display: 'flex', gap: 2, mb: 4, justifyContent: 'center' }}>
            {[1, 2, 3, 4, 5, 6, 7].map(goal => (
              <Button
                key={goal}
                variant={weeklyGoal === goal ? "contained" : "outlined"}
                onClick={() => setWeeklyGoal(goal)}
                sx={{
                  minWidth: '40px',
                  height: '40px',
                  p: 0,
                  fontWeight: 700,
                  background: weeklyGoal === goal ? 'linear-gradient(135deg, #00ff88, #00cc66)' : 'transparent',
                  color: weeklyGoal === goal ? '#000' : 'primary.main'
                }}
              >
                {goal}
              </Button>
            ))}
          </Box>

          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              onClick={() => setWeeklyGoalModalOpen(false)}
              variant="outlined"
              fullWidth
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                saveWeeklyGoal(weeklyGoal);
                setWeeklyGoalModalOpen(false);
              }}
              variant="contained"
              fullWidth
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
    </>
  );
}