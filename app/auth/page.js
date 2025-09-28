'use client';

import { useState, useEffect } from 'react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signInAnonymously,
  onAuthStateChanged,
  signOut
} from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import {
  Container,
  Paper,
  Typography,
  Button,
  Alert,
  TextField,
  Box,
  Tabs,
  Tab,
  CircularProgress,
  InputAdornment,
  IconButton
} from '@mui/material';
import { Visibility, VisibilityOff, Email, Lock } from '@mui/icons-material';
import { sanitizeString, checkRateLimit } from '@/lib/security';

export default function AuthPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [tabValue, setTabValue] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [user, setUser] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      if (user && user.email) {
        router.push('/dashboard');
      }
    });

    return () => unsubscribe();
  }, [router]);

  const handleInputChange = (field) => (event) => {
    const value = sanitizeString(event.target.value);
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    setError('');
  };

  const validateForm = () => {
    if (!formData.email || !formData.password) {
      setError('Email and password are required');
      return false;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setError('Please enter a valid email address');
      return false;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return false;
    }

    if (tabValue === 1 && formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }

    return true;
  };

  const signInWithEmail = async () => {
    if (!validateForm()) return;

    try {
      checkRateLimit('sign_in');
      setLoading(true);
      setError('');

      await signInWithEmailAndPassword(auth, formData.email, formData.password);
      setSuccess('Successfully signed in!');
    } catch (error) {
      let errorMessage = 'Authentication failed';
      
      switch (error.code) {
        case 'auth/user-not-found':
          errorMessage = 'No account found with this email address';
          break;
        case 'auth/wrong-password':
          errorMessage = 'Incorrect password';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Invalid email address';
          break;
        case 'auth/too-many-requests':
          errorMessage = 'Too many failed attempts. Please try again later';
          break;
        default:
          errorMessage = error.message;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const signUpWithEmail = async () => {
    if (!validateForm()) return;

    try {
      checkRateLimit('sign_up');
      setLoading(true);
      setError('');

      await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      setSuccess('Account created successfully!');
    } catch (error) {
      let errorMessage = 'Account creation failed';
      
      switch (error.code) {
        case 'auth/email-already-in-use':
          errorMessage = 'An account with this email already exists';
          break;
        case 'auth/weak-password':
          errorMessage = 'Password is too weak. Please choose a stronger password';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Invalid email address';
          break;
        default:
          errorMessage = error.message;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const signInAnonymous = async () => {
    try {
      checkRateLimit('anonymous_sign_in');
      setLoading(true);
      setError('');

      await signInAnonymously(auth);
      setSuccess('Signed in as guest');
    } catch (error) {
      setError('Guest sign-in failed: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      setFormData({ email: '', password: '', confirmPassword: '' });
      setSuccess('Signed out successfully');
    } catch (error) {
      setError('Sign out failed: ' + error.message);
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
          {user ? `Welcome back, ${user.email || 'Guest'}!` : 'Start Your Fitness Journey'}
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 3 }}>
            {success}
          </Alert>
        )}

        {user ? (
          <Box>
            <Typography variant="body1" sx={{ mb: 3 }}>
              You are currently signed in.
            </Typography>
            <Button
              variant="contained"
              onClick={() => router.push('/dashboard')}
              sx={{
                background: 'linear-gradient(135deg, #ff4444, #cc0000)',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: 1,
                py: 2,
                px: 4,
                fontSize: '1.1rem',
                mr: 2
              }}
            >
              Go to Dashboard
            </Button>
            <Button
              variant="outlined"
              onClick={handleSignOut}
              sx={{
                borderColor: '#ff4444',
                color: '#ff4444',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: 1,
                py: 2,
                px: 4,
                fontSize: '1.1rem'
              }}
            >
              Sign Out
            </Button>
          </Box>
        ) : (
          <Box>
            <Tabs
              value={tabValue}
              onChange={(e, newValue) => setTabValue(newValue)}
              sx={{ mb: 3 }}
              centered
            >
              <Tab label="Sign In" />
              <Tab label="Sign Up" />
              <Tab label="Guest" />
            </Tabs>

            {tabValue === 0 && (
              <Box component="form" sx={{ textAlign: 'left' }}>
                <TextField
                  fullWidth
                  label="Email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange('email')}
                  margin="normal"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Email />
                      </InputAdornment>
                    ),
                  }}
                  required
                />
                <TextField
                  fullWidth
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={handleInputChange('password')}
                  margin="normal"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Lock />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowPassword(!showPassword)}
                          edge="end"
                        >
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                  required
                />
                <Button
                  fullWidth
                  variant="contained"
                  onClick={signInWithEmail}
                  disabled={loading}
                  sx={{
                    background: 'linear-gradient(135deg, #ff4444, #cc0000)',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: 1,
                    py: 2,
                    mt: 3,
                    fontSize: '1.1rem'
                  }}
                >
                  {loading ? <CircularProgress size={24} /> : 'Sign In'}
                </Button>
              </Box>
            )}

            {tabValue === 1 && (
              <Box component="form" sx={{ textAlign: 'left' }}>
                <TextField
                  fullWidth
                  label="Email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange('email')}
                  margin="normal"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Email />
                      </InputAdornment>
                    ),
                  }}
                  required
                />
                <TextField
                  fullWidth
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={handleInputChange('password')}
                  margin="normal"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Lock />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowPassword(!showPassword)}
                          edge="end"
                        >
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                  required
                />
                <TextField
                  fullWidth
                  label="Confirm Password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={handleInputChange('confirmPassword')}
                  margin="normal"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Lock />
                      </InputAdornment>
                    ),
                  }}
                  required
                />
                <Button
                  fullWidth
                  variant="contained"
                  onClick={signUpWithEmail}
                  disabled={loading}
                  sx={{
                    background: 'linear-gradient(135deg, #ff4444, #cc0000)',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: 1,
                    py: 2,
                    mt: 3,
                    fontSize: '1.1rem'
                  }}
                >
                  {loading ? <CircularProgress size={24} /> : 'Sign Up'}
                </Button>
              </Box>
            )}

            {tabValue === 2 && (
              <Box>
                <Typography variant="body1" sx={{ mb: 3 }}>
                  Continue as a guest to try the app without creating an account.
                  Your data will be stored locally and may be lost.
                </Typography>
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
                  {loading ? <CircularProgress size={24} /> : 'Continue as Guest'}
                </Button>
              </Box>
            )}
          </Box>
        )}
      </Paper>
    </Container>
  );
}