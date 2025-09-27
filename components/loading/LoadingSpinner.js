'use client';

import { Box, CircularProgress, Typography, Fade } from '@mui/material';

/**
 * LoadingSpinner Component
 * Loading spinner with optional text
 */
export default function LoadingSpinner({
  size = 40,
  text,
  color = 'primary',
  fullScreen = false,
  overlay = false,
  ...props
}) {
  const spinner = (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 2,
        ...(fullScreen && {
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 9999,
          backgroundColor: 'rgba(255, 255, 255, 0.8)',
          backdropFilter: 'blur(4px)'
        }),
        ...(overlay && {
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(255, 255, 255, 0.8)',
          backdropFilter: 'blur(4px)',
          zIndex: 1
        }),
        ...props.sx
      }}
      {...props}
    >
      <CircularProgress size={size} color={color} />
      {text && (
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ textAlign: 'center' }}
        >
          {text}
        </Typography>
      )}
    </Box>
  );

  return (
    <Fade in={true} timeout={300}>
      {spinner}
    </Fade>
  );
}
