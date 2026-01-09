import React from 'react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    Cell,
} from 'recharts';
import { Box, Typography, Paper, useTheme } from '@mui/material';

const InteractiveBarChart = ({
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
                name: label,
                fullKey: key,
                average: parseFloat(value.toFixed(2)),
            };

            if (showComparison && targetData && targetData[key] !== undefined) {
                item.individual = parseFloat(targetData[key].toFixed(2));
                item.difference = parseFloat((item.individual - item.average).toFixed(2));
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

    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <Paper sx={{ p: 1.5, boxShadow: 3, border: `1px solid ${theme.palette.divider}` }}>
                    <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>{label}</Typography>
                    {payload.map((entry, index) => (
                        <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                            <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: entry.color }} />
                            <Typography variant="body2">
                                {entry.name}: <strong>{entry.value}</strong>
                            </Typography>
                        </Box>
                    ))}
                    {showComparison && payload.length >= 2 && (
                        <Box sx={{ mt: 1, pt: 1, borderTop: `1px solid ${theme.palette.divider}` }}>
                            <Typography variant="caption" color={payload[0].value >= payload[1].value ? 'success.main' : 'warning.main'} sx={{ fontWeight: 'bold' }}>
                                Difference: {payload[0].value >= payload[1].value ? '+' : ''}{(payload[0].value - payload[1].value).toFixed(2)}
                            </Typography>
                        </Box>
                    )}
                </Paper>
            );
        }
        return null;
    };

    return (
        <Paper sx={{ p: 2, borderRadius: 2, boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
            {title && <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', color: adminColors.primary }}>{title}</Typography>}
            <Box sx={{ width: '100%', height: height }}>
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                        data={chartData}
                        layout="vertical"
                        margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
                        barGap={0}
                    >
                        <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                        <XAxis type="number" domain={[0, maxValue]} hide={false} />
                        <YAxis
                            dataKey="name"
                            type="category"
                            width={150}
                            fontSize={12}
                            tick={{ fill: theme.palette.text.secondary }}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend verticalAlign="top" height={36} />

                        {showComparison ? (
                            <>
                                <Bar
                                    name="Individual Score"
                                    dataKey="individual"
                                    radius={[0, 4, 4, 0]}
                                    barSize={20}
                                >
                                    {chartData.map((entry, index) => (
                                        <Cell
                                            key={`cell-ind-${index}`}
                                            fill={entry.individual >= entry.average ? '#4caf50' : '#ff9800'}
                                        />
                                    ))}
                                </Bar>
                                <Bar
                                    name="Group Average"
                                    dataKey="average"
                                    fill="#1976d2"
                                    radius={[0, 4, 4, 0]}
                                    barSize={20}
                                />
                            </>
                        ) : (
                            <Bar
                                name="Score"
                                dataKey="average"
                                fill={adminColors.primary || '#633394'}
                                radius={[0, 4, 4, 0]}
                                barSize={30}
                            />
                        )}
                    </BarChart>
                </ResponsiveContainer>
            </Box>
        </Paper>
    );
};

export default InteractiveBarChart;
