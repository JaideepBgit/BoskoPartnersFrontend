import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Typography, 
  Box, 
  Card, 
  CardContent, 
  Button, 
  CircularProgress,
  Alert,
  Chip
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import Navbar from '../shared/Navbar/Navbar';
import AssignmentIcon from '@mui/icons-material/Assignment';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';

const SurveysPage = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  
  // Get user data from localStorage
  const userId = parseInt(localStorage.getItem('userId') || '0', 10);
  const surveyCode = localStorage.getItem('surveyCode');
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const handleStartSurvey = () => {
    if (surveyCode) {
      // Navigate to survey taking page with survey data
      navigate('/survey', { 
        state: { 
          survey: { 
            survey_code: surveyCode,
            id: user.id || userId,
            username: user.username,
            email: user.email,
            organization_id: user.organization_id,
            role: user.role
          } 
        } 
      });
    } else {
      setError('Survey code not found. Please contact your administrator.');
    }
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <Container sx={{ mt: 4, display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
          <CircularProgress />
        </Container>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Typography 
          variant="h4" 
          component="h1" 
          gutterBottom 
          sx={{ 
            color: '#633394', 
            fontWeight: 'bold',
            mb: 3
          }}
        >
          My Surveys
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {surveyCode ? (
            <Card 
              sx={{ 
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                borderRadius: 2,
                border: '1px solid #e0e0e0',
                '&:hover': {
                  boxShadow: '0 6px 16px rgba(0, 0, 0, 0.15)',
                  transform: 'translateY(-2px)',
                  transition: 'all 0.3s ease'
                }
              }}
            >
              <CardContent sx={{ p: 4 }}>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                  <AssignmentIcon 
                    sx={{ 
                      color: '#633394', 
                      fontSize: 40,
                      mt: 0.5
                    }} 
                  />
                  <Box sx={{ flex: 1 }}>
                    <Typography 
                      variant="h5" 
                      component="h2" 
                      gutterBottom
                      sx={{ 
                        color: '#333',
                        fontWeight: 600,
                        mb: 1
                      }}
                    >
                      2024.11.03 Health of Theol Edu (Church Survey)
                    </Typography>
                    
                    <Typography 
                      variant="body1" 
                      color="text.secondary"
                      sx={{ mb: 2, lineHeight: 1.6 }}
                    >
                      Assessing the effectiveness of Theological institutions in Africa through the lens of African churches.
                    </Typography>

                    <Box sx={{ display: 'flex', gap: 1, mb: 3, flexWrap: 'wrap' }}>
                      <Chip 
                        label="Church Survey" 
                        size="small" 
                        sx={{ 
                          backgroundColor: '#f3e5f5',
                          color: '#633394',
                          fontWeight: 500
                        }} 
                      />
                      <Chip 
                        label="47 Questions" 
                        size="small" 
                        variant="outlined"
                        sx={{ 
                          borderColor: '#633394',
                          color: '#633394'
                        }} 
                      />
                      <Chip 
                        label="2 Sections" 
                        size="small" 
                        variant="outlined"
                        sx={{ 
                          borderColor: '#633394',
                          color: '#633394'
                        }} 
                      />
                    </Box>

                    <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                      <Button
                        variant="contained"
                        startIcon={<PlayArrowIcon />}
                        onClick={handleStartSurvey}
                        sx={{
                          backgroundColor: '#633394',
                          '&:hover': { backgroundColor: '#7c52a5' },
                          px: 3,
                          py: 1,
                          borderRadius: 2,
                          textTransform: 'none',
                          fontWeight: 600,
                          fontSize: '1rem'
                        }}
                      >
                        Start Survey
                      </Button>
                      
                      <Box sx={{ ml: 2 }}>
                        <Typography variant="caption" color="text.secondary">
                          Survey Code: {surveyCode}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          ) : (
            <Card sx={{ textAlign: 'center', p: 4 }}>
              <CardContent>
                <AssignmentIcon 
                  sx={{ 
                    fontSize: 60, 
                    color: '#ccc', 
                    mb: 2 
                  }} 
                />
                <Typography variant="h6" gutterBottom>
                  No Surveys Available
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  You don't have any surveys assigned at the moment. Please contact your administrator if you believe this is an error.
                </Typography>
              </CardContent>
            </Card>
          )}
        </Box>
      </Container>
    </>
  );
};

export default SurveysPage; 