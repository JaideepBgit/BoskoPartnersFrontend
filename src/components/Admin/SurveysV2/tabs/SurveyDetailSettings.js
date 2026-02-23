import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Paper, Switch, FormControlLabel, Select, MenuItem,
  FormControl, InputLabel, CircularProgress, Button, Divider
} from '@mui/material';
import LockIcon from '@mui/icons-material/Lock';
import VisibilityIcon from '@mui/icons-material/Visibility';
import EditIcon from '@mui/icons-material/Edit';
import PublicIcon from '@mui/icons-material/Public';
import SaveIcon from '@mui/icons-material/Save';

const colors = {
  primary: '#633394',
  secondary: '#967CB2',
  textPrimary: '#212121',
  textSecondary: '#757575',
};

const SurveyDetailSettings = ({ surveyId, survey }) => {
  const [settings, setSettings] = useState({
    isPublic: false,
    requireAuth: true,
    viewResultsRole: 'admin',
    editSurveyRole: 'admin',
    shareEnabled: false,
  });
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (survey?.settings) {
      setSettings(prev => ({ ...prev, ...survey.settings }));
    }
  }, [survey]);

  const handleChange = (field, value) => {
    setSettings(prev => ({ ...prev, [field]: value }));
    setDirty(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // TODO: integrate with API when endpoint is available
      console.log('Saving settings:', settings);
      setDirty(false);
    } catch (err) {
      console.error('Error saving settings:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 600, color: colors.textPrimary }}>
          Access & Permissions
        </Typography>
        <Button
          variant="contained"
          startIcon={saving ? <CircularProgress size={16} sx={{ color: '#fff' }} /> : <SaveIcon />}
          disabled={!dirty || saving}
          onClick={handleSave}
          sx={{
            textTransform: 'none',
            backgroundColor: colors.primary,
            '&:hover': { backgroundColor: colors.secondary },
            '&.Mui-disabled': { backgroundColor: '#e0e0e0' },
          }}
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </Box>

      {/* Visibility */}
      <Paper sx={{ p: 3, mb: 2, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.8)' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <PublicIcon sx={{ color: colors.primary, fontSize: 22 }} />
          <Typography variant="subtitle1" sx={{ fontWeight: 600, color: colors.textPrimary }}>
            Visibility
          </Typography>
        </Box>
        <FormControlLabel
          control={
            <Switch
              checked={settings.isPublic}
              onChange={(e) => handleChange('isPublic', e.target.checked)}
              sx={{
                '& .MuiSwitch-switchBase.Mui-checked': { color: colors.primary },
                '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: colors.secondary },
              }}
            />
          }
          label={
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 500 }}>Public Survey</Typography>
              <Typography variant="caption" sx={{ color: colors.textSecondary }}>
                Anyone with the link can access this survey
              </Typography>
            </Box>
          }
          sx={{ alignItems: 'flex-start', ml: 0 }}
        />
      </Paper>

      {/* Authentication */}
      <Paper sx={{ p: 3, mb: 2, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.8)' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <LockIcon sx={{ color: colors.primary, fontSize: 22 }} />
          <Typography variant="subtitle1" sx={{ fontWeight: 600, color: colors.textPrimary }}>
            Authentication
          </Typography>
        </Box>
        <FormControlLabel
          control={
            <Switch
              checked={settings.requireAuth}
              onChange={(e) => handleChange('requireAuth', e.target.checked)}
              sx={{
                '& .MuiSwitch-switchBase.Mui-checked': { color: colors.primary },
                '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: colors.secondary },
              }}
            />
          }
          label={
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 500 }}>Require Authentication</Typography>
              <Typography variant="caption" sx={{ color: colors.textSecondary }}>
                Respondents must be logged in to submit responses
              </Typography>
            </Box>
          }
          sx={{ alignItems: 'flex-start', ml: 0 }}
        />
      </Paper>

      {/* Role-based Access */}
      <Paper sx={{ p: 3, mb: 2, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.8)' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <VisibilityIcon sx={{ color: colors.primary, fontSize: 22 }} />
          <Typography variant="subtitle1" sx={{ fontWeight: 600, color: colors.textPrimary }}>
            Who Can View Results
          </Typography>
        </Box>
        <FormControl size="small" sx={{ minWidth: 250 }}>
          <InputLabel>View Results</InputLabel>
          <Select
            value={settings.viewResultsRole}
            onChange={(e) => handleChange('viewResultsRole', e.target.value)}
            label="View Results"
            sx={{ backgroundColor: 'white', borderRadius: 1 }}
          >
            <MenuItem value="admin">Admins Only</MenuItem>
            <MenuItem value="manager">Managers & Admins</MenuItem>
            <MenuItem value="member">All Members</MenuItem>
            <MenuItem value="anyone">Anyone</MenuItem>
          </Select>
        </FormControl>

        <Divider sx={{ my: 2 }} />

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <EditIcon sx={{ color: colors.primary, fontSize: 22 }} />
          <Typography variant="subtitle1" sx={{ fontWeight: 600, color: colors.textPrimary }}>
            Who Can Edit Survey
          </Typography>
        </Box>
        <FormControl size="small" sx={{ minWidth: 250 }}>
          <InputLabel>Edit Survey</InputLabel>
          <Select
            value={settings.editSurveyRole}
            onChange={(e) => handleChange('editSurveyRole', e.target.value)}
            label="Edit Survey"
            sx={{ backgroundColor: 'white', borderRadius: 1 }}
          >
            <MenuItem value="admin">Admins Only</MenuItem>
            <MenuItem value="manager">Managers & Admins</MenuItem>
          </Select>
        </FormControl>
      </Paper>

      {/* Sharing */}
      <Paper sx={{ p: 3, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.8)' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <PublicIcon sx={{ color: colors.primary, fontSize: 22 }} />
          <Typography variant="subtitle1" sx={{ fontWeight: 600, color: colors.textPrimary }}>
            Sharing
          </Typography>
        </Box>
        <FormControlLabel
          control={
            <Switch
              checked={settings.shareEnabled}
              onChange={(e) => handleChange('shareEnabled', e.target.checked)}
              sx={{
                '& .MuiSwitch-switchBase.Mui-checked': { color: colors.primary },
                '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: colors.secondary },
              }}
            />
          }
          label={
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 500 }}>Enable Sharing</Typography>
              <Typography variant="caption" sx={{ color: colors.textSecondary }}>
                Allow users to share this survey via a shareable link
              </Typography>
            </Box>
          }
          sx={{ alignItems: 'flex-start', ml: 0 }}
        />
      </Paper>
    </Box>
  );
};

export default SurveyDetailSettings;
