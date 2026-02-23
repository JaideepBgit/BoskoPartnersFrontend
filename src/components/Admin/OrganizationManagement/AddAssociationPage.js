import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Container, Typography, Box, Paper, TextField, Button,
    FormControl, InputLabel, Select, MenuItem, Grid, Alert, CircularProgress
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SaveIcon from '@mui/icons-material/Save';
import InternalHeader from '../../shared/Headers/InternalHeader';
import EnhancedAddressInput from '../../UserManagement/common/EnhancedAddressInput';
import { addOrganization } from '../../../services/UserManagement/UserManagementService';

const colors = {
    primary: '#633394',
    secondary: '#967CB2',
    background: '#f5f5f5',
    cardBg: '#ffffff',
    accentBg: '#f3e5f5',
    borderColor: '#e0e0e0',
    textPrimary: '#212121',
    textSecondary: '#757575',
};

const associationTypes = [
    { value: 'accrediting_body', label: 'Accrediting Body' },
    { value: 'affiliation', label: 'Affiliation' },
    { value: 'denomination', label: 'Denomination' },
    { value: 'other', label: 'Other' },
    { value: 'umbrella_association_membership', label: 'Umbrella Association Membership' },
    { value: 'validation', label: 'Validation' }
];

function AddAssociationPage() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const [formData, setFormData] = useState({
        name: '',
        organization_type: '',
        website: '',
        notes: '',
        geo_location: {
            continent: '',
            region: '',
            country: '',
            province: '',
            city: '',
            town: '',
            address_line1: '',
            address_line2: '',
            postal_code: '',
            latitude: 0,
            longitude: 0
        }
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleAddressChange = (addressData) => {
        setFormData(prev => ({
            ...prev,
            geo_location: addressData
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        // Validation
        if (!formData.name.trim()) {
            setError('Association name is required');
            return;
        }

        if (!formData.organization_type) {
            setError('Association type is required');
            return;
        }

        setLoading(true);

        try {
            // Prepare data for submission
            const submitData = {
                name: formData.name.trim(),
                organization_type: formData.organization_type,
                website: formData.website.trim() || null,
                notes: formData.notes.trim() || null,
                geo_location: hasValidGeoData(formData.geo_location) ? formData.geo_location : null
            };

            await addOrganization(submitData);
            setSuccess('Association added successfully!');

            // Navigate back to associations page after a short delay
            setTimeout(() => {
                navigate('/denominations');
            }, 1500);
        } catch (err) {
            console.error('Failed to add association:', err);
            setError(err.message || 'Failed to add association. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const hasValidGeoData = (geoLocation) => {
        return geoLocation && (
            geoLocation.country ||
            geoLocation.city ||
            geoLocation.address_line1 ||
            geoLocation.latitude !== 0 ||
            geoLocation.longitude !== 0
        );
    };

    const handleBack = () => {
        navigate('/denominations');
    };

    return (
        <>
            <InternalHeader
                title="Add New Association"
                leftActions={
                    <Button
                        variant="outlined"
                        startIcon={<ArrowBackIcon />}
                        onClick={handleBack}
                    >
                        Associations
                    </Button>
                }
                rightActions={
                    <Box sx={{ display: 'flex', gap: 2 }}>
                        <Button
                            variant="outlined"
                            onClick={handleBack}
                            disabled={loading}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleSubmit}
                            variant="contained"
                            disabled={loading}
                            startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
                        >
                            {loading ? 'Saving...' : 'Save Association'}
                        </Button>
                    </Box>
                }
            />
            <Container maxWidth="lg" sx={{ py: 4, backgroundColor: colors.background, minHeight: '100vh' }}>
                <Box sx={{ maxWidth: 600, mx: 'auto' }}>

                {error && (
                    <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
                        {error}
                    </Alert>
                )}

                {success && (
                    <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess('')}>
                        {success}
                    </Alert>
                )}

                <Box component="form" onSubmit={handleSubmit}>
                    {/* Basic Information */}
                    <Paper sx={{ p: 3, mb: 3, borderRadius: 3, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
                        <Typography variant="h6" fontWeight="bold" sx={{ mb: 3, color: colors.textPrimary }}>
                            Basic Information
                        </Typography>
                        <Grid container spacing={3}>
                            <Grid item xs={12} md={6}>
                                <TextField
                                    fullWidth
                                    required
                                    label="Association Name"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    placeholder="Enter association name"
                                />
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <FormControl fullWidth required>
                                    <InputLabel>Association Type</InputLabel>
                                    <Select
                                        name="organization_type"
                                        value={formData.organization_type}
                                        onChange={handleChange}
                                        label="Association Type"
                                    >
                                        {associationTypes.map(type => (
                                            <MenuItem key={type.value} value={type.value}>
                                                {type.label}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    label="Website"
                                    name="website"
                                    value={formData.website}
                                    onChange={handleChange}
                                    placeholder="https://example.com"
                                    type="url"
                                />
                            </Grid>
                        </Grid>
                    </Paper>

                    {/* Address Information (Optional) */}
                    <Paper sx={{ p: 3, mb: 3, borderRadius: 3, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
                        <Typography variant="h6" fontWeight="bold" sx={{ mb: 2, color: colors.textPrimary }}>
                            Address Information
                            <Typography component="span" variant="body2" sx={{ ml: 1, color: colors.textSecondary }}>
                                (Optional)
                            </Typography>
                        </Typography>
                        <EnhancedAddressInput
                            value={formData.geo_location}
                            onChange={handleAddressChange}
                        />
                    </Paper>

                    {/* Miscellaneous */}
                    <Paper sx={{ p: 3, mb: 3, borderRadius: 3, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
                        <Typography variant="h6" fontWeight="bold" sx={{ mb: 3, color: colors.textPrimary }}>
                            Miscellaneous
                        </Typography>
                        <TextField
                            fullWidth
                            multiline
                            rows={4}
                            label="Notes"
                            name="notes"
                            value={formData.notes}
                            onChange={handleChange}
                            placeholder="Add any additional notes or comments..."
                        />
                    </Paper>

                </Box>
                </Box>
            </Container>
        </>
    );
}

export default AddAssociationPage;
