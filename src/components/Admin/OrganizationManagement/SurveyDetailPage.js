import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Container, Typography, Box, Paper, Button, Grid, Card, CardContent,
    CircularProgress, Alert, Chip, Avatar, Tabs, Tab, Divider,
    IconButton, Breadcrumbs, Link
} from '@mui/material';
import InternalHeader from '../../shared/Headers/InternalHeader';
import Navbar from '../../shared/Navbar/Navbar';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AssignmentIcon from '@mui/icons-material/Assignment';
import BusinessIcon from '@mui/icons-material/Business';
import QuizIcon from '@mui/icons-material/Quiz';
import ListAltIcon from '@mui/icons-material/ListAlt';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import VisibilityIcon from '@mui/icons-material/Visibility';
import EditIcon from '@mui/icons-material/Edit';
import TemplatesTab from '../Inventory/TemplatesTab';
import QuestionsTab from '../Inventory/QuestionsTab';
import { fetchOrganizations, fetchTemplatesByOrganization } from '../../../services/UserManagement/UserManagementService';
import InventoryService from '../../../services/Admin/Inventory/InventoryService';

// Color theme - matches OrganizationDetailPage
const colors = {
    primary: '#633394',
    secondary: '#967CB2',
    background: '#f5f5f5',
    cardBg: '#ffffff',
    accentBg: '#f3e5f5',
    borderColor: '#e0e0e0',
    textPrimary: '#212121',
    textSecondary: '#757575',
};

function SurveyDetailPage() {
    const { orgId, surveyId } = useParams();
    const navigate = useNavigate();

    const [organization, setOrganization] = useState(null);
    const [survey, setSurvey] = useState(null);
    const [surveys, setSurveys] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState(0);

    // Derive unique dictionary of versions from surveys
    const uniqueVersions = React.useMemo(() => {
        const versionsMap = new Map();
        surveys.forEach(s => {
            if (s.version_id && !versionsMap.has(s.version_id)) {
                versionsMap.set(s.version_id, {
                    id: s.version_id,
                    name: s.version_name || 'Generic Version'
                });
            }
        });
        return Array.from(versionsMap.values());
    }, [surveys]);

    // Compute survey stats
    const surveyStats = React.useMemo(() => {
        if (!survey) return { sections: 0, questions: 0 };
        const questions = survey.questions || [];
        const sections = survey.sections || {};
        return {
            sections: typeof sections === 'object' ? Object.keys(sections).length : 0,
            questions: questions.length
        };
    }, [survey]);

    // Load data
    useEffect(() => {
        loadData();
    }, [orgId, surveyId]);

    const loadData = async () => {
        try {
            setLoading(true);
            setError(null);

            // Fetch organization data, all org surveys, and the specific template detail
            const [orgData, surveysData] = await Promise.all([
                fetchOrganizations(),
                fetchTemplatesByOrganization(orgId)
            ]);

            // Find the specific organization
            const org = orgData.find(o => o.id === parseInt(orgId));
            if (!org) {
                setError('Organization not found');
                setLoading(false);
                return;
            }
            setOrganization(org);
            setSurveys(surveysData);

            // Fetch the full template details (includes questions and sections)
            try {
                const templateDetail = await InventoryService.getTemplate(parseInt(surveyId));
                setSurvey(templateDetail);
            } catch (templateErr) {
                // If InventoryService doesn't have getTemplate, fall back to survey from the list
                const surveyFromList = surveysData.find(s => s.id === parseInt(surveyId));
                if (surveyFromList) {
                    setSurvey(surveyFromList);
                } else {
                    setError('Survey not found');
                }
            }
        } catch (err) {
            console.error('Error loading survey detail data:', err);
            setError('Failed to load survey data');
        } finally {
            setLoading(false);
        }
    };

    const handleBack = () => {
        navigate(`/organization-management/${orgId}`);
    };

    const handleTabChange = (event, newValue) => {
        setActiveTab(newValue);
    };

    if (loading) {
        return (
            <>
                <Navbar />
                <Container maxWidth="xl" sx={{ py: 4, textAlign: 'center' }}>
                    <CircularProgress sx={{ color: colors.primary }} />
                    <Typography sx={{ mt: 2 }}>Loading survey details...</Typography>
                </Container>
            </>
        );
    }

    if (error) {
        return (
            <>
                <Navbar />
                <Container maxWidth="xl" sx={{ py: 4 }}>
                    <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
                    <Button
                        variant="outlined"
                        startIcon={<ArrowBackIcon />}
                        onClick={handleBack}
                    >
                        Back to Organization
                    </Button>
                </Container>
            </>
        );
    }

    return (
        <>
            <InternalHeader
                title={survey?.survey_code || 'Survey Detail'}
                leftActions={
                    <Button
                        variant="outlined"
                        startIcon={<ArrowBackIcon />}
                        onClick={handleBack}
                    >
                        {organization?.name || 'Organization'}
                    </Button>
                }
            />
            <Container maxWidth="xl" sx={{ py: 4, backgroundColor: colors.background, minHeight: '100vh' }}>

                {/* Breadcrumb Navigation */}
                <Breadcrumbs
                    separator={<NavigateNextIcon fontSize="small" />}
                    sx={{ mb: 3 }}
                >
                    <Link
                        component="button"
                        variant="body2"
                        underline="hover"
                        color="text.secondary"
                        onClick={() => navigate('/organization-management')}
                        sx={{ cursor: 'pointer' }}
                    >
                        Organizations
                    </Link>
                    <Link
                        component="button"
                        variant="body2"
                        underline="hover"
                        color="text.secondary"
                        onClick={handleBack}
                        sx={{ cursor: 'pointer' }}
                    >
                        {organization?.name || 'Organization'}
                    </Link>
                    <Typography variant="body2" color="text.primary" fontWeight="600">
                        {survey?.survey_code || 'Survey'}
                    </Typography>
                </Breadcrumbs>

                {/* Survey Info Cards */}
                <Grid container spacing={3} sx={{ mb: 3 }}>
                    {/* Survey Overview Card */}
                    <Grid item xs={12} md={4}>
                        <Card sx={{
                            borderRadius: 3,
                            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                            height: '100%'
                        }}>
                            <CardContent>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                                    <Avatar
                                        sx={{
                                            bgcolor: colors.accentBg,
                                            color: colors.primary,
                                            width: 48,
                                            height: 48
                                        }}
                                    >
                                        <AssignmentIcon />
                                    </Avatar>
                                    <Box>
                                        <Typography variant="h6" fontWeight="bold" color="text.primary">
                                            {survey?.survey_code}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            Survey Template
                                        </Typography>
                                    </Box>
                                </Box>
                                <Divider sx={{ my: 1.5 }} />
                                {survey?.description && (
                                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                                        {survey.description}
                                    </Typography>
                                )}
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                    <BusinessIcon sx={{ fontSize: '1rem', color: colors.textSecondary }} />
                                    <Typography variant="body2" color="text.secondary">
                                        {organization?.name}
                                    </Typography>
                                </Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <CalendarTodayIcon sx={{ fontSize: '1rem', color: colors.textSecondary }} />
                                    <Typography variant="body2" color="text.secondary">
                                        Created {survey?.created_at ? new Date(survey.created_at).toLocaleDateString() : 'N/A'}
                                    </Typography>
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>

                    {/* Stats Card */}
                    <Grid item xs={12} md={8}>
                        <Card sx={{
                            borderRadius: 3,
                            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                            height: '100%'
                        }}>
                            <CardContent>
                                <Typography variant="subtitle1" fontWeight="bold" color="text.primary" sx={{ mb: 2 }}>
                                    Survey Details
                                </Typography>
                                <Grid container spacing={2}>
                                    <Grid item xs={12} sm={4}>
                                        <Box sx={{
                                            textAlign: 'center',
                                            p: 2,
                                            borderRadius: 2,
                                            backgroundColor: colors.accentBg
                                        }}>
                                            <QuizIcon sx={{ fontSize: '2rem', color: colors.primary, mb: 0.5 }} />
                                            <Typography variant="h4" fontWeight="bold" color={colors.primary}>
                                                {surveyStats.questions}
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                Questions
                                            </Typography>
                                        </Box>
                                    </Grid>
                                    <Grid item xs={12} sm={4}>
                                        <Box sx={{
                                            textAlign: 'center',
                                            p: 2,
                                            borderRadius: 2,
                                            backgroundColor: colors.accentBg
                                        }}>
                                            <ListAltIcon sx={{ fontSize: '2rem', color: colors.primary, mb: 0.5 }} />
                                            <Typography variant="h4" fontWeight="bold" color={colors.primary}>
                                                {surveyStats.sections}
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                Sections
                                            </Typography>
                                        </Box>
                                    </Grid>
                                    <Grid item xs={12} sm={4}>
                                        <Box sx={{
                                            textAlign: 'center',
                                            p: 2,
                                            borderRadius: 2,
                                            backgroundColor: colors.accentBg
                                        }}>
                                            <AssignmentIcon sx={{ fontSize: '2rem', color: colors.primary, mb: 0.5 }} />
                                            <Typography variant="h4" fontWeight="bold" color={colors.primary}>
                                                <Chip
                                                    label={survey?.version_name || 'Template'}
                                                    size="small"
                                                    sx={{
                                                        backgroundColor: 'white',
                                                        color: colors.primary,
                                                        fontWeight: 600,
                                                        fontSize: '0.85rem'
                                                    }}
                                                />
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                Organization Group
                                            </Typography>
                                        </Box>
                                    </Grid>
                                </Grid>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>

                {/* Tabs: Preview & Questions */}
                <Paper sx={{
                    borderRadius: 3,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                    overflow: 'hidden'
                }}>
                    <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                        <Tabs
                            value={activeTab}
                            onChange={handleTabChange}
                            sx={{
                                '& .MuiTab-root': { textTransform: 'none', fontWeight: 600 },
                                '& .Mui-selected': { color: colors.primary },
                                '& .MuiTabs-indicator': { backgroundColor: colors.primary }
                            }}
                        >
                            <Tab
                                label="Preview"
                                icon={<VisibilityIcon sx={{ fontSize: '1.1rem' }} />}
                                iconPosition="start"
                            />
                            <Tab
                                label="Questions"
                                icon={<EditIcon sx={{ fontSize: '1.1rem' }} />}
                                iconPosition="start"
                            />
                        </Tabs>
                    </Box>

                    <Box sx={{ minHeight: 400 }}>
                        {activeTab === 0 && (
                            <Box sx={{ backgroundColor: 'white', borderRadius: 2, overflow: 'hidden' }}>
                                <TemplatesTab
                                    templates={surveys}
                                    templateVersions={uniqueVersions}
                                    previewMode={true}
                                    initialTemplate={survey}
                                    onClose={() => setActiveTab(0)}
                                    hideSidebar={false}
                                />
                            </Box>
                        )}

                        {activeTab === 1 && (
                            <Box sx={{ backgroundColor: 'white', borderRadius: 2, overflow: 'hidden' }}>
                                <QuestionsTab
                                    templateVersions={uniqueVersions}
                                    templates={surveys}
                                    currentVersion={{
                                        id: survey?.version_id,
                                        name: survey?.version_name || 'Generic Version'
                                    }}
                                    onRefreshData={loadData}
                                    onClose={() => setActiveTab(0)}
                                    onPreview={() => setActiveTab(0)}
                                    hideSidebar={false}
                                />
                            </Box>
                        )}
                    </Box>
                </Paper>
            </Container>
        </>
    );
}

export default SurveyDetailPage;
