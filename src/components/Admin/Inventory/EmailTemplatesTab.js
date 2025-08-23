// src/components/Admin/Inventory/EmailTemplatesTab.js
import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  useMediaQuery,
  useTheme,
  
  
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  FormControlLabel,
  Checkbox,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ClearIcon from '@mui/icons-material/Clear';
import SearchIcon from '@mui/icons-material/Search';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import VisibilityIcon from '@mui/icons-material/Visibility';
import InventoryService from '../../../services/Admin/Inventory/InventoryService';
import { EmailService } from '../../../services/EmailService';

/**
 * A simple CRUD interface for managing email templates from the admin inventory page.
 * Focus is on MVP functionality: list, add, edit & delete templates.
 * More advanced features (preview, placeholders, rich-text editor) can be added later.
 */
const EmailTemplatesTab = ({ emailTemplates = [], onRefreshData, organizationId = null, organizations = [] }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    subject: '',
    html_body: '',
    text_body: '',
    organization_id: '',
    is_public: false,
  });

  // State for HTML generation mode
  const [autoGenerateHtml, setAutoGenerateHtml] = useState(true);

  // State for sample template selection
  const [sampleTemplates, setSampleTemplates] = useState([]);
  const [selectedSampleTemplate, setSelectedSampleTemplate] = useState('');
  const [loadingSampleTemplates, setLoadingSampleTemplates] = useState(false);

  // State for email preview
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [previewContent, setPreviewContent] = useState('');
  const [previewLoading, setPreviewLoading] = useState(false);

  // Function to convert text to HTML
  const convertTextToHtml = (text) => {
    if (!text.trim()) return '';
    
    // Split text into paragraphs
    const paragraphs = text.split('\n\n').filter(p => p.trim());
    
    // Basic HTML email template with platform colors
    let html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${formData.subject || 'Email'}</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #3B1C55;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #FBFAFA;
        }
        .email-container {
            background-color: #ffffff;
            border-radius: 8px;
            box-shadow: 0 1px 3px rgba(59, 28, 85, 0.1);
            overflow: hidden;
        }
        .header {
            background: linear-gradient(135deg, #61328E 0%, #633394 100%);
            color: white;
            padding: 30px;
            text-align: center;
        }
        .header h2 {
            margin: 0;
            font-size: 24px;
            font-weight: 600;
            color: #ffffff;
        }
        .content {
            padding: 30px;
            background-color: #ffffff;
        }
        .footer {
            background-color: #FBFAFA;
            border-top: 1px solid #967CB2;
            padding: 20px 30px;
            font-size: 14px;
            color: #3B1C55;
            text-align: center;
        }
        p {
            margin: 0 0 16px 0;
            color: #3B1C55;
        }
        .greeting {
            font-weight: 600;
            color: #61328E;
            margin-bottom: 20px;
            font-size: 16px;
        }
        .signature {
            margin-top: 30px;
            border-top: 1px solid #967CB2;
            padding-top: 20px;
            color: #3B1C55;
        }
        a {
            color: #61328E;
            text-decoration: none;
            font-weight: 500;
        }
        a:hover {
            text-decoration: underline;
            color: #633394;
        }
        .button {
            display: inline-block;
            background: linear-gradient(135deg, #61328E 0%, #633394 100%);
            color: white;
            padding: 12px 24px;
            border-radius: 6px;
            text-decoration: none;
            font-weight: 600;
            margin: 10px 0;
            border: none;
            cursor: pointer;
        }
        .button:hover {
            background: linear-gradient(135deg, #633394 0%, #967CB2 100%);
        }
        .highlight {
            background-color: #FBFAFA;
            border-left: 4px solid #61328E;
            padding: 16px;
            margin: 20px 0;
            border-radius: 0 6px 6px 0;
        }
        .accent-text {
            color: #61328E;
            font-weight: 600;
        }
        .secondary-text {
            color: #967CB2;
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="header">
            <h2>${formData.subject || 'Email Subject'}</h2>
        </div>
        
        <div class="content">
`;

    // Process each paragraph
    paragraphs.forEach((paragraph, index) => {
      const trimmedParagraph = paragraph.trim();
      
      // Check if it's a greeting (first paragraph starting with Dear, Hello, Hi, etc.)
      if (index === 0 && /^(Dear|Hello|Hi|Greetings)/i.test(trimmedParagraph)) {
        html += `        <p class="greeting">${trimmedParagraph}</p>\n`;
      }
      // Check if it's a signature block (contains "Best regards", "Sincerely", etc.)
      else if (/^(Best regards|Sincerely|Thank you|Thanks|Regards)/i.test(trimmedParagraph)) {
        html += `        </div>
        
        <div class="signature">
            <p>${trimmedParagraph}</p>
`;
      }
      // Regular paragraph
      else {
        html += `            <p>${trimmedParagraph}</p>\n`;
      }
    });

    // Close remaining tags
    if (!html.includes('<div class="signature">')) {
      html += `        </div>
`;
    } else {
      html += `        </div>
`;
    }

    html += `        
        <div class="footer">
            <p>This email was sent from the Saurara Platform.</p>
        </div>
    </div>
</body>
</html>`;

    return html;
  };

  // Handle text body changes with auto HTML generation
  const handleTextBodyChange = (newTextBody) => {
    setFormData(prev => ({
      ...prev,
      text_body: newTextBody,
      html_body: autoGenerateHtml ? convertTextToHtml(newTextBody) : prev.html_body
    }));
  };

  // Handle subject changes (affects HTML generation)
  const handleSubjectChange = (newSubject) => {
    setFormData(prev => {
      const updatedFormData = { ...prev, subject: newSubject };
      return {
        ...updatedFormData,
        html_body: autoGenerateHtml && prev.text_body ? convertTextToHtml(prev.text_body) : prev.html_body
      };
    });
  };

  // Fetch sample templates when dialog opens
  const fetchSampleTemplates = async () => {
    if (sampleTemplates.length > 0) return; // Already loaded
    
    try {
      setLoadingSampleTemplates(true);
      // Fetch public templates and default templates as samples
      const response = await EmailService.getTemplates();
      const data = response.templates || response;
      const samples = (data || []).filter(template => 
        template.is_public || 
        (template.name && (template.name.includes('Default') || template.name.includes('Sample')))
      );
      setSampleTemplates(samples);
    } catch (err) {
      console.error('Error fetching sample templates:', err);
      setSampleTemplates([]);
    } finally {
      setLoadingSampleTemplates(false);
    }
  };

  // Handle sample template selection
  const handleSampleTemplateSelect = (templateId) => {
    if (!templateId) {
      setSelectedSampleTemplate('');
      return;
    }
    
    const template = sampleTemplates.find(t => t.id.toString() === templateId);
    if (template) {
      setSelectedSampleTemplate(templateId);
      // Don't auto-copy yet, let user decide
    }
  };

  // Copy selected sample template to form
  const copySampleTemplate = () => {
    const template = sampleTemplates.find(t => t.id.toString() === selectedSampleTemplate);
    if (!template) return;

    setFormData(prev => ({
      ...prev,
      name: `Copy of ${template.name}`,
      subject: template.subject || '',
      html_body: template.html_body || '',
      text_body: template.text_body || '',
      // Don't copy organization_id or is_public - let user set these
    }));
    
    // Disable auto-generation since we're copying existing HTML
    setAutoGenerateHtml(false);
    setSelectedSampleTemplate('');
  };

  // Copy an existing template to create a new one
  const copyExistingTemplate = (template) => {
    setEditingTemplate(null);
    setFormData({
      name: `Copy of ${template.name}`,
      subject: template.subject || '',
      html_body: template.html_body || '',
      text_body: template.text_body || '',
      organization_id: template.organization_id || '',
      is_public: false, // Reset to private by default
    });
    setAutoGenerateHtml(false); // Don't auto-generate when copying existing HTML
    setDialogOpen(true);
  };

  // Generate sample variables for template preview (using backend rendering)
  const getSampleVariables = (organizationName = 'Sample Organization') => {
    return {
      greeting: 'Dear John Doe',
      username: 'johndoe',
      email: 'john.doe@example.com',
      password: '********',
      survey_code: 'SURVEY123',
      organization_name: organizationName,
      first_name: 'John',
      last_name: 'Doe',
      login_url: 'https://platform.saurara.com/login',
      survey_url: 'https://platform.saurara.com/survey/SURVEY123',
      support_email: 'support@saurara.com',
      user_fullname: 'John Doe',
      platform_name: 'Saurara Platform',
      current_date: new Date().toLocaleDateString(),
      current_year: new Date().getFullYear().toString(),
    };
  };

  // Render template content with variables using backend service
  const renderTemplateContent = async (templateType, htmlContent, organizationName = 'Sample Organization') => {
    try {
      // For default template types (welcome, reminder), use the backend render service
      if (templateType === 'welcome' || templateType === 'reminder') {
        const variables = getSampleVariables(organizationName);
        const renderedPreview = await EmailService.renderPreview(templateType, variables);
        return renderedPreview.html_body || htmlContent;
      }
      
      // For custom templates, we can't use backend rendering since they don't match template types
      // Fall back to simple variable replacement (this is a limitation until backend supports custom template rendering)
      const variables = getSampleVariables(organizationName);
      let processedHtml = htmlContent;
      
      // Replace common template variables manually as fallback
      Object.entries(variables).forEach(([key, value]) => {
        const singleBrace = new RegExp(`{${key}}`, 'gi');
        const doubleBrace = new RegExp(`{{${key}}}`, 'gi');
        processedHtml = processedHtml.replace(singleBrace, value);
        processedHtml = processedHtml.replace(doubleBrace, value);
      });
      
      return processedHtml;
    } catch (error) {
      console.error('Error rendering template:', error);
      // Fallback to original content if rendering fails
      return htmlContent;
    }
  };

  // Generate preview content with sample variables
  const generatePreviewContent = async () => {
    let htmlContent = formData.html_body;
    
    // If auto-generating HTML and we have text content, use that
    if (autoGenerateHtml && formData.text_body.trim()) {
      htmlContent = convertTextToHtml(formData.text_body);
    }
    
    if (!htmlContent.trim()) {
      return '<p style="color: #666; text-align: center; padding: 40px;">No content to preview. Please add text or HTML content.</p>';
    }
    
    // Get organization name for context
    const selectedOrg = orgOptions.find(org => org.id.toString() === formData.organization_id?.toString());
    const organizationName = selectedOrg?.name || 'Sample Organization';
    
    // Determine template type based on name (for backend rendering)
    const templateName = formData.name?.toLowerCase() || '';
    let templateType = 'custom';
    if (templateName.includes('welcome')) {
      templateType = 'welcome';
    } else if (templateName.includes('reminder')) {
      templateType = 'reminder';
    }
    
    return await renderTemplateContent(templateType, htmlContent, organizationName);
  };

  // Open preview dialog
  const openPreview = async () => {
    try {
      const content = await generatePreviewContent();
      setPreviewContent(content);
      setPreviewDialogOpen(true);
    } catch (error) {
      console.error('Error generating preview:', error);
      setPreviewContent('<p style="color: #f44336; text-align: center; padding: 40px;">Error generating preview. Please check your template content.</p>');
      setPreviewDialogOpen(true);
    }
  };

  // Close preview dialog
  const closePreview = () => {
    setPreviewDialogOpen(false);
    setPreviewContent('');
  };

  // Preview an existing template
  const previewExistingTemplate = async (template) => {
    let previewHtml = template.html_body || '<p style="color: #666; text-align: center; padding: 40px;">No HTML content available for this template.</p>';
    
    // Use the centralized variable replacement function
    const organizationName = template.organization_name || 'Sample Organization';
    // Determine template type based on name (for backend rendering)
    const templateName = template.name?.toLowerCase() || '';
    let templateType = 'custom';
    if (templateName.includes('welcome')) {
      templateType = 'welcome';
    } else if (templateName.includes('reminder')) {
      templateType = 'reminder';
    }
    
    previewHtml = await renderTemplateContent(templateType, previewHtml, organizationName);

    // Temporarily set form data for preview display
    const tempFormData = {
      name: template.name,
      subject: template.subject,
      html_body: template.html_body,
      text_body: template.text_body
    };
    
    const prevFormData = formData;
    setFormData(tempFormData);
    setPreviewContent(previewHtml);
    setPreviewDialogOpen(true);
    
    // Reset form data when preview closes
    setTimeout(() => setFormData(prevFormData), 100);
  };

  // State for organizations (roles removed)
  const [orgOptions, setOrgOptions] = useState(organizations || []);
  const [isLoadingOrgs, setIsLoadingOrgs] = useState(false);

  // Ensure organization options are available in the dialog
  useEffect(() => {
    if (Array.isArray(organizations) && organizations.length > 0) {
      setOrgOptions(organizations);
    }
  }, [organizations]);

  // Ensure organizations are available when opening the dialog
  useEffect(() => {
    const ensureOrgs = async () => {
      if (!dialogOpen) return;
      if (orgOptions && orgOptions.length > 0) return;
      try {
        setIsLoadingOrgs(true);
        const data = await InventoryService.getOrganizations();
        setOrgOptions(Array.isArray(data) ? data : []);
      } catch (loadErr) {
        console.error('Failed to load organizations for email template dialog:', loadErr);
        setOrgOptions([]);
      } finally {
        setIsLoadingOrgs(false);
      }
    };
    ensureOrgs();
  }, [dialogOpen, orgOptions]);

  // State for filtering and search
  const [searchTerm, setSearchTerm] = useState('');
  const [filterOrganization, setFilterOrganization] = useState('');
  const [filterRole, setFilterRole] = useState('');
  
  // State for tracking data inconsistencies
  const [dataWarnings, setDataWarnings] = useState([]);
  
  // State for initializing default templates
  const [initializingTemplates, setInitializingTemplates] = useState(false);

  // Removed survey template loading; email templates no longer associate to survey templates here

  // No auto-fill from global filter; require explicit selection in the dialog

  // Removed survey template re-validation effect

  // Filter and search logic with error boundary
  let filteredTemplates = [];
  try {
    console.log('EmailTemplatesTab received templates:', emailTemplates);
    filteredTemplates = (emailTemplates || []).filter((template) => {
    try {
      // Debug logging for first template to understand data structure
      if (emailTemplates && emailTemplates.length > 0 && template === emailTemplates[0]) {
        console.log('Sample email template structure:', template);
        console.log('Current filters:', { filterOrganization, filterRole, searchTerm });
      }
      // Ensure template has required properties
      if (!template || typeof template !== 'object') {
        return false;
      }

      // Search by name or subject only (roles removed)
      const matchesSearch = !searchTerm || 
        (template.name && template.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (template.subject && template.subject.toLowerCase().includes(searchTerm.toLowerCase()));

      // Organization filter by template.organization_id
      const matchesOrganization = !filterOrganization || (
        typeof template.organization_id !== 'undefined' && 
        template.organization_id === parseInt(filterOrganization, 10)
      );

      // Role filter removed
      const matchesRole = true;

      return matchesSearch && matchesOrganization && matchesRole;
    } catch (error) {
      console.error('Error filtering template:', template, error);
      return false;
    }
    });
  } catch (filterError) {
    console.error('Critical error in email template filtering:', filterError);
    // Fallback to showing all templates if filtering fails
    filteredTemplates = emailTemplates || [];
  }

  // Clear all filters
  const clearFilters = () => {
    setSearchTerm('');
    setFilterOrganization('');
    setFilterRole('');
    // Refresh data without filters
    onRefreshData && onRefreshData(null);
  };

  const resetForm = () => {
    setFormData({ 
      name: '', 
      subject: '', 
      html_body: '', 
      text_body: '',
      organization_id: '',
      is_public: false,
    });
    setAutoGenerateHtml(true);
  };

  const openAddDialog = () => {
    setEditingTemplate(null);
    resetForm();
    setDialogOpen(true);
    fetchSampleTemplates(); // Load sample templates when opening
  };

  const openEditDialog = (template) => {
    setEditingTemplate(template);
    
    // Clear previous warnings
    setDataWarnings([]);
    const warnings = [];
    
    // Survey template association removed; roles removed
    
    // Set warnings if any were found
    if (warnings.length > 0) {
      setDataWarnings(warnings);
    }
    
    setFormData({
      name: template.name || '',
      subject: template.subject || '',
      html_body: template.html_body || '',
      text_body: template.text_body || '',
      organization_id: template.organization_id || organizationId || '',
      is_public: template.is_public || false,
    });
    // Don't auto-generate HTML when editing existing templates
    setAutoGenerateHtml(false);
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    // Reset form data when closing to ensure clean state for next dialog open
    resetForm();
    setEditingTemplate(null);
    setDataWarnings([]);
    setSelectedSampleTemplate('');
  };

  const handleSave = async () => {
    // Organization must be explicitly selected in the dialog
    const effectiveOrganizationId = formData.organization_id;

    // Client-side validation
    if (!effectiveOrganizationId) {
      alert('Organization is required.');
      return;
    }
    if (!formData.name.trim()) {
      alert('Template name is required.');
      return;
    }
    
    if (!formData.subject.trim()) {
      alert('Subject is required.');
      return;
    }
    
    if (!formData.html_body.trim()) {
      alert('HTML body is required.');
      return;
    }

    try {
      const payload = {
        name: formData.name.trim(),
        subject: formData.subject.trim(),
        html_body: formData.html_body.trim(),
        text_body: formData.text_body.trim(),
        organization_id: Number(effectiveOrganizationId),
        is_public: formData.is_public,
      };

      if (editingTemplate) {
        await EmailService.updateTemplate(editingTemplate.id, payload);
      } else {
        await EmailService.createTemplate(payload);
      }
      closeDialog();
      onRefreshData && onRefreshData();
    } catch (err) {
      console.error('Failed to save email template:', err.response || err);
      
      // Handle API error responses with user-friendly messages
      if (err.response && err.response.data) {
        const errorData = err.response.data;
        if (errorData.error) {
          alert(`Error: ${errorData.error}`);
        } else {
          alert('Unable to save template. Please check your input and try again.');
        }
      } else if (err.message) {
        alert(`Error: ${err.message}`);
      } else {
        alert('Unable to save template. Please try again.');
      }
    }
  };

  const handleDelete = async (templateId) => {
    if (!window.confirm('Are you sure you want to delete this template?')) return;
    try {
      await EmailService.deleteTemplate(templateId);
      onRefreshData && onRefreshData();
    } catch (err) {
      console.error('Failed to delete email template:', err.response || err);
      alert('Unable to delete template. Please try again.');
    }
  };

  const handleInitializeDefaultTemplates = async () => {
    if (!window.confirm('This will create default Welcome and Reminder email templates. Continue?')) {
      return;
    }

    setInitializingTemplates(true);
    try {
      const result = await EmailService.initializeDefaultTemplates();
      alert(`Success! Created ${result.templates_created.length} default templates: ${result.templates_created.join(', ')}`);
      onRefreshData && onRefreshData();
    } catch (err) {
      console.error('Failed to initialize default templates:', err);
      alert('Failed to initialize default templates. They may already exist or there was an error.');
    } finally {
      setInitializingTemplates(false);
    }
  };

  return (
    <Box>
      <Typography
        variant={isMobile ? 'subtitle1' : 'h6'}
        gutterBottom
        sx={{ color: '#633394', fontWeight: 'bold', fontSize: isMobile ? '1.1rem' : '1.25rem' }}
      >
        Email Templates
      </Typography>

      <Paper sx={{ p: isMobile ? 1.5 : 2, mb: 3, backgroundColor: '#f5f5f5', boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)' }}>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            size={isMobile ? 'small' : 'medium'}
            onClick={openAddDialog}
            sx={{
              backgroundColor: '#633394',
              transition: 'all 0.2s ease-in-out',
              fontSize: isMobile ? '0.75rem' : '0.875rem',
              '&:hover': {
                backgroundColor: '#7c52a5',
                transform: 'translateY(-1px)',
                boxShadow: '0 4px 8px rgba(99, 51, 148, 0.3)',
              },
              '&:active': {
                transform: 'translateY(0)',
                boxShadow: '0 2px 4px rgba(99, 51, 148, 0.3)',
              },
            }}
          >
            Add New Template
          </Button>
          <Button
            variant="outlined"
            size={isMobile ? 'small' : 'medium'}
            onClick={handleInitializeDefaultTemplates}
            disabled={initializingTemplates}
            sx={{ 
              color: '#633394', 
              borderColor: '#633394',
              fontSize: isMobile ? '0.75rem' : '0.875rem',
              '&:hover': { 
                backgroundColor: '#f5f5f5',
                borderColor: '#7c52a5'
              }
            }}
          >
            {initializingTemplates ? 'Initializing...' : 'Initialize Defaults'}
          </Button>
        </Box>
      </Paper>

      {/* Search and Filter Controls */}
      <Paper sx={{ p: isMobile ? 1.5 : 2, mb: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6} md={4}>
            <TextField
              fullWidth
              size="small"
              label="Search templates"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: <SearchIcon sx={{ color: 'action.active', mr: 1 }} />,
              }}
            />
          </Grid>
          
          {/* Survey Template filter removed */}
          
          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Organization</InputLabel>
              <Select
                value={filterOrganization}
                label="Organization"
                onChange={(e) => {
                  try {
                    console.log('Organization filter changed to:', e.target.value);
                    setFilterOrganization(e.target.value);
                    // Refresh data with new filter
                    onRefreshData && onRefreshData(e.target.value || null);
                  } catch (error) {
                    console.error('Error setting organization filter:', error);
                  }
                }}
              >
                <MenuItem value="">All Organizations</MenuItem>
                {(organizations || []).map((org) => (
                  <MenuItem key={org.id} value={org.id}>
                    {org.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          {/* Role filter removed */}
          
          <Grid item xs={12} sm={6} md={2}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<ClearIcon />}
              onClick={clearFilters}
              size="small"
              sx={{
                borderColor: '#633394',
                color: '#633394',
                '&:hover': {
                  borderColor: '#7c52a5',
                  backgroundColor: 'rgba(99, 51, 148, 0.04)',
                },
              }}
            >
              Clear
            </Button>
          </Grid>
        </Grid>
      </Paper>

      <Paper sx={{ p: isMobile ? 1.5 : 2 }}>
        {filteredTemplates.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="body1" color="text.secondary">
              {(emailTemplates || []).length === 0 
                ? 'No email templates found. Create your first template to get started.'
                : 'No templates match your current filters. Try adjusting your search or filters.'
              }
            </Typography>
          </Box>
        ) : (
          <List>
            {filteredTemplates.map((tpl) => {
              const isDefaultTemplate = tpl.name && (tpl.name.includes('Default Welcome') || tpl.name.includes('Default Reminder'));
              const templateTypeChip = tpl.name?.includes('Welcome') ? 'Welcome Email' : 
                                     tpl.name?.includes('Reminder') ? 'Reminder Email' : 
                                     'Custom';
              
              const orgText = tpl.organization_name ? `Organization: ${tpl.organization_name}` : '';
              const secondaryText = [tpl.subject, orgText].filter(Boolean).join(' • ');
              
              return (
                <ListItem 
                  key={tpl.id} 
                  divider 
                  sx={{ 
                    flexDirection: 'column', 
                    alignItems: 'flex-start',
                    backgroundColor: isDefaultTemplate ? '#fafafa' : 'inherit',
                    border: isDefaultTemplate ? '1px solid #e0e0e0' : 'none',
                    borderRadius: isDefaultTemplate ? 1 : 0,
                    mb: isDefaultTemplate ? 1 : 0
                  }}
                >
                  <Box sx={{ display: 'flex', width: '100%', alignItems: 'flex-start' }}>
                    <Box sx={{ flex: 1, mr: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: isDefaultTemplate ? 'bold' : 'normal' }}>
                          {tpl.name}
                        </Typography>
                        {isDefaultTemplate && (
                          <Box sx={{ 
                            backgroundColor: '#f3f4f6', 
                            color: '#374151', 
                            px: 1, 
                            py: 0.25, 
                            borderRadius: 1, 
                            fontSize: '0.75rem',
                            fontWeight: 'bold',
                            border: '1px solid #d1d5db'
                          }}>
                            DEFAULT
                          </Box>
                        )}
                        <Box sx={{ 
                          backgroundColor: '#f9fafb', 
                          color: '#6b7280', 
                          px: 1, 
                          py: 0.25, 
                          borderRadius: 1, 
                          fontSize: '0.75rem',
                          border: '1px solid #e5e7eb'
                        }}>
                          {templateTypeChip}
                        </Box>
                        {tpl.is_public && (
                          <Box sx={{ 
                            backgroundColor: '#fef3f2', 
                            color: '#b91c1c', 
                            px: 1, 
                            py: 0.25, 
                            borderRadius: 1, 
                            fontSize: '0.75rem',
                            border: '1px solid #fecaca'
                          }}>
                            PUBLIC
                          </Box>
                        )}
                      </Box>
                      <Typography variant="body2" color="text.secondary">
                        {secondaryText}
                      </Typography>
                    </Box>
                    <ListItemSecondaryAction>
                      <IconButton 
                        edge="end" 
                        onClick={async () => await previewExistingTemplate(tpl)}
                        title="Preview this template"
                        sx={{ mr: 0.5 }}
                      >
                        <VisibilityIcon />
                      </IconButton>
                      <IconButton 
                        edge="end" 
                        onClick={() => copyExistingTemplate(tpl)}
                        title="Copy this template"
                        sx={{ mr: 0.5 }}
                      >
                        <ContentCopyIcon />
                      </IconButton>
                      <IconButton 
                        edge="end" 
                        onClick={() => openEditDialog(tpl)}
                        title="Edit this template"
                        sx={{ mr: 0.5 }}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton 
                        edge="end" 
                        onClick={() => handleDelete(tpl.id)}
                        disabled={isDefaultTemplate}
                        title={isDefaultTemplate ? "Cannot delete default templates" : "Delete template"}
                      >
                        <DeleteIcon sx={{ color: isDefaultTemplate ? '#ccc' : 'inherit' }} />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </Box>
                </ListItem>
              );
            })}
          </List>
        )}
      </Paper>

      {/* Add / Edit dialog */}
      <Dialog open={dialogOpen} onClose={closeDialog} fullWidth maxWidth="md" fullScreen={isMobile}>
        <DialogTitle>{editingTemplate ? 'Edit Email Template' : 'Add Email Template'}</DialogTitle>
        
        {/* Display data warnings if any */}
        {dataWarnings.length > 0 && (
          <Box sx={{ px: 3, pb: 1 }}>
            {dataWarnings.map((warning, index) => (
              <Box
                key={index}
                sx={{
                  p: 2,
                  mb: 1,
                  backgroundColor: '#fff3cd',
                  border: '1px solid #ffeaa7',
                  borderRadius: 1,
                  color: '#856404',
                }}
              >
                <Typography variant="body2">
                  ⚠️ {warning}
                </Typography>
              </Box>
            ))}
          </Box>
        )}
        
        <DialogContent>
          {/* Organization selector (required) */}
          <FormControl fullWidth margin="normal" size={isMobile ? 'small' : 'medium'}>
            <InputLabel id="org-select-label">Organization</InputLabel>
            <Select
              labelId="org-select-label"
              value={formData.organization_id || ''}
              label="Organization"
              onChange={(e) => setFormData({ ...formData, organization_id: e.target.value })}
            >
              {isLoadingOrgs && (
                <MenuItem disabled>Loading organizations…</MenuItem>
              )}
              {!isLoadingOrgs && (orgOptions || []).length === 0 && (
                <MenuItem disabled>No organizations available</MenuItem>
              )}
              {!isLoadingOrgs && (orgOptions || []).map((org) => (
                <MenuItem key={org.id} value={org.id}>
                  {org.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Sample Template Selection - only show for new templates */}
          {!editingTemplate && (
            <>
              <FormControl fullWidth margin="normal" size={isMobile ? 'small' : 'medium'}>
                <InputLabel id="sample-template-label">Start from Sample Template (Optional)</InputLabel>
                <Select
                  labelId="sample-template-label"
                  value={selectedSampleTemplate}
                  label="Start from Sample Template (Optional)"
                  onChange={(e) => handleSampleTemplateSelect(e.target.value)}
                  disabled={loadingSampleTemplates}
                >
                  <MenuItem value="">Create from scratch</MenuItem>
                  {loadingSampleTemplates && (
                    <MenuItem disabled>Loading sample templates...</MenuItem>
                  )}
                  {!loadingSampleTemplates && sampleTemplates.map((template) => (
                    <MenuItem key={template.id} value={template.id.toString()}>
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                          {template.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {template.subject} • {template.organization_name || 'Public'}
                        </Typography>
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {selectedSampleTemplate && (
                <Box sx={{ mt: 2, p: 2, backgroundColor: '#f5f5f5', borderRadius: 1 }}>
                  <Typography variant="body2" sx={{ mb: 1, fontWeight: 'bold' }}>
                    Preview: {sampleTemplates.find(t => t.id.toString() === selectedSampleTemplate)?.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ mb: 2, display: 'block' }}>
                    Subject: {sampleTemplates.find(t => t.id.toString() === selectedSampleTemplate)?.subject}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                      variant="contained"
                      size="small"
                      onClick={copySampleTemplate}
                      sx={{ 
                        backgroundColor: '#633394',
                        fontSize: '0.75rem',
                        '&:hover': { backgroundColor: '#7c52a5' }
                      }}
                    >
                      Copy This Template
                    </Button>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => setSelectedSampleTemplate('')}
                      sx={{ 
                        borderColor: '#633394',
                        color: '#633394',
                        fontSize: '0.75rem'
                      }}
                    >
                      Cancel
                    </Button>
                  </Box>
                </Box>
              )}
            </>
          )}

          <TextField
            label="Template Name"
            fullWidth
            margin="normal"
            size={isMobile ? 'small' : 'medium'}
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
          <TextField
            label="Subject"
            fullWidth
            margin="normal"
            size={isMobile ? 'small' : 'medium'}
            value={formData.subject}
            onChange={(e) => handleSubjectChange(e.target.value)}
          />
          {/* Auto-generate HTML toggle */}
          <FormControlLabel
            control={
              <Checkbox
                checked={autoGenerateHtml}
                onChange={(e) => setAutoGenerateHtml(e.target.checked)}
                color="primary"
              />
            }
            label="Auto-generate HTML from text content"
            sx={{ mt: 2, mb: 1 }}
          />
          
          <TextField
            label="Text Content"
            fullWidth
            multiline
            rows={6}
            margin="normal"
            size={isMobile ? 'small' : 'medium'}
            value={formData.text_body}
            onChange={(e) => handleTextBodyChange(e.target.value)}
            helperText="Write your email content here. Separate paragraphs with empty lines. HTML will be auto-generated if enabled above."
          />
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 2, mb: 1 }}>
            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
              HTML Body:
            </Typography>
            {!autoGenerateHtml && (
              <Button
                variant="outlined"
                size="small"
                onClick={() => setFormData(prev => ({ ...prev, html_body: convertTextToHtml(prev.text_body) }))}
                disabled={!formData.text_body.trim()}
                sx={{ 
                  borderColor: '#633394',
                  color: '#633394',
                  fontSize: '0.75rem',
                  '&:hover': { 
                    backgroundColor: 'rgba(99, 51, 148, 0.04)',
                    borderColor: '#7c52a5'
                  }
                }}
              >
                Generate HTML from Text
              </Button>
            )}
          </Box>
          
          <TextField
            fullWidth
            multiline
            rows={8}
            size={isMobile ? 'small' : 'medium'}
            value={formData.html_body}
            onChange={(e) => setFormData({ ...formData, html_body: e.target.value })}
            helperText={autoGenerateHtml ? "This will be auto-generated from your text content above" : "Edit the HTML version of your email, or use the button above to generate from text"}
            disabled={autoGenerateHtml}
            sx={{ mt: 0 }}
          />
          
          <FormControlLabel
            control={
              <Checkbox
                checked={formData.is_public}
                onChange={(e) => setFormData({ ...formData, is_public: e.target.checked })}
                color="primary"
              />
            }
            label="Make this template public (available to all organizations)"
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDialog}>Cancel</Button>
          <Button 
            onClick={openPreview}
            variant="outlined"
            disabled={!formData.html_body.trim() && !formData.text_body.trim()}
            sx={{ 
              borderColor: '#633394',
              color: '#633394',
              '&:hover': { 
                backgroundColor: 'rgba(99, 51, 148, 0.04)',
                borderColor: '#7c52a5'
              }
            }}
          >
            Preview
          </Button>
          <Button onClick={handleSave} variant="contained" sx={{ backgroundColor: '#633394' }}>
            {editingTemplate ? 'Update' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Email Preview Dialog */}
      <Dialog 
        open={previewDialogOpen} 
        onClose={closePreview} 
        fullWidth 
        maxWidth="md"
        fullScreen={isMobile}
      >
        <DialogTitle sx={{ borderBottom: '1px solid #e0e0e0' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="h6">Email Preview</Typography>
            <Typography variant="body2" color="text.secondary">
              Subject: {formData.subject || 'No subject'}
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ p: 0 }}>
          {/* Preview Info Banner */}
          <Box sx={{ 
            backgroundColor: '#f5f5f5', 
            p: 2, 
            borderBottom: '1px solid #e0e0e0',
            display: 'flex',
            alignItems: 'center',
            gap: 1
          }}>
            <Typography variant="body2" color="text.secondary">
              📧 This preview shows how your email will appear to recipients with sample data.
            </Typography>
          </Box>
          
          {/* Email Preview Content */}
          <Box sx={{ 
            minHeight: '400px',
            backgroundColor: '#ffffff',
            border: '1px solid #e0e0e0',
            m: 2,
            borderRadius: 1,
            overflow: 'hidden'
          }}>
            <iframe
              title="Email Preview"
              srcDoc={previewContent}
              style={{
                width: '100%',
                height: '500px',
                border: 'none',
                backgroundColor: 'white'
              }}
            />
          </Box>
          
          {/* Sample Variables Info */}
          <Box sx={{ p: 2, backgroundColor: '#f9f9f9', borderTop: '1px solid #e0e0e0' }}>
            <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>
              Available Template Variables:
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', lineHeight: 1.4 }}>
              <strong>User Variables:</strong> {'{greeting}'}, {'{username}'}, {'{email}'}, {'{first_name}'}, {'{last_name}'}, {'{user_fullname}'}<br/>
              <strong>Survey Variables:</strong> {'{survey_code}'}, {'{survey_url}'}, {'{login_url}'}<br/>
              <strong>Organization:</strong> {'{organization_name}'}<br/>
              <strong>Platform:</strong> {'{platform_name}'}, {'{support_email}'}, {'{current_date}'}, {'{current_year}'}<br/>
              <em>Note: Use {'{variable}'} or {'{{variable}}'} format in your templates.</em>
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={closePreview}>Close</Button>
          <Button 
            variant="outlined"
            onClick={() => {
              // Copy preview HTML to clipboard
              navigator.clipboard.writeText(previewContent).then(() => {
                alert('Email HTML copied to clipboard!');
              }).catch(() => {
                alert('Failed to copy to clipboard');
              });
            }}
            sx={{ 
              borderColor: '#633394',
              color: '#633394'
            }}
          >
            Copy HTML
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default EmailTemplatesTab;
