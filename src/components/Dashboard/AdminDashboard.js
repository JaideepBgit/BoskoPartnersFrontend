import React, { useEffect, useState, useMemo } from 'react';
import { Container, Typography, Box, Select, MenuItem, FormControl,
    InputLabel, Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, TablePagination, Card, Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, TextField, Grid } from '@mui/material';
import IconButton from '@mui/material/IconButton';
import SendIcon from '@mui/icons-material/Send';
import { useNavigate } from 'react-router-dom';
import Navbar from '../shared/Navbar/Navbar';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Pie } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend);

// Update the admin color theme based on the AdminLandingPage colors
const adminColors = {
    primary: '#633394',         // Primary purple color from AdminLandingPage
    secondary: '#967CB2',       // Secondary color (lighter purple) from AdminLandingPage hover
    background: '#f5f5f5',      // Background color from AdminLandingPage cards
    text: '#212121',            // Text color
    headerBg: '#ede7f6',        // Light purple for table header
    filledColor: '#633394',     // Primary purple for filled status
    notFilledColor: '#967CB2',  // Secondary purple for not filled status
    borderColor: '#e0e0e0',     // Border color
    highlightBg: '#f3e5f5'      // Light purple highlight background
};

function AdminDashboard({ onLogout }) {
    const tabs = [
        { label: 'Home', path: '/home'},
        { label: 'Dashboard', path: '/dashboard' },
        { label: 'Assessment Overview', path: '/root-dashboard' },
        { label: '360 Degree Assessment', path: '/edit-assessments' },
        { label: 'Users Management', path: '/users' },
        { label: 'Settings', path: '/settings' },
        { label: 'Reports', path: '/reports' },
    ];

    const [data, setData] = useState({ users: [], assessments: [], observers: [], companies: [] });
    const [responses, setResponses] = useState([]);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [uniqueCompanies, setUniqueCompanies] = useState([]);
    const [filters, setFilters] = useState({ organization: '', users: '', status: '' });
    const [availableUsers, setAvailableUsers] = useState([]);
    const [openReminderDialog, setOpenReminderDialog] = useState(false);
    const [selectedRecipient, setSelectedRecipient] = useState(null);
    const [selectedRole, setSelectedRole] = useState('');
    const [selectedId, setSelectedId] = useState(null);
    const [reminderEmail, setReminderEmail] = useState('Please complete the survey form.');
    const [selectedLeader, setSelectedLeader] = useState(null);
    const navigate = useNavigate();
    const [selectedAssessment, setSelectedAssessment] = useState(null);
    const [isDateEditorOpen, setIsDateEditorOpen] = useState(false);
    const [companyCoachDetails, setCompanyCoachDetails] = useState([]);
    const [isDataLoaded, setIsDataLoaded] = useState(false);
    
    // Add dashboard statistics state
    const [dashboardStats, setDashboardStats] = useState({
        total_users: 0,
        active_users: 0,
        completed_surveys: 0,
        total_organizations: 0,
        completion_rate: 0
    });

    const highlightStyle = { fontWeight: 'bold', color: adminColors.secondary };
    const highlightStyleBackgroundColor = adminColors.highlightBg;

    useEffect(() => {
        const loadData = async () => {
            try {
                console.log('Starting to fetch data...');
                
                // Fetch dashboard statistics
                const statsResponse = await fetch('/api/admin/dashboard-stats');
                const stats = await statsResponse.json();
                setDashboardStats(stats);
                
                // Fetch users
                const usersResponse = await fetch('/api/users/role/user');
                const users = await usersResponse.json();
                console.log('Fetched Users:', users);

                // Process users data with correct field names
                const processedUsers = users.map(user => ({
                    id: user.id,
                    name: `${user.firstname} ${user.lastname}`,
                    username: user.username,
                    email: user.email,
                    role: 'user',
                    company_id: user.organization_id,
                    company_name: user.organization?.name,
                    reminder: 0,
                    status: user.survey_code ? 'Filled' : 'Not-Filled'  // Set status based on survey_code
                }));
                console.log('Processed Users:', processedUsers);

                // Get unique companies from users
                const companies = users
                    .filter(user => user.organization)
                    .map(user => ({
                        id: user.organization.id,
                        name: user.organization.name,
                        accreditation_status: user.organization.accreditation_status_or_body
                    }))
                    .filter((company, index, self) => 
                        index === self.findIndex((c) => c.id === company.id)
                    );
                console.log('Extracted Companies:', companies);

                const dashboardData = {
                    users: processedUsers,
                    companies: companies,
                    assessments: [],
                    observers: []
                };
                console.log('Final Dashboard Data:', dashboardData);

                setData(dashboardData);
                setIsDataLoaded(true);
                setUniqueCompanies(companies.map(company => company.name));
                setAvailableUsers(processedUsers);

            } catch (error) {
                console.error('Failed to fetch dashboard data:', error);
            }
        };
        
        const userRole = localStorage.getItem('userRole');
        if (userRole && userRole !== 'admin') {
            navigate('/home');
        } else {
            loadData();
        }
    }, [navigate]);

    // Memoize assessments and observers to stabilize references
    const assessments = useMemo(() => data.assessments, [data]);
    const observers = useMemo(() => data.observers, [data]);

    useEffect(() => {
        if (filters.organization) {
            // Filter users based on selected organization
            const selectedCompany = data.companies.find(company => company.name === filters.organization);
            if (selectedCompany) {
                const usersForCompany = data.users.filter(user => user.company_id === selectedCompany.id);
                setAvailableUsers(usersForCompany);
            }
        } else {
            // Reset to show all users if no organization filter is applied
            setAvailableUsers(data.users);
        }
    }, [filters.organization, data]);

    useEffect(() => {
        if (isDataLoaded && responses.length > 0 && assessments.length > 0) {
            const updatedData = { ...data };
            updatedData.assessments = assessments.map((assessment) => {
                const leaderResponse = responses.find(
                    (response) =>
                        response.userID === assessment.leader_id &&
                        response.LeaderOrObserver === 'Leader'
                );
                const observersForAssessment = observers.filter(
                    (observer) => observer.assessment_id === assessment.id
                );
                const observerResponses = observersForAssessment
                    .map((observer) =>
                        responses.find(
                            (response) =>
                                response.userID === observer.id &&
                                response.LeaderOrObserver === 'Observer'
                        )
                    )
                    .filter(Boolean);
    
                // Separate completion status for leader and observers
                const leaderCompleted = leaderResponse?.CompletePartial === 'Complete';
                const observerCompleted = observerResponses.some((response) => response?.CompletePartial === 'Complete');
    
                // Calculate reminders sent
                const leader = data.users.find((user) => user.id === assessment.leader_id);
                const totalObserverReminders = observersForAssessment.reduce(
                    (sum, observer) => sum + (observer.reminder || 0),
                    0
                );
                const reminderCount = observersForAssessment.length ? totalObserverReminders : leader.reminder || 0;
    
                // Determine userID based on who we're looking at
                const userID = leaderResponse ? assessment.leader_id : 
                            (observerResponses.length > 0 ? observerResponses[0].userID : null);
    
                return {
                    ...assessment,
                    leaderCompleted: leaderCompleted ? 1 : 0,
                    observerCompleted: observerCompleted ? 1 : 0,
                    completed: (leaderCompleted || observerCompleted) ? 1 : 0,
                    userID,
                    reminderCount: reminderCount,
                };
            });
            setData(updatedData);
        }
    }, [isDataLoaded, responses]);

    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    const handleFilterChange = (event) => {
        setFilters({
            ...filters,
            [event.target.name]: event.target.value
        });
        setPage(0);
    };

    const handleSendReminder = async () => {
        try {
            const response = await fetch('/api/send-reminder', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    recipient_id: selectedId,
                    role: selectedRole,
                    message: reminderEmail
                }),
            });

            if (response.ok) {
                // Update the reminder count in the local state
                const updatedData = { ...data };
                const user = updatedData.users.find(u => u.id === selectedId);
                if (user) {
                    user.reminder = (user.reminder || 0) + 1;
                }
                setData(updatedData);
                handleCloseReminderDialog();
            } else {
                console.error('Failed to send reminder');
            }
        } catch (error) {
            console.error('Error sending reminder:', error);
        }
    };

    const handleOpenReminderDialog = (userId) => {
        const user = data.users.find(u => u.id === userId);
        if (!user) {
            console.error('User not found');
            return;
        }
        setSelectedId(userId);
        setSelectedRecipient(user);
        setOpenReminderDialog(true);
    };

    const handleCloseReminderDialog = () => {
        setOpenReminderDialog(false);
        setSelectedRecipient(null);
        setSelectedId(null);
    };

    const getStatusAndUrgency = (assessment) => {
        const status = assessment.completed ? 'Filled' : 'Not-Filled';
        return { status };
    };

    // Filtered data based on selected filters
    const filteredAssessments = data.assessments.filter((assessment) => {
        const leader = data.users.find(u => u.id === assessment.leader_id);
        const observer = data.observers.find(o => o.assessment_id === assessment.id);
        const company = data.companies.find(c => leader && c.id === leader.company_id);
        const isCompanyMatch = !filters.organization || (company && company.name === filters.organization);
        
        // Get status based on assessment
        const { status } = getStatusAndUrgency(assessment);
        
        // Check if user matches filter (could be leader or observer)
        const userMatch = !filters.users || 
            (leader && leader.name.includes(filters.users)) ||
            (observer && observer.name.includes(filters.users));

        return isCompanyMatch &&
            userMatch &&
            (!filters.status || filters.status === status);
    });

    const handleDateClick = (assessment) => {
        setSelectedAssessment(assessment);
        setIsDateEditorOpen(true);
    };

    const formatDateCompact = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        // Format as MM/DD/YY
        return date.toLocaleDateString('en-US', {
            month: '2-digit',
            day: '2-digit',
            year: '2-digit',
            timeZone: 'UTC'
        });
    };

    const handleDateUpdate = async (assessmentId, newStartDate, newEndDate) => {
        try {
            const response = [];
            if (response) {
                // Update local state after successful API call
                setData(prevData => ({
                    ...prevData,
                    assessments: prevData.assessments.map(assessment => 
                        assessment.id === assessmentId 
                            ? { ...assessment, start_date: newStartDate, end_date: newEndDate }
                            : assessment
                    )
                }));
            } else {
                console.error('Failed to update dates');
            }
        } catch (error) {
            console.error('Error updating dates:', error);
        }
    };

    // Calculate chart data based on current filters
    const getChartData = () => {
        const filteredUsers = data.users.filter(user => {
            const organizationMatch = !filters.organization || user.company_name === filters.organization;
            const userMatch = !filters.users || user.name.toLowerCase().includes(filters.users.toLowerCase());
            const statusMatch = !filters.status || user.status === filters.status;
            return organizationMatch && userMatch && statusMatch;
        });

        // Group by organization and count filled/not-filled
        const orgStats = {};
        filteredUsers.forEach(user => {
            const orgName = user.company_name || 'Unknown Organization';
            if (!orgStats[orgName]) {
                orgStats[orgName] = { filled: 0, notFilled: 0, total: 0 };
            }
            if (user.status === 'Filled') {
                orgStats[orgName].filled++;
            } else {
                orgStats[orgName].notFilled++;
            }
            orgStats[orgName].total++;
        });

        // Sort organizations by total users (descending)
        const sortedOrgs = Object.entries(orgStats).sort((a, b) => b[1].total - a[1].total);

        // If we have more than 5 organizations, group the smaller ones
        let chartLabels = [];
        let filledData = [];
        let notFilledData = [];

        if (sortedOrgs.length <= 5) {
            // Show all organizations if 5 or fewer
            chartLabels = sortedOrgs.map(([org, stats]) => org);
            filledData = sortedOrgs.map(([org, stats]) => stats.filled);
            notFilledData = sortedOrgs.map(([org, stats]) => stats.notFilled);
        } else {
            // Show top 4 organizations + "Others"
            const topOrgs = sortedOrgs.slice(0, 4);
            const otherOrgs = sortedOrgs.slice(4);

            // Add top organizations
            chartLabels = topOrgs.map(([org, stats]) => org);
            filledData = topOrgs.map(([org, stats]) => stats.filled);
            notFilledData = topOrgs.map(([org, stats]) => stats.notFilled);

            // Calculate totals for "Others"
            const othersFilled = otherOrgs.reduce((sum, [org, stats]) => sum + stats.filled, 0);
            const othersNotFilled = otherOrgs.reduce((sum, [org, stats]) => sum + stats.notFilled, 0);

            // Add "Others" category
            chartLabels.push(`Others (${otherOrgs.length} orgs)`);
            filledData.push(othersFilled);
            notFilledData.push(othersNotFilled);
        }

        return {
            labels: chartLabels,
            datasets: [
                {
                    label: 'Filled',
                    data: filledData,
                    backgroundColor: chartLabels.map((_, index) => 
                        index === chartLabels.length - 1 && chartLabels[index].includes('Others') 
                            ? '#B39DDB' // Different shade for "Others"
                            : adminColors.filledColor
                    ),
                    borderColor: chartLabels.map((_, index) => 
                        index === chartLabels.length - 1 && chartLabels[index].includes('Others') 
                            ? '#B39DDB'
                            : adminColors.filledColor
                    ),
                    borderWidth: 1,
                },
                {
                    label: 'Not Filled',
                    data: notFilledData,
                    backgroundColor: chartLabels.map((_, index) => 
                        index === chartLabels.length - 1 && chartLabels[index].includes('Others') 
                            ? '#D1C4E9' // Different shade for "Others"
                            : adminColors.notFilledColor
                    ),
                    borderColor: chartLabels.map((_, index) => 
                        index === chartLabels.length - 1 && chartLabels[index].includes('Others') 
                            ? '#D1C4E9'
                            : adminColors.notFilledColor
                    ),
                    borderWidth: 1,
                }
            ]
        };
    };

    const chartData = getChartData();

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'bottom',
                labels: {
                    color: adminColors.text,
                    usePointStyle: true,
                    padding: 20
                }
            },
            tooltip: {
                callbacks: {
                    label: function(context) {
                        const label = context.label || '';
                        const value = context.parsed;
                        const total = context.dataset.data.reduce((a, b) => a + b, 0);
                        const percentage = ((value / total) * 100).toFixed(1);
                        return `${label}: ${value} (${percentage}%)`;
                    }
                }
            }
        }
    };

    return (
        <>
            <Navbar />
            <Container maxWidth="xl" sx={{ mt: 4, flexGrow: 1, overflow: 'auto' }}>
                <Typography variant="h4" gutterBottom sx={{ color: adminColors.primary, fontWeight: 'bold' }}>
                    Admin Dashboard
                </Typography>
                
                {/* Statistics Cards */}
                <Grid container spacing={3} sx={{ mb: 4 }}>
                    <Grid item xs={12} sm={6} md={3}>
                        <Card sx={{ 
                            height: '100%', 
                            backgroundColor: adminColors.background, 
                            boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
                            '&:hover': { boxShadow: '0 6px 12px rgba(0, 0, 0, 0.15)' }
                        }}>
                            <Box sx={{ p: 3 }}>
                                <Typography variant="h6" sx={{ fontWeight: 'bold', color: adminColors.primary, mb: 2 }}>
                                    Total Users
                                </Typography>
                                <Typography variant="h3" sx={{ fontWeight: 'bold', color: adminColors.text }}>
                                    {dashboardStats.total_users}
                                </Typography>
                                <Typography variant="body2" sx={{ color: adminColors.text, mt: 1 }}>
                                    Registered users in the system
                                </Typography>
                            </Box>
                        </Card>
                    </Grid>
                    
                    <Grid item xs={12} sm={6} md={3}>
                        <Card sx={{ 
                            height: '100%', 
                            backgroundColor: adminColors.background, 
                            boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
                            '&:hover': { boxShadow: '0 6px 12px rgba(0, 0, 0, 0.15)' }
                        }}>
                            <Box sx={{ p: 3 }}>
                                <Typography variant="h6" sx={{ fontWeight: 'bold', color: adminColors.primary, mb: 2 }}>
                                    Active Users
                                </Typography>
                                <Typography variant="h3" sx={{ fontWeight: 'bold', color: adminColors.text }}>
                                    {dashboardStats.active_users}
                                </Typography>
                                <Typography variant="body2" sx={{ color: adminColors.text, mt: 1 }}>
                                    Users with survey codes
                                </Typography>
                            </Box>
                        </Card>
                    </Grid>
                    
                    <Grid item xs={12} sm={6} md={3}>
                        <Card sx={{ 
                            height: '100%', 
                            backgroundColor: adminColors.background, 
                            boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
                            '&:hover': { boxShadow: '0 6px 12px rgba(0, 0, 0, 0.15)' }
                        }}>
                            <Box sx={{ p: 3 }}>
                                <Typography variant="h6" sx={{ fontWeight: 'bold', color: adminColors.primary, mb: 2 }}>
                                    Completed Surveys
                                </Typography>
                                <Typography variant="h3" sx={{ fontWeight: 'bold', color: adminColors.text }}>
                                    {dashboardStats.completed_surveys}
                                </Typography>
                                <Typography variant="body2" sx={{ color: adminColors.text, mt: 1 }}>
                                    {dashboardStats.completion_rate}% completion rate
                                </Typography>
                            </Box>
                        </Card>
                    </Grid>
                    
                    <Grid item xs={12} sm={6} md={3}>
                        <Card sx={{ 
                            height: '100%', 
                            backgroundColor: adminColors.background, 
                            boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
                            '&:hover': { boxShadow: '0 6px 12px rgba(0, 0, 0, 0.15)' }
                        }}>
                            <Box sx={{ p: 3 }}>
                                <Typography variant="h6" sx={{ fontWeight: 'bold', color: adminColors.primary, mb: 2 }}>
                                    Organizations
                                </Typography>
                                <Typography variant="h3" sx={{ fontWeight: 'bold', color: adminColors.text }}>
                                    {dashboardStats.total_organizations}
                                </Typography>
                                <Typography variant="body2" sx={{ color: adminColors.text, mt: 1 }}>
                                    Total organizations registered
                                </Typography>
                            </Box>
                        </Card>
                    </Grid>
                </Grid>

                {/* Quick Actions */}
                <Card sx={{ 
                    mb: 4, 
                    backgroundColor: adminColors.background, 
                    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)' 
                }}>
                    <Box sx={{ p: 3 }}>
                        <Typography variant="h6" sx={{ fontWeight: 'bold', color: adminColors.primary, mb: 3 }}>
                            Quick Actions
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                            <Button
                                variant="contained"
                                sx={{ 
                                    backgroundColor: adminColors.primary,
                                    '&:hover': { backgroundColor: adminColors.secondary },
                                    px: 3,
                                    py: 1.5
                                }}
                                onClick={() => navigate('/users')}
                            >
                                Manage Organizations
                            </Button>
                            <Button
                                variant="contained"
                                sx={{ 
                                    backgroundColor: adminColors.primary,
                                    '&:hover': { backgroundColor: adminColors.secondary },
                                    px: 3,
                                    py: 1.5
                                }}
                                onClick={() => navigate('/users')}
                            >
                                Manage Users
                            </Button>
                            <Button
                                variant="contained"
                                sx={{ 
                                    backgroundColor: adminColors.primary,
                                    '&:hover': { backgroundColor: adminColors.secondary },
                                    px: 3,
                                    py: 1.5
                                }}
                                onClick={() => navigate('/inventory')}
                            >
                                Survey Inventory
                            </Button>
                        </Box>
                    </Box>
                </Card>
                
                <Box sx={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 2 }}>
                    {/* Table Section */}
                    <Box>
                        <Card sx={{ boxShadow: 3, padding: 2, bgcolor: adminColors.background }}>
                            <Typography variant="h6" gutterBottom sx={{ color: adminColors.text }}>
                                Organizations and Users
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
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
                                    <InputLabel>Users</InputLabel>
                                    <Select name="users" value={filters.users} onChange={handleFilterChange} label="Users">
                                        <MenuItem value=""><em>None</em></MenuItem>
                                        {availableUsers.map(user => (
                                            <MenuItem key={user.id} value={user.name}>{user.name}</MenuItem>
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
                            <TableContainer sx={{ borderRadius: 2, border: `1px solid ${adminColors.borderColor}`, overflow: 'hidden' }}>
                                <Table sx={{ borderCollapse: 'collapse' }}>
                                    <TableHead>
                                        <TableRow sx={{ backgroundColor: adminColors.headerBg }}>
                                            <TableCell sx={{ borderRight: `1px solid ${adminColors.borderColor}` }}>Organization</TableCell>
                                            <TableCell sx={{ borderRight: `1px solid ${adminColors.borderColor}` }}>Users</TableCell>
                                            <TableCell sx={{ borderRight: `1px solid ${adminColors.borderColor}` }}>Status</TableCell>
                                            <TableCell sx={{ borderRight: `1px solid ${adminColors.borderColor}` }}>Start Date</TableCell>
                                            <TableCell sx={{ borderRight: `1px solid ${adminColors.borderColor}` }}>End Date</TableCell>
                                            <TableCell sx={{ borderRight: `1px solid ${adminColors.borderColor}` }}>Reminders Sent</TableCell>
                                            <TableCell>Actions</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {data.users
                                            .filter(user => {
                                                // Apply all filters
                                                const organizationMatch = !filters.organization || user.company_name === filters.organization;
                                                const userMatch = !filters.users || user.name.toLowerCase().includes(filters.users.toLowerCase());
                                                const statusMatch = !filters.status || user.status === filters.status;
                                                
                                                return organizationMatch && userMatch && statusMatch;
                                            })
                                            .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                                            .map((user) => (
                                                <TableRow key={user.id} sx={{ height: '30px', '& td': { padding: '4px', height: 'auto' } }}>
                                                    <TableCell sx={{ borderRight: `1px solid ${adminColors.borderColor}` }}>
                                                        {user.company_name || ''}
                                                    </TableCell>
                                                    <TableCell sx={{ borderRight: `1px solid ${adminColors.borderColor}` }}>
                                                        {user.name}
                                                    </TableCell>
                                                    <TableCell 
                                                        sx={{ 
                                                            borderRight: `1px solid ${adminColors.borderColor}`,
                                                            color: user.status === 'Filled' ? adminColors.filledColor : adminColors.notFilledColor,
                                                            fontWeight: 'bold'
                                                        }}
                                                    >
                                                        {user.status}
                                                    </TableCell>
                                                    <TableCell sx={{ borderRight: `1px solid ${adminColors.borderColor}` }}>
                                                        {/* Empty Start Date */}
                                                    </TableCell>
                                                    <TableCell sx={{ borderRight: `1px solid ${adminColors.borderColor}` }}>
                                                        {/* Empty End Date */}
                                                    </TableCell>
                                                    <TableCell sx={{ borderRight: `1px solid ${adminColors.borderColor}` }}>
                                                        {user.reminder || 0}
                                                    </TableCell>
                                                    <TableCell>
                                                        <IconButton
                                                            title="Send Reminder"
                                                            sx={{ color: adminColors.primary }}
                                                            onClick={() => handleOpenReminderDialog(user.id)}
                                                        >
                                                            <SendIcon />
                                                        </IconButton>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                    </TableBody>
                                </Table>
                                <TablePagination
                                    component="div"
                                    count={data.users.filter(user => {
                                        const organizationMatch = !filters.organization || user.company_name === filters.organization;
                                        const userMatch = !filters.users || user.name.toLowerCase().includes(filters.users.toLowerCase());
                                        const statusMatch = !filters.status || user.status === filters.status;
                                        return organizationMatch && userMatch && statusMatch;
                                    }).length}
                                    page={page}
                                    onPageChange={handleChangePage}
                                    rowsPerPage={rowsPerPage}
                                    onRowsPerPageChange={handleChangeRowsPerPage}
                                    rowsPerPageOptions={[5, 10, 25]}
                                />
                            </TableContainer>
                        </Card>
                    </Box>

                    {/* Chart Section */}
                    <Box>
                        <Card sx={{ boxShadow: 3, padding: 2, bgcolor: adminColors.background, height: 'fit-content' }}>
                            <Typography variant="h6" gutterBottom sx={{ color: adminColors.text, mb: 2 }}>
                                Organization Statistics
                            </Typography>
                            <Box sx={{ height: 300, position: 'relative' }}>
                                <Pie data={chartData} options={chartOptions} />
                            </Box>
                            <Box sx={{ mt: 2, p: 2, bgcolor: adminColors.highlightBg, borderRadius: 1 }}>
                                <Typography variant="body2" sx={{ color: adminColors.text, fontWeight: 'bold', mb: 1 }}>
                                    Summary:
                                </Typography>
                                {Object.entries(chartData.labels.reduce((acc, org, index) => {
                                    const filled = chartData.datasets[0].data[index];
                                    const notFilled = chartData.datasets[1].data[index];
                                    const total = filled + notFilled;
                                    if (total > 0) {
                                        acc[org] = {
                                            filled,
                                            notFilled,
                                            total,
                                            filledPercentage: ((filled / total) * 100).toFixed(1),
                                            notFilledPercentage: ((notFilled / total) * 100).toFixed(1)
                                        };
                                    }
                                    return acc;
                                }, {})).map(([org, stats]) => (
                                    <Typography key={org} variant="body2" sx={{ color: adminColors.text, mb: 0.5 }}>
                                        <strong>{org}:</strong> {stats.filled} filled ({stats.filledPercentage}%), {stats.notFilled} not filled ({stats.notFilledPercentage}%)
                                    </Typography>
                                ))}
                            </Box>
                        </Card>
                    </Box>
                </Box>
            </Container>

            {/* Reminder Dialog */}
            <Dialog open={openReminderDialog} onClose={handleCloseReminderDialog}>
                <DialogTitle>Send Reminder</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Send a reminder to {selectedRecipient?.name}
                    </DialogContentText>
                    <TextField
                        autoFocus
                        margin="dense"
                        label="Reminder Message"
                        type="text"
                        fullWidth
                        multiline
                        rows={4}
                        value={reminderEmail}
                        onChange={(e) => setReminderEmail(e.target.value)}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseReminderDialog}>Cancel</Button>
                    <Button onClick={handleSendReminder} variant="contained" color="primary">
                        Send Reminder
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Date Editor Dialog */}
            <Dialog open={isDateEditorOpen} onClose={() => setIsDateEditorOpen(false)}>
                <DialogTitle>Edit Assessment Dates</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Update the start and end dates for this assessment.
                    </DialogContentText>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
                        <TextField
                            label="Start Date"
                            type="date"
                            value={selectedAssessment?.start_date?.split('T')[0] || ''}
                            onChange={(e) => {
                                setSelectedAssessment(prev => ({
                                    ...prev,
                                    start_date: e.target.value
                                }));
                            }}
                            InputLabelProps={{
                                shrink: true,
                            }}
                            fullWidth
                        />
                        <TextField
                            label="End Date"
                            type="date"
                            value={selectedAssessment?.end_date?.split('T')[0] || ''}
                            onChange={(e) => {
                                setSelectedAssessment(prev => ({
                                    ...prev,
                                    end_date: e.target.value
                                }));
                            }}
                            InputLabelProps={{
                                shrink: true,
                            }}
                            fullWidth
                        />
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setIsDateEditorOpen(false)}>Cancel</Button>
                    <Button 
                        onClick={() => {
                            handleDateUpdate(
                                selectedAssessment.id,
                                selectedAssessment.start_date,
                                selectedAssessment.end_date
                            );
                            setIsDateEditorOpen(false);
                        }}
                        variant="contained" 
                        color="primary"
                    >
                        Update Dates
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
}

export default AdminDashboard; 