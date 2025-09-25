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
  MenuItem,
  Tabs,
  Tab,
  CircularProgress
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

export default function GoalsRecordsPage() {
  const [activeTab, setActiveTab] = useState(0);
  const [goals, setGoals] = useState([]);
  const [personalBests, setPersonalBests] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);
  const [loading, setLoading] = useState(true);
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

  const processPersonalBests = useCallback((sessions) => {
    const exerciseBests = {};

    sessions.forEach((session) => {
      session.exercises?.forEach((exercise) => {
        exercise.sets?.forEach((set) => {
          const weight = parseFloat(set.weight);
          const reps = parseInt(set.reps);

          if (weight && reps) {
            const exerciseName = exercise.name;
            const oneRepMax = calculateOneRepMax(weight, reps);

            if (!exerciseBests[exerciseName] || oneRepMax > exerciseBests[exerciseName].oneRepMax) {
              exerciseBests[exerciseName] = {
                exerciseName,
                weight,
                reps,
                oneRepMax,
                date: session.completedAt,
                sessionId: session.id
              };
            }
          }
        });
      });
    });

    return Object.values(exerciseBests).sort((a, b) => b.oneRepMax - a.oneRepMax);
  }, []);

  const fetchPersonalBests = useCallback(async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'workoutSessions'));
      const workoutSessions = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        workoutSessions.push({
          id: doc.id,
          ...data,
          completedAt: data.completedAt?.toDate() || new Date()
        });
      });

      const bests = processPersonalBests(workoutSessions);
      setPersonalBests(bests);
    } catch (error) {
      console.error('Error fetching workout sessions:', error);
    }
  }, [processPersonalBests]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      await Promise.all([fetchGoals(), fetchPersonalBests()]);
      setLoading(false);
    };
    fetchData();
  }, [fetchGoals, fetchPersonalBests]);

  const calculateOneRepMax = (weight, reps) => {
    if (reps === 1) return weight;
    return weight * (1 + reps / 30);
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

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

  const PersonalRecordCard = ({ best, index }) => (
    <motion.div
      whileHover={{ y: -5 }}
      transition={{ duration: 0.2 }}
    >
      <Card
        sx={{
          background: `linear-gradient(135deg, rgba(26, 26, 26, 0.9), ${
            index === 0 ? 'rgba(255, 215, 0, 0.1)' :
            index === 1 ? 'rgba(192, 192, 192, 0.1)' :
            index === 2 ? 'rgba(205, 127, 50, 0.1)' :
            'rgba(255, 68, 68, 0.05)'
          })`,
          border: `1px solid ${
            index === 0 ? '#FFD700' :
            index === 1 ? '#C0C0C0' :
            index === 2 ? '#CD7F32' :
            '#333'
          }`,
          position: 'relative',
          overflow: 'hidden',
          '&:hover': {
            borderColor: 'primary.main',
            boxShadow: '0 0 20px rgba(255, 68, 68, 0.3)',
            transform: 'translateY(-5px)'
          },
          transition: 'all 0.3s'
        }}
      >
        <CardContent sx={{ textAlign: 'center', p: 3 }}>
          <Box sx={{ mb: 2 }}>
            <TrophyIcon
              sx={{
                fontSize: 48,
                color: index === 0 ? '#FFD700' : index === 1 ? '#C0C0C0' : index === 2 ? '#CD7F32' : 'primary.main'
              }}
            />
            {index < 3 && (
              <Typography
                variant="caption"
                sx={{
                  position: 'absolute',
                  top: 16,
                  right: 16,
                  background: index === 0 ? '#FFD700' : index === 1 ? '#C0C0C0' : '#CD7F32',
                  color: '#000',
                  px: 1,
                  py: 0.5,
                  borderRadius: 1,
                  fontWeight: 700
                }}
              >
                #{index + 1}
              </Typography>
            )}
          </Box>

          <Typography
            variant="h6"
            sx={{
              fontWeight: 700,
              mb: 1,
              textTransform: 'uppercase',
              letterSpacing: 1
            }}
          >
            {best.exerciseName}
          </Typography>

          <Typography
            variant="h4"
            sx={{
              fontWeight: 900,
              background: 'linear-gradient(135deg, #ff4444, #ffaa00)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              mb: 1
            }}
          >
            {best.weight} kg
          </Typography>

          <Typography
            variant="body1"
            sx={{ mb: 1, fontWeight: 600 }}
          >
            {best.reps} reps
          </Typography>

          <Typography
            variant="caption"
            color="text.secondary"
            sx={{
              textTransform: 'uppercase',
              letterSpacing: 1,
              fontWeight: 600
            }}
          >
            {formatDate(best.date)}
          </Typography>

          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: 4,
              background: `linear-gradient(90deg, ${
                index === 0 ? '#FFD700' :
                index === 1 ? '#C0C0C0' :
                index === 2 ? '#CD7F32' :
                '#ff4444'
              }, transparent)`
            }}
          />
        </CardContent>
      </Card>
    </motion.div>
  );

  if (loading) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          background: `
            radial-gradient(circle at 20% 50%, rgba(255, 68, 68, 0.1) 0%, transparent 50%),
            radial-gradient(circle at 80% 80%, rgba(255, 170, 0, 0.05) 0%, transparent 50%)
          `,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <CircularProgress size={60} sx={{ color: 'primary.main' }} />
      </Box>
    );
  }

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
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
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
              fontSize: { xs: '1.4rem', sm: '1.5rem' },
              lineHeight: 1.2
            }}
          >
            GOALS & RECORDS
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
        <Paper
          sx={{
            background: '#1a1a1a',
            border: '1px solid #333',
            borderRadius: 2,
            overflow: 'hidden'
          }}
        >
          <Tabs
            value={activeTab}
            onChange={(e, newValue) => setActiveTab(newValue)}
            sx={{
              borderBottom: '1px solid #333',
              '& .MuiTab-root': {
                textTransform: 'uppercase',
                fontWeight: 700,
                letterSpacing: 1
              }
            }}
          >
            <Tab label="Goals" />
            <Tab label="Personal Records" />
          </Tabs>

          <Box sx={{ p: 3 }}>
            {activeTab === 0 && (
              <>
                {goals.length === 0 ? (
                  <Paper
                    sx={{
                      background: 'rgba(26, 26, 26, 0.5)',
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
              </>
            )}

            {activeTab === 1 && (
              <>
                {personalBests.length === 0 ? (
                  <Paper
                    sx={{
                      background: 'rgba(26, 26, 26, 0.5)',
                      border: '1px solid #333',
                      p: 4,
                      textAlign: 'center'
                    }}
                  >
                    <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
                      No workout data found
                    </Typography>
                    <Typography color="text.secondary">
                      Complete some workouts to see your personal bests! 💪
                    </Typography>
                  </Paper>
                ) : (
                  <Grid container spacing={3}>
                    {personalBests.map((best, index) => (
                      <Grid item xs={12} md={6} lg={4} key={best.exerciseName}>
                        <PersonalRecordCard best={best} index={index} />
                      </Grid>
                    ))}
                  </Grid>
                )}
              </>
            )}
          </Box>
        </Paper>
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