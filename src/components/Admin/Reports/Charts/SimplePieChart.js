import React from 'react';
import { Box, Typography, Paper } from '@mui/material';

const SimplePieChart = ({ title, data, height = 300 }) => {
  if (!data || Object.keys(data).length === 0) {
    return (
      <Paper sx={{ p: 2, height }}>
        <Typography variant="h6" gutterBottom>{title}</Typography>
        <Typography color="text.secondary">No data available</Typography>
      </Paper>
    );
  }

  // Convert data to array and calculate total
  const dataArray = Object.entries(data).map(([key, value]) => ({
    label: formatLabel(key),
    value: typeof value === 'object' ? Object.values(value).reduce((sum, v) => sum + v, 0) : value,
    originalKey: key
  }));

  const total = dataArray.reduce((sum, item) => sum + item.value, 0);
  
  // Colors for pie segments
  const colors = [
    '#1976d2', '#388e3c', '#f57c00', '#d32f2f', '#7b1fa2', 
    '#00796b', '#5d4037', '#616161', '#e91e63', '#ff5722'
  ];

  // Calculate angles for pie segments
  let currentAngle = 0;
  const segments = dataArray.map((item, index) => {
    const percentage = (item.value / total) * 100;
    const angle = (item.value / total) * 360;
    const startAngle = currentAngle;
    currentAngle += angle;
    
    return {
      ...item,
      percentage,
      angle,
      startAngle,
      endAngle: currentAngle,
      color: colors[index % colors.length]
    };
  });

  const radius = 80;
  const centerX = 120;
  const centerY = 120;

  // Create SVG path for pie segment
  const createPath = (centerX, centerY, radius, startAngle, endAngle) => {
    const start = polarToCartesian(centerX, centerY, radius, endAngle);
    const end = polarToCartesian(centerX, centerY, radius, startAngle);
    const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
    
    return [
      "M", centerX, centerY, 
      "L", start.x, start.y, 
      "A", radius, radius, 0, largeArcFlag, 0, end.x, end.y,
      "Z"
    ].join(" ");
  };

  const polarToCartesian = (centerX, centerY, radius, angleInDegrees) => {
    const angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;
    return {
      x: centerX + (radius * Math.cos(angleInRadians)),
      y: centerY + (radius * Math.sin(angleInRadians))
    };
  };

  return (
    <Paper sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>{title}</Typography>
      
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
        {/* Pie Chart SVG */}
        <Box>
          <svg width="240" height="240" viewBox="0 0 240 240">
            {segments.map((segment, index) => (
              <path
                key={index}
                d={createPath(centerX, centerY, radius, segment.startAngle, segment.endAngle)}
                fill={segment.color}
                stroke="white"
                strokeWidth="2"
              />
            ))}
          </svg>
        </Box>

        {/* Legend */}
        <Box sx={{ flex: 1 }}>
          <Typography variant="subtitle2" gutterBottom>
            Distribution
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {segments.map((segment, index) => (
              <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box
                  sx={{
                    width: 16,
                    height: 16,
                    backgroundColor: segment.color,
                    borderRadius: 1
                  }}
                />
                <Typography variant="body2" sx={{ flex: 1, fontSize: '0.8rem' }}>
                  {segment.label}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {segment.percentage.toFixed(1)}%
                </Typography>
                <Typography variant="caption" fontWeight="bold">
                  {segment.value.toFixed(1)}
                </Typography>
              </Box>
            ))}
          </Box>
          
          <Box sx={{ mt: 2, pt: 1, borderTop: 1, borderColor: 'divider' }}>
            <Typography variant="caption" color="text.secondary">
              Total: {total.toFixed(1)}
            </Typography>
          </Box>
        </Box>
      </Box>
    </Paper>
  );
};

const formatLabel = (key) => {
  return key
    .replace(/_/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase())
    .replace(/And/g, '&');
};

export default SimplePieChart;
