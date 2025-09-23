'use client';

import { useState, useEffect } from 'react';
import {
  Container,
  AppBar,
  Toolbar,
  Typography,
  Grid,
  Card,
  CardContent,
  Paper,
  TextField,
  Button,
  Box,
  Snackbar,
  Alert,
  CircularProgress
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { motion } from 'framer-motion';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { collection, getDocs, addDoc, orderBy, query } from 'firebase/firestore';
import { db } from '@/lib/firebase';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

export default function AnalyticsPage() {
  const theme = useTheme();
  const [weight, setWeight] = useState('');
  const [bodyMetrics, setBodyMetrics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  useEffect(() => {
    fetchBodyMetrics();
  }, []);

  const fetchBodyMetrics = async () => {
    try {
      setLoading(true);
      const q = query(collection(db, 'bodyMetrics'), orderBy('date', 'asc'));
      const querySnapshot = await getDocs(q);
      const metricsData = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        metricsData.push({
          id: doc.id,
          ...data,
          date: data.date?.toDate() || new Date()
        });
      });

      setBodyMetrics(metricsData);
    } catch (error) {
      console.error('Error fetching body metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleWeightSubmit = async (e) => {
    e.preventDefault();
    if (!weight.trim()) return;

    const weightValue = parseFloat(weight);
    if (isNaN(weightValue) || weightValue <= 0) {
      setSnackbarMessage('Please enter a valid weight');
      setSnackbarOpen(true);
      return;
    }

    try {
      setSaving(true);
      await addDoc(collection(db, 'bodyMetrics'), {
        weight: weightValue,
        date: new Date(),
        createdAt: new Date()
      });

      setWeight('');
      setSnackbarMessage('Weight logged successfully!');
      setSnackbarOpen(true);
      fetchBodyMetrics();
    } catch (error) {
      console.error('Error saving weight:', error);
      setSnackbarMessage('Error saving weight. Please try again.');
      setSnackbarOpen(true);
    } finally {
      setSaving(false);
    }
  };

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  const formatChartData = () => {
    const labels = bodyMetrics.map(metric =>
      metric.date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      })
    );

    const data = bodyMetrics.map(metric => metric.weight);

    return {
      labels,
      datasets: [
        {
          label: 'Weight (lbs)',
          data,
          borderColor: theme.palette.primary.main,
          backgroundColor: `${theme.palette.primary.main}20`,
          pointBackgroundColor: theme.palette.primary.main,
          pointBorderColor: theme.palette.primary.main,
          pointHoverBackgroundColor: theme.palette.primary.light,
          pointHoverBorderColor: theme.palette.primary.light,
          tension: 0.4,
          fill: true
        }
      ]
    };
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: theme.palette.text.primary,
          font: {
            family: theme.typography.fontFamily
          }
        }
      },
      title: {
        display: true,
        text: 'Weight Progress Over Time',
        color: theme.palette.text.primary,
        font: {
          family: theme.typography.fontFamily,
          size: 16,
          weight: 'bold'
        }
      }
    },
    scales: {
      x: {
        ticks: {
          color: theme.palette.text.secondary
        },
        grid: {
          color: `${theme.palette.primary.main}30`
        }
      },
      y: {
        ticks: {
          color: theme.palette.text.secondary
        },
        grid: {
          color: `${theme.palette.primary.main}30`
        }
      }
    }
  };

  return (
    <>
      <AppBar position="sticky">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Analytics
          </Typography>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Grid container spacing={4}>
          {/* Weight Entry Section */}
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Log Your Weight
                </Typography>
                <Box component="form" onSubmit={handleWeightSubmit} sx={{ mt: 2 }}>
                  <TextField
                    fullWidth
                    label="Weight (lbs)"
                    type="number"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    inputProps={{
                      step: "0.1",
                      min: "0"
                    }}
                    sx={{ mb: 2 }}
                    disabled={saving}
                  />
                  <Button
                    type="submit"
                    variant="contained"
                    fullWidth
                    disabled={saving || !weight.trim()}
                    sx={{ py: 1.5 }}
                  >
                    {saving ? <CircularProgress size={24} /> : 'Save Weight'}
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Chart Section */}
          <Grid item xs={12} md={8}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
            >
              <Paper variant="outlined" sx={{ p: 3, height: 400 }}>
                {loading ? (
                  <Box
                    display="flex"
                    justifyContent="center"
                    alignItems="center"
                    height="100%"
                  >
                    <CircularProgress />
                  </Box>
                ) : bodyMetrics.length === 0 ? (
                  <Box
                    display="flex"
                    justifyContent="center"
                    alignItems="center"
                    height="100%"
                    textAlign="center"
                  >
                    <Typography variant="h6" color="text.secondary">
                      No weight data yet. Log your first weight to see your progress!
                    </Typography>
                  </Box>
                ) : (
                  <Box height="100%">
                    <Line data={formatChartData()} options={chartOptions} />
                  </Box>
                )}
              </Paper>
            </motion.div>
          </Grid>

          {/* Weight History Summary */}
          <Grid item xs={12}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2, ease: 'easeOut' }}
            >
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Weight Summary
                  </Typography>
                  {bodyMetrics.length > 0 ? (
                    <Grid container spacing={2}>
                      <Grid item xs={6} sm={3}>
                        <Typography variant="body2" color="text.secondary">
                          Current Weight
                        </Typography>
                        <Typography variant="h6">
                          {bodyMetrics[bodyMetrics.length - 1]?.weight} lbs
                        </Typography>
                      </Grid>
                      <Grid item xs={6} sm={3}>
                        <Typography variant="body2" color="text.secondary">
                          Starting Weight
                        </Typography>
                        <Typography variant="h6">
                          {bodyMetrics[0]?.weight} lbs
                        </Typography>
                      </Grid>
                      <Grid item xs={6} sm={3}>
                        <Typography variant="body2" color="text.secondary">
                          Total Change
                        </Typography>
                        <Typography
                          variant="h6"
                          color={
                            bodyMetrics[bodyMetrics.length - 1]?.weight >= bodyMetrics[0]?.weight
                              ? 'success.main'
                              : 'error.main'
                          }
                        >
                          {bodyMetrics.length > 1
                            ? `${(bodyMetrics[bodyMetrics.length - 1]?.weight - bodyMetrics[0]?.weight).toFixed(1)} lbs`
                            : '0 lbs'}
                        </Typography>
                      </Grid>
                      <Grid item xs={6} sm={3}>
                        <Typography variant="body2" color="text.secondary">
                          Entries
                        </Typography>
                        <Typography variant="h6">
                          {bodyMetrics.length}
                        </Typography>
                      </Grid>
                    </Grid>
                  ) : (
                    <Typography color="text.secondary">
                      No weight data available
                    </Typography>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </Grid>
        </Grid>
      </Container>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={4000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleSnackbarClose} severity="success" sx={{ width: '100%' }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </>
  );
}