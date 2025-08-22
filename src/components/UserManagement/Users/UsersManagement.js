import React, { useState, useEffect, useRef } from 'react';
import { 
    Box, Typography, Button, Table, TableBody, TableCell, TableContainer, 
    TableHead, TableRow, Paper, IconButton, Dialog, DialogActions, 
    DialogContent, DialogTitle, TextField, Select, MenuItem, FormControl, 
    InputLabel, TablePagination, Card, CardContent, Grid, Chip, useTheme,
    Autocomplete, CircularProgress, Tooltip, Stack
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import { 
    fetchUsers, addUser, updateUser, deleteUser, 
    fetchOrganizations, fetchRoles, uploadUserFile, addRole,
    addUserOrganizationalRole, fetchUserOrganizationalRoles,
    updateUserOrganizationalRoles, fetchTemplatesByOrganization
} from '../../../services/UserManagement/UserManagementService';
import InventoryService from '../../../services/Admin/Inventory/InventoryService';
import EmailService from '../../../services/EmailService';
// import GooglePlacesAutocomplete from '../common/GooglePlacesAutocomplete';
// import GooglePlacesAutocomplete from '../common/GooglePlacesAutocompleteSimple';
// import ManualAddressInput from '../common/ManualAddressInput';
import MapAddressSelector from '../common/MapAddressSelector';
import EnhancedAddressInput from '../common/EnhancedAddressInput';
import EmailPreviewDialog from '../common/EmailPreviewDialog';
import SurveyAssignmentCard from './SurveyAssignmentCard';

function UsersManagement() {
    const theme = useTheme();
    
    // State variables
    const [users, setUsers] = useState([]);
    const [organizations, setOrganizations] = useState([]);
    const [roles, setRoles] = useState([]);
    const [templates, setTemplates] = useState([]);
    const [emailTemplates, setEmailTemplates] = useState([]);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [totalUsers, setTotalUsers] = useState(0);
    
    // Dialog states
    const [openAddDialog, setOpenAddDialog] = useState(false);
    const [openEditDialog, setOpenEditDialog] = useState(false);
    const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
    const [openUploadDialog, setOpenUploadDialog] = useState(false);
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
        roles: [],
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
    const [addingOrganizationalRole, setAddingOrganizationalRole] = useState(false);
    const [emailPreviewLoading, setEmailPreviewLoading] = useState(false);
    const [selectedEmailTemplate, setSelectedEmailTemplate] = useState(null);
    const [emailPreviewDialogOpen, setEmailPreviewDialogOpen] = useState(false);

    // New state variables for improved organizational roles workflow
    const [selectedOrganizationId, setSelectedOrganizationId] = useState('');
    const [selectedRoleType, setSelectedRoleType] = useState('');
    const [organizationalRoleToAdd, setOrganizationalRoleToAdd] = useState('');
    
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

    // Generate email preview content
    const generateWelcomeEmailPreview = () => {
        const firstname = formData.firstname || 'User';
        const username = formData.username || 'your-username';
        const email = formData.email || 'user@example.com';
        const password = formData.password || 'auto-generated-password';
        const organizationName = formData.organization_id ? 
            organizations.find(org => org.id === parseInt(formData.organization_id))?.name || 'Organization' : 
            'Organization';
        
        // Generate a sample survey code (UUID format)
        const surveyCode = `survey-${Math.random().toString(36).substr(2, 9)}-${Date.now().toString(36)}`;
        
        const subject = `🎉 Welcome to Saurara! Your Account is Ready`;
        
        // Text version
        const textVersion = `Welcome to Saurara, ${firstname}!

We're thrilled to have you join our community! We have created an account for you and you can now take surveys.

=== YOUR ACCOUNT DETAILS ===
📧 Email: ${email}
👤 Username: ${username}
🔑 Password: ${password}
🏢 Organization: ${organizationName}
🎯 Survey Code: ${surveyCode}

=== GETTING STARTED ===
1. Visit our platform at: https://saurara.com
2. Log in using your credentials above
3. Use your Survey Code (${surveyCode}) to access your assigned surveys
4. Complete your profile setup
5. Please complete your survey and use reports to generate reports

=== IMPORTANT: YOUR SURVEY CODE ===
Your unique Survey Code is: ${surveyCode}

This code is required to access your assigned surveys and assessments. 
Keep it safe and use it whenever you need to participate in surveys.

=== WHAT'S NEXT? ===
• Complete your user profile
• Take part in surveys and assessments using your Survey Code
• Connect with your organization
• Use reports to generate insights

Welcome aboard, ${firstname}! We're excited to see what you'll accomplish with Saurara.

Best regards,
The Saurara Team

---
© ${new Date().getFullYear()} Saurara. All rights reserved.
This email was sent to ${email}. If you received this email in error, please contact support@saurara.com`;

        // HTML version
        const htmlVersion = `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to Saurara</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #633394 0%, #7c52a5 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 15px rgba(0,0,0,0.1); }
        .details-box { background: #f8f9fa; border: 2px solid #633394; border-radius: 8px; padding: 20px; margin: 20px 0; }
        .details-title { color: #633394; font-weight: bold; margin-bottom: 15px; font-size: 18px; }
        .detail-item { margin: 8px 0; padding: 8px; background: white; border-radius: 4px; }
        .section { margin: 25px 0; }
        .section-title { color: #633394; font-weight: bold; font-size: 16px; margin-bottom: 10px; border-bottom: 2px solid #633394; padding-bottom: 5px; }
        .steps { background: #e3f2fd; padding: 15px; border-radius: 8px; margin: 10px 0; }
        .step { margin: 5px 0; padding: 5px 0; }
        .footer { text-align: center; margin-top: 30px; padding: 20px; background: #f5f5f5; border-radius: 8px; color: #666; }
        .btn { background: #633394; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 10px 0; }
        .btn:hover { background: #7c52a5; }
        .emoji { font-size: 1.2em; margin-right: 5px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎉 Welcome to Saurara!</h1>
            <p>Your account is ready to use, ${firstname}!</p>
        </div>
        
        <div class="content">
            <p>We're thrilled to have you join our community! We have created an account for you and you can now take surveys.</p>
            
            <div class="details-box">
                <div class="details-title"><span class="emoji">🔐</span>Your Account Details</div>
                <div class="detail-item"><strong>📧 Email:</strong> ${email}</div>
                <div class="detail-item"><strong>👤 Username:</strong> ${username}</div>
                <div class="detail-item"><strong>🔑 Password:</strong> ${password}</div>
                <div class="detail-item"><strong>🏢 Organization:</strong> ${organizationName}</div>
                <div class="detail-item"><strong>🎯 Survey Code:</strong> ${surveyCode}</div>
            </div>
            
            <div class="section">
                <div class="section-title"><span class="emoji">🚀</span>Getting Started</div>
                <div class="steps">
                    <div class="step">1. Visit our platform at: <strong>https://saurara.com</strong></div>
                    <div class="step">2. Log in using your credentials above</div>
                    <div class="step">3. Use your Survey Code (<strong>${surveyCode}</strong>) to access your assigned surveys</div>
                    <div class="step">4. Complete your profile setup</div>
                    <div class="step">5. Please complete your survey and use reports to generate reports</div>
                </div>
                <a href="https://saurara.com" class="btn">Access Saurara Platform</a>
            </div>
            
            <div class="section">
                <div class="section-title"><span class="emoji">🎯</span>Important: Your Survey Code</div>
                <div class="details-box" style="background: #fff3e0; border: 2px solid #ff9800;">
                    <div style="text-align: center; padding: 10px;">
                        <p style="font-size: 18px; font-weight: bold; color: #e65100; margin: 0;">
                            Your unique Survey Code is: <span style="background: #ffcc02; padding: 5px 10px; border-radius: 4px; color: #000;">${surveyCode}</span>
                        </p>
                        <p style="margin: 10px 0 0 0; color: #e65100;">
                            This code is required to access your assigned surveys and assessments. Keep it safe and use it whenever you need to participate in surveys.
                        </p>
                    </div>
                </div>
            </div>
            
            <div class="section">
                <div class="section-title"><span class="emoji">📋</span>What's Next?</div>
                <ul>
                    <li>Complete your user profile</li>
                    <li>Take part in surveys and assessments using your Survey Code</li>
                    <li>Connect with your organization</li>
                    <li>Use reports to generate insights</li>
                </ul>
            </div>
            
            <p>Welcome aboard, ${firstname}! We're excited to see what you'll accomplish with Saurara.</p>
            
            <p><strong>Best regards,</strong><br>The Saurara Team</p>
            
            <div class="footer">
                <p>© ${new Date().getFullYear()} Saurara. All rights reserved.</p>
                <p>This email was sent to ${email}. If you received this email in error, please contact support@saurara.com</p>
            </div>
        </div>
    </div>
</body>
</html>`;

        setEmailPreviewData({
            textVersion,
            htmlVersion,
            subject,
            to: email
        });
    };

    // Load data on component mount
    useEffect(() => {
        loadUsers();
        loadOrganizations();
        loadRoles();
    }, []);

    // Load users from API
    const loadUsers = async () => {
        try {
            const data = await fetchUsers();
            console.log(data);
            setUsers(data);
            setTotalUsers(data.length);
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
            const data = await InventoryService.getEmailTemplates(organizationId);
            setEmailTemplates(data || []);
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
                setOpenUploadDialog(false);
                setSelectedFile(null);
                setUploadStatus('');
            }, 2000);
        } catch (error) {
            setUploadStatus(`Upload failed: ${error.message}`);
        }
    };

    // Open add user dialog
    const handleOpenAddDialog = () => {
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
            email_template_id: '',
            roles: [],
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
        setOpenAddDialog(true);
    };

    // Open edit user dialog
    const handleOpenEditDialog = async (user) => {
        setSelectedUser(user);
        
        // Load organizational roles for the user if they have the 'other' role
        let userRoles = user.roles || [];
        if (user.ui_role === 'other') {
            try {
                const organizationalRoles = await fetchUserOrganizationalRoles(user.id);
                userRoles = organizationalRoles || [];
            } catch (error) {
                console.warn('Failed to fetch organizational roles for user:', error);
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
        setOpenUploadDialog(true);
    };

    // Close all dialogs
    const handleCloseDialogs = () => {
        setOpenAddDialog(false);
        setOpenEditDialog(false);
        setOpenDeleteDialog(false);
        setOpenUploadDialog(false);
        setOpenEmailDialog(false);
        setSelectedUser(null);
        // Reset new organizational role fields
        setSelectedOrganizationId('');
        setSelectedRoleType('');
        setOrganizationalRoleToAdd('');
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
            const organizationalRoles = userData.roles || [];
            delete userData.roles;
            
            // First, create the user
            const newUser = await addUser(userData);
            console.log('Backend response for new user:', newUser);
            console.log('Password from backend:', newUser.password);
            console.log('Password from form:', formData.password);
            
            // Then, if there are organizational roles, save them
            if (organizationalRoles.length > 0) {
                try {
                    await updateUserOrganizationalRoles(newUser.id, { roles: organizationalRoles });
                } catch (roleError) {
                    console.warn('User created but failed to save organizational roles:', roleError);
                    alert('User created successfully, but there was an issue saving organizational roles. You can edit the user to add roles.');
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

    // New handlers for improved organizational roles workflow
    const handleAddOrganizationalRole = async () => {
        if (!selectedOrganizationId || !organizationalRoleToAdd.trim()) {
            alert('Please select an organization and enter a role type');
            return;
        }

        // Check if this role type already exists for this organization
        const existingRole = formData.roles.find(
            r => r.organization_id === parseInt(selectedOrganizationId) && r.role_type === organizationalRoleToAdd.trim()
        );

        if (existingRole) {
            alert('This role type already exists for the selected organization');
            return;
        }

        setAddingOrganizationalRole(true);
        try {
            // Add the new role to the roles table if it doesn't exist
            const roleData = {
                name: organizationalRoleToAdd.trim(),
                description: `Created for organizational role: ${organizationalRoleToAdd.trim()}`
            };
            
            // This will add to roles table
            await addRole(roleData);
            
            // Add the new organizational role to the form data
            const newRole = {
                organization_id: parseInt(selectedOrganizationId),
                role_type: organizationalRoleToAdd.trim(),
                id: Date.now() // Temporary ID for frontend display
            };

            setFormData({
                ...formData,
                roles: [...formData.roles, newRole]
            });

            // Reset the form
            setSelectedOrganizationId('');
            setOrganizationalRoleToAdd('');
            
            alert('Role added successfully!');
        } catch (error) {
            // If the role already exists in the database, that's okay
            if (error.response && error.response.status === 409) {
                // Role already exists, just add it to the form
                const newRole = {
                    organization_id: parseInt(selectedOrganizationId),
                    role_type: organizationalRoleToAdd.trim(),
                    id: Date.now()
                };

                setFormData({
                    ...formData,
                    roles: [...formData.roles, newRole]
                });

                setSelectedOrganizationId('');
                setOrganizationalRoleToAdd('');
                alert('Role was already in system, added to user successfully!');
            } else {
                console.error('Failed to add role:', error);
                alert(`Failed to add role: ${error.message}`);
            }
        } finally {
            setAddingOrganizationalRole(false);
        }
    };

    const handleRemoveOrganizationalRole = (organizationId, roleType) => {
        setFormData({
            ...formData,
            roles: formData.roles.filter(
                r => !(r.organization_id === organizationId && r.role_type === roleType)
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
                role: formData.ui_role, // Map ui_role to role for backend
                geo_location: hasValidGeoData(formData.geo_location) ? formData.geo_location : null
            };
            
            // Remove ui_role and roles from the user data as they're handled separately
            delete userData.ui_role;
            const organizationalRoles = userData.roles || [];
            delete userData.roles;
            
            // First, update the user
            await updateUser(selectedUser.id, userData);
            
            // Then, update organizational roles
            if (formData.ui_role === 'other') {
                try {
                    await updateUserOrganizationalRoles(selectedUser.id, { roles: organizationalRoles });
                } catch (roleError) {
                    console.warn('User updated but failed to save organizational roles:', roleError);
                    alert('User updated successfully, but there was an issue saving organizational roles.');
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
    const truncateText = (text, maxLength = 40) => {
        if (!text) return '';
        return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
    };

    // Render the users table
    const renderUsersTable = () => {
        return (
            <TableContainer component={Paper}>
                <Table>
                    <TableHead sx={{ backgroundColor: '#633394' }}>
                        <TableRow>
                            <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Username</TableCell>
                            <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Email</TableCell>
                            <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>First Name</TableCell>
                            <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Last Name</TableCell>
                            <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Phone</TableCell>
                            <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>User Address</TableCell>
                            <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Organization</TableCell>
                            <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {users
                            .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                            .map((user) => (
                                <TableRow key={user.id}>
                                    <TableCell>{user.username}</TableCell>
                                    <TableCell>{user.email}</TableCell>
                                    <TableCell>{user.firstname}</TableCell>
                                    <TableCell>{user.lastname}</TableCell>
                                    <TableCell>{user.phone || 'N/A'}</TableCell>
                                    <TableCell>
                                        {user.geo_location ? (
                                            <Box>
                                                {user.geo_location.address_line1 && (
                                                    <Typography variant="body2">
                                                        {user.geo_location.address_line1}
                                                    </Typography>
                                                )}
                                                {user.geo_location.address_line2 && (
                                                    <Typography variant="body2">
                                                        {user.geo_location.address_line2}
                                                    </Typography>
                                                )}
                                                <Typography variant="body2">
                                                    {[
                                                        user.geo_location.city,
                                                        user.geo_location.province,
                                                        user.geo_location.country,
                                                        user.geo_location.postal_code
                                                    ].filter(Boolean).join(', ')}
                                                </Typography>
                                            </Box>
                                        ) : 'N/A'}
                                    </TableCell>
                                    <TableCell>
                                        {user.organization ? (
                                            <Box>
                                                <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                                    {user.organization.name}
                                                </Typography>
                                                {user.organization.organization_type && (
                                                    <Typography variant="body2" color="textSecondary">
                                                        Type: {user.organization.organization_type.type}
                                                    </Typography>
                                                )}
                                                {user.organization.website && (
                                                    <Typography variant="body2" color="textSecondary">
                                                        Website: {user.organization.website}
                                                    </Typography>
                                                )}
                                            </Box>
                                        ) : (
                                            getOrganizationName(user.organization_id)
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <IconButton 
                                            onClick={() => handleOpenEditDialog(user)}
                                            color="primary"
                                        >
                                            <EditIcon />
                                        </IconButton>
                                        <IconButton 
                                            onClick={() => handleOpenDeleteDialog(user)}
                                            color="error"
                                        >
                                            <DeleteIcon />
                                        </IconButton>
                                    </TableCell>
                                </TableRow>
                            ))}
                    </TableBody>
                </Table>
                <TablePagination
                    rowsPerPageOptions={[5, 10, 25]}
                    component="div"
                    count={totalUsers}
                    rowsPerPage={rowsPerPage}
                    page={page}
                    onPageChange={handleChangePage}
                    onRowsPerPageChange={handleChangeRowsPerPage}
                />
            </TableContainer>
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
                        <Autocomplete
                            value={roles.find(role => role.name === formData.ui_role) || null}
                            onChange={(event, newValue) => {
                                setFormData({
                                    ...formData,
                                    ui_role: newValue ? newValue.name : ''
                                });
                            }}
                            options={roles}
                            getOptionLabel={(option) => option.name.charAt(0).toUpperCase() + option.name.slice(1)}
                            renderInput={(params) => (
                                <TextField
                                    {...params}
                                    label="UI Role"
                                    variant="outlined"
                                    required
                                />
                            )}
                            isOptionEqualToValue={(option, value) => option.name === value.name}
                            renderOption={(props, option) => (
                                <li {...props}>
                                    {option.name.charAt(0).toUpperCase() + option.name.slice(1)}
                                </li>
                            )}
                        />

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

                
                {/* Organizational Roles Section - Only shown when UI role is 'other' */}
                {formData.ui_role === 'other' && (
                    <Paper sx={{ p: 2, backgroundColor: '#f5f5f5', boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',mb: 3 }}>
                        <Typography variant="h6" gutterBottom sx={{ color: '#633394', fontWeight: 'bold', mb: 2, textAlign: 'center' }}>
                            Organizational Roles
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
                                            sx={{width: 300,  minHeight: '56px' }}
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
                                            label="Role Type"
                                            value={organizationalRoleToAdd}
                                            onChange={(e) => setOrganizationalRoleToAdd(e.target.value)}
                                            variant="outlined"
                                            placeholder="e.g., Manager, Coordinator, Member"
                                        />
                                    </Grid>
                                    <Grid item xs={12} md={4}>
                                        <Button 
                                            variant="contained" 
                                            fullWidth
                                            onClick={handleAddOrganizationalRole}
                                            disabled={!selectedOrganizationId || !organizationalRoleToAdd.trim() || addingOrganizationalRole}
                                            sx={{ 
                                                backgroundColor: '#633394',
                                                '&:hover': { backgroundColor: '#7c52a5' }
                                            }}
                                            startIcon={addingOrganizationalRole ? <CircularProgress size={20} color="inherit" /> : null}
                                        >
                                            {addingOrganizationalRole ? 'Adding...' : 'Add Role'}
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
                                                                    key={`${role.organization_id}-${role.role_type}`}
                                                                    label={role.role_type}
                                                                    color="primary"
                                                                    variant="filled"
                                                                    onDelete={() => handleRemoveOrganizationalRole(role.organization_id, role.role_type)}
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
                                label="🔍 Address Information"
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
                                onClick={() => {
                                    if (!showEmailPreview) {
                                        generateWelcomeEmailPreview();
                                    }
                                    setShowEmailPreview(!showEmailPreview);
                                }}
                                sx={{ 
                                    backgroundColor: '#633394', 
                                    '&:hover': { backgroundColor: '#7c52a5' },
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
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h5" sx={{ color: '#633394', fontWeight: 'bold' }}>
                    Users Management
                </Typography>
                <Box>
                    <Button 
                        variant="contained" 
                        startIcon={<AddIcon />} 
                        onClick={handleOpenAddDialog}
                        sx={{ mr: 1, backgroundColor: '#633394', '&:hover': { backgroundColor: '#7c52a5' } }}
                    >
                        Add User
                    </Button>
                    <Button 
                        variant="outlined" 
                        startIcon={<UploadFileIcon />} 
                        onClick={handleOpenUploadDialog}
                        sx={{ color: '#633394', borderColor: '#633394', '&:hover': { borderColor: '#7c52a5', color: '#7c52a5' } }}
                    >
                        Upload CSV/XLSX
                    </Button>
                </Box>
            </Box>

            <Card sx={{ mb: 4, boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)', backgroundColor: '#f5f5f5' }}>
                <CardContent>
                    <Typography variant="h6" gutterBottom sx={{ color: '#633394', fontWeight: 'bold' }}>
                        User Statistics
                    </Typography>
                    <Grid container spacing={2}>
                        <Grid item xs={12} sm={4}>
                            <Paper sx={{ p: 2, textAlign: 'center', boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)', backgroundColor: '#f5f5f5' }}>
                                <Typography variant="h4" sx={{ color: '#633394' }}>{users.length}</Typography>
                                <Typography variant="body2" sx={{ color: '#633394' }}>Total Users</Typography>
                            </Paper>
                        </Grid>
                        <Grid item xs={12} sm={4}>
                            <Paper sx={{ p: 2, textAlign: 'center', boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)', backgroundColor: '#f5f5f5' }}>
                                <Typography variant="h4" sx={{ color: '#633394' }}>
                                    {users.filter(user => user.ui_role === 'admin').length}
                                </Typography>
                                <Typography variant="body2" sx={{ color: '#633394' }}>Administrators</Typography>
                            </Paper>
                        </Grid>
                        <Grid item xs={12} sm={4}>
                            <Paper sx={{ p: 2, textAlign: 'center', boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)', backgroundColor: '#f5f5f5' }}>
                                <Typography variant="h4" sx={{ color: '#633394' }}>
                                    {users.filter(user => user.ui_role === 'user').length}
                                </Typography>
                                <Typography variant="body2" sx={{ color: '#633394' }}>Regular Users</Typography>
                            </Paper>
                        </Grid>
                    </Grid>
                </CardContent>
            </Card>

            {renderUsersTable()}

            {/* Survey Assignment Card */}
            <SurveyAssignmentCard 
                users={users} 
                onRefreshUsers={loadUsers}
            />

            {/* Add User Dialog */}
            <Dialog open={openAddDialog} onClose={handleCloseDialogs} maxWidth="md" fullWidth>
                <DialogTitle sx={{ backgroundColor: '#633394', color: 'white' }}>
                    Add New User
                </DialogTitle>
                <DialogContent dividers>
                    {renderUserForm()}
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDialogs} color="secondary">Cancel</Button>
                    <Button 
                        onClick={() => setOpenEmailPreviewDialog(true)}
                        variant="outlined"
                        disabled={!formData.username || !formData.email}
                        sx={{ 
                            color: '#633394', 
                            borderColor: '#633394',
                            '&:hover': { 
                                backgroundColor: '#f5f5f5',
                                borderColor: '#7c52a5'
                            }
                        }}
                    >
                        Preview Welcome Email
                    </Button>
                    <Button 
                        onClick={handleAddUser} 
                        variant="contained" 
                        sx={{ backgroundColor: '#633394', '&:hover': { backgroundColor: '#7c52a5' } }}
                    >
                        Add User
                    </Button>
                </DialogActions>
            </Dialog>

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
            <Dialog open={openUploadDialog} onClose={handleCloseDialogs}>
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
                onClose={() => {}} // Prevent closing by clicking outside
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
                                    <span style={{ fontSize: '1.2em', marginRight: '5px' }}>📧</span> To:
                                </Typography>
                                <Box sx={{ p: 1, backgroundColor: 'white', borderRadius: '4px' }}>
                                    {emailData.to}
                                </Box>
                            </Box>
                            
                            <Box sx={{ mb: 2 }}>
                                <Typography variant="subtitle1" sx={{ color: '#633394', fontWeight: 'bold', mb: 1 }}>
                                    <span style={{ fontSize: '1.2em', marginRight: '5px' }}>📝</span> Subject:
                                </Typography>
                                <Box sx={{ p: 1, backgroundColor: 'white', borderRadius: '4px' }}>
                                    {emailData.subject}
                                </Box>
                            </Box>
                            
                            <Box>
                                <Typography variant="subtitle1" sx={{ color: '#633394', fontWeight: 'bold', mb: 1 }}>
                                    <span style={{ fontSize: '1.2em', marginRight: '5px' }}>✉️</span> Message Body:
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
                                    <span style={{ fontSize: '1.2em', marginRight: '8px' }}>
                                        {emailSent ? '✅' : '📧'}
                                    </span>
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
                                    <span style={{ fontSize: '1.2em', marginRight: '8px' }}>📨</span>
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
        </Box>
    );
}

export default UsersManagement;
