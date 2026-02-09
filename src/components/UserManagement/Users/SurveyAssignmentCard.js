import React, { useState, useEffect } from 'react';
import {
    Card, CardContent, Typography, Box, Button, Grid,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Checkbox, Alert, CircularProgress, Dialog, DialogTitle, DialogContent,
    DialogActions, FormControl, InputLabel, Select, MenuItem, Chip,
    Paper, Divider, Accordion, AccordionSummary, AccordionDetails, Collapse,
    IconButton, Tooltip
} from '@mui/material';
import {
    Send as SendIcon,
    Assignment as AssignmentIcon,
    Email as EmailIcon,
    ExpandMore as ExpandMoreIcon,
    CheckCircle as CheckCircleIcon,
    People as PeopleIcon,
    Quiz as QuizIcon,
    KeyboardArrowDown as KeyboardArrowDownIcon,
    KeyboardArrowUp as KeyboardArrowUpIcon,
    Delete as DeleteIcon,
    Warning as WarningIcon
} from '@mui/icons-material';
import SurveyAssignmentService from '../../../services/Admin/SurveyAssignment/SurveyAssignmentService';

const SurveyAssignmentCard = ({ users, onRefreshUsers, selectedUserForView: externalSelectedUser, onUserDeselect }) => {
    // State management
    const [templates, setTemplates] = useState([]);
    const [selectedUsers, setSelectedUsers] = useState([]);
    const [selectedTemplate, setSelectedTemplate] = useState('');
    const [loading, setLoading] = useState(false);
    const [assignmentResults, setAssignmentResults] = useState(null);
    const [showResultDialog, setShowResultDialog] = useState(false);
    const [alerts, setAlerts] = useState([]);
    const [expanded, setExpanded] = useState(false);

    // Filter states
    const [organizationFilter, setOrganizationFilter] = useState('');
    const [roleFilter, setRoleFilter] = useState('');
    const [organizations, setOrganizations] = useState([]);

    // Single user selection for viewing assignments
    const [selectedUserForView, setSelectedUserForView] = useState(null);
    const [userAssignments, setUserAssignments] = useState([]);
    const [loadingAssignments, setLoadingAssignments] = useState(false);

    // Assignment removal states
    const [showRemoveDialog, setShowRemoveDialog] = useState(false);
    const [assignmentToRemove, setAssignmentToRemove] = useState(null);
    const [removingAssignment, setRemovingAssignment] = useState(false);

    // Load initial data
    useEffect(() => {
        loadTemplates();
        loadOrganizations();
    }, []);

    // Sync with external user selection
    useEffect(() => {
        if (externalSelectedUser) {
            setSelectedUserForView(externalSelectedUser);
            setExpanded(true);
            loadUserAssignments(externalSelectedUser.id);
        }
    }, [externalSelectedUser]);

    const showAlert = (message, severity = 'info') => {
        const alert = { id: Date.now(), message, severity };
        setAlerts(prev => [...prev, alert]);
        setTimeout(() => {
            setAlerts(prev => prev.filter(a => a.id !== alert.id));
        }, 5000);
    };

    const loadTemplates = async () => {
        try {
            const templateData = await SurveyAssignmentService.getSurveyTemplates();
            setTemplates(templateData);
        } catch (error) {
            console.error('Error loading templates:', error);
            showAlert('Error loading survey templates', 'error');
        }
    };

    const loadOrganizations = async () => {
        try {
            const orgData = await SurveyAssignmentService.getOrganizations();
            setOrganizations(orgData);
        } catch (error) {
            console.error('Error loading organizations:', error);
            showAlert('Error loading organizations', 'error');
        }
    };

    const loadUserAssignments = async (userId) => {
        setLoadingAssignments(true);
        try {
            console.log('Loading assignments for user:', userId);
            const assignments = await SurveyAssignmentService.getUserSurveyAssignments(userId);
            console.log('Assignment response:', assignments);
            setUserAssignments(assignments.assignments || []);
            console.log(`Loaded ${assignments.assignments?.length || 0} assignments for user ${userId}`);
        } catch (error) {
            console.error('Error loading user assignments:', error);
            showAlert(`Error loading user assignments: ${error.message}`, 'error');
            setUserAssignments([]);
        } finally {
            setLoadingAssignments(false);
        }
    };

    const handleUserSelectionForView = (user) => {
        if (selectedUserForView && selectedUserForView.id === user.id) {
            // Deselect if clicking the same user
            setSelectedUserForView(null);
            setUserAssignments([]);
        } else {
            // Select new user and load their assignments
            setSelectedUserForView(user);
            loadUserAssignments(user.id);
            // Clear bulk selection when viewing single user
            setSelectedUsers([]);
        }
    };

    const handleUserSelection = (userId) => {
        setSelectedUsers(prev => {
            if (prev.includes(userId)) {
                return prev.filter(id => id !== userId);
            } else {
                return [...prev, userId];
            }
        });
    };

    const handleSelectAll = () => {
        const filteredUserIds = getFilteredUsers().map(user => user.id);
        if (selectedUsers.length === filteredUserIds.length) {
            setSelectedUsers([]);
        } else {
            setSelectedUsers(filteredUserIds);
        }
    };

    const getFilteredUsers = () => {
        return users.filter(user => {
            const matchesOrg = !organizationFilter || user.organization_id === parseInt(organizationFilter);
            const matchesRole = !roleFilter || user.ui_role === roleFilter;
            return matchesOrg && matchesRole;
        });
    };

    const assignSurvey = async (userIds = null) => {
        const usersToAssign = userIds || selectedUsers;

        if (usersToAssign.length === 0) {
            showAlert('Please select at least one user', 'warning');
            return;
        }
        if (!selectedTemplate) {
            showAlert('Please select a survey template', 'warning');
            return;
        }

        setLoading(true);
        try {
            const adminId = localStorage.getItem('userId');
            const result = await SurveyAssignmentService.assignSurvey(
                usersToAssign,
                selectedTemplate,
                adminId
            );

            setAssignmentResults(result);
            setShowResultDialog(true);
            setSelectedUsers([]);
            setSelectedTemplate('');
            showAlert(result.message, 'success');

            // If single user assignment, refresh their assignments
            if (selectedUserForView && userIds) {
                loadUserAssignments(selectedUserForView.id);
            }

            // Refresh users list if callback provided
            if (onRefreshUsers) {
                onRefreshUsers();
            }
        } catch (error) {
            console.error('Error assigning survey:', error);
            showAlert(`Assignment failed: ${error.message}`, 'error');
        } finally {
            setLoading(false);
        }
    };

    const getSelectedUsersInfo = () => {
        return users.filter(user => selectedUsers.includes(user.id));
    };

    const getOrganizationName = (orgId) => {
        const org = organizations.find(o => o.id === orgId);
        return org ? org.name : 'Unknown';
    };

    const getTemplateName = (templateId) => {
        const template = templates.find(t => t.id === parseInt(templateId));
        if (!template) return 'Unknown';
        const versionPart = template.version_name || 'Survey';
        const codePart = template.survey_code ? ` - ${template.survey_code}` : '';
        return `${versionPart}${codePart}`;
    };

    const getAvailableTemplatesForUser = () => {
        if (!selectedUserForView || !userAssignments) return templates;

        const assignedTemplateIds = userAssignments.map(assignment => assignment.template_id);
        return templates.filter(template => !assignedTemplateIds.includes(template.id));
    };

    const testDatabaseConnection = async () => {
        try {
            const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}/test/survey-assignments`);
            const data = await response.json();
            console.log('Database test results:', data);
            showAlert(`Database test: ${data.total_assignments} assignments, ${data.total_users} users, ${data.total_templates} templates`, 'info');
        } catch (error) {
            console.error('Database test error:', error);
            showAlert(`Database test failed: ${error.message}`, 'error');
        }
    };

    const handleRemoveAssignment = (assignment) => {
        setAssignmentToRemove(assignment);
        setShowRemoveDialog(true);
    };

    const confirmRemoveAssignment = async () => {
        if (!assignmentToRemove || !selectedUserForView) return;

        setRemovingAssignment(true);
        try {
            const result = await SurveyAssignmentService.removeSurveyAssignment(
                selectedUserForView.id,
                assignmentToRemove.id
            );

            showAlert(result.message, 'success');

            // Refresh the user's assignments
            loadUserAssignments(selectedUserForView.id);

            // Refresh users list if callback provided
            if (onRefreshUsers) {
                onRefreshUsers();
            }
        } catch (error) {
            console.error('Error removing assignment:', error);
            showAlert(`Failed to remove assignment: ${error.message}`, 'error');
        } finally {
            setRemovingAssignment(false);
            setShowRemoveDialog(false);
            setAssignmentToRemove(null);
        }
    };

    const cancelRemoveAssignment = () => {
        setShowRemoveDialog(false);
        setAssignmentToRemove(null);
    };

    const filteredUsers = getFilteredUsers();
    const selectedUsersInfo = getSelectedUsersInfo();

    return (
        <>
            <Card sx={{ mt: 3, boxShadow: 3 }}>
                <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                        <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', color: '#633394' }}>
                            <QuizIcon sx={{ mr: 1 }} />
                            Survey Assignment
                        </Typography>
                        <Button
                            onClick={() => setExpanded(!expanded)}
                            endIcon={expanded ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
                            sx={{ color: '#633394' }}
                        >
                            {expanded ? 'Collapse' : 'Expand'}
                        </Button>
                    </Box>

                    {/* Alerts */}
                    {alerts.map((alert) => (
                        <Alert key={alert.id} severity={alert.severity} sx={{ mb: 2 }}>
                            {alert.message}
                        </Alert>
                    ))}

                    <Collapse in={expanded}>
                        <Grid container spacing={3}>
                            {/* Left Panel - User Selection */}
                            <Grid item xs={12} md={8}>
                                <Typography variant="subtitle1" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                                    <PeopleIcon sx={{ mr: 1 }} />
                                    Select Users ({selectedUsers.length} selected)
                                </Typography>

                                {/* Filters */}
                                <Grid container spacing={2} sx={{ mb: 2 }}>
                                    <Grid item xs={12} sm={6}>
                                        <FormControl fullWidth size="small">
                                            <InputLabel>Filter by Organization</InputLabel>
                                            <Select
                                                value={organizationFilter}
                                                onChange={(e) => setOrganizationFilter(e.target.value)}
                                                label="Filter by Organization"
                                            >
                                                <MenuItem value="">All Organizations</MenuItem>
                                                {organizations.map((org) => (
                                                    <MenuItem key={org.id} value={org.id}>
                                                        {org.name}
                                                    </MenuItem>
                                                ))}
                                            </Select>
                                        </FormControl>
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <FormControl fullWidth size="small">
                                            <InputLabel>Filter by Role</InputLabel>
                                            <Select
                                                value={roleFilter}
                                                onChange={(e) => setRoleFilter(e.target.value)}
                                                label="Filter by Role"
                                            >
                                                <MenuItem value="">All Roles</MenuItem>
                                                <MenuItem value="user">User</MenuItem>
                                                <MenuItem value="manager">Manager</MenuItem>
                                                <MenuItem value="primary_contact">Primary Contact</MenuItem>
                                                <MenuItem value="secondary_contact">Secondary Contact</MenuItem>
                                                <MenuItem value="head">Head</MenuItem>
                                            </Select>
                                        </FormControl>
                                    </Grid>
                                </Grid>

                                {/* Compact Users Table */}
                                <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 300 }}>
                                    <Table size="small" stickyHeader>
                                        <TableHead>
                                            <TableRow sx={{ backgroundColor: '#FAFAFA' }}>
                                                <TableCell padding="checkbox">
                                                    <Checkbox
                                                        indeterminate={selectedUsers.length > 0 && selectedUsers.length < filteredUsers.length}
                                                        checked={filteredUsers.length > 0 && selectedUsers.length === filteredUsers.length}
                                                        onChange={handleSelectAll}
                                                        sx={{ color: '#212121' }}
                                                    />
                                                </TableCell>
                                                <TableCell sx={{ color: '#212121', fontSize: '0.75rem' }}><strong>Name</strong></TableCell>
                                                <TableCell sx={{ color: '#212121', fontSize: '0.75rem' }}><strong>Email</strong></TableCell>
                                                <TableCell sx={{ color: '#212121', fontSize: '0.75rem' }}><strong>Role</strong></TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {filteredUsers.slice(0, 10).map((user) => ( // Limit to 10 for compact view
                                                <TableRow
                                                    key={user.id}
                                                    hover
                                                    sx={{
                                                        cursor: 'pointer',
                                                        backgroundColor: selectedUserForView && selectedUserForView.id === user.id
                                                            ? '#f3e5f5'
                                                            : selectedUsers.includes(user.id)
                                                                ? '#e3f2fd'
                                                                : 'inherit'
                                                    }}
                                                    onClick={() => handleUserSelectionForView(user)}
                                                >
                                                    <TableCell padding="checkbox">
                                                        <Checkbox
                                                            checked={selectedUsers.includes(user.id)}
                                                            onChange={() => handleUserSelection(user.id)}
                                                            onClick={(e) => e.stopPropagation()}
                                                        />
                                                    </TableCell>
                                                    <TableCell>
                                                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                            {user.firstname && user.lastname
                                                                ? `${user.firstname} ${user.lastname}`
                                                                : user.username}
                                                            {selectedUserForView && selectedUserForView.id === user.id && (
                                                                <Chip
                                                                    label="Viewing"
                                                                    size="small"
                                                                    color="primary"
                                                                    sx={{ ml: 1 }}
                                                                />
                                                            )}
                                                        </Box>
                                                    </TableCell>
                                                    <TableCell>{user.email}</TableCell>
                                                    <TableCell>
                                                        <Chip
                                                            label={user.ui_role}
                                                            size="small"
                                                            color={user.ui_role === 'manager' ? 'primary' : 'default'}
                                                        />
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </TableContainer>

                                {filteredUsers.length > 10 && (
                                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                        Showing first 10 of {filteredUsers.length} users. Use filters to narrow selection.
                                    </Typography>
                                )}

                                {filteredUsers.length === 0 && (
                                    <Box sx={{ textAlign: 'center', py: 2 }}>
                                        <Typography color="text.secondary">
                                            No users found matching the current filters
                                        </Typography>
                                    </Box>
                                )}

                                <Box sx={{ mt: 2, p: 1, backgroundColor: '#f5f5f5', borderRadius: 1 }}>
                                    <Typography variant="body2" color="text.secondary">
                                        <strong>How to use:</strong> Click checkbox to select users for bulk assignment.
                                        Double-click a user's row to view their existing assignments and assign new templates.
                                    </Typography>
                                    <Button
                                        size="small"
                                        onClick={testDatabaseConnection}
                                        sx={{ mt: 1, color: '#633394' }}
                                    >
                                        Test Database Connection
                                    </Button>
                                </Box>
                            </Grid>

                            {/* Right Panel - Survey Selection & Assignment */}
                            <Grid item xs={12} md={4}>
                                <Box sx={{ p: 2, border: '1px solid #e0e0e0', borderRadius: 1 }}>
                                    {selectedUserForView ? (
                                        // Single User View - Show existing assignments and available templates
                                        <>
                                            <Typography variant="subtitle1" sx={{ mb: 2 }}>
                                                {selectedUserForView.firstname && selectedUserForView.lastname
                                                    ? `${selectedUserForView.firstname} ${selectedUserForView.lastname}`
                                                    : selectedUserForView.username} - Survey Assignments
                                            </Typography>

                                            {/* User Info */}
                                            <Box sx={{ mb: 2, p: 1, backgroundColor: '#f5f5f5', borderRadius: 1 }}>
                                                <Typography variant="body2">
                                                    <strong>Email:</strong> {selectedUserForView.email}
                                                </Typography>
                                                <Typography variant="body2">
                                                    <strong>Role:</strong> {selectedUserForView.ui_role}
                                                </Typography>
                                                <Typography variant="body2">
                                                    <strong>Organization:</strong> {getOrganizationName(selectedUserForView.organization_id)}
                                                </Typography>
                                            </Box>

                                            {/* Existing Assignments */}
                                            <Typography variant="body1" sx={{ mb: 1, fontWeight: 'bold' }}>
                                                Existing Assignments:
                                            </Typography>
                                            {loadingAssignments ? (
                                                <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                                                    <CircularProgress size={20} />
                                                </Box>
                                            ) : userAssignments.length > 0 ? (
                                                <Box sx={{ mb: 2, maxHeight: 150, overflow: 'auto' }}>
                                                    {userAssignments.map((assignment) => (
                                                        <Box key={assignment.id} sx={{ mb: 1, p: 1, border: '1px solid #e0e0e0', borderRadius: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                                            <Box sx={{ flex: 1 }}>
                                                                <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                                                    {`${assignment.template_name}${assignment.survey_code ? ` - ${assignment.survey_code}` : ''}`}
                                                                </Typography>
                                                                <Typography variant="caption" color="text.secondary">
                                                                    Status: {assignment.status} | Assigned: {new Date(assignment.created_at).toLocaleDateString()}
                                                                </Typography>
                                                            </Box>
                                                            <Tooltip title="Remove Assignment">
                                                                <IconButton
                                                                    size="small"
                                                                    onClick={() => handleRemoveAssignment(assignment)}
                                                                    sx={{
                                                                        color: '#d32f2f',
                                                                        '&:hover': { backgroundColor: '#ffebee' }
                                                                    }}
                                                                >
                                                                    <DeleteIcon fontSize="small" />
                                                                </IconButton>
                                                            </Tooltip>
                                                        </Box>
                                                    ))}
                                                </Box>
                                            ) : (
                                                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                                    No existing assignments
                                                </Typography>
                                            )}

                                            {/* Available Templates for Assignment */}
                                            <Typography variant="body1" sx={{ mb: 1, fontWeight: 'bold' }}>
                                                Available Templates:
                                            </Typography>
                                            <FormControl fullWidth sx={{ mb: 2 }}>
                                                <InputLabel>Select Survey Template</InputLabel>
                                                <Select
                                                    value={selectedTemplate}
                                                    onChange={(e) => setSelectedTemplate(e.target.value)}
                                                    label="Select Survey Template"
                                                    size="small"
                                                >
                                                    {getAvailableTemplatesForUser().map((template) => (
                                                        <MenuItem key={template.id} value={template.id}>
                                                            {`${template.version_name || 'Survey'}${template.survey_code ? ` - ${template.survey_code}` : ''}`}
                                                        </MenuItem>
                                                    ))}
                                                </Select>
                                            </FormControl>

                                            {getAvailableTemplatesForUser().length === 0 && (
                                                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                                    All available templates have been assigned to this user.
                                                </Typography>
                                            )}

                                            {/* Assignment Button for Single User */}
                                            <Button
                                                variant="contained"
                                                fullWidth
                                                onClick={() => assignSurvey([selectedUserForView.id])}
                                                disabled={loading || !selectedTemplate || getAvailableTemplatesForUser().length === 0}
                                                startIcon={loading ? <CircularProgress size={16} /> : <SendIcon />}
                                                sx={{
                                                    backgroundColor: '#633394',
                                                    '&:hover': { backgroundColor: '#7c52a5' },
                                                    mb: 1
                                                }}
                                            >
                                                {loading ? 'Assigning...' : 'Assign Selected Template'}
                                            </Button>

                                            <Button
                                                variant="outlined"
                                                fullWidth
                                                onClick={() => {
                                                    setSelectedUserForView(null);
                                                    if (onUserDeselect) onUserDeselect();
                                                }}
                                                sx={{ color: '#633394', borderColor: '#633394' }}
                                            >
                                                Back to Bulk Assignment
                                            </Button>
                                        </>
                                    ) : (
                                        // Bulk Assignment View
                                        <>
                                            <Typography variant="subtitle1" sx={{ mb: 2 }}>
                                                Bulk Assignment Details
                                            </Typography>

                                            {/* Survey Template Selection */}
                                            <FormControl fullWidth sx={{ mb: 2 }}>
                                                <InputLabel>Select Survey Template</InputLabel>
                                                <Select
                                                    value={selectedTemplate}
                                                    onChange={(e) => setSelectedTemplate(e.target.value)}
                                                    label="Select Survey Template"
                                                    size="small"
                                                >
                                                    {templates.map((template) => (
                                                        <MenuItem key={template.id} value={template.id}>
                                                            {`${template.version_name || 'Survey'}${template.survey_code ? ` - ${template.survey_code}` : ''}`}
                                                        </MenuItem>
                                                    ))}
                                                </Select>
                                            </FormControl>

                                            {/* Selected Users Summary */}
                                            {selectedUsersInfo.length > 0 && (
                                                <Box sx={{ mb: 2 }}>
                                                    <Typography variant="body2" sx={{ mb: 1 }}>
                                                        Selected Users ({selectedUsersInfo.length}):
                                                    </Typography>
                                                    <Box sx={{ maxHeight: 100, overflow: 'auto' }}>
                                                        {selectedUsersInfo.slice(0, 5).map((user) => (
                                                            <Chip
                                                                key={user.id}
                                                                label={user.firstname && user.lastname
                                                                    ? `${user.firstname} ${user.lastname}`
                                                                    : user.username}
                                                                size="small"
                                                                sx={{ m: 0.25 }}
                                                                onDelete={() => handleUserSelection(user.id)}
                                                            />
                                                        ))}
                                                        {selectedUsersInfo.length > 5 && (
                                                            <Chip
                                                                label={`+${selectedUsersInfo.length - 5} more`}
                                                                size="small"
                                                                sx={{ m: 0.25 }}
                                                            />
                                                        )}
                                                    </Box>
                                                </Box>
                                            )}

                                            {/* Assignment Button */}
                                            <Button
                                                variant="contained"
                                                fullWidth
                                                onClick={assignSurvey}
                                                disabled={loading || selectedUsers.length === 0 || !selectedTemplate}
                                                startIcon={loading ? <CircularProgress size={16} /> : <SendIcon />}
                                                sx={{
                                                    backgroundColor: '#633394',
                                                    '&:hover': { backgroundColor: '#7c52a5' }
                                                }}
                                            >
                                                {loading ? 'Assigning...' : `Assign to ${selectedUsers.length} User${selectedUsers.length !== 1 ? 's' : ''}`}
                                            </Button>

                                            {selectedTemplate && (
                                                <Box sx={{ mt: 2, p: 1, backgroundColor: '#f5f5f5', borderRadius: 1 }}>
                                                    <Typography variant="body2" color="text.secondary">
                                                        <strong>Survey:</strong> {getTemplateName(selectedTemplate)}
                                                    </Typography>
                                                    <Typography variant="body2" color="text.secondary">
                                                        Email notifications will be sent
                                                    </Typography>
                                                </Box>
                                            )}
                                        </>
                                    )}
                                </Box>
                            </Grid>
                        </Grid>
                    </Collapse>

                    {/* Compact view when collapsed */}
                    {!expanded && (
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <Typography variant="body2" color="text.secondary">
                                Assign surveys to users and send email notifications
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 1 }}>
                                {selectedUserForView && (
                                    <Chip
                                        label={`Viewing: ${selectedUserForView.firstname && selectedUserForView.lastname
                                            ? `${selectedUserForView.firstname} ${selectedUserForView.lastname}`
                                            : selectedUserForView.username}`}
                                        size="small"
                                        color="primary"
                                    />
                                )}
                                <Chip
                                    label={`${selectedUsers.length} selected`}
                                    size="small"
                                    color={selectedUsers.length > 0 ? 'primary' : 'default'}
                                />
                            </Box>
                        </Box>
                    )}
                </CardContent>
            </Card>

            {/* Assignment Results Dialog */}
            <Dialog
                open={showResultDialog}
                onClose={() => setShowResultDialog(false)}
                maxWidth="md"
                fullWidth
            >
                <DialogTitle>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <EmailIcon sx={{ mr: 2 }} />
                        Survey Assignment Results
                    </Box>
                </DialogTitle>
                <DialogContent>
                    {assignmentResults && (
                        <Box>
                            <Grid container spacing={2} sx={{ mb: 3 }}>
                                <Grid item xs={6}>
                                    <Card sx={{ backgroundColor: '#e8f5e8' }}>
                                        <CardContent sx={{ textAlign: 'center' }}>
                                            <CheckCircleIcon sx={{ color: 'green', fontSize: 40, mb: 1 }} />
                                            <Typography variant="h6">
                                                {assignmentResults.results.successful_assignments}
                                            </Typography>
                                            <Typography variant="body2">
                                                Successful Assignments
                                            </Typography>
                                        </CardContent>
                                    </Card>
                                </Grid>
                                <Grid item xs={6}>
                                    <Card sx={{ backgroundColor: '#e3f2fd' }}>
                                        <CardContent sx={{ textAlign: 'center' }}>
                                            <EmailIcon sx={{ color: 'blue', fontSize: 40, mb: 1 }} />
                                            <Typography variant="h6">
                                                {assignmentResults.results.successful_emails}
                                            </Typography>
                                            <Typography variant="body2">
                                                Emails Sent
                                            </Typography>
                                        </CardContent>
                                    </Card>
                                </Grid>
                            </Grid>

                            <Typography variant="body1" sx={{ mb: 1 }}>
                                <strong>Survey:</strong> {assignmentResults.template_name}
                            </Typography>
                            <Typography variant="body1" sx={{ mb: 2 }}>
                                <strong>Assigned by:</strong> {assignmentResults.assigned_by}
                            </Typography>

                            {assignmentResults.results.details && assignmentResults.results.details.length > 0 && (
                                <Accordion>
                                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                        <Typography>View Detailed Results</Typography>
                                    </AccordionSummary>
                                    <AccordionDetails>
                                        <TableContainer>
                                            <Table size="small">
                                                <TableHead sx={{ backgroundColor: '#FAFAFA' }}>
                                                    <TableRow>
                                                        <TableCell sx={{ fontSize: '0.75rem' }}>User ID</TableCell>
                                                        <TableCell sx={{ fontSize: '0.75rem' }}>Assignment</TableCell>
                                                        <TableCell sx={{ fontSize: '0.75rem' }}>Email</TableCell>
                                                        <TableCell sx={{ fontSize: '0.75rem' }}>Survey Code</TableCell>
                                                    </TableRow>
                                                </TableHead>
                                                <TableBody>
                                                    {assignmentResults.results.details.map((detail, index) => (
                                                        <TableRow key={index}>
                                                            <TableCell>{detail.user_id}</TableCell>
                                                            <TableCell>
                                                                {detail.assignment_success ? (
                                                                    <Chip label="Success" color="success" size="small" />
                                                                ) : (
                                                                    <Chip label="Failed" color="error" size="small" />
                                                                )}
                                                            </TableCell>
                                                            <TableCell>
                                                                {detail.email_success ? (
                                                                    <Chip label="Sent" color="success" size="small" />
                                                                ) : (
                                                                    <Chip label="Failed" color="error" size="small" />
                                                                )}
                                                            </TableCell>
                                                            <TableCell>
                                                                {detail.survey_code && (
                                                                    <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                                                                        {detail.survey_code.substring(0, 8)}...
                                                                    </Typography>
                                                                )}
                                                            </TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        </TableContainer>
                                    </AccordionDetails>
                                </Accordion>
                            )}
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setShowResultDialog(false)}>Close</Button>
                </DialogActions>
            </Dialog>

            {/* Remove Assignment Confirmation Dialog */}
            <Dialog
                open={showRemoveDialog}
                onClose={cancelRemoveAssignment}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <WarningIcon sx={{ mr: 2, color: '#d32f2f' }} />
                        Confirm Assignment Removal
                    </Box>
                </DialogTitle>
                <DialogContent>
                    {assignmentToRemove && (
                        <Box>
                            <Typography variant="body1" sx={{ mb: 2 }}>
                                Are you sure you want to remove this survey assignment?
                            </Typography>
                            <Box sx={{ p: 2, backgroundColor: '#f5f5f5', borderRadius: 1, mb: 2 }}>
                                <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                    Survey: {assignmentToRemove.template_name}
                                    {assignmentToRemove.survey_code && ` - ${assignmentToRemove.survey_code}`}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Status: {assignmentToRemove.status}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Assigned: {new Date(assignmentToRemove.created_at).toLocaleDateString()}
                                </Typography>
                            </Box>
                            <Alert severity="warning" sx={{ mb: 2 }}>
                                <Typography variant="body2">
                                    <strong>Warning:</strong> This action will permanently delete the survey assignment
                                    and all associated survey response data. This cannot be undone.
                                </Typography>
                            </Alert>
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button
                        onClick={cancelRemoveAssignment}
                        sx={{ color: '#666' }}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={confirmRemoveAssignment}
                        disabled={removingAssignment}
                        startIcon={removingAssignment ? <CircularProgress size={16} /> : <DeleteIcon />}
                        sx={{
                            color: '#d32f2f',
                            '&:hover': { backgroundColor: '#ffebee' }
                        }}
                    >
                        {removingAssignment ? 'Removing...' : 'Remove Assignment'}
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
};

export default SurveyAssignmentCard;