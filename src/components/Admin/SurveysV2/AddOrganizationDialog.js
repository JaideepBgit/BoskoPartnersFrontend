import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogContent, Box, Typography, Button, Autocomplete,
  TextField, CircularProgress, Alert
} from '@mui/material';
import SurveysV2Service from '../../../services/Admin/SurveysV2Service';

const AddOrganizationDialog = ({ open, onClose, survey, onSaved }) => {
  const [organizations, setOrganizations] = useState([]);
  const [selectedOrg, setSelectedOrg] = useState(null);
  const [loadingOrgs, setLoadingOrgs] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (!open) return;
    setSelectedOrg(null);
    setError('');
    setSuccess('');
    const fetchOrgs = async () => {
      setLoadingOrgs(true);
      try {
        const data = await SurveysV2Service.getOrganizations();
        // Filter out orgs already attached to this survey
        const attachedIds = (survey?.organizations || []).map(o => o.id);
        const filtered = data.filter(o => !attachedIds.includes(o.id));
        setOrganizations(filtered);
      } catch (err) {
        setError('Failed to load organizations.');
      } finally {
        setLoadingOrgs(false);
      }
    };
    fetchOrgs();
  }, [open, survey]);

  const handleSave = async () => {
    if (!selectedOrg || !survey?.id) return;
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      await SurveysV2Service.attachOrganizations(survey.id, [selectedOrg.id]);
      setSuccess(`Survey successfully attached to ${selectedOrg.name}.`);
      onSaved?.();
    } catch (err) {
      setError('Failed to add survey to organization. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    setSelectedOrg(null);
    setError('');
    setSuccess('');
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{ sx: { borderRadius: 3, p: 1 } }}
    >
      <DialogContent>
        <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
          Add Survey to Organization
        </Typography>
        <Typography variant="body2" sx={{ color: '#757575', mb: 3 }}>
          Attach this survey to an organization.
        </Typography>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

        <Autocomplete
          options={organizations}
          value={selectedOrg}
          onChange={(_, newValue) => setSelectedOrg(newValue)}
          getOptionLabel={(option) => option.name || ''}
          loading={loadingOrgs}
          disabled={!!success}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Select Organization"
              placeholder="Search organizations..."
              InputProps={{
                ...params.InputProps,
                endAdornment: (
                  <>
                    {loadingOrgs ? <CircularProgress color="inherit" size={18} /> : null}
                    {params.InputProps.endAdornment}
                  </>
                ),
              }}
            />
          )}
        />

        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1.5, mt: 3 }}>
          <Button
            variant="outlined"
            onClick={handleClose}
            sx={{ textTransform: 'none', borderColor: '#e0e0e0', color: '#555' }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={!selectedOrg || saving || !!success}
            sx={{
              textTransform: 'none',
              backgroundColor: '#633394',
              '&:hover': { backgroundColor: '#967CB2' },
            }}
          >
            {saving ? 'Adding...' : 'Add'}
          </Button>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default AddOrganizationDialog;
