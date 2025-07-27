import React, { useEffect, useState, useMemo } from 'react';
import { Container, Typography, Box, Select, MenuItem, FormControl,
    InputLabel, Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, TablePagination, Card, Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, TextField, Grid, Checkbox, Alert, CircularProgress, Chip } from '@mui/material';
import IconButton from '@mui/material/IconButton';
import SendIcon from '@mui/icons-material/Send';
import EmailIcon from '@mui/icons-material/Email';
import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlank';
import CheckBoxIcon from '@mui/icons-material/CheckBox';
import PreviewIcon from '@mui/icons-material/Preview';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
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
        { label: 'Report Builder', path: '/reportbuilder' },
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

    // Add new states for enhanced reminder functionality
    const [pendingUsers, setPendingUsers] = useState([]);
    const [bulkReminderDialog, setBulkReminderDialog] = useState(false);
    const [selectedUsers, setSelectedUsers] = useState([]);
    const [reminderStatus, setReminderStatus] = useState({ sending: false, results: null });
    const [showReminderResults, setShowReminderResults] = useState(false);
    const [showEmailPreview, setShowEmailPreview] = useState(false);
    const [emailPreviewType, setEmailPreviewType] = useState('text'); // 'text' or 'html'
    
    // Add states for welcome email preview functionality
    const [showWelcomeEmailPreview, setShowWelcomeEmailPreview] = useState(false);
    const [welcomeEmailPreviewType, setWelcomeEmailPreviewType] = useState('text'); // 'text' or 'html'
    const [welcomeEmailPreviewUser, setWelcomeEmailPreviewUser] = useState(null);
    
    // Add states for survey response dates
    const [surveyResponses, setSurveyResponses] = useState([]);
    const [dateEditDialog, setDateEditDialog] = useState(false);
    const [selectedResponse, setSelectedResponse] = useState(null);
    const [editDates, setEditDates] = useState({ start_date: '', end_date: '' });
    
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
                
                // Fetch pending surveys for reminder functionality
                const pendingResponse = await fetch('/api/users/pending-surveys');
                const pendingData = await pendingResponse.json();
                setPendingUsers(pendingData.users || []);
                console.log('Fetched Pending Users:', pendingData);
                
                // Fetch survey responses
                const responsesResponse = await fetch('/api/responses');
                const responsesData = await responsesResponse.json();
                setSurveyResponses(responsesData || []);
                console.log('Fetched Survey Responses:', responsesData);
                
                // Fetch users
                const usersResponse = await fetch('/api/users/role/user');
                const users = await usersResponse.json();
                console.log('Fetched Users:', users);

                // Fetch user details to determine completion status
                const userDetailsResponse = await fetch('/api/user-details');
                const userDetailsData = await userDetailsResponse.json();
                
                // Process users data with correct field names and completion status
                const processedUsers = users.map(user => {
                    const userDetails = userDetailsData.find(detail => detail.user_id === user.id);
                    const isCompleted = userDetails?.is_submitted === true;
                    
                    // Find associated survey response for this user
                    const surveyResponse = responsesData.find(response => response.user_id === user.id);
                    
                    return {
                        id: user.id,
                        name: `${user.firstname} ${user.lastname}`,
                        username: user.username,
                        email: user.email,
                        role: 'user',
                        company_id: user.organization_id,
                        company_name: user.organization?.name,
                        reminder: 0,
                        status: isCompleted ? 'Filled' : 'Not-Filled',
                        survey_code: user.survey_code,
                        // Add survey response information
                        response_id: surveyResponse?.id || null,
                        start_date: surveyResponse?.start_date || null,
                        end_date: surveyResponse?.end_date || null,
                        response_status: surveyResponse?.status || null
                    };
                });
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
        setReminderStatus({ sending: true, results: null });
        
        try {
            const user = data.users.find(u => u.id === selectedId);
            if (!user) {
                console.error('User not found');
                return;
            }

            // Find corresponding user in pending users to get survey code
            const pendingUser = pendingUsers.find(p => p.id === selectedId);
            const surveyCode = pendingUser?.survey_code || user.survey_code || 'N/A';

            const response = await fetch('/api/send-reminder-email', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    to_email: user.email,
                    username: user.username,
                    survey_code: surveyCode,
                    firstname: user.name.split(' ')[0], // Extract first name
                    organization_name: user.company_name,
                    days_remaining: pendingUser?.days_since_creation ? Math.max(30 - pendingUser.days_since_creation, 0) : null
                }),
            });

            const result = await response.json();

            if (response.ok) {
                // Update the reminder count in the local state
                const updatedData = { ...data };
                const userToUpdate = updatedData.users.find(u => u.id === selectedId);
                if (userToUpdate) {
                    userToUpdate.reminder = (userToUpdate.reminder || 0) + 1;
                }
                setData(updatedData);

                setReminderStatus({ 
                    sending: false, 
                    results: { 
                        success: true, 
                        message: `Reminder email sent successfully to ${user.email}`,
                        method: result.method 
                    } 
                });
            } else {
                setReminderStatus({ 
                    sending: false, 
                    results: { 
                        success: false, 
                        message: result.error || 'Failed to send reminder email' 
                    } 
                });
            }
        } catch (error) {
            console.error('Error sending reminder:', error);
            setReminderStatus({ 
                sending: false, 
                results: { 
                    success: false, 
                    message: `Error sending reminder: ${error.message}` 
                } 
            });
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
        setReminderStatus({ sending: false, results: null });
        setShowEmailPreview(false);
    };

    // Add welcome email preview handlers
    const handleOpenWelcomeEmailPreview = (user) => {
        setWelcomeEmailPreviewUser(user);
        setShowWelcomeEmailPreview(true);
    };

    const handleCloseWelcomeEmailPreview = () => {
        setShowWelcomeEmailPreview(false);
        setWelcomeEmailPreviewUser(null);
        setWelcomeEmailPreviewType('text');
    };

    // Generate email preview content
    const generateEmailPreview = (user, pendingUser) => {
        if (!user) return { text: '', html: '' };

        const username = user.username;
        const email = user.email;
        const surveyCode = pendingUser?.survey_code || user.survey_code || 'N/A';
        const firstname = user.name.split(' ')[0];
        const organizationName = user.company_name;
        const daysRemaining = pendingUser?.days_since_creation ? Math.max(30 - pendingUser.days_since_creation, 0) : null;
        
        const greeting = firstname ? `Dear ${firstname}` : `Dear ${username}`;
        const orgText = organizationName ? ` from ${organizationName}` : "";
        const deadlineText = daysRemaining ? ` You have ${daysRemaining} days remaining to complete it.` : "";

        const textContent = `${greeting},

We hope this message finds you well!

This is a friendly reminder that you have a pending survey${orgText} on the Saurara Platform that requires your attention.${deadlineText}

Your Survey Details:
• Username: ${username}
• Survey Code: ${surveyCode}
• Survey Link: www.saurara.org

Why Your Response Matters:
Your input is invaluable in helping us understand and improve educational and community initiatives. Every response contributes to meaningful research that can make a real difference in communities like yours.

What You Need to Do:
1. Visit www.saurara.org
2. Enter your survey code: ${surveyCode}
3. Complete the survey at your convenience
4. Submit your responses

The survey typically takes 15-20 minutes to complete, and you can save your progress and return later if needed.

Need Help?
If you're experiencing any difficulties or have questions about the survey, please don't hesitate to reach out to our support team. We're here to help!

We truly appreciate your time and participation. Your voice matters, and we look forward to receiving your valuable insights.

Thank you for being part of the Saurara community!

Best regards,
The Saurara Research Team

---
This is an automated reminder. If you have already completed the survey, please disregard this message.
Visit: www.saurara.org | Email: support@saurara.org`;

        const htmlContent = `<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px 20px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; }
        .footer { background: #f8f9fa; padding: 20px; border-radius: 0 0 10px 10px; border: 1px solid #e0e0e0; border-top: none; }
        .highlight { background: #f0f8ff; padding: 15px; border-left: 4px solid #667eea; margin: 20px 0; }
        .survey-details { background: #e8f5e8; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .button { display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 10px 0; }
        .steps { background: #fff9e6; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .steps ol { margin: 0; padding-left: 20px; }
        .steps li { margin: 8px 0; }
        .reminder-tag { background: #ff6b6b; color: white; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: bold; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1 style="margin: 0; font-size: 28px;">🔔 Survey Reminder</h1>
            <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Saurara Research Platform</p>
        </div>
        
        <div class="content">
            <p style="font-size: 18px; margin-bottom: 20px;">${greeting},</p>
            
            <p>We hope this message finds you well!</p>
            
            <div class="highlight">
                <p><strong>📋 Pending Survey Reminder</strong></p>
                <p>You have a pending survey${orgText} on the Saurara Platform that requires your attention.${deadlineText}</p>
            </div>
            
            <div class="survey-details">
                <h3 style="color: #2c5530; margin-top: 0;">📊 Your Survey Details</h3>
                <ul style="list-style-type: none; padding-left: 0;">
                    <li><strong>👤 Username:</strong> ${username}</li>
                    <li><strong>🔑 Survey Code:</strong> <code style="background: #f0f0f0; padding: 2px 6px; border-radius: 4px; font-family: monospace;">${surveyCode}</code></li>
                    <li><strong>🌐 Platform:</strong> <a href="http://www.saurara.org" style="color: #667eea;">www.saurara.org</a></li>
                </ul>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
                <a href="http://www.saurara.org" class="button">🚀 Complete Survey Now</a>
            </div>
            
            <h3 style="color: #667eea;">🎯 Why Your Response Matters</h3>
            <p>Your input is invaluable in helping us understand and improve educational and community initiatives. Every response contributes to meaningful research that can make a real difference in communities like yours.</p>
            
            <div class="steps">
                <h3 style="color: #b8860b; margin-top: 0;">📝 Quick Steps to Complete</h3>
                <ol>
                    <li>Visit <a href="http://www.saurara.org" style="color: #667eea;">www.saurara.org</a></li>
                    <li>Enter your survey code: <strong>${surveyCode}</strong></li>
                    <li>Complete the survey at your convenience</li>
                    <li>Submit your responses</li>
                </ol>
                <p style="margin-bottom: 0;"><em>⏱️ Typically takes 15-20 minutes • 💾 Save progress and return later</em></p>
            </div>
            
            <div style="background: #e8f4fd; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="color: #1565c0; margin-top: 0;">🆘 Need Help?</h3>
                <p style="margin-bottom: 0;">If you're experiencing any difficulties or have questions about the survey, please don't hesitate to reach out to our support team. We're here to help!</p>
            </div>
            
            <p>We truly appreciate your time and participation. Your voice matters, and we look forward to receiving your valuable insights.</p>
            
            <p style="font-weight: bold; color: #667eea;">Thank you for being part of the Saurara community! 🌟</p>
        </div>
        
        <div class="footer">
            <p style="margin: 0; text-align: center; color: #666; font-size: 14px;">
                <strong>Best regards,<br>The Saurara Research Team</strong>
            </p>
            <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 15px 0;">
            <p style="margin: 0; text-align: center; color: #888; font-size: 12px;">
                <span class="reminder-tag">REMINDER</span><br><br>
                This is an automated reminder. If you have already completed the survey, please disregard this message.<br>
                <a href="http://www.saurara.org" style="color: #667eea;">www.saurara.org</a> | 
                <a href="mailto:support@saurara.org" style="color: #667eea;">support@saurara.org</a>
            </p>
        </div>
    </div>
</body>
</html>`;

        return {
            text: textContent,
            html: htmlContent,
            subject: "🔔 Reminder: Complete Your Saurara Survey"
        };
    };

    // Generate welcome email preview content
    const generateWelcomeEmailPreview = async (user) => {
        if (!user) return { text: '', html: '', subject: '' };

        try {
            const response = await fetch('/api/generate-welcome-email-preview', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    username: user.username,
                    email: user.email,
                    password: '********', // Placeholder password for preview
                    firstname: user.name.split(' ')[0],
                    survey_code: user.survey_code
                }),
            });

            const result = await response.json();

            if (response.ok) {
                return {
                    text: result.preview.text,
                    html: result.preview.html,
                    subject: result.preview.subject
                };
            } else {
                console.error('Failed to generate welcome email preview:', result.error);
                return { text: 'Failed to generate preview', html: 'Failed to generate preview', subject: 'Welcome Email Preview' };
            }
        } catch (error) {
            console.error('Error generating welcome email preview:', error);
            return { text: 'Error generating preview', html: 'Error generating preview', subject: 'Welcome Email Preview' };
        }
    };

    // Add bulk reminder functionality
    const handleSendBulkReminders = async () => {
        setReminderStatus({ sending: true, results: null });
        
        try {
            const usersToSend = selectedUsers.map(userId => {
                const user = data.users.find(u => u.id === userId);
                const pendingUser = pendingUsers.find(p => p.id === userId);
                const surveyCode = pendingUser?.survey_code || user?.survey_code || 'N/A';
                
                return {
                    to_email: user?.email,
                    username: user?.username,
                    survey_code: surveyCode,
                    firstname: user?.name?.split(' ')[0],
                    organization_name: user?.company_name,
                    days_remaining: pendingUser?.days_since_creation ? Math.max(30 - pendingUser.days_since_creation, 0) : null
                };
            }).filter(user => user.to_email); // Filter out invalid users

            const response = await fetch('/api/send-bulk-reminder-emails', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    users: usersToSend
                }),
            });

            const result = await response.json();

            if (response.ok) {
                // Update reminder counts for successful sends
                const updatedData = { ...data };
                result.results.results.forEach(userResult => {
                    if (userResult.success) {
                        const userToUpdate = updatedData.users.find(u => u.email === userResult.email);
                        if (userToUpdate) {
                            userToUpdate.reminder = (userToUpdate.reminder || 0) + 1;
                        }
                    }
                });
                setData(updatedData);

                setReminderStatus({ 
                    sending: false, 
                    results: { 
                        success: true, 
                        message: `Bulk reminders processed: ${result.results.successful_sends} successful, ${result.results.failed_sends} failed`,
                        bulkResults: result.results,
                        successRate: result.success_rate
                    } 
                });
                setShowReminderResults(true);
            } else {
                setReminderStatus({ 
                    sending: false, 
                    results: { 
                        success: false, 
                        message: result.error || 'Failed to send bulk reminder emails' 
                    } 
                });
            }
        } catch (error) {
            console.error('Error sending bulk reminders:', error);
            setReminderStatus({ 
                sending: false, 
                results: { 
                    success: false, 
                    message: `Error sending bulk reminders: ${error.message}` 
                } 
            });
        } finally {
            setBulkReminderDialog(false);
            setSelectedUsers([]);
            setShowEmailPreview(false);
        }
    };

    const handleSelectUser = (userId) => {
        setSelectedUsers(prev => 
            prev.includes(userId) 
                ? prev.filter(id => id !== userId)
                : [...prev, userId]
        );
    };

    const handleSelectAllUsers = () => {
        const filteredUserIds = data.users
            .filter(user => {
                const organizationMatch = !filters.organization || user.company_name === filters.organization;
                const userMatch = !filters.users || user.name.toLowerCase().includes(filters.users.toLowerCase());
                const statusMatch = !filters.status || user.status === filters.status;
                return organizationMatch && userMatch && statusMatch && user.status === 'Not-Filled'; // Only select users who haven't filled
            })
            .map(user => user.id);
        
        setSelectedUsers(prev => 
            prev.length === filteredUserIds.length ? [] : filteredUserIds
        );
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

    // Survey Response Date Handling Functions
    const handleResponseDateClick = (user) => {
        // Create a response object to work with existing dialog
        const responseObj = {
            id: user.response_id,
            user_id: user.id,
            survey_code: user.survey_code,
            status: user.response_status || 'pending',
            start_date: user.start_date,
            end_date: user.end_date,
            // Include user information for context
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
                // First, get available templates to use the first one
                const templatesResponse = await fetch('/api/templates');
                const templatesData = await templatesResponse.json();
                
                if (templatesData.length === 0) {
                    alert('No survey templates found. Please create a survey template first.');
                    return;
                }
                
                // Use the first available template
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
                console.log('Survey response dates updated successfully:', updatedResponse);
                
                // Update local user data state
                setData(prevData => ({
                    ...prevData,
                    users: prevData.users.map(user => 
                        user.id === selectedResponse.user_id 
                            ? { 
                                ...user, 
                                response_id: updatedResponse.id || selectedResponse.id,
                                start_date: updatedResponse.start_date, 
                                end_date: updatedResponse.end_date,
                                response_status: updatedResponse.status || selectedResponse.status
                              }
                            : user
                    )
                }));
                
                // Also update survey responses state
                setSurveyResponses(prev => {
                    if (selectedResponse.id) {
                        // Update existing
                        return prev.map(resp => 
                            resp.id === selectedResponse.id 
                                ? { ...resp, start_date: updatedResponse.start_date, end_date: updatedResponse.end_date }
                                : resp
                        );
                    } else {
                        // Add new response
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

    const formatDateForDisplay = (dateString) => {
        if (!dateString) return 'Not set';
        const date = new Date(dateString);
        return date.toLocaleDateString();
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
                            <Button
                                variant="contained"
                                startIcon={<SendIcon />}
                                sx={{ 
                                    backgroundColor: '#f57c00',
                                    '&:hover': { backgroundColor: '#e65100' },
                                    px: 3,
                                    py: 1.5
                                }}
                                onClick={() => setBulkReminderDialog(true)}
                                disabled={selectedUsers.length === 0}
                            >
                                Send Bulk Reminders ({selectedUsers.length})
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
                                            <TableCell sx={{ borderRight: `1px solid ${adminColors.borderColor}`, width: '50px' }}>
                                                <Checkbox
                                                    checked={selectedUsers.length > 0}
                                                    indeterminate={selectedUsers.length > 0 && selectedUsers.length < data.users.filter(user => {
                                                        const organizationMatch = !filters.organization || user.company_name === filters.organization;
                                                        const userMatch = !filters.users || user.name.toLowerCase().includes(filters.users.toLowerCase());
                                                        const statusMatch = !filters.status || user.status === filters.status;
                                                        return organizationMatch && userMatch && statusMatch && user.status === 'Not-Filled';
                                                    }).length}
                                                    onChange={handleSelectAllUsers}
                                                    sx={{ color: adminColors.primary }}
                                                />
                                            </TableCell>
                                            <TableCell sx={{ borderRight: `1px solid ${adminColors.borderColor}` }}>Organization</TableCell>
                                            <TableCell sx={{ borderRight: `1px solid ${adminColors.borderColor}` }}>Users</TableCell>
                                            <TableCell sx={{ borderRight: `1px solid ${adminColors.borderColor}` }}>Status</TableCell>
                                            <TableCell sx={{ borderRight: `1px solid ${adminColors.borderColor}` }}>Days Since Created</TableCell>
                                            <TableCell sx={{ borderRight: `1px solid ${adminColors.borderColor}` }}>Survey Progress</TableCell>
                                            <TableCell sx={{ borderRight: `1px solid ${adminColors.borderColor}` }}>Reminders Sent</TableCell>
                                            <TableCell sx={{ borderRight: `1px solid ${adminColors.borderColor}` }}>Start Date</TableCell>
                                            <TableCell sx={{ borderRight: `1px solid ${adminColors.borderColor}` }}>End Date</TableCell>
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
                                            .map((user) => {
                                                const pendingUser = pendingUsers.find(p => p.id === user.id);
                                                const daysSinceCreated = pendingUser?.days_since_creation || 0;
                                                const hasStartedSurvey = pendingUser?.has_started_survey || false;
                                                const isSelectable = user.status === 'Not-Filled';
                                                
                                                return (
                                                    <TableRow key={user.id} sx={{ 
                                                        height: '30px', 
                                                        '& td': { padding: '4px', height: 'auto' },
                                                        backgroundColor: selectedUsers.includes(user.id) ? adminColors.highlightBg : 'inherit'
                                                    }}>
                                                        <TableCell sx={{ borderRight: `1px solid ${adminColors.borderColor}` }}>
                                                            <Checkbox
                                                                checked={selectedUsers.includes(user.id)}
                                                                onChange={() => handleSelectUser(user.id)}
                                                                disabled={!isSelectable}
                                                                sx={{ color: adminColors.primary }}
                                                            />
                                                        </TableCell>
                                                        <TableCell sx={{ borderRight: `1px solid ${adminColors.borderColor}` }}>
                                                            {user.company_name || 'No Organization'}
                                                        </TableCell>
                                                        <TableCell sx={{ borderRight: `1px solid ${adminColors.borderColor}` }}>
                                                            <Box>
                                                                <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                                                    {user.name}
                                                                </Typography>
                                                                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                                                    {user.email}
                                                                </Typography>
                                                            </Box>
                                                        </TableCell>
                                                        <TableCell 
                                                            sx={{ 
                                                                borderRight: `1px solid ${adminColors.borderColor}`,
                                                                color: user.status === 'Filled' ? adminColors.filledColor : adminColors.notFilledColor,
                                                                fontWeight: 'bold'
                                                            }}
                                                        >
                                                            <Chip 
                                                                label={user.status}
                                                                size="small"
                                                                color={user.status === 'Filled' ? 'success' : 'warning'}
                                                                variant="outlined"
                                                            />
                                                        </TableCell>
                                                        <TableCell sx={{ borderRight: `1px solid ${adminColors.borderColor}` }}>
                                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                                <Typography variant="body2">
                                                                    {daysSinceCreated} days
                                                                </Typography>
                                                                {daysSinceCreated > 14 && (
                                                                    <Chip 
                                                                        label="Overdue" 
                                                                        size="small" 
                                                                        color="error" 
                                                                        variant="outlined"
                                                                    />
                                                                )}
                                                            </Box>
                                                        </TableCell>
                                                        <TableCell sx={{ borderRight: `1px solid ${adminColors.borderColor}` }}>
                                                            {hasStartedSurvey ? (
                                                                <Chip 
                                                                    label={`Page ${pendingUser?.last_page || 1}`}
                                                                    size="small"
                                                                    color="info"
                                                                    variant="outlined"
                                                                />
                                                            ) : (
                                                                <Chip 
                                                                    label="Not Started"
                                                                    size="small"
                                                                    color="default"
                                                                    variant="outlined"
                                                                />
                                                            )}
                                                        </TableCell>
                                                        <TableCell sx={{ borderRight: `1px solid ${adminColors.borderColor}` }}>
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
                                                        </TableCell>
                                                        <TableCell sx={{ borderRight: `1px solid ${adminColors.borderColor}` }}>
                                                            <Typography 
                                                                variant="body2" 
                                                                sx={{ 
                                                                    cursor: 'pointer',
                                                                    color: user.start_date ? adminColors.primary : 'text.secondary',
                                                                    textDecoration: 'underline',
                                                                    '&:hover': { color: adminColors.secondary }
                                                                }}
                                                                onClick={() => handleResponseDateClick(user)}
                                                            >
                                                                {user.start_date ? formatDateForDisplay(user.start_date) : 'Set Date'}
                                                            </Typography>
                                                        </TableCell>
                                                        <TableCell sx={{ borderRight: `1px solid ${adminColors.borderColor}` }}>
                                                            <Typography 
                                                                variant="body2" 
                                                                sx={{ 
                                                                    cursor: 'pointer',
                                                                    color: user.end_date ? adminColors.primary : 'text.secondary',
                                                                    textDecoration: 'underline',
                                                                    '&:hover': { color: adminColors.secondary }
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
                                                                    sx={{ color: adminColors.primary }}
                                                                    onClick={() => handleOpenReminderDialog(user.id)}
                                                                    disabled={user.status === 'Filled'}
                                                                >
                                                                    <EmailIcon />
                                                                </IconButton>
                                                                <IconButton
                                                                    title="Preview Welcome Email"
                                                                    sx={{ color: '#10b981' }}
                                                                    onClick={() => handleOpenWelcomeEmailPreview(user)}
                                                                >
                                                                    <PreviewIcon />
                                                                </IconButton>
                                                            </Box>
                                                        </TableCell>
                                                    </TableRow>
                                                );
                                            })}
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

            {/* Individual Reminder Dialog */}
            <Dialog open={openReminderDialog} onClose={handleCloseReminderDialog} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <EmailIcon />
                    Send Survey Reminder
                </DialogTitle>
                <DialogContent>
                    <DialogContentText sx={{ mb: 2 }}>
                        Send a professional reminder email to <strong>{selectedRecipient?.name}</strong> about their pending survey.
                    </DialogContentText>
                    
                    {selectedRecipient && (
                        <Box sx={{ mb: 2, p: 2, bgcolor: adminColors.highlightBg, borderRadius: 1 }}>
                            <Typography variant="body2"><strong>User:</strong> {selectedRecipient.name}</Typography>
                            <Typography variant="body2"><strong>Email:</strong> {selectedRecipient.email}</Typography>
                            <Typography variant="body2"><strong>Organization:</strong> {selectedRecipient.company_name || 'No Organization'}</Typography>
                            <Typography variant="body2"><strong>Status:</strong> {selectedRecipient.status}</Typography>
                        </Box>
                    )}

                    {reminderStatus.sending && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                            <CircularProgress size={20} />
                            <Typography>Sending reminder email...</Typography>
                        </Box>
                    )}

                    {reminderStatus.results && (
                        <Alert 
                            severity={reminderStatus.results.success ? 'success' : 'error'} 
                            sx={{ mb: 2 }}
                        >
                            {reminderStatus.results.message}
                            {reminderStatus.results.method && (
                                <Typography variant="caption" sx={{ display: 'block', mt: 1 }}>
                                    Sent via: {reminderStatus.results.method}
                                </Typography>
                            )}
                        </Alert>
                    )}

                    {/* Email Preview Section */}
                    <Box sx={{ mt: 3 }}>
                        <Button
                            variant="outlined"
                            startIcon={<PreviewIcon />}
                            endIcon={showEmailPreview ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                            onClick={() => setShowEmailPreview(!showEmailPreview)}
                            sx={{ mb: 2 }}
                        >
                            {showEmailPreview ? 'Hide Email Preview' : 'Preview Email Content'}
                        </Button>

                        {showEmailPreview && selectedRecipient && (
                            <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 1, overflow: 'hidden' }}>
                                {/* Email Preview Header */}
                                <Box sx={{ bgcolor: adminColors.headerBg, p: 2, borderBottom: 1, borderColor: 'divider' }}>
                                    <Typography variant="h6" sx={{ mb: 1 }}>
                                        📧 Email Preview
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

                                {/* Email Content Preview */}
                                <Box sx={{ p: 2 }}>
                                    {(() => {
                                        const pendingUser = pendingUsers.find(p => p.id === selectedRecipient.id);
                                        const emailContent = generateEmailPreview(selectedRecipient, pendingUser);
                                        
                                        return (
                                            <Box>
                                                {/* Subject Line */}
                                                <Box sx={{ mb: 2, p: 1, bgcolor: '#f5f5f5', borderRadius: 1 }}>
                                                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                                        Subject: {emailContent.subject}
                                                    </Typography>
                                                    <Typography variant="body2" color="text.secondary">
                                                        To: {selectedRecipient.email}
                                                    </Typography>
                                                </Box>

                                                {/* Email Body */}
                                                {emailPreviewType === 'text' ? (
                                                    <Box sx={{ 
                                                        bgcolor: '#fafafa', 
                                                        p: 2, 
                                                        borderRadius: 1, 
                                                        maxHeight: 400, 
                                                        overflow: 'auto',
                                                        fontFamily: 'monospace',
                                                        fontSize: '0.875rem',
                                                        whiteSpace: 'pre-wrap'
                                                    }}>
                                                        {emailContent.text}
                                                    </Box>
                                                ) : (
                                                    <Box sx={{ 
                                                        border: 1, 
                                                        borderColor: 'divider', 
                                                        borderRadius: 1, 
                                                        maxHeight: 400, 
                                                        overflow: 'auto'
                                                    }}>
                                                        <iframe
                                                            srcDoc={emailContent.html}
                                                            style={{
                                                                width: '100%',
                                                                height: '400px',
                                                                border: 'none',
                                                                borderRadius: '4px'
                                                            }}
                                                            title="Email HTML Preview"
                                                        />
                                                    </Box>
                                                )}
                                            </Box>
                                        );
                                    })()}
                                </Box>
                            </Box>
                        )}
                    </Box>

                    <Typography variant="body2" sx={{ color: 'text.secondary', fontStyle: 'italic', mt: 2 }}>
                        This professional email will be sent automatically using our email delivery system.
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseReminderDialog}>
                        {reminderStatus.results ? 'Close' : 'Cancel'}
                    </Button>
                    {!reminderStatus.results && (
                        <Button 
                            onClick={handleSendReminder} 
                            variant="contained" 
                            color="primary"
                            disabled={reminderStatus.sending}
                            startIcon={reminderStatus.sending ? <CircularProgress size={16} /> : <EmailIcon />}
                        >
                            {reminderStatus.sending ? 'Sending...' : 'Send Reminder Email'}
                        </Button>
                    )}
                </DialogActions>
            </Dialog>

            {/* Bulk Reminder Dialog */}
            <Dialog open={bulkReminderDialog} onClose={() => setBulkReminderDialog(false)} maxWidth="md" fullWidth>
                <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <SendIcon />
                    Send Bulk Reminder Emails
                </DialogTitle>
                <DialogContent>
                    <DialogContentText sx={{ mb: 2 }}>
                        Send reminder emails to {selectedUsers.length} selected users who haven't completed their surveys.
                    </DialogContentText>
                    
                    <Box sx={{ mb: 2 }}>
                        <Typography variant="h6" sx={{ mb: 1 }}>Selected Users:</Typography>
                        <Box sx={{ maxHeight: 200, overflow: 'auto', border: 1, borderColor: 'divider', borderRadius: 1, p: 1 }}>
                            {selectedUsers.map(userId => {
                                const user = data.users.find(u => u.id === userId);
                                return user ? (
                                    <Box key={userId} sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                                        <Typography variant="body2">{user.name}</Typography>
                                        <Typography variant="body2" color="text.secondary">{user.email}</Typography>
                                    </Box>
                                ) : null;
                            })}
                        </Box>
                    </Box>

                    {reminderStatus.sending && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                            <CircularProgress size={20} />
                            <Typography>Sending bulk reminder emails...</Typography>
                        </Box>
                    )}

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
                                <Box sx={{ bgcolor: adminColors.headerBg, p: 2, borderBottom: 1, borderColor: 'divider' }}>
                                    <Typography variant="subtitle1" sx={{ mb: 1 }}>
                                        📧 Sample Email Preview
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
                                    {(() => {
                                        // Use the first selected user as sample
                                        const sampleUser = data.users.find(u => u.id === selectedUsers[0]);
                                        const samplePendingUser = pendingUsers.find(p => p.id === selectedUsers[0]);
                                        const emailContent = generateEmailPreview(sampleUser, samplePendingUser);
                                        
                                        return (
                                            <Box>
                                                <Box sx={{ mb: 2, p: 1, bgcolor: '#f5f5f5', borderRadius: 1 }}>
                                                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                                        Subject: {emailContent.subject}
                                                    </Typography>
                                                    <Typography variant="body2" color="text.secondary">
                                                        Sample for: {sampleUser?.name} ({sampleUser?.email})
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
                                                        {emailContent.text}
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
                                                            srcDoc={emailContent.html}
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
                                        );
                                    })()}
                                </Box>
                            </Box>
                        )}
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setBulkReminderDialog(false)}>Cancel</Button>
                    <Button 
                        onClick={handleSendBulkReminders} 
                        variant="contained" 
                        color="primary"
                        disabled={reminderStatus.sending || selectedUsers.length === 0}
                        startIcon={reminderStatus.sending ? <CircularProgress size={16} /> : <SendIcon />}
                    >
                        {reminderStatus.sending ? 'Sending...' : `Send to ${selectedUsers.length} Users`}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Bulk Reminder Results Dialog */}
            <Dialog open={showReminderResults} onClose={() => setShowReminderResults(false)} maxWidth="md" fullWidth>
                <DialogTitle>Bulk Reminder Results</DialogTitle>
                <DialogContent>
                    {reminderStatus.results?.bulkResults && (
                        <Box>
                            <Alert 
                                severity={reminderStatus.results.success ? 'success' : 'error'} 
                                sx={{ mb: 2 }}
                            >
                                {reminderStatus.results.message}
                                <Typography variant="body2" sx={{ mt: 1 }}>
                                    Success Rate: {reminderStatus.results.successRate}%
                                </Typography>
                            </Alert>

                            <Typography variant="h6" sx={{ mb: 2 }}>Detailed Results:</Typography>
                            <Box sx={{ maxHeight: 300, overflow: 'auto' }}>
                                {reminderStatus.results.bulkResults.results.map((result, index) => (
                                    <Box 
                                        key={index} 
                                        sx={{ 
                                            display: 'flex', 
                                            justifyContent: 'space-between', 
                                            alignItems: 'center',
                                            py: 1, 
                                            px: 2,
                                            mb: 1,
                                            bgcolor: result.success ? '#e8f5e8' : '#ffebee',
                                            borderRadius: 1
                                        }}
                                    >
                                        <Box>
                                            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                                {result.user}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                {result.email}
                                            </Typography>
                                        </Box>
                                        <Box sx={{ textAlign: 'right' }}>
                                            <Chip 
                                                label={result.success ? 'Sent' : 'Failed'}
                                                size="small"
                                                color={result.success ? 'success' : 'error'}
                                                variant="outlined"
                                            />
                                            {result.method && (
                                                <Typography variant="caption" sx={{ display: 'block', mt: 0.5 }}>
                                                    via {result.method}
                                                </Typography>
                                            )}
                                            {result.error && (
                                                <Typography variant="caption" color="error" sx={{ display: 'block', mt: 0.5 }}>
                                                    {result.error}
                                                </Typography>
                                            )}
                                        </Box>
                                    </Box>
                                ))}
                            </Box>
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setShowReminderResults(false)} variant="contained">Close</Button>
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

            {/* Survey Response Date Edit Dialog */}
            <Dialog open={dateEditDialog} onClose={handleCloseDateEditDialog} maxWidth="sm" fullWidth>
                <DialogTitle>Edit Survey Dates</DialogTitle>
                <DialogContent>
                    <DialogContentText sx={{ mb: 2 }}>
                        Set or update the start and end dates for the survey.
                    </DialogContentText>
                    
                    {selectedResponse && (
                        <Box sx={{ mb: 2, p: 2, bgcolor: adminColors.highlightBg, borderRadius: 1 }}>
                            <Typography variant="body2"><strong>User:</strong> {selectedResponse.user_name}</Typography>
                            <Typography variant="body2"><strong>Email:</strong> {selectedResponse.user_email}</Typography>
                            <Typography variant="body2"><strong>Survey Code:</strong> {selectedResponse.survey_code}</Typography>
                            {selectedResponse.id && (
                                <Typography variant="body2"><strong>Response ID:</strong> {selectedResponse.id}</Typography>
                            )}
                            <Typography variant="body2"><strong>Status:</strong> {selectedResponse.status}</Typography>
                        </Box>
                    )}

                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
                        <TextField
                            label="Start Date"
                            type="date"
                            value={editDates.start_date}
                            onChange={(e) => handleDateFieldChange('start_date', e.target.value)}
                            InputLabelProps={{
                                shrink: true,
                            }}
                            fullWidth
                            helperText="Leave empty to clear the date"
                        />
                        <TextField
                            label="End Date"
                            type="date"
                            value={editDates.end_date}
                            onChange={(e) => handleDateFieldChange('end_date', e.target.value)}
                            InputLabelProps={{
                                shrink: true,
                            }}
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
                        color="primary"
                        sx={{ 
                            bgcolor: adminColors.primary,
                            '&:hover': { bgcolor: adminColors.secondary }
                        }}
                    >
                        Save Dates
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Welcome Email Preview Dialog */}
            <Dialog open={showWelcomeEmailPreview} onClose={handleCloseWelcomeEmailPreview} maxWidth="md" fullWidth>
                <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <EmailIcon />
                    Welcome Email Preview
                </DialogTitle>
                <DialogContent>
                    <DialogContentText sx={{ mb: 2 }}>
                        Preview the welcome email that will be sent to new users.
                    </DialogContentText>
                    
                    {welcomeEmailPreviewUser && (
                        <Box sx={{ mb: 2, p: 2, bgcolor: adminColors.highlightBg, borderRadius: 1 }}>
                            <Typography variant="body2"><strong>User:</strong> {welcomeEmailPreviewUser.name}</Typography>
                            <Typography variant="body2"><strong>Email:</strong> {welcomeEmailPreviewUser.email}</Typography>
                            <Typography variant="body2"><strong>Username:</strong> {welcomeEmailPreviewUser.username}</Typography>
                            <Typography variant="body2"><strong>Survey Code:</strong> {welcomeEmailPreviewUser.survey_code}</Typography>
                        </Box>
                    )}

                    <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 1, overflow: 'hidden' }}>
                        {/* Email Preview Header */}
                        <Box sx={{ bgcolor: adminColors.headerBg, p: 2, borderBottom: 1, borderColor: 'divider' }}>
                            <Typography variant="h6" sx={{ mb: 1 }}>
                                📧 Welcome Email Preview
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                This shows what the welcome email will look like
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 1 }}>
                                <Button
                                    size="small"
                                    variant={welcomeEmailPreviewType === 'text' ? 'contained' : 'outlined'}
                                    onClick={() => setWelcomeEmailPreviewType('text')}
                                >
                                    Text Version
                                </Button>
                                <Button
                                    size="small"
                                    variant={welcomeEmailPreviewType === 'html' ? 'contained' : 'outlined'}
                                    onClick={() => setWelcomeEmailPreviewType('html')}
                                >
                                    HTML Version
                                </Button>
                            </Box>
                        </Box>

                        {/* Email Content Preview */}
                        <Box sx={{ p: 2 }}>
                            {welcomeEmailPreviewUser && (
                                <WelcomeEmailPreviewContent 
                                    user={welcomeEmailPreviewUser}
                                    previewType={welcomeEmailPreviewType}
                                    generateWelcomeEmailPreview={generateWelcomeEmailPreview}
                                />
                            )}
                        </Box>
                    </Box>

                    <Typography variant="body2" sx={{ color: 'text.secondary', fontStyle: 'italic', mt: 2 }}>
                        This professional email will be sent automatically when new users are created.
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseWelcomeEmailPreview} variant="contained">
                        Close
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
}

// Welcome Email Preview Component
function WelcomeEmailPreviewContent({ user, previewType, generateWelcomeEmailPreview }) {
    const [emailContent, setEmailContent] = useState({ text: '', html: '', subject: '' });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadPreview = async () => {
            if (user) {
                setLoading(true);
                const content = await generateWelcomeEmailPreview(user);
                setEmailContent(content);
                setLoading(false);
            }
        };
        loadPreview();
    }, [user, generateWelcomeEmailPreview]);

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box>
            {/* Subject Line */}
            <Box sx={{ mb: 2, p: 1, bgcolor: '#f5f5f5', borderRadius: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                    Subject: {emailContent.subject}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    To: {user.email}
                </Typography>
            </Box>

            {/* Email Body */}
            {previewType === 'text' ? (
                <Box sx={{ 
                    bgcolor: '#fafafa', 
                    p: 2, 
                    borderRadius: 1, 
                    maxHeight: 400, 
                    overflow: 'auto',
                    fontFamily: 'monospace',
                    fontSize: '0.875rem',
                    whiteSpace: 'pre-wrap'
                }}>
                    {emailContent.text}
                </Box>
            ) : (
                <Box sx={{ 
                    border: 1, 
                    borderColor: 'divider', 
                    borderRadius: 1, 
                    maxHeight: 400, 
                    overflow: 'auto'
                }}>
                    <iframe
                        srcDoc={emailContent.html}
                        style={{
                            width: '100%',
                            height: '400px',
                            border: 'none',
                            borderRadius: '4px'
                        }}
                        title="Welcome Email HTML Preview"
                    />
                </Box>
            )}
        </Box>
    );
}

export default AdminDashboard; 