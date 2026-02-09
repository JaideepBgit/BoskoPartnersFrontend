import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Container, Typography, Box, Paper, Button, Grid, Card, CardContent,
    CircularProgress, Alert, Chip, Avatar, Tabs, Tab, Divider,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Breadcrumbs, Link, LinearProgress, Tooltip, IconButton, Collapse,
    Autocomplete, TextField, Snackbar
} from '@mui/material';
import InternalHeader from '../../shared/Headers/InternalHeader';
import Navbar from '../../shared/Navbar/Navbar';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PersonIcon from '@mui/icons-material/Person';
import EmailIcon from '@mui/icons-material/Email';
import BusinessIcon from '@mui/icons-material/Business';
import AssignmentIcon from '@mui/icons-material/Assignment';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import StarIcon from '@mui/icons-material/Star';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import QuizIcon from '@mui/icons-material/Quiz';
import AddIcon from '@mui/icons-material/Add';
import { fetchOrganizations, fetchUsers, fetchUsersByOrganization, fetchUserById } from '../../../services/UserManagement/UserManagementService';
import SurveyAssignmentService from '../../../services/Admin/SurveyAssignment/SurveyAssignmentService';

// Color theme - matches OrganizationDetailPage
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

// Status chip styling helper - using platform palette only
const getStatusStyles = (status) => {
    switch (status?.toLowerCase()) {
        case 'completed':
        case 'submitted':
            return { bgcolor: '#f3e5f5', color: '#633394' };
        case 'in_progress':
        case 'in progress':
            return { bgcolor: '#f3e5f5', color: '#967CB2' };
        case 'pending':
        case 'assigned':
        default:
            return { bgcolor: '#f5f5f5', color: '#757575' };
    }
};

// Format status label
const formatStatus = (status) => {
    if (!status) return 'Pending';
    return status.charAt(0).toUpperCase() + status.slice(1).replace(/_/g, ' ');
};

function UserDetailPage() {
    const { orgId, userId } = useParams();
    const navigate = useNavigate();

    // Determine navigation context: from org detail page or from users page
    const isFromOrganization = Boolean(orgId);

    const [organization, setOrganization] = useState(null);
    const [user, setUser] = useState(null);
    const [assignments, setAssignments] = useState([]);
    const [responses, setResponses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState(0);
    const [expandedResponse, setExpandedResponse] = useState(null);

    // Survey assignment state
    const [surveyTemplates, setSurveyTemplates] = useState([]);
    const [selectedSurveyTemplate, setSelectedSurveyTemplate] = useState('');
    const [assigningSnackbar, setAssigningSnackbar] = useState({ open: false, message: '', severity: 'success' });

    // Load data
    useEffect(() => {
        loadData();
    }, [orgId, userId]);

    const loadData = async () => {
        try {
            setLoading(true);
            setError(null);

            if (isFromOrganization) {
                // Context: /organization-management/:orgId/users/:userId
                const [orgData, orgUsers] = await Promise.all([
                    fetchOrganizations(),
                    fetchUsersByOrganization(orgId)
                ]);

                const org = orgData.find(o => o.id === parseInt(orgId));
                if (!org) {
                    setError('Organization not found');
                    setLoading(false);
                    return;
                }
                setOrganization(org);

                // Find the specific user from the org users list (richer data)
                const userFromOrg = orgUsers.find(u => u.id === parseInt(userId));
                if (userFromOrg) {
                    try {
                        const fullUserData = await fetchUserById(userId);
                        setUser({ ...userFromOrg, ...fullUserData, roles: userFromOrg.roles, titles: userFromOrg.titles });
                    } catch {
                        setUser(userFromOrg);
                    }
                } else {
                    try {
                        const userData = await fetchUserById(userId);
                        setUser(userData);
                    } catch {
                        setError('User not found in this organization');
                        setLoading(false);
                        return;
                    }
                }
            } else {
                // Context: /users/:userId
                // Fetch the user from the full users list (has richer data including org, geo, roles)
                const [allUsers, orgData] = await Promise.all([
                    fetchUsers(),
                    fetchOrganizations()
                ]);

                const foundUser = allUsers.find(u => u.id === parseInt(userId));
                if (!foundUser) {
                    setError('User not found');
                    setLoading(false);
                    return;
                }
                setUser(foundUser);

                // Resolve the organization from the user's organization_id
                if (foundUser.organization_id) {
                    const org = orgData.find(o => o.id === foundUser.organization_id);
                    if (org) setOrganization(org);
                } else if (foundUser.organization) {
                    // Some user objects already have the org embedded
                    setOrganization(foundUser.organization);
                }
            }

            // Fetch survey assignments and responses in parallel
            try {
                const [assignmentsData, responsesData] = await Promise.all([
                    SurveyAssignmentService.getUserSurveyAssignments(userId),
                    fetchUserSurveyResponses(userId)
                ]);
                setAssignments(assignmentsData.assignments || []);
                setResponses(responsesData.responses || []);
            } catch (err) {
                console.error('Error loading survey data:', err);
                setAssignments([]);
                setResponses([]);
            }
        } catch (err) {
            console.error('Error loading user detail data:', err);
            setError('Failed to load user data');
        } finally {
            setLoading(false);
        }
    };

    // Fetch survey responses for a user
    const fetchUserSurveyResponses = async (uid) => {
        const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
        const response = await fetch(`${API_BASE_URL}/survey-responses/user/${uid}`);
        if (!response.ok) {
            throw new Error('Failed to fetch survey responses');
        }
        return await response.json();
    };

    // Load available survey templates for the user's organization
    const loadSurveyTemplates = async (organizationId) => {
        if (!organizationId) return;
        try {
            const templateData = await SurveyAssignmentService.getTemplatesForOrganization(organizationId);
            setSurveyTemplates(templateData);
        } catch (err) {
            console.error('Error loading survey templates:', err);
            setSurveyTemplates([]);
        }
    };

    // Assign survey to user
    const handleAssignSurvey = async () => {
        if (!selectedSurveyTemplate) return;
        try {
            const adminId = localStorage.getItem('userId');
            await SurveyAssignmentService.assignSurvey(
                [parseInt(userId)],
                selectedSurveyTemplate,
                adminId
            );
            setSelectedSurveyTemplate('');
            setAssigningSnackbar({ open: true, message: 'Survey assigned successfully', severity: 'success' });
            // Refresh assignments
            const assignmentsData = await SurveyAssignmentService.getUserSurveyAssignments(userId);
            setAssignments(assignmentsData.assignments || []);
        } catch (err) {
            console.error('Error assigning survey:', err);
            setAssigningSnackbar({ open: true, message: 'Failed to assign survey: ' + err.message, severity: 'error' });
        }
    };

    // Load templates when user/org data is available
    useEffect(() => {
        const userOrgId = orgId || user?.organization_id;
        if (userOrgId) {
            loadSurveyTemplates(userOrgId);
        }
    }, [user, orgId]);

    const handleBack = () => {
        if (isFromOrganization) {
            navigate(`/organization-management/${orgId}`);
        } else {
            navigate('/users');
        }
    };

    const handleTabChange = (event, newValue) => {
        setActiveTab(newValue);
    };

    const toggleResponseExpand = (responseId) => {
        setExpandedResponse(expandedResponse === responseId ? null : responseId);
    };

    // Compute stats
    const stats = {
        totalAssignments: assignments.length,
        completed: assignments.filter(a => a.status === 'completed' || a.status === 'submitted').length,
        pending: assignments.filter(a => a.status !== 'completed' && a.status !== 'submitted').length,
        totalResponses: responses.length
    };

    const completionRate = stats.totalAssignments > 0
        ? Math.round((stats.completed / stats.totalAssignments) * 100)
        : 0;

    // Count answered questions in a response
    const countAnsweredQuestions = (responseObj) => {
        if (!responseObj || typeof responseObj !== 'object') return 0;
        return Object.keys(responseObj).filter(key => {
            const val = responseObj[key];
            return val !== null && val !== undefined && val !== '';
        }).length;
    };

    if (loading) {
        return (
            <>
                <Navbar />
                <Container maxWidth="xl" sx={{ py: 4, textAlign: 'center' }}>
                    <CircularProgress sx={{ color: colors.primary }} />
                    <Typography sx={{ mt: 2 }}>Loading user details...</Typography>
                </Container>
            </>
        );
    }

    if (error) {
        return (
            <>
                <Navbar />
                <Container maxWidth="xl" sx={{ py: 4 }}>
                    <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
                    <Button
                        variant="outlined"
                        startIcon={<ArrowBackIcon />}
                        onClick={handleBack}
                    >
                        {isFromOrganization ? 'Back to Organization' : 'Back to Users'}
                    </Button>
                </Container>
            </>
        );
    }

    return (
        <>
            <InternalHeader
                title={`${user?.firstname || ''} ${user?.lastname || ''}`.trim() || user?.username || 'User Detail'}
                leftActions={
                    <Button
                        variant="outlined"
                        startIcon={<ArrowBackIcon />}
                        onClick={handleBack}
                    >
                        {isFromOrganization ? (organization?.name || 'Organization') : 'Users'}
                    </Button>
                }
            />
            <Container maxWidth="xl" sx={{ py: 4, backgroundColor: colors.background, minHeight: '100vh' }}>

                {/* Breadcrumb Navigation */}
                <Breadcrumbs
                    separator={<NavigateNextIcon fontSize="small" />}
                    sx={{ mb: 3 }}
                >
                    {isFromOrganization ? (
                        <>
                            <Link
                                component="button"
                                variant="body2"
                                underline="hover"
                                color="text.secondary"
                                onClick={() => navigate('/organization-management')}
                                sx={{ cursor: 'pointer' }}
                            >
                                Organizations
                            </Link>
                            <Link
                                component="button"
                                variant="body2"
                                underline="hover"
                                color="text.secondary"
                                onClick={handleBack}
                                sx={{ cursor: 'pointer' }}
                            >
                                {organization?.name || 'Organization'}
                            </Link>
                        </>
                    ) : (
                        <Link
                            component="button"
                            variant="body2"
                            underline="hover"
                            color="text.secondary"
                            onClick={() => navigate('/users')}
                            sx={{ cursor: 'pointer' }}
                        >
                            Users
                        </Link>
                    )}
                    <Typography variant="body2" color="text.primary" fontWeight="600">
                        {`${user?.firstname || ''} ${user?.lastname || ''}`.trim() || user?.username}
                    </Typography>
                </Breadcrumbs>

                {/* User Info Cards */}
                <Grid container spacing={3} sx={{ mb: 3 }}>
                    {/* User Profile Card */}
                    <Grid item xs={12} md={4}>
                        <Card sx={{
                            borderRadius: 3,
                            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                            height: '100%'
                        }}>
                            <CardContent>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                                    <Avatar
                                        sx={{
                                            bgcolor: colors.accentBg,
                                            color: colors.primary,
                                            width: 56,
                                            height: 56,
                                            fontSize: '1.5rem'
                                        }}
                                    >
                                        {user?.firstname ? user.firstname[0].toUpperCase() : <PersonIcon />}
                                    </Avatar>
                                    <Box sx={{ flex: 1 }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                            <Typography variant="h6" fontWeight="bold" color="text.primary">
                                                {user?.firstname} {user?.lastname}
                                            </Typography>
                                            {(user?.role === 'manager' || (user?.roles && user.roles.includes('manager'))) && (
                                                <Tooltip title="Account Holder (Manager)">
                                                    <StarIcon sx={{ fontSize: 18, color: '#FFD700' }} />
                                                </Tooltip>
                                            )}
                                        </Box>
                                        <Typography variant="body2" color="text.secondary">
                                            @{user?.username}
                                        </Typography>
                                    </Box>
                                </Box>
                                <Divider sx={{ my: 1.5 }} />
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                    <EmailIcon sx={{ fontSize: '1rem', color: colors.textSecondary }} />
                                    <Typography variant="body2" color="text.secondary">
                                        {user?.email}
                                    </Typography>
                                </Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                    <BusinessIcon sx={{ fontSize: '1rem', color: colors.textSecondary }} />
                                    <Typography variant="body2" color="text.secondary">
                                        {organization?.name}
                                    </Typography>
                                </Box>
                                {/* Roles */}
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1.5 }}>
                                    {user?.roles && user.roles.length > 0 ? (
                                        user.roles.map((r, idx) => (
                                            <Chip
                                                key={`role-${idx}`}
                                                label={r}
                                                size="small"
                                                sx={{
                                                    bgcolor: colors.accentBg,
                                                    color: colors.primary,
                                                    fontWeight: 500,
                                                    textTransform: 'capitalize'
                                                }}
                                            />
                                        ))
                                    ) : user?.role ? (
                                        <Chip
                                            label={user.role}
                                            size="small"
                                            sx={{ bgcolor: colors.accentBg, color: colors.primary, fontWeight: 500, textTransform: 'capitalize' }}
                                        />
                                    ) : null}
                                    {/* Organizational Titles */}
                                    {user?.titles && user.titles.length > 0 && user.titles.map((t, idx) => (
                                        <Chip
                                            key={`title-${idx}`}
                                            label={t.name}
                                            size="small"
                                            variant="outlined"
                                            sx={{ fontWeight: 400, fontSize: '0.75rem', borderColor: '#ddd' }}
                                        />
                                    ))}
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>

                    {/* Survey Stats Card */}
                    <Grid item xs={12} md={8}>
                        <Card sx={{
                            borderRadius: 3,
                            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                            height: '100%'
                        }}>
                            <CardContent sx={{ pb: '16px !important' }}>
                                <Typography variant="subtitle1" fontWeight="bold" color="text.primary" sx={{ mb: 1.5 }}>
                                    Survey Overview
                                </Typography>
                                <Box sx={{ display: 'flex', gap: 1.5, mb: 1.5, flexWrap: 'wrap' }}>
                                    <Box sx={{
                                        display: 'flex', alignItems: 'center', gap: 1,
                                        px: 1.5, py: 0.75, borderRadius: 1.5,
                                        backgroundColor: colors.accentBg, minWidth: 90
                                    }}>
                                        <Typography variant="h6" fontWeight="bold" color={colors.primary}>
                                            {stats.totalAssignments}
                                        </Typography>
                                        <Typography variant="caption" color={colors.textSecondary}>
                                            Assigned
                                        </Typography>
                                    </Box>
                                    <Box sx={{
                                        display: 'flex', alignItems: 'center', gap: 1,
                                        px: 1.5, py: 0.75, borderRadius: 1.5,
                                        backgroundColor: colors.accentBg, minWidth: 100
                                    }}>
                                        <Typography variant="h6" fontWeight="bold" color={colors.primary}>
                                            {stats.completed}
                                        </Typography>
                                        <Typography variant="caption" color={colors.textSecondary}>
                                            Completed
                                        </Typography>
                                    </Box>
                                    <Box sx={{
                                        display: 'flex', alignItems: 'center', gap: 1,
                                        px: 1.5, py: 0.75, borderRadius: 1.5,
                                        backgroundColor: colors.accentBg, minWidth: 80
                                    }}>
                                        <Typography variant="h6" fontWeight="bold" color={colors.primary}>
                                            {stats.pending}
                                        </Typography>
                                        <Typography variant="caption" color={colors.textSecondary}>
                                            Pending
                                        </Typography>
                                    </Box>
                                    <Box sx={{
                                        display: 'flex', alignItems: 'center', gap: 1,
                                        px: 1.5, py: 0.75, borderRadius: 1.5,
                                        backgroundColor: colors.accentBg, minWidth: 100
                                    }}>
                                        <Typography variant="h6" fontWeight="bold" color={colors.primary}>
                                            {stats.totalResponses}
                                        </Typography>
                                        <Typography variant="caption" color={colors.textSecondary}>
                                            Responses
                                        </Typography>
                                    </Box>
                                </Box>
                                {/* Completion Progress Bar */}
                                <Box>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                        <Typography variant="caption" color="text.secondary">
                                            Completion Rate
                                        </Typography>
                                        <Typography variant="caption" fontWeight="bold" color={colors.primary}>
                                            {completionRate}%
                                        </Typography>
                                    </Box>
                                    <LinearProgress
                                        variant="determinate"
                                        value={completionRate}
                                        sx={{
                                            height: 6,
                                            borderRadius: 3,
                                            backgroundColor: colors.borderColor,
                                            '& .MuiLinearProgress-bar': {
                                                borderRadius: 3,
                                                backgroundColor: colors.primary
                                            }
                                        }}
                                    />
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>

                {/* Tabs: Assignments & Responses */}
                <Paper sx={{
                    borderRadius: 3,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                    overflow: 'hidden'
                }}>
                    <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                        <Tabs
                            value={activeTab}
                            onChange={handleTabChange}
                            sx={{
                                '& .MuiTab-root': { textTransform: 'none', fontWeight: 600 },
                                '& .Mui-selected': { color: colors.primary },
                                '& .MuiTabs-indicator': { backgroundColor: colors.primary }
                            }}
                        >
                            <Tab
                                label={`Survey Assignments (${stats.totalAssignments})`}
                                icon={<AssignmentIcon sx={{ fontSize: '1.1rem' }} />}
                                iconPosition="start"
                            />
                            <Tab
                                label={`Survey Responses (${stats.totalResponses})`}
                                icon={<QuizIcon sx={{ fontSize: '1.1rem' }} />}
                                iconPosition="start"
                            />
                        </Tabs>
                    </Box>

                    <Box sx={{ minHeight: 300 }}>
                        {/* Survey Assignments Tab */}
                        {activeTab === 0 && (
                            <Box sx={{ p: 3 }}>
                                {/* Assign New Survey */}
                                <Box sx={{
                                    display: 'flex', alignItems: 'center', gap: 2, mb: 3,
                                    p: 2, borderRadius: 2,
                                    border: `1px solid ${colors.borderColor}`,
                                    backgroundColor: '#fafafa'
                                }}>
                                    <Autocomplete
                                        size="small"
                                        sx={{ flex: 1, '& .MuiOutlinedInput-root': { backgroundColor: 'white' } }}
                                        options={surveyTemplates.filter(
                                            t => !assignments.some(a => a.template_id === t.id)
                                        )}
                                        value={surveyTemplates.find(t => t.id === selectedSurveyTemplate) || null}
                                        onChange={(event, newValue) => {
                                            setSelectedSurveyTemplate(newValue ? newValue.id : '');
                                        }}
                                        getOptionLabel={(option) =>
                                            `${option.version_name || 'Survey'}${option.survey_code ? ` - ${option.survey_code}` : ''}`
                                        }
                                        renderInput={(params) => (
                                            <TextField
                                                {...params}
                                                label="Assign New Survey"
                                                placeholder="Search available templates..."
                                            />
                                        )}
                                    />
                                    <Button
                                        variant="contained"
                                        startIcon={<AddIcon />}
                                        disabled={!selectedSurveyTemplate}
                                        onClick={handleAssignSurvey}
                                        sx={{
                                            backgroundColor: colors.primary,
                                            '&:hover': { backgroundColor: colors.secondary },
                                            textTransform: 'none',
                                            borderRadius: 2,
                                            whiteSpace: 'nowrap'
                                        }}
                                    >
                                        Assign
                                    </Button>
                                </Box>

                                {/* Assignments Table */}
                                {assignments.length === 0 ? (
                                    <Box sx={{ textAlign: 'center', py: 4 }}>
                                        <AssignmentIcon sx={{ fontSize: 48, color: colors.borderColor, mb: 1 }} />
                                        <Typography color="text.secondary">
                                            No survey assignments found for this user
                                        </Typography>
                                    </Box>
                                ) : (
                                    <TableContainer component={Paper} sx={{ borderRadius: 2, boxShadow: 'none', border: `1px solid ${colors.borderColor}` }}>
                                        <Table>
                                            <TableHead sx={{ backgroundColor: '#FAFAFA' }}>
                                                <TableRow>
                                                    <TableCell sx={{ color: '#000000', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px', fontSize: '0.75rem' }}>Survey</TableCell>
                                                    <TableCell sx={{ color: '#000000', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px', fontSize: '0.75rem' }}>Survey Code</TableCell>
                                                    <TableCell sx={{ color: '#000000', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px', fontSize: '0.75rem' }}>Status</TableCell>
                                                    <TableCell sx={{ color: '#000000', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px', fontSize: '0.75rem' }}>Assigned</TableCell>
                                                    <TableCell sx={{ color: '#000000', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px', fontSize: '0.75rem' }}>Last Updated</TableCell>
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                {assignments.map((assignment) => (
                                                    <TableRow
                                                        key={assignment.id}
                                                        sx={{
                                                            transition: 'background-color 0.2s',
                                                            '&:hover': { backgroundColor: colors.accentBg }
                                                        }}
                                                    >
                                                        <TableCell>
                                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                                <Avatar
                                                                    sx={{
                                                                        bgcolor: colors.accentBg,
                                                                        color: colors.primary,
                                                                        width: 32,
                                                                        height: 32
                                                                    }}
                                                                >
                                                                    <AssignmentIcon sx={{ fontSize: '1.1rem' }} />
                                                                </Avatar>
                                                                <Typography variant="body2" fontWeight="600">
                                                                    {assignment.template_name}
                                                                </Typography>
                                                            </Box>
                                                        </TableCell>
                                                        <TableCell>
                                                            <Typography variant="body2" color="text.secondary">
                                                                {assignment.survey_code || '-'}
                                                            </Typography>
                                                        </TableCell>
                                                        <TableCell>
                                                            <Chip
                                                                label={formatStatus(assignment.status)}
                                                                size="small"
                                                                sx={{
                                                                    ...getStatusStyles(assignment.status),
                                                                    fontWeight: 500
                                                                }}
                                                            />
                                                        </TableCell>
                                                        <TableCell>
                                                            <Typography variant="body2" color="text.secondary">
                                                                {assignment.created_at
                                                                    ? new Date(assignment.created_at).toLocaleDateString()
                                                                    : '-'}
                                                            </Typography>
                                                        </TableCell>
                                                        <TableCell>
                                                            <Typography variant="body2" color="text.secondary">
                                                                {assignment.updated_at
                                                                    ? new Date(assignment.updated_at).toLocaleDateString()
                                                                    : '-'}
                                                            </Typography>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </TableContainer>
                                )}
                            </Box>
                        )}

                        {/* Survey Responses Tab */}
                        {activeTab === 1 && (
                            <Box sx={{ p: 3 }}>
                                {responses.length === 0 ? (
                                    <Box sx={{ textAlign: 'center', py: 4 }}>
                                        <QuizIcon sx={{ fontSize: 48, color: '#e0e0e0', mb: 1 }} />
                                        <Typography color="text.secondary">
                                            No survey responses found for this user
                                        </Typography>
                                    </Box>
                                ) : (
                                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                        {responses.map((response) => {
                                            const isExpanded = expandedResponse === response.id;
                                            const answeredCount = countAnsweredQuestions(response.responses);

                                            return (
                                                <Paper
                                                    key={response.id}
                                                    sx={{
                                                        border: `1px solid ${colors.borderColor}`,
                                                        borderRadius: 2,
                                                        overflow: 'hidden',
                                                        transition: 'box-shadow 0.2s',
                                                        '&:hover': { boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }
                                                    }}
                                                >
                                                    {/* Response Header */}
                                                    <Box
                                                        sx={{
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'space-between',
                                                            p: 2,
                                                            cursor: 'pointer',
                                                            '&:hover': { backgroundColor: '#fafafa' }
                                                        }}
                                                        onClick={() => toggleResponseExpand(response.id)}
                                                    >
                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                                            <Avatar
                                                                sx={{
                                                                    bgcolor: colors.accentBg,
                                                                    color: colors.primary,
                                                                    width: 40,
                                                                    height: 40
                                                                }}
                                                            >
                                                                <QuizIcon />
                                                            </Avatar>
                                                            <Box>
                                                                <Typography variant="body1" fontWeight="600">
                                                                    {response.template_name || 'Survey Response'}
                                                                </Typography>
                                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 0.5 }}>
                                                                    <Typography variant="caption" color="text.secondary">
                                                                        {response.survey_type && (
                                                                            <Chip
                                                                                label={response.survey_type}
                                                                                size="small"
                                                                                sx={{
                                                                                    fontSize: '0.7rem',
                                                                                    height: 20,
                                                                                    bgcolor: colors.accentBg,
                                                                                    color: colors.primary,
                                                                                    textTransform: 'capitalize'
                                                                                }}
                                                                            />
                                                                        )}
                                                                    </Typography>
                                                                    <Typography variant="caption" color="text.secondary">
                                                                        {answeredCount} question{answeredCount !== 1 ? 's' : ''} answered
                                                                    </Typography>
                                                                    {response.submitted_at && (
                                                                        <Typography variant="caption" color="text.secondary">
                                                                            Submitted: {new Date(response.submitted_at).toLocaleDateString()}
                                                                        </Typography>
                                                                    )}
                                                                </Box>
                                                            </Box>
                                                        </Box>
                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                            {response.city && response.country && (
                                                                <Chip
                                                                    label={`${response.city}, ${response.country}`}
                                                                    size="small"
                                                                    variant="outlined"
                                                                    sx={{ fontSize: '0.75rem' }}
                                                                />
                                                            )}
                                                            <IconButton size="small">
                                                                {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                                                            </IconButton>
                                                        </Box>
                                                    </Box>

                                                    {/* Expanded Response Details */}
                                                    <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                                                        <Divider />
                                                        <Box sx={{ p: 2, backgroundColor: '#fafafa' }}>
                                                            {response.responses && typeof response.responses === 'object' ? (
                                                                <TableContainer>
                                                                    <Table size="small">
                                                                        <TableHead>
                                                                            <TableRow>
                                                                                <TableCell sx={{ fontWeight: 'bold', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px', width: '40%' }}>
                                                                                    Question
                                                                                </TableCell>
                                                                                <TableCell sx={{ fontWeight: 'bold', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                                                                    Response
                                                                                </TableCell>
                                                                            </TableRow>
                                                                        </TableHead>
                                                                        <TableBody>
                                                                            {Object.entries(response.responses).map(([key, value]) => (
                                                                                <TableRow key={key}>
                                                                                    <TableCell sx={{ verticalAlign: 'top' }}>
                                                                                        <Typography variant="body2" color="text.secondary" sx={{ wordBreak: 'break-word' }}>
                                                                                            {key}
                                                                                        </Typography>
                                                                                    </TableCell>
                                                                                    <TableCell>
                                                                                        <Typography variant="body2" sx={{ wordBreak: 'break-word' }}>
                                                                                            {typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value || '-')}
                                                                                        </Typography>
                                                                                    </TableCell>
                                                                                </TableRow>
                                                                            ))}
                                                                        </TableBody>
                                                                    </Table>
                                                                </TableContainer>
                                                            ) : (
                                                                <Typography variant="body2" color="text.secondary">
                                                                    No response data available
                                                                </Typography>
                                                            )}
                                                        </Box>
                                                    </Collapse>
                                                </Paper>
                                            );
                                        })}
                                    </Box>
                                )}
                            </Box>
                        )}
                    </Box>
                </Paper>
            </Container>

            {/* Assignment feedback snackbar */}
            <Snackbar
                open={assigningSnackbar.open}
                autoHideDuration={4000}
                onClose={() => setAssigningSnackbar(prev => ({ ...prev, open: false }))}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert
                    onClose={() => setAssigningSnackbar(prev => ({ ...prev, open: false }))}
                    severity={assigningSnackbar.severity}
                    sx={{ width: '100%' }}
                >
                    {assigningSnackbar.message}
                </Alert>
            </Snackbar>
        </>
    );
}

export default UserDetailPage;
