'use client';

import { useState } from 'react';
import { Button, CircularProgress, Box, Typography } from '@mui/material';
import { Refresh as RefreshIcon } from '@mui/icons-material';

/**
 * RetryButton Component
 * Button with retry functionality and loading states
 */
export default function RetryButton({
  onRetry,
  loading = false,
  disabled = false,
  maxRetries = 3,
  retryDelay = 1000,
  children = 'Retry',
  variant = 'outlined',
  size = 'medium',
  fullWidth = false,
  sx = {},
  ...props
}) {
  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);

  const handleRetry = async () => {
    if (isRetrying || retryCount >= maxRetries) return;

    setIsRetrying(true);
    setRetryCount(prev => prev + 1);

    try {
      if (onRetry) {
        await onRetry();
      }
    } catch (error) {
      console.error('Retry failed:', error);
    } finally {
      // Add delay before allowing next retry
      setTimeout(() => {
        setIsRetrying(false);
      }, retryDelay);
    }
  };

  const isDisabled = disabled || loading || isRetrying || retryCount >= maxRetries;
  const showRetryCount = retryCount > 0 && retryCount < maxRetries;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1, ...sx }}>
      <Button
        variant={variant}
        size={size}
        fullWidth={fullWidth}
        disabled={isDisabled}
        onClick={handleRetry}
        startIcon={
          loading || isRetrying ? (
            <CircularProgress size={16} />
          ) : (
            <RefreshIcon />
          )
        }
        {...props}
      >
        {loading || isRetrying ? 'Retrying...' : children}
      </Button>

      {showRetryCount && (
        <Typography variant="caption" color="text.secondary">
          Attempt {retryCount} of {maxRetries}
        </Typography>
      )}

      {retryCount >= maxRetries && (
        <Typography variant="caption" color="error">
          Maximum retries reached
        </Typography>
      )}
    </Box>
  );
}
