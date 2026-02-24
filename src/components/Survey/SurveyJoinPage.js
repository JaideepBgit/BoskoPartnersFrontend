import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Box, CircularProgress, Typography, Button, Alert } from '@mui/material';
import axios from 'axios';

const SurveyJoinPage = () => {
  const { surveyId } = useParams();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';

  useEffect(() => {
    if (!isAuthenticated) {
      // Save intent and redirect to login
      localStorage.setItem('pendingSurveyJoin', JSON.stringify({ surveyId }));
      navigate('/login', { replace: true });
      return;
    }

    // Authenticated — resolve the assignment and navigate to survey intro
    resolveAndJoin();
  }, [isAuthenticated, surveyId]);

  const resolveAndJoin = async () => {
    try {
      const userId = parseInt(localStorage.getItem('userId') || '0', 10);
      const user = JSON.parse(localStorage.getItem('user') || '{}');

      if (!userId) {
        setError('User not found. Please log in again.');
        return;
      }

      // Call the V2 join endpoint — auto-creates assignment if needed
      const response = await axios.post(`/api/v2/surveys/${surveyId}/join`, {
        user_id: userId,
      });

      const data = response.data;

      // Clear the pending join
      localStorage.removeItem('pendingSurveyJoin');

      // Navigate to survey intro with V2 survey state
      navigate('/survey/intro', {
        replace: true,
        state: {
          survey: {
            id: data.id,                         // SurveyResponseV2 id
            survey_id: data.survey_id,           // SurveyV2 id
            survey_code: data.survey_name,       // display name
            template_name: data.survey_name,
            organization_type: 'Survey',
            user_id: userId,
            username: user.username,
            email: user.email,
            organization_id: data.organization_id || user.organization_id,
            role: user.role,
          }
        }
      });
    } catch (err) {
      console.error('Error joining survey:', err);
      const msg = err.response?.data?.error || 'Failed to join survey. Please try again.';
      setError(msg);
      localStorage.removeItem('pendingSurveyJoin');
    }
  };

  if (error) {
    return (
      <Container maxWidth="sm" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <Box sx={{ textAlign: 'center' }}>
          <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>
          <Button
            variant="contained"
            onClick={() => navigate('/surveys')}
            sx={{
              backgroundColor: '#633394',
              '&:hover': { backgroundColor: '#967CB2' },
              textTransform: 'none',
            }}
          >
            Go to My Surveys
          </Button>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="sm" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
      <Box sx={{ textAlign: 'center' }}>
        <CircularProgress sx={{ color: '#633394', mb: 3 }} size={48} />
        <Typography variant="h6" sx={{ color: '#212121', fontWeight: 600 }}>
          Joining survey...
        </Typography>
        <Typography variant="body2" sx={{ color: '#757575', mt: 1 }}>
          Please wait while we set up your survey.
        </Typography>
      </Box>
    </Container>
  );
};

export default SurveyJoinPage;
