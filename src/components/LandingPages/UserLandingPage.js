// components/UserLandingPage.js
import React, { useState, useEffect } from 'react';
import { Container, TextField, Box, Card, CardContent, Snackbar, Alert, Button, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import Navbar from '../shared/Navbar/Navbar';
import { validateSurveyCode } from '../../services/survey/surveyService';

const UserLandingPage = () => {
  const [surveyCode, setSurveyCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Remove the useEffect that pre-fills survey code
  // Users should always enter their survey code manually
  useEffect(() => {
    // No longer pre-filling survey code
    console.log('UserLandingPage loaded - users must enter survey code manually');
  }, [navigate]);

  const handleEnterSurvey = async () => {
    console.log('Attempting to validate survey code:', surveyCode);

    if (!surveyCode.trim()) {
      setError('Please enter a survey code');
      return;
    }

    setLoading(true);
    setError('');

    try {
      console.log('Calling validateSurveyCode with:', surveyCode);
      const { survey } = await validateSurveyCode(surveyCode);
      console.log('Survey validation successful:', survey);

      // Store the validated survey code and redirect to user profile
      localStorage.setItem('surveyCode', surveyCode);
      console.log('Redirecting to user profile...');
      navigate('/profile');
    } catch (err) {
      console.error('Survey validation failed:', err);
      setError(err.message || 'Invalid survey code');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        backgroundColor: 'white',
        minHeight: '100vh',
        position: 'relative'
      }}
    >
      <Navbar />
      <Container
        sx={{
          pt: 4,
          pb: 4,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: 'calc(100vh - 80px)',
          position: 'relative',
          zIndex: 1
        }}
      >
        <Card sx={{
          width: '500px',
          minHeight: '450px',
          backgroundColor: '#f5f5f5',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
          borderRadius: 3,
          border: '1px solid #e0e0e0'
        }}>
          <CardContent sx={{ padding: '2rem' }}>
            <Typography variant="h4" align="center" gutterBottom sx={{ fontWeight: 'bold', mb: 3, color: '#212121' }}>
              Welcome!
            </Typography>
            <Typography variant="h6" align="center" gutterBottom sx={{ mb: 3 }}>
              Enter your survey code to get started
            </Typography>
            <Typography variant="body2" align="center" gutterBottom sx={{ mb: 3, color: 'text.secondary' }}>
              Please enter the survey code provided in your welcome email or by your administrator.
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mt: 2 }}>
              <TextField
                label="Survey Code"
                variant="outlined"
                value={surveyCode}
                onChange={(e) => setSurveyCode(e.target.value)}
                sx={{
                  mb: 3,
                  width: '100%',
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': {
                      borderColor: '#633394',
                    },
                    '&:hover fieldset': {
                      borderColor: '#967CB2',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#633394',
                    },
                  },
                }}
              />
              <Button
                variant="contained"
                onClick={handleEnterSurvey}
                disabled={loading}
                sx={{
                  backgroundColor: '#633394',
                  '&:hover': {
                    backgroundColor: '#967CB2',
                  },
                  padding: '10px 24px',
                  fontSize: '1rem',
                  width: '200px'
                }}
              >
                {loading ? 'Validating...' : 'Enter Survey'}
              </Button>
              <Snackbar
                open={!!error}
                autoHideDuration={6000}
                onClose={() => setError('')}
              >
                <Alert severity="error" onClose={() => setError('')}>
                  {error}
                </Alert>
              </Snackbar>
            </Box>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
};

export default UserLandingPage;
