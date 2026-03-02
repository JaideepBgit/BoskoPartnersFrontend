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
import { useNavigate, Link as RouterLink } from 'react-router-dom';
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
                '&:hover': { backgroundColor: '#4e2474' },
                py: 1.4,
                fontSize: '1rem',
                textTransform: 'none',
                borderRadius: 2,
              }}
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : 'Send Reset Link'}
            </Button>

            <Typography variant="body2" align="center" sx={{ mt: 2 }}>
              <Link
                component="button"
                type="button"
                onClick={() => navigate('/login')}
                underline="hover"
                sx={{ color: '#633394', fontWeight: 500, display: 'inline-flex', alignItems: 'center', gap: 0.5 }}
              >
                <ArrowBackIcon sx={{ fontSize: 16 }} /> Back to Login
              </Link>
            </Typography>
          </Box>
        </Container>
      </Box>
    </Box>
  );
};

export default ForgotPassword;
