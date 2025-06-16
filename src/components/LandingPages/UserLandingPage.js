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

  // Check if user already has a survey code in localStorage
  useEffect(() => {
    const existingSurveyCode = localStorage.getItem('surveyCode');
    const userId = localStorage.getItem('userId');
    
    if (existingSurveyCode && userId) {
      // Redirect to dashboard if user already has a survey code
      navigate('/dashboard');
    }
  }, [navigate]);

  const handleEnterSurvey = async () => {
    if (!surveyCode.trim()) {
      setError('Please enter a survey code');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const {survey} = await validateSurveyCode(surveyCode);
      // pass the code (or entire survey) via location state
      navigate('/form', { state: { survey } });
    } catch (err) {
      setError(err.message || 'Invalid survey code');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        background: 'linear-gradient(135deg, #3B1C55 0%, #633394 25%, #61328E 50%, #967CB2 75%, #FBFAFA 100%)',
        minHeight: '100vh',
        position: 'relative',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'radial-gradient(ellipse at top left, rgba(59, 28, 85, 0.1) 0%, transparent 50%), radial-gradient(ellipse at bottom right, rgba(150, 124, 178, 0.1) 0%, transparent 50%)',
          pointerEvents: 'none'
        }
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
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
          boxShadow: '0 20px 40px rgba(59, 28, 85, 0.15)',
          borderRadius: 3,
          border: '1px solid rgba(255, 255, 255, 0.2)'
        }}>
          <CardContent sx={{ padding: '2rem' }}>
            <Typography variant="h4" align="center" gutterBottom sx={{ fontWeight: 'bold', mb: 3 }}>
              Welcome!
            </Typography>
            <Typography variant="h6" align="center" gutterBottom sx={{ mb: 3 }}>
              Enter your survey code
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
