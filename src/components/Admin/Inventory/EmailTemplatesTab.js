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
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ClearIcon from '@mui/icons-material/Clear';
import SearchIcon from '@mui/icons-material/Search';
import InventoryService from '../../../services/Admin/Inventory/InventoryService';

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
    survey_template_ids: [],
    organization_id: '',
  });

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

  // Removed survey template loading; email templates no longer associate to survey templates here

  // No auto-fill from global filter; require explicit selection in the dialog

  // Removed survey template re-validation effect

  // Filter and search logic with error boundary
  let filteredTemplates = [];
  try {
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
  };

  const resetForm = () => {
    setFormData({ 
      name: '', 
      subject: '', 
      html_body: '', 
      text_body: '',
      survey_template_ids: [],
      organization_id: '',
    });
  };

  const openAddDialog = () => {
    setEditingTemplate(null);
    resetForm();
    setDialogOpen(true);
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
    });
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    // Reset form data when closing to ensure clean state for next dialog open
    resetForm();
    setEditingTemplate(null);
    setDataWarnings([]);
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
        ...formData,
        // Survey template association removed; backend still expects field on create path, send empty list
        survey_template_ids: [],
        organization_id: effectiveOrganizationId ? Number(effectiveOrganizationId) : effectiveOrganizationId,
      };

      if (editingTemplate) {
        await InventoryService.updateEmailTemplate(editingTemplate.id, payload);
      } else {
        await InventoryService.addEmailTemplate(payload);
      }
      closeDialog();
      onRefreshData && onRefreshData();
    } catch (err) {
      console.error('Failed to save email template:', err.response || err);
      
      // Handle API error responses with user-friendly messages
      if (err.response && err.response.data) {
        const errorData = err.response.data;
        if (errorData.details) {
          // Handle validation errors with specific field details
          let errorMessage = 'Validation failed:\n';
          if (errorData.details.survey_templates) {
            errorMessage += `• Survey Templates: ${errorData.details.survey_templates.join(', ')}\n`;
          }
          if (errorData.details.organization_roles) {
            errorMessage += `• Organization Roles: ${errorData.details.organization_roles.join(', ')}\n`;
          }
          alert(errorMessage);
        } else if (errorData.error) {
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
      await InventoryService.deleteEmailTemplate(templateId);
      onRefreshData && onRefreshData();
    } catch (err) {
      console.error('Failed to delete email template:', err.response || err);
      alert('Unable to delete template. Please try again.');
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
              // Build secondary text with survey templates and audiences
              const surveyTemplateNames = tpl.survey_templates && tpl.survey_templates.length > 0
                ? tpl.survey_templates.map(st => st.survey_code || st.version_name).join(', ')
                : '';
              
              const secondaryText = [tpl.subject, surveyTemplateNames].filter(Boolean).join(' • ');
              
              return (
                <ListItem key={tpl.id} divider sx={{ flexDirection: 'column', alignItems: 'flex-start' }}>
                  <Box sx={{ display: 'flex', width: '100%', alignItems: 'flex-start' }}>
                    <ListItemText 
                      primary={tpl.name} 
                      secondary={secondaryText}
                      sx={{ flex: 1, mr: 2 }}
                    />
                    <ListItemSecondaryAction>
                      <IconButton edge="end" onClick={() => openEditDialog(tpl)}>
                        <EditIcon />
                      </IconButton>
                      <IconButton edge="end" sx={{ ml: 1 }} onClick={() => handleDelete(tpl.id)}>
                        <DeleteIcon />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </Box>
                  
                  {/* Roles chips removed */}
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
            onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
          />
          <TextField
            label="HTML Body"
            fullWidth
            multiline
            rows={6}
            margin="normal"
            size={isMobile ? 'small' : 'medium'}
            value={formData.html_body}
            onChange={(e) => setFormData({ ...formData, html_body: e.target.value })}
          />
          <TextField
            label="Text Body (optional)"
            fullWidth
            multiline
            rows={4}
            margin="normal"
            size={isMobile ? 'small' : 'medium'}
            value={formData.text_body}
            onChange={(e) => setFormData({ ...formData, text_body: e.target.value })}
          />
          
          {/* Survey Template and Roles selection removed */}
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDialog}>Cancel</Button>
          <Button onClick={handleSave} variant="contained" sx={{ backgroundColor: '#633394' }}>
            {editingTemplate ? 'Update' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default EmailTemplatesTab;
