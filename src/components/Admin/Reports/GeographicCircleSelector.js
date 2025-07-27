import React, { useState, useEffect, useRef } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Box,
    Typography,
    List,
    ListItem,
    ListItemText,
    ListItemSecondaryAction,
    IconButton,
    Chip,
    Alert,
    TextField,
    Paper,
    Divider,
    FormControlLabel,
    Switch,
    Slider
} from '@mui/material';
import {
    Map as MapIcon,
    Delete as DeleteIcon,
    LocationOn as LocationIcon,
    MyLocation as MyLocationIcon,
    Clear as ClearIcon,
    Visibility as VisibilityIcon,
    VisibilityOff as VisibilityOffIcon
} from '@mui/icons-material';

const GeographicCircleSelector = ({
    open,
    onClose,
    onCirclesUpdate,
    initialCircles = [],
    title = "Select Geographic Regions"
}) => {
    const [mapLoaded, setMapLoaded] = useState(false);
    const [mapError, setMapError] = useState('');
    const [circles, setCircles] = useState(initialCircles);
    const [isDrawing, setIsDrawing] = useState(false);
    const [selectedCircle, setSelectedCircle] = useState(null);
    const [drawingMode, setDrawingMode] = useState(true);
    
    const mapRef = useRef(null);
    const mapInstanceRef = useRef(null);
    const drawingManagerRef = useRef(null);
    const circleOverlaysRef = useRef([]);
    
    const GOOGLE_API_KEY = 'AIzaSyAgmQbrpdURf4s6jeyN2DQt6IVo_Fg7Hyg';

    // Load Google Maps API when dialog opens
    useEffect(() => {
        if (open && !window.google) {
            loadGoogleMapsAPI();
        }
    }, [open]);

    // Initialize map when API is loaded
    useEffect(() => {
        if (open && mapLoaded && window.google && mapRef.current && !mapInstanceRef.current) {
            initializeMap();
        }
    }, [open, mapLoaded]);

    // Update circles when they change
    useEffect(() => {
        if (mapInstanceRef.current && mapLoaded) {
            updateMapCircles();
        }
    }, [circles, mapLoaded]);

    const loadGoogleMapsAPI = () => {
        if (window.google) {
            setMapLoaded(true);
            return;
        }

        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_API_KEY}&libraries=places,geometry,drawing`;
        script.async = true;
        script.defer = true;
        
        script.onload = () => {
            setMapLoaded(true);
            setMapError('');
        };
        
        script.onerror = () => {
            setMapError('Failed to load Google Maps. Please check your internet connection.');
        };
        
        if (!document.querySelector(`script[src*="${GOOGLE_API_KEY}"]`)) {
            document.head.appendChild(script);
        } else {
            setMapLoaded(true);
        }
    };

    const initializeMap = () => {
        try {
            // Center map on Africa (since the surveys are focused on African institutions)
            const defaultCenter = { lat: 0.0236, lng: 37.9062 }; // Center of Africa
            
            const map = new window.google.maps.Map(mapRef.current, {
                zoom: 3,
                center: defaultCenter,
                mapTypeControl: true,
                streetViewControl: false,
                fullscreenControl: true,
                drawingControl: false // We'll create custom controls
            });

            mapInstanceRef.current = map;

            // Initialize Drawing Manager
            const drawingManager = new window.google.maps.drawing.DrawingManager({
                drawingMode: null,
                drawingControl: false,
                drawingControlOptions: {
                    position: window.google.maps.ControlPosition.TOP_CENTER,
                    drawingModes: ['circle']
                },
                circleOptions: {
                    fillColor: '#633394',
                    fillOpacity: 0.3,
                    strokeWeight: 2,
                    strokeColor: '#633394',
                    clickable: true,
                    editable: true,
                    draggable: true
                }
            });

            drawingManager.setMap(map);
            drawingManagerRef.current = drawingManager;

            // Handle circle completion
            drawingManager.addListener('circlecomplete', (circle) => {
                handleCircleComplete(circle);
                // Stop drawing mode after completing a circle
                drawingManager.setDrawingMode(null);
                setIsDrawing(false);
            });

            // Load existing circles
            if (circles.length > 0) {
                updateMapCircles();
            }

        } catch (error) {
            console.error('Error initializing map:', error);
            setMapError('Failed to initialize map');
        }
    };

    const handleCircleComplete = (googleCircle) => {
        const center = googleCircle.getCenter();
        const radius = googleCircle.getRadius();
        
        const newCircle = {
            id: Date.now(),
            name: `Region ${circles.length + 1}`,
            center: {
                lat: center.lat(),
                lng: center.lng()
            },
            radius: Math.round(radius), // radius in meters
            visible: true,
            color: '#633394'
        };

        // Add event listeners for editing
        googleCircle.addListener('center_changed', () => updateCircleFromOverlay(newCircle.id, googleCircle));
        googleCircle.addListener('radius_changed', () => updateCircleFromOverlay(newCircle.id, googleCircle));
        
        // Store reference to the Google Maps circle overlay
        circleOverlaysRef.current.push({
            id: newCircle.id,
            overlay: googleCircle
        });

        setCircles(prev => [...prev, newCircle]);
    };

    const updateCircleFromOverlay = (circleId, googleCircle) => {
        const center = googleCircle.getCenter();
        const radius = googleCircle.getRadius();
        
        setCircles(prev => prev.map(circle => 
            circle.id === circleId 
                ? {
                    ...circle,
                    center: { lat: center.lat(), lng: center.lng() },
                    radius: Math.round(radius)
                }
                : circle
        ));
    };

    const updateMapCircles = () => {
        if (!mapInstanceRef.current) return;

        // Clear existing overlays
        circleOverlaysRef.current.forEach(({ overlay }) => {
            overlay.setMap(null);
        });
        circleOverlaysRef.current = [];

        // Add circles to map
        circles.forEach(circle => {
            if (circle.visible) {
                const googleCircle = new window.google.maps.Circle({
                    strokeColor: circle.color,
                    strokeOpacity: 0.8,
                    strokeWeight: 2,
                    fillColor: circle.color,
                    fillOpacity: 0.3,
                    map: mapInstanceRef.current,
                    center: circle.center,
                    radius: circle.radius,
                    editable: true,
                    draggable: true
                });

                // Add event listeners
                googleCircle.addListener('center_changed', () => updateCircleFromOverlay(circle.id, googleCircle));
                googleCircle.addListener('radius_changed', () => updateCircleFromOverlay(circle.id, googleCircle));
                
                circleOverlaysRef.current.push({
                    id: circle.id,
                    overlay: googleCircle
                });
            }
        });
    };

    const startDrawing = () => {
        if (drawingManagerRef.current) {
            drawingManagerRef.current.setDrawingMode(window.google.maps.drawing.OverlayType.CIRCLE);
            setIsDrawing(true);
        }
    };

    const stopDrawing = () => {
        if (drawingManagerRef.current) {
            drawingManagerRef.current.setDrawingMode(null);
            setIsDrawing(false);
        }
    };

    const deleteCircle = (circleId) => {
        // Remove from map
        const overlayIndex = circleOverlaysRef.current.findIndex(item => item.id === circleId);
        if (overlayIndex !== -1) {
            circleOverlaysRef.current[overlayIndex].overlay.setMap(null);
            circleOverlaysRef.current.splice(overlayIndex, 1);
        }
        
        // Remove from state
        setCircles(prev => prev.filter(circle => circle.id !== circleId));
    };

    const toggleCircleVisibility = (circleId) => {
        setCircles(prev => prev.map(circle => 
            circle.id === circleId 
                ? { ...circle, visible: !circle.visible }
                : circle
        ));
    };

    const updateCircleName = (circleId, newName) => {
        setCircles(prev => prev.map(circle => 
            circle.id === circleId 
                ? { ...circle, name: newName }
                : circle
        ));
    };

    const clearAllCircles = () => {
        circleOverlaysRef.current.forEach(({ overlay }) => {
            overlay.setMap(null);
        });
        circleOverlaysRef.current = [];
        setCircles([]);
    };

    const getCurrentLocation = () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const center = {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    };
                    mapInstanceRef.current.setCenter(center);
                    mapInstanceRef.current.setZoom(10);
                },
                (error) => {
                    console.error('Error getting location:', error);
                }
            );
        }
    };

    const formatDistance = (meters) => {
        if (meters < 1000) {
            return `${meters} m`;
        } else {
            return `${(meters / 1000).toFixed(1)} km`;
        }
    };

    const handleSave = () => {
        onCirclesUpdate(circles);
        onClose();
    };

    const handleCancel = () => {
        setCircles(initialCircles);
        onClose();
    };

    return (
        <Dialog 
            open={open} 
            onClose={handleCancel}
            maxWidth="lg"
            fullWidth
            PaperProps={{
                sx: { height: '90vh' }
            }}
        >
            <DialogTitle>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <MapIcon />
                    <Typography variant="h6">{title}</Typography>
                </Box>
            </DialogTitle>
            
            <DialogContent sx={{ p: 0, display: 'flex', height: '100%' }}>
                {mapError && (
                    <Alert severity="error" sx={{ m: 2 }}>
                        {mapError}
                    </Alert>
                )}
                
                {/* Map Container */}
                <Box sx={{ flex: 2, position: 'relative' }}>
                    <div 
                        ref={mapRef} 
                        style={{ 
                            width: '100%', 
                            height: '100%',
                            minHeight: '400px'
                        }} 
                    />
                    
                    {/* Map Controls */}
                    <Paper sx={{ 
                        position: 'absolute', 
                        top: 10, 
                        left: 10, 
                        p: 1,
                        display: 'flex',
                        gap: 1,
                        flexDirection: 'column'
                    }}>
                        <Button
                            variant={isDrawing ? "contained" : "outlined"}
                            size="small"
                            onClick={isDrawing ? stopDrawing : startDrawing}
                            sx={{ minWidth: 'auto' }}
                        >
                            {isDrawing ? 'Stop Drawing' : 'Draw Circle'}
                        </Button>
                        
                        <Button
                            variant="outlined"
                            size="small"
                            onClick={getCurrentLocation}
                            startIcon={<MyLocationIcon />}
                            sx={{ minWidth: 'auto' }}
                        >
                            My Location
                        </Button>
                        
                        {circles.length > 0 && (
                            <Button
                                variant="outlined"
                                size="small"
                                color="error"
                                onClick={clearAllCircles}
                                startIcon={<ClearIcon />}
                                sx={{ minWidth: 'auto' }}
                            >
                                Clear All
                            </Button>
                        )}
                    </Paper>
                </Box>

                {/* Circles List Panel */}
                <Box sx={{ 
                    flex: 1, 
                    borderLeft: '1px solid #e0e0e0',
                    p: 2,
                    overflow: 'auto'
                }}>
                    <Typography variant="h6" gutterBottom>
                        Selected Regions ({circles.length})
                    </Typography>
                    
                    {circles.length === 0 ? (
                        <Box sx={{ textAlign: 'center', py: 4 }}>
                            <LocationIcon sx={{ fontSize: 48, color: 'gray', mb: 2 }} />
                            <Typography variant="body2" color="textSecondary">
                                Draw circles on the map to define geographic regions for comparison
                            </Typography>
                        </Box>
                    ) : (
                        <List dense>
                            {circles.map((circle, index) => (
                                <ListItem key={circle.id} sx={{ px: 0 }}>
                                    <Box sx={{ width: '100%' }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                            <TextField
                                                size="small"
                                                value={circle.name}
                                                onChange={(e) => updateCircleName(circle.id, e.target.value)}
                                                variant="standard"
                                                sx={{ flex: 1, mr: 1 }}
                                            />
                                            <IconButton
                                                size="small"
                                                onClick={() => toggleCircleVisibility(circle.id)}
                                            >
                                                {circle.visible ? <VisibilityIcon /> : <VisibilityOffIcon />}
                                            </IconButton>
                                            <IconButton
                                                size="small"
                                                color="error"
                                                onClick={() => deleteCircle(circle.id)}
                                            >
                                                <DeleteIcon />
                                            </IconButton>
                                        </Box>
                                        
                                        <Typography variant="caption" color="textSecondary" display="block">
                                            Center: {circle.center.lat.toFixed(4)}, {circle.center.lng.toFixed(4)}
                                        </Typography>
                                        <Typography variant="caption" color="textSecondary" display="block">
                                            Radius: {formatDistance(circle.radius)}
                                        </Typography>
                                        
                                        <Chip 
                                            size="small" 
                                            label={circle.visible ? 'Visible' : 'Hidden'}
                                            color={circle.visible ? 'success' : 'default'}
                                            sx={{ mt: 1 }}
                                        />
                                    </Box>
                                </ListItem>
                            ))}
                        </List>
                    )}
                    
                    <Divider sx={{ my: 2 }} />
                    
                    <Typography variant="body2" color="textSecondary">
                        <strong>Instructions:</strong>
                        <br />• Click "Draw Circle" to start drawing
                        <br />• Click and drag to create a circular region
                        <br />• Drag circles to move them
                        <br />• Drag circle edges to resize
                        <br />• Use these regions to filter survey data
                    </Typography>
                </Box>
            </DialogContent>
            
            <DialogActions>
                <Button onClick={handleCancel}>
                    Cancel
                </Button>
                <Button 
                    onClick={handleSave} 
                    variant="contained"
                    disabled={circles.length === 0}
                >
                    Use {circles.length} Region{circles.length !== 1 ? 's' : ''}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default GeographicCircleSelector; 