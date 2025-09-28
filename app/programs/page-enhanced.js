'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Container,
  Typography,
  Box,
  Grid,
  Button,
  Tabs,
  Tab,
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
  LibraryBooks as LibraryIcon,
  Build as BuildIcon,
  Assessment as AssessmentIcon,
  Schedule as ScheduleIcon,
  Save as SaveIcon,
  Cancel as CancelIcon
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { collection, getDocs, addDoc, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import ErrorBoundary from '@/components/error/ErrorBoundary';
import LoadingOverlay from '@/components/loading/LoadingOverlay';

// Enhanced program components
import ProgramLibrary from '@/components/programs/ProgramLibrary';
import ProgramBuilder from '@/components/programs/ProgramBuilder';
import ProgramProgress from '@/components/programs/ProgramProgress';
import ProgramScheduler from '@/components/programs/ProgramScheduler';

/**
 * Enhanced Programs Page
 * Comprehensive program management with library, builder, progress tracking, and scheduling
 */
export default function EnhancedProgramsPage() {
  // State management
  const [activeTab, setActiveTab] = useState(0);
  const [userPrograms, setUserPrograms] = useState([]);
  const [selectedProgram, setSelectedProgram] = useState(null);
  const [editingProgram, setEditingProgram] = useState(null);
  const [scheduledWorkouts, setScheduledWorkouts] = useState([]);
  const [workoutHistory, setWorkoutHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [showBuilder, setShowBuilder] = useState(false);
  const [showProgress, setShowProgress] = useState(false);
  const [showScheduler, setShowScheduler] = useState(false);

  // Load user programs
  const loadUserPrograms = useCallback(async () => {
    try {
      setLoading(true);
      if (!db) return;

      const programsQuery = collection(db, 'programs');
      const snapshot = await getDocs(programsQuery);
      const programs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate(),
        isCustom: true
      }));

      setUserPrograms(programs);
    } catch (err) {
      console.error('Error loading user programs:', err);
      setError('Failed to load programs');
    } finally {
      setLoading(false);
    }
  }, []);

  // Load scheduled workouts
  const loadScheduledWorkouts = useCallback(async () => {
    try {
      if (!db) return;

      const schedulesQuery = collection(db, 'scheduledWorkouts');
      const snapshot = await getDocs(schedulesQuery);
      const schedules = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        date: doc.data().date,
        createdAt: doc.data().createdAt?.toDate()
      }));

      setScheduledWorkouts(schedules);
    } catch (err) {
      console.error('Error loading scheduled workouts:', err);
    }
  }, []);

  // Load workout history
  const loadWorkoutHistory = useCallback(async () => {
    try {
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
    }
  }, []);

  // Load data on component mount
  useEffect(() => {
    loadUserPrograms();
    loadScheduledWorkouts();
    loadWorkoutHistory();
  }, [loadUserPrograms, loadScheduledWorkouts, loadWorkoutHistory]);

  // Handle program selection
  const handleSelectProgram = (program) => {
    setSelectedProgram(program);
    setActiveTab(1); // Switch to progress tab
  };

  // Handle program editing
  const handleEditProgram = (program) => {
    setEditingProgram(program);
    setShowBuilder(true);
  };

  // Handle program deletion
  const handleDeleteProgram = async (programId) => {
    try {
      setLoading(true);
      if (db) {
        await deleteDoc(doc(db, 'programs', programId));
      }
      
      setUserPrograms(prev => prev.filter(p => p.id !== programId));
      setSuccess('Program deleted successfully!');
    } catch (err) {
      console.error('Error deleting program:', err);
      setError('Failed to delete program');
    } finally {
      setLoading(false);
    }
  };

  // Handle program duplication
  const handleDuplicateProgram = (program) => {
    const duplicatedProgram = {
      ...program,
      id: null,
      name: `${program.name} (Copy)`,
      createdAt: new Date(),
      isCustom: true
    };
    setEditingProgram(duplicatedProgram);
    setShowBuilder(true);
  };

  // Handle program import
  const handleImportProgram = (programData) => {
    setEditingProgram(programData);
    setShowBuilder(true);
  };

  // Handle program export
  const handleExportProgram = (program) => {
    const dataStr = JSON.stringify(program, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `${program.name.replace(/\s+/g, '_')}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  // Handle program save
  const handleSaveProgram = async (programData) => {
    try {
      setLoading(true);
      
      if (db) {
        if (editingProgram?.id) {
          // Update existing program
          await updateDoc(doc(db, 'programs', editingProgram.id), {
            ...programData,
            updatedAt: new Date()
          });
          setUserPrograms(prev => prev.map(p => 
            p.id === editingProgram.id ? { ...p, ...programData } : p
          ));
        } else {
          // Create new program
          const docRef = await addDoc(collection(db, 'programs'), {
            ...programData,
            createdAt: new Date(),
            updatedAt: new Date()
          });
          setUserPrograms(prev => [...prev, { ...programData, id: docRef.id }]);
        }
      }
      
      setSuccess('Program saved successfully!');
      setShowBuilder(false);
      setEditingProgram(null);
    } catch (err) {
      console.error('Error saving program:', err);
      setError('Failed to save program');
    } finally {
      setLoading(false);
    }
  };

  // Handle schedule workout
  const handleScheduleWorkout = async (scheduleData) => {
    try {
      if (db) {
        await addDoc(collection(db, 'scheduledWorkouts'), scheduleData);
      }
      
      setScheduledWorkouts(prev => [...prev, scheduleData]);
      setSuccess('Workout scheduled successfully!');
    } catch (err) {
      console.error('Error scheduling workout:', err);
      setError('Failed to schedule workout');
    }
  };

  // Handle update schedule
  const handleUpdateSchedule = async (scheduleData) => {
    try {
      if (db) {
        await updateDoc(doc(db, 'scheduledWorkouts', scheduleData.id), scheduleData);
      }
      
      setScheduledWorkouts(prev => prev.map(s => 
        s.id === scheduleData.id ? scheduleData : s
      ));
      setSuccess('Schedule updated successfully!');
    } catch (err) {
      console.error('Error updating schedule:', err);
      setError('Failed to update schedule');
    }
  };

  // Handle delete schedule
  const handleDeleteSchedule = async (scheduleId) => {
    try {
      if (db) {
        await deleteDoc(doc(db, 'scheduledWorkouts', scheduleId));
      }
      
      setScheduledWorkouts(prev => prev.filter(s => s.id !== scheduleId));
      setSuccess('Schedule deleted successfully!');
    } catch (err) {
      console.error('Error deleting schedule:', err);
      setError('Failed to delete schedule');
    }
  };

  // Handle complete scheduled workout
  const handleCompleteScheduledWorkout = async (scheduleId) => {
    try {
      if (db) {
        await updateDoc(doc(db, 'scheduledWorkouts', scheduleId), {
          completed: true,
          completedAt: new Date()
        });
      }
      
      setScheduledWorkouts(prev => prev.map(s => 
        s.id === scheduleId ? { ...s, completed: true, completedAt: new Date() } : s
      ));
      setSuccess('Workout marked as completed!');
    } catch (err) {
      console.error('Error completing workout:', err);
      setError('Failed to mark workout as completed');
    }
  };

  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  // Tab content
  const renderTabContent = () => {
    switch (activeTab) {
      case 0:
        return (
          <ProgramLibrary
            userPrograms={userPrograms}
            onSelectProgram={handleSelectProgram}
            onEditProgram={handleEditProgram}
            onDeleteProgram={handleDeleteProgram}
            onDuplicateProgram={handleDuplicateProgram}
            onImportProgram={handleImportProgram}
            onExportProgram={handleExportProgram}
            userLevel="intermediate"
            userGoal="hypertrophy"
          />
        );
      case 1:
        return selectedProgram ? (
          <ProgramProgress
            program={selectedProgram}
            workoutHistory={workoutHistory}
            currentWeek={1}
            onCompleteWorkout={() => {}}
            onSkipWorkout={() => {}}
            onMarkComplete={() => {}}
          />
        ) : (
          <Box textAlign="center" py={8}>
            <Typography variant="h6" color="text.secondary" mb={2}>
              No program selected
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Select a program from the library to view progress
            </Typography>
          </Box>
        );
      case 2:
        return selectedProgram ? (
          <ProgramScheduler
            program={selectedProgram}
            scheduledWorkouts={scheduledWorkouts}
            onScheduleWorkout={handleScheduleWorkout}
            onUpdateSchedule={handleUpdateSchedule}
            onDeleteSchedule={handleDeleteSchedule}
            onCompleteScheduledWorkout={handleCompleteScheduledWorkout}
          />
        ) : (
          <Box textAlign="center" py={8}>
            <Typography variant="h6" color="text.secondary" mb={2}>
              No program selected
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Select a program from the library to schedule workouts
            </Typography>
          </Box>
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
            Program Management
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Create, manage, and track your workout programs with advanced scheduling and progress tracking.
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
              icon={<LibraryIcon />}
              label="Program Library"
              iconPosition="start"
            />
            <Tab
              icon={<AssessmentIcon />}
              label="Progress Tracking"
              iconPosition="start"
            />
            <Tab
              icon={<ScheduleIcon />}
              label="Workout Scheduler"
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

        {/* Program Builder Dialog */}
        <Dialog
          open={showBuilder}
          onClose={() => {
            setShowBuilder(false);
            setEditingProgram(null);
          }}
          maxWidth="lg"
          fullWidth
        >
          <DialogTitle>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              {editingProgram?.id ? 'Edit Program' : 'Create New Program'}
            </Typography>
          </DialogTitle>
          <DialogContent sx={{ p: 0 }}>
            <ProgramBuilder
              initialProgram={editingProgram}
              onSave={handleSaveProgram}
              onCancel={() => {
                setShowBuilder(false);
                setEditingProgram(null);
              }}
              isEditing={!!editingProgram?.id}
            />
          </DialogContent>
        </Dialog>

        {/* Floating Action Button */}
        <Fab
          color="primary"
          sx={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            background: 'linear-gradient(135deg, #ff4444, #cc0000)',
            '&:hover': {
              background: 'linear-gradient(135deg, #ff6666, #ee0000)'
            }
          }}
          onClick={() => {
            setEditingProgram(null);
            setShowBuilder(true);
          }}
        >
          <AddIcon />
        </Fab>

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

