import React, { useState, useEffect, useMemo } from 'react';
import {
    Box, Typography, Button, Paper, IconButton, Dialog, DialogActions,
    DialogContent, DialogTitle, TextField, Select, MenuItem, FormControl,
    InputLabel, Card, CardContent, Grid, Chip, Tabs, Tab, useTheme,
    Autocomplete, Tooltip, CircularProgress, Stack, Alert, Snackbar
} from '@mui/material';
import DataTable from '../../shared/DataTable/DataTable';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import RadarIcon from '@mui/icons-material/Radar';
import SpiderChartPopup from '../common/SpiderChartPopup';
import {
    fetchOrganizations, addOrganization, updateOrganization, deleteOrganization,
    fetchDenominations, fetchAccreditationBodies, fetchUmbrellaAssociations,
    uploadOrganizationFile, fetchOrganizationTypes, initializeOrganizationTypes,
    fetchUsers, addUser, fetchRoles, addRole, addUserOrganizationalTitle,
    fetchUserOrganizationalTitles, updateUserOrganizationalTitles
} from '../../../services/UserManagement/UserManagementService';
import MapAddressSelector from '../common/MapAddressSelector';
import EnhancedAddressInput from '../common/EnhancedAddressInput';

function OrganizationsManagement({ showAddDialogOnly = false, onClose = null, onOrganizationAdded = null }) {
    const theme = useTheme();

    // State variables
    const [organizations, setOrganizations] = useState([]);
    const [organizationTypes, setOrganizationTypes] = useState([]);
    const [denominations, setDenominations] = useState([]);
    const [accreditationBodies, setAccreditationBodies] = useState([]);
    const [umbrellaAssociations, setUmbrellaAssociations] = useState([]);
    const [users, setUsers] = useState([]);
    const [roles, setRoles] = useState([]);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [otherPage, setOtherPage] = useState(0);
    const [otherRowsPerPage, setOtherRowsPerPage] = useState(10);
    const [totalOrganizations, setTotalOrganizations] = useState(0);
    const [orgTypeFilter, setOrgTypeFilter] = useState('all');
    const [activeTab, setActiveTab] = useState(0);

    // Define main organization types (shown in first table)
    const mainOrganizationTypes = ['church', 'Institution', 'Non_formal_organizations'];

    // Search, Filter, and Sort states
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('');
    const [filterLocation, setFilterLocation] = useState('');
    const [sortBy, setSortBy] = useState('name');
    const [sortOrder, setSortOrder] = useState('asc');

    // Bulk selection state
    const [selectedMainOrgIds, setSelectedMainOrgIds] = useState([]);
    const [selectedOtherOrgIds, setSelectedOtherOrgIds] = useState([]);
    const [openBulkDeleteDialog, setOpenBulkDeleteDialog] = useState(false);
    const [bulkDeleteTarget, setBulkDeleteTarget] = useState('main'); // 'main' or 'other'
    const [bulkDeleteLoading, setBulkDeleteLoading] = useState(false);
    const [orgSnackbar, setOrgSnackbar] = useState({ open: false, message: '', severity: 'info' });

    // Dialog states
    const [openAddDialog, setOpenAddDialog] = useState(false);
    const [openEditDialog, setOpenEditDialog] = useState(false);
    const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
    const [openUploadDialog, setOpenUploadDialog] = useState(false);
    const [openAddUserDialog, setOpenAddUserDialog] = useState(false);
    const [openAddRelatedOrgDialog, setOpenAddRelatedOrgDialog] = useState(false);

    // Spider Chart Popup states
    const [spiderChartOpen, setSpiderChartOpen] = useState(false);
    const [selectedOrgForChart, setSelectedOrgForChart] = useState(null);

    // Handler for opening spider chart popup
    const handleOpenSpiderChart = (org) => {
        setSelectedOrgForChart(org);
        setSpiderChartOpen(true);
    };

    const handleCloseSpiderChart = () => {
        setSpiderChartOpen(false);
        setSelectedOrgForChart(null);
    };

    // Form states
    const [formData, setFormData] = useState({
        // Basic Information & Address
        name: '',
        type: 'Churches',
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
        // Contacts & Relationships
        primary_contact_id: '',
        secondary_contact_id: '',
        head_name: '',
        head_email: '',
        head_phone: '',
        head_address: '',
        denomination_id: '',
        accreditation_body_id: '',
        umbrella_association_id: '',
        // Miscellaneous
        highest_level_of_education: '',
        affiliation_validation: '',
        details: {}
    });

    const [selectedOrganization, setSelectedOrganization] = useState(null);
    const [selectedFile, setSelectedFile] = useState(null);
    const [uploadStatus, setUploadStatus] = useState('');

    // Enhanced User Form States (matching UserManagement component)
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

    const [contactType, setContactType] = useState(''); // 'primary', 'secondary', or 'head'
    const [newRoleName, setNewRoleName] = useState('');
    const [roleSearchText, setRoleSearchText] = useState('');
    const [isAddingNewRole, setIsAddingNewRole] = useState(false);
    const [roleLoading, setRoleLoading] = useState(false);
    const [addingOrganizationalTitle, setAddingOrganizationalTitle] = useState(false);
    const [selectedOrganizationIdForRole, setSelectedOrganizationIdForRole] = useState('');
    const [selectedRoleType, setSelectedRoleType] = useState('');
    const [organizationalTitleToAdd, setOrganizationalTitleToAdd] = useState('');

    // Related organization states
    const [relationshipType, setRelationshipType] = useState(''); // 'denomination', 'accreditation', 'affiliation', 'umbrella'
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
        loadDenominations();
        loadAccreditationBodies();
        loadUmbrellaAssociations();
        loadUsers();
        loadRoles();
    }, []);

    // Auto-open Add dialog when in showAddDialogOnly mode
    useEffect(() => {
        if (showAddDialogOnly) {
            setOpenAddDialog(true);
        }
    }, [showAddDialogOnly]);

    // Load organizations from API
    const loadOrganizations = async () => {
        try {
            const data = await fetchOrganizations();
            setOrganizations(data);
            setTotalOrganizations(data.length);
        } catch (error) {
            console.error('Failed to fetch organizations:', error);
        }
    };

    // Load organization types from API
    const loadOrganizationTypes = async () => {
        try {
            const data = await fetchOrganizationTypes();
            if (!data || data.length === 0) {
                // Initialize default types if none exist
                await initializeOrganizationTypes();
                const retryData = await fetchOrganizationTypes();
                setOrganizationTypes(retryData || []);
            } else {
                setOrganizationTypes(data);
            }
        } catch (error) {
            console.error('Failed to fetch organization types:', error);
            setOrganizationTypes([]);
        }
    };

    // Load denominations from API
    const loadDenominations = async () => {
        try {
            const data = await fetchDenominations();
            setDenominations(data || []);
        } catch (error) {
            console.error('Failed to fetch denominations:', error);
            setDenominations([]);
        }
    };

    // Load accreditation bodies from API
    const loadAccreditationBodies = async () => {
        try {
            const data = await fetchAccreditationBodies();
            setAccreditationBodies(data || []);
        } catch (error) {
            console.error('Failed to fetch accreditation bodies:', error);
            setAccreditationBodies([]);
        }
    };

    // Load umbrella associations from API
    const loadUmbrellaAssociations = async () => {
        try {
            const data = await fetchUmbrellaAssociations();
            setUmbrellaAssociations(data || []);
        } catch (error) {
            console.error('Failed to fetch umbrella associations:', error);
            setUmbrellaAssociations([]);
        }
    };

    // Load users from API
    const loadUsers = async () => {
        try {
            const data = await fetchUsers();
            setUsers(data || []);
        } catch (error) {
            console.error('Failed to fetch users:', error);
            setUsers([]);
        }
    };

    // Load roles from API
    const loadRoles = async () => {
        try {
            const data = await fetchRoles();
            setRoles(data || []);
        } catch (error) {
            console.error('Failed to fetch roles:', error);
            setRoles([]);
        }
    };

    // Handle form input changes
    const handleInputChange = (e) => {
        const { name, value } = e.target;

        // Handle nested geo_location fields
        if (name.startsWith('geo_location.')) {
            const geoField = name.split('.')[1];
            setFormData(prevData => ({
                ...prevData,
                geo_location: {
                    ...prevData.geo_location,
                    [geoField]: value
                }
            }));
        } else {
            setFormData(prevData => ({
                ...prevData,
                [name]: value,
                // Also update geo_location if it's an address field
                ...(name === 'continent' || name === 'region' || name === 'country' ||
                    name === 'province' || name === 'city' || name === 'town' ||
                    name === 'address_line1' || name === 'address_line2' || name === 'postal_code' ? {
                    geo_location: {
                        ...prevData.geo_location,
                        [name]: value
                    }
                } : {})
            }));
        }
    };

    // Handle details input changes
    const handleDetailsChange = (e) => {
        const { name, value } = e.target;
        setFormData(prevData => ({
            ...prevData,
            details: {
                ...prevData.details,
                [name]: value
            }
        }));
    };

    // Handle Google Places selection for organization address
    const handlePlaceSelect = (placeData) => {
        const { geoLocationData, formattedAddress } = placeData;

        setFormData(prevData => ({
            ...prevData,
            geo_location: {
                ...prevData.geo_location,
                ...geoLocationData
            }
        }));

        // Show a brief success message
        console.log('Organization address auto-filled:', formattedAddress);
    };

    // Handle file selection for upload
    const handleFileChange = (e) => {
        setSelectedFile(e.target.files[0]);
    };

    // Handle file upload
    const handleFileUpload = async () => {
        if (!selectedFile) {
            setUploadStatus('Please select a file first');
            return;
        }

        try {
            const formData = new FormData();
            formData.append('file', selectedFile);

            const response = await uploadOrganizationFile(formData);
            setUploadStatus(`File uploaded successfully: ${response.filename}`);

            // Reload organizations after successful upload
            loadOrganizations();

            // Close the dialog after a delay
            setTimeout(() => {
                setOpenUploadDialog(false);
                setSelectedFile(null);
                setUploadStatus('');
            }, 2000);
        } catch (error) {
            setUploadStatus(`Upload failed: ${error.message}`);
        }
    };

    // Handle new user input changes (enhanced version)
    const handleNewUserInputChange = (e) => {
        const { name, value } = e.target;

        // Handle nested geo_location fields
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

    // Handle adding a new role for user
    const handleAddNewRoleForUser = async () => {
        if (!newRoleName.trim()) return;

        setRoleLoading(true);
        try {
            const roleData = {
                name: newRoleName.trim(),
                description: `Created for user with ${newUserData.ui_role} role`
            };

            const newRole = await addRole(roleData);
            setNewRoleName('');
            setIsAddingNewRole(false);

            // Reload roles
            await loadRoles();

        } catch (error) {
            console.error('Failed to add new role:', error);
            alert(`Failed to add new role: ${error.message}`);
        } finally {
            setRoleLoading(false);
        }
    };

    // Handle adding organizational title to user
    const handleAddOrganizationalTitleToUser = async () => {
        if (!selectedOrganizationIdForRole || !organizationalTitleToAdd.trim()) {
            alert('Please select an organization and enter a title');
            return;
        }

        setAddingOrganizationalTitle(true);
        try {
            // Add the title to the user's roles array
            const newTitle = {
                organization_id: parseInt(selectedOrganizationIdForRole),
                title_type: organizationalTitleToAdd.trim()
            };

            setNewUserData({
                ...newUserData,
                roles: [...newUserData.roles, newTitle]
            });

            // Reset the form fields
            setSelectedOrganizationIdForRole('');
            setOrganizationalTitleToAdd('');

        } catch (error) {
            console.error('Failed to add organizational title:', error);
            alert(`Failed to add organizational title: ${error.message}`);
        } finally {
            setAddingOrganizationalTitle(false);
        }
    };

    // Handle removing organizational title from user
    const handleRemoveOrganizationalTitleFromUser = (organizationId, titleType) => {
        const updatedRoles = newUserData.roles.filter(
            role => !(role.organization_id === organizationId && role.title_type === titleType)
        );
        setNewUserData({
            ...newUserData,
            roles: updatedRoles
        });
    };

    // Get organization titles for user
    const getUserOrganizationTitles = (organizationId) => {
        return newUserData.roles.filter(role => role.organization_id === organizationId);
    };

    // Get organization name by ID
    const getOrganizationNameById = (orgId) => {
        const organization = organizations.find(org => org.id === orgId);
        return organization ? organization.name : 'Unknown Organization';
    };

    // Handle opening add related organization dialog
    const handleOpenAddRelatedOrgDialog = (type) => {
        setRelationshipType(type);

        // Set default organization type based on available types
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
        handleCloseSubDialogs();

        // Reset related org data
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
            // Validate required fields
            if (!newRelatedOrgData.name) {
                alert('Please enter an organization name');
                return;
            }

            // Find the organization type ID
            const orgType = organizationTypes.find(ot => ot.type === newRelatedOrgData.type);

            // Prepare organization data for API
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

            const response = await addOrganization(orgData);

            // Reload organizations to get the new organization
            await loadOrganizations();

            // Set the new organization name in the appropriate field based on relationship type
            if (relationshipType === 'denomination') {
                setFormData(prev => ({ ...prev, denomination_affiliation: newRelatedOrgData.name }));
            } else if (relationshipType === 'accreditation') {
                setFormData(prev => ({ ...prev, accreditation_status_or_body: newRelatedOrgData.name }));
            } else if (relationshipType === 'affiliation') {
                setFormData(prev => ({ ...prev, affiliation_validation: newRelatedOrgData.name }));
            } else if (relationshipType === 'umbrella') {
                setFormData(prev => ({ ...prev, umbrella_association_membership: newRelatedOrgData.name }));
            }

            // Close the dialog
            handleCloseAddRelatedOrgDialog();

        } catch (error) {
            console.error('Failed to add new related organization:', error);
            alert(`Failed to add new organization: ${error.message}`);
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

    // Handle closing only the add user dialog
    const handleCloseAddUserDialog = () => {
        handleCloseSubDialogs();
    };

    // Handle adding new user (enhanced version)
    const handleAddNewUser = async () => {
        try {
            // Validate required fields
            if (!newUserData.username || !newUserData.email || !newUserData.firstname || !newUserData.lastname) {
                alert('Please fill in all required fields (username, email, first name, last name)');
                return;
            }

            // Prepare user data for API
            const userData = {
                username: newUserData.username,
                email: newUserData.email,
                password: newUserData.password || 'defaultpass123', // Auto-generate if empty
                role: newUserData.ui_role,
                firstname: newUserData.firstname,
                lastname: newUserData.lastname,
                phone: newUserData.phone,
                organization_id: newUserData.organization_id || null
            };

            // Add geo_location if provided
            const hasValidGeoData = (geoData) => {
                return Object.values(geoData).some(value => value && value.trim() !== '');
            };

            if (hasValidGeoData(newUserData.geo_location)) {
                userData.geo_location = newUserData.geo_location;
            }

            // Add organizational titles if user role is 'other'
            if (newUserData.ui_role === 'other' && newUserData.roles.length > 0) {
                userData.roles = newUserData.roles;
            }

            const response = await addUser(userData);
            console.log('User created with response:', response);

            // Reload users to get the new user
            const updatedUsers = await fetchUsers();
            setUsers(updatedUsers || []);

            // Find the newly created user, prioritizing response data
            const newUser = updatedUsers.find(user => user.email === newUserData.email) ||
            {
                id: response.id,
                username: response.username || newUserData.username,
                email: response.email || newUserData.email,
                firstname: response.firstname || newUserData.firstname,
                lastname: response.lastname || newUserData.lastname,
                password: response.password || newUserData.password || 'defaultpass123',
                ...newUserData
            };

            // Set the new user as the selected contact based on type
            if (contactType === 'primary') {
                setFormData(prev => ({ ...prev, primary_contact_id: newUser.id }));
            } else if (contactType === 'secondary') {
                setFormData(prev => ({ ...prev, secondary_contact_id: newUser.id }));
            } else if (contactType === 'head') {
                setFormData(prev => ({ ...prev, head_id: newUser.id }));
            }

            // Close the dialog
            setOpenAddUserDialog(false);
            setContactType('');

        } catch (error) {
            console.error('Failed to add new user:', error);
            alert(`Failed to add new user: ${error.message}`);
        }
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

    // Open add organization dialog
    const handleOpenAddDialog = () => {
        setFormData({
            name: '',
            type: 'Churches',
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
            denomination_affiliation: '',
            accreditation_status_or_body: '',
            highest_level_of_education: '',
            affiliation_validation: '',
            umbrella_association_membership: '',
            denomination_id: '',
            accreditation_body_id: '',
            umbrella_association_id: '',
            primary_contact_id: '',
            secondary_contact_id: '',
            head_id: '',
            head_name: '',
            head_email: '',
            head_phone: '',
            head_address: '',
            details: {},
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
        setOpenAddDialog(true);
    };

    // Open edit organization dialog
    const handleOpenEditDialog = (organization) => {
        setSelectedOrganization(organization);

        // Prepare form data based on organization type
        const details = {};

        setFormData({
            name: organization.name,
            type: organization.organization_type?.type || 'Churches',
            continent: organization.geo_location?.continent || '',
            region: organization.geo_location?.region || '',
            country: organization.geo_location?.country || '',
            province: organization.geo_location?.province || '',
            city: organization.geo_location?.city || '',
            town: organization.geo_location?.town || '',
            address_line1: organization.geo_location?.address_line1 || '',
            address_line2: organization.geo_location?.address_line2 || '',
            postal_code: organization.geo_location?.postal_code || '',
            website: organization.website || '',
            denomination_affiliation: organization.denomination_affiliation || '',
            accreditation_status_or_body: organization.accreditation_status_or_body || '',
            highest_level_of_education: organization.highest_level_of_education || '',
            affiliation_validation: organization.affiliation_validation || '',
            umbrella_association_membership: organization.umbrella_association_membership || '',
            denomination_id: organization.denomination_id || '',
            accreditation_body_id: organization.accreditation_body_id || '',
            umbrella_association_id: organization.umbrella_association_id || '',
            primary_contact_id: organization.primary_contact_id || '',
            secondary_contact_id: organization.secondary_contact_id || '',
            head_id: organization.head_id || organization.lead?.id || '',
            head_name: organization.lead?.firstname + ' ' + organization.lead?.lastname || '',
            head_email: organization.lead?.email || '',
            head_phone: organization.lead?.phone || '',
            head_address: organization.lead?.address || '',
            details: organization.misc || {},
            geo_location: organization.geo_location || {
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

        setOpenEditDialog(true);
    };

    // Open delete organization dialog
    const handleOpenDeleteDialog = (organization) => {
        setSelectedOrganization(organization);
        setOpenDeleteDialog(true);
    };

    // Open upload file dialog
    const handleOpenUploadDialog = () => {
        setSelectedFile(null);
        setUploadStatus('');
        setOpenUploadDialog(true);
    };

    // Close all dialogs
    // Close dialogs without resetting form data (for sub-dialogs)
    const handleCloseSubDialogs = () => {
        setOpenAddUserDialog(false);
        setOpenAddRelatedOrgDialog(false);
        setContactType('');
        setRelationshipType('');

        // Reset only sub-dialog related data
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

        // Reset additional user form states
        setNewRoleName('');
        setRoleSearchText('');
        setIsAddingNewRole(false);
        setSelectedOrganizationIdForRole('');
        setSelectedRoleType('');
        setOrganizationalTitleToAdd('');
    };

    // Close dialogs only (without resetting form data) - used for dialog onClose events
    const handleCloseDialogOnly = () => {
        setOpenAddDialog(false);
        setOpenEditDialog(false);
        setOpenDeleteDialog(false);
        setSelectedOrganization(null);
        setActiveTab(0); // Reset to first tab
    };

    // Close main dialogs and reset form data (for explicit cancellation or success)
    const handleCloseDialogs = () => {
        setOpenAddDialog(false);
        setOpenEditDialog(false);
        setOpenDeleteDialog(false);
        setOpenUploadDialog(false);
        setSelectedOrganization(null);
        setActiveTab(0); // Reset to first tab

        // Call onClose callback when in embedded mode
        if (showAddDialogOnly && onClose) {
            onClose();
        }

        // Reset main form data only when explicitly closing dialogs
        setFormData({
            name: '',
            type: 'Churches',
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
            denomination_affiliation: '',
            accreditation_status_or_body: '',
            highest_level_of_education: '',
            affiliation_validation: '',
            umbrella_association_membership: '',
            denomination_id: '',
            accreditation_body_id: '',
            umbrella_association_id: '',
            primary_contact_id: '',
            secondary_contact_id: '',
            head_id: '',
            head_name: '',
            head_email: '',
            head_phone: '',
            head_address: '',
            details: {},
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

        // Also close sub-dialogs and reset their data
        handleCloseSubDialogs();
    };

    // Close upload dialog only
    const handleCloseUploadDialog = () => {
        setOpenUploadDialog(false);
        setSelectedFile(null);
        setUploadStatus('');
    };

    // Transform form data to API format
    const transformFormDataToApiFormat = (formData) => {
        // Find the organization type ID
        const orgType = organizationTypes.find(ot => ot.type === formData.type);

        // Helper function to check if geo_location has any meaningful data
        const hasValidGeoData = (geoData) => {
            return geoData && Object.values(geoData).some(value => value && value.trim() !== '');
        };

        // Helper function to ensure numeric values for coordinates
        const getNumericCoordinate = (value) => {
            if (!value || value.trim() === '') return 0;
            const num = parseFloat(value);
            return isNaN(num) ? 0 : num;
        };

        const apiData = {
            name: formData.name,
            type_id: orgType?.id || null,
            geo_location: hasValidGeoData(formData.geo_location) ? {
                continent: formData.geo_location.continent || formData.continent || '',
                region: formData.geo_location.region || formData.region || '',
                country: formData.geo_location.country || formData.country || '',
                province: formData.geo_location.province || formData.province || '',
                city: formData.geo_location.city || formData.city || '',
                town: formData.geo_location.town || formData.town || '',
                address_line1: formData.geo_location.address_line1 || formData.address_line1 || '',
                address_line2: formData.geo_location.address_line2 || formData.address_line2 || '',
                postal_code: formData.geo_location.postal_code || formData.postal_code || '',
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

        // Add contact information if provided
        if (formData.primary_contact_id) {
            const primaryContact = users.find(user => user.id === formData.primary_contact_id);
            if (primaryContact) {
                apiData.primary_contact = {
                    username: primaryContact.username,
                    email: primaryContact.email,
                    password: 'defaultpass123',  // Default password for existing users
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
                    password: 'defaultpass123',  // Default password for existing users
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
                    password: 'defaultpass123',  // Default password for existing users
                    firstname: headContact.firstname,
                    lastname: headContact.lastname,
                    phone: headContact.phone
                };
            }
        }

        return apiData;
    };

    // Add a new organization
    const handleAddOrganization = async () => {
        try {
            const apiData = transformFormDataToApiFormat(formData);
            const result = await addOrganization(apiData);

            // Show success message with template version information
            if (result.default_template_version_id) {
                alert(`Organization added successfully! A default survey template version has been created and is available in the Inventory page.`);
            } else {
                alert('Organization added successfully!');
            }

            loadOrganizations();

            // Call onOrganizationAdded callback if provided (for embedded mode)
            if (onOrganizationAdded) {
                onOrganizationAdded(result);
            }

            handleCloseDialogs();
        } catch (error) {
            console.error('Failed to add organization:', error);
            alert(`Failed to add organization: ${error.message}`);
        }
    };

    // Update an existing organization
    const handleUpdateOrganization = async () => {
        if (!selectedOrganization) return;

        try {
            const apiData = transformFormDataToApiFormat(formData);
            await updateOrganization(selectedOrganization.id, apiData);
            loadOrganizations();
            handleCloseDialogs();
        } catch (error) {
            console.error('Failed to update organization:', error);
            alert(`Failed to update organization: ${error.message}`);
        }
    };

    // Delete an organization
    const handleDeleteOrganization = async () => {
        if (!selectedOrganization) return;

        try {
            const response = await deleteOrganization(selectedOrganization.id);

            // Show detailed success message with what was deleted
            if (response.deleted_counts) {
                const counts = response.deleted_counts;
                let message = `Organization "${response.organization_name}" deleted successfully!\n\n`;
                message += `Deleted items:\n`;
                message += `• ${counts.template_versions} Survey Template Versions\n`;
                message += `• ${counts.survey_templates} Survey Templates\n`;
                message += `• ${counts.survey_responses} Survey Responses\n`;
                message += `• ${counts.user_details} User Details Records\n`;
                message += `• ${counts.user_organization_roles} User Role Assignments\n`;
                message += `• ${counts.geo_locations} Geographic Locations\n`;

                if (counts.geo_location_references_cleared > 0) {
                    message += `• Cleared ${counts.geo_location_references_cleared} geographic location references\n`;
                }

                if (counts.organization_references > 0) {
                    message += `• Updated ${counts.organization_references} child organization references\n`;
                }

                message += `\n⚠️ This action cannot be undone.`;
                alert(message);
            } else {
                alert(`Organization "${selectedOrganization.name}" deleted successfully!`);
            }

            loadOrganizations();
            handleCloseDialogs();
        } catch (error) {
            console.error('Failed to delete organization:', error);
            alert(`Failed to delete organization: ${error.message}`);
        }
    };

    // Bulk delete organizations
    const handleBulkDeleteOrganizations = async () => {
        const idsToDelete = bulkDeleteTarget === 'main' ? selectedMainOrgIds : selectedOtherOrgIds;
        setBulkDeleteLoading(true);
        let successCount = 0;
        let failCount = 0;
        for (const orgId of idsToDelete) {
            try {
                await deleteOrganization(orgId);
                successCount++;
            } catch (err) {
                failCount++;
                console.error(`Failed to delete organization ${orgId}:`, err);
            }
        }
        setBulkDeleteLoading(false);
        setOpenBulkDeleteDialog(false);
        if (bulkDeleteTarget === 'main') {
            setSelectedMainOrgIds([]);
        } else {
            setSelectedOtherOrgIds([]);
        }
        loadOrganizations();
        setOrgSnackbar({
            open: true,
            message: failCount > 0
                ? `Deleted ${successCount} organization(s). ${failCount} failed.`
                : `Successfully deleted ${successCount} organization(s).`,
            severity: failCount > 0 ? 'warning' : 'success'
        });
    };

    // Handle pagination change
    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };

    // Handle rows per page change
    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    // Handle organization type filter change
    const handleOrgTypeFilterChange = (event) => {
        setOrgTypeFilter(event.target.value);
        setPage(0);
    };

    // Handle tab change
    const handleTabChange = (event, newValue) => {
        // Save current form data before changing tabs
        const updatedFormData = { ...formData };
        setFormData(updatedFormData);
        setActiveTab(newValue);
    };

    // Get denomination name by ID
    const getDenominationName = (id) => {
        const denomination = denominations.find(d => d.id === id);
        return denomination ? denomination.name : 'N/A';
    };

    // Get accreditation body name by ID
    const getAccreditationBodyName = (id) => {
        const body = accreditationBodies.find(b => b.id === id);
        return body ? body.name : 'N/A';
    };

    // Get umbrella association name by ID
    const getUmbrellaAssociationName = (id) => {
        const association = umbrellaAssociations.find(a => a.id === id);
        return association ? association.name : 'N/A';
    };

    // Filter and sort organizations
    const getFilteredAndSortedOrganizations = () => {
        let filtered = [...organizations];

        // Apply search filter
        if (searchTerm) {
            const search = searchTerm.toLowerCase();
            filtered = filtered.filter(org =>
                org.name?.toLowerCase().includes(search) ||
                org.organization_type?.type?.toLowerCase().includes(search) ||
                org.geo_location?.city?.toLowerCase().includes(search) ||
                org.geo_location?.province?.toLowerCase().includes(search) ||
                org.geo_location?.country?.toLowerCase().includes(search) ||
                org.website?.toLowerCase().includes(search)
            );
        }

        // Apply type filter (existing orgTypeFilter)
        if (orgTypeFilter && orgTypeFilter !== 'all') {
            filtered = filtered.filter(org => org.organization_type?.type === orgTypeFilter);
        }

        // Apply new type filter
        if (filterType) {
            filtered = filtered.filter(org => org.organization_type?.type === filterType);
        }

        // Apply location filter
        if (filterLocation) {
            const location = filterLocation.toLowerCase();
            filtered = filtered.filter(org =>
                org.geo_location?.city?.toLowerCase().includes(location) ||
                org.geo_location?.province?.toLowerCase().includes(location) ||
                org.geo_location?.country?.toLowerCase().includes(location) ||
                org.geo_location?.region?.toLowerCase().includes(location)
            );
        }

        // Apply sorting
        filtered.sort((a, b) => {
            let aValue = '';
            let bValue = '';

            if (sortBy === 'name') {
                aValue = a.name || '';
                bValue = b.name || '';
            } else if (sortBy === 'type') {
                aValue = a.organization_type?.type || '';
                bValue = b.organization_type?.type || '';
            } else if (sortBy === 'location') {
                aValue = [a.geo_location?.city, a.geo_location?.province, a.geo_location?.country].filter(Boolean).join(', ');
                bValue = [b.geo_location?.city, b.geo_location?.province, b.geo_location?.country].filter(Boolean).join(', ');
            }

            // Convert to lowercase for string comparison
            if (typeof aValue === 'string') aValue = aValue.toLowerCase();
            if (typeof bValue === 'string') bValue = bValue.toLowerCase();

            if (sortOrder === 'asc') {
                return aValue > bValue ? 1 : -1;
            } else {
                return aValue < bValue ? 1 : -1;
            }
        });

        return filtered;
    };

    const filteredOrganizations = getFilteredAndSortedOrganizations();

    // Split organizations into main types and other types
    const mainOrganizations = filteredOrganizations.filter(org =>
        mainOrganizationTypes.includes(org.organization_type?.type)
    );
    const otherOrganizations = filteredOrganizations.filter(org =>
        !mainOrganizationTypes.includes(org.organization_type?.type)
    );

    // Handle sort
    const handleSort = (column) => {
        if (sortBy === column) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortBy(column);
            setSortOrder('asc');
        }
    };

    // Handle pagination for other organizations table
    const handleChangeOtherPage = (event, newPage) => {
        setOtherPage(newPage);
    };

    const handleChangeOtherRowsPerPage = (event) => {
        setOtherRowsPerPage(parseInt(event.target.value, 10));
        setOtherPage(0);
    };

    // Shared column definitions for organization tables
    const orgTableColumns = useMemo(() => [
        { id: 'name', label: 'Name', sortable: true },
        {
            id: 'type',
            label: 'Type',
            sortable: true,
            sortKey: 'type',
            render: (org) => (
                <Chip
                    label={org.organization_type?.type === 'church' ? 'Church' :
                        org.organization_type?.type === 'Institution' ? 'Institution' :
                            org.organization_type?.type === 'Non_formal_organizations' ? 'Non-formal Org' :
                                org.organization_type?.type === 'other' ? 'Other' :
                                    org.organization_type?.type || 'N/A'}
                    color={
                        org.organization_type?.type === 'church' ? 'primary' :
                            org.organization_type?.type === 'Institution' ? 'secondary' :
                                org.organization_type?.type === 'Non_formal_organizations' ? 'success' : 'default'
                    }
                    size="small"
                />
            )
        },
        {
            id: 'location',
            label: 'Location',
            sortable: true,
            render: (org) => (
                [org.geo_location?.city, org.geo_location?.province, org.geo_location?.region, org.geo_location?.continent]
                    .filter(Boolean).join(', ')
            )
        },
        {
            id: 'affiliations',
            label: 'Affiliations',
            render: (org) => (
                <Box>
                    {org.denomination_affiliation && (
                        <Typography variant="body2"><strong>Denomination:</strong> {org.denomination_affiliation}</Typography>
                    )}
                    {org.affiliation_validation && (
                        <Typography variant="body2"><strong>Affiliation:</strong> {org.affiliation_validation}</Typography>
                    )}
                    {org.accreditation_status_or_body && (
                        <Typography variant="body2"><strong>Accreditation:</strong> {org.accreditation_status_or_body}</Typography>
                    )}
                    {org.umbrella_association_membership && (
                        <Typography variant="body2"><strong>Umbrella Assoc.:</strong> {org.umbrella_association_membership}</Typography>
                    )}
                    {!org.denomination_affiliation && !org.affiliation_validation &&
                        !org.accreditation_status_or_body && !org.umbrella_association_membership && 'N/A'}
                </Box>
            )
        },
        {
            id: 'actions',
            label: 'Actions',
            render: (org) => (
                <>
                    <Tooltip title="View Analytics" arrow>
                        <IconButton
                            onClick={() => handleOpenSpiderChart(org)}
                            sx={{
                                color: '#633394',
                                '&:hover': { backgroundColor: 'rgba(99, 51, 148, 0.1)', transform: 'scale(1.1)' },
                                transition: 'all 0.2s ease'
                            }}
                        >
                            <RadarIcon />
                        </IconButton>
                    </Tooltip>
                    <IconButton onClick={() => handleOpenEditDialog(org)} color="primary">
                        <EditIcon />
                    </IconButton>
                    <IconButton onClick={() => handleOpenDeleteDialog(org)} color="error">
                        <DeleteIcon />
                    </IconButton>
                </>
            )
        }
    ], []);

    // Sort value getter for organization tables
    const orgSortValueGetter = useMemo(() => (row, orderBy) => {
        if (orderBy === 'type') return row.organization_type?.type || '';
        if (orderBy === 'location') {
            return [row.geo_location?.city, row.geo_location?.province, row.geo_location?.region, row.geo_location?.continent]
                .filter(Boolean).join(', ');
        }
        return row[orderBy];
    }, []);

    const orgRowSx = useMemo(() => (org) => ({
        '&:nth-of-type(odd)': { backgroundColor: theme.palette.action.hover },
        transition: 'all 0.2s ease-in-out',
        '&:hover': {
            backgroundColor: 'rgba(99, 51, 148, 0.2) !important',
            boxShadow: '0 2px 8px rgba(99, 51, 148, 0.15)',
            transform: 'translateX(2px)',
        }
    }), [theme]);

    const paginationCompactSx = {
        '.MuiTablePagination-selectLabel, .MuiTablePagination-displayedRows': { margin: 0 }
    };

    // Render main organizations table (Churches, Institutions, Non-formal Orgs)
    const renderMainOrganizationsTable = () => {
        return (
            <Box sx={{ mb: 4 }}>
                <Typography variant="h6" sx={{ mb: 2, color: '#633394', fontWeight: 'bold' }}>
                    Main Organizations ({mainOrganizations.length})
                </Typography>
                {selectedMainOrgIds.length > 0 && (
                    <Box sx={{
                        mb: 2, p: 1.5, display: 'flex', alignItems: 'center', gap: 2,
                        backgroundColor: '#f3e5f5', borderRadius: 2, border: '1px solid rgba(99, 51, 148, 0.25)'
                    }}>
                        <Chip label={`${selectedMainOrgIds.length} selected`} color="primary" sx={{ backgroundColor: '#633394' }} />
                        <Button
                            variant="contained"
                            size="small"
                            startIcon={<DeleteIcon />}
                            onClick={() => { setBulkDeleteTarget('main'); setOpenBulkDeleteDialog(true); }}
                            color="error"
                        >
                            Delete ({selectedMainOrgIds.length})
                        </Button>
                        <Button variant="outlined" size="small" onClick={() => setSelectedMainOrgIds([])}
                            sx={{ ml: 'auto', borderColor: '#967CB2', color: '#967CB2' }}>
                            Clear Selection
                        </Button>
                    </Box>
                )}
                <DataTable
                    columns={orgTableColumns}
                    data={mainOrganizations}
                    selectable
                    selectedIds={selectedMainOrgIds}
                    onSelectionChange={setSelectedMainOrgIds}
                    pagination
                    rowsPerPageOptions={[5, 10, 25]}
                    defaultRowsPerPage={10}
                    defaultSortColumn="name"
                    defaultSortDirection="asc"
                    sortIndicator="arrow"
                    sortValueGetter={orgSortValueGetter}
                    rowSx={orgRowSx}
                    emptyMessage="No main organizations found"
                    paperSx={{ boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)', backgroundColor: '#f5f5f5' }}
                    paginationSx={paginationCompactSx}
                />
            </Box>
        );
    };

    // Render other organizations table (Denominations, Accrediting Bodies, etc.)
    const renderOtherOrganizationsTable = () => {
        if (otherOrganizations.length === 0) {
            return null;
        }

        return (
            <Box sx={{ mb: 4 }}>
                <Typography variant="h6" sx={{ mb: 2, color: '#967CB2', fontWeight: 'bold' }}>
                    Related Organizations ({otherOrganizations.length})
                </Typography>
                <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
                    Denominations, Accrediting Bodies, Affiliations, Umbrella Associations, and other organization types
                </Typography>
                {selectedOtherOrgIds.length > 0 && (
                    <Box sx={{
                        mb: 2, p: 1.5, display: 'flex', alignItems: 'center', gap: 2,
                        backgroundColor: '#f3e5f5', borderRadius: 2, border: '1px solid rgba(99, 51, 148, 0.25)'
                    }}>
                        <Chip label={`${selectedOtherOrgIds.length} selected`} color="primary" sx={{ backgroundColor: '#967CB2' }} />
                        <Button
                            variant="contained"
                            size="small"
                            startIcon={<DeleteIcon />}
                            onClick={() => { setBulkDeleteTarget('other'); setOpenBulkDeleteDialog(true); }}
                            color="error"
                        >
                            Delete ({selectedOtherOrgIds.length})
                        </Button>
                        <Button variant="outlined" size="small" onClick={() => setSelectedOtherOrgIds([])}
                            sx={{ ml: 'auto', borderColor: '#967CB2', color: '#967CB2' }}>
                            Clear Selection
                        </Button>
                    </Box>
                )}
                <DataTable
                    columns={orgTableColumns}
                    data={otherOrganizations}
                    selectable
                    selectedIds={selectedOtherOrgIds}
                    onSelectionChange={setSelectedOtherOrgIds}
                    pagination
                    rowsPerPageOptions={[5, 10, 25]}
                    defaultRowsPerPage={10}
                    defaultSortColumn="name"
                    defaultSortDirection="asc"
                    sortIndicator="arrow"
                    sortValueGetter={orgSortValueGetter}
                    rowSx={orgRowSx}
                    emptyMessage="No related organizations found"
                    paperSx={{ boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)', backgroundColor: '#fafafa' }}
                    paginationSx={paginationCompactSx}
                />
            </Box>
        );
    };


    // Render organization form
    const renderOrganizationForm = () => {
        return (
            <Box>
                <Tabs
                    value={activeTab}
                    onChange={handleTabChange}
                    sx={{ mb: 2 }}
                    textColor="primary"
                    indicatorColor="primary"
                >
                    <Tab label="Basic Information & Address" />
                    <Tab label="Contacts & Relationships" />
                    <Tab label="Miscellaneous" />
                </Tabs>

                {activeTab === 0 && (
                    <Box>
                        {/* Basic Information Section */}
                        <Paper sx={{ p: 2, backgroundColor: '#f5f5f5', boxShadow: '0 4px 8px rgba(0,0,0,0.1)', mb: 3, width: '96.5%' }}>
                            <Typography variant="h6" gutterBottom sx={{ color: '#633394', fontWeight: 'bold', mb: 2, textAlign: 'center' }}>
                                Basic Information
                            </Typography>

                            <Box sx={{ display: 'flex', gap: 2 }}>
                                {/* Column 1 */}
                                <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
                                    <TextField
                                        required
                                        fullWidth
                                        label={formData.type === 'Churches' ? 'Name of Church' :
                                            formData.type === 'Institutions' ? 'Name of Institution' :
                                                'Name of Organization'}
                                        name="name"
                                        value={formData.name}
                                        onChange={handleInputChange}
                                        variant="outlined"
                                    />

                                    <TextField
                                        fullWidth
                                        label="Website"
                                        name="website"
                                        value={formData.website}
                                        onChange={handleInputChange}
                                        variant="outlined"
                                    />
                                </Box>

                                {/* Column 2 */}
                                <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
                                    <FormControl fullWidth variant="outlined">
                                        <InputLabel>Type</InputLabel>
                                        <Select
                                            name="type"
                                            value={formData.type}
                                            onChange={handleInputChange}
                                            label="Type"
                                        >
                                            {organizationTypes.map((orgType) => {
                                                const isMainType = ['church', 'non_formal_organizations', 'institution'].includes(orgType.type.toLowerCase());
                                                return (
                                                    <MenuItem
                                                        key={orgType.id}
                                                        value={orgType.type}
                                                        sx={{
                                                            backgroundColor: isMainType ? '#f0e6ff' : 'inherit',
                                                            fontWeight: isMainType ? 'bold' : 'normal',
                                                            display: isMainType ? 'block' : 'none' // Only show main types in Basic Information
                                                        }}
                                                    >
                                                        {orgType.type === 'church' ? 'Church' :
                                                            orgType.type === 'non_formal_organizations' ? 'Non-formal Organization' :
                                                                orgType.type === 'institution' ? 'Institution' :
                                                                    orgType.type.charAt(0).toUpperCase() + orgType.type.slice(1)}
                                                    </MenuItem>
                                                );
                                            })}
                                        </Select>
                                    </FormControl>

                                    {formData.type === 'Institutions' && (
                                        <TextField
                                            fullWidth
                                            label="Highest Level of Education"
                                            name="highest_level_of_education"
                                            value={formData.highest_level_of_education}
                                            onChange={handleInputChange}
                                            variant="outlined"
                                        />
                                    )}
                                </Box>
                            </Box>
                        </Paper>

                        {/* Address Information Section */}
                        <Paper sx={{ p: 2, backgroundColor: '#f5f5f5', boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)', mb: 3 }}>
                            <Typography variant="h6" gutterBottom sx={{ color: '#633394', fontWeight: 'bold', mb: 2, textAlign: 'center' }}>
                                Address Information
                            </Typography>

                            <Box sx={{ maxWidth: '900px', mx: 'auto' }}>
                                {/* Enhanced Address Input */}
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

                {activeTab === 1 && (
                    <Box>
                        {/* Contacts Section */}
                        <Paper sx={{ p: 2, backgroundColor: '#f5f5f5', boxShadow: '0 4px 8px rgba(0,0,0,0.1)', mb: 3, width: '96.5%' }}>
                            <Typography variant="h6" gutterBottom sx={{ color: '#633394', fontWeight: 'bold', mb: 3, textAlign: 'center' }}>
                                Contact Information
                            </Typography>

                            <Grid container spacing={3}>
                                <Grid item xs={12} md={6}>
                                    <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 1 }}>
                                        <Autocomplete
                                            fullWidth
                                            options={users}
                                            getOptionLabel={(option) => `${option.firstname || ''} ${option.lastname || ''} (${option.email})`.trim()}
                                            value={users.find(user => user.id === formData.primary_contact_id) || null}
                                            onChange={(event, newValue) => handleContactChange('primary', newValue)}
                                            renderInput={(params) => (
                                                <TextField
                                                    {...params}
                                                    label={`${formData.type === 'Churches' ? 'Church' : formData.type === 'Institutions' ? 'Institution' : 'Organization'} Primary Contact`}
                                                    variant="outlined"
                                                    helperText="Search and select existing user"
                                                />
                                            )}
                                            renderOption={(props, option) => {
                                                const { key, ...otherProps } = props;
                                                return (
                                                    <li key={key} {...otherProps}>
                                                        <Box>
                                                            <Typography variant="body2">
                                                                {`${option.firstname || ''} ${option.lastname || ''}`.trim() || 'No Name'}
                                                            </Typography>
                                                            <Typography variant="caption" color="text.secondary">
                                                                {option.email} • {option.role}
                                                            </Typography>
                                                        </Box>
                                                    </li>
                                                );
                                            }}
                                            isOptionEqualToValue={(option, value) => option.id === value.id}
                                        />
                                        <Tooltip title="Add New User">
                                            <IconButton
                                                color="primary"
                                                onClick={() => handleOpenAddUserDialog('primary')}
                                                sx={{ mb: 2.5 }}
                                            >
                                                <AddIcon />
                                            </IconButton>
                                        </Tooltip>
                                    </Box>
                                </Grid>

                                <Grid item xs={12} md={6}>
                                    <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 1 }}>
                                        <Autocomplete
                                            fullWidth
                                            options={users}
                                            getOptionLabel={(option) => `${option.firstname || ''} ${option.lastname || ''} (${option.email})`.trim()}
                                            value={users.find(user => user.id === formData.secondary_contact_id) || null}
                                            onChange={(event, newValue) => handleContactChange('secondary', newValue)}
                                            renderInput={(params) => (
                                                <TextField
                                                    {...params}
                                                    label={`${formData.type === 'Churches' ? 'Church' : formData.type === 'Institutions' ? 'Institution' : 'Organization'} Secondary Contact`}
                                                    variant="outlined"
                                                    helperText="Search and select existing user"
                                                />
                                            )}
                                            renderOption={(props, option) => {
                                                const { key, ...otherProps } = props;
                                                return (
                                                    <li key={key} {...otherProps}>
                                                        <Box>
                                                            <Typography variant="body2">
                                                                {`${option.firstname || ''} ${option.lastname || ''}`.trim() || 'No Name'}
                                                            </Typography>
                                                            <Typography variant="caption" color="text.secondary">
                                                                {option.email} • {option.role}
                                                            </Typography>
                                                        </Box>
                                                    </li>
                                                );
                                            }}
                                            isOptionEqualToValue={(option, value) => option.id === value.id}
                                        />
                                        <Tooltip title="Add New User">
                                            <IconButton
                                                color="primary"
                                                onClick={() => handleOpenAddUserDialog('secondary')}
                                                sx={{ mb: 2.5 }}
                                            >
                                                <AddIcon />
                                            </IconButton>
                                        </Tooltip>
                                    </Box>
                                </Grid>
                            </Grid>
                        </Paper>

                        {/* Leadership Section */}
                        <Paper sx={{ p: 2, backgroundColor: '#f5f5f5', boxShadow: '0 4px 8px rgba(0,0,0,0.1)', mb: 3 }}>
                            <Typography variant="h6" gutterBottom sx={{ color: '#633394', fontWeight: 'bold', mb: 3, textAlign: 'center' }}>
                                {formData.type === 'Churches' ? 'Senior/Lead Pastor Information' :
                                    formData.type === 'Institutions' ? 'School President Information' :
                                        'Organization Leadership Information'}
                            </Typography>

                            <Grid container spacing={3}>
                                {/* Head/Lead User Selection */}
                                <Grid item xs={12}>
                                    <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 1 }}>
                                        <Autocomplete
                                            fullWidth
                                            options={users}
                                            getOptionLabel={(option) => `${option.firstname || ''} ${option.lastname || ''} (${option.email})`.trim()}
                                            value={users.find(user => user.id === formData.head_id) || null}
                                            onChange={(event, newValue) => handleContactChange('head', newValue)}
                                            renderInput={(params) => (
                                                <TextField
                                                    {...params}
                                                    label={formData.type === 'Churches' ? 'Senior/Lead Pastor' :
                                                        formData.type === 'Institutions' ? 'School President' :
                                                            'Organization Head/Lead'}
                                                    variant="outlined"
                                                    helperText="Search and select existing user or add new"
                                                />
                                            )}
                                            renderOption={(props, option) => {
                                                const { key, ...otherProps } = props;
                                                return (
                                                    <li key={key} {...otherProps}>
                                                        <Box>
                                                            <Typography variant="body2">
                                                                {`${option.firstname || ''} ${option.lastname || ''}`.trim() || 'No Name'}
                                                            </Typography>
                                                            <Typography variant="caption" color="text.secondary">
                                                                {option.email} • {option.role}
                                                            </Typography>
                                                        </Box>
                                                    </li>
                                                );
                                            }}
                                            isOptionEqualToValue={(option, value) => option.id === value.id}
                                        />
                                        <Tooltip title="Add New User">
                                            <IconButton
                                                color="primary"
                                                onClick={() => handleOpenAddUserDialog('head')}
                                                sx={{ mb: 2.5 }}
                                            >
                                                <AddIcon />
                                            </IconButton>
                                        </Tooltip>
                                    </Box>
                                </Grid>

                                {/* Legacy fields for manual entry (optional) */}
                                <Grid item xs={12} md={6}>
                                    <TextField
                                        fullWidth
                                        label={formData.type === 'Churches' ? 'Senior/Lead Pastor Name (Manual)' :
                                            formData.type === 'Institutions' ? 'School President Name (Manual)' :
                                                'Organization Lead Name (Manual)'}
                                        name="head_name"
                                        value={formData.head_name}
                                        onChange={handleInputChange}
                                        variant="outlined"
                                        helperText="Use this only if not selecting from user list above"
                                    />
                                </Grid>

                                <Grid item xs={12} md={6}>
                                    <TextField
                                        fullWidth
                                        label={formData.type === 'Churches' ? "Pastor's Email Address (Manual)" :
                                            formData.type === 'Institutions' ? "President's Email Address (Manual)" :
                                                'Leadership Email Address (Manual)'}
                                        name="head_email"
                                        type="email"
                                        value={formData.head_email}
                                        onChange={handleInputChange}
                                        variant="outlined"
                                        helperText="Use this only if not selecting from user list above"
                                    />
                                </Grid>

                                <Grid item xs={12} md={6}>
                                    <TextField
                                        fullWidth
                                        label="Phone Contact (Manual)"
                                        name="head_phone"
                                        value={formData.head_phone}
                                        onChange={handleInputChange}
                                        variant="outlined"
                                        helperText="Use this only if not selecting from user list above"
                                    />
                                </Grid>

                                <Grid item xs={12} md={6}>
                                    <TextField
                                        fullWidth
                                        label={formData.type === 'Churches' ? 'Church Physical Address (Manual)' : 'Physical Address (Manual)'}
                                        name="head_address"
                                        value={formData.head_address}
                                        onChange={handleInputChange}
                                        variant="outlined"
                                        helperText="Use this only if not selecting from user list above"
                                    />
                                </Grid>

                                {/* Institution-specific field */}
                                {formData.type === 'Institutions' && (
                                    <Grid item xs={12} md={6}>
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

                        {/* Organizational Relationships Section */}
                        <Paper sx={{ p: 2, backgroundColor: '#f5f5f5', boxShadow: '0 4px 8px rgba(0,0,0,0.1)', mb: 3 }}>
                            <Typography variant="h6" gutterBottom sx={{ color: '#633394', fontWeight: 'bold', mb: 3, textAlign: 'center' }}>
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

                                {/* Accreditation Status/Body for Institutions */}
                                {formData.type === 'Institutions' && (
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
                                {formData.type === 'Non_formal_organizations' && (
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

                                {/* Umbrella Association for Churches */}
                                {formData.type === 'Churches' && (
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
                            </Grid>
                        </Paper>
                    </Box>
                )}

                {activeTab === 2 && (
                    <Box>
                        {/* Miscellaneous Section */}
                        <Paper sx={{ p: 2, backgroundColor: '#f5f5f5', boxShadow: '0 4px 8px rgba(0,0,0,0.1)', mb: 3, width: '96.5%' }}>
                            <Typography variant="h6" gutterBottom sx={{ color: '#633394', fontWeight: 'bold', mb: 2, textAlign: 'center' }}>
                                Additional Details
                            </Typography>

                            <Box sx={{ maxWidth: '900px', mx: 'auto' }}>
                                {/* Key-Value Pairs */}
                                {Object.entries(formData.details).map(([key, value], index) => (
                                    <Box key={index} sx={{ display: 'flex', gap: 2, mb: 2 }}>
                                        <TextField
                                            fullWidth
                                            label="Key"
                                            value={key}
                                            onChange={(e) => {
                                                const newDetails = { ...formData.details };
                                                const oldValue = newDetails[key];
                                                delete newDetails[key];
                                                newDetails[e.target.value] = oldValue;
                                                setFormData({ ...formData, details: newDetails });
                                            }}
                                            variant="outlined"
                                        />
                                        <TextField
                                            fullWidth
                                            label="Value"
                                            value={value}
                                            onChange={(e) => {
                                                const newDetails = { ...formData.details };
                                                newDetails[key] = e.target.value;
                                                setFormData({ ...formData, details: newDetails });
                                            }}
                                            variant="outlined"
                                        />
                                        <IconButton
                                            onClick={() => {
                                                const newDetails = { ...formData.details };
                                                delete newDetails[key];
                                                setFormData({ ...formData, details: newDetails });
                                            }}
                                            color="error"
                                        >
                                            <DeleteIcon />
                                        </IconButton>
                                    </Box>
                                ))}

                                {/* Add New Key-Value Pair Button */}
                                <Button
                                    variant="outlined"
                                    startIcon={<AddIcon />}
                                    onClick={() => {
                                        const newDetails = { ...formData.details };
                                        newDetails[`key${Object.keys(newDetails).length + 1}`] = '';
                                        setFormData({ ...formData, details: newDetails });
                                    }}
                                    sx={{
                                        color: '#633394',
                                        borderColor: '#633394',
                                        '&:hover': {
                                            borderColor: '#7c52a5',
                                            color: '#7c52a5'
                                        },
                                        mt: 2
                                    }}
                                >
                                    Add New Field
                                </Button>
                            </Box>
                        </Paper>
                    </Box>
                )}
            </Box>
        );
    };

    // If showAddDialogOnly mode, render only the Add Organization Dialog content
    if (showAddDialogOnly) {
        return (
            <Box sx={{ p: 2 }}>
                {renderOrganizationForm()}
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 3, pt: 2, borderTop: '1px solid #e0e0e0' }}>
                    <Button onClick={handleCloseDialogs} color="secondary" variant="outlined">
                        Cancel
                    </Button>
                    <Button
                        onClick={handleAddOrganization}
                        variant="contained"
                        sx={{ backgroundColor: '#633394', '&:hover': { backgroundColor: '#7c52a5' } }}
                    >
                        Add Organization
                    </Button>
                </Box>
            </Box>
        );
    }

    return (
        <Box>
            {/* Header with Title, Stats, and Action Buttons */}
            <Box sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                mb: 3,
                flexWrap: 'wrap',
                gap: 2
            }}>
                <Typography variant="h5" sx={{ color: '#212121', fontWeight: 'bold' }}>
                    Organizations ({filteredOrganizations.length})
                </Typography>

                {/* Stats and Buttons Container */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                    {/* Compact Stats Chips */}
                    <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
                        <Chip
                            label={`Total: ${organizations.length}`}
                            sx={{
                                backgroundColor: '#633394',
                                color: 'white',
                                fontWeight: 'bold',
                                fontSize: '0.85rem',
                                height: '36px',
                                '& .MuiChip-label': { px: 2 }
                            }}
                        />
                        <Chip
                            label={`Churches: ${organizations.filter(org => org.organization_type?.type === 'church').length}`}
                            variant="outlined"
                            sx={{
                                borderColor: '#633394',
                                color: '#633394',
                                fontWeight: 'bold',
                                fontSize: '0.85rem',
                                height: '36px',
                                '& .MuiChip-label': { px: 1.5 }
                            }}
                        />
                        <Chip
                            label={`Institutions: ${organizations.filter(org => org.organization_type?.type === 'Institution').length}`}
                            variant="outlined"
                            sx={{
                                borderColor: '#633394',
                                color: '#633394',
                                fontWeight: 'bold',
                                fontSize: '0.85rem',
                                height: '36px',
                                '& .MuiChip-label': { px: 1.5 }
                            }}
                        />
                        <Chip
                            label={`Non-formal: ${organizations.filter(org => org.organization_type?.type === 'Non_formal_organizations').length}`}
                            variant="outlined"
                            sx={{
                                borderColor: '#633394',
                                color: '#633394',
                                fontWeight: 'bold',
                                fontSize: '0.85rem',
                                height: '36px',
                                '& .MuiChip-label': { px: 1.5 }
                            }}
                        />
                    </Stack>

                    {/* Action Buttons */}
                    <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button
                            variant="contained"
                            startIcon={<AddIcon />}
                            onClick={handleOpenAddDialog}
                            sx={{
                                backgroundColor: '#633394',
                                '&:hover': { backgroundColor: '#7c52a5' },
                                height: '36px'
                            }}
                        >
                            Add Organization
                        </Button>
                        <Button
                            variant="outlined"
                            startIcon={<UploadFileIcon />}
                            onClick={handleOpenUploadDialog}
                            sx={{
                                color: '#633394',
                                borderColor: '#633394',
                                '&:hover': { borderColor: '#7c52a5', color: '#7c52a5' },
                                height: '36px'
                            }}
                        >
                            Upload CSV/XLSX
                        </Button>
                    </Box>
                </Box>
            </Box>

            {/* Search and Filter Controls */}
            <Card sx={{ mb: 3, boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)' }}>
                <CardContent>
                    <Typography variant="h6" gutterBottom sx={{ color: '#633394', fontWeight: 'bold', mb: 2 }}>
                        Search & Filter
                    </Typography>
                    <Grid container spacing={2}>
                        <Grid item xs={12} md={4}>
                            <TextField
                                fullWidth
                                label="Search Organizations"
                                placeholder="Search by name, type, location..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                size="small"
                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 0 } }}
                            />
                        </Grid>
                        <Grid item xs={12} md={3}>
                            <FormControl fullWidth size="small">
                                <InputLabel>Filter by Type</InputLabel>
                                <Select
                                    value={filterType}
                                    onChange={(e) => setFilterType(e.target.value)}
                                    label="Filter by Type"
                                    sx={{ borderRadius: 0 }}
                                >
                                    <MenuItem value="">All Organizations</MenuItem>
                                    <MenuItem value="church">Churches</MenuItem>
                                    <MenuItem value="Institution">Institutions</MenuItem>
                                    <MenuItem value="Non_formal_organizations">Non-Formal Organizations</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12} md={3}>
                            <TextField
                                fullWidth
                                label="Filter by Location"
                                placeholder="City, Province, Country..."
                                value={filterLocation}
                                onChange={(e) => setFilterLocation(e.target.value)}
                                size="small"
                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 0 } }}
                            />
                        </Grid>
                        <Grid item xs={12} md={2}>
                            <Button
                                fullWidth
                                variant="outlined"
                                onClick={() => {
                                    setSearchTerm('');
                                    setFilterType('');
                                    setFilterLocation('');
                                    setOrgTypeFilter('all');
                                }}
                                sx={{
                                    height: '40px',
                                    color: '#633394',
                                    borderColor: '#633394',
                                    '&:hover': { borderColor: '#7c52a5', backgroundColor: 'rgba(99, 51, 148, 0.04)' }
                                }}
                            >
                                Clear Filters
                            </Button>
                        </Grid>
                    </Grid>
                </CardContent>
            </Card>

            {renderMainOrganizationsTable()}
            {renderOtherOrganizationsTable()}


            {/* Add Organization Dialog */}
            <Dialog open={openAddDialog} onClose={handleCloseDialogOnly} maxWidth="md" fullWidth>
                <DialogTitle sx={{ backgroundColor: '#633394', color: 'white' }}>
                    Add New Organization
                </DialogTitle>
                <DialogContent dividers>
                    {renderOrganizationForm()}
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDialogs} color="secondary">Cancel</Button>
                    <Button
                        onClick={handleAddOrganization}
                        variant="contained"
                        sx={{ backgroundColor: '#633394', '&:hover': { backgroundColor: '#7c52a5' } }}
                    >
                        Add Organization
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Edit Organization Dialog */}
            <Dialog open={openEditDialog} onClose={handleCloseDialogOnly} maxWidth="md" fullWidth>
                <DialogTitle sx={{ backgroundColor: '#633394', color: 'white' }}>
                    Edit Organization
                </DialogTitle>
                <DialogContent dividers>
                    {renderOrganizationForm()}
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDialogs} color="secondary">Cancel</Button>
                    <Button
                        onClick={handleUpdateOrganization}
                        variant="contained"
                        sx={{ backgroundColor: '#633394', '&:hover': { backgroundColor: '#7c52a5' } }}
                    >
                        Update Organization
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Delete Organization Dialog */}
            <Dialog open={openDeleteDialog} onClose={handleCloseDialogOnly} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ backgroundColor: '#d32f2f', color: 'white' }}>
                    ⚠️ Delete Organization - Permanent Action
                </DialogTitle>
                <DialogContent dividers>
                    <Typography variant="h6" gutterBottom sx={{ color: '#d32f2f', fontWeight: 'bold' }}>
                        Are you sure you want to delete "{selectedOrganization?.name}"?
                    </Typography>

                    <Typography variant="body1" gutterBottom sx={{ mt: 2 }}>
                        <strong>⚠️ WARNING:</strong> This will permanently delete:
                    </Typography>

                    <Box component="ul" sx={{ mt: 1, mb: 2, pl: 2 }}>
                        <Typography component="li" variant="body2">• <strong>ALL Survey Templates</strong> created for this organization</Typography>
                        <Typography component="li" variant="body2">• <strong>ALL Survey Responses</strong> collected from users</Typography>
                        <Typography component="li" variant="body2">• <strong>ALL User Details</strong> submitted by organization members</Typography>
                        <Typography component="li" variant="body2">• <strong>Organization contact information</strong> and location data</Typography>
                        <Typography component="li" variant="body2">• <strong>User role assignments</strong> within this organization</Typography>
                    </Box>

                    <Typography variant="body2" sx={{
                        backgroundColor: '#fff3e0',
                        padding: 2,
                        borderRadius: 1,
                        border: '1px solid #ffb74d',
                        color: '#e65100'
                    }}>
                        <strong>Note:</strong> Users associated with this organization will NOT be deleted,
                        but their organization association will be removed.
                    </Typography>

                    <Typography variant="body1" sx={{ mt: 2, fontWeight: 'bold', color: '#d32f2f' }}>
                        This action cannot be undone!
                    </Typography>
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button
                        onClick={handleCloseDialogs}
                        color="primary"
                        variant="outlined"
                        sx={{ mr: 1 }}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleDeleteOrganization}
                        variant="contained"
                        color="error"
                        sx={{ backgroundColor: '#d32f2f', '&:hover': { backgroundColor: '#b71c1c' } }}
                    >
                        Yes, Delete Everything
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Upload File Dialog */}
            <Dialog open={openUploadDialog} onClose={handleCloseUploadDialog}>
                <DialogTitle sx={{ backgroundColor: '#633394', color: 'white' }}>
                    Upload Organizations File
                </DialogTitle>
                <DialogContent dividers>
                    <Typography gutterBottom>
                        Upload a CSV or XLSX file containing organization data.
                        The file should have columns for name, type, location, etc.
                    </Typography>
                    <Box sx={{ mt: 2 }}>
                        <input
                            accept=".csv,.xlsx"
                            type="file"
                            onChange={handleFileChange}
                            style={{
                                padding: '10px',
                                border: `1px solid #633394`,
                                borderRadius: '4px'
                            }}
                        />
                        {uploadStatus && (
                            <Typography color="error" sx={{ mt: 1 }}>
                                {uploadStatus}
                            </Typography>
                        )}
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseUploadDialog} color="secondary">Cancel</Button>
                    <Button
                        onClick={handleFileUpload}
                        variant="contained"
                        sx={{ backgroundColor: '#633394', '&:hover': { backgroundColor: '#7c52a5' } }}
                        disabled={!selectedFile}
                    >
                        Upload
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Add User Dialog - Enhanced Version */}
            <Dialog open={openAddUserDialog} onClose={handleCloseAddUserDialog} maxWidth="md" fullWidth>
                <DialogTitle sx={{ backgroundColor: '#633394', color: 'white' }}>
                    Add New User {contactType === 'primary' ? '(Primary Contact)' :
                        contactType === 'secondary' ? '(Secondary Contact)' :
                            contactType === 'head' ? '(Head/Lead)' : ''}
                </DialogTitle>
                <DialogContent dividers>
                    <Box component="form" noValidate autoComplete="off">
                        {/* User Information Section */}
                        <Paper
                            sx={{
                                p: 2,
                                backgroundColor: '#f5f5f5',
                                boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
                                mb: 3,
                                width: '96.5%',
                            }}
                        >
                            <Typography
                                variant="h6"
                                gutterBottom
                                sx={{
                                    color: '#633394',
                                    fontWeight: 'bold',
                                    mb: 2,
                                    textAlign: 'center',
                                }}
                            >
                                User Information
                            </Typography>

                            <Box sx={{ display: 'flex', gap: 2 }}>
                                {/* Column 1 */}
                                <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
                                    <TextField
                                        required
                                        fullWidth
                                        label="Username"
                                        name="username"
                                        value={newUserData.username}
                                        onChange={handleNewUserInputChange}
                                        variant="outlined"
                                    />
                                    <TextField
                                        fullWidth
                                        label="First Name"
                                        name="firstname"
                                        value={newUserData.firstname}
                                        onChange={handleNewUserInputChange}
                                        variant="outlined"
                                    />
                                    <TextField
                                        fullWidth
                                        label="Phone"
                                        name="phone"
                                        value={newUserData.phone}
                                        onChange={handleNewUserInputChange}
                                        variant="outlined"
                                    />
                                </Box>

                                {/* Column 2 */}
                                <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
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
                                    <TextField
                                        fullWidth
                                        label="Last Name"
                                        name="lastname"
                                        value={newUserData.lastname}
                                        onChange={handleNewUserInputChange}
                                        variant="outlined"
                                    />
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
                                </Box>

                                {/* Column 3 */}
                                <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
                                    <Autocomplete
                                        value={roles.find(role => role.name === newUserData.ui_role) || null}
                                        onChange={(event, newValue) => {
                                            setNewUserData({
                                                ...newUserData,
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
                                        renderOption={(props, option) => {
                                            const { key, ...otherProps } = props;
                                            return (
                                                <li key={key} {...otherProps}>
                                                    {option.name.charAt(0).toUpperCase() + option.name.slice(1)}
                                                </li>
                                            );
                                        }}
                                    />

                                    <FormControl fullWidth variant="outlined">
                                        <InputLabel>Organization</InputLabel>
                                        <Select
                                            name="organization_id"
                                            value={newUserData.organization_id}
                                            onChange={handleNewUserInputChange}
                                            label="Organization"
                                        >
                                            <MenuItem value="">No Organization Currently available</MenuItem>
                                            {organizations.map((org) => (
                                                <MenuItem key={org.id} value={org.id}>
                                                    {org.name}
                                                </MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                </Box>
                            </Box>
                        </Paper>

                        {/* Organizational Titles Section - Hidden when UI role is 'other' */}
                        {newUserData.ui_role !== 'other' && newUserData.ui_role && (
                            <Paper sx={{ p: 2, backgroundColor: '#f5f5f5', boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)', mb: 3 }}>
                                <Typography variant="h6" gutterBottom sx={{ color: '#633394', fontWeight: 'bold', mb: 2, textAlign: 'center' }}>
                                    Organizational Titles
                                </Typography>
                                <Box sx={{ maxWidth: '900px', mx: 'auto' }}>

                                    {/* Add New Title Section */}
                                    <Box sx={{
                                        p: 2,
                                        border: '1px solid #e0e0e0',
                                        borderRadius: 1,
                                        backgroundColor: 'white',
                                        mb: 3
                                    }}>
                                        <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: '#633394', mb: 2, textAlign: 'center' }}>
                                            Add Title to Organization
                                        </Typography>
                                        <Grid container spacing={2} alignItems="end">
                                            <Grid item xs={12} md={4}>
                                                <FormControl
                                                    variant="outlined"
                                                    sx={{ width: 300, minHeight: '56px' }}
                                                >
                                                    <InputLabel id="select-organization-label">Select Organization</InputLabel>
                                                    <Select
                                                        labelId="select-organization-label"
                                                        value={selectedOrganizationIdForRole}
                                                        onChange={(e) => setSelectedOrganizationIdForRole(e.target.value)}
                                                        label="Select Organization"
                                                        sx={{
                                                            minHeight: '56px',
                                                            '& .MuiSelect-select': {
                                                                minHeight: '20px',
                                                                display: 'flex',
                                                                alignItems: 'center'
                                                            }
                                                        }}
                                                    >
                                                        <MenuItem value="">
                                                            <em>Choose an organization</em>
                                                        </MenuItem>
                                                        {organizations.map((org) => (
                                                            <MenuItem key={org.id} value={org.id}>
                                                                {org.name}
                                                            </MenuItem>
                                                        ))}
                                                    </Select>
                                                </FormControl>
                                            </Grid>
                                            <Grid item xs={12} md={4}>
                                                <TextField
                                                    fullWidth
                                                    label="Title"
                                                    value={organizationalTitleToAdd}
                                                    onChange={(e) => setOrganizationalTitleToAdd(e.target.value)}
                                                    variant="outlined"
                                                    placeholder="e.g., Pastor, Director, President"
                                                />
                                            </Grid>
                                            <Grid item xs={12} md={4}>
                                                <Button
                                                    variant="contained"
                                                    fullWidth
                                                    onClick={handleAddOrganizationalTitleToUser}
                                                    disabled={!selectedOrganizationIdForRole || !organizationalTitleToAdd.trim() || addingOrganizationalTitle}
                                                    sx={{
                                                        backgroundColor: '#633394',
                                                        '&:hover': { backgroundColor: '#7c52a5' }
                                                    }}
                                                    startIcon={addingOrganizationalTitle ? <CircularProgress size={20} color="inherit" /> : null}
                                                >
                                                    {addingOrganizationalTitle ? 'Adding...' : 'Add Title'}
                                                </Button>
                                            </Grid>
                                        </Grid>
                                    </Box>

                                    {/* Display Current Titles */}
                                    {newUserData.roles.length > 0 && (
                                        <Box sx={{
                                            p: 2,
                                            border: '1px solid #e0e0e0',
                                            borderRadius: 1,
                                            backgroundColor: 'white'
                                        }}>
                                            <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: '#633394', mb: 2, textAlign: 'center' }}>
                                                Assigned Roles
                                            </Typography>
                                            <Grid container spacing={2}>
                                                {organizations.map((org) => {
                                                    const orgRoles = getUserOrganizationTitles(org.id);
                                                    if (orgRoles.length === 0) return null;

                                                    return (
                                                        <Grid item xs={12} key={org.id}>
                                                            <Box sx={{
                                                                p: 2,
                                                                border: '1px solid #ddd',
                                                                borderRadius: 1,
                                                                backgroundColor: '#f9f9f9'
                                                            }}>
                                                                <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
                                                                    {org.name}
                                                                </Typography>
                                                                <Stack direction="row" spacing={1} flexWrap="wrap">
                                                                    {orgRoles.map((role, index) => (
                                                                        <Chip
                                                                            key={index}
                                                                            label={role.title_type}
                                                                            onDelete={() => handleRemoveOrganizationalTitleFromUser(org.id, role.title_type)}
                                                                            color="primary"
                                                                            size="small"
                                                                            sx={{ mb: 1 }}
                                                                        />
                                                                    ))}
                                                                </Stack>
                                                            </Box>
                                                        </Grid>
                                                    );
                                                })}
                                            </Grid>
                                        </Box>
                                    )}
                                </Box>
                            </Paper>
                        )}

                        {/* Geographic Location Section */}
                        <Paper sx={{ p: 2, backgroundColor: '#f5f5f5', boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)' }}>
                            <Typography variant="h6" gutterBottom sx={{ color: '#633394', fontWeight: 'bold', mb: 3, textAlign: 'center' }}>
                                Geographic Location (Optional)
                            </Typography>

                            <Box sx={{ maxWidth: '900px', mx: 'auto' }}>
                                <Grid container spacing={3}>
                                    {/* Left Column */}
                                    <Grid item xs={12} md={6}>
                                        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 2 }}>
                                            <TextField
                                                fullWidth
                                                label="Country"
                                                name="geo_location.country"
                                                value={newUserData.geo_location.country}
                                                onChange={handleNewUserInputChange}
                                                variant="outlined"
                                            />

                                            <TextField
                                                fullWidth
                                                label="Province/State"
                                                name="geo_location.province"
                                                value={newUserData.geo_location.province}
                                                onChange={handleNewUserInputChange}
                                                variant="outlined"
                                            />

                                            <TextField
                                                fullWidth
                                                label="City"
                                                name="geo_location.city"
                                                value={newUserData.geo_location.city}
                                                onChange={handleNewUserInputChange}
                                                variant="outlined"
                                            />

                                            <TextField
                                                fullWidth
                                                label="Address Line 1"
                                                name="geo_location.address_line1"
                                                value={newUserData.geo_location.address_line1}
                                                onChange={handleNewUserInputChange}
                                                variant="outlined"
                                            />

                                            <TextField
                                                fullWidth
                                                label="Postal Code"
                                                name="geo_location.postal_code"
                                                value={newUserData.geo_location.postal_code}
                                                onChange={handleNewUserInputChange}
                                                variant="outlined"
                                            />
                                        </Box>
                                    </Grid>

                                    {/* Right Column */}
                                    <Grid item xs={12} md={6}>
                                        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 2 }}>
                                            <TextField
                                                fullWidth
                                                label="Continent"
                                                name="geo_location.continent"
                                                value={newUserData.geo_location.continent}
                                                onChange={handleNewUserInputChange}
                                                variant="outlined"
                                            />

                                            <TextField
                                                fullWidth
                                                label="Region"
                                                name="geo_location.region"
                                                value={newUserData.geo_location.region}
                                                onChange={handleNewUserInputChange}
                                                variant="outlined"
                                            />

                                            <TextField
                                                fullWidth
                                                label="Town"
                                                name="geo_location.town"
                                                value={newUserData.geo_location.town}
                                                onChange={handleNewUserInputChange}
                                                variant="outlined"
                                            />

                                            <TextField
                                                fullWidth
                                                label="Address Line 2"
                                                name="geo_location.address_line2"
                                                value={newUserData.geo_location.address_line2}
                                                onChange={handleNewUserInputChange}
                                                variant="outlined"
                                            />

                                            <Box sx={{ display: 'flex', gap: 1 }}>
                                                <TextField
                                                    fullWidth
                                                    label="Latitude"
                                                    name="geo_location.latitude"
                                                    type="number"
                                                    value={newUserData.geo_location.latitude}
                                                    onChange={handleNewUserInputChange}
                                                    variant="outlined"
                                                    inputProps={{ step: "any" }}
                                                />
                                                <TextField
                                                    fullWidth
                                                    label="Longitude"
                                                    name="geo_location.longitude"
                                                    type="number"
                                                    value={newUserData.geo_location.longitude}
                                                    onChange={handleNewUserInputChange}
                                                    variant="outlined"
                                                    inputProps={{ step: "any" }}
                                                />
                                            </Box>
                                        </Box>
                                    </Grid>
                                </Grid>
                            </Box>
                        </Paper>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseAddUserDialog} color="secondary">Cancel</Button>
                    <Button
                        onClick={handleAddNewUser}
                        variant="contained"
                        sx={{ backgroundColor: '#633394', '&:hover': { backgroundColor: '#7c52a5' } }}
                        disabled={!newUserData.firstname || !newUserData.lastname || !newUserData.email || !newUserData.username}
                    >
                        Add User & Select
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Add Related Organization Dialog */}
            <Dialog open={openAddRelatedOrgDialog} onClose={handleCloseAddRelatedOrgDialog} maxWidth="md" fullWidth>
                <DialogTitle sx={{ backgroundColor: '#633394', color: 'white' }}>
                    Add New Organization {relationshipType === 'denomination' ? '(Denomination/Affiliation)' :
                        relationshipType === 'accreditation' ? '(Accreditation Body)' :
                            relationshipType === 'affiliation' ? '(Affiliation/Validation)' :
                                relationshipType === 'umbrella' ? '(Umbrella Association)' : ''}
                </DialogTitle>
                <DialogContent dividers>
                    <Box component="form" noValidate autoComplete="off">
                        {/* Organization Information Section */}
                        <Paper
                            sx={{
                                p: 2,
                                backgroundColor: '#f5f5f5',
                                boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
                                mb: 3,
                                width: '96.5%',
                            }}
                        >
                            <Typography
                                variant="h6"
                                gutterBottom
                                sx={{
                                    color: '#633394',
                                    fontWeight: 'bold',
                                    mb: 2,
                                    textAlign: 'center',
                                }}
                            >
                                Organization Information
                            </Typography>

                            <Box sx={{ display: 'flex', gap: 2 }}>
                                {/* Column 1 */}
                                <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
                                    <TextField
                                        required
                                        fullWidth
                                        label="Organization Name"
                                        name="name"
                                        value={newRelatedOrgData.name}
                                        onChange={handleRelatedOrgInputChange}
                                        variant="outlined"
                                    />
                                    <TextField
                                        fullWidth
                                        label="Country"
                                        name="country"
                                        value={newRelatedOrgData.country}
                                        onChange={handleRelatedOrgInputChange}
                                        variant="outlined"
                                    />
                                    <TextField
                                        fullWidth
                                        label="City"
                                        name="city"
                                        value={newRelatedOrgData.city}
                                        onChange={handleRelatedOrgInputChange}
                                        variant="outlined"
                                    />
                                </Box>

                                {/* Column 2 */}
                                <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
                                    <FormControl fullWidth variant="outlined">
                                        <InputLabel>Organization Type</InputLabel>
                                        <Select
                                            name="type"
                                            value={newRelatedOrgData.type}
                                            onChange={handleRelatedOrgInputChange}
                                            label="Organization Type"
                                            disabled={organizationTypes.length === 0}
                                        >
                                            {organizationTypes.length === 0 ? (
                                                <MenuItem value="" disabled>
                                                    Loading organization types...
                                                </MenuItem>
                                            ) : (
                                                organizationTypes.map((orgType) => (
                                                    <MenuItem key={orgType.id} value={orgType.type}>
                                                        {orgType.type === 'Churches' ? 'Church' :
                                                            orgType.type === 'Institutions' ? 'Institution' :
                                                                orgType.type === 'Non_formal_organizations' ? 'Non-formal Organization' :
                                                                    orgType.type === 'church' ? 'Church' :
                                                                        orgType.type === 'school' ? 'School' :
                                                                            orgType.type === 'institution' ? 'Institution' :
                                                                                orgType.type === 'non-formal organization' ? 'Non-formal Organization' :
                                                                                    orgType.type === 'other' ? 'Other' :
                                                                                        orgType.type.charAt(0).toUpperCase() + orgType.type.slice(1)}
                                                    </MenuItem>
                                                ))
                                            )}
                                        </Select>
                                    </FormControl>
                                    <TextField
                                        fullWidth
                                        label="Province/State"
                                        name="province"
                                        value={newRelatedOrgData.province}
                                        onChange={handleRelatedOrgInputChange}
                                        variant="outlined"
                                    />
                                    <TextField
                                        fullWidth
                                        label="Website"
                                        name="website"
                                        value={newRelatedOrgData.website}
                                        onChange={handleRelatedOrgInputChange}
                                        variant="outlined"
                                    />
                                </Box>

                                {/* Column 3 */}
                                <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
                                    <TextField
                                        fullWidth
                                        label="Continent"
                                        name="continent"
                                        value={newRelatedOrgData.continent}
                                        onChange={handleRelatedOrgInputChange}
                                        variant="outlined"
                                    />
                                    <TextField
                                        fullWidth
                                        label="Region"
                                        name="region"
                                        value={newRelatedOrgData.region}
                                        onChange={handleRelatedOrgInputChange}
                                        variant="outlined"
                                    />
                                    <TextField
                                        fullWidth
                                        label="Address"
                                        name="address_line1"
                                        value={newRelatedOrgData.address_line1}
                                        onChange={handleRelatedOrgInputChange}
                                        variant="outlined"
                                    />
                                </Box>
                            </Box>
                        </Paper>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseAddRelatedOrgDialog} color="secondary">Cancel</Button>
                    <Button
                        onClick={handleAddNewRelatedOrg}
                        variant="contained"
                        sx={{ backgroundColor: '#633394', '&:hover': { backgroundColor: '#7c52a5' } }}
                        disabled={!newRelatedOrgData.name}
                    >
                        Add Organization & Select
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Bulk Delete Organizations Dialog */}
            <Dialog open={openBulkDeleteDialog} onClose={() => !bulkDeleteLoading && setOpenBulkDeleteDialog(false)} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ backgroundColor: '#d32f2f', color: 'white' }}>
                    Delete {(bulkDeleteTarget === 'main' ? selectedMainOrgIds : selectedOtherOrgIds).length} Organization(s)
                </DialogTitle>
                <DialogContent sx={{ mt: 2 }}>
                    <Typography>
                        Are you sure you want to delete <strong>{(bulkDeleteTarget === 'main' ? selectedMainOrgIds : selectedOtherOrgIds).length}</strong> organization(s)?
                    </Typography>
                    <Alert severity="error" sx={{ mt: 2 }}>
                        This will permanently delete all selected organizations along with their survey templates, responses, user details, and role assignments. This action cannot be undone!
                    </Alert>
                    <Box sx={{ mt: 2, maxHeight: 200, overflowY: 'auto' }}>
                        {organizations
                            .filter(o => (bulkDeleteTarget === 'main' ? selectedMainOrgIds : selectedOtherOrgIds).includes(o.id))
                            .map(org => (
                                <Box key={org.id} sx={{ p: 1, mb: 0.5, bgcolor: '#f5f5f5', borderRadius: 1 }}>
                                    <Typography variant="body2">
                                        <strong>{org.name}</strong> — {org.organization_type?.type || 'Unknown type'}
                                    </Typography>
                                </Box>
                            ))}
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenBulkDeleteDialog(false)} disabled={bulkDeleteLoading}>Cancel</Button>
                    <Button
                        variant="contained"
                        color="error"
                        onClick={handleBulkDeleteOrganizations}
                        disabled={bulkDeleteLoading}
                        startIcon={bulkDeleteLoading ? <CircularProgress size={20} color="inherit" /> : <DeleteIcon />}
                    >
                        {bulkDeleteLoading ? 'Deleting...' : 'Yes, Delete All'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Snackbar for notifications */}
            <Snackbar
                open={orgSnackbar.open}
                autoHideDuration={4000}
                onClose={() => setOrgSnackbar({ ...orgSnackbar, open: false })}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            >
                <Alert onClose={() => setOrgSnackbar({ ...orgSnackbar, open: false })} severity={orgSnackbar.severity} variant="filled">
                    {orgSnackbar.message}
                </Alert>
            </Snackbar>

            {/* Spider Chart Popup */}
            <SpiderChartPopup
                open={spiderChartOpen}
                onClose={handleCloseSpiderChart}
                entityType="organization"
                entityData={selectedOrgForChart}
                entityId={selectedOrgForChart?.id}
                entityName={selectedOrgForChart?.name}
            />
        </Box>
    );
}

export default OrganizationsManagement;
