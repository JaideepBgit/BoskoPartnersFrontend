import React from 'react';
import { Box, Typography, Paper, Chip } from '@mui/material';

const GeographicChart = ({ title, data, height = 300 }) => {
  if (!data || Object.keys(data).length === 0) {
    return (
      <Paper sx={{ p: 2, height: height }}>
        <Typography variant="h6" gutterBottom>{title}</Typography>
        <Typography color="text.secondary">No data available</Typography>
      </Paper>
    );
  }

  const maxCount = Math.max(...Object.values(data).map(d => d.count));
  const colors = ['#1976d2', '#388e3c', '#f57c00', '#d32f2f', '#7b1fa2', '#00796b'];

  return (
    <Paper sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>{title}</Typography>
      
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        gap: 2,
        maxHeight: height - 80,
        overflowY: 'auto'
      }}>
        {Object.entries(data).map(([country, countryData], index) => {
          const percentage = (countryData.count / maxCount) * 100;
          const color = colors[index % colors.length];
          
          return (
            <Box key={country} sx={{ mb: 2 }}>
              {/* Country header */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="subtitle1" fontWeight="bold">
                  {country}
                </Typography>
                <Chip 
                  label={`${countryData.count} responses`} 
                  size="small" 
                  sx={{ backgroundColor: color, color: 'white' }}
                />
              </Box>
              
              {/* Progress bar */}
              <Box sx={{
                width: '100%',
                height: 20,
                backgroundColor: '#f0f0f0',
                borderRadius: 1,
                overflow: 'hidden',
                mb: 1
              }}>
                <Box sx={{
                  width: `${percentage}%`,
                  height: '100%',
                  backgroundColor: color,
                  borderRadius: 1,
                  transition: 'width 0.3s ease'
                }} />
              </Box>
              
              {/* Cities */}
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {countryData.cities.map((city, cityIndex) => (
                  <Chip 
                    key={cityIndex}
                    label={city} 
                    size="small" 
                    variant="outlined"
                    sx={{ fontSize: '0.7rem' }}
                  />
                ))}
              </Box>
            </Box>
          );
        })}
      </Box>
      
      {/* Summary */}
      <Box sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: 'divider' }}>
        <Typography variant="body2" color="text.secondary">
          Total: {Object.values(data).reduce((sum, d) => sum + d.count, 0)} responses 
          across {Object.keys(data).length} countries
        </Typography>
      </Box>
    </Paper>
  );
};

export default GeographicChart;
