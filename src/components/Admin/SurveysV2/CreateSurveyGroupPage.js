import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box, Container, Typography, Button, TextField, Paper, Divider,
  Autocomplete, Checkbox, List, ListItem, ListItemText, ListItemIcon,
  CircularProgress, Alert, Chip
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlank';
import CheckBoxIcon from '@mui/icons-material/CheckBox';
import Navbar from '../../shared/Navbar/Navbar';
import InventoryService from '../../../services/Admin/Inventory/InventoryService';

const CreateSurveyGroupPage = () => {
  const navigate = useNavigate();
  const { groupId } = useParams();
  const isEditing = Boolean(groupId);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedOrganizationId, setSelectedOrganizationId] = useState('');

  const [organizations, setOrganizations] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [selectedSurveyIds, setSelectedSurveyIds] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadData();
  }, [groupId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [orgs, tmpls] = await Promise.all([
        InventoryService.getOrganizations().catch(() => []),
        InventoryService.getTemplates().catch(() => []),
      ]);
      setOrganizations(orgs);
      setTemplates(tmpls);

      if (isEditing) {
        const versions = await InventoryService.getTemplateVersions();
        const group = versions.find(v => String(v.id) === String(groupId));
        if (group) {
          setName(group.name);
          setDescription(group.description || '');
          setSelectedOrganizationId(group.organization_id || '');
          // Pre-select surveys belonging to this group
          const groupSurveys = tmpls.filter(t => t.version_id === group.id);
          setSelectedSurveyIds(groupSurveys.map(s => s.id));
        }
      }
    } catch (err) {
      console.error('Error loading data:', err);
      setError('Failed to load data.');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!name || !selectedOrganizationId) {
      setError('Please provide a name and select an organization.');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      if (isEditing) {
        await InventoryService.updateTemplateVersion(groupId, name, description, selectedOrganizationId);
      } else {
        await InventoryService.addTemplateVersion(name, description, selectedOrganizationId);
      }
      navigate('/surveys-v2/groups');
    } catch (err) {
      console.error('Error saving survey group:', err);
      setError('Failed to save survey group. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleSurvey = (surveyId) => {
    setSelectedSurveyIds(prev =>
      prev.includes(surveyId) ? prev.filter(id => id !== surveyId) : [...prev, surveyId]
    );
  };

  const selectedOrg = organizations.find(o => o.id === selectedOrganizationId);

  if (loading) {
    return (
      <>
        <Navbar />
        <Container maxWidth="lg" sx={{ py: 4, minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
            <CircularProgress sx={{ color: '#633394' }} />
          </Box>
        </Container>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <Container maxWidth="lg" sx={{ py: 4, minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Button
              variant="outlined"
              startIcon={<ArrowBackIcon />}
              onClick={() => navigate('/surveys-v2/groups')}
              sx={{ color: '#633394', borderColor: '#e0e0e0', textTransform: 'none' }}
            >
              Survey Groups
            </Button>
            <Typography variant="h4" sx={{ color: '#212121', fontWeight: 'bold' }}>
              {isEditing ? 'Edit Survey Group' : 'Create Survey Group'}
            </Typography>
          </Box>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={saving || !name || !selectedOrganizationId}
            sx={{
              backgroundColor: '#633394',
              borderRadius: 2,
              textTransform: 'none',
              px: 4,
              '&:hover': { backgroundColor: '#967CB2' }
            }}
          >
            {saving ? 'Saving...' : isEditing ? 'Update' : 'Create'}
          </Button>
        </Box>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        {/* Group Details */}
        <Paper elevation={1} sx={{ p: 3, borderRadius: 2, mb: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>Group Details</Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            <TextField
              label="Survey Group Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              fullWidth
              variant="outlined"
              required
            />
            <TextField
              label="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              fullWidth
              multiline
              rows={3}
              variant="outlined"
            />
            <Autocomplete
              options={organizations}
              getOptionLabel={(option) => option.name || ''}
              value={selectedOrg || null}
              onChange={(_, newValue) => setSelectedOrganizationId(newValue?.id || '')}
              renderInput={(params) => (
                <TextField {...params} label="Organization *" variant="outlined" />
              )}
            />
          </Box>
        </Paper>

        {/* Assign Surveys */}
        <Paper elevation={1} sx={{ p: 3, borderRadius: 2, mb: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
            Assign Surveys
            {selectedSurveyIds.length > 0 && (
              <Chip
                label={`${selectedSurveyIds.length} selected`}
                size="small"
                sx={{ ml: 1, backgroundColor: '#f3e5f5', color: '#633394' }}
              />
            )}
          </Typography>
          <Typography variant="body2" sx={{ color: '#999', mb: 2 }}>
            Select surveys to include in this group.
          </Typography>

          {templates.length === 0 ? (
            <Typography variant="body2" sx={{ color: '#999', py: 3, textAlign: 'center' }}>
              No surveys available.
            </Typography>
          ) : (
            <List dense sx={{ maxHeight: 300, overflowY: 'auto' }}>
              {templates.map(t => (
                <ListItem
                  key={t.id}
                  onClick={() => handleToggleSurvey(t.id)}
                  sx={{
                    cursor: 'pointer',
                    borderRadius: 1,
                    mb: 0.5,
                    backgroundColor: selectedSurveyIds.includes(t.id) ? 'rgba(99, 51, 148, 0.08)' : 'white',
                    border: '1px solid #eee',
                    '&:hover': { backgroundColor: 'rgba(99, 51, 148, 0.04)' },
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    <Checkbox
                      checked={selectedSurveyIds.includes(t.id)}
                      icon={<CheckBoxOutlineBlankIcon />}
                      checkedIcon={<CheckBoxIcon sx={{ color: '#633394' }} />}
                      size="small"
                    />
                  </ListItemIcon>
                  <ListItemText
                    primary={t.name || t.survey_code || `Survey #${t.id}`}
                    secondary={t.survey_code}
                  />
                </ListItem>
              ))}
            </List>
          )}
        </Paper>

        {/* Associations & Organizations Access */}
        <Paper elevation={1} sx={{ p: 3, borderRadius: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
            Access Management
          </Typography>
          <Typography variant="body2" sx={{ color: '#999', mb: 2 }}>
            Grant access to associations and organizations for this survey group.
          </Typography>
          <Typography variant="body2" sx={{ color: '#bbb', py: 3, textAlign: 'center' }}>
            Access management will be available after the survey group is created.
          </Typography>
        </Paper>
      </Container>
    </>
  );
};

export default CreateSurveyGroupPage;
