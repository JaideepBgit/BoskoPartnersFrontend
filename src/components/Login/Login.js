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
  CircularProgress
} from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import UserService from '../../services/Login/UserService';

const LoginPage = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  const logoImage = process.env.PUBLIC_URL + '/assets/saurara-high-resolution-logo-transparent.png';

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

      // Check if user has multiple roles
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
    <>
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

            <Typography variant="h5" align="center" gutterBottom sx={{ color: '#212121', fontWeight: 'bold' }}>
              Login
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
              label="Username or Email"
              variant="outlined"
              fullWidth
              margin="normal"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
            />

            <TextField
              label="Password"
              type="password"
              variant="outlined"
              fullWidth
              margin="normal"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
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
              {loading ? <CircularProgress size={24} color="inherit" /> : 'Log In'}
            </Button>

            <Typography variant="body2" align="center" sx={{ mt: 2 }}>
              Forgot your password?{' '}
              <Link href="/forgot-password" underline="hover">
                Click here
              </Link>
            </Typography>

            <Typography variant="body2" align="center" sx={{ mt: 1 }}>
              Don't have an account?{' '}
              <Link href="/signup" underline="hover" sx={{ color: '#633394', fontWeight: 500 }}>
                Sign Up
              </Link>
            </Typography>
          </Box>
        </Container>
      </Box>
    </>
  );
};

export default LoginPage;
