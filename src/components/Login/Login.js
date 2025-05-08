// src/pages/Login/LoginPage.js

import React, { useState } from 'react';
import {
  Container,
  TextField,
  Button,
  Typography,
  Box,
  Link,
  Alert
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import UserService from '../../services/Login/UserService';

const LoginPage = ({ onLogin }) => {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [success, setSuccess]   = useState('');
  const navigate                = useNavigate();

  const backgroundImage = process.env.PUBLIC_URL + '/assets/chruch_school.jpg';
  const logoImage       = process.env.PUBLIC_URL + '/assets/saurara-high-resolution-logo-transparent.png';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }

    try {
      const response = await UserService.loginUser(email, password);
      // axios-style: response.data is your payload
      const userData = response.data;

      console.log('Login Successful - userData:', userData);
      setSuccess('Login Successful');

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
      if (userData.organization_id) {
        localStorage.setItem('organizationId', userData.organization_id);
      }

      // notify parent (so Navbar can re-check user)
      if (onLogin) onLogin();

      // 4️⃣ navigate based on role
      switch (userData.role) {
        case 'admin':
          navigate('/admin');
          break;
        case 'user':
          navigate('/user');
          break;
        default:
          console.warn('Unknown role, defaulting to /');
          navigate('/');
      }

    } catch (err) {
      console.error('Login error:', err);
      setError('Invalid email or password');
    }
  };

  return (
    <Box
      sx={{
        backgroundImage: `url(${backgroundImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      <Container maxWidth="xs" sx={{ display: 'flex', alignItems: 'center', height: '100vh' }}>
        <Box
          component="form"
          onSubmit={handleSubmit}
          sx={{
            width: '100%',
            bgcolor: 'white',
            p: 4,
            boxShadow: 3,
            borderRadius: 2
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 1 }}>
            <img src={logoImage} alt="Saurara Logo" style={{ maxWidth: '180px', height: 'auto' }} />
          </Box>

          <Typography variant="h5" align="center" gutterBottom>
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
          />

          <Button
            type="submit"
            variant="contained"
            fullWidth
            sx={{
              mt: 2,
              backgroundColor: '#633394',
              '&:hover': { backgroundColor: '#967CB2' },
              py: 1.25,
              fontSize: '1rem',
            }}
          >
            Log In
          </Button>

          <Typography variant="body2" align="center" sx={{ mt: 2 }}>
            Forgot your password?{' '}
            <Link href="#" underline="hover">
              Click here
            </Link>
          </Typography>
        </Box>
      </Container>
    </Box>
  );
};

export default LoginPage;
