import React, { useState, useEffect, useRef } from 'react';
import { 
    TextField, Box, Button, FormControl, InputLabel, Select, MenuItem, 
    Grid, Paper, Typography, Dialog, DialogTitle, DialogContent, 
    DialogActions, IconButton, Chip, Alert, Autocomplete
} from '@mui/material';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import MapIcon from '@mui/icons-material/Map';
import CloseIcon from '@mui/icons-material/Close';
import MyLocationIcon from '@mui/icons-material/MyLocation';
import SearchIcon from '@mui/icons-material/Search';
import GoogleMapsService from '../../../services/GoogleMapsService';

const EnhancedAddressInput = ({ 
    onPlaceSelect, 
    label = "Address Information",
    fullWidth = true,
    disabled = false,
    initialValue = null
}) => {
    const [formData, setFormData] = useState({
        continent: '',
        country: '',
        province: '',
        region: '',
        city: '',
        town: '',
        address_line1: '',
        address_line2: '',
        postal_code: '',
        latitude: '',
        longitude: ''
    });

    const [searchText, setSearchText] = useState('');
    const [suggestions, setSuggestions] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [mapOpen, setMapOpen] = useState(false);
    const [mapLoaded, setMapLoaded] = useState(false);
    const [selectedLocation, setSelectedLocation] = useState(null);
    const [mapError, setMapError] = useState('');
    const [showSuggestions, setShowSuggestions] = useState(false);
    
    const mapRef = useRef(null);
    const mapInstanceRef = useRef(null);
    const markerRef = useRef(null);
    const searchTimeoutRef = useRef(null);
    const inputRef = useRef(null);

    const continents = [
        'Africa', 'Antarctica', 'Asia', 'Europe', 
        'North America', 'Oceania', 'South America'
    ];

    // Initialize with initial value if provided
    useEffect(() => {
        if (initialValue) {
            setFormData(initialValue);
            setSearchText(generateFormattedAddress(initialValue));
        }
    }, [initialValue]);

    // Load Google Maps API early to ensure Places service is available for autocomplete
    useEffect(() => {
        loadGoogleMapsAPIForAutocomplete();
    }, []);

    const loadGoogleMapsAPIForAutocomplete = () => {
        if (window.google && window.google.maps && window.google.maps.places) {
            return; // Already loaded
        }

        // Check if script already exists
        const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
        if (existingScript) {
            return; // Script already loading or loaded
        }

        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.REACT_APP_GOOGLE_MAPS_API_KEY || 'AIzaSyAA5PZQdpcY4NXonqUny2sGZzMLbFKE0Iw'}&libraries=places,geometry`;
        script.async = true;
        script.defer = true;
        
        script.onload = () => {
            console.log('Google Maps API loaded for autocomplete');
        };
        
        script.onerror = () => {
            console.error('Failed to load Google Maps API for autocomplete');
        };
        
        document.head.appendChild(script);
    };

    // Load Google Maps API
    useEffect(() => {
        if (mapOpen) {
            loadGoogleMapsAPI();
        }
    }, [mapOpen]);

    const loadGoogleMapsAPI = () => {
        if (window.google && window.google.maps) {
            setMapLoaded(true);
            setMapError('');
            initializeMap();
            return;
        }

        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.REACT_APP_GOOGLE_MAPS_API_KEY || 'AIzaSyAA5PZQdpcY4NXonqUny2sGZzMLbFKE0Iw'}&libraries=places,geometry`;
        script.async = true;
        script.defer = true;
        
        script.onload = () => {
            setMapLoaded(true);
            setMapError('');
            initializeMap();
        };
        
        script.onerror = () => {
            setMapError('Failed to load Google Maps. Please check your internet connection.');
        };
        
        document.head.appendChild(script);
    };

    // Initialize map when dialog opens and API is loaded
    useEffect(() => {
        if (mapOpen && mapLoaded && window.google && mapRef.current && !mapInstanceRef.current) {
            initializeMap();
        }
    }, [mapOpen, mapLoaded]);

    const initializeMap = () => {
        try {
            // Default to a central location (Kansas, USA)
            const defaultCenter = { lat: 39.8283, lng: -98.5795 };
            
            // Use existing coordinates if available
            const center = (formData.latitude && formData.longitude) ? 
                { lat: parseFloat(formData.latitude), lng: parseFloat(formData.longitude) } : 
                defaultCenter;

            const map = new window.google.maps.Map(mapRef.current, {
                zoom: formData.latitude ? 15 : 4,
                center: center,
                mapTypeControl: true,
                streetViewControl: true,
                fullscreenControl: true,
            });

            mapInstanceRef.current = map;

            // Add existing marker if coordinates exist
            if (formData.latitude && formData.longitude) {
                addMarker(center, map);
            }

            // Add click listener to map
            map.addListener('click', (event) => {
                const clickedLocation = {
                    lat: event.latLng.lat(),
                    lng: event.latLng.lng()
                };
                
                addMarker(clickedLocation, map);
                reverseGeocode(clickedLocation);
            });

            setMapError('');
        } catch (error) {
            console.error('Error initializing map:', error);
            setMapError('Error initializing map. Please try again.');
        }
    };

    const addMarker = (location, map) => {
        // Remove existing marker
        if (markerRef.current) {
            markerRef.current.setMap(null);
        }

        // Add new marker
        const marker = new window.google.maps.Marker({
            position: location,
            map: map,
            draggable: true,
            title: 'Selected Location'
        });

        markerRef.current = marker;
        setSelectedLocation(location);

        // Add drag listener
        marker.addListener('dragend', (event) => {
            const newLocation = {
                lat: event.latLng.lat(),
                lng: event.latLng.lng()
            };
            setSelectedLocation(newLocation);
            reverseGeocode(newLocation);
        });
    };

    const reverseGeocode = async (location) => {
        try {
            const result = await GoogleMapsService.reverseGeocode(location.lat, location.lng);
            const geoLocationData = GoogleMapsService.convertPlaceToGeoLocation({
                address_components: result.components,
                geometry: { location: { lat: () => location.lat, lng: () => location.lng } }
            });
            
            setFormData(geoLocationData);
            setSearchText(result.address);
        } catch (error) {
            console.warn('Reverse geocoding failed:', error);
        }
    };

    const handleSearchInputChange = (e) => {
        const value = e.target.value;
        setSearchText(value);
        setShowSuggestions(true);

        // Clear previous timeout
        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
        }

        // Debounce search
        if (value.trim().length > 2) {
            searchTimeoutRef.current = setTimeout(() => {
                fetchSuggestions(value);
            }, 300);
        } else {
            setSuggestions([]);
        }
    };

    const fetchSuggestions = async (query) => {
        if (!query.trim()) {
            setSuggestions([]);
            return;
        }

        setIsLoading(true);
        try {
            // Check if Google Maps API is loaded with Places library
            if (!window.google || !window.google.maps || !window.google.maps.places) {
                console.warn('Google Places API not loaded yet');
                setSuggestions([]);
                setIsLoading(false);
                return;
            }

            // Use Google Places AutocompleteService instead of direct API calls
            const service = new window.google.maps.places.AutocompleteService();
            
            service.getPlacePredictions(
                {
                    input: query,
                    types: ['address']
                },
                (predictions, status) => {
                    if (status === window.google.maps.places.PlacesServiceStatus.OK && predictions) {
                        // Transform Google's prediction format to match our expected format
                        const transformedSuggestions = predictions.map(prediction => ({
                            description: prediction.description,
                            placeId: prediction.place_id,
                            structuredFormatting: prediction.structured_formatting,
                            types: prediction.types
                        }));
                        setSuggestions(transformedSuggestions);
                    } else {
                        console.warn('AutocompleteService failed:', status);
                        setSuggestions([]);
                    }
                    setIsLoading(false);
                }
            );
        } catch (error) {
            console.error('Error fetching suggestions:', error);
            setSuggestions([]);
            setIsLoading(false);
        }
    };

    const handleSuggestionSelect = async (suggestion) => {
        try {
            // Check if Google Maps API is loaded
            if (!window.google || !window.google.maps || !window.google.maps.places) {
                console.error('Google Places API not loaded');
                return;
            }

            // Create a PlacesService (requires a map or div element)
            const tempDiv = document.createElement('div');
            const placesService = new window.google.maps.places.PlacesService(tempDiv);
            
            // Get place details using the place ID
            placesService.getDetails(
                {
                    placeId: suggestion.placeId,
                    fields: ['address_components', 'formatted_address', 'geometry', 'name']
                },
                (place, status) => {
                    if (status === window.google.maps.places.PlacesServiceStatus.OK && place) {
                        // Convert place to our geo location format
                        const geoLocationData = GoogleMapsService.convertPlaceToGeoLocation(place);
                        
                        setFormData(geoLocationData);
                        setSearchText(place.formatted_address || suggestion.description);
                        setSuggestions([]);
                        setShowSuggestions(false);

                        if (onPlaceSelect) {
                            onPlaceSelect({
                                formattedAddress: place.formatted_address || suggestion.description,
                                geoLocationData: geoLocationData,
                                placeDetails: place
                            });
                        }
                    } else {
                        console.error('PlacesService getDetails failed:', status);
                        // Fallback: just use the description
                        setSearchText(suggestion.description);
                        setSuggestions([]);
                        setShowSuggestions(false);
                    }
                }
            );
        } catch (error) {
            console.error('Error getting place details:', error);
            // Fallback: just use the description
            setSearchText(suggestion.description);
            setSuggestions([]);
            setShowSuggestions(false);
        }
    };

    const searchOnMap = async () => {
        if (!mapInstanceRef.current || !searchText.trim()) return;

        try {
            const result = await GoogleMapsService.geocodeAddress(searchText);
            const location = { lat: result.lat, lng: result.lng };

            mapInstanceRef.current.setCenter(location);
            mapInstanceRef.current.setZoom(15);
            
            addMarker(location, mapInstanceRef.current);
            
            const geoLocationData = GoogleMapsService.convertPlaceToGeoLocation({
                address_components: result.addressComponents,
                geometry: { location: { lat: () => result.lat, lng: () => result.lng } }
            });
            
            setFormData(geoLocationData);
        } catch (error) {
            setMapError('Location not found. Please try a different search term.');
        }
    };

    const getCurrentLocation = () => {
        if (!navigator.geolocation) {
            setMapError('Geolocation is not supported by this browser.');
            return;
        }

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const location = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                };

                if (mapInstanceRef.current) {
                    mapInstanceRef.current.setCenter(location);
                    mapInstanceRef.current.setZoom(15);
                    addMarker(location, mapInstanceRef.current);
                    await reverseGeocode(location);
                }
            },
            (error) => {
                setMapError('Unable to get your location. Please search manually.');
                console.error('Geolocation error:', error);
            }
        );
    };

    const handleInputChange = (field) => (event) => {
        const value = event.target.value;
        const updatedData = {
            ...formData,
            [field]: value
        };
        setFormData(updatedData);

        // Auto-update continent based on country
        if (field === 'country') {
            const continent = GoogleMapsService.getContinent(value);
            if (continent) {
                updatedData.continent = continent;
                setFormData(updatedData);
            }
        }

        // Trigger callback with updated data
        if (onPlaceSelect) {
            onPlaceSelect({
                formattedAddress: generateFormattedAddress(updatedData),
                geoLocationData: updatedData,
                placeDetails: null
            });
        }
    };

    const generateFormattedAddress = (data) => {
        const parts = [
            data.address_line1,
            data.address_line2,
            data.city,
            data.province,
            data.country,
            data.postal_code
        ].filter(part => part && part.trim() !== '');
        
        return parts.join(', ');
    };

    const handleClear = () => {
        const emptyData = {
            continent: '', country: '', province: '', region: '', city: '', town: '',
            address_line1: '', address_line2: '', postal_code: '', latitude: '', longitude: ''
        };
        setFormData(emptyData);
        setSearchText('');
        setSelectedLocation(null);
        setSuggestions([]);
        setShowSuggestions(false);

        // Clear map marker
        if (markerRef.current) {
            markerRef.current.setMap(null);
            markerRef.current = null;
        }

        if (onPlaceSelect) {
            onPlaceSelect({
                formattedAddress: '',
                geoLocationData: emptyData,
                placeDetails: null
            });
        }
    };

    const handleMapClose = () => {
        setMapOpen(false);
        // Clean up map instance
        if (mapInstanceRef.current) {
            mapInstanceRef.current = null;
        }
        if (markerRef.current) {
            markerRef.current = null;
        }
    };

    const handleUseMapLocation = () => {
        if (selectedLocation) {
            // The form data is already updated by reverseGeocode
            // Just trigger the callback to update parent component
            if (onPlaceSelect) {
                onPlaceSelect({
                    formattedAddress: generateFormattedAddress(formData),
                    geoLocationData: formData,
                    placeDetails: null
                });
            }
        }
        handleMapClose();
    };

    useEffect(() => {
        return () => {
            if (searchTimeoutRef.current) {
                clearTimeout(searchTimeoutRef.current);
            }
        };
    }, []);

    return (
        <Box>
            {/* Enhanced Search Input with Autocomplete */}
            <Box sx={{ mb: 2, position: 'relative' }}>
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-end' }}>
                    <Box sx={{ flex: 1, position: 'relative' }}>
                        <TextField
                            ref={inputRef}
                            fullWidth
                            label="🔍 Search Address"
                            value={searchText}
                            onChange={handleSearchInputChange}
                            placeholder="Start typing an address..."
                            helperText="Type to search or click map icon to select on map"
                            disabled={disabled}
                            onFocus={() => setShowSuggestions(true)}
                            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                        />
                        
                        {/* Suggestions Dropdown */}
                        {showSuggestions && suggestions.length > 0 && (
                            <Box sx={{
                                position: 'absolute',
                                top: '100%',
                                left: 0,
                                right: 0,
                                backgroundColor: 'white',
                                border: '1px solid #ddd',
                                borderRadius: '4px',
                                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                                zIndex: 1000,
                                maxHeight: '200px',
                                overflowY: 'auto'
                            }}>
                                {suggestions.map((suggestion, index) => (
                                    <Box
                                        key={index}
                                        onClick={() => handleSuggestionSelect(suggestion)}
                                        sx={{
                                            padding: '10px 12px',
                                            cursor: 'pointer',
                                            borderBottom: '1px solid #eee',
                                            '&:hover': { backgroundColor: '#f5f5f5' }
                                        }}
                                    >
                                        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                            {suggestion.structuredFormatting?.main_text || suggestion.description.split(',')[0]}
                                        </Typography>
                                        <Typography variant="caption" sx={{ color: '#666' }}>
                                            {suggestion.structuredFormatting?.secondary_text || suggestion.description}
                                        </Typography>
                                    </Box>
                                ))}
                            </Box>
                        )}
                    </Box>
                    
                    <Button 
                        variant="contained"
                        onClick={() => setMapOpen(true)}
                        startIcon={<MapIcon />}
                        sx={{ 
                            minWidth: '50px',
                            maxWidth: '100px',
                            height: '56px',
                            backgroundColor: '#633394',
                            '&:hover': { backgroundColor: '#7c52a5' }
                        }}
                    >
                        Map
                    </Button>
                    <Button 
                        variant="outlined"
                        onClick={handleClear}
                        sx={{ 
                            minWidth: '60px',
                            maxWidth: '100px',
                            height: '56px',
                            color: '#633394',
                            borderColor: '#633394'
                        }}
                    >
                        Clear
                    </Button>
                </Box>
                
                {isLoading && (
                    <Typography variant="caption" sx={{ color: '#666', mt: 1 }}>
                        Searching...
                    </Typography>
                )}
            </Box>

            {/* Current Location Display */}
            {(formData.latitude && formData.longitude) && (
                <Box sx={{ mb: 2 }}>
                    <Chip 
                        icon={<LocationOnIcon />}
                        label={`📍 ${formData.latitude}, ${formData.longitude}`}
                        color="primary"
                        variant="outlined"
                        sx={{ 
                            backgroundColor: 'rgba(99, 51, 148, 0.1)',
                            borderColor: '#633394',
                            color: '#633394'
                        }}
                    />
                </Box>
            )}

            {/* Detailed Address Form */}
            <Paper sx={{ p: 2, backgroundColor: '#fafafa' }}>
                <Typography variant="subtitle2" sx={{ mb: 2, color: '#633394' }}>
                    <LocationOnIcon sx={{ fontSize: '1rem', mr: 0.5 }} />
                    Detailed Address Information
                </Typography>
                
                <Grid container spacing={2}>
                    {/* Row 1 */}
                    <Grid item xs={12} sm={6}>
                        <FormControl fullWidth>
                            <InputLabel>Continent</InputLabel>
                            <Select
                                value={formData.continent}
                                onChange={handleInputChange('continent')}
                                label="Continent"
                            >
                                <MenuItem value=""><em>Select Continent</em></MenuItem>
                                {continents.map(continent => (
                                    <MenuItem key={continent} value={continent}>
                                        {continent}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <TextField
                            fullWidth
                            label="Country"
                            value={formData.country}
                            onChange={handleInputChange('country')}
                            placeholder="e.g., United States, Germany, Japan"
                        />
                    </Grid>

                    {/* Row 2 */}
                    <Grid item xs={12} sm={6}>
                        <TextField
                            fullWidth
                            label="Province/State"
                            value={formData.province}
                            onChange={handleInputChange('province')}
                            placeholder="e.g., California, Ontario, Bavaria"
                        />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <TextField
                            fullWidth
                            label="Region"
                            value={formData.region}
                            onChange={handleInputChange('region')}
                            placeholder="e.g., Northern Region, Southeast"
                        />
                    </Grid>

                    {/* Row 3 */}
                    <Grid item xs={12} sm={6}>
                        <TextField
                            fullWidth
                            label="City"
                            value={formData.city}
                            onChange={handleInputChange('city')}
                            placeholder="e.g., New York, London, Tokyo"
                        />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <TextField
                            fullWidth
                            label="Town/District"
                            value={formData.town}
                            onChange={handleInputChange('town')}
                            placeholder="e.g., Downtown, Suburb"
                        />
                    </Grid>

                    {/* Row 4 */}
                    <Grid item xs={12} sm={8}>
                        <TextField
                            fullWidth
                            label="Address Line 1"
                            value={formData.address_line1}
                            onChange={handleInputChange('address_line1')}
                            placeholder="e.g., 123 Main Street"
                        />
                    </Grid>
                    <Grid item xs={12} sm={4}>
                        <TextField
                            fullWidth
                            label="Postal Code"
                            value={formData.postal_code}
                            onChange={handleInputChange('postal_code')}
                            placeholder="e.g., 12345"
                        />
                    </Grid>

                    {/* Row 5 */}
                    <Grid item xs={12}>
                        <TextField
                            fullWidth
                            label="Address Line 2"
                            value={formData.address_line2}
                            onChange={handleInputChange('address_line2')}
                            placeholder="e.g., Apartment 4B, Suite 200"
                        />
                    </Grid>

                    {/* Row 6 */}
                    <Grid item xs={12} sm={6}>
                        <TextField
                            fullWidth
                            label="Latitude"
                            value={formData.latitude}
                            onChange={handleInputChange('latitude')}
                            placeholder="e.g., 40.7128"
                            type="number"
                            helperText={formData.latitude ? "📍 From map selection" : ""}
                        />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <TextField
                            fullWidth
                            label="Longitude"
                            value={formData.longitude}
                            onChange={handleInputChange('longitude')}
                            placeholder="e.g., -74.0060"
                            type="number"
                            helperText={formData.longitude ? "📍 From map selection" : ""}
                        />
                    </Grid>
                </Grid>
            </Paper>

            {/* Map Dialog */}
            <Dialog 
                open={mapOpen} 
                onClose={handleMapClose}
                maxWidth="lg"
                fullWidth
                PaperProps={{
                    sx: { height: '80vh' }
                }}
            >
                <DialogTitle sx={{ 
                    backgroundColor: '#633394', 
                    color: 'white',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <MapIcon />
                        Select Location on Map
                    </Box>
                    <IconButton 
                        onClick={handleMapClose}
                        sx={{ color: 'white' }}
                    >
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>
                
                <DialogContent sx={{ p: 0, display: 'flex', flexDirection: 'column' }}>
                    {/* Map Search Bar */}
                    <Box sx={{ p: 2, borderBottom: '1px solid #e0e0e0' }}>
                        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                            <TextField
                                fullWidth
                                label="Search for a location"
                                value={searchText}
                                onChange={(e) => setSearchText(e.target.value)}
                                placeholder="e.g., Times Square, New York"
                                onKeyPress={(e) => {
                                    if (e.key === 'Enter') {
                                        searchOnMap();
                                    }
                                }}
                            />
                            <Button 
                                variant="contained"
                                onClick={searchOnMap}
                                disabled={!searchText.trim() || !mapLoaded}
                                startIcon={<SearchIcon />}
                                sx={{ 
                                    backgroundColor: '#633394',
                                    minWidth: '100px'
                                }}
                            >
                                Search
                            </Button>
                            <Button 
                                variant="outlined"
                                onClick={getCurrentLocation}
                                disabled={!mapLoaded}
                                startIcon={<MyLocationIcon />}
                                sx={{ 
                                    color: '#633394',
                                    borderColor: '#633394',
                                    minWidth: '120px'
                                }}
                            >
                                My Location
                            </Button>
                        </Box>
                        
                        {mapError && (
                            <Alert severity="error" sx={{ mt: 1 }}>
                                {mapError}
                            </Alert>
                        )}
                        
                        {selectedLocation && (
                            <Box sx={{ mt: 1 }}>
                                <Chip 
                                    icon={<LocationOnIcon />}
                                    label={`Selected: ${selectedLocation.lat.toFixed(6)}, ${selectedLocation.lng.toFixed(6)}`}
                                    color="primary"
                                    size="small"
                                />
                            </Box>
                        )}
                    </Box>

                    {/* Map Container */}
                    <Box sx={{ flex: 1, position: 'relative', minHeight: '400px' }}>
                        {!mapLoaded && (
                            <Box sx={{ 
                                position: 'absolute', 
                                top: '50%', 
                                left: '50%', 
                                transform: 'translate(-50%, -50%)',
                                textAlign: 'center'
                            }}>
                                <Typography>Loading map...</Typography>
                            </Box>
                        )}
                        <div 
                            ref={mapRef} 
                            style={{ 
                                width: '100%', 
                                height: '100%',
                                minHeight: '400px'
                            }} 
                        />
                    </Box>
                </DialogContent>
                
                <DialogActions sx={{ p: 2, borderTop: '1px solid #e0e0e0' }}>
                    <Typography variant="body2" sx={{ flex: 1, color: '#666' }}>
                        Click on the map to select a location, or drag the marker to adjust.
                    </Typography>
                    <Button onClick={handleMapClose} color="secondary">
                        Cancel
                    </Button>
                    <Button 
                        onClick={handleUseMapLocation}
                        variant="contained"
                        disabled={!selectedLocation}
                        sx={{ 
                            backgroundColor: '#633394',
                            '&:hover': { backgroundColor: '#7c52a5' }
                        }}
                    >
                        Use This Location
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default EnhancedAddressInput; 