// In LoginPage.js
import React, { useState } from 'react';
import { Container, TextField, Button, Typography, Box, Link, Alert } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import UserService from '../../services/Login/UserService';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const backgroundImage = process.env.PUBLIC_URL + '/assets/chruch_school.jpg';
  const logoImage = process.env.PUBLIC_URL + '/assets/Bosko_Partners_logo.jpg';
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
      console.log('Login Successful:', response);
      setSuccess('Login Successful');
      // Save the user information (including role) to localStorage
      localStorage.setItem('user', JSON.stringify(response.data));

      // Conditionally navigate based on role
      if (response.data.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/user');
      }
    } catch (err) {
      console.error(err);
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
        <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%', bgcolor: 'white', p: 4, boxShadow: 3, borderRadius: 2 }}>

          <Box sx={{display: 'flex', justifyContent:'center', mb: 2}}>
            <img src={logoImage} alt="Bosko Partners Logo" style={{ maxWidth: '150px' }}/>
          </Box>

          <Typography variant="h5" component="h1" gutterBottom align="center">
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
            type="text"
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

          <Button type="submit" variant="contained" fullWidth sx={{ mt: 2 }}>
            Log In
          </Button>

          <Typography variant="body2" align="center" sx={{ mt: 2 }}>
            Forgot your password?{' '}
            <Link href="#" underline="hover">
              Please Click Here
            </Link>
          </Typography>
        </Box>
      </Container>
    </Box>
  );
};

export default LoginPage;
