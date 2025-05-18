import React from 'react';
import { Button, Typography, Box, Paper, Grid, Divider, CircularProgress, useMediaQuery, useTheme } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

const SubmitPage = ({ formData, submitForm, goBack, isSaving }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { personal, organizational } = formData;
  
  return (
    <Box sx={{ px: isMobile ? 1 : 2 }}>
      <Typography variant="h5" component="h2" gutterBottom>
        Review and Submit
      </Typography>
      
      <Typography variant="body1" paragraph>
        Please review your information before submitting.
      </Typography>
      
      <Grid container spacing={isMobile ? 2 : 3}>
        <Grid item xs={12} md={6}>
          <Paper elevation={1} sx={{ p: 2, mb: 2, backgroundColor: 'white' }}>
            <Typography variant="h6" gutterBottom>
              Personal Details
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            <Box sx={{ mb: 1 }}>
              <Typography variant="subtitle2" color="text.secondary">
                First Name
              </Typography>
              <Typography variant="body1">
                {personal.firstName}
              </Typography>
            </Box>
            
            <Box sx={{ mb: 1 }}>
              <Typography variant="subtitle2" color="text.secondary">
                Last Name
              </Typography>
              <Typography variant="body1">
                {personal.lastName}
              </Typography>
            </Box>
            
            <Box sx={{ mb: 1 }}>
              <Typography variant="subtitle2" color="text.secondary">
                Email
              </Typography>
              <Typography variant="body1" sx={{ wordBreak: 'break-word' }}>
                {personal.email || 'Not provided'}
              </Typography>
            </Box>
            
            <Box sx={{ mb: 1 }}>
              <Typography variant="subtitle2" color="text.secondary">
                Phone
              </Typography>
              <Typography variant="body1">
                {personal.phone || 'Not provided'}
              </Typography>
            </Box>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Paper elevation={1} sx={{ p: 2, mb: 2, backgroundColor: 'white' }}>
            <Typography variant="h6" gutterBottom>
              Organizational Details
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            <Box sx={{ mb: 1 }}>
              <Typography variant="subtitle2" color="text.secondary">
                Country
              </Typography>
              <Typography variant="body1">
                {organizational.country}
              </Typography>
            </Box>
            
            <Box sx={{ mb: 1 }}>
              <Typography variant="subtitle2" color="text.secondary">
                Region
              </Typography>
              <Typography variant="body1">
                {organizational.region}
              </Typography>
            </Box>
            
            <Box sx={{ mb: 1 }}>
              <Typography variant="subtitle2" color="text.secondary">
                Church
              </Typography>
              <Typography variant="body1">
                {organizational.church}
              </Typography>
            </Box>
            
            <Box sx={{ mb: 1 }}>
              <Typography variant="subtitle2" color="text.secondary">
                School
              </Typography>
              <Typography variant="body1">
                {organizational.school}
              </Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>
      
      <Box sx={{ 
        display: 'flex', 
        flexDirection: isMobile ? 'column' : 'row', 
        justifyContent: isMobile ? 'center' : 'space-between', 
        alignItems: 'center',
        mt: isMobile ? 3 : 4,
        gap: isMobile ? 2 : 0
      }}>
        <Button 
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={goBack}
          disabled={isSaving}
          fullWidth={isMobile}
          sx={{
            color: '#8a94e3',
            borderColor: '#8a94e3',
            '&:hover': {
              backgroundColor: '#f0f2ff',
              borderColor: '#6a74c3',
            },
            order: isMobile ? 2 : 1
          }}
        >
          Back
        </Button>
        
        <Button 
          variant="contained"
          color="primary"
          onClick={submitForm}
          disabled={isSaving}
          fullWidth={isMobile}
          startIcon={isSaving ? <CircularProgress size={20} /> : <CheckCircleIcon />}
          sx={{ 
            backgroundColor: '#4caf50',
            '&:hover': {
              backgroundColor: '#388e3c',
            },
            order: isMobile ? 1 : 2
          }}
        >
          {isSaving ? 'Submitting...' : 'Submit Form'}
        </Button>
      </Box>
    </Box>
  );
};

export default SubmitPage;
