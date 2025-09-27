'use client';

import { Box, Fade, Backdrop } from '@mui/material';
import LoadingSpinner from './LoadingSpinner';

/**
 * LoadingOverlay Component
 * Overlay with loading spinner
 */
export default function LoadingOverlay({
  open = false,
  text,
  size = 40,
  color = 'primary',
  backdrop = true,
  ...props
}) {
  if (!open) return null;

  return (
    <Backdrop
      open={open}
      sx={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 9999,
        backgroundColor: backdrop ? 'rgba(0, 0, 0, 0.5)' : 'transparent',
        ...props.sx
      }}
      {...props}
    >
      <Fade in={open} timeout={300}>
        <Box>
          <LoadingSpinner
            size={size}
            text={text}
            color={color}
            fullScreen={false}
          />
        </Box>
      </Fade>
    </Backdrop>
  );
}
