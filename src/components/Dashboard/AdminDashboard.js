import React, { useEffect, useState, useMemo } from 'react';
import { Container, Typography, Box, Select, MenuItem, FormControl,
    InputLabel, Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, TablePagination, Card, Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, TextField  } from '@mui/material';
import IconButton from '@mui/material/IconButton';
import SendIcon from '@mui/icons-material/Send';
import { useNavigate } from 'react-router-dom';
import Navbar from '../shared/Navbar/Navbar';

// Register Chart.js components

// Update the admin color theme based on the AdminLandingPage colors
const adminColors = {
    primary: '#633394',         // Primary purple color from AdminLandingPage
    secondary: '#967CB2',       // Secondary color (lighter purple) from AdminLandingPage hover
    background: '#f5f5f5',      // Background color from AdminLandingPage cards
    text: '#212121',            // Text color
    headerBg: '#ede7f6',        // Light purple for table header
    completedColor: '#4caf50',  // Green for completed status
    notStartedColor: '#9e9e9e', // Grey for not started
    pendingColor: '#ff9800',    // Orange for pending
    pastDueColor: '#f44336',    // Red for past due
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
    const [filters, setFilters] = useState({ organization: '', users: '', status: '', urgency: '' });
    const [availableUsers, setAvailableUsers] = useState([]);
    const [openReminderDialog, setOpenReminderDialog] = useState(false);
    const [selectedRecipient, setSelectedRecipient] = useState(null);
    const [selectedRole, setSelectedRole] = useState('');
    const [selectedId, setSelectedId] = useState(null);
    const [assessmentEndDate, setAssessmentEndDate] = useState(null);
    const [reminderEmail, setReminderEmail] = useState('Please complete the survey form.');
    const [selectedLeader, setSelectedLeader] = useState(null);
    const navigate = useNavigate();
    const [selectedAssessment, setSelectedAssessment] = useState(null);
    const [isDateEditorOpen, setIsDateEditorOpen] = useState(false);
    const [companyCoachDetails, setCompanyCoachDetails] = useState([]);
    const [isDataLoaded, setIsDataLoaded] = useState(false);

    const highlightStyle = { fontWeight: 'bold', color: adminColors.secondary };
    const highlightStyleBackgroundColor = adminColors.highlightBg;

    useEffect(() => {
        const loadData = async () => {
            try {
                const dashboardData = { users: [], assessments: [], observers: [], companies: [] }
                
                setData(dashboardData);
                setIsDataLoaded(true);
                setUniqueCompanies(Array.from(new Set(dashboardData.companies.map(company => company.name).filter(company => company))));
                setAvailableUsers(dashboardData.users);
            } catch (error) {
                console.error('Failed to fetch dashboard data:', error);
            }
        };
        
        const userRole = localStorage.getItem('userRole');
        if (userRole && userRole !== 'admin') {
            // Prevent navigation to the admin dashboard if role is not 'admin'
            navigate('/home');
        } else {
            loadData();
        }
    }, []);

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

    const handleOpenReminderDialog = (assessmentId) => {
        // Find the assessment by ID
        const selectedAssessment = assessments.find((assessment) => assessment.id === assessmentId);

        if (!selectedAssessment) {
            console.error('Assessment not found.');
            return;
        }

        // Determine the leader and observers for the assessment
        const leader = data.users.find(
            (user) => user.id === selectedAssessment.leader_id && user.role === 'leader'
        );

        const observersForAssessment = data.observers.filter(
            (observer) => observer.assessment_id === assessmentId
        );

        // Logic to determine role and ID
        let selectedRole = '';
        let selectedId = null;
        let recipient = null;

        if (leader && observersForAssessment.length === 0) {
            selectedRole = 'Leader';
            selectedId = leader.id;
            recipient = leader;
        } else if (observersForAssessment.length > 0) {
            selectedRole = 'Observer';
            selectedId = observersForAssessment[0].id;
            recipient = observersForAssessment[0];
        }

        // Set state variables with calculated values
        setSelectedRecipient(recipient);
        setSelectedRole(selectedRole);
        setSelectedId(selectedId);
        setAssessmentEndDate(selectedAssessment.end_date);
        setOpenReminderDialog(true);
    };

    const handleCloseReminderDialog = () => {
        setOpenReminderDialog(false);
        setSelectedRecipient(null);
        setSelectedRole('');
        setSelectedId(null);
        setAssessmentEndDate(null);
    };

    const getStatusAndUrgency = (assessment) => {
        const currentDate = new Date();
        const startDate = new Date(assessment.start_date);
        const endDate = new Date(assessment.end_date);
        let status = assessment.completed ? 'Filled' : 'Not-Filled';
        let urgencyColor = adminColors.notStartedColor; // Modified to use admin colors

        if (assessment.completed) {
            urgencyColor = adminColors.completedColor;
        } else if (currentDate > endDate) {
            urgencyColor = adminColors.pastDueColor;
        } else if (currentDate >= startDate && currentDate <= endDate) {
            urgencyColor = adminColors.pendingColor;
        }

        return { status, urgencyColor };
    };

    const getStatusAndUrgencyforLO = (assessment, isLeader) => {
        const currentDate = new Date();
        const startDate = new Date(assessment.start_date);
        const endDate = new Date(assessment.end_date);
        
        // Determine completion based on whether it's leader or observer
        const isCompleted = isLeader ? assessment.leaderCompleted : assessment.observerCompleted;
        let status = isCompleted ? 'Filled' : 'Not-Filled';
        let urgencyColor = adminColors.notStartedColor; // Modified to use admin colors
    
        if (isCompleted) {
            urgencyColor = adminColors.completedColor;
        } else if (currentDate > endDate) {
            urgencyColor = adminColors.pastDueColor;
        } else if (currentDate >= startDate && currentDate <= endDate) {
            urgencyColor = adminColors.pendingColor;
        }
    
        return { status, urgencyColor };
    };

    // Filtered data based on selected filters
    const filteredAssessments = data.assessments.filter((assessment) => {
        const leader = data.users.find(u => u.id === assessment.leader_id && u.role === 'leader');
        const observer = data.observers.find(o => o.assessment_id === assessment.id);
        const company = data.companies.find(c => leader && c.id === leader.company_id);
        const isCompanyMatch = !filters.organization || (company && company.name === filters.organization);

        // Get status based on assessment
        const { status, urgencyColor } = getStatusAndUrgency(assessment);
        
        // Check if user matches filter (could be leader or observer)
        const userMatch = !filters.users || 
            (leader && leader.name.includes(filters.users)) ||
            (observer && observer.name.includes(filters.users));

        return isCompanyMatch &&
            userMatch &&
            (!filters.status || filters.status === status) &&
            (!filters.urgency || urgencyColor.includes(filters.urgency));
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

    return (
        <>
            <Navbar />
            <Container maxWidth="xl" sx={{ mt: 4, flexGrow: 1, overflow: 'auto' }}>
                <Typography variant="h4" gutterBottom sx={{ color: adminColors.primary, fontWeight: 'bold' }}>
                    Admin Dashboard
                </Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gridTemplateRows: '1fr 1fr', gap: 2 }}>
                    {/* Table Section */}
                    <Box sx={{gridColumn:'1 / 2', gridRow:'1 / 3'}}>
                        <Card sx={{ boxShadow: 3, gridColumn: '1 / 3', gridRow: '2 / 3', padding: 2, bgcolor: adminColors.background }}>
                            <Typography variant="h6" gutterBottom sx={{ color: adminColors.text }}>
                                Assessments Status
                            </Typography>
                            <Box sx={{ display: 'flex',gap: 2 }}>
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
                                <FormControl variant="outlined" size="small" sx={{ minWidth: 120 }}>
                                    <InputLabel>Urgency</InputLabel>
                                    <Select name="urgency" value={filters.urgency} onChange={handleFilterChange} label="Urgency">
                                        <MenuItem value=""><em>None</em></MenuItem>
                                        <MenuItem value={adminColors.pastDueColor}>Survey Past Due</MenuItem>
                                        <MenuItem value={adminColors.notStartedColor}>Survey Not Started</MenuItem>
                                        <MenuItem value={adminColors.pendingColor}>Survey Nearing Deadline</MenuItem>
                                        <MenuItem value={adminColors.completedColor}>Survey Filled</MenuItem>
                                    </Select>
                                </FormControl>
                            </Box>
                            <Box sx={{ display: 'flex',flexDirection: 'row',gap: 2 }}>
                                <Box sx={{ flexGrow: 1 }}>
                                    <TableContainer sx={{ borderRadius: 2, border: `1px solid ${adminColors.borderColor}`, overflow: 'hidden', mt: 2 }}>
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
                                                {filteredAssessments.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((assessment) => {
                                                    const leader = data.users.find(u => u.id === assessment.leader_id && u.role === 'leader');
                                                    const observer = data.observers.find(o => o.assessment_id === assessment.id);
                                                    const company = data.companies.find(c => leader && c.id === leader.company_id);
                                                    const companyName = company ? company.name : '';
                                                    
                                                    const { status, urgencyColor } = getStatusAndUrgency(assessment);
                                                    const userName = leader ? leader.name : (observer ? observer.name : '');
                                                    
                                                    return (
                                                        <TableRow key={assessment.id} sx={{ height: '30px', '& td': { padding: '4px', height: 'auto' } }}>
                                                            <TableCell sx={{ borderRight: `1px solid ${adminColors.borderColor}` }}>{companyName}</TableCell>
                                                            <TableCell sx={{ borderRight: `1px solid ${adminColors.borderColor}`, bgcolor: urgencyColor }}>{userName}</TableCell>
                                                            <TableCell sx={{ borderRight: `1px solid ${adminColors.borderColor}` }}>{status}</TableCell>
                                                            <TableCell 
                                                                sx={{ 
                                                                    borderRight: `1px solid ${adminColors.borderColor}`,
                                                                    cursor: 'pointer',
                                                                    '&:hover': { backgroundColor: highlightStyleBackgroundColor }
                                                                }}
                                                                onClick={() => handleDateClick(assessment)}
                                                            >
                                                                {formatDateCompact(assessment.start_date)}
                                                            </TableCell>
                                                            <TableCell 
                                                                sx={{ 
                                                                    borderRight: `1px solid ${adminColors.borderColor}`,
                                                                    cursor: 'pointer',
                                                                    '&:hover': { backgroundColor: highlightStyleBackgroundColor }
                                                                }}
                                                                onClick={() => handleDateClick(assessment)}
                                                            >
                                                                {formatDateCompact(assessment.end_date)}
                                                            </TableCell>
                                                            <TableCell sx={{ borderRight: `1px solid ${adminColors.borderColor}` }}>{assessment.reminderCount}</TableCell>
                                                            <TableCell>                                                                
                                                                <IconButton
                                                                    title="Send Reminder"
                                                                    sx={{ color: adminColors.primary }}
                                                                    onClick={() => handleOpenReminderDialog(assessment.id)}
                                                                >
                                                                    <SendIcon />
                                                                </IconButton>
                                                            </TableCell>
                                                        </TableRow>
                                                    );
                                                })}
                                            </TableBody>
                                        </Table>
                                        <TablePagination
                                            component="div"
                                            count={filteredAssessments.length}
                                            page={page}
                                            onPageChange={handleChangePage}
                                            rowsPerPage={rowsPerPage}
                                            onRowsPerPageChange={handleChangeRowsPerPage}
                                            rowsPerPageOptions={[5, 10, 25]}
                                        />
                                    </TableContainer>
                                </Box>
                            </Box>
                        </Card>
                    </Box>

                </Box>
            </Container>
        </>
    );
}

export default AdminDashboard; 