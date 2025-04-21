// components/UserLandingPage.js
import React, { useState } from 'react';
import { Container, TextField, Box, Card, CardContent, Snackbar, Alert, Button, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import Navbar from '../shared/Navbar/Navbar';
import { validateSurveyCode } from '../../services/survey/surveyService';
const UserLandingPage = () => {
  const [surveyCode, setSurveyCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const logoImage = process.env.PUBLIC_URL + '/assets/SAURARA_logo.jpg';

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
    <>
      <Navbar />
      <Container 
        sx={{ 
          mt: 4,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center'
        }}
      >
        <Card sx={{
          width: '500px',
          minHeight: '450px',
          backgroundColor: '#f5f5f5',
          boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
          borderRadius: '8px'
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
    </>
  );
};

export default UserLandingPage;
