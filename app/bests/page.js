'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Container,
  Typography,
  CircularProgress,
  Box,
  Paper,
  Card,
  CardContent,
  Grid
} from '@mui/material';
import { EmojiEvents as EmojiEventsIcon } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export default function PersonalBestsPage() {
  const [personalBests, setPersonalBests] = useState([]);
  const [loading, setLoading] = useState(true);

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
      setLoading(true);
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
    } finally {
      setLoading(false);
    }
  }, [processPersonalBests]);

  useEffect(() => {
    fetchPersonalBests();
  }, [fetchPersonalBests]);


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

  const listVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: {
      opacity: 1,
      x: 0,
      transition: {
        duration: 0.3
      }
    }
  };

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
        <Typography
          variant="h4"
          sx={{
            fontWeight: 900,
            background: 'linear-gradient(135deg, #ff4444, #ffaa00)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            textTransform: 'uppercase',
            letterSpacing: 2,
            textAlign: 'center'
          }}
        >
          💪 PERSONAL RECORDS
        </Typography>
      </Paper>

      <Container maxWidth="lg">
        {personalBests.length === 0 ? (
          <Paper
            sx={{
              background: '#1a1a1a',
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
          <motion.div
            variants={listVariants}
            initial="hidden"
            animate="visible"
          >
            <Grid container spacing={3}>
              {personalBests.map((best, index) => (
                <Grid item xs={12} md={6} lg={4} key={best.exerciseName}>
                  <motion.div variants={itemVariants}>
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
                          <EmojiEventsIcon
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
                          variant="h5"
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
                          variant="h3"
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
                </Grid>
              ))}
            </Grid>
          </motion.div>
        )}
      </Container>
    </Box>
  );
}