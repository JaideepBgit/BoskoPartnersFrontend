import React, { useState } from 'react';
import {
  Box,
  Container,
  Tabs,
  Tab,
  Typography,
  Paper
} from '@mui/material';
import Navbar from '../shared/Navbar/Navbar';
import PasswordSettings from './PasswordSettings';
import NotificationSettings from './NotificationSettings';
import LockIcon from '@mui/icons-material/Lock';
import NotificationsIcon from '@mui/icons-material/Notifications';

function TabPanel({ children, value, index }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`settings-tabpanel-${index}`}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

const SettingsPage = ({ onLogout }) => {
  const [tabValue, setTabValue] = useState(0);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f5f5f5' }}>
      <Navbar onLogout={onLogout} />
      
      <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
        <Paper elevation={2} sx={{ maxWidth: 600, mx: 'auto' }}>
          <Box sx={{ p: 3, textAlign: 'center', borderBottom: 1, borderColor: 'divider' }}>
            <Typography variant="h4" sx={{ fontWeight: 600 }}>
              Settings
            </Typography>
          </Box>
          
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            sx={{
              borderBottom: 1,
              borderColor: 'divider',
              '& .MuiTab-root': {
                textTransform: 'none',
                fontSize: '1rem',
                fontWeight: 500,
              },
            }}
          >
            <Tab
              icon={<LockIcon />}
              iconPosition="start"
              label="Password"
            />
            <Tab
              icon={<NotificationsIcon />}
              iconPosition="start"
              label="Notifications"
            />
          </Tabs>

          <TabPanel value={tabValue} index={0}>
            <PasswordSettings />
          </TabPanel>

          <TabPanel value={tabValue} index={1}>
            <NotificationSettings />
          </TabPanel>
        </Paper>
      </Container>
    </Box>
  );
};

export default SettingsPage;
