import React, { useEffect, useState, useMemo } from 'react';
import DashboardLayout from './DashboardLayout';
import { Container, Typography, Box, Select, MenuItem, FormControl,
    InputLabel, Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, TablePagination, Card, Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, TextField  } from '@mui/material';
//import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';
import SendIcon from '@mui/icons-material/Send';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title,
    Tooltip, Legend } from 'chart.js';
import { fetchDashboardData, fetchUsersResponses, updateAssessmentDates,fetchCompanyCoachDetails } from './services/dashboardService';
import UrgencyLegend from './Utilities/UrgencyLegend';
import { useNavigate } from 'react-router-dom';
import {EmailDialog} from './../Email/EmailDialog';
//import { format } from 'date-fns';
import DateEditor from './Utilities/DateEditor';
// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

function RootDashboard({ onLogout }) {
    const tabs = [
        { label: 'Home', path: '/home'},
        { label: 'Assessment Overview', path: '/root-dashboard' },
        { label: '360 Degree Assessment', path: '/edit-assessments' },
        { label: 'Users Management', path: '/users' },
        { label: 'Settings', path: '/settings' },
        { label: 'Reports', path: '/reports' },
    ];

    const [data, setData] = useState({ users: [], assessments: [], observers: [],companies:[] });
    const [responses, setResponses] = useState([]);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [uniqueCompanies, setUniqueCompanies] = useState([]);
    const [filters, setFilters] = useState({ company: '', coach: '', leader: '', observer: '', status: '', urgency: '' });
    const [availableCoaches, setAvailableCoaches] = useState([]);
    const [availableLeaders, setAvailableLeaders] = useState([]);
    const [availableObservers, setAvailableObservers] = useState([]);
    const [openReminderDialog, setOpenReminderDialog] = useState(false);
    const [selectedRecipient, setSelectedRecipient] = useState(null);
    const [selectedRole, setSelectedRole] = useState('');
    const [selectedId, setSelectedId] = useState(null);
    const [assessmentEndDate, setAssessmentEndDate] = useState(null);
    const [reminderEmail, setReminderEmail] = useState('Please complete the survey form.');
    const [selectedLeader, setSelectedLeader] = useState(null);
    const navigate = useNavigate();
    // Add these state variables to your component
    const [selectedAssessment, setSelectedAssessment] = useState(null);
    const [isDateEditorOpen, setIsDateEditorOpen] = useState(false);
    const [companyCoachDetails, setCompanyCoachDetails] = useState([]);

    const highlightStyle = { fontWeight: 'bold', color:'#ff0000' }; // Red color for highlight
    const highlightStyleBackgroundColor = '#edf6ec'; // Light red color for highlight
    const [isDataLoaded, setIsDataLoaded] = useState(false); // Add loading state
    useEffect(() => {
        const loadData = async () => {
            try {
                const dashboardData = await fetchDashboardData();
                const responsesData = await fetchUsersResponses();
                const companyCoachDetailsFetch = await fetchCompanyCoachDetails();
                console.log(dashboardData, companyCoachDetailsFetch);
                setData(dashboardData);
                setResponses(responsesData);
                setCompanyCoachDetails(companyCoachDetailsFetch);
                setIsDataLoaded(true); // Mark data as loaded
                setUniqueCompanies(Array.from(new Set(dashboardData.companies.map(company => company.name).filter(company => company))));
                setAvailableLeaders(dashboardData.users.filter(user => user.role === 'leader')); // Set all available leaders initially
                console.log(dashboardData.users.filter(user => user.role === 'leader'));
            } catch (error) {
                console.error('Failed to fetch dashboard data:', error);
            }
        };
        const userRole = localStorage.getItem('userRole');
        if (userRole && userRole !== 'root') {
            // Prevent navigation to the previous page if the role is not 'root'
            navigate('/home');
        } else {
            //loadCoachDashboardData();
            loadData();
        }
        
    }, []);

    // Memoize assessments and observers to stabilize references
    const assessments = useMemo(() => data.assessments, [data]);
    const observers = useMemo(() => data.observers, [data]);

    // Update available filter options when company changes
    /*useEffect(() => {
        if (filters.company) {
            //console.log(filters.company);
            const selectedCompany = data.companies.find(company => company.name === filters.company);
            const leadersForCompany = data.users.filter(user => user.role === 'leader' && user.company_id === selectedCompany.id);
            //console.log(leadersForCompany);
            setAvailableLeaders(leadersForCompany);

            const coachesForCompany = data.users.filter(user => 
                user.role === 'coach' && 
                leadersForCompany.some(leader => leader.supervisor_id === user.id)
            );
            setAvailableCoaches(coachesForCompany);

            const observersForCompany = data.observers.filter(observer => 
                leadersForCompany.some(leader => leader.id === observer.leader_id)
            );
            setAvailableObservers(observersForCompany);
        } else {
            console.log("Showing all users");
            setAvailableCoaches(data.users.filter(user => user.role === 'coach'));
            setAvailableLeaders(data.users.filter(user => user.role === 'leader'));
            setAvailableObservers(data.observers);
        }
    }, [filters.company, data]);
    */
    useEffect(() => {
    if (filters.company) {
        // Filter coaches based on selected company
        const selectedCompanyCoaches = companyCoachDetails
            .filter(detail => detail.company_name === filters.company)
            .map(detail => ({ id: detail.coach_id, name: detail.coach_name }));
        setAvailableCoaches(selectedCompanyCoaches);

        // Ensure leaders and observers are filtered based on company
        const selectedCompany = data.companies.find(company => company.name === filters.company);
        const leadersForCompany = data.users.filter(user => user.role === 'leader' && user.company_id === selectedCompany.id);
        setAvailableLeaders(leadersForCompany);
        const observersForCompany = data.observers.filter(observer =>
            leadersForCompany.some(leader => leader.id === observer.leader_id)
        );
        setAvailableObservers(observersForCompany);
    } else if (filters.coach) {
        // Filter companies based on selected coach
        const selectedCoachCompanies = companyCoachDetails
            .filter(detail => detail.coach_name === filters.coach)
            .map(detail => detail.company_name);
        setUniqueCompanies([...new Set(selectedCoachCompanies)]);

        // Ensure leaders and observers are filtered based on coach
        const leadersForCoach = data.users.filter(user =>
            user.role === 'leader' &&
            companyCoachDetails.some(detail =>
                detail.coach_id === user.supervisor_id && detail.coach_name === filters.coach
            )
        );
        setAvailableLeaders(leadersForCoach);
        const observersForCoach = data.observers.filter(observer =>
            leadersForCoach.some(leader => leader.id === observer.leader_id)
        );
        setAvailableObservers(observersForCoach);
    } else {
        // Reset to show all options if no filter is applied
        setAvailableCoaches(data.users.filter(user => user.role === 'coach'));
        setUniqueCompanies(Array.from(new Set(data.companies.map(company => company.name))));
        setAvailableLeaders(data.users.filter(user => user.role === 'leader'));
        setAvailableObservers(data.observers);
    }
}, [filters.company, filters.coach, data, companyCoachDetails]);


// Update assessments based on responses
    /*
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

                const isCompleted =
                    leaderResponse?.CompletePartial === 'Complete' ||
            
                observerResponses.some((response) => response?.CompletePartial === 'Complete');
                // Calculate reminders sent: use leader's reminder count or sum of observers' reminder counts
                const leader = data.users.find((user) => user.id === assessment.leader_id);
                const totalObserverReminders = observersForAssessment.reduce(
                    (sum, observer) => sum + (observer.reminder || 0),
                    0
                );

                const reminderCount = observersForAssessment.length ? totalObserverReminders :leader.reminder || 0;
                //leader ? leader.reminder || 0 : totalObserverReminders;
                //console.log(observersForAssessment, leader.reminder, reminderCount);
                // Add the new userID key
                const userID = leaderResponse ? assessment.leader_id : 
                            (observerResponses.length > 0 ? observerResponses[0].userID : null);
                return {
                    ...assessment,
                    completed: isCompleted ? 1 : 0,
                    userID, // Add the new key here
                    reminderCount:reminderCount,
                };
            });

            setData(updatedData);
        }
    }, [isDataLoaded, responses]); // Include isDataLoaded in dependencies
    */

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
                    leaderCompleted: leaderCompleted ? 1 : 0,  // New field for leader completion
                    observerCompleted: observerCompleted ? 1 : 0,  // New field for observer completion
                    completed: (leaderCompleted || observerCompleted) ? 1 : 0,  // Overall completion status if needed
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
        setPage(0); // Reset page to 0 when filters are changed
    };

    /*const handleOpenReminderDialog = (leader) => {
        setSelectedLeader(leader);
        setOpenReminderDialog(true);
    };
    const handleOpenReminderDialog = (recipient, role, id, endDate) => {
        setSelectedRecipient(recipient);
        setSelectedRole(role);
        setSelectedId(id);
        setAssessmentEndDate(endDate);
        setOpenReminderDialog(true);
    };

    const handleCloseReminderDialog = () => {
        setOpenReminderDialog(false);
        setSelectedLeader(null);
    };*/

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
    console.log(leader, observersForAssessment);
    // Logic to determine role and ID
    let selectedRole = '';
    let selectedId = null;
    let recipient = null;

    if (leader && observersForAssessment.length===0) {
        selectedRole = 'Leader';
        selectedId = leader.id;
        recipient = leader; // Set the leader as the recipient
    } else if (observersForAssessment.length > 0) {
        selectedRole = 'Observer';
        selectedId = observersForAssessment[0].id; // Use the first observer as default
        recipient = observersForAssessment[0]; // Set the first observer as the recipient
    }

    // Set state variables with calculated values
    setSelectedRecipient(recipient);
    setSelectedRole(selectedRole);
    setSelectedId(selectedId);
    setAssessmentEndDate(selectedAssessment.end_date); // Use end date from assessment
    setOpenReminderDialog(true); // Open dialog
};

    const handleCloseReminderDialog = () => {
        setOpenReminderDialog(false);
        setSelectedRecipient(null);
        setSelectedRole('');
        setSelectedId(null);
        setAssessmentEndDate(null);
    };

    const handleSendReminder = () => {
        console.log(`Sending reminder to ${selectedLeader.name}: ${reminderEmail}`);
        // Logic to send email reminder
        handleCloseReminderDialog();
    };

    const getStatusAndUrgency = (assessment) => {
        const currentDate = new Date();
        const startDate = new Date(assessment.start_date);
        const endDate = new Date(assessment.end_date);
        let status = assessment.completed ? 'Filled' : 'Not-Filled';
        let urgencyColor = '#ccc'; // Default grey

        if (assessment.completed) {
            urgencyColor = '#5a8354';
        } else if (currentDate > endDate) {
            urgencyColor = '#f44336';
        } else if (currentDate >= startDate && currentDate <= endDate) {
            urgencyColor = '#e3a133';
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
        let urgencyColor = '#ccc'; // Default grey
    
        if (isCompleted) {
            urgencyColor = '#5a8354'; // Completed (green)
        } else if (currentDate > endDate) {
            urgencyColor = '#f44336'; // Past due (red)
        } else if (currentDate >= startDate && currentDate <= endDate) {
            urgencyColor = '#e3a133'; // In progress (orange)
        }
    
        return { status, urgencyColor };
    };

    // Filtered data based on selected filters
    const filteredAssessments = data.assessments.filter((assessment) => {
        //console.log(assessment);
        const leader = data.users.find(u => u.id === assessment.leader_id && u.role === 'leader');
        const coach = data.users.find(u => u.role === 'coach' && data.users.some(l => l.id === assessment.leader_id && l.role === 'leader' && l.supervisor_id === u.id));
        const observer = data.observers.find(o => o.assessment_id === assessment.id);
        const company = data.companies.find(c => leader && c.id === leader.company_id);
        const isCompanyMatch = !filters.company || (company && company.name === filters.company);
        //const { status } = getStatusAndUrgency(assessment);

        // Get status based on who we're filtering
        let status;
        let urgencyColor;

        if (filters.leader && !filters.observer) {
            // If filtering by leader only
            ({ status, urgencyColor } = getStatusAndUrgencyforLO(assessment, true));
        } else if (!filters.leader && filters.observer) {
            // If filtering by observer only
            ({ status, urgencyColor } = getStatusAndUrgencyforLO(assessment, false));
        } else {
            if(assessment.role === null){
                ({ status, urgencyColor } = getStatusAndUrgencyforLO(assessment, false));
            }
            if(assessment.role === 'leader'){
                ({ status, urgencyColor } = getStatusAndUrgencyforLO(assessment, true));
            }
        }
        return isCompanyMatch &&
            (!filters.coach || (coach && coach.name.includes(filters.coach))) &&
            (!filters.leader || (leader && leader.name.includes(filters.leader))) &&
            (!filters.observer || (observer && observer.name.includes(filters.observer))) &&
            (!filters.status || filters.status === status) &&
            (!filters.urgency || getStatusAndUrgency(assessment).urgencyColor.includes(filters.urgency));
    });

    const handleDateClick = (assessment) => {
        //console.log(assessment);
        setSelectedAssessment(assessment);
        setIsDateEditorOpen(true);
    };

    const formatDateCompact = (dateString) => {
        if (!dateString) return '';
        //console.log(dateString);
        const date = new Date(dateString);
        // Format as MM/DD/YY
        return date.toLocaleDateString('en-US', {
            month: '2-digit',
            day: '2-digit',
            year: '2-digit',
            timeZone: 'UTC'
        });
    };
    const  handleDateUpdate = async (assessmentId, newStartDate, newEndDate) => {
        try {
            // Make API call to update dates
            const response = await updateAssessmentDates(assessmentId, newStartDate, newEndDate);
            /*const response = await fetch('/api/update-assessment-dates', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    assessmentId: assessmentId,
                    startDate: newStartDate,
                    endDate: newEndDate
                })
            });*/
            console.log(response.success);
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

    const chartData = {
        labels: ['Leaders', 'Observers'],
        datasets: [{
                label: 'Completed Assessments',
                data: [
                    // Leaders completed - only count unique leaders who have completed their assessments
                    [...new Set(filteredAssessments
                        .filter(assessment => 
                            assessment.leaderCompleted && 
                            !data.observers.some(o => o.assessment_id === assessment.id) // Ensure it's a leader assessment
                        )
                        .map(assessment => assessment.leader_id)
                    )].length,
                    // Observers completed
                    filteredAssessments.reduce((count, assessment) => {
                        const observersForAssessment = data.observers.filter(o => 
                            o.assessment_id === assessment.id
                        );
                        return count + (assessment.observerCompleted ? observersForAssessment.length : 0);
                    }, 0)
                ],
                backgroundColor: '#5a8354',
                borderWidth: 1,
            },
            {
                label: 'Non-Completed Assessments',
                data: [
                    // Leaders not completed - only count unique leaders who haven't completed
                    [...new Set(filteredAssessments
                        .filter(assessment => 
                            !assessment.leaderCompleted && 
                            !data.observers.some(o => o.assessment_id === assessment.id) // Ensure it's a leader assessment
                        )
                        .map(assessment => assessment.leader_id)
                    )].length,
                    // Observers not completed
                    filteredAssessments.reduce((count, assessment) => {
                        const observersForAssessment = data.observers.filter(o => 
                            o.assessment_id === assessment.id
                        );
                        return count + (!assessment.observerCompleted ? observersForAssessment.length : 0);
                    }, 0)
                ],
                backgroundColor: '#263d9d',
                borderWidth: 1,
            }
        ]
    };
    
    const chartOptions = {
        responsive: true,
        plugins: {
            legend: { position: 'top' },
            title: {
                display: false,
                text: 'Assessment Completion Overview',
            },
        },
        scales: {
            y: {
                beginAtZero: true,
                ticks: {
                    stepSize: 1
                }
            }
        },
        maintainAspectRatio: false
    };

    return (
        <div>
            <DashboardLayout tabs={tabs} onLogout={onLogout} />
            <Container maxWidth="xl" sx={{ mt: 4, flexGrow: 1, overflow: 'auto' }}>
                <Box sx={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gridTemplateRows: '1fr 1fr', gap: 2 }}>
                    {/* Table Section */}
                    <Box sx={{gridColumn:'1 / 2', gridRow:'1 / 3'}}>
                        <Card sx={{ boxShadow: 3, gridColumn: '1 / 3', gridRow: '2 / 3', padding: 2,  }}>
                            <Typography variant="h6" gutterBottom sx={{ color: '#000' }}>
                                Assessments Status
                            </Typography>
                            <Box sx={{ display: 'flex',gap: 2 }}>
                                <FormControl variant="outlined" size="small" sx={{ minWidth: 120 }}>
                                    <InputLabel>Company</InputLabel>
                                    <Select name="company" value={filters.company} onChange={handleFilterChange} label="Company">
                                        <MenuItem value=""><em>None</em></MenuItem>
                                        {uniqueCompanies.map((company, index) => (
                                            <MenuItem key={index} value={company}>{company}</MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                                <FormControl variant="outlined" size="small" sx={{ minWidth: 120 }}>
                                    <InputLabel>Coach</InputLabel>
                                    <Select name="coach" value={filters.coach} onChange={handleFilterChange} label="Coach">
                                        <MenuItem value=""><em>None</em></MenuItem>
                                        {availableCoaches.map(coach => (
                                            <MenuItem key={coach.id} value={coach.name}>{coach.name}</MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                                <FormControl variant="outlined" size="small" sx={{ minWidth: 120 }}>
                                    <InputLabel>Leader</InputLabel>
                                    <Select name="leader" value={filters.leader} onChange={handleFilterChange} label="Leader">
                                        <MenuItem value=""><em>None</em></MenuItem>
                                        {availableLeaders.map(leader => (
                                            <MenuItem key={leader.id} value={leader.name}>{leader.name}</MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                                <FormControl variant="outlined" size="small" sx={{ minWidth: 120 }}>
                                    <InputLabel>Observer</InputLabel>
                                    <Select name="observer" value={filters.observer} onChange={handleFilterChange} label="Observer">
                                        <MenuItem value=""><em>None</em></MenuItem>
                                        {availableObservers.map(observer => (
                                            <MenuItem key={observer.id} value={observer.name}>{observer.name}</MenuItem>
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
                                        <MenuItem value="#f44336">Survey Past Due</MenuItem>
                                        <MenuItem value="#ccc">Survey Not Started</MenuItem>
                                        <MenuItem value="#e3a133">Survey Nearing Deadline</MenuItem>
                                        <MenuItem value="#5a8354">Survey Filled</MenuItem>
                                    </Select>
                                </FormControl>
                            </Box>
                            <Box sx={{ display: 'flex',flexDirection: 'row',gap: 2 }}>
                                <Box sx={{ flexGrow: 1 }}>
                                    <TableContainer sx={{ borderRadius: 2, border: '1px solid #ccc', overflow: 'hidden', mt: 2 }}>
                                        <Table sx={{ borderCollapse: 'collapse' }}>
                                            <TableHead>
                                                <TableRow sx={{ backgroundColor: '#d1dad6' }}>
                                                    <TableCell sx={{ borderRight: '1px solid #ccc' }}>Company</TableCell>
                                                    <TableCell sx={{ borderRight: '1px solid #ccc' }}>Coach</TableCell>
                                                    <TableCell sx={{ borderRight: '1px solid #ccc' }}>Leader</TableCell>
                                                    <TableCell sx={{ borderRight: '1px solid #ccc' }}>Observer</TableCell>
                                                    <TableCell sx={{ borderRight: '1px solid #ccc' }}>Status</TableCell>
                                                    <TableCell sx={{ borderRight: '1px solid #ccc' }}>Start Date</TableCell>  {/* New column */}
                                                    <TableCell sx={{ borderRight: '1px solid #ccc' }}>End Date</TableCell> 
                                                    <TableCell sx={{ borderRight: '1px solid #ccc' }}>Reminders Sent</TableCell>
                                                    <TableCell>Actions</TableCell>
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                {filteredAssessments.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((assessment) => {
                                                    //console.log(assessment);
                                                    const leader = data.users.find(u => u.id === assessment.leader_id && u.role === 'leader');
                                                    const coach = data.users.find(u => u.role === 'coach' && data.users.some(l => l.id === assessment.leader_id && l.role === 'leader' && l.supervisor_id === u.id));
                                                    const observer = data.observers.find(o => o.assessment_id === assessment.id);
                                                    const company = data.companies.find(c => leader && c.id === leader.company_id);
                                                    const companyName = company ? company.name : '';
                                                    // Correct destructuring assignment
                                                    let { status, urgencyColor } = leader && !observer ? 
                                                    getStatusAndUrgencyforLO(assessment, true) : 
                                                    observer ? getStatusAndUrgencyforLO(assessment, false) : 
                                                    { status: '', urgencyColor: '' };
                                                    return (
                                                        <TableRow key={assessment.id} sx={{ height: '30px', '& td': { padding: '4px', height: 'auto' } }}>
                                                            <TableCell sx={{ borderRight: '1px solid #ccc' }}>{companyName}</TableCell>
                                                            <TableCell sx={{ borderRight: '1px solid #ccc'}}>{coach ? coach.name : ''}</TableCell>
                                                            <TableCell sx={{ borderRight: '1px solid #ccc', bgcolor:(leader && !observer ? urgencyColor : '') }}>{leader ? leader.name : ''}</TableCell>
                                                            {/*<TableCell sx={{ 
                                                                borderRight: '1px solid #ccc', 
                                                                bgcolor: (leader && !observer) ? 
                                                                    (assessment.leaderCompleted ? completedColor : urgencyColor) : 
                                                                    (observer ? (assessment.observerCompleted ? completedColor : urgencyColor) : '')
                                                            }}></TableCell>*/}
                                                            <TableCell sx={{ borderRight: '1px solid #ccc', bgcolor:(observer ? urgencyColor : '') }}>{observer ? observer.name : ''}</TableCell>
                                                            <TableCell sx={{ borderRight: '1px solid #ccc' }}>{status}</TableCell>
                                                            <TableCell 
                                                                sx={{ 
                                                                    borderRight: '1px solid #ccc',
                                                                    cursor: 'pointer',
                                                                    '&:hover': { backgroundColor: '#f5f5f5' }
                                                                }}
                                                                onClick={() => handleDateClick(assessment)}
                                                            >
                                                                {formatDateCompact(assessment.start_date)}
                                                            </TableCell>
                                                            <TableCell 
                                                                sx={{ 
                                                                    borderRight: '1px solid #ccc',
                                                                    cursor: 'pointer',
                                                                    '&:hover': { backgroundColor: '#f5f5f5' }
                                                                }}
                                                                onClick={() => handleDateClick(assessment)}
                                                            >
                                                                {formatDateCompact(assessment.end_date)}
                                                            </TableCell>
                                                            <TableCell sx={{ borderRight: '1px solid #ccc' }}>{assessment.reminderCount}</TableCell> {/* New column */}
                                                            <TableCell>                                                                
                                                                <IconButton
                                                                    title="Send Reminder"
                                                                    sx={{ color: '#263d9d' }}
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
                                <Box sx={{ flexShrink: 0 }}>
                                    <UrgencyLegend />
                                </Box>
                            </Box>
                        </Card>
                    </Box>
                    <Card sx={{ boxShadow: 3, padding: 2, gridColumn: '2 / 3', gridRow: '1 / 2', height: '300px' }}>
                        <Typography variant="h6" gutterBottom sx={{ color: '#000' }}>
                            Assessments Completion Overview
                        </Typography>
                        <Box sx={{ height: 'calc(100% - 32px)' }}>
                            <Bar data={chartData} options={chartOptions} />
                        </Box>
                    </Card>
                    {/*<Card sx={{ boxShadow: 3, gridColumn: '2 / 3', gridRow: '2 / 3', padding: 2 }}>
                        Content for top-right quadrant
                    </Card>*/}
                </Box>
            </Container>
            {selectedRecipient && (
                <EmailDialog
                    open={openReminderDialog}
                    onClose={handleCloseReminderDialog}
                    recipient={selectedRecipient} // Dynamically pass the selected recipient (leader or observer)
                    role={selectedRole}           // Pass the selected role (Leader or Observer)
                    id={selectedId}               // Pass the selected ID (leader_id or observer_id)
                    assessmentEndDate={assessmentEndDate} // Pass the assessment's end date
                />
            )}

            {/*<Dialog open={openReminderDialog} onClose={handleCloseReminderDialog}>
                <DialogTitle>Send Reminder</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Please edit the reminder email below, if necessary:
                    </DialogContentText>
                    <TextField
                        autoFocus
                        margin="dense"
                        label="Email Content"
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
                    <Button onClick={handleSendReminder} color="primary" variant="contained">Send</Button>
                </DialogActions>
            </Dialog>*/}
            {selectedAssessment && (
                <DateEditor
                    assessment={selectedAssessment}
                    open={isDateEditorOpen}
                    onClose={() => {
                    setIsDateEditorOpen(false);
                    setSelectedAssessment(null);
                    }}
                    onSave={handleDateUpdate}
                />
                )}
        </div>
    );
}

export default RootDashboard;