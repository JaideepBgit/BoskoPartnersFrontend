import React, { useEffect, useRef, useState } from 'react';
import { TextField, Box, Alert } from '@mui/material';

const GooglePlacesAutocompleteSimple = ({ 
    onPlaceSelect, 
    value, 
    onChange, 
    label = "Search Address",
    variant = "outlined",
    fullWidth = true,
    disabled = false 
}) => {
    const inputRef = useRef(null);
    const autocompleteRef = useRef(null);
    const [isLoaded, setIsLoaded] = useState(false);
    const [error, setError] = useState(null);
    const [inputValue, setInputValue] = useState(value || '');
    
    const GOOGLE_API_KEY = 'AIzaSyAgmQbrpdURf4s6jeyN2DQt6IVo_Fg7Hyg';

    useEffect(() => {
        if (!window.google) {
            loadGooglePlacesAPI();
        } else {
            setIsLoaded(true);
            initializeAutocomplete();
        }
    }, []);

    useEffect(() => {
        if (isLoaded && !autocompleteRef.current) {
            initializeAutocomplete();
        }
    }, [isLoaded]);

    const loadGooglePlacesAPI = () => {
        // Check if script already exists
        if (document.querySelector('script[src*="maps.googleapis.com"]')) {
            return;
        }

        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_API_KEY}&libraries=places`;
        script.async = true;
        
        script.onload = () => {
            setIsLoaded(true);
            setError(null);
        };
        
        script.onerror = () => {
            setError('Failed to load Google Places API. Please check your API key.');
        };

        document.head.appendChild(script);
    };

    const initializeAutocomplete = () => {
        if (!window.google?.maps?.places || !inputRef.current) {
            return;
        }

        try {
            // Find the actual input element inside the Material-UI TextField
            const inputElement = inputRef.current.querySelector('input');
            if (!inputElement) {
                console.error('Could not find input element');
                return;
            }

            autocompleteRef.current = new window.google.maps.places.Autocomplete(inputElement, {
                types: ['address'],
                fields: ['address_components', 'formatted_address', 'geometry']
            });

            autocompleteRef.current.addListener('place_changed', () => {
                const place = autocompleteRef.current.getPlace();
                if (place && place.address_components) {
                    processPlace(place);
                }
            });

        } catch (error) {
            console.error('Error initializing autocomplete:', error);
            setError('Error initializing address search');
        }
    };

    const processPlace = (place) => {
        try {
            const components = {};
            
            place.address_components.forEach(component => {
                const types = component.types;
                
                if (types.includes('street_number')) {
                    components.street_number = component.long_name;
                }
                if (types.includes('route')) {
                    components.route = component.long_name;
                }
                if (types.includes('locality')) {
                    components.city = component.long_name;
                }
                if (types.includes('sublocality_level_1')) {
                    components.town = component.long_name;
                }
                if (types.includes('administrative_area_level_1')) {
                    components.province = component.long_name;
                }
                if (types.includes('administrative_area_level_2')) {
                    components.region = component.long_name;
                }
                if (types.includes('country')) {
                    components.country = component.long_name;
                }
                if (types.includes('postal_code')) {
                    components.postal_code = component.long_name;
                }
            });

            const coords = place.geometry?.location ? {
                lat: place.geometry.location.lat(),
                lng: place.geometry.location.lng()
            } : { lat: 0, lng: 0 };

            const address_line1 = [components.street_number, components.route]
                .filter(Boolean).join(' ');

            // Simple continent mapping
            const continentMap = {
                'United States': 'North America',
                'Canada': 'North America',
                'Mexico': 'North America',
                'United Kingdom': 'Europe',
                'Germany': 'Europe',
                'France': 'Europe',
                'Spain': 'Europe',
                'Italy': 'Europe',
                'Netherlands': 'Europe',
                'Belgium': 'Europe',
                'Australia': 'Oceania',
                'New Zealand': 'Oceania',
                'China': 'Asia',
                'Japan': 'Asia',
                'India': 'Asia',
                'South Korea': 'Asia',
                'Thailand': 'Asia',
                'Philippines': 'Asia',
                'Indonesia': 'Asia',
                'Singapore': 'Asia',
                'Brazil': 'South America',
                'Argentina': 'South America',
                'Chile': 'South America',
                'Colombia': 'South America',
                'South Africa': 'Africa',
                'Nigeria': 'Africa',
                'Kenya': 'Africa',
                'Egypt': 'Africa',
                'Morocco': 'Africa',
                'Ghana': 'Africa'
            };

            const geoData = {
                continent: continentMap[components.country] || '',
                region: components.region || '',
                country: components.country || '',
                province: components.province || '',
                city: components.city || '',
                town: components.town || '',
                address_line1: address_line1,
                address_line2: '',
                postal_code: components.postal_code || '',
                latitude: coords.lat ? coords.lat.toString() : '',
                longitude: coords.lng ? coords.lng.toString() : ''
            };

            if (onPlaceSelect) {
                onPlaceSelect({
                    formattedAddress: place.formatted_address,
                    geoLocationData: geoData,
                    placeDetails: place
                });
            }

            // Clear the input after selection
            setInputValue('');
            setError(null);

        } catch (error) {
            console.error('Error processing place:', error);
            setError('Error processing address');
        }
    };

    const handleInputChange = (event) => {
        const newValue = event.target.value;
        setInputValue(newValue);
        if (onChange) {
            onChange(event);
        }
    };

    return (
        <Box>
            <TextField
                ref={inputRef}
                value={inputValue}
                onChange={handleInputChange}
                label={label}
                variant={variant}
                fullWidth={fullWidth}
                disabled={disabled || !isLoaded}
                placeholder={isLoaded ? "Type an address..." : "Loading Google Places..."}
                helperText={
                    error ? error : 
                    !isLoaded ? "Loading Google Places..." : 
                    "Start typing an address and select from suggestions"
                }
                error={!!error}
                inputProps={{
                    autoComplete: 'new-password', // Disable browser autocomplete
                    spellCheck: false
                }}
                FormHelperTextProps={{
                    sx: { 
                        color: error ? 'error.main' : '#633394',
                        fontSize: '0.75rem' 
                    }
                }}
            />
            
            {error && (
                <Alert severity="error" sx={{ mt: 1 }}>
                    {error}
                </Alert>
            )}
        </Box>
    );
};

export default GooglePlacesAutocompleteSimple; 