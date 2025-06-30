import React, { useState, useEffect, useRef } from 'react';
import { 
    Box, Typography, Button, Table, TableBody, TableCell, TableContainer, 
    TableHead, TableRow, Paper, IconButton, Dialog, DialogActions, 
    DialogContent, DialogTitle, TextField, Select, MenuItem, FormControl, 
    InputLabel, TablePagination, Card, CardContent, Grid, Chip, useTheme,
    Autocomplete, CircularProgress, Tooltip, Stack
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import { 
    fetchUsersWithRoleUser, addUser, updateUser, deleteUser, 
    fetchOrganizations, fetchRoles, uploadUserFile, addRole,
    addUserOrganizationalRole, fetchUserOrganizationalRoles,
    updateUserOrganizationalRoles, fetchTemplatesByOrganization
} from '../../../services/UserManagement/UserManagementService';
// import GooglePlacesAutocomplete from '../common/GooglePlacesAutocomplete';
// import GooglePlacesAutocomplete from '../common/GooglePlacesAutocompleteSimple';
// import ManualAddressInput from '../common/ManualAddressInput';
import MapAddressSelector from '../common/MapAddressSelector';

function UsersManagement() {
    const theme = useTheme();
    
    // State variables
    const [users, setUsers] = useState([]);
    const [organizations, setOrganizations] = useState([]);
    const [roles, setRoles] = useState([]);
    const [templates, setTemplates] = useState([]);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [totalUsers, setTotalUsers] = useState(0);
    
    // Dialog states
    const [openAddDialog, setOpenAddDialog] = useState(false);
    const [openEditDialog, setOpenEditDialog] = useState(false);
    const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
    const [openUploadDialog, setOpenUploadDialog] = useState(false);
    const [openEmailDialog, setOpenEmailDialog] = useState(false);
    
    // Form states
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        ui_role: 'user',
        firstname: '',
        lastname: '',
        phone: '',
        organization_id: '',
        template_id: '',
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
    
    const [selectedUser, setSelectedUser] = useState(null);
    const [selectedFile, setSelectedFile] = useState(null);
    const [uploadStatus, setUploadStatus] = useState('');
    const [newRoleName, setNewRoleName] = useState('');
    const [roleSearchText, setRoleSearchText] = useState('');
    const [isAddingNewRole, setIsAddingNewRole] = useState(false);
    const [roleLoading, setRoleLoading] = useState(false);
    const [addingOrganizationalRole, setAddingOrganizationalRole] = useState(false);

    // New state variables for improved organizational roles workflow
    const [selectedOrganizationId, setSelectedOrganizationId] = useState('');
    const [selectedRoleType, setSelectedRoleType] = useState('');
    const [organizationalRoleToAdd, setOrganizationalRoleToAdd] = useState('');
    
    // Email dialog states
    const [emailData, setEmailData] = useState({
        to: '',
        subject: '',
        body: '',
        username: '',
        password: '',
        firstname: ''
    });
    const [emailSending, setEmailSending] = useState(false);
    const [emailSent, setEmailSent] = useState(false);
    
    // Google Places state
    const [addressSearch, setAddressSearch] = useState('');

    // Load data on component mount
    useEffect(() => {
        loadUsers();
        loadOrganizations();
        loadRoles();
    }, []);

    // Load users from API
    const loadUsers = async () => {
        try {
            const data = await fetchUsersWithRoleUser();
            console.log(data);
            setUsers(data);
            setTotalUsers(data.length);
        } catch (error) {
            console.error('Failed to fetch users:', error);
        }
    };

    // Load organizations from API
    const loadOrganizations = async () => {
        try {
            const data = await fetchOrganizations();
            setOrganizations(data);
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

    // Handle form input changes
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        
        // Handle nested geo_location fields
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
            // Handle organization change - load templates
            if (name === 'organization_id') {
                loadTemplates(value);
                setFormData({
                    ...formData,
                    [name]: value,
                    template_id: '' // Reset template selection when organization changes
                });
            } else {
                setFormData({
                    ...formData,
                    [name]: value
                });
            }
        }
    };

    // Handle role selection
    const handleRoleSelection = (e, organizationId, roleId) => {
        const isChecked = e.target.checked;
        let updatedRoles = [...formData.roles];
        
        if (isChecked) {
            updatedRoles.push({ organization_id: organizationId, role_id: roleId });
        } else {
            updatedRoles = updatedRoles.filter(
                role => !(role.organization_id === organizationId && role.role_id === roleId)
            );
        }
        
        setFormData({
            ...formData,
            roles: updatedRoles
        });
    };

    // Handle adding a new role
    const handleAddNewRole = async () => {
        if (!newRoleName.trim()) return;
        
        setRoleLoading(true);
        try {
            const roleData = {
                name: newRoleName.trim(),
                description: `Created for user with ${formData.ui_role} role`
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
            
            const response = await uploadUserFile(formData);
            setUploadStatus(`File uploaded successfully: ${response.filename}`);
            
            // Reload users after successful upload
            loadUsers();
            
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

    // Open add user dialog
    const handleOpenAddDialog = () => {
        setFormData({
            username: '',
            email: '',
            password: '',
            ui_role: 'user',
            firstname: '',
            lastname: '',
            phone: '',
            organization_id: '',
            template_id: '',
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
        setTemplates([]); // Reset templates
        setOpenAddDialog(true);
    };

    // Open edit user dialog
    const handleOpenEditDialog = async (user) => {
        setSelectedUser(user);
        
        // Load organizational roles for the user if they have the 'other' role
        let userRoles = user.roles || [];
        if (user.ui_role === 'other') {
            try {
                const organizationalRoles = await fetchUserOrganizationalRoles(user.id);
                userRoles = organizationalRoles || [];
            } catch (error) {
                console.warn('Failed to fetch organizational roles for user:', error);
            }
        }
        
        setFormData({
            username: user.username,
            email: user.email,
            password: '', // Don't populate password for security
            ui_role: user.ui_role,
            firstname: user.firstname || '',
            lastname: user.lastname || '',
            phone: user.phone || '',
            organization_id: user.organization_id || '',
            template_id: user.template_id || '',
            roles: userRoles,
            geo_location: user.geo_location || {
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
        
        // Load templates for the user's organization
        if (user.organization_id) {
            loadTemplates(user.organization_id);
        } else {
            setTemplates([]);
        }
        setOpenEditDialog(true);
    };

    // Open delete user dialog
    const handleOpenDeleteDialog = (user) => {
        setSelectedUser(user);
        setOpenDeleteDialog(true);
    };

    // Open upload file dialog
    const handleOpenUploadDialog = () => {
        setSelectedFile(null);
        setUploadStatus('');
        setOpenUploadDialog(true);
    };

    // Close all dialogs
    const handleCloseDialogs = () => {
        setOpenAddDialog(false);
        setOpenEditDialog(false);
        setOpenDeleteDialog(false);
        setOpenUploadDialog(false);
        setOpenEmailDialog(false);
        setSelectedUser(null);
        // Reset new organizational role fields
        setSelectedOrganizationId('');
        setSelectedRoleType('');
        setOrganizationalRoleToAdd('');
        setFormData({
            username: '',
            email: '',
            password: '',
            ui_role: 'user',
            firstname: '',
            lastname: '',
            phone: '',
            organization_id: '',
            template_id: '',
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
        setTemplates([]); // Reset templates
        // Reset email data
        setEmailData({
            to: '',
            subject: '',
            body: '',
            username: '',
            password: '',
            firstname: ''
        });
    };

    // Handle closing email dialog specifically
    const handleCloseEmailDialog = () => {
        setOpenEmailDialog(false);
        setEmailSending(false);
        setEmailSent(false);
        setEmailData({
            to: '',
            subject: '',
            body: '',
            username: '',
            password: '',
            firstname: ''
        });
    };

    // Handle sending the welcome email
    const handleSendWelcomeEmail = async () => {
        setEmailSending(true);
        try {
            const response = await fetch('/api/send-welcome-email', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    to_email: emailData.to,
                    username: emailData.username,
                    password: emailData.password,
                    firstname: emailData.firstname
                }),
            });

            const result = await response.json();

            if (response.ok) {
                setEmailSent(true);
                alert(`Welcome email sent successfully to ${emailData.to}!`);
            } else {
                throw new Error(result.error || 'Failed to send email');
            }
        } catch (error) {
            console.error('Error sending welcome email:', error);
            alert(`Failed to send email: ${error.message}`);
        } finally {
            setEmailSending(false);
        }
    };

    // Add a new user
    const handleAddUser = async () => {
        try {
            // Transform form data for backend
            const userData = {
                ...formData,
                role: formData.ui_role, // Map ui_role to role for backend
                geo_location: hasValidGeoData(formData.geo_location) ? formData.geo_location : null
            };
            
            // Remove ui_role and roles from the user data as they're handled separately
            delete userData.ui_role;
            const organizationalRoles = userData.roles || [];
            delete userData.roles;
            
            // First, create the user
            const newUser = await addUser(userData);
            
            // Then, if there are organizational roles, save them
            if (organizationalRoles.length > 0) {
                try {
                    await updateUserOrganizationalRoles(newUser.id, { roles: organizationalRoles });
                } catch (roleError) {
                    console.warn('User created but failed to save organizational roles:', roleError);
                    alert('User created successfully, but there was an issue saving organizational roles. You can edit the user to add roles.');
                }
            }
            
            // Prepare email data for the welcome email
            const welcomeEmailData = {
                to: formData.email,
                subject: 'Welcome to Saurara Platform',
                body: `Dear ${formData.firstname || formData.username},

Welcome to the Saurara Platform! We are excited to have you join our community.

Your account has been successfully created with the following details:

Username: ${formData.username}
Email: ${formData.email}
Password: ${formData.password || 'Auto-generated password will be sent separately'}

You can access the platform at: www.saurara.org

Please keep this information secure and change your password after your first login for enhanced security.

If you have any questions or need assistance, please don't hesitate to contact our support team.

Best regards,
The Saurara Team`,
                username: formData.username,
                password: formData.password || 'Auto-generated',
                firstname: formData.firstname
            };
            
            setEmailData(welcomeEmailData);
            loadUsers();
            
            // Close the add dialog and open the email dialog
            setOpenAddDialog(false);
            setOpenEmailDialog(true);
        } catch (error) {
            console.error('Failed to add user:', error);
            alert(`Failed to add user: ${error.message}`);
        }
    };

    // Helper function to check if geo_location has any meaningful data
    const hasValidGeoData = (geoData) => {
        return geoData && Object.values(geoData).some(value => value && value.trim() !== '');
    };

    // New handlers for improved organizational roles workflow
    const handleAddOrganizationalRole = async () => {
        if (!selectedOrganizationId || !organizationalRoleToAdd.trim()) {
            alert('Please select an organization and enter a role type');
            return;
        }

        // Check if this role type already exists for this organization
        const existingRole = formData.roles.find(
            r => r.organization_id === parseInt(selectedOrganizationId) && r.role_type === organizationalRoleToAdd.trim()
        );

        if (existingRole) {
            alert('This role type already exists for the selected organization');
            return;
        }

        setAddingOrganizationalRole(true);
        try {
            // Add the new role to the roles table if it doesn't exist
            const roleData = {
                name: organizationalRoleToAdd.trim(),
                description: `Created for organizational role: ${organizationalRoleToAdd.trim()}`
            };
            
            // This will add to roles table
            await addRole(roleData);
            
            // Add the new organizational role to the form data
            const newRole = {
                organization_id: parseInt(selectedOrganizationId),
                role_type: organizationalRoleToAdd.trim(),
                id: Date.now() // Temporary ID for frontend display
            };

            setFormData({
                ...formData,
                roles: [...formData.roles, newRole]
            });

            // Reset the form
            setSelectedOrganizationId('');
            setOrganizationalRoleToAdd('');
            
            alert('Role added successfully!');
        } catch (error) {
            // If the role already exists in the database, that's okay
            if (error.response && error.response.status === 409) {
                // Role already exists, just add it to the form
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
                alert('Role was already in system, added to user successfully!');
            } else {
                console.error('Failed to add role:', error);
                alert(`Failed to add role: ${error.message}`);
            }
        } finally {
            setAddingOrganizationalRole(false);
        }
    };

    const handleRemoveOrganizationalRole = (organizationId, roleType) => {
        setFormData({
            ...formData,
            roles: formData.roles.filter(
                r => !(r.organization_id === organizationId && r.role_type === roleType)
            )
        });
    };

    const getOrganizationRoles = (organizationId) => {
        return formData.roles.filter(r => r.organization_id === organizationId);
    };

    // Handle Google Places selection
    const handlePlaceSelect = (placeData) => {
        const { geoLocationData, formattedAddress } = placeData;
        
        // Update form data with the selected place information
        setFormData({
            ...formData,
            geo_location: {
                ...geoLocationData
            }
        });
        
        // Show a brief success message
        console.log('Address auto-filled:', formattedAddress);
        
        // Clear the search field
        setAddressSearch('');
    };

    // Handle address search input change
    const handleAddressSearchChange = (event) => {
        setAddressSearch(event.target.value);
    };

    // Update an existing user
    const handleUpdateUser = async () => {
        if (!selectedUser) return;
        
        try {
            // Transform form data for backend
            const userData = {
                ...formData,
                role: formData.ui_role, // Map ui_role to role for backend
                geo_location: hasValidGeoData(formData.geo_location) ? formData.geo_location : null
            };
            
            // Remove ui_role and roles from the user data as they're handled separately
            delete userData.ui_role;
            const organizationalRoles = userData.roles || [];
            delete userData.roles;
            
            // First, update the user
            await updateUser(selectedUser.id, userData);
            
            // Then, update organizational roles
            if (formData.ui_role === 'other') {
                try {
                    await updateUserOrganizationalRoles(selectedUser.id, { roles: organizationalRoles });
                } catch (roleError) {
                    console.warn('User updated but failed to save organizational roles:', roleError);
                    alert('User updated successfully, but there was an issue saving organizational roles.');
                }
            }
            
            loadUsers();
            handleCloseDialogs();
        } catch (error) {
            console.error('Failed to update user:', error);
            alert(`Failed to update user: ${error.message}`);
        }
    };

    // Delete a user
    const handleDeleteUser = async () => {
        if (!selectedUser) return;
        
        try {
            await deleteUser(selectedUser.id);
            loadUsers();
            handleCloseDialogs();
        } catch (error) {
            console.error('Failed to delete user:', error);
            alert(`Failed to delete user: ${error.message}`);
        }
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

    // Get organization name by ID
    const getOrganizationName = (orgId) => {
        const org = organizations.find(org => org.id === orgId);
        return org ? org.name : 'N/A';
    };

    // Get role name by ID
    const getRoleName = (roleId) => {
        const role = roles.find(role => role.id === roleId);
        return role ? role.name : 'N/A';
    };

    // Render the users table
    const renderUsersTable = () => {
        return (
            <TableContainer component={Paper}>
                <Table>
                    <TableHead sx={{ backgroundColor: '#633394' }}>
                        <TableRow>
                            <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Username</TableCell>
                            <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Email</TableCell>
                            <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>First Name</TableCell>
                            <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Last Name</TableCell>
                            <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Phone</TableCell>
                            <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>User Address</TableCell>
                            <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Organization</TableCell>
                            <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {users
                            .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                            .map((user) => (
                                <TableRow key={user.id}>
                                    <TableCell>{user.username}</TableCell>
                                    <TableCell>{user.email}</TableCell>
                                    <TableCell>{user.firstname}</TableCell>
                                    <TableCell>{user.lastname}</TableCell>
                                    <TableCell>{user.phone || 'N/A'}</TableCell>
                                    <TableCell>
                                        {user.geo_location ? 
                                            [
                                                user.geo_location.city,
                                                user.geo_location.province,
                                                user.geo_location.country
                                            ].filter(Boolean).join(', ') :
                                            'N/A'
                                        }
                                    </TableCell>
                                    <TableCell>{user.organization?.name || getOrganizationName(user.organization_id)}</TableCell>
                                    <TableCell>
                                        <IconButton 
                                            onClick={() => handleOpenEditDialog(user)}
                                            color="primary"
                                        >
                                            <EditIcon />
                                        </IconButton>
                                        <IconButton 
                                            onClick={() => handleOpenDeleteDialog(user)}
                                            color="error"
                                        >
                                            <DeleteIcon />
                                        </IconButton>
                                    </TableCell>
                                </TableRow>
                            ))}
                    </TableBody>
                </Table>
                <TablePagination
                    rowsPerPageOptions={[5, 10, 25]}
                    component="div"
                    count={totalUsers}
                    rowsPerPage={rowsPerPage}
                    page={page}
                    onPageChange={handleChangePage}
                    onRowsPerPageChange={handleChangeRowsPerPage}
                />
            </TableContainer>
        );
    };

    // Render the add/edit user form
    const renderUserForm = (isEdit = false) => {
        return (
            <Box component="form" noValidate autoComplete="off">
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
                        value={formData.username}
                        onChange={handleInputChange}
                        variant="outlined"
                    />
                    <TextField
                        fullWidth
                        label="First Name"
                        name="firstname"
                        value={formData.firstname}
                        onChange={handleInputChange}
                        variant="outlined"
                    />
                    <TextField
                        fullWidth
                        label="Phone"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
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
                        value={formData.email}
                        onChange={handleInputChange}
                        variant="outlined"
                    />
                    <TextField
                        fullWidth
                        label="Last Name"
                        name="lastname"
                        value={formData.lastname}
                        onChange={handleInputChange}
                        variant="outlined"
                    />
                    {isEdit ? (
                        <TextField
                        fullWidth
                        label="New Password (leave blank to keep current)"
                        name="password"
                        type="password"
                        value={formData.password}
                        onChange={handleInputChange}
                        variant="outlined"
                        />
                    ) : (
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
                    )}
                    </Box>

                    {/* Column 3 */}
                    <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
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
                            renderOption={(props, option) => (
                                <li {...props}>
                                    {option.name.charAt(0).toUpperCase() + option.name.slice(1)}
                                </li>
                            )}
                        />

                        <FormControl fullWidth variant="outlined">
                            <InputLabel>Organization</InputLabel>
                            <Select
                            name="organization_id"
                            value={formData.organization_id}
                            onChange={handleInputChange}
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

                        {/* Template Selection - Only shown when organization is selected */}
                        {formData.organization_id && (
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
                                            {template.survey_code} - {template.version_name}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        )}
                    </Box>
                </Box>
                </Paper>

                
                {/* Organizational Roles Section - Only shown when UI role is 'other' */}
                {formData.ui_role === 'other' && (
                    <Paper sx={{ p: 2, backgroundColor: '#f5f5f5', boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',mb: 3 }}>
                        <Typography variant="h6" gutterBottom sx={{ color: '#633394', fontWeight: 'bold', mb: 2, textAlign: 'center' }}>
                            Organizational Roles
                        </Typography>
                        <Box sx={{ maxWidth: '900px', mx: 'auto' }}>
                            
                            {/* Add New Role Section */}
                            <Box sx={{ 
                                p: 2, 
                                border: '1px solid #e0e0e0', 
                                borderRadius: 1,
                                backgroundColor: 'white',
                                mb: 3
                            }}>
                                <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: '#633394', mb: 2, textAlign: 'center' }}>
                                    Add Role to Organization
                                </Typography>
                                <Grid container spacing={2} alignItems="end">
                                    <Grid item xs={12} md={4}>
                                        <FormControl 
                                            // fixed width
                                            variant="outlined"
                                            sx={{width: 300,  minHeight: '56px' }}
                                        >
                                            <InputLabel id="select-organization-label">Select Organization</InputLabel>
                                            <Select
                                                labelId="select-organization-label"
                                                value={selectedOrganizationId}
                                                onChange={(e) => setSelectedOrganizationId(e.target.value)}
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
                                            label="Role Type"
                                            value={organizationalRoleToAdd}
                                            onChange={(e) => setOrganizationalRoleToAdd(e.target.value)}
                                            variant="outlined"
                                            placeholder="e.g., Manager, Coordinator, Member"
                                        />
                                    </Grid>
                                    <Grid item xs={12} md={4}>
                                        <Button 
                                            variant="contained" 
                                            fullWidth
                                            onClick={handleAddOrganizationalRole}
                                            disabled={!selectedOrganizationId || !organizationalRoleToAdd.trim() || addingOrganizationalRole}
                                            sx={{ 
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
                                            const orgRoles = getOrganizationRoles(org.id);
                                            if (orgRoles.length === 0) return null;
                                            
                                            return (
                                                <Grid item xs={12} key={org.id}>
                                                    <Box sx={{ 
                                                        p: 2, 
                                                        border: '1px solid #ddd', 
                                                        borderRadius: 1,
                                                        backgroundColor: '#fafafa'
                                                    }}>
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
                        </Box>
                    </Paper>
                )}
                
                {/* Address Information Section */}
                <Paper sx={{ p: 2, backgroundColor: '#f5f5f5', boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)', mb: 3 }}>
                    <Typography variant="h6" gutterBottom sx={{ color: '#633394', fontWeight: 'bold', mb: 2, textAlign: 'center' }}>
                        Address Information
                    </Typography>
                    
                    <Box sx={{ maxWidth: '900px', mx: 'auto' }}>
                        {/* Map Address Selector */}
                        <Box sx={{ mb: 3 }}>
                            <MapAddressSelector
                                onPlaceSelect={handlePlaceSelect}
                                label="🔍 Address Information"
                                fullWidth
                            />
                        </Box>

                    </Box>
                </Paper>
                
                
            </Box>
        );
    };

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h5" sx={{ color: '#633394', fontWeight: 'bold' }}>
                    Users Management
                </Typography>
                <Box>
                    <Button 
                        variant="contained" 
                        startIcon={<AddIcon />} 
                        onClick={handleOpenAddDialog}
                        sx={{ mr: 1, backgroundColor: '#633394', '&:hover': { backgroundColor: '#7c52a5' } }}
                    >
                        Add User
                    </Button>
                    <Button 
                        variant="outlined" 
                        startIcon={<UploadFileIcon />} 
                        onClick={handleOpenUploadDialog}
                        sx={{ color: '#633394', borderColor: '#633394', '&:hover': { borderColor: '#7c52a5', color: '#7c52a5' } }}
                    >
                        Upload CSV/XLSX
                    </Button>
                </Box>
            </Box>

            <Card sx={{ mb: 4, boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)', backgroundColor: '#f5f5f5' }}>
                <CardContent>
                    <Typography variant="h6" gutterBottom sx={{ color: '#633394', fontWeight: 'bold' }}>
                        User Statistics
                    </Typography>
                    <Grid container spacing={2}>
                        <Grid item xs={12} sm={4}>
                            <Paper sx={{ p: 2, textAlign: 'center', boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)', backgroundColor: '#f5f5f5' }}>
                                <Typography variant="h4" sx={{ color: '#633394' }}>{users.length}</Typography>
                                <Typography variant="body2" sx={{ color: '#633394' }}>Total Users</Typography>
                            </Paper>
                        </Grid>
                        <Grid item xs={12} sm={4}>
                            <Paper sx={{ p: 2, textAlign: 'center', boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)', backgroundColor: '#f5f5f5' }}>
                                <Typography variant="h4" sx={{ color: '#633394' }}>
                                    {users.filter(user => user.ui_role === 'admin').length}
                                </Typography>
                                <Typography variant="body2" sx={{ color: '#633394' }}>Administrators</Typography>
                            </Paper>
                        </Grid>
                        <Grid item xs={12} sm={4}>
                            <Paper sx={{ p: 2, textAlign: 'center', boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)', backgroundColor: '#f5f5f5' }}>
                                <Typography variant="h4" sx={{ color: '#633394' }}>
                                    {users.filter(user => user.ui_role === 'user').length}
                                </Typography>
                                <Typography variant="body2" sx={{ color: '#633394' }}>Regular Users</Typography>
                            </Paper>
                        </Grid>
                    </Grid>
                </CardContent>
            </Card>

            {renderUsersTable()}

            {/* Add User Dialog */}
            <Dialog open={openAddDialog} onClose={handleCloseDialogs} maxWidth="md" fullWidth>
                <DialogTitle sx={{ backgroundColor: '#633394', color: 'white' }}>
                    Add New User
                </DialogTitle>
                <DialogContent dividers>
                    {renderUserForm()}
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDialogs} color="secondary">Cancel</Button>
                    <Button 
                        onClick={handleAddUser} 
                        variant="contained" 
                        sx={{ backgroundColor: '#633394', '&:hover': { backgroundColor: '#7c52a5' } }}
                    >
                        Add User
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Edit User Dialog */}
            <Dialog open={openEditDialog} onClose={handleCloseDialogs} maxWidth="md" fullWidth>
                <DialogTitle sx={{ backgroundColor: '#633394', color: 'white' }}>
                    Edit User
                </DialogTitle>
                <DialogContent dividers>
                    {renderUserForm(true)}
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDialogs} color="secondary">Cancel</Button>
                    <Button 
                        onClick={handleUpdateUser} 
                        variant="contained" 
                        sx={{ backgroundColor: '#633394', '&:hover': { backgroundColor: '#7c52a5' } }}
                    >
                        Update User
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Delete User Dialog */}
            <Dialog open={openDeleteDialog} onClose={handleCloseDialogs}>
                <DialogTitle sx={{ backgroundColor: '#633394', color: 'white' }}>
                    Delete User
                </DialogTitle>
                <DialogContent dividers>
                    <Typography>
                        Are you sure you want to delete the user "{selectedUser?.username}"? 
                        This action cannot be undone.
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDialogs} color="secondary">Cancel</Button>
                    <Button 
                        onClick={handleDeleteUser} 
                        variant="contained" 
                        sx={{ backgroundColor: '#633394', '&:hover': { backgroundColor: '#7c52a5' } }}
                    >
                        Delete
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Upload File Dialog */}
            <Dialog open={openUploadDialog} onClose={handleCloseDialogs}>
                <DialogTitle sx={{ backgroundColor: '#633394', color: 'white' }}>
                    Upload Users File
                </DialogTitle>
                <DialogContent dividers>
                    <Typography gutterBottom>
                        Upload a CSV or XLSX file containing user data. 
                        The file should have columns for username, email, password, etc.
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
                    <Button onClick={handleCloseDialogs} color="secondary">Cancel</Button>
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

            {/* Welcome Email Dialog */}
            <Dialog 
                open={openEmailDialog} 
                onClose={() => {}} // Prevent closing by clicking outside
                disableEscapeKeyDown // Prevent closing with Escape key
                maxWidth="md" 
                fullWidth
            >
                <DialogTitle sx={{ backgroundColor: '#633394', color: 'white' }}>
                    Welcome Email Preview
                </DialogTitle>
                <DialogContent dividers>
                    <Typography variant="h6" gutterBottom sx={{ color: '#633394', fontWeight: 'bold' }}>
                        Email Details
                    </Typography>
                    
                    <Box sx={{ mb: 3 }}>
                        <Paper sx={{ p: 2, backgroundColor: '#f5f5f5', mb: 2 }}>
                            <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: '#633394' }}>
                                To:
                            </Typography>
                            <Typography variant="body1" sx={{ mb: 2 }}>
                                {emailData.to}
                            </Typography>
                            
                            <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: '#633394' }}>
                                Subject:
                            </Typography>
                            <Typography variant="body1" sx={{ mb: 2 }}>
                                {emailData.subject}
                            </Typography>
                            
                            <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: '#633394' }}>
                                Message Body:
                            </Typography>
                            <Paper sx={{ p: 2, backgroundColor: 'white', border: '1px solid #ddd' }}>
                                <Typography 
                                    variant="body1" 
                                    sx={{ 
                                        whiteSpace: 'pre-line',
                                        fontFamily: 'monospace',
                                        fontSize: '0.9rem'
                                    }}
                                >
                                    {emailData.body}
                                </Typography>
                            </Paper>
                        </Paper>
                        
                        <Paper sx={{ p: 2, backgroundColor: emailSent ? '#e8f5e8' : '#fff3e0', border: emailSent ? '1px solid #4caf50' : '1px solid #ff9800' }}>
                            <Typography variant="body2" sx={{ color: emailSent ? '#2e7d32' : '#e65100', fontWeight: 'bold' }}>
                                {emailSent ? '✅ Email sent successfully!' : '📧 This email template is ready to be sent to the new user.'}
                            </Typography>
                            <Typography variant="body2" sx={{ color: emailSent ? '#2e7d32' : '#e65100', mt: 1 }}>
                                Username: {emailData.username} | Password: {emailData.password}
                            </Typography>
                            {emailSent && (
                                <Typography variant="body2" sx={{ color: '#2e7d32', mt: 1 }}>
                                    The welcome email has been delivered to {emailData.to}
                                </Typography>
                            )}
                        </Paper>
                    </Box>
                </DialogContent>
                <DialogActions>
                    {!emailSent && (
                        <Button 
                            onClick={handleSendWelcomeEmail} 
                            variant="contained" 
                            disabled={emailSending}
                            startIcon={emailSending ? <CircularProgress size={20} color="inherit" /> : null}
                            sx={{ 
                                backgroundColor: '#4caf50', 
                                '&:hover': { backgroundColor: '#45a049' },
                                mr: 1
                            }}
                        >
                            {emailSending ? 'Sending...' : 'Send Email'}
                        </Button>
                    )}
                    <Button 
                        onClick={handleCloseEmailDialog} 
                        variant="outlined" 
                        sx={{ 
                            color: '#633394', 
                            borderColor: '#633394', 
                            '&:hover': { borderColor: '#7c52a5', color: '#7c52a5' } 
                        }}
                    >
                        {emailSent ? 'Done' : 'Close'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}

export default UsersManagement;
