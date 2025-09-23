'use client';

import { useState } from 'react';
import { signInAnonymously } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import {
  Container,
  Paper,
  Typography,
  Button,
  Box,
  Alert
} from '@mui/material';

export default function AuthPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const signInAnonymous = async () => {
    setLoading(true);
    setError('');

    try {
      await signInAnonymously(auth);
      router.push('/dashboard');
    } catch (error) {
      setError('Authentication failed: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm" sx={{ pt: 8 }}>
      <Paper
        sx={{
          background: '#1a1a1a',
          border: '1px solid #333',
          p: 4,
          textAlign: 'center'
        }}
      >
        <Typography
          variant="h4"
          sx={{
            fontWeight: 900,
            background: 'linear-gradient(135deg, #ff4444, #ffaa00)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            mb: 4
          }}
        >
          SHTII PLANNER
        </Typography>

        <Typography variant="h6" sx={{ mb: 4 }}>
          Start Your Fitness Journey
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <Button
          variant="contained"
          onClick={signInAnonymous}
          disabled={loading}
          sx={{
            background: 'linear-gradient(135deg, #ff4444, #cc0000)',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: 1,
            py: 2,
            px: 4,
            fontSize: '1.1rem'
          }}
        >
          {loading ? 'Connecting...' : 'Enter App'}
        </Button>
      </Paper>
    </Container>
  );
}