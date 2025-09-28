'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Box, Typography, IconButton, Tooltip } from '@mui/material';
import {
  SwipeLeft as SwipeLeftIcon,
  SwipeRight as SwipeRightIcon,
  SwipeUp as SwipeUpIcon,
  SwipeDown as SwipeDownIcon,
  TouchApp as TouchIcon,
  Gesture as GestureIcon
} from '@mui/icons-material';
import { motion, useMotionValue, useTransform, useSpring } from 'framer-motion';

/**
 * Touch Gestures Component
 * Provides touch gesture support for mobile interactions
 */
export default function TouchGestures({
  children,
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  onSwipeDown,
  onTap,
  onDoubleTap,
  onLongPress,
  onPinch,
  onRotate,
  swipeThreshold = 50,
  longPressDelay = 500,
  doubleTapDelay = 300,
  enableGestures = true,
  showGestureHints = false
}) {
  const [gestureState, setGestureState] = useState({
    isDragging: false,
    isLongPressing: false,
    lastTap: 0,
    touchStartTime: 0,
    touchStartPosition: { x: 0, y: 0 },
    currentPosition: { x: 0, y: 0 },
    gestureType: null
  });

  const [gestureHints, setGestureHints] = useState([]);
  const containerRef = useRef(null);
  const longPressTimer = useRef(null);
  const doubleTapTimer = useRef(null);

  // Motion values for animations
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const scale = useMotionValue(1);
  const rotate = useMotionValue(0);

  // Spring animations
  const springX = useSpring(x, { stiffness: 300, damping: 30 });
  const springY = useSpring(y, { stiffness: 300, damping: 30 });
  const springScale = useSpring(scale, { stiffness: 300, damping: 30 });

  // Transform values
  const translateX = useTransform(springX, (value) => value);
  const translateY = useTransform(springY, (value) => value);
  const scaleValue = useTransform(springScale, (value) => value);

  // Handle touch start
  const handleTouchStart = useCallback((event) => {
    if (!enableGestures) return;

    const touch = event.touches[0];
    const currentTime = Date.now();

    setGestureState(prev => ({
      ...prev,
      touchStartTime: currentTime,
      touchStartPosition: { x: touch.clientX, y: touch.clientY },
      currentPosition: { x: touch.clientX, y: touch.clientY },
      isDragging: true,
      gestureType: null
    }));

    // Start long press timer
    longPressTimer.current = setTimeout(() => {
      setGestureState(prev => ({ ...prev, isLongPressing: true, gestureType: 'longPress' }));
      if (onLongPress) {
        onLongPress(event);
        addGestureHint('Long press detected');
      }
    }, longPressDelay);

    // Prevent default to avoid scrolling
    event.preventDefault();
  }, [enableGestures, longPressDelay, onLongPress]);

  // Handle touch move
  const handleTouchMove = useCallback((event) => {
    if (!enableGestures || !gestureState.isDragging) return;

    const touch = event.touches[0];
    const deltaX = touch.clientX - gestureState.touchStartPosition.x;
    const deltaY = touch.clientY - gestureState.touchStartPosition.y;

    setGestureState(prev => ({
      ...prev,
      currentPosition: { x: touch.clientX, y: touch.clientY }
    }));

    // Update motion values for visual feedback
    x.set(deltaX * 0.3);
    y.set(deltaY * 0.3);

    // Clear long press timer if moving
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }

    event.preventDefault();
  }, [enableGestures, gestureState.isDragging, gestureState.touchStartPosition, x, y]);

  // Handle touch end
  const handleTouchEnd = useCallback((event) => {
    if (!enableGestures) return;

    const currentTime = Date.now();
    const deltaX = gestureState.currentPosition.x - gestureState.touchStartPosition.x;
    const deltaY = gestureState.currentPosition.y - gestureState.touchStartPosition.y;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    const duration = currentTime - gestureState.touchStartTime;

    // Clear timers
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }

    // Determine gesture type
    let gestureType = null;

    if (gestureState.isLongPressing) {
      gestureType = 'longPress';
    } else if (distance < 10 && duration < 200) {
      // Tap gesture
      const timeSinceLastTap = currentTime - gestureState.lastTap;
      
      if (timeSinceLastTap < doubleTapDelay) {
        gestureType = 'doubleTap';
        if (onDoubleTap) {
          onDoubleTap(event);
          addGestureHint('Double tap detected');
        }
      } else {
        gestureType = 'tap';
        if (onTap) {
          onTap(event);
          addGestureHint('Tap detected');
        }
      }
      
      setGestureState(prev => ({ ...prev, lastTap: currentTime }));
    } else if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > swipeThreshold) {
      // Horizontal swipe
      if (deltaX > 0) {
        gestureType = 'swipeRight';
        if (onSwipeRight) {
          onSwipeRight(event);
          addGestureHint('Swipe right detected');
        }
      } else {
        gestureType = 'swipeLeft';
        if (onSwipeLeft) {
          onSwipeLeft(event);
          addGestureHint('Swipe left detected');
        }
      }
    } else if (Math.abs(deltaY) > Math.abs(deltaX) && Math.abs(deltaY) > swipeThreshold) {
      // Vertical swipe
      if (deltaY > 0) {
        gestureType = 'swipeDown';
        if (onSwipeDown) {
          onSwipeDown(event);
          addGestureHint('Swipe down detected');
        }
      } else {
        gestureType = 'swipeUp';
        if (onSwipeUp) {
          onSwipeUp(event);
          addGestureHint('Swipe up detected');
        }
      }
    }

    setGestureState(prev => ({
      ...prev,
      isDragging: false,
      isLongPressing: false,
      gestureType
    }));

    // Reset motion values
    x.set(0);
    y.set(0);
    scale.set(1);

    event.preventDefault();
  }, [
    enableGestures,
    gestureState,
    swipeThreshold,
    doubleTapDelay,
    onSwipeLeft,
    onSwipeRight,
    onSwipeUp,
    onSwipeDown,
    onTap,
    onDoubleTap,
    x,
    y,
    scale
  ]);

  // Handle multi-touch gestures
  const handleTouchStartMulti = useCallback((event) => {
    if (!enableGestures || event.touches.length < 2) return;

    const touch1 = event.touches[0];
    const touch2 = event.touches[1];
    
    const distance = Math.sqrt(
      Math.pow(touch2.clientX - touch1.clientX, 2) +
      Math.pow(touch2.clientY - touch1.clientY, 2)
    );

    setGestureState(prev => ({
      ...prev,
      initialDistance: distance,
      initialAngle: Math.atan2(
        touch2.clientY - touch1.clientY,
        touch2.clientX - touch1.clientX
      )
    }));

    event.preventDefault();
  }, [enableGestures]);

  const handleTouchMoveMulti = useCallback((event) => {
    if (!enableGestures || event.touches.length < 2) return;

    const touch1 = event.touches[0];
    const touch2 = event.touches[1];
    
    const currentDistance = Math.sqrt(
      Math.pow(touch2.clientX - touch1.clientX, 2) +
      Math.pow(touch2.clientY - touch1.clientY, 2)
    );

    const currentAngle = Math.atan2(
      touch2.clientY - touch1.clientY,
      touch2.clientX - touch1.clientX
    );

    // Pinch gesture
    if (gestureState.initialDistance) {
      const scaleChange = currentDistance / gestureState.initialDistance;
      scale.set(scaleChange);
      
      if (onPinch) {
        onPinch(event, scaleChange);
      }
    }

    // Rotate gesture
    if (gestureState.initialAngle !== undefined) {
      const angleChange = currentAngle - gestureState.initialAngle;
      rotate.set(angleChange);
      
      if (onRotate) {
        onRotate(event, angleChange);
      }
    }

    event.preventDefault();
  }, [enableGestures, gestureState, scale, rotate, onPinch, onRotate]);

  // Add gesture hint
  const addGestureHint = useCallback((hint) => {
    if (!showGestureHints) return;

    const newHint = {
      id: Date.now(),
      text: hint,
      timestamp: Date.now()
    };

    setGestureHints(prev => [...prev, newHint]);

    // Remove hint after 2 seconds
    setTimeout(() => {
      setGestureHints(prev => prev.filter(h => h.id !== newHint.id));
    }, 2000);
  }, [showGestureHints]);

  // Get gesture icon
  const getGestureIcon = (gestureType) => {
    switch (gestureType) {
      case 'swipeLeft': return <SwipeLeftIcon />;
      case 'swipeRight': return <SwipeRightIcon />;
      case 'swipeUp': return <SwipeUpIcon />;
      case 'swipeDown': return <SwipeDownIcon />;
      case 'tap': return <TouchIcon />;
      case 'doubleTap': return <TouchIcon />;
      case 'longPress': return <GestureIcon />;
      default: return null;
    }
  };

  // Get gesture color
  const getGestureColor = (gestureType) => {
    switch (gestureType) {
      case 'swipeLeft': return '#ff4444';
      case 'swipeRight': return '#00ff88';
      case 'swipeUp': return '#0088ff';
      case 'swipeDown': return '#ffaa00';
      case 'tap': return '#666';
      case 'doubleTap': return '#ff00ff';
      case 'longPress': return '#ff8800';
      default: return '#666';
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current);
      }
      if (doubleTapTimer.current) {
        clearTimeout(doubleTapTimer.current);
      }
    };
  }, []);

  return (
    <Box
      ref={containerRef}
      sx={{
        position: 'relative',
        touchAction: 'none',
        userSelect: 'none',
        WebkitUserSelect: 'none',
        WebkitTouchCallout: 'none'
      }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchStartCapture={handleTouchStartMulti}
      onTouchMoveCapture={handleTouchMoveMulti}
    >
      {/* Content with gesture animations */}
      <motion.div
        style={{
          translateX,
          translateY,
          scale: scaleValue,
          rotate
        }}
      >
        {children}
      </motion.div>

      {/* Gesture hints */}
      {showGestureHints && gestureHints.length > 0 && (
        <Box
          sx={{
            position: 'absolute',
            top: 20,
            right: 20,
            zIndex: 1000
          }}
        >
          {gestureHints.map((hint) => (
            <motion.div
              key={hint.id}
              initial={{ opacity: 0, y: -20, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.8 }}
              transition={{ duration: 0.2 }}
            >
              <Box
                sx={{
                  background: 'rgba(0, 0, 0, 0.8)',
                  color: 'white',
                  p: 1,
                  borderRadius: 2,
                  mb: 1,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1
                }}
              >
                {getGestureIcon(gestureState.gestureType) && (
                  <Box sx={{ color: getGestureColor(gestureState.gestureType) }}>
                    {getGestureIcon(gestureState.gestureType)}
                  </Box>
                )}
                <Typography variant="caption">
                  {hint.text}
                </Typography>
              </Box>
            </motion.div>
          ))}
        </Box>
      )}

      {/* Gesture debug info */}
      {process.env.NODE_ENV === 'development' && (
        <Box
          sx={{
            position: 'absolute',
            bottom: 20,
            left: 20,
            background: 'rgba(0, 0, 0, 0.8)',
            color: 'white',
            p: 2,
            borderRadius: 2,
            fontSize: '0.8rem'
          }}
        >
          <Typography variant="caption" display="block">
            Gesture: {gestureState.gestureType || 'none'}
          </Typography>
          <Typography variant="caption" display="block">
            Dragging: {gestureState.isDragging ? 'yes' : 'no'}
          </Typography>
          <Typography variant="caption" display="block">
            Long Press: {gestureState.isLongPressing ? 'yes' : 'no'}
          </Typography>
        </Box>
      )}
    </Box>
  );
}

