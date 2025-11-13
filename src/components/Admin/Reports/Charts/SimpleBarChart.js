import React from 'react';
import { Box, Typography, Paper } from '@mui/material';

const SimpleBarChart = ({ 
  title, 
  data, 
  targetData, 
  maxValue = 10, 
  height = 600,
  showComparison = false,
  questionLabels = {},
  questionDetails = {}
}) => {
  console.log(targetData);
  if (!data || Object.keys(data).length === 0) {
    return (
      <Paper sx={{ p: 2, maxWidth: '100%', overflow: 'hidden' }}>
        <Typography variant="h6" gutterBottom>{title}</Typography>
        <Typography color="text.secondary">No data available</Typography>
      </Paper>
    );
  }

  const barHeight = 20;
  const barSpacing = 4;
  const labelWidth = 200;
  const chartWidth = 600; // Maximum width for bars - reduced for shorter bars
  const groupSpacing = showComparison ? 6 : 0; // Space between bars in a group

  return (
    <Paper sx={{ p: 2, maxWidth: '100%', overflow: 'hidden' }}>
      <Typography variant="h6" gutterBottom>{title}</Typography>
      
      {/* Scale indicator */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, ml: `${labelWidth + 16}px` }}>
        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem', mr: 1, flexShrink: 0 }}>
          Scale: 0
        </Typography>
        <Box sx={{ 
          width: chartWidth, 
          maxWidth: chartWidth,
          height: 4, 
          background: 'linear-gradient(to right, #e0e0e0 0%, #bdbdbd 100%)',
          borderRadius: 2,
          position: 'relative',
          flexShrink: 0
        }}>
          {/* Scale markers */}
          {[0.25, 0.5, 0.75, 1].map((pos) => (
            <Box
              key={pos}
              sx={{
                position: 'absolute',
                left: `${pos * 100}%`,
                top: -2,
                width: 2,
                height: 8,
                backgroundColor: '#757575'
              }}
            />
          ))}
        </Box>
        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem', ml: 1, flexShrink: 0 }}>
          {maxValue}
        </Typography>
      </Box>
      
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        gap: 1,
        maxHeight: height - 120,
        overflowY: 'auto',
        overflowX: 'hidden'
      }}>
        {Object.entries(data)
          // Only keep numeric entries
          .filter(([key, value]) => typeof value === 'number' && !Number.isNaN(value))
          .map(([key, value]) => {
          const targetValueRaw = targetData ? targetData[key] : null;
          const targetValue = (typeof targetValueRaw === 'number' && !Number.isNaN(targetValueRaw)) ? targetValueRaw : null;
          
          // Calculate max score between Group Average and Your Score (using raw values)
          const maxScore = targetValue !== null ? Math.max(value, targetValue) : value;
          
          // Calculate bar widths as: (score / maxScore) * chartWidth
          // Minimum bar width is 40px for visibility
          const barWidth = Math.min(
            Math.max((value / maxScore) * chartWidth, 40),
            chartWidth
          );
          const targetBarWidth = targetValue !== null ? Math.min(
            Math.max((targetValue / maxScore) * chartWidth, 40),
            chartWidth
          ) : 0;

          // Derive label priority: NLP short label -> questionDetails.label -> questionDetails.full_text -> formatted key
          let label = formatLabel(key);
          if (questionLabels && questionLabels[key]) {
            label = questionLabels[key];
          } else if (questionDetails && questionDetails[key]) {
            label = questionDetails[key].label || questionDetails[key].full_text || label;
          }

          return (
            <Box key={key} sx={{ display: 'flex', alignItems: 'center', mb: 1, minWidth: 0 }}>
              {/* Label */}
              <Box sx={{ width: labelWidth, minWidth: labelWidth, pr: 2, flexShrink: 0 }}>
                <Typography variant="body2" sx={{ fontSize: '0.8rem', fontWeight: 500 }}>
                  {label}
                </Typography>
              </Box>
              
              {/* Chart Area - Fixed width container */}
              <Box sx={{ 
                position: 'relative', 
                width: chartWidth + 80,
                maxWidth: chartWidth + 80,
                minWidth: chartWidth + 80,
                flexShrink: 0,
                overflow: 'visible',
                display: 'flex',
                flexDirection: 'column',
                gap: showComparison ? `${groupSpacing}px` : 0
              }}>
                {/* Group Average bar */}
                <Box sx={{
                  width: chartWidth,
                  maxWidth: chartWidth,
                  height: barHeight,
                  backgroundColor: '#e8e8e8',
                  borderRadius: 1,
                  position: 'relative',
                  border: '1px solid #d0d0d0',
                  overflow: 'hidden'
                }}>
                  <Box sx={{
                    width: `${barWidth}px`,
                    maxWidth: '100%',
                    height: '100%',
                    backgroundColor: '#1976d2',
                    borderRadius: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'flex-end',
                    pr: 0.5,
                    position: 'relative',
                    transition: 'width 0.3s ease',
                    overflow: 'hidden'
                  }}>
                    <Typography variant="caption" color="white" sx={{ fontSize: '0.75rem', fontWeight: 600 }}>
                      {value.toFixed(1)}
                    </Typography>
                  </Box>
                </Box>
                  
                {/* Target/Your Score bar (side-by-side in comparison mode) */}
                {showComparison && targetValue !== null && (
                  <Box sx={{
                    width: chartWidth,
                    maxWidth: chartWidth,
                    height: barHeight,
                    backgroundColor: '#e8e8e8',
                    borderRadius: 1,
                    position: 'relative',
                    border: '1px solid #d0d0d0',
                    overflow: 'hidden'
                  }}>
                    <Box sx={{
                      width: `${targetBarWidth}px`,
                      maxWidth: '100%',
                      height: '100%',
                      backgroundColor: targetValue > value ? '#4caf50' : '#ff9800',
                      borderRadius: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'flex-end',
                      pr: 0.5,
                      transition: 'width 0.3s ease',
                      overflow: 'hidden'
                    }}>
                      <Typography variant="caption" color="white" sx={{ fontSize: '0.75rem', fontWeight: 600 }}>
                        {targetValue.toFixed(1)}
                      </Typography>
                    </Box>
                  </Box>
                )}
                
                {/* Difference indicator */}
                {showComparison && targetValue !== null && (
                  <Box sx={{ 
                    position: 'absolute', 
                    left: chartWidth + 10, 
                    top: '50%',
                    transform: 'translateY(-50%)',
                    display: 'flex',
                    alignItems: 'center',
                    minWidth: 50,
                    width: 60,
                    flexShrink: 0
                  }}>
                    <Typography 
                      variant="caption" 
                      color={targetValue > value ? 'success.main' : targetValue < value ? 'warning.main' : 'text.secondary'}
                      sx={{ fontSize: '0.75rem', fontWeight: 'bold' }}
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
        <Box sx={{ mt: 2, display: 'flex', gap: 3, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ width: 16, height: 12, backgroundColor: '#1976d2', borderRadius: 1, flexShrink: 0 }} />
            <Typography variant="caption">Group Average</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ width: 16, height: 12, backgroundColor: '#4caf50', borderRadius: 1, flexShrink: 0 }} />
            <Typography variant="caption">Your Score (Above Average)</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ width: 16, height: 12, backgroundColor: '#ff9800', borderRadius: 1, flexShrink: 0 }} />
            <Typography variant="caption">Your Score (Below Average)</Typography>
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
