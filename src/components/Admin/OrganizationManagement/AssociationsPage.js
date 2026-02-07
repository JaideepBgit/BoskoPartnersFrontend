import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
    Container, Typography, Box, Paper, TextField, InputAdornment,
    Select, MenuItem, FormControl, InputLabel, IconButton, Button,
    CircularProgress,
    Chip, Table, TableBody, TableCell, TableContainer, TableHead,
    TableRow, TablePagination, Avatar, TableSortLabel, Tooltip
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import AddIcon from '@mui/icons-material/Add';
import RefreshIcon from '@mui/icons-material/Refresh';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import FilterListIcon from '@mui/icons-material/FilterList';
import BusinessIcon from '@mui/icons-material/Business';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../shared/Navbar/Navbar';
import {
    fetchOrganizations,
    fetchOrganizationTypes,
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

function AssociationsPage() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [organizations, setOrganizations] = useState([]);
    const [organizationTypes, setOrganizationTypes] = useState([]);

    // UI State
    const [searchQuery, setSearchQuery] = useState('');
    const [filterType, setFilterType] = useState('');

    // Pagination
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    // Sorting state
    const [order, setOrder] = useState('asc');
    const [orderBy, setOrderBy] = useState('name');



    // Sorting functions
    const handleRequestSort = (property) => {
        const isAsc = orderBy === property && order === 'asc';
        setOrder(isAsc ? 'desc' : 'asc');
        setOrderBy(property);
    };

    const descendingComparator = (a, b, orderBy) => {
        let aValue = a[orderBy];
        let bValue = b[orderBy];

        if (orderBy === 'organisation') {
            aValue = (a.name || '').toLowerCase();
            bValue = (b.name || '').toLowerCase();
        } else if (orderBy === 'location') {
            aValue = getLocation(a).toLowerCase();
            bValue = getLocation(b).toLowerCase();
        }

        if (bValue < aValue) {
            return -1;
        }
        if (bValue > aValue) {
            return 1;
        }
        return 0;
    };

    const getComparator = (order, orderBy) => {
        return order === 'desc'
            ? (a, b) => descendingComparator(a, b, orderBy)
            : (a, b) => -descendingComparator(a, b, orderBy);
    };

    const stableSort = (array, comparator) => {
        const stabilizedThis = array.map((el, index) => [el, index]);
        stabilizedThis.sort((a, b) => {
            const order = comparator(a[0], b[0]);
            if (order !== 0) return order;
            return a[1] - b[1];
        });
        return stabilizedThis.map((el) => el[0]);
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
        return organizations.filter(org => {
            // Must NOT be a main organization type
            const isAssociation = !mainOrganizationTypes.includes(org.organization_type?.type);

            if (!isAssociation) return false;

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
        navigate('/associations/add');
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

    // Render organization table
    const renderOrganizationTable = (orgs) => {
        return (
            <Paper sx={{
                borderRadius: 3,
                overflow: 'hidden',
                boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
                mb: 4
            }}>
                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow sx={{ background: colors.headerGradient }}>
                                <TableCell
                                    sortDirection={orderBy === 'organisation' ? order : false}
                                    sx={{ color: '#212121', fontWeight: 'bold' }}
                                >
                                    <TableSortLabel
                                        active={orderBy === 'organisation'}
                                        direction={orderBy === 'organisation' ? order : 'asc'}
                                        onClick={() => handleRequestSort('organisation')}
                                        sx={{
                                            color: '#212121 !important',
                                            '& .MuiTableSortLabel-icon': {
                                                color: '#212121 !important',
                                            },
                                        }}
                                    >
                                        Organization
                                    </TableSortLabel>
                                </TableCell>
                                <TableCell
                                    sortDirection={orderBy === 'location' ? order : false}
                                    sx={{ color: '#212121', fontWeight: 'bold' }}
                                >
                                    <TableSortLabel
                                        active={orderBy === 'location'}
                                        direction={orderBy === 'location' ? order : 'asc'}
                                        onClick={() => handleRequestSort('location')}
                                        sx={{
                                            color: '#212121 !important',
                                            '& .MuiTableSortLabel-icon': {
                                                color: '#212121 !important',
                                            },
                                        }}
                                    >
                                        Location
                                    </TableSortLabel>
                                </TableCell>
                                <TableCell sx={{ color: '#212121', fontWeight: 'bold', width: 50 }}></TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {orgs.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={3} sx={{ textAlign: 'center', py: 4 }}>
                                        <Typography color="text.secondary">
                                            No associations found
                                        </Typography>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                stableSort(orgs, getComparator(order, orderBy))
                                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                                    .map((org) => {
                                        const typeColors = getTypeChipColor(org.organization_type?.type);

                                        return (
                                            <TableRow
                                                key={org.id}
                                                onClick={() => handleOrganizationClick(org)}
                                                sx={{
                                                    cursor: 'pointer',
                                                    transition: 'background-color 0.2s',
                                                    '&:hover': { backgroundColor: colors.accentBg }
                                                }}
                                            >

                                                <TableCell>
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
                                                </TableCell>
                                                <TableCell>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                        <LocationOnIcon sx={{ color: colors.textSecondary, fontSize: 18 }} />
                                                        <Typography variant="body2" color="text.secondary">
                                                            {getLocation(org)}
                                                        </Typography>
                                                    </Box>
                                                </TableCell>
                                                <TableCell>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                                                        <ChevronRightIcon sx={{ color: colors.textSecondary }} />
                                                    </Box>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
                {orgs.length > 0 && (
                    <TablePagination
                        rowsPerPageOptions={[5, 10, 25, 50]}
                        component="div"
                        count={orgs.length}
                        rowsPerPage={rowsPerPage}
                        page={page}
                        onPageChange={(e, newPage) => setPage(newPage)}
                        onRowsPerPageChange={(e) => {
                            setRowsPerPage(parseInt(e.target.value, 10));
                            setPage(0);
                        }}
                    />
                )}
            </Paper>
        );
    };

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
                        Associations
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
                        <Tooltip title="Refresh">
                            <IconButton
                                onClick={loadData}
                                disabled={loading}
                                sx={{
                                    border: `1px solid ${colors.borderColor}`,
                                    borderRadius: 2
                                }}
                            >
                                <RefreshIcon />
                            </IconButton>
                        </Tooltip>
                    </Box>
                </Box>

                {/* Search & Filter Bar */}
                <Paper sx={{
                    p: 2,
                    mb: 3,
                    borderRadius: 3,
                    boxShadow: 'none',
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
                                {organizationTypes
                                    .filter(type => !mainOrganizationTypes.includes(type.type))
                                    .map(type => (
                                        <MenuItem key={type.id} value={type.type}>
                                            {type.type.charAt(0).toUpperCase() + type.type.slice(1)}
                                        </MenuItem>
                                    ))
                                }
                            </Select>
                        </FormControl>
                        <Chip
                            label={`Showing ${filteredOrganizations.length} associations`}
                            variant="outlined"
                            sx={{
                                borderColor: colors.primary,
                                color: colors.primary
                            }}
                        />
                    </Box>
                </Paper>

                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                        <CircularProgress sx={{ color: colors.primary }} />
                    </Box>
                ) : (
                    <Box>
                        {renderOrganizationTable(filteredOrganizations)}
                    </Box>
                )}

            </Container>
        </>
    );
}

export default AssociationsPage;
