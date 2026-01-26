// components/AdminLandingPage.js
import React, { useState, useEffect } from 'react';
import { Typography, Container, Box, Paper, Grid, Card, CardContent } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import Navbar from '../shared/Navbar/Navbar';

const AdminLandingPage = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({
    total_users: 0,
    active_users: 0,
    completed_surveys: 0,
    total_organizations: 0
  });

  useEffect(() => {
    // Get user data from localStorage
    const userData = localStorage.getItem('user');
    if (userData) {
      const parsedData = JSON.parse(userData);
      console.log('AdminLandingPage - User data from localStorage:', parsedData);
      setUser(parsedData);
    }

    // Fetch dashboard statistics
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/admin/dashboard-stats');
        const data = await response.json();
        setStats(data);
      } catch (error) {
        console.error('Failed to fetch dashboard stats:', error);
      }
    };

    fetchStats();
  }, []);

  return (
    <>
      <Navbar />
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" sx={{ mb: 4, fontWeight: 'bold', color: '#633394' }}>
          Welcome, {user?.name || 'Admin'}!
        </Typography>

        <Grid container spacing={3}>
          {/* Summary Cards */}
          <Grid item xs={12} md={4}>
            <Card sx={{ height: '100%', backgroundColor: '#f5f5f5', boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)' }}>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#633394', mb: 2 }}>
                  Active Users
                </Typography>
                <Typography variant="h3" sx={{ fontWeight: 'bold' }}>
                  {stats.active_users}
                </Typography>
                <Typography variant="body2" sx={{ color: '#666', mt: 1 }}>
                  Users with survey codes
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card sx={{ height: '100%', backgroundColor: '#f5f5f5', boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)' }}>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#633394', mb: 2 }}>
                  Total Users
                </Typography>
                <Typography variant="h3" sx={{ fontWeight: 'bold' }}>
                  {stats.total_users}
                </Typography>
                <Typography variant="body2" sx={{ color: '#666', mt: 1 }}>
                  Registered users in the system
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card sx={{ height: '100%', backgroundColor: '#f5f5f5', boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)' }}>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#633394', mb: 2 }}>
                  Completed Surveys
                </Typography>
                <Typography variant="h3" sx={{ fontWeight: 'bold' }}>
                  {stats.completed_surveys}
                </Typography>
                <Typography variant="body2" sx={{ color: '#666', mt: 1 }}>
                  {stats.completion_rate}% completion rate
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Quick Actions */}
          <Grid item xs={12}>
            <Paper sx={{ p: 3, mt: 3, backgroundColor: '#f5f5f5', boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)' }}>
              <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#633394', mb: 2 }}>
                Quick Actions
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Card
                  sx={{
                    p: 2,
                    cursor: 'pointer',
                    minWidth: '200px',
                    backgroundColor: '#633394',
                    color: 'white',
                    '&:hover': { backgroundColor: '#967CB2' }
                  }}
                  onClick={() => navigate('/organizations')}
                >
                  <Typography>Manage Organizations</Typography>
                </Card>
                <Card
                  sx={{
                    p: 2,
                    cursor: 'pointer',
                    minWidth: '200px',
                    backgroundColor: '#633394',
                    color: 'white',
                    '&:hover': { backgroundColor: '#967CB2' }
                  }}
                  onClick={() => navigate('/users')}
                >
                  <Typography>Manage Users</Typography>
                </Card>
                <Card
                  sx={{
                    p: 2,
                    cursor: 'pointer',
                    minWidth: '200px',
                    backgroundColor: '#633394',
                    color: 'white',
                    '&:hover': { backgroundColor: '#967CB2' }
                  }}
                  onClick={() => navigate('/inventory')}
                >
                  <Typography>Survey Inventory</Typography>
                </Card>
                <Card
                  sx={{
                    p: 2,
                    cursor: 'pointer',
                    minWidth: '200px',
                    backgroundColor: '#633394',
                    color: 'white',
                    '&:hover': { backgroundColor: '#967CB2' }
                  }}
                  onClick={() => navigate('/users')}
                >
                  <Typography>Assign Surveys</Typography>
                </Card>
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </>
  );
};

export default AdminLandingPage;
