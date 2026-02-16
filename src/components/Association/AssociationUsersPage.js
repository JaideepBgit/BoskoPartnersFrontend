import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Container, Typography, Box, CircularProgress, Alert, Chip, FormControl, InputLabel, Select, MenuItem, TextField, Button, IconButton
} from '@mui/material';
import Navbar from '../shared/Navbar/Navbar';
import DataTable from '../shared/DataTable/DataTable';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import PreviewIcon from '@mui/icons-material/Preview';
import AddIcon from '@mui/icons-material/Add';
import UploadFileIcon from '@mui/icons-material/UploadFile';

const colors = {
    primary: '#633394',
    secondary: '#967CB2',
    background: '#f5f5f5',
    cardBg: '#ffffff',
    accentBg: '#f3e5f5',
    borderColor: '#e0e0e0',
    textPrimary: '#212121',
    textSecondary: '#757575',
    success: '#2e7d32',
    warning: '#ef6c00',
    headerBg: '#FAFAFA',
    filledColor: '#633394',
    notFilledColor: '#967CB2',
    highlightBg: '#f3e5f5'
};

function AssociationUsersPage({ onLogout }) {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [linkedOrganizations, setLinkedOrganizations] = useState([]);
    const [allUsers, setAllUsers] = useState([]);
    const [surveyResponses, setSurveyResponses] = useState([]);
    const [pendingUsers, setPendingUsers] = useState([]);
    const [associationName, setAssociationName] = useState('');
    const [error, setError] = useState(null);
    
    // Filters
    const [filters, setFilters] = useState({ organization: '', users: '', status: '' });
    const [uniqueCompanies, setUniqueCompanies] = useState([]);
    
    // Bulk selection
    const [selectedUsers, setSelectedUsers] = useState([]);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            setError(null);

            const userString = localStorage.getItem('user');
            if (!userString) {
                navigate('/login');
                return;
            }

            const currentUser = JSON.parse(userString);
            const associationId = currentUser.organization_id;

            if (!associationId) {
                setError('No association organization found');
                setLoading(false);
                return;
            }

            const assocResponse = await fetch(`/api/organizations/${associationId}`);
            if (!assocResponse.ok) throw new Error('Failed to fetch association details');
            const association = await assocResponse.json();
            setAssociationName(association.name);

            const orgsResponse = await fetch('/api/organizations');
            if (!orgsResponse.ok) throw new Error('Failed to fetch organizations');
            const allOrgs = await orgsResponse.json();

            const linked = allOrgs.filter(org => {
                if (org.id === associationId) return false;
                return org.denomination_affiliation === association.name ||
                       org.accreditation_status_or_body === association.name ||
                       org.affiliation_validation === association.name ||
                       org.umbrella_association_membership === association.name;
            });

            const usersResponse = await fetch('/api/users/role/user');
            if (!usersResponse.ok) throw new Error('Failed to fetch users');
            const fetchedUsers = await usersResponse.json();

            const responsesResponse = await fetch('/api/responses');
            if (!responsesResponse.ok) throw new Error('Failed to fetch survey responses');
            const responses = await responsesResponse.json();
            setSurveyResponses(responses);

            const pendingResponse = await fetch('/api/users/pending-surveys');
            const pendingData = await pendingResponse.json();
            setPendingUsers(pendingData.users || []);

            const linkedOrgIds = linked.map(org => org.id);
            const filteredUsers = fetchedUsers.filter(user => linkedOrgIds.includes(user.organization_id));

            const processedUsers = filteredUsers.map(user => {
                const surveyResponse = responses.find(response => response.user_id === user.id);
                const displayStatus = surveyResponse?.status === 'completed' ? 'Filled' : 'Not-Filled';
                const pendingUser = pendingData.users?.find(p => p.id === user.id);

                return {
                    id: user.id,
                    name: `${user.firstname} ${user.lastname}`,
                    username: user.username,
                    email: user.email,
                    company_id: user.organization_id,
                    company_name: user.organization?.name,
                    organization_id: user.organization_id,
                    organization: user.organization,
                    reminder: 0,
                    status: displayStatus,
                    survey_code: user.survey_code,
                    response_id: surveyResponse?.id || null,
                    start_date: surveyResponse?.start_date || null,
                    end_date: surveyResponse?.end_date || null,
                    response_status: surveyResponse?.status || null,
                    days_since_creation: pendingUser?.days_since_creation || 0
                };
            });

            setLinkedOrganizations(linked);
            setAllUsers(processedUsers);
            setUniqueCompanies([...new Set(processedUsers.map(u => u.company_name).filter(Boolean))]);
        } catch (error) {
            console.error('Error loading data:', error);
            setError(error.message || 'Failed to load users');
        } finally {
            setLoading(false);
        }
    };

    const handleFilterChange = (event) => {
        setFilters({ ...filters, [event.target.name]: event.target.value });
    };

    const handleAddUser = () => navigate('/users/add');
    const handleUploadUsers = () => console.log('Upload users clicked');
    const handleSendBulkReminders = () => console.log('Send bulk reminders to:', selectedUsers);
    const handleSendReminder = (userId, event) => { event.stopPropagation(); console.log('Send reminder to user:', userId); };
    const handlePreviewEmail = (userId, event) => { event.stopPropagation(); console.log('Preview email for user:', userId); };

    const handleUserRowClick = (user) => {
        navigate(`/organization-management/${user.organization_id}/users/${user.id}`, {
            state: { fromAssociationUsers: true }
        });
    };

    const formatDateForDisplay = (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: '2-digit', timeZone: 'UTC' });
    };

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

    const columns = useMemo(() => [
        { id: 'organization', label: 'Organization', sortable: true, render: (user) => user.company_name || 'No Organization' },
        {
            id: 'users', label: 'Users', sortable: true,
            render: (user) => (
                <Box>
                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>{user.name}</Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>{user.email}</Typography>
                </Box>
            )
        },
        {
            id: 'status', label: 'Status', sortable: true,
            render: (user) => (
                <Chip label={user.status} size="small" color={user.status === 'Filled' ? 'success' : 'warning'} variant="outlined"
                    sx={{ color: user.status === 'Filled' ? colors.filledColor : colors.notFilledColor, fontWeight: 'bold' }} />
            )
        },
        {
            id: 'days_since_creation', label: 'Days Since Created', sortable: true,
            render: (user) => (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="body2">{user.days_since_creation} days</Typography>
                    {user.days_since_creation > 14 && <Chip label="Overdue" size="small" color="error" variant="outlined" />}
                </Box>
            )
        },
        {
            id: 'response_status', label: 'Survey Progress', sortable: true,
            render: (user) => {
                const progressStatus = user.response_status || 'pending';
                const progressLabel = progressStatus === 'completed' ? 'Completed' : (progressStatus === 'in_progress' ? 'In Progress' : 'Not Started');
                const progressColor = progressStatus === 'completed' ? 'success' : (progressStatus === 'in_progress' ? 'info' : 'default');
                return <Chip label={progressLabel} size="small" color={progressColor} variant="outlined" />;
            }
        },
        {
            id: 'reminder', label: 'Reminders Sent', sortable: true,
            render: (user) => (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="body2">{user.reminder || 0}</Typography>
                    {(user.reminder || 0) > 2 && <Chip label="Many" size="small" color="warning" variant="outlined" />}
                </Box>
            )
        },
        {
            id: 'start_date', label: 'Start Date', sortable: true,
            render: (user) => <Typography variant="body2" sx={{ color: user.start_date ? colors.primary : 'text.secondary' }}>{formatDateForDisplay(user.start_date)}</Typography>
        },
        {
            id: 'end_date', label: 'End Date', sortable: true,
            render: (user) => <Typography variant="body2" sx={{ color: user.end_date ? colors.primary : 'text.secondary' }}>{formatDateForDisplay(user.end_date)}</Typography>
        },
        {
            id: 'actions', label: 'Actions', width: 120,
            render: (user) => (
                <Box sx={{ display: 'flex', gap: 1 }}>
                    <IconButton title="Send Individual Reminder" sx={{ color: colors.primary }} onClick={(e) => handleSendReminder(user.id, e)} disabled={user.status === 'Filled'} size="small">
                        <NotificationsActiveIcon fontSize="small" />
                    </IconButton>
                    <IconButton title="Preview Welcome Email" sx={{ color: '#10b981' }} onClick={(e) => handlePreviewEmail(user.id, e)} size="small">
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
                <Container maxWidth="xl" sx={{ py: 4 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                        <CircularProgress sx={{ color: colors.primary }} />
                    </Box>
                </Container>
            </>
        );
    }

    return (
        <>
            <Navbar onLogout={onLogout} />
            <Container maxWidth="xl" sx={{ py: 4, backgroundColor: colors.background, minHeight: '100vh' }}>
                <Box sx={{ mb: 4 }}>
                    <Typography variant="h4" sx={{ fontWeight: 'bold', color: colors.textPrimary, mb: 1 }}>Users Management</Typography>
                    <Typography variant="subtitle1" color="text.secondary">Manage users across organizations in {associationName}</Typography>
                </Box>

                {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

                {/* Filters and Action Buttons Row */}
                <Box sx={{ mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
                    {/* Filters on the left */}
                    <FormControl variant="outlined" size="small" sx={{ minWidth: 250, flex: 1 }}>
                        <TextField size="small" label="Search Users" name="users" value={filters.users} onChange={handleFilterChange} placeholder="Name, Email, Username..." variant="outlined" InputLabelProps={{ shrink: true }} />
                    </FormControl>
                    <FormControl variant="outlined" size="small" sx={{ minWidth: 200 }}>
                        <InputLabel>Organization</InputLabel>
                        <Select name="organization" value={filters.organization} onChange={handleFilterChange} label="Organization">
                            <MenuItem value=""><em>All Organizations</em></MenuItem>
                            {uniqueCompanies.map((company, index) => (<MenuItem key={index} value={company}>{company}</MenuItem>))}
                        </Select>
                    </FormControl>
                    <FormControl variant="outlined" size="small" sx={{ minWidth: 150 }}>
                        <InputLabel>Status</InputLabel>
                        <Select name="status" value={filters.status} onChange={handleFilterChange} label="Status">
                            <MenuItem value=""><em>All Status</em></MenuItem>
                            <MenuItem value="Filled">Filled</MenuItem>
                            <MenuItem value="Not-Filled">Not-Filled</MenuItem>
                        </Select>
                    </FormControl>

                    {/* Spacer to push buttons to the right */}
                    <Box sx={{ flex: 1 }} />

                    {/* Action Buttons on the right */}
                    {selectedUsers.length > 0 && (
                        <Button variant="contained" startIcon={<NotificationsActiveIcon />} onClick={handleSendBulkReminders} sx={{ backgroundColor: '#10b981', '&:hover': { backgroundColor: '#059669' } }}>
                            Send Bulk Reminders ({selectedUsers.length})
                        </Button>
                    )}
                    <Button variant="outlined" startIcon={<UploadFileIcon />} onClick={handleUploadUsers} sx={{ borderColor: colors.primary, color: colors.primary, '&:hover': { borderColor: colors.secondary, color: colors.secondary } }}>Upload Users</Button>
                    <Button variant="contained" startIcon={<AddIcon />} onClick={handleAddUser} sx={{ backgroundColor: colors.primary, '&:hover': { backgroundColor: colors.secondary } }}>Add User</Button>
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
                    onRowClick={handleUserRowClick}
                    hoverEffect
                    cellBorders
                    borderColor={colors.borderColor}
                    headerBg={colors.headerBg}
                    emptyMessage="No users found matching your filters"
                    rowSx={(row) => selectedUsers.includes(row.id) ? { backgroundColor: colors.highlightBg } : {}}
                />
            </Container>
        </>
    );
}

export default AssociationUsersPage;
