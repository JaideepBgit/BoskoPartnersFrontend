// ============================================================================
// CREATE/EDIT AUDIENCE PAGE
// ============================================================================
// Full page for creating or editing audiences with multiple selection methods
// ============================================================================

import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Container,
  Paper,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography,
  Tabs,
  Tab,
  Chip,
  Autocomplete,
  CircularProgress,
  Alert
} from '@mui/material';
import { ArrowBack as ArrowBackIcon, Save as SaveIcon } from '@mui/icons-material';
import InternalHeader from '../../shared/Headers/InternalHeader';
import AudienceService from '../../../services/Admin/AudienceService';

const CreateAudiencePage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);
  
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  
  // Form data
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [audienceType, setAudienceType] = useState('users');
  
  // Selection data
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [selectedOrganizations, setSelectedOrganizations] = useState([]);
  const [selectedAssociations, setSelectedAssociations] = useState([]);
  
  // Survey response filters
  const [surveyFilters, setSurveyFilters] = useState({
    template_id: '',
    status: '',
    organization_id: '',
    organization_type_id: ''
  });
  const [filteredUsers, setFilteredUsers] = useState([]);
  
  // Options for dropdowns
  const [users, setUsers] = useState([]);
  const [organizations, setOrganizations] = useState([]);
  const [organizationTypes, setOrganizationTypes] = useState([]);
  const [surveyTemplates, setSurveyTemplates] = useState([]);

  useEffect(() => {
    loadOptions();
    if (isEdit && id) {
      loadAudienceData();
    }
  }, [isEdit, id]);

  const loadOptions = async () => {
    try {
      const [usersData, orgsData, orgTypesData, templatesData] = await Promise.all([
        AudienceService.getAllUsers(),
        AudienceService.getAllOrganizations(),
        AudienceService.getOrganizationTypes(),
        AudienceService.getSurveyTemplates()
      ]);
      
      setUsers(usersData.users || usersData || []);
      setOrganizations(orgsData.organizations || orgsData || []);
      setOrganizationTypes(orgTypesData.organization_types || orgTypesData || []);
      setSurveyTemplates(templatesData.templates || templatesData || []);
    } catch (err) {
      setError('Failed to load options: ' + err.message);
    }
  };

  const loadAudienceData = async () => {
    try {
      setLoading(true);
      const data = await AudienceService.getAudience(id);
      setName(data.name);
      setDescription(data.description || '');
      setAudienceType(data.audience_type);
      
      // Load selected items
      if (data.user_ids && data.user_ids.length > 0) {
        const selected = users.filter(u => data.user_ids.includes(u.id));
        setSelectedUsers(selected);
      }
      
      if (data.organization_ids && data.organization_ids.length > 0) {
        const selected = organizations.filter(o => data.organization_ids.includes(o.id));
        setSelectedOrganizations(selected);
      }
      
      if (data.organization_type_ids && data.organization_type_ids.length > 0) {
        const selected = organizationTypes.filter(ot => data.organization_type_ids.includes(ot.id));
        setSelectedAssociations(selected);
      }
    } catch (err) {
      setError('Failed to load audience data: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterSurveyResponses = async () => {
    try {
      setLoading(true);
      const data = await AudienceService.getUsersFromSurveyResponses(surveyFilters);
      setFilteredUsers(data.users || []);
      
      // Auto-select these users
      const usersToAdd = data.users.map(u => users.find(user => user.id === u.id)).filter(Boolean);
      setSelectedUsers(prev => {
        const combined = [...prev, ...usersToAdd];
        // Remove duplicates
        return combined.filter((user, index, self) => 
          index === self.findIndex(u => u.id === user.id)
        );
      });
      
      setSuccess(`Found ${data.users.length} user(s) matching filters. They have been added to your selection.`);
    } catch (err) {
      setError('Failed to filter survey responses: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      
      if (!name.trim()) {
        setError('Audience name is required');
        return;
      }
      
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
      
      const audienceData = {
        name: name.trim(),
        description: description.trim(),
        audience_type: audienceType,
        created_by: currentUser.id,
        user_ids: selectedUsers.length > 0 ? JSON.stringify(selectedUsers.map(u => u.id)) : null,
        organization_ids: selectedOrganizations.length > 0 ? JSON.stringify(selectedOrganizations.map(o => o.id)) : null,
        organization_type_ids: selectedAssociations.length > 0 ? JSON.stringify(selectedAssociations.map(a => a.id)) : null
      };
      
      if (isEdit) {
        await AudienceService.updateAudience(id, audienceData);
        setSuccess('Audience updated successfully');
      } else {
        await AudienceService.createAudience(audienceData);
        setSuccess('Audience created successfully');
      }
      
      // Navigate back after a short delay
      setTimeout(() => {
        navigate('/audiences');
      }, 1500);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <InternalHeader
        title={isEdit ? 'Edit Audience' : 'Create New Audience'}
        leftActions={
          <Button
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate('/audiences')}
          >
            Audiences
          </Button>
        }
        rightActions={
          <>
            <Button
              variant="outlined"
              onClick={() => navigate('/audiences')}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              startIcon={saving ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
              onClick={handleSave}
              disabled={loading || !name.trim()}
            >
              {loading ? (isEdit ? 'Updating...' : 'Creating...') : (isEdit ? 'Update Audience' : 'Save Audience')}
            </Button>
          </>
        }
      />
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ maxWidth: 900, mx: 'auto' }}>
          {/* Alerts */}
          {error && (
            <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          {success && (
            <Alert severity="success" onClose={() => setSuccess(null)} sx={{ mb: 2 }}>
              {success}
            </Alert>
          )}

        <Paper sx={{ p: 4, boxShadow: 3 }}>
          {/* Basic Info */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" sx={{ mb: 2, color: '#633394', fontWeight: 'bold' }}>
              Basic Information
            </Typography>
            
            <TextField
              fullWidth
              label="Audience Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              sx={{ mb: 2 }}
            />
            
            <TextField
              fullWidth
              label="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              multiline
              rows={3}
              sx={{ mb: 2 }}
            />
            
            <FormControl fullWidth>
              <InputLabel>Audience Type</InputLabel>
              <Select
                value={audienceType}
                onChange={(e) => setAudienceType(e.target.value)}
                label="Audience Type"
              >
                <MenuItem value="users">Individual Users</MenuItem>
                <MenuItem value="organizations">Organizations</MenuItem>
                <MenuItem value="associations">Associations (Organization Types)</MenuItem>
                <MenuItem value="mixed">Mixed</MenuItem>
              </Select>
            </FormControl>
          </Box>
          
          {/* Selection Tabs */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" sx={{ mb: 2, color: '#633394', fontWeight: 'bold' }}>
              Select Members
            </Typography>
            
            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
              <Tabs value={activeTab} onChange={(e, v) => setActiveTab(v)}>
                <Tab label="Select Users" />
                <Tab label="Select Organizations" />
                <Tab label="Select Associations" />
                <Tab label="From Survey Responses" />
              </Tabs>
            </Box>
            
            {/* Tab 0: Select Users */}
            {activeTab === 0 && (
              <Box>
                <Autocomplete
                  multiple
                  options={users}
                  value={selectedUsers}
                  onChange={(e, newValue) => setSelectedUsers(newValue)}
                  getOptionLabel={(option) => `${option.firstname} ${option.lastname} (${option.email})`}
                  renderInput={(params) => (
                    <TextField {...params} label="Select Users" placeholder="Search users..." />
                  )}
                  renderTags={(value, getTagProps) =>
                    value.map((option, index) => (
                      <Chip
                        key={option.id}
                        label={`${option.firstname} ${option.lastname}`}
                        {...getTagProps({ index })}
                        size="small"
                      />
                    ))
                  }
                />
                <Typography variant="caption" color="textSecondary" sx={{ mt: 1, display: 'block' }}>
                  {selectedUsers.length} user(s) selected
                </Typography>
              </Box>
            )}
            
            {/* Tab 1: Select Organizations */}
            {activeTab === 1 && (
              <Box>
                <Autocomplete
                  multiple
                  options={organizations}
                  value={selectedOrganizations}
                  onChange={(e, newValue) => setSelectedOrganizations(newValue)}
                  getOptionLabel={(option) => option.name}
                  renderInput={(params) => (
                    <TextField {...params} label="Select Organizations" placeholder="Search organizations..." />
                  )}
                  renderTags={(value, getTagProps) =>
                    value.map((option, index) => (
                      <Chip key={option.id} label={option.name} {...getTagProps({ index })} size="small" />
                    ))
                  }
                />
                <Typography variant="caption" color="textSecondary" sx={{ mt: 1, display: 'block' }}>
                  {selectedOrganizations.length} organization(s) selected
                </Typography>
              </Box>
            )}
            
            {/* Tab 2: Select Associations */}
            {activeTab === 2 && (
              <Box>
                <Autocomplete
                  multiple
                  options={organizationTypes}
                  value={selectedAssociations}
                  onChange={(e, newValue) => setSelectedAssociations(newValue)}
                  getOptionLabel={(option) => option.name}
                  renderInput={(params) => (
                    <TextField {...params} label="Select Organization Types" placeholder="Search types..." />
                  )}
                  renderTags={(value, getTagProps) =>
                    value.map((option, index) => (
                      <Chip key={option.id} label={option.name} {...getTagProps({ index })} size="small" />
                    ))
                  }
                />
                <Typography variant="caption" color="textSecondary" sx={{ mt: 1, display: 'block' }}>
                  {selectedAssociations.length} association(s) selected
                </Typography>
              </Box>
            )}
            
            {/* Tab 3: From Survey Responses */}
            {activeTab === 3 && (
              <Box>
                <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                  Filter users based on their survey responses
                </Typography>
                
                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel>Survey Template</InputLabel>
                  <Select
                    value={surveyFilters.template_id}
                    onChange={(e) => setSurveyFilters({ ...surveyFilters, template_id: e.target.value })}
                    label="Survey Template"
                  >
                    <MenuItem value="">All Templates</MenuItem>
                    {surveyTemplates.map(template => (
                      <MenuItem key={template.id} value={template.id}>
                        {template.name || template.survey_code}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                
                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={surveyFilters.status}
                    onChange={(e) => setSurveyFilters({ ...surveyFilters, status: e.target.value })}
                    label="Status"
                  >
                    <MenuItem value="">All Statuses</MenuItem>
                    <MenuItem value="draft">Draft</MenuItem>
                    <MenuItem value="in_progress">In Progress</MenuItem>
                    <MenuItem value="submitted">Submitted</MenuItem>
                    <MenuItem value="completed">Completed</MenuItem>
                  </Select>
                </FormControl>
                
                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel>Organization</InputLabel>
                  <Select
                    value={surveyFilters.organization_id}
                    onChange={(e) => setSurveyFilters({ ...surveyFilters, organization_id: e.target.value })}
                    label="Organization"
                  >
                    <MenuItem value="">All Organizations</MenuItem>
                    {organizations.map(org => (
                      <MenuItem key={org.id} value={org.id}>{org.name}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
                
                <Button
                  variant="contained"
                  onClick={handleFilterSurveyResponses}
                  disabled={loading}
                  fullWidth
                >
                  {loading ? <CircularProgress size={24} /> : 'Filter & Add Users'}
                </Button>
              </Box>
            )}
          </Box>
        </Paper>
        </Box>
      </Container>
    </>
  );
};

export default CreateAudiencePage;
