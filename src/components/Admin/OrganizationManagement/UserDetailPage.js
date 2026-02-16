import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
    Container, Typography, Box, Paper, Button, Grid, Card, CardContent,
    CircularProgress, Alert, Chip, Avatar, Tabs, Tab, Divider,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Breadcrumbs, Link, LinearProgress, Tooltip, IconButton, Collapse,
    Autocomplete, TextField, Snackbar,
    Dialog, DialogTitle, DialogContent, DialogActions, FormControl, InputLabel, Select, MenuItem, ListItemIcon, ListItemText
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import DataTable from '../../shared/DataTable/DataTable';
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
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import ClearIcon from '@mui/icons-material/Clear';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { fetchOrganizations, fetchUsers, fetchUsersByOrganization, fetchUserById, fetchUserOrganizationalTitles, fetchTitles, addUserOrganizationalTitle, removeUserOrganizationalTitle, addTitle } from '../../../services/UserManagement/UserManagementService';
import SurveyAssignmentService from '../../../services/Admin/SurveyAssignment/SurveyAssignmentService';
import UserRelationsGraph from './UserRelationsGraph';
import AccountTreeIcon from '@mui/icons-material/AccountTree';

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
    const location = useLocation();

    // Get navigation context from location state
    const fromAssociationOrganizations = location.state?.fromAssociationOrganizations;
    const fromAssociationUsers = location.state?.fromAssociationUsers;

    // Determine navigation context: from org detail page or from users page
    const isFromOrganization = Boolean(orgId);

    const [organization, setOrganization] = useState(null);
    const [user, setUser] = useState(null);
    const [assignments, setAssignments] = useState([]);
    const [responses, setResponses] = useState([]);
    const [orgTitles, setOrgTitles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState(0);
    const [expandedResponse, setExpandedResponse] = useState(null);

    // Survey assignment state
    const [surveyTemplates, setSurveyTemplates] = useState([]);
    const [selectedSurveyTemplate, setSelectedSurveyTemplate] = useState('');
    const [assigningSnackbar, setAssigningSnackbar] = useState({ open: false, message: '', severity: 'success' });
    const [isAssigning, setIsAssigning] = useState(false);
    const [assignmentTracker, setAssignmentTracker] = useState(null); // { status: 'idle'|'loading'|'complete'|'error', surveyName: '', steps: [] }

    // Organization Assignment State
    const [openAssignDialog, setOpenAssignDialog] = useState(false);
    const [allOrganizations, setAllOrganizations] = useState([]);
    const [allTitles, setAllTitles] = useState([]);
    const [selectedAssignOrg, setSelectedAssignOrg] = useState('');
    const [selectedAssignTitle, setSelectedAssignTitle] = useState('');
    const [isAddingNewTitle, setIsAddingNewTitle] = useState(false);
    const [newTitleName, setNewTitleName] = useState('');


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

            // Fetch survey assignments, responses, and org titles in parallel
            try {
                const [assignmentsData, responsesData, titlesData] = await Promise.all([
                    SurveyAssignmentService.getUserSurveyAssignments(userId),
                    fetchUserSurveyResponses(userId),
                    fetchUserOrganizationalTitles(userId).catch(e => {
                        console.warn("Failed to fetch org titles", e);
                        return [];
                    })
                ]);
                setAssignments(assignmentsData.assignments || []);
                setResponses(responsesData.responses || []);
                setOrgTitles(Array.isArray(titlesData) ? titlesData : []);
            } catch (err) {
                console.error('Error loading survey data:', err);
                setAssignments([]);
                setResponses([]);
                setOrgTitles([]);
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

    // Load ALL available survey templates (across all organizations)
    // so users can be assigned surveys from any org, not just their own.
    const loadSurveyTemplates = async () => {
        try {
            const templateData = await SurveyAssignmentService.getSurveyTemplates();
            setSurveyTemplates(templateData);
        } catch (err) {
            console.error('Error loading survey templates:', err);
            setSurveyTemplates([]);
        }
    };

    // Assign survey to user
    const handleAssignSurvey = async () => {
        if (!selectedSurveyTemplate) return;

        const template = surveyTemplates.find(t => t.id === selectedSurveyTemplate);
        const surveyName = template ? (template.version_name || 'Survey') : 'Survey';

        setIsAssigning(true);
        setAssignmentTracker({
            status: 'loading',
            surveyName: surveyName,
            steps: [
                { id: 'assign', label: 'Creating survey response record...', status: 'loading' },
                { id: 'email', label: 'Sending welcome email...', status: 'pending' },
                { id: 'title', label: 'Verifying title linkage...', status: 'pending' }
            ]
        });

        try {
            const adminId = localStorage.getItem('userId');
            const result = await SurveyAssignmentService.assignSurvey(
                [parseInt(userId)],
                selectedSurveyTemplate,
                adminId
            );

            // Analyze result
            const details = result.results?.details?.[0] || {};
            const assignSuccess = details.assignment_success;
            const emailSuccess = details.email_success;

            setAssignmentTracker({
                status: assignSuccess ? 'complete' : 'error',
                surveyName: surveyName,
                steps: [
                    {
                        id: 'assign',
                        label: assignSuccess ? `Survey assigned (Code: ${details.survey_code})` : `Assignment failed: ${details.assignment_error}`,
                        status: assignSuccess ? 'success' : 'error'
                    },
                    {
                        id: 'email',
                        label: emailSuccess ? `Email sent to ${user.email}` : (details.email_error ? `Email failed: ${details.email_error}` : 'Email skipped'),
                        status: emailSuccess ? 'success' : (details.email_error ? 'error' : 'neutral')
                    },
                    {
                        id: 'title',
                        label: template?.title_name ? `Title linked: ${template.title_name}` : 'No title to link',
                        status: template?.title_name ? 'success' : 'neutral'
                    }
                ]
            });

            if (assignSuccess) {
                setSelectedSurveyTemplate('');
                // Refresh assignments
                const assignmentsData = await SurveyAssignmentService.getUserSurveyAssignments(userId);
                setAssignments(assignmentsData.assignments || []);
            }

        } catch (err) {
            console.error('Error assigning survey:', err);
            setAssignmentTracker(prev => ({
                status: 'error',
                surveyName: prev?.surveyName || 'Survey',
                steps: prev?.steps.map(s => ({ ...s, status: s.status === 'loading' ? 'error' : s.status })) || []
            }));
            setAssigningSnackbar({ open: true, message: 'Failed to assign survey: ' + err.message, severity: 'error' });
        } finally {
            setIsAssigning(false);
        }
    };

    // Load all templates when user data is available
    useEffect(() => {
        if (user) {
            loadSurveyTemplates();
        }
    }, [user]);

    const handleBack = () => {
        // Check if coming from association users page
        if (fromAssociationUsers) {
            navigate('/association-users');
            return;
        }
        
        if (isFromOrganization) {
            // Pass the state back to organization detail page
            navigate(`/organization-management/${orgId}`, {
                state: { fromAssociationOrganizations }
            });
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

    // --- Organization Assignment Handlers ---

    const handleOpenAssignDialog = async () => {
        setOpenAssignDialog(true);
        // Load orgs and titles if not already loaded
        if (allOrganizations.length === 0) {
            try {
                const orgs = await fetchOrganizations();
                setAllOrganizations(orgs);
            } catch (e) {
                console.error("Failed to load organizations", e);
            }
        }
        if (allTitles.length === 0) {
            try {
                const titles = await fetchTitles();
                setAllTitles(titles);
            } catch (e) {
                console.error("Failed to load titles", e);
            }
        }
    };

    const handleCloseAssignDialog = () => {
        setOpenAssignDialog(false);
        setSelectedAssignOrg('');
        setSelectedAssignTitle('');
        setIsAddingNewTitle(false);
        setNewTitleName('');
    };

    const handleAssignOrganization = async () => {
        if (!selectedAssignOrg) return;

        let titleIdToUse = selectedAssignTitle;

        // If adding a new title
        if (isAddingNewTitle && newTitleName) {
            try {
                const newTitleResult = await addTitle({ name: newTitleName });
                titleIdToUse = newTitleResult.title.id;
                // Update local titles list
                setAllTitles([...allTitles, newTitleResult.title]);
            } catch (e) {
                console.error("Failed to add new title", e);
                setError("Failed to create new title");
                return;
            }
        }

        if (!titleIdToUse) {
            setError("Please select or create a title");
            return;
        }

        try {
            await addUserOrganizationalTitle(userId, {
                organization_id: selectedAssignOrg,
                title_id: titleIdToUse
            });

            // Refresh assignments
            const updatedTitles = await fetchUserOrganizationalTitles(userId);
            setOrgTitles(Array.isArray(updatedTitles) ? updatedTitles : []);

            handleCloseAssignDialog();
            setAssigningSnackbar({ open: true, message: 'Organization assigned successfully', severity: 'success' });
        } catch (e) {
            console.error("Failed to assign organization", e);
            setError("Failed to assign organization");
        }
    };

    const handleRemoveAssignment = async (orgId, titleId) => {
        if (window.confirm("Are you sure you want to remove this organization assignment?")) {
            try {
                await removeUserOrganizationalTitle(userId, orgId, titleId);
                // Refresh assignments
                const updatedTitles = await fetchUserOrganizationalTitles(userId);
                setOrgTitles(Array.isArray(updatedTitles) ? updatedTitles : []);
                setAssigningSnackbar({ open: true, message: 'Assignment removed', severity: 'success' });
            } catch (e) {
                console.error("Failed to remove assignment", e);
                setError("Failed to remove assignment");
            }
        }
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

    // Group titles by organization
    const groupedOrgTitles = useMemo(() => {
        // If we have detailed org titles from the API
        if (orgTitles.length > 0) {
            const groups = {};
            // Sort by org name for consistency
            const sortedTitles = [...orgTitles].sort((a, b) =>
                (a.organization_name || '').localeCompare(b.organization_name || '')
            );

            sortedTitles.forEach(t => {
                const orgName = t.organization_name || 'Organization';
                if (!groups[orgName]) groups[orgName] = [];
                if (t.title_name) groups[orgName].push({
                    name: t.title_name,
                    orgId: t.organization_id,
                    titleId: t.title_id
                });
            });
            return groups;
        }

        // Fallback: If no detailed titles fetched, use the primary organization and user.titles
        const primaryOrgName = organization?.name || user?.organization?.name; // Don't show if no org known at all

        if (primaryOrgName) {
            const titles = [];
            // Try to extract titles from user object
            if (user?.titles?.length > 0) {
                user.titles.forEach(t => titles.push({
                    name: typeof t === 'string' ? t : t.name,
                    orgId: organization?.id || user?.organization_id,
                    titleId: typeof t === 'object' ? t.id : null
                }));
            } else if (user?.title) {
                titles.push({
                    name: typeof user.title === 'string' ? user.title : user.title.name,
                    orgId: organization?.id || user?.organization_id,
                    titleId: typeof user.title === 'object' ? user.title.id : null
                });
            }
            return { [primaryOrgName]: titles };
        }

        return {};
    }, [orgTitles, organization, user]);

    // Column definitions for assignments table
    const assignmentColumns = useMemo(() => [
        {
            id: 'survey',
            label: 'Survey',
            render: (assignment) => (
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
            )
        },
        {
            id: 'survey_code',
            label: 'Survey Code',
            render: (assignment) => (
                <Typography variant="body2" color="text.secondary">
                    {assignment.survey_code || '-'}
                </Typography>
            )
        },
        {
            id: 'status',
            label: 'Status',
            render: (assignment) => (
                <Chip
                    label={formatStatus(assignment.status)}
                    size="small"
                    sx={{
                        ...getStatusStyles(assignment.status),
                        fontWeight: 500
                    }}
                />
            )
        },
        {
            id: 'assigned',
            label: 'Assigned',
            render: (assignment) => (
                <Typography variant="body2" color="text.secondary">
                    {assignment.created_at
                        ? new Date(assignment.created_at).toLocaleDateString()
                        : '-'}
                </Typography>
            )
        },
        {
            id: 'updated',
            label: 'Last Updated',
            render: (assignment) => (
                <Typography variant="body2" color="text.secondary">
                    {assignment.updated_at
                        ? new Date(assignment.updated_at).toLocaleDateString()
                        : '-'}
                </Typography>
            )
        }
    ], []);

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
                    sx={{ 
                        mb: 3,
                        '& .MuiBreadcrumbs-separator': {
                            mx: 1
                        }
                    }}
                >
                    {isFromOrganization ? (
                        <>
                            <Link
                                component="button"
                                variant="body2"
                                underline="hover"
                                color="text.secondary"
                                onClick={() => navigate('/organization-management')}
                                sx={{ cursor: 'pointer', display: 'inline-block' }}
                            >
                                Organizations
                            </Link>
                            <Link
                                component="button"
                                variant="body2"
                                underline="hover"
                                color="text.secondary"
                                onClick={handleBack}
                                sx={{ cursor: 'pointer', display: 'inline-block' }}
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
                            sx={{ cursor: 'pointer', display: 'inline-block' }}
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
                                {/* Roles */}
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1.5, mb: 2 }}>
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
                                </Box>

                                {/* Grouped Organizations and Titles */}
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                    {Object.entries(groupedOrgTitles).map(([orgName, titles], idx) => (
                                        <Box key={idx}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                                                <BusinessIcon sx={{ fontSize: '1rem', color: colors.textSecondary }} />
                                                <Typography variant="body2" color="text.secondary" fontWeight="bold">
                                                    {orgName}
                                                </Typography>
                                            </Box>

                                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, pl: 3.5 }}>
                                                {titles.length > 0 ? (
                                                    titles.map((titleObj, titleIdx) => (
                                                        <Chip
                                                            key={`t-${idx}-${titleIdx}`}
                                                            label={titleObj.name}
                                                            size="small"
                                                            variant="outlined"
                                                            onDelete={titleObj.orgId && titleObj.titleId ? () => handleRemoveAssignment(titleObj.orgId, titleObj.titleId) : undefined}
                                                            deleteIcon={<DeleteIcon />}
                                                            sx={{
                                                                fontWeight: 400,
                                                                fontSize: '0.75rem',
                                                                borderColor: '#e0e0e0',
                                                                bgcolor: '#fafafa',
                                                                color: colors.textPrimary
                                                            }}
                                                        />
                                                    ))
                                                ) : (
                                                    <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                                                        No specific titles
                                                    </Typography>
                                                )}
                                            </Box>
                                        </Box>
                                    ))}

                                    {Object.keys(groupedOrgTitles).length === 0 && !organization && (
                                        <Typography variant="body2" color="text.secondary" fontStyle="italic">
                                            No organization assigned
                                        </Typography>
                                    )}

                                    {/* Link for adding organization */}
                                    <Button
                                        startIcon={<AddIcon />}
                                        size="small"
                                        onClick={handleOpenAssignDialog}
                                        sx={{ alignSelf: 'flex-start', mt: 1, textTransform: 'none' }}
                                    >
                                        Assign Organization
                                    </Button>
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>

                    {/* Organization Assignment Dialog */}
                    <Dialog open={openAssignDialog} onClose={handleCloseAssignDialog} maxWidth="sm" fullWidth>
                        <DialogTitle>Assign Organization & Title</DialogTitle>
                        <DialogContent>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
                                <FormControl fullWidth size="small">
                                    <InputLabel>Organization</InputLabel>
                                    <Select
                                        value={selectedAssignOrg}
                                        label="Organization"
                                        onChange={(e) => setSelectedAssignOrg(e.target.value)}
                                    >
                                        {allOrganizations.map((org) => (
                                            <MenuItem key={org.id} value={org.id}>
                                                {org.name}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>

                                {!isAddingNewTitle ? (
                                    <FormControl fullWidth size="small">
                                        <InputLabel>Title</InputLabel>
                                        <Select
                                            value={selectedAssignTitle}
                                            label="Title"
                                            onChange={(e) => {
                                                if (e.target.value === 'new') {
                                                    setIsAddingNewTitle(true);
                                                    setSelectedAssignTitle('');
                                                } else {
                                                    setSelectedAssignTitle(e.target.value);
                                                }
                                            }}
                                        >
                                            {allTitles.map((t) => (
                                                <MenuItem key={t.id} value={t.id}>
                                                    {t.name}
                                                </MenuItem>
                                            ))}
                                            <Divider />
                                            <MenuItem value="new">
                                                <ListItemIcon><AddIcon fontSize="small" /></ListItemIcon>
                                                <ListItemText>Add New Title</ListItemText>
                                            </MenuItem>
                                        </Select>
                                    </FormControl>
                                ) : (
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <TextField
                                            fullWidth
                                            size="small"
                                            label="New Title Name"
                                            value={newTitleName}
                                            onChange={(e) => setNewTitleName(e.target.value)}
                                        />
                                        <IconButton onClick={() => setIsAddingNewTitle(false)}>
                                            <ClearIcon />
                                        </IconButton>
                                    </Box>
                                )}
                            </Box>
                        </DialogContent>
                        <DialogActions>
                            <Button onClick={handleCloseAssignDialog}>Cancel</Button>
                            <Button
                                onClick={handleAssignOrganization}
                                variant="contained"
                                disabled={!selectedAssignOrg || (!selectedAssignTitle && !newTitleName)}
                            >
                                Assign
                            </Button>
                        </DialogActions>
                    </Dialog>

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
                            <Tab
                                label="Relations"
                                icon={<AccountTreeIcon sx={{ fontSize: '1.1rem' }} />}
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
                                        options={surveyTemplates
                                            .filter(t => !assignments.some(a => a.template_id === t.id))
                                            .sort((a, b) => (a.organization_name || '').localeCompare(b.organization_name || ''))
                                        }
                                        groupBy={(option) => option.organization_name || 'General'}
                                        value={surveyTemplates.find(t => t.id === selectedSurveyTemplate) || null}
                                        onChange={(event, newValue) => {
                                            setSelectedSurveyTemplate(newValue ? newValue.id : '');
                                        }}
                                        getOptionLabel={(option) =>
                                            `${option.version_name || 'Survey'}${option.survey_code ? ` — ${option.survey_code}` : ''}${option.title_name ? ` (${option.title_name})` : ''}`
                                        }
                                        isOptionEqualToValue={(option, value) => option.id === value.id}
                                        renderGroup={(params) => (
                                            <li key={params.key}>
                                                <Box sx={{
                                                    px: 2, py: 0.75,
                                                    fontWeight: 700, fontSize: '0.75rem',
                                                    color: colors.primary,
                                                    backgroundColor: colors.accentBg,
                                                    textTransform: 'uppercase',
                                                    letterSpacing: '0.5px',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: 1
                                                }}>
                                                    <BusinessIcon sx={{ fontSize: '0.9rem' }} />
                                                    {params.group}
                                                </Box>
                                                <ul style={{ padding: 0 }}>{params.children}</ul>
                                            </li>
                                        )}
                                        renderOption={(props, option) => (
                                            <li {...props} key={option.id}>
                                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25, py: 0.5, width: '100%' }}>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                        <AssignmentIcon sx={{ fontSize: '1rem', color: colors.primary }} />
                                                        <Typography variant="body2" fontWeight="600" color="text.primary">
                                                            {option.version_name || 'Survey'}
                                                        </Typography>
                                                        {option.survey_code && (
                                                            <Chip
                                                                label={option.survey_code}
                                                                size="small"
                                                                sx={{
                                                                    height: 20,
                                                                    fontSize: '0.65rem',
                                                                    fontWeight: 500,
                                                                    bgcolor: '#f0f0f0',
                                                                    color: colors.textSecondary,
                                                                }}
                                                            />
                                                        )}
                                                    </Box>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, pl: 3.5 }}>
                                                        {option.title_name && (
                                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                                <PersonIcon sx={{ fontSize: '0.75rem', color: colors.textSecondary }} />
                                                                <Typography variant="caption" color="text.secondary">
                                                                    Title: <strong>{option.title_name}</strong>
                                                                </Typography>
                                                            </Box>
                                                        )}
                                                        {option.organization_name && (
                                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                                <BusinessIcon sx={{ fontSize: '0.8rem', color: colors.textSecondary }} />
                                                                <Typography variant="caption" color="text.secondary">
                                                                    Org: <strong>{option.organization_name}</strong>
                                                                </Typography>
                                                            </Box>
                                                        )}
                                                    </Box>
                                                </Box>
                                            </li>
                                        )}
                                        filterOptions={(options, { inputValue }) => {
                                            const filterVal = inputValue.toLowerCase();
                                            return options.filter(option =>
                                                (option.version_name || '').toLowerCase().includes(filterVal) ||
                                                (option.survey_code || '').toLowerCase().includes(filterVal) ||
                                                (option.title_name || '').toLowerCase().includes(filterVal) ||
                                                (option.organization_name || '').toLowerCase().includes(filterVal)
                                            );
                                        }}
                                        renderInput={(params) => (
                                            <TextField
                                                {...params}
                                                label="Assign New Survey"
                                                placeholder="Search by survey name, code, title, or organization..."
                                            />
                                        )}
                                    />
                                    <Button
                                        variant="contained"
                                        startIcon={isAssigning ? <CircularProgress size={20} color="inherit" /> : <AddIcon />}
                                        disabled={!selectedSurveyTemplate || isAssigning}
                                        onClick={handleAssignSurvey}
                                        sx={{
                                            backgroundColor: colors.primary,
                                            '&:hover': { backgroundColor: colors.secondary },
                                            textTransform: 'none',
                                            borderRadius: 2,
                                            whiteSpace: 'nowrap',
                                            minWidth: 100
                                        }}
                                    >
                                        {isAssigning ? 'Assigning...' : 'Assign'}
                                    </Button>
                                </Box>

                                {/* Assignment Status Tracker */}
                                {assignmentTracker && (
                                    <Paper elevation={0} sx={{
                                        mb: 3, p: 2,
                                        bgcolor: assignmentTracker.status === 'error' ? '#fff4f4' : '#f0f9f0',
                                        border: `1px solid ${assignmentTracker.status === 'error' ? '#ffcdd2' : '#c8e6c9'}`,
                                        borderRadius: 2
                                    }}>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                                            <Typography variant="subtitle2" fontWeight="bold" sx={{ color: assignmentTracker.status === 'error' ? '#d32f2f' : '#2e7d32' }}>
                                                {assignmentTracker.status === 'loading' ? 'Processing Assignment...' : (assignmentTracker.status === 'error' ? 'Assignment Failed' : 'Assignment Complete')}
                                            </Typography>
                                            {!isAssigning && (
                                                <IconButton size="small" onClick={() => setAssignmentTracker(null)} title="Clear">
                                                    <ClearIcon fontSize="small" />
                                                </IconButton>
                                            )}
                                        </Box>
                                        <Box sx={{ ml: 1 }}>
                                            {assignmentTracker.steps.map((step, idx) => (
                                                <Box key={step.id} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1, height: 24 }}>
                                                    {step.status === 'loading' && <CircularProgress size={16} sx={{ color: colors.primary }} />}
                                                    {step.status === 'success' && <CheckCircleIcon sx={{ fontSize: 18, color: '#2e7d32' }} />}
                                                    {step.status === 'error' && <ErrorOutlineIcon sx={{ fontSize: 18, color: '#d32f2f' }} />}
                                                    {(step.status === 'pending' || step.status === 'neutral') && <HourglassEmptyIcon sx={{ fontSize: 18, color: '#9e9e9e', opacity: 0.5 }} />}

                                                    <Typography variant="body2" sx={{
                                                        color: step.status === 'neutral' ? 'text.disabled' : 'text.primary',
                                                        fontWeight: step.status === 'loading' ? 600 : 400
                                                    }}>
                                                        {step.label}
                                                    </Typography>
                                                </Box>
                                            ))}
                                        </Box>
                                    </Paper>
                                )}

                                {/* Assignments Table */}
                                {assignments.length === 0 ? (
                                    <Box sx={{ textAlign: 'center', py: 4 }}>
                                        <AssignmentIcon sx={{ fontSize: 48, color: colors.borderColor, mb: 1 }} />
                                        <Typography color="text.secondary">
                                            No survey assignments found for this user
                                        </Typography>
                                    </Box>
                                ) : (
                                    <DataTable
                                        columns={assignmentColumns}
                                        data={assignments}
                                        showPaper={false}
                                        emptyMessage="No survey assignments found"
                                        paperSx={{ borderRadius: 2, boxShadow: 'none', border: `1px solid ${colors.borderColor}` }}
                                    />
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
                                                            '&:hover': { backgroundColor: '#f5f5f5' }
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

                        {/* Relations Graph Tab */}
                        {activeTab === 2 && (
                            <Box sx={{ p: 3 }}>
                                <UserRelationsGraph
                                    userId={userId}
                                    user={user}
                                    organization={organization}
                                    orgTitles={orgTitles}
                                />
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
