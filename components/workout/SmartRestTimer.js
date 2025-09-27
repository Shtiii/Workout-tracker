'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  IconButton,
  Slider,
  Chip,
  Tooltip,
  CircularProgress
} from '@mui/material';
import {
  PlayArrow as PlayIcon,
  Pause as PauseIcon,
  Stop as StopIcon,
  Add as AddIcon,
  Remove as RemoveIcon,
  Timer as TimerIcon
} from '@mui/icons-material';
import { motion } from 'framer-motion';

/**
 * Smart Rest Timer Component
 * Provides intelligent rest timer with exercise-specific suggestions
 */
export default function SmartRestTimer({
  currentExercise = null,
  onTimerComplete = () => {},
  onTimerUpdate = () => {},
  isActive = false
}) {
  const [timeLeft, setTimeLeft] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [totalTime, setTotalTime] = useState(0);
  const [suggestedTime, setSuggestedTime] = useState(60);
  const [customTime, setCustomTime] = useState(60);
  const [showCustomizer, setShowCustomizer] = useState(false);
  const [completedRests, setCompletedRests] = useState(0);
  const [totalRestTime, setTotalRestTime] = useState(0);
  
  const intervalRef = useRef(null);
  const audioRef = useRef(null);

  // Exercise-specific rest time suggestions
  const getRestTimeSuggestion = (exercise) => {
    if (!exercise) return 60;

    const exerciseName = exercise.name?.toLowerCase() || '';
    const category = exercise.category || '';

    // Power/strength exercises (heavy compound movements)
    if (exerciseName.includes('deadlift') || exerciseName.includes('squat') || 
        exerciseName.includes('bench press') || exerciseName.includes('overhead press')) {
      return 180; // 3 minutes
    }

    // Heavy compound exercises
    if (exerciseName.includes('row') || exerciseName.includes('pull') || 
        exerciseName.includes('dip') || exerciseName.includes('chin')) {
      return 120; // 2 minutes
    }

    // Isolation exercises
    if (exerciseName.includes('curl') || exerciseName.includes('extension') || 
        exerciseName.includes('raise') || exerciseName.includes('fly')) {
      return 60; // 1 minute
    }

    // Cardio/HIIT
    if (category === 'Cardio' || exerciseName.includes('burpee') || 
        exerciseName.includes('jump') || exerciseName.includes('sprint')) {
      return 30; // 30 seconds
    }

    // Core exercises
    if (category === 'Core' || exerciseName.includes('plank') || 
        exerciseName.includes('crunch') || exerciseName.includes('sit-up')) {
      return 45; // 45 seconds
    }

    // Default rest time
    return 90; // 1.5 minutes
  };

  // Update suggested time when exercise changes
  useEffect(() => {
    if (currentExercise) {
      const suggestion = getRestTimeSuggestion(currentExercise);
      setSuggestedTime(suggestion);
      setCustomTime(suggestion);
      setTimeLeft(suggestion);
      setTotalTime(suggestion);
    }
  }, [currentExercise]);

  // Timer logic
  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(prev => {
          const newTime = prev - 1;
          onTimerUpdate(newTime);
          
          if (newTime <= 0) {
            setIsRunning(false);
            onTimerComplete();
            playNotificationSound();
            setCompletedRests(prev => prev + 1);
            setTotalRestTime(prev => prev + totalTime);
            return 0;
          }
          
          return newTime;
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, timeLeft, totalTime, onTimerUpdate, onTimerComplete]);

  // Play notification sound
  const playNotificationSound = () => {
    if (audioRef.current) {
      audioRef.current.play().catch(console.error);
    }
  };

  // Start timer
  const handleStart = () => {
    if (timeLeft === 0) {
      setTimeLeft(customTime);
      setTotalTime(customTime);
    }
    setIsRunning(true);
  };

  // Pause timer
  const handlePause = () => {
    setIsRunning(false);
  };

  // Stop timer
  const handleStop = () => {
    setIsRunning(false);
    setTimeLeft(0);
    setTotalTime(0);
  };

  // Reset timer
  const handleReset = () => {
    setIsRunning(false);
    setTimeLeft(customTime);
    setTotalTime(customTime);
  };

  // Quick time buttons
  const quickTimes = [30, 60, 90, 120, 180, 300];

  const handleQuickTime = (time) => {
    setCustomTime(time);
    setTimeLeft(time);
    setTotalTime(time);
    setSuggestedTime(time);
  };

  // Format time display
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Get progress percentage
  const getProgress = () => {
    if (totalTime === 0) return 0;
    return ((totalTime - timeLeft) / totalTime) * 100;
  };

  // Get timer color based on time left
  const getTimerColor = () => {
    if (timeLeft === 0) return '#ff4444';
    if (timeLeft <= 10) return '#ffaa00';
    if (timeLeft <= 30) return '#ffff00';
    return '#00ff88';
  };

  return (
    <Card
      sx={{
        background: 'linear-gradient(135deg, #1a1a1a, #2a2a2a)',
        border: '1px solid #333',
        borderRadius: 2,
        minHeight: '300px'
      }}
    >
      <CardContent>
        {/* Header */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h6" sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
            <TimerIcon sx={{ color: '#ff4444' }} />
            Rest Timer
          </Typography>
          <Chip
            label={`${completedRests} rests completed`}
            size="small"
            sx={{ background: 'rgba(255, 68, 68, 0.2)', color: '#ff4444' }}
          />
        </Box>

        {/* Current Exercise Info */}
        {currentExercise && (
          <Box mb={3} textAlign="center">
            <Typography variant="body2" color="text.secondary" mb={1}>
              Current Exercise:
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 600, color: '#ff4444' }}>
              {currentExercise.name}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Suggested rest: {formatTime(suggestedTime)}
            </Typography>
          </Box>
        )}

        {/* Timer Display */}
        <Box textAlign="center" mb={3}>
          <motion.div
            animate={{ 
              scale: isRunning ? [1, 1.05, 1] : 1,
              color: getTimerColor()
            }}
            transition={{ 
              duration: 2, 
              repeat: isRunning ? Infinity : 0,
              ease: "easeInOut"
            }}
          >
            <Typography 
              variant="h2" 
              sx={{ 
                fontWeight: 900, 
                fontSize: { xs: '3rem', sm: '4rem' },
                color: getTimerColor(),
                textShadow: '0 0 20px rgba(255, 68, 68, 0.5)'
              }}
            >
              {formatTime(timeLeft)}
            </Typography>
          </motion.div>

          {/* Progress Circle */}
          <Box position="relative" display="inline-block" mt={2}>
            <CircularProgress
              variant="determinate"
              value={getProgress()}
              size={80}
              thickness={4}
              sx={{
                color: getTimerColor(),
                position: 'absolute',
                top: 0,
                left: 0
              }}
            />
            <CircularProgress
              variant="determinate"
              value={100}
              size={80}
              thickness={4}
              sx={{ color: '#333' }}
            />
          </Box>
        </Box>

        {/* Control Buttons */}
        <Box display="flex" justifyContent="center" gap={2} mb={3}>
          {!isRunning ? (
            <Button
              variant="contained"
              size="large"
              startIcon={<PlayIcon />}
              onClick={handleStart}
              sx={{
                background: 'linear-gradient(135deg, #00ff88, #00cc66)',
                fontWeight: 700,
                px: 4,
                py: 1.5
              }}
            >
              Start
            </Button>
          ) : (
            <Button
              variant="contained"
              size="large"
              startIcon={<PauseIcon />}
              onClick={handlePause}
              sx={{
                background: 'linear-gradient(135deg, #ffaa00, #cc8800)',
                fontWeight: 700,
                px: 4,
                py: 1.5
              }}
            >
              Pause
            </Button>
          )}

          <Button
            variant="outlined"
            size="large"
            startIcon={<StopIcon />}
            onClick={handleStop}
            sx={{
              borderColor: '#ff4444',
              color: '#ff4444',
              fontWeight: 700,
              px: 4,
              py: 1.5
            }}
          >
            Stop
          </Button>

          <Button
            variant="outlined"
            size="large"
            onClick={handleReset}
            sx={{
              borderColor: '#666',
              color: '#666',
              fontWeight: 700,
              px: 4,
              py: 1.5
            }}
          >
            Reset
          </Button>
        </Box>

        {/* Quick Time Buttons */}
        <Box mb={3}>
          <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600, textAlign: 'center' }}>
            Quick Times:
          </Typography>
          <Box display="flex" justifyContent="center" gap={1} flexWrap="wrap">
            {quickTimes.map((time) => (
              <Button
                key={time}
                variant="outlined"
                size="small"
                onClick={() => handleQuickTime(time)}
                sx={{
                  borderColor: time === customTime ? '#ff4444' : '#666',
                  color: time === customTime ? '#ff4444' : '#666',
                  minWidth: '60px',
                  '&:hover': {
                    borderColor: '#ff4444',
                    background: 'rgba(255, 68, 68, 0.1)'
                  }
                }}
              >
                {formatTime(time)}
              </Button>
            ))}
          </Box>
        </Box>

        {/* Custom Time Slider */}
        <Box mb={3}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
              Custom Time: {formatTime(customTime)}
            </Typography>
            <Button
              variant="text"
              size="small"
              onClick={() => setShowCustomizer(!showCustomizer)}
              sx={{ color: '#ff4444' }}
            >
              {showCustomizer ? 'Hide' : 'Customize'}
            </Button>
          </Box>

          {showCustomizer && (
            <Box px={2}>
              <Slider
                value={customTime}
                onChange={(_, value) => {
                  setCustomTime(value);
                  if (!isRunning) {
                    setTimeLeft(value);
                    setTotalTime(value);
                  }
                }}
                min={10}
                max={600}
                step={5}
                marks={[
                  { value: 30, label: '30s' },
                  { value: 60, label: '1m' },
                  { value: 120, label: '2m' },
                  { value: 300, label: '5m' }
                ]}
                sx={{
                  color: '#ff4444',
                  '& .MuiSlider-thumb': {
                    background: '#ff4444'
                  },
                  '& .MuiSlider-track': {
                    background: '#ff4444'
                  }
                }}
              />
            </Box>
          )}
        </Box>

        {/* Stats */}
        <Box textAlign="center">
          <Typography variant="body2" color="text.secondary">
            Total rest time today: {formatTime(totalRestTime)}
          </Typography>
        </Box>

        {/* Audio element for notifications */}
        <audio ref={audioRef} preload="auto">
          <source src="/sounds/timer-complete.mp3" type="audio/mpeg" />
        </audio>
      </CardContent>
    </Card>
  );
}
