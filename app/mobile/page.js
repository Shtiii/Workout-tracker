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
  Fab,
  Tooltip,
  useMediaQuery,
  useTheme
} from '@mui/material';
import {
  Add as AddIcon,
  FitnessCenter as WorkoutIcon,
  Assessment as AnalyticsIcon,
  Lightbulb as InsightsIcon,
  Settings as SettingsIcon,
  WifiOff as OfflineIcon,
  Wifi as OnlineIcon,
  Sync as SyncIcon,
  Menu as MenuIcon
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';

// Mobile components
import MobileNavigation from '@/components/mobile/MobileNavigation';
import ResponsiveLayout from '@/components/mobile/ResponsiveLayout';
import TouchGestures from '@/components/mobile/TouchGestures';
import OfflineManager from '@/components/mobile/OfflineManager';
import MobileOptimizedCard from '@/components/mobile/MobileOptimizedCard';

// Enhanced components
import AchievementTracker from '@/components/insights/AchievementTracker';
import StreakTracker from '@/components/insights/StreakTracker';
import GoalTracker from '@/components/insights/GoalTracker';
import PersonalInsights from '@/components/insights/PersonalInsights';

/**
 * Enhanced Mobile Experience Page
 * Comprehensive mobile-optimized interface with PWA features
 */
export default function EnhancedMobilePage() {
  // State management
  const [activeTab, setActiveTab] = useState(0);
  const [isOnline, setIsOnline] = useState(true);
  const [syncStatus, setSyncStatus] = useState('idle');
  const [offlineData, setOfflineData] = useState([]);
  const [lastSyncTime, setLastSyncTime] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [showOfflineManager, setShowOfflineManager] = useState(false);

  // Mock data
  const [workoutHistory, setWorkoutHistory] = useState([]);
  const [personalRecords, setPersonalRecords] = useState([]);
  const [bodyMeasurements, setBodyMeasurements] = useState([]);
  const [goals, setGoals] = useState([]);
  const [achievements, setAchievements] = useState([]);
  const [user, setUser] = useState(null);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const router = useRouter();

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Load mock data
  useEffect(() => {
    // Mock user data
    setUser({
      displayName: 'John Doe',
      email: 'john@example.com'
    });

    // Mock workout history
    setWorkoutHistory([
      {
        id: '1',
        completedAt: new Date(),
        exercises: [
          {
            name: 'Bench Press',
            sets: [
              { weight: 135, reps: 10, completed: true },
              { weight: 155, reps: 8, completed: true },
              { weight: 175, reps: 6, completed: true }
            ]
          }
        ]
      }
    ]);

    // Mock personal records
    setPersonalRecords([
      {
        id: '1',
        exercise: 'Bench Press',
        weight: 175,
        reps: 6,
        date: new Date()
      }
    ]);

    // Mock body measurements
    setBodyMeasurements([
      {
        id: '1',
        weight: 180,
        bodyFat: 15,
        muscleMass: 160,
        date: new Date()
      }
    ]);

    // Mock goals
    setGoals([
      {
        id: '1',
        title: 'Bench Press 200 lbs',
        description: 'Reach a 200 lb bench press',
        category: 'strength',
        target: 200,
        current: 175,
        unit: 'lbs',
        status: 'active',
        priority: 'high',
        isFavorite: true
      }
    ]);

    // Mock achievements
    setAchievements([
      {
        id: '1',
        name: 'First Workout',
        description: 'Complete your first workout',
        unlocked: true,
        unlockedAt: new Date(),
        icon: '🎯',
        rarity: 'Common'
      }
    ]);

    // Mock offline data
    setOfflineData([
      {
        type: 'Workout Session',
        timestamp: new Date(),
        status: 'pending'
      }
    ]);
  }, []);

  // Handle sync
  const handleSync = useCallback(async () => {
    setSyncStatus('syncing');
    try {
      // Simulate sync
      await new Promise(resolve => setTimeout(resolve, 2000));
      setLastSyncTime(new Date());
      setSyncStatus('success');
      setSuccess('Data synced successfully!');
    } catch (error) {
      setSyncStatus('error');
      setError('Sync failed. Please try again.');
    }
  }, []);

  // Handle upload
  const handleUpload = useCallback(async () => {
    try {
      // Simulate upload
      await new Promise(resolve => setTimeout(resolve, 1000));
      setSuccess('Data uploaded successfully!');
    } catch (error) {
      setError('Upload failed. Please try again.');
    }
  }, []);

  // Handle download
  const handleDownload = useCallback(async () => {
    try {
      // Simulate download
      await new Promise(resolve => setTimeout(resolve, 1000));
      setSuccess('Data downloaded successfully!');
    } catch (error) {
      setError('Download failed. Please try again.');
    }
  }, []);

  // Handle clear offline data
  const handleClearOfflineData = useCallback(async () => {
    try {
      setOfflineData([]);
      setSuccess('Offline data cleared successfully!');
    } catch (error) {
      setError('Failed to clear offline data.');
    }
  }, []);

  // Handle swipe gestures
  const handleSwipeLeft = () => {
    if (activeTab < 3) {
      setActiveTab(activeTab + 1);
    }
  };

  const handleSwipeRight = () => {
    if (activeTab > 0) {
      setActiveTab(activeTab - 1);
    }
  };

  const handleSwipeUp = () => {
    setShowOfflineManager(true);
  };

  const handleSwipeDown = () => {
    setShowOfflineManager(false);
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
          <TouchGestures
            onSwipeLeft={handleSwipeLeft}
            onSwipeRight={handleSwipeRight}
            onSwipeUp={handleSwipeUp}
            onSwipeDown={handleSwipeDown}
            showGestureHints={true}
          >
            <AchievementTracker
              userData={userData}
              userAchievements={achievements}
              onUpdateAchievements={() => {}}
            />
          </TouchGestures>
        );
      case 1:
        return (
          <TouchGestures
            onSwipeLeft={handleSwipeLeft}
            onSwipeRight={handleSwipeRight}
            onSwipeUp={handleSwipeUp}
            onSwipeDown={handleSwipeDown}
            showGestureHints={true}
          >
            <StreakTracker
              workoutHistory={workoutHistory}
              onAddWorkout={() => router.push('/workout')}
              onBreakStreak={() => setSuccess('Streak broken. Start a new one!')}
              streakGoal={30}
            />
          </TouchGestures>
        );
      case 2:
        return (
          <TouchGestures
            onSwipeLeft={handleSwipeLeft}
            onSwipeRight={handleSwipeRight}
            onSwipeUp={handleSwipeUp}
            onSwipeDown={handleSwipeDown}
            showGestureHints={true}
          >
            <GoalTracker
              goals={goals}
              workoutHistory={workoutHistory}
              personalRecords={personalRecords}
              bodyMeasurements={bodyMeasurements}
              onAddGoal={(goal) => setGoals(prev => [...prev, goal])}
              onUpdateGoal={(goal) => setGoals(prev => prev.map(g => g.id === goal.id ? goal : g))}
              onDeleteGoal={(id) => setGoals(prev => prev.filter(g => g.id !== id))}
              onCompleteGoal={(id) => setGoals(prev => prev.map(g => g.id === id ? { ...g, status: 'completed' } : g))}
              onToggleFavorite={(id) => setGoals(prev => prev.map(g => g.id === id ? { ...g, isFavorite: !g.isFavorite } : g))}
            />
          </TouchGestures>
        );
      case 3:
        return (
          <TouchGestures
            onSwipeLeft={handleSwipeLeft}
            onSwipeRight={handleSwipeRight}
            onSwipeUp={handleSwipeUp}
            onSwipeDown={handleSwipeDown}
            showGestureHints={true}
          >
            <PersonalInsights
              workoutHistory={workoutHistory}
              personalRecords={personalRecords}
              bodyMeasurements={bodyMeasurements}
              goals={goals}
              achievements={achievements}
            />
          </TouchGestures>
        );
      default:
        return null;
    }
  };

  // Sidebar content
  const sidebarContent = (
    <Box sx={{ p: 2 }}>
      <Typography variant="h6" sx={{ mb: 3, fontWeight: 700 }}>
        Mobile Features
      </Typography>
      
      <Box display="flex" flexDirection="column" gap={2}>
        <MobileOptimizedCard
          title="PWA Features"
          subtitle="Progressive Web App"
          content="Install as native app, offline support, push notifications"
          variant="elevated"
          size="small"
          tags={['PWA', 'Offline', 'Install']}
        />
        
        <MobileOptimizedCard
          title="Touch Gestures"
          subtitle="Swipe & Tap"
          content="Swipe between tabs, long press for options, pinch to zoom"
          variant="outlined"
          size="small"
          tags={['Touch', 'Gestures', 'Mobile']}
        />
        
        <MobileOptimizedCard
          title="Responsive Design"
          subtitle="Mobile First"
          content="Optimized for all screen sizes, touch-friendly interface"
          variant="default"
          size="small"
          tags={['Responsive', 'Mobile', 'Touch']}
        />
      </Box>
    </Box>
  );

  // Header content
  const headerContent = (
    <Box display="flex" alignItems="center" gap={2}>
      <Typography variant="h6" sx={{ fontWeight: 700 }}>
        Mobile Experience
      </Typography>
      <Box display="flex" alignItems="center" gap={1}>
        {isOnline ? <OnlineIcon /> : <OfflineIcon />}
        <Typography variant="body2" color="text.secondary">
          {isOnline ? 'Online' : 'Offline'}
        </Typography>
      </Box>
    </Box>
  );

  return (
    <ResponsiveLayout
      sidebar={sidebarContent}
      header={headerContent}
      showSidebar={!isMobile}
      enableFullscreen={true}
      enableOfflineIndicator={true}
      enableRefreshButton={true}
      onRefresh={handleSync}
    >
      {/* Mobile Navigation */}
      {isMobile && (
        <MobileNavigation
          user={user}
          workoutStreak={7}
          unreadNotifications={3}
          achievements={achievements}
        />
      )}

      {/* Main Content */}
      <Box>
        {/* Header */}
        <Box mb={4}>
          <Typography variant="h3" sx={{ fontWeight: 700, mb: 2 }}>
            Mobile Experience
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Optimized mobile interface with PWA features, touch gestures, and offline capabilities.
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
              icon={<WorkoutIcon />}
              label="Achievements"
              iconPosition="start"
            />
            <Tab
              icon={<AnalyticsIcon />}
              label="Streaks"
              iconPosition="start"
            />
            <Tab
              icon={<InsightsIcon />}
              label="Goals"
              iconPosition="start"
            />
            <Tab
              icon={<SettingsIcon />}
              label="Insights"
              iconPosition="start"
            />
          </Tabs>
        </Box>

        {/* Tab Content */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
        >
          {renderTabContent()}
        </motion.div>

        {/* Offline Manager */}
        <AnimatePresence>
          {showOfflineManager && (
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              transition={{ duration: 0.3 }}
            >
              <Box mt={4}>
                <OfflineManager
                  onSyncData={handleSync}
                  onUploadData={handleUpload}
                  onDownloadData={handleDownload}
                  onClearOfflineData={handleClearOfflineData}
                  syncStatus={syncStatus}
                  offlineData={offlineData}
                  lastSyncTime={lastSyncTime}
                  enableAutoSync={true}
                />
              </Box>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Mobile FAB */}
        {isMobile && (
          <Fab
            color="primary"
            sx={{
              position: 'fixed',
              bottom: 20,
              right: 20,
              background: 'linear-gradient(135deg, #ff4444, #cc0000)',
              zIndex: 1000
            }}
            onClick={() => router.push('/workout')}
          >
            <AddIcon />
          </Fab>
        )}
      </Box>

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
    </ResponsiveLayout>
  );
}


