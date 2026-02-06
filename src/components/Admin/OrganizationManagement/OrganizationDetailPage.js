import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Container, Typography, Box, Paper, TextField, InputAdornment,
    Tabs, Tab, Table, TableBody, TableCell, TableContainer, TableHead,
    CircularProgress, Alert, Card, CardContent, TablePagination, Stack,
    Tooltip, Menu, MenuItem, ListItemIcon, ListItemText,
    TableRow, IconButton, Button, Grid, Chip, Avatar, Drawer, Divider,
    Dialog, DialogTitle, DialogContent, DialogActions, FormControl, InputLabel, Select, TableSortLabel,
    DialogContentText, Checkbox, Autocomplete
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import SearchIcon from '@mui/icons-material/Search';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ArchiveIcon from '@mui/icons-material/Archive';
import AssignmentIcon from '@mui/icons-material/Assignment';
import PersonIcon from '@mui/icons-material/Person';
import BusinessIcon from '@mui/icons-material/Business';
import AddIcon from '@mui/icons-material/Add';
import VisibilityIcon from '@mui/icons-material/Visibility';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import StarIcon from '@mui/icons-material/Star';

import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import EmailIcon from '@mui/icons-material/Email';
import PreviewIcon from '@mui/icons-material/Preview';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import SendIcon from '@mui/icons-material/Send';
import Navbar from '../../shared/Navbar/Navbar';
import EnhancedAddressInput from '../../UserManagement/common/EnhancedAddressInput';
import TemplatesTab from '../Inventory/TemplatesTab';
import QuestionsTab from '../Inventory/QuestionsTab';
import {
    fetchOrganizations,
    fetchUsers,
    fetchUsersByOrganization,
    fetchTemplatesByOrganization,
    updateOrganization,
    deleteOrganization,
    deleteUser,
    updateUser,
    updateUserRoles,

    fetchRoles,
    fetchTitles,
    sendSurveyReminder,
    sendBulkSurveyReminders
} from '../../../services/UserManagement/UserManagementService';
import { EmailService } from '../../../services/EmailService';

// Color theme
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

const ALL_USER_ROLES = [
    { value: 'root', label: 'Root' },
    { value: 'admin', label: 'Admin' },
    { value: 'user', label: 'User' },
    { value: 'manager', label: 'Manager (Account Holder)' },
    { value: 'primary_contact', label: 'Primary Contact' },
    { value: 'secondary_contact', label: 'Secondary Contact' }
];

// Filter roles based on logged-in user's permissions
const getAvailableRoles = () => {
    const currentUserRole = localStorage.getItem('userRole');

    if (currentUserRole === 'root') {
        return ALL_USER_ROLES; // Root can assign any role
    } else if (currentUserRole === 'admin') {
        // Admin cannot assign 'root'
        return ALL_USER_ROLES.filter(r => r.value !== 'root');
    } else if (currentUserRole === 'manager') {
        // Manager cannot assign 'admin' or 'root'
        return ALL_USER_ROLES.filter(r => !['admin', 'root'].includes(r.value));
    }
    // Default: only basic roles
    return ALL_USER_ROLES.filter(r => !['admin', 'root'].includes(r.value));
};

function OrganizationDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [organization, setOrganization] = useState(null);
    const [users, setUsers] = useState([]);
    const [roles, setRoles] = useState([]);
    const [titles, setTitles] = useState([]);
    const [surveys, setSurveys] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedSurvey, setSelectedSurvey] = useState(null);
    const [previewSurvey, setPreviewSurvey] = useState(null);
    const [activeTab, setActiveTab] = useState(0);

    const [searchQuery, setSearchQuery] = useState('');

    // Derive unique dictionary of versions from surveys
    const uniqueVersions = React.useMemo(() => {
        const versionsMap = new Map();
        surveys.forEach(survey => {
            if (survey.version_id && !versionsMap.has(survey.version_id)) {
                versionsMap.set(survey.version_id, {
                    id: survey.version_id,
                    name: survey.version_name || 'Generic Version'
                });
            }
        });
        return Array.from(versionsMap.values());
    }, [surveys]);

    // Edit User Dialog State
    const [editUserDialogOpen, setEditUserDialogOpen] = useState(false);
    const [selectedUserToEdit, setSelectedUserToEdit] = useState(null);
    const [editUserFormData, setEditUserFormData] = useState({
        firstname: '',
        lastname: '',
        email: '',
        email: '',
        role: '',
        title_id: '',
        geo_location: {}
    });
    const [savingUser, setSavingUser] = useState(false);
    const [editDrawerOpen, setEditDrawerOpen] = useState(false);
    const [editTab, setEditTab] = useState(0);
    const [editFormData, setEditFormData] = useState({
        name: '',
        website: '',
        denomination_affiliation: '',
        accreditation_status_or_body: '',
        affiliation_validation: '',
        geo_location: {
            continent: '',
            region: '',
            country: '',
            province: '',
            city: '',
            town: '',
            address_line1: '',
            address_line2: '',
            postal_code: '',
        }
    });
    const [saving, setSaving] = useState(false);

    // Pagination state
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [order, setOrder] = useState('asc');
    const [orderBy, setOrderBy] = useState('name');

    // Reminder Dialog State
    const [openReminderDialog, setOpenReminderDialog] = useState(false);
    const [selectedRecipient, setSelectedRecipient] = useState(null);
    const [reminderStatus, setReminderStatus] = useState({ sending: false, results: null });
    const [showEmailPreview, setShowEmailPreview] = useState(false);
    const [emailPreviewType, setEmailPreviewType] = useState('text');
    const [availableTemplates, setAvailableTemplates] = useState([]);
    const [selectedTemplateId, setSelectedTemplateId] = useState('');
    const [templatePreview, setTemplatePreview] = useState(null);
    const [loadingTemplates, setLoadingTemplates] = useState(false);
    const [emailPreviewContent, setEmailPreviewContent] = useState(null);
    const [loadingEmailPreview, setLoadingEmailPreview] = useState(false);

    // Bulk Reminder State
    const [selectedUsers, setSelectedUsers] = useState([]);
    const [bulkReminderDialog, setBulkReminderDialog] = useState(false);
    const [showReminderResults, setShowReminderResults] = useState(false);

    // Account Manager Dialog State
    const [openAccountManagerDialog, setOpenAccountManagerDialog] = useState(false);
    const [selectedManagerIds, setSelectedManagerIds] = useState([]);

    // Sorting functions
    const handleRequestSort = (property) => {
        const isAsc = orderBy === property && order === 'asc';
        setOrder(isAsc ? 'desc' : 'asc');
        setOrderBy(property);
    };

    const descendingComparator = (a, b, orderBy) => {
        let aValue = a[orderBy];
        let bValue = b[orderBy];

        // Handle composite or specific fields
        if (orderBy === 'name') {
            aValue = `${a.firstname || ''} ${a.lastname || ''}`.toLowerCase();
            bValue = `${b.firstname || ''} ${b.lastname || ''}`.toLowerCase();
        } else if (orderBy === 'role') {
            aValue = (a.role || '').toLowerCase();
            bValue = (b.role || '').toLowerCase();
        } else if (orderBy === 'is_active') {
            // Boolean/Number comparison
            aValue = a.is_active ? 1 : 0;
            bValue = b.is_active ? 1 : 0;
        } else {
            // Default string handling
            if (typeof aValue === 'string') aValue = aValue.toLowerCase();
            if (typeof bValue === 'string') bValue = bValue.toLowerCase();
        }

        if (bValue < aValue) {
            return -1;
        }
        if (bValue > aValue) {
            return 1;
        }
        return 0;
    };

    const getComparator = (order, orderBy) => {
        return order === 'desc'
            ? (a, b) => descendingComparator(a, b, orderBy)
            : (a, b) => -descendingComparator(a, b, orderBy);
    };

    const stableSort = (array, comparator) => {
        const stabilizedThis = array.map((el, index) => [el, index]);
        stabilizedThis.sort((a, b) => {
            const order = comparator(a[0], b[0]);
            if (order !== 0) return order;
            return a[1] - b[1];
        });
        return stabilizedThis.map((el) => el[0]);
    };

    // Load data
    useEffect(() => {
        loadData();
    }, [id]);

    // Reset selection when data changes or users are filtered
    useEffect(() => {
        setSelectedUsers([]);
    }, [id, searchQuery]);

    const loadData = async () => {
        try {
            setLoading(true);
            const [orgData, usersData, allUsersData, rolesData, titlesData, surveysData] = await Promise.all([
                fetchOrganizations(),
                fetchUsersByOrganization(id),
                fetchUsers(),
                fetchRoles(),
                fetchTitles(),
                fetchTemplatesByOrganization(id)
            ]);

            const currentOrg = orgData.find(o => o.id === parseInt(id));
            setOrganization(currentOrg);

            // Populate edit form with organization data
            if (currentOrg) {
                setEditFormData({
                    name: currentOrg.name || '',
                    website: currentOrg.website || '',
                    denomination_affiliation: currentOrg.denomination_affiliation || '',
                    accreditation_status_or_body: currentOrg.accreditation_status_or_body || '',
                    geo_location: currentOrg.geo_location || {
                        continent: '',
                        region: '',
                        country: '',
                        province: '',
                        city: '',
                        town: '',
                        address_line1: '',
                        address_line2: '',
                        postal_code: '',
                    }
                });
            }

            // Merge detailed user info (address) from allUsersData into usersData
            const enrichedUsers = usersData.map(orgUser => {
                const fullUser = allUsersData.find(u => u.id === orgUser.id);
                if (fullUser && fullUser.geo_location) {
                    return {
                        ...orgUser,
                        geo_location: fullUser.geo_location
                    };
                }
                return orgUser;
            });

            setUsers(enrichedUsers);
            setRoles(rolesData);
            setTitles(titlesData);
            setSurveys(surveysData);
        } catch (error) {
            console.error('Error loading data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleBack = () => {
        navigate('/organization-management');
    };

    const handleTabChange = (event, newValue) => {
        setActiveTab(newValue);
    };

    const handleEditClick = () => {
        setEditDrawerOpen(true);
    };

    const handleEditClose = () => {
        setEditDrawerOpen(false);
    };

    const handleEditFormChange = (field, value) => {
        if (field.startsWith('geo_location.')) {
            const geoField = field.replace('geo_location.', '');
            setEditFormData(prev => ({
                ...prev,
                geo_location: {
                    ...prev.geo_location,
                    [geoField]: value
                }
            }));
        } else {
            setEditFormData(prev => ({
                ...prev,
                [field]: value
            }));
        }
    };

    const handleEditUserClick = (user) => {
        setSelectedUserToEdit(user);

        // Handle multiple roles - user.roles could be an array or we derive from user.role
        let userRoles = [];
        if (user.roles && Array.isArray(user.roles)) {
            userRoles = user.roles.map(r => typeof r === 'object' ? r.name : r);
        } else if (user.role) {
            userRoles = [user.role];
        } else {
            userRoles = ['user'];
        }

        // Handle multiple titles - user.titles could be an array or we derive from user.title
        let userTitles = [];
        if (user.titles && Array.isArray(user.titles)) {
            userTitles = user.titles;
        } else if (user.title_id) {
            userTitles = [user.title_id];
        } else if (user.title) {
            const titleObj = titles.find(t => t.name === user.title);
            userTitles = titleObj ? [titleObj.id] : [];
        }

        setEditUserFormData({
            firstname: user.firstname || '',
            lastname: user.lastname || '',
            email: user.email || '',
            roles: userRoles,
            titles: userTitles,
            // Keep backwards compatibility
            role: user.role || userRoles[0] || 'user',
            title_id: user.title_id || userTitles[0] || '',
            geo_location: user.geo_location || {}
        });
        setEditUserDialogOpen(true);
    };

    const handleEditUserClose = () => {
        setEditUserDialogOpen(false);
        setSelectedUserToEdit(null);
        setEditUserFormData({
            firstname: '',
            lastname: '',
            email: '',
            roles: [],
            titles: [],
            role: '',
            title_id: '',
            geo_location: {}
        });
    };

    const handleEditUserFormChange = (prop) => (event) => {
        setEditUserFormData({ ...editUserFormData, [prop]: event.target.value });
    };

    const handleUserAddressSelect = (placeData) => {
        if (!placeData) return;
        const { geoLocationData } = placeData;

        // Ensure latitude and longitude are numbers
        const updatedGeoLocation = {
            ...geoLocationData,
            latitude: geoLocationData.latitude ? Number(geoLocationData.latitude) : 0,
            longitude: geoLocationData.longitude ? Number(geoLocationData.longitude) : 0
        };

        setEditUserFormData({
            ...editUserFormData,
            geo_location: updatedGeoLocation
        });
    };

    const handleUpdateUser = async () => {
        if (!selectedUserToEdit) return;

        try {
            setSavingUser(true);
            const userData = {
                ...editUserFormData,
                // Use multi-select values if available, otherwise fallback to single values
                roles: editUserFormData.roles && editUserFormData.roles.length > 0
                    ? editUserFormData.roles
                    : editUserFormData.role ? [editUserFormData.role] : ['user'],
                titles: editUserFormData.titles || [],
                // Keep backwards compatibility for single role/title
                role: editUserFormData.roles?.[0] || editUserFormData.role || 'user',
                title_id: editUserFormData.titles?.[0] || editUserFormData.title_id || null
            };

            await updateUser(selectedUserToEdit.id, userData);

            // Refresh users list
            const updatedUsers = await fetchUsersByOrganization(id);
            setUsers(updatedUsers);

            handleEditUserClose();
        } catch (error) {
            console.error('Error updating user:', error);
            alert(`Failed to update user: ${error.response?.data?.error || error.message}`);
        } finally {
            setSavingUser(false);
        }
    };

    const formatAddress = (geoLocation) => {
        if (!geoLocation) return '-';

        // Handle stringified JSON if applicable
        let location = geoLocation;
        if (typeof geoLocation === 'string') {
            try {
                location = JSON.parse(geoLocation);
            } catch (e) {
                return geoLocation; // Return string as is
            }
        }

        const parts = [
            location.address_line1,
            location.city,
            location.province,
            location.country
        ].filter(part => part && typeof part === 'string' && part.trim() !== '');

        return parts.length > 0 ? parts.join(', ') : '-';
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await updateOrganization(id, editFormData);
            await loadData();
            setEditDrawerOpen(false);
            alert('Organization updated successfully!');
        } catch (error) {
            console.error('Failed to update organization:', error);
            alert(`Failed to update: ${error.message}`);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (window.confirm(`Are you sure you want to delete "${organization?.name}"? This action cannot be undone.`)) {
            try {
                await deleteOrganization(id);
                navigate('/organization-management');
            } catch (error) {
                console.error('Failed to delete organization:', error);
                alert(`Failed to delete: ${error.message}`);
            }
        }
    };

    const handleDeleteUser = async (user) => {
        if (window.confirm(`Are you sure you want to remove user "${user.username}"?`)) {
            try {
                await deleteUser(user.id);
                // Reload users
                const usersData = await fetchUsersByOrganization(organization.id);
                setUsers(usersData || []);
                alert('User removed successfully');
            } catch (error) {
                console.error('Failed to delete user:', error);
                alert(`Failed to delete user: ${error.message}`);
            }
        }
    };

    const filteredUsers = users.filter(user => {
        if (!searchQuery) return true;
        const search = searchQuery.toLowerCase();
        return (
            user.username?.toLowerCase().includes(search) ||
            user.email?.toLowerCase().includes(search) ||
            user.firstname?.toLowerCase().includes(search) ||
            user.lastname?.toLowerCase().includes(search)
        );
    });

    // Selection Handlers
    const handleSelectAllClick = (event) => {
        if (event.target.checked) {
            const newSelecteds = filteredUsers
                .filter(user => !user.has_completed_survey) // Only select pending users
                .map((user) => user.id);
            setSelectedUsers(newSelecteds);
            return;
        }
        setSelectedUsers([]);
    };

    const handleSelectClick = (event, id) => {
        // Prevent row click propagation if needed, but usually nicely handled on checkbox
        event.stopPropagation();

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

    const isSelected = (id) => selectedUsers.indexOf(id) !== -1;

    const filteredSurveys = surveys.filter(survey => {
        if (!searchQuery) return true;
        const search = searchQuery.toLowerCase();
        return (
            survey.survey_code?.toLowerCase().includes(search) ||
            survey.description?.toLowerCase().includes(search) ||
            survey.version_name?.toLowerCase().includes(search)
        );
    });

    const getLocation = () => {
        if (!organization?.geo_location) return 'N/A';
        const { city, province, country } = organization.geo_location;
        return [city, province, country].filter(Boolean).join(', ') || 'N/A';
    };

    const handleSendReminder = async () => {
        if (!selectedRecipient) return;

        setReminderStatus({ sending: true, results: null });

        try {
            // Prepare request body similar to AdminDashboard
            const surveyCode = selectedRecipient.survey_code || 'N/A'; // Assuming survey_code might be on user object or generic

            const requestBody = {
                to_email: selectedRecipient.email,
                username: selectedRecipient.username,
                survey_code: surveyCode,
                firstname: selectedRecipient.firstname || selectedRecipient.username,
                organization_name: organization.name,
                organization_id: organization.id
            };

            // Add template_id if a specific template is selected
            if (selectedTemplateId) {
                requestBody.template_id = parseInt(selectedTemplateId);
            }

            const response = await fetch('/api/send-reminder-email', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody),
            });

            const result = await response.json();

            if (response.ok) {
                setReminderStatus({
                    sending: false,
                    results: {
                        success: true,
                        message: `Reminder email sent successfully to ${selectedRecipient.email}`,
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

    // Load available reminder templates
    const loadReminderTemplates = async (orgId) => {
        setLoadingTemplates(true);
        try {
            // Use EmailService or direct fetch if service method missing/different
            const response = await fetch('/api/email-templates/public-reminder-templates');
            if (response.ok) {
                const result = await response.json();
                setAvailableTemplates(result.templates || []);
            } else {
                console.error('Failed to load reminder templates');
                setAvailableTemplates([]);
            }
        } catch (error) {
            console.error('Error loading reminder templates:', error);
            setAvailableTemplates([]);
        } finally {
            setLoadingTemplates(false);
        }
    };

    // Handle template selection change
    const handleTemplateChange = async (templateId) => {
        setSelectedTemplateId(templateId);
        if (templateId && selectedRecipient) {
            try {
                const template = availableTemplates.find(t => t.id.toString() === templateId);
                if (template) {
                    setTemplatePreview(template);
                }
            } catch (error) {
                console.error('Error loading template preview:', error);
            }
        } else {
            setTemplatePreview(null);
        }

        // Reload email preview if it's currently being shown
        if (showEmailPreview && selectedRecipient) {
            await loadEmailPreview();
        }
    };

    // Generate email preview
    const generateEmailPreview = async (user, templateId = null) => {
        if (!user) return { text: '', html: '', subject: '' };

        try {
            const username = user.username;
            const email = user.email;
            const surveyCode = user.survey_code || 'N/A';
            const firstname = user.firstname || username;

            const templateVariables = {
                greeting: `Dear ${firstname}`,
                username: username,
                email: email,
                survey_code: surveyCode,
                organization_name: organization.name,
                first_name: firstname,
                platform_name: 'Saurara Platform',
                support_email: 'info@saurara.org',
                survey_url: 'https://www.saurara.org'
            };

            let renderedPreview;

            if (templateId) {
                const response = await fetch('/api/email-templates/render-preview', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        template_id: parseInt(templateId),
                        variables: templateVariables
                    }),
                });

                if (response.ok) {
                    renderedPreview = await response.json();
                } else {
                    throw new Error('Failed to render template preview');
                }
            } else {
                // Use default template logic
                const organizationParam = organization.id ? `?organization_id=${organization.id}` : '';
                const templateResponse = await fetch(`/api/email-templates/by-type/reminder${organizationParam}`);

                if (templateResponse.ok) {
                    const templateData = await templateResponse.json();
                    const renderResponse = await fetch('/api/email-templates/render-preview', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            template_id: templateData.id,
                            variables: templateVariables
                        }),
                    });

                    if (renderResponse.ok) {
                        renderedPreview = await renderResponse.json();
                    } else {
                        throw new Error('Failed to render default template');
                    }
                } else {
                    // Fallback to simple preview on error
                    return {
                        text: `Dear ${firstname},\n\nThis is a friendly reminder to complete your survey.\n\nBest regards,\nSaurara Team`,
                        html: `<p>Dear ${firstname},</p><p>This is a friendly reminder to complete your survey.</p>`,
                        subject: 'Survey Reminder'
                    };
                }
            }

            return {
                text: renderedPreview.text_body || 'No text version',
                html: renderedPreview.html_body || 'No HTML version',
                subject: renderedPreview.subject || 'Reminder'
            };

        } catch (error) {
            console.error('Error generating email preview:', error);
            return {
                text: 'Error generating preview',
                html: 'Error generating preview',
                subject: 'Error'
            };
        }
    };

    // Prepare bulk reminder data
    const handleSendBulkReminders = async () => {
        setReminderStatus({ sending: true, results: null });

        try {
            // Prepare users list for the API
            const usersToSend = selectedUsers.map(userId => {
                const user = users.find(u => u.id === userId);
                if (!user) return null;

                const surveyCode = user.survey_code || 'N/A';

                return {
                    to_email: user.email,
                    username: user.username,
                    survey_code: surveyCode,
                    firstname: user.firstname || user.username,
                    organization_name: organization.name,
                    organization_id: organization.id,
                    // Add other fields if available in user object, e.g. days_since_creation
                };
            }).filter(Boolean);

            const requestBody = {
                users: usersToSend
            };

            // Add template_id if selected (using the same selector as individual)
            if (selectedTemplateId) {
                requestBody.template_id = parseInt(selectedTemplateId);
            }

            const response = await fetch('/api/send-bulk-reminder-emails', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody),
            });

            const result = await response.json();

            if (response.ok) {
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
            // Don't close immediately to show results or error
            if (!reminderStatus.results?.success) {
                // Keep dialog open on error? Or just show status. 
                // Logic below handles closing/resetting on user action
            }
        }
    };

    // Auto-load bulk email preview
    useEffect(() => {
        const loadBulkEmailPreview = async () => {
            if (showEmailPreview && bulkReminderDialog && selectedUsers.length > 0) {
                setLoadingEmailPreview(true);
                try {
                    const sampleUserId = selectedUsers[0];
                    const sampleUser = users.find(u => u.id === sampleUserId);
                    if (sampleUser) {
                        const preview = await generateEmailPreview(sampleUser, selectedTemplateId || null);
                        setEmailPreviewContent(preview);
                    }
                } catch (error) {
                    console.error('Error loading bulk email preview:', error);
                } finally {
                    setLoadingEmailPreview(false);
                }
            }
        };

        loadBulkEmailPreview();
    }, [showEmailPreview, bulkReminderDialog, selectedUsers, selectedTemplateId, users]); // Added dependecies

    const handleOpenBulkReminderDialog = async () => {
        if (selectedUsers.length === 0) return;

        setBulkReminderDialog(true);
        setSelectedTemplateId('');
        setTemplatePreview(null);
        setReminderStatus({ sending: false, results: null });
        await loadReminderTemplates(organization.id);
    };

    const handleCloseBulkReminderDialog = () => {
        setBulkReminderDialog(false);
        setReminderStatus({ sending: false, results: null });
        setShowEmailPreview(false);
        setSelectedTemplateId('');
        setTemplatePreview(null);
        setEmailPreviewContent(null);
        setShowReminderResults(false);
    };


    const loadEmailPreview = useCallback(async () => {
        if (!selectedRecipient) return;

        setLoadingEmailPreview(true);
        try {
            const preview = await generateEmailPreview(selectedRecipient, selectedTemplateId || null);
            setEmailPreviewContent(preview);
        } catch (error) {
            console.error('Error loading email preview:', error);
        } finally {
            setLoadingEmailPreview(false);
        }
    }, [selectedRecipient, selectedTemplateId]);

    // Auto-load email preview
    useEffect(() => {
        if (showEmailPreview && selectedRecipient && openReminderDialog) {
            loadEmailPreview();
        }
    }, [showEmailPreview, selectedRecipient, openReminderDialog, loadEmailPreview]);

    const handleOpenReminderDialog = async (user) => {
        setSelectedRecipient(user);
        setSelectedTemplateId('');
        setTemplatePreview(null);
        await loadReminderTemplates(organization.id);
        setOpenReminderDialog(true);
    };

    const handleCloseReminderDialog = () => {
        setOpenReminderDialog(false);
        setSelectedRecipient(null);
        setReminderStatus({ sending: false, results: null });
        setShowEmailPreview(false);
        setSelectedTemplateId('');
        setTemplatePreview(null);
        setEmailPreviewContent(null);
    };

    const handleBulkReminders = async () => {
        handleOpenBulkReminderDialog();
    };


    const handleOpenAccountManagerDialog = () => {
        // Initialize selected IDs with current managers
        // Check if role is manager OR if roles list includes manager
        const currentManagerIds = users
            .filter(u => u.role === 'manager' || (u.roles && u.roles.includes('manager')))
            .map(u => u.id);
        setSelectedManagerIds(currentManagerIds);
        setOpenAccountManagerDialog(true);
    };

    const handleCloseAccountManagerDialog = () => {
        setOpenAccountManagerDialog(false);
        setSelectedManagerIds([]);
    };

    const handleToggleManager = (userId) => {
        const selectedIndex = selectedManagerIds.indexOf(userId);
        let newSelected = [];

        if (selectedIndex === -1) {
            newSelected = newSelected.concat(selectedManagerIds, userId);
        } else if (selectedIndex === 0) {
            newSelected = newSelected.concat(selectedManagerIds.slice(1));
        } else if (selectedIndex === selectedManagerIds.length - 1) {
            newSelected = newSelected.concat(selectedManagerIds.slice(0, -1));
        } else if (selectedIndex > 0) {
            newSelected = newSelected.concat(
                selectedManagerIds.slice(0, selectedIndex),
                selectedManagerIds.slice(selectedIndex + 1),
            );
        }

        setSelectedManagerIds(newSelected);
    };

    const handleSaveAccountManagers = async () => {
        setSaving(true);
        try {
            const updates = [];

            // Check all users for role changes
            for (const user of users) {
                const isSelected = selectedManagerIds.includes(user.id);
                // Check if currently a manager (support legacy .role and new .roles array)
                const isManager = user.role === 'manager' || (user.roles && user.roles.includes('manager'));

                let currentRoles = user.roles ? [...user.roles] : [];
                if (!user.roles && user.role) currentRoles.push(user.role);

                if (isSelected && !isManager) {
                    // Add manager role
                    if (!currentRoles.includes('manager')) currentRoles.push('manager');
                    // Ensure 'user' role is kept if desired, or let backend handle it
                    if (!currentRoles.includes('user')) currentRoles.push('user');
                    updates.push(updateUserRoles(user.id, currentRoles));
                } else if (!isSelected && isManager) {
                    // Remove manager role
                    // If user is deselected, we remove 'manager' role
                    const newRoles = currentRoles.filter(r => r !== 'manager');
                    // Ensure at least 'user' role remains if it was the only one
                    if (newRoles.length === 0) newRoles.push('user');
                    updates.push(updateUserRoles(user.id, newRoles));
                }
            }

            await Promise.all(updates);

            // Refresh data
            await loadData();
            handleCloseAccountManagerDialog();

            // Show success message or simple alert
            if (updates.length > 0) {
                alert('Account managers updated successfully');
            }
        } catch (error) {
            console.error('Failed to update account managers:', error);
            alert('Failed to update account managers');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <>
                <Navbar />
                <Container maxWidth="xl" sx={{ py: 4 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
                        <CircularProgress sx={{ color: colors.primary }} />
                    </Box>
                </Container>
            </>
        );
    }

    if (!organization) {
        return (
            <>
                <Navbar />
                <Container maxWidth="xl" sx={{ py: 4 }}>
                    <Alert severity="error">Organization not found</Alert>
                    <Button onClick={handleBack} sx={{ mt: 2 }}>Go Back</Button>
                </Container>
            </>
        );
    }

    return (
        <>
            <Navbar />
            <Container maxWidth="xl" sx={{ py: 3, backgroundColor: colors.background, minHeight: '100vh' }}>
                {/* Header */}
                <Box sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    mb: 3
                }}>
                    <Button
                        variant="outlined"
                        startIcon={<ArrowBackIcon />}
                        onClick={handleBack}
                        sx={{
                            borderColor: colors.primary,
                            color: colors.primary,
                            textTransform: 'none',
                            borderRadius: 2,
                            '&:hover': {
                                borderColor: colors.secondary,
                                backgroundColor: colors.accentBg
                            }
                        }}
                    >
                        Organizations
                    </Button>
                    <Typography variant="h5" fontWeight="bold" color="text.primary">
                        {organization.name}
                    </Typography>
                    <Button
                        variant="outlined"
                        startIcon={<ArchiveIcon />}
                        sx={{
                            borderColor: colors.primary,
                            color: colors.primary,
                            borderRadius: 2,
                            '&:hover': { borderColor: colors.secondary, color: colors.secondary }
                        }}
                    >
                        Archive
                    </Button>
                </Box>



                {/* Info Cards */}
                <Grid container spacing={3} sx={{ mb: 3 }}>
                    {/* Account Holder Card */}
                    <Grid item xs={12} md={4}>
                        <Card sx={{
                            borderRadius: 3,
                            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                            height: '100%'
                        }}>
                            <CardContent>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <Typography variant="subtitle1" fontWeight="bold" color="text.primary">
                                            Account Manager
                                        </Typography>
                                        <IconButton size="small" onClick={handleOpenAccountManagerDialog}>
                                            <EditIcon fontSize="small" />
                                        </IconButton>
                                    </Box>
                                    <Chip
                                        label={users.filter(u => u.role === 'manager' || (u.roles && u.roles.includes('manager'))).length}
                                        size="small"
                                        sx={{ bgcolor: colors.accentBg, color: colors.primary, fontWeight: 'bold' }}
                                    />
                                </Box>
                                {users.filter(u => u.role === 'manager' || (u.roles && u.roles.includes('manager'))).length > 0 ? (
                                    users.filter(u => u.role === 'manager' || (u.roles && u.roles.includes('manager'))).map((holder, index) => (
                                        <Box key={holder.id} sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: index < users.filter(u => u.role === 'manager').length - 1 ? 1.5 : 0 }}>
                                            <Avatar sx={{ bgcolor: colors.accentBg, color: colors.primary, width: 36, height: 36 }}>
                                                <StarIcon fontSize="small" />
                                            </Avatar>
                                            <Box>
                                                <Typography variant="body2" fontWeight="medium" color="text.primary">
                                                    {holder.firstname} {holder.lastname}
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary">
                                                    {holder.email}
                                                </Typography>
                                            </Box>
                                        </Box>
                                    ))
                                ) : (
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                        <Avatar sx={{ bgcolor: colors.accentBg, color: colors.textSecondary }}>
                                            <PersonIcon />
                                        </Avatar>
                                        <Typography variant="body2" color="text.secondary">
                                            No account holders assigned
                                        </Typography>
                                    </Box>
                                )}
                            </CardContent>
                        </Card>
                    </Grid>

                    {/* Organization Details Card */}
                    <Grid item xs={12} md={8}>
                        <Card sx={{
                            borderRadius: 3,
                            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                            height: '100%'
                        }}>
                            <CardContent>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                                    <Typography variant="subtitle1" fontWeight="bold" color="text.primary">
                                        Organization Details
                                    </Typography>
                                    <Button
                                        size="small"
                                        onClick={handleEditClick}
                                        sx={{ color: colors.primary, textTransform: 'none' }}
                                    >
                                        Edit
                                    </Button>
                                </Box>
                                <Grid container spacing={2}>
                                    <Grid item xs={12} sm={6}>
                                        <Typography variant="caption" color="text.secondary">Type</Typography>
                                        <Typography variant="body2">
                                            {organization.organization_type?.type || 'N/A'}
                                        </Typography>
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <Typography variant="caption" color="text.secondary">Location</Typography>
                                        <Typography variant="body2">{getLocation()}</Typography>
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <Typography variant="caption" color="text.secondary">Website</Typography>
                                        <Typography variant="body2">
                                            {organization.website || 'N/A'}
                                        </Typography>
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <Typography variant="caption" color="text.secondary">Users</Typography>
                                        <Typography variant="body2">{users.length}</Typography>
                                    </Grid>
                                </Grid>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>

                {/* Tabs */}
                <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
                    <Tabs
                        value={activeTab}
                        onChange={handleTabChange}
                        sx={{
                            '& .MuiTab-root': {
                                textTransform: 'none',
                                fontWeight: 500,
                                color: colors.textSecondary
                            },
                            '& .Mui-selected': { color: colors.primary },
                            '& .MuiTabs-indicator': { backgroundColor: colors.primary }
                        }}
                    >
                        <Tab label="Users" />
                        <Tab label="Surveys" />
                    </Tabs>
                </Box>



                {/* Tab Content */}
                <Paper sx={{
                    borderRadius: 3,
                    overflow: 'hidden',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                    minHeight: 300,
                    //backgroundColor: colors.accentBg
                }}>
                    {activeTab === 0 && (
                        <Box sx={{ p: 3 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                <TextField
                                    placeholder="Search users..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    size="small"
                                    sx={{
                                        width: 300,
                                        '& .MuiOutlinedInput-root': {
                                            backgroundColor: 'white',
                                            borderRadius: 0
                                        }
                                    }}
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <SearchIcon color="action" />
                                            </InputAdornment>
                                        ),
                                    }}
                                />
                                <Box>
                                    <Button
                                        variant="contained"
                                        startIcon={<AddIcon />}
                                        onClick={() => navigate('/users/add', {
                                            state: {
                                                returnUrl: `/organization-management/${id}`,
                                                organizationId: parseInt(id)
                                            }
                                        })}
                                        sx={{
                                            backgroundColor: colors.primary,
                                            '&:hover': { backgroundColor: colors.secondary },
                                            textTransform: 'none',
                                            borderRadius: 2
                                        }}
                                    >
                                        Add User
                                    </Button>
                                    <Button
                                        variant="outlined"
                                        startIcon={<NotificationsActiveIcon />}
                                        onClick={handleBulkReminders}
                                        sx={{
                                            ml: 2,
                                            color: colors.primary,
                                            borderColor: colors.primary,
                                            '&:hover': {
                                                borderColor: colors.secondary,
                                                backgroundColor: 'rgba(99, 51, 148, 0.04)'
                                            },
                                            textTransform: 'none',
                                            borderRadius: 2
                                        }}
                                    >
                                        Send Reminders ({selectedUsers.length})
                                    </Button>
                                </Box>
                            </Box>

                            {filteredUsers.length === 0 ? (
                                <Box sx={{ textAlign: 'center', py: 4 }}>
                                    <Typography color="text.secondary">
                                        No users found in this organization
                                    </Typography>
                                </Box>
                            ) : (
                                <>
                                    <TableContainer component={Paper} sx={{ borderRadius: 2, boxShadow: 'none', border: `1px solid ${colors.borderColor}` }}>
                                        <Table>
                                            <TableHead sx={{ backgroundColor: '#b39ddb' }}>
                                                <TableRow>
                                                    <TableCell padding="checkbox">
                                                        <Checkbox
                                                            color="default"
                                                            sx={{ color: colors.primary }}
                                                            indeterminate={selectedUsers.length > 0 && selectedUsers.length < filteredUsers.filter(u => !u.has_completed_survey).length}
                                                            checked={filteredUsers.length > 0 && selectedUsers.length === filteredUsers.filter(u => !u.has_completed_survey).length}
                                                            onChange={handleSelectAllClick}
                                                            inputProps={{
                                                                'aria-label': 'select all users',
                                                            }}
                                                        />
                                                    </TableCell>
                                                    <TableCell sortDirection={orderBy === 'name' ? order : false} sx={{ color: colors.primary, fontWeight: 'bold' }}>
                                                        <TableSortLabel
                                                            active={orderBy === 'name'}
                                                            direction={orderBy === 'name' ? order : 'asc'}
                                                            onClick={() => handleRequestSort('name')}
                                                            sx={{
                                                                color: `${colors.primary} !important`,
                                                                '& .MuiTableSortLabel-icon': {
                                                                    color: `${colors.primary} !important`,
                                                                },
                                                            }}
                                                        >
                                                            Name
                                                        </TableSortLabel>
                                                    </TableCell>
                                                    <TableCell sortDirection={orderBy === 'email' ? order : false} sx={{ color: colors.primary, fontWeight: 'bold' }}>
                                                        <TableSortLabel
                                                            active={orderBy === 'email'}
                                                            direction={orderBy === 'email' ? order : 'asc'}
                                                            onClick={() => handleRequestSort('email')}
                                                            sx={{
                                                                color: `${colors.primary} !important`,
                                                                '& .MuiTableSortLabel-icon': {
                                                                    color: `${colors.primary} !important`,
                                                                },
                                                            }}
                                                        >
                                                            Email
                                                        </TableSortLabel>
                                                    </TableCell>
                                                    <TableCell sortDirection={orderBy === 'role' ? order : false} sx={{ color: colors.primary, fontWeight: 'bold' }}>
                                                        <TableSortLabel
                                                            active={orderBy === 'role'}
                                                            direction={orderBy === 'role' ? order : 'asc'}
                                                            onClick={() => handleRequestSort('role')}
                                                            sx={{
                                                                color: `${colors.primary} !important`,
                                                                '& .MuiTableSortLabel-icon': {
                                                                    color: `${colors.primary} !important`,
                                                                },
                                                            }}
                                                        >
                                                            Role
                                                        </TableSortLabel>
                                                    </TableCell>
                                                    <TableCell sx={{ color: colors.primary, fontWeight: 'bold' }}>Address</TableCell>
                                                    <TableCell sortDirection={orderBy === 'is_active' ? order : false} sx={{ color: colors.primary, fontWeight: 'bold' }}>
                                                        <TableSortLabel
                                                            active={orderBy === 'is_active'}
                                                            direction={orderBy === 'is_active' ? order : 'asc'}
                                                            onClick={() => handleRequestSort('is_active')}
                                                            sx={{
                                                                color: `${colors.primary} !important`,
                                                                '& .MuiTableSortLabel-icon': {
                                                                    color: `${colors.primary} !important`,
                                                                },
                                                            }}
                                                        >
                                                            Status
                                                        </TableSortLabel>
                                                    </TableCell>
                                                    <TableCell sx={{ color: colors.primary, fontWeight: 'bold' }}>Survey Status</TableCell>
                                                    <TableCell sx={{ color: colors.primary, fontWeight: 'bold', textAlign: 'right' }}>Actions</TableCell>
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                {stableSort(filteredUsers, getComparator(order, orderBy))
                                                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                                                    .map((user) => {
                                                        const isUserSelected = isSelected(user.id);
                                                        const labelId = `enhanced-table-checkbox-${user.id}`;

                                                        return (
                                                            <TableRow
                                                                hover
                                                                onClick={(event) => {
                                                                    if (!user.has_completed_survey) {
                                                                        handleSelectClick(event, user.id);
                                                                    }
                                                                }}
                                                                role="checkbox"
                                                                aria-checked={isUserSelected}
                                                                tabIndex={-1}
                                                                key={user.id}
                                                                selected={isUserSelected}
                                                                sx={{ cursor: !user.has_completed_survey ? 'pointer' : 'default' }}
                                                            >
                                                                <TableCell padding="checkbox">
                                                                    <Checkbox
                                                                        color="primary"
                                                                        checked={isUserSelected}
                                                                        disabled={user.has_completed_survey} // Disable if already completed
                                                                        onChange={(event) => handleSelectClick(event, user.id)}
                                                                        inputProps={{
                                                                            'aria-labelledby': labelId,
                                                                        }}
                                                                    />
                                                                </TableCell>
                                                                <TableCell component="th" id={labelId} scope="row">
                                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                                                        <Avatar sx={{
                                                                            bgcolor: user.has_completed_survey ? '#e8f5e9' : colors.accentBg,
                                                                            color: user.has_completed_survey ? '#2e7d32' : colors.primary
                                                                        }}>
                                                                            {user.firstname ? user.firstname[0].toUpperCase() : <PersonIcon />}
                                                                        </Avatar>
                                                                        <Box>
                                                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                                                <Typography variant="body2" fontWeight="bold" sx={{ maxWidth: 150, whiteSpace: 'normal', wordBreak: 'break-word' }}>
                                                                                    {user.firstname} {user.lastname}
                                                                                </Typography>
                                                                                {user.role === 'manager' && (
                                                                                    <Tooltip title="Account Holder (Manager)">
                                                                                        <StarIcon sx={{ fontSize: 16, color: '#FFD700' }} />
                                                                                    </Tooltip>
                                                                                )}
                                                                            </Box>
                                                                            <Typography variant="caption" color="text.secondary">
                                                                                @{user.username}
                                                                            </Typography>
                                                                        </Box>
                                                                    </Box>
                                                                </TableCell>
                                                                <TableCell>
                                                                    <Typography variant="body2" color="text.secondary">
                                                                        {user.email}
                                                                    </Typography>
                                                                </TableCell>
                                                                <TableCell>
                                                                    <Stack direction="column" spacing={0.5}>
                                                                        {/* System Roles */}
                                                                        {(user.roles && user.roles.length > 0) ? (
                                                                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                                                                {user.roles.map((r, idx) => (
                                                                                    <Chip
                                                                                        key={`role-${idx}`}
                                                                                        label={r}
                                                                                        size="small"
                                                                                        sx={{
                                                                                            bgcolor: r === 'admin' ? '#e3f2fd' : '#f5f5f5',
                                                                                            color: r === 'admin' ? '#1565c0' : '#616161',
                                                                                            fontWeight: 500,
                                                                                            textTransform: 'capitalize'
                                                                                        }}
                                                                                    />
                                                                                ))}
                                                                            </Box>
                                                                        ) : (
                                                                            <Chip
                                                                                label={user.role === 'other' ? 'Custom Role' : (user.role || 'User')}
                                                                                size="small"
                                                                                sx={{
                                                                                    bgcolor: user.role === 'admin' ? '#e3f2fd' : '#f5f5f5',
                                                                                    color: user.role === 'admin' ? '#1565c0' : '#616161',
                                                                                    fontWeight: 500,
                                                                                    textTransform: 'capitalize'
                                                                                }}
                                                                            />
                                                                        )}

                                                                        {/* Organizational Titles */}
                                                                        {(user.titles && user.titles.length > 0) && (
                                                                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                                                                                {user.titles.map((t, idx) => (
                                                                                    <Chip
                                                                                        key={`title-${idx}`}
                                                                                        label={t.name}
                                                                                        size="small"
                                                                                        variant="outlined"
                                                                                        sx={{
                                                                                            fontWeight: 400,
                                                                                            fontSize: '0.75rem',
                                                                                            borderColor: '#ddd'
                                                                                        }}
                                                                                    />
                                                                                ))}
                                                                            </Box>
                                                                        )}
                                                                    </Stack>
                                                                </TableCell>
                                                                <TableCell>
                                                                    <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 200, whiteSpace: 'normal', wordBreak: 'break-word' }}>
                                                                        {formatAddress(user.geo_location)}
                                                                    </Typography>
                                                                </TableCell>
                                                                <TableCell>
                                                                    <Chip
                                                                        label="Active"
                                                                        size="small"
                                                                        sx={{
                                                                            bgcolor: '#e8f5e9',
                                                                            color: '#2e7d32',
                                                                            fontWeight: 500
                                                                        }}
                                                                    />
                                                                </TableCell>
                                                                <TableCell>
                                                                    <Chip
                                                                        label={user.has_completed_survey ? 'Completed' : 'Pending'}
                                                                        size="small"
                                                                        sx={{
                                                                            bgcolor: user.has_completed_survey ? '#e8f5e9' : '#fff3e0',
                                                                            color: user.has_completed_survey ? '#2e7d32' : '#e65100',
                                                                            fontWeight: 500
                                                                        }}
                                                                    />
                                                                </TableCell>
                                                                <TableCell align="right">
                                                                    <Stack direction="row" spacing={1} justifyContent="flex-end">
                                                                        {!user.has_completed_survey && (
                                                                            <Tooltip title="Send Reminder">
                                                                                <IconButton
                                                                                    size="small"
                                                                                    onClick={() => handleOpenReminderDialog(user)}
                                                                                    sx={{ color: colors.primary }}
                                                                                >
                                                                                    <NotificationsActiveIcon fontSize="small" />
                                                                                </IconButton>
                                                                            </Tooltip>
                                                                        )}
                                                                        <Tooltip title="View Details">
                                                                            <IconButton
                                                                                size="small"
                                                                                sx={{ color: colors.primary }}
                                                                                onClick={() => alert(`User Details:\nName: ${user.firstname} ${user.lastname}\nEmail: ${user.email}`)}
                                                                            >
                                                                                <VisibilityIcon fontSize="small" />
                                                                            </IconButton>
                                                                        </Tooltip>
                                                                        <Tooltip title="Edit">
                                                                            <IconButton
                                                                                size="small"
                                                                                color="primary"
                                                                                onClick={() => handleEditUserClick(user)}
                                                                            >
                                                                                <EditIcon fontSize="small" />
                                                                            </IconButton>
                                                                        </Tooltip>
                                                                        <Tooltip title="Remove from Organization">
                                                                            <IconButton
                                                                                size="small"
                                                                                color="error"
                                                                                onClick={() => handleDeleteUser(user)}
                                                                            >
                                                                                <DeleteIcon fontSize="small" />
                                                                            </IconButton>
                                                                        </Tooltip>
                                                                    </Stack>
                                                                </TableCell>
                                                            </TableRow>
                                                        );
                                                    })}
                                            </TableBody>
                                        </Table>
                                    </TableContainer>
                                    <TablePagination
                                        rowsPerPageOptions={[5, 10, 25]}
                                        component="div"
                                        count={filteredUsers.length}
                                        rowsPerPage={rowsPerPage}
                                        page={page}
                                        onPageChange={(e, newPage) => setPage(newPage)}
                                        onRowsPerPageChange={(e) => {
                                            setRowsPerPage(parseInt(e.target.value, 10));
                                            setPage(0);
                                        }}
                                    />
                                </>
                            )}
                        </Box>
                    )}

                    {activeTab === 1 && (
                        <Box sx={{ p: 0 }}>
                            {previewSurvey ? (
                                <Box sx={{ backgroundColor: 'white', borderRadius: 2, overflow: 'hidden' }}>
                                    <TemplatesTab
                                        templates={surveys}
                                        templateVersions={uniqueVersions}
                                        previewMode={true}
                                        initialTemplate={previewSurvey}
                                        onClose={() => setPreviewSurvey(null)}
                                        hideSidebar={false}
                                    />
                                </Box>
                            ) : selectedSurvey ? (
                                <Box sx={{ backgroundColor: 'white', borderRadius: 2, overflow: 'hidden' }}>
                                    <QuestionsTab
                                        templateVersions={uniqueVersions}
                                        templates={surveys}
                                        currentVersion={{ id: selectedSurvey.version_id, name: selectedSurvey.version_name || 'Generic Version' }}
                                        onRefreshData={() => {
                                            // Optional: Reload surveys
                                        }}
                                        onClose={() => setSelectedSurvey(null)}
                                        onPreview={(template) => setPreviewSurvey(template)}
                                        hideSidebar={false}
                                    />
                                </Box>
                            ) : (
                                <Box sx={{ p: 3 }}>
                                    <Box sx={{ display: 'flex', justifyContent: 'flex-start', mb: 2 }}>
                                        <TextField
                                            placeholder="Search surveys..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            size="small"
                                            sx={{
                                                width: 300,
                                                '& .MuiOutlinedInput-root': {
                                                    backgroundColor: 'white',
                                                    borderRadius: 0
                                                }
                                            }}
                                            InputProps={{
                                                startAdornment: (
                                                    <InputAdornment position="start">
                                                        <SearchIcon color="action" />
                                                    </InputAdornment>
                                                ),
                                            }}
                                        />
                                    </Box>
                                    {filteredSurveys.length === 0 ? (
                                        <Box sx={{ textAlign: 'center', py: 4 }}>
                                            <Typography color="text.secondary">
                                                {searchQuery ? 'No surveys found matching your search' : 'No surveys assigned to this organization'}
                                            </Typography>
                                        </Box>
                                    ) : (
                                        <TableContainer component={Paper} sx={{ borderRadius: 2, boxShadow: 'none', border: `1px solid ${colors.borderColor}` }}>
                                            <Table>
                                                <TableHead sx={{ backgroundColor: '#b39ddb' }}>
                                                    <TableRow>
                                                        <TableCell sx={{ color: colors.primary, fontWeight: 'bold' }}>Survey</TableCell>
                                                        <TableCell sx={{ color: colors.primary, fontWeight: 'bold' }}>Description</TableCell>
                                                        <TableCell sx={{ color: colors.primary, fontWeight: 'bold' }}>Organization Group</TableCell>
                                                        <TableCell sx={{ color: colors.primary, fontWeight: 'bold' }}>Created</TableCell>
                                                    </TableRow>
                                                </TableHead>
                                                <TableBody>
                                                    {filteredSurveys.map((survey) => (
                                                        <TableRow
                                                            key={survey.id}
                                                            onClick={() => navigate('/inventory', {
                                                                state: {
                                                                    selectedTemplate: survey,
                                                                    organizationId: id
                                                                }
                                                            })}
                                                            sx={{
                                                                cursor: 'pointer',
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
                                                                    <Typography variant="body1" fontWeight="600">
                                                                        {survey.survey_code}
                                                                    </Typography>
                                                                </Box>
                                                            </TableCell>
                                                            <TableCell>
                                                                <Typography
                                                                    variant="body2"
                                                                    color="text.secondary"
                                                                    sx={{
                                                                        maxWidth: 300,
                                                                        overflow: 'hidden',
                                                                        textOverflow: 'ellipsis',
                                                                        whiteSpace: 'nowrap'
                                                                    }}
                                                                >
                                                                    {survey.description || 'No description available'}
                                                                </Typography>
                                                            </TableCell>
                                                            <TableCell>
                                                                <Chip
                                                                    label={survey.version_name || 'Template'}
                                                                    size="small"
                                                                    sx={{
                                                                        backgroundColor: colors.accentBg,
                                                                        color: colors.primary,
                                                                        fontWeight: 500
                                                                    }}
                                                                />
                                                            </TableCell>
                                                            <TableCell>
                                                                <Typography variant="body2" color="text.secondary">
                                                                    {new Date(survey.created_at).toLocaleDateString()}
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
                        </Box>
                    )}


                </Paper>

                {/* Edit Drawer */}
                <Drawer
                    anchor="right"
                    open={editDrawerOpen}
                    onClose={handleEditClose}
                    PaperProps={{
                        sx: { width: 400, p: 3 }
                    }}
                >
                    <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
                        Edit Organization
                    </Typography>

                    <Tabs
                        value={editTab}
                        onChange={(e, v) => setEditTab(v)}
                        sx={{
                            mb: 3,
                            '& .MuiTab-root': { textTransform: 'none' },
                            '& .Mui-selected': { color: colors.primary },
                            '& .MuiTabs-indicator': { backgroundColor: colors.primary }
                        }}
                    >
                        <Tab label="Details" />
                        <Tab label="Address" />
                    </Tabs>

                    {editTab === 0 && (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <TextField
                                label="Organization Name"
                                value={editFormData.name}
                                onChange={(e) => handleEditFormChange('name', e.target.value)}
                                fullWidth
                                size="small"
                            />
                            <TextField
                                label="Website"
                                value={editFormData.website}
                                onChange={(e) => handleEditFormChange('website', e.target.value)}
                                fullWidth
                                size="small"
                            />
                            <TextField
                                label="Denomination/Affiliation"
                                value={editFormData.denomination_affiliation}
                                onChange={(e) => handleEditFormChange('denomination_affiliation', e.target.value)}
                                fullWidth
                                size="small"
                            />
                            <TextField
                                label="Accreditation"
                                value={editFormData.accreditation_status_or_body}
                                onChange={(e) => handleEditFormChange('accreditation_status_or_body', e.target.value)}
                                fullWidth
                                size="small"
                            />
                        </Box>
                    )}

                    {editTab === 1 && (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <TextField
                                label="Address Line 1"
                                value={editFormData.geo_location?.address_line1 || ''}
                                onChange={(e) => handleEditFormChange('geo_location.address_line1', e.target.value)}
                                fullWidth
                                size="small"
                            />
                            <TextField
                                label="Address Line 2"
                                value={editFormData.geo_location?.address_line2 || ''}
                                onChange={(e) => handleEditFormChange('geo_location.address_line2', e.target.value)}
                                fullWidth
                                size="small"
                            />
                            <TextField
                                label="City"
                                value={editFormData.geo_location?.city || ''}
                                onChange={(e) => handleEditFormChange('geo_location.city', e.target.value)}
                                fullWidth
                                size="small"
                            />
                            <TextField
                                label="Province/State"
                                value={editFormData.geo_location?.province || ''}
                                onChange={(e) => handleEditFormChange('geo_location.province', e.target.value)}
                                fullWidth
                                size="small"
                            />
                            <TextField
                                label="Country"
                                value={editFormData.geo_location?.country || ''}
                                onChange={(e) => handleEditFormChange('geo_location.country', e.target.value)}
                                fullWidth
                                size="small"
                            />
                            <TextField
                                label="Postal Code"
                                value={editFormData.geo_location?.postal_code || ''}
                                onChange={(e) => handleEditFormChange('geo_location.postal_code', e.target.value)}
                                fullWidth
                                size="small"
                            />
                        </Box>
                    )}

                    <Box sx={{ display: 'flex', gap: 2, mt: 'auto', pt: 3 }}>
                        <Button
                            variant="outlined"
                            color="error"
                            onClick={handleDelete}
                            sx={{ flex: 1 }}
                        >
                            Delete
                        </Button>
                        <Button
                            variant="contained"
                            onClick={handleSave}
                            disabled={saving}
                            sx={{
                                flex: 1,
                                backgroundColor: colors.primary,
                                '&:hover': { backgroundColor: colors.secondary }
                            }}
                        >
                            {saving ? 'Saving...' : 'Save'}
                        </Button>
                    </Box>
                </Drawer>

                {/* Edit User Dialog */}
                <Dialog
                    open={editUserDialogOpen}
                    onClose={handleEditUserClose}
                    maxWidth="md"
                    fullWidth
                >
                    <DialogTitle sx={{ backgroundColor: colors.primary, color: 'white' }}>
                        Edit User
                    </DialogTitle>
                    <DialogContent sx={{ pt: 3 }}>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 2 }}>
                            <Box sx={{ display: 'flex', gap: 2 }}>
                                <TextField
                                    label="First Name"
                                    value={editUserFormData.firstname}
                                    onChange={handleEditUserFormChange('firstname')}
                                    fullWidth
                                    required
                                />
                                <TextField
                                    label="Last Name"
                                    value={editUserFormData.lastname}
                                    onChange={handleEditUserFormChange('lastname')}
                                    fullWidth
                                    required
                                />
                            </Box>

                            <Box sx={{ display: 'flex', gap: 2 }}>
                                <TextField
                                    label="Email"
                                    value={editUserFormData.email}
                                    onChange={handleEditUserFormChange('email')}
                                    fullWidth
                                    required
                                    disabled // Email usually shouldn't be changed easily or needs verification
                                />
                                {/* Title Dropdown - Multi-select */}
                                <Autocomplete
                                    multiple
                                    value={titles.filter(t => (editUserFormData.titles || []).includes(t.id))}
                                    onChange={(event, newValue) => {
                                        setEditUserFormData({
                                            ...editUserFormData,
                                            titles: newValue.map(v => v.id),
                                            title_id: newValue.length > 0 ? newValue[0].id : ''
                                        });
                                    }}
                                    options={titles}
                                    getOptionLabel={(option) => option.name}
                                    renderTags={(value, getTagProps) =>
                                        value.map((option, index) => {
                                            const { key, ...tagProps } = getTagProps({ index });
                                            return (
                                                <Chip
                                                    key={key}
                                                    variant="outlined"
                                                    label={option.name}
                                                    size="small"
                                                    {...tagProps}
                                                />
                                            );
                                        })
                                    }
                                    renderInput={(params) => (
                                        <TextField
                                            {...params}
                                            label="Titles"
                                            variant="outlined"
                                            placeholder="Select Titles"
                                        />
                                    )}
                                    isOptionEqualToValue={(option, value) => option.id === value.id}
                                    sx={{ minWidth: 250 }}
                                />
                                {/* Role Dropdown - Multi-select */}
                                <FormControl fullWidth>
                                    <InputLabel>Roles</InputLabel>
                                    <Select
                                        multiple
                                        value={editUserFormData.roles || []}
                                        onChange={(e) => {
                                            const value = e.target.value;
                                            setEditUserFormData({
                                                ...editUserFormData,
                                                roles: typeof value === 'string' ? value.split(',') : value,
                                                role: (typeof value === 'string' ? value.split(',') : value)[0] || 'user'
                                            });
                                        }}
                                        label="Roles"
                                        renderValue={(selected) => (
                                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                                {selected.map((value) => (
                                                    <Chip key={value} label={getAvailableRoles().find(r => r.value === value)?.label || value} size="small" />
                                                ))}
                                            </Box>
                                        )}
                                    >
                                        {getAvailableRoles().map((role) => (
                                            <MenuItem key={role.value} value={role.value}>
                                                {role.label}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Box>

                            <EnhancedAddressInput
                                label="Address"
                                initialValue={editUserFormData.geo_location}
                                onPlaceSelect={handleUserAddressSelect}
                            />
                        </Box>
                    </DialogContent>
                    <DialogActions sx={{ p: 3 }}>
                        <Button
                            onClick={handleEditUserClose}
                            color="inherit"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleUpdateUser}
                            variant="contained"
                            disabled={savingUser}
                            sx={{
                                backgroundColor: colors.primary,
                                '&:hover': { backgroundColor: colors.secondary }
                            }}
                        >
                            {savingUser ? 'Saving...' : 'Update User'}
                        </Button>
                    </DialogActions>
                </Dialog>

                {/* Bulk Reminder Dialog */}
                <Dialog open={bulkReminderDialog} onClose={handleCloseBulkReminderDialog} maxWidth="md" fullWidth>
                    <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <SendIcon />
                        Send Bulk Reminder Emails
                    </DialogTitle>
                    <DialogContent>
                        <DialogContentText sx={{ mb: 2 }}>
                            Send reminder emails to {selectedUsers.length} selected users who haven't completed their surveys.
                        </DialogContentText>

                        {/* Selected Users List (Collapsible/Scrollable) */}
                        <Box sx={{ mb: 2, border: '1px solid #e0e0e0', borderRadius: 1, p: 1 }}>
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1, px: 1 }}>
                                Recipients ({selectedUsers.length}):
                            </Typography>
                            <Box sx={{ maxHeight: 100, overflow: 'auto', px: 1 }}>
                                {selectedUsers.map(userId => {
                                    const user = users.find(u => u.id === userId);
                                    return user ? (
                                        <Chip
                                            key={userId}
                                            label={`${user.firstname || user.username} (${user.email})`}
                                            size="small"
                                            sx={{ mr: 0.5, mb: 0.5 }}
                                            onDelete={() => {
                                                const newSelected = selectedUsers.filter(id => id !== userId);
                                                setSelectedUsers(newSelected);
                                                if (newSelected.length === 0) handleCloseBulkReminderDialog();
                                            }}
                                        />
                                    ) : null;
                                })}
                            </Box>
                        </Box>

                        {/* Template Selection */}
                        <Box sx={{ mb: 3 }}>
                            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>
                                Email Template Selection
                            </Typography>
                            <FormControl fullWidth size="small">
                                <InputLabel>Select Email Template</InputLabel>
                                <Select
                                    value={selectedTemplateId}
                                    onChange={(e) => handleTemplateChange(e.target.value)}
                                    label="Select Email Template"
                                    disabled={loadingTemplates}
                                >
                                    <MenuItem value="">
                                        <em>Use Default (Institution-specific or System Default)</em>
                                    </MenuItem>
                                    {availableTemplates.map((template) => (
                                        <MenuItem key={template.id} value={template.id.toString()}>
                                            {template.name}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Box>

                        {/* Template Preview */}
                        {templatePreview && (
                            <Box sx={{ mb: 2, p: 2, bgcolor: '#f8f9fa', borderRadius: 1, border: '1px solid #e0e0e0' }}>
                                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold', color: colors.primary }}>
                                    Template Preview: {templatePreview.name}
                                </Typography>
                                <Typography variant="body2">
                                    <strong>Subject:</strong> {templatePreview.subject}
                                </Typography>
                            </Box>
                        )}

                        {reminderStatus.sending && (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                                <CircularProgress size={20} />
                                <Typography>Sending bulk reminder emails...</Typography>
                            </Box>
                        )}

                        {reminderStatus.results && !showReminderResults && (
                            <Alert
                                severity={reminderStatus.results.success ? 'success' : 'error'}
                                sx={{ mb: 2 }}
                            >
                                {reminderStatus.results.message}
                            </Alert>
                        )}

                        {/* Email Preview Section */}
                        <Box sx={{ mt: 2 }}>
                            <Button
                                variant="outlined"
                                startIcon={<PreviewIcon />}
                                endIcon={showEmailPreview ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                                onClick={() => setShowEmailPreview(!showEmailPreview)}
                                size="small"
                                sx={{ mb: 2 }}
                            >
                                {showEmailPreview ? 'Hide Sample Email' : 'Preview Sample Email'}
                            </Button>

                            {showEmailPreview && selectedUsers.length > 0 && (
                                <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 1, overflow: 'hidden' }}>
                                    <Box sx={{ bgcolor: '#f5f5f5', p: 2, borderBottom: 1, borderColor: 'divider' }}>
                                        <Typography variant="subtitle2" sx={{ mb: 1 }}>
                                            Sample Email Preview (for first selected user)
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
                                            <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                                                <CircularProgress size={20} />
                                                <Typography sx={{ ml: 2 }}>Loading preview...</Typography>
                                            </Box>
                                        ) : emailPreviewContent ? (
                                            <Box>
                                                <Box sx={{ mb: 2, p: 1, bgcolor: '#f5f5f5', borderRadius: 1 }}>
                                                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                                        Subject: {emailPreviewContent.subject}
                                                    </Typography>
                                                </Box>

                                                {emailPreviewType === 'text' ? (
                                                    <Box sx={{
                                                        bgcolor: '#fafafa',
                                                        p: 2,
                                                        borderRadius: 1,
                                                        maxHeight: 200,
                                                        overflow: 'auto',
                                                        fontFamily: 'monospace',
                                                        fontSize: '0.875rem',
                                                        whiteSpace: 'pre-wrap'
                                                    }}>
                                                        {emailPreviewContent.text}
                                                    </Box>
                                                ) : (
                                                    <Box sx={{
                                                        border: 1,
                                                        borderColor: 'divider',
                                                        borderRadius: 1,
                                                        maxHeight: 200,
                                                        overflow: 'auto'
                                                    }}>
                                                        <iframe
                                                            srcDoc={emailPreviewContent.html}
                                                            style={{
                                                                width: '100%',
                                                                height: '200px',
                                                                border: 'none'
                                                            }}
                                                            title="Bulk Email HTML Preview"
                                                        />
                                                    </Box>
                                                )}
                                            </Box>
                                        ) : (
                                            <Typography color="text.secondary">No preview available</Typography>
                                        )}
                                    </Box>
                                </Box>
                            )}
                        </Box>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={handleCloseBulkReminderDialog}>Cancel</Button>
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
                <Dialog open={showReminderResults} onClose={handleCloseBulkReminderDialog} maxWidth="md" fullWidth>
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
                        <Button onClick={handleCloseBulkReminderDialog} variant="contained">Close</Button>
                    </DialogActions>
                </Dialog>

                {/* Reminder Dialog */}
                <Dialog open={openReminderDialog} onClose={handleCloseReminderDialog} maxWidth="md" fullWidth>
                    <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <EmailIcon />
                        Send Reminder Email
                    </DialogTitle>
                    <DialogContent>
                        <DialogContentText sx={{ mb: 2 }}>
                            Send a survey completion reminder to the selected user.
                        </DialogContentText>

                        {selectedRecipient && (
                            <Box sx={{ mb: 3, p: 2, bgcolor: colors.accentBg, borderRadius: 1 }}>
                                <Typography variant="body2"><strong>User:</strong> {selectedRecipient.firstname} {selectedRecipient.lastname}</Typography>
                                <Typography variant="body2"><strong>Email:</strong> {selectedRecipient.email}</Typography>
                                <Typography variant="body2"><strong>Organization:</strong> {organization.name}</Typography>
                            </Box>
                        )}

                        {/* Template Selection */}
                        <Box sx={{ mb: 3 }}>
                            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>
                                Email Template Selection
                            </Typography>
                            <FormControl fullWidth size="small">
                                <InputLabel>Select Email Template</InputLabel>
                                <Select
                                    value={selectedTemplateId}
                                    onChange={(e) => handleTemplateChange(e.target.value)}
                                    label="Select Email Template"
                                    disabled={loadingTemplates}
                                >
                                    <MenuItem value="">
                                        <em>Use Default (Institution-specific or System Default)</em>
                                    </MenuItem>
                                    {availableTemplates.map((template) => (
                                        <MenuItem key={template.id} value={template.id.toString()}>
                                            {template.name}
                                        </MenuItem>
                                    ))}
                                </Select>
                                {loadingTemplates && (
                                    <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                                        <CircularProgress size={16} sx={{ mr: 1 }} />
                                        <Typography variant="caption" color="text.secondary">
                                            Loading templates...
                                        </Typography>
                                    </Box>
                                )}
                            </FormControl>
                        </Box>

                        {/* Template Preview */}
                        {templatePreview && (
                            <Box sx={{ mb: 2, p: 2, bgcolor: '#f8f9fa', borderRadius: 1, border: '1px solid #e0e0e0' }}>
                                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold', color: colors.primary }}>
                                    Template Preview: {templatePreview.name}
                                </Typography>
                                <Typography variant="body2" sx={{ mb: 1 }}>
                                    <strong>Subject:</strong> {templatePreview.subject}
                                </Typography>
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
                            </Alert>
                        )}

                        {/* Email Preview Section */}
                        <Box sx={{ mt: 3 }}>
                            <Button
                                variant="contained"
                                startIcon={<PreviewIcon />}
                                endIcon={showEmailPreview ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                                onClick={() => setShowEmailPreview(!showEmailPreview)}
                                sx={{
                                    mb: 2,
                                    backgroundColor: '#967CB2',
                                    '&:hover': { backgroundColor: '#8a6fa6' }
                                }}
                            >
                                {showEmailPreview ? 'Hide Email Preview' : 'Preview Email Content'}
                            </Button>

                            {showEmailPreview && selectedRecipient && (
                                <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 1, overflow: 'hidden' }}>
                                    <Box sx={{ bgcolor: '#f5f5f5', p: 2, borderBottom: 1, borderColor: 'divider' }}>
                                        <Typography variant="h6" sx={{ mb: 1 }}>
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
                                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', p: 4 }}>
                                                <CircularProgress size={24} sx={{ mr: 2 }} />
                                                <Typography>Loading email preview...</Typography>
                                            </Box>
                                        ) : emailPreviewContent ? (
                                            <Box>
                                                <Box sx={{ mb: 2, p: 1, bgcolor: '#f5f5f5', borderRadius: 1 }}>
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
                                                        maxHeight: 250,
                                                        overflow: 'auto',
                                                        fontFamily: 'monospace',
                                                        fontSize: '0.875rem',
                                                        whiteSpace: 'pre-wrap'
                                                    }}>
                                                        {emailPreviewContent.text}
                                                    </Box>
                                                ) : (
                                                    <Box sx={{
                                                        border: 1,
                                                        borderColor: 'divider',
                                                        borderRadius: 1,
                                                        maxHeight: 250,
                                                        overflow: 'auto'
                                                    }}>
                                                        <iframe
                                                            srcDoc={emailPreviewContent.html}
                                                            style={{
                                                                width: '100%',
                                                                height: '250px',
                                                                border: 'none'
                                                            }}
                                                            title="Email HTML Preview"
                                                        />
                                                    </Box>
                                                )}
                                            </Box>
                                        ) : (
                                            <Typography align="center" color="text.secondary" py={2}>
                                                Preview not available
                                            </Typography>
                                        )}
                                    </Box>
                                </Box>
                            )}
                        </Box>
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
                                {reminderStatus.sending ? 'Sending...' : 'Send Reminder'}
                            </Button>
                        )}
                    </DialogActions>
                </Dialog>
            </Container >
            {/* Account Manager Selection Dialog */}
            {/* Account Manager Selection Dialog */}
            <Dialog open={openAccountManagerDialog} onClose={handleCloseAccountManagerDialog} maxWidth="md" fullWidth>
                <DialogTitle>Assign Account Managers</DialogTitle>
                <DialogContent dividers>
                    <DialogContentText sx={{ mb: 2 }}>
                        Select users to assign as Account Managers for this organization.
                    </DialogContentText>
                    {users.length === 0 ? (
                        <Typography color="text.secondary">No users found in this organization.</Typography>
                    ) : (
                        <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 400 }}>
                            <Table stickyHeader size="small">
                                <TableHead>
                                    <TableRow>
                                        <TableCell padding="checkbox">
                                            {/* Header checkbox if needed, usually single toggle per row is enough for this list */}
                                        </TableCell>
                                        <TableCell>User</TableCell>
                                        <TableCell>Current Role</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {users.map((user) => {
                                        const isSelected = selectedManagerIds.indexOf(user.id) !== -1;
                                        return (
                                            <TableRow
                                                hover
                                                onClick={() => handleToggleManager(user.id)}
                                                role="checkbox"
                                                aria-checked={isSelected}
                                                tabIndex={-1}
                                                key={user.id}
                                                selected={isSelected}
                                                sx={{ cursor: 'pointer' }}
                                            >
                                                <TableCell padding="checkbox">
                                                    <Checkbox
                                                        checked={isSelected}
                                                        inputProps={{ 'aria-labelledby': `user-lbl-${user.id}` }}
                                                    />
                                                </TableCell>
                                                <TableCell component="th" id={`user-lbl-${user.id}`} scope="row">
                                                    <Box>
                                                        <Typography variant="body2" fontWeight="medium">
                                                            {user.firstname} {user.lastname}
                                                        </Typography>
                                                        <Typography variant="caption" color="text.secondary">
                                                            {user.username}
                                                        </Typography>
                                                    </Box>
                                                </TableCell>
                                                <TableCell>
                                                    {user.role}
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseAccountManagerDialog} sx={{ color: 'text.secondary' }}>Cancel</Button>
                    <Button
                        onClick={handleSaveAccountManagers}
                        variant="contained"
                        disabled={saving}
                        sx={{
                            backgroundColor: colors.primary,
                            '&:hover': {
                                backgroundColor: colors.secondary
                            }
                        }}
                    >
                        {saving ? 'Saving...' : 'Save Changes'}
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
}

export default OrganizationDetailPage;
