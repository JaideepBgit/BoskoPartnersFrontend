import React from 'react';
import { TextField, Button, Typography, Box, Grid, MenuItem, Select, FormControl, InputLabel, FormHelperText, IconButton, CircularProgress } from '@mui/material';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

const OrganizationalDetailsPage = ({ formData, updateFormData, saveAndContinue, saveAndExit, formErrors, setCurrentPage, isSaving }) => {
  const handleChange = (e) => {
    updateFormData('organizational', e.target.name, e.target.value);
  };
  
  const goToPreviousPage = () => {
    setCurrentPage(1); // Go back to Personal Details page
  };
  
  const countries = ['United States', 'Canada', 'Mexico', 'United Kingdom', 'Australia'];
  const regions = ['North', 'South', 'East', 'West', 'Central'];
  
  return (
    <Box>
      <Typography variant="h5" component="h2" gutterBottom>
        Organizational Details
      </Typography>
      
      <Grid container spacing={3} direction="column">
        <Grid item xs={12}>
          <FormControl 
            fullWidth 
            required 
            error={!!formErrors.country}
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
            <IconButton 
              color="primary" 
              onClick={goToPreviousPage}
              disabled={isSaving}
              sx={{ 
                backgroundColor: '#8a94e3',
                color: 'white',
                '&:hover': {
                  backgroundColor: '#6a74c3',
                },
              }}
            >
              {isSaving ? <CircularProgress size={24} color="inherit" /> : <ArrowBackIcon />}
            </IconButton>
            
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

export default OrganizationalDetailsPage;
