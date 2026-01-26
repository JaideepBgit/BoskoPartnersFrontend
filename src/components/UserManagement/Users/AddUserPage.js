import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Container, Box, Typography, Button, Paper, TextField, Select, MenuItem,
    FormControl, InputLabel, Grid, Chip, CircularProgress, Autocomplete
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import VisibilityIcon from '@mui/icons-material/Visibility';
import SaveIcon from '@mui/icons-material/Save';
import {
    addUser, fetchOrganizations, fetchRoles, addRole,
    updateUserOrganizationalRoles, fetchTemplatesByOrganization
} from '../../../services/UserManagement/UserManagementService';
import InventoryService from '../../../services/Admin/Inventory/InventoryService';
import { EmailService } from '../../../services/EmailService';
import EnhancedAddressInput from '../common/EnhancedAddressInput';
import EmailPreviewDialog from '../common/EmailPreviewDialog';
import Navbar from '../../shared/Navbar/Navbar';

function AddUserPage() {
    const navigate = useNavigate();

    // State variables
    const [organizations, setOrganizations] = useState([]);
    const [roles, setRoles] = useState([]);
    const [templates, setTemplates] = useState([]);
    const [emailTemplates, setEmailTemplates] = useState([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    // Form states
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        ui_role: 'user',
        firstname: '',
        lastname: '',
        phone: '',
        title: '',
        organization_id: '',
        template_id: '',
        email_template_id: '',
        roles: [],
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

    // Organizational roles states
    const [selectedOrganizationId, setSelectedOrganizationId] = useState('');
    const [organizationalRoleToAdd, setOrganizationalRoleToAdd] = useState('');
    const [addingOrganizationalRole, setAddingOrganizationalRole] = useState(false);

    // Email preview states
    const [showEmailPreview, setShowEmailPreview] = useState(false);
    const [emailPreviewLoading, setEmailPreviewLoading] = useState(false);
    const [emailPreviewDialogOpen, setEmailPreviewDialogOpen] = useState(false);
    const [selectedEmailTemplate, setSelectedEmailTemplate] = useState(null);
    const [emailPreviewData, setEmailPreviewData] = useState({
        textVersion: '',
        htmlVersion: '',
        subject: '',
        to: ''
    });
    const [emailPreviewType, setEmailPreviewType] = useState('text');

    // Load data on component mount
    useEffect(() => {
        loadOrganizations();
        loadRoles();
    }, []);

    // Load organizations from API
    const loadOrganizations = async () => {
        try {
            const data = await fetchOrganizations();
            // Filter organizations by type
            const filteredOrgs = data.filter(org => {
                return org.organization_type &&
                    ['church', 'non_formal_organizations', 'institution'].includes(org.organization_type.type.toLowerCase())
            });
            setOrganizations(filteredOrgs);
        } catch (error) {
            console.error('Failed to fetch organizations:', error);
        }
    };

    // Load roles from API
    const loadRoles = async () => {
        try {
            const data = await fetchRoles();
            setRoles(data);
        } catch (error) {
            console.error('Failed to fetch roles:', error);
        }
    };

    // Load templates by organization
    const loadTemplates = async (organizationId) => {
        if (!organizationId) {
            setTemplates([]);
            return;
        }
        try {
            const data = await fetchTemplatesByOrganization(organizationId);
            setTemplates(data);
        } catch (error) {
            console.error('Failed to fetch templates:', error);
            setTemplates([]);
        }
    };

    // Load email templates by organization
    const loadEmailTemplates = async (organizationId) => {
        if (!organizationId) {
            setEmailTemplates([]);
            return;
        }
        try {
            const data = await InventoryService.getEmailTemplates(organizationId);
            const welcomeTemplates = (data || []).filter(template =>
                template.name && (
                    template.name.toLowerCase().includes('welcome') ||
                    template.name.toLowerCase().includes('default welcome')
                )
            );
            setEmailTemplates(welcomeTemplates);
        } catch (error) {
            console.error('Failed to fetch email templates:', error);
            setEmailTemplates([]);
        }
    };

    // Generate email preview
    const generateWelcomeEmailPreview = async () => {
        try {
            setEmailPreviewLoading(true);

            const firstname = formData.firstname || 'User';
            const username = formData.username || 'your-username';
            const email = formData.email || 'user@example.com';
            const password = formData.password || 'auto-generated-password';
            const organizationName = formData.organization_id ?
                organizations.find(org => org.id === parseInt(formData.organization_id))?.name || 'Organization' :
                'Organization';

            const surveyCode = `survey-${Math.random().toString(36).substr(2, 9)}-${Date.now().toString(36)}`;

            const templateVariables = {
                greeting: `Dear ${firstname}`,
                username: username,
                email: email,
                password: password,
                survey_code: surveyCode,
                organization_name: organizationName,
                first_name: firstname,
                last_name: formData.lastname || '',
                login_url: 'https://platform.saurara.com/login',
                survey_url: `https://platform.saurara.com/survey/${surveyCode}`,
                support_email: 'support@saurara.com',
                user_fullname: `${firstname} ${formData.lastname || ''}`.trim(),
                platform_name: 'Saurara Platform',
                current_date: new Date().toLocaleDateString(),
                current_year: new Date().getFullYear().toString(),
            };

            let renderedPreview;

            if (formData.email_template_id) {
                renderedPreview = await EmailService.renderPreview(null, templateVariables, parseInt(formData.email_template_id));
            } else {
                const organizationId = formData.organization_id ? parseInt(formData.organization_id) : null;
                renderedPreview = await EmailService.renderPreview('welcome', templateVariables, null, organizationId);
            }

            setEmailPreviewData({
                textVersion: renderedPreview.text_body || 'No text version available',
                htmlVersion: renderedPreview.html_body || 'No HTML version available',
                subject: renderedPreview.subject || 'Welcome to Saurara!',
                to: email
            });

        } catch (error) {
            console.error('Error generating email preview:', error);
            setEmailPreviewData({
                textVersion: `Welcome to Saurara!\n\nDear ${formData.firstname || 'User'},\n\nYour account has been created successfully.\nUsername: ${formData.username || 'your-username'}\nEmail: ${formData.email || 'user@example.com'}\n\nBest regards,\nThe Saurara Team`,
                htmlVersion: `<h2>Welcome to Saurara!</h2><p>Dear ${formData.firstname || 'User'},</p><p>Your account has been created successfully.</p><p><strong>Username:</strong> ${formData.username || 'your-username'}<br><strong>Email:</strong> ${formData.email || 'user@example.com'}</p><p>Best regards,<br>The Saurara Team</p>`,
                subject: 'Welcome to Saurara!',
                to: formData.email || 'user@example.com'
            });
        } finally {
            setEmailPreviewLoading(false);
        }
    };

    // Handle form input changes
    const handleInputChange = (e) => {
        const { name, value } = e.target;

        if (name.startsWith('geo_location.')) {
            const geoField = name.split('.')[1];
            setFormData({
                ...formData,
                geo_location: {
                    ...formData.geo_location,
                    [geoField]: value
                }
            });
        } else {
            if (name === 'organization_id') {
                loadTemplates(value);
                loadEmailTemplates(value);
                setFormData({
                    ...formData,
                    [name]: value,
                    template_id: '',
                    email_template_id: ''
                });
            } else {
                setFormData({
                    ...formData,
                    [name]: value
                });
            }
        }
    };

    // Handle Google Places selection
    const handlePlaceSelect = (placeData) => {
        const { geoLocationData } = placeData;

        const updatedGeoLocation = {
            ...geoLocationData,
            latitude: geoLocationData.latitude ? Number(geoLocationData.latitude) : 0,
            longitude: geoLocationData.longitude ? Number(geoLocationData.longitude) : 0
        };

        setFormData({
            ...formData,
            geo_location: updatedGeoLocation
        });
    };

    // Helper function to check if geo_location has any meaningful data
    const hasValidGeoData = (geoData) => {
        if (!geoData) return false;

        const stringFields = ['continent', 'region', 'country', 'province', 'city', 'town', 'address_line1', 'address_line2', 'postal_code'];
        const hasStringData = stringFields.some(field => geoData[field] && geoData[field].trim() !== '');
        const hasCoordinates = (geoData.latitude && geoData.latitude !== 0) || (geoData.longitude && geoData.longitude !== 0);

        return hasStringData || hasCoordinates;
    };

    // Handle adding organizational role
    const handleAddOrganizationalRole = async () => {
        if (!selectedOrganizationId || !organizationalRoleToAdd.trim()) {
            alert('Please select an organization and enter a role type');
            return;
        }

        const existingRole = formData.roles.find(
            r => r.organization_id === parseInt(selectedOrganizationId) && r.role_type === organizationalRoleToAdd.trim()
        );

        if (existingRole) {
            alert('This role type already exists for the selected organization');
            return;
        }

        setAddingOrganizationalRole(true);
        try {
            const roleData = {
                name: organizationalRoleToAdd.trim(),
                description: `Created for organizational role: ${organizationalRoleToAdd.trim()}`
            };

            await addRole(roleData);

            const newRole = {
                organization_id: parseInt(selectedOrganizationId),
                role_type: organizationalRoleToAdd.trim(),
                id: Date.now()
            };

            setFormData({
                ...formData,
                roles: [...formData.roles, newRole]
            });

            setSelectedOrganizationId('');
            setOrganizationalRoleToAdd('');

        } catch (error) {
            if (error.response && error.response.status === 409) {
                const newRole = {
                    organization_id: parseInt(selectedOrganizationId),
                    role_type: organizationalRoleToAdd.trim(),
                    id: Date.now()
                };

                setFormData({
                    ...formData,
                    roles: [...formData.roles, newRole]
                });

                setSelectedOrganizationId('');
                setOrganizationalRoleToAdd('');
            } else {
                console.error('Failed to add role:', error);
                alert(`Failed to add role: ${error.message}`);
            }
        } finally {
            setAddingOrganizationalRole(false);
        }
    };

    // Handle removing organizational role
    const handleRemoveOrganizationalRole = (organizationId, roleType) => {
        setFormData({
            ...formData,
            roles: formData.roles.filter(
                r => !(r.organization_id === organizationId && r.role_type === roleType)
            )
        });
    };

    // Get roles for specific organization
    const getOrganizationRoles = (organizationId) => {
        return formData.roles.filter(r => r.organization_id === organizationId);
    };

    // Truncate text helper
    const truncateText = (text, maxLength) => {
        if (!text) return '';
        return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
    };

    // Handle adding user
    const handleAddUser = async () => {
        if (!formData.username || !formData.email) {
            alert('Username and Email are required');
            return;
        }

        setSaving(true);
        try {
            const userData = {
                ...formData,
                role: formData.ui_role,
                geo_location: hasValidGeoData(formData.geo_location) ? formData.geo_location : null
            };

            delete userData.ui_role;
            const organizationalRoles = userData.roles || [];
            delete userData.roles;

            const newUser = await addUser(userData);

            if (organizationalRoles.length > 0) {
                try {
                    await updateUserOrganizationalRoles(newUser.id, { roles: organizationalRoles });
                } catch (roleError) {
                    console.warn('User created but failed to save organizational roles:', roleError);
                }
            }

            alert(`User "${newUser.username}" created successfully! Welcome email has been sent to ${newUser.email}.`);
            navigate('/users');

        } catch (error) {
            console.error('Failed to add user:', error);
            alert(`Failed to add user: ${error.message}`);
        } finally {
            setSaving(false);
        }
    };

    // Handle email template preview
    const handleEmailTemplatePreview = () => {
        if (!formData.email_template_id) {
            setSelectedEmailTemplate(null);
            setEmailPreviewDialogOpen(true);
            return;
        }

        const template = emailTemplates.find(t => t.id.toString() === formData.email_template_id.toString());
        if (template) {
            setSelectedEmailTemplate(template);
            setEmailPreviewDialogOpen(true);
        }
    };

    return (
        <>
            <Navbar />
            <Container maxWidth="lg" sx={{ py: 4 }}>
                {/* Header with Back Button */}
                <Box sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    mb: 4
                }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Button
                            variant="outlined"
                            startIcon={<ArrowBackIcon />}
                            onClick={() => navigate('/users')}
                            sx={{
                                color: '#633394',
                                borderColor: '#633394',
                                '&:hover': {
                                    borderColor: '#7c52a5',
                                    backgroundColor: 'rgba(99, 51, 148, 0.04)'
                                }
                            }}
                        >
                            Back to Users
                        </Button>
                        <Typography variant="h4" sx={{ color: '#633394', fontWeight: 'bold' }}>
                            Add New User
                        </Typography>
                    </Box>
                </Box>

                {/* User Information Section */}
                <Paper sx={{ p: 3, mb: 3, boxShadow: 3 }}>
                    <Typography variant="h6" sx={{ color: '#633394', fontWeight: 'bold', mb: 3, textAlign: 'center' }}>
                        User Information
                    </Typography>

                    <Grid container spacing={3}>
                        {/* Row 1 */}
                        <Grid item xs={12} md={4}>
                            <TextField
                                required
                                fullWidth
                                label="Username"
                                name="username"
                                value={formData.username}
                                onChange={handleInputChange}
                                variant="outlined"
                            />
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <TextField
                                required
                                fullWidth
                                label="Email"
                                name="email"
                                type="email"
                                value={formData.email}
                                onChange={handleInputChange}
                                variant="outlined"
                            />
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <TextField
                                fullWidth
                                label="Password (auto-generated if empty)"
                                name="password"
                                type="password"
                                value={formData.password}
                                onChange={handleInputChange}
                                variant="outlined"
                                helperText="Leave empty for auto-generated password"
                            />
                        </Grid>

                        {/* Row 2 */}
                        <Grid item xs={12} md={4}>
                            <TextField
                                fullWidth
                                label="First Name"
                                name="firstname"
                                value={formData.firstname}
                                onChange={handleInputChange}
                                variant="outlined"
                            />
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <TextField
                                fullWidth
                                label="Last Name"
                                name="lastname"
                                value={formData.lastname}
                                onChange={handleInputChange}
                                variant="outlined"
                            />
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <Autocomplete
                                freeSolo
                                options={['Manager', 'Director', 'Coordinator', 'Lead', 'Executive']}
                                value={formData.title || ''}
                                onChange={(event, newValue) => {
                                    setFormData(prev => ({ ...prev, title: newValue }));
                                }}
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        fullWidth
                                        label="Title"
                                        name="title"
                                        onChange={handleInputChange}
                                        variant="outlined"
                                        placeholder="e.g., Manager, Director, Coordinator"
                                    />
                                )}
                            />
                        </Grid>

                        {/* Row 3 */}
                        <Grid item xs={12} md={4}>
                            <TextField
                                fullWidth
                                label="Phone"
                                name="phone"
                                value={formData.phone}
                                onChange={handleInputChange}
                                variant="outlined"
                            />
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <Autocomplete
                                value={roles.find(role => role.name === formData.ui_role) || null}
                                onChange={(event, newValue) => {
                                    setFormData({
                                        ...formData,
                                        ui_role: newValue ? newValue.name : ''
                                    });
                                }}
                                options={roles}
                                getOptionLabel={(option) => option.name.charAt(0).toUpperCase() + option.name.slice(1)}
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        label="UI Role"
                                        variant="outlined"
                                        required
                                    />
                                )}
                                isOptionEqualToValue={(option, value) => option.name === value.name}
                            />
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <FormControl fullWidth variant="outlined">
                                <InputLabel>Organization</InputLabel>
                                <Select
                                    name="organization_id"
                                    value={formData.organization_id}
                                    onChange={handleInputChange}
                                    label="Organization"
                                >
                                    <MenuItem value="">No Organization</MenuItem>
                                    {organizations.map((org) => (
                                        <MenuItem key={org.id} value={org.id}>
                                            {org.name} ({org.organization_type?.type || 'N/A'})
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>

                        {/* Row 4 - Templates (shown when organization is selected) */}
                        {formData.organization_id && (
                            <>
                                <Grid item xs={12} md={6}>
                                    <FormControl fullWidth variant="outlined">
                                        <InputLabel>Survey Template</InputLabel>
                                        <Select
                                            name="template_id"
                                            value={formData.template_id}
                                            onChange={handleInputChange}
                                            label="Survey Template"
                                        >
                                            <MenuItem value="">No Template Selected</MenuItem>
                                            {templates.map((template) => (
                                                <MenuItem key={template.id} value={template.id}>
                                                    {truncateText(`${template.survey_code} - ${template.version_name}`, 50)}
                                                </MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <Box sx={{ display: 'flex', gap: 1 }}>
                                        <FormControl fullWidth variant="outlined">
                                            <InputLabel>Welcome Email Template</InputLabel>
                                            <Select
                                                name="email_template_id"
                                                value={formData.email_template_id}
                                                onChange={handleInputChange}
                                                label="Welcome Email Template"
                                            >
                                                <MenuItem value="">Use Default Welcome Email</MenuItem>
                                                {emailTemplates.map((template) => (
                                                    <MenuItem key={template.id} value={template.id}>
                                                        {truncateText(`${template.name} - ${template.subject}`, 40)}
                                                    </MenuItem>
                                                ))}
                                            </Select>
                                        </FormControl>
                                        <Button
                                            variant="outlined"
                                            onClick={handleEmailTemplatePreview}
                                            sx={{
                                                minWidth: '100px',
                                                borderColor: '#633394',
                                                color: '#633394',
                                                '&:hover': {
                                                    borderColor: '#7c52a5',
                                                    backgroundColor: 'rgba(99, 51, 148, 0.04)'
                                                }
                                            }}
                                            startIcon={<VisibilityIcon />}
                                        >
                                            Preview
                                        </Button>
                                    </Box>
                                </Grid>
                            </>
                        )}
                    </Grid>
                </Paper>

                {/* Organizational Roles Section (shown for all roles except 'other') */}
                {formData.ui_role !== 'other' && formData.ui_role && (
                    <Paper sx={{ p: 3, mb: 3, boxShadow: 3 }}>
                        <Typography variant="h6" sx={{ color: '#633394', fontWeight: 'bold', mb: 3, textAlign: 'center' }}>
                            Organizational Roles
                        </Typography>

                        {/* Add New Role Section */}
                        <Box sx={{
                            p: 2,
                            border: '1px solid #e0e0e0',
                            borderRadius: 1,
                            backgroundColor: '#fafafa',
                            mb: 3
                        }}>
                            <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: '#633394', mb: 2 }}>
                                Add Role to Organization
                            </Typography>
                            <Grid container spacing={2} alignItems="center">
                                <Grid item xs={12} md={4}>
                                    <FormControl fullWidth variant="outlined">
                                        <InputLabel>Select Organization</InputLabel>
                                        <Select
                                            value={selectedOrganizationId}
                                            onChange={(e) => setSelectedOrganizationId(e.target.value)}
                                            label="Select Organization"
                                        >
                                            <MenuItem value=""><em>Choose an organization</em></MenuItem>
                                            {organizations.map((org) => (
                                                <MenuItem key={org.id} value={org.id}>{org.name}</MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                </Grid>
                                <Grid item xs={12} md={4}>
                                    <TextField
                                        fullWidth
                                        label="Role Type"
                                        value={organizationalRoleToAdd}
                                        onChange={(e) => setOrganizationalRoleToAdd(e.target.value)}
                                        variant="outlined"
                                        placeholder="e.g., Manager, Coordinator"
                                    />
                                </Grid>
                                <Grid item xs={12} md={4}>
                                    <Button
                                        variant="contained"
                                        fullWidth
                                        onClick={handleAddOrganizationalRole}
                                        disabled={!selectedOrganizationId || !organizationalRoleToAdd.trim() || addingOrganizationalRole}
                                        sx={{
                                            height: '56px',
                                            backgroundColor: '#633394',
                                            '&:hover': { backgroundColor: '#7c52a5' }
                                        }}
                                        startIcon={addingOrganizationalRole ? <CircularProgress size={20} color="inherit" /> : null}
                                    >
                                        {addingOrganizationalRole ? 'Adding...' : 'Add Role'}
                                    </Button>
                                </Grid>
                            </Grid>
                        </Box>

                        {/* Display Current Roles */}
                        {formData.roles.length > 0 && (
                            <Box sx={{ p: 2, border: '1px solid #e0e0e0', borderRadius: 1, backgroundColor: '#fafafa' }}>
                                <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: '#633394', mb: 2 }}>
                                    Assigned Roles
                                </Typography>
                                <Grid container spacing={2}>
                                    {organizations.map((org) => {
                                        const orgRoles = getOrganizationRoles(org.id);
                                        if (orgRoles.length === 0) return null;

                                        return (
                                            <Grid item xs={12} key={org.id}>
                                                <Box sx={{ p: 2, border: '1px solid #ddd', borderRadius: 1, backgroundColor: 'white' }}>
                                                    <Typography variant="body1" sx={{ fontWeight: 'bold', mb: 1 }}>
                                                        {org.name}
                                                    </Typography>
                                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                                        {orgRoles.map((role) => (
                                                            <Chip
                                                                key={`${role.organization_id}-${role.role_type}`}
                                                                label={role.role_type}
                                                                color="primary"
                                                                variant="filled"
                                                                onDelete={() => handleRemoveOrganizationalRole(role.organization_id, role.role_type)}
                                                                sx={{
                                                                    backgroundColor: '#633394',
                                                                    '&:hover': { backgroundColor: '#7c52a5' }
                                                                }}
                                                            />
                                                        ))}
                                                    </Box>
                                                </Box>
                                            </Grid>
                                        );
                                    })}
                                </Grid>
                            </Box>
                        )}
                    </Paper>
                )}

                {/* Address Information Section */}
                <Paper sx={{ p: 3, mb: 3, boxShadow: 3 }}>
                    <Typography variant="h6" sx={{ color: '#633394', fontWeight: 'bold', mb: 3, textAlign: 'center' }}>
                        Address Information
                    </Typography>

                    <Box sx={{ maxWidth: '800px', mx: 'auto' }}>
                        <EnhancedAddressInput
                            onPlaceSelect={handlePlaceSelect}
                            label="Address Information"
                            fullWidth
                            initialValue={formData.geo_location}
                        />
                    </Box>
                </Paper>

                {/* Email Preview Section */}
                <Paper sx={{ p: 3, mb: 3, boxShadow: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Typography variant="h6" sx={{ color: '#633394', fontWeight: 'bold' }}>
                            Welcome Email Preview
                        </Typography>
                        <Button
                            variant="contained"
                            onClick={async () => {
                                if (!showEmailPreview) {
                                    await generateWelcomeEmailPreview();
                                }
                                setShowEmailPreview(!showEmailPreview);
                            }}
                            disabled={emailPreviewLoading}
                            sx={{
                                backgroundColor: '#633394',
                                '&:hover': { backgroundColor: '#7c52a5' },
                                minWidth: '200px'
                            }}
                        >
                            {emailPreviewLoading ? <CircularProgress size={24} color="inherit" /> :
                                showEmailPreview ? 'Hide Email Preview' : 'Preview Email Content'}
                        </Button>
                    </Box>

                    {showEmailPreview && (
                        <Box sx={{ mt: 2 }}>
                            <Paper sx={{ p: 2, mb: 2, backgroundColor: '#fafafa', border: '1px solid #ddd' }}>
                                <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: '#633394', mb: 1 }}>
                                    Email Details
                                </Typography>
                                <Typography variant="body2" sx={{ mb: 1 }}>
                                    <strong>To:</strong> {emailPreviewData.to}
                                </Typography>
                                <Typography variant="body2">
                                    <strong>Subject:</strong> {emailPreviewData.subject}
                                </Typography>
                            </Paper>

                            <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                                <Button
                                    variant={emailPreviewType === 'text' ? 'contained' : 'outlined'}
                                    onClick={() => setEmailPreviewType('text')}
                                    sx={{
                                        backgroundColor: emailPreviewType === 'text' ? '#633394' : 'transparent',
                                        color: emailPreviewType === 'text' ? 'white' : '#633394',
                                        borderColor: '#633394',
                                        '&:hover': {
                                            backgroundColor: emailPreviewType === 'text' ? '#7c52a5' : '#f5f5f5'
                                        }
                                    }}
                                >
                                    Text Version
                                </Button>
                                <Button
                                    variant={emailPreviewType === 'html' ? 'contained' : 'outlined'}
                                    onClick={() => setEmailPreviewType('html')}
                                    sx={{
                                        backgroundColor: emailPreviewType === 'html' ? '#633394' : 'transparent',
                                        color: emailPreviewType === 'html' ? 'white' : '#633394',
                                        borderColor: '#633394',
                                        '&:hover': {
                                            backgroundColor: emailPreviewType === 'html' ? '#7c52a5' : '#f5f5f5'
                                        }
                                    }}
                                >
                                    HTML Version
                                </Button>
                            </Box>

                            {emailPreviewType === 'text' ? (
                                <Paper sx={{ p: 2, backgroundColor: 'white', border: '1px solid #ddd', maxHeight: '400px', overflow: 'auto' }}>
                                    <Typography variant="body2" sx={{ whiteSpace: 'pre-line', fontFamily: 'monospace', fontSize: '0.85rem' }}>
                                        {emailPreviewData.textVersion}
                                    </Typography>
                                </Paper>
                            ) : (
                                <Paper sx={{ p: 1, backgroundColor: 'white', border: '1px solid #ddd', maxHeight: '400px', overflow: 'auto' }}>
                                    <iframe
                                        title="Email HTML Preview"
                                        srcDoc={emailPreviewData.htmlVersion}
                                        style={{ width: '100%', height: '380px', border: 'none', backgroundColor: 'white' }}
                                    />
                                </Paper>
                            )}
                        </Box>
                    )}
                </Paper>

                {/* Action Buttons */}
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 3 }}>
                    <Button
                        variant="outlined"
                        onClick={() => navigate('/users')}
                        sx={{
                            color: '#633394',
                            borderColor: '#633394',
                            '&:hover': {
                                borderColor: '#7c52a5',
                                backgroundColor: 'rgba(99, 51, 148, 0.04)'
                            }
                        }}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="contained"
                        onClick={handleAddUser}
                        disabled={saving || !formData.username || !formData.email}
                        startIcon={saving ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
                        sx={{
                            backgroundColor: '#633394',
                            '&:hover': { backgroundColor: '#7c52a5' },
                            minWidth: '150px'
                        }}
                    >
                        {saving ? 'Creating User...' : 'Add User'}
                    </Button>
                </Box>

                {/* Email Preview Dialog */}
                <EmailPreviewDialog
                    open={emailPreviewDialogOpen}
                    onClose={() => setEmailPreviewDialogOpen(false)}
                    template={selectedEmailTemplate}
                    formData={formData}
                    organizations={organizations}
                />
            </Container>
        </>
    );
}

export default AddUserPage;
