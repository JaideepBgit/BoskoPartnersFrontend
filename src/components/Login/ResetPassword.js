import React, { useState, useEffect } from 'react';
import {
  Container,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  CircularProgress,
  InputAdornment,
  IconButton
} from '@mui/material';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigate = useNavigate();

  const token = searchParams.get('token');
  const logoImage = process.env.PUBLIC_URL + '/assets/saurara-high-resolution-logo-transparent.png';

  useEffect(() => {
    verifyToken();
  }, [token]);

  const verifyToken = async () => {
    if (!token) {
      setError('Invalid reset link');
      setVerifying(false);
      return;
    }

    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}/verify-reset-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
      });

      const data = await response.json();

      if (response.ok) {
        setTokenValid(true);
      } else {
        setError(data.error || 'Invalid or expired reset link');
      }
    } catch (err) {
      console.error('Token verification error:', err);
      setError('Unable to verify reset link. Please try again.');
    } finally {
      setVerifying(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!password || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token, password }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('Password reset successful! Redirecting to login...');
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      } else {
        setError(data.error || 'An error occurred. Please try again.');
      }
    } catch (err) {
      console.error('Reset password error:', err);
      setError('Unable to connect to the server. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  if (verifying) {
    return (
      <Box
        sx={{
          background: 'linear-gradient(135deg, #3B1C55 0%, #633394 25%, #61328E 50%, #967CB2 75%, #FBFAFA 100%)',
          height: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <CircularProgress size={60} sx={{ color: 'white' }} />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        background: 'linear-gradient(135deg, #3B1C55 0%, #633394 25%, #61328E 50%, #967CB2 75%, #FBFAFA 100%)',
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'radial-gradient(ellipse at top left, rgba(59, 28, 85, 0.1) 0%, transparent 50%), radial-gradient(ellipse at bottom right, rgba(150, 124, 178, 0.1) 0%, transparent 50%)',
          pointerEvents: 'none'
        }
      }}
    >
      <Container maxWidth="xs" sx={{ display: 'flex', alignItems: 'center', height: '100vh' }}>
        <Box
          component="form"
          onSubmit={handleSubmit}
          sx={{
            width: '100%',
            bgcolor: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
            p: 4,
            boxShadow: '0 20px 40px rgba(59, 28, 85, 0.15)',
            borderRadius: 3,
            border: '1px solid rgba(255, 255, 255, 0.2)',
            position: 'relative',
            zIndex: 1
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 1 }}>
            <img src={logoImage} alt="Saurara Logo" style={{ maxWidth: '180px', height: 'auto' }} />
          </Box>

          <Typography variant="h5" align="center" gutterBottom>
            Reset Password
          </Typography>

          {!tokenValid ? (
            <>
              <Alert severity="error" sx={{ mb: 2 }}>
                {error || 'Invalid or expired reset link'}
              </Alert>
              <Button
                variant="contained"
                fullWidth
                onClick={() => navigate('/forgot-password')}
                sx={{
                  backgroundColor: '#633394',
                  '&:hover': { backgroundColor: '#967CB2' },
                  py: 1.25,
                }}
              >
                Request New Reset Link
              </Button>
            </>
          ) : (
            <>
              <Typography variant="body2" align="center" color="text.secondary" sx={{ mb: 3 }}>
                Enter your new password below.
              </Typography>

              {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {error}
                </Alert>
              )}

              {success && (
                <Alert severity="success" sx={{ mb: 2 }}>
                  {success}
                </Alert>
              )}

              <TextField
                label="New Password"
                type={showPassword ? 'text' : 'password'}
                variant="outlined"
                fullWidth
                margin="normal"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                InputProps={{
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
              />

              <TextField
                label="Confirm New Password"
                type={showConfirmPassword ? 'text' : 'password'}
                variant="outlined"
                fullWidth
                margin="normal"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={loading}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        edge="end"
                      >
                        {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />

              <Button
                type="submit"
                variant="contained"
                fullWidth
                disabled={loading}
                sx={{
                  mt: 2,
                  backgroundColor: '#633394',
                  '&:hover': { backgroundColor: '#967CB2' },
                  py: 1.25,
                  fontSize: '1rem',
                }}
              >
                {loading ? <CircularProgress size={24} color="inherit" /> : 'Reset Password'}
              </Button>

              <Button
                onClick={() => navigate('/login')}
                fullWidth
                sx={{
                  mt: 2,
                  color: '#633394',
                  '&:hover': { backgroundColor: 'rgba(99, 51, 148, 0.1)' },
                }}
              >
                Back to Login
              </Button>
            </>
          )}
        </Box>
      </Container>
    </Box>
  );
};

export default ResetPassword;
