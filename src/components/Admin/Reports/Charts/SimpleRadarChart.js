import React from 'react';
import { Box, Typography, Paper } from '@mui/material';

const SimpleRadarChart = ({ title, data, height = 300, maxValue = 5 }) => {
  if (!data || Object.keys(data).length === 0) {
    return (
      <Paper sx={{ p: 2, height }}>
        <Typography variant="h6" gutterBottom>{title}</Typography>
        <Typography color="text.secondary">No data available</Typography>
      </Paper>
    );
  }

  const size = 220;
  const center = size / 2;
  const radius = 80;

  // Prepare data
  const dataEntries = Object.entries(data);
  const isGroupedData = typeof dataEntries[0][1] === 'object';

  let radarData = [];

  if (isGroupedData) {
    // Handle grouped data (multiple radar shapes)
    const allMetrics = new Set();
    dataEntries.forEach(([group, values]) => {
      Object.keys(values).forEach(metric => allMetrics.add(metric));
    });
    
    const metrics = Array.from(allMetrics);
    
    radarData = dataEntries.map(([group, values], index) => ({
      label: group,
      values: metrics.map(metric => ({
        label: formatLabel(metric),
        value: values[metric] || 0,
        metric
      })),
      color: getColor(index)
    }));
  } else {
    // Handle simple data (single radar shape)
    radarData = [{
      label: 'Values',
      values: dataEntries.map(([key, value]) => ({
        label: formatLabel(key),
        value: value,
        metric: key
      })),
      color: '#1976d2'
    }];
  }

  const numAxes = radarData[0].values.length;
  const angleStep = (2 * Math.PI) / numAxes;

  // Calculate points for each data series
  const calculatePoints = (values) => {
    return values.map((item, index) => {
      const angle = index * angleStep - Math.PI / 2; // Start from top
      const normalizedValue = Math.min(item.value / maxValue, 1);
      const pointRadius = normalizedValue * radius;
      
      return {
        x: center + pointRadius * Math.cos(angle),
        y: center + pointRadius * Math.sin(angle),
        value: item.value,
        label: item.label
      };
    });
  };

  // Create polygon path
  const createPolygonPath = (points) => {
    if (points.length === 0) return '';
    
    const pathData = points.map((point, index) => 
      `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`
    ).join(' ') + ' Z';
    
    return pathData;
  };

  // Generate axis lines and labels
  const axes = Array.from({ length: numAxes }, (_, index) => {
    const angle = index * angleStep - Math.PI / 2;
    const endX = center + radius * Math.cos(angle);
    const endY = center + radius * Math.sin(angle);
    const labelX = center + (radius + 15) * Math.cos(angle);
    const labelY = center + (radius + 15) * Math.sin(angle);
    
    return {
      line: { x1: center, y1: center, x2: endX, y2: endY },
      label: { 
        x: labelX, 
        y: labelY, 
        text: radarData[0].values[index]?.label || `Axis ${index + 1}`
      }
    };
  });

  // Generate concentric circles for scale
  const scaleCircles = [0.2, 0.4, 0.6, 0.8, 1.0].map(scale => ({
    radius: radius * scale,
    value: maxValue * scale
  }));

  const colors = ['#1976d2', '#388e3c', '#f57c00', '#d32f2f', '#7b1fa2', '#00796b'];

  const getColor = (index) => colors[index % colors.length];

  return (
    <Paper sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>{title}</Typography>
      
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
        {/* Radar Chart SVG */}
        <Box>
          <svg width={size + 40} height={size + 40} viewBox={`0 0 ${size + 40} ${size + 40}`}>
            <g transform="translate(20, 20)">
              {/* Scale circles */}
              {scaleCircles.map((circle, index) => (
                <circle
                  key={index}
                  cx={center}
                  cy={center}
                  r={circle.radius}
                  fill="none"
                  stroke="#e0e0e0"
                  strokeWidth="1"
                />
              ))}

              {/* Axis lines */}
              {axes.map((axis, index) => (
                <line
                  key={index}
                  x1={axis.line.x1}
                  y1={axis.line.y1}
                  x2={axis.line.x2}
                  y2={axis.line.y2}
                  stroke="#e0e0e0"
                  strokeWidth="1"
                />
              ))}

              {/* Data polygons */}
              {radarData.map((series, seriesIndex) => {
                const points = calculatePoints(series.values);
                return (
                  <g key={seriesIndex}>
                    {/* Filled polygon */}
                    <path
                      d={createPolygonPath(points)}
                      fill={series.color}
                      fillOpacity="0.3"
                      stroke={series.color}
                      strokeWidth="2"
                    />
                    
                    {/* Data points */}
                    {points.map((point, pointIndex) => (
                      <circle
                        key={pointIndex}
                        cx={point.x}
                        cy={point.y}
                        r="3"
                        fill={series.color}
                        stroke="white"
                        strokeWidth="1"
                      />
                    ))}
                  </g>
                );
              })}

              {/* Axis labels */}
              {axes.map((axis, index) => (
                <text
                  key={index}
                  x={axis.label.x}
                  y={axis.label.y}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize="9"
                  fill="#666"
                >
                  {axis.label.text.length > 12 ? 
                    axis.label.text.substring(0, 12) + '...' : 
                    axis.label.text}
                </text>
              ))}

              {/* Scale labels */}
              <text x={center + 5} y={center - radius + 5} fontSize="8" fill="#999">
                {maxValue}
              </text>
            </g>
          </svg>
        </Box>

        {/* Legend */}
        {radarData.length > 1 && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Typography variant="subtitle2" sx={{ fontSize: '0.8rem' }}>
              Series
            </Typography>
            {radarData.map((series, index) => (
              <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box
                  sx={{
                    width: 16,
                    height: 16,
                    backgroundColor: series.color,
                    borderRadius: 1,
                    opacity: 0.7
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

      {/* Value summary for single series */}
      {radarData.length === 1 && (
        <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', gap: 1, justifyContent: 'center' }}>
          {radarData[0].values.map((item, index) => (
            <Box key={index} sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 0.5,
              px: 1,
              py: 0.5,
              backgroundColor: 'action.hover',
              borderRadius: 1
            }}>
              <Typography variant="caption" sx={{ fontSize: '0.6rem' }}>
                {item.label}: {item.value.toFixed(1)}
              </Typography>
            </Box>
          ))}
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

export default SimpleRadarChart;
