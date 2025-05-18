import React from 'react';
import { TextField, Button, Typography, Box, Grid, MenuItem, Select, FormControl, InputLabel, FormHelperText, IconButton, CircularProgress, useMediaQuery, useTheme } from '@mui/material';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

const OrganizationalDetailsPage = ({ formData, updateFormData, saveAndContinue, saveAndExit, formErrors, goBack, isSaving }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const handleChange = (e) => {
    updateFormData('organizational', e.target.name, e.target.value);
  };
  
  const countries = ['United States', 'Canada', 'Mexico', 'United Kingdom', 'Australia'];
  const regions = ['North', 'South', 'East', 'West', 'Central'];
  
  return (
    <Box sx={{ px: isMobile ? 1 : 2 }}>
      <Typography variant="h5" component="h2" gutterBottom>
        Organizational Details
      </Typography>
      
      <Grid container spacing={isMobile ? 2 : 3} direction="column">
        <Grid item xs={12}>
          <FormControl 
            fullWidth 
            required 
            error={!!formErrors.country}
            size={isMobile ? "small" : "medium"}
            sx={{ 
              backgroundColor: 'white',
              '& .MuiOutlinedInput-root': {
                '& fieldset': {
                  borderColor: 'white',
                },
              }
            }}
          >
            <InputLabel id="country-label">Country</InputLabel>
            <Select
              labelId="country-label"
              id="country"
              name="country"
              value={formData.organizational.country || ''}
              label="Country"
              onChange={handleChange}
            >
              {countries.map((country) => (
                <MenuItem key={country} value={country}>{country}</MenuItem>
              ))}
            </Select>
            {formErrors.country && <FormHelperText>{formErrors.country}</FormHelperText>}
          </FormControl>
        </Grid>
        
        <Grid item xs={12}>
          <FormControl 
            fullWidth 
            required 
            error={!!formErrors.region}
            size={isMobile ? "small" : "medium"}
            sx={{ 
              backgroundColor: 'white',
              '& .MuiOutlinedInput-root': {
                '& fieldset': {
                  borderColor: 'white',
                },
              }
            }}
          >
            <InputLabel id="region-label">Region</InputLabel>
            <Select
              labelId="region-label"
              id="region"
              name="region"
              value={formData.organizational.region || ''}
              label="Region"
              onChange={handleChange}
            >
              {regions.map((region) => (
                <MenuItem key={region} value={region}>{region}</MenuItem>
              ))}
            </Select>
            {formErrors.region && <FormHelperText>{formErrors.region}</FormHelperText>}
          </FormControl>
        </Grid>
        
        <Grid item xs={12}>
          <TextField
            fullWidth
            name="church"
            label="Church"
            variant="outlined"
            value={formData.organizational.church || ''}
            onChange={handleChange}
            required
            error={!!formErrors.church}
            helperText={formErrors.church}
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
            name="school"
            label="School"
            variant="outlined"
            value={formData.organizational.school || ''}
            onChange={handleChange}
            required
            error={!!formErrors.school}
            helperText={formErrors.school}
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
            <IconButton 
              color="primary" 
              onClick={goBack}
              disabled={isSaving}
              sx={{ 
                backgroundColor: '#8a94e3',
                color: 'white',
                '&:hover': {
                  backgroundColor: '#6a74c3',
                },
                order: 1,
                width: isMobile ? '100%' : 'auto',
                borderRadius: isMobile ? '4px' : '50%',
                padding: isMobile ? '8px' : '12px'
              }}
            >
              {isSaving ? 
                <CircularProgress size={24} color="inherit" /> : 
                <>
                  {isMobile && "Back"}
                  <ArrowBackIcon />
                </>
              }
            </IconButton>
            
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
                order: isMobile ? 3 : 2
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
                order: isMobile ? 2 : 3,
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

export default OrganizationalDetailsPage;
