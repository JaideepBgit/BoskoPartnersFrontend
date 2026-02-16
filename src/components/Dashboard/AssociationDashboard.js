import React, { useEffect, useState, useMemo } from 'react';
import {
    Container, Typography, Box, Card, Grid, CircularProgress, IconButton, Chip,
    Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField,
    FormControl, InputLabel, Select, MenuItem
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import Navbar from '../shared/Navbar/Navbar';
import DataTable from '../shared/DataTable/DataTable';
import PeopleIcon from '@mui/icons-material/People';
import BusinessIcon from '@mui/icons-material/Business';
import AssessmentIcon from '@mui/icons-material/Assessment';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import PreviewIcon from '@mui/icons-material/Preview';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import SendIcon from '@mui/icons-material/Send';

const colors = {
    primary: '#633394',
    secondary: '#967CB2',
    background: '#f5f5f5',
    cardBg: '#ffffff',
    text: '#212121',
    textSecondary: '#757575',
    headerBg: '#FAFAFA',
    borderColor: '#e0e0e0',
    filledColor: '#633394',
    notFilledColor: '#967CB2',
    highlightBg: '#f3e5f5'
};

function AssociationDashboard({ onLogout }) {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [associationData, setAssociationData] = useState(null);
    const [linkedOrganizations, setLinkedOrganizations] = useState([]);
    const [allUsers, setAllUsers] = useState([]);
    const [surveyResponses, setSurveyResponses] = useState([]);
    const [pendingUsers, setPendingUsers] = useState([]);
    const [stats, setStats] = useState({
        totalOrganizations: 0,
        totalUsers: 0,
        completedSurveys: 0,
        pendingSurveys: 0,
        completionRate: 0
    });

    // Date editing states
    const [dateEditDialog, setDateEditDialog] = useState(false);
    const [selectedResponse, setSelectedResponse] = useState(null);
    const [editDates, setEditDates] = useState({ start_date: '', end_date: '' });

    // Filters and selection states
    const [filters, setFilters] = useState({ organization: '', users: '', status: '' });
    const [uniqueCompanies, setUniqueCompanies] = useState([]);
    const [selectedUsers, setSelectedUsers] = useState([]);

    useEffect(() => {
        loadAssociationData();
    }, []);

    const loadAssociationData = async () => {
        try {
            setLoading(true);

            // Get current user
            const userString = localStorage.getItem('user');
            if (!userString) {
                navigate('/login');
                return;
            }

            const currentUser = JSON.parse(userString);
            
            // Verify user has association role
            const userRole = localStorage.getItem('userRole');
            if (userRole !== 'association') {
                navigate('/dashboard');
                return;
            }

            // Get association organization
            const associationId = currentUser.organization_id;
            if (!associationId) {
                console.error('No association organization found');
                setLoading(false);
                return;
            }

            // Fetch association details
            const orgResponse = await fetch(`/api/organizations/${associationId}`);
            const association = await orgResponse.json();
            setAssociationData(association);

            // Fetch all organizations to find linked ones
            const allOrgsResponse = await fetch('/api/organizations');
            const allOrgs = await allOrgsResponse.json();

            // Find organizations linked to this association
            const linkedOrgs = allOrgs.filter(org => {
                if (org.id === associationId) return false;
                return (
                    org.denomination_affiliation === association.name ||
                    org.accreditation_status_or_body === association.name ||
                    org.affiliation_validation === association.name ||
                    org.umbrella_association_membership === association.name
                );
            });

            // Fetch users and responses for linked organizations
            const usersResponse = await fetch('/api/users/role/user');
            const allUsersData = await usersResponse.json();
            
            const responsesResponse = await fetch('/api/responses');
            const allResponses = await responsesResponse.json();
            setSurveyResponses(allResponses);

            // Fetch pending surveys
            const pendingResponse = await fetch('/api/users/pending-surveys');
            const pendingData = await pendingResponse.json();
            setPendingUsers(pendingData.users || []);

            // Filter users belonging to linked organizations
            const linkedOrgIds = linkedOrgs.map(o => o.id);
            const linkedUsers = allUsersData.filter(u => linkedOrgIds.includes(u.organization_id));

            // Process users with status
            const processedUsers = linkedUsers.map(user => {
                const surveyResponse = allResponses.find(r => r.user_id === user.id);
                const displayStatus = surveyResponse?.status === 'completed' ? 'Filled' : 'Not-Filled';
                const pendingUser = pendingData.users?.find(p => p.id === user.id);

                return {
                    id: user.id,
                    name: `${user.firstname} ${user.lastname}`,
                    username: user.username,
                    email: user.email,
                    company_name: user.organization?.name,
                    organization_id: user.organization_id,
                    status: displayStatus,
                    survey_code: user.survey_code,
                    response_status: surveyResponse?.status || null,
                    start_date: surveyResponse?.start_date || null,
                    end_date: surveyResponse?.end_date || null,
                    days_since_creation: pendingUser?.days_since_creation || 0,
                    reminder: 0
                };
            });

            setLinkedOrganizations(linkedOrgs);
            setAllUsers(processedUsers);
            setUniqueCompanies([...new Set(processedUsers.map(u => u.company_name).filter(Boolean))]);

            // Calculate stats
            const completedCount = processedUsers.filter(u => u.status === 'Filled').length;
            const completionRate = processedUsers.length > 0 ? Math.round((completedCount / processedUsers.length) * 100) : 0;

            setStats({
                totalOrganizations: linkedOrgs.length,
                totalUsers: processedUsers.length,
                completedSurveys: completedCount,
                pendingSurveys: processedUsers.length - completedCount,
                completionRate: completionRate
            });

        } catch (error) {
            console.error('Error loading association dashboard:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSendReminder = (userId, event) => {
        event.stopPropagation();
        console.log('Send reminder to user:', userId);
    };

    const handlePreviewEmail = (userId, event) => {
        event.stopPropagation();
        console.log('Preview email for user:', userId);
    };

    const handleFilterChange = (event) => {
        setFilters({
            ...filters,
            [event.target.name]: event.target.value
        });
    };

    const handleSelectAllUsers = () => {
        const filteredUserIds = filteredUsers
            .filter(user => user.status === 'Not-Filled')
            .map(user => user.id);

        setSelectedUsers(prev =>
            prev.length === filteredUserIds.length ? [] : filteredUserIds
        );
    };

    const handleSendBulkReminders = () => {
        console.log('Send bulk reminders to:', selectedUsers);
        // TODO: Implement bulk reminders
    };

    const handleResponseDateClick = (user) => {
        const responseObj = {
            id: user.response_id,
            user_id: user.id,
            survey_code: user.survey_code,
            status: user.response_status || 'pending',
            start_date: user.start_date,
            end_date: user.end_date,
            user_name: user.name,
            user_email: user.email
        };

        setSelectedResponse(responseObj);
        setEditDates({
            start_date: user.start_date ? user.start_date.split('T')[0] : '',
            end_date: user.end_date ? user.end_date.split('T')[0] : ''
        });
        setDateEditDialog(true);
    };

    const handleCloseDateEditDialog = () => {
        setDateEditDialog(false);
        setSelectedResponse(null);
        setEditDates({ start_date: '', end_date: '' });
    };

    const handleDateFieldChange = (field, value) => {
        setEditDates(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleSaveDates = async () => {
        if (!selectedResponse) return;

        try {
            let response;

            if (selectedResponse.id) {
                // Update existing survey response
                response = await fetch(`/api/responses/${selectedResponse.id}/dates`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        start_date: editDates.start_date || null,
                        end_date: editDates.end_date || null,
                    }),
                });
            } else {
                // Create new survey response if it doesn't exist
                const templatesResponse = await fetch('/api/templates');
                const templatesData = await templatesResponse.json();

                if (templatesData.length === 0) {
                    alert('No survey templates found. Please create a survey template first.');
                    return;
                }

                const templateId = templatesData[0].id;

                response = await fetch(`/api/templates/${templateId}/responses`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        user_id: selectedResponse.user_id,
                        answers: {},
                        status: 'pending',
                        start_date: editDates.start_date || null,
                        end_date: editDates.end_date || null,
                    }),
                });
            }

            if (response.ok) {
                const updatedResponse = await response.json();

                // Update local user data state
                setAllUsers(prevUsers => prevUsers.map(user =>
                    user.id === selectedResponse.user_id
                        ? {
                            ...user,
                            response_id: updatedResponse.id || selectedResponse.id,
                            start_date: updatedResponse.start_date,
                            end_date: updatedResponse.end_date,
                            response_status: updatedResponse.status || selectedResponse.status
                        }
                        : user
                ));

                // Also update survey responses state
                setSurveyResponses(prev => {
                    if (selectedResponse.id) {
                        return prev.map(resp =>
                            resp.id === selectedResponse.id
                                ? { ...resp, start_date: updatedResponse.start_date, end_date: updatedResponse.end_date }
                                : resp
                        );
                    } else {
                        return [...prev, {
                            id: updatedResponse.id,
                            user_id: selectedResponse.user_id,
                            survey_code: selectedResponse.survey_code,
                            status: updatedResponse.status,
                            start_date: updatedResponse.start_date,
                            end_date: updatedResponse.end_date,
                            created_at: updatedResponse.created_at
                        }];
                    }
                });

                handleCloseDateEditDialog();
            } else {
                const errorData = await response.json();
                console.error('Failed to update survey response dates:', errorData);
                alert('Failed to update dates: ' + (errorData.error || 'Unknown error'));
            }
        } catch (error) {
            console.error('Error updating survey response dates:', error);
            alert('Error updating dates: ' + error.message);
        }
    };

    // Filter users based on current filters
    const filteredUsers = useMemo(() => {
        return allUsers.filter(user => {
            const organizationMatch = !filters.organization || user.company_name === filters.organization;
            const searchTerm = filters.users.toLowerCase();
            const userMatch = !filters.users ||
                user.name.toLowerCase().includes(searchTerm) ||
                (user.email && user.email.toLowerCase().includes(searchTerm)) ||
                (user.username && user.username.toLowerCase().includes(searchTerm));
            const statusMatch = !filters.status || user.status === filters.status;
            return organizationMatch && userMatch && statusMatch;
        });
    }, [allUsers, filters]);

    const formatDateForDisplay = (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            month: '2-digit',
            day: '2-digit',
            year: '2-digit',
            timeZone: 'UTC'
        });
    };

    // Define table columns - matching AdminDashboard exactly
    const columns = useMemo(() => [
        {
            id: 'organization',
            label: 'Organization',
            sortable: true,
            render: (user) => user.company_name || 'No Organization'
        },
        {
            id: 'users',
            label: 'Users',
            sortable: true,
            render: (user) => (
                <Box>
                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                        {user.name}
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                        {user.email}
                    </Typography>
                </Box>
            )
        },
        {
            id: 'status',
            label: 'Status',
            sortable: true,
            render: (user) => (
                <Chip
                    label={user.status}
                    size="small"
                    color={user.status === 'Filled' ? 'success' : 'warning'}
                    variant="outlined"
                    sx={{
                        color: user.status === 'Filled' ? colors.filledColor : colors.notFilledColor,
                        fontWeight: 'bold'
                    }}
                />
            )
        },
        {
            id: 'days_since_creation',
            label: 'Days Since Created',
            sortable: true,
            render: (user) => (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="body2">
                        {user.days_since_creation} days
                    </Typography>
                    {user.days_since_creation > 14 && (
                        <Chip
                            label="Overdue"
                            size="small"
                            color="error"
                            variant="outlined"
                        />
                    )}
                </Box>
            )
        },
        {
            id: 'response_status',
            label: 'Survey Progress',
            sortable: true,
            render: (user) => {
                const progressStatus = user.response_status || 'pending';
                const progressLabel = progressStatus === 'completed' ? 'Completed' : (progressStatus === 'in_progress' ? 'In Progress' : 'Not Started');
                const progressColor = progressStatus === 'completed' ? 'success' : (progressStatus === 'in_progress' ? 'info' : 'default');
                return (
                    <Chip
                        label={progressLabel}
                        size="small"
                        color={progressColor}
                        variant="outlined"
                    />
                );
            }
        },
        {
            id: 'reminder',
            label: 'Reminders Sent',
            sortable: true,
            render: (user) => (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="body2">
                        {user.reminder || 0}
                    </Typography>
                    {(user.reminder || 0) > 2 && (
                        <Chip
                            label="Many"
                            size="small"
                            color="warning"
                            variant="outlined"
                        />
                    )}
                </Box>
            )
        },
        {
            id: 'start_date',
            label: 'Start Date',
            sortable: true,
            render: (user) => (
                <Typography 
                    variant="body2" 
                    sx={{ 
                        color: user.start_date ? colors.primary : 'text.secondary',
                        cursor: 'pointer',
                        textDecoration: 'underline',
                        '&:hover': { color: colors.secondary }
                    }}
                    onClick={(e) => {
                        e.stopPropagation();
                        handleResponseDateClick(user);
                    }}
                >
                    {formatDateForDisplay(user.start_date)}
                </Typography>
            )
        },
        {
            id: 'end_date',
            label: 'End Date',
            sortable: true,
            render: (user) => (
                <Typography 
                    variant="body2" 
                    sx={{ 
                        color: user.end_date ? colors.primary : 'text.secondary',
                        cursor: 'pointer',
                        textDecoration: 'underline',
                        '&:hover': { color: colors.secondary }
                    }}
                    onClick={(e) => {
                        e.stopPropagation();
                        handleResponseDateClick(user);
                    }}
                >
                    {formatDateForDisplay(user.end_date)}
                </Typography>
            )
        },
        {
            id: 'actions',
            label: 'Actions',
            width: 120,
            render: (user) => (
                <Box sx={{ display: 'flex', gap: 1 }}>
                    <IconButton
                        title="Send Individual Reminder"
                        sx={{ color: colors.primary }}
                        onClick={(e) => handleSendReminder(user.id, e)}
                        disabled={user.status === 'Filled'}
                        size="small"
                    >
                        <NotificationsActiveIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                        title="Preview Welcome Email"
                        sx={{ color: '#10b981' }}
                        onClick={(e) => handlePreviewEmail(user.id, e)}
                        size="small"
                    >
                        <PreviewIcon fontSize="small" />
                    </IconButton>
                </Box>
            )
        }
    ], []);

    if (loading) {
        return (
            <>
                <Navbar onLogout={onLogout} />
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
                    <CircularProgress sx={{ color: colors.primary }} />
                </Box>
            </>
        );
    }

    return (
        <>
            <Navbar onLogout={onLogout} />

            <Container maxWidth="xl" sx={{ py: 4, minHeight: '100vh', backgroundColor: colors.background }}>
                {/* Header with Integrated Metrics */}
                <Box sx={{ mb: 4, display: 'flex', flexDirection: { xs: 'column', md: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'flex-start', md: 'center' }, gap: 3 }}>
                    <Box>
                        <Typography variant="h4" component="h1" sx={{ color: colors.text, fontWeight: 'bold' }}>
                            Association Dashboard
                        </Typography>
                        <Typography variant="body1" sx={{ color: 'text.secondary', mt: 0.5 }}>
                            {associationData?.name || 'Your Association'} Overview & Management
                        </Typography>
                    </Box>

                    {/* Integrated Metrics Display */}
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                        <Box sx={{ px: 2, py: 1, bgcolor: '#ffffff', borderRadius: 2, boxShadow: '0 2px 4px rgba(0,0,0,0.05)', border: '1px solid #eee', display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <Box sx={{ p: 1, borderRadius: '50%', bgcolor: 'rgba(99, 51, 148, 0.1)', color: colors.primary, display: 'flex' }}>
                                <PeopleIcon fontSize="small" />
                            </Box>
                            <Box>
                                <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', lineHeight: 1 }}>Total Users</Typography>
                                <Typography variant="h6" sx={{ fontWeight: 'bold', color: colors.text, lineHeight: 1.2 }}>{stats.totalUsers}</Typography>
                            </Box>
                        </Box>

                        <Box sx={{ px: 2, py: 1, bgcolor: '#ffffff', borderRadius: 2, boxShadow: '0 2px 4px rgba(0,0,0,0.05)', border: '1px solid #eee', display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <Box sx={{ p: 1, borderRadius: '50%', bgcolor: 'rgba(46, 125, 50, 0.1)', color: 'success.main', display: 'flex' }}>
                                <AssessmentIcon fontSize="small" />
                            </Box>
                            <Box>
                                <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', lineHeight: 1 }}>Completion Rate</Typography>
                                <Typography variant="h6" sx={{ fontWeight: 'bold', color: colors.text, lineHeight: 1.2 }}>{stats.completionRate}%</Typography>
                            </Box>
                        </Box>

                        <Box sx={{ px: 2, py: 1, bgcolor: '#ffffff', borderRadius: 2, boxShadow: '0 2px 4px rgba(0,0,0,0.05)', border: '1px solid #eee', display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <Box sx={{ p: 1, borderRadius: '50%', bgcolor: 'rgba(150, 124, 178, 0.1)', color: colors.secondary, display: 'flex' }}>
                                <BusinessIcon fontSize="small" />
                            </Box>
                            <Box>
                                <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', lineHeight: 1 }}>Organizations</Typography>
                                <Typography variant="h6" sx={{ fontWeight: 'bold', color: colors.text, lineHeight: 1.2 }}>{stats.totalOrganizations}</Typography>
                            </Box>
                        </Box>

                        <Box sx={{ px: 2, py: 1, bgcolor: '#ffffff', borderRadius: 2, boxShadow: '0 2px 4px rgba(0,0,0,0.05)', border: '1px solid #eee', display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <Box sx={{ p: 1, borderRadius: '50%', bgcolor: 'rgba(46, 125, 50, 0.1)', color: 'success.main', display: 'flex' }}>
                                <CheckCircleIcon fontSize="small" />
                            </Box>
                            <Box>
                                <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', lineHeight: 1 }}>Completed</Typography>
                                <Typography variant="h6" sx={{ fontWeight: 'bold', color: colors.text, lineHeight: 1.2 }}>{stats.completedSurveys}</Typography>
                            </Box>
                        </Box>
                    </Box>
                </Box>

                {/* Users Table */}
                <Box>
                    <Card sx={{ boxShadow: 3, padding: 2, bgcolor: colors.cardBg }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                            <Box>
                                <Typography variant="h6" sx={{ color: colors.text }}>
                                    Users Across Organizations
                                </Typography>
                                <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
                                    Manage and monitor users from all linked organizations
                                </Typography>
                            </Box>
                            <Button
                                variant="contained"
                                startIcon={<SendIcon />}
                                sx={{ px: 2, py: 1 }}
                                onClick={handleSendBulkReminders}
                                disabled={selectedUsers.length === 0}
                            >
                                Send Bulk Reminders ({selectedUsers.length})
                            </Button>
                        </Box>

                        {/* Filters */}
                        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                            <FormControl variant="outlined" size="small" sx={{ minWidth: 200 }}>
                                <TextField
                                    size="small"
                                    label="Search Users"
                                    name="users"
                                    value={filters.users}
                                    onChange={handleFilterChange}
                                    placeholder="Name, Email, Username..."
                                    variant="outlined"
                                    InputLabelProps={{ shrink: true }}
                                />
                            </FormControl>
                            <FormControl variant="outlined" size="small" sx={{ minWidth: 120 }}>
                                <InputLabel>Organization</InputLabel>
                                <Select name="organization" value={filters.organization} onChange={handleFilterChange} label="Organization">
                                    <MenuItem value=""><em>None</em></MenuItem>
                                    {uniqueCompanies.map((company, index) => (
                                        <MenuItem key={index} value={company}>{company}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                            <FormControl variant="outlined" size="small" sx={{ minWidth: 120 }}>
                                <InputLabel>Status</InputLabel>
                                <Select name="status" value={filters.status} onChange={handleFilterChange} label="Status">
                                    <MenuItem value=""><em>None</em></MenuItem>
                                    <MenuItem value="Filled">Filled</MenuItem>
                                    <MenuItem value="Not-Filled">Not-Filled</MenuItem>
                                </Select>
                            </FormControl>
                        </Box>

                        <DataTable
                            columns={columns}
                            data={filteredUsers}
                            pagination
                            rowsPerPageOptions={[5, 10, 25, 50]}
                            defaultRowsPerPage={10}
                            defaultSortColumn="users"
                            defaultSortDirection="asc"
                            selectable
                            selectedIds={selectedUsers}
                            onSelectionChange={setSelectedUsers}
                            getRowId={(row) => row.id}
                            isRowSelectable={(row) => row.status === 'Not-Filled'}
                            hoverEffect={false}
                            cellBorders
                            borderColor={colors.borderColor}
                            headerBg={colors.headerBg}
                            emptyMessage="No users found in linked organizations"
                            showPaper={false}
                        />
                    </Card>
                </Box>
            </Container>

            {/* Date Edit Dialog */}
            <Dialog open={dateEditDialog} onClose={handleCloseDateEditDialog} maxWidth="sm" fullWidth>
                <DialogTitle>Edit Survey Response Dates</DialogTitle>
                <DialogContent>
                    {selectedResponse && (
                        <Box sx={{ mb: 2, mt: 1 }}>
                            <Typography variant="body2" sx={{ mb: 1 }}>
                                <strong>User:</strong> {selectedResponse.user_name}
                            </Typography>
                            <Typography variant="body2" sx={{ mb: 2 }}>
                                <strong>Email:</strong> {selectedResponse.user_email}
                            </Typography>

                            <TextField
                                label="Start Date"
                                type="date"
                                fullWidth
                                value={editDates.start_date}
                                onChange={(e) => handleDateFieldChange('start_date', e.target.value)}
                                InputLabelProps={{ shrink: true }}
                                sx={{ mb: 2 }}
                            />

                            <TextField
                                label="End Date"
                                type="date"
                                fullWidth
                                value={editDates.end_date}
                                onChange={(e) => handleDateFieldChange('end_date', e.target.value)}
                                InputLabelProps={{ shrink: true }}
                            />
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDateEditDialog}>Cancel</Button>
                    <Button onClick={handleSaveDates} variant="contained" sx={{ backgroundColor: colors.primary }}>
                        Save Dates
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
}

export default AssociationDashboard;
