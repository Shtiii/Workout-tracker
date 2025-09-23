'use client';

import { useState, useEffect } from 'react';
import {
  Container,
  AppBar,
  Toolbar,
  Typography,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  CircularProgress,
  Box
} from '@mui/material';
import { EmojiEvents as EmojiEventsIcon } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export default function PersonalBestsPage() {
  const [personalBests, setPersonalBests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPersonalBests();
  }, []);

  const fetchPersonalBests = async () => {
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
  };

  const processPersonalBests = (sessions) => {
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
  };

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
      <>
        <AppBar position="sticky">
          <Toolbar>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              Personal Bests
            </Typography>
          </Toolbar>
        </AppBar>
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
          <Box display="flex" justifyContent="center" mt={4}>
            <CircularProgress />
          </Box>
        </Container>
      </>
    );
  }

  return (
    <>
      <AppBar position="sticky">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Personal Bests
          </Typography>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        {personalBests.length === 0 ? (
          <Box textAlign="center" mt={4}>
            <Typography variant="h6" color="text.secondary">
              No workout data found. Complete some workouts to see your personal bests!
            </Typography>
          </Box>
        ) : (
          <motion.div
            variants={listVariants}
            initial="hidden"
            animate="visible"
          >
            <List>
              {personalBests.map((best, index) => (
                <motion.div key={best.exerciseName} variants={itemVariants}>
                  <ListItem>
                    <ListItemIcon>
                      <EmojiEventsIcon
                        sx={{
                          color: index === 0 ? '#FFD700' : index === 1 ? '#C0C0C0' : index === 2 ? '#CD7F32' : 'primary.main'
                        }}
                      />
                    </ListItemIcon>
                    <ListItemText
                      primary={best.exerciseName}
                      secondary={`${best.weight} lbs x ${best.reps} reps on ${formatDate(best.date)}`}
                      primaryTypographyProps={{
                        variant: 'h6',
                        fontWeight: 500
                      }}
                      secondaryTypographyProps={{
                        variant: 'body2',
                        color: 'text.secondary'
                      }}
                    />
                  </ListItem>
                  {index < personalBests.length - 1 && <Divider />}
                </motion.div>
              ))}
            </List>
          </motion.div>
        )}
      </Container>
    </>
  );
}