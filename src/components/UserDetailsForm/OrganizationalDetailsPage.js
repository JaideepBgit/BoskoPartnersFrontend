import React, { useState, useEffect } from 'react';
import { 
  TextField, 
  Button, 
  Typography, 
  Box, 
  Grid, 
  MenuItem, 
  Select, 
  FormControl, 
  InputLabel, 
  FormHelperText, 
  IconButton, 
  CircularProgress, 
  useMediaQuery, 
  useTheme,
  Autocomplete
} from '@mui/material';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import axios from 'axios';

const OrganizationalDetailsPage = ({ formData, updateFormData, saveAndContinue, saveAndExit, formErrors, goBack, isSaving }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [organizations, setOrganizations] = useState([]);
  const [loadingOrganizations, setLoadingOrganizations] = useState(true);
  const [addressSearchValue, setAddressSearchValue] = useState('');
  
  // Fetch organizations from backend
  useEffect(() => {
    const fetchOrganizations = async () => {
      try {
        const response = await axios.get(`${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}/organizations`);
        // Filter organizations to only show Church, Institution, and Non_formal_organizations
        const filteredOrgs = response.data.filter(org => 
          org.organization_type && 
          ['Church', 'Institution', 'Non_formal_organizations'].includes(org.organization_type.type)
        );
        setOrganizations(filteredOrgs);
      } catch (error) {
        console.error('Error fetching organizations:', error);
      } finally {
        setLoadingOrganizations(false);
      }
    };

    fetchOrganizations();
  }, []);

  const handleChange = (e) => {
    updateFormData('organizational', e.target.name, e.target.value);
  };

  const handleOrganizationChange = (event, newValue) => {
    updateFormData('organizational', 'organization', newValue);
  };

  const handleAddressSelect = (addressData) => {
    console.log('Selected address data:', addressData);
    
    // Update form data with parsed address information
    const geoData = addressData.geoLocationData;
    
    updateFormData('organizational', 'country', geoData.country);
    updateFormData('organizational', 'province', geoData.province);
    updateFormData('organizational', 'city', geoData.city);
    updateFormData('organizational', 'town', geoData.town);
    updateFormData('organizational', 'address_line1', geoData.address_line1);
    updateFormData('organizational', 'postal_code', geoData.postal_code);
    
    // Update the search field value to show the formatted address
    setAddressSearchValue(addressData.formattedAddress);
  };

  const handleAddressSearchChange = (event) => {
    setAddressSearchValue(event.target.value);
  };
  
  const countries = [
    'Afghanistan', 'Albania', 'Algeria', 'Argentina', 'Armenia', 'Australia', 'Austria', 'Azerbaijan',
    'Bahrain', 'Bangladesh', 'Belarus', 'Belgium', 'Brazil', 'Bulgaria', 'Cambodia', 'Canada',
    'Chile', 'China', 'Colombia', 'Croatia', 'Czech Republic', 'Denmark', 'Egypt', 'Estonia',
    'Finland', 'France', 'Georgia', 'Germany', 'Ghana', 'Greece', 'Hungary', 'Iceland', 'India',
    'Indonesia', 'Iran', 'Iraq', 'Ireland', 'Israel', 'Italy', 'Japan', 'Jordan', 'Kazakhstan',
    'Kenya', 'South Korea', 'Kuwait', 'Latvia', 'Lebanon', 'Lithuania', 'Luxembourg', 'Malaysia',
    'Mexico', 'Morocco', 'Netherlands', 'New Zealand', 'Nigeria', 'Norway', 'Pakistan', 'Philippines',
    'Poland', 'Portugal', 'Qatar', 'Romania', 'Russia', 'Saudi Arabia', 'Singapore', 'Slovakia',
    'Slovenia', 'South Africa', 'Spain', 'Sri Lanka', 'Sweden', 'Switzerland', 'Thailand', 'Turkey',
    'Ukraine', 'United Arab Emirates', 'United Kingdom', 'United States', 'Vietnam'
  ];
  
  return (
    <Box sx={{ px: isMobile ? 1 : 2, maxWidth: '800px', mx: 'auto' }}>
      <Typography variant="h5" component="h2" gutterBottom>
        Organizational Details
      </Typography>
      
      <Grid container spacing={3} maxWidth={700} margin="auto">
        {/* Organization Selection - Full Width Row */}
        <Grid item xs={12}>
          <Autocomplete
            options={organizations}
            getOptionLabel={(option) => option ? `${option.name} (${option.organization_type?.type || 'Unknown'})` : ''}
            value={formData.organizational.organization || null}
            onChange={handleOrganizationChange}
            loading={loadingOrganizations}
            loadingText="Loading organizations..."
            renderInput={(params) => (
              <TextField
                {...params}
                label="Select Organization"
                required
                error={!!formErrors.organization}
                helperText={formErrors.organization}
                size={isMobile ? "small" : "medium"}
                sx={{ 
                  backgroundColor: 'white',
                  minWidth: '300px',
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': {
                      borderColor: '#e0e0e0',
                    },
                    '&:hover fieldset': {
                      borderColor: '#633394',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#633394',
                    },
                  }
                }}
              />
            )}
            renderOption={(props, option) => (
              <Box component="li" {...props}>
                <Box>
                  <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                    {option.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {option.organization_type?.type} • {option.geo_location ? 
                      [option.geo_location.city, option.geo_location.country].filter(Boolean).join(', ') : 
                      'Location not specified'}
                  </Typography>
                </Box>
              </Box>
            )}
          />
        </Grid>


        {/* Address Search Field */}
        <Grid item xs={12}>
        <Typography variant="h6" sx={{ color: '#633394' }}>
            Your Address
          </Typography>
          <TextField
            fullWidth
            label="Enter your address"
            value={addressSearchValue}
            onChange={handleAddressSearchChange}
            variant="outlined"
            size={isMobile ? "small" : "medium"}
            placeholder="Type your address here..."
            helperText="Enter your address manually (auto-suggestions temporarily disabled)"
            sx={{ 
              backgroundColor: 'white',
              minWidth: '300px',
              '& .MuiOutlinedInput-root': {
                '& fieldset': {
                  borderColor: '#e0e0e0',
                },
                '&:hover fieldset': {
                  borderColor: '#633394',
                },
                '&.Mui-focused fieldset': {
                  borderColor: '#633394',
                },
              },
              '& .MuiFormHelperText-root': {
                color: '#633394',
                fontSize: '0.75rem'
              }
            }}
          />
        </Grid>

        {/* Address Fields - 2 Column Layout */}
        {/* Row 1: Country and Province/State */}
                <Grid item xs={12} md={6}>
          <Autocomplete
            options={countries}
            value={formData.organizational.country || ''}
            onChange={(event, newValue) => {
              updateFormData('organizational', 'country', newValue);
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                fullWidth
                required
                label="Country"
                variant="outlined"
                error={!!formErrors.country}
                helperText={formErrors.country}
                size={isMobile ? "small" : "medium"}
                sx={{ 
                  backgroundColor: 'white',
                  minWidth: '280px',
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': {
                      borderColor: '#e0e0e0',
                    },
                    '&:hover fieldset': {
                      borderColor: '#633394',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#633394',
                    },
                  }
                }}
              />
            )}
            ListboxProps={{
              style: {
                maxHeight: 300,
              },
            }}
            disablePortal
            freeSolo={false}
            autoComplete
            autoHighlight
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            name="province"
            label="Province/State"
            variant="outlined"
            value={formData.organizational.province || ''}
            onChange={handleChange}
            required
            error={!!formErrors.province}
            helperText={formErrors.province}
            size={isMobile ? "small" : "medium"}
            sx={{ 
              backgroundColor: 'white',
              minWidth: '280px',
              '& .MuiOutlinedInput-root': {
                '& fieldset': {
                  borderColor: '#e0e0e0',
                },
                '&:hover fieldset': {
                  borderColor: '#633394',
                },
                '&.Mui-focused fieldset': {
                  borderColor: '#633394',
                },
              }
            }}
          />
        </Grid>

        {/* Row 2: City and Town/District */}
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            name="city"
            label="City"
            variant="outlined"
            value={formData.organizational.city || ''}
            onChange={handleChange}
            required
            error={!!formErrors.city}
            helperText={formErrors.city}
            size={isMobile ? "small" : "medium"}
            sx={{ 
              backgroundColor: 'white',
              minWidth: '280px',
              '& .MuiOutlinedInput-root': {
                '& fieldset': {
                  borderColor: '#e0e0e0',
                },
                '&:hover fieldset': {
                  borderColor: '#633394',
                },
                '&.Mui-focused fieldset': {
                  borderColor: '#633394',
                },
              }
            }}
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            name="town"
            label="Town/District"
            variant="outlined"
            value={formData.organizational.town || ''}
            onChange={handleChange}
            size={isMobile ? "small" : "medium"}
            sx={{ 
              backgroundColor: 'white',
              minWidth: '280px',
              '& .MuiOutlinedInput-root': {
                '& fieldset': {
                  borderColor: '#e0e0e0',
                },
                '&:hover fieldset': {
                  borderColor: '#633394',
                },
                '&.Mui-focused fieldset': {
                  borderColor: '#633394',
                },
              }
            }}
          />
        </Grid>

        {/* Row 3: Address Line 1 and Address Line 2 */}
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            name="address_line1"
            label="Address Line 1"
            variant="outlined"
            value={formData.organizational.address_line1 || ''}
            onChange={handleChange}
            required
            error={!!formErrors.address_line1}
            helperText={formErrors.address_line1}
            size={isMobile ? "small" : "medium"}
            sx={{ 
              backgroundColor: 'white',
              minWidth: '280px',
              '& .MuiOutlinedInput-root': {
                '& fieldset': {
                  borderColor: '#e0e0e0',
                },
                '&:hover fieldset': {
                  borderColor: '#633394',
                },
                '&.Mui-focused fieldset': {
                  borderColor: '#633394',
                },
              }
            }}
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            name="address_line2"
            label="Address Line 2 (Optional)"
            variant="outlined"
            value={formData.organizational.address_line2 || ''}
            onChange={handleChange}
            size={isMobile ? "small" : "medium"}
            sx={{ 
              backgroundColor: 'white',
              minWidth: '280px',
              '& .MuiOutlinedInput-root': {
                '& fieldset': {
                  borderColor: '#e0e0e0',
                },
                '&:hover fieldset': {
                  borderColor: '#633394',
                },
                '&.Mui-focused fieldset': {
                  borderColor: '#633394',
                },
              }
            }}
          />
        </Grid>

        {/* Row 4: Postal Code (half width) */}
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            name="postal_code"
            label="Postal Code (Optional)"
            variant="outlined"
            value={formData.organizational.postal_code || ''}
            onChange={handleChange}
            size={isMobile ? "small" : "medium"}
            sx={{ 
              backgroundColor: 'white',
              minWidth: '280px',
              '& .MuiOutlinedInput-root': {
                '& fieldset': {
                  borderColor: '#e0e0e0',
                },
                '&:hover fieldset': {
                  borderColor: '#633394',
                },
                '&.Mui-focused fieldset': {
                  borderColor: '#633394',
                },
              }
            }}
          />
        

        {/* Navigation Buttons */}
        {/*<Grid item xs={12}>*/}
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
                backgroundColor: '#633394',
                color: 'white',
                '&:hover': {
                  backgroundColor: '#7c52a5',
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
                backgroundColor: '#633394',
                color: 'white',
                '&:hover': {
                  backgroundColor: '#7c52a5',
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
        {/* </Grid> */}
        </Grid>
      </Grid>
    </Box>
  );
};

export default OrganizationalDetailsPage;
