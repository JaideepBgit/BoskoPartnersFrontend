// ============================================================================
// SEND REMINDERS DIALOG
// ============================================================================
// Dialog for sending reminder emails to audience members
// ============================================================================

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  TextField,
  Box,
  Alert,
  CircularProgress,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  Chip
} from '@mui/material';
import { Email as EmailIcon, CheckCircle, Error } from '@mui/icons-material';
import AudienceService from '../../../services/Admin/AudienceService';

const SendRemindersDialog = ({ open, onClose, audience, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [memberCount, setMemberCount] = useState(0);
  const [daysRemaining, setDaysRemaining] = useState('');
  const [sending, setSending] = useState(false);
  const [results, setResults] = useState(null);

  useEffect(() => {
    if (open && audience) {
      loadMemberCount();
    }
  }, [open, audience]);

  const loadMemberCount = async () => {
    try {
      setLoading(true);
      const data = await AudienceService.getAudienceMembers(audience.id);
      setMemberCount(data.total_members || 0);
    } catch (err) {
      setError('Failed to load member count: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSendReminders = async () => {
    try {
      setSending(true);
      setError(null);
      setResults(null);
      
      const reminderData = {};
      if (daysRemaining) {
        reminderData.days_remaining = parseInt(daysRemaining);
      }
      
      const result = await AudienceService.sendAudienceReminders(audience.id, reminderData);
      setResults(result);
      
      if (result.results.successful_sends > 0) {
        setTimeout(() => {
          onSuccess(result);
        }, 2000);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1}>
          <EmailIcon />
          Send Reminders: {audience?.name}
        </Box>
      </DialogTitle>
      
      <DialogContent>
        {error && (
          <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        {loading ? (
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="100px">
            <CircularProgress />
          </Box>
        ) : results ? (
          <Box>
            <Alert severity={results.results.failed_sends === 0 ? 'success' : 'warning'} sx={{ mb: 2 }}>
              <Typography variant="body1" fontWeight="medium">
                Reminders Sent: {results.results.successful_sends} / {results.results.total_users}
              </Typography>
              <Typography variant="body2">
                Success Rate: {results.success_rate}%
              </Typography>
            </Alert>
            
            {results.results.results && results.results.results.length > 0 && (
              <Box sx={{ maxHeight: 300, overflow: 'auto' }}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  Detailed Results:
                </Typography>
                <List dense>
                  {results.results.results.map((result, index) => (
                    <ListItem key={index}>
                      <ListItemText
                        primary={
                          <Box display="flex" alignItems="center" gap={1}>
                            {result.success ? (
                              <CheckCircle color="success" fontSize="small" />
                            ) : (
                              <Error color="error" fontSize="small" />
                            )}
                            <Typography variant="body2">
                              {result.user} ({result.email})
                            </Typography>
                          </Box>
                        }
                        secondary={result.error || 'Sent successfully'}
                      />
                    </ListItem>
                  ))}
                </List>
              </Box>
            )}
          </Box>
        ) : (
          <Box>
            <Typography variant="body1" sx={{ mb: 2 }}>
              You are about to send reminder emails to <strong>{memberCount}</strong> member(s) of this audience.
            </Typography>
            
            <TextField
              fullWidth
              label="Days Remaining (Optional)"
              type="number"
              value={daysRemaining}
              onChange={(e) => setDaysRemaining(e.target.value)}
              helperText="Specify the number of days remaining for survey completion"
              sx={{ mb: 2 }}
            />
            
            <Alert severity="info">
              <Typography variant="body2">
                The reminder email will be sent using the organization's configured email template.
                Make sure your email service is properly configured.
              </Typography>
            </Alert>
            
            {sending && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
                  Sending reminders...
                </Typography>
                <LinearProgress />
              </Box>
            )}
          </Box>
        )}
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose} disabled={sending}>
          {results ? 'Close' : 'Cancel'}
        </Button>
        {!results && (
          <Button
            onClick={handleSendReminders}
            variant="contained"
            color="primary"
            disabled={sending || memberCount === 0}
            startIcon={sending ? <CircularProgress size={20} /> : <EmailIcon />}
          >
            {sending ? 'Sending...' : 'Send Reminders'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default SendRemindersDialog;
