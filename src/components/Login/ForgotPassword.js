import React, { useState } from 'react';
import {
  Container,
  TextField,
  Button,
  Typography,
  Box,
  Link,
  Alert,
  CircularProgress
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const logoImage = process.env.PUBLIC_URL + '/assets/saurara-high-resolution-logo-transparent.png';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!email) {
      setError('Please enter your email address');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('If an account exists with that email, a password reset link has been sent. Please check your inbox.');
        setEmail('');
      } else {
        setError(data.error || 'An error occurred. Please try again.');
      }
    } catch (err) {
      console.error('Forgot password error:', err);
      setError('Unable to connect to the server. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

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
            Forgot Password
          </Typography>

          <Typography variant="body2" align="center" color="text.secondary" sx={{ mb: 3 }}>
            Enter your email address and we'll send you a link to reset your password.
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
            label="Email Address"
            variant="outlined"
            fullWidth
            margin="normal"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            type="email"
            disabled={loading}
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
            {loading ? <CircularProgress size={24} color="inherit" /> : 'Send Reset Link'}
          </Button>

          <Button
            startIcon={<ArrowBackIcon />}
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
        </Box>
      </Container>
    </Box>
  );
};

export default ForgotPassword;
