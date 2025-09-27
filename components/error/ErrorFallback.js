'use client';

import { Box, Typography, Button, Paper, Alert } from '@mui/material';
import { ErrorOutline, Refresh, Home } from '@mui/icons-material';
import { useRouter } from 'next/navigation';

/**
 * ErrorFallback Component
 * Fallback UI for when components fail to render
 */
export default function ErrorFallback({
  error,
  resetError,
  showHomeButton = true,
  showRetryButton = true,
  customMessage,
  ...props
}) {
  const router = useRouter();

  const handleGoHome = () => {
    router.push('/');
  };

  const getErrorMessage = () => {
    if (customMessage) return customMessage;
    
    if (error?.message) {
      return error.message;
    }
    
    return 'Something went wrong. Please try again.';
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '400px',
        p: 3,
        ...props.sx
      }}
      {...props}
    >
      <Paper
        elevation={3}
        sx={{
          p: 4,
          maxWidth: '500px',
          textAlign: 'center',
          backgroundColor: 'background.paper'
        }}
      >
        <ErrorOutline
          sx={{
            fontSize: 64,
            color: 'error.main',
            mb: 2
          }}
        />

        <Typography
          variant="h5"
          component="h2"
          gutterBottom
          sx={{ color: 'error.main', fontWeight: 'bold' }}
        >
          Oops! Something went wrong
        </Typography>

        <Typography
          variant="body1"
          color="text.secondary"
          sx={{ mb: 3 }}
        >
          {getErrorMessage()}
        </Typography>

        {process.env.NODE_ENV === 'development' && error && (
          <Alert severity="error" sx={{ mb: 3, textAlign: 'left' }}>
            <Typography variant="body2" component="pre" sx={{ fontSize: '0.8rem' }}>
              {error.toString()}
            </Typography>
          </Alert>
        )}

        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
          {showRetryButton && (
            <Button
              variant="contained"
              startIcon={<Refresh />}
              onClick={resetError}
              sx={{ minWidth: '120px' }}
            >
              Try Again
            </Button>
          )}

          {showHomeButton && (
            <Button
              variant="outlined"
              startIcon={<Home />}
              onClick={handleGoHome}
              sx={{ minWidth: '120px' }}
            >
              Go Home
            </Button>
          )}
        </Box>
      </Paper>
    </Box>
  );
}
