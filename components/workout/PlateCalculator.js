'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  Typography,
  Grid,
  Card,
  CardContent,
  Chip,
  Button,
  IconButton,
  Tooltip,
  Divider
} from '@mui/material';
import {
  Add as AddIcon,
  Remove as RemoveIcon,
  Calculate as CalculateIcon,
  Clear as ClearIcon
} from '@mui/icons-material';
import { motion } from 'framer-motion';

/**
 * Plate Calculator Component
 * Helps calculate plate combinations for barbell exercises
 */
export default function PlateCalculator({
  onWeightChange,
  initialWeight = 0,
  barWeight = 45, // Standard Olympic bar weight
  availablePlates = [45, 35, 25, 10, 5, 2.5] // Available plate weights in lbs
}) {
  const [targetWeight, setTargetWeight] = useState(initialWeight);
  const [calculatedPlates, setCalculatedPlates] = useState({});
  const [totalWeight, setTotalWeight] = useState(barWeight);
  const [isCalculated, setIsCalculated] = useState(false);

  // Calculate plates needed for target weight
  const calculatePlates = (weight) => {
    if (weight <= barWeight) {
      return { plates: {}, total: barWeight };
    }

    const platesNeeded = {};
    let remainingWeight = (weight - barWeight) / 2; // Divide by 2 for each side
    const sortedPlates = [...availablePlates].sort((a, b) => b - a);

    for (const plate of sortedPlates) {
      const count = Math.floor(remainingWeight / plate);
      if (count > 0) {
        platesNeeded[plate] = count;
        remainingWeight -= count * plate;
      }
    }

    const totalPlatesWeight = Object.entries(platesNeeded)
      .reduce((sum, [plate, count]) => sum + (parseFloat(plate) * count * 2), 0);

    return {
      plates: platesNeeded,
      total: barWeight + totalPlatesWeight,
      remaining: remainingWeight
    };
  };

  // Handle weight input change
  const handleWeightChange = (event) => {
    const weight = parseFloat(event.target.value) || 0;
    setTargetWeight(weight);
    setIsCalculated(false);
  };

  // Calculate plates for target weight
  const handleCalculate = () => {
    const result = calculatePlates(targetWeight);
    setCalculatedPlates(result.plates);
    setTotalWeight(result.total);
    setIsCalculated(true);
    
    if (onWeightChange) {
      onWeightChange(result.total);
    }
  };

  // Clear calculation
  const handleClear = () => {
    setTargetWeight(0);
    setCalculatedPlates({});
    setTotalWeight(barWeight);
    setIsCalculated(false);
    
    if (onWeightChange) {
      onWeightChange(barWeight);
    }
  };

  // Quick weight buttons
  const quickWeights = [135, 185, 225, 275, 315, 405];

  const handleQuickWeight = (weight) => {
    setTargetWeight(weight);
    const result = calculatePlates(weight);
    setCalculatedPlates(result.plates);
    setTotalWeight(result.total);
    setIsCalculated(true);
    
    if (onWeightChange) {
      onWeightChange(result.total);
    }
  };

  // Get plate color based on weight
  const getPlateColor = (weight) => {
    if (weight >= 45) return '#ff4444'; // Red
    if (weight >= 35) return '#ffaa00'; // Orange
    if (weight >= 25) return '#00ff88'; // Green
    if (weight >= 10) return '#0088ff'; // Blue
    if (weight >= 5) return '#ff00ff'; // Magenta
    return '#888888'; // Gray
  };

  // Get plate size based on weight
  const getPlateSize = (weight) => {
    if (weight >= 45) return 'large';
    if (weight >= 25) return 'medium';
    return 'small';
  };

  return (
    <Card
      sx={{
        background: 'linear-gradient(135deg, #1a1a1a, #2a2a2a)',
        border: '1px solid #333',
        borderRadius: 2
      }}
    >
      <CardContent>
        <Typography variant="h6" sx={{ mb: 3, fontWeight: 700, textAlign: 'center' }}>
          🏋️ Plate Calculator
        </Typography>

        {/* Weight Input */}
        <Box mb={3}>
          <TextField
            fullWidth
            label="Target Weight (lbs)"
            type="number"
            value={targetWeight}
            onChange={handleWeightChange}
            InputProps={{
              endAdornment: (
                <Box display="flex" gap={1}>
                  <Tooltip title="Calculate plates">
                    <IconButton
                      onClick={handleCalculate}
                      disabled={targetWeight <= barWeight}
                      sx={{ color: '#ff4444' }}
                    >
                      <CalculateIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Clear">
                    <IconButton onClick={handleClear} sx={{ color: '#666' }}>
                      <ClearIcon />
                    </IconButton>
                  </Tooltip>
                </Box>
              )
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                background: '#1a1a1a',
                border: '1px solid #333'
              }
            }}
          />
        </Box>

        {/* Quick Weight Buttons */}
        <Box mb={3}>
          <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
            Quick Weights:
          </Typography>
          <Grid container spacing={1}>
            {quickWeights.map((weight) => (
              <Grid item key={weight}>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => handleQuickWeight(weight)}
                  sx={{
                    borderColor: '#ff4444',
                    color: '#ff4444',
                    minWidth: '60px',
                    '&:hover': {
                      borderColor: '#ff6666',
                      background: 'rgba(255, 68, 68, 0.1)'
                    }
                  }}
                >
                  {weight}
                </Button>
              </Grid>
            ))}
          </Grid>
        </Box>

        {/* Bar Weight Info */}
        <Box mb={3} textAlign="center">
          <Typography variant="body2" color="text.secondary">
            Bar Weight: {barWeight} lbs
          </Typography>
        </Box>

        {/* Calculated Results */}
        {isCalculated && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Divider sx={{ mb: 3, borderColor: '#333' }} />

            {/* Total Weight */}
            <Box mb={3} textAlign="center">
              <Typography variant="h5" sx={{ fontWeight: 700, color: '#ff4444' }}>
                Total: {totalWeight} lbs
              </Typography>
              {targetWeight !== totalWeight && (
                <Typography variant="body2" color="text.secondary">
                  Target: {targetWeight} lbs | Difference: {Math.abs(targetWeight - totalWeight)} lbs
                </Typography>
              )}
            </Box>

            {/* Plates Needed */}
            <Box mb={3}>
              <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
                Plates Needed (per side):
              </Typography>
              <Grid container spacing={1}>
                {Object.entries(calculatedPlates)
                  .sort(([a], [b]) => parseFloat(b) - parseFloat(a))
                  .map(([weight, count]) => (
                    <Grid item key={weight}>
                      <Chip
                        label={`${weight}lbs × ${count}`}
                        sx={{
                          background: getPlateColor(parseFloat(weight)),
                          color: 'white',
                          fontWeight: 600,
                          fontSize: '0.8rem',
                          height: '32px'
                        }}
                      />
                    </Grid>
                  ))}
              </Grid>
            </Box>

            {/* Visual Plate Representation */}
            <Box mb={3}>
              <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
                Visual Representation:
              </Typography>
              <Box display="flex" justifyContent="center" alignItems="center" gap={1} flexWrap="wrap">
                {/* Left side plates */}
                <Box display="flex" alignItems="center" gap={0.5}>
                  {Object.entries(calculatedPlates)
                    .sort(([a], [b]) => parseFloat(b) - parseFloat(a))
                    .map(([weight, count]) => 
                      Array.from({ length: count }, (_, i) => (
                        <Box
                          key={`left-${weight}-${i}`}
                          sx={{
                            width: getPlateSize(parseFloat(weight)) === 'large' ? '40px' : 
                                   getPlateSize(parseFloat(weight)) === 'medium' ? '30px' : '20px',
                            height: getPlateSize(parseFloat(weight)) === 'large' ? '40px' : 
                                    getPlateSize(parseFloat(weight)) === 'medium' ? '30px' : '20px',
                            borderRadius: '50%',
                            background: getPlateColor(parseFloat(weight)),
                            border: '2px solid #333',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          <Typography
                            variant="caption"
                            sx={{
                              color: 'white',
                              fontWeight: 600,
                              fontSize: '0.6rem'
                            }}
                          >
                            {weight}
                          </Typography>
                        </Box>
                      ))
                    )}
                </Box>

                {/* Bar */}
                <Box
                  sx={{
                    width: '60px',
                    height: '8px',
                    background: 'linear-gradient(90deg, #666, #999, #666)',
                    borderRadius: '4px',
                    border: '1px solid #333'
                  }}
                />

                {/* Right side plates */}
                <Box display="flex" alignItems="center" gap={0.5}>
                  {Object.entries(calculatedPlates)
                    .sort(([a], [b]) => parseFloat(b) - parseFloat(a))
                    .map(([weight, count]) => 
                      Array.from({ length: count }, (_, i) => (
                        <Box
                          key={`right-${weight}-${i}`}
                          sx={{
                            width: getPlateSize(parseFloat(weight)) === 'large' ? '40px' : 
                                   getPlateSize(parseFloat(weight)) === 'medium' ? '30px' : '20px',
                            height: getPlateSize(parseFloat(weight)) === 'large' ? '40px' : 
                                    getPlateSize(parseFloat(weight)) === 'medium' ? '30px' : '20px',
                            borderRadius: '50%',
                            background: getPlateColor(parseFloat(weight)),
                            border: '2px solid #333',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          <Typography
                            variant="caption"
                            sx={{
                              color: 'white',
                              fontWeight: 600,
                              fontSize: '0.6rem'
                            }}
                          >
                            {weight}
                          </Typography>
                        </Box>
                      ))
                    )}
                </Box>
              </Box>
            </Box>

            {/* Plate Legend */}
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
                Plate Legend:
              </Typography>
              <Grid container spacing={1}>
                {availablePlates.map((weight) => (
                  <Grid item key={weight}>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Box
                        sx={{
                          width: '20px',
                          height: '20px',
                          borderRadius: '50%',
                          background: getPlateColor(weight),
                          border: '1px solid #333'
                        }}
                      />
                      <Typography variant="caption" color="text.secondary">
                        {weight}lbs
                      </Typography>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </Box>
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
}
