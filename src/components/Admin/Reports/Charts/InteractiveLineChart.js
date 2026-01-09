import React from 'react';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from 'recharts';
import { Box, Typography, Paper, useTheme } from '@mui/material';

const InteractiveLineChart = ({
    title,
    data,
    height = 400,
    adminColors = {},
}) => {
    const theme = useTheme();

    // Prepare data for Recharts
    const chartData = Object.entries(data)
        .filter(([_, value]) => typeof value === 'number' && !Number.isNaN(value))
        .map(([key, value]) => ({
            name: key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
            value: parseFloat(value.toFixed(2)),
        }));

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
                    <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme.palette.divider} />
                        <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                        <YAxis tick={{ fontSize: 12 }} />
                        <Tooltip />
                        <Legend />
                        <Line
                            type="monotone"
                            dataKey="value"
                            stroke={adminColors.primary || '#633394'}
                            strokeWidth={3}
                            dot={{ r: 6 }}
                            activeDot={{ r: 8 }}
                            animationDuration={1500}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </Box>
        </Paper>
    );
};

export default InteractiveLineChart;
