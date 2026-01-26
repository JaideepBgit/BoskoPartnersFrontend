import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Container, Typography, Box, Paper, TextField, InputAdornment,
    Tabs, Tab, Table, TableBody, TableCell, TableContainer, TableHead,
    TableRow, IconButton, Button, Grid, Chip, Avatar, Drawer, Divider,
    CircularProgress, Alert, Card, CardContent
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import SearchIcon from '@mui/icons-material/Search';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ArchiveIcon from '@mui/icons-material/Archive';
import PersonIcon from '@mui/icons-material/Person';
import BusinessIcon from '@mui/icons-material/Business';
import Navbar from '../../shared/Navbar/Navbar';
import {
    fetchOrganizations,
    fetchUsersByOrganization,
    updateOrganization,
    deleteOrganization,
} from '../../../services/UserManagement/UserManagementService';

// Color theme
const colors = {
    primary: '#633394',
    secondary: '#967CB2',
    background: '#f8f9fa',
    cardBg: '#ffffff',
    accentBg: '#f3e5f5',
    borderColor: '#e0e0e0',
    textPrimary: '#212121',
    textSecondary: '#757575',
};

function OrganizationDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [organization, setOrganization] = useState(null);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState(0);
    const [searchQuery, setSearchQuery] = useState('');
    const [editDrawerOpen, setEditDrawerOpen] = useState(false);
    const [editTab, setEditTab] = useState(0);
    const [editFormData, setEditFormData] = useState({
        name: '',
        website: '',
        denomination_affiliation: '',
        accreditation_status_or_body: '',
        affiliation_validation: '',
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
        }
    });
    const [saving, setSaving] = useState(false);

    // Load organization data
    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const orgsData = await fetchOrganizations();
            const org = orgsData?.find(o => o.id === parseInt(id));
            if (org) {
                setOrganization(org);
                setEditFormData({
                    name: org.name || '',
                    website: org.website || '',
                    denomination_affiliation: org.denomination_affiliation || '',
                    accreditation_status_or_body: org.accreditation_status_or_body || '',
                    affiliation_validation: org.affiliation_validation || '',
                    geo_location: org.geo_location || {
                        continent: '',
                        region: '',
                        country: '',
                        province: '',
                        city: '',
                        town: '',
                        address_line1: '',
                        address_line2: '',
                        postal_code: '',
                    }
                });

                // Fetch users for this organization
                try {
                    const usersData = await fetchUsersByOrganization(org.id);
                    setUsers(usersData || []);
                } catch (e) {
                    console.error('Failed to fetch users:', e);
                    setUsers([]);
                }
            }
        } catch (error) {
            console.error('Failed to load organization:', error);
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const handleBack = () => {
        navigate('/organization-management');
    };

    const handleTabChange = (event, newValue) => {
        setActiveTab(newValue);
    };

    const handleEditClick = () => {
        setEditDrawerOpen(true);
    };

    const handleEditClose = () => {
        setEditDrawerOpen(false);
    };

    const handleEditFormChange = (field, value) => {
        if (field.startsWith('geo_location.')) {
            const geoField = field.replace('geo_location.', '');
            setEditFormData(prev => ({
                ...prev,
                geo_location: {
                    ...prev.geo_location,
                    [geoField]: value
                }
            }));
        } else {
            setEditFormData(prev => ({
                ...prev,
                [field]: value
            }));
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await updateOrganization(id, editFormData);
            await loadData();
            setEditDrawerOpen(false);
            alert('Organization updated successfully!');
        } catch (error) {
            console.error('Failed to update organization:', error);
            alert(`Failed to update: ${error.message}`);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (window.confirm(`Are you sure you want to delete "${organization?.name}"? This action cannot be undone.`)) {
            try {
                await deleteOrganization(id);
                navigate('/organization-management');
            } catch (error) {
                console.error('Failed to delete organization:', error);
                alert(`Failed to delete: ${error.message}`);
            }
        }
    };

    const filteredUsers = users.filter(user => {
        if (!searchQuery) return true;
        const search = searchQuery.toLowerCase();
        return (
            user.username?.toLowerCase().includes(search) ||
            user.email?.toLowerCase().includes(search) ||
            user.firstname?.toLowerCase().includes(search) ||
            user.lastname?.toLowerCase().includes(search)
        );
    });

    const getLocation = () => {
        if (!organization?.geo_location) return 'N/A';
        const { city, province, country } = organization.geo_location;
        return [city, province, country].filter(Boolean).join(', ') || 'N/A';
    };

    if (loading) {
        return (
            <>
                <Navbar />
                <Container maxWidth="xl" sx={{ py: 4 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
                        <CircularProgress sx={{ color: colors.primary }} />
                    </Box>
                </Container>
            </>
        );
    }

    if (!organization) {
        return (
            <>
                <Navbar />
                <Container maxWidth="xl" sx={{ py: 4 }}>
                    <Alert severity="error">Organization not found</Alert>
                    <Button onClick={handleBack} sx={{ mt: 2 }}>Go Back</Button>
                </Container>
            </>
        );
    }

    return (
        <>
            <Navbar />
            <Container maxWidth="xl" sx={{ py: 3, backgroundColor: colors.background, minHeight: '100vh' }}>
                {/* Header */}
                <Box sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    mb: 3
                }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <IconButton onClick={handleBack} sx={{ color: colors.primary }}>
                            <ArrowBackIcon />
                        </IconButton>
                        <Typography variant="h6" color="text.secondary">
                            {organization.name}
                        </Typography>
                    </Box>
                    <Button
                        variant="outlined"
                        startIcon={<ArchiveIcon />}
                        sx={{
                            borderColor: colors.primary,
                            color: colors.primary,
                            borderRadius: 2,
                            '&:hover': { borderColor: colors.secondary, color: colors.secondary }
                        }}
                    >
                        Archive
                    </Button>
                </Box>

                {/* Organization Title */}
                <Typography variant="h4" fontWeight="bold" sx={{ mb: 3, color: colors.textPrimary }}>
                    {organization.name}
                </Typography>

                {/* Info Cards */}
                <Grid container spacing={3} sx={{ mb: 3 }}>
                    {/* Account Holder Card */}
                    <Grid item xs={12} md={4}>
                        <Card sx={{
                            borderRadius: 3,
                            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                            height: '100%'
                        }}>
                            <CardContent>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                                    <Typography variant="subtitle1" fontWeight="bold" color="text.primary">
                                        Account Holder
                                    </Typography>
                                    <Button
                                        size="small"
                                        onClick={handleEditClick}
                                        sx={{ color: colors.primary, textTransform: 'none' }}
                                    >
                                        Edit
                                    </Button>
                                </Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                    <Avatar sx={{ bgcolor: colors.accentBg, color: colors.primary }}>
                                        <PersonIcon />
                                    </Avatar>
                                    <Box>
                                        <Typography variant="body2" color="text.secondary">
                                            {organization.primary_contact?.name || 'No primary contact set'}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            {organization.primary_contact?.email || ''}
                                        </Typography>
                                    </Box>
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>

                    {/* Organization Details Card */}
                    <Grid item xs={12} md={8}>
                        <Card sx={{
                            borderRadius: 3,
                            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                            height: '100%'
                        }}>
                            <CardContent>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                                    <Typography variant="subtitle1" fontWeight="bold" color="text.primary">
                                        Organization Details
                                    </Typography>
                                    <Button
                                        size="small"
                                        onClick={handleEditClick}
                                        sx={{ color: colors.primary, textTransform: 'none' }}
                                    >
                                        Edit
                                    </Button>
                                </Box>
                                <Grid container spacing={2}>
                                    <Grid item xs={12} sm={6}>
                                        <Typography variant="caption" color="text.secondary">Type</Typography>
                                        <Typography variant="body2">
                                            {organization.organization_type?.type || 'N/A'}
                                        </Typography>
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <Typography variant="caption" color="text.secondary">Location</Typography>
                                        <Typography variant="body2">{getLocation()}</Typography>
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <Typography variant="caption" color="text.secondary">Website</Typography>
                                        <Typography variant="body2">
                                            {organization.website || 'N/A'}
                                        </Typography>
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <Typography variant="caption" color="text.secondary">Users</Typography>
                                        <Typography variant="body2">{users.length}</Typography>
                                    </Grid>
                                </Grid>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>

                {/* Tabs */}
                <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
                    <Tabs
                        value={activeTab}
                        onChange={handleTabChange}
                        sx={{
                            '& .MuiTab-root': {
                                textTransform: 'none',
                                fontWeight: 500,
                                color: colors.textSecondary
                            },
                            '& .Mui-selected': { color: colors.primary },
                            '& .MuiTabs-indicator': { backgroundColor: colors.primary }
                        }}
                    >
                        <Tab label="Users" />
                        <Tab label="Reports" />
                        <Tab label="Surveys" />
                        <Tab label="Questions" />
                    </Tabs>
                </Box>

                {/* Search & Sorting */}
                <Paper sx={{
                    p: 2,
                    mb: 3,
                    borderRadius: 3,
                    backgroundColor: colors.accentBg,
                    border: 'none',
                    boxShadow: 'none'
                }}>
                    <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                        <TextField
                            placeholder="Search..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            size="small"
                            sx={{
                                width: 300,
                                '& .MuiOutlinedInput-root': {
                                    backgroundColor: 'white',
                                    borderRadius: 2
                                }
                            }}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <SearchIcon color="action" />
                                    </InputAdornment>
                                ),
                            }}
                        />
                    </Box>
                </Paper>

                {/* Tab Content */}
                <Paper sx={{
                    borderRadius: 3,
                    overflow: 'hidden',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                    minHeight: 300,
                    backgroundColor: colors.accentBg
                }}>
                    {activeTab === 0 && (
                        <Box sx={{ p: 3 }}>
                            {filteredUsers.length === 0 ? (
                                <Box sx={{ textAlign: 'center', py: 4 }}>
                                    <Typography color="text.secondary">
                                        No users found in this organization
                                    </Typography>
                                </Box>
                            ) : (
                                <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
                                    <Table>
                                        <TableHead sx={{ backgroundColor: colors.primary }}>
                                            <TableRow>
                                                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Name</TableCell>
                                                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Email</TableCell>
                                                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Role</TableCell>
                                                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Status</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {filteredUsers.map((user) => (
                                                <TableRow key={user.id} hover>
                                                    <TableCell>
                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                            <Avatar sx={{ width: 32, height: 32, bgcolor: colors.secondary }}>
                                                                {user.firstname?.[0]}{user.lastname?.[0]}
                                                            </Avatar>
                                                            {user.firstname} {user.lastname}
                                                        </Box>
                                                    </TableCell>
                                                    <TableCell>{user.email}</TableCell>
                                                    <TableCell>
                                                        <Chip
                                                            label={user.ui_role || 'User'}
                                                            size="small"
                                                            variant="outlined"
                                                        />
                                                    </TableCell>
                                                    <TableCell>
                                                        <Chip
                                                            label="Active"
                                                            size="small"
                                                            sx={{ bgcolor: '#4caf50', color: 'white' }}
                                                        />
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            )}
                        </Box>
                    )}

                    {activeTab === 1 && (
                        <Box sx={{ p: 4, textAlign: 'center' }}>
                            <Typography color="text.secondary">Reports coming soon...</Typography>
                        </Box>
                    )}

                    {activeTab === 2 && (
                        <Box sx={{ p: 4, textAlign: 'center' }}>
                            <Typography color="text.secondary">Surveys coming soon...</Typography>
                        </Box>
                    )}

                    {activeTab === 3 && (
                        <Box sx={{ p: 4, textAlign: 'center' }}>
                            <Typography color="text.secondary">Questions coming soon...</Typography>
                        </Box>
                    )}
                </Paper>

                {/* Edit Drawer */}
                <Drawer
                    anchor="right"
                    open={editDrawerOpen}
                    onClose={handleEditClose}
                    PaperProps={{
                        sx: { width: 400, p: 3 }
                    }}
                >
                    <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
                        Edit Organization
                    </Typography>

                    <Tabs
                        value={editTab}
                        onChange={(e, v) => setEditTab(v)}
                        sx={{
                            mb: 3,
                            '& .MuiTab-root': { textTransform: 'none' },
                            '& .Mui-selected': { color: colors.primary },
                            '& .MuiTabs-indicator': { backgroundColor: colors.primary }
                        }}
                    >
                        <Tab label="Details" />
                        <Tab label="Address" />
                    </Tabs>

                    {editTab === 0 && (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <TextField
                                label="Organization Name"
                                value={editFormData.name}
                                onChange={(e) => handleEditFormChange('name', e.target.value)}
                                fullWidth
                                size="small"
                            />
                            <TextField
                                label="Website"
                                value={editFormData.website}
                                onChange={(e) => handleEditFormChange('website', e.target.value)}
                                fullWidth
                                size="small"
                            />
                            <TextField
                                label="Denomination/Affiliation"
                                value={editFormData.denomination_affiliation}
                                onChange={(e) => handleEditFormChange('denomination_affiliation', e.target.value)}
                                fullWidth
                                size="small"
                            />
                            <TextField
                                label="Accreditation"
                                value={editFormData.accreditation_status_or_body}
                                onChange={(e) => handleEditFormChange('accreditation_status_or_body', e.target.value)}
                                fullWidth
                                size="small"
                            />
                        </Box>
                    )}

                    {editTab === 1 && (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <TextField
                                label="Address Line 1"
                                value={editFormData.geo_location?.address_line1 || ''}
                                onChange={(e) => handleEditFormChange('geo_location.address_line1', e.target.value)}
                                fullWidth
                                size="small"
                            />
                            <TextField
                                label="Address Line 2"
                                value={editFormData.geo_location?.address_line2 || ''}
                                onChange={(e) => handleEditFormChange('geo_location.address_line2', e.target.value)}
                                fullWidth
                                size="small"
                            />
                            <TextField
                                label="City"
                                value={editFormData.geo_location?.city || ''}
                                onChange={(e) => handleEditFormChange('geo_location.city', e.target.value)}
                                fullWidth
                                size="small"
                            />
                            <TextField
                                label="Province/State"
                                value={editFormData.geo_location?.province || ''}
                                onChange={(e) => handleEditFormChange('geo_location.province', e.target.value)}
                                fullWidth
                                size="small"
                            />
                            <TextField
                                label="Country"
                                value={editFormData.geo_location?.country || ''}
                                onChange={(e) => handleEditFormChange('geo_location.country', e.target.value)}
                                fullWidth
                                size="small"
                            />
                            <TextField
                                label="Postal Code"
                                value={editFormData.geo_location?.postal_code || ''}
                                onChange={(e) => handleEditFormChange('geo_location.postal_code', e.target.value)}
                                fullWidth
                                size="small"
                            />
                        </Box>
                    )}

                    <Box sx={{ display: 'flex', gap: 2, mt: 'auto', pt: 3 }}>
                        <Button
                            variant="outlined"
                            color="error"
                            onClick={handleDelete}
                            sx={{ flex: 1 }}
                        >
                            Delete
                        </Button>
                        <Button
                            variant="contained"
                            onClick={handleSave}
                            disabled={saving}
                            sx={{
                                flex: 1,
                                backgroundColor: colors.primary,
                                '&:hover': { backgroundColor: colors.secondary }
                            }}
                        >
                            {saving ? 'Saving...' : 'Save'}
                        </Button>
                    </Box>
                </Drawer>
            </Container>
        </>
    );
}

export default OrganizationDetailPage;
