import React, { useEffect, useState, useMemo } from 'react';
import {
    Container, Typography, Box, Button, Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, TablePagination, Card, CardContent, Dialog, DialogActions,
    DialogContent, DialogTitle, TextField, Select, MenuItem, FormControl, InputLabel,
    IconButton, Chip, Alert, CircularProgress, Tabs, Tab, Paper, Grid, Tooltip,
    InputAdornment, Snackbar
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import DownloadIcon from '@mui/icons-material/Download';
import SearchIcon from '@mui/icons-material/Search';
import RefreshIcon from '@mui/icons-material/Refresh';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import SupervisorAccountIcon from '@mui/icons-material/SupervisorAccount';
import SecurityIcon from '@mui/icons-material/Security';
import PeopleIcon from '@mui/icons-material/People';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import RadarIcon from '@mui/icons-material/Radar';
import { useNavigate } from 'react-router-dom';
import Navbar from '../shared/Navbar/Navbar';
import SpiderChartPopup from '../UserManagement/common/SpiderChartPopup';

// Color theme for root dashboard - using platform's purple color palette
const rootColors = {
    primary: '#633394',       // Primary purple from platform
    secondary: '#967CB2',     // Secondary lighter purple from platform
    accent: '#B39DDB',        // Accent purple (subtle)
    success: '#633394',       // Using primary purple for success consistency
    warning: '#967CB2',       // Using secondary purple for warnings
    error: '#633394',         // Using primary purple for destructive actions  
    background: '#FFFFFF',    // Background from platform
    text: '#212121',          // Text color
    headerBg: '#FAFAFA',      // Light purple for table header (from platform)
    cardBg: '#ffffff',        // Card background
    borderColor: '#e0e0e0',   // Border color
    highlightBg: '#f3e5f5',   // Light purple highlight background
};

// Role color mapping - consistent purple palette
const roleColors = {
    root: { bg: '#ede7f6', text: '#633394', label: 'Root' },
    admin: { bg: '#f3e5f5', text: '#7B1FA2', label: 'Admin' },
    manager: { bg: '#EDE7F6', text: '#5E35B1', label: 'Manager' },
    user: { bg: '#F3E5F5', text: '#967CB2', label: 'User' },
    other: { bg: '#ede7f6', text: '#633394', label: 'Other' },
    primary_contact: { bg: '#f3e5f5', text: '#7b1fa2', label: 'Primary Contact' },
    secondary_contact: { bg: '#ede7f6', text: '#633394', label: 'Secondary Contact' },
    head: { bg: '#f3e5f5', text: '#5E35B1', label: 'Head' },
};

function RootDashboard() {
    const navigate = useNavigate();

    // State for users data
    const [users, setUsers] = useState([]);
    const [organizations, setOrganizations] = useState([]);
    const [roles, setRoles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Pagination
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    // Filters
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState('');
    const [organizationFilter, setOrganizationFilter] = useState('');

    // Tabs
    const [activeTab, setActiveTab] = useState(0);

    // Dialogs
    const [openAddDialog, setOpenAddDialog] = useState(false);
    const [openEditDialog, setOpenEditDialog] = useState(false);
    const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
    const [openCredentialsDialog, setOpenCredentialsDialog] = useState(false);

    // Spider Chart Popup states
    const [spiderChartOpen, setSpiderChartOpen] = useState(false);
    const [selectedUserForChart, setSelectedUserForChart] = useState(null);

    // Handler for opening spider chart popup
    const handleOpenSpiderChart = (user) => {
        setSelectedUserForChart(user);
        setSpiderChartOpen(true);
    };

    const handleCloseSpiderChart = () => {
        setSpiderChartOpen(false);
        setSelectedUserForChart(null);
    };

    // Form data
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        role: 'admin',
        firstname: '',
        lastname: '',
        phone: '',
        organization_id: ''
    });
    const [selectedUser, setSelectedUser] = useState(null);
    const [showPassword, setShowPassword] = useState(false);

    // Credentials storage for CSV download
    const [createdCredentials, setCreatedCredentials] = useState([]);

    // Snackbar for notifications
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });

    // Dashboard stats
    const [stats, setStats] = useState({
        totalUsers: 0,
        adminUsers: 0,
        rootUsers: 0,
        regularUsers: 0,
        totalOrganizations: 0
    });

    // Check if current user is root
    useEffect(() => {
        const userRole = localStorage.getItem('userRole');
        if (userRole !== 'root' && userRole !== 'admin') {
            navigate('/home');
        }
    }, [navigate]);

    // Load data on component mount
    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        setError(null);
        try {
            // Fetch all users
            const usersResponse = await fetch('/api/users');
            const usersData = await usersResponse.json();
            setUsers(usersData);

            // Fetch organizations
            const orgsResponse = await fetch('/api/organizations');
            const orgsData = await orgsResponse.json();
            setOrganizations(orgsData);

            // Fetch roles
            const rolesResponse = await fetch('/api/roles');
            const rolesData = await rolesResponse.json();
            setRoles(rolesData);

            // Calculate stats
            const totalUsers = usersData.length;
            const adminUsers = usersData.filter(u => u.role === 'admin').length;
            const rootUsers = usersData.filter(u => u.role === 'root').length;
            const regularUsers = usersData.filter(u => u.role === 'user').length;

            setStats({
                totalUsers,
                adminUsers,
                rootUsers,
                regularUsers,
                totalOrganizations: orgsData.length
            });

        } catch (err) {
            console.error('Failed to load data:', err);
            setError('Failed to load data. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // Filter users based on search and filters
    const filteredUsers = useMemo(() => {
        return users.filter(user => {
            const matchesSearch =
                (user.username?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                (user.email?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                (user.firstname?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                (user.lastname?.toLowerCase() || '').includes(searchTerm.toLowerCase());

            const matchesRole = !roleFilter || user.role === roleFilter;
            const matchesOrg = !organizationFilter || user.organization_id?.toString() === organizationFilter;

            return matchesSearch && matchesRole && matchesOrg;
        });
    }, [users, searchTerm, roleFilter, organizationFilter]);

    // Admin/Root users only for the privileged tab
    const privilegedUsers = useMemo(() => {
        return users.filter(user => user.role === 'admin' || user.role === 'root');
    }, [users]);

    // Generate random password
    const generatePassword = () => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
        let password = '';
        for (let i = 0; i < 12; i++) {
            password += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return password;
    };

    // Handle form input changes
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    // Open add user dialog
    const handleOpenAddDialog = (defaultRole = 'admin') => {
        const generatedPassword = generatePassword();
        setFormData({
            username: '',
            email: '',
            password: generatedPassword,
            role: defaultRole,
            firstname: '',
            lastname: '',
            phone: '',
            organization_id: ''
        });
        setOpenAddDialog(true);
    };

    // Open edit dialog
    const handleOpenEditDialog = (user) => {
        setSelectedUser(user);
        setFormData({
            username: user.username || '',
            email: user.email || '',
            password: '',
            role: user.role || 'user',
            firstname: user.firstname || '',
            lastname: user.lastname || '',
            phone: user.phone || '',
            organization_id: user.organization_id?.toString() || ''
        });
        setOpenEditDialog(true);
    };

    // Open delete dialog
    const handleOpenDeleteDialog = (user) => {
        setSelectedUser(user);
        setOpenDeleteDialog(true);
    };

    // Close all dialogs
    const handleCloseDialogs = () => {
        setOpenAddDialog(false);
        setOpenEditDialog(false);
        setOpenDeleteDialog(false);
        setSelectedUser(null);
        setFormData({
            username: '',
            email: '',
            password: '',
            role: 'admin',
            firstname: '',
            lastname: '',
            phone: '',
            organization_id: ''
        });
    };

    // Add new user
    const handleAddUser = async () => {
        try {
            const response = await fetch('/api/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.error || 'Failed to create user');
            }

            const newUser = await response.json();

            // Store credentials for CSV download
            const credential = {
                username: formData.username,
                email: formData.email,
                password: formData.password,
                role: formData.role,
                firstname: formData.firstname,
                lastname: formData.lastname,
                created_at: new Date().toISOString()
            };
            setCreatedCredentials(prev => [...prev, credential]);

            setSnackbar({
                open: true,
                message: `User "${newUser.username}" created successfully!`,
                severity: 'success'
            });

            handleCloseDialogs();
            loadData();
        } catch (err) {
            console.error('Failed to add user:', err);
            setSnackbar({
                open: true,
                message: err.message || 'Failed to create user',
                severity: 'error'
            });
        }
    };

    // Update user
    const handleUpdateUser = async () => {
        if (!selectedUser) return;

        try {
            const updateData = { ...formData };
            // Don't send password if it's empty (user doesn't want to change it)
            if (!updateData.password) {
                delete updateData.password;
            }

            const response = await fetch(`/api/users/${selectedUser.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updateData)
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.error || 'Failed to update user');
            }

            setSnackbar({
                open: true,
                message: 'User updated successfully!',
                severity: 'success'
            });

            handleCloseDialogs();
            loadData();
        } catch (err) {
            console.error('Failed to update user:', err);
            setSnackbar({
                open: true,
                message: err.message || 'Failed to update user',
                severity: 'error'
            });
        }
    };

    // Delete user
    const handleDeleteUser = async () => {
        if (!selectedUser) return;

        try {
            const response = await fetch(`/api/users/${selectedUser.id}`, {
                method: 'DELETE'
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.error || 'Failed to delete user');
            }

            setSnackbar({
                open: true,
                message: 'User deleted successfully!',
                severity: 'success'
            });

            handleCloseDialogs();
            loadData();
        } catch (err) {
            console.error('Failed to delete user:', err);
            setSnackbar({
                open: true,
                message: err.message || 'Failed to delete user',
                severity: 'error'
            });
        }
    };

    // Download credentials as CSV
    const handleDownloadCSV = () => {
        if (createdCredentials.length === 0) {
            setSnackbar({
                open: true,
                message: 'No credentials to download. Create users first.',
                severity: 'warning'
            });
            return;
        }

        const headers = ['Username', 'Email', 'Password', 'Role', 'First Name', 'Last Name', 'Created At'];
        const csvContent = [
            headers.join(','),
            ...createdCredentials.map(cred =>
                [
                    cred.username,
                    cred.email,
                    cred.password,
                    cred.role,
                    cred.firstname,
                    cred.lastname,
                    cred.created_at
                ].map(field => `"${field || ''}"`).join(',')
            )
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `user_credentials_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        setSnackbar({
            open: true,
            message: 'Credentials downloaded successfully!',
            severity: 'success'
        });
    };

    // Copy password to clipboard
    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        setSnackbar({
            open: true,
            message: 'Copied to clipboard!',
            severity: 'info'
        });
    };

    // Get organization name by ID
    const getOrganizationName = (orgId) => {
        const org = organizations.find(o => o.id === orgId);
        return org?.name || '-';
    };

    // Render role chip
    const renderRoleChip = (role) => {
        const roleConfig = roleColors[role] || roleColors.other;
        return (
            <Chip
                label={roleConfig.label}
                size="small"
                sx={{
                    backgroundColor: roleConfig.bg,
                    color: roleConfig.text,
                    fontWeight: 600,
                    fontSize: '0.75rem'
                }}
            />
        );
    };

    if (loading) {
        return (
            <>
                <Navbar />
                <Container maxWidth="xl" sx={{ mt: 4, textAlign: 'center' }}>
                    <CircularProgress size={60} sx={{ color: rootColors.primary }} />
                    <Typography variant="h6" sx={{ mt: 2, color: rootColors.text }}>
                        Loading dashboard...
                    </Typography>
                </Container>
            </>
        );
    }

    return (
        <>
            <Navbar />
            <Container maxWidth="xl" sx={{ py: 4, minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
                {/* Header Section */}
                <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
                    <Box>
                        <Typography variant="h4" component="h1" sx={{
                            color: rootColors.text,
                            fontWeight: 700,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1
                        }}>
                            <SecurityIcon sx={{ fontSize: 40 }} />
                            Root Dashboard
                        </Typography>
                        <Typography variant="body1" sx={{ color: rootColors.secondary, mt: 1 }}>
                            System Administration & User Management
                        </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 2 }}>
                        <Button
                            variant="outlined"
                            startIcon={<RefreshIcon />}
                            onClick={loadData}
                            sx={{ borderColor: rootColors.primary, color: rootColors.primary }}
                        >
                            Refresh
                        </Button>
                        <Button
                            variant="contained"
                            startIcon={<DownloadIcon />}
                            onClick={handleDownloadCSV}
                            disabled={createdCredentials.length === 0}

                        >
                            Download Credentials CSV ({createdCredentials.length})
                        </Button>
                    </Box>
                </Box>

                {error && (
                    <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
                        {error}
                    </Alert>
                )}

                {/* Stats Cards */}
                <Grid container spacing={3} sx={{ mb: 4 }}>
                    <Grid item xs={12} sm={6} md={2.4}>
                        <Card sx={{
                            background: 'linear-gradient(135deg, #633394 0%, #7B1FA2 100%)',
                            color: 'white',
                            boxShadow: 3
                        }}>
                            <CardContent sx={{ textAlign: 'center' }}>
                                <PeopleIcon sx={{ fontSize: 40, mb: 1, opacity: 0.9 }} />
                                <Typography variant="h4" fontWeight="bold">{stats.totalUsers}</Typography>
                                <Typography variant="body2" sx={{ opacity: 0.9 }}>Total Users</Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item xs={12} sm={6} md={2.4}>
                        <Card sx={{
                            background: 'linear-gradient(135deg, #5E35B1 0%, #7E57C2 100%)',
                            color: 'white',
                            boxShadow: 3
                        }}>
                            <CardContent sx={{ textAlign: 'center' }}>
                                <SecurityIcon sx={{ fontSize: 40, mb: 1, opacity: 0.9 }} />
                                <Typography variant="h4" fontWeight="bold">{stats.rootUsers}</Typography>
                                <Typography variant="body2" sx={{ opacity: 0.9 }}>Root Users</Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item xs={12} sm={6} md={2.4}>
                        <Card sx={{
                            background: 'linear-gradient(135deg, #7B1FA2 0%, #9C27B0 100%)',
                            color: 'white',
                            boxShadow: 3
                        }}>
                            <CardContent sx={{ textAlign: 'center' }}>
                                <AdminPanelSettingsIcon sx={{ fontSize: 40, mb: 1, opacity: 0.9 }} />
                                <Typography variant="h4" fontWeight="bold">{stats.adminUsers}</Typography>
                                <Typography variant="body2" sx={{ opacity: 0.9 }}>Admin Users</Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item xs={12} sm={6} md={2.4}>
                        <Card sx={{
                            background: 'linear-gradient(135deg, #967CB2 0%, #B39DDB 100%)',
                            color: 'white',
                            boxShadow: 3
                        }}>
                            <CardContent sx={{ textAlign: 'center' }}>
                                <SupervisorAccountIcon sx={{ fontSize: 40, mb: 1, opacity: 0.9 }} />
                                <Typography variant="h4" fontWeight="bold">{stats.regularUsers}</Typography>
                                <Typography variant="body2" sx={{ opacity: 0.9 }}>Regular Users</Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item xs={12} sm={6} md={2.4}>
                        <Card sx={{
                            background: 'linear-gradient(135deg, #8E24AA 0%, #AB47BC 100%)',
                            color: 'white',
                            boxShadow: 3
                        }}>
                            <CardContent sx={{ textAlign: 'center' }}>
                                <SupervisorAccountIcon sx={{ fontSize: 40, mb: 1, opacity: 0.9 }} />
                                <Typography variant="h4" fontWeight="bold">{stats.totalOrganizations}</Typography>
                                <Typography variant="body2" sx={{ opacity: 0.9 }}>Organizations</Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>

                {/* Quick Actions */}
                <Paper sx={{ p: 3, mb: 4, boxShadow: 2 }}>
                    <Typography variant="h6" sx={{ mb: 2, color: rootColors.primary, fontWeight: 600 }}>
                        Quick Actions
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                        <Button
                            variant="contained"
                            startIcon={<PersonAddIcon />}
                            onClick={() => handleOpenAddDialog('root')}
                            sx={{
                                bgcolor: '#5E35B1',
                                '&:hover': { bgcolor: '#4527A0' }
                            }}
                        >
                            Create Root User
                        </Button>
                        <Button
                            variant="contained"
                            startIcon={<AdminPanelSettingsIcon />}
                            onClick={() => handleOpenAddDialog('admin')}
                            sx={{
                                bgcolor: rootColors.primary,
                                '&:hover': { bgcolor: '#4A2578' }
                            }}
                        >
                            Create Admin User
                        </Button>
                        <Button
                            variant="contained"
                            startIcon={<PersonAddIcon />}
                            onClick={() => handleOpenAddDialog('user')}
                            sx={{
                                bgcolor: rootColors.secondary,
                                '&:hover': { bgcolor: '#7B5C9E' }
                            }}
                        >
                            Create Regular User
                        </Button>
                        <Button
                            variant="outlined"
                            startIcon={<VisibilityIcon />}
                            onClick={() => setOpenCredentialsDialog(true)}
                            disabled={createdCredentials.length === 0}
                            sx={{
                                borderColor: rootColors.secondary,
                                color: rootColors.secondary
                            }}
                        >
                            View Created Credentials ({createdCredentials.length})
                        </Button>
                    </Box>
                </Paper>

                {/* Tabs Section */}
                <Paper sx={{ boxShadow: 2 }}>
                    <Tabs
                        value={activeTab}
                        onChange={(e, newValue) => setActiveTab(newValue)}
                        sx={{
                            borderBottom: 1,
                            borderColor: 'divider',
                            '& .MuiTab-root': {
                                fontWeight: 600,
                                color: rootColors.secondary,
                                '&.Mui-selected': {
                                    color: rootColors.primary
                                }
                            },
                            '& .MuiTabs-indicator': {
                                backgroundColor: rootColors.primary
                            }
                        }}
                    >
                        <Tab label="All Users" icon={<PeopleIcon />} iconPosition="start" />
                        <Tab label="Privileged Users (Admin/Root)" icon={<SecurityIcon />} iconPosition="start" />
                    </Tabs>

                    <Box sx={{ p: 3 }}>
                        {/* Search and Filters */}
                        <Box sx={{ mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                            <TextField
                                placeholder="Search users..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                size="small"
                                sx={{ minWidth: 250 }}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <SearchIcon sx={{ color: rootColors.secondary }} />
                                        </InputAdornment>
                                    )
                                }}
                            />
                            <FormControl size="small" sx={{ minWidth: 150 }}>
                                <InputLabel>Role</InputLabel>
                                <Select
                                    value={roleFilter}
                                    label="Role"
                                    onChange={(e) => setRoleFilter(e.target.value)}
                                >
                                    <MenuItem value="">All Roles</MenuItem>
                                    <MenuItem value="root">Root</MenuItem>
                                    <MenuItem value="admin">Admin</MenuItem>
                                    <MenuItem value="manager">Manager</MenuItem>
                                    <MenuItem value="user">User</MenuItem>
                                    <MenuItem value="other">Other</MenuItem>
                                    <MenuItem value="primary_contact">Primary Contact</MenuItem>
                                    <MenuItem value="secondary_contact">Secondary Contact</MenuItem>
                                    <MenuItem value="head">Head</MenuItem>
                                </Select>
                            </FormControl>
                            <FormControl size="small" sx={{ minWidth: 200 }}>
                                <InputLabel>Organization</InputLabel>
                                <Select
                                    value={organizationFilter}
                                    label="Organization"
                                    onChange={(e) => setOrganizationFilter(e.target.value)}
                                >
                                    <MenuItem value="">All Organizations</MenuItem>
                                    {organizations.map(org => (
                                        <MenuItem key={org.id} value={org.id.toString()}>
                                            {org.name}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Box>

                        {/* Users Table */}
                        <TableContainer>
                            <Table>
                                <TableHead>
                                    <TableRow sx={{ backgroundColor: rootColors.headerBg }}>
                                        <TableCell sx={{ fontWeight: 700, color: '#212121', fontSize: '0.75rem' }}>Username</TableCell>
                                        <TableCell sx={{ fontWeight: 700, color: '#212121', fontSize: '0.75rem' }}>Name</TableCell>
                                        <TableCell sx={{ fontWeight: 700, color: '#212121', fontSize: '0.75rem' }}>Email</TableCell>
                                        <TableCell sx={{ fontWeight: 700, color: '#212121', fontSize: '0.75rem' }}>Role</TableCell>
                                        <TableCell sx={{ fontWeight: 700, color: '#212121', fontSize: '0.75rem' }}>Organization</TableCell>
                                        <TableCell sx={{ fontWeight: 700, color: '#212121', fontSize: '0.75rem' }}>Created</TableCell>
                                        <TableCell sx={{ fontWeight: 700, textAlign: 'center', color: '#212121', fontSize: '0.75rem' }}>Actions</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {(activeTab === 0 ? filteredUsers : privilegedUsers)
                                        .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                                        .map((user) => (
                                            <TableRow
                                                key={user.id}
                                                sx={{
                                                    '&:hover': { backgroundColor: '#f5f5f5' },
                                                    ...(user.role === 'root' && { backgroundColor: rootColors.highlightBg })
                                                }}
                                            >
                                                <TableCell sx={{ fontWeight: 500 }}>{user.username}</TableCell>
                                                <TableCell>
                                                    {user.firstname || user.lastname
                                                        ? `${user.firstname || ''} ${user.lastname || ''}`.trim()
                                                        : '-'}
                                                </TableCell>
                                                <TableCell>{user.email}</TableCell>
                                                <TableCell>{renderRoleChip(user.role)}</TableCell>
                                                <TableCell>{getOrganizationName(user.organization_id)}</TableCell>
                                                <TableCell>
                                                    {user.created_at
                                                        ? new Date(user.created_at).toLocaleDateString()
                                                        : '-'}
                                                </TableCell>
                                                <TableCell sx={{ textAlign: 'center' }}>
                                                    <Tooltip title="View Analytics">
                                                        <IconButton
                                                            size="small"
                                                            onClick={() => handleOpenSpiderChart(user)}
                                                            sx={{
                                                                color: '#633394',
                                                                '&:hover': {
                                                                    backgroundColor: 'rgba(99, 51, 148, 0.1)',
                                                                    transform: 'scale(1.1)'
                                                                },
                                                                transition: 'all 0.2s ease'
                                                            }}
                                                        >
                                                            <RadarIcon fontSize="small" />
                                                        </IconButton>
                                                    </Tooltip>
                                                    <Tooltip title="Edit User">
                                                        <IconButton
                                                            size="small"
                                                            onClick={() => handleOpenEditDialog(user)}
                                                            sx={{ color: rootColors.primary }}
                                                        >
                                                            <EditIcon fontSize="small" />
                                                        </IconButton>
                                                    </Tooltip>
                                                    <Tooltip title="Delete User">
                                                        <IconButton
                                                            size="small"
                                                            onClick={() => handleOpenDeleteDialog(user)}
                                                            sx={{ color: rootColors.error }}
                                                        >
                                                            <DeleteIcon fontSize="small" />
                                                        </IconButton>
                                                    </Tooltip>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                        <TablePagination
                            component="div"
                            count={activeTab === 0 ? filteredUsers.length : privilegedUsers.length}
                            page={page}
                            onPageChange={(e, newPage) => setPage(newPage)}
                            rowsPerPage={rowsPerPage}
                            onRowsPerPageChange={(e) => {
                                setRowsPerPage(parseInt(e.target.value, 10));
                                setPage(0);
                            }}
                            rowsPerPageOptions={[5, 10, 25, 50]}
                        />
                    </Box>
                </Paper>

                {/* Add User Dialog */}
                <Dialog open={openAddDialog} onClose={handleCloseDialogs} maxWidth="sm" fullWidth>
                    <DialogTitle sx={{ bgcolor: rootColors.headerBg, color: rootColors.primary, fontWeight: 600 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <PersonAddIcon />
                            Create New User
                        </Box>
                    </DialogTitle>
                    <DialogContent sx={{ mt: 2 }}>
                        <Grid container spacing={2} sx={{ mt: 0.5 }}>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    label="First Name"
                                    name="firstname"
                                    value={formData.firstname}
                                    onChange={handleInputChange}
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    label="Last Name"
                                    name="lastname"
                                    value={formData.lastname}
                                    onChange={handleInputChange}
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    required
                                    label="Username"
                                    name="username"
                                    value={formData.username}
                                    onChange={handleInputChange}
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    required
                                    label="Email"
                                    name="email"
                                    type="email"
                                    value={formData.email}
                                    onChange={handleInputChange}
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    required
                                    label="Password"
                                    name="password"
                                    type={showPassword ? 'text' : 'password'}
                                    value={formData.password}
                                    onChange={handleInputChange}
                                    InputProps={{
                                        endAdornment: (
                                            <InputAdornment position="end">
                                                <IconButton onClick={() => setShowPassword(!showPassword)}>
                                                    {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                                                </IconButton>
                                                <Tooltip title="Copy Password">
                                                    <IconButton onClick={() => copyToClipboard(formData.password)}>
                                                        <ContentCopyIcon />
                                                    </IconButton>
                                                </Tooltip>
                                            </InputAdornment>
                                        )
                                    }}
                                    helperText="Auto-generated password. Copy it before saving!"
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <FormControl fullWidth required>
                                    <InputLabel>Role</InputLabel>
                                    <Select
                                        name="role"
                                        value={formData.role}
                                        label="Role"
                                        onChange={handleInputChange}
                                    >
                                        <MenuItem value="root">Root</MenuItem>
                                        <MenuItem value="admin">Admin</MenuItem>
                                        <MenuItem value="manager">Manager</MenuItem>
                                        <MenuItem value="user">User</MenuItem>
                                        <MenuItem value="other">Other</MenuItem>
                                        <MenuItem value="primary_contact">Primary Contact</MenuItem>
                                        <MenuItem value="secondary_contact">Secondary Contact</MenuItem>
                                        <MenuItem value="head">Head</MenuItem>
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <FormControl fullWidth>
                                    <InputLabel>Organization</InputLabel>
                                    <Select
                                        name="organization_id"
                                        value={formData.organization_id}
                                        label="Organization"
                                        onChange={handleInputChange}
                                    >
                                        <MenuItem value="">None</MenuItem>
                                        {organizations.map(org => (
                                            <MenuItem key={org.id} value={org.id.toString()}>
                                                {org.name}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    label="Phone"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleInputChange}
                                />
                            </Grid>
                        </Grid>
                    </DialogContent>
                    <DialogActions sx={{ p: 3 }}>
                        <Button onClick={handleCloseDialogs} sx={{ color: rootColors.secondary }}>
                            Cancel
                        </Button>
                        <Button
                            variant="contained"
                            onClick={handleAddUser}
                            disabled={!formData.username || !formData.email || !formData.password}
                            sx={{ bgcolor: rootColors.primary }}
                        >
                            Create User
                        </Button>
                    </DialogActions>
                </Dialog>

                {/* Edit User Dialog */}
                <Dialog open={openEditDialog} onClose={handleCloseDialogs} maxWidth="sm" fullWidth>
                    <DialogTitle sx={{ bgcolor: rootColors.headerBg, color: rootColors.primary, fontWeight: 600 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <EditIcon />
                            Edit User: {selectedUser?.username}
                        </Box>
                    </DialogTitle>
                    <DialogContent sx={{ mt: 2 }}>
                        <Grid container spacing={2} sx={{ mt: 0.5 }}>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    label="First Name"
                                    name="firstname"
                                    value={formData.firstname}
                                    onChange={handleInputChange}
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    label="Last Name"
                                    name="lastname"
                                    value={formData.lastname}
                                    onChange={handleInputChange}
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    required
                                    label="Username"
                                    name="username"
                                    value={formData.username}
                                    onChange={handleInputChange}
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    required
                                    label="Email"
                                    name="email"
                                    type="email"
                                    value={formData.email}
                                    onChange={handleInputChange}
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    label="New Password (leave empty to keep current)"
                                    name="password"
                                    type={showPassword ? 'text' : 'password'}
                                    value={formData.password}
                                    onChange={handleInputChange}
                                    InputProps={{
                                        endAdornment: (
                                            <InputAdornment position="end">
                                                <IconButton onClick={() => setShowPassword(!showPassword)}>
                                                    {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                                                </IconButton>
                                            </InputAdornment>
                                        )
                                    }}
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <FormControl fullWidth required>
                                    <InputLabel>Role</InputLabel>
                                    <Select
                                        name="role"
                                        value={formData.role}
                                        label="Role"
                                        onChange={handleInputChange}
                                    >
                                        <MenuItem value="root">Root</MenuItem>
                                        <MenuItem value="admin">Admin</MenuItem>
                                        <MenuItem value="manager">Manager</MenuItem>
                                        <MenuItem value="user">User</MenuItem>
                                        <MenuItem value="other">Other</MenuItem>
                                        <MenuItem value="primary_contact">Primary Contact</MenuItem>
                                        <MenuItem value="secondary_contact">Secondary Contact</MenuItem>
                                        <MenuItem value="head">Head</MenuItem>
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <FormControl fullWidth>
                                    <InputLabel>Organization</InputLabel>
                                    <Select
                                        name="organization_id"
                                        value={formData.organization_id}
                                        label="Organization"
                                        onChange={handleInputChange}
                                    >
                                        <MenuItem value="">None</MenuItem>
                                        {organizations.map(org => (
                                            <MenuItem key={org.id} value={org.id.toString()}>
                                                {org.name}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    label="Phone"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleInputChange}
                                />
                            </Grid>
                        </Grid>
                    </DialogContent>
                    <DialogActions sx={{ p: 3 }}>
                        <Button onClick={handleCloseDialogs} sx={{ color: rootColors.secondary }}>
                            Cancel
                        </Button>
                        <Button
                            variant="contained"
                            onClick={handleUpdateUser}
                            disabled={!formData.username || !formData.email}
                            sx={{ bgcolor: rootColors.primary }}
                        >
                            Update User
                        </Button>
                    </DialogActions>
                </Dialog>

                {/* Delete Confirmation Dialog */}
                <Dialog open={openDeleteDialog} onClose={handleCloseDialogs}>
                    <DialogTitle sx={{ color: rootColors.error }}>Confirm Delete</DialogTitle>
                    <DialogContent>
                        <Typography>
                            Are you sure you want to delete user <strong>{selectedUser?.username}</strong>?
                        </Typography>
                        <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                            This action cannot be undone.
                        </Typography>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={handleCloseDialogs}>Cancel</Button>
                        <Button
                            variant="contained"
                            onClick={handleDeleteUser}
                            sx={{ bgcolor: rootColors.primary, '&:hover': { bgcolor: '#4A2578' } }}
                        >
                            Delete
                        </Button>
                    </DialogActions>
                </Dialog>

                {/* View Created Credentials Dialog */}
                <Dialog open={openCredentialsDialog} onClose={() => setOpenCredentialsDialog(false)} maxWidth="md" fullWidth>
                    <DialogTitle sx={{ bgcolor: rootColors.headerBg, color: rootColors.primary, fontWeight: 600 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span>Created User Credentials</span>
                            <Button
                                variant="contained"
                                startIcon={<DownloadIcon />}
                                onClick={handleDownloadCSV}
                                size="small"
                                sx={{ bgcolor: rootColors.success }}
                            >
                                Download CSV
                            </Button>
                        </Box>
                    </DialogTitle>
                    <DialogContent sx={{ mt: 2 }}>
                        {createdCredentials.length === 0 ? (
                            <Typography color="textSecondary" sx={{ textAlign: 'center', py: 4 }}>
                                No credentials created yet. Create users to see their credentials here.
                            </Typography>
                        ) : (
                            <TableContainer>
                                <Table size="small">
                                    <TableHead>
                                        <TableRow sx={{ backgroundColor: rootColors.headerBg }}>
                                            <TableCell sx={{ fontWeight: 600, color: '#212121' }}>Username</TableCell>
                                            <TableCell sx={{ fontWeight: 600, color: '#212121' }}>Email</TableCell>
                                            <TableCell sx={{ fontWeight: 600, color: '#212121' }}>Password</TableCell>
                                            <TableCell sx={{ fontWeight: 600, color: '#212121' }}>Role</TableCell>
                                            <TableCell sx={{ fontWeight: 600, color: '#212121' }}>Created</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {createdCredentials.map((cred, index) => (
                                            <TableRow key={index}>
                                                <TableCell>{cred.username}</TableCell>
                                                <TableCell>{cred.email}</TableCell>
                                                <TableCell>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                        <code>{cred.password}</code>
                                                        <Tooltip title="Copy">
                                                            <IconButton
                                                                size="small"
                                                                onClick={() => copyToClipboard(cred.password)}
                                                            >
                                                                <ContentCopyIcon fontSize="small" />
                                                            </IconButton>
                                                        </Tooltip>
                                                    </Box>
                                                </TableCell>
                                                <TableCell>{renderRoleChip(cred.role)}</TableCell>
                                                <TableCell>
                                                    {new Date(cred.created_at).toLocaleString()}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        )}
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setOpenCredentialsDialog(false)}>Close</Button>
                    </DialogActions>
                </Dialog>

                {/* Snackbar for notifications */}
                <Snackbar
                    open={snackbar.open}
                    autoHideDuration={4000}
                    onClose={() => setSnackbar({ ...snackbar, open: false })}
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                >
                    <Alert
                        onClose={() => setSnackbar({ ...snackbar, open: false })}
                        severity={snackbar.severity}
                        variant="filled"
                    >
                        {snackbar.message}
                    </Alert>
                </Snackbar>

                {/* Spider Chart Popup */}
                <SpiderChartPopup
                    open={spiderChartOpen}
                    onClose={handleCloseSpiderChart}
                    entityType="user"
                    entityData={selectedUserForChart}
                    entityId={selectedUserForChart?.id}
                    entityName={selectedUserForChart ? `${selectedUserForChart.firstname || ''} ${selectedUserForChart.lastname || selectedUserForChart.username || ''}`.trim() : ''}
                />
            </Container >
        </>
    );
}

export default RootDashboard;
