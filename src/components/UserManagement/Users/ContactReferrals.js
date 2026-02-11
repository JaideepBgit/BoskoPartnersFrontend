import React, { useState, useEffect } from 'react';
import {
    Box, Typography, Button, Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, Paper, IconButton, Dialog, DialogActions,
    DialogContent, DialogTitle, TextField, Select, MenuItem, FormControl,
    InputLabel, Card, CardContent, Grid, Chip, Alert, CircularProgress,
    Radio, RadioGroup, FormControlLabel, FormLabel, Divider,
    Tooltip, Checkbox,
    Autocomplete, LinearProgress
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import BusinessIcon from '@mui/icons-material/Business';
import EmailIcon from '@mui/icons-material/Email';
import PhoneIcon from '@mui/icons-material/Phone';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import InfoIcon from '@mui/icons-material/Info';
import SearchIcon from '@mui/icons-material/Search';
import InputAdornment from '@mui/material/InputAdornment';
import {
    fetchContactReferrals,
    approveContactReferral,
    rejectContactReferral,
    checkOrganizationExists,
    searchOrganizations
} from '../../../services/UserManagement/ContactReferralService';
import { fetchOrganizations, fetchTemplatesByOrganization } from '../../../services/UserManagement/UserManagementService';

function ContactReferrals() {
    const [referrals, setReferrals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [organizations, setOrganizations] = useState([]);
    const [templates, setTemplates] = useState([]);
    const [organizationTypes, setOrganizationTypes] = useState([]);

    // Search state
    const [searchQuery, setSearchQuery] = useState('');

    // Table selection state
    const [selectedReferral, setSelectedReferral] = useState(null);
    const [selectedRowId, setSelectedRowId] = useState(null);
    const [selectedReferralIds, setSelectedReferralIds] = useState([]);

    // Approval dialog state
    const [openApprovalDialog, setOpenApprovalDialog] = useState(false);
    const [isBulkOperation, setIsBulkOperation] = useState(false);
    const [bulkProgress, setBulkProgress] = useState({ current: 0, total: 0, results: [] });
    const [approvalData, setApprovalData] = useState({
        create_organization: false,
        organization_id: '',
        organization_name: '',
        organization_type_id: '',
        ui_role: 'user',
        template_id: '',
        send_welcome_email: false
    });
    const [orgCheckResult, setOrgCheckResult] = useState(null);
    const [approvalLoading, setApprovalLoading] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [generatedPassword, setGeneratedPassword] = useState('');

    // Rejection dialog state
    const [openRejectDialog, setOpenRejectDialog] = useState(false);
    const [rejectLoading, setRejectLoading] = useState(false);

    // Organization search state
    const [orgSearchInput, setOrgSearchInput] = useState('');
    const [orgSearchResults, setOrgSearchResults] = useState([]);
    const [orgSearchLoading, setOrgSearchLoading] = useState(false);
    const [selectedOrg, setSelectedOrg] = useState(null);
    const [searchDebounceTimer, setSearchDebounceTimer] = useState(null);

    useEffect(() => {
        loadReferrals();
        loadOrganizations();
        loadOrganizationTypes();
    }, []);

    const loadReferrals = async () => {
        try {
            setLoading(true);
            const response = await fetchContactReferrals();
            if (response.success) {
                setReferrals(response.contacts || []);
            }
        } catch (err) {
            setError('Failed to load contact referrals');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const loadOrganizations = async () => {
        try {
            const orgs = await fetchOrganizations();
            setOrganizations(orgs);
        } catch (err) {
            console.error('Failed to load organizations:', err);
        }
    };

    const loadOrganizationTypes = async () => {
        try {
            const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}/organization-types`);
            const data = await response.json();
            setOrganizationTypes(data.organization_types || []);
        } catch (err) {
            console.error('Failed to load organization types:', err);
        }
    };

    // Handle organization search with debounce
    const handleOrganizationSearch = async (searchValue) => {
        setOrgSearchInput(searchValue);

        // Clear existing timer
        if (searchDebounceTimer) {
            clearTimeout(searchDebounceTimer);
        }

        // If search is empty, show all organizations
        if (!searchValue || searchValue.trim() === '') {
            setOrgSearchResults(organizations.map(org => ({
                id: org.id,
                name: org.name,
                type_id: org.type,
                match_score: 0,
                match_type: 'none'
            })));
            return;
        }

        // Debounce the search
        const timer = setTimeout(async () => {
            setOrgSearchLoading(true);
            try {
                const result = await searchOrganizations(searchValue, 15);
                if (result.success) {
                    setOrgSearchResults(result.organizations || []);

                    // If there's an exact match, auto-select it
                    if (result.exact_match) {
                        setSelectedOrg(result.exact_match);
                        setApprovalData(prev => ({
                            ...prev,
                            organization_id: result.exact_match.id
                        }));
                    }
                }
            } catch (err) {
                console.error('Error searching organizations:', err);
                // Fall back to filtered local list
                const filtered = organizations.filter(org =>
                    org.name.toLowerCase().includes(searchValue.toLowerCase())
                ).map(org => ({
                    id: org.id,
                    name: org.name,
                    type_id: org.type,
                    match_score: 50,
                    match_type: 'local_filter'
                }));
                setOrgSearchResults(filtered);
            } finally {
                setOrgSearchLoading(false);
            }
        }, 300);

        setSearchDebounceTimer(timer);
    };

    // Get match type label and color
    const getMatchBadge = (matchType, matchScore) => {
        switch (matchType) {
            case 'exact':
                return { label: 'Exact Match', color: 'success' };
            case 'contains':
                return { label: `${matchScore}% Match`, color: matchScore > 80 ? 'success' : 'warning' };
            case 'starts_with':
                return { label: `${matchScore}% Match`, color: 'success' };
            case 'token_match':
                return { label: `${matchScore}% Similar`, color: 'warning' };
            case 'fuzzy':
                return { label: `${matchScore}% Similar`, color: matchScore > 50 ? 'warning' : 'default' };
            default:
                return null;
        }
    };

    const handleRowSelect = async (referral) => {
        setSelectedReferral(referral);
        setSelectedRowId(referral.id);

        // Pre-check organization when row is selected
        if (referral.institution_name) {
            try {
                const result = await checkOrganizationExists(referral.institution_name);
                setOrgCheckResult(result);
            } catch (err) {
                console.error('Error checking organization:', err);
            }
        }
    };

    const handleCheckboxToggle = (referralId, event) => {
        event.stopPropagation();
        setSelectedReferralIds(prev => {
            if (prev.includes(referralId)) {
                return prev.filter(id => id !== referralId);
            } else {
                return [...prev, referralId];
            }
        });
    };

    const handleSelectAll = (event) => {
        if (event.target.checked) {
            setSelectedReferralIds(referrals.map(r => r.id));
        } else {
            setSelectedReferralIds([]);
        }
    };

    const isSelected = (referralId) => selectedReferralIds.includes(referralId);
    const isAllSelected = referrals.length > 0 && selectedReferralIds.length === referrals.length;
    const isSomeSelected = selectedReferralIds.length > 0 && selectedReferralIds.length < referrals.length;

    const handleOpenApprovalDialog = async () => {
        if (!selectedReferral && selectedReferralIds.length === 0) return;

        // Check if bulk operation
        if (selectedReferralIds.length > 0) {
            setIsBulkOperation(true);
            setBulkProgress({ current: 0, total: selectedReferralIds.length, results: [] });
        } else {
            setIsBulkOperation(false);
        }

        // Reset organization search state
        setOrgSearchInput('');
        setOrgSearchResults([]);
        setSelectedOrg(null);

        setApprovalData({
            create_organization: false,
            organization_id: '',
            organization_name: selectedReferral?.institution_name || '',
            organization_type_id: '',
            ui_role: 'user',
            template_id: '',
            send_welcome_email: false
        });
        setSuccessMessage('');
        setGeneratedPassword('');

        // Check if organization exists (only for single selection)
        if (selectedReferral?.institution_name && orgCheckResult?.exists) {
            setApprovalData(prev => ({
                ...prev,
                organization_id: orgCheckResult.organization.id,
                create_organization: false
            }));
            setSelectedOrg({
                id: orgCheckResult.organization.id,
                name: orgCheckResult.organization.name,
                match_type: 'exact',
                match_score: 100
            });
            // Load templates for this organization
            loadTemplatesForOrganization(orgCheckResult.organization.id);
        }

        // Trigger initial search with institution name to find similar organizations
        if (selectedReferral?.institution_name && !isBulkOperation) {
            setOrgSearchInput(selectedReferral.institution_name);
            handleOrganizationSearch(selectedReferral.institution_name);
        }

        setOpenApprovalDialog(true);
    };

    const handleBulkApprove = async () => {
        try {
            setApprovalLoading(true);
            setError(null);

            const results = [];
            const selectedReferralsData = referrals.filter(r => selectedReferralIds.includes(r.id));

            for (let i = 0; i < selectedReferralsData.length; i++) {
                const referral = selectedReferralsData[i];
                setBulkProgress(prev => ({ ...prev, current: i + 1 }));

                try {
                    // Check if organization exists for this referral
                    let orgId = approvalData.organization_id;
                    let shouldCreateOrg = approvalData.create_organization;

                    if (referral.institution_name && !approvalData.organization_id) {
                        const orgCheck = await checkOrganizationExists(referral.institution_name);
                        if (orgCheck.exists) {
                            orgId = orgCheck.organization.id;
                            shouldCreateOrg = false;
                        } else {
                            shouldCreateOrg = true;
                        }
                    }

                    const response = await approveContactReferral(referral.id, {
                        ...approvalData,
                        organization_id: orgId,
                        create_organization: shouldCreateOrg,
                        organization_name: referral.institution_name || approvalData.organization_name
                    });

                    results.push({
                        referral: `${referral.first_name} ${referral.last_name}`,
                        success: true,
                        message: response.message,
                        password: response.password
                    });
                } catch (err) {
                    results.push({
                        referral: `${referral.first_name} ${referral.last_name}`,
                        success: false,
                        error: err.message
                    });
                }
            }

            setBulkProgress(prev => ({ ...prev, results }));

            // Reload referrals
            await loadReferrals();

            // Clear selections
            setTimeout(() => {
                setSelectedReferralIds([]);
                setSelectedReferral(null);
                setSelectedRowId(null);
            }, 5000);

        } catch (err) {
            setError(err.message || 'Failed to process bulk approval');
        } finally {
            setApprovalLoading(false);
        }
    };

    const handleBulkReject = async () => {
        try {
            setRejectLoading(true);
            setError(null);

            const selectedReferralsData = referrals.filter(r => selectedReferralIds.includes(r.id));
            let successCount = 0;
            let failCount = 0;

            for (const referral of selectedReferralsData) {
                try {
                    await rejectContactReferral(referral.id);
                    successCount++;
                } catch (err) {
                    failCount++;
                    console.error(`Failed to reject ${referral.first_name} ${referral.last_name}:`, err);
                }
            }

            setOpenRejectDialog(false);
            setSelectedReferralIds([]);
            setSelectedReferral(null);
            setSelectedRowId(null);
            await loadReferrals();

            if (failCount > 0) {
                setError(`Rejected ${successCount} referral(s). ${failCount} failed.`);
            }

        } catch (err) {
            setError(err.message || 'Failed to process bulk rejection');
        } finally {
            setRejectLoading(false);
        }
    };

    const loadTemplatesForOrganization = async (orgId) => {
        try {
            const temps = await fetchTemplatesByOrganization(orgId);
            setTemplates(temps);
        } catch (err) {
            console.error('Failed to load templates:', err);
            setTemplates([]);
        }
    };

    const handleApprovalDataChange = (field, value) => {
        setApprovalData(prev => ({
            ...prev,
            [field]: value
        }));

        // Load templates when organization is selected
        if (field === 'organization_id' && value) {
            loadTemplatesForOrganization(value);
        }
    };

    const handleApprove = async () => {
        try {
            setApprovalLoading(true);
            setError(null);

            const response = await approveContactReferral(selectedReferral.id, approvalData);

            if (response.success) {
                setSuccessMessage(response.message);
                setGeneratedPassword(response.password);
                // Reload referrals after successful approval
                await loadReferrals();
                // Clear selection after showing success message
                setTimeout(() => {
                    setSelectedReferral(null);
                    setSelectedRowId(null);
                }, 3000);
            }
        } catch (err) {
            setError(err.message || 'Failed to approve contact referral');
        } finally {
            setApprovalLoading(false);
        }
    };

    const handleOpenRejectDialog = () => {
        if (!selectedReferral && selectedReferralIds.length === 0) return;
        setOpenRejectDialog(true);
    };

    const handleReject = async () => {
        try {
            setRejectLoading(true);
            setError(null);

            const response = await rejectContactReferral(selectedReferral.id);

            if (response.success) {
                setOpenRejectDialog(false);
                setSelectedReferral(null);
                setSelectedRowId(null);
                await loadReferrals();
            }
        } catch (err) {
            setError(err.message || 'Failed to reject contact referral');
        } finally {
            setRejectLoading(false);
        }
    };

    const handleCloseApprovalDialog = () => {
        if (!approvalLoading) {
            setOpenApprovalDialog(false);
            setSelectedReferral(null);
            setSuccessMessage('');
            setGeneratedPassword('');
        }
    };

    const handleCloseRejectDialog = () => {
        if (!rejectLoading) {
            setOpenRejectDialog(false);
            setSelectedReferral(null);
        }
    };

    // Filtered referrals based on search
    const filteredReferrals = referrals.filter(referral => {
        if (!searchQuery) return true;
        const query = searchQuery.toLowerCase();
        return (
            (referral.first_name || '').toLowerCase().includes(query) ||
            (referral.last_name || '').toLowerCase().includes(query) ||
            (referral.email || '').toLowerCase().includes(query) ||
            (referral.institution_name || '').toLowerCase().includes(query) ||
            (referral.country || '').toLowerCase().includes(query) ||
            (referral.title || '').toLowerCase().includes(query) ||
            (referral.type_of_institution || '').toLowerCase().includes(query)
        );
    });

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box sx={{ p: 3 }}>
            {/* Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="h4" sx={{ color: '#212121', fontWeight: 'bold' }}>
                        Contact Referrals
                    </Typography>
                    <Tooltip title="Review and approve contact referrals to create user accounts and organizations" arrow>
                        <InfoIcon sx={{ color: '#633394', fontSize: 24, cursor: 'help' }} />
                    </Tooltip>
                </Box>
                <Box sx={{ display: 'flex', gap: 2 }}>
                    {(selectedReferral || selectedReferralIds.length > 0) && (
                        <>
                            <Button
                                variant="contained"
                                color="success"
                                startIcon={<CheckCircleIcon />}
                                onClick={handleOpenApprovalDialog}
                                size="large"
                            >
                                {selectedReferralIds.length > 0
                                    ? `Approve (${selectedReferralIds.length})`
                                    : 'Approve'}
                            </Button>
                            <Button
                                variant="contained"
                                color="error"
                                startIcon={<CancelIcon />}
                                onClick={handleOpenRejectDialog}
                                size="large"
                            >
                                {selectedReferralIds.length > 0
                                    ? `Reject (${selectedReferralIds.length})`
                                    : 'Reject'}
                            </Button>
                        </>
                    )}
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
                    placeholder="Search by name, email, institution, or country..."
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
                    {selectedReferralIds.length > 0 && (
                        <Chip
                            label={`${selectedReferralIds.length} selected`}
                            color="primary"
                            sx={{ backgroundColor: '#633394' }}
                        />
                    )}
                </Box>
            </Box>

            {error && (
                <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
                    {error}
                </Alert>
            )}

            {filteredReferrals.length === 0 ? (
                <Card>
                    <CardContent>
                        <Box textAlign="center" py={4}>
                            <PersonAddIcon sx={{ fontSize: 60, color: '#633394', mb: 2 }} />
                            <Typography variant="h6" color="text.secondary">
                                {referrals.length === 0 ? 'No pending contact referrals' : 'No referrals match your search'}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                {referrals.length === 0
                                    ? 'Contact referrals will appear here when submitted'
                                    : 'Try adjusting your search terms'}
                            </Typography>
                        </Box>
                    </CardContent>
                </Card>
            ) : (
                <Paper sx={{ borderRadius: 3, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
                <TableContainer>
                    <Table>
                        <TableHead sx={{ backgroundColor: '#FAFAFA' }}>
                            <TableRow>
                                <TableCell padding="checkbox" sx={{ color: '#000000' }}>
                                    <Checkbox
                                        indeterminate={isSomeSelected}
                                        checked={isAllSelected}
                                        onChange={handleSelectAll}
                                        sx={{
                                            color: '#000000',
                                            '&.Mui-checked': { color: '#000000' },
                                            '&.MuiCheckbox-indeterminate': { color: '#000000' }
                                        }}
                                    />
                                </TableCell>
                                <TableCell sx={{ color: '#000000', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px', fontSize: '0.75rem' }}>Name</TableCell>
                                <TableCell sx={{ color: '#000000', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px', fontSize: '0.75rem' }}>Email</TableCell>
                                <TableCell sx={{ color: '#000000', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px', fontSize: '0.75rem' }}>Phone</TableCell>
                                <TableCell sx={{ color: '#000000', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px', fontSize: '0.75rem' }}>Institution</TableCell>
                                <TableCell sx={{ color: '#000000', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px', fontSize: '0.75rem' }}>Type</TableCell>
                                <TableCell sx={{ color: '#000000', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px', fontSize: '0.75rem' }}>Country</TableCell>
                                <TableCell sx={{ color: '#000000', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px', fontSize: '0.75rem' }}>Submitted</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {filteredReferrals.map((referral) => (
                                <TableRow
                                    key={referral.id}
                                    hover
                                    selected={selectedRowId === referral.id || isSelected(referral.id)}
                                    onClick={() => handleRowSelect(referral)}
                                    sx={{
                                        cursor: 'pointer',
                                        '&:hover': { backgroundColor: '#f5f5f5' },
                                        '&.Mui-selected': {
                                            backgroundColor: '#ede7f6',
                                        },
                                        '&.Mui-selected:hover': {
                                            backgroundColor: '#d1c4e9',
                                        },
                                    }}
                                >
                                    <TableCell padding="checkbox" onClick={(e) => e.stopPropagation()}>
                                        <Checkbox
                                            checked={isSelected(referral.id)}
                                            onChange={(e) => handleCheckboxToggle(referral.id, e)}
                                            color="primary"
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="body2" fontWeight="bold">
                                            {referral.first_name} {referral.last_name}
                                        </Typography>
                                        {referral.title && (
                                            <Typography variant="caption" color="text.secondary">
                                                {referral.title}
                                            </Typography>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <Box display="flex" alignItems="center" gap={0.5}>
                                            <EmailIcon fontSize="small" color="action" />
                                            <Typography variant="body2">{referral.email}</Typography>
                                        </Box>
                                    </TableCell>
                                    <TableCell>
                                        {referral.full_phone ? (
                                            <Box display="flex" alignItems="center" gap={0.5}>
                                                <PhoneIcon fontSize="small" color="action" />
                                                <Typography variant="body2">{referral.full_phone}</Typography>
                                            </Box>
                                        ) : (
                                            <Typography variant="body2" color="text.secondary">N/A</Typography>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        {referral.institution_name ? (
                                            <Box display="flex" alignItems="center" gap={0.5}>
                                                <BusinessIcon fontSize="small" color="action" />
                                                <Typography variant="body2">{referral.institution_name}</Typography>
                                            </Box>
                                        ) : (
                                            <Typography variant="body2" color="text.secondary">N/A</Typography>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="body2">
                                            {referral.type_of_institution
                                                ? (referral.type_of_institution.toLowerCase() === 'non_formal_organizations'
                                                    ? 'Organization'
                                                    : referral.type_of_institution.charAt(0).toUpperCase() + referral.type_of_institution.slice(1))
                                                : 'N/A'}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        {referral.country ? (
                                            <Box display="flex" alignItems="center" gap={0.5}>
                                                <LocationOnIcon fontSize="small" color="action" />
                                                <Typography variant="body2">{referral.country}</Typography>
                                            </Box>
                                        ) : (
                                            <Typography variant="body2" color="text.secondary">N/A</Typography>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="body2">
                                            {new Date(referral.created_at).toLocaleDateString()}
                                        </Typography>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
                </Paper>
            )}

            {/* Selected Referral Details Card */}
            {selectedReferral && (
                <Card sx={{ mt: 3, border: '2px solid #633394' }} elevation={3}>
                    <CardContent>
                        <Typography variant="h6" sx={{ color: '#633394', fontWeight: 'bold', mb: 2 }}>
                            Selected Referral Details
                        </Typography>
                        <Grid container spacing={2}>
                            <Grid item xs={12} md={6}>
                                <Box sx={{ mb: 2 }}>
                                    <Typography variant="subtitle2" color="text.secondary">Full Name</Typography>
                                    <Typography variant="body1" fontWeight="bold">
                                        {selectedReferral.first_name} {selectedReferral.last_name}
                                    </Typography>
                                </Box>
                                <Box sx={{ mb: 2 }}>
                                    <Typography variant="subtitle2" color="text.secondary">Email</Typography>
                                    <Typography variant="body1">{selectedReferral.email}</Typography>
                                </Box>
                                <Box sx={{ mb: 2 }}>
                                    <Typography variant="subtitle2" color="text.secondary">Phone</Typography>
                                    <Typography variant="body1">{selectedReferral.full_phone || 'N/A'}</Typography>
                                </Box>
                                {selectedReferral.whatsapp && (
                                    <Box sx={{ mb: 2 }}>
                                        <Typography variant="subtitle2" color="text.secondary">WhatsApp</Typography>
                                        <Typography variant="body1">{selectedReferral.whatsapp}</Typography>
                                    </Box>
                                )}
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <Box sx={{ mb: 2 }}>
                                    <Typography variant="subtitle2" color="text.secondary">Institution</Typography>
                                    <Typography variant="body1">{selectedReferral.institution_name || 'N/A'}</Typography>
                                </Box>
                                <Box sx={{ mb: 2 }}>
                                    <Typography variant="subtitle2" color="text.secondary">Institution Type</Typography>
                                    <Typography variant="body1">
                                        {selectedReferral.type_of_institution
                                            ? (selectedReferral.type_of_institution.toLowerCase() === 'non_formal_organizations'
                                                ? 'Organization'
                                                : selectedReferral.type_of_institution.charAt(0).toUpperCase() + selectedReferral.type_of_institution.slice(1))
                                            : 'N/A'}
                                    </Typography>
                                </Box>
                                <Box sx={{ mb: 2 }}>
                                    <Typography variant="subtitle2" color="text.secondary">Title/Position</Typography>
                                    <Typography variant="body1">{selectedReferral.title || 'N/A'}</Typography>
                                </Box>
                                <Box sx={{ mb: 2 }}>
                                    <Typography variant="subtitle2" color="text.secondary">Country</Typography>
                                    <Typography variant="body1">{selectedReferral.country || 'N/A'}</Typography>
                                </Box>
                            </Grid>
                            {selectedReferral.physical_address && (
                                <Grid item xs={12}>
                                    <Box sx={{ mb: 2 }}>
                                        <Typography variant="subtitle2" color="text.secondary">Physical Address</Typography>
                                        <Typography variant="body1">{selectedReferral.physical_address}</Typography>
                                    </Box>
                                </Grid>
                            )}
                            {selectedReferral.preferred_contact && (
                                <Grid item xs={12}>
                                    <Box sx={{ mb: 2 }}>
                                        <Typography variant="subtitle2" color="text.secondary">Preferred Contact Method</Typography>
                                        <Typography variant="body1">{selectedReferral.preferred_contact}</Typography>
                                    </Box>
                                </Grid>
                            )}

                            {/* Organization Check Result */}
                            {orgCheckResult && (
                                <Grid item xs={12}>
                                    <Alert
                                        severity={orgCheckResult.exists ? "info" : "warning"}
                                        icon={<InfoIcon />}
                                    >
                                        {orgCheckResult.exists ? (
                                            <>
                                                Organization <strong>{orgCheckResult.organization.name}</strong> already exists in the system.
                                            </>
                                        ) : (
                                            <>
                                                Organization <strong>{selectedReferral.institution_name}</strong> does not exist. You will need to create it during approval.
                                            </>
                                        )}
                                    </Alert>
                                </Grid>
                            )}
                        </Grid>
                    </CardContent>
                </Card>
            )}

            {/* Approval Dialog */}
            <Dialog
                open={openApprovalDialog}
                onClose={handleCloseApprovalDialog}
                maxWidth="md"
                fullWidth
            >
                <DialogTitle sx={{ bgcolor: '#633394', color: 'white' }}>
                    {isBulkOperation
                        ? `Approve ${selectedReferralIds.length} Contact Referral(s)`
                        : 'Approve Contact Referral'}
                </DialogTitle>
                <DialogContent sx={{ mt: 2 }}>
                    {isBulkOperation && bulkProgress.results.length > 0 ? (
                        <Box>
                            <Alert severity="info" sx={{ mb: 2 }}>
                                Processed {bulkProgress.results.length} of {bulkProgress.total} referral(s)
                            </Alert>
                            <Box sx={{ maxHeight: 400, overflowY: 'auto' }}>
                                {bulkProgress.results.map((result, idx) => (
                                    <Alert
                                        key={idx}
                                        severity={result.success ? "success" : "error"}
                                        sx={{ mb: 1 }}
                                    >
                                        <Typography variant="body2" fontWeight="bold">
                                            {result.referral}
                                        </Typography>
                                        <Typography variant="caption">
                                            {result.success ? result.message : result.error}
                                        </Typography>
                                        {result.password && (
                                            <Typography variant="caption" display="block" sx={{ mt: 0.5 }}>
                                                Password: <strong>{result.password}</strong>
                                            </Typography>
                                        )}
                                    </Alert>
                                ))}
                            </Box>
                        </Box>
                    ) : successMessage ? (
                        <Box>
                            <Alert severity="success" sx={{ mb: 2 }}>
                                {successMessage}
                            </Alert>
                            {generatedPassword && (
                                <Alert severity="info" icon={<InfoIcon />}>
                                    <Typography variant="body2" fontWeight="bold">
                                        Generated Password: {generatedPassword}
                                    </Typography>
                                    <Typography variant="caption">
                                        Please save this password and share it securely with the user.
                                    </Typography>
                                </Alert>
                            )}
                        </Box>
                    ) : isBulkOperation ? (
                        <Box>
                            <Alert severity="info" sx={{ mb: 2 }}>
                                You are about to approve {selectedReferralIds.length} referral(s).
                                Configure the settings below that will apply to all selected referrals.
                            </Alert>
                            {approvalLoading && (
                                <Box sx={{ mb: 2 }}>
                                    <Typography variant="body2" gutterBottom>
                                        Processing: {bulkProgress.current} of {bulkProgress.total}
                                    </Typography>
                                    <CircularProgress />
                                </Box>
                            )}
                            <Divider sx={{ my: 2 }} />

                            {/* Bulk approval settings */}
                            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                                Bulk Approval Settings
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                These settings will be applied to all selected referrals. Organizations will be auto-detected or created as needed.
                            </Typography>

                            <Grid container spacing={2}>
                                <Grid item xs={12}>
                                    <FormControl fullWidth>
                                        <InputLabel>User Role</InputLabel>
                                        <Select
                                            value={approvalData.ui_role}
                                            onChange={(e) => handleApprovalDataChange('ui_role', e.target.value)}
                                            label="User Role"
                                        >
                                            <MenuItem value="user">User</MenuItem>
                                            <MenuItem value="manager">Manager</MenuItem>
                                            <MenuItem value="head">Head</MenuItem>
                                            <MenuItem value="admin">Admin</MenuItem>
                                        </Select>
                                    </FormControl>
                                </Grid>

                                <Grid item xs={12}>
                                    <FormControlLabel
                                        control={
                                            <Checkbox
                                                checked={approvalData.send_welcome_email}
                                                onChange={(e) => handleApprovalDataChange('send_welcome_email', e.target.checked)}
                                                color="primary"
                                            />
                                        }
                                        label="Send Welcome Email to All New Users"
                                    />
                                </Grid>
                            </Grid>
                        </Box>
                    ) : (
                        <Box>
                            {selectedReferral && (
                                <Box sx={{ mb: 3, p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
                                    <Typography variant="h6" gutterBottom>
                                        {selectedReferral.first_name} {selectedReferral.last_name}
                                    </Typography>
                                    <Typography variant="body2">{selectedReferral.email}</Typography>
                                    {selectedReferral.institution_name && (
                                        <Typography variant="body2">
                                            Institution: {selectedReferral.institution_name}
                                        </Typography>
                                    )}
                                </Box>
                            )}

                            {/* Show the entered institution name from referral */}
                            {selectedReferral?.institution_name && (
                                <Alert
                                    severity="info"
                                    icon={<BusinessIcon />}
                                    sx={{
                                        mb: 2,
                                        background: 'linear-gradient(135deg, #e8f4fd 0%, #f3e5f5 100%)',
                                        border: '1px solid #90caf9'
                                    }}
                                >
                                    <Typography variant="body2" sx={{ fontWeight: 500, mb: 0.5 }}>
                                        Entered Organization Name:
                                    </Typography>
                                    <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#1565c0' }}>
                                        "{selectedReferral.institution_name}"
                                    </Typography>
                                    {orgCheckResult?.exists && (
                                        <Chip
                                            label="✓ Exact Match Found"
                                            color="success"
                                            size="small"
                                            sx={{ mt: 1 }}
                                        />
                                    )}
                                </Alert>
                            )}

                            <Divider sx={{ my: 2 }} />

                            {/* Organization Selection */}
                            <FormControl component="fieldset" sx={{ mb: 3 }}>
                                <FormLabel component="legend">Organization</FormLabel>
                                <RadioGroup
                                    value={approvalData.create_organization ? 'create' : 'existing'}
                                    onChange={(e) => handleApprovalDataChange('create_organization', e.target.value === 'create')}
                                >
                                    <FormControlLabel
                                        value="existing"
                                        control={<Radio />}
                                        label="Use Existing Organization"
                                    />
                                    <FormControlLabel
                                        value="create"
                                        control={<Radio />}
                                        label="Create New Organization"
                                    />
                                </RadioGroup>
                            </FormControl>

                            {approvalData.create_organization ? (
                                <Grid container spacing={2}>
                                    <Grid item xs={12}>
                                        <TextField
                                            fullWidth
                                            label="Organization Name"
                                            value={approvalData.organization_name}
                                            onChange={(e) => handleApprovalDataChange('organization_name', e.target.value)}
                                            required
                                        />
                                    </Grid>
                                    <Grid item xs={12}>
                                        <FormControl fullWidth required>
                                            <InputLabel>Organization Type</InputLabel>
                                            <Select
                                                value={approvalData.organization_type_id}
                                                onChange={(e) => handleApprovalDataChange('organization_type_id', e.target.value)}
                                                label="Organization Type"
                                            >
                                                {organizationTypes.map((type) => (
                                                    <MenuItem key={type.id} value={type.id}>
                                                        {type.type}
                                                    </MenuItem>
                                                ))}
                                            </Select>
                                        </FormControl>
                                    </Grid>
                                </Grid>
                            ) : (
                                <Box sx={{ mb: 2 }}>
                                    {/* Smart Organization Search */}
                                    <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                                        Search and select an existing organization:
                                    </Typography>

                                    <Autocomplete
                                        fullWidth
                                        options={orgSearchResults.length > 0 ? orgSearchResults : organizations.map(org => ({
                                            id: org.id,
                                            name: org.name,
                                            type_id: org.type,
                                            match_score: 0,
                                            match_type: 'none'
                                        }))}
                                        getOptionLabel={(option) => option.name || ''}
                                        value={selectedOrg}
                                        loading={orgSearchLoading}
                                        inputValue={orgSearchInput}
                                        onInputChange={(event, newInputValue) => {
                                            handleOrganizationSearch(newInputValue);
                                        }}
                                        onChange={(event, newValue) => {
                                            setSelectedOrg(newValue);
                                            if (newValue) {
                                                handleApprovalDataChange('organization_id', newValue.id);
                                                loadTemplatesForOrganization(newValue.id);
                                            } else {
                                                handleApprovalDataChange('organization_id', '');
                                            }
                                        }}
                                        isOptionEqualToValue={(option, value) => option.id === value?.id}
                                        filterOptions={(x) => x} // Disable client-side filtering since server does it
                                        renderOption={(props, option) => {
                                            const badge = getMatchBadge(option.match_type, option.match_score);
                                            return (
                                                <Box
                                                    component="li"
                                                    {...props}
                                                    sx={{
                                                        display: 'flex !important',
                                                        justifyContent: 'space-between !important',
                                                        alignItems: 'center !important',
                                                        borderLeft: option.match_type === 'exact'
                                                            ? '4px solid #4caf50'
                                                            : option.match_score > 70
                                                                ? '4px solid #ff9800'
                                                                : '4px solid transparent',
                                                        '&:hover': {
                                                            backgroundColor: option.match_type === 'exact'
                                                                ? '#e8f5e9 !important'
                                                                : undefined
                                                        }
                                                    }}
                                                >
                                                    <Box sx={{ flex: 1 }}>
                                                        <Typography
                                                            variant="body1"
                                                            sx={{
                                                                fontWeight: option.match_type === 'exact' ? 'bold' : 'normal'
                                                            }}
                                                        >
                                                            {option.name}
                                                        </Typography>
                                                        {option.type_name && (
                                                            <Typography variant="caption" color="text.secondary">
                                                                {option.type_name}
                                                            </Typography>
                                                        )}
                                                    </Box>
                                                    {badge && (
                                                        <Chip
                                                            label={badge.label}
                                                            color={badge.color}
                                                            size="small"
                                                            sx={{ ml: 1, minWidth: 90 }}
                                                        />
                                                    )}
                                                    {option.match_score > 0 && (
                                                        <Box sx={{ width: 50, ml: 1 }}>
                                                            <LinearProgress
                                                                variant="determinate"
                                                                value={option.match_score}
                                                                color={
                                                                    option.match_score >= 80 ? 'success' :
                                                                        option.match_score >= 50 ? 'warning' : 'inherit'
                                                                }
                                                                sx={{ height: 6, borderRadius: 3 }}
                                                            />
                                                        </Box>
                                                    )}
                                                </Box>
                                            );
                                        }}
                                        renderInput={(params) => (
                                            <TextField
                                                {...params}
                                                label="Search Organizations"
                                                placeholder="Type to search..."
                                                required
                                                InputProps={{
                                                    ...params.InputProps,
                                                    endAdornment: (
                                                        <>
                                                            {orgSearchLoading ? (
                                                                <CircularProgress color="inherit" size={20} />
                                                            ) : null}
                                                            {params.InputProps.endAdornment}
                                                        </>
                                                    ),
                                                }}
                                                helperText={
                                                    orgSearchResults.length > 0 && orgSearchInput
                                                        ? `Found ${orgSearchResults.length} matching organization(s)`
                                                        : "Start typing to find similar organizations"
                                                }
                                            />
                                        )}
                                        noOptionsText={
                                            orgSearchLoading
                                                ? "Searching..."
                                                : orgSearchInput
                                                    ? "No matching organizations found. Consider creating a new one."
                                                    : "Type to search organizations"
                                        }
                                    />

                                    {/* Show selected organization details */}
                                    {selectedOrg && (
                                        <Alert severity="success" sx={{ mt: 2 }}>
                                            <Typography variant="body2">
                                                <strong>Selected Organization:</strong> {selectedOrg.name}
                                                {selectedOrg.match_score > 0 && (
                                                    <Chip
                                                        label={`${selectedOrg.match_score}% Match`}
                                                        color={selectedOrg.match_score >= 80 ? 'success' : 'warning'}
                                                        size="small"
                                                        sx={{ ml: 1 }}
                                                    />
                                                )}
                                            </Typography>
                                        </Alert>
                                    )}
                                </Box>
                            )}

                            <Divider sx={{ my: 2 }} />

                            {/* User Role */}
                            <FormControl fullWidth sx={{ mb: 2 }}>
                                <InputLabel>User Role</InputLabel>
                                <Select
                                    value={approvalData.ui_role}
                                    onChange={(e) => handleApprovalDataChange('ui_role', e.target.value)}
                                    label="User Role"
                                >
                                    <MenuItem value="user">User</MenuItem>
                                    <MenuItem value="manager">Manager</MenuItem>
                                    <MenuItem value="head">Head</MenuItem>
                                    <MenuItem value="admin">Admin</MenuItem>
                                </Select>
                            </FormControl>

                            {/* Survey Template */}
                            {templates.length > 0 && (
                                <FormControl fullWidth sx={{ mb: 2 }}>
                                    <InputLabel>Assign Survey Template (Optional)</InputLabel>
                                    <Select
                                        value={approvalData.template_id}
                                        onChange={(e) => handleApprovalDataChange('template_id', e.target.value)}
                                        label="Assign Survey Template (Optional)"
                                    >
                                        <MenuItem value="">None</MenuItem>
                                        {templates.map((template) => (
                                            <MenuItem key={template.id} value={template.id}>
                                                {template.name}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            )}

                            {/* Send Welcome Email */}
                            <FormControlLabel
                                control={
                                    <Checkbox
                                        checked={approvalData.send_welcome_email}
                                        onChange={(e) => handleApprovalDataChange('send_welcome_email', e.target.checked)}
                                        color="primary"
                                    />
                                }
                                label="Send Welcome Email to New User"
                            />
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    {!successMessage && bulkProgress.results.length === 0 && (
                        <Button
                            onClick={isBulkOperation ? handleBulkApprove : handleApprove}
                            variant="contained"
                            color="success"
                            disabled={
                                approvalLoading ||
                                (!isBulkOperation && !approvalData.create_organization && !approvalData.organization_id)
                            }
                            startIcon={approvalLoading ? <CircularProgress size={20} /> : <CheckCircleIcon />}
                        >
                            {approvalLoading
                                ? 'Processing...'
                                : isBulkOperation
                                    ? `Approve ${selectedReferralIds.length} Referral(s)`
                                    : 'Approve & Create User'}
                        </Button>
                    )}
                    <Button onClick={handleCloseApprovalDialog} disabled={approvalLoading}>
                        {successMessage || bulkProgress.results.length > 0 ? 'Close' : 'Cancel'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Rejection Dialog */}
            <Dialog open={openRejectDialog} onClose={handleCloseRejectDialog}>
                <DialogTitle sx={{ bgcolor: '#d32f2f', color: 'white' }}>
                    {selectedReferralIds.length > 0
                        ? `Reject ${selectedReferralIds.length} Contact Referral(s)`
                        : 'Reject Contact Referral'}
                </DialogTitle>
                <DialogContent sx={{ mt: 2 }}>
                    <Typography>
                        {selectedReferralIds.length > 0
                            ? `Are you sure you want to reject and delete ${selectedReferralIds.length} contact referral(s)?`
                            : 'Are you sure you want to reject and delete this contact referral?'}
                    </Typography>
                    {selectedReferralIds.length > 0 ? (
                        <Box sx={{ mt: 2, maxHeight: 200, overflowY: 'auto' }}>
                            {referrals
                                .filter(r => selectedReferralIds.includes(r.id))
                                .map(referral => (
                                    <Box key={referral.id} sx={{ p: 1, mb: 1, bgcolor: '#f5f5f5', borderRadius: 1 }}>
                                        <Typography variant="body2">
                                            <strong>{referral.first_name} {referral.last_name}</strong> - {referral.email}
                                        </Typography>
                                    </Box>
                                ))}
                        </Box>
                    ) : selectedReferral && (
                        <Box sx={{ mt: 2, p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
                            <Typography variant="body2">
                                <strong>{selectedReferral.first_name} {selectedReferral.last_name}</strong>
                            </Typography>
                            <Typography variant="body2">{selectedReferral.email}</Typography>
                        </Box>
                    )}
                    <Alert severity="warning" sx={{ mt: 2 }}>
                        This action cannot be undone.
                    </Alert>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseRejectDialog} disabled={rejectLoading}>
                        Cancel
                    </Button>
                    <Button
                        onClick={selectedReferralIds.length > 0 ? handleBulkReject : handleReject}
                        variant="contained"
                        color="error"
                        disabled={rejectLoading}
                        startIcon={rejectLoading ? <CircularProgress size={20} /> : <CancelIcon />}
                    >
                        {rejectLoading
                            ? 'Deleting...'
                            : selectedReferralIds.length > 0
                                ? `Reject ${selectedReferralIds.length} Referral(s)`
                                : 'Reject & Delete'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}

export default ContactReferrals;
