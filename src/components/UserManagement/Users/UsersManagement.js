import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Box, Typography, Button, Paper, IconButton, Dialog, DialogActions,
    DialogContent, DialogTitle, TextField, Select, MenuItem, FormControl,
    InputLabel, InputAdornment, Card, CardContent, Grid, Chip, useTheme,
    Autocomplete, CircularProgress, Tooltip, Stack, Collapse,
    Alert, Snackbar
} from '@mui/material';
import DataTable from '../../shared/DataTable/DataTable';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import VisibilityIcon from '@mui/icons-material/Visibility';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SendIcon from '@mui/icons-material/Send';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import AssignmentIcon from '@mui/icons-material/Assignment';

import {
    fetchUsers, addUser, updateUser, deleteUser,
    fetchOrganizations, fetchRoles, fetchTitles, uploadUserFile, addRole,
    addUserOrganizationalTitle, fetchUserOrganizationalTitles,
    updateUserOrganizationalTitles, fetchTemplatesByOrganization
} from '../../../services/UserManagement/UserManagementService';
import InventoryService from '../../../services/Admin/Inventory/InventoryService';
import { EmailService } from '../../../services/EmailService';
// import GooglePlacesAutocomplete from '../common/GooglePlacesAutocomplete';
// import GooglePlacesAutocomplete from '../common/GooglePlacesAutocompleteSimple';
// import ManualAddressInput from '../common/ManualAddressInput';
import MapAddressSelector from '../common/MapAddressSelector';
import EnhancedAddressInput from '../common/EnhancedAddressInput';
import EmailPreviewDialog from '../common/EmailPreviewDialog';
import SurveyAssignmentCard from './SurveyAssignmentCard';

function UsersManagement({ openUploadDialog: openUploadDialogProp, setOpenUploadDialog: setOpenUploadDialogProp, onUserCountChange }) {
    const theme = useTheme();
    const navigate = useNavigate();

    // State variables
    const [users, setUsers] = useState([]);
    const [organizations, setOrganizations] = useState([]);
    const [roles, setRoles] = useState([]);
    const [titles, setTitles] = useState([]);
    const [templates, setTemplates] = useState([]);
    const [emailTemplates, setEmailTemplates] = useState([]);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);


    // Dialog states
    const [openAddDialog, setOpenAddDialog] = useState(false);
    const [openEditDialog, setOpenEditDialog] = useState(false);
    const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
    const [openEmailDialog, setOpenEmailDialog] = useState(false);
    const [openEmailPreviewDialog, setOpenEmailPreviewDialog] = useState(false);


    // Form states
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        ui_role: 'user',
        firstname: '',
        lastname: '',
        phone: '',
        organization_id: '',
        template_id: '',
        email_template_id: '',
        organization_id: '',
        template_id: '',
        email_template_id: '',
        roles: [],
        system_roles: [], // For multi-select system roles (strings)
        title_ids: [],    // For multi-select titles (IDs)
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
            latitude: 0,
            longitude: 0
        }
    });

    const [selectedUser, setSelectedUser] = useState(null);
    const [selectedFile, setSelectedFile] = useState(null);
    const [uploadStatus, setUploadStatus] = useState('');
    const [newRoleName, setNewRoleName] = useState('');
    const [roleSearchText, setRoleSearchText] = useState('');
    const [isAddingNewRole, setIsAddingNewRole] = useState(false);
    const [roleLoading, setRoleLoading] = useState(false);
    const [addingOrganizationalTitle, setAddingOrganizationalTitle] = useState(false);
    const [emailPreviewLoading, setEmailPreviewLoading] = useState(false);
    const [selectedEmailTemplate, setSelectedEmailTemplate] = useState(null);
    const [emailPreviewDialogOpen, setEmailPreviewDialogOpen] = useState(false);

    // New state variables for improved organizational titles workflow
    const [selectedOrganizationId, setSelectedOrganizationId] = useState('');
    const [selectedRoleType, setSelectedRoleType] = useState('');
    const [organizationalTitleToAdd, setOrganizationalTitleToAdd] = useState('');

    // Email dialog states
    const [emailData, setEmailData] = useState({
        to: '',
        subject: '',
        body: '',
        username: '',
        password: '',
        firstname: ''
    });
    const [emailSending, setEmailSending] = useState(false);
    const [emailSent, setEmailSent] = useState(false);

    // Email preview states for Add User dialog
    const [showEmailPreview, setShowEmailPreview] = useState(false);
    const [emailPreviewData, setEmailPreviewData] = useState({
        textVersion: '',
        htmlVersion: '',
        subject: '',
        to: ''
    });
    const [emailPreviewType, setEmailPreviewType] = useState('text'); // 'text' or 'html'

    // Google Places state
    const [addressSearch, setAddressSearch] = useState('');

    // Search, Filter, and Sort states
    const [searchTerm, setSearchTerm] = useState('');
    const [filterOrganization, setFilterOrganization] = useState('');
    const [filterRole, setFilterRole] = useState('');
    const [sortBy, setSortBy] = useState('username');
    const [sortOrder, setSortOrder] = useState('asc');

    // Bulk selection state
    const [selectedUserIds, setSelectedUserIds] = useState([]);
    const [openBulkDeleteDialog, setOpenBulkDeleteDialog] = useState(false);
    const [openBulkReminderDialog, setOpenBulkReminderDialog] = useState(false);
    const [bulkActionLoading, setBulkActionLoading] = useState(false);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });

    // Selected user for viewing survey assignments
    const [selectedUserForView, setSelectedUserForView] = useState(null);
    const [userAssignments, setUserAssignments] = useState([]);
    const [loadingAssignments, setLoadingAssignments] = useState(false);
    const [surveyTemplates, setSurveyTemplates] = useState([]);
    const [selectedSurveyTemplate, setSelectedSurveyTemplate] = useState('');

    // Generate email preview content using backend EmailService
    const generateWelcomeEmailPreview = async () => {
        try {
            setEmailPreviewLoading(true);

            const firstname = formData.firstname || 'User';
            const username = formData.username || 'your-username';
            const email = formData.email || 'user@example.com';
            const password = formData.password || 'auto-generated-password';
            const organizationName = formData.organization_id ?
                organizations.find(org => org.id === parseInt(formData.organization_id))?.name || 'Organization' :
                'Organization';

            // Generate a sample survey code (UUID format)
            const surveyCode = `survey-${Math.random().toString(36).substr(2, 9)}-${Date.now().toString(36)}`;

            // Prepare variables for email template
            const templateVariables = {
                greeting: `Dear ${firstname}`,
                username: username,
                email: email,
                password: password,
                survey_code: surveyCode,
                organization_name: organizationName,
                first_name: firstname,
                last_name: formData.lastname || '',
                login_url: 'https://platform.saurara.com/login',
                survey_url: `https://platform.saurara.com/survey/${surveyCode}`,
                support_email: 'support@saurara.com',
                user_fullname: `${firstname} ${formData.lastname || ''}`.trim(),
                platform_name: 'Saurara Platform',
                current_date: new Date().toLocaleDateString(),
                current_year: new Date().getFullYear().toString(),
            };

            // Get rendered email template from backend
            let renderedPreview;

            if (formData.email_template_id) {
                // Use specific template if selected
                renderedPreview = await EmailService.renderPreview(null, templateVariables, parseInt(formData.email_template_id));
            } else {
                // Use default template for organization or system default
                const organizationId = formData.organization_id ? parseInt(formData.organization_id) : null;
                console.log(`Using organization ID: ${organizationId} for template lookup`);
                renderedPreview = await EmailService.renderPreview('welcome', templateVariables, null, organizationId);
            }

            setEmailPreviewData({
                textVersion: renderedPreview.text_body || 'No text version available',
                htmlVersion: renderedPreview.html_body || 'No HTML version available',
                subject: renderedPreview.subject || 'Welcome to Saurara!',
                to: email
            });

        } catch (error) {
            console.error('Error generating email preview:', error);
            // Fallback to simple preview on error
            setEmailPreviewData({
                textVersion: `Welcome to Saurara!\n\nDear ${formData.firstname || 'User'},\n\nYour account has been created successfully.\nUsername: ${formData.username || 'your-username'}\nEmail: ${formData.email || 'user@example.com'}\n\nBest regards,\nThe Saurara Team`,
                htmlVersion: `<h2>Welcome to Saurara!</h2><p>Dear ${formData.firstname || 'User'},</p><p>Your account has been created successfully.</p><p><strong>Username:</strong> ${formData.username || 'your-username'}<br><strong>Email:</strong> ${formData.email || 'user@example.com'}</p><p>Best regards,<br>The Saurara Team</p>`,
                subject: 'Welcome to Saurara!',
                to: formData.email || 'user@example.com'
            });
        } finally {
            setEmailPreviewLoading(false);
        }
    };

    // Load data on component mount
    useEffect(() => {
        loadUsers();
        loadOrganizations();
        loadRoles();
        loadTitles();
    }, []);

    // Load survey templates for a specific organization
    const loadSurveyTemplates = async (organizationId) => {
        try {
            const SurveyAssignmentService = (await import('../../../services/Admin/SurveyAssignment/SurveyAssignmentService')).default;
            const templateData = await SurveyAssignmentService.getTemplatesForOrganization(organizationId);
            setSurveyTemplates(templateData);
        } catch (error) {
            console.error('Error loading survey templates:', error);
            setSurveyTemplates([]);
        }
    };

    // Load user survey assignments
    const loadUserAssignments = async (userId) => {
        setLoadingAssignments(true);
        try {
            const SurveyAssignmentService = (await import('../../../services/Admin/SurveyAssignment/SurveyAssignmentService')).default;
            const assignments = await SurveyAssignmentService.getUserSurveyAssignments(userId);
            setUserAssignments(assignments.assignments || []);
        } catch (error) {
            console.error('Error loading user assignments:', error);
            setUserAssignments([]);
        } finally {
            setLoadingAssignments(false);
        }
    };

    // Assign survey to user
    const handleAssignSurvey = async () => {
        if (!selectedUserForView || !selectedSurveyTemplate) return;

        try {
            const SurveyAssignmentService = (await import('../../../services/Admin/SurveyAssignment/SurveyAssignmentService')).default;
            const adminId = localStorage.getItem('userId');

            await SurveyAssignmentService.assignSurvey(
                [selectedUserForView.id],
                selectedSurveyTemplate,
                adminId
            );

            // Refresh assignments
            loadUserAssignments(selectedUserForView.id);
            setSelectedSurveyTemplate('');

            // Show success message (you can add a snackbar here)
            console.log('Survey assigned successfully');
        } catch (error) {
            console.error('Error assigning survey:', error);
            alert('Failed to assign survey: ' + error.message);
        }
    };


    // Load users from API
    const loadUsers = async () => {
        try {
            const data = await fetchUsers();

            // Filter for manager
            const userRole = localStorage.getItem('userRole');
            const userStr = localStorage.getItem('user');
            let filteredData = data;

            if (userRole === 'manager' && userStr) {
                const currentUser = JSON.parse(userStr);
                if (currentUser && currentUser.organization_id) {
                    filteredData = data.filter(u => u.organization_id === currentUser.organization_id);
                }
            }

            console.log(filteredData);
            setUsers(filteredData);

        } catch (error) {
            console.error('Failed to fetch users:', error);
        }
    };

    // Load organizations from API
    const loadOrganizations = async () => {
        try {
            const data = await fetchOrganizations();
            // Filter organizations by type
            const filteredOrgs = data.filter(org => {
                console.log(org.organization_type, org.organization_type.type);
                return org.organization_type &&
                    ['church', 'non_formal_organizations', 'institution'].includes(org.organization_type.type.toLowerCase())
            });
            setOrganizations(filteredOrgs);
        } catch (error) {
            console.error('Failed to fetch organizations:', error);
        }
    };

    // Load roles from API
    const loadRoles = async () => {
        try {
            const data = await fetchRoles();
            setRoles(data);
        } catch (error) {
            console.error('Failed to fetch roles:', error);
        }
    };

    // Load titles from API
    const loadTitles = async () => {
        try {
            const data = await fetchTitles();
            setTitles(data);
        } catch (error) {
            console.error('Failed to fetch titles:', error);
        }
    };

    // Load templates by organization
    const loadTemplates = async (organizationId) => {
        if (!organizationId) {
            setTemplates([]);
            return;
        }
        try {
            const data = await fetchTemplatesByOrganization(organizationId);
            setTemplates(data);
        } catch (error) {
            console.error('Failed to fetch templates:', error);
            setTemplates([]);
        }
    };

    // Load email templates by organization
    const loadEmailTemplates = async (organizationId) => {
        if (!organizationId) {
            setEmailTemplates([]);
            return;
        }
        try {
            console.log(`Loading email templates for organization: ${organizationId}`);
            const data = await InventoryService.getEmailTemplates(organizationId);
            console.log('Email templates loaded:', data);

            // Filter for welcome templates specifically
            const welcomeTemplates = (data || []).filter(template =>
                template.name && (
                    template.name.toLowerCase().includes('welcome') ||
                    template.name.toLowerCase().includes('default welcome')
                )
            );

            console.log('Welcome templates found:', welcomeTemplates);
            setEmailTemplates(welcomeTemplates);

            if (welcomeTemplates.length === 0) {
                console.warn('No welcome email templates found for this organization');
            }
        } catch (error) {
            console.error('Failed to fetch email templates:', error);
            setEmailTemplates([]);
        }
    };

    // Handle email template preview
    const handleEmailTemplatePreview = () => {
        if (!formData.email_template_id) {
            // Preview default template
            setSelectedEmailTemplate(null);
            setEmailPreviewDialogOpen(true);
            return;
        }

        const template = emailTemplates.find(t => t.id.toString() === formData.email_template_id.toString());
        if (template) {
            setSelectedEmailTemplate(template);
            setEmailPreviewDialogOpen(true);
        }
    };

    // Close email preview dialog
    const handleCloseEmailPreview = () => {
        setEmailPreviewDialogOpen(false);
        setSelectedEmailTemplate(null);
    };

    // Handle form input changes
    const handleInputChange = (e) => {
        const { name, value } = e.target;

        // Handle nested geo_location fields
        if (name.startsWith('geo_location.')) {
            const geoField = name.split('.')[1];
            setFormData({
                ...formData,
                geo_location: {
                    ...formData.geo_location,
                    [geoField]: value
                }
            });
        } else {
            // Handle organization change - load templates
            if (name === 'organization_id') {
                loadTemplates(value);
                loadEmailTemplates(value);
                setFormData({
                    ...formData,
                    [name]: value,
                    template_id: '', // Reset template selection when organization changes
                    email_template_id: '' // Reset email template selection when organization changes
                });
            } else {
                setFormData({
                    ...formData,
                    [name]: value
                });
            }
        }
    };

    // Handle role selection
    const handleRoleSelection = (e, organizationId, roleId) => {
        const isChecked = e.target.checked;
        let updatedRoles = [...formData.roles];

        if (isChecked) {
            updatedRoles.push({ organization_id: organizationId, role_id: roleId });
        } else {
            updatedRoles = updatedRoles.filter(
                role => !(role.organization_id === organizationId && role.role_id === roleId)
            );
        }

        setFormData({
            ...formData,
            roles: updatedRoles
        });
    };

    // Handle adding a new role
    const handleAddNewRole = async () => {
        if (!newRoleName.trim()) return;

        setRoleLoading(true);
        try {
            const roleData = {
                name: newRoleName.trim(),
                description: `Created for user with ${formData.ui_role} role`
            };

            const newRole = await addRole(roleData);
            setNewRoleName('');
            setIsAddingNewRole(false);

            // Reload roles
            await loadRoles();

        } catch (error) {
            console.error('Failed to add new role:', error);
            alert(`Failed to add new role: ${error.message}`);
        } finally {
            setRoleLoading(false);
        }
    };

    // Handle file selection for upload
    const handleFileChange = (e) => {
        setSelectedFile(e.target.files[0]);
    };

    // Handle file upload
    const handleFileUpload = async () => {
        if (!selectedFile) {
            setUploadStatus('Please select a file first');
            return;
        }

        try {
            const formData = new FormData();
            formData.append('file', selectedFile);

            const response = await uploadUserFile(formData);
            setUploadStatus(`File uploaded successfully: ${response.filename}`);

            // Reload users after successful upload
            loadUsers();

            // Close the dialog after a delay
            setTimeout(() => {
                setOpenUploadDialogProp(false);
                setSelectedFile(null);
                setUploadStatus('');
            }, 2000);
        } catch (error) {
            setUploadStatus(`Upload failed: ${error.message}`);
        }
    };

    // Navigate to add user page
    const handleOpenAddDialog = () => {
        navigate('/users/add');
    };

    // Open edit user dialog
    const handleOpenEditDialog = async (user) => {
        setSelectedUser(user);

        // Load organizational titles for the user if they have the 'other' role
        let userRoles = user.roles || [];
        if (user.ui_role === 'other') {
            try {
                const organizationalTitles = await fetchUserOrganizationalTitles(user.id);
                userRoles = organizationalTitles || [];
            } catch (error) {
                console.warn('Failed to fetch organizational titles for user:', error);
            }
        }

        setFormData({
            username: user.username,
            email: user.email,
            password: '', // Don't populate password for security
            ui_role: user.ui_role,
            firstname: user.firstname || '',
            lastname: user.lastname || '',
            phone: user.phone || '',
            organization_id: user.organization_id || '',
            template_id: user.template_id || '',
            email_template_id: user.email_template_id || '',
            roles: userRoles,
            system_roles: user.roles && Array.isArray(user.roles) ? user.roles : (user.ui_role ? [user.ui_role] : ['user']),
            title_ids: user.titles && Array.isArray(user.titles) ? user.titles.map(t => t.id) : [],
            geo_location: user.geo_location ? {
                continent: user.geo_location.continent || '',
                region: user.geo_location.region || '',
                country: user.geo_location.country || '',
                province: user.geo_location.province || '',
                city: user.geo_location.city || '',
                town: user.geo_location.town || '',
                address_line1: user.geo_location.address_line1 || '',
                address_line2: user.geo_location.address_line2 || '',
                postal_code: user.geo_location.postal_code || '',
                latitude: user.geo_location.latitude || 0,
                longitude: user.geo_location.longitude || 0
            } : {
                continent: '',
                region: '',
                country: '',
                province: '',
                city: '',
                town: '',
                address_line1: '',
                address_line2: '',
                postal_code: '',
                latitude: 0,
                longitude: 0
            }
        });

        // Load templates for the user's organization
        if (user.organization_id) {
            loadTemplates(user.organization_id);
        } else {
            setTemplates([]);
        }
        setOpenEditDialog(true);
    };

    // Open delete user dialog
    const handleOpenDeleteDialog = (user) => {
        setSelectedUser(user);
        setOpenDeleteDialog(true);
    };

    // Open upload file dialog
    const handleOpenUploadDialog = () => {
        setSelectedFile(null);
        setUploadStatus('');
        setOpenUploadDialogProp(true);
    };

    // Close all dialogs
    const handleCloseDialogs = () => {
        setOpenAddDialog(false);
        setOpenEditDialog(false);
        setOpenDeleteDialog(false);
        setOpenUploadDialogProp(false);
        setOpenEmailDialog(false);
        setSelectedUser(null);
        // Reset new organizational title fields
        setSelectedOrganizationId('');
        setSelectedRoleType('');
        setOrganizationalTitleToAdd('');
        // Reset email preview states
        setShowEmailPreview(false);
        setEmailPreviewData({
            textVersion: '',
            htmlVersion: '',
            subject: '',
            to: ''
        });
        setEmailPreviewType('text');
        setFormData({
            username: '',
            email: '',
            password: '',
            ui_role: 'user',
            firstname: '',
            lastname: '',
            phone: '',
            organization_id: '',
            template_id: '',
            roles: [],
            system_roles: [],
            title_ids: [],
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
                latitude: 0,
                longitude: 0
            }
        });
        setTemplates([]); // Reset templates
        // Reset email data
        setEmailData({
            to: '',
            subject: '',
            body: '',
            username: '',
            password: '',
            firstname: ''
        });
    };

    // Handle closing email dialog specifically
    const handleCloseEmailDialog = () => {
        setOpenEmailDialog(false);
        setEmailSending(false);
        setEmailSent(false);
        setEmailData({
            to: '',
            subject: '',
            body: '',
            username: '',
            password: '',
            firstname: ''
        });
    };

    // Handle sending the welcome email
    const handleSendWelcomeEmail = async () => {
        setEmailSending(true);
        try {
            const response = await fetch('/api/send-welcome-email', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    to_email: emailData.to,
                    username: emailData.username,
                    password: emailData.password,
                    firstname: emailData.firstname
                }),
            });

            const result = await response.json();

            if (response.ok) {
                setEmailSent(true);
                alert(`Welcome email sent successfully to ${emailData.to}!`);
            } else {
                throw new Error(result.error || 'Failed to send email');
            }
        } catch (error) {
            console.error('Error sending welcome email:', error);
            alert(`Failed to send email: ${error.message}`);
        } finally {
            setEmailSending(false);
        }
    };

    // Add a new user
    const handleAddUser = async () => {
        try {
            // Transform form data for backend
            const userData = {
                ...formData,
                role: formData.ui_role, // Map ui_role to role for backend
                geo_location: hasValidGeoData(formData.geo_location) ? formData.geo_location : null
            };

            // Remove ui_role and roles from the user data as they're handled separately
            delete userData.ui_role;
            const organizationalTitles = userData.roles || [];
            delete userData.roles;

            // First, create the user
            const newUser = await addUser(userData);
            console.log('Backend response for new user:', newUser);
            console.log('Password from backend:', newUser.password);
            console.log('Password from form:', formData.password);

            // Then, if there are organizational titles, save them
            if (organizationalTitles.length > 0) {
                try {
                    await updateUserOrganizationalTitles(newUser.id, { roles: organizationalTitles });
                } catch (titleError) {
                    console.warn('User created but failed to save organizational titles:', titleError);
                    alert('User created successfully, but there was an issue saving organizational titles. You can edit the user to add titles.');
                }
            }

            // Show success message - backend automatically sends welcome email
            alert(`User "${newUser.username}" created successfully! Welcome email has been sent to ${newUser.email}.`);

            loadUsers();

            // Close the add dialog - no email dialog needed
            setOpenAddDialog(false);
        } catch (error) {
            console.error('Failed to add user:', error);
            alert(`Failed to add user: ${error.message}`);
        }
    };

    // Helper function to check if geo_location has any meaningful data
    const hasValidGeoData = (geoData) => {
        if (!geoData) return false;

        // Check all fields except latitude and longitude for meaningful string data
        const stringFields = ['continent', 'region', 'country', 'province', 'city', 'town', 'address_line1', 'address_line2', 'postal_code'];
        const hasStringData = stringFields.some(field => geoData[field] && geoData[field].trim() !== '');

        // Check if latitude and longitude have been set (not 0 or empty)
        const hasCoordinates = (geoData.latitude && geoData.latitude !== 0) || (geoData.longitude && geoData.longitude !== 0);

        return hasStringData || hasCoordinates;
    };

    // New handlers for improved organizational titles workflow
    const handleAddOrganizationalTitle = async () => {
        if (!selectedOrganizationId || !organizationalTitleToAdd.trim()) {
            alert('Please select an organization and enter a title');
            return;
        }

        // Check if this title already exists for this organization
        const existingTitle = formData.roles.find(
            r => r.organization_id === parseInt(selectedOrganizationId) && r.title_type === organizationalTitleToAdd.trim()
        );

        if (existingTitle) {
            alert('This title already exists for the selected organization');
            return;
        }

        setAddingOrganizationalTitle(true);
        try {
            // Add the new title to the roles table if it doesn't exist
            const roleData = {
                name: organizationalTitleToAdd.trim(),
                description: `Created for organizational title: ${organizationalTitleToAdd.trim()}`
            };

            // This will add to roles table
            await addRole(roleData);

            // Add the new organizational title to the form data
            const newTitle = {
                organization_id: parseInt(selectedOrganizationId),
                title_type: organizationalTitleToAdd.trim(),
                id: Date.now() // Temporary ID for frontend display
            };

            setFormData({
                ...formData,
                roles: [...formData.roles, newTitle]
            });

            // Reset the form
            setSelectedOrganizationId('');
            setOrganizationalTitleToAdd('');

            alert('Title added successfully!');
        } catch (error) {
            // If the title already exists in the database, that's okay
            if (error.response && error.response.status === 409) {
                // Title already exists, just add it to the form
                const newTitle = {
                    organization_id: parseInt(selectedOrganizationId),
                    title_type: organizationalTitleToAdd.trim(),
                    id: Date.now()
                };

                setFormData({
                    ...formData,
                    roles: [...formData.roles, newTitle]
                });

                setSelectedOrganizationId('');
                setOrganizationalTitleToAdd('');
                alert('Title was already in system, added to user successfully!');
            } else {
                console.error('Failed to add title:', error);
                alert(`Failed to add title: ${error.message}`);
            }
        } finally {
            setAddingOrganizationalTitle(false);
        }
    };

    const handleRemoveOrganizationalTitle = (organizationId, titleType) => {
        setFormData({
            ...formData,
            roles: formData.roles.filter(
                r => !(r.organization_id === organizationId && r.title_type === titleType)
            )
        });
    };

    const getOrganizationRoles = (organizationId) => {
        return formData.roles.filter(r => r.organization_id === organizationId);
    };

    // Handle Google Places selection
    const handlePlaceSelect = (placeData) => {
        const { geoLocationData, formattedAddress } = placeData;

        // Ensure latitude and longitude are numbers, defaulting to 0 if not provided
        const updatedGeoLocation = {
            ...geoLocationData,
            latitude: geoLocationData.latitude ? Number(geoLocationData.latitude) : 0,
            longitude: geoLocationData.longitude ? Number(geoLocationData.longitude) : 0
        };

        // Update form data with the selected place information
        setFormData({
            ...formData,
            geo_location: updatedGeoLocation
        });

        // Show a brief success message
        console.log('Address auto-filled:', formattedAddress);
        console.log('Coordinates set:', {
            latitude: updatedGeoLocation.latitude,
            longitude: updatedGeoLocation.longitude
        });

        // Clear the search field
        setAddressSearch('');
    };

    // Handle address search input change
    const handleAddressSearchChange = (event) => {
        setAddressSearch(event.target.value);
    };

    // Update an existing user
    const handleUpdateUser = async () => {
        if (!selectedUser) return;

        try {
            // Transform form data for backend
            const userData = {
                ...formData,
                role: formData.ui_role, // Primary role for legacy support
                roles: formData.system_roles, // List of system roles (e.g. ['admin', 'user'])
                titles: formData.title_ids,   // List of title IDs
                geo_location: hasValidGeoData(formData.geo_location) ? formData.geo_location : null
            };

            // Remove internal UI fields
            delete userData.ui_role;
            delete userData.system_roles;
            delete userData.title_ids;

            // Handle organizational titles (legacy list of objects) separately
            const organizationalTitles = formData.roles || [];
            // We don't delete userData.roles here because we just set it to system_roles above.
            // The backend distinguishes between list-of-strings (system) and list-of-dicts (org titles).
            // But UsersManagement stores org titles in formData.roles. 
            // So we need to be careful. 
            // In handleUpdateUser, we want to send system roles as 'roles'.
            // Organizational titles are sent via updateUserOrganizationalTitles separately below.
            // So userData.roles MUST be formData.system_roles.
            // We already set that above.

            // Debug logging
            console.log('=== UPDATE USER DEBUG ===');
            console.log('Selected User ID:', selectedUser.id);
            console.log('Form Data template_id:', formData.template_id);
            console.log('User Data being sent:', userData);
            console.log('Template ID in userData:', userData.template_id);
            console.log('========================');

            // First, update the user
            await updateUser(selectedUser.id, userData);

            // Then, update organizational titles
            if (formData.ui_role === 'other') {
                try {
                    await updateUserOrganizationalTitles(selectedUser.id, { roles: organizationalTitles });
                } catch (titleError) {
                    console.warn('User updated but failed to save organizational titles:', titleError);
                    alert('User updated successfully, but there was an issue saving organizational titles.');
                }
            }

            loadUsers();
            handleCloseDialogs();
        } catch (error) {
            console.error('Failed to update user:', error);
            alert(`Failed to update user: ${error.message}`);
        }
    };

    // Delete a user
    const handleDeleteUser = async () => {
        if (!selectedUser) return;

        try {
            await deleteUser(selectedUser.id);
            loadUsers();
            handleCloseDialogs();
        } catch (error) {
            console.error('Failed to delete user:', error);
            alert(`Failed to delete user: ${error.message}`);
        }
    };

    // Bulk delete users
    const handleBulkDeleteUsers = async () => {
        setBulkActionLoading(true);
        let successCount = 0;
        let failCount = 0;
        for (const userId of selectedUserIds) {
            try {
                await deleteUser(userId);
                successCount++;
            } catch (err) {
                failCount++;
                console.error(`Failed to delete user ${userId}:`, err);
            }
        }
        setBulkActionLoading(false);
        setOpenBulkDeleteDialog(false);
        setSelectedUserIds([]);
        loadUsers();
        setSnackbar({
            open: true,
            message: failCount > 0
                ? `Deleted ${successCount} user(s). ${failCount} failed.`
                : `Successfully deleted ${successCount} user(s).`,
            severity: failCount > 0 ? 'warning' : 'success'
        });
    };

    // Bulk send reminders
    const handleBulkSendReminders = async () => {
        setBulkActionLoading(true);
        try {
            const usersToSend = selectedUserIds.map(userId => {
                const user = users.find(u => u.id === userId);
                if (!user) return null;
                return {
                    to_email: user.email,
                    username: user.username,
                    survey_code: user.survey_code || 'N/A',
                    firstname: user.firstname || user.username,
                    organization_name: user.organization?.name || '',
                    organization_id: user.organization_id,
                    days_remaining: null
                };
            }).filter(Boolean).filter(u => u.to_email);

            const response = await fetch('/api/send-bulk-reminder-emails', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ users: usersToSend }),
            });
            const result = await response.json();

            if (response.ok) {
                setSnackbar({
                    open: true,
                    message: `Reminders sent: ${result.results?.successful_sends || 0} successful, ${result.results?.failed_sends || 0} failed`,
                    severity: 'success'
                });
                setTimeout(() => {
                    setOpenBulkReminderDialog(false);
                    setSelectedUserIds([]);
                }, 1500);
            } else {
                setSnackbar({ open: true, message: result.error || 'Failed to send reminders', severity: 'error' });
            }
        } catch (err) {
            console.error('Bulk reminder error:', err);
            setSnackbar({ open: true, message: err.message || 'Failed to send reminders', severity: 'error' });
        } finally {
            setBulkActionLoading(false);
        }
    };

    // Handle pagination change
    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };

    // Handle rows per page change
    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    // Get organization name by ID
    const getOrganizationName = (orgId) => {
        const org = organizations.find(org => org.id === orgId);
        return org ? org.name : 'N/A';
    };

    // Get role name by ID
    const getRoleName = (roleId) => {
        const role = roles.find(role => role.id === roleId);
        return role ? role.name : 'N/A';
    };

    // Helper function to truncate long text
    const truncateText = (text, maxLength = 30) => {
        if (!text) return '';
        return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
    };

    // Filter and sort users
    const getFilteredAndSortedUsers = () => {
        let filtered = [...users];

        // Apply search filter
        if (searchTerm) {
            const search = searchTerm.toLowerCase();
            filtered = filtered.filter(user =>
                user.username?.toLowerCase().includes(search) ||
                user.email?.toLowerCase().includes(search) ||
                user.firstname?.toLowerCase().includes(search) ||
                user.lastname?.toLowerCase().includes(search) ||
                user.phone?.toLowerCase().includes(search) ||
                user.organization?.name?.toLowerCase().includes(search)
            );
        }

        // Apply organization filter
        if (filterOrganization) {
            filtered = filtered.filter(user => user.organization_id === parseInt(filterOrganization));
        }

        // Apply role filter
        if (filterRole) {
            filtered = filtered.filter(user => user.ui_role === filterRole);
        }

        // Apply sorting
        filtered.sort((a, b) => {
            let aValue = a[sortBy];
            let bValue = b[sortBy];

            // Handle organization name sorting
            if (sortBy === 'organization') {
                aValue = a.organization?.name || '';
                bValue = b.organization?.name || '';
            }

            // Handle null/undefined values
            if (!aValue) aValue = '';
            if (!bValue) bValue = '';

            // Convert to lowercase for string comparison
            if (typeof aValue === 'string') aValue = aValue.toLowerCase();
            if (typeof bValue === 'string') bValue = bValue.toLowerCase();

            if (sortOrder === 'asc') {
                return aValue > bValue ? 1 : -1;
            } else {
                return aValue < bValue ? 1 : -1;
            }
        });

        return filtered;
    };

    const filteredUsers = getFilteredAndSortedUsers();

    // Report filtered user count to parent
    useEffect(() => {
        if (onUserCountChange) {
            onUserCountChange(filteredUsers.length);
        }
    }, [filteredUsers.length, onUserCountChange]);

    // Handle row click to navigate to user detail page
    const handleRowClick = (user) => {
        navigate(`/users/${user.id}`);
    };

    // Sort value getter for DataTable
    const userSortValueGetter = useMemo(() => (row, orderBy) => {
        if (orderBy === 'organization') {
            return row.organization?.name || getOrganizationName(row.organization_id) || '';
        }
        return row[orderBy];
    }, [organizations]);

    // Column definitions for the users table
    const usersTableColumns = useMemo(() => [
        {
            id: 'username',
            label: 'Username',
            sortable: true,
            render: (user) => (
                <Typography variant="body2" sx={{ whiteSpace: 'normal', wordBreak: 'break-word' }}>
                    {user.username}
                </Typography>
            )
        },
        { id: 'email', label: 'Email', sortable: true },
        {
            id: 'firstname',
            label: 'First Name',
            sortable: true,
            render: (user) => (
                <Typography variant="body2" sx={{ whiteSpace: 'normal', wordBreak: 'break-word' }}>
                    {user.firstname}
                </Typography>
            )
        },
        {
            id: 'lastname',
            label: 'Last Name',
            sortable: true,
            render: (user) => (
                <Typography variant="body2" sx={{ whiteSpace: 'normal', wordBreak: 'break-word' }}>
                    {user.lastname}
                </Typography>
            )
        },
        {
            id: 'roles',
            label: 'Roles',
            render: (user) => (user.roles && user.roles.length > 0) ? (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {user.roles.map((role, idx) => (
                        <Chip
                            key={`role-${idx}`}
                            label={role}
                            size="small"
                            sx={{
                                bgcolor: role === 'admin' ? '#e3f2fd' : '#f5f5f5',
                                color: role === 'admin' ? '#1565c0' : '#616161',
                                fontWeight: 500,
                                textTransform: 'capitalize'
                            }}
                        />
                    ))}
                </Box>
            ) : (user.ui_role || 'User')
        },
        {
            id: 'title',
            label: 'Title',
            render: (user) => (user.titles && user.titles.length > 0) ? (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {user.titles.map((title, idx) => (
                        <Chip
                            key={`title-${idx}`}
                            label={title.name}
                            size="small"
                            variant="outlined"
                            sx={{ borderColor: '#ddd' }}
                        />
                    ))}
                </Box>
            ) : (user.title || 'N/A')
        },
        {
            id: 'phone',
            label: 'Phone',
            render: (user) => (
                <Typography variant="body2" sx={{ whiteSpace: 'normal', wordBreak: 'break-word' }}>
                    {user.phone || 'N/A'}
                </Typography>
            )
        },
        {
            id: 'address',
            label: 'User Address',
            render: (user) => user.geo_location ? (
                <Box sx={{ maxWidth: 250, whiteSpace: 'normal', wordBreak: 'break-word' }}>
                    {user.geo_location.address_line1 && (
                        <Typography variant="body2">{user.geo_location.address_line1}</Typography>
                    )}
                    <Typography variant="caption" color="textSecondary" display="block">
                        {[user.geo_location.city, user.geo_location.province, user.geo_location.country, user.geo_location.postal_code].filter(Boolean).join(', ')}
                    </Typography>
                </Box>
            ) : 'N/A'
        },
        {
            id: 'organization',
            label: 'Organization',
            sortable: true,
            render: (user) => user.organization ? (
                <Box>
                    <Typography variant="body2" sx={{ fontWeight: 'bold', maxWidth: 200, whiteSpace: 'normal', wordBreak: 'break-word' }}>
                        {user.organization.name}
                    </Typography>
                    {user.organization.organization_type && (
                        <Typography variant="body2" color="textSecondary">Type: {user.organization.organization_type.type}</Typography>
                    )}
                    {user.organization.website && (
                        <Typography variant="body2" color="textSecondary">Website: {user.organization.website}</Typography>
                    )}
                </Box>
            ) : (
                <Typography variant="body2" sx={{ maxWidth: 200, whiteSpace: 'normal', wordBreak: 'break-word' }}>
                    {getOrganizationName(user.organization_id)}
                </Typography>
            )
        },
        {
            id: 'actions',
            label: 'Actions',
            render: (user) => (
                <>
                    <IconButton onClick={(e) => { e.stopPropagation(); handleOpenEditDialog(user); }} color="primary">
                        <EditIcon />
                    </IconButton>
                    <IconButton onClick={(e) => { e.stopPropagation(); handleOpenDeleteDialog(user); }} color="error">
                        <DeleteIcon />
                    </IconButton>
                </>
            )
        }
    ], [organizations]);

    // Render the users table
    const renderUsersTable = () => {
        return (
            <DataTable
                columns={usersTableColumns}
                data={filteredUsers}
                selectable
                selectedIds={selectedUserIds}
                onSelectionChange={setSelectedUserIds}
                pagination
                rowsPerPageOptions={[5, 10, 25, 50]}
                defaultRowsPerPage={rowsPerPage}
                defaultSortColumn="username"
                defaultSortDirection="asc"
                sortIndicator="arrow"
                sortValueGetter={userSortValueGetter}
                onRowClick={(user) => handleRowClick(user)}
                emptyMessage="No users found"
                showPaper={false}
            />
        );
    };

    // Render the add/edit user form
    const renderUserForm = (isEdit = false) => {
        return (
            <Box component="form" noValidate autoComplete="off">
                <Paper
                    sx={{
                        p: 2,
                        backgroundColor: '#f5f5f5',
                        boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
                        mb: 3,
                        width: '96.5%',
                    }}
                >
                    <Typography
                        variant="h6"
                        gutterBottom
                        sx={{
                            color: '#633394',
                            fontWeight: 'bold',
                            mb: 2,
                            textAlign: 'center',
                        }}
                    >
                        User Information
                    </Typography>

                    <Box sx={{ display: 'flex', gap: 2 }}>
                        {/* Column 1 */}
                        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <TextField
                                required
                                fullWidth
                                label="Username"
                                name="username"
                                value={formData.username}
                                onChange={handleInputChange}
                                variant="outlined"
                            />
                            <TextField
                                fullWidth
                                label="First Name"
                                name="firstname"
                                value={formData.firstname}
                                onChange={handleInputChange}
                                variant="outlined"
                            />
                            <TextField
                                fullWidth
                                label="Phone"
                                name="phone"
                                value={formData.phone}
                                onChange={handleInputChange}
                                variant="outlined"
                            />
                        </Box>

                        {/* Column 2 */}
                        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <TextField
                                required
                                fullWidth
                                label="Email"
                                name="email"
                                type="email"
                                value={formData.email}
                                onChange={handleInputChange}
                                variant="outlined"
                            />
                            <TextField
                                fullWidth
                                label="Last Name"
                                name="lastname"
                                value={formData.lastname}
                                onChange={handleInputChange}
                                variant="outlined"
                            />
                            {isEdit ? (
                                <TextField
                                    fullWidth
                                    label="New Password (leave blank to keep current)"
                                    name="password"
                                    type="password"
                                    value={formData.password}
                                    onChange={handleInputChange}
                                    variant="outlined"
                                />
                            ) : (
                                <TextField
                                    fullWidth
                                    label="Password (auto-generated if empty)"
                                    name="password"
                                    type="password"
                                    value={formData.password}
                                    onChange={handleInputChange}
                                    variant="outlined"
                                    helperText="Leave empty for auto-generated password"
                                />
                            )}
                        </Box>

                        {/* Column 3 */}
                        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
                            {/* Title Dropdown - Multi-select */}
                            <Autocomplete
                                multiple
                                value={titles.filter(t => (formData.title_ids || []).includes(t.id))}
                                onChange={(event, newValue) => {
                                    setFormData({
                                        ...formData,
                                        title_ids: newValue.map(v => v.id)
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
                            />

                            <FormControl fullWidth variant="outlined" required>
                                <InputLabel>Roles</InputLabel>
                                <Select
                                    multiple
                                    value={formData.system_roles || []}
                                    onChange={(e) => {
                                        const value = e.target.value;
                                        const newRoles = typeof value === 'string' ? value.split(',') : value;
                                        setFormData({
                                            ...formData,
                                            system_roles: newRoles,
                                            ui_role: newRoles[0] || 'user' // Default to first selected or user
                                        });
                                    }}
                                    label="Roles"
                                    renderValue={(selected) => (
                                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                            {selected.map((value) => (
                                                <Chip key={value} label={roles.find(r => r.name === value)?.name || value} size="small" />
                                            ))}
                                        </Box>
                                    )}
                                >
                                    {roles.map((role) => (
                                        <MenuItem key={role.id} value={role.name}>
                                            {role.name.charAt(0).toUpperCase() + role.name.slice(1)}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>

                            <FormControl fullWidth variant="outlined">
                                <InputLabel>Organization</InputLabel>
                                <Select
                                    name="organization_id"
                                    value={formData.organization_id}
                                    onChange={handleInputChange}
                                    label="Organization"
                                >
                                    <MenuItem value="">No Organization</MenuItem>
                                    {organizations.map((org) => (
                                        <MenuItem key={org.id} value={org.id}>
                                            {org.name} ({org.organization_type?.type || 'N/A'})
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>

                            {/* Template Selection - Only shown when organization is selected */}
                            {formData.organization_id && (
                                <FormControl fullWidth variant="outlined">
                                    <InputLabel>Survey Template</InputLabel>
                                    <Select
                                        name="template_id"
                                        value={formData.template_id}
                                        onChange={handleInputChange}
                                        label="Survey Template"
                                        MenuProps={{
                                            PaperProps: {
                                                style: {
                                                    maxWidth: '400px', // Limit dropdown width
                                                },
                                            },
                                        }}
                                    >
                                        <MenuItem value="">No Template Selected</MenuItem>
                                        {templates.map((template) => (
                                            <MenuItem
                                                key={template.id}
                                                value={template.id}
                                                title={`${template.survey_code} - ${template.version_name}`} // Show full text on hover
                                            >
                                                {truncateText(`${template.survey_code} - ${template.version_name}`, 35)}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            )}

                            {/* Email Template Selection - Only shown when organization is selected */}
                            {formData.organization_id && (
                                <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-end' }}>
                                    <FormControl fullWidth variant="outlined">
                                        <InputLabel>Welcome Email Template</InputLabel>
                                        <Select
                                            name="email_template_id"
                                            value={formData.email_template_id}
                                            onChange={handleInputChange}
                                            label="Welcome Email Template"
                                            MenuProps={{
                                                PaperProps: {
                                                    style: {
                                                        maxWidth: '400px', // Limit dropdown width
                                                    },
                                                },
                                            }}
                                        >
                                            <MenuItem value="">Use Default Welcome Email</MenuItem>
                                            {emailTemplates.map((template) => (
                                                <MenuItem
                                                    key={template.id}
                                                    value={template.id}
                                                    title={`${template.name} - ${template.subject}`} // Show full text on hover
                                                >
                                                    {truncateText(`${template.name} - ${template.subject}`, 35)}
                                                </MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                    <Button
                                        variant="outlined"
                                        onClick={handleEmailTemplatePreview}
                                        sx={{
                                            minWidth: '120px',
                                            height: '56px', // Match FormControl height
                                            borderColor: '#633394',
                                            color: '#633394',
                                            '&:hover': {
                                                borderColor: '#7c52a5',
                                                backgroundColor: 'rgba(99, 51, 148, 0.04)'
                                            }
                                        }}
                                        startIcon={<VisibilityIcon />}
                                    >
                                        Preview
                                    </Button>
                                </Box>
                            )}
                        </Box>
                    </Box>
                </Paper>


                {/* Organizational Titles Section - Only shown when UI role is 'other' */}
                {formData.ui_role === 'other' && (
                    <Paper sx={{ p: 2, backgroundColor: '#f5f5f5', boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)', mb: 3 }}>
                        <Typography variant="h6" gutterBottom sx={{ color: '#633394', fontWeight: 'bold', mb: 2, textAlign: 'center' }}>
                            Organizational Titles
                        </Typography>
                        <Box sx={{ maxWidth: '900px', mx: 'auto' }}>

                            {/* Add New Role Section */}
                            <Box sx={{
                                p: 2,
                                border: '1px solid #e0e0e0',
                                borderRadius: 1,
                                backgroundColor: 'white',
                                mb: 3
                            }}>
                                <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: '#633394', mb: 2, textAlign: 'center' }}>
                                    Add Role to Organization
                                </Typography>
                                <Grid container spacing={2} alignItems="end">
                                    <Grid item xs={12} md={4}>
                                        <FormControl
                                            // fixed width
                                            variant="outlined"
                                            sx={{ width: 300, minHeight: '56px' }}
                                        >
                                            <InputLabel id="select-organization-label">Select Organization</InputLabel>
                                            <Select
                                                labelId="select-organization-label"
                                                value={selectedOrganizationId}
                                                onChange={(e) => setSelectedOrganizationId(e.target.value)}
                                                label="Select Organization"
                                                sx={{
                                                    minHeight: '56px',
                                                    '& .MuiSelect-select': {
                                                        minHeight: '20px',
                                                        display: 'flex',
                                                        alignItems: 'center'
                                                    }
                                                }}
                                            >
                                                <MenuItem value="">
                                                    <em>Choose an organization</em>
                                                </MenuItem>
                                                {organizations.map((org) => (
                                                    <MenuItem key={org.id} value={org.id}>
                                                        {org.name}
                                                    </MenuItem>
                                                ))}
                                            </Select>
                                        </FormControl>
                                    </Grid>
                                    <Grid item xs={12} md={4}>
                                        <TextField
                                            fullWidth
                                            label="Title"
                                            value={organizationalTitleToAdd}
                                            onChange={(e) => setOrganizationalTitleToAdd(e.target.value)}
                                            variant="outlined"
                                            placeholder="e.g., Pastor, Director, President"
                                        />
                                    </Grid>
                                    <Grid item xs={12} md={4}>
                                        <Button
                                            variant="contained"
                                            fullWidth
                                            onClick={handleAddOrganizationalTitle}
                                            disabled={!selectedOrganizationId || !organizationalTitleToAdd.trim() || addingOrganizationalTitle}
                                            sx={{
                                                backgroundColor: '#633394',
                                                '&:hover': { backgroundColor: '#7c52a5' }
                                            }}
                                            startIcon={addingOrganizationalTitle ? <CircularProgress size={20} color="inherit" /> : null}
                                        >
                                            {addingOrganizationalTitle ? 'Adding...' : 'Add Title'}
                                        </Button>
                                    </Grid>
                                </Grid>
                            </Box>

                            {/* Display Current Roles */}
                            {formData.roles.length > 0 && (
                                <Box sx={{
                                    p: 2,
                                    border: '1px solid #e0e0e0',
                                    borderRadius: 1,
                                    backgroundColor: 'white'
                                }}>
                                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: '#633394', mb: 2, textAlign: 'center' }}>
                                        Assigned Roles
                                    </Typography>
                                    <Grid container spacing={2}>
                                        {organizations.map((org) => {
                                            const orgRoles = getOrganizationRoles(org.id);
                                            if (orgRoles.length === 0) return null;

                                            return (
                                                <Grid item xs={12} key={org.id}>
                                                    <Box sx={{
                                                        p: 2,
                                                        border: '1px solid #ddd',
                                                        borderRadius: 1,
                                                        backgroundColor: '#fafafa'
                                                    }}>
                                                        <Typography variant="body1" sx={{ fontWeight: 'bold', mb: 1 }}>
                                                            {org.name}
                                                        </Typography>
                                                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                                            {orgRoles.map((role) => (
                                                                <Chip
                                                                    key={`${role.organization_id}-${role.title_type}`}
                                                                    label={role.title_type}
                                                                    color="primary"
                                                                    variant="filled"
                                                                    onDelete={() => handleRemoveOrganizationalTitle(role.organization_id, role.title_type)}
                                                                    sx={{
                                                                        backgroundColor: '#633394',
                                                                        '&:hover': { backgroundColor: '#7c52a5' }
                                                                    }}
                                                                />
                                                            ))}
                                                        </Box>
                                                    </Box>
                                                </Grid>
                                            );
                                        })}
                                    </Grid>
                                </Box>
                            )}
                        </Box>
                    </Paper>
                )}

                {/* Address Information Section */}
                <Paper sx={{ p: 2, backgroundColor: '#f5f5f5', boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)', mb: 3 }}>
                    <Typography variant="h6" gutterBottom sx={{ color: '#633394', fontWeight: 'bold', mb: 2, textAlign: 'center' }}>
                        Address Information
                    </Typography>

                    <Box sx={{ maxWidth: '900px', mx: 'auto' }}>
                        {/* Enhanced Address Input */}
                        <Box sx={{ mb: 3 }}>
                            <EnhancedAddressInput
                                onPlaceSelect={handlePlaceSelect}
                                label="Address Information"
                                fullWidth
                                initialValue={formData.geo_location}
                            />
                        </Box>

                    </Box>
                </Paper>

                {/* Email Preview Section - Only shown for Add User dialog */}
                {!isEdit && (
                    <Paper sx={{ p: 2, backgroundColor: '#f5f5f5', boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)', mb: 3 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                            <Typography variant="h6" sx={{ color: '#633394', fontWeight: 'bold' }}>
                                📧 Welcome Email Preview
                            </Typography>
                            <Button
                                variant="contained"
                                onClick={async () => {
                                    if (!showEmailPreview) {
                                        await generateWelcomeEmailPreview();
                                    }
                                    setShowEmailPreview(!showEmailPreview);
                                }}
                                sx={{
                                    backgroundColor: '#967CB2',
                                    '&:hover': { backgroundColor: '#8a6fa6' },
                                    minWidth: '200px'
                                }}
                            >
                                {showEmailPreview ? 'Hide Email Preview' : 'Preview Email Content'}
                            </Button>
                        </Box>

                        {showEmailPreview && (
                            <Box sx={{ mt: 2 }}>
                                {/* Email Details */}
                                <Paper sx={{ p: 2, mb: 2, backgroundColor: 'white', border: '1px solid #ddd' }}>
                                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: '#633394', mb: 1 }}>
                                        📧 Email Details
                                    </Typography>
                                    <Typography variant="body2" sx={{ mb: 1 }}>
                                        <strong>To:</strong> {emailPreviewData.to}
                                    </Typography>
                                    <Typography variant="body2" sx={{ mb: 1 }}>
                                        <strong>Subject:</strong> {emailPreviewData.subject}
                                    </Typography>
                                </Paper>

                                {/* Toggle between Text and HTML */}
                                <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                                    <Button
                                        variant={emailPreviewType === 'text' ? 'contained' : 'outlined'}
                                        onClick={() => setEmailPreviewType('text')}
                                        sx={{
                                            backgroundColor: emailPreviewType === 'text' ? '#633394' : 'transparent',
                                            color: emailPreviewType === 'text' ? 'white' : '#633394',
                                            borderColor: '#633394',
                                            '&:hover': {
                                                backgroundColor: emailPreviewType === 'text' ? '#7c52a5' : '#f5f5f5',
                                                borderColor: '#7c52a5'
                                            }
                                        }}
                                    >
                                        Text Version
                                    </Button>
                                    <Button
                                        variant={emailPreviewType === 'html' ? 'contained' : 'outlined'}
                                        onClick={() => setEmailPreviewType('html')}
                                        sx={{
                                            backgroundColor: emailPreviewType === 'html' ? '#633394' : 'transparent',
                                            color: emailPreviewType === 'html' ? 'white' : '#633394',
                                            borderColor: '#633394',
                                            '&:hover': {
                                                backgroundColor: emailPreviewType === 'html' ? '#7c52a5' : '#f5f5f5',
                                                borderColor: '#7c52a5'
                                            }
                                        }}
                                    >
                                        HTML Version
                                    </Button>
                                </Box>

                                {/* Email Content Display */}
                                {emailPreviewType === 'text' ? (
                                    <Paper sx={{
                                        p: 2,
                                        backgroundColor: 'white',
                                        border: '1px solid #ddd',
                                        maxHeight: '400px',
                                        overflow: 'auto'
                                    }}>
                                        <Typography
                                            variant="body2"
                                            sx={{
                                                whiteSpace: 'pre-line',
                                                fontFamily: 'monospace',
                                                fontSize: '0.85rem',
                                                lineHeight: 1.4
                                            }}
                                        >
                                            {emailPreviewData.textVersion}
                                        </Typography>
                                    </Paper>
                                ) : (
                                    <Paper sx={{
                                        p: 1,
                                        backgroundColor: 'white',
                                        border: '1px solid #ddd',
                                        maxHeight: '400px',
                                        overflow: 'auto'
                                    }}>
                                        <iframe
                                            title="Email HTML Preview"
                                            srcDoc={emailPreviewData.htmlVersion}
                                            style={{
                                                width: '100%',
                                                height: '380px',
                                                border: 'none',
                                                backgroundColor: 'white'
                                            }}
                                        />
                                    </Paper>
                                )}

                                {/* Preview Notice */}
                                <Paper sx={{
                                    p: 2,
                                    mt: 2,
                                    backgroundColor: '#e3f2fd',
                                    border: '1px solid #2196f3',
                                    borderRadius: 1
                                }}>
                                    <Typography variant="body2" sx={{ color: '#1976d2', fontWeight: 'bold' }}>
                                        📋 Preview Notice
                                    </Typography>
                                    <Typography variant="body2" sx={{ color: '#1976d2', mt: 1 }}>
                                        This is a preview of the welcome email that will be sent to the user after their account is created.
                                        The email contains their login credentials and getting started information.
                                    </Typography>
                                </Paper>
                            </Box>
                        )}
                    </Paper>
                )}

            </Box>
        );
    };

    return (
        <Box>

            {/* Search and Filter Bar - outside table card, matches organization page */}
            <Box sx={{
                mb: 3,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 2,
                flexWrap: 'wrap'
            }}>
                <TextField
                    placeholder="Search by name, email, or organization..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    size="small"
                    sx={{
                        flex: 1,
                        minWidth: 250,
                        maxWidth: 400,
                        '& .MuiOutlinedInput-root': {
                            backgroundColor: 'white',
                            borderRadius: 2
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
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                    <FormControl size="small" sx={{ minWidth: 200 }}>
                        <Select
                            value={filterOrganization}
                            onChange={(e) => setFilterOrganization(e.target.value)}
                            displayEmpty
                            sx={{
                                backgroundColor: 'white',
                                borderRadius: 2
                            }}
                            startAdornment={<FilterListIcon sx={{ mr: 1, color: '#757575' }} />}
                        >
                            <MenuItem value="">All Organizations</MenuItem>
                            {organizations.map(org => (
                                <MenuItem key={org.id} value={org.id}>{org.name}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                    <FormControl size="small" sx={{ minWidth: 160 }}>
                        <Select
                            value={filterRole}
                            onChange={(e) => setFilterRole(e.target.value)}
                            displayEmpty
                            sx={{
                                backgroundColor: 'white',
                                borderRadius: 2
                            }}
                        >
                            <MenuItem value="">All Roles</MenuItem>
                            <MenuItem value="admin">Administrator</MenuItem>
                            <MenuItem value="user">Regular User</MenuItem>
                        </Select>
                    </FormControl>
                    {(searchTerm || filterOrganization || filterRole) && (
                        <Button
                            variant="outlined"
                            size="small"
                            onClick={() => {
                                setSearchTerm('');
                                setFilterOrganization('');
                                setFilterRole('');
                            }}
                            sx={{
                                color: '#633394',
                                borderColor: '#633394',
                                borderRadius: 2,
                                textTransform: 'none',
                                '&:hover': { borderColor: '#7c52a5', backgroundColor: 'rgba(99, 51, 148, 0.04)' }
                            }}
                        >
                            Clear
                        </Button>
                    )}
                </Box>
            </Box>

            {/* Bulk Actions Bar */}
            {selectedUserIds.length > 0 && (
                <Box sx={{
                    mb: 2, p: 1.5, display: 'flex', alignItems: 'center', gap: 2,
                    backgroundColor: '#f3e5f5', borderRadius: 2,
                    border: '1px solid rgba(99, 51, 148, 0.25)'
                }}>
                    <Chip label={`${selectedUserIds.length} selected`} color="primary" sx={{ backgroundColor: '#633394' }} />
                    <Button
                        variant="contained"
                        size="small"
                        startIcon={<SendIcon />}
                        onClick={() => setOpenBulkReminderDialog(true)}
                        sx={{ bgcolor: '#633394', '&:hover': { bgcolor: '#7c52a5' } }}
                    >
                        Send Reminders ({selectedUserIds.length})
                    </Button>
                    <Button
                        variant="contained"
                        size="small"
                        startIcon={<DeleteIcon />}
                        onClick={() => setOpenBulkDeleteDialog(true)}
                        color="error"
                    >
                        Delete ({selectedUserIds.length})
                    </Button>
                    <Button
                        variant="outlined"
                        size="small"
                        onClick={() => setSelectedUserIds([])}
                        sx={{ ml: 'auto', borderColor: '#967CB2', color: '#967CB2' }}
                    >
                        Clear Selection
                    </Button>
                </Box>
            )}

            {/* Users Table */}
            <Paper sx={{ borderRadius: 3, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
                {renderUsersTable()}
            </Paper>

            {/* Survey Assignment Card - Commented out, using inline dropdown instead */}
            {/* <SurveyAssignmentCard
                users={users}
                onRefreshUsers={loadUsers}
                selectedUserForView={selectedUserForView}
                onUserDeselect={() => setSelectedUserForView(null)}
            /> */}

            {/* Edit User Dialog */}
            <Dialog open={openEditDialog} onClose={handleCloseDialogs} maxWidth="md" fullWidth>
                <DialogTitle sx={{ backgroundColor: '#633394', color: 'white' }}>
                    Edit User
                </DialogTitle>
                <DialogContent dividers>
                    {renderUserForm(true)}
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDialogs} color="secondary">Cancel</Button>
                    <Button
                        onClick={handleUpdateUser}
                        variant="contained"
                        sx={{ backgroundColor: '#633394', '&:hover': { backgroundColor: '#7c52a5' } }}
                    >
                        Update User
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Delete User Dialog */}
            <Dialog open={openDeleteDialog} onClose={handleCloseDialogs}>
                <DialogTitle sx={{ backgroundColor: '#633394', color: 'white' }}>
                    Delete User
                </DialogTitle>
                <DialogContent dividers>
                    <Typography>
                        Are you sure you want to delete the user "{selectedUser?.username}"?
                        This action cannot be undone.
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDialogs} color="secondary">Cancel</Button>
                    <Button
                        onClick={handleDeleteUser}
                        variant="contained"
                        sx={{ backgroundColor: '#633394', '&:hover': { backgroundColor: '#7c52a5' } }}
                    >
                        Delete
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Upload File Dialog */}
            <Dialog open={openUploadDialogProp} onClose={handleCloseDialogs}>
                <DialogTitle sx={{ backgroundColor: '#633394', color: 'white' }}>
                    Upload Users File
                </DialogTitle>
                <DialogContent dividers>
                    <Typography gutterBottom>
                        Upload a CSV or XLSX file containing user data.
                        The file should have columns for username, email, password, etc.
                    </Typography>
                    <Box sx={{ mt: 2 }}>
                        <input
                            accept=".csv,.xlsx"
                            type="file"
                            onChange={handleFileChange}
                            style={{
                                padding: '10px',
                                border: `1px solid #633394`,
                                borderRadius: '4px'
                            }}
                        />
                        {uploadStatus && (
                            <Typography color="error" sx={{ mt: 1 }}>
                                {uploadStatus}
                            </Typography>
                        )}
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDialogs} color="secondary">Cancel</Button>
                    <Button
                        onClick={handleFileUpload}
                        variant="contained"
                        sx={{ backgroundColor: '#633394', '&:hover': { backgroundColor: '#7c52a5' } }}
                        disabled={!selectedFile}
                    >
                        Upload
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Welcome Email Dialog */}
            <Dialog
                open={openEmailDialog}
                onClose={() => { }} // Prevent closing by clicking outside
                disableEscapeKeyDown // Prevent closing with Escape key
                maxWidth="md"
                fullWidth
            >
                <DialogTitle sx={{ backgroundColor: '#633394', color: 'white' }}>
                    Welcome Email Preview
                </DialogTitle>
                <DialogContent dividers>
                    <Box sx={{ mb: 3 }}>
                        <Paper sx={{ p: 2, backgroundColor: '#f8f9fa', border: '2px solid #633394', borderRadius: '8px', mb: 2 }}>
                            <Typography variant="h6" sx={{ color: '#633394', fontWeight: 'bold', mb: 2 }}>
                                Email Details
                            </Typography>

                            <Box sx={{ mb: 2 }}>
                                <Typography variant="subtitle1" sx={{ color: '#633394', fontWeight: 'bold', mb: 1 }}>
                                    To:
                                </Typography>
                                <Box sx={{ p: 1, backgroundColor: 'white', borderRadius: '4px' }}>
                                    {emailData.to}
                                </Box>
                            </Box>

                            <Box sx={{ mb: 2 }}>
                                <Typography variant="subtitle1" sx={{ color: '#633394', fontWeight: 'bold', mb: 1 }}>
                                    Subject:
                                </Typography>
                                <Box sx={{ p: 1, backgroundColor: 'white', borderRadius: '4px' }}>
                                    {emailData.subject}
                                </Box>
                            </Box>

                            <Box>
                                <Typography variant="subtitle1" sx={{ color: '#633394', fontWeight: 'bold', mb: 1 }}>
                                    Message Body:
                                </Typography>
                                <Box sx={{
                                    p: 2,
                                    backgroundColor: 'white',
                                    borderRadius: '4px',
                                    border: '1px solid #e0e0e0',
                                    maxHeight: '400px',
                                    overflowY: 'auto',
                                    whiteSpace: 'pre-line',
                                    fontFamily: 'monospace',
                                    fontSize: '0.9rem'
                                }}>
                                    {emailData.body}
                                </Box>
                            </Box>
                        </Paper>

                        <Paper sx={{
                            p: 2,
                            backgroundColor: emailSent ? '#e8f5e8' : '#fff3e0',
                            border: emailSent ? '2px solid #4caf50' : '2px solid #ff9800',
                            borderRadius: '8px'
                        }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                <Typography variant="h6" sx={{
                                    color: emailSent ? '#2e7d32' : '#e65100',
                                    fontWeight: 'bold',
                                    display: 'flex',
                                    alignItems: 'center'
                                }}>
                                    {emailSent ? 'Email Sent Successfully!' : 'Ready to Send'}
                                </Typography>
                            </Box>

                            <Box sx={{ mt: 1 }}>
                                <Typography variant="body1" sx={{ color: emailSent ? '#2e7d32' : '#e65100', mb: 1 }}>
                                    <strong>Username:</strong> {emailData.username}
                                </Typography>
                                <Typography variant="body1" sx={{ color: emailSent ? '#2e7d32' : '#e65100' }}>
                                    <strong>Password:</strong> {emailData.password}
                                </Typography>
                            </Box>

                            {emailSent && (
                                <Typography variant="body1" sx={{
                                    color: '#2e7d32',
                                    mt: 2,
                                    display: 'flex',
                                    alignItems: 'center'
                                }}>
                                    The welcome email has been delivered to {emailData.to}
                                </Typography>
                            )}
                        </Paper>
                    </Box>
                </DialogContent>
                <DialogActions>
                    {!emailSent && (
                        <Button
                            onClick={handleSendWelcomeEmail}
                            variant="contained"
                            disabled={emailSending}
                            startIcon={emailSending ? <CircularProgress size={20} color="inherit" /> : null}
                            sx={{
                                backgroundColor: '#4caf50',
                                '&:hover': { backgroundColor: '#45a049' },
                                mr: 1
                            }}
                        >
                            {emailSending ? 'Sending...' : 'Send Email'}
                        </Button>
                    )}
                    <Button
                        onClick={handleCloseEmailDialog}
                        variant="contained"
                        sx={{
                            backgroundColor: '#633394',
                            '&:hover': { backgroundColor: '#7c52a5' }
                        }}
                    >
                        Close
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Email Template Preview Dialog */}
            <EmailPreviewDialog
                open={emailPreviewDialogOpen}
                onClose={handleCloseEmailPreview}
                templateType="welcome"
                userVariables={{
                    username: formData.username || 'john_doe',
                    email: formData.email || 'john.doe@example.com',
                    firstname: formData.firstname || 'John',
                    lastname: formData.lastname || 'Doe',
                    password: '[Generated Password]',
                    survey_code: '[Generated Survey Code]',
                    organization_name: organizations.find(org => org.id.toString() === formData.organization_id?.toString())?.name || 'Sample Organization'
                }}
                selectedTemplate={selectedEmailTemplate}
            />

            {/* Email Preview Dialog */}
            <EmailPreviewDialog
                open={openEmailPreviewDialog}
                onClose={() => setOpenEmailPreviewDialog(false)}
                templateType="welcome"
                userVariables={{
                    username: formData.username,
                    email: formData.email,
                    firstname: formData.firstname,
                    password: '[Generated Password]',
                    survey_code: '[Generated Survey Code]',
                    organization_name: organizations.find(org => org.id === formData.organization_id)?.name || ''
                }}
            />

            {/* Bulk Delete Dialog */}
            <Dialog open={openBulkDeleteDialog} onClose={() => !bulkActionLoading && setOpenBulkDeleteDialog(false)} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ bgcolor: '#633394', color: 'white' }}>
                    Delete {selectedUserIds.length} User(s)
                </DialogTitle>
                <DialogContent sx={{ mt: 2 }}>
                    <Typography>
                        Are you sure you want to delete <strong>{selectedUserIds.length}</strong> user(s)?
                    </Typography>
                    <Alert severity="warning" sx={{ mt: 2 }}>
                        This action cannot be undone. All selected users and their associated data will be permanently removed.
                    </Alert>
                    <Box sx={{ mt: 2, maxHeight: 200, overflowY: 'auto' }}>
                        {users.filter(u => selectedUserIds.includes(u.id)).map(user => (
                            <Box key={user.id} sx={{ p: 1, mb: 0.5, bgcolor: '#f5f5f5', borderRadius: 1 }}>
                                <Typography variant="body2">
                                    <strong>{user.username}</strong> — {user.email}
                                </Typography>
                            </Box>
                        ))}
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenBulkDeleteDialog(false)} disabled={bulkActionLoading}>Cancel</Button>
                    <Button
                        variant="contained"
                        color="error"
                        onClick={handleBulkDeleteUsers}
                        disabled={bulkActionLoading}
                        startIcon={bulkActionLoading ? <CircularProgress size={20} color="inherit" /> : <DeleteIcon />}
                    >
                        {bulkActionLoading ? 'Deleting...' : `Delete ${selectedUserIds.length} User(s)`}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Bulk Reminder Dialog */}
            <Dialog open={openBulkReminderDialog} onClose={() => !bulkActionLoading && setOpenBulkReminderDialog(false)} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ bgcolor: '#633394', color: 'white' }}>
                    Send Bulk Reminders
                </DialogTitle>
                <DialogContent sx={{ mt: 2 }}>
                    <Typography sx={{ mt: 1 }}>
                        You are about to send reminder emails to <strong>{selectedUserIds.length}</strong> user(s).
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        This will send a survey reminder email to each selected user.
                    </Typography>
                    {bulkActionLoading && (
                        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                            <CircularProgress size={30} sx={{ color: '#633394' }} />
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenBulkReminderDialog(false)} disabled={bulkActionLoading}>Cancel</Button>
                    <Button
                        variant="contained"
                        onClick={handleBulkSendReminders}
                        disabled={bulkActionLoading}
                        startIcon={bulkActionLoading ? <CircularProgress size={20} color="inherit" /> : <SendIcon />}
                        sx={{ bgcolor: '#633394', '&:hover': { bgcolor: '#7c52a5' } }}
                    >
                        {bulkActionLoading ? 'Sending...' : `Send to ${selectedUserIds.length} Users`}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Snackbar for notifications */}
            <Snackbar
                open={snackbar.open}
                autoHideDuration={4000}
                onClose={() => setSnackbar({ ...snackbar, open: false })}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            >
                <Alert
                    onClose={() => setSnackbar({ ...snackbar, open: false })}
                    severity={snackbar.severity}
                    variant="filled"
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
}

export default UsersManagement;
