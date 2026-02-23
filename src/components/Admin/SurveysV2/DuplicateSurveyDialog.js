import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Dialog, DialogContent, Box, Typography, TextField, Button,
  FormControlLabel, Checkbox, Divider, Autocomplete, CircularProgress
} from '@mui/material';
import SurveysV2Service from '../../../services/Admin/SurveysV2Service';

const DuplicateSurveyDialog = ({ open, onClose, survey }) => {
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [organizations, setOrganizations] = useState([]);
  const [selectedOrg, setSelectedOrg] = useState(null);
  const [loadingOrgs, setLoadingOrgs] = useState(false);
  const [copyOrganizations, setCopyOrganizations] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (survey && open) {
      setName(`${survey.name || 'Survey'} COPY`);
      setDescription(survey.description || '');
      setStartDate(survey.start_date || '');
      setEndDate(survey.end_date || '');
      setSelectedOrg(null);
      setCopyOrganizations(false);
    }
  }, [survey, open]);

  useEffect(() => {
    if (!open) return;
    const fetchOrgs = async () => {
      setLoadingOrgs(true);
      try {
        const data = await SurveysV2Service.getOrganizations();
        setOrganizations(data);
      } catch (err) {
        console.error('Failed to load organizations:', err);
      } finally {
        setLoadingOrgs(false);
      }
    };
    fetchOrgs();
  }, [open]);

  const handleSave = async () => {
    if (!survey?.id || !name) return;
    setSaving(true);
    try {
      const payload = {
        name,
        description,
        start_date: startDate || null,
        end_date: endDate || null,
      };

      if (selectedOrg) {
        payload.target_organization_id = selectedOrg.id;
      } else {
        payload.copy_organizations = copyOrganizations;
      }

      const result = await SurveysV2Service.duplicateSurvey(survey.id, payload);
      onClose();
      if (result?.id) {
        navigate(`/surveys-v2/${result.id}`);
      }
    } catch (err) {
      console.error('Error duplicating survey:', err);
      alert('Failed to duplicate survey. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{ sx: { borderRadius: 3, p: 1 } }}
    >
      <DialogContent>
        <Typography variant="h6" sx={{ fontWeight: 700, mb: 3 }}>
          Duplicate Survey
        </Typography>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>Survey Name</Typography>
            <TextField
              value={name}
              onChange={(e) => setName(e.target.value)}
              fullWidth
              variant="outlined"
              size="small"
              placeholder="Survey COPY"
            />
          </Box>

          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>Description</Typography>
            <TextField
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              fullWidth
              multiline
              rows={3}
              variant="outlined"
              size="small"
            />
          </Box>

          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>Target Organization</Typography>
            <Autocomplete
              options={organizations}
              value={selectedOrg}
              onChange={(_, newValue) => setSelectedOrg(newValue)}
              getOptionLabel={(option) => option.name || ''}
              loading={loadingOrgs}
              renderInput={(params) => (
                <TextField
                  {...params}
                  placeholder="Search organizations..."
                  size="small"
                  variant="outlined"
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
          </Box>

          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField
              label="Start Date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              fullWidth
              size="small"
              variant="outlined"
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              label="End Date"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              fullWidth
              size="small"
              variant="outlined"
              InputLabelProps={{ shrink: true }}
            />
          </Box>

          {!selectedOrg && (
            <FormControlLabel
              control={
                <Checkbox
                  checked={copyOrganizations}
                  onChange={(e) => setCopyOrganizations(e.target.checked)}
                />
              }
              label="Copy existing organizations"
            />
          )}
        </Box>

        <Divider sx={{ my: 3 }} />

        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1.5, alignItems: 'center' }}>
          <Button
            variant="outlined"
            onClick={onClose}
            sx={{ textTransform: 'none', borderColor: '#e0e0e0', color: '#555' }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={saving || !name}
            sx={{
              textTransform: 'none',
              backgroundColor: '#633394',
              '&:hover': { backgroundColor: '#967CB2' },
            }}
          >
            {saving ? 'Saving...' : 'Save'}
          </Button>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default DuplicateSurveyDialog;
