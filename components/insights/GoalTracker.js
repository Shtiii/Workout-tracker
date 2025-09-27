'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Chip,
  Button,
  IconButton,
  Tooltip,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Avatar,
  LinearProgress,
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
  Snackbar,
  Badge
} from '@mui/material';
import {
  Flag as FlagIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  CheckCircle as CheckCircleIcon,
  RadioButtonUnchecked as UncheckIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  CalendarToday as CalendarIcon,
  EmojiEvents as TrophyIcon,
  Warning as WarningIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon
} from '@mui/icons-material';
import { motion } from 'framer-motion';

/**
 * Goal Tracker Component
 * Tracks and manages fitness goals with milestone celebrations
 */
export default function GoalTracker({
  goals = [],
  workoutHistory = [],
  personalRecords = [],
  bodyMeasurements = [],
  onAddGoal,
  onUpdateGoal,
  onDeleteGoal,
  onCompleteGoal,
  onToggleFavorite
}) {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);
  const [goalData, setGoalData] = useState({
    title: '',
    description: '',
    category: 'strength',
    target: '',
    current: '',
    unit: 'lbs',
    deadline: '',
    priority: 'medium',
    isFavorite: false,
    milestones: []
  });
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Goal categories
  const goalCategories = {
    strength: { label: 'Strength', icon: '💪', color: '#ff4444' },
    weight: { label: 'Weight', icon: '⚖️', color: '#00ff88' },
    endurance: { label: 'Endurance', icon: '🏃', color: '#0088ff' },
    volume: { label: 'Volume', icon: '📊', color: '#ffaa00' },
    consistency: { label: 'Consistency', icon: '🔥', color: '#ff8800' },
    body: { label: 'Body Composition', icon: '📏', color: '#ff00ff' },
    custom: { label: 'Custom', icon: '🎯', color: '#666' }
  };

  // Priority levels
  const priorityLevels = {
    low: { label: 'Low', color: '#00ff88' },
    medium: { label: 'Medium', color: '#ffaa00' },
    high: { label: 'High', color: '#ff4444' }
  };

  // Calculate goal progress
  const calculateGoalProgress = (goal) => {
    let current = 0;
    let target = parseFloat(goal.target);

    switch (goal.category) {
      case 'strength':
        // Find best weight for specific exercise
        if (goal.exercise) {
          const exercisePRs = personalRecords.filter(pr => pr.exercise === goal.exercise);
          if (exercisePRs.length > 0) {
            current = Math.max(...exercisePRs.map(pr => pr.weight));
          }
        }
        break;

      case 'weight':
        // Get latest body weight
        if (bodyMeasurements.length > 0) {
          const latest = bodyMeasurements.sort((a, b) => new Date(b.date) - new Date(a.date))[0];
          current = latest.weight;
        }
        break;

      case 'endurance':
        // Calculate total reps or duration
        if (goal.exercise) {
          const exerciseWorkouts = workoutHistory
            .flatMap(workout => workout.exercises)
            .filter(exercise => exercise.name === goal.exercise);
          
          current = exerciseWorkouts.reduce((sum, exercise) => {
            return sum + exercise.sets
              .filter(set => set.completed)
              .reduce((setSum, set) => setSum + set.reps, 0);
          }, 0);
        }
        break;

      case 'volume':
        // Calculate total volume
        current = workoutHistory.reduce((sum, workout) => {
          return sum + workout.exercises.reduce((exerciseSum, exercise) => {
            return exerciseSum + exercise.sets
              .filter(set => set.completed)
              .reduce((setSum, set) => setSum + (set.weight * set.reps), 0);
          }, 0);
        }, 0);
        break;

      case 'consistency':
        // Calculate workout frequency
        const daysSinceFirstWorkout = workoutHistory.length > 0 
          ? (new Date() - new Date(workoutHistory[workoutHistory.length - 1].completedAt)) / (1000 * 60 * 60 * 24)
          : 0;
        current = workoutHistory.length;
        break;

      case 'body':
        // Get latest body measurement
        if (bodyMeasurements.length > 0) {
          const latest = bodyMeasurements.sort((a, b) => new Date(b.date) - new Date(a.date))[0];
          current = latest[goal.measurement] || 0;
        }
        break;

      default:
        current = parseFloat(goal.current) || 0;
    }

    const percentage = target > 0 ? Math.min((current / target) * 100, 100) : 0;
    const isCompleted = percentage >= 100;
    const isOverdue = goal.deadline && new Date(goal.deadline) < new Date() && !isCompleted;

    return {
      current,
      target,
      percentage,
      isCompleted,
      isOverdue,
      remaining: Math.max(target - current, 0)
    };
  };

  // Get goal status
  const getGoalStatus = (goal) => {
    const progress = calculateGoalProgress(goal);
    
    if (progress.isCompleted) return 'completed';
    if (progress.isOverdue) return 'overdue';
    if (progress.percentage >= 80) return 'almost';
    if (progress.percentage >= 50) return 'good';
    return 'started';
  };

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return '#00ff88';
      case 'overdue': return '#ff4444';
      case 'almost': return '#ffaa00';
      case 'good': return '#0088ff';
      case 'started': return '#666';
      default: return '#666';
    }
  };

  // Get status icon
  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed': return <CheckCircleIcon />;
      case 'overdue': return <WarningIcon />;
      case 'almost': return <TrendingUpIcon />;
      case 'good': return <TrendingUpIcon />;
      case 'started': return <UncheckIcon />;
      default: return <UncheckIcon />;
    }
  };

  // Handle add goal
  const handleAddGoal = () => {
    if (!goalData.title || !goalData.target) {
      setError('Please fill in title and target');
      return;
    }

    const newGoal = {
      id: Date.now().toString(),
      ...goalData,
      target: parseFloat(goalData.target),
      current: parseFloat(goalData.current) || 0,
      deadline: goalData.deadline ? new Date(goalData.deadline) : null,
      createdAt: new Date(),
      status: 'active'
    };

    onAddGoal(newGoal);
    setSuccess('Goal added successfully!');
    setShowAddDialog(false);
    setGoalData({
      title: '',
      description: '',
      category: 'strength',
      target: '',
      current: '',
      unit: 'lbs',
      deadline: '',
      priority: 'medium',
      isFavorite: false,
      milestones: []
    });
  };

  // Handle update goal
  const handleUpdateGoal = () => {
    if (!goalData.title || !goalData.target) {
      setError('Please fill in title and target');
      return;
    }

    const updatedGoal = {
      ...editingGoal,
      ...goalData,
      target: parseFloat(goalData.target),
      current: parseFloat(goalData.current) || 0,
      deadline: goalData.deadline ? new Date(goalData.deadline) : null,
      updatedAt: new Date()
    };

    onUpdateGoal(updatedGoal);
    setSuccess('Goal updated successfully!');
    setShowAddDialog(false);
    setEditingGoal(null);
    setGoalData({
      title: '',
      description: '',
      category: 'strength',
      target: '',
      current: '',
      unit: 'lbs',
      deadline: '',
      priority: 'medium',
      isFavorite: false,
      milestones: []
    });
  };

  // Handle delete goal
  const handleDeleteGoal = (goalId) => {
    onDeleteGoal(goalId);
    setSuccess('Goal deleted successfully!');
  };

  // Handle edit goal
  const handleEditGoal = (goal) => {
    setEditingGoal(goal);
    setGoalData({
      title: goal.title,
      description: goal.description || '',
      category: goal.category,
      target: goal.target.toString(),
      current: goal.current.toString(),
      unit: goal.unit || 'lbs',
      deadline: goal.deadline ? new Date(goal.deadline).toISOString().split('T')[0] : '',
      priority: goal.priority || 'medium',
      isFavorite: goal.isFavorite || false,
      milestones: goal.milestones || []
    });
    setShowAddDialog(true);
  };

  // Handle complete goal
  const handleCompleteGoal = (goalId) => {
    onCompleteGoal(goalId);
    setSuccess('Goal completed! Congratulations!');
  };

  // Handle toggle favorite
  const handleToggleFavorite = (goalId) => {
    onToggleFavorite(goalId);
  };

  // Format date
  const formatDate = (date) => {
    return new Date(date).toLocaleDateString();
  };

  // Get days until deadline
  const getDaysUntilDeadline = (deadline) => {
    if (!deadline) return null;
    const today = new Date();
    const deadlineDate = new Date(deadline);
    const diffTime = deadlineDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Get goal statistics
  const goalStats = useMemo(() => {
    const total = goals.length;
    const completed = goals.filter(goal => {
      const progress = calculateGoalProgress(goal);
      return progress.isCompleted;
    }).length;
    const overdue = goals.filter(goal => {
      const progress = calculateGoalProgress(goal);
      return progress.isOverdue;
    }).length;
    const active = total - completed;

    return { total, completed, overdue, active };
  }, [goals]);

  return (
    <Box>
      {/* Header */}
      <Box mb={3}>
        <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
          Goal Tracker
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Set, track, and achieve your fitness goals with milestone celebrations.
        </Typography>
      </Box>

      {/* Goal Stats */}
      <Grid container spacing={2} mb={3}>
        <Grid item xs={6} sm={3}>
          <Card sx={{ background: '#1a1a1a', border: '1px solid #333' }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" sx={{ fontWeight: 700, color: '#0088ff' }}>
                {goalStats.total}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Goals
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card sx={{ background: '#1a1a1a', border: '1px solid #333' }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" sx={{ fontWeight: 700, color: '#00ff88' }}>
                {goalStats.completed}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Completed
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card sx={{ background: '#1a1a1a', border: '1px solid #333' }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" sx={{ fontWeight: 700, color: '#ffaa00' }}>
                {goalStats.active}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Active
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card sx={{ background: '#1a1a1a', border: '1px solid #333' }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" sx={{ fontWeight: 700, color: '#ff4444' }}>
                {goalStats.overdue}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Overdue
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Add Goal Button */}
      <Box mb={3}>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setShowAddDialog(true)}
          sx={{
            background: 'linear-gradient(135deg, #ff4444, #cc0000)',
            fontWeight: 700
          }}
        >
          Add New Goal
        </Button>
      </Box>

      {/* Goals List */}
      <Card sx={{ background: '#1a1a1a', border: '1px solid #333' }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
            Your Goals
          </Typography>
          
          {goals.length === 0 ? (
            <Box textAlign="center" py={4}>
              <Typography variant="body1" color="text.secondary" mb={2}>
                No goals set yet
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Create your first goal to start tracking your progress
              </Typography>
            </Box>
          ) : (
            <List>
              {goals.map((goal, index) => {
                const progress = calculateGoalProgress(goal);
                const status = getGoalStatus(goal);
                const categoryInfo = goalCategories[goal.category];
                const priorityInfo = priorityLevels[goal.priority];
                const daysUntilDeadline = getDaysUntilDeadline(goal.deadline);
                
                return (
                  <motion.div
                    key={goal.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                  >
                    <ListItem
                      sx={{
                        px: 0,
                        py: 2,
                        borderBottom: '1px solid #333',
                        '&:last-child': { borderBottom: 'none' }
                      }}
                    >
                      <Avatar
                        sx={{
                          background: categoryInfo.color,
                          color: 'white',
                          fontWeight: 700,
                          mr: 2
                        }}
                      >
                        {categoryInfo.icon}
                      </Avatar>
                      
                      <ListItemText
                        primary={
                          <Box display="flex" alignItems="center" gap={2}>
                            <Typography variant="h6" sx={{ fontWeight: 600 }}>
                              {goal.title}
                            </Typography>
                            <Chip
                              label={categoryInfo.label}
                              size="small"
                              sx={{
                                background: `${categoryInfo.color}20`,
                                color: categoryInfo.color
                              }}
                            />
                            <Chip
                              label={priorityInfo.label}
                              size="small"
                              sx={{
                                background: `${priorityInfo.color}20`,
                                color: priorityInfo.color
                              }}
                            />
                            {status === 'completed' && (
                              <Chip
                                label="Completed"
                                size="small"
                                sx={{ background: 'rgba(0, 255, 136, 0.2)', color: '#00ff88' }}
                              />
                            )}
                            {status === 'overdue' && (
                              <Chip
                                label="Overdue"
                                size="small"
                                sx={{ background: 'rgba(255, 68, 68, 0.2)', color: '#ff4444' }}
                              />
                            )}
                          </Box>
                        }
                        secondary={
                          <Box>
                            <Typography variant="body2" color="text.secondary" mb={1}>
                              {goal.description}
                            </Typography>
                            <Box display="flex" gap={2} mb={1}>
                              <Typography variant="body2" color="text.secondary">
                                Progress: {progress.current.toFixed(1)} / {progress.target} {goal.unit}
                              </Typography>
                              {goal.deadline && (
                                <Typography variant="body2" color="text.secondary">
                                  Deadline: {formatDate(goal.deadline)}
                                  {daysUntilDeadline !== null && (
                                    <span style={{ 
                                      color: daysUntilDeadline < 0 ? '#ff4444' : 
                                            daysUntilDeadline < 7 ? '#ffaa00' : '#00ff88' 
                                    }}>
                                      ({daysUntilDeadline < 0 ? `${Math.abs(daysUntilDeadline)} days overdue` : 
                                        `${daysUntilDeadline} days left`})
                                    </span>
                                  )}
                                </Typography>
                              )}
                            </Box>
                            <LinearProgress
                              variant="determinate"
                              value={progress.percentage}
                              sx={{
                                height: 8,
                                borderRadius: 4,
                                background: '#333',
                                '& .MuiLinearProgress-bar': {
                                  background: `linear-gradient(90deg, ${getStatusColor(status)}, ${getStatusColor(status)}88)`,
                                  borderRadius: 4
                                }
                              }}
                            />
                          </Box>
                        }
                      />
                      
                      <ListItemSecondaryAction>
                        <Box display="flex" gap={1}>
                          <Tooltip title={goal.isFavorite ? 'Remove from favorites' : 'Add to favorites'}>
                            <IconButton
                              size="small"
                              onClick={() => handleToggleFavorite(goal.id)}
                              sx={{ color: goal.isFavorite ? '#ffaa00' : '#666' }}
                            >
                              {goal.isFavorite ? <StarIcon /> : <StarBorderIcon />}
                            </IconButton>
                          </Tooltip>
                          {!progress.isCompleted && (
                            <Tooltip title="Mark as completed">
                              <IconButton
                                size="small"
                                onClick={() => handleCompleteGoal(goal.id)}
                                sx={{ color: '#00ff88' }}
                              >
                                <CheckCircleIcon />
                              </IconButton>
                            </Tooltip>
                          )}
                          <Tooltip title="Edit">
                            <IconButton
                              size="small"
                              onClick={() => handleEditGoal(goal)}
                              sx={{ color: '#ffaa00' }}
                            >
                              <EditIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete">
                            <IconButton
                              size="small"
                              onClick={() => handleDeleteGoal(goal.id)}
                              sx={{ color: '#ff4444' }}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </ListItemSecondaryAction>
                    </ListItem>
                  </motion.div>
                );
              })}
            </List>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Goal Dialog */}
      <Dialog
        open={showAddDialog}
        onClose={() => {
          setShowAddDialog(false);
          setEditingGoal(null);
        }}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            {editingGoal ? 'Edit Goal' : 'Add New Goal'}
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <TextField
              fullWidth
              label="Goal Title"
              value={goalData.title}
              onChange={(e) => setGoalData(prev => ({ ...prev, title: e.target.value }))}
              sx={{ mb: 3 }}
            />

            <TextField
              fullWidth
              multiline
              rows={3}
              label="Description"
              value={goalData.description}
              onChange={(e) => setGoalData(prev => ({ ...prev, description: e.target.value }))}
              sx={{ mb: 3 }}
            />

            <Grid container spacing={2} mb={3}>
              <Grid item xs={6}>
                <FormControl fullWidth>
                  <InputLabel>Category</InputLabel>
                  <Select
                    value={goalData.category}
                    onChange={(e) => setGoalData(prev => ({ ...prev, category: e.target.value }))}
                    label="Category"
                  >
                    {Object.entries(goalCategories).map(([key, info]) => (
                      <MenuItem key={key} value={key}>
                        <Box display="flex" alignItems="center" gap={1}>
                          <span>{info.icon}</span>
                          {info.label}
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={6}>
                <FormControl fullWidth>
                  <InputLabel>Priority</InputLabel>
                  <Select
                    value={goalData.priority}
                    onChange={(e) => setGoalData(prev => ({ ...prev, priority: e.target.value }))}
                    label="Priority"
                  >
                    {Object.entries(priorityLevels).map(([key, info]) => (
                      <MenuItem key={key} value={key}>
                        <Box display="flex" alignItems="center" gap={1}>
                          <Box
                            width={12}
                            height={12}
                            borderRadius="50%"
                            sx={{ background: info.color }}
                          />
                          {info.label}
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>

            <Grid container spacing={2} mb={3}>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Target"
                  type="number"
                  value={goalData.target}
                  onChange={(e) => setGoalData(prev => ({ ...prev, target: e.target.value }))}
                  inputProps={{ min: 0, step: 0.1 }}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Current"
                  type="number"
                  value={goalData.current}
                  onChange={(e) => setGoalData(prev => ({ ...prev, current: e.target.value }))}
                  inputProps={{ min: 0, step: 0.1 }}
                />
              </Grid>
            </Grid>

            <Grid container spacing={2} mb={3}>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Unit"
                  value={goalData.unit}
                  onChange={(e) => setGoalData(prev => ({ ...prev, unit: e.target.value }))}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Deadline"
                  type="date"
                  value={goalData.deadline}
                  onChange={(e) => setGoalData(prev => ({ ...prev, deadline: e.target.value }))}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setShowAddDialog(false);
              setEditingGoal(null);
            }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={editingGoal ? handleUpdateGoal : handleAddGoal}
            sx={{
              background: 'linear-gradient(135deg, #00ff88, #00cc66)',
              fontWeight: 700
            }}
          >
            {editingGoal ? 'Update' : 'Add'} Goal
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
