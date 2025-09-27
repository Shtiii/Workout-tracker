'use client';

import { useState, useEffect } from 'react';

/**
 * WorkoutTimer Component
 * Manages workout timer functionality
 */
export default function WorkoutTimer({ isRunning, onTimeUpdate }) {
  const [time, setTime] = useState(0);

  useEffect(() => {
    let interval = null;
    if (isRunning) {
      interval = setInterval(() => {
        setTime(prevTime => {
          const newTime = prevTime + 1;
          onTimeUpdate(newTime);
          return newTime;
        });
      }, 1000);
    } else if (!isRunning) {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isRunning, onTimeUpdate]);

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div style={{ 
      position: 'fixed', 
      top: '20px', 
      right: '20px', 
      background: 'rgba(26, 26, 26, 0.9)', 
      color: '#ff4444', 
      padding: '10px 15px', 
      borderRadius: '8px', 
      border: '1px solid #333',
      fontSize: '1.2rem',
      fontWeight: 'bold',
      zIndex: 1000
    }}>
      ⏱️ {formatTime(time)}
    </div>
  );
}
