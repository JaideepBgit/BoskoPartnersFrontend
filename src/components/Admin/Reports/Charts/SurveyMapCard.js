import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    Card,
    CardHeader,
    CardContent,
    IconButton,
    Typography,
    Box,
    Tooltip,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Chip,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    List,
    ListItem,
    ListItemText,
    Divider,
    Alert,
    CircularProgress,
    Switch,
    FormControlLabel
} from '@mui/material';
import {
    Map as MapIcon,
    Minimize as MinimizeIcon,
    Maximize as MaximizeIcon,
    MyLocation as MyLocationIcon,
    FilterList as FilterIcon,
    Compare as CompareIcon,
    ClearAll as ClearAllIcon,
    RadioButtonUnchecked as CircleIcon,
    CheckCircle as CheckCircleIcon,
    Refresh as RefreshIcon
} from '@mui/icons-material';
import GoogleMapsService from '../../../../services/GoogleMapsService';

const SurveyMapCard = ({
    surveyData = {},
    targetSurveyId = null,
    selectedSurveyType = 'church',
    onSurveySelection = () => { },
    onAreaSelection = () => { },
    onSurveyTypeChange = () => { },
    adminColors = {
        primary: '#633394',
        secondary: '#967CB2',
        background: '#f5f5f5',
        text: '#212121'
    }
}) => {
    const [minimized, setMinimized] = useState(false);
    const [mapLoaded, setMapLoaded] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [markers, setMarkers] = useState([]);
    const [selectedMarkers, setSelectedMarkers] = useState([]);
    const [drawingMode, setDrawingMode] = useState(false);
    const [selectionCircle, setSelectionCircle] = useState(null);
    const [filterDialogOpen, setFilterDialogOpen] = useState(false);
    const [comparisonDialogOpen, setComparisonDialogOpen] = useState(false);
    const [filters, setFilters] = useState({
        country: '',
        educationLevel: '',
        ageGroup: '',
        institutionType: ''
    });
    const showAllTypes = selectedSurveyType === 'all';

    const mapRef = useRef(null);
    const mapInstanceRef = useRef(null);
    const drawingManagerRef = useRef(null);
    const markersRef = useRef([]);

    // Survey type configurations
    const surveyTypeConfig = {
        church: {
            label: 'Church Survey',
            color: '#4CAF50',
            icon: '⛪',
            markerIcon: 'church'
        },
        institution: {
            label: 'Institution Survey',
            color: '#2196F3',
            icon: '🏫',
            markerIcon: 'school'
        },
        non_formal: {
            label: 'Non-Formal Survey',
            color: '#FF9800',
            icon: '📚',
            markerIcon: 'library'
        }
    };

    // Initialize map when component mounts or is maximized
    useEffect(() => {
        if (!minimized && !mapLoaded) {
            loadGoogleMapsAPI();
        }
        // Note: We don't cleanup when minimized to allow re-expansion
    }, [minimized, mapLoaded]);

    // Track if auto-reload has already happened
    const autoReloadTriggeredRef = useRef(false);

    // Auto-reload the map once after initial load to ensure maps render properly
    useEffect(() => {
        if (mapLoaded && !autoReloadTriggeredRef.current) {
            const timer = setTimeout(() => {
                console.log('🔄 Auto-reload triggered to ensure map renders properly');
                autoReloadTriggeredRef.current = true;
                reloadMap();
            }, 3000); // Wait 3 seconds after initial load

            return () => clearTimeout(timer);
        }
    }, [mapLoaded]);

    // Update markers when survey data or filters change
    useEffect(() => {
        if (mapInstanceRef.current && surveyData) {
            updateMapMarkers();
        }
    }, [surveyData, selectedSurveyType, filters, showAllTypes, targetSurveyId]);

    // Cleanup function to properly remove map and markers
    useEffect(() => {
        return () => {
            // Clean up markers
            if (markersRef.current) {
                markersRef.current.forEach(marker => {
                    if (marker && marker.setMap) {
                        try {
                            marker.setMap(null);
                        } catch (error) {
                            console.warn('Error removing marker on unmount:', error);
                        }
                    }
                });
                markersRef.current = [];
            }

            // Clean up selection circle
            if (selectionCircle && selectionCircle.setMap) {
                try {
                    selectionCircle.setMap(null);
                } catch (error) {
                    console.warn('Error removing selection circle on unmount:', error);
                }
            }

            // Clean up drawing manager
            if (drawingManagerRef.current && drawingManagerRef.current.setMap) {
                try {
                    drawingManagerRef.current.setMap(null);
                } catch (error) {
                    console.warn('Error removing drawing manager on unmount:', error);
                }
            }

            // Clean up map instance
            if (mapInstanceRef.current && window.google && window.google.maps) {
                try {
                    window.google.maps.event.clearInstanceListeners(mapInstanceRef.current);
                } catch (error) {
                    console.warn('Error clearing map listeners on unmount:', error);
                }
            }

            // Clear the map container
            if (mapRef.current) {
                try {
                    mapRef.current.innerHTML = '';
                } catch (error) {
                    console.warn('Error clearing map container on unmount:', error);
                }
            }

            // Reset references
            mapInstanceRef.current = null;
            drawingManagerRef.current = null;

            // Clean up any global callbacks that might exist
            if (window.initializeGoogleMap) {
                delete window.initializeGoogleMap;
            }
            Object.keys(window).forEach(key => {
                if (key.startsWith('initGoogleMaps') || key.startsWith('initializeGoogleMap')) {
                    delete window[key];
                }
            });
        };
    }, []); // unmount only - fix for cleanup running on selectionCircle changes

    const cleanupMapResources = () => {
        // Clean up markers
        if (markersRef.current) {
            markersRef.current.forEach(marker => {
                if (marker && marker.setMap) {
                    try {
                        marker.setMap(null);
                    } catch (error) {
                        console.warn('Error removing marker during cleanup:', error);
                    }
                }
            });
            markersRef.current = [];
        }

        // Clean up selection circle
        if (selectionCircle && selectionCircle.setMap) {
            try {
                selectionCircle.setMap(null);
                setSelectionCircle(null);
            } catch (error) {
                console.warn('Error removing selection circle during cleanup:', error);
            }
        }

        // Clean up drawing manager
        if (drawingManagerRef.current && drawingManagerRef.current.setMap) {
            try {
                drawingManagerRef.current.setMap(null);
                drawingManagerRef.current = null;
            } catch (error) {
                console.warn('Error removing drawing manager during cleanup:', error);
            }
        }

        // Clean up map instance
        if (mapInstanceRef.current) {
            try {
                // Clear all event listeners
                window.google.maps.event.clearInstanceListeners(mapInstanceRef.current);
                mapInstanceRef.current = null;
            } catch (error) {
                console.warn('Error clearing map instance during cleanup:', error);
            }
        }

        // Clear the map container completely
        if (mapRef.current) {
            try {
                mapRef.current.innerHTML = '';
            } catch (error) {
                console.warn('Error clearing map container during cleanup:', error);
            }
        }

        // Reset states but keep mapLoaded true to allow re-expansion
        setSelectedMarkers([]);
        setDrawingMode(false);
        // Don't reset mapLoaded here to allow re-expansion
    };

    const loadGoogleMapsAPI = async () => {
        try {
            setLoading(true);
            setError('');
            console.log('🗺️ Starting Google Maps API loading...');

            // Check if Google Maps is already loaded
            if (window.google && window.google.maps && window.google.maps.Map) {
                console.log('✅ Google Maps already loaded, checking libraries...');
                checkAndInitializeMap();
                return;
            }

            console.log('📥 Loading Google Maps API script without callback...');

            // Check for existing script to prevent double-loading
            const existing = document.querySelector('script[data-google-maps-loader]');
            if (existing) {
                console.log('🔄 Google Maps script already loading, attaching to existing...');
                existing.addEventListener('load', () => setTimeout(checkAndInitializeMap, 500), { once: true });
                existing.addEventListener('error', () => {
                    setError('Failed to load Google Maps API');
                    setLoading(false);
                }, { once: true });
                return;
            }

            // Load without callback to avoid timing issues
            const script = document.createElement('script');
            script.setAttribute('data-google-maps-loader', 'true');
            script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.REACT_APP_GOOGLE_MAPS_API_KEY || 'AIzaSyAA5PZQdpcY4NXonqUny2sGZzMLbFKE0Iw'}&v=quarterly&libraries=drawing,geometry,marker&loading=async`;
            script.async = true;
            script.defer = true;

            script.onload = () => {
                console.log('🎯 Google Maps script loaded successfully!');
                // Give it a moment to initialize all libraries
                setTimeout(() => {
                    checkAndInitializeMap();
                }, 500);
            };

            script.onerror = () => {
                console.error('❌ Failed to load Google Maps script');
                setError('Failed to load Google Maps API. Please check your internet connection.');
                setLoading(false);
            };

            document.head.appendChild(script);
        } catch (err) {
            console.error('❌ Error loading Google Maps:', err);
            setError('Error loading Google Maps');
            setLoading(false);
        }
    };

    const checkAndInitializeMap = () => {
        console.log('🔍 Checking Google Maps libraries...');

        let attempts = 0;
        const maxAttempts = 50; // 5 seconds max - give more time

        const checkLibraries = () => {
            attempts++;
            console.log(`🔄 Attempt ${attempts}: Checking libraries...`);

            // More comprehensive checks
            try {
                if (window.google &&
                    window.google.maps &&
                    window.google.maps.Map &&
                    window.google.maps.drawing &&
                    window.google.maps.drawing.DrawingManager &&
                    window.google.maps.geometry &&
                    window.google.maps.marker &&
                    window.google.maps.marker.AdvancedMarkerElement &&
                    window.google.maps.LatLngBounds &&
                    window.google.maps.SymbolPath &&
                    window.google.maps.event) {

                    console.log('✅ All libraries loaded! Waiting for stability...');
                    // Additional wait for Google Maps internal initialization
                    setTimeout(() => {
                        if (mapRef.current) {
                            console.log('🎯 Proceeding with map initialization...');
                            initializeMap();
                        } else {
                            console.error('❌ Map container not available');
                            setError('Map container not ready');
                            setLoading(false);
                        }
                    }, 200); // Extra stability delay
                } else if (attempts < maxAttempts) {
                    console.log(`⏳ Libraries not ready yet, retrying... (${attempts}/${maxAttempts})`);
                    setTimeout(checkLibraries, 100);
                } else {
                    console.error('❌ Timeout waiting for Google Maps libraries');
                    setError('Google Maps libraries failed to load. Please try again.');
                    setLoading(false);
                }
            } catch (error) {
                console.warn(`⚠️ Error during library check (attempt ${attempts}):`, error);
                if (attempts < maxAttempts) {
                    setTimeout(checkLibraries, 100);
                } else {
                    setError('Error checking Google Maps libraries');
                    setLoading(false);
                }
            }
        };

        checkLibraries();
    };

    const initializeMap = () => {
        console.log('🎯 Starting map initialization...');

        // Comprehensive checks before initialization
        if (!window.google ||
            !window.google.maps ||
            !window.google.maps.Map ||
            !window.google.maps.drawing ||
            !window.google.maps.drawing.DrawingManager ||
            !mapRef.current) {
            console.error('❌ Prerequisites not met for map initialization');
            setError('Google Maps API not fully loaded or container not ready');
            setLoading(false);
            return;
        }

        try {
            console.log('🧹 Clearing map container...');
            // Clear any existing content in the map container
            if (mapRef.current) {
                mapRef.current.innerHTML = '';
            }

            // Create a dedicated div for Google Maps
            const mapDiv = document.createElement('div');
            mapDiv.style.width = '100%';
            mapDiv.style.height = '100%';
            mapDiv.id = `google-map-${Date.now()}`; // Unique ID
            mapRef.current.appendChild(mapDiv);

            console.log('🗺️ Creating Google Maps instance...');

            // Additional safety check before creating map
            if (!window.google.maps.Map) {
                throw new Error('Google Maps Map constructor not available');
            }

            const map = new window.google.maps.Map(mapDiv, {
                center: { lat: 0, lng: 0 }, // Default center
                zoom: 2,
                mapId: 'SURVEY_MAP_ID', // Required for AdvancedMarkerElement
                mapTypeId: window.google.maps.MapTypeId.ROADMAP,
                gestureHandling: 'cooperative',
                styles: [
                    {
                        featureType: 'poi',
                        elementType: 'labels',
                        stylers: [{ visibility: 'off' }]
                    }
                ]
            });

            // Wait for the map to be ready
            window.google.maps.event.addListenerOnce(map, 'idle', () => {
                console.log('🎉 Map is ready and idle!');
            });

            mapInstanceRef.current = map;
            console.log('✅ Map instance created successfully');

            // Initialize drawing manager for area selection
            console.log('🎨 Creating drawing manager...');

            // Check if drawing manager is available
            if (!window.google.maps.drawing || !window.google.maps.drawing.DrawingManager) {
                throw new Error('Google Maps drawing library not available');
            }

            const drawingManager = new window.google.maps.drawing.DrawingManager({
                drawingMode: null,
                drawingControl: false,
                circleOptions: {
                    fillColor: adminColors.primary,
                    fillOpacity: 0.2,
                    strokeWeight: 2,
                    strokeColor: adminColors.primary,
                    clickable: false,
                    editable: true,
                    zIndex: 1
                }
            });

            drawingManager.setMap(map);
            drawingManagerRef.current = drawingManager;
            console.log('✅ Drawing manager created successfully');

            // Handle circle completion
            window.google.maps.event.addListener(drawingManager, 'circlecomplete', (circle) => {
                console.log('⭕ Circle drawing completed');
                // Remove previous selection circle
                if (selectionCircle) {
                    selectionCircle.setMap(null);
                }
                setSelectionCircle(circle);
                setDrawingMode(false);
                drawingManager.setDrawingMode(null);

                // Find markers within the circle
                const markersInCircle = findMarkersInCircle(circle);
                setSelectedMarkers(markersInCircle);

                // Notify parent component
                onAreaSelection(markersInCircle);
            });

            console.log('🎉 Map initialization completed successfully!');
            setMapLoaded(true);
            setLoading(false);

            // Update markers after a brief delay to ensure map is ready
            setTimeout(() => {
                console.log('📍 Adding markers to map...');
                updateMapMarkers();
            }, 100);

        } catch (err) {
            console.error('❌ Error during map initialization:', err);
            setError(`Error initializing map: ${err.message}`);
            setLoading(false);
        }
    };

    const updateMapMarkers = () => {
        if (!mapInstanceRef.current || !surveyData) return;

        // Clear existing markers safely
        markersRef.current.forEach(marker => {
            if (marker && marker.setMap) {
                try {
                    marker.setMap(null);
                } catch (error) {
                    console.warn('Error removing marker:', error);
                }
            }
        });
        markersRef.current = [];

        let bounds = null;
        let hasValidCoordinates = false;

        try {
            bounds = new window.google.maps.LatLngBounds();
        } catch (error) {
            console.warn('Error creating LatLngBounds:', error);
        }

        // Get survey responses to display
        const responsesToShow = showAllTypes
            ? Object.values(surveyData).flat()
            : (surveyData[selectedSurveyType] || []);
        console.log(responsesToShow, surveyData);
        responsesToShow.forEach((response, index) => {
            const lat = parseFloat(response.latitude);
            const lng = parseFloat(response.longitude);

            if (isNaN(lat) || isNaN(lng)) return;

            // Apply filters
            if (!passesFilters(response)) return;
            console.log(response, lat, lng);
            const position = { lat, lng };
            const surveyType = response.survey_type || selectedSurveyType;
            const config = surveyTypeConfig[surveyType] || surveyTypeConfig.church;
            const isTargetSurvey = targetSurveyId && String(response.id) === String(targetSurveyId);

            // Create custom marker icon with safety check
            let markerIcon;
            try {
                markerIcon = {
                    path: window.google.maps.SymbolPath.CIRCLE,
                    fillColor: isTargetSurvey ? '#1A237E' : config.color, // Dark blue for target survey
                    fillOpacity: isTargetSurvey ? 1.0 : 0.8,
                    scale: isTargetSurvey ? 12 : 8, // Larger size for target survey
                    strokeColor: isTargetSurvey ? '#FFD700' : '#ffffff', // Gold border for target survey
                    strokeWeight: isTargetSurvey ? 3 : 2
                };
            } catch (error) {
                console.warn('Error creating marker icon, using default:', error);
                markerIcon = null; // Use default marker
            }

            // Create marker content for AdvancedMarkerElement
            const markerContent = document.createElement('div');
            markerContent.style.cssText = `
                width: ${isTargetSurvey ? '24px' : '16px'};
                height: ${isTargetSurvey ? '24px' : '16px'};
                border-radius: 50%;
                background-color: ${isTargetSurvey ? '#1A237E' : config.color};
                border: ${isTargetSurvey ? '3px solid #FFD700' : '2px solid #ffffff'};
                cursor: pointer;
                transition: all 0.2s ease;
                box-shadow: 0 2px 4px rgba(0,0,0,0.3);
            `;

            const marker = new window.google.maps.marker.AdvancedMarkerElement({
                position,
                map: mapInstanceRef.current,
                title: getMarkerTitle(response),
                content: markerContent,
                gmpDraggable: false
            });

            // Store additional data as properties on the marker
            marker.surveyData = response;
            marker.surveyType = surveyType;
            marker.isTargetSurvey = isTargetSurvey;

            // Add click listener for marker selection
            marker.addEventListener('gmp-click', () => {
                handleMarkerClick(marker);
            });

            // Create info window
            const infoWindow = new window.google.maps.InfoWindow({
                content: createInfoWindowContent(response, config, isTargetSurvey)
            });

            // Create hover effect using AdvancedMarkerElement
            marker.addEventListener('gmp-mouseenter', () => {
                infoWindow.open({
                    anchor: marker,
                    map: mapInstanceRef.current
                });
            });

            marker.addEventListener('gmp-mouseleave', () => {
                infoWindow.close();
            });

            markersRef.current.push(marker);

            // Safely extend bounds
            if (bounds) {
                try {
                    bounds.extend(position);
                } catch (error) {
                    console.warn('Error extending bounds:', error);
                }
            }
            hasValidCoordinates = true;
        });

        // Fit map to markers if we have valid coordinates
        if (hasValidCoordinates && bounds && !bounds.isEmpty()) {
            try {
                mapInstanceRef.current.fitBounds(bounds);

                // Ensure minimum zoom level
                const listener = window.google.maps.event.addListener(mapInstanceRef.current, 'bounds_changed', () => {
                    if (mapInstanceRef.current.getZoom() > 10) {
                        mapInstanceRef.current.setZoom(10);
                    }
                    window.google.maps.event.removeListener(listener);
                });
            } catch (error) {
                console.warn('Error fitting bounds:', error);
                // Fallback to default center and zoom
                mapInstanceRef.current.setCenter({ lat: 0, lng: 0 });
                mapInstanceRef.current.setZoom(2);
            }
        } else if (hasValidCoordinates) {
            // If we have coordinates but bounds is invalid, center on first marker
            const firstMarker = markersRef.current[0];
            if (firstMarker) {
                mapInstanceRef.current.setCenter(firstMarker.getPosition());
                mapInstanceRef.current.setZoom(4);
            }
        }

        setMarkers(markersRef.current);
    };

    const passesFilters = (response) => {
        if (filters.country && response.country !== filters.country) return false;
        if (filters.educationLevel && response.education_level !== filters.educationLevel) return false;
        if (filters.ageGroup && response.age_group !== filters.ageGroup) return false;
        if (filters.institutionType && response.institution_type !== filters.institutionType) return false;
        return true;
    };

    const getMarkerTitle = (response) => {
        const name = response.church_name || response.institution_name || response.organization_name || 'Survey Response';
        const location = [response.city, response.country].filter(Boolean).join(', ');
        return `${name}${location ? ` - ${location}` : ''}`;
    };

    const createInfoWindowContent = (response, config, isTargetSurvey = false) => {
        const name = response.church_name || response.institution_name || response.organization_name || 'Survey Response';
        const pastor = response.pastor_name || response.principal_name || response.contact_person || '';
        const location = [response.city, response.state, response.country].filter(Boolean).join(', ');
        const date = response.response_date || '';

        return `
            <div style="max-width: 200px;">
                ${isTargetSurvey ? `<div style="background: #1A237E; color: white; padding: 4px 8px; margin-bottom: 8px; border-radius: 4px; text-align: center; font-weight: bold;">🎯 TARGET SURVEY</div>` : ''}
                <div style="display: flex; align-items: center; margin-bottom: 8px;">
                    <div style="color: ${isTargetSurvey ? '#1A237E' : config.color}; font-size: 18px; margin-right: 8px;">${config.icon}</div>
                    <strong style="color: ${isTargetSurvey ? '#1A237E' : adminColors.primary};">${config.label}</strong>
                </div>
                <div style="margin-bottom: 4px;"><strong>${name}</strong></div>
                ${pastor ? `<div style="margin-bottom: 4px; color: #666;">👤 ${pastor}</div>` : ''}
                ${location ? `<div style="margin-bottom: 4px; color: #666;">📍 ${location}</div>` : ''}
                ${date ? `<div style="color: #666;">📅 ${new Date(date).toLocaleDateString()}</div>` : ''}
            </div>
        `;
    };

    const handleMarkerClick = (marker) => {
        // Toggle marker selection
        const isSelected = selectedMarkers.includes(marker);
        let newSelection;

        if (isSelected) {
            newSelection = selectedMarkers.filter(m => m !== marker);
        } else {
            newSelection = [...selectedMarkers, marker];
        }

        setSelectedMarkers(newSelection);

        // Update marker appearance
        updateMarkerSelection(marker, !isSelected);

        // Notify parent component
        onSurveySelection(newSelection.map(m => m.surveyData));
    };

    const updateMarkerSelection = (marker, selected) => {
        const surveyType = marker.surveyType;
        const config = surveyTypeConfig[surveyType] || surveyTypeConfig.church;
        const isTargetSurvey = marker.isTargetSurvey;

        // Update marker content for AdvancedMarkerElement
        const markerContent = marker.content;
        if (markerContent) {
            markerContent.style.cssText = `
                width: ${isTargetSurvey ? (selected ? '30px' : '24px') : (selected ? '20px' : '16px')};
                height: ${isTargetSurvey ? (selected ? '30px' : '24px') : (selected ? '20px' : '16px')};
                border-radius: 50%;
                background-color: ${isTargetSurvey ? '#1A237E' : (selected ? '#FFD700' : config.color)};
                border: ${isTargetSurvey ? (selected ? '4px solid #FF4081' : '3px solid #FFD700') : (selected ? '3px solid ${adminColors.primary}' : '2px solid #ffffff')};
                cursor: pointer;
                transition: all 0.2s ease;
                box-shadow: 0 2px 4px rgba(0,0,0,0.3);
            `;
        }
    };

    const findMarkersInCircle = (circle) => {
        const center = circle.getCenter();
        const radius = circle.getRadius();

        return markersRef.current.filter(marker => {
            const distance = window.google.maps.geometry.spherical.computeDistanceBetween(
                center,
                marker.getPosition()
            );
            return distance <= radius;
        });
    };

    const toggleDrawingMode = () => {
        if (!drawingManagerRef.current ||
            !drawingManagerRef.current.setDrawingMode ||
            !window.google?.maps?.drawing?.OverlayType) return;

        const newDrawingMode = !drawingMode;
        setDrawingMode(newDrawingMode);

        try {
            if (newDrawingMode) {
                drawingManagerRef.current.setDrawingMode(window.google.maps.drawing.OverlayType.CIRCLE);
            } else {
                drawingManagerRef.current.setDrawingMode(null);
            }
        } catch (error) {
            console.warn('Error toggling drawing mode:', error);
            setDrawingMode(false); // Reset on error
        }
    };

    const clearSelection = () => {
        // Clear visual selection safely
        selectedMarkers.forEach(marker => {
            if (marker && marker.setIcon) {
                try {
                    updateMarkerSelection(marker, false);
                } catch (error) {
                    console.warn('Error updating marker selection:', error);
                }
            }
        });
        setSelectedMarkers([]);

        // Remove selection circle safely
        if (selectionCircle && selectionCircle.setMap) {
            try {
                selectionCircle.setMap(null);
                setSelectionCircle(null);
            } catch (error) {
                console.warn('Error removing selection circle:', error);
            }
        }

        // Reset drawing mode safely
        setDrawingMode(false);
        if (drawingManagerRef.current && drawingManagerRef.current.setDrawingMode) {
            try {
                drawingManagerRef.current.setDrawingMode(null);
            } catch (error) {
                console.warn('Error resetting drawing mode:', error);
            }
        }

        // Notify parent component
        onSurveySelection([]);
        onAreaSelection([]);
    };

    const reloadMap = () => {
        console.log('🔄 Reloading map...');
        setLoading(true);
        setError('');

        // Clear all existing map resources
        cleanupMapResources();

        // Reset map state
        setMapLoaded(false);
        setSelectedMarkers([]);
        setDrawingMode(false);
        setSelectionCircle(null);
        setMarkers([]);

        // Clear any existing Google Maps scripts to force fresh load
        const existingScripts = document.querySelectorAll('script[data-google-maps-loader]');
        existingScripts.forEach(script => {
            try {
                script.remove();
            } catch (error) {
                console.warn('Error removing existing script:', error);
            }
        });

        // Reset global Google Maps state
        if (window.google && window.google.maps) {
            try {
                // Don't delete the global google object, just clear our references
                mapInstanceRef.current = null;
                drawingManagerRef.current = null;
                markersRef.current = [];
            } catch (error) {
                console.warn('Error clearing Google Maps state:', error);
            }
        }

        // Force reload after a brief delay to ensure cleanup is complete
        setTimeout(() => {
            loadGoogleMapsAPI();
        }, 100);
    };

    const getUniqueValues = (key) => {
        const allResponses = Object.values(surveyData).flat();
        const values = allResponses.map(response => response[key]).filter(Boolean);
        return [...new Set(values)].sort();
    };

    const filteredMarkersCount = markers.length;
    const selectedMarkersCount = selectedMarkers.length;
    const hasTargetSurvey = targetSurveyId && markers.some(marker => marker.isTargetSurvey);

    if (minimized) {
        return (
            <Card sx={{ minHeight: 60, backgroundColor: adminColors.background }}>
                <CardHeader
                    title="Survey Map"
                    titleTypographyProps={{ variant: 'h6', color: adminColors.primary }}
                    action={
                        <IconButton onClick={() => setMinimized(false)} size="small">
                            <MaximizeIcon />
                        </IconButton>
                    }
                    sx={{ py: 1 }}
                />
            </Card>
        );
    }

    return (
        <Card sx={{ height: 600, backgroundColor: adminColors.background }}>
            <CardHeader
                title={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <MapIcon sx={{ color: adminColors.primary }} />
                        <Typography variant="h6" sx={{ color: adminColors.primary }}>
                            Survey Map
                        </Typography>
                        {filteredMarkersCount > 0 && (
                            <Chip
                                label={`${filteredMarkersCount} surveys`}
                                size="small"
                                sx={{ backgroundColor: adminColors.secondary, color: 'white' }}
                            />
                        )}
                        {hasTargetSurvey && (
                            <Chip
                                label="Target"
                                size="small"
                                sx={{ backgroundColor: '#1A237E', color: 'white' }}
                            />
                        )}
                        {selectedMarkersCount > 0 && (
                            <Chip
                                label={`${selectedMarkersCount} selected`}
                                size="small"
                                sx={{ backgroundColor: '#FFD700', color: adminColors.text }}
                            />
                        )}
                    </Box>
                }
                action={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Tooltip title="Reload map">
                            <IconButton
                                onClick={reloadMap}
                                size="small"
                                disabled={loading}
                                sx={{
                                    color: loading ? adminColors.secondary : 'inherit',
                                    animation: loading ? 'spin 1s linear infinite' : 'none',
                                    '@keyframes spin': {
                                        '0%': { transform: 'rotate(0deg)' },
                                        '100%': { transform: 'rotate(360deg)' }
                                    }
                                }}
                            >
                                <RefreshIcon />
                            </IconButton>
                        </Tooltip>

                        <Tooltip title="Filter surveys">
                            <IconButton onClick={() => setFilterDialogOpen(true)} size="small" disabled={loading}>
                                <FilterIcon />
                            </IconButton>
                        </Tooltip>

                        <Tooltip title={drawingMode ? "Stop drawing" : "Draw selection circle"}>
                            <IconButton
                                onClick={toggleDrawingMode}
                                size="small"
                                disabled={loading || !mapLoaded}
                                sx={{ color: drawingMode ? '#FFD700' : 'inherit' }}
                            >
                                {drawingMode ? <CheckCircleIcon /> : <CircleIcon />}
                            </IconButton>
                        </Tooltip>

                        {(selectedMarkersCount > 0 || selectionCircle) && (
                            <Tooltip title="Clear selection">
                                <IconButton onClick={clearSelection} size="small" disabled={loading}>
                                    <ClearAllIcon />
                                </IconButton>
                            </Tooltip>
                        )}

                        {selectedMarkersCount > 1 && (
                            <Tooltip title="Compare selected">
                                <IconButton onClick={() => setComparisonDialogOpen(true)} size="small" disabled={loading}>
                                    <CompareIcon />
                                </IconButton>
                            </Tooltip>
                        )}

                        <IconButton onClick={() => setMinimized(true)} size="small">
                            <MinimizeIcon />
                        </IconButton>
                    </Box>
                }
            />

            <CardContent sx={{ p: 0, height: 'calc(100% - 64px)', position: 'relative' }}>
                {/* Survey Type Controls */}
                <Box sx={{
                    position: 'absolute',
                    top: 10,
                    left: 10,
                    zIndex: 1000,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 1
                }}>
                    <FormControlLabel
                        control={
                            <Switch
                                checked={showAllTypes}
                                onChange={(e) => onSurveyTypeChange(e.target.checked ? 'all' : 'church')}
                                size="small"
                            />
                        }
                        label="Show All Types"
                        sx={{
                            backgroundColor: 'white',
                            borderRadius: 1,
                            px: 1,
                            margin: 0,
                            boxShadow: 1
                        }}
                    />

                    {!showAllTypes && (
                        <FormControl size="small" sx={{ minWidth: 150, backgroundColor: 'white', borderRadius: 1 }}>
                            <InputLabel>Survey Type</InputLabel>
                            <Select
                                value={selectedSurveyType}
                                onChange={(e) => onSurveyTypeChange(e.target.value)}
                                label="Survey Type"
                            >
                                {Object.entries(surveyTypeConfig).map(([key, config]) => (
                                    <MenuItem key={key} value={key}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <Box sx={{ color: config.color }}>{config.icon}</Box>
                                            {config.label}
                                        </Box>
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    )}
                </Box>

                {/* Legend */}
                <Box sx={{
                    position: 'absolute',
                    bottom: 10,
                    right: 10,
                    zIndex: 1000,
                    backgroundColor: 'white',
                    borderRadius: 1,
                    p: 1,
                    boxShadow: 1
                }}>
                    <Typography variant="caption" fontWeight="bold" gutterBottom>
                        Legend
                    </Typography>
                    {Object.entries(surveyTypeConfig).map(([key, config]) => (
                        <Box key={key} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                            <Box
                                sx={{
                                    width: 12,
                                    height: 12,
                                    borderRadius: '50%',
                                    backgroundColor: config.color
                                }}
                            />
                            <Typography variant="caption">{config.label}</Typography>
                        </Box>
                    ))}
                    <Divider sx={{ my: 1 }} />
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                        <Box
                            sx={{
                                width: 12,
                                height: 12,
                                borderRadius: '50%',
                                backgroundColor: '#1A237E',
                                border: '2px solid #FFD700'
                            }}
                        />
                        <Typography variant="caption">Target Survey</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box
                            sx={{
                                width: 12,
                                height: 12,
                                borderRadius: '50%',
                                backgroundColor: '#FFD700',
                                border: `2px solid ${adminColors.primary}`
                            }}
                        />
                        <Typography variant="caption">Selected</Typography>
                    </Box>
                </Box>

                {/* Map Container */}
                <Box
                    key={`map-container-${mapLoaded ? 'loaded' : 'not-loaded'}`}
                    ref={mapRef}
                    sx={{
                        width: '100%',
                        height: '100%',
                        backgroundColor: '#f0f0f0',
                        position: 'relative'
                    }}
                >
                    {/* Loading/Error/Not Loaded Overlay */}
                    {(loading || error || !mapLoaded) && (
                        <Box
                            sx={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                right: 0,
                                bottom: 0,
                                backgroundColor: '#f0f0f0',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                zIndex: 1000
                            }}
                        >
                            {loading && (
                                <Box sx={{ textAlign: 'center' }}>
                                    <CircularProgress sx={{ color: adminColors.primary }} />
                                    <Typography variant="body2" sx={{ mt: 1 }}>
                                        {mapLoaded ? 'Reloading map...' : 'Loading map...'}
                                    </Typography>
                                </Box>
                            )}
                            {error && (
                                <Box sx={{ textAlign: 'center' }}>
                                    <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
                                    <Typography
                                        variant="body2"
                                        color="primary"
                                        sx={{
                                            cursor: 'pointer',
                                            '&:hover': { textDecoration: 'underline' }
                                        }}
                                        onClick={() => {
                                            if (!loading) {
                                                reloadMap();
                                            }
                                        }}
                                    >
                                        Click to reload map
                                    </Typography>
                                </Box>
                            )}
                            {!loading && !error && !mapLoaded && (
                                <Typography
                                    variant="body2"
                                    color="primary"
                                    sx={{
                                        cursor: 'pointer',
                                        '&:hover': { textDecoration: 'underline' }
                                    }}
                                    onClick={() => {
                                        if (!loading) {
                                            loadGoogleMapsAPI();
                                        }
                                    }}
                                >
                                    Click to load map
                                </Typography>
                            )}
                        </Box>
                    )}
                </Box>
            </CardContent>

            {/* Filter Dialog */}
            <Dialog open={filterDialogOpen} onClose={() => setFilterDialogOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Filter Survey Results</DialogTitle>
                <DialogContent>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
                        <FormControl fullWidth>
                            <InputLabel>Country</InputLabel>
                            <Select
                                value={filters.country}
                                onChange={(e) => setFilters(prev => ({ ...prev, country: e.target.value }))}
                                label="Country"
                            >
                                <MenuItem value="">All Countries</MenuItem>
                                {getUniqueValues('country').map(country => (
                                    <MenuItem key={country} value={country}>{country}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        <FormControl fullWidth>
                            <InputLabel>Education Level</InputLabel>
                            <Select
                                value={filters.educationLevel}
                                onChange={(e) => setFilters(prev => ({ ...prev, educationLevel: e.target.value }))}
                                label="Education Level"
                            >
                                <MenuItem value="">All Levels</MenuItem>
                                {getUniqueValues('education_level').map(level => (
                                    <MenuItem key={level} value={level}>{level}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        <FormControl fullWidth>
                            <InputLabel>Age Group</InputLabel>
                            <Select
                                value={filters.ageGroup}
                                onChange={(e) => setFilters(prev => ({ ...prev, ageGroup: e.target.value }))}
                                label="Age Group"
                            >
                                <MenuItem value="">All Ages</MenuItem>
                                {getUniqueValues('age_group').map(age => (
                                    <MenuItem key={age} value={age}>{age}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setFilters({ country: '', educationLevel: '', ageGroup: '', institutionType: '' })}>
                        Clear All
                    </Button>
                    <Button onClick={() => setFilterDialogOpen(false)}>Apply</Button>
                </DialogActions>
            </Dialog>

            {/* Comparison Dialog */}
            <Dialog open={comparisonDialogOpen} onClose={() => setComparisonDialogOpen(false)} maxWidth="md" fullWidth>
                <DialogTitle>
                    Compare Selected Surveys ({selectedMarkersCount} selected)
                </DialogTitle>
                <DialogContent>
                    <List>
                        {selectedMarkers.map((marker, index) => {
                            const response = marker.surveyData;
                            const name = response.church_name || response.institution_name || response.organization_name || `Survey ${index + 1}`;
                            const location = [response.city, response.country].filter(Boolean).join(', ');
                            const config = surveyTypeConfig[marker.surveyType] || surveyTypeConfig.church;

                            return (
                                <React.Fragment key={index}>
                                    <ListItem>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mr: 2 }}>
                                            <Box sx={{ color: config.color, fontSize: '18px' }}>
                                                {config.icon}
                                            </Box>
                                        </Box>
                                        <ListItemText
                                            primary={name}
                                            secondary={
                                                <Box>
                                                    <Typography variant="body2" color="textSecondary">
                                                        {config.label} - {location}
                                                    </Typography>
                                                    <Typography variant="caption" color="textSecondary">
                                                        Response Date: {response.response_date || 'N/A'}
                                                    </Typography>
                                                </Box>
                                            }
                                        />
                                    </ListItem>
                                    {index < selectedMarkers.length - 1 && <Divider />}
                                </React.Fragment>
                            );
                        })}
                    </List>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setComparisonDialogOpen(false)}>Close</Button>
                    <Button
                        variant="contained"
                        sx={{ backgroundColor: adminColors.primary }}
                        onClick={() => {
                            const selected = selectedMarkers.map(m => m.surveyData);
                            // Re-emit the exact selection to the parent to trigger recompute
                            onSurveySelection(selected);
                            setComparisonDialogOpen(false);
                        }}
                    >
                        Generate Comparison Report
                    </Button>
                </DialogActions>
            </Dialog>
        </Card>
    );
};

export default SurveyMapCard;
