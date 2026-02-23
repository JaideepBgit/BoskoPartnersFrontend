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

    // Use distinct platform purple shades for better differentiation
    const COLORS = [
        '#633394', // Primary purple - darkest
        '#7b4fa3', // Medium purple
        '#967CB2', // Light purple
        '#b39ddb', // Lighter purple
        '#d1c4e9', // Lightest purple
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
            <Paper sx={{ p: 3, height, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
                <Typography color="text.secondary">No data available</Typography>
            </Paper>
        );
    }

    const CustomTooltip = ({ active, payload }) => {
        if (active && payload && payload.length) {
            const data = payload[0];
            const total = chartData.reduce((a, b) => a + b.value, 0);
            const percentage = ((data.value / total) * 100).toFixed(1);
            
            return (
                <Paper sx={{ p: 1.5, boxShadow: 3, border: `1px solid ${theme.palette.divider}` }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>{data.name}</Typography>
                    <Typography variant="body2" sx={{ color: data.payload.fill }}>
                        Count: <strong>{data.value}</strong>
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                        {percentage}% of total
                    </Typography>
                </Paper>
            );
        }
        return null;
    };

    return (
        <Paper sx={{ p: 3, borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.05)', height: '100%', display: 'flex', flexDirection: 'column' }}>
            {title && <Typography variant="h6" gutterBottom sx={{ fontWeight: 700, color: '#633394' }}>{title}</Typography>}
            <Box sx={{ width: '100%', flexGrow: 1, minHeight: height - 80 }}>
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={chartData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            outerRadius="75%"
                            fill="#8884d8"
                            dataKey="value"
                            animationBegin={0}
                            animationDuration={800}
                        >
                            {chartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                        <Legend 
                            verticalAlign="bottom" 
                            height={36}
                            iconType="circle"
                        />
                    </PieChart>
                </ResponsiveContainer>
            </Box>
        </Paper>
    );
};

export default InteractivePieChart;
