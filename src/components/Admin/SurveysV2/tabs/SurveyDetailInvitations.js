import React, { useState, useEffect } from 'react';
import {
  Box, Typography, TextField, Button, InputAdornment,
  CircularProgress, Chip
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import SettingsIcon from '@mui/icons-material/Settings';
import SurveysV2Service from '../../../../services/Admin/SurveysV2Service';
import ReminderSettingsDialog from '../ReminderSettingsDialog';

const colors = {
  primary: '#633394',
  secondary: '#967CB2',
  textPrimary: '#212121',
  textSecondary: '#757575',
};

const statusColors = {
  draft:       { bg: '#e3f2fd',  text: '#1565c0' },
  in_progress: { bg: '#fff3e0',  text: '#e65100' },
  submitted:   { bg: '#e8f5e9',  text: '#2e7d32' },
  completed:   { bg: '#e8f5e9',  text: '#2e7d32' },
  pending:     { bg: '#f3e8ff',  text: '#633394' },
  declined:    { bg: '#fbe9e7',  text: '#c62828' },
  expired:     { bg: '#fafafa',  text: '#757575' },
};

const statusLabels = {
  draft: 'Draft',
  in_progress: 'In Progress',
  submitted: 'Submitted',
  completed: 'Completed',
  pending: 'Pending',
  declined: 'Declined',
  expired: 'Expired',
};

const getStatusStyle = (status) => {
  const key = (status || 'draft').toLowerCase();
  return statusColors[key] || statusColors.draft;
};

const SurveyDetailInvitations = ({ surveyId }) => {
  const [responses, setResponses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [reminderDialogOpen, setReminderDialogOpen] = useState(false);

  useEffect(() => {
    const loadResponses = async () => {
      setLoading(true);
      try {
        const data = await SurveysV2Service.getResponses(surveyId);
        setResponses(data);
      } catch (err) {
        console.error('Error loading invitations:', err);
      } finally {
        setLoading(false);
      }
    };
    loadResponses();
  }, [surveyId]);

  const filtered = responses.filter(r => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    const name = (r.user_name || r.user_email || '').toLowerCase();
    const org = (r.organization_name || '').toLowerCase();
    return name.includes(term) || org.includes(term);
  });

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
        <CircularProgress sx={{ color: colors.primary }} />
      </Box>
    );
  }

  return (
    <Box>
      {/* Search & Actions Row */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <TextField
          placeholder="Search by name or organization"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          size="small"
          sx={{
            minWidth: 280,
            '& .MuiOutlinedInput-root': { backgroundColor: 'white', borderRadius: 2 }
          }}
          InputProps={{
            startAdornment: <InputAdornment position="start"><SearchIcon color="action" /></InputAdornment>,
          }}
        />
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<SettingsIcon />}
            onClick={() => setReminderDialogOpen(true)}
            sx={{ textTransform: 'none', color: colors.primary, borderColor: '#e0e0e0' }}
          >
            Reminder Settings
          </Button>
        </Box>
      </Box>

      {/* Invitation List */}
      {filtered.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 6 }}>
          <Typography variant="body1" sx={{ color: '#999' }}>No invitations found</Typography>
        </Box>
      ) : (
        <Box>
          {/* Header row */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              py: 1,
              px: 2,
              mb: 0.5,
            }}
          >
            <Typography variant="caption" sx={{ fontWeight: 600, flex: 1, minWidth: 150, color: colors.textSecondary }}>
              RESPONDENT
            </Typography>
            <Typography variant="caption" sx={{ fontWeight: 600, flex: 1, minWidth: 150, color: colors.textSecondary }}>
              ORGANIZATION
            </Typography>
            <Typography variant="caption" sx={{ fontWeight: 600, flex: 0.7, minWidth: 100, color: colors.textSecondary }}>
              PROGRESS
            </Typography>
            <Typography variant="caption" sx={{ fontWeight: 600, minWidth: 100, color: colors.textSecondary, textAlign: 'right' }}>
              STATUS
            </Typography>
          </Box>

          {filtered.map((r) => {
            const style = getStatusStyle(r.status);
            return (
              <Box
                key={r.id}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  py: 1.5,
                  px: 2,
                  backgroundColor: 'rgba(255,255,255,0.5)',
                  mb: 0.5,
                  borderRadius: 1,
                  borderBottom: '1px solid #eee',
                  '&:hover': { backgroundColor: 'rgba(255,255,255,0.8)' },
                }}
              >
                <Typography variant="body2" sx={{ fontWeight: 500, flex: 1, minWidth: 150 }}>
                  {r.user_name || r.user_email || `User #${r.user_id}`}
                </Typography>
                <Typography variant="body2" sx={{ color: colors.textSecondary, flex: 1, minWidth: 150 }}>
                  {r.organization_name || '-'}
                </Typography>
                <Typography variant="body2" sx={{ color: colors.textSecondary, flex: 0.7, minWidth: 100 }}>
                  {r.progress != null ? `${r.progress}%` : '-'}
                </Typography>
                <Box sx={{ minWidth: 100, textAlign: 'right' }}>
                  <Chip
                    label={statusLabels[r.status] || r.status || 'Draft'}
                    size="small"
                    sx={{
                      backgroundColor: style.bg,
                      color: style.text,
                      fontWeight: 500,
                      fontSize: '0.75rem',
                      minWidth: 80,
                    }}
                  />
                </Box>
              </Box>
            );
          })}
        </Box>
      )}

      {/* Reminder Settings Dialog */}
      <ReminderSettingsDialog
        open={reminderDialogOpen}
        onClose={() => setReminderDialogOpen(false)}
        surveyId={surveyId}
      />
    </Box>
  );
};

export default SurveyDetailInvitations;
