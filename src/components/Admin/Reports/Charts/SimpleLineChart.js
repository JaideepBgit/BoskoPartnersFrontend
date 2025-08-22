import React from 'react';
import { Box, Typography, Paper } from '@mui/material';

const SimpleLineChart = ({ title, data, height = 300, maxValue = 5 }) => {
  if (!data || Object.keys(data).length === 0) {
    return (
      <Paper sx={{ p: 2, height }}>
        <Typography variant="h6" gutterBottom>{title}</Typography>
        <Typography color="text.secondary">No data available</Typography>
      </Paper>
    );
  }

  const chartWidth = 500;
  const chartHeight = 200;
  const padding = { top: 20, right: 40, bottom: 60, left: 80 };

  // Prepare data for line chart
  const dataEntries = Object.entries(data);
  const isGroupedData = typeof dataEntries[0][1] === 'object';

  let chartData = [];
  
  if (isGroupedData) {
    // Handle grouped data (multiple lines)
    const allMetrics = new Set();
    dataEntries.forEach(([group, values]) => {
      Object.keys(values).forEach(metric => allMetrics.add(metric));
    });
    
    const metrics = Array.from(allMetrics);
    const groups = dataEntries.map(([group]) => group);
    
    chartData = metrics.map((metric, index) => ({
      label: formatLabel(metric),
      points: groups.map((group, groupIndex) => ({
        x: groupIndex,
        y: data[group][metric] || 0,
        label: group
      })),
      color: getColor(index)
    }));
  } else {
    // Handle simple data (single line)
    chartData = [{
      label: 'Values',
      points: dataEntries.map(([key, value], index) => ({
        x: index,
        y: value,
        label: formatLabel(key)
      })),
      color: '#1976d2'
    }];
  }

  const maxDataValue = Math.max(
    ...chartData.flatMap(series => series.points.map(p => p.y)),
    maxValue
  );

  // Calculate positions
  const getX = (index) => padding.left + (index * (chartWidth - padding.left - padding.right)) / Math.max(chartData[0].points.length - 1, 1);
  const getY = (value) => padding.top + (chartHeight - padding.top - padding.bottom) * (1 - value / maxDataValue);

  // Create SVG path for line
  const createLinePath = (points) => {
    if (points.length === 0) return '';
    
    const pathData = points.map((point, index) => {
      const x = getX(point.x);
      const y = getY(point.y);
      return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
    }).join(' ');
    
    return pathData;
  };

  const colors = ['#1976d2', '#388e3c', '#f57c00', '#d32f2f', '#7b1fa2', '#00796b'];

  const getColor = (index) => colors[index % colors.length];

  return (
    <Paper sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>{title}</Typography>
      
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        {/* Chart SVG */}
        <svg width={chartWidth} height={chartHeight + 40} viewBox={`0 0 ${chartWidth} ${chartHeight + 40}`}>
          {/* Grid lines */}
          {[0, 1, 2, 3, 4, 5].map(value => (
            <g key={value}>
              <line
                x1={padding.left}
                y1={getY(value)}
                x2={chartWidth - padding.right}
                y2={getY(value)}
                stroke="#e0e0e0"
                strokeWidth="1"
              />
              <text
                x={padding.left - 10}
                y={getY(value) + 4}
                textAnchor="end"
                fontSize="10"
                fill="#666"
              >
                {value}
              </text>
            </g>
          ))}

          {/* X-axis labels */}
          {chartData[0] && chartData[0].points.map((point, index) => (
            <text
              key={index}
              x={getX(index)}
              y={chartHeight - padding.bottom + 15}
              textAnchor="middle"
              fontSize="9"
              fill="#666"
              transform={`rotate(-45, ${getX(index)}, ${chartHeight - padding.bottom + 15})`}
            >
              {point.label.length > 10 ? point.label.substring(0, 10) + '...' : point.label}
            </text>
          ))}

          {/* Lines */}
          {chartData.map((series, seriesIndex) => (
            <g key={seriesIndex}>
              <path
                d={createLinePath(series.points)}
                fill="none"
                stroke={series.color}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              
              {/* Data points */}
              {series.points.map((point, pointIndex) => (
                <circle
                  key={pointIndex}
                  cx={getX(point.x)}
                  cy={getY(point.y)}
                  r="4"
                  fill={series.color}
                  stroke="white"
                  strokeWidth="2"
                />
              ))}
            </g>
          ))}
        </svg>

        {/* Legend */}
        {chartData.length > 1 && (
          <Box sx={{ display: 'flex', gap: 2, mt: 2, flexWrap: 'wrap', justifyContent: 'center' }}>
            {chartData.map((series, index) => (
              <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box
                  sx={{
                    width: 16,
                    height: 3,
                    backgroundColor: series.color,
                    borderRadius: 1
                  }}
                />
                <Typography variant="caption" sx={{ fontSize: '0.7rem' }}>
                  {series.label}
                </Typography>
              </Box>
            ))}
          </Box>
        )}
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

export default SimpleLineChart;
