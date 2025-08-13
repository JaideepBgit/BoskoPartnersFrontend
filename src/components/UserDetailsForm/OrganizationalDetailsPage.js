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
import MyLocationIcon from '@mui/icons-material/MyLocation';
import { GoogleMap, Marker, useLoadScript, StandaloneSearchBox } from '@react-google-maps/api';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import axios from 'axios';

const OrganizationalDetailsPage = ({ formData, updateFormData, saveAndContinue, saveAndExit, formErrors, goBack, isSaving }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [organizations, setOrganizations] = useState([]);
  const [loadingOrganizations, setLoadingOrganizations] = useState(true);
  const [addressSearchValue, setAddressSearchValue] = useState('');
  const [mapCenter, setMapCenter] = useState({ lat: 37.7749, lng: -122.4194 });
  const [markerPosition, setMarkerPosition] = useState(null);
  const [searchBox, setSearchBox] = useState(null);

  const { isLoaded } = useLoadScript({
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY || '',
    libraries: ['places']
  });
  
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

  const parsePlaceToAddress = (place) => {
    const components = place.address_components || [];
    const find = (type) => {
      const comp = components.find(c => c.types.includes(type));
      return comp ? comp.long_name : '';
    };
    return {
      address_line1: `${find('street_number')} ${find('route')}`.trim(),
      city: find('locality') || find('sublocality') || find('administrative_area_level_2'),
      province: find('administrative_area_level_1'),
      country: find('country'),
      postal_code: find('postal_code'),
      lat: place.geometry?.location?.lat(),
      lng: place.geometry?.location?.lng(),
      formatted: place.formatted_address || ''
    };
  };

  const onPlacesChanged = () => {
    const places = searchBox.getPlaces();
    if (!places || places.length === 0) return;
    const place = places[0];
    const parsed = parsePlaceToAddress(place);
    setAddressSearchValue(parsed.formatted);
    setMapCenter({ lat: parsed.lat, lng: parsed.lng });
    setMarkerPosition({ lat: parsed.lat, lng: parsed.lng });
    updateFormData('organizational', 'country', parsed.country);
    updateFormData('organizational', 'province', parsed.province);
    updateFormData('organizational', 'city', parsed.city);
    updateFormData('organizational', 'town', parsed.town || '');
    updateFormData('organizational', 'address_line1', parsed.address_line1);
    updateFormData('organizational', 'postal_code', parsed.postal_code);
    updateFormData('organizational', 'latitude', parsed.lat);
    updateFormData('organizational', 'longitude', parsed.lng);
  };

  const reverseGeocode = (lat, lng) => {
    if (!window.google || !window.google.maps) return;
    const geocoder = new window.google.maps.Geocoder();
    geocoder
      .geocode({ location: { lat, lng } })
      .then(({ results }) => {
        if (!results || results.length === 0) return;
        const place = results[0];
        const parsed = parsePlaceToAddress(place);
        setAddressSearchValue(parsed.formatted);
        updateFormData('organizational', 'country', parsed.country);
        updateFormData('organizational', 'province', parsed.province);
        updateFormData('organizational', 'city', parsed.city);
        updateFormData('organizational', 'town', parsed.town || '');
        updateFormData('organizational', 'address_line1', parsed.address_line1);
        updateFormData('organizational', 'postal_code', parsed.postal_code);
        updateFormData('organizational', 'latitude', parsed.lat || lat);
        updateFormData('organizational', 'longitude', parsed.lng || lng);
      })
      .catch((err) => {
        console.error('Reverse geocoding failed', err);
      });
  };

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setMapCenter({ lat: latitude, lng: longitude });
        setMarkerPosition({ lat: latitude, lng: longitude });
        updateFormData('organizational', 'latitude', latitude);
        updateFormData('organizational', 'longitude', longitude);
        reverseGeocode(latitude, longitude);
      },
      (err) => {
        console.error(err);
        alert('Unable to retrieve your location');
      }
    );
  };

  const handleMapClick = (e) => {
    const lat = e.latLng.lat();
    const lng = e.latLng.lng();
    setMarkerPosition({ lat, lng });
    updateFormData('organizational', 'latitude', lat);
    updateFormData('organizational', 'longitude', lng);
    reverseGeocode(lat, lng);
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
    <Box sx={{ px: isMobile ? 2 : 2, maxWidth: '800px', mx: 'auto' }}>
      <Typography 
        variant="h5" 
        component="h2" 
        gutterBottom 
        align="center"
        sx={{ fontWeight: 'bold', color: '#633394' }}
      >
        Organizational Details
      </Typography>
      
      <Grid container spacing={3} sx={{ maxWidth: 700, mx: 'auto' }}>
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
                fullWidth
                label="Select Organization"
                required
                error={!!formErrors.organization}
                helperText={formErrors.organization}
                size={isMobile ? "small" : "medium"}
                sx={{ 
                  backgroundColor: 'white',
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


        {/* Address Search + Map */}
        <Grid item xs={12}>
          <Typography variant="h6" sx={{ color: '#633394', mb: 1 }}>
            Your Address
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, mb: 1, flexDirection: isMobile ? 'column' : 'row' }}>
            {isLoaded ? (
              <StandaloneSearchBox onLoad={ref => setSearchBox(ref)} onPlacesChanged={onPlacesChanged}>
                <TextField
                  fullWidth
                  label="Search your address"
                  value={addressSearchValue}
                  onChange={(e) => setAddressSearchValue(e.target.value)}
                  variant="outlined"
                  size={isMobile ? 'small' : 'medium'}
                  placeholder="Start typing your address..."
                  sx={{ backgroundColor: 'white' }}
                />
              </StandaloneSearchBox>
            ) : (
              <TextField fullWidth disabled label="Loading Google Maps..." size={isMobile ? 'small' : 'medium'} />
            )}
            <Button variant="outlined" startIcon={<MyLocationIcon />} onClick={handleUseMyLocation}>
              Use My Location
            </Button>
          </Box>
          <Box sx={{ height: 300, width: '100%', borderRadius: '8px', overflow: 'hidden', border: '1px solid #e0e0e0' }}>
            {isLoaded && (
              <GoogleMap
                center={mapCenter}
                zoom={12}
                mapContainerStyle={{ width: '100%', height: '100%' }}
                onClick={handleMapClick}
              >
                {markerPosition && <Marker position={markerPosition} draggable onDragEnd={(e) => {
                  const lat = e.latLng.lat();
                  const lng = e.latLng.lng();
                  setMarkerPosition({ lat, lng });
                  updateFormData('organizational', 'latitude', lat);
                  updateFormData('organizational', 'longitude', lng);
                  reverseGeocode(lat, lng);
                }} />}
              </GoogleMap>
            )}
          </Box>
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
