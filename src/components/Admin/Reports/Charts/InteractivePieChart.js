import React from 'react';
import {
    PieChart,
    Pie,
    Cell,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from 'recharts';
import { Box, Typography, Paper, useTheme } from '@mui/material';

const InteractivePieChart = ({
    title,
    data,
    height = 400,
    adminColors = {},
}) => {
    const theme = useTheme();

    const COLORS = [
        '#633394', '#967CB2', '#4CAF50', '#FF9800', '#F44336',
        '#2196F3', '#9C27B0', '#795548', '#607D8B', '#E91E63'
    ];

    // Prepare data for Recharts
    const chartData = Object.entries(data)
        .map(([key, value]) => ({
            name: key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
            value: typeof value === 'object' ? Object.values(value).reduce((sum, v) => sum + v, 0) : value,
        }))
        .filter(item => item.value > 0);

    if (chartData.length === 0) {
        return (
            <Paper sx={{ p: 2, height, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Typography color="text.secondary">No data available</Typography>
            </Paper>
        );
    }

    const CustomTooltip = ({ active, payload }) => {
        if (active && payload && payload.length) {
            const data = payload[0];
            return (
                <Paper sx={{ p: 1.5, boxShadow: 3, border: `1px solid ${theme.palette.divider}` }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>{data.name}</Typography>
                    <Typography variant="body2" sx={{ color: data.payload.fill }}>
                        Value: <strong>{data.value.toFixed(1)}</strong>
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                        Percentage: {((data.value / chartData.reduce((a, b) => a + b.value, 0)) * 100).toFixed(1)}%
                    </Typography>
                </Paper>
            );
        }
        return null;
    };

    return (
        <Paper sx={{ p: 2, borderRadius: 2, boxShadow: '0 4px 20px rgba(0,0,0,0.05)', height: '100%', display: 'flex', flexDirection: 'column' }}>
            {title && <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', color: adminColors.primary || '#633394' }}>{title}</Typography>}
            <Box sx={{ width: '100%', flexGrow: 1, minHeight: height - 60 }}>
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={chartData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            outerRadius="80%"
                            fill="#8884d8"
                            dataKey="value"
                            animationBegin={0}
                            animationDuration={1500}
                        >
                            {chartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                        <Legend />
                    </PieChart>
                </ResponsiveContainer>
            </Box>
        </Paper>
    );
};

export default InteractivePieChart;
