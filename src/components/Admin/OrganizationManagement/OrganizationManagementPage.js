import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
    Container, Typography, Box, TextField, InputAdornment,
    Select, MenuItem, FormControl, IconButton, Button,
    CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle,
    Chip, Tooltip, Alert, Snackbar
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import FilterListIcon from '@mui/icons-material/FilterList';
import RadarIcon from '@mui/icons-material/Radar';
import PeopleIcon from '@mui/icons-material/People';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../shared/Navbar/Navbar';
import DataTable from '../../shared/DataTable/DataTable';
import SpiderChartPopup from '../../UserManagement/common/SpiderChartPopup';
import RefreshButton from '../../shared/RefreshButton/RefreshButton';
import {
    fetchOrganizations,
    fetchOrganizationTypes,
    fetchUsersByOrganization,
    deleteOrganization,
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
    headerGradient: '#FAFAFA',
};

// Define main organization types
const mainOrganizationTypes = ['church', 'Institution', 'Non_formal_organizations'];
const mainOrganizationTypeLabels = {
    church: 'Churches',
    Institution: 'Institutions',
    Non_formal_organizations: 'Non-Formal Organizations',
    // defensive in case older data uses a different casing
    non_formal_organizations: 'Non-Formal Organizations',
};

function OrganizationManagementPage() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [organizations, setOrganizations] = useState([]);
    const [organizationTypes, setOrganizationTypes] = useState([]);
    const [usersByOrg, setUsersByOrg] = useState({});

    // Bulk selection state
    const [selectedOrgIds, setSelectedOrgIds] = useState([]);
    const [openBulkDeleteDialog, setOpenBulkDeleteDialog] = useState(false);
    const [bulkDeleteLoading, setBulkDeleteLoading] = useState(false);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });

    // UI State
    const [searchQuery, setSearchQuery] = useState('');
    const [filterType, setFilterType] = useState('');

    // Spider Chart Popup states
    const [spiderChartOpen, setSpiderChartOpen] = useState(false);
    const [selectedOrgForChart, setSelectedOrgForChart] = useState(null);

    // Handler for opening spider chart popup
    const handleOpenSpiderChart = (e, org) => {
        e.stopPropagation(); // Prevent row click navigation
        setSelectedOrgForChart(org);
        setSpiderChartOpen(true);
    };

    const handleCloseSpiderChart = () => {
        setSpiderChartOpen(false);
        setSelectedOrgForChart(null);
    };

    // Load data
    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const orgsData = await fetchOrganizations();
            setOrganizations(orgsData || []);

            try {
                const typesData = await fetchOrganizationTypes();
                setOrganizationTypes(typesData || []);
            } catch (e) {
                console.error('Failed to fetch organization types:', e);
            }

            // Fetch users for each organization
            const usersMap = {};
            for (const org of (orgsData || [])) {
                try {
                    const users = await fetchUsersByOrganization(org.id);
                    usersMap[org.id] = users || [];
                } catch (e) {
                    usersMap[org.id] = [];
                }
            }
            setUsersByOrg(usersMap);
        } catch (error) {
            console.error('Failed to load data:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    // Filtered organizations (Only Main)
    const filteredOrganizations = useMemo(() => {
        return organizations.filter(org => {
            // Must be a main organization type
            const isMain = mainOrganizationTypes.includes(org.organization_type?.type);

            if (!isMain) return false;

            const matchesSearch = !searchQuery ||
                org.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                org.organization_type?.type?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                org.geo_location?.city?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                org.geo_location?.country?.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesType = !filterType || org.organization_type?.type === filterType;
            return matchesSearch && matchesType;
        });
    }, [organizations, searchQuery, filterType]);

    const handleOrganizationClick = (org) => {
        navigate(`/organization-management/${org.id}`);
    };

    const handleOpenAddPage = () => {
        navigate('/organizations/add');
    };

    // Bulk delete organizations
    const handleBulkDeleteOrganizations = async () => {
        setBulkDeleteLoading(true);
        let successCount = 0;
        let failCount = 0;
        for (const orgId of selectedOrgIds) {
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
        setSelectedOrgIds([]);
        loadData();
        setSnackbar({
            open: true,
            message: failCount > 0
                ? `Deleted ${successCount} organization(s). ${failCount} failed.`
                : `Successfully deleted ${successCount} organization(s).`,
            severity: failCount > 0 ? 'warning' : 'success'
        });
    };

    const getLocation = (org) => {
        if (!org.geo_location) return 'N/A';
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

    // Sort value getter for DataTable
    const sortValueGetter = useCallback((row, orderBy) => {
        if (orderBy === 'organisation') {
            return (row.name || '').toLowerCase();
        } else if (orderBy === 'location') {
            return getLocation(row).toLowerCase();
        }
        return row[orderBy];
    }, []);

    // Column definitions for DataTable
    const tableColumns = useMemo(() => [
        {
            id: 'organisation',
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
            id: 'users',
            label: 'Members',
            align: 'center',
            render: (org) => {
                const userCount = usersByOrg[org.id]?.length || 0;
                return (
                    <Box sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 0.5
                    }}>
                        <PeopleIcon sx={{ color: colors.primary, fontSize: 18 }} />
                        <Typography variant="body1" fontWeight="600" sx={{ color: colors.primary }}>
                            {userCount}
                        </Typography>
                    </Box>
                );
            }
        },
        {
            id: 'actions',
            label: '',
            width: 50,
            render: (org) => (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Tooltip title="View Analytics">
                        <IconButton
                            size="small"
                            onClick={(e) => handleOpenSpiderChart(e, org)}
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
                    <ChevronRightIcon sx={{ color: colors.textSecondary }} />
                </Box>
            )
        }
    ], [usersByOrg]);

    return (
        <>
            <Navbar />
            <Container maxWidth="xl" sx={{ py: 4, backgroundColor: colors.background, minHeight: '100vh' }}>
                {/* Header */}
                <Box sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    mb: 3,
                    flexWrap: 'wrap',
                    gap: 2
                }}>
                    <Typography variant="h4" fontWeight="bold" sx={{ color: colors.textPrimary }}>
                        Organizations ({filteredOrganizations.length})
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button
                            variant="contained"
                            startIcon={<AddIcon />}
                            onClick={handleOpenAddPage}
                            sx={{
                                backgroundColor: colors.primary,
                                borderRadius: 2,
                                textTransform: 'none',
                                px: 3,
                                '&:hover': { backgroundColor: colors.secondary }
                            }}
                        >
                            Add Organization
                        </Button>
                        <RefreshButton
                            onClick={loadData}
                            disabled={loading}
                            color={colors.primary}
                            hoverColor={colors.secondary}
                        />
                    </Box>
                </Box>

                {/* Search & Filter Bar */}
                <Box sx={{
                    mb: 3,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 2,
                    flexWrap: 'wrap'
                }}>
                    <TextField
                        placeholder="Search by name, type, or location..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        size="small"
                        sx={{
                            flex: 1,
                            minWidth: 250,
                            maxWidth: 400,
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
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <FormControl size="small" sx={{ minWidth: 180 }}>
                            <Select
                                value={filterType}
                                onChange={(e) => setFilterType(e.target.value)}
                                displayEmpty
                                sx={{
                                    backgroundColor: 'white',
                                    borderRadius: 2
                                }}
                                startAdornment={<FilterListIcon sx={{ mr: 1, color: colors.textSecondary }} />}
                            >
                                <MenuItem value="">All Organizations</MenuItem>
                                {mainOrganizationTypes.map(type => (
                                    <MenuItem key={type} value={type}>
                                        {mainOrganizationTypeLabels[type] || type}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Box>
                </Box>

                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                        <CircularProgress sx={{ color: colors.primary }} />
                    </Box>
                ) : (
                    <>
                        {/* Bulk Actions Bar */}
                        {selectedOrgIds.length > 0 && (
                            <Box sx={{
                                mb: 2, p: 1.5, display: 'flex', alignItems: 'center', gap: 2,
                                backgroundColor: colors.accentBg, borderRadius: 2,
                                border: `1px solid ${colors.primary}40`
                            }}>
                                <Chip label={`${selectedOrgIds.length} selected`} color="primary" sx={{ backgroundColor: colors.primary }} />
                                <Button
                                    variant="contained"
                                    size="small"
                                    startIcon={<DeleteIcon />}
                                    onClick={() => setOpenBulkDeleteDialog(true)}
                                    color="error"
                                >
                                    Delete ({selectedOrgIds.length})
                                </Button>
                                <Button variant="outlined" size="small" onClick={() => setSelectedOrgIds([])}
                                    sx={{ ml: 'auto', borderColor: colors.secondary, color: colors.secondary }}>
                                    Clear Selection
                                </Button>
                            </Box>
                        )}

                        {/* Main Organizations Section */}
                        <Box sx={{ mb: 2 }}>
                            <DataTable
                                columns={tableColumns}
                                data={filteredOrganizations}
                                selectable
                                selectedIds={selectedOrgIds}
                                onSelectionChange={setSelectedOrgIds}
                                pagination
                                rowsPerPageOptions={[5, 10, 25, 50]}
                                defaultRowsPerPage={10}
                                defaultSortColumn="organisation"
                                defaultSortDirection="asc"
                                sortValueGetter={sortValueGetter}
                                onRowClick={(org) => handleOrganizationClick(org)}
                                emptyMessage="No organizations found"
                                paperSx={{ mb: 4 }}
                                headerBg={colors.headerGradient}
                            />
                        </Box>
                    </>
                )}

                {/* Bulk Delete Dialog */}
                <Dialog open={openBulkDeleteDialog} onClose={() => !bulkDeleteLoading && setOpenBulkDeleteDialog(false)} maxWidth="sm" fullWidth>
                    <DialogTitle sx={{ backgroundColor: '#d32f2f', color: 'white' }}>
                        Delete {selectedOrgIds.length} Organization(s)
                    </DialogTitle>
                    <DialogContent sx={{ mt: 2 }}>
                        <Typography>
                            Are you sure you want to delete <strong>{selectedOrgIds.length}</strong> organization(s)?
                        </Typography>
                        <Alert severity="error" sx={{ mt: 2 }}>
                            This will permanently delete all selected organizations along with their survey templates, responses, user details, and role assignments. This action cannot be undone!
                        </Alert>
                        <Box sx={{ mt: 2, maxHeight: 200, overflowY: 'auto' }}>
                            {filteredOrganizations
                                .filter(o => selectedOrgIds.includes(o.id))
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
                    open={snackbar.open}
                    autoHideDuration={4000}
                    onClose={() => setSnackbar({ ...snackbar, open: false })}
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                >
                    <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity} variant="filled">
                        {snackbar.message}
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
            </Container>
        </>
    );
}

export default OrganizationManagementPage;
