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

    // Handle both array and object data formats
    let chartData;
    if (Array.isArray(data)) {
        chartData = data;
    } else {
        chartData = Object.entries(data)
            .filter(([_, value]) => typeof value === 'number' && !Number.isNaN(value))
            .map(([key, value]) => ({
                name: key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
                value: parseFloat(value.toFixed(2)),
            }));
    }

    if (!chartData || chartData.length === 0) {
        return (
            <Paper sx={{ p: 2, height, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Typography color="text.secondary">No data available</Typography>
            </Paper>
        );
    }

    // Detect if we have the 3-series trend data
    const hasMultipleSeries = chartData.length > 0 &&
        (chartData[0].completed !== undefined || chartData[0].inProgress !== undefined || chartData[0].pending !== undefined);

    return (
        <Paper sx={{ p: 3, borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.05)', height: '100%' }}>
            {title && <Typography variant="h6" gutterBottom sx={{ fontWeight: 700, color: '#633394' }}>{title}</Typography>}
            <Box sx={{ width: '100%', height: height - 80 }}>
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme.palette.divider} />
                        <XAxis
                            dataKey={hasMultipleSeries ? "month" : "name"}
                            tick={{ fontSize: 12 }}
                        />
                        <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                        <Tooltip />
                        <Legend />
                        {hasMultipleSeries ? (
                            <>
                                <Line
                                    type="monotone"
                                    dataKey="completed"
                                    name="Completed"
                                    stroke={adminColors.primary || "#633394"}
                                    strokeWidth={2}
                                    dot={{ r: 4, fill: adminColors.primary || "#633394" }}
                                    activeDot={{ r: 6, fill: adminColors.primary || "#633394" }}
                                    animationDuration={800}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="inProgress"
                                    name="In Progress"
                                    stroke="#E89B3E"
                                    strokeWidth={2}
                                    dot={{ r: 4, fill: "#E89B3E" }}
                                    activeDot={{ r: 6, fill: "#E89B3E" }}
                                    animationDuration={800}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="pending"
                                    name="Pending"
                                    stroke={adminColors.secondary || "#967CB2"}
                                    strokeWidth={2}
                                    strokeDasharray="6 3"
                                    dot={{ r: 4, fill: adminColors.secondary || "#967CB2" }}
                                    activeDot={{ r: 6, fill: adminColors.secondary || "#967CB2" }}
                                    animationDuration={800}
                                />
                            </>
                        ) : (
                            <Line
                                type="monotone"
                                dataKey="value"
                                stroke="#633394"
                                strokeWidth={2}
                                dot={{ r: 4, fill: '#633394' }}
                                activeDot={{ r: 6, fill: '#633394' }}
                                animationDuration={800}
                            />
                        )}
                    </LineChart>
                </ResponsiveContainer>
            </Box>
        </Paper>
    );
};

export default InteractiveLineChart;
