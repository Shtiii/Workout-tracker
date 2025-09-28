'use client';

import { Box } from '@mui/material';

/**
 * ScreenReaderOnly Component
 * Content that is only visible to screen readers
 */
export default function ScreenReaderOnly({ 
  children, 
  as = 'span',
  ...props 
}) {
  return (
    <Box
      component={as}
      sx={{
        position: 'absolute',
        width: '1px',
        height: '1px',
        padding: 0,
        margin: '-1px',
        overflow: 'hidden',
        clip: 'rect(0, 0, 0, 0)',
        whiteSpace: 'nowrap',
        border: 0,
        ...props.sx
      }}
      {...props}
    >
      {children}
    </Box>
  );
}
