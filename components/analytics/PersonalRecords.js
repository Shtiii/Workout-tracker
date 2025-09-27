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
  Badge,
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
  EmojiEvents as TrophyIcon,
  TrendingUp as TrendingUpIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon,
  CalendarToday as CalendarIcon,
  FitnessCenter as FitnessIcon,
  Timer as TimerIcon,
  Speed as SpeedIcon
} from '@mui/icons-material';
import { motion } from 'framer-motion';

/**
 * Personal Records Component
 * Tracks and displays personal records with achievements and milestones
 */
export default function PersonalRecords({
  workoutHistory = [],
  personalRecords = [],
  onAddRecord,
  onUpdateRecord,
  onDeleteRecord,
  onToggleFavorite
}) {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [recordData, setRecordData] = useState({
    exercise: '',
    weight: '',
    reps: '',
    date: '',
    notes: '',
    isFavorite: false,
    category: 'strength'
  });
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Get unique exercises from workout history
  const availableExercises = useMemo(() => {
    const exercises = new Set();
    workoutHistory.forEach(workout => {
      workout.exercises.forEach(exercise => {
        exercises.add(exercise.name);
      });
    });
    return Array.from(exercises).sort();
  }, [workoutHistory]);

  // Calculate automatic PRs from workout history
  const automaticPRs = useMemo(() => {
    const prs = new Map();
    
    workoutHistory.forEach(workout => {
      workout.exercises.forEach(exercise => {
        exercise.sets.forEach(set => {
          if (set.completed && set.weight > 0) {
            const key = `${exercise.name}-${set.reps}`;
            const currentPR = prs.get(key);
            
            if (!currentPR || set.weight > currentPR.weight) {
              prs.set(key, {
                exercise: exercise.name,
                weight: set.weight,
                reps: set.reps,
                date: workout.completedAt,
                workoutId: workout.id,
                isAutomatic: true
              });
            }
          }
        });
      });
    });
    
    return Array.from(prs.values()).sort((a, b) => b.weight - a.weight);
  }, [workoutHistory]);

  // Combine manual and automatic PRs
  const allRecords = useMemo(() => {
    const combined = [...personalRecords, ...automaticPRs];
    return combined.sort((a, b) => {
      // Sort by weight first, then by date
      if (b.weight !== a.weight) return b.weight - a.weight;
      return new Date(b.date) - new Date(a.date);
    });
  }, [personalRecords, automaticPRs]);

  // Get PR categories
  const prCategories = {
    strength: { label: 'Strength', color: '#ff4444', icon: '💪' },
    endurance: { label: 'Endurance', color: '#00ff88', icon: '🏃' },
    power: { label: 'Power', color: '#ffaa00', icon: '⚡' },
    volume: { label: 'Volume', color: '#0088ff', icon: '📊' }
  };

  // Get category info
  const getCategoryInfo = (category) => {
    return prCategories[category] || prCategories.strength;
  };

  // Handle add record
  const handleAddRecord = () => {
    if (!recordData.exercise || !recordData.weight || !recordData.reps || !recordData.date) {
      setError('Please fill in all required fields');
      return;
    }

    const newRecord = {
      id: Date.now().toString(),
      ...recordData,
      weight: parseFloat(recordData.weight),
      reps: parseInt(recordData.reps),
      date: new Date(recordData.date),
      createdAt: new Date()
    };

    onAddRecord(newRecord);
    setSuccess('Personal record added successfully!');
    setShowAddDialog(false);
    setRecordData({
      exercise: '',
      weight: '',
      reps: '',
      date: '',
      notes: '',
      isFavorite: false,
      category: 'strength'
    });
  };

  // Handle update record
  const handleUpdateRecord = () => {
    if (!recordData.exercise || !recordData.weight || !recordData.reps || !recordData.date) {
      setError('Please fill in all required fields');
      return;
    }

    const updatedRecord = {
      ...editingRecord,
      ...recordData,
      weight: parseFloat(recordData.weight),
      reps: parseInt(recordData.reps),
      date: new Date(recordData.date),
      updatedAt: new Date()
    };

    onUpdateRecord(updatedRecord);
    setSuccess('Personal record updated successfully!');
    setShowAddDialog(false);
    setEditingRecord(null);
    setRecordData({
      exercise: '',
      weight: '',
      reps: '',
      date: '',
      notes: '',
      isFavorite: false,
      category: 'strength'
    });
  };

  // Handle delete record
  const handleDeleteRecord = (recordId) => {
    onDeleteRecord(recordId);
    setSuccess('Personal record deleted successfully!');
  };

  // Handle edit record
  const handleEditRecord = (record) => {
    setEditingRecord(record);
    setRecordData({
      exercise: record.exercise,
      weight: record.weight.toString(),
      reps: record.reps.toString(),
      date: new Date(record.date).toISOString().split('T')[0],
      notes: record.notes || '',
      isFavorite: record.isFavorite || false,
      category: record.category || 'strength'
    });
    setShowAddDialog(true);
  };

  // Handle toggle favorite
  const handleToggleFavorite = (recordId) => {
    onToggleFavorite(recordId);
  };

  // Format date
  const formatDate = (date) => {
    return new Date(date).toLocaleDateString();
  };

  // Get PR rank
  const getPRRank = (record) => {
    const sameExercise = allRecords.filter(r => r.exercise === record.exercise);
    const rank = sameExercise.findIndex(r => r.id === record.id) + 1;
    return rank;
  };

  // Get PR badge
  const getPRBadge = (record) => {
    const rank = getPRRank(record);
    if (rank === 1) return { label: 'PR', color: '#ffaa00' };
    if (rank === 2) return { label: '2nd', color: '#666' };
    if (rank === 3) return { label: '3rd', color: '#ff8800' };
    return null;
  };

  return (
    <Box>
      {/* Header */}
      <Box mb={3}>
        <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
          Personal Records
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Track your achievements and celebrate your progress.
        </Typography>
      </Box>

      {/* PR Stats */}
      <Grid container spacing={2} mb={3}>
        <Grid item xs={6} sm={3}>
          <Card sx={{ background: '#1a1a1a', border: '1px solid #333' }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" sx={{ fontWeight: 700, color: '#ffaa00' }}>
                {allRecords.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total PRs
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card sx={{ background: '#1a1a1a', border: '1px solid #333' }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" sx={{ fontWeight: 700, color: '#00ff88' }}>
                {allRecords.filter(r => r.isFavorite).length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Favorites
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card sx={{ background: '#1a1a1a', border: '1px solid #333' }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" sx={{ fontWeight: 700, color: '#ff4444' }}>
                {new Set(allRecords.map(r => r.exercise)).size}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Exercises
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card sx={{ background: '#1a1a1a', border: '1px solid #333' }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" sx={{ fontWeight: 700, color: '#0088ff' }}>
                {Math.max(...allRecords.map(r => r.weight), 0).toFixed(0)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Heaviest Lift (lbs)
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Add PR Button */}
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
          Add Personal Record
        </Button>
      </Box>

      {/* PR List */}
      <Card sx={{ background: '#1a1a1a', border: '1px solid #333' }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
            All Personal Records
          </Typography>
          
          {allRecords.length === 0 ? (
            <Box textAlign="center" py={4}>
              <Typography variant="body1" color="text.secondary" mb={2}>
                No personal records yet
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Add your first PR or complete some workouts to see automatic PRs
              </Typography>
            </Box>
          ) : (
            <List>
              {allRecords.map((record, index) => {
                const categoryInfo = getCategoryInfo(record.category);
                const badge = getPRBadge(record);
                
                return (
                  <motion.div
                    key={record.id}
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
                        {record.weight}
                      </Avatar>
                      
                      <ListItemText
                        primary={
                          <Box display="flex" alignItems="center" gap={2}>
                            <Typography variant="h6" sx={{ fontWeight: 600 }}>
                              {record.exercise}
                            </Typography>
                            {badge && (
                              <Chip
                                label={badge.label}
                                size="small"
                                sx={{
                                  background: `${badge.color}20`,
                                  color: badge.color,
                                  fontWeight: 600
                                }}
                              />
                            )}
                            {record.isAutomatic && (
                              <Chip
                                label="Auto"
                                size="small"
                                sx={{
                                  background: 'rgba(0, 255, 136, 0.2)',
                                  color: '#00ff88'
                                }}
                              />
                            )}
                          </Box>
                        }
                        secondary={
                          <Box>
                            <Typography variant="body2" color="text.secondary">
                              {record.weight} lbs × {record.reps} reps
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {formatDate(record.date)}
                            </Typography>
                            {record.notes && (
                              <Typography variant="caption" color="text.secondary" display="block">
                                {record.notes}
                              </Typography>
                            )}
                          </Box>
                        }
                      />
                      
                      <ListItemSecondaryAction>
                        <Box display="flex" gap={1}>
                          <Tooltip title={record.isFavorite ? 'Remove from favorites' : 'Add to favorites'}>
                            <IconButton
                              size="small"
                              onClick={() => handleToggleFavorite(record.id)}
                              sx={{ color: record.isFavorite ? '#ffaa00' : '#666' }}
                            >
                              {record.isFavorite ? <StarIcon /> : <StarBorderIcon />}
                            </IconButton>
                          </Tooltip>
                          {!record.isAutomatic && (
                            <>
                              <Tooltip title="Edit">
                                <IconButton
                                  size="small"
                                  onClick={() => handleEditRecord(record)}
                                  sx={{ color: '#ffaa00' }}
                                >
                                  <EditIcon />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Delete">
                                <IconButton
                                  size="small"
                                  onClick={() => handleDeleteRecord(record.id)}
                                  sx={{ color: '#ff4444' }}
                                >
                                  <DeleteIcon />
                                </IconButton>
                              </Tooltip>
                            </>
                          )}
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

      {/* Add/Edit PR Dialog */}
      <Dialog
        open={showAddDialog}
        onClose={() => {
          setShowAddDialog(false);
          setEditingRecord(null);
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            {editingRecord ? 'Edit Personal Record' : 'Add Personal Record'}
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <FormControl fullWidth sx={{ mb: 3 }}>
              <InputLabel>Exercise</InputLabel>
              <Select
                value={recordData.exercise}
                onChange={(e) => setRecordData(prev => ({ ...prev, exercise: e.target.value }))}
                label="Exercise"
              >
                {availableExercises.map(exercise => (
                  <MenuItem key={exercise} value={exercise}>{exercise}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <Grid container spacing={2} mb={3}>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Weight (lbs)"
                  type="number"
                  value={recordData.weight}
                  onChange={(e) => setRecordData(prev => ({ ...prev, weight: e.target.value }))}
                  inputProps={{ min: 0, step: 0.5 }}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Reps"
                  type="number"
                  value={recordData.reps}
                  onChange={(e) => setRecordData(prev => ({ ...prev, reps: e.target.value }))}
                  inputProps={{ min: 1, step: 1 }}
                />
              </Grid>
            </Grid>

            <TextField
              fullWidth
              label="Date"
              type="date"
              value={recordData.date}
              onChange={(e) => setRecordData(prev => ({ ...prev, date: e.target.value }))}
              InputLabelProps={{ shrink: true }}
              sx={{ mb: 3 }}
            />

            <FormControl fullWidth sx={{ mb: 3 }}>
              <InputLabel>Category</InputLabel>
              <Select
                value={recordData.category}
                onChange={(e) => setRecordData(prev => ({ ...prev, category: e.target.value }))}
                label="Category"
              >
                {Object.entries(prCategories).map(([key, info]) => (
                  <MenuItem key={key} value={key}>
                    <Box display="flex" alignItems="center" gap={1}>
                      <span>{info.icon}</span>
                      {info.label}
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              fullWidth
              multiline
              rows={3}
              label="Notes (optional)"
              value={recordData.notes}
              onChange={(e) => setRecordData(prev => ({ ...prev, notes: e.target.value }))}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setShowAddDialog(false);
              setEditingRecord(null);
            }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={editingRecord ? handleUpdateRecord : handleAddRecord}
            sx={{
              background: 'linear-gradient(135deg, #00ff88, #00cc66)',
              fontWeight: 700
            }}
          >
            {editingRecord ? 'Update' : 'Add'} PR
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
