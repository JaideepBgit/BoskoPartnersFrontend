import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Typography, 
  Box, 
  Card, 
  CardContent, 
  Button, 
  Grid, 
  CircularProgress,
  Divider,
  Chip,
  useMediaQuery,
  useTheme
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import Navbar from '../shared/Navbar/Navbar';
import { getUserDetailsStatus } from '../../services/UserDetails/UserDetailsService';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';

// Home Component - This will be the default landing page for non-admin users
const HomeComponent = () => {
  const [userDetails, setUserDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const userRole = localStorage.getItem('userRole');
  
  // Get user ID from localStorage (set during login)
  const userId = parseInt(localStorage.getItem('userId') || '0', 10);
  const surveyCode = localStorage.getItem('surveyCode');

  useEffect(() => {
    const fetchUserDetails = async () => {
      try {
        setLoading(true);
        const response = await getUserDetailsStatus(userId);
        console.log(response);
        setUserDetails(response);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching user details:', err);
        setError('Failed to load your details. Please try again later.');
        setLoading(false);
      }
    };

    if (userId > 0) {
      fetchUserDetails();
    } else {
      setLoading(false);
    }
  }, [userId]);

  const handleEditDetails = () => {
    // If we have a survey code, navigate to the form with it
    if (surveyCode) {
      navigate('/form', { 
        state: { 
          survey: { 
            survey_code: surveyCode,
            user_id: userId 
          } 
        } 
      });
    } else {
      // If no survey code, show error or redirect to survey code entry
      setError('Survey code not found. Please enter your survey code again.');
      navigate('/user');
    }
  };

  // Check if personal details are filled
  const isPersonalDetailsFilled = () => {
    if (!userDetails) {
      return false;
    }
    return userDetails.personal_details_filled;
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <Container sx={{ mt: 2, display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
          <CircularProgress />
        </Container>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <Container maxWidth="lg" sx={{ mt: isMobile ? 2 : 4, mb: isMobile ? 2 : 4, px: isMobile ? 2 : 3 }}>
        <Typography 
          variant={isMobile ? "h5" : "h4"} 
          component="h1" 
          gutterBottom 
          sx={{ fontWeight: 'bold', mb: isMobile ? 2 : 3, color: '#633394' }}
        >
          {userDetails && userDetails.form_data && userDetails.form_data.personal && 
           userDetails.form_data.personal.firstName ? 
            `Welcome ${userDetails.form_data.personal.firstName}!` : 
            'Welcome to Bosko Partners!'}
        </Typography>
        
        {error && (
          <Box sx={{ mb: isMobile ? 2 : 3 }}>
            <Typography color="error">{error}</Typography>
          </Box>
        )}

        <Grid container spacing={isMobile ? 2 : 3}>
          {/* Personal Details Card */}
          <Grid item xs={12}>
            <Card sx={{ 
              backgroundColor: '#f5f5f5',
              boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
              borderRadius: '8px'
            }}>
              <CardContent sx={{ p: isMobile ? 2 : 3 }}>
                <Box sx={{ 
                  display: 'flex', 
                  flexDirection: isMobile ? 'column' : 'row',
                  justifyContent: isMobile ? 'flex-start' : 'space-between', 
                  alignItems: isMobile ? 'flex-start' : 'center', 
                  mb: 2 
                }}>
                  <Typography variant="h6" component="div" sx={{ fontWeight: 'bold', mb: isMobile ? 1 : 0, color: '#633394' }}>
                    Personal Details
                  </Typography>
                  <Chip 
                    icon={isPersonalDetailsFilled() ? <CheckCircleIcon /> : <ErrorIcon />} 
                    label={isPersonalDetailsFilled() ? "Completed" : "Not Completed"} 
                    color={isPersonalDetailsFilled() ? "success" : "error"}
                    variant="outlined"
                    size={isMobile ? "small" : "medium"}
                  />
                </Box>
                
                <Divider sx={{ mb: 2 }} />
                
                {userDetails && userDetails.form_data && userDetails.form_data.personal ? (
                  <Box>
                    <Grid container spacing={2}>
                      <Grid item xs={isMobile ? 12 : 6}>
                        <Typography variant="body2" color="text.secondary">First Name</Typography>
                        <Typography variant="body1" sx={{ wordBreak: 'break-word' }}>
                          {userDetails.form_data.personal.firstName || 'Not provided'}
                        </Typography>
                      </Grid>
                      <Grid item xs={isMobile ? 12 : 6}>
                        <Typography variant="body2" color="text.secondary">Last Name</Typography>
                        <Typography variant="body1" sx={{ wordBreak: 'break-word' }}>
                          {userDetails.form_data.personal.lastName || 'Not provided'}
                        </Typography>
                      </Grid>
                      <Grid item xs={isMobile ? 12 : 6}>
                        <Typography variant="body2" color="text.secondary">Email</Typography>
                        <Typography variant="body1" sx={{ wordBreak: 'break-word' }}>
                          {userDetails.form_data.personal.email || 'Not provided'}
                        </Typography>
                      </Grid>
                      <Grid item xs={isMobile ? 12 : 6}>
                        <Typography variant="body2" color="text.secondary">Phone</Typography>
                        <Typography variant="body1" sx={{ wordBreak: 'break-word' }}>
                          {userDetails.form_data.personal.phone || 'Not provided'}
                        </Typography>
                      </Grid>
                    </Grid>
                  </Box>
                ) : (
                  <Typography variant="body1" sx={{ mb: 2 }}>
                    You haven't filled in your personal details yet.
                  </Typography>
                )}
                
                <Box sx={{ mt: 3, display: 'flex', justifyContent: isMobile ? 'center' : 'flex-end' }}>
                  <Button 
                    variant="contained" 
                    fullWidth={isMobile}
                    startIcon={isPersonalDetailsFilled() ? <EditIcon /> : <AddIcon />}
                    onClick={handleEditDetails}
                    sx={{
                      backgroundColor: '#633394',
                      '&:hover': {
                        backgroundColor: '#967CB2',
                      }
                    }}
                  >
                    {isPersonalDetailsFilled() ? 'Edit Details' : 'Fill Details'}
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>
    </>
  );
};

// Main UserDashboard Component
const UserDashboard = () => {
  const [userRole, setUserRole] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const role = localStorage.getItem('userRole');
    setUserRole(role);
    
    // If no role is found, redirect to login
    if (!role) {
      navigate('/login');
    }
  }, [navigate]);

  // Show loading while determining user role
  if (!userRole) {
    return (
      <>
        <Navbar />
        <Container maxWidth="xl" sx={{ mt: 4 }}>
          <Typography variant="h6">Loading...</Typography>
        </Container>
      </>
    );
  }

  // Always show the HomeComponent for UserDashboard
  return <HomeComponent />;
};

export default UserDashboard;
