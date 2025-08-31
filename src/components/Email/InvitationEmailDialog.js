import React, { useState } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Typography,
    Box,
    Alert,
    CircularProgress
} from '@mui/material';
import { EmailService } from '../../services/EmailService';

const InvitationEmailDialog = ({ 
    open, 
    onClose, 
    user = null, 
    onSuccess = null,
    organizationName = null,
    organizationId = null 
}) => {
    const [formData, setFormData] = useState({
        to_email: user?.email || '',
        username: user?.username || '',
        password: user?.password || '',
        firstname: user?.firstname || '',
        invitation_type: 'general',
        organization_name: organizationName || user?.organization?.name || '',
        organization_id: organizationId || user?.organization_id || null
    });
    
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleInputChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleSubmit = async () => {
        setLoading(true);
        setError('');
        setSuccess('');

        try {
            // Validate required fields
            if (!formData.to_email || !formData.username || !formData.password) {
                setError('Email, username, and password are required');
                setLoading(false);
                return;
            }

            const result = await EmailService.sendInvitationEmail(formData);
            
            setSuccess(`Invitation email sent successfully to ${formData.to_email}`);
            
            if (onSuccess) {
                onSuccess(result);
            }
            
            // Close dialog after a short delay
            setTimeout(() => {
                onClose();
            }, 2000);
            
        } catch (error) {
            setError(error.message || 'Failed to send invitation email');
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setFormData({
            to_email: user?.email || '',
            username: user?.username || '',
            password: user?.password || '',
            firstname: user?.firstname || '',
            invitation_type: 'general',
            organization_name: organizationName || user?.organization?.name || '',
            organization_id: organizationId || user?.organization_id || null
        });
        setError('');
        setSuccess('');
        onClose();
    };

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
            <DialogTitle>
                📧 Send Invitation Email
            </DialogTitle>
            
            <DialogContent>
                {error && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {error}
                    </Alert>
                )}
                
                {success && (
                    <Alert severity="success" sx={{ mb: 2 }}>
                        {success}
                    </Alert>
                )}

                <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                        Send an invitation email to welcome a new user to the platform or invite them to complete a survey.
                    </Typography>
                </Box>

                <TextField
                    label="Email Address"
                    type="email"
                    value={formData.to_email}
                    onChange={(e) => handleInputChange('to_email', e.target.value)}
                    fullWidth
                    margin="normal"
                    required
                    disabled={!!user?.email}
                />

                <TextField
                    label="Username"
                    value={formData.username}
                    onChange={(e) => handleInputChange('username', e.target.value)}
                    fullWidth
                    margin="normal"
                    required
                    disabled={!!user?.username}
                />

                <TextField
                    label="Temporary Password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    fullWidth
                    margin="normal"
                    required
                    disabled={!!user?.password}
                />

                <TextField
                    label="First Name (Optional)"
                    value={formData.firstname}
                    onChange={(e) => handleInputChange('firstname', e.target.value)}
                    fullWidth
                    margin="normal"
                />

                <FormControl fullWidth margin="normal">
                    <InputLabel>Invitation Type</InputLabel>
                    <Select
                        value={formData.invitation_type}
                        onChange={(e) => handleInputChange('invitation_type', e.target.value)}
                        label="Invitation Type"
                    >
                        <MenuItem value="general">General Platform Invitation</MenuItem>
                        <MenuItem value="survey">Survey Invitation</MenuItem>
                    </Select>
                </FormControl>

                <TextField
                    label="Organization Name (Optional)"
                    value={formData.organization_name}
                    onChange={(e) => handleInputChange('organization_name', e.target.value)}
                    fullWidth
                    margin="normal"
                />
            </DialogContent>

            <DialogActions>
                <Button onClick={handleClose} disabled={loading}>
                    Cancel
                </Button>
                <Button 
                    onClick={handleSubmit} 
                    variant="contained" 
                    disabled={loading || !formData.to_email || !formData.username || !formData.password}
                    startIcon={loading ? <CircularProgress size={20} /> : null}
                >
                    {loading ? 'Sending...' : 'Send Invitation Email'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default InvitationEmailDialog;

