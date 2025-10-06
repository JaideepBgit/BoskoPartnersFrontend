import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Typography,
  Box,
  Alert,
  CircularProgress,
  useTheme,
  useMediaQuery,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Radio,
  RadioGroup,
  FormLabel,
  Chip,
  Divider
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AssignmentIcon from '@mui/icons-material/Assignment';
import UpdateIcon from '@mui/icons-material/Update';
import AddIcon from '@mui/icons-material/Add';
import InventoryService from '../../../services/Admin/Inventory/InventoryService';

const EnhancedCopyTemplateDialog = ({ 
  open, 
  onClose, 
  template, 
  organizations = [], 
  onCopySuccess 
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const [selectedOrganizationId, setSelectedOrganizationId] = useState('');
  const [targetVersionName, setTargetVersionName] = useState('Copied Templates');
  const [newSurveyCode, setNewSurveyCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [copyResult, setCopyResult] = useState(null);
  
  const [existingTemplates, setExistingTemplates] = useState([]);
  const [selectedTemplateAction, setSelectedTemplateAction] = useState('create');
  const [selectedExistingTemplate, setSelectedExistingTemplate] = useState('');
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  
  // Reset state when dialog opens
  useEffect(() => {
    if (open && template) {
      setSelectedOrganizationId('');
      setTargetVersionName('Copied Templates');
      setNewSurveyCode(`${template.survey_code}_copy`);
      setSelectedTemplateAction('create');
      setSelectedExistingTemplate('');
      setExistingTemplates([]);
      setLoading(false);
      setError('');
      setSuccess(false);
    }
  }, [open, template]);

  // Filter out the current organization from the list
  const availableOrganizations = organizations.filter(org => {
    const currentOrgId = template?.version?.organization_id;
    return org.id !== currentOrgId;
  });

  // Load existing templates when organization is selected
  useEffect(() => {
    if (selectedOrganizationId && open) {
      loadExistingTemplates();
    }
  }, [selectedOrganizationId, open]);

  const loadExistingTemplates = async () => {
    if (!selectedOrganizationId) return;
    
    setLoadingTemplates(true);
    try {
      const templates = await InventoryService.getTemplates(selectedOrganizationId);
      setExistingTemplates(templates);
    } catch (err) {
      console.error('Error loading existing templates:', err);
      setError('Failed to load existing templates');
    } finally {
      setLoadingTemplates(false);
    }
  };

  const handleOrganizationChange = (orgId) => {
    setSelectedOrganizationId(orgId);
    setSelectedTemplateAction('create');
    setSelectedExistingTemplate('');
    setNewSurveyCode(`${template.survey_code}_copy`);
  };

  const handleTemplateActionChange = (action, templateId = '') => {
    setSelectedTemplateAction(action);
    setSelectedExistingTemplate(templateId);
    
    if (action === 'replace' && templateId) {
      const existingTemplate = existingTemplates.find(t => t.id === parseInt(templateId));
      if (existingTemplate) {
        setNewSurveyCode(existingTemplate.survey_code);
      }
    } else if (action === 'create') {
      setNewSurveyCode(`${template.survey_code}_copy`);
      setSelectedExistingTemplate('');
    }
  };

  const handleCopy = async () => {
    if (!selectedOrganizationId) {
      setError('Please select a target organization');
      return;
    }

    if (selectedTemplateAction === 'replace' && !selectedExistingTemplate) {
      setError('Please select a template to replace');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      let targetSurveyCode = newSurveyCode;
      
      if (selectedTemplateAction === 'replace') {
        const existingTemplate = existingTemplates.find(t => t.id === parseInt(selectedExistingTemplate));
        if (existingTemplate) {
          targetSurveyCode = existingTemplate.survey_code;
        }
      }
      
      const result = await InventoryService.copyTemplate(
        template.id,
        selectedOrganizationId,
        targetVersionName,
        targetSurveyCode
      );
      
      setCopyResult(result);
      setSuccess(true);
      
      setTimeout(() => {
        if (onCopySuccess) {
          onCopySuccess(result);
        }
        onClose();
      }, 2000);
      
    } catch (err) {
      console.error('Error copying template:', err);
      setError(err.response?.data?.error || 'Failed to copy template. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      onClose();
    }
  };

  if (!template) return null;

  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      fullWidth
      fullScreen={isMobile}
      maxWidth={isMobile ? false : "md"}
      PaperProps={{
        sx: {
          borderRadius: isMobile ? 0 : 2,
          minHeight: isMobile ? '100vh' : 'auto'
        }
      }}
    >
      <DialogTitle sx={{ 
        fontSize: isMobile ? '1.1rem' : '1.25rem',
        pb: 1,
        borderBottom: '1px solid #e0e0e0'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <ContentCopyIcon sx={{ color: '#633394', fontSize: '1.25rem' }} />
          Copy Template to Organization
        </Box>
      </DialogTitle>
      
      <DialogContent sx={{ pt: 3 }}>
        {success ? (
          <Box sx={{ textAlign: 'center', py: 3 }}>
            <CheckCircleIcon sx={{ fontSize: 48, color: '#4caf50', mb: 2 }} />
            <Typography variant="h6" sx={{ color: '#4caf50', mb: 1 }}>
              {copyResult?.action === 'updated' ? 'Template Updated Successfully!' : 'Template Copied Successfully!'}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {copyResult?.action === 'updated' 
                ? 'The existing template has been updated with the new questions and sections.'
                : 'A new template has been created in the target organization.'}
            </Typography>
            {copyResult?.copied_template && (
              <Box sx={{ mt: 2, p: 2, bgcolor: '#f5f5f5', borderRadius: 1, textAlign: 'left' }}>
                <Typography variant="body2" sx={{ mb: 0.5 }}>
                  <strong>Survey Code:</strong> {copyResult.copied_template.survey_code}
                </Typography>
                <Typography variant="body2" sx={{ mb: 0.5 }}>
                  <strong>Version:</strong> {copyResult.copied_template.version_name}
                </Typography>
                <Typography variant="body2">
                  <strong>Organization:</strong> {copyResult.copied_template.organization_name}
                </Typography>
              </Box>
            )}
          </Box>
        ) : (
          <>
            <Typography variant="body2" sx={{ mb: 3, color: '#666' }}>
              Copy "{template.survey_code}" to another organization with smart replacement options
            </Typography>

            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            <Box sx={{ mb: 3, p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                Source Template:
              </Typography>
              <Typography variant="body2" sx={{ mb: 0.5 }}>
                <strong>Survey Code:</strong> {template.survey_code}
              </Typography>
              <Typography variant="body2" sx={{ mb: 0.5 }}>
                <strong>Version:</strong> {template.version_name}
              </Typography>
              <Typography variant="body2">
                <strong>Questions:</strong> {template.questions?.length || 0}
              </Typography>
            </Box>

            <FormControl 
              fullWidth 
              margin="normal" 
              size={isMobile ? "small" : "medium"}
              required
            >
              <InputLabel id="organization-label" sx={{ '&.Mui-focused': { color: '#633394' } }}>
                Target Organization *
              </InputLabel>
              <Select
                labelId="organization-label"
                value={selectedOrganizationId}
                label="Target Organization *"
                onChange={(e) => handleOrganizationChange(e.target.value)}
                sx={{ 
                  '& .MuiOutlinedInput-notchedOutline': {
                    '&.Mui-focused': {
                      borderColor: '#633394',
                    },
                  },
                }}
              >
                {availableOrganizations.map(org => (
                  <MenuItem key={org.id} value={org.id}>
                    {org.name}
                  </MenuItem>
                ))}
              </Select>
              {availableOrganizations.length === 0 && (
                <Typography variant="caption" sx={{ mt: 1, color: '#666' }}>
                  No other organizations available for copying
                </Typography>
              )}
            </FormControl>

            {selectedOrganizationId && (
              <>
                <Divider sx={{ my: 2 }} />
                
                <Typography variant="h6" sx={{ mb: 2, color: '#633394', fontSize: '1rem' }}>
                  Template Action
                </Typography>
                
                {loadingTemplates ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                    <CircularProgress size={24} />
                  </Box>
                ) : existingTemplates.length > 0 ? (
                  <>
                    <Alert severity="info" sx={{ mb: 2 }}>
                      <Typography variant="body2">
                        Found {existingTemplates.length} existing template(s) in this organization. 
                        Choose to replace an existing template or create a new one.
                      </Typography>
                    </Alert>
                    
                    <FormControl component="fieldset" sx={{ mb: 2 }}>
                      <RadioGroup
                        value={selectedTemplateAction}
                        onChange={(e) => handleTemplateActionChange(e.target.value)}
                      >
                        <List>
                          <ListItem 
                            onClick={() => handleTemplateActionChange('create')}
                            sx={{ border: '1px solid #e0e0e0', borderRadius: 1, mb: 1, p: 1, cursor: 'pointer', '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.04)' } }}
                          >
                            <ListItemIcon>
                              <Radio 
                                checked={selectedTemplateAction === 'create'} 
                                value="create"
                              />
                            </ListItemIcon>
                            <ListItemText 
                              primary="Create New Template" 
                              secondary="Create a completely new template with a unique survey code"
                            />
                            <ListItemIcon>
                              <AddIcon color="primary" />
                            </ListItemIcon>
                          </ListItem>
                          
                          {existingTemplates.map((existingTemplate) => (
                            <ListItem 
                              key={existingTemplate.id}
                              onClick={() => handleTemplateActionChange('replace', existingTemplate.id.toString())}
                              sx={{ 
                                border: '1px solid #e0e0e0', 
                                borderRadius: 1, 
                                mb: 1, 
                                p: 1,
                                cursor: 'pointer',
                                bgcolor: selectedExistingTemplate === existingTemplate.id.toString() ? 'rgba(99, 51, 148, 0.08)' : 'transparent',
                                '&:hover': { bgcolor: selectedExistingTemplate === existingTemplate.id.toString() ? 'rgba(99, 51, 148, 0.12)' : 'rgba(0, 0, 0, 0.04)' }
                              }}
                            >
                              <ListItemIcon>
                                <Radio 
                                  checked={selectedExistingTemplate === existingTemplate.id.toString()} 
                                  value={existingTemplate.id.toString()}
                                />
                              </ListItemIcon>
                              <ListItemText 
                                primary={existingTemplate.survey_code}
                                secondary={`${existingTemplate.questions?.length || 0} questions - Last updated: ${new Date(existingTemplate.updated_at || existingTemplate.created_at).toLocaleDateString()}`}
                              />
                              <ListItemIcon>
                                <UpdateIcon color="warning" />
                              </ListItemIcon>
                              <Chip 
                                label="Replace" 
                                size="small" 
                                color="warning"
                                variant="outlined"
                              />
                            </ListItem>
                          ))}
                        </List>
                      </RadioGroup>
                    </FormControl>
                  </>
                ) : (
                  <Alert severity="info" sx={{ mb: 2 }}>
                    <Typography variant="body2">
                      No existing templates found in this organization. A new template will be created.
                    </Typography>
                  </Alert>
                )}

                {selectedTemplateAction === 'create' && (
                  <>
                    <TextField
                      label="Target Version Name"
                      fullWidth
                      margin="normal"
                      size={isMobile ? "small" : "medium"}
                      value={targetVersionName}
                      onChange={(e) => setTargetVersionName(e.target.value)}
                      helperText="Templates will be copied to this version. If it doesn't exist, it will be created."
                      sx={{ 
                        '& .MuiOutlinedInput-root': {
                          '&.Mui-focused fieldset': {
                            borderColor: '#633394',
                          },
                        },
                        '& .MuiInputLabel-root.Mui-focused': {
                          color: '#633394',
                        }
                      }}
                    />

                    <TextField
                      label="New Survey Code"
                      fullWidth
                      margin="normal"
                      size={isMobile ? "small" : "medium"}
                      value={newSurveyCode}
                      onChange={(e) => setNewSurveyCode(e.target.value)}
                      helperText="If this code exists, it will be updated. Otherwise, a new template will be created."
                      sx={{ 
                        '& .MuiOutlinedInput-root': {
                          '&.Mui-focused fieldset': {
                            borderColor: '#633394',
                          },
                        },
                        '& .MuiInputLabel-root.Mui-focused': {
                          color: '#633394',
                        }
                      }}
                    />
                  </>
                )}
              </>
            )}
          </>
        )}
      </DialogContent>
      
      {!success && (
        <DialogActions sx={{ p: isMobile ? 2 : 1, borderTop: '1px solid #e0e0e0' }}>
          <Button 
            onClick={handleClose}
            disabled={loading}
            size={isMobile ? "small" : "medium"}
            sx={{ 
              color: '#633394',
              fontSize: isMobile ? '0.75rem' : '0.875rem'
            }}
          >
            Cancel
          </Button>
          <Button 
            variant="contained" 
            onClick={handleCopy}
            disabled={loading || !selectedOrganizationId}
            startIcon={loading ? <CircularProgress size={16} /> : <ContentCopyIcon />}
            size={isMobile ? "small" : "medium"}
            sx={{ 
              backgroundColor: '#633394', 
              '&:hover': { backgroundColor: '#7c52a5' },
              fontSize: isMobile ? '0.75rem' : '0.875rem',
              '&.Mui-disabled': {
                backgroundColor: 'rgba(0, 0, 0, 0.12)',
                color: 'rgba(0, 0, 0, 0.26)'
              }
            }}
          >
            {loading ? 'Processing...' : 
             selectedTemplateAction === 'replace' ? 'Replace Template' : 'Copy Template'}
          </Button>
        </DialogActions>
      )}
    </Dialog>
  );
};

export default EnhancedCopyTemplateDialog;
