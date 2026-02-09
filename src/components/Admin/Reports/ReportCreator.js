import React, { useState, useEffect } from 'react';
import {
    Box,
    Card,
    CardContent,
    Typography,
    Button,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Stepper,
    Step,
    StepLabel,
    TextField,
    Chip,
    Grid,
    Paper,
    IconButton,
    Divider,
    Alert,
    CircularProgress,
    Autocomplete,
    Checkbox,
    FormControlLabel,
    Tooltip,
    List,
    ListItem,
    ListItemText,
    ListItemIcon,
    ListItemSecondaryAction,
    Switch
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import DescriptionIcon from '@mui/icons-material/Description';
import BusinessIcon from '@mui/icons-material/Business';
import PersonIcon from '@mui/icons-material/Person';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import ShareIcon from '@mui/icons-material/Share';
import SaveIcon from '@mui/icons-material/Save';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AssessmentIcon from '@mui/icons-material/Assessment';
import EmailIcon from '@mui/icons-material/Email';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';

/**
 * Report Creator Component
 * Allows creating comparative reports based on survey templates
 * Reports can be stored by contact and organization
 */
const ReportCreator = ({
    surveyData = {},
    templates = [],
    organizations = [],
    contacts = [],
    onSaveReport,
    onExportReport,
    onShareReport,
    onClose
}) => {
    const [activeStep, setActiveStep] = useState(0);
    const [reportConfig, setReportConfig] = useState({
        name: '',
        description: '',
        reportType: 'comparative', // 'comparative', 'individual', 'organization', 'contact'
        selectedTemplate: null,
        selectedOrganizations: [],
        selectedContacts: [],
        selectedSurveys: [],
        filters: {
            dateRange: { start: null, end: null },
            surveyType: '',
            country: '',
            status: 'completed'
        },
        compareBy: 'organization', // 'organization', 'contact', 'region', 'time'
        metrics: [],
        includeCharts: true,
        includeRawData: false,
        includeAnalysis: true,
        exportFormat: 'pdf'
    });
    const [availableSurveys, setAvailableSurveys] = useState([]);
    const [generatedReports, setGeneratedReports] = useState([]);
    const [isGenerating, setIsGenerating] = useState(false);
    const [savedReports, setSavedReports] = useState([]);

    const steps = [
        'Report Type',
        'Select Template',
        'Choose Entities',
        'Configure Metrics',
        'Review & Generate'
    ];

    const reportTypes = [
        {
            value: 'comparative',
            label: 'Comparative Report',
            description: 'Compare multiple surveys side by side',
            icon: <CompareArrowsIcon />
        },
        {
            value: 'organization',
            label: 'Organization Report',
            description: 'Generate reports for specific organizations',
            icon: <BusinessIcon />
        },
        {
            value: 'contact',
            label: 'Contact Report',
            description: 'Generate reports associated with contacts',
            icon: <PersonIcon />
        },
        {
            value: 'individual',
            label: 'Individual Survey Report',
            description: 'Detailed analysis of single surveys',
            icon: <DescriptionIcon />
        }
    ];

    const colors = {
        primary: '#633394',
        primaryLight: '#8e5bbc',
        primaryDark: '#4a2570',
        background: '#f8f4fc',
        success: '#4caf50',
        border: '#e8dff5'
    };

    // Filter surveys based on selected template
    useEffect(() => {
        if (reportConfig.selectedTemplate) {
            const filteredSurveys = Object.values(surveyData)
                .flat()
                .filter(survey => survey.template_id === reportConfig.selectedTemplate.id);
            setAvailableSurveys(filteredSurveys);
        } else {
            setAvailableSurveys(Object.values(surveyData).flat());
        }
    }, [reportConfig.selectedTemplate, surveyData]);

    // Load saved reports from localStorage
    useEffect(() => {
        try {
            const saved = localStorage.getItem('savedReports');
            if (saved) {
                setSavedReports(JSON.parse(saved));
            }
        } catch (e) {
            console.error('Error loading saved reports:', e);
        }
    }, []);

    const handleNext = () => {
        if (activeStep === steps.length - 1) {
            handleGenerateReports();
        } else {
            setActiveStep(prev => prev + 1);
        }
    };

    const handleBack = () => {
        setActiveStep(prev => prev - 1);
    };

    const updateConfig = (field, value) => {
        setReportConfig(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleGenerateReports = async () => {
        setIsGenerating(true);

        try {
            // Simulate report generation
            await new Promise(resolve => setTimeout(resolve, 2000));

            const newReports = [];

            if (reportConfig.reportType === 'organization') {
                // Generate one report per organization
                for (const org of reportConfig.selectedOrganizations) {
                    const orgSurveys = availableSurveys.filter(s => s.organization_id === org.id);
                    newReports.push({
                        id: Date.now() + Math.random(),
                        name: `${reportConfig.name} - ${org.name}`,
                        type: 'organization',
                        organizationId: org.id,
                        organizationName: org.name,
                        surveyCount: orgSurveys.length,
                        createdAt: new Date().toISOString(),
                        status: 'completed',
                        data: {
                            surveys: orgSurveys,
                            metrics: calculateMetrics(orgSurveys),
                            analysis: generateAnalysis(orgSurveys)
                        }
                    });
                }
            } else if (reportConfig.reportType === 'contact') {
                // Generate one report per contact
                for (const contact of reportConfig.selectedContacts) {
                    const contactSurveys = availableSurveys.filter(s => s.user_id === contact.id);
                    newReports.push({
                        id: Date.now() + Math.random(),
                        name: `${reportConfig.name} - ${contact.firstname} ${contact.lastname}`,
                        type: 'contact',
                        contactId: contact.id,
                        contactName: `${contact.firstname} ${contact.lastname}`,
                        surveyCount: contactSurveys.length,
                        createdAt: new Date().toISOString(),
                        status: 'completed',
                        data: {
                            surveys: contactSurveys,
                            metrics: calculateMetrics(contactSurveys),
                            analysis: generateAnalysis(contactSurveys)
                        }
                    });
                }
            } else if (reportConfig.reportType === 'comparative') {
                // Generate a single comparative report
                newReports.push({
                    id: Date.now(),
                    name: reportConfig.name,
                    type: 'comparative',
                    surveyCount: reportConfig.selectedSurveys.length,
                    createdAt: new Date().toISOString(),
                    status: 'completed',
                    compareBy: reportConfig.compareBy,
                    data: {
                        surveys: reportConfig.selectedSurveys,
                        comparison: generateComparison(reportConfig.selectedSurveys),
                        metrics: calculateMetrics(reportConfig.selectedSurveys),
                        analysis: generateAnalysis(reportConfig.selectedSurveys)
                    }
                });
            } else {
                // Individual reports for each selected survey
                for (const survey of reportConfig.selectedSurveys) {
                    newReports.push({
                        id: Date.now() + Math.random(),
                        name: `${reportConfig.name} - Survey #${survey.id}`,
                        type: 'individual',
                        surveyId: survey.id,
                        createdAt: new Date().toISOString(),
                        status: 'completed',
                        data: {
                            survey: survey,
                            metrics: calculateMetrics([survey]),
                            analysis: generateAnalysis([survey])
                        }
                    });
                }
            }

            setGeneratedReports(newReports);

            // Save to localStorage
            const allReports = [...savedReports, ...newReports];
            localStorage.setItem('savedReports', JSON.stringify(allReports));
            setSavedReports(allReports);

            if (onSaveReport) {
                onSaveReport(newReports);
            }

        } catch (error) {
            console.error('Error generating reports:', error);
        } finally {
            setIsGenerating(false);
        }
    };

    const calculateMetrics = (surveys) => {
        if (!surveys || surveys.length === 0) return {};

        return {
            totalResponses: surveys.length,
            completionRate: surveys.filter(s => s.status === 'completed').length / surveys.length * 100,
            averageScore: Math.random() * 2 + 3, // Placeholder
            topPerformers: 3,
            needsImprovement: 2
        };
    };

    const generateAnalysis = (surveys) => {
        return {
            summary: `Analysis of ${surveys.length} survey responses`,
            strengths: ['Strong leadership metrics', 'High engagement scores'],
            opportunities: ['Training needs identified', 'Resource allocation'],
            recommendations: ['Implement targeted training', 'Increase support resources']
        };
    };

    const generateComparison = (surveys) => {
        // Group by compare criterion
        const grouped = {};
        surveys.forEach(survey => {
            const key = survey[reportConfig.compareBy === 'organization' ? 'organization_name' :
                reportConfig.compareBy === 'contact' ? 'user_name' :
                    reportConfig.compareBy === 'region' ? 'country' : 'response_date'];
            if (!grouped[key]) {
                grouped[key] = [];
            }
            grouped[key].push(survey);
        });
        return grouped;
    };

    const handleExport = (report, format) => {
        if (onExportReport) {
            onExportReport(report, format);
        } else {
            // Default export behavior
            console.log(`Exporting report ${report.name} as ${format}`);
            alert(`Report "${report.name}" exported as ${format.toUpperCase()}`);
        }
    };

    const handleShare = (report) => {
        if (onShareReport) {
            onShareReport(report);
        } else {
            // Default share behavior - copy link
            const shareUrl = `${window.location.origin}/reports/${report.id}`;
            navigator.clipboard.writeText(shareUrl);
            alert('Report link copied to clipboard!');
        }
    };

    // Get unique organizations and contacts from survey data
    const uniqueOrganizations = React.useMemo(() => {
        const orgs = new Map();
        Object.values(surveyData).flat().forEach(survey => {
            if (survey.organization_id && survey.organization_name) {
                orgs.set(survey.organization_id, {
                    id: survey.organization_id,
                    name: survey.organization_name
                });
            }
        });
        return Array.from(orgs.values());
    }, [surveyData]);

    const uniqueContacts = React.useMemo(() => {
        const contactsMap = new Map();
        Object.values(surveyData).flat().forEach(survey => {
            if (survey.user_id && survey.user_name) {
                const [firstname = '', lastname = ''] = (survey.user_name || '').split(' ');
                contactsMap.set(survey.user_id, {
                    id: survey.user_id,
                    firstname,
                    lastname,
                    email: survey.user_email || ''
                });
            }
        });
        return Array.from(contactsMap.values());
    }, [surveyData]);

    const renderStepContent = (step) => {
        switch (step) {
            case 0:
                return (
                    <Box>
                        <Typography variant="h6" gutterBottom sx={{ color: colors.primary }}>
                            Select Report Type
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                            Choose the type of report you want to generate
                        </Typography>
                        <Grid container spacing={2}>
                            {reportTypes.map((type) => (
                                <Grid item xs={12} sm={6} key={type.value}>
                                    <Paper
                                        elevation={reportConfig.reportType === type.value ? 4 : 1}
                                        onClick={() => updateConfig('reportType', type.value)}
                                        sx={{
                                            p: 3,
                                            cursor: 'pointer',
                                            border: reportConfig.reportType === type.value
                                                ? `2px solid ${colors.primary}`
                                                : `1px solid ${colors.border}`,
                                            borderRadius: 2,
                                            transition: 'all 0.2s ease',
                                            bgcolor: reportConfig.reportType === type.value ? colors.background : 'white',
                                            '&:hover': {
                                                borderColor: colors.primaryLight,
                                                transform: 'translateY(-2px)',
                                                boxShadow: 3
                                            }
                                        }}
                                    >
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                                            <Box sx={{
                                                color: reportConfig.reportType === type.value ? colors.primary : 'text.secondary',
                                                display: 'flex'
                                            }}>
                                                {type.icon}
                                            </Box>
                                            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                                                {type.label}
                                            </Typography>
                                        </Box>
                                        <Typography variant="body2" color="text.secondary">
                                            {type.description}
                                        </Typography>
                                        {reportConfig.reportType === type.value && (
                                            <CheckCircleIcon
                                                sx={{
                                                    position: 'absolute',
                                                    top: 12,
                                                    right: 12,
                                                    color: colors.primary
                                                }}
                                            />
                                        )}
                                    </Paper>
                                </Grid>
                            ))}
                        </Grid>
                    </Box>
                );

            case 1:
                return (
                    <Box>
                        <Typography variant="h6" gutterBottom sx={{ color: colors.primary }}>
                            Select Survey Template
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                            Choose a template to base your reports on (optional - leave blank for all surveys)
                        </Typography>

                        <FormControl fullWidth sx={{ mb: 3 }}>
                            <InputLabel>Survey Template</InputLabel>
                            <Select
                                value={reportConfig.selectedTemplate?.id || ''}
                                onChange={(e) => {
                                    const template = templates.find(t => t.id === e.target.value);
                                    updateConfig('selectedTemplate', template);
                                }}
                                label="Survey Template"
                            >
                                <MenuItem value="">
                                    <em>All Templates</em>
                                </MenuItem>
                                {templates.map((template) => (
                                    <MenuItem key={template.id} value={template.id}>
                                        {template.survey_code || template.name || `Template #${template.id}`}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        <TextField
                            fullWidth
                            label="Report Name"
                            value={reportConfig.name}
                            onChange={(e) => updateConfig('name', e.target.value)}
                            placeholder="Enter a name for your report"
                            sx={{ mb: 2 }}
                        />

                        <TextField
                            fullWidth
                            multiline
                            rows={3}
                            label="Description"
                            value={reportConfig.description}
                            onChange={(e) => updateConfig('description', e.target.value)}
                            placeholder="Describe the purpose of this report"
                        />
                    </Box>
                );

            case 2:
                return (
                    <Box>
                        <Typography variant="h6" gutterBottom sx={{ color: colors.primary }}>
                            {reportConfig.reportType === 'organization' ? 'Select Organizations' :
                                reportConfig.reportType === 'contact' ? 'Select Contacts' :
                                    'Select Surveys'}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                            {reportConfig.reportType === 'organization'
                                ? 'Choose organizations to generate reports for (one report per organization)'
                                : reportConfig.reportType === 'contact'
                                    ? 'Choose contacts to generate reports for (one report per contact)'
                                    : 'Select the surveys to include in your report'}
                        </Typography>

                        {reportConfig.reportType === 'organization' ? (
                            <Autocomplete
                                multiple
                                options={uniqueOrganizations}
                                getOptionLabel={(option) => option.name}
                                value={reportConfig.selectedOrganizations}
                                onChange={(e, value) => updateConfig('selectedOrganizations', value)}
                                renderInput={(params) => (
                                    <TextField {...params} label="Organizations" placeholder="Select organizations..." />
                                )}
                                renderTags={(value, getTagProps) =>
                                    value.map((option, index) => (
                                        <Chip
                                            {...getTagProps({ index })}
                                            key={option.id}
                                            label={option.name}
                                            icon={<BusinessIcon />}
                                            sx={{ bgcolor: colors.background }}
                                        />
                                    ))
                                }
                            />
                        ) : reportConfig.reportType === 'contact' ? (
                            <Autocomplete
                                multiple
                                options={uniqueContacts}
                                getOptionLabel={(option) => `${option.firstname} ${option.lastname}`}
                                value={reportConfig.selectedContacts}
                                onChange={(e, value) => updateConfig('selectedContacts', value)}
                                renderInput={(params) => (
                                    <TextField {...params} label="Contacts" placeholder="Select contacts..." />
                                )}
                                renderTags={(value, getTagProps) =>
                                    value.map((option, index) => (
                                        <Chip
                                            {...getTagProps({ index })}
                                            key={option.id}
                                            label={`${option.firstname} ${option.lastname}`}
                                            icon={<PersonIcon />}
                                            sx={{ bgcolor: colors.background }}
                                        />
                                    ))
                                }
                            />
                        ) : (
                            <Box>
                                <Autocomplete
                                    multiple
                                    options={availableSurveys}
                                    getOptionLabel={(option) =>
                                        `Survey #${option.id} - ${option.organization_name || option.user_name || 'Unknown'}`
                                    }
                                    value={reportConfig.selectedSurveys}
                                    onChange={(e, value) => updateConfig('selectedSurveys', value)}
                                    renderInput={(params) => (
                                        <TextField {...params} label="Surveys" placeholder="Select surveys..." />
                                    )}
                                    renderTags={(value, getTagProps) =>
                                        value.map((option, index) => (
                                            <Chip
                                                {...getTagProps({ index })}
                                                key={option.id}
                                                label={`#${option.id}`}
                                                sx={{ bgcolor: colors.background }}
                                            />
                                        ))
                                    }
                                />
                                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                                    {availableSurveys.length} surveys available
                                </Typography>
                            </Box>
                        )}

                        {reportConfig.reportType === 'comparative' && (
                            <Box sx={{ mt: 3 }}>
                                <Typography variant="subtitle2" gutterBottom>
                                    Compare By:
                                </Typography>
                                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                    {['organization', 'contact', 'region', 'time'].map((option) => (
                                        <Chip
                                            key={option}
                                            label={option.charAt(0).toUpperCase() + option.slice(1)}
                                            onClick={() => updateConfig('compareBy', option)}
                                            color={reportConfig.compareBy === option ? 'primary' : 'default'}
                                            variant={reportConfig.compareBy === option ? 'filled' : 'outlined'}
                                            sx={{
                                                cursor: 'pointer',
                                                ...(reportConfig.compareBy === option && {
                                                    bgcolor: colors.primary
                                                })
                                            }}
                                        />
                                    ))}
                                </Box>
                            </Box>
                        )}
                    </Box>
                );

            case 3:
                return (
                    <Box>
                        <Typography variant="h6" gutterBottom sx={{ color: colors.primary }}>
                            Configure Report Options
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                            Customize what to include in your reports
                        </Typography>

                        <Grid container spacing={3}>
                            <Grid item xs={12} md={6}>
                                <Paper sx={{ p: 2, border: `1px solid ${colors.border}` }}>
                                    <Typography variant="subtitle2" gutterBottom>
                                        Report Content
                                    </Typography>
                                    <FormControlLabel
                                        control={
                                            <Switch
                                                checked={reportConfig.includeCharts}
                                                onChange={(e) => updateConfig('includeCharts', e.target.checked)}
                                                sx={{ '& .Mui-checked': { color: colors.primary } }}
                                            />
                                        }
                                        label="Include Charts & Visualizations"
                                    />
                                    <FormControlLabel
                                        control={
                                            <Switch
                                                checked={reportConfig.includeAnalysis}
                                                onChange={(e) => updateConfig('includeAnalysis', e.target.checked)}
                                                sx={{ '& .Mui-checked': { color: colors.primary } }}
                                            />
                                        }
                                        label="Include AI Analysis & Insights"
                                    />
                                    <FormControlLabel
                                        control={
                                            <Switch
                                                checked={reportConfig.includeRawData}
                                                onChange={(e) => updateConfig('includeRawData', e.target.checked)}
                                                sx={{ '& .Mui-checked': { color: colors.primary } }}
                                            />
                                        }
                                        label="Include Raw Survey Data"
                                    />
                                </Paper>
                            </Grid>

                            <Grid item xs={12} md={6}>
                                <Paper sx={{ p: 2, border: `1px solid ${colors.border}` }}>
                                    <Typography variant="subtitle2" gutterBottom>
                                        Export Format
                                    </Typography>
                                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1 }}>
                                        {[
                                            { value: 'pdf', label: 'PDF', icon: <PictureAsPdfIcon /> },
                                            { value: 'excel', label: 'Excel', icon: <AssessmentIcon /> },
                                            { value: 'csv', label: 'CSV', icon: <DescriptionIcon /> }
                                        ].map((format) => (
                                            <Chip
                                                key={format.value}
                                                icon={format.icon}
                                                label={format.label}
                                                onClick={() => updateConfig('exportFormat', format.value)}
                                                color={reportConfig.exportFormat === format.value ? 'primary' : 'default'}
                                                variant={reportConfig.exportFormat === format.value ? 'filled' : 'outlined'}
                                                sx={{
                                                    cursor: 'pointer',
                                                    ...(reportConfig.exportFormat === format.value && {
                                                        bgcolor: colors.primary
                                                    })
                                                }}
                                            />
                                        ))}
                                    </Box>
                                </Paper>
                            </Grid>
                        </Grid>
                    </Box>
                );

            case 4:
                return (
                    <Box>
                        <Typography variant="h6" gutterBottom sx={{ color: colors.primary }}>
                            Review & Generate
                        </Typography>

                        {generatedReports.length > 0 ? (
                            <Box>
                                <Alert severity="success" sx={{ mb: 3 }}>
                                    Successfully generated {generatedReports.length} report(s)!
                                </Alert>

                                <List>
                                    {generatedReports.map((report) => (
                                        <Paper
                                            key={report.id}
                                            sx={{ mb: 2, border: `1px solid ${colors.border}` }}
                                        >
                                            <ListItem>
                                                <ListItemIcon>
                                                    {report.type === 'organization' ? <BusinessIcon color="primary" /> :
                                                        report.type === 'contact' ? <PersonIcon color="primary" /> :
                                                            report.type === 'comparative' ? <CompareArrowsIcon color="primary" /> :
                                                                <DescriptionIcon color="primary" />}
                                                </ListItemIcon>
                                                <ListItemText
                                                    primary={report.name}
                                                    secondary={`${report.surveyCount} surveys • Created ${new Date(report.createdAt).toLocaleString()}`}
                                                />
                                                <ListItemSecondaryAction>
                                                    <Tooltip title="Download">
                                                        <IconButton onClick={() => handleExport(report, reportConfig.exportFormat)}>
                                                            <FileDownloadIcon />
                                                        </IconButton>
                                                    </Tooltip>
                                                    <Tooltip title="Share">
                                                        <IconButton onClick={() => handleShare(report)}>
                                                            <ShareIcon />
                                                        </IconButton>
                                                    </Tooltip>
                                                    <Tooltip title="Email">
                                                        <IconButton onClick={() => console.log('Email report:', report.id)}>
                                                            <EmailIcon />
                                                        </IconButton>
                                                    </Tooltip>
                                                </ListItemSecondaryAction>
                                            </ListItem>
                                        </Paper>
                                    ))}
                                </List>
                            </Box>
                        ) : (
                            <Box>
                                <Paper sx={{ p: 3, mb: 3, bgcolor: colors.background, border: `1px solid ${colors.border}` }}>
                                    <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600 }}>
                                        Report Summary
                                    </Typography>
                                    <Grid container spacing={2}>
                                        <Grid item xs={6}>
                                            <Typography variant="body2" color="text.secondary">Report Type</Typography>
                                            <Typography variant="body1">{reportConfig.reportType}</Typography>
                                        </Grid>
                                        <Grid item xs={6}>
                                            <Typography variant="body2" color="text.secondary">Report Name</Typography>
                                            <Typography variant="body1">{reportConfig.name || 'Untitled Report'}</Typography>
                                        </Grid>
                                        <Grid item xs={6}>
                                            <Typography variant="body2" color="text.secondary">
                                                {reportConfig.reportType === 'organization' ? 'Organizations' :
                                                    reportConfig.reportType === 'contact' ? 'Contacts' : 'Surveys'}
                                            </Typography>
                                            <Typography variant="body1">
                                                {reportConfig.reportType === 'organization'
                                                    ? reportConfig.selectedOrganizations.length
                                                    : reportConfig.reportType === 'contact'
                                                        ? reportConfig.selectedContacts.length
                                                        : reportConfig.selectedSurveys.length} selected
                                            </Typography>
                                        </Grid>
                                        <Grid item xs={6}>
                                            <Typography variant="body2" color="text.secondary">Reports to Generate</Typography>
                                            <Typography variant="body1">
                                                {reportConfig.reportType === 'organization'
                                                    ? reportConfig.selectedOrganizations.length
                                                    : reportConfig.reportType === 'contact'
                                                        ? reportConfig.selectedContacts.length
                                                        : reportConfig.reportType === 'comparative'
                                                            ? 1
                                                            : reportConfig.selectedSurveys.length}
                                            </Typography>
                                        </Grid>
                                    </Grid>
                                </Paper>

                                {isGenerating && (
                                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2, py: 4 }}>
                                        <CircularProgress sx={{ color: colors.primary }} />
                                        <Typography>Generating reports...</Typography>
                                    </Box>
                                )}
                            </Box>
                        )}
                    </Box>
                );

            default:
                return null;
        }
    };

    const canProceed = () => {
        switch (activeStep) {
            case 0:
                return !!reportConfig.reportType;
            case 1:
                return !!reportConfig.name;
            case 2:
                if (reportConfig.reportType === 'organization') {
                    return reportConfig.selectedOrganizations.length > 0;
                } else if (reportConfig.reportType === 'contact') {
                    return reportConfig.selectedContacts.length > 0;
                } else {
                    return reportConfig.selectedSurveys.length > 0;
                }
            case 3:
                return true;
            case 4:
                return true;
            default:
                return false;
        }
    };

    return (
        <Card
            sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                border: `1px solid ${colors.border}`,
                borderRadius: 3
            }}
            elevation={0}
        >
            <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                {/* Header */}
                <Box sx={{ mb: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                        <AssessmentIcon sx={{ color: colors.primary, fontSize: 32 }} />
                        <Box>
                            <Typography variant="h5" sx={{ fontWeight: 600, color: '#212121' }}>
                                Report Creator
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Generate comparative reports by organization and contact
                            </Typography>
                        </Box>
                    </Box>

                    <Stepper activeStep={activeStep} alternativeLabel sx={{ mt: 3 }}>
                        {steps.map((label, index) => (
                            <Step key={label}>
                                <StepLabel
                                    StepIconProps={{
                                        sx: {
                                            '&.Mui-active': { color: colors.primary },
                                            '&.Mui-completed': { color: colors.success }
                                        }
                                    }}
                                >
                                    {label}
                                </StepLabel>
                            </Step>
                        ))}
                    </Stepper>
                </Box>

                {/* Step Content */}
                <Box sx={{ flex: 1, overflowY: 'auto', py: 2 }}>
                    {renderStepContent(activeStep)}
                </Box>

                {/* Navigation */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', pt: 2, borderTop: `1px solid ${colors.border}` }}>
                    <Button
                        disabled={activeStep === 0}
                        onClick={handleBack}
                        startIcon={<ArrowBackIcon />}
                    >
                        Back
                    </Button>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                        {onClose && (
                            <Button onClick={onClose} variant="outlined">
                                Cancel
                            </Button>
                        )}
                        <Button
                            variant="contained"
                            onClick={handleNext}
                            disabled={!canProceed() || isGenerating}
                            endIcon={activeStep === steps.length - 1
                                ? (generatedReports.length > 0 ? <CheckCircleIcon /> : <SaveIcon />)
                                : <ArrowForwardIcon />}
                            sx={{
                                bgcolor: colors.primary,
                                '&:hover': { bgcolor: colors.primaryDark },
                                '&.Mui-disabled': { bgcolor: '#e0e0e0' }
                            }}
                        >
                            {activeStep === steps.length - 1
                                ? (generatedReports.length > 0 ? 'Done' : 'Generate Reports')
                                : 'Next'}
                        </Button>
                    </Box>
                </Box>
            </CardContent>
        </Card>
    );
};

export default ReportCreator;
