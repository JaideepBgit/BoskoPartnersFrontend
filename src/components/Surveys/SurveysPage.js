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
import axios from 'axios';

const SurveysPage = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [surveyTemplate, setSurveyTemplate] = useState(null);
  const navigate = useNavigate();
  
  // Get user data from localStorage
  const userId = parseInt(localStorage.getItem('userId') || '0', 10);
  const surveyCode = localStorage.getItem('surveyCode');
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    const fetchSurveyTemplate = async () => {
      try {
        const response = await axios.get('/api/survey-templates/available');
        
        if (response.data && response.data.length > 0) {
          // Use the first available template
          setSurveyTemplate(response.data[0]);
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching survey templates:', err);
        setError('Failed to load survey templates. Please try again later.');
        setLoading(false);
      }
    };

    fetchSurveyTemplate();
  }, []);

  const handleStartSurvey = async () => {
    try {
      if (!surveyTemplate) {
        setError('No survey template available.');
        return;
      }

      // Create a new survey response
      const response = await axios.post(`/api/templates/${surveyTemplate.id}/responses`, {
        user_id: userId,
        answers: {},
        status: 'pending'
      });

      // Navigate to survey taking page with survey data
      navigate('/survey', { 
        state: { 
          survey: { 
            id: response.data.id,
            template_id: surveyTemplate.id,
            survey_code: surveyTemplate.survey_code,
            template_name: surveyTemplate.version?.name,
            organization_type: surveyTemplate.version?.organization?.organization_type?.type,
            user_id: userId,
            username: user.username,
            email: user.email,
            organization_id: user.organization_id,
            role: user.role
          } 
        } 
      });
    } catch (error) {
      console.error('Error starting survey:', error);
      setError('Failed to start survey. Please try again.');
    }
  };

  const handleInitializeSurveyData = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await axios.post('/api/initialize-survey-data');
      
      if (response.status === 200 || response.status === 201) {
        // Refresh the survey templates after initialization
        const templatesResponse = await axios.get('/api/survey-templates/available');
        if (templatesResponse.data && templatesResponse.data.length > 0) {
          setSurveyTemplate(templatesResponse.data[0]);
        }
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error initializing survey data:', error);
      setError('Failed to initialize survey data. Please try again.');
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <Container sx={{ mt: 4, display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
          <CircularProgress sx={{ color: '#633394' }} />
        </Container>
      </>
    );
  }

  // Format the survey name and organization type from backend data
  const getSurveyDisplayName = () => {
    if (!surveyTemplate) return 'Survey Template';
    
    const templateName = surveyTemplate.version?.name || 'Survey Template';
    const orgType = surveyTemplate.version?.organization?.organization_type?.type || 'Survey';
    
    return `${templateName} (${orgType} Survey)`;
  };

  const getOrganizationType = () => {
    if (!surveyTemplate) return 'Survey';
    return surveyTemplate.version?.organization?.organization_type?.type || 'Survey';
  };

  const getQuestionCount = () => {
    return surveyTemplate?.questions_count || 0;
  };

  const getSectionCount = () => {
    return surveyTemplate?.sections_count || 0;
  };

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
          {surveyTemplate ? (
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
                  <Box sx={{ 
                    color: '#633394', 
                    fontSize: '2.5rem',
                    mt: 0.5
                  }}>
                    📋
                  </Box>
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
                      {getSurveyDisplayName()}
                    </Typography>
                    
                    <Typography 
                      variant="body1" 
                      color="text.secondary"
                      sx={{ mb: 2, lineHeight: 1.6 }}
                    >
                      {surveyTemplate.version?.description || 'Assessing the effectiveness of educational institutions through comprehensive survey analysis.'}
                    </Typography>

                    <Box sx={{ display: 'flex', gap: 1, mb: 3, flexWrap: 'wrap' }}>
                      <Chip 
                        label={`${getOrganizationType()} Survey`}
                        size="small" 
                        sx={{ 
                          backgroundColor: '#f3e5f5',
                          color: '#633394',
                          fontWeight: 500
                        }} 
                      />
                      <Chip 
                        label={`${getQuestionCount()} Questions`}
                        size="small" 
                        variant="outlined"
                        sx={{ 
                          borderColor: '#633394',
                          color: '#633394'
                        }} 
                      />
                      <Chip 
                        label={`${getSectionCount()} Sections`}
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
                        ▶ Start Survey
                      </Button>
                      
                      <Box sx={{ ml: 2 }}>
                        <Typography variant="caption" color="text.secondary">
                          Survey Code: {surveyTemplate.survey_code || surveyCode || 'N/A'}
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
                <Box sx={{ fontSize: '4rem', mb: 2 }}>📋</Box>
                <Typography variant="h6" gutterBottom>
                  No Surveys Available
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  You don't have any surveys assigned at the moment. Please contact your administrator if you believe this is an error.
                </Typography>
                <Button
                  variant="outlined"
                  onClick={handleInitializeSurveyData}
                  disabled={loading}
                  sx={{
                    borderColor: '#633394',
                    color: '#633394',
                    '&:hover': { 
                      borderColor: '#7c52a5',
                      backgroundColor: '#f3e5f5'
                    }
                  }}
                >
                  Initialize Sample Survey Data
                </Button>
              </CardContent>
            </Card>
          )}
        </Box>
      </Container>
    </>
  );
};

export default SurveysPage; 