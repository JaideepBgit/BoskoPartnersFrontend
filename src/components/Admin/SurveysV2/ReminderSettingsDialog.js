import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Box, Typography, Button, Select, MenuItem, FormControl,
  InputLabel, TextField, Switch, FormControlLabel, CircularProgress,
  Alert, Divider, Chip
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import InventoryService from '../../../services/Admin/Inventory/InventoryService';

const colors = {
  primary: '#633394',
  secondary: '#967CB2',
  textSecondary: '#757575',
};

const FREQUENCY_OPTIONS = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'biweekly', label: 'Every 2 Weeks' },
  { value: 'monthly', label: 'Monthly' },
];

const AUDIENCE_OPTIONS = [
  { value: 'all_pending', label: 'All Pending (assigned + in-progress)' },
  { value: 'not_started', label: 'Not Started Only' },
  { value: 'in_progress', label: 'In Progress Only' },
];

const ReminderSettingsDialog = ({ open, onClose, surveyId }) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [logs, setLogs] = useState([]);

  const [settings, setSettings] = useState({
    frequency: 'weekly',
    target_audience: 'all_pending',
    max_reminders: 3,
    is_active: true,
  });

  useEffect(() => {
    if (!open || !surveyId) return;

    const load = async () => {
      setLoading(true);
      setError(null);
      setSuccess(null);
      try {
        const [settingsData, logsData] = await Promise.all([
          InventoryService.getReminderSettings(surveyId),
          InventoryService.getReminderLogs(surveyId),
        ]);
        if (settingsData) {
          setSettings({
            frequency: settingsData.frequency || 'weekly',
            target_audience: settingsData.target_audience || 'all_pending',
            max_reminders: settingsData.max_reminders ?? 3,
            is_active: settingsData.is_active ?? true,
          });
        }
        setLogs(logsData || []);
      } catch (err) {
        console.error('Error loading reminder settings:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [open, surveyId]);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      await InventoryService.saveReminderSettings(surveyId, settings);
      setSuccess('Reminder settings saved successfully');
    } catch (err) {
      setError('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleSendNow = async () => {
    setSending(true);
    setError(null);
    setSuccess(null);
    try {
      const result = await InventoryService.sendRemindersNow(surveyId);
      setSuccess(`Sent ${result.sent} reminder${result.sent !== 1 ? 's' : ''}`);
      // Refresh logs
      const logsData = await InventoryService.getReminderLogs(surveyId);
      setLogs(logsData || []);
    } catch (err) {
      setError('Failed to send reminders');
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 600, color: colors.primary }}>
        Reminder Settings
      </DialogTitle>

      <DialogContent dividers>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress sx={{ color: colors.primary }} />
          </Box>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 1 }}>
            {error && <Alert severity="error" onClose={() => setError(null)}>{error}</Alert>}
            {success && <Alert severity="success" onClose={() => setSuccess(null)}>{success}</Alert>}

            {/* Enable / Disable */}
            <FormControlLabel
              control={
                <Switch
                  checked={settings.is_active}
                  onChange={(e) => setSettings(prev => ({ ...prev, is_active: e.target.checked }))}
                  sx={{
                    '& .MuiSwitch-switchBase.Mui-checked': { color: colors.primary },
                    '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: colors.secondary },
                  }}
                />
              }
              label={
                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                  {settings.is_active ? 'Reminders Active' : 'Reminders Paused'}
                </Typography>
              }
            />

            {/* Frequency */}
            <FormControl size="small" fullWidth>
              <InputLabel>Frequency</InputLabel>
              <Select
                value={settings.frequency}
                onChange={(e) => setSettings(prev => ({ ...prev, frequency: e.target.value }))}
                label="Frequency"
              >
                {FREQUENCY_OPTIONS.map(opt => (
                  <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Target Audience */}
            <FormControl size="small" fullWidth>
              <InputLabel>Send To</InputLabel>
              <Select
                value={settings.target_audience}
                onChange={(e) => setSettings(prev => ({ ...prev, target_audience: e.target.value }))}
                label="Send To"
              >
                {AUDIENCE_OPTIONS.map(opt => (
                  <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Max Reminders */}
            <TextField
              label="Max reminders per person"
              type="number"
              size="small"
              value={settings.max_reminders}
              onChange={(e) => setSettings(prev => ({ ...prev, max_reminders: Math.max(1, parseInt(e.target.value) || 1) }))}
              inputProps={{ min: 1, max: 20 }}
              fullWidth
            />

            <Divider />

            {/* Send Now */}
            <Box>
              <Button
                variant="outlined"
                startIcon={sending ? <CircularProgress size={16} /> : <SendIcon />}
                disabled={sending}
                onClick={handleSendNow}
                sx={{ textTransform: 'none', color: colors.primary, borderColor: colors.primary }}
              >
                {sending ? 'Sending...' : 'Send Reminders Now'}
              </Button>
              <Typography variant="caption" sx={{ display: 'block', mt: 0.5, color: colors.textSecondary }}>
                Immediately sends reminders to eligible respondents
              </Typography>
            </Box>

            {/* Recent Logs */}
            {logs.length > 0 && (
              <>
                <Divider />
                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                  Recent Activity ({logs.length})
                </Typography>
                <Box sx={{ maxHeight: 160, overflow: 'auto' }}>
                  {logs.slice(0, 10).map((log) => (
                    <Box key={log.id} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 0.5 }}>
                      <Typography variant="caption">{log.respondent_email}</Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="caption" sx={{ color: colors.textSecondary }}>
                          {log.sent_at ? new Date(log.sent_at).toLocaleDateString() : ''}
                        </Typography>
                        <Chip
                          label={log.status}
                          size="small"
                          sx={{
                            fontSize: '0.65rem',
                            height: 20,
                            backgroundColor: log.status === 'sent' ? '#e8f5e9' : '#fbe9e7',
                            color: log.status === 'sent' ? '#2e7d32' : '#c62828',
                          }}
                        />
                      </Box>
                    </Box>
                  ))}
                </Box>
              </>
            )}
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} sx={{ textTransform: 'none', color: colors.textSecondary }}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={saving || loading}
          sx={{
            textTransform: 'none',
            backgroundColor: colors.primary,
            '&:hover': { backgroundColor: colors.secondary },
          }}
        >
          {saving ? 'Saving...' : 'Save Settings'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ReminderSettingsDialog;
