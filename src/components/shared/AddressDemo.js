import React, { useState } from 'react';
import { 
    Box, Paper, Typography, Button, Alert, Chip,
    Dialog, DialogTitle, DialogContent, DialogActions
} from '@mui/material';
import EnhancedAddressInput from '../UserManagement/common/EnhancedAddressInput';

const AddressDemo = () => {
    const [selectedAddress, setSelectedAddress] = useState(null);
    const [showDemo, setShowDemo] = useState(false);

    const handlePlaceSelect = (placeData) => {
        setSelectedAddress(placeData);
        console.log('Selected place data:', placeData);
    };

    const handleClearAddress = () => {
        setSelectedAddress(null);
    };

    return (
        <Box sx={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
            <Typography variant="h4" sx={{ mb: 3, color: '#633394', textAlign: 'center' }}>
                🗺️ Enhanced Address Input Demo
            </Typography>

            <Paper sx={{ p: 3, mb: 3, backgroundColor: '#f8f9fa' }}>
                <Typography variant="h6" sx={{ mb: 2, color: '#633394' }}>
                    Features
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                    <Chip label="Google Places Autocomplete" color="primary" />
                    <Chip label="Interactive Map Selection" color="primary" />
                    <Chip label="Current Location Detection" color="primary" />
                    <Chip label="Automatic Continent Detection" color="primary" />
                    <Chip label="Detailed Address Form" color="primary" />
                    <Chip label="Real-time Suggestions" color="primary" />
                </Box>
                
                <Typography variant="body2" sx={{ color: '#666' }}>
                    This enhanced address input component provides multiple ways to select addresses:
                    <br />• Type to get Google Places suggestions
                    <br />• Click the map icon to select location on an interactive map
                    <br />• Use current location detection
                    <br />• Manually edit address details
                </Typography>
            </Paper>

            <Button
                variant="contained"
                onClick={() => setShowDemo(true)}
                sx={{ 
                    backgroundColor: '#633394',
                    '&:hover': { backgroundColor: '#7c52a5' },
                    mb: 3
                }}
            >
                Try Enhanced Address Input
            </Button>

            {selectedAddress && (
                <Paper sx={{ p: 3, mb: 3, backgroundColor: '#e8f5e8', border: '1px solid #4caf50' }}>
                    <Typography variant="h6" sx={{ mb: 2, color: '#2e7d32' }}>
                        ✅ Selected Address
                    </Typography>
                    <Box sx={{ mb: 2 }}>
                        <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                            Formatted Address:
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#666', mb: 1 }}>
                            {selectedAddress.formattedAddress}
                        </Typography>
                    </Box>
                    
                    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 2 }}>
                        <Box>
                            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>Continent:</Typography>
                            <Typography variant="body2" sx={{ color: '#666' }}>
                                {selectedAddress.geoLocationData.continent || 'Not specified'}
                            </Typography>
                        </Box>
                        <Box>
                            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>Country:</Typography>
                            <Typography variant="body2" sx={{ color: '#666' }}>
                                {selectedAddress.geoLocationData.country || 'Not specified'}
                            </Typography>
                        </Box>
                        <Box>
                            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>City:</Typography>
                            <Typography variant="body2" sx={{ color: '#666' }}>
                                {selectedAddress.geoLocationData.city || 'Not specified'}
                            </Typography>
                        </Box>
                        <Box>
                            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>Coordinates:</Typography>
                            <Typography variant="body2" sx={{ color: '#666' }}>
                                {selectedAddress.geoLocationData.latitude}, {selectedAddress.geoLocationData.longitude}
                            </Typography>
                        </Box>
                    </Box>
                    
                    <Button
                        variant="outlined"
                        onClick={handleClearAddress}
                        sx={{ mt: 2, color: '#d32f2f', borderColor: '#d32f2f' }}
                    >
                        Clear Address
                    </Button>
                </Paper>
            )}

            {/* Demo Dialog */}
            <Dialog 
                open={showDemo} 
                onClose={() => setShowDemo(false)}
                maxWidth="lg"
                fullWidth
                PaperProps={{
                    sx: { height: '90vh' }
                }}
            >
                <DialogTitle sx={{ 
                    backgroundColor: '#633394', 
                    color: 'white',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }}>
                    <Typography variant="h6">
                        Enhanced Address Input Demo
                    </Typography>
                </DialogTitle>
                
                <DialogContent sx={{ p: 3 }}>
                    <Alert severity="info" sx={{ mb: 3 }}>
                        <Typography variant="body2">
                            <strong>Instructions:</strong>
                            <br />• Start typing an address to see Google Places suggestions
                            <br />• Click the map icon to open an interactive map for location selection
                            <br />• Use the "My Location" button to get your current location
                            <br />• Manually edit any address field as needed
                        </Typography>
                    </Alert>
                    
                    <EnhancedAddressInput
                        onPlaceSelect={handlePlaceSelect}
                        label="Demo Address Input"
                        fullWidth
                    />
                </DialogContent>
                
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={() => setShowDemo(false)} color="secondary">
                        Close Demo
                    </Button>
                </DialogActions>
            </Dialog>

            {/* API Key Status */}
            <Paper sx={{ p: 2, mt: 3, backgroundColor: '#fff3cd', border: '1px solid #ffeaa7' }}>
                <Typography variant="h6" sx={{ mb: 1, color: '#856404' }}>
                    🔑 API Key Status
                </Typography>
                <Typography variant="body2" sx={{ color: '#856404' }}>
                    Make sure you have set up your Google Maps API key in the .env file:
                    <br /><code>REACT_APP_GOOGLE_MAPS_API_KEY=AIzaSyAA5PZQdpcY4NXonqUny2sGZzMLbFKE0Iw</code>
                    <br />Required APIs: Geocoding, Places, Maps JavaScript, Distance Matrix
                </Typography>
            </Paper>
        </Box>
    );
};

export default AddressDemo; 