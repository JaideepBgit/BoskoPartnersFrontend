import React, { useState, useEffect } from 'react';
import {
    Container,
    Typography,
    Box,
    Grid,
    Card,
    CardContent,
    CardHeader,
    Button,
    Paper,
    List,
    ListItem,
    ListItemText,
    ListItemIcon,
    Divider,
    Alert,
    CircularProgress
} from '@mui/material';
import {
    Assessment as AssessmentIcon,
    BarChart as BarChartIcon,
    PieChart as PieChartIcon,
    TrendingUp as TrendingUpIcon,
    Map as MapIcon,
    TableChart as TableChartIcon,
    Build as BuildIcon,
    SavedSearch as SavedSearchIcon,
    GetApp as GetAppIcon,
    Schedule as ScheduleIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../shared/Navbar/Navbar';

// Admin colors from AdminDashboard
const adminColors = {
    primary: '#633394',
    secondary: '#967CB2',
    background: '#f5f5f5',
    text: '#212121',
    headerBg: '#ede7f6',
    borderColor: '#e0e0e0',
    highlightBg: '#f3e5f5'
};

function ReportsPage({ onLogout }) {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [analytics, setAnalytics] = useState(null);
    const [templates, setTemplates] = useState([]);

    const tabs = [
        { label: 'Home', path: '/home'},
        { label: 'Dashboard', path: '/dashboard' },
        { label: 'Assessment Overview', path: '/root-dashboard' },
        { label: '360 Degree Assessment', path: '/edit-assessments' },
        { label: 'Users Management', path: '/users' },
        { label: 'Settings', path: '/settings' },
        { label: 'Reports', path: '/reports' },
        { label: 'Report Builder', path: '/reportbuilder' },
        { label: 'Visual Builder', path: '/visual-builder' },
    ];

    useEffect(() => {
        loadAnalyticsOverview();
        loadRecentTemplates();
    }, []);

    const loadAnalyticsOverview = async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/reports/analytics/overview');
            if (response.ok) {
                const data = await response.json();
                setAnalytics(data);
            }
        } catch (error) {
            console.error('Error loading analytics overview:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadRecentTemplates = async () => {
        try {
            const userId = localStorage.getItem('userId');
            const response = await fetch(`/api/reports/templates?user_id=${userId}`);
            if (response.ok) {
                const data = await response.json();
                setTemplates(data.templates.slice(0, 5)); // Show only recent 5
            }
        } catch (error) {
            console.error('Error loading templates:', error);
        }
    };

    const quickReports = [
        {
            title: 'Response Count by Organization',
            description: 'View total survey responses grouped by organization',
            icon: <BarChartIcon />,
            action: () => navigateToReportBuilder('response_count_org')
        },
        {
            title: 'Geographic Distribution',
            description: 'See response distribution across countries and regions',
            icon: <MapIcon />,
            action: () => navigateToReportBuilder('geographic_distribution')
        },
        {
            title: 'Completion Rate Analysis',
            description: 'Analyze survey completion rates over time',
            icon: <TrendingUpIcon />,
            action: () => navigateToReportBuilder('completion_rates')
        },
        {
            title: 'Institution Profile Summary',
            description: 'Comprehensive view of institutional data',
            icon: <TableChartIcon />,
            action: () => navigateToReportBuilder('institution_profile')
        },
        {
            title: 'Visual Report Builder',
            description: 'Drag-and-drop interface for creating custom visualizations',
            icon: <BuildIcon />,
            action: () => navigate('/visual-builder')
        }
    ];

    const navigateToReportBuilder = (templateType) => {
        // Navigate to report builder with pre-configured template
        navigate('/reportbuilder', { state: { templateType } });
    };

    const reportingFeatures = [
        {
            title: 'Interactive Charts',
            description: 'Bar charts, line graphs, pie charts, and scatter plots',
            icon: <PieChartIcon />
        },
        {
            title: 'Data Tables',
            description: 'Sortable, filterable data tables with export options',
            icon: <TableChartIcon />
        },
        {
            title: 'Geographic Analysis',
            description: 'Country, region, and continent-based analysis',
            icon: <MapIcon />
        },
        {
            title: 'Missing Data Handling',
            description: 'Graceful handling of incomplete responses',
            icon: <AssessmentIcon />
        },
        {
            title: 'Template Management',
            description: 'Save and reuse report configurations',
            icon: <SavedSearchIcon />
        },
        {
            title: 'Export Options',
            description: 'Download reports in CSV, JSON, and other formats',
            icon: <GetAppIcon />
        }
    ];

    return (
        <Box sx={{ minHeight: '100vh', backgroundColor: adminColors.background }}>
            <Navbar tabs={tabs} onLogout={onLogout} />
            
            <Container maxWidth="xl" sx={{ mt: 4, pb: 4 }}>
                <Typography variant="h4" gutterBottom sx={{ color: adminColors.primary, fontWeight: 'bold' }}>
                    Reports & Analytics
                </Typography>
                
                <Typography variant="body1" paragraph sx={{ color: adminColors.text, mb: 4 }}>
                    Generate comprehensive reports from survey data with interactive visualizations, 
                    export capabilities, and template management.
                </Typography>

                {/* Analytics Overview */}
                {loading ? (
                    <Box display="flex" justifyContent="center" my={4}>
                        <CircularProgress />
                    </Box>
                ) : analytics ? (
                    <Grid container spacing={3} sx={{ mb: 4 }}>
                        <Grid item xs={12} md={3}>
                            <Paper sx={{ p: 2, textAlign: 'center', backgroundColor: adminColors.primary, color: 'white' }}>
                                <Typography variant="h3" fontWeight="bold">
                                    {analytics.overview.total_responses}
                                </Typography>
                                <Typography variant="body2">
                                    Total Responses
                                </Typography>
                            </Paper>
                        </Grid>
                        <Grid item xs={12} md={3}>
                            <Paper sx={{ p: 2, textAlign: 'center', backgroundColor: adminColors.secondary, color: 'white' }}>
                                <Typography variant="h3" fontWeight="bold">
                                    {analytics.overview.completion_rate}%
                                </Typography>
                                <Typography variant="body2">
                                    Completion Rate
                                </Typography>
                            </Paper>
                        </Grid>
                        <Grid item xs={12} md={3}>
                            <Paper sx={{ p: 2, textAlign: 'center', backgroundColor: '#4CAF50', color: 'white' }}>
                                <Typography variant="h3" fontWeight="bold">
                                    {analytics.overview.total_organizations}
                                </Typography>
                                <Typography variant="body2">
                                    Organizations
                                </Typography>
                            </Paper>
                        </Grid>
                        <Grid item xs={12} md={3}>
                            <Paper sx={{ p: 2, textAlign: 'center', backgroundColor: '#FF9800', color: 'white' }}>
                                <Typography variant="h3" fontWeight="bold">
                                    {analytics.overview.total_users}
                                </Typography>
                                <Typography variant="body2">
                                    Total Users
                                </Typography>
                            </Paper>
                        </Grid>
                    </Grid>
                ) : null}

                <Grid container spacing={3}>
                    {/* Quick Reports */}
                    <Grid item xs={12} md={6}>
                        <Card>
                            <CardHeader 
                                title="Quick Reports" 
                                titleTypographyProps={{ color: adminColors.primary, fontWeight: 'bold' }}
                            />
                            <CardContent>
                                <List>
                                    {quickReports.map((report, index) => (
                                        <React.Fragment key={index}>
                                            <ListItem 
                                                button 
                                                onClick={report.action}
                                                sx={{ 
                                                    '&:hover': { backgroundColor: adminColors.highlightBg },
                                                    borderRadius: 1,
                                                    mb: 1
                                                }}
                                            >
                                                <ListItemIcon sx={{ color: adminColors.primary }}>
                                                    {report.icon}
                                                </ListItemIcon>
                                                <ListItemText
                                                    primary={report.title}
                                                    secondary={report.description}
                                                    primaryTypographyProps={{ fontWeight: 'medium' }}
                                                />
                                            </ListItem>
                                            {index < quickReports.length - 1 && <Divider />}
                                        </React.Fragment>
                                    ))}
                                </List>
                                
                                <Box sx={{ mt: 3, textAlign: 'center' }}>
                                    <Button
                                        variant="contained"
                                        startIcon={<BuildIcon />}
                                        onClick={() => navigate('/reportbuilder')}
                                        sx={{ 
                                            backgroundColor: adminColors.primary,
                                            '&:hover': { backgroundColor: adminColors.secondary }
                                        }}
                                    >
                                        Open Report Builder
                                    </Button>
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>

                    {/* Recent Templates */}
                    <Grid item xs={12} md={6}>
                        <Card>
                            <CardHeader 
                                title="Recent Templates" 
                                titleTypographyProps={{ color: adminColors.primary, fontWeight: 'bold' }}
                            />
                            <CardContent>
                                {templates.length > 0 ? (
                                    <List>
                                        {templates.map((template, index) => (
                                            <React.Fragment key={template.id}>
                                                <ListItem 
                                                    button
                                                    onClick={() => navigate('/reportbuilder', { state: { loadTemplate: template } })}
                                                    sx={{ 
                                                        '&:hover': { backgroundColor: adminColors.highlightBg },
                                                        borderRadius: 1,
                                                        mb: 1
                                                    }}
                                                >
                                                    <ListItemIcon sx={{ color: adminColors.secondary }}>
                                                        <SavedSearchIcon />
                                                    </ListItemIcon>
                                                    <ListItemText
                                                        primary={template.name}
                                                        secondary={`Created: ${new Date(template.created_at).toLocaleDateString()}`}
                                                        primaryTypographyProps={{ fontWeight: 'medium' }}
                                                    />
                                                </ListItem>
                                                {index < templates.length - 1 && <Divider />}
                                            </React.Fragment>
                                        ))}
                                    </List>
                                ) : (
                                    <Alert severity="info">
                                        No saved templates yet. Create your first template in the Report Builder.
                                    </Alert>
                                )}
                                
                                <Box sx={{ mt: 2, textAlign: 'center' }}>
                                    <Button
                                        variant="outlined"
                                        size="small"
                                        onClick={() => navigate('/reportbuilder')}
                                        sx={{ 
                                            borderColor: adminColors.primary,
                                            color: adminColors.primary,
                                            '&:hover': { 
                                                borderColor: adminColors.secondary,
                                                backgroundColor: adminColors.highlightBg
                                            }
                                        }}
                                    >
                                        Manage All Templates
                                    </Button>
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>

                    {/* Reporting Features */}
                    <Grid item xs={12}>
                        <Card>
                            <CardHeader 
                                title="Reporting Features" 
                                titleTypographyProps={{ color: adminColors.primary, fontWeight: 'bold' }}
                            />
                            <CardContent>
                                <Grid container spacing={3}>
                                    {reportingFeatures.map((feature, index) => (
                                        <Grid item xs={12} sm={6} md={4} key={index}>
                                            <Box sx={{ display: 'flex', alignItems: 'flex-start', p: 2 }}>
                                                <Box sx={{ color: adminColors.primary, mr: 2, mt: 0.5 }}>
                                                    {feature.icon}
                                                </Box>
                                                <Box>
                                                    <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                                                        {feature.title}
                                                    </Typography>
                                                    <Typography variant="body2" color="textSecondary">
                                                        {feature.description}
                                                    </Typography>
                                                </Box>
                                            </Box>
                                        </Grid>
                                    ))}
                                </Grid>
                            </CardContent>
                        </Card>
                    </Grid>

                    {/* Getting Started */}
                    <Grid item xs={12}>
                        <Card>
                            <CardHeader 
                                title="Getting Started" 
                                titleTypographyProps={{ color: adminColors.primary, fontWeight: 'bold' }}
                            />
                            <CardContent>
                                <Typography variant="body2" paragraph>
                                    <strong>1. Choose Data Scope:</strong> Select surveys, date ranges, and geographic filters to focus your analysis.
                                </Typography>
                                <Typography variant="body2" paragraph>
                                    <strong>2. Select Metrics:</strong> Pick what you want to measure - response counts, completion rates, averages, etc.
                                </Typography>
                                <Typography variant="body2" paragraph>
                                    <strong>3. Define Dimensions:</strong> Choose how to group your data - by organization, geography, sections, etc.
                                </Typography>
                                <Typography variant="body2" paragraph>
                                    <strong>4. Configure Visualization:</strong> Select chart types, colors, and styling options.
                                </Typography>
                                <Typography variant="body2" paragraph>
                                    <strong>5. Generate & Export:</strong> Create your report and export in multiple formats.
                                </Typography>
                                
                                <Box sx={{ mt: 3 }}>
                                    <Button
                                        variant="contained"
                                        size="large"
                                        startIcon={<BuildIcon />}
                                        onClick={() => navigate('/reportbuilder')}
                                        sx={{ 
                                            backgroundColor: adminColors.primary,
                                            '&:hover': { backgroundColor: adminColors.secondary },
                                            mr: 2
                                        }}
                                    >
                                        Start Building Reports
                                    </Button>
                                    <Button
                                        variant="outlined"
                                        size="large"
                                        startIcon={<ScheduleIcon />}
                                        sx={{ 
                                            borderColor: adminColors.primary,
                                            color: adminColors.primary,
                                            '&:hover': { 
                                                borderColor: adminColors.secondary,
                                                backgroundColor: adminColors.highlightBg
                                            }
                                        }}
                                    >
                                        View Documentation
                                    </Button>
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>
            </Container>
        </Box>
    );
}

export default ReportsPage; 