'use client';

import { useState, useEffect } from 'react';
import { Snackbar, Alert, AlertTitle, IconButton, Collapse } from '@mui/material';
import { Close as CloseIcon, ExpandMore as ExpandMoreIcon, ExpandLess as ExpandLessIcon } from '@mui/icons-material';

/**
 * ErrorToast Component
 * Displays error messages with retry functionality
 */
export default function ErrorToast({
  open,
  onClose,
  error,
  title = 'Error',
  severity = 'error',
  autoHideDuration = 6000,
  showRetry = true,
  onRetry,
  showDetails = false,
  position = { vertical: 'bottom', horizontal: 'center' }
}) {
  const [expanded, setExpanded] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    if (open) {
      setExpanded(false);
      setRetryCount(0);
    }
  }, [open]);

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
    if (onRetry) {
      onRetry();
    }
  };

  const handleClose = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    onClose();
  };

  const getErrorMessage = () => {
    if (typeof error === 'string') {
      return error;
    }
    if (error?.message) {
      return error.message;
    }
    if (error?.error) {
      return error.error;
    }
    return 'An unexpected error occurred';
  };

  const getErrorDetails = () => {
    if (typeof error === 'object' && error !== null) {
      return {
        code: error.code,
        status: error.status,
        stack: error.stack,
        timestamp: new Date().toISOString()
      };
    }
    return null;
  };

  const errorDetails = getErrorDetails();

  return (
    <Snackbar
      open={open}
      autoHideDuration={autoHideDuration}
      onClose={handleClose}
      anchorOrigin={position}
      sx={{ maxWidth: '500px' }}
    >
      <Alert
        severity={severity}
        onClose={handleClose}
        action={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {showRetry && onRetry && (
              <IconButton
                size="small"
                onClick={handleRetry}
                color="inherit"
                title="Retry"
              >
                <Refresh />
              </IconButton>
            )}
            
            {showDetails && errorDetails && (
              <IconButton
                size="small"
                onClick={() => setExpanded(!expanded)}
                color="inherit"
                title="Show details"
              >
                {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              </IconButton>
            )}
            
            <IconButton
              size="small"
              onClick={handleClose}
              color="inherit"
              title="Close"
            >
              <CloseIcon />
            </IconButton>
          </Box>
        }
        sx={{ width: '100%' }}
      >
        <AlertTitle>{title}</AlertTitle>
        {getErrorMessage()}
        
        {retryCount > 0 && (
          <Typography variant="caption" display="block" sx={{ mt: 1 }}>
            Retry attempt: {retryCount}
          </Typography>
        )}

        <Collapse in={expanded}>
          {errorDetails && (
            <Box sx={{ mt: 2, p: 2, backgroundColor: 'rgba(0, 0, 0, 0.1)', borderRadius: 1 }}>
              <Typography variant="caption" component="pre" sx={{ fontSize: '0.75rem' }}>
                {JSON.stringify(errorDetails, null, 2)}
              </Typography>
            </Box>
          )}
        </Collapse>
      </Alert>
    </Snackbar>
  );
}
