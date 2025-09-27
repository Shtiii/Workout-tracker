'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Container,
  Typography,
  Box,
  Grid,
  Tabs,
  Tab,
  Button,
  Snackbar,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Fab,
  Tooltip
} from '@mui/material';
import {
  Add as AddIcon,
  EmojiEvents as TrophyIcon,
  LocalFireDepartment as FireIcon,
  Flag as FlagIcon,
  Lightbulb as LightbulbIcon,
  Save as SaveIcon,
  Cancel as CancelIcon
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { collection, getDocs, addDoc, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import ErrorBoundary from '@/components/error/ErrorBoundary';
import LoadingOverlay from '@/components/loading/LoadingOverlay';

// Enhanced insights components
import AchievementTracker from '@/components/insights/AchievementTracker';
import StreakTracker from '@/components/insights/StreakTracker';
import GoalTracker from '@/components/insights/GoalTracker';
import PersonalInsights from '@/components/insights/PersonalInsights';

/**
 * Enhanced Insights Page
 * Comprehensive personal analytics with achievements, streaks, goals, and insights
 */
export default function EnhancedInsightsPage() {
  // State management
  const [activeTab, setActiveTab] = useState(0);
  const [workoutHistory, setWorkoutHistory] = useState([]);
  const [personalRecords, setPersonalRecords] = useState([]);
  const [bodyMeasurements, setBodyMeasurements] = useState([]);
  const [goals, setGoals] = useState([]);
  const [achievements, setAchievements] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Load workout history
  const loadWorkoutHistory = useCallback(async () => {
    try {
      setLoading(true);
      if (!db) return;

      const workoutsQuery = collection(db, 'workoutSessions');
      const snapshot = await getDocs(workoutsQuery);
      const workouts = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        completedAt: doc.data().completedAt?.toDate(),
        startTime: doc.data().startTime?.toDate(),
        endTime: doc.data().endTime?.toDate()
      }));

      setWorkoutHistory(workouts);
    } catch (err) {
      console.error('Error loading workout history:', err);
      setError('Failed to load workout history');
    } finally {
      setLoading(false);
    }
  }, []);

  // Load personal records
  const loadPersonalRecords = useCallback(async () => {
    try {
      if (!db) return;

      const recordsQuery = collection(db, 'personalRecords');
      const snapshot = await getDocs(recordsQuery);
      const records = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        date: doc.data().date?.toDate(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate()
      }));

      setPersonalRecords(records);
    } catch (err) {
      console.error('Error loading personal records:', err);
    }
  }, []);

  // Load body measurements
  const loadBodyMeasurements = useCallback(async () => {
    try {
      if (!db) return;

      const measurementsQuery = collection(db, 'bodyMeasurements');
      const snapshot = await getDocs(measurementsQuery);
      const measurements = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        date: doc.data().date?.toDate(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate()
      }));

      setBodyMeasurements(measurements);
    } catch (err) {
      console.error('Error loading body measurements:', err);
    }
  }, []);

  // Load goals
  const loadGoals = useCallback(async () => {
    try {
      if (!db) return;

      const goalsQuery = collection(db, 'goals');
      const snapshot = await getDocs(goalsQuery);
      const goalsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        deadline: doc.data().deadline?.toDate(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate()
      }));

      setGoals(goalsData);
    } catch (err) {
      console.error('Error loading goals:', err);
    }
  }, []);

  // Load achievements
  const loadAchievements = useCallback(async () => {
    try {
      if (!db) return;

      const achievementsQuery = collection(db, 'achievements');
      const snapshot = await getDocs(achievementsQuery);
      const achievementsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        unlockedAt: doc.data().unlockedAt?.toDate(),
        createdAt: doc.data().createdAt?.toDate()
      }));

      setAchievements(achievementsData);
    } catch (err) {
      console.error('Error loading achievements:', err);
    }
  }, []);

  // Load data on component mount
  useEffect(() => {
    loadWorkoutHistory();
    loadPersonalRecords();
    loadBodyMeasurements();
    loadGoals();
    loadAchievements();
  }, [loadWorkoutHistory, loadPersonalRecords, loadBodyMeasurements, loadGoals, loadAchievements]);

  // Handle add goal
  const handleAddGoal = async (goalData) => {
    try {
      if (db) {
        await addDoc(collection(db, 'goals'), goalData);
      }
      
      setGoals(prev => [...prev, goalData]);
      setSuccess('Goal added successfully!');
    } catch (err) {
      console.error('Error adding goal:', err);
      setError('Failed to add goal');
    }
  };

  // Handle update goal
  const handleUpdateGoal = async (goalData) => {
    try {
      if (db) {
        await updateDoc(doc(db, 'goals', goalData.id), goalData);
      }
      
      setGoals(prev => prev.map(goal => 
        goal.id === goalData.id ? goalData : goal
      ));
      setSuccess('Goal updated successfully!');
    } catch (err) {
      console.error('Error updating goal:', err);
      setError('Failed to update goal');
    }
  };

  // Handle delete goal
  const handleDeleteGoal = async (goalId) => {
    try {
      if (db) {
        await deleteDoc(doc(db, 'goals', goalId));
      }
      
      setGoals(prev => prev.filter(goal => goal.id !== goalId));
      setSuccess('Goal deleted successfully!');
    } catch (err) {
      console.error('Error deleting goal:', err);
      setError('Failed to delete goal');
    }
  };

  // Handle complete goal
  const handleCompleteGoal = async (goalId) => {
    try {
      if (db) {
        await updateDoc(doc(db, 'goals', goalId), {
          status: 'completed',
          completedAt: new Date()
        });
      }
      
      setGoals(prev => prev.map(goal => 
        goal.id === goalId ? { ...goal, status: 'completed', completedAt: new Date() } : goal
      ));
      setSuccess('Goal completed! Congratulations!');
    } catch (err) {
      console.error('Error completing goal:', err);
      setError('Failed to complete goal');
    }
  };

  // Handle toggle favorite goal
  const handleToggleFavoriteGoal = async (goalId) => {
    try {
      const goal = goals.find(g => g.id === goalId);
      if (!goal) return;

      const updatedGoal = { ...goal, isFavorite: !goal.isFavorite };
      
      if (db) {
        await updateDoc(doc(db, 'goals', goalId), {
          isFavorite: updatedGoal.isFavorite
        });
      }
      
      setGoals(prev => prev.map(g => 
        g.id === goalId ? updatedGoal : g
      ));
    } catch (err) {
      console.error('Error toggling favorite:', err);
      setError('Failed to update favorite status');
    }
  };

  // Handle update achievements
  const handleUpdateAchievements = async (achievementData) => {
    try {
      if (db) {
        await updateDoc(doc(db, 'achievements', achievementData.id), achievementData);
      }
      
      setAchievements(prev => prev.map(achievement => 
        achievement.id === achievementData.id ? achievementData : achievement
      ));
      setSuccess('Achievement updated successfully!');
    } catch (err) {
      console.error('Error updating achievement:', err);
      setError('Failed to update achievement');
    }
  };

  // Handle add workout
  const handleAddWorkout = () => {
    // Navigate to workout page or open workout modal
    window.location.href = '/workout';
  };

  // Handle break streak
  const handleBreakStreak = () => {
    // Logic to break streak
    setSuccess('Streak broken. Start a new one today!');
  };

  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  // Tab content
  const renderTabContent = () => {
    const userData = {
      workoutHistory,
      personalRecords,
      bodyMeasurements,
      goals,
      achievements
    };

    switch (activeTab) {
      case 0:
        return (
          <AchievementTracker
            userData={userData}
            userAchievements={achievements}
            onUpdateAchievements={handleUpdateAchievements}
          />
        );
      case 1:
        return (
          <StreakTracker
            workoutHistory={workoutHistory}
            onAddWorkout={handleAddWorkout}
            onBreakStreak={handleBreakStreak}
            streakGoal={30}
          />
        );
      case 2:
        return (
          <GoalTracker
            goals={goals}
            workoutHistory={workoutHistory}
            personalRecords={personalRecords}
            bodyMeasurements={bodyMeasurements}
            onAddGoal={handleAddGoal}
            onUpdateGoal={handleUpdateGoal}
            onDeleteGoal={handleDeleteGoal}
            onCompleteGoal={handleCompleteGoal}
            onToggleFavorite={handleToggleFavoriteGoal}
          />
        );
      case 3:
        return (
          <PersonalInsights
            workoutHistory={workoutHistory}
            personalRecords={personalRecords}
            bodyMeasurements={bodyMeasurements}
            goals={goals}
            achievements={achievements}
          />
        );
      default:
        return null;
    }
  };

  return (
    <ErrorBoundary>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        {/* Header */}
        <Box mb={4}>
          <Typography variant="h3" sx={{ fontWeight: 700, mb: 2 }}>
            Personal Insights
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Track your achievements, streaks, goals, and get AI-powered insights for your fitness journey.
          </Typography>
        </Box>

        {/* Tabs */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 4 }}>
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            sx={{
              '& .MuiTab-root': {
                fontWeight: 600,
                textTransform: 'none',
                fontSize: '1rem'
              }
            }}
          >
            <Tab
              icon={<TrophyIcon />}
              label="Achievements"
              iconPosition="start"
            />
            <Tab
              icon={<FireIcon />}
              label="Streak Tracker"
              iconPosition="start"
            />
            <Tab
              icon={<FlagIcon />}
              label="Goal Tracker"
              iconPosition="start"
            />
            <Tab
              icon={<LightbulbIcon />}
              label="Personal Insights"
              iconPosition="start"
            />
          </Tabs>
        </Box>

        {/* Tab Content */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {renderTabContent()}
        </motion.div>

        {/* Loading Overlay */}
        <LoadingOverlay loading={loading} />

        {/* Success/Error Messages */}
        <Snackbar
          open={!!success}
          autoHideDuration={4000}
          onClose={() => setSuccess(null)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
          <Alert severity="success" onClose={() => setSuccess(null)}>
            {success}
          </Alert>
        </Snackbar>

        <Snackbar
          open={!!error}
          autoHideDuration={6000}
          onClose={() => setError(null)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
          <Alert severity="error" onClose={() => setError(null)}>
            {error}
          </Alert>
        </Snackbar>
      </Container>
    </ErrorBoundary>
  );
}
