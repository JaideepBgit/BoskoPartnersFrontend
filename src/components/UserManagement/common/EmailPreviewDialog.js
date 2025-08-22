// components/UserManagement/common/EmailPreviewDialog.js
import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Typography,
    Box,
    Tabs,
    Tab,
    Paper,
    CircularProgress,
    Alert,
    IconButton
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import EmailIcon from '@mui/icons-material/Email';
import CodeIcon from '@mui/icons-material/Code';
import PreviewIcon from '@mui/icons-material/Preview';
import EmailService from '../../../services/EmailService';

function TabPanel({ children, value, index, ...other }) {
    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`email-preview-tabpanel-${index}`}
            aria-labelledby={`email-preview-tab-${index}`}
            {...other}
        >
            {value === index && (
                <Box sx={{ pt: 2 }}>
                    {children}
                </Box>
            )}
        </div>
    );
}

function EmailPreviewDialog({ 
    open, 
    onClose, 
    templateType = 'welcome',
    userVariables = {},
    selectedTemplate = null
}) {
    const [activeTab, setActiveTab] = useState(0);
    const [emailPreview, setEmailPreview] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleTabChange = (event, newValue) => {
        setActiveTab(newValue);
    };

    const generatePreview = async () => {
        if (!userVariables.username || !userVariables.email) {
            setError('Username and email are required for preview');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            // If a specific template is selected, use it directly
            if (selectedTemplate) {
                // Prepare variables for template replacement
                const templateVariables = {
                    greeting: userVariables.firstname 
                        ? `Dear ${userVariables.firstname}` 
                        : `Dear ${userVariables.username}`,
                    username: userVariables.username,
                    email: userVariables.email,
                    password: userVariables.password || '[Generated Password]',
                    survey_code: userVariables.survey_code || '[Generated Survey Code]',
                    organization_name: userVariables.organization_name || 'Sample Organization',
                    first_name: userVariables.firstname || 'John',
                    last_name: userVariables.lastname || 'Doe',
                    user_fullname: `${userVariables.firstname || 'John'} ${userVariables.lastname || 'Doe'}`,
                    platform_name: 'Saurara Platform',
                    support_email: 'support@saurara.com',
                    current_date: new Date().toLocaleDateString(),
                    current_year: new Date().getFullYear().toString(),
                    login_url: 'https://platform.saurara.com/login',
                    survey_url: 'https://platform.saurara.com/survey/' + (userVariables.survey_code || 'SAMPLE123')
                };

                // Replace template variables in both single and double brace formats
                let processedHtml = selectedTemplate.html_body || '<p>No HTML content available.</p>';
                Object.entries(templateVariables).forEach(([key, value]) => {
                    const singleBrace = new RegExp(`\\{${key}\\}`, 'gi');
                    const doubleBrace = new RegExp(`\\{\\{${key}\\}\\}`, 'gi');
                    processedHtml = processedHtml.replace(singleBrace, value);
                    processedHtml = processedHtml.replace(doubleBrace, value);
                });

                const preview = {
                    subject: selectedTemplate.subject,
                    html_body: processedHtml,
                    text_body: selectedTemplate.text_body || 'No text content available.'
                };

                setEmailPreview(preview);
            } else {
                // Use default template service for template types
                const templateVariables = {
                    greeting: userVariables.firstname 
                        ? `Dear ${userVariables.firstname}` 
                        : `Dear ${userVariables.username}`,
                    username: userVariables.username,
                    email: userVariables.email,
                    password: userVariables.password || '[Generated Password]',
                    survey_code: userVariables.survey_code || '[Generated Survey Code]',
                    // For reminder emails
                    org_text: userVariables.organization_name 
                        ? ` from ${userVariables.organization_name}` 
                        : '',
                    deadline_text: userVariables.days_remaining 
                        ? ` You have ${userVariables.days_remaining} days remaining to complete it.` 
                        : ''
                };

                const preview = await EmailService.renderPreview(templateType, templateVariables);
                setEmailPreview(preview);
            }
        } catch (error) {
            console.error('Error generating email preview:', error);
            setError('Failed to generate email preview. Please check if email templates are initialized.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (open) {
            generatePreview();
        }
    }, [open, userVariables, templateType, selectedTemplate]);

    const handleClose = () => {
        setActiveTab(0);
        setEmailPreview(null);
        setError(null);
        onClose();
    };

    return (
        <Dialog 
            open={open} 
            onClose={handleClose} 
            maxWidth="lg" 
            fullWidth
            PaperProps={{
                sx: { minHeight: '80vh' }
            }}
        >
            <DialogTitle sx={{ 
                backgroundColor: '#633394', 
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
            }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <EmailIcon />
                    <Typography variant="h6">
                        {selectedTemplate 
                            ? `Preview: ${selectedTemplate.name}` 
                            : (templateType === 'welcome' ? 'Welcome Email Preview' : 'Reminder Email Preview')
                        }
                    </Typography>
                </Box>
                <IconButton 
                    onClick={handleClose}
                    sx={{ color: 'white' }}
                    size="small"
                >
                    <CloseIcon />
                </IconButton>
            </DialogTitle>

            <DialogContent sx={{ p: 0 }}>
                {loading ? (
                    <Box sx={{ 
                        display: 'flex', 
                        justifyContent: 'center', 
                        alignItems: 'center', 
                        height: 400 
                    }}>
                        <CircularProgress />
                        <Typography sx={{ ml: 2 }}>Generating email preview...</Typography>
                    </Box>
                ) : error ? (
                    <Box sx={{ p: 3 }}>
                        <Alert severity="error" sx={{ mb: 2 }}>
                            {error}
                        </Alert>
                        <Button 
                            variant="contained" 
                            onClick={generatePreview}
                            sx={{ 
                                backgroundColor: '#633394',
                                '&:hover': { backgroundColor: '#7c52a5' }
                            }}
                        >
                            Retry
                        </Button>
                    </Box>
                ) : emailPreview ? (
                    <>
                        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                            <Tabs 
                                value={activeTab} 
                                onChange={handleTabChange} 
                                aria-label="email preview tabs"
                                sx={{
                                    '& .MuiTab-root': {
                                        color: '#633394',
                                        '&.Mui-selected': {
                                            color: '#633394',
                                            fontWeight: 'bold'
                                        }
                                    },
                                    '& .MuiTabs-indicator': {
                                        backgroundColor: '#633394'
                                    }
                                }}
                            >
                                <Tab 
                                    icon={<PreviewIcon />} 
                                    label="HTML Preview" 
                                    iconPosition="start"
                                />
                                <Tab 
                                    icon={<EmailIcon />} 
                                    label="Plain Text" 
                                    iconPosition="start"
                                />
                                <Tab 
                                    icon={<CodeIcon />} 
                                    label="HTML Source" 
                                    iconPosition="start"
                                />
                            </Tabs>
                        </Box>

                        <TabPanel value={activeTab} index={0}>
                            <Paper sx={{ p: 2, m: 2, minHeight: 500 }}>
                                <Typography variant="h6" gutterBottom sx={{ color: '#633394' }}>
                                    Subject: {emailPreview.subject}
                                </Typography>
                                <Box 
                                    sx={{ 
                                        border: '1px solid #e0e0e0',
                                        borderRadius: 1,
                                        minHeight: 450,
                                        backgroundColor: '#fff'
                                    }}
                                    dangerouslySetInnerHTML={{ __html: emailPreview.html_body }}
                                />
                            </Paper>
                        </TabPanel>

                        <TabPanel value={activeTab} index={1}>
                            <Paper sx={{ p: 2, m: 2, minHeight: 500 }}>
                                <Typography variant="h6" gutterBottom sx={{ color: '#633394' }}>
                                    Subject: {emailPreview.subject}
                                </Typography>
                                <Box 
                                    component="pre"
                                    sx={{ 
                                        fontSize: '14px',
                                        fontFamily: 'monospace',
                                        whiteSpace: 'pre-wrap',
                                        wordBreak: 'break-word',
                                        backgroundColor: '#f5f5f5',
                                        p: 2,
                                        border: '1px solid #e0e0e0',
                                        borderRadius: 1,
                                        minHeight: 450,
                                        overflow: 'auto'
                                    }}
                                >
                                    {emailPreview.text_body}
                                </Box>
                            </Paper>
                        </TabPanel>

                        <TabPanel value={activeTab} index={2}>
                            <Paper sx={{ p: 2, m: 2, minHeight: 500 }}>
                                <Typography variant="h6" gutterBottom sx={{ color: '#633394' }}>
                                    HTML Source Code
                                </Typography>
                                <Box 
                                    component="pre"
                                    sx={{ 
                                        fontSize: '12px',
                                        fontFamily: 'monospace',
                                        whiteSpace: 'pre-wrap',
                                        wordBreak: 'break-word',
                                        backgroundColor: '#f5f5f5',
                                        p: 2,
                                        border: '1px solid #e0e0e0',
                                        borderRadius: 1,
                                        minHeight: 450,
                                        overflow: 'auto'
                                    }}
                                >
                                    {emailPreview.html_body}
                                </Box>
                            </Paper>
                        </TabPanel>
                    </>
                ) : null}
            </DialogContent>

            <DialogActions sx={{ p: 3, backgroundColor: '#f5f5f5' }}>
                <Typography variant="body2" sx={{ color: '#666', flexGrow: 1 }}>
                    Template: {emailPreview?.template_name || 'Loading...'}
                </Typography>
                <Button onClick={handleClose} color="secondary">
                    Close
                </Button>
                <Button 
                    onClick={generatePreview}
                    variant="contained"
                    sx={{ 
                        backgroundColor: '#633394',
                        '&:hover': { backgroundColor: '#7c52a5' }
                    }}
                >
                    Refresh Preview
                </Button>
            </DialogActions>
        </Dialog>
    );
}

export default EmailPreviewDialog;
