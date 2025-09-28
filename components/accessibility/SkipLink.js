'use client';

import { useState, useEffect } from 'react';
import { Box, Button } from '@mui/material';

/**
 * SkipLink Component
 * Provides keyboard navigation skip links for accessibility
 */
export default function SkipLink({ 
  targetId = 'main-content',
  children = 'Skip to main content',
  ...props 
}) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleKeyDown = (event) => {
      // Show skip link when Tab is pressed
      if (event.key === 'Tab' && !isVisible) {
        setIsVisible(true);
      }
    };

    const handleClick = () => {
      setIsVisible(false);
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('click', handleClick);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('click', handleClick);
    };
  }, [isVisible]);

  const handleSkip = () => {
    const target = document.getElementById(targetId);
    if (target) {
      target.focus();
      target.scrollIntoView({ behavior: 'smooth' });
    }
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <Box
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        zIndex: 9999,
        backgroundColor: 'primary.main',
        color: 'white',
        p: 1,
        borderRadius: '0 0 4px 0',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)'
      }}
    >
      <Button
        onClick={handleSkip}
        sx={{
          color: 'white',
          textDecoration: 'none',
          fontSize: '14px',
          fontWeight: 'bold',
          '&:hover': {
            backgroundColor: 'primary.dark'
          }
        }}
        {...props}
      >
        {children}
      </Button>
    </Box>
  );
}
