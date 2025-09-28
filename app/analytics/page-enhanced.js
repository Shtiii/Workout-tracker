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
  Assessment as AssessmentIcon,
  EmojiEvents as TrophyIcon,
  Straighten as MeasureIcon,
  Lightbulb as LightbulbIcon,
  Save as SaveIcon,
  Cancel as CancelIcon
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { collection, getDocs, addDoc, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import ErrorBoundary from '@/components/error/ErrorBoundary';
import LoadingOverlay from '@/components/loading/LoadingOverlay';

// Enhanced analytics components
import AdvancedCharts from '@/components/analytics/AdvancedCharts';
import PersonalRecords from '@/components/analytics/PersonalRecords';
import BodyMeasurements from '@/components/analytics/BodyMeasurements';
import WorkoutInsights from '@/components/analytics/WorkoutInsights';

/**
 * Enhanced Analytics Page
 * Comprehensive analytics with charts, personal records, body measurements, and insights
 */
export default function EnhancedAnalyticsPage() {
  // State management
  const [activeTab, setActiveTab] = useState(0);
  const [workoutHistory, setWorkoutHistory] = useState([]);
  const [personalRecords, setPersonalRecords] = useState([]);
  const [bodyMeasurements, setBodyMeasurements] = useState([]);
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [selectedProgram, setSelectedProgram] = useState(null);
  const [timeRange, setTimeRange] = useState('30d');
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

  // Load data on component mount
  useEffect(() => {
    loadWorkoutHistory();
    loadPersonalRecords();
    loadBodyMeasurements();
  }, [loadWorkoutHistory, loadPersonalRecords, loadBodyMeasurements]);

  // Handle add personal record
  const handleAddPersonalRecord = async (recordData) => {
    try {
      if (db) {
        await addDoc(collection(db, 'personalRecords'), recordData);
      }
      
      setPersonalRecords(prev => [...prev, recordData]);
      setSuccess('Personal record added successfully!');
    } catch (err) {
      console.error('Error adding personal record:', err);
      setError('Failed to add personal record');
    }
  };

  // Handle update personal record
  const handleUpdatePersonalRecord = async (recordData) => {
    try {
      if (db) {
        await updateDoc(doc(db, 'personalRecords', recordData.id), recordData);
      }
      
      setPersonalRecords(prev => prev.map(record => 
        record.id === recordData.id ? recordData : record
      ));
      setSuccess('Personal record updated successfully!');
    } catch (err) {
      console.error('Error updating personal record:', err);
      setError('Failed to update personal record');
    }
  };

  // Handle delete personal record
  const handleDeletePersonalRecord = async (recordId) => {
    try {
      if (db) {
        await deleteDoc(doc(db, 'personalRecords', recordId));
      }
      
      setPersonalRecords(prev => prev.filter(record => record.id !== recordId));
      setSuccess('Personal record deleted successfully!');
    } catch (err) {
      console.error('Error deleting personal record:', err);
      setError('Failed to delete personal record');
    }
  };

  // Handle toggle favorite personal record
  const handleToggleFavoritePersonalRecord = async (recordId) => {
    try {
      const record = personalRecords.find(r => r.id === recordId);
      if (!record) return;

      const updatedRecord = { ...record, isFavorite: !record.isFavorite };
      
      if (db) {
        await updateDoc(doc(db, 'personalRecords', recordId), {
          isFavorite: updatedRecord.isFavorite
        });
      }
      
      setPersonalRecords(prev => prev.map(r => 
        r.id === recordId ? updatedRecord : r
      ));
    } catch (err) {
      console.error('Error toggling favorite:', err);
      setError('Failed to update favorite status');
    }
  };

  // Handle add body measurement
  const handleAddBodyMeasurement = async (measurementData) => {
    try {
      if (db) {
        await addDoc(collection(db, 'bodyMeasurements'), measurementData);
      }
      
      setBodyMeasurements(prev => [...prev, measurementData]);
      setSuccess('Body measurement added successfully!');
    } catch (err) {
      console.error('Error adding body measurement:', err);
      setError('Failed to add body measurement');
    }
  };

  // Handle update body measurement
  const handleUpdateBodyMeasurement = async (measurementData) => {
    try {
      if (db) {
        await updateDoc(doc(db, 'bodyMeasurements', measurementData.id), measurementData);
      }
      
      setBodyMeasurements(prev => prev.map(measurement => 
        measurement.id === measurementData.id ? measurementData : measurement
      ));
      setSuccess('Body measurement updated successfully!');
    } catch (err) {
      console.error('Error updating body measurement:', err);
      setError('Failed to update body measurement');
    }
  };

  // Handle delete body measurement
  const handleDeleteBodyMeasurement = async (measurementId) => {
    try {
      if (db) {
        await deleteDoc(doc(db, 'bodyMeasurements', measurementId));
      }
      
      setBodyMeasurements(prev => prev.filter(measurement => measurement.id !== measurementId));
      setSuccess('Body measurement deleted successfully!');
    } catch (err) {
      console.error('Error deleting body measurement:', err);
      setError('Failed to delete body measurement');
    }
  };

  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  // Handle time range change
  const handleTimeRangeChange = (newTimeRange) => {
    setTimeRange(newTimeRange);
  };

  // Handle exercise change
  const handleExerciseChange = (exercise) => {
    setSelectedExercise(exercise);
  };

  // Handle program change
  const handleProgramChange = (program) => {
    setSelectedProgram(program);
  };

  // Tab content
  const renderTabContent = () => {
    switch (activeTab) {
      case 0:
        return (
          <AdvancedCharts
            workoutHistory={workoutHistory}
            selectedExercise={selectedExercise}
            selectedProgram={selectedProgram}
            timeRange={timeRange}
            onTimeRangeChange={handleTimeRangeChange}
            onExerciseChange={handleExerciseChange}
            onProgramChange={handleProgramChange}
          />
        );
      case 1:
        return (
          <PersonalRecords
            workoutHistory={workoutHistory}
            personalRecords={personalRecords}
            onAddRecord={handleAddPersonalRecord}
            onUpdateRecord={handleUpdatePersonalRecord}
            onDeleteRecord={handleDeletePersonalRecord}
            onToggleFavorite={handleToggleFavoritePersonalRecord}
          />
        );
      case 2:
        return (
          <BodyMeasurements
            measurements={bodyMeasurements}
            onAddMeasurement={handleAddBodyMeasurement}
            onUpdateMeasurement={handleUpdateBodyMeasurement}
            onDeleteMeasurement={handleDeleteBodyMeasurement}
          />
        );
      case 3:
        return (
          <WorkoutInsights
            workoutHistory={workoutHistory}
            personalRecords={personalRecords}
            bodyMeasurements={bodyMeasurements}
            goals={[]}
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
            Analytics & Progress
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Comprehensive analytics, personal records, body measurements, and AI-powered insights.
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
              icon={<AssessmentIcon />}
              label="Advanced Charts"
              iconPosition="start"
            />
            <Tab
              icon={<TrophyIcon />}
              label="Personal Records"
              iconPosition="start"
            />
            <Tab
              icon={<MeasureIcon />}
              label="Body Measurements"
              iconPosition="start"
            />
            <Tab
              icon={<LightbulbIcon />}
              label="Workout Insights"
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

