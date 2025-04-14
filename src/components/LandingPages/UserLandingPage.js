// components/UserLandingPage.js
import React, { useState } from 'react';
import { AppBar, Toolbar, Typography, Button, Container, TextField, Box, Card, CardContent, Snackbar, Alert } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import LogoutIcon from '@mui/icons-material/Logout';
import { validateSurveyCode } from '../../services/survey/surveyService';
const UserLandingPage = () => {
  const [surveyCode, setSurveyCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const logoImage = process.env.PUBLIC_URL + '/assets/Bosko_Partners_logo.jpg';

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/login');
  };

  const handleEnterSurvey = async () => {
    if (!surveyCode.trim()) {
      setError('Please enter a survey code');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await validateSurveyCode(surveyCode);
      // If validation successful, navigate to survey page
      navigate(`/survey/${surveyCode}`);
    } catch (err) {
      setError(err.message || 'Invalid survey code');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <AppBar position="static" sx={{ backgroundColor: '#633394'}}>
        <Toolbar>
          <Box sx={{flexGrow: 1 , mb: 0.5, mt: 0.5}}>
            <img src={logoImage} alt="Bosko Partners Logo" style={{ maxWidth: '150px' }}/>
          </Box>
          <Button color="inherit" onClick={handleLogout} startIcon={<LogoutIcon/>}>Logout</Button>
        </Toolbar>
      </AppBar>
      <Container 
        sx={{ 
          mt: 4,
          width: '400px',
          height: '400px',
          display: 'flex'
        }}
      >
        <Card sx={{width: '100%', height: '100%'}}>
          <CardContent>
            <Typography variant="h4" align="center" gutterBottom>
              Welcome!
            </Typography>
            <Typography variant="subtitle1" align="center" gutterBottom>
              Enter your survey code
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mt: 2 }}>
              <TextField
                label="Survey Code"
                variant="outlined"
                value={surveyCode}
                onChange={(e) => setSurveyCode(e.target.value)}
                sx={{ mb: 2, width: '300px' }}
              />
              <Button 
                variant="contained" 
                onClick={handleEnterSurvey}
                disabled={loading}
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
