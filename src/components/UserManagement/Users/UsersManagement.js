import React, { useState, useEffect, useRef } from 'react';
import { 
    Box, Typography, Button, Table, TableBody, TableCell, TableContainer, 
    TableHead, TableRow, Paper, IconButton, Dialog, DialogActions, 
    DialogContent, DialogTitle, TextField, Select, MenuItem, FormControl, 
    InputLabel, TablePagination, Card, CardContent, Grid, Chip, useTheme,
    Autocomplete, CircularProgress, Tooltip
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import { 
    fetchUsers, addUser, updateUser, deleteUser, 
    fetchOrganizations, fetchRoles, uploadUserFile, addRole
} from '../../../services/UserManagement/UserManagementService';

function UsersManagement() {
    const theme = useTheme();
    
    // State variables
    const [users, setUsers] = useState([]);
    const [organizations, setOrganizations] = useState([]);
    const [roles, setRoles] = useState([]);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [totalUsers, setTotalUsers] = useState(0);
    
    // Dialog states
    const [openAddDialog, setOpenAddDialog] = useState(false);
    const [openEditDialog, setOpenEditDialog] = useState(false);
    const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
    const [openUploadDialog, setOpenUploadDialog] = useState(false);
    
    // Form states
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        ui_role: 'user',
        firstname: '',
        lastname: '',
        organization_id: '',
        roles: []
    });
    
    const [selectedUser, setSelectedUser] = useState(null);
    const [selectedFile, setSelectedFile] = useState(null);
    const [uploadStatus, setUploadStatus] = useState('');
    const [newRoleName, setNewRoleName] = useState('');
    const [roleSearchText, setRoleSearchText] = useState('');
    const [isAddingNewRole, setIsAddingNewRole] = useState(false);
    const [roleLoading, setRoleLoading] = useState(false);

    // Load data on component mount
    useEffect(() => {
        loadUsers();
        loadOrganizations();
        loadRoles();
    }, []);

    // Load users from API
    const loadUsers = async () => {
        try {
            const data = await fetchUsers();
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

    // Handle form input changes
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value
        });
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
            organization_id: '',
            roles: []
        });
        setOpenAddDialog(true);
    };

    // Open edit user dialog
    const handleOpenEditDialog = (user) => {
        setSelectedUser(user);
        setFormData({
            username: user.username,
            email: user.email,
            password: '', // Don't populate password for security
            ui_role: user.ui_role,
            firstname: user.firstname || '',
            lastname: user.lastname || '',
            organization_id: user.organization_id || '',
            roles: user.roles || []
        });
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
        setSelectedUser(null);
        setFormData({
            username: '',
            email: '',
            password: '',
            ui_role: 'user',
            firstname: '',
            lastname: '',
            organization_id: '',
            roles: []
        });
    };

    // Add a new user
    const handleAddUser = async () => {
        try {
            await addUser(formData);
            loadUsers();
            handleCloseDialogs();
        } catch (error) {
            console.error('Failed to add user:', error);
            alert(`Failed to add user: ${error.message}`);
        }
    };

    // Update an existing user
    const handleUpdateUser = async () => {
        if (!selectedUser) return;
        
        try {
            await updateUser(selectedUser.id, formData);
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
        const startIndex = page * rowsPerPage;
        const endIndex = startIndex + rowsPerPage;
        const displayedUsers = users.slice(startIndex, endIndex);

        return (
            <TableContainer component={Paper} sx={{ boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)' }}>
                <Table>
                    <TableHead sx={{ backgroundColor: '#633394' }}>
                        <TableRow>
                            <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Username</TableCell>
                            <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Email</TableCell>
                            <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Name</TableCell>
                            <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Role</TableCell>
                            <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Organization</TableCell>
                            <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Roles</TableCell>
                            <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {displayedUsers.map((user) => (
                            <TableRow key={user.id} sx={{ '&:nth-of-type(odd)': { backgroundColor: theme.palette.action.hover } }}>
                                <TableCell>{user.username}</TableCell>
                                <TableCell>{user.email}</TableCell>
                                <TableCell>{`${user.firstname || ''} ${user.lastname || ''}`}</TableCell>
                                <TableCell>
                                    <Chip 
                                        label={user.ui_role} 
                                        color={
                                            user.ui_role === 'admin' ? 'primary' : 
                                            user.ui_role === 'manager' ? 'secondary' : 
                                            'default'
                                        }
                                        size="small"
                                    />
                                </TableCell>
                                <TableCell>{getOrganizationName(user.organization_id)}</TableCell>
                                <TableCell>
                                    {user.roles && user.roles.map((role, index) => (
                                        <Chip 
                                            key={index}
                                            label={`${getRoleName(role.role_id)} at ${getOrganizationName(role.organization_id)}`}
                                            size="small"
                                            sx={{ m: 0.5, backgroundColor: theme.palette.secondary.light }}
                                        />
                                    ))}
                                </TableCell>
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
                    sx={{ 
                        '.MuiTablePagination-selectLabel, .MuiTablePagination-displayedRows': {
                            margin: 0
                        }
                    }}
                />
            </TableContainer>
        );
    };

    // Render the add/edit user form
    const renderUserForm = (isEdit = false) => {
        return (
            <Box component="form" noValidate autoComplete="off">
                <Paper sx={{ p: 2, backgroundColor: '#f5f5f5', boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)', mb: 3 }}>
                    <Typography variant="h6" gutterBottom sx={{ color: '#633394', fontWeight: 'bold', mb: 2, textAlign: 'center' }}>
                        User Information
                    </Typography>
                    
                    <Box sx={{ maxWidth: '900px', mx: 'auto' }}>
                        <Grid container spacing={3}>
                            {/* Left Column */}
                            <Grid item xs={12} md={6}>
                                <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 2 }}>
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
                                    
                                    <FormControl fullWidth variant="outlined">
                                        <InputLabel>UI Role</InputLabel>
                                        <Select
                                            name="ui_role"
                                            value={formData.ui_role}
                                            onChange={handleInputChange}
                                            label="UI Role"
                                        >
                                            <MenuItem value="admin">Admin</MenuItem>
                                            <MenuItem value="root">Root</MenuItem>
                                            <MenuItem value="user">User</MenuItem>
                                            <MenuItem value="other">Other</MenuItem>
                                        </Select>
                                    </FormControl>
                                </Box>
                            </Grid>
                            
                            {/* Right Column */}
                            <Grid item xs={12} md={6}>
                                <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 2 }}>
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
                                    
                                    {!isEdit ? (
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
                                    ) : (
                                        <TextField
                                            fullWidth
                                            label="New Password (leave blank to keep current)"
                                            name="password"
                                            type="password"
                                            value={formData.password}
                                            onChange={handleInputChange}
                                            variant="outlined"
                                        />
                                    )}
                                    
                                    <FormControl 
                                        variant="outlined" 
                                        style={{ 
                                            width: '100%', 
                                            display: 'block'
                                        }}
                                    >
                                        <InputLabel>Organization</InputLabel>
                                        <Select
                                            name="organization_id"
                                            value={formData.organization_id}
                                            onChange={handleInputChange}
                                            label="Organization"
                                            style={{ width: '100%' }}
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
                            </Grid>
                        </Grid>
                    </Box>
                </Paper>
                
                {/* Organizational Roles Section - Only shown when UI role is 'other' */}
                {formData.ui_role === 'other' && (
                    <Paper sx={{ p: 2, backgroundColor: '#f5f5f5', boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)' }}>
                        <Typography variant="h6" gutterBottom sx={{ color: '#633394', fontWeight: 'bold', mb: 2, textAlign: 'center' }}>
                            Organizational Roles
                        </Typography>
                        <Box sx={{ maxWidth: '900px', mx: 'auto' }}>
                            <Grid container spacing={2}>
                                {organizations.map((org) => (
                                    <Grid item xs={12} key={org.id}>
                                        <Box sx={{ 
                                            p: 2, 
                                            border: '1px solid #e0e0e0', 
                                            borderRadius: 1,
                                            backgroundColor: 'white'
                                        }}>
                                            <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: '#633394', mb: 1, textAlign: 'center' }}>
                                                {org.name}
                                            </Typography>
                                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, justifyContent: 'center' }}>
                                                    {roles.map((role) => {
                                                        const isSelected = formData.roles.some(
                                                            r => r.organization_id === org.id && r.role_id === role.id
                                                        );
                                                        
                                                        return (
                                                            <Chip
                                                                key={role.id}
                                                                label={role.name}
                                                                onClick={(e) => handleRoleSelection(
                                                                    { target: { checked: !isSelected } },
                                                                    org.id,
                                                                    role.id
                                                                )}
                                                                color={isSelected ? "primary" : "default"}
                                                                variant={isSelected ? "filled" : "outlined"}
                                                                sx={{ cursor: 'pointer' }}
                                                            />
                                                        );
                                                    })}
                                                </Box>
                                                
                                                <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                                                    {!isAddingNewRole ? (
                                                        <Button 
                                                            variant="outlined" 
                                                            size="small"
                                                            onClick={() => setIsAddingNewRole(true)}
                                                        >
                                                            Add New Role
                                                        </Button>
                                                    ) : (
                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%', maxWidth: '500px' }}>
                                                            <TextField
                                                                size="small"
                                                                label="New Role Name"
                                                                value={newRoleName}
                                                                onChange={(e) => setNewRoleName(e.target.value)}
                                                                sx={{ flexGrow: 1 }}
                                                            />
                                                            <Button 
                                                                variant="contained" 
                                                                size="small"
                                                                onClick={handleAddNewRole}
                                                                disabled={!newRoleName.trim() || roleLoading}
                                                                sx={{ 
                                                                    backgroundColor: '#633394',
                                                                    '&:hover': { backgroundColor: '#7c52a5' }
                                                                }}
                                                            >
                                                                {roleLoading ? <CircularProgress size={24} /> : 'Add'}
                                                            </Button>
                                                            <Button 
                                                                variant="outlined" 
                                                                size="small"
                                                                onClick={() => {
                                                                    setIsAddingNewRole(false);
                                                                    setNewRoleName('');
                                                                }}
                                                            >
                                                                Cancel
                                                            </Button>
                                                        </Box>
                                                    )}
                                                </Box>
                                            </Box>
                                        </Box>
                                    </Grid>
                                ))}
                            </Grid>
                        </Box>
                    </Paper>
                )}
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
        </Box>
    );
}

export default UsersManagement;
