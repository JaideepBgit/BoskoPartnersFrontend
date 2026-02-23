import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import {
    Container, Box, Typography, Button, Paper, TextField, Select, MenuItem,
    FormControl, InputLabel, Grid, Tabs, Tab, Autocomplete, Tooltip, IconButton,
    CircularProgress, Dialog, DialogTitle, DialogContent, DialogActions
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SaveIcon from '@mui/icons-material/Save';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import {
    addOrganization, fetchOrganizations, fetchOrganizationTypes, fetchUsers,
    fetchRoles, addUser, addRole, updateOrganization
} from '../../../services/UserManagement/UserManagementService';
import EnhancedAddressInput from '../common/EnhancedAddressInput';
import InternalHeader from '../../shared/Headers/InternalHeader';

function AddOrganizationPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const { id } = useParams(); // Get organization ID from URL for edit mode
    const isEditMode = Boolean(id);

    // Get navigation context from location state
    const fromAssociation = location.state?.fromAssociation;
    const associationId = location.state?.associationId;
    const associationName = location.state?.associationName;
    const returnUrl = location.state?.returnUrl;

    // State variables
    const [organizations, setOrganizations] = useState([]);
    const [organizationTypes, setOrganizationTypes] = useState([]);
    const [users, setUsers] = useState([]);
    const [roles, setRoles] = useState([]);
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState(0);

    // Form states
    const [formData, setFormData] = useState({
        name: '',
        type: 'church',
        website: '',
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
            latitude: '',
            longitude: ''
        },
        primary_contact_id: '',
        secondary_contact_id: '',
        head_id: '',
        head_name: '',
        head_email: '',
        head_phone: '',
        head_address: '',
        denomination_affiliation: '',
        accreditation_status_or_body: '',
        highest_level_of_education: '',
        affiliation_validation: '',
        umbrella_association_membership: '',
        details: {}
    });

    // Add User Dialog States
    const [openAddUserDialog, setOpenAddUserDialog] = useState(false);
    const [contactType, setContactType] = useState('');
    const [newUserData, setNewUserData] = useState({
        username: '',
        email: '',
        password: '',
        ui_role: 'user',
        firstname: '',
        lastname: '',
        phone: '',
        organization_id: '',
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
            latitude: '',
            longitude: ''
        }
    });

    // Add Related Organization Dialog States
    const [openAddRelatedOrgDialog, setOpenAddRelatedOrgDialog] = useState(false);
    const [relationshipType, setRelationshipType] = useState('');
    const [newRelatedOrgData, setNewRelatedOrgData] = useState({
        name: '',
        type: '',
        continent: '',
        region: '',
        country: '',
        province: '',
        city: '',
        town: '',
        address_line1: '',
        address_line2: '',
        postal_code: '',
        website: '',
        details: {}
    });

    // Load data on component mount
    useEffect(() => {
        loadOrganizations();
        loadOrganizationTypes();
        loadUsers();
        loadRoles();

        // Load organization data if in edit mode
        if (isEditMode && id) {
            loadOrganizationData();
        }
    }, [id, isEditMode]);

    // Load organization data for editing
    const loadOrganizationData = async () => {
        try {
            setSaving(true);
            const orgsData = await fetchOrganizations();
            const currentOrg = orgsData.find(o => o.id === parseInt(id));

            if (currentOrg) {
                setFormData({
                    name: currentOrg.name || '',
                    type: currentOrg.organization_type?.type || 'church',
                    website: currentOrg.website || '',
                    geo_location: currentOrg.geo_location || {
                        continent: '',
                        region: '',
                        country: '',
                        province: '',
                        city: '',
                        town: '',
                        address_line1: '',
                        address_line2: '',
                        postal_code: '',
                        latitude: '',
                        longitude: ''
                    },
                    primary_contact_id: currentOrg.primary_contact_id || '',
                    secondary_contact_id: currentOrg.secondary_contact_id || '',
                    head_id: currentOrg.head_id || '',
                    head_name: currentOrg.head_name || '',
                    head_email: currentOrg.head_email || '',
                    head_phone: currentOrg.head_phone || '',
                    head_address: currentOrg.head_address || '',
                    denomination_affiliation: currentOrg.denomination_affiliation || '',
                    accreditation_status_or_body: currentOrg.accreditation_status_or_body || '',
                    highest_level_of_education: currentOrg.highest_level_of_education || '',
                    affiliation_validation: currentOrg.affiliation_validation || '',
                    umbrella_association_membership: currentOrg.umbrella_association_membership || '',
                    details: currentOrg.misc || currentOrg.details || {}
                });
            }
        } catch (error) {
            console.error('Failed to load organization data:', error);
            alert('Failed to load organization data');
        } finally {
            setSaving(false);
        }
    };

    // Load organizations from API
    const loadOrganizations = async () => {
        try {
            const data = await fetchOrganizations();
            setOrganizations(data || []);
        } catch (error) {
            console.error('Failed to fetch organizations:', error);
        }
    };

    // Load organization types from API
    const loadOrganizationTypes = async () => {
        try {
            const data = await fetchOrganizationTypes();
            setOrganizationTypes(data || []);
        } catch (error) {
            console.error('Failed to fetch organization types:', error);
        }
    };

    // Load users from API
    const loadUsers = async () => {
        try {
            const data = await fetchUsers();
            setUsers(data || []);
        } catch (error) {
            console.error('Failed to fetch users:', error);
        }
    };

    // Load roles from API
    const loadRoles = async () => {
        try {
            const data = await fetchRoles();
            setRoles(data || []);
        } catch (error) {
            console.error('Failed to fetch roles:', error);
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
            setFormData({
                ...formData,
                [name]: value
            });
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

    // Handle tab change
    const handleTabChange = (event, newValue) => {
        setActiveTab(newValue);
    };

    // Handle contact selection
    const handleContactChange = (contactType, selectedUser) => {
        const userId = selectedUser ? selectedUser.id : '';
        if (contactType === 'primary') {
            setFormData({ ...formData, primary_contact_id: userId });
        } else if (contactType === 'secondary') {
            setFormData({ ...formData, secondary_contact_id: userId });
        } else if (contactType === 'head') {
            setFormData({ ...formData, head_id: userId });
        }
    };

    // Handle organization selection for relationships
    const handleRelatedOrgSelection = (type, selectedOrg) => {
        if (selectedOrg) {
            if (type === 'denomination') {
                setFormData(prev => ({ ...prev, denomination_affiliation: selectedOrg.name }));
            } else if (type === 'accreditation') {
                setFormData(prev => ({ ...prev, accreditation_status_or_body: selectedOrg.name }));
            } else if (type === 'affiliation') {
                setFormData(prev => ({ ...prev, affiliation_validation: selectedOrg.name }));
            } else if (type === 'umbrella') {
                setFormData(prev => ({ ...prev, umbrella_association_membership: selectedOrg.name }));
            }
        }
    };

    // Handle opening add user dialog
    const handleOpenAddUserDialog = (type) => {
        setContactType(type);
        setNewUserData({
            username: '',
            email: '',
            password: '',
            ui_role: 'user',
            firstname: '',
            lastname: '',
            phone: '',
            organization_id: '',
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
                latitude: '',
                longitude: ''
            }
        });
        setOpenAddUserDialog(true);
    };

    // Handle closing add user dialog
    const handleCloseAddUserDialog = () => {
        setOpenAddUserDialog(false);
        setContactType('');
    };

    // Handle new user input changes
    const handleNewUserInputChange = (e) => {
        const { name, value } = e.target;

        if (name.startsWith('geo_location.')) {
            const geoField = name.split('.')[1];
            setNewUserData({
                ...newUserData,
                geo_location: {
                    ...newUserData.geo_location,
                    [geoField]: value
                }
            });
        } else {
            setNewUserData({
                ...newUserData,
                [name]: value
            });
        }
    };

    // Handle adding new user
    const handleAddNewUser = async () => {
        try {
            if (!newUserData.username || !newUserData.email || !newUserData.firstname || !newUserData.lastname) {
                alert('Please fill in all required fields (username, email, first name, last name)');
                return;
            }

            const userData = {
                username: newUserData.username,
                email: newUserData.email,
                password: newUserData.password || 'defaultpass123',
                role: newUserData.ui_role,
                firstname: newUserData.firstname,
                lastname: newUserData.lastname,
                phone: newUserData.phone,
                organization_id: newUserData.organization_id || null
            };

            const hasValidGeoData = (geoData) => {
                return Object.values(geoData).some(value => value && value.toString().trim() !== '');
            };

            if (hasValidGeoData(newUserData.geo_location)) {
                userData.geo_location = newUserData.geo_location;
            }

            const response = await addUser(userData);

            // Reload users to get the new user
            await loadUsers();

            // Set the new user as the selected contact based on type
            if (contactType === 'primary') {
                setFormData(prev => ({ ...prev, primary_contact_id: response.id }));
            } else if (contactType === 'secondary') {
                setFormData(prev => ({ ...prev, secondary_contact_id: response.id }));
            } else if (contactType === 'head') {
                setFormData(prev => ({ ...prev, head_id: response.id }));
            }

            handleCloseAddUserDialog();
        } catch (error) {
            console.error('Failed to add new user:', error);
            alert(`Failed to add new user: ${error.message}`);
        }
    };

    // Handle opening add related organization dialog
    const handleOpenAddRelatedOrgDialog = (type) => {
        setRelationshipType(type);
        const defaultType = organizationTypes.length > 0 ? organizationTypes[0].type : '';

        setNewRelatedOrgData({
            name: '',
            type: defaultType,
            continent: '',
            region: '',
            country: '',
            province: '',
            city: '',
            town: '',
            address_line1: '',
            address_line2: '',
            postal_code: '',
            website: '',
            details: {}
        });
        setOpenAddRelatedOrgDialog(true);
    };

    // Handle closing add related organization dialog
    const handleCloseAddRelatedOrgDialog = () => {
        setOpenAddRelatedOrgDialog(false);
        setRelationshipType('');
    };

    // Handle related organization input changes
    const handleRelatedOrgInputChange = (e) => {
        const { name, value } = e.target;
        setNewRelatedOrgData({
            ...newRelatedOrgData,
            [name]: value
        });
    };

    // Handle adding new related organization
    const handleAddNewRelatedOrg = async () => {
        try {
            if (!newRelatedOrgData.name) {
                alert('Please enter an organization name');
                return;
            }

            const orgType = organizationTypes.find(ot => ot.type === newRelatedOrgData.type);

            const orgData = {
                name: newRelatedOrgData.name,
                type_id: orgType?.id || null,
                geo_location: {
                    continent: newRelatedOrgData.continent,
                    region: newRelatedOrgData.region,
                    country: newRelatedOrgData.country,
                    province: newRelatedOrgData.province,
                    city: newRelatedOrgData.city,
                    town: newRelatedOrgData.town,
                    address_line1: newRelatedOrgData.address_line1 || '',
                    address_line2: newRelatedOrgData.address_line2 || '',
                    postal_code: newRelatedOrgData.postal_code || ''
                },
                website: newRelatedOrgData.website || '',
                misc: newRelatedOrgData.details || {}
            };

            await addOrganization(orgData);
            await loadOrganizations();

            if (relationshipType === 'denomination') {
                setFormData(prev => ({ ...prev, denomination_affiliation: newRelatedOrgData.name }));
            } else if (relationshipType === 'accreditation') {
                setFormData(prev => ({ ...prev, accreditation_status_or_body: newRelatedOrgData.name }));
            } else if (relationshipType === 'affiliation') {
                setFormData(prev => ({ ...prev, affiliation_validation: newRelatedOrgData.name }));
            } else if (relationshipType === 'umbrella') {
                setFormData(prev => ({ ...prev, umbrella_association_membership: newRelatedOrgData.name }));
            }

            handleCloseAddRelatedOrgDialog();
        } catch (error) {
            console.error('Failed to add new related organization:', error);
            alert(`Failed to add new organization: ${error.message}`);
        }
    };

    // Transform form data to API format
    const transformFormDataToApiFormat = (formData) => {
        const orgType = organizationTypes.find(ot => ot.type === formData.type);

        const hasValidGeoData = (geoData) => {
            return geoData && Object.values(geoData).some(value => value && value.toString().trim() !== '');
        };

        const getNumericCoordinate = (value) => {
            if (!value || value.toString().trim() === '') return 0;
            const num = parseFloat(value);
            return isNaN(num) ? 0 : num;
        };

        const apiData = {
            name: formData.name,
            type_id: orgType?.id || null,
            geo_location: hasValidGeoData(formData.geo_location) ? {
                continent: formData.geo_location.continent || '',
                region: formData.geo_location.region || '',
                country: formData.geo_location.country || '',
                province: formData.geo_location.province || '',
                city: formData.geo_location.city || '',
                town: formData.geo_location.town || '',
                address_line1: formData.geo_location.address_line1 || '',
                address_line2: formData.geo_location.address_line2 || '',
                postal_code: formData.geo_location.postal_code || '',
                latitude: getNumericCoordinate(formData.geo_location.latitude),
                longitude: getNumericCoordinate(formData.geo_location.longitude)
            } : null,
            website: formData.website || '',
            denomination_affiliation: formData.denomination_affiliation || '',
            accreditation_status_or_body: formData.accreditation_status_or_body || '',
            highest_level_of_education: formData.highest_level_of_education || '',
            affiliation_validation: formData.affiliation_validation || '',
            umbrella_association_membership: formData.umbrella_association_membership || '',
            misc: formData.details || {}
        };

        // Build relationships array from affiliation fields
        const relationships = [];

        // Map affiliation field names to relationship types
        const affiliationMapping = {
            'denomination_affiliation': 'denomination',
            'accreditation_status_or_body': 'accreditation',
            'affiliation_validation': 'affiliation',
            'umbrella_association_membership': 'umbrella_association'
        };

        // For each affiliation field, check if an organization was selected
        Object.entries(affiliationMapping).forEach(([fieldName, relType]) => {
            const affiliationValue = formData[fieldName];
            if (affiliationValue) {
                // Try to find the organization by name
                const relatedOrg = organizations.find(org => org.name === affiliationValue);
                if (relatedOrg && relatedOrg.id) {
                    relationships.push({
                        related_organization_id: relatedOrg.id,
                        relationship_type: relType,
                        notes: null
                    });
                }
            }
        });

        // Add relationships array if there are any relationships
        if (relationships.length > 0) {
            apiData.relationships = relationships;
        }

        // Add contact information if provided
        if (formData.primary_contact_id) {
            const primaryContact = users.find(user => user.id === formData.primary_contact_id);
            if (primaryContact) {
                apiData.primary_contact = {
                    username: primaryContact.username,
                    email: primaryContact.email,
                    password: 'defaultpass123',
                    firstname: primaryContact.firstname,
                    lastname: primaryContact.lastname,
                    phone: primaryContact.phone
                };
            }
        }
        if (formData.secondary_contact_id) {
            const secondaryContact = users.find(user => user.id === formData.secondary_contact_id);
            if (secondaryContact) {
                apiData.secondary_contact = {
                    username: secondaryContact.username,
                    email: secondaryContact.email,
                    password: 'defaultpass123',
                    firstname: secondaryContact.firstname,
                    lastname: secondaryContact.lastname,
                    phone: secondaryContact.phone
                };
            }
        }
        if (formData.head_id) {
            const headContact = users.find(user => user.id === formData.head_id);
            if (headContact) {
                apiData.lead = {
                    username: headContact.username,
                    email: headContact.email,
                    password: 'defaultpass123',
                    firstname: headContact.firstname,
                    lastname: headContact.lastname,
                    phone: headContact.phone
                };
            }
        }

        return apiData;
    };

    // Handle adding/updating organization
    const handleAddOrganization = async () => {
        if (!formData.name) {
            alert('Organization name is required');
            return;
        }

        setSaving(true);
        try {
            const apiData = transformFormDataToApiFormat(formData);

            if (isEditMode) {
                // Update existing organization
                await updateOrganization(id, apiData);
                alert(`Organization "${formData.name}" updated successfully!`);

                // Navigate back to the appropriate detail page
                if (fromAssociation && associationId) {
                    navigate(`/association-management/${associationId}`);
                } else {
                    navigate(`/organization-management/${id}`);
                }
            } else {
                // Add new organization
                const result = await addOrganization(apiData);

                if (result.default_template_version_id) {
                    alert(`Organization "${formData.name}" added successfully! A default survey template version has been created.`);
                } else {
                    alert(`Organization "${formData.name}" added successfully!`);
                }

                navigate(returnUrl || '/organizations');
            }
        } catch (error) {
            console.error(`Failed to ${isEditMode ? 'update' : 'add'} organization:`, error);
            alert(`Failed to ${isEditMode ? 'update' : 'add'} organization: ${error.message}`);
        } finally {
            setSaving(false);
        }
    };

    // Get type label
    const getTypeLabel = (type) => {
        switch (type?.toLowerCase()) {
            case 'church': return 'Church';
            case 'institution': return 'Institution';
            case 'non_formal_organizations': return 'Non-formal Organization';
            default: return type?.charAt(0).toUpperCase() + type?.slice(1) || 'Organization';
        }
    };

    return (
        <>
            <InternalHeader
                title={isEditMode ? "Edit Organization" : "Add New Organization"}
                leftActions={
                    <Button
                        variant="outlined"
                        startIcon={<ArrowBackIcon />}
                        onClick={() => {
                            if (isEditMode) {
                                // If editing and came from association, go back to association
                                if (fromAssociation && associationId) {
                                    navigate(`/association-management/${associationId}`);
                                } else {
                                    navigate(`/organization-management/${id}`);
                                }
                            } else if (returnUrl) {
                                navigate(returnUrl);
                            } else {
                                navigate('/organizations');
                            }
                        }}
                    >
                        {isEditMode ? (fromAssociation ? `Back to ${associationName}` : 'Back') : (returnUrl && associationName ? `Back to ${associationName}` : 'Organizations')}
                    </Button>
                }
                rightActions={
                    <Button
                        variant="contained"
                        onClick={handleAddOrganization}
                        disabled={saving}
                    >
                        {saving ? 'Saving...' : 'Save'}
                    </Button>
                }
            />
            <Container maxWidth="lg" sx={{ py: 4 }}>
                <Box sx={{ maxWidth: 600, mx: 'auto' }}>

                    {/* Tabs */}
                    <Paper sx={{ mb: 3, boxShadow: 3 }}>
                        <Tabs
                            value={activeTab}
                            onChange={handleTabChange}
                            sx={{
                                '& .MuiTab-root': {
                                    color: '#633394',
                                    fontWeight: 500,
                                    '&.Mui-selected': { fontWeight: 700 },
                                },
                                '& .MuiTabs-indicator': {
                                    backgroundColor: '#633394',
                                },
                            }}
                            variant="fullWidth"
                        >
                            <Tab label="Details" />
                            <Tab label="Address" />
                            <Tab label="Linked Organizations" />
                        </Tabs>
                    </Paper>

                    {/* Tab 0: Details */}
                    {activeTab === 0 && (
                        <Box>
                            {/* Details Section */}
                            <Paper sx={{ p: 3, mb: 3, boxShadow: 3 }}>
                                <Grid container spacing={3}>
                                    <Grid item xs={12}>
                                        <TextField
                                            required
                                            fullWidth
                                            label="Organization Name"
                                            name="name"
                                            value={formData.name}
                                            onChange={handleInputChange}
                                            variant="outlined"
                                        />
                                    </Grid>
                                    <Grid item xs={12}>
                                        <FormControl fullWidth variant="outlined">
                                            <InputLabel>Organization Type</InputLabel>
                                            <Select
                                                name="type"
                                                value={formData.type}
                                                onChange={handleInputChange}
                                                label="Organization Type"
                                            >
                                                {organizationTypes
                                                    .filter(orgType => ['church', 'non_formal_organizations', 'institution'].includes(orgType.type.toLowerCase()))
                                                    .map((orgType) => (
                                                        <MenuItem key={orgType.id} value={orgType.type}>
                                                            {getTypeLabel(orgType.type)}
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
                                            onChange={handleInputChange}
                                            variant="outlined"
                                        />
                                    </Grid>
                                    {formData.type?.toLowerCase() === 'institution' && (
                                        <Grid item xs={12}>
                                            <TextField
                                                fullWidth
                                                label="Highest Level of Education"
                                                name="highest_level_of_education"
                                                value={formData.highest_level_of_education}
                                                onChange={handleInputChange}
                                                variant="outlined"
                                            />
                                        </Grid>
                                    )}
                                </Grid>
                            </Paper>
                        </Box>
                    )}

                    {/* Tab 1: Address */}
                    {activeTab === 1 && (
                        <Box>
                            <Paper sx={{ p: 3, mb: 3, boxShadow: 3 }}>
                                <Typography variant="h6" sx={{ color: '#633394', fontWeight: 'bold', mb: 3, textAlign: 'center' }}>
                                    Address Information
                                </Typography>

                                <Box sx={{ maxWidth: '800px', mx: 'auto' }}>
                                    <EnhancedAddressInput
                                        onPlaceSelect={handlePlaceSelect}
                                        label="Organization Address Information"
                                        fullWidth
                                        initialValue={formData.geo_location}
                                    />
                                </Box>
                            </Paper>
                        </Box>
                    )}

                    {/* Tab 2: Linked Organizations */}
                    {activeTab === 2 && (
                        <Box>
                            {['church', 'institution', 'non_formal_organizations'].includes(formData.type?.toLowerCase()) ? (
                                <Paper sx={{ p: 3, mb: 3, boxShadow: 3 }}>
                                    <Typography variant="h6" sx={{ color: '#633394', fontWeight: 'bold', mb: 3, textAlign: 'center' }}>
                                        Organizational Relationships & Affiliations
                                    </Typography>

                                    <Grid container spacing={3}>
                                        {/* Denomination/Affiliation */}
                                        <Grid item xs={12} md={6}>
                                            <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 1 }}>
                                                <Autocomplete
                                                    fullWidth
                                                    options={organizations}
                                                    getOptionLabel={(option) => option.name || ''}
                                                    value={organizations.find(org => org.name === formData.denomination_affiliation) || null}
                                                    onChange={(event, newValue) => handleRelatedOrgSelection('denomination', newValue)}
                                                    renderInput={(params) => (
                                                        <TextField
                                                            {...params}
                                                            label="Denomination/Affiliation"
                                                            name="denomination_affiliation"
                                                            value={formData.denomination_affiliation}
                                                            onChange={handleInputChange}
                                                            variant="outlined"
                                                            helperText="Search existing organizations or add new"
                                                        />
                                                    )}
                                                    renderOption={(props, option) => {
                                                        const { key, ...otherProps } = props;
                                                        return (
                                                            <li key={key} {...otherProps}>
                                                                <Box>
                                                                    <Typography variant="body2">
                                                                        {option.name}
                                                                    </Typography>
                                                                    <Typography variant="caption" color="text.secondary">
                                                                        {option.organization_type?.type || 'Unknown Type'} • {option.geo_location?.city || 'Unknown Location'}
                                                                    </Typography>
                                                                </Box>
                                                            </li>
                                                        );
                                                    }}
                                                    isOptionEqualToValue={(option, value) => option.id === value.id}
                                                    freeSolo
                                                />
                                                <Tooltip title="Add New Organization">
                                                    <IconButton
                                                        color="primary"
                                                        onClick={() => handleOpenAddRelatedOrgDialog('denomination')}
                                                        sx={{ mb: 2.5 }}
                                                    >
                                                        <AddIcon />
                                                    </IconButton>
                                                </Tooltip>
                                            </Box>
                                        </Grid>

                                        {/* Umbrella Association for Churches */}
                                        {formData.type?.toLowerCase() === 'church' && (
                                            <Grid item xs={12} md={6}>
                                                <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 1 }}>
                                                    <Autocomplete
                                                        fullWidth
                                                        options={organizations}
                                                        getOptionLabel={(option) => option.name || ''}
                                                        value={organizations.find(org => org.name === formData.umbrella_association_membership) || null}
                                                        onChange={(event, newValue) => handleRelatedOrgSelection('umbrella', newValue)}
                                                        renderInput={(params) => (
                                                            <TextField
                                                                {...params}
                                                                label="Umbrella Association Membership"
                                                                name="umbrella_association_membership"
                                                                value={formData.umbrella_association_membership}
                                                                onChange={handleInputChange}
                                                                variant="outlined"
                                                                helperText="Search existing organizations or add new"
                                                            />
                                                        )}
                                                        renderOption={(props, option) => {
                                                            const { key, ...otherProps } = props;
                                                            return (
                                                                <li key={key} {...otherProps}>
                                                                    <Box>
                                                                        <Typography variant="body2">
                                                                            {option.name}
                                                                        </Typography>
                                                                        <Typography variant="caption" color="text.secondary">
                                                                            {option.organization_type?.type || 'Unknown Type'} • {option.geo_location?.city || 'Unknown Location'}
                                                                        </Typography>
                                                                    </Box>
                                                                </li>
                                                            );
                                                        }}
                                                        isOptionEqualToValue={(option, value) => option.id === value.id}
                                                        freeSolo
                                                    />
                                                    <Tooltip title="Add New Organization">
                                                        <IconButton
                                                            color="primary"
                                                            onClick={() => handleOpenAddRelatedOrgDialog('umbrella')}
                                                            sx={{ mb: 2.5 }}
                                                        >
                                                            <AddIcon />
                                                        </IconButton>
                                                    </Tooltip>
                                                </Box>
                                            </Grid>
                                        )}

                                        {/* Accreditation Status/Body for Institutions */}
                                        {formData.type?.toLowerCase() === 'institution' && (
                                            <Grid item xs={12} md={6}>
                                                <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 1 }}>
                                                    <Autocomplete
                                                        fullWidth
                                                        options={organizations}
                                                        getOptionLabel={(option) => option.name || ''}
                                                        value={organizations.find(org => org.name === formData.accreditation_status_or_body) || null}
                                                        onChange={(event, newValue) => handleRelatedOrgSelection('accreditation', newValue)}
                                                        renderInput={(params) => (
                                                            <TextField
                                                                {...params}
                                                                label="Accreditation Status/Accrediting Body"
                                                                name="accreditation_status_or_body"
                                                                value={formData.accreditation_status_or_body}
                                                                onChange={handleInputChange}
                                                                variant="outlined"
                                                                helperText="Search existing organizations or add new"
                                                            />
                                                        )}
                                                        renderOption={(props, option) => {
                                                            const { key, ...otherProps } = props;
                                                            return (
                                                                <li key={key} {...otherProps}>
                                                                    <Box>
                                                                        <Typography variant="body2">
                                                                            {option.name}
                                                                        </Typography>
                                                                        <Typography variant="caption" color="text.secondary">
                                                                            {option.organization_type?.type || 'Unknown Type'} • {option.geo_location?.city || 'Unknown Location'}
                                                                        </Typography>
                                                                    </Box>
                                                                </li>
                                                            );
                                                        }}
                                                        isOptionEqualToValue={(option, value) => option.id === value.id}
                                                        freeSolo
                                                    />
                                                    <Tooltip title="Add New Organization">
                                                        <IconButton
                                                            color="primary"
                                                            onClick={() => handleOpenAddRelatedOrgDialog('accreditation')}
                                                            sx={{ mb: 2.5 }}
                                                        >
                                                            <AddIcon />
                                                        </IconButton>
                                                    </Tooltip>
                                                </Box>
                                            </Grid>
                                        )}

                                        {/* Affiliation/Validation for Non-formal Organizations */}
                                        {formData.type?.toLowerCase() === 'non_formal_organizations' && (
                                            <Grid item xs={12} md={6}>
                                                <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 1 }}>
                                                    <Autocomplete
                                                        fullWidth
                                                        options={organizations}
                                                        getOptionLabel={(option) => option.name || ''}
                                                        value={organizations.find(org => org.name === formData.affiliation_validation) || null}
                                                        onChange={(event, newValue) => handleRelatedOrgSelection('affiliation', newValue)}
                                                        renderInput={(params) => (
                                                            <TextField
                                                                {...params}
                                                                label="Affiliation/Validation"
                                                                name="affiliation_validation"
                                                                value={formData.affiliation_validation}
                                                                onChange={handleInputChange}
                                                                variant="outlined"
                                                                helperText="Search existing organizations or add new"
                                                            />
                                                        )}
                                                        renderOption={(props, option) => {
                                                            const { key, ...otherProps } = props;
                                                            return (
                                                                <li key={key} {...otherProps}>
                                                                    <Box>
                                                                        <Typography variant="body2">
                                                                            {option.name}
                                                                        </Typography>
                                                                        <Typography variant="caption" color="text.secondary">
                                                                            {option.organization_type?.type || 'Unknown Type'} • {option.geo_location?.city || 'Unknown Location'}
                                                                        </Typography>
                                                                    </Box>
                                                                </li>
                                                            );
                                                        }}
                                                        isOptionEqualToValue={(option, value) => option.id === value.id}
                                                        freeSolo
                                                    />
                                                    <Tooltip title="Add New Organization">
                                                        <IconButton
                                                            color="primary"
                                                            onClick={() => handleOpenAddRelatedOrgDialog('affiliation')}
                                                            sx={{ mb: 2.5 }}
                                                        >
                                                            <AddIcon />
                                                        </IconButton>
                                                    </Tooltip>
                                                </Box>
                                            </Grid>
                                        )}
                                    </Grid>
                                </Paper>
                            ) : (
                                <Paper sx={{ p: 3, mb: 3, boxShadow: 3 }}>
                                    <Typography variant="body1" sx={{ textAlign: 'center', color: 'text.secondary' }}>
                                        Select an organization type on the Details tab to manage linked organizations.
                                    </Typography>
                                </Paper>
                            )}
                        </Box>
                    )}



                    {/* Add User Dialog */}
                    <Dialog open={openAddUserDialog} onClose={handleCloseAddUserDialog} maxWidth="sm" fullWidth>
                        <DialogTitle sx={{ backgroundColor: '#633394', color: 'white' }}>
                            Add New {contactType === 'head' ?
                                (formData.type?.toLowerCase() === 'church' ? 'Pastor' :
                                    formData.type?.toLowerCase() === 'institution' ? 'President' : 'Lead') :
                                `${contactType.charAt(0).toUpperCase() + contactType.slice(1)} Contact`}
                        </DialogTitle>
                        <DialogContent dividers>
                            <Grid container spacing={2} sx={{ mt: 1 }}>
                                <Grid item xs={12} md={6}>
                                    <TextField
                                        required
                                        fullWidth
                                        label="Username"
                                        name="username"
                                        value={newUserData.username}
                                        onChange={handleNewUserInputChange}
                                        variant="outlined"
                                    />
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <TextField
                                        required
                                        fullWidth
                                        label="Email"
                                        name="email"
                                        type="email"
                                        value={newUserData.email}
                                        onChange={handleNewUserInputChange}
                                        variant="outlined"
                                    />
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <TextField
                                        required
                                        fullWidth
                                        label="First Name"
                                        name="firstname"
                                        value={newUserData.firstname}
                                        onChange={handleNewUserInputChange}
                                        variant="outlined"
                                    />
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <TextField
                                        required
                                        fullWidth
                                        label="Last Name"
                                        name="lastname"
                                        value={newUserData.lastname}
                                        onChange={handleNewUserInputChange}
                                        variant="outlined"
                                    />
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <TextField
                                        fullWidth
                                        label="Phone"
                                        name="phone"
                                        value={newUserData.phone}
                                        onChange={handleNewUserInputChange}
                                        variant="outlined"
                                    />
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <TextField
                                        fullWidth
                                        label="Password (auto-generated if empty)"
                                        name="password"
                                        type="password"
                                        value={newUserData.password}
                                        onChange={handleNewUserInputChange}
                                        variant="outlined"
                                        helperText="Leave empty for auto-generated password"
                                    />
                                </Grid>
                            </Grid>
                        </DialogContent>
                        <DialogActions>
                            <Button onClick={handleCloseAddUserDialog} color="secondary">Cancel</Button>
                            <Button
                                onClick={handleAddNewUser}
                                variant="contained"
                                sx={{ backgroundColor: '#633394', '&:hover': { backgroundColor: '#7c52a5' } }}
                            >
                                Add User
                            </Button>
                        </DialogActions>
                    </Dialog>

                    {/* Add Related Organization Dialog */}
                    <Dialog open={openAddRelatedOrgDialog} onClose={handleCloseAddRelatedOrgDialog} maxWidth="sm" fullWidth>
                        <DialogTitle sx={{ backgroundColor: '#633394', color: 'white' }}>
                            Add New {relationshipType === 'denomination' ? 'Denomination/Affiliation' :
                                relationshipType === 'accreditation' ? 'Accrediting Body' :
                                    relationshipType === 'affiliation' ? 'Affiliation' :
                                        relationshipType === 'umbrella' ? 'Umbrella Association' : 'Organization'}
                        </DialogTitle>
                        <DialogContent dividers>
                            <Grid container spacing={2} sx={{ mt: 1 }}>
                                <Grid item xs={12}>
                                    <TextField
                                        required
                                        fullWidth
                                        label="Organization Name"
                                        name="name"
                                        value={newRelatedOrgData.name}
                                        onChange={handleRelatedOrgInputChange}
                                        variant="outlined"
                                    />
                                </Grid>
                                <Grid item xs={12}>
                                    <FormControl fullWidth variant="outlined">
                                        <InputLabel>Type</InputLabel>
                                        <Select
                                            name="type"
                                            value={newRelatedOrgData.type}
                                            onChange={handleRelatedOrgInputChange}
                                            label="Type"
                                        >
                                            {organizationTypes.map((orgType) => (
                                                <MenuItem key={orgType.id} value={orgType.type}>
                                                    {getTypeLabel(orgType.type)}
                                                </MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <TextField
                                        fullWidth
                                        label="City"
                                        name="city"
                                        value={newRelatedOrgData.city}
                                        onChange={handleRelatedOrgInputChange}
                                        variant="outlined"
                                    />
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <TextField
                                        fullWidth
                                        label="Country"
                                        name="country"
                                        value={newRelatedOrgData.country}
                                        onChange={handleRelatedOrgInputChange}
                                        variant="outlined"
                                    />
                                </Grid>
                                <Grid item xs={12}>
                                    <TextField
                                        fullWidth
                                        label="Website"
                                        name="website"
                                        value={newRelatedOrgData.website}
                                        onChange={handleRelatedOrgInputChange}
                                        variant="outlined"
                                    />
                                </Grid>
                            </Grid>
                        </DialogContent>
                        <DialogActions>
                            <Button onClick={handleCloseAddRelatedOrgDialog} color="secondary">Cancel</Button>
                            <Button
                                onClick={handleAddNewRelatedOrg}
                                variant="contained"
                                sx={{ backgroundColor: '#633394', '&:hover': { backgroundColor: '#7c52a5' } }}
                            >
                                Add Organization
                            </Button>
                        </DialogActions>
                    </Dialog>
                </Box>
            </Container>
        </>
    );
}

export default AddOrganizationPage;
