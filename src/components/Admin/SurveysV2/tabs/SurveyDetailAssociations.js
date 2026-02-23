import React from 'react';
import { Box, Typography } from '@mui/material';

const SurveyDetailAssociations = ({ surveyId, survey }) => {
  return (
    <Box sx={{ textAlign: 'center', py: 6 }}>
      <Typography variant="body1" sx={{ color: '#999' }}>Associations</Typography>
      <Typography variant="body2" sx={{ color: '#bbb', mt: 1 }}>
        Manage which associations have access to this survey.
      </Typography>
    </Box>
  );
};

export default SurveyDetailAssociations;
