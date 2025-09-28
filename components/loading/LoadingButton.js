'use client';

import { Button, CircularProgress } from '@mui/material';

/**
 * LoadingButton Component
 * Button with loading state
 */
export default function LoadingButton({
  loading = false,
  loadingText = 'Loading...',
  children,
  disabled,
  startIcon,
  endIcon,
  ...props
}) {
  return (
    <Button
      disabled={disabled || loading}
      startIcon={
        loading ? (
          <CircularProgress size={16} color="inherit" />
        ) : (
          startIcon
        )
      }
      endIcon={!loading ? endIcon : undefined}
      {...props}
    >
      {loading ? loadingText : children}
    </Button>
  );
}
