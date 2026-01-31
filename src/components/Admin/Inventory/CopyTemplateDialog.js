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
  useMediaQuery
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import InventoryService from '../../../services/Admin/Inventory/InventoryService';

const CopyTemplateDialog = ({
  open,
  onClose,
  template,
  organizations = [],
  onCopySuccess
}) => {
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const [selectedOrganizationId, setSelectedOrganizationId] = useState('');
  const [targetVersionName, setTargetVersionName] = useState('Copied Templates');
  const [newSurveyCode, setNewSurveyCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [copyResult, setCopyResult] = useState(null);

  // Reset state when dialog opens
  useEffect(() => {
    if (open && template) {
      setSelectedOrganizationId('');
      setTargetVersionName('Copied Templates');
      setNewSurveyCode(`${template.survey_code}_copy`);
      setLoading(false);
      setError('');
      setSuccess(false);
    }
  }, [open, template]);

  // Filter out the current organization from the list
  const availableOrganizations = organizations.filter(org => {
    // Get the template's organization through the version
    const currentOrgId = template?.version?.organization_id;
    return org.id !== currentOrgId;
  });

  const handleCopy = async () => {
    if (!selectedOrganizationId) {
      setError('Please select a target organization');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await InventoryService.copyTemplate(
        template.id,
        selectedOrganizationId,
        targetVersionName,
        newSurveyCode
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
          <ContentCopyIcon sx={{ color: '#633394', fontSize: '1.25rem' }} />
          Copy Template
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
              <Box sx={{ mt: 2, p: 2, bgcolor: '#FFFFFF', borderRadius: 1, textAlign: 'left' }}>
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
              Copy "{template.survey_code}" to another organization
            </Typography>

            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            <Box sx={{ mb: 3, p: 2, bgcolor: '#FFFFFF', borderRadius: 1 }}>
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
              helperText="If this code exists in the target version, it will be updated. Otherwise, a new template will be created."
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

            <Alert severity="info" sx={{ mt: 2 }}>
              <Typography variant="body2">
                <strong>Smart Copy:</strong> If a template with the same survey code already exists in the target version,
                it will be <strong>updated</strong> with the new questions. Otherwise, a <strong>new template</strong> will be created.
              </Typography>
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
            disabled={loading || !selectedOrganizationId || availableOrganizations.length === 0}
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
            {loading ? 'Copying...' : 'Copy Template'}
          </Button>
        </DialogActions>
      )}
    </Dialog>
  );
};

export default CopyTemplateDialog;