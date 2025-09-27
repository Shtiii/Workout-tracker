'use client';

import { useState, useEffect } from 'react';
import { Box } from '@mui/material';

/**
 * LiveRegion Component
 * Provides live announcements for screen readers
 */
export default function LiveRegion({ 
  message, 
  politeness = 'polite',
  role = 'status',
  ...props 
}) {
  const [announcement, setAnnouncement] = useState('');

  useEffect(() => {
    if (message) {
      setAnnouncement(message);
      
      // Clear the message after a short delay to allow for new announcements
      const timer = setTimeout(() => {
        setAnnouncement('');
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [message]);

  return (
    <Box
      role={role}
      aria-live={politeness}
      aria-atomic="true"
      sx={{
        position: 'absolute',
        width: '1px',
        height: '1px',
        padding: 0,
        margin: '-1px',
        overflow: 'hidden',
        clip: 'rect(0, 0, 0, 0)',
        whiteSpace: 'nowrap',
        border: 0
      }}
      {...props}
    >
      {announcement}
    </Box>
  );
}
