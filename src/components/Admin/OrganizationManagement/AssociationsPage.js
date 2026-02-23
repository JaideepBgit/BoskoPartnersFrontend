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
import { useNavigate } from 'react-router-dom';
import Navbar from '../../shared/Navbar/Navbar';
import DataTable from '../../shared/DataTable/DataTable';
import RefreshButton from '../../shared/RefreshButton/RefreshButton';
import {
    fetchOrganizations,
    fetchOrganizationTypes,
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
    headerGradient: '#b39ddb',
};

// Define main organization types (to exclude)
const mainOrganizationTypes = ['church', 'Institution', 'Non_formal_organizations'];
const associationTypeOptions = [
    { value: 'accrediting_body', label: 'Accrediting Body' },
    { value: 'affiliation', label: 'Affiliation' },
    { value: 'denomination', label: 'Denomination' },
    { value: 'other', label: 'Other' },
    { value: 'umbrella_association_membership', label: 'Umbrella Association Membership' },
    { value: 'validation', label: 'Validation' },
];

function AssociationsPage() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [organizations, setOrganizations] = useState([]);
    const [organizationTypes, setOrganizationTypes] = useState([]);

    // Bulk selection state
    const [selectedAssocIds, setSelectedAssocIds] = useState([]);
    const [openBulkDeleteDialog, setOpenBulkDeleteDialog] = useState(false);
    const [bulkDeleteLoading, setBulkDeleteLoading] = useState(false);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });

    // UI State
    const [searchQuery, setSearchQuery] = useState('');
    const [filterType, setFilterType] = useState('');

    const getLocation = useCallback((org) => {
        if (!org.geo_location) return 'N/A';
        const { city, province, country } = org.geo_location;
        return [city, province, country].filter(Boolean).join(', ') || 'N/A';
    }, []);

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
        } catch (error) {
            console.error('Failed to load data:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    // Filtered organizations (Only Associations/Related)
    const filteredOrganizations = useMemo(() => {
        const normalizeOrgType = (t) =>
            (t || '')
                .toString()
                .trim()
                .toLowerCase()
                .replace(/\s+/g, '_');

        return organizations.filter(org => {
            // Must NOT be a main organization type
            const isAssociation = !mainOrganizationTypes.includes(org.organization_type?.type);

            if (!isAssociation) return false;

            const matchesSearch = !searchQuery ||
                org.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                org.organization_type?.type?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                org.geo_location?.city?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                org.geo_location?.country?.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesType =
                !filterType ||
                normalizeOrgType(org.organization_type?.type) === normalizeOrgType(filterType);
            return matchesSearch && matchesType;
        });
    }, [organizations, searchQuery, filterType]);

    const handleOrganizationClick = (org) => {
        navigate(`/association-management/${org.id}`);
    };

    const handleOpenAddPage = () => {
        navigate('/denominations/add');
    };

    // Bulk delete associations
    const handleBulkDeleteAssociations = async () => {
        setBulkDeleteLoading(true);
        let successCount = 0;
        let failCount = 0;
        for (const orgId of selectedAssocIds) {
            try {
                await deleteOrganization(orgId);
                successCount++;
            } catch (err) {
                failCount++;
                console.error(`Failed to delete association ${orgId}:`, err);
            }
        }
        setBulkDeleteLoading(false);
        setOpenBulkDeleteDialog(false);
        setSelectedAssocIds([]);
        loadData();
        setSnackbar({
            open: true,
            message: failCount > 0
                ? `Deleted ${successCount} association(s). ${failCount} failed.`
                : `Successfully deleted ${successCount} association(s).`,
            severity: failCount > 0 ? 'warning' : 'success'
        });
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

    // Compute linked organization counts per association
    const linkedOrgCounts = useMemo(() => {
        const counts = {};
        const allOrgs = organizations;
        // For each association, count how many orgs reference it by name
        filteredOrganizations.forEach(assoc => {
            counts[assoc.id] = allOrgs.filter(org => {
                if (org.id === assoc.id) return false;
                return (
                    org.denomination_affiliation === assoc.name ||
                    org.accreditation_status_or_body === assoc.name ||
                    org.affiliation_validation === assoc.name ||
                    org.umbrella_association_membership === assoc.name
                );
            }).length;
        });
        return counts;
    }, [organizations, filteredOrganizations]);

    // Sort value getter for DataTable
    const sortValueGetter = useCallback((row, orderBy) => {
        if (orderBy === 'organisation') {
            return (row.name || '').toLowerCase();
        } else if (orderBy === 'associationType') {
            return (row.organization_type?.type || '').toLowerCase();
        } else if (orderBy === 'orgCount') {
            return linkedOrgCounts[row.id] || 0;
        } else if (orderBy === 'location') {
            return getLocation(row).toLowerCase();
        }
        return row[orderBy];
    }, [getLocation, linkedOrgCounts]);

    // Column definitions for DataTable
    const tableColumns = useMemo(() => [
        {
            id: 'organisation',
            label: 'Denomination Name',
            sortable: true,
            render: (org) => (
                <Typography variant="body1" fontWeight="600">
                    {org.name}
                </Typography>
            )
        },
        {
            id: 'associationType',
            label: 'Association Type',
            sortable: true,
            render: (org) => {
                const typeColors = getTypeChipColor(org.organization_type?.type);
                return (
                    <Chip
                        label={getOrgTypeLabel(org.organization_type?.type)}
                        size="small"
                        sx={{
                            backgroundColor: typeColors.bg,
                            color: typeColors.color,
                            fontSize: '0.75rem',
                            height: 24
                        }}
                    />
                );
            }
        },
        {
            id: 'orgCount',
            label: 'Organizations',
            sortable: true,
            render: (org) => (
                <Typography variant="body2" fontWeight="500">
                    {linkedOrgCounts[org.id] || 0}
                </Typography>
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
    ], [linkedOrgCounts]);

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
                        Denominations ({filteredOrganizations.length})
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
                            Add Association
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
                                <MenuItem value="">All Association Types</MenuItem>
                                {associationTypeOptions.map((opt) => (
                                    <MenuItem key={opt.value} value={opt.value}>
                                        {opt.label}
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
                    <Box>
                        {/* Bulk Actions Bar */}
                        {selectedAssocIds.length > 0 && (
                            <Box sx={{
                                mb: 2, p: 1.5, display: 'flex', alignItems: 'center', gap: 2,
                                backgroundColor: colors.accentBg, borderRadius: 2,
                                border: `1px solid ${colors.primary}40`
                            }}>
                                <Chip label={`${selectedAssocIds.length} selected`} color="primary" sx={{ backgroundColor: colors.primary }} />
                                <Button
                                    variant="contained"
                                    size="small"
                                    startIcon={<DeleteIcon />}
                                    onClick={() => setOpenBulkDeleteDialog(true)}
                                    color="error"
                                >
                                    Delete ({selectedAssocIds.length})
                                </Button>
                                <Button variant="outlined" size="small" onClick={() => setSelectedAssocIds([])}
                                    sx={{ ml: 'auto', borderColor: colors.secondary, color: colors.secondary }}>
                                    Clear Selection
                                </Button>
                            </Box>
                        )}

                        <DataTable
                            columns={tableColumns}
                            data={filteredOrganizations}
                            selectable
                            selectedIds={selectedAssocIds}
                            onSelectionChange={setSelectedAssocIds}
                            pagination
                            rowsPerPageOptions={[5, 10, 25, 50]}
                            defaultRowsPerPage={10}
                            defaultSortColumn="organisation"
                            defaultSortDirection="asc"
                            sortValueGetter={sortValueGetter}
                            onRowClick={(org) => handleOrganizationClick(org)}
                            emptyMessage="No associations found"
                            paperSx={{ mb: 4 }}
                        />
                    </Box>
                )}

                {/* Bulk Delete Dialog */}
                <Dialog open={openBulkDeleteDialog} onClose={() => !bulkDeleteLoading && setOpenBulkDeleteDialog(false)} maxWidth="sm" fullWidth>
                    <DialogTitle sx={{ backgroundColor: '#d32f2f', color: 'white' }}>
                        Delete {selectedAssocIds.length} Association(s)
                    </DialogTitle>
                    <DialogContent sx={{ mt: 2 }}>
                        <Typography>
                            Are you sure you want to delete <strong>{selectedAssocIds.length}</strong> association(s)?
                        </Typography>
                        <Alert severity="error" sx={{ mt: 2 }}>
                            This will permanently delete all selected associations along with their associated data. This action cannot be undone!
                        </Alert>
                        <Box sx={{ mt: 2, maxHeight: 200, overflowY: 'auto' }}>
                            {filteredOrganizations
                                .filter(o => selectedAssocIds.includes(o.id))
                                .map(org => (
                                    <Box key={org.id} sx={{ p: 1, mb: 0.5, bgcolor: '#f5f5f5', borderRadius: 1 }}>
                                        <Typography variant="body2">
                                            <strong>{org.name}</strong> — {org.organization_type?.type || 'Unknown'}
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
                            onClick={handleBulkDeleteAssociations}
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

            </Container>
        </>
    );
}

export default AssociationsPage;
