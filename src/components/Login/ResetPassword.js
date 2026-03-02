import React, { useState, useEffect } from 'react';
import {
  Container,
  TextField,
  Button,
  Typography,
  Box,
  Link,
  Alert,
  CircularProgress,
  InputAdornment,
  IconButton
} from '@mui/material';
import { useNavigate, useSearchParams, Link as RouterLink } from 'react-router-dom';
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
          height: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: '#f5f5f7',
        }}
      >
        <CircularProgress size={60} sx={{ color: '#633394' }} />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        height: '100vh',
        display: 'flex',
        bgcolor: '#f5f5f7',
        overflow: 'hidden',
      }}
    >
      {/* Left panel – video */}
      <Box
        sx={{
          flex: 1,
          display: { xs: 'none', md: 'flex' },
          position: 'relative',
          bgcolor: '#e8e8ef',
          overflow: 'hidden',
        }}
      >
        <video
          autoPlay
          loop
          muted
          playsInline
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
        >
          <source src="/invitation_video.webm" type="video/webm" />
        </video>
      </Box>

      {/* Right panel – form */}
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          p: 3,
          bgcolor: '#fff',
          overflowY: 'auto',
        }}
      >
        <Container maxWidth="xs">
          <Box component="form" onSubmit={handleSubmit}>
            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
              <RouterLink to="/">
                <img src={logoImage} alt="Saurara Logo" style={{ maxWidth: '160px', height: 'auto' }} />
              </RouterLink>
            </Box>

            <Typography variant="h5" align="center" gutterBottom sx={{ fontWeight: 'bold', color: '#212121' }}>
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
                    '&:hover': { backgroundColor: '#4e2474' },
                    py: 1.4,
                    fontSize: '1rem',
                    textTransform: 'none',
                    borderRadius: 2,
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
                    '&:hover': { backgroundColor: '#4e2474' },
                    py: 1.4,
                    fontSize: '1rem',
                    textTransform: 'none',
                    borderRadius: 2,
                  }}
                >
                  {loading ? <CircularProgress size={24} color="inherit" /> : 'Reset Password'}
                </Button>

                <Typography variant="body2" align="center" sx={{ mt: 2 }}>
                  <Link
                    component="button"
                    type="button"
                    onClick={() => navigate('/login')}
                    underline="hover"
                    sx={{ color: '#633394', fontWeight: 500 }}
                  >
                    Back to Login
                  </Link>
                </Typography>
              </>
            )}
          </Box>
        </Container>
      </Box>
    </Box>
  );
};

export default ResetPassword;
