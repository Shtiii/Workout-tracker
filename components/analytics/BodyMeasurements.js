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
  Snackbar,
  Chip,
  Avatar,
  LinearProgress
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  TrendingFlat as TrendingFlatIcon,
  Scale as ScaleIcon,
  Height as HeightIcon,
  FitnessCenter as FitnessIcon,
  PhotoCamera as PhotoIcon,
  Assessment as AssessmentIcon
} from '@mui/icons-material';
import { motion } from 'framer-motion';

/**
 * Body Measurements Component
 * Tracks body measurements, weight, and progress photos
 */
export default function BodyMeasurements({
  measurements = [],
  onAddMeasurement,
  onUpdateMeasurement,
  onDeleteMeasurement,
  onAddPhoto,
  onDeletePhoto
}) {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingMeasurement, setEditingMeasurement] = useState(null);
  const [measurementData, setMeasurementData] = useState({
    date: '',
    weight: '',
    height: '',
    bodyFat: '',
    muscleMass: '',
    chest: '',
    waist: '',
    hips: '',
    biceps: '',
    thighs: '',
    notes: '',
    photos: []
  });
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Get today's date for default
  const today = new Date().toISOString().split('T')[0];

  // Sort measurements by date
  const sortedMeasurements = useMemo(() => {
    return [...measurements].sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [measurements]);

  // Calculate progress
  const calculateProgress = (current, previous) => {
    if (!current || !previous) return 0;
    return ((current - previous) / previous) * 100;
  };

  // Get progress icon and color
  const getProgressIcon = (change) => {
    if (change > 0) return <TrendingUpIcon sx={{ color: '#00ff88' }} />;
    if (change < 0) return <TrendingDownIcon sx={{ color: '#ff4444' }} />;
    return <TrendingFlatIcon sx={{ color: '#ffaa00' }} />;
  };

  const getProgressColor = (change) => {
    if (change > 0) return '#00ff88';
    if (change < 0) return '#ff4444';
    return '#ffaa00';
  };

  // Get latest measurements
  const latestMeasurements = useMemo(() => {
    if (sortedMeasurements.length === 0) return null;
    return sortedMeasurements[0];
  }, [sortedMeasurements]);

  // Get previous measurements for comparison
  const previousMeasurements = useMemo(() => {
    if (sortedMeasurements.length < 2) return null;
    return sortedMeasurements[1];
  }, [sortedMeasurements]);

  // Calculate BMI
  const calculateBMI = (weight, height) => {
    if (!weight || !height) return null;
    const heightInMeters = height / 100;
    return (weight / (heightInMeters * heightInMeters)).toFixed(1);
  };

  // Get BMI category
  const getBMICategory = (bmi) => {
    if (bmi < 18.5) return { label: 'Underweight', color: '#0088ff' };
    if (bmi < 25) return { label: 'Normal', color: '#00ff88' };
    if (bmi < 30) return { label: 'Overweight', color: '#ffaa00' };
    return { label: 'Obese', color: '#ff4444' };
  };

  // Handle add measurement
  const handleAddMeasurement = () => {
    if (!measurementData.date || !measurementData.weight) {
      setError('Please fill in at least date and weight');
      return;
    }

    const newMeasurement = {
      id: Date.now().toString(),
      ...measurementData,
      weight: parseFloat(measurementData.weight) || 0,
      height: parseFloat(measurementData.height) || 0,
      bodyFat: parseFloat(measurementData.bodyFat) || 0,
      muscleMass: parseFloat(measurementData.muscleMass) || 0,
      chest: parseFloat(measurementData.chest) || 0,
      waist: parseFloat(measurementData.waist) || 0,
      hips: parseFloat(measurementData.hips) || 0,
      biceps: parseFloat(measurementData.biceps) || 0,
      thighs: parseFloat(measurementData.thighs) || 0,
      date: new Date(measurementData.date),
      createdAt: new Date()
    };

    onAddMeasurement(newMeasurement);
    setSuccess('Measurement added successfully!');
    setShowAddDialog(false);
    setMeasurementData({
      date: '',
      weight: '',
      height: '',
      bodyFat: '',
      muscleMass: '',
      chest: '',
      waist: '',
      hips: '',
      biceps: '',
      thighs: '',
      notes: '',
      photos: []
    });
  };

  // Handle update measurement
  const handleUpdateMeasurement = () => {
    if (!measurementData.date || !measurementData.weight) {
      setError('Please fill in at least date and weight');
      return;
    }

    const updatedMeasurement = {
      ...editingMeasurement,
      ...measurementData,
      weight: parseFloat(measurementData.weight) || 0,
      height: parseFloat(measurementData.height) || 0,
      bodyFat: parseFloat(measurementData.bodyFat) || 0,
      muscleMass: parseFloat(measurementData.muscleMass) || 0,
      chest: parseFloat(measurementData.chest) || 0,
      waist: parseFloat(measurementData.waist) || 0,
      hips: parseFloat(measurementData.hips) || 0,
      biceps: parseFloat(measurementData.biceps) || 0,
      thighs: parseFloat(measurementData.thighs) || 0,
      date: new Date(measurementData.date),
      updatedAt: new Date()
    };

    onUpdateMeasurement(updatedMeasurement);
    setSuccess('Measurement updated successfully!');
    setShowAddDialog(false);
    setEditingMeasurement(null);
    setMeasurementData({
      date: '',
      weight: '',
      height: '',
      bodyFat: '',
      muscleMass: '',
      chest: '',
      waist: '',
      hips: '',
      biceps: '',
      thighs: '',
      notes: '',
      photos: []
    });
  };

  // Handle delete measurement
  const handleDeleteMeasurement = (measurementId) => {
    onDeleteMeasurement(measurementId);
    setSuccess('Measurement deleted successfully!');
  };

  // Handle edit measurement
  const handleEditMeasurement = (measurement) => {
    setEditingMeasurement(measurement);
    setMeasurementData({
      date: new Date(measurement.date).toISOString().split('T')[0],
      weight: measurement.weight.toString(),
      height: measurement.height.toString(),
      bodyFat: measurement.bodyFat.toString(),
      muscleMass: measurement.muscleMass.toString(),
      chest: measurement.chest.toString(),
      waist: measurement.waist.toString(),
      hips: measurement.hips.toString(),
      biceps: measurement.biceps.toString(),
      thighs: measurement.thighs.toString(),
      notes: measurement.notes || '',
      photos: measurement.photos || []
    });
    setShowAddDialog(true);
  };

  // Format date
  const formatDate = (date) => {
    return new Date(date).toLocaleDateString();
  };

  // Get measurement progress
  const getMeasurementProgress = (current, previous, field) => {
    if (!current || !previous) return null;
    const change = current - previous;
    const percentage = ((change / previous) * 100).toFixed(1);
    return { change, percentage };
  };

  return (
    <Box>
      {/* Header */}
      <Box mb={3}>
        <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
          Body Measurements
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Track your body composition and physical progress over time.
        </Typography>
      </Box>

      {/* Current Stats */}
      {latestMeasurements && (
        <Grid container spacing={2} mb={3}>
          <Grid item xs={6} sm={3}>
            <Card sx={{ background: '#1a1a1a', border: '1px solid #333' }}>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h4" sx={{ fontWeight: 700, color: '#ff4444' }}>
                  {latestMeasurements.weight} lbs
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Weight
                </Typography>
                {previousMeasurements && (
                  <Box display="flex" alignItems="center" justifyContent="center" gap={1} mt={1}>
                    {getProgressIcon(latestMeasurements.weight - previousMeasurements.weight)}
                    <Typography variant="caption" color="text.secondary">
                      {latestMeasurements.weight - previousMeasurements.weight > 0 ? '+' : ''}
                      {(latestMeasurements.weight - previousMeasurements.weight).toFixed(1)} lbs
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={6} sm={3}>
            <Card sx={{ background: '#1a1a1a', border: '1px solid #333' }}>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h4" sx={{ fontWeight: 700, color: '#00ff88' }}>
                  {latestMeasurements.bodyFat}%
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Body Fat
                </Typography>
                {previousMeasurements && (
                  <Box display="flex" alignItems="center" justifyContent="center" gap={1} mt={1}>
                    {getProgressIcon(previousMeasurements.bodyFat - latestMeasurements.bodyFat)}
                    <Typography variant="caption" color="text.secondary">
                      {previousMeasurements.bodyFat - latestMeasurements.bodyFat > 0 ? '+' : ''}
                      {(previousMeasurements.bodyFat - latestMeasurements.bodyFat).toFixed(1)}%
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={6} sm={3}>
            <Card sx={{ background: '#1a1a1a', border: '1px solid #333' }}>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h4" sx={{ fontWeight: 700, color: '#ffaa00' }}>
                  {latestMeasurements.muscleMass} lbs
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Muscle Mass
                </Typography>
                {previousMeasurements && (
                  <Box display="flex" alignItems="center" justifyContent="center" gap={1} mt={1}>
                    {getProgressIcon(latestMeasurements.muscleMass - previousMeasurements.muscleMass)}
                    <Typography variant="caption" color="text.secondary">
                      {latestMeasurements.muscleMass - previousMeasurements.muscleMass > 0 ? '+' : ''}
                      {(latestMeasurements.muscleMass - previousMeasurements.muscleMass).toFixed(1)} lbs
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={6} sm={3}>
            <Card sx={{ background: '#1a1a1a', border: '1px solid #333' }}>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h4" sx={{ fontWeight: 700, color: '#0088ff' }}>
                  {calculateBMI(latestMeasurements.weight, latestMeasurements.height) || 'N/A'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  BMI
                </Typography>
                {calculateBMI(latestMeasurements.weight, latestMeasurements.height) && (
                  <Chip
                    label={getBMICategory(calculateBMI(latestMeasurements.weight, latestMeasurements.height)).label}
                    size="small"
                    sx={{
                      mt: 1,
                      background: `${getBMICategory(calculateBMI(latestMeasurements.weight, latestMeasurements.height)).color}20`,
                      color: getBMICategory(calculateBMI(latestMeasurements.weight, latestMeasurements.height)).color
                    }}
                  />
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Add Measurement Button */}
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
          Add Measurement
        </Button>
      </Box>

      {/* Measurements List */}
      <Card sx={{ background: '#1a1a1a', border: '1px solid #333' }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
            Measurement History
          </Typography>
          
          {sortedMeasurements.length === 0 ? (
            <Box textAlign="center" py={4}>
              <Typography variant="body1" color="text.secondary" mb={2}>
                No measurements recorded yet
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Add your first measurement to start tracking your progress
              </Typography>
            </Box>
          ) : (
            <List>
              {sortedMeasurements.map((measurement, index) => {
                const previous = index < sortedMeasurements.length - 1 ? sortedMeasurements[index + 1] : null;
                
                return (
                  <motion.div
                    key={measurement.id}
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
                          background: '#ff4444',
                          color: 'white',
                          fontWeight: 700,
                          mr: 2
                        }}
                      >
                        {measurement.weight}
                      </Avatar>
                      
                      <ListItemText
                        primary={
                          <Box display="flex" alignItems="center" gap={2}>
                            <Typography variant="h6" sx={{ fontWeight: 600 }}>
                              {formatDate(measurement.date)}
                            </Typography>
                            {index === 0 && (
                              <Chip
                                label="Latest"
                                size="small"
                                sx={{ background: 'rgba(0, 255, 136, 0.2)', color: '#00ff88' }}
                              />
                            )}
                          </Box>
                        }
                        secondary={
                          <Box>
                            <Typography variant="body2" color="text.secondary">
                              Weight: {measurement.weight} lbs
                              {measurement.bodyFat > 0 && ` • Body Fat: ${measurement.bodyFat}%`}
                              {measurement.muscleMass > 0 && ` • Muscle: ${measurement.muscleMass} lbs`}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              Chest: {measurement.chest}" • Waist: {measurement.waist}" • Hips: {measurement.hips}"
                            </Typography>
                            {measurement.notes && (
                              <Typography variant="caption" color="text.secondary" display="block">
                                {measurement.notes}
                              </Typography>
                            )}
                          </Box>
                        }
                      />
                      
                      <ListItemSecondaryAction>
                        <Box display="flex" gap={1}>
                          <Tooltip title="Edit">
                            <IconButton
                              size="small"
                              onClick={() => handleEditMeasurement(measurement)}
                              sx={{ color: '#ffaa00' }}
                            >
                              <EditIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete">
                            <IconButton
                              size="small"
                              onClick={() => handleDeleteMeasurement(measurement.id)}
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

      {/* Add/Edit Measurement Dialog */}
      <Dialog
        open={showAddDialog}
        onClose={() => {
          setShowAddDialog(false);
          setEditingMeasurement(null);
        }}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            {editingMeasurement ? 'Edit Measurement' : 'Add Measurement'}
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <TextField
              fullWidth
              label="Date"
              type="date"
              value={measurementData.date}
              onChange={(e) => setMeasurementData(prev => ({ ...prev, date: e.target.value }))}
              InputLabelProps={{ shrink: true }}
              sx={{ mb: 3 }}
            />

            <Grid container spacing={2} mb={3}>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Weight (lbs)"
                  type="number"
                  value={measurementData.weight}
                  onChange={(e) => setMeasurementData(prev => ({ ...prev, weight: e.target.value }))}
                  inputProps={{ min: 0, step: 0.1 }}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Height (cm)"
                  type="number"
                  value={measurementData.height}
                  onChange={(e) => setMeasurementData(prev => ({ ...prev, height: e.target.value }))}
                  inputProps={{ min: 0, step: 0.1 }}
                />
              </Grid>
            </Grid>

            <Grid container spacing={2} mb={3}>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Body Fat (%)"
                  type="number"
                  value={measurementData.bodyFat}
                  onChange={(e) => setMeasurementData(prev => ({ ...prev, bodyFat: e.target.value }))}
                  inputProps={{ min: 0, step: 0.1 }}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Muscle Mass (lbs)"
                  type="number"
                  value={measurementData.muscleMass}
                  onChange={(e) => setMeasurementData(prev => ({ ...prev, muscleMass: e.target.value }))}
                  inputProps={{ min: 0, step: 0.1 }}
                />
              </Grid>
            </Grid>

            <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
              Body Measurements (inches):
            </Typography>
            <Grid container spacing={2} mb={3}>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Chest"
                  type="number"
                  value={measurementData.chest}
                  onChange={(e) => setMeasurementData(prev => ({ ...prev, chest: e.target.value }))}
                  inputProps={{ min: 0, step: 0.1 }}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Waist"
                  type="number"
                  value={measurementData.waist}
                  onChange={(e) => setMeasurementData(prev => ({ ...prev, waist: e.target.value }))}
                  inputProps={{ min: 0, step: 0.1 }}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Hips"
                  type="number"
                  value={measurementData.hips}
                  onChange={(e) => setMeasurementData(prev => ({ ...prev, hips: e.target.value }))}
                  inputProps={{ min: 0, step: 0.1 }}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Biceps"
                  type="number"
                  value={measurementData.biceps}
                  onChange={(e) => setMeasurementData(prev => ({ ...prev, biceps: e.target.value }))}
                  inputProps={{ min: 0, step: 0.1 }}
                />
              </Grid>
            </Grid>

            <TextField
              fullWidth
              multiline
              rows={3}
              label="Notes (optional)"
              value={measurementData.notes}
              onChange={(e) => setMeasurementData(prev => ({ ...prev, notes: e.target.value }))}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setShowAddDialog(false);
              setEditingMeasurement(null);
            }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={editingMeasurement ? handleUpdateMeasurement : handleAddMeasurement}
            sx={{
              background: 'linear-gradient(135deg, #00ff88, #00cc66)',
              fontWeight: 700
            }}
          >
            {editingMeasurement ? 'Update' : 'Add'} Measurement
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

