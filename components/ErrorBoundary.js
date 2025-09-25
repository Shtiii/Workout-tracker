'use client';

import React from 'react';
import { Box, Typography, Button, Paper } from '@mui/material';
import { motion } from 'framer-motion';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI.
    console.error('ErrorBoundary: Error caught:', error);
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // You can also log the error to an error reporting service
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
  }

  render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Paper
            sx={{
              background: 'linear-gradient(135deg, rgba(26, 26, 26, 0.9), rgba(255, 68, 68, 0.05))',
              border: '1px solid #ff4444',
              p: 4,
              textAlign: 'center',
              borderRadius: 2
            }}
          >
            <Typography variant="h5" sx={{ mb: 2, fontWeight: 700 }}>
              🚫 Something went wrong
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              {this.props.fallbackMessage || 'This component encountered an error and couldn\'t load properly.'}
            </Typography>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <Box sx={{
                mb: 3,
                p: 2,
                backgroundColor: 'rgba(255, 68, 68, 0.1)',
                borderRadius: 1,
                textAlign: 'left',
                fontSize: '0.8rem',
                fontFamily: 'monospace',
                maxHeight: '200px',
                overflow: 'auto'
              }}>
                <Typography variant="caption" color="error" sx={{ display: 'block', mb: 1, fontWeight: 'bold' }}>
                  Error Details (Development Mode):
                </Typography>
                <Typography variant="caption" color="error" sx={{ display: 'block', whiteSpace: 'pre-wrap' }}>
                  {this.state.error && this.state.error.toString()}
                  {this.state.errorInfo.componentStack}
                </Typography>
              </Box>
            )}

            <Button
              variant="contained"
              onClick={() => {
                this.setState({ hasError: false, error: null, errorInfo: null });
                if (this.props.onRetry) {
                  this.props.onRetry();
                }
              }}
              sx={{
                background: 'linear-gradient(135deg, #ff4444, #cc0000)',
                fontWeight: 700,
                textTransform: 'uppercase',
                '&:hover': {
                  background: 'linear-gradient(135deg, #ff6666, #ee0000)',
                }
              }}
            >
              Try Again
            </Button>
          </Paper>
        </motion.div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;