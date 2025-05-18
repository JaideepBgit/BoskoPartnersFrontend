import React from 'react';
import { TextField, Button, Typography, Box, Grid, IconButton, CircularProgress, useMediaQuery, useTheme } from '@mui/material';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';

const PersonalDetailsPage = ({ formData, updateFormData, saveAndContinue, saveAndExit, formErrors, isSaving }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const handleChange = (e) => {
    updateFormData('personal', e.target.name, e.target.value);
  };

  return (
    <Box sx={{ px: isMobile ? 1 : 2 }}>
      <Typography variant="h5" component="h2" gutterBottom>
        Personal Details
      </Typography>
      
      <Grid container spacing={isMobile ? 2 : 3} direction="column">
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
            size={isMobile ? "small" : "medium"}
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
            size={isMobile ? "small" : "medium"}
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
            size={isMobile ? "small" : "medium"}
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
            size={isMobile ? "small" : "medium"}
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
          <Box sx={{
            display: 'flex', 
            flexDirection: isMobile ? 'column' : 'row',
            justifyContent: isMobile ? 'center' : 'space-between', 
            alignItems: 'center',
            mt: 2,
            gap: isMobile ? 2 : 0
          }}>
            {!isMobile && <Box sx={{ width: 40 }} />}

            <Button 
              variant="outlined"
              disabled={isSaving}
              fullWidth={isMobile}
              sx={{
                color: 'black',
                borderColor: '#ccc',
                backgroundColor: 'white',
                '&:hover': {
                  backgroundColor: '#f5f5f5',
                  borderColor: '#999',
                },
                borderRadius: '4px',
                padding: isMobile ? '8px 16px' : '10px 20px',
                order: isMobile ? 2 : 1
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
                order: isMobile ? 1 : 2,
                width: isMobile ? '100%' : 'auto',
                borderRadius: isMobile ? '4px' : '50%',
                padding: isMobile ? '8px' : '12px'
              }}
            >
              {isSaving ? 
                <CircularProgress size={24} color="inherit" /> : 
                <>
                  {isMobile && "Continue"}
                  <ArrowForwardIcon />
                </>
              }
            </IconButton>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
};

export default PersonalDetailsPage;
