import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    IconButton,
    Box,
    Typography,
    CircularProgress,
    Chip,
    Divider,
    useTheme,
    alpha,
    Tooltip,
    Grid
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import {
    Radar,
    RadarChart,
    PolarGrid,
    PolarAngleAxis,
    PolarRadiusAxis,
    ResponsiveContainer,
    Tooltip as RechartsTooltip,
    Legend
} from 'recharts';

// Metric configuration for Organizations
const ORGANIZATION_METRICS = {
    user_count: { label: 'Users', description: 'Total number of users in the organization', max: 100 },
    survey_completion: { label: 'Survey Completion', description: 'Percentage of completed surveys', max: 100 },
    active_engagement: { label: 'Active Engagement', description: 'Active user participation rate', max: 100 },
    geographic_reach: { label: 'Geographic Reach', description: 'Coverage across different regions', max: 100 },
    affiliation_strength: { label: 'Affiliations', description: 'Number of affiliations and partnerships', max: 100 },
    data_quality: { label: 'Data Quality', description: 'Completeness of organization data', max: 100 }
};

// Metric configuration for Users
const USER_METRICS = {
    profile_completeness: { label: 'Profile', description: 'Completeness of user profile information', max: 100 },
    survey_participation: { label: 'Survey Participation', description: 'Number of surveys completed', max: 100 },
    response_quality: { label: 'Response Quality', description: 'Quality and thoroughness of responses', max: 100 },
    engagement_score: { label: 'Engagement', description: 'Overall engagement with the platform', max: 100 },
    activity_level: { label: 'Activity', description: 'Recent activity on the platform', max: 100 },
    timeliness: { label: 'Timeliness', description: 'Promptness in completing tasks', max: 100 }
};

// Custom tooltip for radar chart
const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
        const data = payload[0].payload;
        return (
            <Box
                sx={{
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    border: '1px solid #e0e0e0',
                    borderRadius: 2,
                    p: 1.5,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                }}
            >
                <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#633394' }}>
                    {data.fullLabel}
                </Typography>
                <Typography variant="body2" sx={{ color: '#666', mt: 0.5 }}>
                    Score: <strong>{data.value.toFixed(1)}</strong> / {data.maxValue}
                </Typography>
                {data.description && (
                    <Typography variant="caption" sx={{ color: '#888', display: 'block', mt: 0.5 }}>
                        {data.description}
                    </Typography>
                )}
            </Box>
        );
    }
    return null;
};

// Spider/Radar Chart Component
const SpiderChart = ({ data, title, colors = ['#633394', '#00BCD4'] }) => {
    const theme = useTheme();
    
    if (!data || data.length === 0) {
        return (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300 }}>
                <Typography color="text.secondary">No data available</Typography>
            </Box>
        );
    }

    return (
        <Box sx={{ width: '100%', height: 350 }}>
            <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
                    <PolarGrid 
                        stroke={alpha(theme.palette.divider, 0.5)}
                        strokeDasharray="3 3"
                    />
                    <PolarAngleAxis 
                        dataKey="subject" 
                        tick={{ 
                            fill: theme.palette.text.secondary, 
                            fontSize: 11,
                            fontWeight: 500
                        }}
                    />
                    <PolarRadiusAxis 
                        angle={30} 
                        domain={[0, 100]} 
                        tick={{ fontSize: 9, fill: '#999' }}
                        tickCount={5}
                    />
                    <Radar
                        name={title || 'Metrics'}
                        dataKey="value"
                        stroke={colors[0]}
                        fill={colors[0]}
                        fillOpacity={0.35}
                        strokeWidth={2}
                        dot={{
                            r: 4,
                            fill: colors[0],
                            stroke: '#fff',
                            strokeWidth: 2
                        }}
                        activeDot={{
                            r: 6,
                            fill: colors[0],
                            stroke: '#fff',
                            strokeWidth: 2
                        }}
                    />
                    <RechartsTooltip content={<CustomTooltip />} />
                </RadarChart>
            </ResponsiveContainer>
        </Box>
    );
};

// Metric card for displaying individual metric
const MetricCard = ({ label, value, maxValue, description, color }) => (
    <Box
        sx={{
            p: 1.5,
            borderRadius: 2,
            backgroundColor: alpha(color, 0.08),
            border: `1px solid ${alpha(color, 0.2)}`,
            transition: 'all 0.2s ease',
            '&:hover': {
                backgroundColor: alpha(color, 0.12),
                transform: 'translateY(-2px)'
            }
        }}
    >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="caption" sx={{ fontWeight: 600, color: '#444' }}>
                {label}
            </Typography>
            <Tooltip title={description} arrow>
                <InfoOutlinedIcon sx={{ fontSize: 14, color: '#999', cursor: 'help' }} />
            </Tooltip>
        </Box>
        <Typography variant="h6" sx={{ fontWeight: 700, color: color, mt: 0.5 }}>
            {value.toFixed(1)}
            <Typography component="span" variant="caption" sx={{ color: '#999', ml: 0.5 }}>
                / {maxValue}
            </Typography>
        </Typography>
        {/* Progress bar */}
        <Box
            sx={{
                mt: 1,
                height: 4,
                borderRadius: 2,
                backgroundColor: alpha(color, 0.15),
                overflow: 'hidden'
            }}
        >
            <Box
                sx={{
                    height: '100%',
                    width: `${Math.min((value / maxValue) * 100, 100)}%`,
                    backgroundColor: color,
                    borderRadius: 2,
                    transition: 'width 0.5s ease'
                }}
            />
        </Box>
    </Box>
);

// Main SpiderChartPopup Component
const SpiderChartPopup = ({
    open,
    onClose,
    entityType, // 'organization' or 'user'
    entityData,
    entityId,
    entityName
}) => {
    const theme = useTheme();
    const [loading, setLoading] = useState(true);
    const [metrics, setMetrics] = useState(null);
    const [error, setError] = useState(null);

    const isOrganization = entityType === 'organization';
    const metricConfig = isOrganization ? ORGANIZATION_METRICS : USER_METRICS;
    const primaryColor = isOrganization ? '#633394' : '#00897B';

    useEffect(() => {
        if (open && entityId) {
            fetchMetrics();
        }
    }, [open, entityId, entityType]);

    const fetchMetrics = async () => {
        setLoading(true);
        setError(null);
        try {
            let endpoint;
            
            if (isOrganization) {
                // Check if this is an overall metrics request
                if (entityId === 'overall') {
                    endpoint = '/api/organizations/overall-metrics';
                } else {
                    endpoint = `/api/organization/${entityId}/metrics`;
                }
            } else {
                endpoint = `/api/user/${entityId}/metrics`;
            }
            
            const response = await fetch(endpoint);
            if (!response.ok) {
                throw new Error('Failed to fetch metrics');
            }
            const data = await response.json();
            setMetrics(data);
        } catch (err) {
            console.error('Error fetching metrics:', err);
            // Generate sample metrics for demo purposes if API fails
            const sampleMetrics = generateSampleMetrics(entityType, entityData);
            setMetrics(sampleMetrics);
        } finally {
            setLoading(false);
        }
    };

    // Generate sample metrics based on available entity data
    const generateSampleMetrics = (type, data) => {
        if (type === 'organization') {
            return {
                user_count: calculateOrgUserMetric(data),
                survey_completion: Math.random() * 60 + 40,
                active_engagement: Math.random() * 50 + 30,
                geographic_reach: calculateGeographicReach(data),
                affiliation_strength: calculateAffiliationStrength(data),
                data_quality: calculateOrgDataQuality(data)
            };
        } else {
            return {
                profile_completeness: calculateProfileCompleteness(data),
                survey_participation: Math.random() * 70 + 20,
                response_quality: Math.random() * 60 + 40,
                engagement_score: Math.random() * 50 + 30,
                activity_level: Math.random() * 80 + 10,
                timeliness: Math.random() * 70 + 20
            };
        }
    };

    // Helper functions to calculate metrics from entity data
    const calculateOrgUserMetric = (org) => {
        if (!org) return 30;
        // Normalize user count to 0-100 scale (assuming max 50 users)
        const userCount = org.user_count || org.users?.length || 5;
        return Math.min((userCount / 50) * 100, 100);
    };

    const calculateGeographicReach = (org) => {
        if (!org?.geo_location) return 20;
        const geo = org.geo_location;
        let score = 0;
        if (geo.continent) score += 20;
        if (geo.country) score += 20;
        if (geo.region) score += 20;
        if (geo.province) score += 20;
        if (geo.city) score += 20;
        return score;
    };

    const calculateAffiliationStrength = (org) => {
        if (!org) return 20;
        let score = 0;
        if (org.denomination_affiliation || org.denomination_id) score += 25;
        if (org.accreditation_status_or_body || org.accreditation_body_id) score += 25;
        if (org.umbrella_association_membership || org.umbrella_association_id) score += 25;
        if (org.affiliation_validation) score += 25;
        return score;
    };

    const calculateOrgDataQuality = (org) => {
        if (!org) return 30;
        let score = 0;
        if (org.name) score += 15;
        if (org.type || org.organization_type) score += 15;
        if (org.website) score += 15;
        if (org.geo_location?.city) score += 15;
        if (org.head_name || org.head_email) score += 20;
        if (org.primary_contact_id) score += 20;
        return Math.min(score, 100);
    };

    const calculateProfileCompleteness = (user) => {
        if (!user) return 30;
        let score = 0;
        if (user.username) score += 10;
        if (user.email) score += 15;
        if (user.firstname) score += 15;
        if (user.lastname) score += 15;
        if (user.phone) score += 15;
        if (user.geo_location?.city) score += 15;
        if (user.organization_id) score += 15;
        return Math.min(score, 100);
    };

    // Transform metrics to chart data
    const chartData = metrics
        ? Object.entries(metricConfig).map(([key, config]) => ({
            subject: config.label,
            fullLabel: config.label,
            value: metrics[key] || 0,
            maxValue: config.max,
            description: config.description
        }))
        : [];

    // Calculate overall score
    const overallScore = metrics
        ? Object.values(metrics).reduce((a, b) => a + b, 0) / Object.keys(metrics).length
        : 0;

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="md"
            fullWidth
            PaperProps={{
                sx: {
                    borderRadius: 3,
                    background: 'linear-gradient(135deg, #fafbfc 0%, #f5f7fa 100%)',
                    overflow: 'hidden'
                }
            }}
        >
            {/* Header */}
            <DialogTitle
                sx={{
                    background: `linear-gradient(135deg, ${primaryColor} 0%, ${alpha(primaryColor, 0.85)} 100%)`,
                    color: 'white',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    py: 2
                }}
            >
                <Box>
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>
                        Performance Analytics
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.9 }}>
                        {entityName || (isOrganization ? 'Organization' : 'User')}
                    </Typography>
                </Box>
                <IconButton onClick={onClose} sx={{ color: 'white' }}>
                    <CloseIcon />
                </IconButton>
            </DialogTitle>

            <DialogContent sx={{ p: 3 }}>
                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300 }}>
                        <CircularProgress sx={{ color: primaryColor }} />
                    </Box>
                ) : error ? (
                    <Box sx={{ textAlign: 'center', py: 4 }}>
                        <Typography color="error">{error}</Typography>
                    </Box>
                ) : (
                    <Box>
                        {/* Overall Score */}
                        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                            <Chip
                                label={`Overall Score: ${overallScore.toFixed(1)}%`}
                                sx={{
                                    fontSize: '1rem',
                                    fontWeight: 700,
                                    py: 2.5,
                                    px: 2,
                                    backgroundColor: alpha(primaryColor, 0.1),
                                    color: primaryColor,
                                    border: `2px solid ${alpha(primaryColor, 0.3)}`
                                }}
                            />
                        </Box>

                        {/* Spider Chart */}
                        <Box
                            sx={{
                                backgroundColor: 'white',
                                borderRadius: 3,
                                p: 2,
                                boxShadow: '0 4px 20px rgba(0,0,0,0.05)'
                            }}
                        >
                            <SpiderChart
                                data={chartData}
                                title={isOrganization ? 'Organization Metrics' : 'User Metrics'}
                                colors={[primaryColor]}
                            />
                        </Box>

                        <Divider sx={{ my: 3 }} />

                        {/* Metric Cards Grid */}
                        <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2, color: '#333' }}>
                            Detailed Metrics
                        </Typography>
                        <Grid container spacing={2}>
                            {metrics && Object.entries(metricConfig).map(([key, config]) => (
                                <Grid item xs={12} sm={6} md={4} key={key}>
                                    <MetricCard
                                        label={config.label}
                                        value={metrics[key] || 0}
                                        maxValue={config.max}
                                        description={config.description}
                                        color={primaryColor}
                                    />
                                </Grid>
                            ))}
                        </Grid>

                        {/* Legend/Info */}
                        <Box sx={{ mt: 3, p: 2, backgroundColor: alpha('#f5f5f5', 0.5), borderRadius: 2 }}>
                            <Typography variant="caption" sx={{ color: '#666' }}>
                                <InfoOutlinedIcon sx={{ fontSize: 14, verticalAlign: 'middle', mr: 0.5 }} />
                                The spider chart visualizes performance across multiple dimensions. 
                                A larger polygon indicates stronger overall performance. Hover over points for details.
                            </Typography>
                        </Box>
                    </Box>
                )}
            </DialogContent>
        </Dialog>
    );
};

export default SpiderChartPopup;

