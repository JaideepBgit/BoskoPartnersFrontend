import React, { useState, useEffect } from 'react';
import {
  Drawer, Box, Typography, TextField, Button, IconButton, Divider
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import SurveysV2Service from '../../../services/Admin/SurveysV2Service';

const EditSurveyDrawer = ({ open, onClose, survey, onSaved }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (survey) {
      setName(survey.name || '');
      setDescription(survey.description || '');
      setStartDate(survey.start_date ? survey.start_date.replace(' ', 'T').split('T')[0] : '');
      setEndDate(survey.end_date ? survey.end_date.replace(' ', 'T').split('T')[0] : '');
    }
  }, [survey]);

  const handleSave = async () => {
    if (!survey?.id) return;
    setSaving(true);
    try {
      await SurveysV2Service.updateSurvey(survey.id, {
        name,
        description,
        start_date: startDate || null,
        end_date: endDate || null,
      });
      onSaved?.();
    } catch (err) {
      console.error('Error updating survey:', err);
      alert('Failed to update survey. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!survey?.id) return;
    if (!window.confirm(`Are you sure you want to delete "${name}"? This action cannot be undone.`)) return;
    setDeleting(true);
    try {
      await SurveysV2Service.deleteSurvey(survey.id);
      onClose();
      window.location.href = '/surveys-v2';
    } catch (err) {
      console.error('Error deleting survey:', err);
      alert('Failed to delete survey.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{ sx: { width: { xs: '100%', sm: 450 }, display: 'flex', flexDirection: 'column', height: '100%' } }}
    >
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: 3, py: 2, borderBottom: '1px solid #e0e0e0' }}>
        <Typography variant="h6" sx={{ fontWeight: 700 }}>Edit Survey</Typography>
        <IconButton onClick={onClose}><CloseIcon /></IconButton>
      </Box>

      {/* Scrollable fields */}
      <Box sx={{ flex: 1, overflowY: 'auto', px: 3, py: 3, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
        <TextField
          label="Survey Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          fullWidth
          variant="outlined"
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

        <Box sx={{ display: 'flex', gap: 2 }}>
          <TextField
            label="Start Date"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            fullWidth
            InputLabelProps={{ shrink: true }}
            variant="outlined"
          />
          <TextField
            label="End Date"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            fullWidth
            InputLabelProps={{ shrink: true }}
            variant="outlined"
          />
        </Box>
      </Box>

      {/* Sticky footer */}
      <Box sx={{ px: 3, py: 2, borderTop: '1px solid #e0e0e0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Button
          variant="outlined"
          color="error"
          onClick={handleDelete}
          disabled={deleting}
          sx={{ textTransform: 'none' }}
        >
          {deleting ? 'Deleting...' : 'Delete'}
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
    </Drawer>
  );
};

export default EditSurveyDrawer;
