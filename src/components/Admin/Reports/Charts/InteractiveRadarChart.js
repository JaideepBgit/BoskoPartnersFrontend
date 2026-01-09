import React from 'react';
import {
    Radar,
    RadarChart,
    PolarGrid,
    PolarAngleAxis,
    PolarRadiusAxis,
    ResponsiveContainer,
    Tooltip,
    Legend
} from 'recharts';
import { Box, Typography, Paper, useTheme } from '@mui/material';

const InteractiveRadarChart = ({
    title,
    data,
    targetData,
    showComparison = false,
    maxValue = 5,
    height = 400,
    questionLabels = {},
    adminColors = {},
}) => {
    const theme = useTheme();

    // Prepare data for Recharts
    const chartData = Object.entries(data)
        .filter(([_, value]) => typeof value === 'number' && !Number.isNaN(value))
        .map(([key, value]) => {
            const label = questionLabels[key] || key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
            const item = {
                subject: label,
                fullKey: key,
                average: parseFloat(value.toFixed(2)),
            };

            if (showComparison && targetData && targetData[key] !== undefined) {
                item.individual = parseFloat(targetData[key].toFixed(2));
            }

            return item;
        });

    if (chartData.length === 0) {
        return (
            <Paper sx={{ p: 2, height, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Typography color="text.secondary">No data available</Typography>
            </Paper>
        );
    }

    return (
        <Paper sx={{ p: 2, borderRadius: 2, boxShadow: '0 4px 20px rgba(0,0,0,0.05)', height: '100%' }}>
            {title && <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', color: adminColors.primary || '#633394' }}>{title}</Typography>}
            <Box sx={{ width: '100%', height: height - 60 }}>
                <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="70%" data={chartData}>
                        <PolarGrid stroke={theme.palette.divider} />
                        <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10, fill: theme.palette.text.secondary }} />
                        <PolarRadiusAxis angle={30} domain={[0, maxValue]} tick={{ fontSize: 10 }} />

                        <Radar
                            name="Group Average"
                            dataKey="average"
                            stroke="#1976d2"
                            fill="#1976d2"
                            fillOpacity={0.4}
                        />

                        {showComparison && (
                            <Radar
                                name="Individual Score"
                                dataKey="individual"
                                stroke={adminColors.primary || '#633394'}
                                fill={adminColors.primary || '#633394'}
                                fillOpacity={0.5}
                            />
                        )}

                        <Tooltip />
                        <Legend />
                    </RadarChart>
                </ResponsiveContainer>
            </Box>
        </Paper>
    );
};

export default InteractiveRadarChart;
