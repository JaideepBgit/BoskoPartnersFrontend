import React from 'react';
import { Paper, Box, Typography } from '@mui/material';

const KpiStatCard = ({ icon, label, value, subtitle, color = '#633394' }) => (
  <Paper
    sx={{
      px: 1.5,
      py: 1,
      borderRadius: 1.5,
      width: 130,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      textAlign: 'center',
      boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
      border: '1px solid #e0e0e0',
    }}
  >
    <Box sx={{ color: '#633394', mb: 0.25, '& .MuiSvgIcon-root': { fontSize: 18 } }}>
      {icon}
    </Box>
    <Typography sx={{ fontWeight: 700, color: '#633394', lineHeight: 1, fontSize: '1.1rem' }}>
      {value}
    </Typography>
    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500, fontSize: '0.65rem', lineHeight: 1.2, mt: 0.25 }}>
      {label}
    </Typography>
    {subtitle && (
      <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.6rem', lineHeight: 1.1 }}>
        {subtitle}
      </Typography>
    )}
  </Paper>
);

export default KpiStatCard;
