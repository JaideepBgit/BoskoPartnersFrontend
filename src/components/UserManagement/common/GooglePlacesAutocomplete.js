import React, { useEffect, useRef, useState, useCallback } from 'react';
import { TextField, Box, Button, Dialog, DialogTitle, DialogContent, DialogActions, Alert } from '@mui/material';
import MapIcon from '@mui/icons-material/Map';

const GooglePlacesAutocomplete = ({ 
    onPlaceSelect, 
    value, 
    onChange, 
    label = "Search Address",
    variant = "outlined",
    fullWidth = true,
    disabled = false 
}) => {
    const inputRef = useRef(null);
    const mapRef = useRef(null);
    const autocompleteRef = useRef(null);
    const mapInstance = useRef(null);
    const markerRef = useRef(null);
    
    const [isLoaded, setIsLoaded] = useState(false);
    const [error, setError] = useState(null);
    const [showMapDialog, setShowMapDialog] = useState(false);
    const [selectedPlace, setSelectedPlace] = useState(null);
    
    const GOOGLE_API_KEY = process.env.REACT_APP_GOOGLE_MAPS_API_KEY || 'AIzaSyAA5PZQdpcY4NXonqUny2sGZzMLbFKE0Iw';

    // Load Google Maps API
    const loadGoogleMapsAPI = useCallback(() => {
        // Check if already loaded
        if (window.google && window.google.maps && window.google.maps.places) {
            setIsLoaded(true);
            return Promise.resolve();
        }

        return new Promise((resolve, reject) => {
            // Check if script already exists
            const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
            if (existingScript) {
                // Wait for existing script
                const checkLoaded = () => {
                    if (window.google && window.google.maps && window.google.maps.places) {
                        setIsLoaded(true);
                        resolve();
                    } else {
                        setTimeout(checkLoaded, 100);
                    }
                };
                checkLoaded();
                return;
            }

            // Create new script
            const script = document.createElement('script');
            const callbackName = `googleMapsInit_${Date.now()}`;
            
            window[callbackName] = () => {
                setIsLoaded(true);
                setError(null);
                delete window[callbackName];
                resolve();
            };

            script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_API_KEY}&libraries=places&callback=${callbackName}`;
            script.async = true;
            script.onerror = () => {
                setError('Failed to load Google Maps');
                delete window[callbackName];
                reject(new Error('Failed to load Google Maps'));
            };

            document.head.appendChild(script);
        });
    }, []);

    useEffect(() => {
        loadGoogleMapsAPI().catch(console.error);
    }, [loadGoogleMapsAPI]);

    // Initialize autocomplete when API is loaded
    useEffect(() => {
        if (isLoaded && inputRef.current && !autocompleteRef.current) {
            initializeAutocomplete();
        }
    }, [isLoaded]);

    const initializeAutocomplete = () => {
        if (!window.google?.maps?.places || !inputRef.current) return;

        try {
            // Get the actual input element (Material-UI wraps it)
            const inputElement = inputRef.current.querySelector('input') || inputRef.current;
            
            autocompleteRef.current = new window.google.maps.places.Autocomplete(inputElement, {
                types: ['address'],
                fields: ['address_components', 'formatted_address', 'geometry', 'name']
            });

            autocompleteRef.current.addListener('place_changed', handlePlaceSelect);
        } catch (error) {
            console.error('Error initializing autocomplete:', error);
            setError('Failed to initialize address search');
        }
    };

    const handlePlaceSelect = () => {
        if (!autocompleteRef.current) return;

        const place = autocompleteRef.current.getPlace();
        if (!place.geometry || !place.address_components) {
            setError('Please select a valid address from the dropdown');
            return;
        }

        processPlace(place);
    };

    const processPlace = (place) => {
        try {
            const addressComponents = {};
            
            place.address_components.forEach(component => {
                const types = component.types;
                
                if (types.includes('street_number')) {
                    addressComponents.street_number = component.long_name;
                }
                if (types.includes('route')) {
                    addressComponents.route = component.long_name;
                }
                if (types.includes('locality')) {
                    addressComponents.city = component.long_name;
                }
                if (types.includes('sublocality_level_1')) {
                    addressComponents.town = component.long_name;
                }
                if (types.includes('administrative_area_level_1')) {
                    addressComponents.province = component.long_name;
                }
                if (types.includes('administrative_area_level_2')) {
                    addressComponents.region = component.long_name;
                }
                if (types.includes('country')) {
                    addressComponents.country = component.long_name;
                }
                if (types.includes('postal_code')) {
                    addressComponents.postal_code = component.long_name;
                }
            });

            const coordinates = {
                latitude: place.geometry.location.lat(),
                longitude: place.geometry.location.lng()
            };

            const address_line1 = [
                addressComponents.street_number,
                addressComponents.route
            ].filter(Boolean).join(' ');

            // Enhanced continent mapping
            const continentMap = {
                'United States': 'North America',
                'Canada': 'North America',
                'Mexico': 'North America',
                'Guatemala': 'North America',
                'Belize': 'North America',
                'Costa Rica': 'North America',
                'El Salvador': 'North America',
                'Honduras': 'North America',
                'Nicaragua': 'North America',
                'Panama': 'North America',
                
                'United Kingdom': 'Europe',
                'Germany': 'Europe',
                'France': 'Europe',
                'Spain': 'Europe',
                'Italy': 'Europe',
                'Netherlands': 'Europe',
                'Belgium': 'Europe',
                'Portugal': 'Europe',
                'Greece': 'Europe',
                'Poland': 'Europe',
                'Sweden': 'Europe',
                'Norway': 'Europe',
                'Denmark': 'Europe',
                'Finland': 'Europe',
                'Switzerland': 'Europe',
                'Austria': 'Europe',
                'Czech Republic': 'Europe',
                'Hungary': 'Europe',
                'Romania': 'Europe',
                'Bulgaria': 'Europe',
                'Croatia': 'Europe',
                'Serbia': 'Europe',
                'Ukraine': 'Europe',
                'Russia': 'Europe',
                
                'Australia': 'Oceania',
                'New Zealand': 'Oceania',
                'Fiji': 'Oceania',
                'Papua New Guinea': 'Oceania',
                'Solomon Islands': 'Oceania',
                'Vanuatu': 'Oceania',
                'Samoa': 'Oceania',
                'Tonga': 'Oceania',
                
                'China': 'Asia',
                'Japan': 'Asia',
                'India': 'Asia',
                'South Korea': 'Asia',
                'Singapore': 'Asia',
                'Thailand': 'Asia',
                'Philippines': 'Asia',
                'Indonesia': 'Asia',
                'Malaysia': 'Asia',
                'Vietnam': 'Asia',
                'Bangladesh': 'Asia',
                'Pakistan': 'Asia',
                'Sri Lanka': 'Asia',
                'Myanmar': 'Asia',
                'Cambodia': 'Asia',
                'Laos': 'Asia',
                'Mongolia': 'Asia',
                'Kazakhstan': 'Asia',
                'Uzbekistan': 'Asia',
                'Afghanistan': 'Asia',
                'Iran': 'Asia',
                'Iraq': 'Asia',
                'Saudi Arabia': 'Asia',
                'United Arab Emirates': 'Asia',
                'Kuwait': 'Asia',
                'Qatar': 'Asia',
                'Bahrain': 'Asia',
                'Oman': 'Asia',
                'Yemen': 'Asia',
                'Jordan': 'Asia',
                'Lebanon': 'Asia',
                'Syria': 'Asia',
                'Turkey': 'Asia',
                'Israel': 'Asia',
                'Palestine': 'Asia',
                
                'Brazil': 'South America',
                'Argentina': 'South America',
                'Chile': 'South America',
                'Colombia': 'South America',
                'Peru': 'South America',
                'Venezuela': 'South America',
                'Ecuador': 'South America',
                'Bolivia': 'South America',
                'Paraguay': 'South America',
                'Uruguay': 'South America',
                'Guyana': 'South America',
                'Suriname': 'South America',
                'French Guiana': 'South America',
                
                'South Africa': 'Africa',
                'Nigeria': 'Africa',
                'Kenya': 'Africa',
                'Egypt': 'Africa',
                'Morocco': 'Africa',
                'Ghana': 'Africa',
                'Ethiopia': 'Africa',
                'Tanzania': 'Africa',
                'Uganda': 'Africa',
                'Algeria': 'Africa',
                'Sudan': 'Africa',
                'Libya': 'Africa',
                'Tunisia': 'Africa',
                'Zimbabwe': 'Africa',
                'Zambia': 'Africa',
                'Botswana': 'Africa',
                'Namibia': 'Africa',
                'Mozambique': 'Africa',
                'Madagascar': 'Africa',
                'Cameroon': 'Africa',
                'Ivory Coast': 'Africa',
                'Senegal': 'Africa',
                'Mali': 'Africa',
                'Burkina Faso': 'Africa',
                'Niger': 'Africa',
                'Chad': 'Africa',
                'Central African Republic': 'Africa',
                'Democratic Republic of the Congo': 'Africa',
                'Republic of the Congo': 'Africa',
                'Gabon': 'Africa',
                'Equatorial Guinea': 'Africa',
                'Rwanda': 'Africa',
                'Burundi': 'Africa'
            };

            const geoLocationData = {
                continent: continentMap[addressComponents.country] || '',
                region: addressComponents.region || '',
                country: addressComponents.country || '',
                province: addressComponents.province || '',
                city: addressComponents.city || '',
                town: addressComponents.town || '',
                address_line1: address_line1 || '',
                address_line2: '',
                postal_code: addressComponents.postal_code || '',
                latitude: coordinates.latitude.toString(),
                longitude: coordinates.longitude.toString()
            };

            if (onPlaceSelect) {
                onPlaceSelect({
                    formattedAddress: place.formatted_address,
                    geoLocationData: geoLocationData,
                    placeDetails: place
                });
            }

            setError(null);
        } catch (error) {
            console.error('Error processing place:', error);
            setError('Error processing selected address');
        }
    };

    const initializeMap = () => {
        if (!window.google?.maps || !mapRef.current) return;

        const map = new window.google.maps.Map(mapRef.current, {
            center: { lat: 40.7128, lng: -74.0060 }, // Default to NYC
            zoom: 13,
            mapTypeControl: true,
            streetViewControl: true,
            fullscreenControl: true
        });

        mapInstance.current = map;

        // Add click listener to map
        map.addListener('click', (event) => {
            const lat = event.latLng.lat();
            const lng = event.latLng.lng();

            // Remove previous marker
            if (markerRef.current) {
                markerRef.current.setMap(null);
            }

            // Add new marker
            markerRef.current = new window.google.maps.Marker({
                position: { lat, lng },
                map: map,
                draggable: true
            });

            // Reverse geocode to get address
            const geocoder = new window.google.maps.Geocoder();
            geocoder.geocode({ location: { lat, lng } }, (results, status) => {
                if (status === 'OK' && results[0]) {
                    setSelectedPlace(results[0]);
                }
            });

            // Update marker position on drag
            markerRef.current.addListener('dragend', (dragEvent) => {
                const newLat = dragEvent.latLng.lat();
                const newLng = dragEvent.latLng.lng();
                
                geocoder.geocode({ location: { lat: newLat, lng: newLng } }, (results, status) => {
                    if (status === 'OK' && results[0]) {
                        setSelectedPlace(results[0]);
                    }
                });
            });
        });
    };

    const handleMapDialogOpen = () => {
        setShowMapDialog(true);
        setSelectedPlace(null);
        // Initialize map after dialog opens
        setTimeout(initializeMap, 100);
    };

    const handleMapDialogClose = () => {
        setShowMapDialog(false);
        setSelectedPlace(null);
        if (markerRef.current) {
            markerRef.current.setMap(null);
            markerRef.current = null;
        }
    };

    const handleSelectFromMap = () => {
        if (selectedPlace) {
            processPlace(selectedPlace);
            handleMapDialogClose();
        }
    };

    const handleInputChange = (event) => {
        if (onChange) {
            onChange(event);
        }
    };

    const getHelperText = () => {
        if (error) return error;
        if (!isLoaded) return "Loading Google Places...";
        return "Type an address or click map icon to select on map";
    };

    return (
        <Box>
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-end' }}>
                <Box sx={{ flex: 1 }}>
                    <TextField
                        ref={inputRef}
                        value={value}
                        onChange={handleInputChange}
                        label={label}
                        variant={variant}
                        fullWidth={fullWidth}
                        disabled={disabled || !isLoaded}
                        placeholder={isLoaded ? "Start typing an address..." : "Loading..."}
                        helperText={getHelperText()}
                        error={!!error}
                        inputProps={{
                            autoComplete: 'off',
                            spellCheck: false
                        }}
                        FormHelperTextProps={{
                            sx: { 
                                color: error ? 'error.main' : '#633394',
                                fontSize: '0.75rem' 
                            }
                        }}
                    />
                </Box>
                <Button
                    variant="outlined"
                    onClick={handleMapDialogOpen}
                    disabled={!isLoaded}
                    sx={{ 
                        minWidth: '56px',
                        height: '56px',
                        color: '#633394',
                        borderColor: '#633394',
                        '&:hover': {
                            borderColor: '#7c52a5',
                            color: '#7c52a5'
                        }
                    }}
                >
                    <MapIcon />
                </Button>
            </Box>

            {error && (
                <Alert severity="error" sx={{ mt: 1 }}>
                    {error}
                </Alert>
            )}

            {/* Map Selection Dialog */}
            <Dialog 
                open={showMapDialog} 
                onClose={handleMapDialogClose}
                maxWidth="md"
                fullWidth
            >
                <DialogTitle>Select Address on Map</DialogTitle>
                <DialogContent>
                    <Box sx={{ height: 400, width: '100%', mt: 1 }}>
                        <div ref={mapRef} style={{ height: '100%', width: '100%' }} />
                    </Box>
                    {selectedPlace && (
                        <Alert severity="info" sx={{ mt: 2 }}>
                            Selected: {selectedPlace.formatted_address}
                        </Alert>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleMapDialogClose}>Cancel</Button>
                    <Button 
                        onClick={handleSelectFromMap}
                        variant="contained"
                        disabled={!selectedPlace}
                        sx={{ 
                            backgroundColor: '#633394',
                            '&:hover': { backgroundColor: '#7c52a5' }
                        }}
                    >
                        Select This Address
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default GooglePlacesAutocomplete; 