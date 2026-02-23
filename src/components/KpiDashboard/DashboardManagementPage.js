import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Button } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AdminDashboard from '../Dashboard/AdminDashboard';

const DashboardManagementPage = () => {
  const navigate = useNavigate();

  const handleBack = () => {
    navigate('/dashboard');
  };

  return (
    <Box>
      {/* Admin Dashboard Content */}
      <AdminDashboard backButton={
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={handleBack}
          sx={{
            textTransform: 'none',
            color: '#633394',
            borderColor: '#e0e0e0',
            '&:hover': {
              backgroundColor: 'rgba(99, 51, 148, 0.04)'
            }
          }}
        >
          Back to Dashboard
        </Button>
      } />
    </Box>
  );
};

export default DashboardManagementPage;
