// src/pages/Login/LoginPage.js

import React, { useState } from 'react';
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
  IconButton,
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { useNavigate, useLocation, Link as RouterLink } from 'react-router-dom';
import UserService from '../../services/Login/UserService';

const logoImage = process.env.PUBLIC_URL + '/assets/saurara-high-resolution-logo-transparent.png';

const LoginPage = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    if (!email || !password) {
      setError('Please enter both email and password');
      setLoading(false);
      return;
    }

    try {
      const response = await UserService.loginUser(email, password);
      const userData = response.data || response;

      console.log('Login Successful - userData:', userData);
      console.log('Available roles:', userData.available_roles);
      console.log('Requires role selection:', response.requires_role_selection);

      // Check if user has multiple roles (or same role in multiple contexts)
      if (response.requires_role_selection) {
        // Navigate to role selection page
        navigate('/select-role', {
          state: {
            userData,
            availableRoles: userData.available_roles || [],
            availableRolesContext: userData.available_roles_context || []
          }
        });
        setLoading(false);
        return;
      }

      // Single role - proceed with login
      completeLogin(userData);

    } catch (err) {
      console.error('Login error:', err);
      setError('Invalid email or password');
      setLoading(false);
    }
  };

  const completeLogin = (userData) => {
    setSuccess('Login Successful');
    setLoading(false);

    // 1️⃣ mark as authenticated
    localStorage.setItem('isAuthenticated', 'true');

    // 2️⃣ store entire user object
    localStorage.setItem('user', JSON.stringify(userData));

    // 3️⃣ store user ID and role separately for easy access
    if (userData.id) {
      localStorage.setItem('userId', userData.id);
    }
    if (userData.role) {
      localStorage.setItem('userRole', userData.role);
    }
    if (userData.available_roles) {
      localStorage.setItem('availableRoles', JSON.stringify(userData.available_roles));
    }
    if (userData.available_roles_context) {
      localStorage.setItem('availableRolesContext', JSON.stringify(userData.available_roles_context));
    }
    if (userData.organization_id) {
      localStorage.setItem('organizationId', userData.organization_id);
    }
    if (userData.survey_code) {
      localStorage.setItem('surveyCode', userData.survey_code);
    }

    // notify parent (so Navbar can re-check user)
    if (onLogin) onLogin();

    // 4️⃣ check for pending survey join (QR code flow)
    const pendingJoin = localStorage.getItem('pendingSurveyJoin');
    if (pendingJoin) {
      try {
        const { surveyId } = JSON.parse(pendingJoin);
        navigate(`/survey/join/${surveyId}`, { replace: true });
        return;
      } catch (e) {
        localStorage.removeItem('pendingSurveyJoin');
      }
    }

    // 5️⃣ check for redirect from ProtectedRoute
    const from = location.state?.from?.pathname;
    if (from && from !== '/login' && from !== '/') {
      navigate(from, { replace: true });
      return;
    }

    // 6️⃣ navigate based on role
    if (userData.role === 'user') {
      navigate('/user');
    } else {
      navigate('/dashboard');
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
              Sign In
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
              label="Username or email address"
              variant="outlined"
              fullWidth
              margin="normal"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoFocus
              disabled={loading}
            />

            <TextField
              label="Your password"
              variant="outlined"
              fullWidth
              margin="normal"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowPassword((s) => !s)} edge="end">
                      {showPassword ? <VisibilityOff /> : <Visibility />}
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
              {loading ? <CircularProgress size={22} color="inherit" /> : 'Sign In'}
            </Button>

            <Typography variant="caption" display="block" align="center" sx={{ mt: 2, color: 'text.secondary' }}>
              By continuing, you agree to our{' '}
              <Link href="#" underline="hover">Terms of Service</Link>,{' '}
              <Link href="#" underline="hover">Privacy Policy</Link>, and{' '}
              <Link href="#" underline="hover">Cookie Use</Link>.
            </Typography>

            <Typography variant="body2" align="center" sx={{ mt: 2 }}>
              Forgot your password?{' '}
              <Link href="/forgot-password" underline="hover" sx={{ color: '#633394', fontWeight: 500 }}>
                Click here
              </Link>
            </Typography>

            <Typography variant="body2" align="center" sx={{ mt: 1 }}>
              Don't have an account?{' '}
              <Link href="/signup" underline="hover" sx={{ color: '#633394', fontWeight: 500 }}>
                Request one
              </Link>
            </Typography>
          </Box>
        </Container>
      </Box>
    </Box>
  );
};

export default LoginPage;
