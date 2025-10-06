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
  Chip,
  Radio,
  RadioGroup,
  FormControlLabel,
  Divider
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import FolderCopyIcon from '@mui/icons-material/FolderCopy';
import InventoryService from '../../../services/Admin/Inventory/InventoryService';

const CopyTemplateVersionDialog = ({ 
  open, 
  onClose, 
  templateVersion, 
  organizations = [], 
  templates = [],
  onCopySuccess 
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const [selectedOrganizationId, setSelectedOrganizationId] = useState('');
  const [newVersionName, setNewVersionName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [copyResult, setCopyResult] = useState(null);
  const [existingVersions, setExistingVersions] = useState([]);
  const [loadingVersions, setLoadingVersions] = useState(false);
  const [selectedExistingVersionId, setSelectedExistingVersionId] = useState('');
  const [useExistingVersion, setUseExistingVersion] = useState(false);
  
  // Reset state when dialog opens
  useEffect(() => {
    if (open && templateVersion) {
      setSelectedOrganizationId('');
      setNewVersionName(`${templateVersion.name}_copy`);
      setLoading(false);
      setError('');
      setSuccess(false);
      setCopyResult(null);
    }
  }, [open, templateVersion]);

  // Filter out the current organization from the list
  const availableOrganizations = organizations.filter(org => {
    return org.id !== templateVersion?.organization_id;
  });

  // Get templates for this version
  const versionTemplates = templates.filter(t => t.version_id === templateVersion?.id) || [];

  // Load existing versions when organization is selected
  useEffect(() => {
    if (selectedOrganizationId && open) {
      loadExistingVersions();
    } else {
      setExistingVersions([]);
      setSelectedExistingVersionId('');
      setUseExistingVersion(false);
    }
  }, [selectedOrganizationId, open]);

  const loadExistingVersions = async () => {
    if (!selectedOrganizationId) return;
    
    setLoadingVersions(true);
    try {
      const versions = await InventoryService.getTemplateVersions(selectedOrganizationId);
      setExistingVersions(versions);
    } catch (err) {
      console.error('Error loading existing versions:', err);
      setError('Failed to load existing versions');
    } finally {
      setLoadingVersions(false);
    }
  };

  const handleCopy = async () => {
    if (!selectedOrganizationId) {
      setError('Please select a target organization');
      return;
    }

    if (useExistingVersion && !selectedExistingVersionId) {
      setError('Please select an existing version');
      return;
    }

    if (!useExistingVersion && !newVersionName.trim()) {
      setError('Please enter a new version name');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      // Determine the version name to use
      let versionNameToUse = newVersionName;
      if (useExistingVersion && selectedExistingVersionId) {
        const existingVersion = existingVersions.find(v => v.id === parseInt(selectedExistingVersionId));
        if (existingVersion) {
          versionNameToUse = existingVersion.name;
        }
      }

      const result = await InventoryService.copyTemplateVersion(
        templateVersion.id,
        selectedOrganizationId,
        versionNameToUse
      );
      
      setCopyResult(result);
      setSuccess(true);
      
      // Call success callback after a short delay to show success message
      setTimeout(() => {
        if (onCopySuccess) {
          onCopySuccess(result);
        }
        onClose();
      }, 2000);
      
    } catch (err) {
      console.error('Error copying template version:', err);
      setError(err.response?.data?.error || 'Failed to copy template version. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      onClose();
    }
  };

  if (!templateVersion) return null;

  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      fullWidth
      fullScreen={isMobile}
      maxWidth={isMobile ? false : "sm"}
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
          <FolderCopyIcon sx={{ color: '#633394', fontSize: '1.25rem' }} />
          Copy Template Version
        </Box>
      </DialogTitle>
      
      <DialogContent sx={{ pt: 3 }}>
        {success ? (
          <Box sx={{ textAlign: 'center', py: 3 }}>
            <CheckCircleIcon sx={{ fontSize: 48, color: '#4caf50', mb: 2 }} />
            <Typography variant="h6" sx={{ color: '#4caf50', mb: 1 }}>
              {copyResult?.version_action === 'updated' 
                ? 'Template Version Updated Successfully!' 
                : 'Template Version Copied Successfully!'}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {copyResult?.message}
            </Typography>
            {copyResult && (
              <Box sx={{ textAlign: 'left', p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                  {copyResult.version_action === 'updated' ? 'Update Summary:' : 'Copy Summary:'}
                </Typography>
                <Typography variant="body2" sx={{ mb: 0.5 }}>
                  <strong>Version:</strong> {copyResult.copied_version?.name}
                </Typography>
                <Typography variant="body2" sx={{ mb: 0.5 }}>
                  <strong>Target Organization:</strong> {copyResult.copied_version?.organization_name}
                </Typography>
                <Typography variant="body2" sx={{ mb: 0.5, color: '#2e7d32' }}>
                  <strong>Templates Created:</strong> {copyResult.copied_version?.templates_created || 0}
                </Typography>
                <Typography variant="body2" sx={{ color: '#1976d2' }}>
                  <strong>Templates Updated:</strong> {copyResult.copied_version?.templates_updated || 0}
                </Typography>
              </Box>
            )}
          </Box>
        ) : (
          <>
            <Typography variant="body2" sx={{ mb: 3, color: '#666' }}>
              Copy "{templateVersion.name}" and all its templates to another organization
            </Typography>

            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            <Box sx={{ mb: 3, p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                Source Template Version:
              </Typography>
              <Typography variant="body2" sx={{ mb: 0.5 }}>
                <strong>Name:</strong> {templateVersion.name}
              </Typography>
              <Typography variant="body2" sx={{ mb: 0.5 }}>
                <strong>Organization:</strong> {templateVersion.organization_name || 'N/A'}
              </Typography>
              <Typography variant="body2" sx={{ mb: 1 }}>
                <strong>Description:</strong> {templateVersion.description || 'No description'}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  Templates:
                </Typography>
                <Chip 
                  label={`${versionTemplates.length} templates`}
                  size="small"
                  sx={{ 
                    height: '20px',
                    fontSize: '0.7rem',
                    backgroundColor: 'rgba(99, 51, 148, 0.08)',
                    color: '#633394',
                    fontWeight: 500
                  }}
                />
              </Box>
              {versionTemplates.length > 0 && (
                <Box sx={{ mt: 1 }}>
                  <Typography variant="caption" sx={{ color: '#666' }}>
                    Template codes: {versionTemplates.map(t => t.survey_code).join(', ')}
                  </Typography>
                </Box>
              )}
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
                onChange={(e) => setSelectedOrganizationId(e.target.value)}
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
                  Target Version
                </Typography>
                
                {loadingVersions ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                    <CircularProgress size={24} />
                  </Box>
                ) : existingVersions.length > 0 ? (
                  <>
                    <Alert severity="info" sx={{ mb: 2 }}>
                      <Typography variant="body2">
                        Found {existingVersions.length} existing version(s) in this organization. 
                        Choose to use an existing version or create a new one.
                      </Typography>
                    </Alert>
                    
                    <FormControl component="fieldset" sx={{ mb: 2, width: '100%' }}>
                      <RadioGroup
                        value={useExistingVersion ? 'existing' : 'new'}
                        onChange={(e) => setUseExistingVersion(e.target.value === 'existing')}
                      >
                        <FormControlLabel 
                          value="new" 
                          control={<Radio sx={{ color: '#633394', '&.Mui-checked': { color: '#633394' } }} />} 
                          label="Create New Version" 
                        />
                        <FormControlLabel 
                          value="existing" 
                          control={<Radio sx={{ color: '#633394', '&.Mui-checked': { color: '#633394' } }} />} 
                          label="Use Existing Version" 
                        />
                      </RadioGroup>
                    </FormControl>

                    {useExistingVersion ? (
                      <FormControl 
                        fullWidth 
                        margin="normal" 
                        size={isMobile ? "small" : "medium"}
                        required
                      >
                        <InputLabel id="existing-version-label" sx={{ '&.Mui-focused': { color: '#633394' } }}>
                          Select Existing Version *
                        </InputLabel>
                        <Select
                          labelId="existing-version-label"
                          value={selectedExistingVersionId}
                          label="Select Existing Version *"
                          onChange={(e) => setSelectedExistingVersionId(e.target.value)}
                          sx={{ 
                            '& .MuiOutlinedInput-notchedOutline': {
                              '&.Mui-focused': {
                                borderColor: '#633394',
                              },
                            },
                          }}
                        >
                          {existingVersions.map(version => (
                            <MenuItem key={version.id} value={version.id}>
                              <Box>
                                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                  {version.name}
                                </Typography>
                                {version.description && (
                                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                    {version.description}
                                  </Typography>
                                )}
                              </Box>
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    ) : (
                      <TextField
                        label="New Version Name"
                        fullWidth
                        margin="normal"
                        size={isMobile ? "small" : "medium"}
                        value={newVersionName}
                        onChange={(e) => setNewVersionName(e.target.value)}
                        helperText="Name for the new template version in the target organization"
                        required
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
                    )}
                  </>
                ) : (
                  <>
                    <Alert severity="info" sx={{ mb: 2 }}>
                      <Typography variant="body2">
                        No existing versions found. A new version will be created.
                      </Typography>
                    </Alert>
                    <TextField
                      label="New Version Name"
                      fullWidth
                      margin="normal"
                      size={isMobile ? "small" : "medium"}
                      value={newVersionName}
                      onChange={(e) => setNewVersionName(e.target.value)}
                      helperText="Name for the new template version in the target organization"
                      required
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

            <Alert severity="info" sx={{ mt: 2 }}>
              <Typography variant="body2">
                <strong>Smart Copy Behavior:</strong>
              </Typography>
              <Typography variant="body2" sx={{ mt: 1 }}>
                • If a version with this name exists in the target organization, it will be <strong>used</strong> (not replaced)
              </Typography>
              <Typography variant="body2">
                • Templates with matching survey codes will be <strong>updated</strong>
              </Typography>
              <Typography variant="body2">
                • New templates will be <strong>created</strong> for non-matching survey codes
              </Typography>
              {versionTemplates.length > 0 && (
                <Typography variant="body2" sx={{ mt: 1, fontStyle: 'italic' }}>
                  This version contains {versionTemplates.length} template(s) to copy
                </Typography>
              )}
            </Alert>
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
            disabled={loading || !selectedOrganizationId || !newVersionName.trim() || availableOrganizations.length === 0}
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
            {loading ? 'Copying...' : 'Copy Template Version'}
          </Button>
        </DialogActions>
      )}
    </Dialog>
  );
};

export default CopyTemplateVersionDialog;