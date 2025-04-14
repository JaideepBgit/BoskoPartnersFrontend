// components/AdminLandingPage.js
import React from 'react';
import { AppBar, Toolbar, Typography, Button, Container } from '@mui/material';
import { useNavigate } from 'react-router-dom';

const AdminLandingPage = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/login');
  };

  const goToDashboard = () => {
    navigate('/dashboard');
  };

  return (
    <>
      <AppBar position="static">
        <Toolbar>
          {/* Placeholder for logo */}
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            LOGO
          </Typography>
          <Button color="inherit" onClick={goToDashboard}>
            Dashboard
          </Button>
          <Button color="inherit" onClick={handleLogout}>
            Logout
          </Button>
        </Toolbar>
      </AppBar>
      <Container sx={{ mt: 4 }}>
        <Typography variant="h4" align="center" gutterBottom>
          Welcome, Admin!
        </Typography>
        <Typography variant="subtitle1" align="center">
          Use the dashboard button above to manage the system.
        </Typography>
      </Container>
    </>
  );
};

export default AdminLandingPage;
