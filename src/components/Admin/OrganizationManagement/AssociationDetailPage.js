import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Container, Typography, Box, Paper,
    CircularProgress, Alert, Card, CardContent,
    Tabs, Tab, Button, Grid, Chip, Stack, IconButton,
    Dialog, DialogTitle, DialogContent, DialogActions, Autocomplete, TextField
} from '@mui/material';
import InternalHeader from '../../shared/Headers/InternalHeader';
import DataTable from '../../shared/DataTable/DataTable';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import BusinessIcon from '@mui/icons-material/Business';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import ArchiveIcon from '@mui/icons-material/Archive';
import StarIcon from '@mui/icons-material/Star';
import PersonIcon from '@mui/icons-material/Person';
import Avatar from '@mui/material/Avatar';
import {
    fetchOrganizations,
    deleteOrganization,
    fetchUsersByOrganization,
    fetchUsers,
    updateUserRoles,
} from '../../../services/UserManagement/UserManagementService';

// Color theme
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

function AssociationDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [association, setAssociation] = useState(null);
    const [linkedOrganizations, setLinkedOrganizations] = useState([]);
    const [users, setUsers] = useState([]);
    const [allUsers, setAllUsers] = useState([]); // All users from database for assignment
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState(0);
    
    // Manager assignment dialog state
    const [openManagerDialog, setOpenManagerDialog] = useState(false);
    const [selectedManagerIds, setSelectedManagerIds] = useState([]);
    const [savingManagers, setSavingManagers] = useState(false);

    // Load data
    useEffect(() => {
        loadData();
    }, [id]);

    const loadData = async () => {
        try {
            setLoading(true);
            
            // Fetch all organizations and all users
            const [orgsData, allUsersData] = await Promise.all([
                fetchOrganizations(),
                fetchUsers()
            ]);
            
            setAllUsers(allUsersData || []);
            
            // Find the association
            const currentAssoc = orgsData.find(o => o.id === parseInt(id));
            setAssociation(currentAssoc);

            if (!currentAssoc) {
                setLoading(false);
                return;
            }

            // Fetch users for this association
            try {
                const usersData = await fetchUsersByOrganization(id);
                setUsers(usersData || []);
            } catch (error) {
                console.error('Error fetching users:', error);
                setUsers([]);
            }

            // Find organizations that reference this association in their details fields
            const linked = orgsData.filter(org => {
                if (org.id === currentAssoc.id) return false;
                
                const denominationMatch = org.denomination_affiliation === currentAssoc.name;
                const accreditationMatch = org.accreditation_status_or_body === currentAssoc.name;
                const affiliationMatch = org.affiliation_validation === currentAssoc.name;
                const umbrellaMatch = org.umbrella_association_membership === currentAssoc.name;
                
                return denominationMatch || accreditationMatch || affiliationMatch || umbrellaMatch;
            });
            
            setLinkedOrganizations(linked);
        } catch (error) {
            console.error('Error loading data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenManagerDialog = () => {
        // Pre-select current association managers
        const currentManagerIds = users
            .filter(u => u.role === 'association' || (u.roles && u.roles.includes('association')))
            .map(u => u.id);
        setSelectedManagerIds(currentManagerIds);
        setOpenManagerDialog(true);
    };

    const handleCloseManagerDialog = () => {
        setOpenManagerDialog(false);
        setSelectedManagerIds([]);
    };

    const handleSaveManagers = async () => {
        try {
            setSavingManagers(true);
            
            console.log('🔄 Starting manager assignment for association:', id);
            console.log('📋 Selected manager IDs:', selectedManagerIds);
            
            // Get current association managers for this association
            const currentManagers = users.filter(u => 
                u.role === 'association' || (u.roles && u.roles.includes('association'))
            );
            
            console.log('👥 Current managers:', currentManagers.map(m => ({ id: m.id, name: `${m.firstname} ${m.lastname}`, roles: m.roles || [m.role] })));
            
            // Remove association role from users who are no longer selected
            for (const user of currentManagers) {
                if (!selectedManagerIds.includes(user.id)) {
                    console.log(`➖ Removing association role from user ${user.id}`);
                    const updatedRoles = (user.roles || [user.role]).filter(r => r !== 'association');
                    await updateUserRoles(user.id, { 
                        roles: updatedRoles.length > 0 ? updatedRoles : ['user'],
                        organization_id: parseInt(id)
                    });
                }
            }
            
            // Add association role to newly selected users OR update existing ones
            for (const userId of selectedManagerIds) {
                const user = allUsers.find(u => u.id === userId);
                if (user) {
                    const isCurrentManager = currentManagers.find(m => m.id === userId);
                    if (!isCurrentManager) {
                        console.log(`➕ Adding association role to user ${userId}`, { roles: ['association'], organization_id: parseInt(id) });
                        // Set only 'association' role for this association
                        await updateUserRoles(userId, { 
                            roles: ['association'],
                            organization_id: parseInt(id)
                        });
                    } else {
                        console.log(`✅ User ${userId} already has association role, skipping`);
                    }
                }
            }
            
            console.log('✅ Manager assignment complete');
            
            // Reload data
            await loadData();
            handleCloseManagerDialog();
        } catch (error) {
            console.error('❌ Error updating managers:', error);
            alert(`Failed to update managers: ${error.message}`);
        } finally {
            setSavingManagers(false);
        }
    };

    const handleBack = () => {
        navigate('/associations');
    };

    const handleTabChange = (event, newValue) => {
        setActiveTab(newValue);
    };

    const handleEditClick = () => {
        // Pass context so the edit page knows to return to association detail
        navigate(`/organizations/edit/${id}`, {
            state: {
                fromAssociation: true,
                associationId: id,
                associationName: association?.name
            }
        });
    };

    const handleDelete = async () => {
        if (window.confirm(`Are you sure you want to delete "${association?.name}"? This action cannot be undone.`)) {
            try {
                await deleteOrganization(id);
                navigate('/associations');
            } catch (error) {
                console.error('Failed to delete association:', error);
                alert(`Failed to delete: ${error.message}`);
            }
        }
    };

    const handleOrganizationClick = (org) => {
        // Pass the association context so the organization page can show a back link
        navigate(`/organization-management/${org.id}`, {
            state: { 
                fromAssociation: true,
                associationId: id,
                associationName: association?.name
            }
        });
    };

    // Helper function to get relationship type for an organization
    const getRelationshipType = (org) => {
        const types = [];
        if (org.denomination_affiliation === association?.name) types.push('Denomination');
        if (org.accreditation_status_or_body === association?.name) types.push('Accreditation');
        if (org.affiliation_validation === association?.name) types.push('Affiliation');
        if (org.umbrella_association_membership === association?.name) types.push('Umbrella Association');
        return types.join(', ') || 'Other';
    };

    const getLocation = (org) => {
        if (!org?.geo_location) return 'N/A';
        const { city, province, country } = org.geo_location;
        return [city, province, country].filter(Boolean).join(', ') || 'N/A';
    };

    const getOrgTypeLabel = (type) => {
        switch (type?.toLowerCase()) {
            case 'church': return 'Church';
            case 'institution': return 'Institution';
            case 'non_formal_organizations': return 'Non-formal Org';
            default: return type || 'Other';
        }
    };

    const getTypeChipColor = (type) => {
        switch (type?.toLowerCase()) {
            case 'church': return { bg: '#e8f5e9', color: '#2e7d32' };
            case 'institution': return { bg: '#e3f2fd', color: '#1565c0' };
            case 'non_formal_organizations': return { bg: '#fff3e0', color: '#ef6c00' };
            default: return { bg: colors.accentBg, color: colors.primary };
        }
    };

    // Sort value getter for DataTable - must be before early returns
    const sortValueGetter = (row, orderBy) => {
        if (orderBy === 'name') {
            return (row.name || '').toLowerCase();
        } else if (orderBy === 'type') {
            return (row.organization_type?.type || '').toLowerCase();
        } else if (orderBy === 'location') {
            return getLocation(row).toLowerCase();
        }
        return row[orderBy];
    };

    // Column definitions for DataTable - must be before early returns
    const tableColumns = useMemo(() => [
        {
            id: 'name',
            label: 'Organization',
            sortable: true,
            render: (org) => {
                const typeColors = getTypeChipColor(org.organization_type?.type);
                return (
                    <Box>
                        <Typography variant="body1" fontWeight="600">
                            {org.name}
                        </Typography>
                        <Chip
                            label={getOrgTypeLabel(org.organization_type?.type)}
                            size="small"
                            sx={{
                                mt: 0.5,
                                backgroundColor: typeColors.bg,
                                color: typeColors.color,
                                fontSize: '0.7rem',
                                height: 22
                            }}
                        />
                    </Box>
                );
            }
        },
        {
            id: 'relationship',
            label: 'Relationship Type',
            sortable: false,
            render: (org) => (
                <Chip
                    label={getRelationshipType(org)}
                    size="small"
                    sx={{
                        backgroundColor: colors.accentBg,
                        color: colors.primary,
                        fontSize: '0.75rem'
                    }}
                />
            )
        },
        {
            id: 'location',
            label: 'Location',
            sortable: true,
            render: (org) => (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <LocationOnIcon sx={{ color: colors.textSecondary, fontSize: 18 }} />
                    <Typography variant="body2" color="text.secondary">
                        {getLocation(org)}
                    </Typography>
                </Box>
            )
        },
        {
            id: 'chevron',
            label: '',
            width: 50,
            render: () => (
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                    <ChevronRightIcon sx={{ color: colors.textSecondary }} />
                </Box>
            )
        }
    ], [association]);

    if (loading) {
        return (
            <>
                <InternalHeader title="Loading..." />
                <Container maxWidth="xl" sx={{ py: 4 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                        <CircularProgress sx={{ color: colors.primary }} />
                    </Box>
                </Container>
            </>
        );
    }

    if (!association) {
        return (
            <>
                <InternalHeader title="Association Not Found" />
                <Container maxWidth="xl" sx={{ py: 4 }}>
                    <Alert severity="error">Association not found</Alert>
                    <Button
                        startIcon={<ArrowBackIcon />}
                        onClick={handleBack}
                        sx={{ mt: 2 }}
                    >
                        Back to Associations
                    </Button>
                </Container>
            </>
        );
    }

    return (
        <>
            <InternalHeader
                title={association.name}
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
                    <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button
                            variant="outlined"
                            startIcon={<EditIcon />}
                            onClick={handleEditClick}
                            sx={{
                                borderColor: colors.primary,
                                color: colors.primary,
                                '&:hover': {
                                    borderColor: colors.secondary,
                                    backgroundColor: colors.accentBg
                                }
                            }}
                        >
                            Edit
                        </Button>
                        <Button
                            variant="outlined"
                            startIcon={<DeleteIcon />}
                            onClick={handleDelete}
                            sx={{
                                borderColor: '#d32f2f',
                                color: '#d32f2f',
                                '&:hover': {
                                    borderColor: '#b71c1c',
                                    backgroundColor: '#ffebee'
                                }
                            }}
                        >
                            Delete
                        </Button>
                    </Box>
                }
            />
            <Container maxWidth="xl" sx={{ py: 4, backgroundColor: colors.background, minHeight: '100vh' }}>
                {/* Association Info Header */}
                <Box sx={{ mb: 3 }}>
                    <Stack direction="row" spacing={1} alignItems="center">
                        <Chip
                            label={getOrgTypeLabel(association.organization_type?.type)}
                            size="small"
                            sx={{
                                ...getTypeChipColor(association.organization_type?.type),
                                fontWeight: 600
                            }}
                        />
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <LocationOnIcon sx={{ fontSize: 16, color: colors.textSecondary }} />
                            <Typography variant="body2" color="text.secondary">
                                {getLocation(association)}
                            </Typography>
                        </Box>
                    </Stack>
                </Box>

                {/* Info Cards Grid - 30:70 ratio */}
                <Grid container spacing={3} sx={{ mb: 3 }}>
                    {/* Association Manager/Head Card - 30% */}
                    <Grid item xs={12} md={4}>
                        <Card sx={{ borderRadius: 3, boxShadow: '0 2px 8px rgba(0,0,0,0.08)', height: '100%' }}>
                            <CardContent>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <Typography variant="subtitle1" fontWeight="bold" color="text.primary">
                                            Association Manager/Head
                                        </Typography>
                                        <IconButton size="small" onClick={handleOpenManagerDialog}>
                                            <EditIcon fontSize="small" />
                                        </IconButton>
                                    </Box>
                                    <Chip
                                        label={users.filter(u => u.role === 'association' || (u.roles && u.roles.includes('association'))).length}
                                        size="small"
                                        sx={{ bgcolor: colors.accentBg, color: colors.primary, fontWeight: 'bold' }}
                                    />
                                </Box>
                                {users.filter(u => u.role === 'association' || (u.roles && u.roles.includes('association'))).length > 0 ? (
                                    users.filter(u => u.role === 'association' || (u.roles && u.roles.includes('association'))).map((manager, index) => (
                                        <Box key={manager.id} sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: index < users.filter(u => u.role === 'association' || (u.roles && u.roles.includes('association'))).length - 1 ? 1.5 : 0 }}>
                                            <Avatar sx={{ bgcolor: colors.accentBg, color: colors.primary, width: 36, height: 36 }}>
                                                <StarIcon fontSize="small" />
                                            </Avatar>
                                            <Box>
                                                <Typography variant="body2" fontWeight="medium" color="text.primary">
                                                    {manager.firstname} {manager.lastname}
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary">
                                                    {manager.email}
                                                </Typography>
                                            </Box>
                                        </Box>
                                    ))
                                ) : (
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                        <Avatar sx={{ bgcolor: colors.accentBg, color: colors.textSecondary, width: 36, height: 36 }}>
                                            <PersonIcon fontSize="small" />
                                        </Avatar>
                                        <Typography variant="body2" color="text.secondary">
                                            No manager assigned
                                        </Typography>
                                    </Box>
                                )}
                            </CardContent>
                        </Card>
                    </Grid>

                    {/* Association Details Card - 70% */}
                    <Grid item xs={12} md={8}>
                        <Card sx={{ borderRadius: 3, boxShadow: '0 2px 8px rgba(0,0,0,0.08)', height: '100%' }}>
                            <CardContent>
                                <Typography variant="h6" fontWeight="600" sx={{ mb: 2, color: colors.primary }}>
                                    Association Details
                                </Typography>
                                <Grid container spacing={2}>
                                    <Grid item xs={12} md={6}>
                                        <Typography variant="body2" color="text.secondary">Name</Typography>
                                        <Typography variant="body1" fontWeight="500">{association.name}</Typography>
                                    </Grid>
                                    <Grid item xs={12} md={6}>
                                        <Typography variant="body2" color="text.secondary">Type</Typography>
                                        <Typography variant="body1" fontWeight="500">
                                            {getOrgTypeLabel(association.organization_type?.type)}
                                        </Typography>
                                    </Grid>
                                    {association.website && (
                                        <Grid item xs={12} md={6}>
                                            <Typography variant="body2" color="text.secondary">Website</Typography>
                                            <Typography variant="body1" fontWeight="500">
                                                <a href={association.website} target="_blank" rel="noopener noreferrer" style={{ color: colors.primary }}>
                                                    {association.website}
                                                </a>
                                            </Typography>
                                        </Grid>
                                    )}
                                    <Grid item xs={12} md={6}>
                                        <Typography variant="body2" color="text.secondary">Location</Typography>
                                        <Typography variant="body1" fontWeight="500">{getLocation(association)}</Typography>
                                    </Grid>
                                </Grid>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>

                {/* Manager Assignment Dialog */}
                <Dialog open={openManagerDialog} onClose={handleCloseManagerDialog} maxWidth="sm" fullWidth>
                    <DialogTitle sx={{ backgroundColor: colors.primary, color: 'white' }}>
                        Assign Association Managers
                    </DialogTitle>
                    <DialogContent sx={{ mt: 2 }}>
                        <Autocomplete
                            multiple
                            options={allUsers}
                            getOptionLabel={(option) => `${option.firstname} ${option.lastname} (${option.email})`}
                            value={allUsers.filter(u => selectedManagerIds.includes(u.id))}
                            onChange={(event, newValue) => {
                                setSelectedManagerIds(newValue.map(u => u.id));
                            }}
                            renderInput={(params) => (
                                <TextField
                                    {...params}
                                    label="Select Managers"
                                    placeholder="Search users..."
                                    variant="outlined"
                                />
                            )}
                            renderOption={(props, option) => {
                                const { key, ...otherProps } = props;
                                return (
                                    <li key={key} {...otherProps}>
                                        <Box>
                                            <Typography variant="body2">
                                                {option.firstname} {option.lastname}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                {option.email}
                                            </Typography>
                                        </Box>
                                    </li>
                                );
                            }}
                            isOptionEqualToValue={(option, value) => option.id === value.id}
                        />
                        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                            Select one or more users to assign as managers for this association
                        </Typography>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={handleCloseManagerDialog} disabled={savingManagers}>
                            Cancel
                        </Button>
                        <Button
                            variant="contained"
                            onClick={handleSaveManagers}
                            disabled={savingManagers}
                            sx={{ backgroundColor: colors.primary, '&:hover': { backgroundColor: colors.secondary } }}
                        >
                            {savingManagers ? <CircularProgress size={20} color="inherit" /> : 'Save'}
                        </Button>
                    </DialogActions>
                </Dialog>

                {/* Tabs */}
                <Paper sx={{ mb: 3, borderRadius: 3, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
                    <Tabs
                        value={activeTab}
                        onChange={handleTabChange}
                        sx={{
                            borderBottom: 1,
                            borderColor: 'divider',
                            '& .MuiTab-root': { textTransform: 'none', fontWeight: 600 },
                            '& .Mui-selected': { color: colors.primary }
                        }}
                    >
                        <Tab
                            label={`Linked Organizations (${linkedOrganizations.length})`}
                            icon={<BusinessIcon />}
                            iconPosition="start"
                        />
                    </Tabs>
                </Paper>

                {/* Organizations Tab */}
                {activeTab === 0 && (
                    linkedOrganizations.length === 0 ? (
                        <Paper sx={{ p: 3, borderRadius: 3, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
                            <Alert severity="info">
                                No organizations are currently linked to this association.
                            </Alert>
                        </Paper>
                    ) : (
                        <DataTable
                            columns={tableColumns}
                            data={linkedOrganizations}
                            pagination
                            rowsPerPageOptions={[5, 10, 25, 50]}
                            defaultRowsPerPage={10}
                            defaultSortColumn="name"
                            defaultSortDirection="asc"
                            sortValueGetter={sortValueGetter}
                            onRowClick={(org) => handleOrganizationClick(org)}
                            emptyMessage="No organizations found"
                            hoverEffect
                        />
                    )
                )}
            </Container>
        </>
    );
}

export default AssociationDetailPage;
