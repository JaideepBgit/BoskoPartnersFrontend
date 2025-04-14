import React from 'react';
import { TextField, Button, Typography, Box, Grid, IconButton, CircularProgress } from '@mui/material';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';

const PersonalDetailsPage = ({ formData, updateFormData, saveAndContinue, saveAndExit, formErrors, isSaving }) => {
  const handleChange = (e) => {
    updateFormData('personal', e.target.name, e.target.value);
  };

  return (
    <Box>
      <Typography variant="h5" component="h2" gutterBottom>
        Personal Details
      </Typography>
      
      <Grid container spacing={3} direction="column">
        <Grid item xs={12}>
          <TextField
            fullWidth
            name="firstName"
            label="First Name"
            variant="outlined"
            value={formData.personal.firstName || ''}
            onChange={handleChange}
            required
            error={!!formErrors.firstName}
            helperText={formErrors.firstName}
            sx={{ 
              backgroundColor: 'white',
              '& .MuiOutlinedInput-root': {
                '& fieldset': {
                  borderColor: 'white',
                },
              }
            }}
          />
        </Grid>
        
        <Grid item xs={12}>
          <TextField
            fullWidth
            name="lastName"
            label="Last Name"
            variant="outlined"
            value={formData.personal.lastName || ''}
            onChange={handleChange}
            required
            error={!!formErrors.lastName}
            helperText={formErrors.lastName}
            sx={{ 
              backgroundColor: 'white',
              '& .MuiOutlinedInput-root': {
                '& fieldset': {
                  borderColor: 'white',
                },
              }
            }}
          />
        </Grid>
        
        <Grid item xs={12}>
          <TextField
            fullWidth
            name="email"
            label="Email Address (Optional)"
            variant="outlined"
            type="email"
            value={formData.personal.email || ''}
            onChange={handleChange}
            error={!!formErrors.email}
            helperText={formErrors.email}
            sx={{ 
              backgroundColor: 'white',
              '& .MuiOutlinedInput-root': {
                '& fieldset': {
                  borderColor: 'white',
                },
              }
            }}
          />
        </Grid>
        
        <Grid item xs={12}>
          <TextField
            fullWidth
            name="phone"
            label="Phone Number (Optional)"
            variant="outlined"
            type="tel"
            value={formData.personal.phone || ''}
            onChange={handleChange}
            error={!!formErrors.phone}
            helperText={formErrors.phone}
            sx={{ 
              backgroundColor: 'white',
              '& .MuiOutlinedInput-root': {
                '& fieldset': {
                  borderColor: 'white',
                },
              }
            }}
          />
        </Grid>
        
        <Grid item xs={12}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
            <Box sx={{ width: 40 }} />

            <Button 
              variant="outlined"
              disabled={isSaving}
              sx={{
                color: 'black',
                borderColor: '#ccc',
                backgroundColor: 'white',
                '&:hover': {
                  backgroundColor: '#f5f5f5',
                  borderColor: '#999',
                },
                borderRadius: '4px',
                padding: '10px 20px',
              }}
              onClick={saveAndExit}
            >
              {isSaving ? (
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <CircularProgress size={20} sx={{ mr: 1 }} />
                  Saving...
                </Box>
              ) : (
                'Save & Exit'
              )}
            </Button>
            
            <IconButton 
              color="primary" 
              onClick={saveAndContinue}
              disabled={isSaving}
              sx={{ 
                backgroundColor: '#8a94e3',
                color: 'white',
                '&:hover': {
                  backgroundColor: '#6a74c3',
                },
              }}
            >
              {isSaving ? <CircularProgress size={24} color="inherit" /> : <ArrowForwardIcon />}
            </IconButton>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
};

export default PersonalDetailsPage;
