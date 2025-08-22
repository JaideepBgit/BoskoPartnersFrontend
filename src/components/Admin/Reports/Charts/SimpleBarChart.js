import React from 'react';
import { Box, Typography, Paper } from '@mui/material';

const SimpleBarChart = ({ 
  title, 
  data, 
  targetData, 
  maxValue = 5, 
  height = 300,
  showComparison = false 
}) => {
  if (!data || Object.keys(data).length === 0) {
    return (
      <Paper sx={{ p: 2, height: height }}>
        <Typography variant="h6" gutterBottom>{title}</Typography>
        <Typography color="text.secondary">No data available</Typography>
      </Paper>
    );
  }

  const barHeight = 20;
  const barSpacing = 8;
  const labelWidth = 180;
  const chartWidth = 400;

  return (
    <Paper sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>{title}</Typography>
      
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        gap: 1,
        maxHeight: height - 80,
        overflowY: 'auto'
      }}>
        {Object.entries(data).map(([key, value], index) => {
          const targetValue = targetData ? targetData[key] : null;
          const percentage = (value / maxValue) * 100;
          const targetPercentage = targetValue ? (targetValue / maxValue) * 100 : 0;
          
          return (
            <Box key={key} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              {/* Label */}
              <Box sx={{ width: labelWidth, pr: 2 }}>
                <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
                  {formatLabel(key)}
                </Typography>
              </Box>
              
              {/* Chart Area */}
              <Box sx={{ flex: 1, position: 'relative' }}>
                {/* Background bar */}
                <Box sx={{
                  width: '100%',
                  height: barHeight,
                  backgroundColor: '#f0f0f0',
                  borderRadius: 1,
                  position: 'relative',
                  overflow: 'hidden'
                }}>
                  {/* Average bar */}
                  <Box sx={{
                    width: `${percentage}%`,
                    height: '100%',
                    backgroundColor: '#1976d2',
                    borderRadius: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'flex-end',
                    pr: 1
                  }}>
                    <Typography variant="caption" color="white" sx={{ fontSize: '0.7rem' }}>
                      {value.toFixed(1)}
                    </Typography>
                  </Box>
                  
                  {/* Target bar overlay (if comparison mode) */}
                  {showComparison && targetValue && (
                    <Box sx={{
                      position: 'absolute',
                      top: 2,
                      left: 0,
                      width: `${targetPercentage}%`,
                      height: barHeight - 4,
                      backgroundColor: targetValue > value ? '#4caf50' : '#ff9800',
                      borderRadius: 1,
                      opacity: 0.8,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'flex-end',
                      pr: 1
                    }}>
                      <Typography variant="caption" color="white" sx={{ fontSize: '0.7rem' }}>
                        {targetValue.toFixed(1)}
                      </Typography>
                    </Box>
                  )}
                </Box>
                
                {/* Difference indicator */}
                {showComparison && targetValue && (
                  <Box sx={{ 
                    position: 'absolute', 
                    right: -60, 
                    top: 0, 
                    height: barHeight,
                    display: 'flex',
                    alignItems: 'center'
                  }}>
                    <Typography 
                      variant="caption" 
                      color={targetValue > value ? 'success.main' : targetValue < value ? 'warning.main' : 'text.secondary'}
                      sx={{ fontSize: '0.7rem', fontWeight: 'bold' }}
                    >
                      {targetValue > value ? '+' : ''}{(targetValue - value).toFixed(1)}
                    </Typography>
                  </Box>
                )}
              </Box>
            </Box>
          );
        })}
      </Box>
      
      {/* Legend */}
      {showComparison && (
        <Box sx={{ mt: 2, display: 'flex', gap: 3, justifyContent: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ width: 16, height: 12, backgroundColor: '#1976d2', borderRadius: 1 }} />
            <Typography variant="caption">Average</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ width: 16, height: 12, backgroundColor: '#4caf50', borderRadius: 1 }} />
            <Typography variant="caption">Selected (Better)</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ width: 16, height: 12, backgroundColor: '#ff9800', borderRadius: 1 }} />
            <Typography variant="caption">Selected (Lower)</Typography>
          </Box>
        </Box>
      )}
    </Paper>
  );
};

const formatLabel = (key) => {
  return key
    .replace(/_/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase())
    .replace(/And/g, '&');
};

export default SimpleBarChart;
