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
  useTheme,
  LinearProgress,
  Badge
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import Navbar from '../shared/Navbar/Navbar';
import { getUserDetailsStatus } from '../../services/UserDetails/UserDetailsService';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import AssignmentIcon from '@mui/icons-material/Assignment';
import PendingIcon from '@mui/icons-material/Pending';
import axios from 'axios';

// Home Component - This will be the default landing page for non-admin users
const HomeComponent = () => {
  const [userDetails, setUserDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [surveyAssignments, setSurveyAssignments] = useState([]);
  const [surveyLoading, setSurveyLoading] = useState(false);
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const userRole = localStorage.getItem('userRole');

  // Get user ID from localStorage (set during login)
  const userId = parseInt(localStorage.getItem('userId') || '0', 10);
  const surveyCode = localStorage.getItem('surveyCode');

  const fetchSurveyAssignments = async () => {
    try {
      setSurveyLoading(true);
      const response = await axios.get(`/api/users/${userId}/survey-assignments`);
      const data = response.data || {};
      setSurveyAssignments(Array.isArray(data.assignments) ? data.assignments : []);
      setSurveyLoading(false);
    } catch (err) {
      console.error('Error fetching survey assignments:', err);
      setSurveyAssignments([]);
      setSurveyLoading(false);
    }
  };

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
      fetchSurveyAssignments();
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

  const handleStartSurvey = () => {
    navigate('/surveys');
  };

  const getSurveyStats = () => {
    const total = surveyAssignments.length;
    const completed = surveyAssignments.filter(s => s.status === 'completed').length;
    const pending = total - completed;
    return { total, completed, pending };
  };

  // Consider the user details "Completed" when both sections are filled OR backend says submitted
  const isUserDetailsCompleted = () => {
    if (!userDetails) return false;
    return !!(
      (userDetails.personal_details_filled && userDetails.organizational_details_filled) ||
      userDetails.is_submitted
    );
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
        <Box sx={{ mb: isMobile ? 3 : 4 }}>
          <Typography
            variant={isMobile ? "h4" : "h3"}
            component="h1"
            gutterBottom
            sx={{ fontWeight: 'bold', mb: 2, color: '#633394' }}
          >
            Welcome{userDetails && userDetails.form_data && userDetails.form_data.personal &&
              userDetails.form_data.personal.firstName ?
              `, ${userDetails.form_data.personal.firstName}!` :
              '!'}
          </Typography>

          <Typography
            variant={isMobile ? "h6" : "h5"}
            sx={{ mb: 2, color: '#666', fontWeight: 400 }}
          >
            Your Research Participation Dashboard
          </Typography>

          <Typography
            variant="body1"
            sx={{ mb: 2, color: 'text.secondary', lineHeight: 1.6 }}
          >
            Thank you for participating in our important research initiative. This dashboard helps you manage your
            profile information and access your assigned surveys. Your contributions make a meaningful difference
            in our community research efforts.
          </Typography>

          <Typography
            variant="body2"
            sx={{ color: '#633394', fontWeight: 500 }}
          >
            Complete your profile details below, then navigate to the Surveys tab to begin your research participation.
          </Typography>
        </Box>

        {error && (
          <Box sx={{ mb: isMobile ? 2 : 3 }}>
            <Typography color="error">{error}</Typography>
          </Box>
        )}

        <Grid container spacing={isMobile ? 2 : 3}>
          {/* Personal Details Card */}
          <Grid item xs={12}>
            <Card sx={{
              backgroundColor: '#FFFFFF',
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
                    👤 Personal Information
                  </Typography>
                  <Chip
                    icon={isUserDetailsCompleted() ? <CheckCircleIcon /> : <ErrorIcon />}
                    label={isUserDetailsCompleted() ? "Completed" : "Not Completed"}
                    color={isUserDetailsCompleted() ? "success" : "error"}
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
                  <Box sx={{ textAlign: 'center', py: 3 }}>
                    <Typography variant="body1" sx={{ mb: 2, color: 'text.secondary' }}>
                      📝 Let's get started by adding your personal information
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#666' }}>
                      This information helps us personalize your research experience and ensures we can contact you if needed.
                    </Typography>
                  </Box>
                )}

                <Box sx={{ mt: 3, display: 'flex', justifyContent: isMobile ? 'center' : 'flex-end' }}>
                  <Button
                    variant="contained"
                    fullWidth={isMobile}
                    startIcon={isUserDetailsCompleted() ? <EditIcon /> : <AddIcon />}
                    onClick={handleEditDetails}
                    sx={{
                      backgroundColor: '#633394',
                      '&:hover': {
                        backgroundColor: '#967CB2',
                      }
                    }}
                  >
                    {isUserDetailsCompleted() ? 'Edit Details' : 'Fill Details'}
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Survey Status Card - Only show when personal details are completed */}
          {isUserDetailsCompleted() && (
            <Grid item xs={12}>
              <Card
                elevation={3}
                sx={{
                  backgroundColor: '#f8f9fa',
                  border: '2px solid #633394',
                  borderRadius: '12px',
                  boxShadow: '0 6px 12px rgba(99, 51, 148, 0.15)'
                }}
              >
                <CardContent sx={{ p: isMobile ? 2 : 3 }}>
                  {surveyLoading ? (
                    <Box sx={{ textAlign: 'center', py: 3 }}>
                      <CircularProgress size={40} sx={{ color: '#633394' }} />
                      <Typography variant="body1" sx={{ mt: 2, color: '#666' }}>
                        Loading your survey assignments...
                      </Typography>
                    </Box>
                  ) : surveyAssignments.length === 0 ? (
                    <Box sx={{ textAlign: 'center', py: 3 }}>
                      <PendingIcon
                        sx={{
                          fontSize: isMobile ? 40 : 48,
                          color: '#666',
                          mb: 2
                        }}
                      />
                      <Typography
                        variant={isMobile ? "h6" : "h5"}
                        component="h3"
                        gutterBottom
                        sx={{
                          fontWeight: 'bold',
                          color: '#666',
                          mb: 2
                        }}
                      >
                        No Surveys Assigned Yet
                      </Typography>
                      <Typography
                        variant="body1"
                        color="text.secondary"
                        paragraph
                      >
                        Your surveys will appear here once they are assigned by your administrator.
                        Please check back later or contact your administrator if you believe this is an error.
                      </Typography>
                    </Box>
                  ) : (
                    <>
                      {/* Survey Statistics Header */}
                      <Box sx={{ textAlign: 'center', mb: 3 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', mb: 2 }}>
                          <AssignmentIcon
                            sx={{
                              fontSize: isMobile ? 40 : 48,
                              color: '#633394',
                              mr: 1
                            }}
                          />
                          <Badge
                            badgeContent={getSurveyStats().total}
                            color="primary"
                            sx={{
                              '& .MuiBadge-badge': {
                                backgroundColor: '#633394',
                                color: 'white'
                              }
                            }}
                          >
                            <Box />
                          </Badge>
                        </Box>

                        <Typography
                          variant={isMobile ? "h6" : "h5"}
                          component="h3"
                          gutterBottom
                          sx={{
                            fontWeight: 'bold',
                            color: '#633394',
                            mb: 2
                          }}
                        >
                          Your Survey Progress
                        </Typography>

                        {/* Progress Summary */}
                        <Box sx={{
                          display: 'grid',
                          gridTemplateColumns: { xs: '1fr 1fr', sm: 'repeat(3, 1fr)' },
                          gap: 2,
                          mb: 3
                        }}>
                          <Box sx={{ textAlign: 'center', p: 2, backgroundColor: '#fff', borderRadius: '8px' }}>
                            <Typography variant="h6" sx={{ color: '#633394', fontWeight: 'bold' }}>
                              {getSurveyStats().total}
                            </Typography>
                            <Typography variant="body2" sx={{ color: '#666' }}>
                              Total Assigned
                            </Typography>
                          </Box>

                          <Box sx={{ textAlign: 'center', p: 2, backgroundColor: '#fff', borderRadius: '8px' }}>
                            <Typography variant="h6" sx={{ color: '#633394', fontWeight: 'bold' }}>
                              {getSurveyStats().completed}
                            </Typography>
                            <Typography variant="body2" sx={{ color: '#666' }}>
                              Completed
                            </Typography>
                          </Box>

                          <Box sx={{ textAlign: 'center', p: 2, backgroundColor: '#fff', borderRadius: '8px' }}>
                            <Typography variant="h6" sx={{ color: '#633394', fontWeight: 'bold' }}>
                              {getSurveyStats().pending}
                            </Typography>
                            <Typography variant="body2" sx={{ color: '#666' }}>
                              Pending
                            </Typography>
                          </Box>
                        </Box>

                        {/* Status Message */}
                        <Typography
                          variant="body1"
                          color="text.secondary"
                          paragraph
                          sx={{ mb: 3 }}
                        >
                          {getSurveyStats().completed === getSurveyStats().total
                            ? "🎉 Congratulations! You have completed all your assigned surveys. You can review them anytime in the Surveys tab."
                            : getSurveyStats().completed > 0
                              ? `Great progress! You've completed ${getSurveyStats().completed} out of ${getSurveyStats().total} surveys. Continue with the remaining ${getSurveyStats().pending} survey${getSurveyStats().pending !== 1 ? 's' : ''}.`
                              : `You have ${getSurveyStats().total} survey${getSurveyStats().total !== 1 ? 's' : ''} assigned. Click below to get started with your research participation.`
                          }
                        </Typography>
                      </Box>

                      {/* Action Button */}
                      <Box sx={{ textAlign: 'center' }}>
                        <Button
                          variant="contained"
                          size="large"
                          startIcon={getSurveyStats().completed === getSurveyStats().total ? <CheckCircleIcon /> : <PlayArrowIcon />}
                          onClick={handleStartSurvey}
                          fullWidth={isMobile}
                          sx={{
                            backgroundColor: '#633394',
                            color: 'white',
                            px: isMobile ? 2 : 4,
                            py: 1.5,
                            fontSize: isMobile ? '1rem' : '1.1rem',
                            fontWeight: 'bold',
                            borderRadius: '8px',
                            '&:hover': {
                              backgroundColor: '#4a2570',
                            }
                          }}
                        >
                          {getSurveyStats().completed === getSurveyStats().total
                            ? 'Review Completed Surveys'
                            : getSurveyStats().completed > 0
                              ? 'Continue Surveys'
                              : 'Start Your Surveys'
                          }
                        </Button>
                      </Box>
                    </>
                  )}
                </CardContent>
              </Card>
            </Grid>
          )}
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
