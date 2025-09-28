'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  IconButton,
  Tooltip,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Snackbar
} from '@mui/material';
import {
  CalendarToday as CalendarIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  CheckCircle as CheckIcon,
  RadioButtonUnchecked as UncheckIcon,
  Notifications as NotificationsIcon,
  Schedule as ScheduleIcon,
  FitnessCenter as FitnessIcon,
  Timer as TimerIcon
} from '@mui/icons-material';
import { motion } from 'framer-motion';

/**
 * Program Scheduler Component
 * Allows users to schedule workouts and set reminders
 */
export default function ProgramScheduler({
  program,
  scheduledWorkouts = [],
  onScheduleWorkout,
  onUpdateSchedule,
  onDeleteSchedule,
  onCompleteScheduledWorkout
}) {
  const [showScheduleDialog, setShowScheduleDialog] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState(null);
  const [selectedWorkout, setSelectedWorkout] = useState(null);
  const [scheduleData, setScheduleData] = useState({
    workoutIndex: 0,
    date: '',
    time: '',
    reminder: false,
    reminderTime: 30,
    notes: ''
  });
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Get today's date for default scheduling
  const today = new Date().toISOString().split('T')[0];

  // Get upcoming scheduled workouts
  const upcomingWorkouts = useMemo(() => {
    const now = new Date();
    return scheduledWorkouts
      .filter(schedule => new Date(schedule.date) >= now)
      .sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [scheduledWorkouts]);

  // Get today's workouts
  const todaysWorkouts = useMemo(() => {
    const today = new Date().toDateString();
    return scheduledWorkouts.filter(schedule => 
      new Date(schedule.date).toDateString() === today
    );
  }, [scheduledWorkouts]);

  // Get this week's workouts
  const thisWeeksWorkouts = useMemo(() => {
    const now = new Date();
    const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
    const endOfWeek = new Date(now.setDate(now.getDate() - now.getDay() + 6));
    
    return scheduledWorkouts.filter(schedule => {
      const scheduleDate = new Date(schedule.date);
      return scheduleDate >= startOfWeek && scheduleDate <= endOfWeek;
    });
  }, [scheduledWorkouts]);

  // Handle schedule workout
  const handleScheduleWorkout = () => {
    if (!scheduleData.date || !scheduleData.time) {
      setError('Please select both date and time');
      return;
    }

    const schedule = {
      id: editingSchedule?.id || Date.now().toString(),
      programId: program.id,
      programName: program.name,
      workoutIndex: scheduleData.workoutIndex,
      workoutName: program.workouts[scheduleData.workoutIndex].name,
      date: scheduleData.date,
      time: scheduleData.time,
      reminder: scheduleData.reminder,
      reminderTime: scheduleData.reminderTime,
      notes: scheduleData.notes,
      completed: false,
      createdAt: new Date()
    };

    if (editingSchedule) {
      onUpdateSchedule(schedule);
      setSuccess('Schedule updated successfully!');
    } else {
      onScheduleWorkout(schedule);
      setSuccess('Workout scheduled successfully!');
    }

    setShowScheduleDialog(false);
    setEditingSchedule(null);
    setScheduleData({
      workoutIndex: 0,
      date: '',
      time: '',
      reminder: false,
      reminderTime: 30,
      notes: ''
    });
  };

  // Handle edit schedule
  const handleEditSchedule = (schedule) => {
    setEditingSchedule(schedule);
    setScheduleData({
      workoutIndex: schedule.workoutIndex,
      date: schedule.date,
      time: schedule.time,
      reminder: schedule.reminder,
      reminderTime: schedule.reminderTime,
      notes: schedule.notes
    });
    setShowScheduleDialog(true);
  };

  // Handle delete schedule
  const handleDeleteSchedule = (scheduleId) => {
    onDeleteSchedule(scheduleId);
    setSuccess('Schedule deleted successfully!');
  };

  // Handle complete workout
  const handleCompleteWorkout = (schedule) => {
    onCompleteScheduledWorkout(schedule.id);
    setSuccess('Workout marked as completed!');
  };

  // Format date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow';
    } else {
      return date.toLocaleDateString();
    }
  };

  // Format time for display
  const formatTime = (timeString) => {
    const [hours, minutes] = timeString.split(':');
    const date = new Date();
    date.setHours(parseInt(hours), parseInt(minutes));
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Get workout status color
  const getStatusColor = (schedule) => {
    if (schedule.completed) return '#00ff88';
    const now = new Date();
    const scheduleDateTime = new Date(`${schedule.date}T${schedule.time}`);
    if (scheduleDateTime < now) return '#ff4444';
    return '#ffaa00';
  };

  // Get workout status text
  const getStatusText = (schedule) => {
    if (schedule.completed) return 'Completed';
    const now = new Date();
    const scheduleDateTime = new Date(`${schedule.date}T${schedule.time}`);
    if (scheduleDateTime < now) return 'Overdue';
    return 'Scheduled';
  };

  return (
    <Box>
      {/* Header */}
      <Box mb={3}>
        <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
          Workout Scheduler
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Schedule your workouts and set reminders to stay consistent.
        </Typography>
      </Box>

      {/* Quick Stats */}
      <Grid container spacing={2} mb={3}>
        <Grid item xs={6} sm={3}>
          <Card sx={{ background: '#1a1a1a', border: '1px solid #333' }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" sx={{ fontWeight: 700, color: '#ff4444' }}>
                {todaysWorkouts.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Today
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card sx={{ background: '#1a1a1a', border: '1px solid #333' }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" sx={{ fontWeight: 700, color: '#00ff88' }}>
                {thisWeeksWorkouts.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                This Week
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card sx={{ background: '#1a1a1a', border: '1px solid #333' }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" sx={{ fontWeight: 700, color: '#ffaa00' }}>
                {upcomingWorkouts.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Upcoming
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card sx={{ background: '#1a1a1a', border: '1px solid #333' }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" sx={{ fontWeight: 700, color: '#0088ff' }}>
                {scheduledWorkouts.filter(s => s.completed).length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Completed
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Schedule New Workout */}
      <Card sx={{ mb: 3, background: '#1a1a1a', border: '1px solid #333' }}>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Schedule New Workout
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setShowScheduleDialog(true)}
              sx={{
                background: 'linear-gradient(135deg, #ff4444, #cc0000)',
                fontWeight: 700
              }}
            >
              Schedule Workout
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Today's Workouts */}
      {todaysWorkouts.length > 0 && (
        <Card sx={{ mb: 3, background: '#1a1a1a', border: '1px solid #333' }}>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
              Today's Workouts
            </Typography>
            <List>
              {todaysWorkouts.map((schedule) => (
                <ListItem key={schedule.id} sx={{ px: 0 }}>
                  <ListItemText
                    primary={schedule.workoutName}
                    secondary={
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          {formatTime(schedule.time)}
                        </Typography>
                        {schedule.notes && (
                          <Typography variant="caption" color="text.secondary">
                            {schedule.notes}
                          </Typography>
                        )}
                      </Box>
                    }
                  />
                  <ListItemSecondaryAction>
                    <Box display="flex" gap={1} alignItems="center">
                      <Chip
                        label={getStatusText(schedule)}
                        size="small"
                        sx={{
                          background: `${getStatusColor(schedule)}20`,
                          color: getStatusColor(schedule)
                        }}
                      />
                      {!schedule.completed && (
                        <Tooltip title="Mark as completed">
                          <IconButton
                            size="small"
                            onClick={() => handleCompleteWorkout(schedule)}
                            sx={{ color: '#00ff88' }}
                          >
                            <CheckIcon />
                          </IconButton>
                        </Tooltip>
                      )}
                      <Tooltip title="Edit">
                        <IconButton
                          size="small"
                          onClick={() => handleEditSchedule(schedule)}
                          sx={{ color: '#ffaa00' }}
                        >
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton
                          size="small"
                          onClick={() => handleDeleteSchedule(schedule.id)}
                          sx={{ color: '#ff4444' }}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>
          </CardContent>
        </Card>
      )}

      {/* Upcoming Workouts */}
      <Card sx={{ background: '#1a1a1a', border: '1px solid #333' }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
            Upcoming Workouts
          </Typography>
          
          {upcomingWorkouts.length === 0 ? (
            <Box textAlign="center" py={4}>
              <Typography variant="body1" color="text.secondary" mb={2}>
                No upcoming workouts scheduled
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Schedule your first workout to get started
              </Typography>
            </Box>
          ) : (
            <List>
              {upcomingWorkouts.map((schedule) => (
                <ListItem key={schedule.id} sx={{ px: 0 }}>
                  <ListItemText
                    primary={schedule.workoutName}
                    secondary={
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          {formatDate(schedule.date)} at {formatTime(schedule.time)}
                        </Typography>
                        {schedule.notes && (
                          <Typography variant="caption" color="text.secondary">
                            {schedule.notes}
                          </Typography>
                        )}
                        {schedule.reminder && (
                          <Chip
                            label={`Reminder: ${schedule.reminderTime}min before`}
                            size="small"
                            icon={<NotificationsIcon />}
                            sx={{ mt: 1, background: 'rgba(255, 170, 0, 0.2)', color: '#ffaa00' }}
                          />
                        )}
                      </Box>
                    }
                  />
                  <ListItemSecondaryAction>
                    <Box display="flex" gap={1} alignItems="center">
                      <Chip
                        label={getStatusText(schedule)}
                        size="small"
                        sx={{
                          background: `${getStatusColor(schedule)}20`,
                          color: getStatusColor(schedule)
                        }}
                      />
                      <Tooltip title="Edit">
                        <IconButton
                          size="small"
                          onClick={() => handleEditSchedule(schedule)}
                          sx={{ color: '#ffaa00' }}
                        >
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton
                          size="small"
                          onClick={() => handleDeleteSchedule(schedule.id)}
                          sx={{ color: '#ff4444' }}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>
          )}
        </CardContent>
      </Card>

      {/* Schedule Dialog */}
      <Dialog
        open={showScheduleDialog}
        onClose={() => {
          setShowScheduleDialog(false);
          setEditingSchedule(null);
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            {editingSchedule ? 'Edit Workout Schedule' : 'Schedule Workout'}
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <FormControl fullWidth sx={{ mb: 3 }}>
              <InputLabel>Workout</InputLabel>
              <Select
                value={scheduleData.workoutIndex}
                onChange={(e) => setScheduleData(prev => ({ ...prev, workoutIndex: e.target.value }))}
                label="Workout"
              >
                {program.workouts.map((workout, index) => (
                  <MenuItem key={index} value={index}>
                    {workout.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Grid container spacing={2} mb={3}>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Date"
                  type="date"
                  value={scheduleData.date}
                  onChange={(e) => setScheduleData(prev => ({ ...prev, date: e.target.value }))}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Time"
                  type="time"
                  value={scheduleData.time}
                  onChange={(e) => setScheduleData(prev => ({ ...prev, time: e.target.value }))}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
            </Grid>

            <TextField
              fullWidth
              multiline
              rows={3}
              label="Notes (optional)"
              value={scheduleData.notes}
              onChange={(e) => setScheduleData(prev => ({ ...prev, notes: e.target.value }))}
              sx={{ mb: 3 }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setShowScheduleDialog(false);
              setEditingSchedule(null);
            }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleScheduleWorkout}
            sx={{
              background: 'linear-gradient(135deg, #00ff88, #00cc66)',
              fontWeight: 700
            }}
          >
            {editingSchedule ? 'Update' : 'Schedule'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Success/Error Messages */}
      <Snackbar
        open={!!success}
        autoHideDuration={4000}
        onClose={() => setSuccess(null)}
      >
        <Alert severity="success" onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      </Snackbar>

      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={() => setError(null)}
      >
        <Alert severity="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      </Snackbar>
    </Box>
  );
}

