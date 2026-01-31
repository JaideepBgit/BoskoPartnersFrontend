import React, { useEffect, useState, useCallback } from 'react';
import {
    Container, Typography, Box, Card, CardContent, Grid, CircularProgress,
    Button, Paper, Table, TableBody, TableCell, TableContainer, TableHead,
    TableRow, Checkbox, Chip, Dialog, DialogTitle, DialogContent,
    DialogActions, DialogContentText, TextField, Alert, FormControl, InputLabel, Select, MenuItem
} from '@mui/material';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from 'chart.js';
import { Pie } from 'react-chartjs-2';
import Navbar from '../shared/Navbar/Navbar';
import PeopleIcon from '@mui/icons-material/People';
import AssessmentIcon from '@mui/icons-material/Assessment';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PendingIcon from '@mui/icons-material/Pending';
import SendIcon from '@mui/icons-material/Send';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import PreviewIcon from '@mui/icons-material/Preview';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { IconButton } from '@mui/material';
import { useNavigate } from 'react-router-dom';

// Register Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

const managerColors = {
    primary: '#633394',
    secondary: '#3B1C55',
    success: '#3B1C55', // Dark Purple for Completed
    warning: '#967CB2', // Light Purple for Pending (Lavender)
    background: '#ffffff',
    cardBg: '#ffffff',
    headerBg: '#ede7f6', // Light purple for users table
    borderColor: '#e0e0e0',
    highlightBg: '#f3e5f5'
};

function ManagerDashboard({ onLogout }) {
    const [stats, setStats] = useState({
        totalUsers: 0,
        completedSurveys: 0,
        pendingSurveys: 0,
        completionRate: 0
    });
    const [loading, setLoading] = useState(true);
    const [organizationName, setOrganizationName] = useState('');
    const [users, setUsers] = useState([]);
    const [pendingUsers, setPendingUsers] = useState([]);
    const [selectedUsers, setSelectedUsers] = useState([]);
    const [bulkReminderDialog, setBulkReminderDialog] = useState(false);
    const [reminderStatus, setReminderStatus] = useState({ sending: false, results: null });
    const navigate = useNavigate();

    // Table state
    const [page, setPage] = useState(0);
    const rowsPerPage = 10;

    // Reminder state
    const [openReminderDialog, setOpenReminderDialog] = useState(false);
    const [selectedRecipient, setSelectedRecipient] = useState(null);

    // Date editing state
    const [dateEditDialog, setDateEditDialog] = useState(false);
    const [selectedResponse, setSelectedResponse] = useState(null);
    const [editDates, setEditDates] = useState({ start_date: '', end_date: '' });

    // Email Preview state
    const [showEmailPreview, setShowEmailPreview] = useState(false);
    const [emailPreviewContent, setEmailPreviewContent] = useState(null);
    const [loadingEmailPreview, setLoadingEmailPreview] = useState(false);
    const [emailPreviewType, setEmailPreviewType] = useState('html');

    // Date handling functions
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
        setEditDates(prev => ({ ...prev, [field]: value }));
    };

    const handleSaveDates = async () => {
        if (!selectedResponse) return;

        try {
            let response;

            if (selectedResponse.id) {
                // Update existing survey response
                response = await fetch('/api/responses/' + selectedResponse.id + '/dates', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
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
                    alert('No survey templates found.');
                    return;
                }

                const templateId = templatesData[0].id;

                // Create new response
                response = await fetch('/api/responses', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        user_id: selectedResponse.user_id,
                        survey_id: templateId,
                        answers: {},
                        status: 'pending',
                        start_date: editDates.start_date || null,
                        end_date: editDates.end_date || null,
                    }),
                });
            }

            if (response.ok) {
                const updatedResponse = await response.json();

                // Update local users state
                setUsers(prevUsers => prevUsers.map(user =>
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

                handleCloseDateEditDialog();
            } else {
                const errorData = await response.json();
                alert('Failed to update dates: ' + (errorData.error || 'Unknown error'));
            }
        } catch (error) {
            console.error('Error updating survey response dates:', error);
            alert('Error updating dates: ' + error.message);
        }
    };

    useEffect(() => {
        const loadDashboardData = async () => {
            try {
                setLoading(true);

                // Get current user and organization
                const userString = localStorage.getItem('user');
                if (!userString) {
                    navigate('/login');
                    return;
                }

                const currentUser = JSON.parse(userString);
                setOrganizationName(currentUser.organization?.name || currentUser.company_name || 'Your Organization');
                const orgId = currentUser.organization_id;

                if (!orgId) {
                    console.error('No organization ID found for manager');
                    setLoading(false);
                    return;
                }

                // Fetch data in parallel
                const [usersResponse, responsesResponse, pendingResponse] = await Promise.all([
                    fetch('/api/users/role/user'),
                    fetch('/api/responses'),
                    fetch('/api/users/pending-surveys')
                ]);

                const allUsers = await usersResponse.json();
                const allResponses = await responsesResponse.json();
                const pendingData = await pendingResponse.json();

                setPendingUsers(pendingData.users || []);

                // Filter users by organization
                const orgUsers = allUsers.filter(u => u.organization_id === orgId);

                // Process users for table
                const processedUsers = orgUsers.map(user => {
                    const response = allResponses.find(r => r.user_id === user.id);
                    const displayStatus = response?.status === 'completed' ? 'Filled' : 'Not-Filled';
                    const pendingInfo = (pendingData.users || []).find(p => p.id === user.id);

                    return {
                        id: user.id,
                        name: `${user.firstname} ${user.lastname} `,
                        username: user.username,
                        email: user.email,
                        role: 'user',
                        status: displayStatus,
                        survey_code: user.survey_code || pendingInfo?.survey_code || 'N/A',
                        response_id: response?.id || null,
                        start_date: response?.start_date || null,
                        end_date: response?.end_date || null,
                        response_status: response?.status || null,
                        reminder: user.reminder || 0,
                        days_created: pendingInfo?.days_since_creation || 0,
                        company_name: user.organization?.name // Included for reminder payload
                    };
                });

                setUsers(processedUsers);

                // Calculate stats
                const totalUsers = processedUsers.length;
                const completedCount = processedUsers.filter(u => u.status === 'Filled').length;
                const pendingCount = totalUsers - completedCount;
                const rate = totalUsers > 0 ? Math.round((completedCount / totalUsers) * 100) : 0;

                setStats({
                    totalUsers,
                    completedSurveys: completedCount,
                    pendingSurveys: pendingCount,
                    completionRate: rate
                });

            } catch (error) {
                console.error('Error loading manager dashboard data:', error);
            } finally {
                setLoading(false);
            }
        };

        loadDashboardData();
    }, [navigate]);

    // Email Preview Effect
    useEffect(() => {
        const fetchPreview = async () => {
            if (!showEmailPreview) return;

            let user = null;
            if (openReminderDialog && selectedRecipient) {
                user = selectedRecipient;
            } else if (bulkReminderDialog && selectedUsers.length > 0) {
                user = users.find(u => u.id === selectedUsers[0]);
            }

            if (!user) return;

            setLoadingEmailPreview(true);
            try {
                const daysRemaining = user.days_created ? Math.max(30 - user.days_created, 0) : null;

                // Use the reminder preview endpoint
                const response = await fetch('/api/reminders/preview', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        username: user.username,
                        survey_code: user.survey_code,
                        firstname: user.name.split(' ')[0],
                        organization_name: organizationName,
                        days_remaining: daysRemaining,
                        email: user.email // Include email for preview context
                    })
                });

                if (response.ok) {
                    const data = await response.json();
                    setEmailPreviewContent(data);
                } else {
                    console.error('Failed to fetch preview');
                    setEmailPreviewContent({ subject: 'Error', html: '<p>Failed to load preview</p>', text: 'Failed to load preview' });
                }
            } catch (error) {
                console.error('Error fetching preview:', error);
                setEmailPreviewContent({ subject: 'Error', html: '<p>Error loading preview</p>', text: 'Error loading preview' });
            } finally {
                setLoadingEmailPreview(false);
            }
        };

        if (showEmailPreview) {
            fetchPreview();
        }
    }, [showEmailPreview, selectedUsers, users, organizationName, openReminderDialog, selectedRecipient, bulkReminderDialog]);

    // Table Handlers
    const handleSelectAllUsers = (event) => {
        if (event.target.checked) {
            const selectableUsers = users.filter(user => user.status === 'Not-Filled').map(n => n.id);
            setSelectedUsers(selectableUsers);
        } else {
            setSelectedUsers([]);
        }
    };

    const handleSelectUser = (id) => {
        const selectedIndex = selectedUsers.indexOf(id);
        let newSelected = [];

        if (selectedIndex === -1) {
            newSelected = newSelected.concat(selectedUsers, id);
        } else if (selectedIndex === 0) {
            newSelected = newSelected.concat(selectedUsers.slice(1));
        } else if (selectedIndex === selectedUsers.length - 1) {
            newSelected = newSelected.concat(selectedUsers.slice(0, -1));
        } else if (selectedIndex > 0) {
            newSelected = newSelected.concat(
                selectedUsers.slice(0, selectedIndex),
                selectedUsers.slice(selectedIndex + 1),
            );
        }
        setSelectedUsers(newSelected);
    };

    const handleOpenReminderDialog = (user) => {
        setSelectedRecipient(user);
        setOpenReminderDialog(true);
    };

    const handleCloseReminderDialog = () => {
        setOpenReminderDialog(false);
        setSelectedRecipient(null);
        setReminderStatus({ sending: false, results: null });
    };

    const handleSendReminder = async (isBulk = false) => {
        setReminderStatus({ sending: true, results: null });

        try {
            const recipients = isBulk
                ? users.filter(u => selectedUsers.includes(u.id))
                : [selectedRecipient];

            const results = { success: 0, failed: 0, errors: [] };

            for (const user of recipients) {
                let response;
                try {
                    // Calculate days remaining
                    const daysRemaining = user.days_created ? Math.max(30 - user.days_created, 0) : null;

                    if (user.response_id) {
                        response = await fetch('/api/responses/' + user.response_id + '/dates', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                to_email: user.email,
                                username: user.username,
                                survey_code: user.survey_code,
                                firstname: user.name.split(' ')[0],
                                organization_name: organizationName,
                                days_remaining: daysRemaining,
                                // Manager context implicity handled by organization_id association in backend 
                                // or could be passed explicitly if needed
                            })
                        });
                    } else {
                        // Create a mock response for users without a response_id (cannot send reminder yet)
                        response = {
                            ok: false,
                            json: async () => ({ error: 'No survey response found for this user.' })
                        };
                    }

                    if (response.ok) {
                        results.success++;
                        // Update local state for reminder count
                        setUsers(prev => prev.map(u =>
                            u.id === user.id ? { ...u, reminder: (u.reminder || 0) + 1 } : u
                        ));
                    } else {
                        results.failed++;
                        const err = await response.json();
                        results.errors.push(`${user.email}: ${err.error || 'Failed'} `);
                    }
                } catch (err) {
                    console.error(`Error sending to ${user.email}: `, err);
                    results.failed++;
                    results.errors.push(`${user.email}: ${err.message} `);
                }
            }

            setReminderStatus({
                sending: false,
                results: {
                    success: true,
                    message: isBulk
                        ? `Processed ${recipients.length} reminders.Sent: ${results.success}, Failed: ${results.failed} `
                        : `Reminder sent successfully to ${recipients[0].email} `
                }
            });

            if (isBulk) {
                setTimeout(() => {
                    setBulkReminderDialog(false);
                    setReminderStatus({ sending: false, results: null });
                    setSelectedUsers([]);
                }, 2000);
            } else {
                setTimeout(handleCloseReminderDialog, 1500);
            }

        } catch (error) {
            console.error('Reminder error:', error);
            setReminderStatus({
                sending: false,
                results: { success: false, message: 'Fatal error sending reminders.' }
            });
        }
    };

    const formatDateForDisplay = (dateString) => {
        if (!dateString) return 'Not set';
        const date = new Date(dateString);
        return date.toLocaleDateString();
    };

    const pieData = {
        labels: ['Completed', 'Pending'],
        datasets: [
            {
                data: [stats.completedSurveys, stats.pendingSurveys],
                backgroundColor: [managerColors.success, managerColors.warning],
                borderColor: ['#ffffff', '#ffffff'],
                borderWidth: 2,
            },
        ],
    };

    const StatCard = ({ title, value, icon, color, subtext }) => (
        <Card sx={{ height: '100%', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', borderRadius: 2 }}>
            <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Box>
                        <Typography color="text.secondary" variant="subtitle2" gutterBottom>
                            {title}
                        </Typography>
                        <Typography variant="h3" sx={{ fontWeight: 'bold', color: color }}>
                            {value}
                        </Typography>
                    </Box>
                    <Box sx={{
                        backgroundColor: `${color} 15`,
                        borderRadius: '50%',
                        p: 1.5,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
                        {icon}
                    </Box>
                </Box>
                {subtext && (
                    <Typography variant="body2" color="text.secondary">
                        {subtext}
                    </Typography>
                )}
            </CardContent>
        </Card>
    );

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <CircularProgress sx={{ color: managerColors.primary }} />
            </Box>
        );
    }

    return (
        <Box sx={{ minHeight: '100vh', backgroundColor: managerColors.background }}>
            <Navbar onLogout={onLogout} />

            <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
                <Box sx={{ mb: 4 }}>
                    <Typography variant="h4" sx={{ fontWeight: 'bold', color: managerColors.primary, mb: 1 }}>
                        Dashboard
                    </Typography>
                    <Typography variant="subtitle1" color="text.secondary">
                        Welcome back! Here's what's happening at {organizationName}.
                    </Typography>
                </Box>

                {/* Stats Cards */}
                <Grid container spacing={3} sx={{ mb: 4 }}>
                    <Grid item xs={12} sm={6} md={3}>
                        <StatCard
                            title="Total Users"
                            value={stats.totalUsers}
                            icon={<PeopleIcon sx={{ color: managerColors.primary }} />}
                            color={managerColors.primary}
                            subtext="Active members"
                        />
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <StatCard
                            title="Completed Surveys"
                            value={stats.completedSurveys}
                            icon={<CheckCircleIcon sx={{ color: managerColors.success }} />}
                            color={managerColors.success}
                            subtext="Successfully submitted"
                        />
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <StatCard
                            title="Pending Surveys"
                            value={stats.pendingSurveys}
                            icon={<PendingIcon sx={{ color: managerColors.warning }} />}
                            color={managerColors.warning}
                            subtext="Waiting for submission"
                        />
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <StatCard
                            title="Completion Rate"
                            value={`${stats.completionRate}% `}
                            icon={<AssessmentIcon sx={{ color: managerColors.primary }} />}
                            color={managerColors.primary}
                            subtext="Overall progress"
                        />
                    </Grid>
                </Grid>

                {/* Users Table Section */}
                <Grid container spacing={3}>
                    <Grid item xs={12}>
                        <Card sx={{ boxShadow: '0 4px 20px rgba(0,0,0,0.05)', borderRadius: 2 }}>
                            <Box sx={{ p: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `1px solid ${managerColors.borderColor} ` }}>
                                <Typography variant="h6" sx={{ fontWeight: 'bold', color: managerColors.primary }}>
                                    Organization Users
                                </Typography>
                                <Button
                                    variant="contained"
                                    startIcon={<SendIcon />}
                                    disabled={selectedUsers.length === 0}
                                    onClick={() => setBulkReminderDialog(true)}
                                    sx={{
                                        backgroundColor: managerColors.primary,
                                        '&:hover': { backgroundColor: managerColors.secondary }
                                    }}
                                >
                                    Send Bulk Reminders ({selectedUsers.length})
                                </Button>
                            </Box>
                            <TableContainer>
                                <Table>
                                    <TableHead>
                                        <TableRow sx={{ backgroundColor: managerColors.headerBg }}>
                                            <TableCell padding="checkbox">
                                                <Checkbox
                                                    color="primary"
                                                    indeterminate={selectedUsers.length > 0 && selectedUsers.length < users.filter(u => u.status === 'Not-Filled').length}
                                                    checked={users.length > 0 && selectedUsers.length === users.filter(u => u.status === 'Not-Filled').length}
                                                    onChange={handleSelectAllUsers}
                                                />
                                            </TableCell>
                                            <TableCell sx={{ fontWeight: 'bold' }}>User</TableCell>
                                            <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                                            <TableCell sx={{ fontWeight: 'bold' }}>Created Days Ago</TableCell>
                                            <TableCell sx={{ fontWeight: 'bold' }}>Progress</TableCell>
                                            <TableCell sx={{ fontWeight: 'bold' }}>Reminders</TableCell>
                                            <TableCell sx={{ fontWeight: 'bold' }}>Start Date</TableCell>
                                            <TableCell sx={{ fontWeight: 'bold' }}>End Date</TableCell>
                                            <TableCell sx={{ fontWeight: 'bold' }}>Actions</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {users.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((user) => {
                                            const isSelectable = user.status === 'Not-Filled';
                                            return (
                                                <TableRow
                                                    key={user.id}
                                                    hover
                                                    selected={selectedUsers.indexOf(user.id) !== -1}
                                                    sx={{ '&.Mui-selected': { backgroundColor: managerColors.highlightBg } }}
                                                >
                                                    <TableCell padding="checkbox">
                                                        <Checkbox
                                                            color="primary"
                                                            checked={selectedUsers.indexOf(user.id) !== -1}
                                                            disabled={!isSelectable}
                                                            onChange={() => handleSelectUser(user.id)}
                                                        />
                                                    </TableCell>
                                                    <TableCell component="th" scope="row">
                                                        <Box>
                                                            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>{user.name}</Typography>
                                                            <Typography variant="caption" color="textSecondary">{user.email}</Typography>
                                                        </Box>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Chip
                                                            label={user.status}
                                                            size="small"
                                                            sx={{
                                                                backgroundColor: user.status === 'Filled' ? managerColors.success : '#fff3e0',
                                                                color: user.status === 'Filled' ? '#fff' : '#e65100',
                                                                fontWeight: 'bold'
                                                            }}
                                                        />
                                                    </TableCell>
                                                    <TableCell>{user.days_created}</TableCell>
                                                    <TableCell>
                                                        <LinearProgressWithLabel value={
                                                            user.response_status === 'completed' ? 100 :
                                                                user.response_status === 'in_progress' ? 50 : 0
                                                        } />
                                                    </TableCell>
                                                    <TableCell>
                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                            {user.reminder}
                                                            {user.reminder > 2 && (
                                                                <Chip label="High" size="small" color="error" variant="outlined" sx={{ height: 20, fontSize: '0.65rem' }} />
                                                            )}
                                                        </Box>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Typography
                                                            variant="body2"
                                                            sx={{
                                                                cursor: 'pointer',
                                                                color: user.start_date ? managerColors.primary : 'text.secondary',
                                                                textDecoration: 'underline',
                                                                '&:hover': { color: managerColors.secondary }
                                                            }}
                                                            onClick={() => handleResponseDateClick(user)}
                                                        >
                                                            {user.start_date ? formatDateForDisplay(user.start_date) : 'Set Date'}
                                                        </Typography>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Typography
                                                            variant="body2"
                                                            sx={{
                                                                cursor: 'pointer',
                                                                color: user.end_date ? managerColors.primary : 'text.secondary',
                                                                textDecoration: 'underline',
                                                                '&:hover': { color: managerColors.secondary }
                                                            }}
                                                            onClick={() => handleResponseDateClick(user)}
                                                        >
                                                            {user.end_date ? formatDateForDisplay(user.end_date) : 'Set Date'}
                                                        </Typography>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Box sx={{ display: 'flex', gap: 1 }}>
                                                            <IconButton
                                                                title="Send Individual Reminder"
                                                                onClick={() => handleOpenReminderDialog(user)}
                                                                disabled={user.status === 'Filled'}
                                                                sx={{ color: managerColors.primary }}
                                                            >
                                                                <NotificationsActiveIcon />
                                                            </IconButton>
                                                        </Box>
                                                    </TableCell>
                                                </TableRow>
                                            )
                                        })}
                                        {users.length === 0 && (
                                            <TableRow>
                                                <TableCell colSpan={9} align="center" sx={{ py: 3 }}>
                                                    No users found in this organization.
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </Card>
                    </Grid>
                </Grid>
            </Container>

            {/* Survey Response Date Edit Dialog */}
            <Dialog open={dateEditDialog} onClose={handleCloseDateEditDialog} maxWidth="sm" fullWidth>
                <DialogTitle>Edit Survey Dates</DialogTitle>
                <DialogContent>
                    <DialogContentText sx={{ mb: 2 }}>
                        Set or update the start and end dates for the survey.
                    </DialogContentText>

                    {selectedResponse && (
                        <Box sx={{ mb: 2, p: 2, bgcolor: managerColors.highlightBg, borderRadius: 1 }}>
                            <Typography variant="body2"><strong>User:</strong> {selectedResponse.user_name}</Typography>
                            <Typography variant="body2"><strong>Email:</strong> {selectedResponse.user_email}</Typography>
                            <Typography variant="body2"><strong>Survey Code:</strong> {selectedResponse.survey_code}</Typography>
                            <Typography variant="body2"><strong>Status:</strong> {selectedResponse.status}</Typography>
                        </Box>
                    )}

                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
                        <TextField
                            label="Start Date"
                            type="date"
                            value={editDates.start_date}
                            onChange={(e) => handleDateFieldChange('start_date', e.target.value)}
                            InputLabelProps={{ shrink: true }}
                            fullWidth
                            helperText="Leave empty to clear the date"
                        />
                        <TextField
                            label="End Date"
                            type="date"
                            value={editDates.end_date}
                            onChange={(e) => handleDateFieldChange('end_date', e.target.value)}
                            InputLabelProps={{ shrink: true }}
                            fullWidth
                            helperText="Leave empty to clear the date"
                        />
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDateEditDialog}>Cancel</Button>
                    <Button
                        onClick={handleSaveDates}
                        variant="contained"
                        sx={{
                            bgcolor: managerColors.primary,
                            '&:hover': { bgcolor: managerColors.secondary }
                        }}
                    >
                        Save Dates
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Single Reminder Dialog */}
            <Dialog open={openReminderDialog} onClose={handleCloseReminderDialog}>
                <DialogTitle sx={{ bgcolor: managerColors.primary, color: '#fff' }}>Send Reminder</DialogTitle>
                <DialogContent sx={{ pt: 2, minWidth: 400 }}>
                    {!reminderStatus.results ? (
                        <>
                            <DialogContentText sx={{ mt: 2, mb: 2 }}>
                                Are you sure you want to send a reminder email to <strong>{selectedRecipient?.name}</strong>?
                            </DialogContentText>

                            <Alert severity="info" sx={{ mb: 2 }}>
                                A professional reminder email with survey details will be sent to this user.
                            </Alert>

                            {/* Sample Email Preview for Single User */}
                            <Box sx={{ mt: 2 }}>
                                <Button
                                    variant="outlined"
                                    startIcon={<PreviewIcon />}
                                    endIcon={showEmailPreview ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                                    onClick={() => setShowEmailPreview(!showEmailPreview)}
                                    size="small"
                                >
                                    {showEmailPreview ? 'Hide Email Preview' : 'Preview Email'}
                                </Button>

                                {showEmailPreview && selectedRecipient && (
                                    <Box sx={{ mt: 2, border: 1, borderColor: 'divider', borderRadius: 1, overflow: 'hidden' }}>
                                        <Box sx={{ bgcolor: managerColors.headerBg, p: 2, borderBottom: 1, borderColor: 'divider' }}>
                                            <Typography variant="subtitle1" sx={{ mb: 1 }}>
                                                Email Preview
                                            </Typography>
                                            <Box sx={{ display: 'flex', gap: 1 }}>
                                                <Button
                                                    size="small"
                                                    variant={emailPreviewType === 'text' ? 'contained' : 'outlined'}
                                                    onClick={() => setEmailPreviewType('text')}
                                                >
                                                    Text Version
                                                </Button>
                                                <Button
                                                    size="small"
                                                    variant={emailPreviewType === 'html' ? 'contained' : 'outlined'}
                                                    onClick={() => setEmailPreviewType('html')}
                                                >
                                                    HTML Version
                                                </Button>
                                            </Box>
                                        </Box>

                                        <Box sx={{ p: 2 }}>
                                            {loadingEmailPreview ? (
                                                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', p: 4 }}>
                                                    <CircularProgress size={24} />
                                                    <Typography sx={{ ml: 2 }}>Loading preview...</Typography>
                                                </Box>
                                            ) : emailPreviewContent ? (
                                                <Box>
                                                    <Box sx={{ mb: 2, p: 1, bgcolor: '#FFFFFF', borderRadius: 1 }}>
                                                        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                                            Subject: {emailPreviewContent.subject}
                                                        </Typography>
                                                        <Typography variant="body2" color="text.secondary">
                                                            To: {selectedRecipient.email}
                                                        </Typography>
                                                    </Box>

                                                    {emailPreviewType === 'text' ? (
                                                        <Box sx={{
                                                            bgcolor: '#fafafa',
                                                            p: 2,
                                                            borderRadius: 1,
                                                            maxHeight: 300,
                                                            overflow: 'auto',
                                                            fontFamily: 'monospace',
                                                            fontSize: '0.75rem',
                                                            whiteSpace: 'pre-wrap'
                                                        }}>
                                                            {emailPreviewContent.text}
                                                        </Box>
                                                    ) : (
                                                        <Box sx={{
                                                            border: 1,
                                                            borderColor: 'divider',
                                                            borderRadius: 1,
                                                            maxHeight: 300,
                                                            overflow: 'auto'
                                                        }}>
                                                            <iframe
                                                                srcDoc={emailPreviewContent.html}
                                                                style={{
                                                                    width: '100%',
                                                                    height: '300px',
                                                                    border: 'none',
                                                                    borderRadius: '4px'
                                                                }}
                                                                title="Email HTML Preview"
                                                            />
                                                        </Box>
                                                    )}
                                                </Box>
                                            ) : (
                                                <Box sx={{ p: 2, textAlign: 'center', color: 'text.secondary' }}>
                                                    <Typography>No preview available</Typography>
                                                </Box>
                                            )}
                                        </Box>
                                    </Box>
                                )}
                            </Box>
                        </>
                    ) : (
                        <Box sx={{ mt: 2 }}>
                            {reminderStatus.results.success ? (
                                <Typography color="success.main" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <CheckCircleIcon /> Reminder sent successfully!
                                </Typography>
                            ) : (
                                <Typography color="error">{reminderStatus.results.message}</Typography>
                            )}
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    {!reminderStatus.results && (
                        <>
                            <Button onClick={handleCloseReminderDialog} color="inherit">Cancel</Button>
                            <Button
                                onClick={() => handleSendReminder(false)}
                                variant="contained"
                                disabled={reminderStatus.sending}
                                sx={{ bgcolor: managerColors.primary, '&:hover': { bgcolor: managerColors.secondary } }}
                            >
                                {reminderStatus.sending ? <CircularProgress size={24} color="inherit" /> : 'Send Email'}
                            </Button>
                        </>
                    )}
                </DialogActions>
            </Dialog>

            {/* Bulk Reminder Dialog */}
            <Dialog open={bulkReminderDialog} onClose={() => setBulkReminderDialog(false)}>
                <DialogTitle sx={{ bgcolor: managerColors.primary, color: '#fff' }}>Send Bulk Reminders</DialogTitle>
                <DialogContent sx={{ pt: 2, minWidth: 400 }}>
                    {!reminderStatus.results ? (
                        <>
                            <DialogContentText sx={{ mt: 2, mb: 2 }}>
                                You are about to send reminder emails to <strong>{selectedUsers.length}</strong> users.
                                <br /><br />
                                This process may take a moment.
                            </DialogContentText>

                            <Alert severity="info" sx={{ mb: 2 }}>
                                Professional reminder emails with survey details and instructions will be sent to all selected users.
                            </Alert>

                            {/* Sample Email Preview for Bulk */}
                            <Box sx={{ mt: 2 }}>
                                <Button
                                    variant="outlined"
                                    startIcon={<PreviewIcon />}
                                    endIcon={showEmailPreview ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                                    onClick={() => setShowEmailPreview(!showEmailPreview)}
                                    size="small"
                                >
                                    {showEmailPreview ? 'Hide Sample Email' : 'Preview Sample Email'}
                                </Button>

                                {showEmailPreview && selectedUsers.length > 0 && (
                                    <Box sx={{ mt: 2, border: 1, borderColor: 'divider', borderRadius: 1, overflow: 'hidden' }}>
                                        <Box sx={{ bgcolor: managerColors.headerBg, p: 2, borderBottom: 1, borderColor: 'divider' }}>
                                            <Typography variant="subtitle1" sx={{ mb: 1 }}>
                                                Sample Email Preview
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                This shows what the email will look like (personalized for each user)
                                            </Typography>
                                            <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                                                <Button
                                                    size="small"
                                                    variant={emailPreviewType === 'text' ? 'contained' : 'outlined'}
                                                    onClick={() => setEmailPreviewType('text')}
                                                >
                                                    Text Version
                                                </Button>
                                                <Button
                                                    size="small"
                                                    variant={emailPreviewType === 'html' ? 'contained' : 'outlined'}
                                                    onClick={() => setEmailPreviewType('html')}
                                                >
                                                    HTML Version
                                                </Button>
                                            </Box>
                                        </Box>

                                        <Box sx={{ p: 2 }}>
                                            {loadingEmailPreview ? (
                                                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', p: 4 }}>
                                                    <CircularProgress size={24} />
                                                    <Typography sx={{ ml: 2 }}>Loading preview...</Typography>
                                                </Box>
                                            ) : emailPreviewContent ? (
                                                <Box>
                                                    <Box sx={{ mb: 2, p: 1, bgcolor: '#FFFFFF', borderRadius: 1 }}>
                                                        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                                            Subject: {emailPreviewContent.subject}
                                                        </Typography>
                                                        <Typography variant="body2" color="text.secondary">
                                                            Sample for: {users.find(u => u.id === selectedUsers[0])?.name} ({users.find(u => u.id === selectedUsers[0])?.email})
                                                        </Typography>
                                                    </Box>

                                                    {emailPreviewType === 'text' ? (
                                                        <Box sx={{
                                                            bgcolor: '#fafafa',
                                                            p: 2,
                                                            borderRadius: 1,
                                                            maxHeight: 300,
                                                            overflow: 'auto',
                                                            fontFamily: 'monospace',
                                                            fontSize: '0.75rem',
                                                            whiteSpace: 'pre-wrap'
                                                        }}>
                                                            {emailPreviewContent.text}
                                                        </Box>
                                                    ) : (
                                                        <Box sx={{
                                                            border: 1,
                                                            borderColor: 'divider',
                                                            borderRadius: 1,
                                                            maxHeight: 300,
                                                            overflow: 'auto'
                                                        }}>
                                                            <iframe
                                                                srcDoc={emailPreviewContent.html}
                                                                style={{
                                                                    width: '100%',
                                                                    height: '300px',
                                                                    border: 'none',
                                                                    borderRadius: '4px'
                                                                }}
                                                                title="Bulk Email HTML Preview"
                                                            />
                                                        </Box>
                                                    )}
                                                </Box>
                                            ) : (
                                                <Box sx={{ p: 2, textAlign: 'center', color: 'text.secondary' }}>
                                                    <Typography>No preview available</Typography>
                                                </Box>
                                            )}
                                        </Box>
                                    </Box>
                                )}
                            </Box>
                        </>
                    ) : (
                        <Box sx={{ mt: 2 }}>
                            <Typography variant="h6" gutterBottom>Results:</Typography>
                            <Typography>{reminderStatus.results.message}</Typography>
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    {!reminderStatus.results && (
                        <>
                            <Button onClick={() => setBulkReminderDialog(false)} color="inherit">Cancel</Button>
                            <Button
                                onClick={() => handleSendReminder(true)}
                                variant="contained"
                                disabled={reminderStatus.sending}
                                sx={{ bgcolor: managerColors.primary, '&:hover': { bgcolor: managerColors.secondary } }}
                            >
                                {reminderStatus.sending ? <CircularProgress size={24} color="inherit" /> : `Send to ${selectedUsers.length} Users`}
                            </Button>
                        </>
                    )}
                </DialogActions>
            </Dialog>
        </Box>
    );
}

// Simple linear progress component
const LinearProgressWithLabel = ({ value }) => {
    return (
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Box sx={{ width: '100%', mr: 1 }}>
                <Paper sx={{ height: 8, bgcolor: '#e0e0e0', borderRadius: 4, overflow: 'hidden' }} elevation={0}>
                    <Box sx={{
                        width: `${value}% `,
                        height: '100%',
                        bgcolor: value === 100 ? '#4caf50' : '#2196f3',
                        transition: 'width 0.5s ease'
                    }} />
                </Paper>
            </Box>
            <Box sx={{ minWidth: 35 }}>
                <Typography variant="body2" color="text.secondary">{`${Math.round(value)}% `}</Typography>
            </Box>
        </Box>
    );
}

export default ManagerDashboard;
