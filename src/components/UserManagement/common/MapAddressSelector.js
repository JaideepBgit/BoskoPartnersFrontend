import React, { useState, useEffect, useRef } from 'react';
import {
    TextField, Box, Button, FormControl, InputLabel, Select, MenuItem,
    Grid, Paper, Typography, Dialog, DialogTitle, DialogContent,
    DialogActions, IconButton, Chip, Alert
} from '@mui/material';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import MapIcon from '@mui/icons-material/Map';
import CloseIcon from '@mui/icons-material/Close';
import MyLocationIcon from '@mui/icons-material/MyLocation';

const MapAddressSelector = ({
    onPlaceSelect,
    label = "Address Information",
    fullWidth = true,
    disabled = false
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
    const [mapOpen, setMapOpen] = useState(false);
    const [mapLoaded, setMapLoaded] = useState(false);
    const [selectedLocation, setSelectedLocation] = useState(null);
    const [mapError, setMapError] = useState('');

    const mapRef = useRef(null);
    const mapInstanceRef = useRef(null);
    const markerRef = useRef(null);
    const geocoderRef = useRef(null);

    const continents = [
        'Africa', 'Antarctica', 'Asia', 'Europe',
        'North America', 'Oceania', 'South America'
    ];

    // Load Google Maps API
    useEffect(() => {
        if (mapOpen && !window.google) {
            loadGoogleMapsAPI();
        }
    }, [mapOpen]);

    const loadGoogleMapsAPI = () => {
        if (window.google) {
            setMapLoaded(true);
            return;
        }

        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.REACT_APP_GOOGLE_MAPS_API_KEY || 'AIzaSyAA5PZQdpcY4NXonqUny2sGZzMLbFKE0Iw'}&libraries=places,geometry`;
        script.async = true;
        script.defer = true;

        script.onload = () => {
            setMapLoaded(true);
            setMapError('');
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
            geocoderRef.current = new window.google.maps.Geocoder();

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

    const reverseGeocode = (location) => {
        if (!geocoderRef.current) return;

        geocoderRef.current.geocode(
            { location: location },
            (results, status) => {
                if (status === 'OK' && results[0]) {
                    const result = results[0];
                    const addressComponents = result.address_components;

                    const addressData = {
                        continent: '',
                        country: '',
                        province: '',
                        region: '',
                        city: '',
                        town: '',
                        address_line1: '',
                        address_line2: '',
                        postal_code: '',
                        latitude: location.lat.toString(),
                        longitude: location.lng.toString()
                    };

                    // Parse address components
                    addressComponents.forEach(component => {
                        const types = component.types;

                        if (types.includes('street_number')) {
                            addressData.address_line1 = component.long_name + ' ' + (addressData.address_line1 || '');
                        } else if (types.includes('route')) {
                            addressData.address_line1 = (addressData.address_line1 || '') + component.long_name;
                        } else if (types.includes('locality')) {
                            addressData.city = component.long_name;
                        } else if (types.includes('administrative_area_level_1')) {
                            addressData.province = component.long_name;
                        } else if (types.includes('administrative_area_level_2')) {
                            addressData.region = component.long_name;
                        } else if (types.includes('country')) {
                            addressData.country = component.long_name;
                        } else if (types.includes('postal_code')) {
                            addressData.postal_code = component.long_name;
                        } else if (types.includes('sublocality') || types.includes('neighborhood')) {
                            addressData.town = component.long_name;
                        }
                    });

                    // Auto-detect continent
                    if (addressData.country) {
                        addressData.continent = getContinent(addressData.country);
                    }

                    // Clean up address line 1
                    addressData.address_line1 = addressData.address_line1?.trim() || '';

                    setFormData(addressData);
                } else {
                    console.warn('Geocoding failed:', status);
                }
            }
        );
    };

    const searchOnMap = () => {
        if (!mapInstanceRef.current || !geocoderRef.current || !searchText.trim()) return;

        geocoderRef.current.geocode(
            { address: searchText },
            (results, status) => {
                if (status === 'OK' && results[0]) {
                    const result = results[0];
                    const location = result.geometry.location;
                    const latLng = { lat: location.lat(), lng: location.lng() };

                    mapInstanceRef.current.setCenter(latLng);
                    mapInstanceRef.current.setZoom(15);

                    addMarker(latLng, mapInstanceRef.current);
                    reverseGeocode(latLng);
                } else {
                    setMapError('Location not found. Please try a different search term.');
                }
            }
        );
    };

    const getCurrentLocation = () => {
        if (!navigator.geolocation) {
            setMapError('Geolocation is not supported by this browser.');
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const location = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                };

                if (mapInstanceRef.current) {
                    mapInstanceRef.current.setCenter(location);
                    mapInstanceRef.current.setZoom(15);
                    addMarker(location, mapInstanceRef.current);
                    reverseGeocode(location);
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
            const continent = getContinent(value);
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

    const getContinent = (country) => {
        const countryToContinent = {
            // North America
            'United States': 'North America', 'USA': 'North America', 'Canada': 'North America',
            'Mexico': 'North America', 'Guatemala': 'North America', 'Belize': 'North America',
            'Costa Rica': 'North America', 'El Salvador': 'North America', 'Honduras': 'North America',
            'Nicaragua': 'North America', 'Panama': 'North America',

            // Europe
            'United Kingdom': 'Europe', 'UK': 'Europe', 'England': 'Europe', 'Scotland': 'Europe',
            'Wales': 'Europe', 'Ireland': 'Europe', 'Germany': 'Europe', 'France': 'Europe',
            'Spain': 'Europe', 'Italy': 'Europe', 'Netherlands': 'Europe', 'Belgium': 'Europe',
            'Portugal': 'Europe', 'Greece': 'Europe', 'Poland': 'Europe', 'Sweden': 'Europe',
            'Norway': 'Europe', 'Denmark': 'Europe', 'Finland': 'Europe', 'Switzerland': 'Europe',
            'Austria': 'Europe', 'Czech Republic': 'Europe', 'Hungary': 'Europe', 'Romania': 'Europe',
            'Bulgaria': 'Europe', 'Croatia': 'Europe', 'Serbia': 'Europe', 'Ukraine': 'Europe',
            'Russia': 'Europe',

            // Asia
            'China': 'Asia', 'Japan': 'Asia', 'India': 'Asia', 'South Korea': 'Asia',
            'Singapore': 'Asia', 'Thailand': 'Asia', 'Philippines': 'Asia', 'Indonesia': 'Asia',
            'Malaysia': 'Asia', 'Vietnam': 'Asia', 'Bangladesh': 'Asia', 'Pakistan': 'Asia',
            'Sri Lanka': 'Asia', 'Myanmar': 'Asia', 'Cambodia': 'Asia', 'Laos': 'Asia',
            'Mongolia': 'Asia', 'Kazakhstan': 'Asia', 'Uzbekistan': 'Asia', 'Afghanistan': 'Asia',
            'Iran': 'Asia', 'Iraq': 'Asia', 'Saudi Arabia': 'Asia', 'United Arab Emirates': 'Asia',
            'UAE': 'Asia', 'Kuwait': 'Asia', 'Qatar': 'Asia', 'Bahrain': 'Asia', 'Oman': 'Asia',
            'Yemen': 'Asia', 'Jordan': 'Asia', 'Lebanon': 'Asia', 'Syria': 'Asia', 'Turkey': 'Asia',
            'Israel': 'Asia', 'Palestine': 'Asia',

            // Oceania
            'Australia': 'Oceania', 'New Zealand': 'Oceania', 'Fiji': 'Oceania',
            'Papua New Guinea': 'Oceania', 'Solomon Islands': 'Oceania', 'Vanuatu': 'Oceania',
            'Samoa': 'Oceania', 'Tonga': 'Oceania',

            // South America
            'Brazil': 'South America', 'Argentina': 'South America', 'Chile': 'South America',
            'Colombia': 'South America', 'Peru': 'South America', 'Venezuela': 'South America',
            'Ecuador': 'South America', 'Bolivia': 'South America', 'Paraguay': 'South America',
            'Uruguay': 'South America', 'Guyana': 'South America', 'Suriname': 'South America',
            'French Guiana': 'South America',

            // Africa
            'South Africa': 'Africa', 'Nigeria': 'Africa', 'Kenya': 'Africa', 'Egypt': 'Africa',
            'Morocco': 'Africa', 'Ghana': 'Africa', 'Ethiopia': 'Africa', 'Tanzania': 'Africa',
            'Uganda': 'Africa', 'Algeria': 'Africa', 'Sudan': 'Africa', 'Libya': 'Africa',
            'Tunisia': 'Africa', 'Zimbabwe': 'Africa', 'Zambia': 'Africa', 'Botswana': 'Africa',
            'Namibia': 'Africa', 'Mozambique': 'Africa', 'Madagascar': 'Africa', 'Cameroon': 'Africa',
            'Ivory Coast': 'Africa', 'Senegal': 'Africa', 'Mali': 'Africa', 'Burkina Faso': 'Africa',
            'Niger': 'Africa', 'Chad': 'Africa', 'Central African Republic': 'Africa',
            'Democratic Republic of the Congo': 'Africa', 'Republic of the Congo': 'Africa',
            'Gabon': 'Africa', 'Equatorial Guinea': 'Africa', 'Rwanda': 'Africa', 'Burundi': 'Africa'
        };

        // Try exact match first
        if (countryToContinent[country]) {
            return countryToContinent[country];
        }

        // Try partial match (case insensitive)
        const lowerCountry = country.toLowerCase();
        for (const [key, value] of Object.entries(countryToContinent)) {
            if (key.toLowerCase().includes(lowerCountry) || lowerCountry.includes(key.toLowerCase())) {
                return value;
            }
        }

        return '';
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

    const handleQuickSearch = () => {
        if (searchText.trim()) {
            // Parse simple search text
            const parts = searchText.split(',').map(p => p.trim());
            const updatedData = { ...formData };

            if (parts.length >= 1) updatedData.address_line1 = parts[0];
            if (parts.length >= 2) updatedData.city = parts[1];
            if (parts.length >= 3) updatedData.province = parts[2];
            if (parts.length >= 4) updatedData.country = parts[3];

            // Auto-detect continent
            if (updatedData.country) {
                const continent = getContinent(updatedData.country);
                if (continent) {
                    updatedData.continent = continent;
                }
            }

            setFormData(updatedData);
            setSearchText('');

            if (onPlaceSelect) {
                onPlaceSelect({
                    formattedAddress: generateFormattedAddress(updatedData),
                    geoLocationData: updatedData,
                    placeDetails: null
                });
            }
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

    return (
        <Box>
            {/* Quick Search and Map Button */}
            <Box sx={{ mb: 2, display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
                <TextField
                    fullWidth
                    label="Quick Address Search"
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    placeholder="e.g., 123 Main St, New York, NY, USA"
                    helperText="Enter address separated by commas"
                    onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                            handleQuickSearch();
                        }
                    }}
                    sx={{ flex: 3, minWidth: 220 }}
                />
                <Button
                    variant="outlined"
                    onClick={handleQuickSearch}
                    disabled={!searchText.trim()}
                    sx={{
                        minWidth: '80px',
                        maxWidth: '100px',
                        height: '56px',
                        color: '#633394',
                        borderColor: '#633394',
                        flex: 1
                    }}
                >
                    Parse
                </Button>
                <Button
                    variant="contained"
                    onClick={() => setMapOpen(true)}
                    startIcon={<MapIcon />}
                    sx={{
                        minWidth: '50px',
                        maxWidth: '100px',
                        height: '56px',
                        backgroundColor: '#967CB2',
                        '&:hover': { backgroundColor: '#967CB2' },
                        flex: 1
                    }}
                >
                    Map Search
                </Button>
                <Button
                    variant="outlined"
                    onClick={handleClear}
                    sx={{
                        minWidth: '60px',
                        maxWidth: '100px',
                        height: '56px',
                        color: '#633394',
                        borderColor: '#633394',
                        flex: 1
                    }}
                >
                    Clear
                </Button>
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
            <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2" sx={{ mb: 2, color: '#633394' }}>
                    <LocationOnIcon sx={{ fontSize: '1rem', mr: 0.5 }} />
                    Detailed Address Information
                </Typography>

                <Grid container spacing={2}>
                    {/* Row 1 */}
                    <Grid item xs={12} sm={6} sx={{ minWidth: 220 }}>
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
            </Box>

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
                                    color: '#967CB2',
                                    borderColor: '#967CB2',
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

export default MapAddressSelector; 