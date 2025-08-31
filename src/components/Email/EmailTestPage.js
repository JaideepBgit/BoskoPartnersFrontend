import React, { useState } from 'react';
import {
    Container,
    Typography,
    Box,
    Button,
    Card,
    CardContent,
    Grid,
    Alert,
    Divider
} from '@mui/material';
import InvitationEmailDialog from './InvitationEmailDialog';
import { EmailService } from '../../services/EmailService';

const EmailTestPage = () => {
    const [invitationDialogOpen, setInvitationDialogOpen] = useState(false);
    const [testResults, setTestResults] = useState({});
    const [loading, setLoading] = useState(false);

    const handleTestEmailConfig = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/test-email-config');
            const result = await response.json();
            setTestResults(prev => ({
                ...prev,
                config: result
            }));
        } catch (error) {
            setTestResults(prev => ({
                ...prev,
                config: { error: error.message }
            }));
        } finally {
            setLoading(false);
        }
    };

    const handleInitializeTemplates = async () => {
        setLoading(true);
        try {
            const result = await EmailService.initializeDefaultTemplates();
            setTestResults(prev => ({
                ...prev,
                templates: result
            }));
        } catch (error) {
            setTestResults(prev => ({
                ...prev,
                templates: { error: error.message }
            }));
        } finally {
            setLoading(false);
        }
    };

    const handleInvitationSuccess = (result) => {
        setTestResults(prev => ({
            ...prev,
            invitation: result
        }));
    };

    return (
        <Container maxWidth="lg" sx={{ py: 4 }}>
            <Typography variant="h4" component="h1" gutterBottom>
                📧 Email System Test Page
            </Typography>
            
            <Typography variant="body1" color="text.secondary" paragraph>
                Test the email functionality including invitation emails, reminder emails, and email templates.
            </Typography>

            <Grid container spacing={3}>
                {/* Email Configuration Test */}
                <Grid item xs={12} md={6}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                🔧 Email Configuration Test
                            </Typography>
                            <Typography variant="body2" color="text.secondary" paragraph>
                                Test if your email configuration (SES API and SMTP) is working properly.
                            </Typography>
                            
                            <Button 
                                variant="contained" 
                                onClick={handleTestEmailConfig}
                                disabled={loading}
                                sx={{ mb: 2 }}
                            >
                                Test Email Configuration
                            </Button>

                            {testResults.config && (
                                <Box>
                                    <Divider sx={{ my: 2 }} />
                                    <Typography variant="subtitle2" gutterBottom>
                                        Configuration Test Results:
                                    </Typography>
                                    <pre style={{ 
                                        backgroundColor: '#f5f5f5', 
                                        padding: '10px', 
                                        borderRadius: '4px',
                                        fontSize: '12px',
                                        overflow: 'auto'
                                    }}>
                                        {JSON.stringify(testResults.config, null, 2)}
                                    </pre>
                                </Box>
                            )}
                        </CardContent>
                    </Card>
                </Grid>

                {/* Email Templates */}
                <Grid item xs={12} md={6}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                📝 Email Templates
                            </Typography>
                            <Typography variant="body2" color="text.secondary" paragraph>
                                Initialize default email templates for welcome, invitation, and reminder emails.
                            </Typography>
                            
                            <Button 
                                variant="contained" 
                                onClick={handleInitializeTemplates}
                                disabled={loading}
                                sx={{ mb: 2 }}
                            >
                                Initialize Default Templates
                            </Button>

                            {testResults.templates && (
                                <Box>
                                    <Divider sx={{ my: 2 }} />
                                    <Typography variant="subtitle2" gutterBottom>
                                        Template Initialization Results:
                                    </Typography>
                                    <pre style={{ 
                                        backgroundColor: '#f5f5f5', 
                                        padding: '10px', 
                                        borderRadius: '4px',
                                        fontSize: '12px',
                                        overflow: 'auto'
                                    }}>
                                        {JSON.stringify(testResults.templates, null, 2)}
                                    </pre>
                                </Box>
                            )}
                        </CardContent>
                    </Card>
                </Grid>

                {/* Invitation Email Test */}
                <Grid item xs={12}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                📧 Invitation Email Test
                            </Typography>
                            <Typography variant="body2" color="text.secondary" paragraph>
                                Test sending invitation emails to new users. You can send either general platform invitations or survey-specific invitations.
                            </Typography>
                            
                            <Button 
                                variant="contained" 
                                onClick={() => setInvitationDialogOpen(true)}
                                sx={{ mb: 2 }}
                            >
                                Send Test Invitation Email
                            </Button>

                            {testResults.invitation && (
                                <Box>
                                    <Divider sx={{ my: 2 }} />
                                    <Typography variant="subtitle2" gutterBottom>
                                        Last Invitation Email Result:
                                    </Typography>
                                    <pre style={{ 
                                        backgroundColor: '#f5f5f5', 
                                        padding: '10px', 
                                        borderRadius: '4px',
                                        fontSize: '12px',
                                        overflow: 'auto'
                                    }}>
                                        {JSON.stringify(testResults.invitation, null, 2)}
                                    </pre>
                                </Box>
                            )}
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* Invitation Email Dialog */}
            <InvitationEmailDialog
                open={invitationDialogOpen}
                onClose={() => setInvitationDialogOpen(false)}
                onSuccess={handleInvitationSuccess}
                organizationName="Test Organization"
                organizationId={1}
            />

            {/* Instructions */}
            <Box sx={{ mt: 4, p: 3, backgroundColor: '#f8f9fa', borderRadius: 2 }}>
                <Typography variant="h6" gutterBottom>
                    📚 How to Use This Page
                </Typography>
                <Typography variant="body2" paragraph>
                    <strong>1. Test Email Configuration:</strong> First, test if your email system is properly configured. This will check both AWS SES API and SMTP fallback.
                </Typography>
                <Typography variant="body2" paragraph>
                    <strong>2. Initialize Templates:</strong> Create default email templates for welcome, invitation, and reminder emails. These templates will be used when sending emails.
                </Typography>
                <Typography variant="body2" paragraph>
                    <strong>3. Send Test Invitation:</strong> Test the invitation email functionality by sending a test email. You can customize the email content and recipient information.
                </Typography>
                <Typography variant="body2">
                    <strong>Note:</strong> Make sure your backend server is running and your email credentials are properly configured in the .env file.
                </Typography>
            </Box>
        </Container>
    );
};

export default EmailTestPage;

