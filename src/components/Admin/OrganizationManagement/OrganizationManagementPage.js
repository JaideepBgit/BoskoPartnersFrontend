import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
    Container, Typography, Box, Paper, TextField, InputAdornment,
    Select, MenuItem, FormControl, InputLabel, IconButton, Button,
    CircularProgress, Tabs, Tab,
    Chip, Table, TableBody, TableCell, TableContainer, TableHead,
    TableRow, TablePagination, Avatar, Tooltip, TableSortLabel
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import AddIcon from '@mui/icons-material/Add';
import RefreshIcon from '@mui/icons-material/Refresh';
import BusinessIcon from '@mui/icons-material/Business';
import PeopleIcon from '@mui/icons-material/People';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import FilterListIcon from '@mui/icons-material/FilterList';
import RadarIcon from '@mui/icons-material/Radar';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../shared/Navbar/Navbar';
import SpiderChartPopup from '../../UserManagement/common/SpiderChartPopup';
import {
    fetchOrganizations,
    fetchOrganizationTypes,
    fetchUsersByOrganization,
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
    headerGradient: 'linear-gradient(135deg, #633394 0%, #967CB2 100%)',
};

// Define main organization types
const mainOrganizationTypes = ['church', 'Institution', 'Non_formal_organizations'];

function OrganizationManagementPage() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [organizations, setOrganizations] = useState([]);
    const [organizationTypes, setOrganizationTypes] = useState([]);
    const [usersByOrg, setUsersByOrg] = useState({});

    // UI State
    const [activeTab, setActiveTab] = useState(0);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterType, setFilterType] = useState('');

    // Pagination for main organizations
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    // Pagination for related organizations
    // Pagination for related organizations
    const [relatedPage, setRelatedPage] = useState(0);
    const [relatedRowsPerPage, setRelatedRowsPerPage] = useState(10);

    // Sorting state
    const [order, setOrder] = useState('asc');
    const [orderBy, setOrderBy] = useState('name');

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

    // Filtered organizations
    const filteredOrganizations = useMemo(() => {
        return organizations.filter(org => {
            const matchesSearch = !searchQuery ||
                org.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                org.organization_type?.type?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                org.geo_location?.city?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                org.geo_location?.country?.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesType = !filterType || org.organization_type?.type === filterType;
            return matchesSearch && matchesType;
        });
    }, [organizations, searchQuery, filterType]);

    // Split into main and related organizations
    const mainOrganizations = useMemo(() => {
        return filteredOrganizations.filter(org =>
            mainOrganizationTypes.includes(org.organization_type?.type)
        );
    }, [filteredOrganizations]);

    const relatedOrganizations = useMemo(() => {
        return filteredOrganizations.filter(org =>
            !mainOrganizationTypes.includes(org.organization_type?.type)
        );
    }, [filteredOrganizations]);

    const handleOrganizationClick = (org) => {
        navigate(`/organization-management/${org.id}`);
    };

    const handleOpenAddPage = () => {
        navigate('/organizations/add');
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
    const renderOrganizationTable = (orgs, isMain = true) => {
        const currentPage = isMain ? page : relatedPage;
        const currentRowsPerPage = isMain ? rowsPerPage : relatedRowsPerPage;
        const setCurrentPage = isMain ? setPage : setRelatedPage;
        const setCurrentRowsPerPage = isMain ? setRowsPerPage : setRelatedRowsPerPage;

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
                                <TableCell sx={{ color: 'white', fontWeight: 'bold', width: 50 }}></TableCell>
                                <TableCell
                                    sortDirection={orderBy === 'organisation' ? order : false}
                                    sx={{ color: 'white', fontWeight: 'bold' }}
                                >
                                    <TableSortLabel
                                        active={orderBy === 'organisation'}
                                        direction={orderBy === 'organisation' ? order : 'asc'}
                                        onClick={() => handleRequestSort('organisation')}
                                        sx={{
                                            color: 'white !important',
                                            '& .MuiTableSortLabel-icon': {
                                                color: 'white !important',
                                            },
                                        }}
                                    >
                                        Organization
                                    </TableSortLabel>
                                </TableCell>
                                <TableCell
                                    sortDirection={orderBy === 'location' ? order : false}
                                    sx={{ color: 'white', fontWeight: 'bold' }}
                                >
                                    <TableSortLabel
                                        active={orderBy === 'location'}
                                        direction={orderBy === 'location' ? order : 'asc'}
                                        onClick={() => handleRequestSort('location')}
                                        sx={{
                                            color: 'white !important',
                                            '& .MuiTableSortLabel-icon': {
                                                color: 'white !important',
                                            },
                                        }}
                                    >
                                        Location
                                    </TableSortLabel>
                                </TableCell>
                                <TableCell sx={{ color: 'white', fontWeight: 'bold', textAlign: 'center' }}>Users</TableCell>
                                <TableCell sx={{ color: 'white', fontWeight: 'bold', width: 50 }}></TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {orgs.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} sx={{ textAlign: 'center', py: 4 }}>
                                        <Typography color="text.secondary">
                                            No organizations found
                                        </Typography>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                stableSort(orgs, getComparator(order, orderBy))
                                    .slice(currentPage * currentRowsPerPage, currentPage * currentRowsPerPage + currentRowsPerPage)
                                    .map((org) => {
                                        const typeColors = getTypeChipColor(org.organization_type?.type);
                                        const userCount = usersByOrg[org.id]?.length || 0;

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
                                                    <Avatar sx={{
                                                        bgcolor: colors.accentBg,
                                                        color: colors.primary,
                                                        width: 40,
                                                        height: 40
                                                    }}>
                                                        <BusinessIcon />
                                                    </Avatar>
                                                </TableCell>
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
                                                <TableCell sx={{ textAlign: 'center' }}>
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
                                                </TableCell>
                                                <TableCell>
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
                        rowsPerPage={currentRowsPerPage}
                        page={currentPage}
                        onPageChange={(e, newPage) => setCurrentPage(newPage)}
                        onRowsPerPageChange={(e) => {
                            setCurrentRowsPerPage(parseInt(e.target.value, 10));
                            setCurrentPage(0);
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
                        Organization Manager
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

                {/* Tabs */}
                <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
                    <Tabs
                        value={activeTab}
                        onChange={(e, v) => setActiveTab(v)}
                        sx={{
                            '& .MuiTab-root': {
                                textTransform: 'none',
                                fontWeight: 500,
                                minWidth: 'auto',
                                px: 3
                            },
                            '& .Mui-selected': { color: colors.primary },
                            '& .MuiTabs-indicator': { backgroundColor: colors.primary }
                        }}
                    >
                        <Tab label="Organizations" />
                        <Tab label="Referrals" />
                    </Tabs>
                </Box>

                {/* Search & Filter Bar */}
                <Paper sx={{
                    p: 2,
                    mb: 3,
                    borderRadius: 3,
                    //backgroundColor: colors.accentBg,
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
                                <MenuItem value="">All Types</MenuItem>
                                <MenuItem value="church">Churches</MenuItem>
                                <MenuItem value="Institution">Institutions</MenuItem>
                                <MenuItem value="Non_formal_organizations">Non-formal Orgs</MenuItem>
                            </Select>
                        </FormControl>
                        <Chip
                            label={`Showing ${filteredOrganizations.length} of ${organizations.length}`}
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
                    <>
                        {activeTab === 0 && (
                            <>
                                {/* Main Organizations Section */}
                                <Box sx={{ mb: 2 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                                        <BusinessIcon sx={{ color: colors.primary }} />
                                        <Typography variant="h6" fontWeight="bold" sx={{ color: colors.primary }}>
                                            Main Organizations
                                        </Typography>
                                        <Chip
                                            label={`${mainOrganizations.length} organizations`}
                                            size="small"
                                            sx={{
                                                backgroundColor: colors.accentBg,
                                                color: colors.primary
                                            }}
                                        />
                                    </Box>
                                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                        Churches, Institutions, and Non-formal Organizations
                                    </Typography>
                                    {renderOrganizationTable(mainOrganizations, true)}
                                </Box>

                                {/* Related Organizations Section */}
                                <Box>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                                        <PeopleIcon sx={{ color: colors.secondary }} />
                                        <Typography variant="h6" fontWeight="bold" sx={{ color: colors.secondary }}>
                                            Affiliations & Accreditations
                                        </Typography>
                                        <Chip
                                            label={`${relatedOrganizations.length} organizations`}
                                            size="small"
                                            sx={{
                                                backgroundColor: '#f3e5f5',
                                                color: colors.secondary
                                            }}
                                        />
                                    </Box>
                                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                        Denominations, Accrediting Bodies, Affiliations, and Umbrella Associations
                                    </Typography>
                                    {renderOrganizationTable(relatedOrganizations, false)}
                                </Box>
                            </>
                        )}

                        {/* Referrals Tab */}
                        {activeTab === 1 && (
                            <Paper sx={{
                                borderRadius: 3,
                                p: 4,
                                textAlign: 'center',
                                boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
                            }}>
                                <Typography color="text.secondary">
                                    Referrals feature coming soon...
                                </Typography>
                            </Paper>
                        )}
                    </>
                )}

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
