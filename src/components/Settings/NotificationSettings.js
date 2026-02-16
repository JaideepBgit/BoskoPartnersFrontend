import React, { useState } from 'react';
import {
  Box,
  Typography,
  Switch,
  FormControlLabel,
  FormGroup,
  Divider,
  Alert
} from '@mui/material';
import NotificationsIcon from '@mui/icons-material/Notifications';

const NotificationSettings = () => {
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [surveyReminders, setSurveyReminders] = useState(true);
  const [systemUpdates, setSystemUpdates] = useState(false);
  const [weeklyReports, setWeeklyReports] = useState(false);
  const [success, setSuccess] = useState('');

  const handleToggle = (setting, value) => {
    setSuccess('');
    
    // Update the specific setting
    switch(setting) {
      case 'email':
        setEmailNotifications(value);
        break;
      case 'survey':
        setSurveyReminders(value);
        break;
      case 'system':
        setSystemUpdates(value);
        break;
      case 'reports':
        setWeeklyReports(value);
        break;
      default:
        break;
    }

    // Show success message
    setSuccess('Notification preferences updated successfully!');
    setTimeout(() => setSuccess(''), 3000);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <NotificationsIcon sx={{ fontSize: 32, color: '#633394', mr: 2 }} />
        <Typography variant="h5" component="h2">
          Notification Preferences
        </Typography>
      </Box>

      <Divider sx={{ mb: 3 }} />

      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Manage how you receive notifications and updates from the system.
      </Typography>

      {success && (
        <Alert severity="success" sx={{ mb: 3 }}>
          {success}
        </Alert>
      )}

      <FormGroup>
        <Box sx={{ mb: 3 }}>
          <FormControlLabel
            control={
              <Switch
                checked={emailNotifications}
                onChange={(e) => handleToggle('email', e.target.checked)}
                sx={{
                  '& .MuiSwitch-switchBase.Mui-checked': {
                    color: '#633394',
                  },
                  '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                    backgroundColor: '#633394',
                  },
                }}
              />
            }
            label={
              <Box>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                  Email Notifications
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Receive general email notifications about your account
                </Typography>
              </Box>
            }
            sx={{ alignItems: 'flex-start', mb: 2 }}
          />

          <FormControlLabel
            control={
              <Switch
                checked={surveyReminders}
                onChange={(e) => handleToggle('survey', e.target.checked)}
                sx={{
                  '& .MuiSwitch-switchBase.Mui-checked': {
                    color: '#633394',
                  },
                  '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                    backgroundColor: '#633394',
                  },
                }}
              />
            }
            label={
              <Box>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                  Survey Reminders
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Get reminders about pending surveys and questionnaires
                </Typography>
              </Box>
            }
            sx={{ alignItems: 'flex-start', mb: 2 }}
          />

          <FormControlLabel
            control={
              <Switch
                checked={systemUpdates}
                onChange={(e) => handleToggle('system', e.target.checked)}
                sx={{
                  '& .MuiSwitch-switchBase.Mui-checked': {
                    color: '#633394',
                  },
                  '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                    backgroundColor: '#633394',
                  },
                }}
              />
            }
            label={
              <Box>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                  System Updates
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Receive notifications about system maintenance and updates
                </Typography>
              </Box>
            }
            sx={{ alignItems: 'flex-start', mb: 2 }}
          />

          <FormControlLabel
            control={
              <Switch
                checked={weeklyReports}
                onChange={(e) => handleToggle('reports', e.target.checked)}
                sx={{
                  '& .MuiSwitch-switchBase.Mui-checked': {
                    color: '#633394',
                  },
                  '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                    backgroundColor: '#633394',
                  },
                }}
              />
            }
            label={
              <Box>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                  Weekly Reports
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Receive weekly summary reports of your activity
                </Typography>
              </Box>
            }
            sx={{ alignItems: 'flex-start' }}
          />
        </Box>
      </FormGroup>

      <Box sx={{ mt: 3, p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
        <Typography variant="subtitle2" gutterBottom>
          Note:
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Some critical notifications cannot be disabled for security and compliance reasons.
        </Typography>
      </Box>
    </Box>
  );
};

export default NotificationSettings;
