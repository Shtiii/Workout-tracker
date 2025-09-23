'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Card,
  CardContent,
  Grid,
  Button,
  TextField,
  Modal,
  LinearProgress,
  IconButton,
  Chip,
  Snackbar,
  Alert,
  MenuItem
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  EmojiEvents as TrophyIcon,
  Edit as EditIcon
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { collection, getDocs, addDoc, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

const modalStyle = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 500,
  maxHeight: '80vh',
  overflow: 'auto',
  bgcolor: '#1a1a1a',
  border: '2px solid #ff4444',
  borderRadius: 2,
  boxShadow: '0 0 50px rgba(255, 68, 68, 0.3)',
  p: 4,
};

export default function GoalsPage() {
  const [goals, setGoals] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [newGoal, setNewGoal] = useState({
    name: '',
    description: '',
    target: '',
    current: '',
    unit: '',
    category: 'Strength'
  });

  const goalCategories = ['Strength', 'Endurance', 'Weight Loss', 'Muscle Gain', 'General Fitness'];

  useEffect(() => {
    fetchGoals();
  }, [fetchGoals]);

  const fetchGoals = useCallback(async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'goals'));
      const goalsData = [];
      querySnapshot.forEach((doc) => {
        goalsData.push({ id: doc.id, ...doc.data() });
      });
      setGoals(goalsData);
    } catch (error) {
      console.error('Error fetching goals:', error);
      showSnackbar('Error fetching goals', 'error');
    }
  }, []);

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const handleOpenModal = (goal = null) => {
    if (goal) {
      setEditingGoal(goal);
      setNewGoal(goal);
    } else {
      setEditingGoal(null);
      setNewGoal({
        name: '',
        description: '',
        target: '',
        current: '',
        unit: '',
        category: 'Strength'
      });
    }
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setEditingGoal(null);
    setNewGoal({
      name: '',
      description: '',
      target: '',
      current: '',
      unit: '',
      category: 'Strength'
    });
  };

  const handleInputChange = (field, value) => {
    setNewGoal({ ...newGoal, [field]: value });
  };

  const saveGoal = async () => {
    if (!newGoal.name.trim() || !newGoal.target || !newGoal.unit.trim()) {
      showSnackbar('Please fill in all required fields', 'error');
      return;
    }

    try {
      const goalData = {
        name: newGoal.name.trim(),
        description: newGoal.description.trim(),
        target: parseFloat(newGoal.target),
        current: parseFloat(newGoal.current) || 0,
        unit: newGoal.unit.trim(),
        category: newGoal.category,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      if (editingGoal) {
        await updateDoc(doc(db, 'goals', editingGoal.id), {
          ...goalData,
          createdAt: editingGoal.createdAt
        });
        showSnackbar('Goal updated successfully!', 'success');
      } else {
        await addDoc(collection(db, 'goals'), goalData);
        showSnackbar('Goal created successfully!', 'success');
      }

      fetchGoals();
      handleCloseModal();
    } catch (error) {
      console.error('Error saving goal:', error);
      showSnackbar('Error saving goal', 'error');
    }
  };

  const deleteGoal = async (goalId) => {
    if (confirm('Are you sure you want to delete this goal?')) {
      try {
        await deleteDoc(doc(db, 'goals', goalId));
        showSnackbar('Goal deleted successfully!', 'success');
        fetchGoals();
      } catch (error) {
        console.error('Error deleting goal:', error);
        showSnackbar('Error deleting goal', 'error');
      }
    }
  };

  const calculateProgress = (current, target) => {
    if (!current || !target) return 0;
    return Math.min(100, Math.round((current / target) * 100));
  };

  const getProgressColor = (progress) => {
    if (progress >= 100) return '#00ff88';
    if (progress >= 75) return '#ffaa00';
    if (progress >= 50) return '#ff4444';
    return '#666';
  };

  const GoalCard = ({ goal }) => {
    const progress = calculateProgress(goal.current, goal.target);
    const progressColor = getProgressColor(progress);

    return (
      <motion.div
        whileHover={{ y: -5 }}
        transition={{ duration: 0.2 }}
      >
        <Card
          sx={{
            background: 'linear-gradient(135deg, rgba(26, 26, 26, 0.9), rgba(255, 68, 68, 0.05))',
            border: '1px solid #333',
            position: 'relative',
            overflow: 'hidden',
            '&:hover': {
              borderColor: 'primary.main',
              boxShadow: '0 0 20px rgba(255, 68, 68, 0.3)'
            },
            transition: 'all 0.3s'
          }}
        >
          <CardContent sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
              <Box>
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: 1,
                    mb: 1
                  }}
                >
                  {goal.name}
                </Typography>
                <Chip
                  label={goal.category}
                  size="small"
                  color="primary"
                  variant="outlined"
                  sx={{ mb: 1 }}
                />
              </Box>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <IconButton
                  onClick={() => handleOpenModal(goal)}
                  color="primary"
                  size="small"
                >
                  <EditIcon />
                </IconButton>
                <IconButton
                  onClick={() => deleteGoal(goal.id)}
                  color="error"
                  size="small"
                >
                  <DeleteIcon />
                </IconButton>
              </Box>
            </Box>

            {goal.description && (
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mb: 2 }}
              >
                {goal.description}
              </Typography>
            )}

            <Box sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  Progress
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: 700,
                    color: progressColor
                  }}
                >
                  {progress}%
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={progress}
                sx={{
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: '#333',
                  '& .MuiLinearProgress-bar': {
                    backgroundColor: progressColor,
                    borderRadius: 4,
                    boxShadow: `0 0 10px ${progressColor}50`
                  }
                }}
              />
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                Current: {goal.current || 0} {goal.unit}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Target: {goal.target} {goal.unit}
              </Typography>
            </Box>

            {progress >= 100 && (
              <Box
                sx={{
                  position: 'absolute',
                  top: 16,
                  right: 16,
                  background: '#00ff88',
                  color: '#000',
                  p: 0.5,
                  borderRadius: '50%',
                  minWidth: 30,
                  height: 30,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <TrophyIcon sx={{ fontSize: 16 }} />
              </Box>
            )}
          </CardContent>
        </Card>
      </motion.div>
    );
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: `
          radial-gradient(circle at 20% 50%, rgba(255, 68, 68, 0.1) 0%, transparent 50%),
          radial-gradient(circle at 80% 80%, rgba(255, 170, 0, 0.05) 0%, transparent 50%)
        `,
        pb: 10
      }}
    >
      {/* Header */}
      <Paper
        sx={{
          background: 'linear-gradient(135deg, #1a1a1a, rgba(255, 68, 68, 0.1))',
          border: '1px solid #333',
          p: 3,
          mb: 3,
          backdropFilter: 'blur(10px)'
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 900,
              background: 'linear-gradient(135deg, #ff4444, #ffaa00)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              textTransform: 'uppercase',
              letterSpacing: 2
            }}
          >
            🎯 GOALS
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenModal()}
            sx={{
              background: 'linear-gradient(135deg, #ff4444, #cc0000)',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: 1
            }}
          >
            Set New Goal
          </Button>
        </Box>
      </Paper>

      <Container maxWidth="lg">
        {goals.length === 0 ? (
          <Paper
            sx={{
              background: '#1a1a1a',
              border: '1px solid #333',
              p: 4,
              textAlign: 'center'
            }}
          >
            <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
              No goals set yet
            </Typography>
            <Typography color="text.secondary">
              Time to aim higher! Set your first conquest goal 🎯
            </Typography>
          </Paper>
        ) : (
          <Grid container spacing={3}>
            {goals.map((goal) => (
              <Grid item xs={12} sm={6} md={4} key={goal.id}>
                <GoalCard goal={goal} />
              </Grid>
            ))}
          </Grid>
        )}
      </Container>

      {/* Goal Creation/Edit Modal */}
      <Modal open={modalOpen} onClose={handleCloseModal}>
        <Box sx={modalStyle}>
          <Typography variant="h6" sx={{ mb: 3, fontWeight: 700, textTransform: 'uppercase' }}>
            {editingGoal ? 'Edit Goal' : 'Set New Goal'}
          </Typography>

          <TextField
            fullWidth
            label="Goal Name"
            value={newGoal.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            margin="normal"
            required
            sx={{
              '& .MuiOutlinedInput-root': {
                backgroundColor: '#0a0a0a',
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'primary.main'
                }
              }
            }}
          />

          <TextField
            fullWidth
            label="Description"
            value={newGoal.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            margin="normal"
            multiline
            rows={3}
            sx={{
              '& .MuiOutlinedInput-root': {
                backgroundColor: '#0a0a0a',
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'primary.main'
                }
              }
            }}
          />

          <TextField
            select
            fullWidth
            label="Category"
            value={newGoal.category}
            onChange={(e) => handleInputChange('category', e.target.value)}
            margin="normal"
            sx={{
              '& .MuiOutlinedInput-root': {
                backgroundColor: '#0a0a0a',
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'primary.main'
                }
              }
            }}
          >
            {goalCategories.map((category) => (
              <MenuItem key={category} value={category}>
                {category}
              </MenuItem>
            ))}
          </TextField>

          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={4}>
              <TextField
                fullWidth
                label="Target Value"
                type="number"
                value={newGoal.target}
                onChange={(e) => handleInputChange('target', e.target.value)}
                required
                sx={{
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: '#0a0a0a',
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'primary.main'
                    }
                  }
                }}
              />
            </Grid>
            <Grid item xs={4}>
              <TextField
                fullWidth
                label="Current Value"
                type="number"
                value={newGoal.current}
                onChange={(e) => handleInputChange('current', e.target.value)}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: '#0a0a0a',
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'primary.main'
                    }
                  }
                }}
              />
            </Grid>
            <Grid item xs={4}>
              <TextField
                fullWidth
                label="Unit"
                value={newGoal.unit}
                onChange={(e) => handleInputChange('unit', e.target.value)}
                placeholder="kg, reps, minutes..."
                required
                sx={{
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: '#0a0a0a',
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'primary.main'
                    }
                  }
                }}
              />
            </Grid>
          </Grid>

          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 3 }}>
            <Button onClick={handleCloseModal}>
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={saveGoal}
              disabled={!newGoal.name.trim() || !newGoal.target || !newGoal.unit.trim()}
              sx={{
                background: 'linear-gradient(135deg, #ff4444, #cc0000)',
                fontWeight: 700
              }}
            >
              {editingGoal ? 'Update Goal' : 'Set Goal'}
            </Button>
          </Box>
        </Box>
      </Modal>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}