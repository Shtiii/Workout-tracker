'use client';

import { useState, useEffect } from 'react';
import { Alert, AlertTitle, Box, Button, Typography } from '@mui/material';
import { WifiOff, Refresh } from '@mui/icons-material';

/**
 * NetworkErrorHandler Component
 * Handles network connectivity issues and provides retry functionality
 */
export default function NetworkErrorHandler({
  error,
  onRetry,
  showOfflineMessage = true,
  autoRetry = false,
  retryInterval = 5000,
  ...props
}) {
  const [isOnline, setIsOnline] = useState(true);
  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Check initial online status
    setIsOnline(navigator.onLine);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    if (autoRetry && !isOnline) {
      const interval = setInterval(() => {
        if (navigator.onLine) {
          setIsOnline(true);
          handleRetry();
        }
      }, retryInterval);

      return () => clearInterval(interval);
    }
  }, [autoRetry, isOnline, retryInterval]);

  const handleRetry = async () => {
    if (isRetrying) return;

    setIsRetrying(true);
    setRetryCount(prev => prev + 1);

    try {
      if (onRetry) {
        await onRetry();
      }
    } catch (error) {
      console.error('Retry failed:', error);
    } finally {
      setIsRetrying(false);
    }
  };

  const isNetworkError = error?.code === 'NETWORK_ERROR' || 
                        error?.message?.includes('network') ||
                        error?.message?.includes('fetch') ||
                        !isOnline;

  if (!isNetworkError && !showOfflineMessage) {
    return null;
  }

  return (
    <Box {...props}>
      <Alert
        severity="warning"
        icon={<WifiOff />}
        action={
          <Button
            color="inherit"
            size="small"
            onClick={handleRetry}
            disabled={isRetrying || !isOnline}
            startIcon={<Refresh />}
          >
            {isRetrying ? 'Retrying...' : 'Retry'}
          </Button>
        }
      >
        <AlertTitle>
          {!isOnline ? 'You\'re offline' : 'Network Error'}
        </AlertTitle>
        
        {!isOnline ? (
          <Typography variant="body2">
            Please check your internet connection and try again.
          </Typography>
        ) : (
          <Typography variant="body2">
            Unable to connect to the server. Please check your connection and try again.
          </Typography>
        )}

        {retryCount > 0 && (
          <Typography variant="caption" display="block" sx={{ mt: 1 }}>
            Retry attempt: {retryCount}
          </Typography>
        )}
      </Alert>
    </Box>
  );
}
