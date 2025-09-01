// services/EmailService.js

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

export const EmailService = {
    /**
     * Get email template by type
     */
    getTemplateByType: async (templateType) => {
        try {
            const response = await fetch(`${API_BASE_URL}/email-templates/by-type/${templateType}`);
            if (!response.ok) {
                throw new Error(`Failed to get template: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error('Error getting email template:', error);
            throw error;
        }
    },

    /**
     * Get all email templates with optional filters
     */
    getTemplates: async (options = {}) => {
        try {
            const params = new URLSearchParams();
            if (options.organizationId) {
                params.append('organization_id', options.organizationId);
            }
            if (options.filterOrganizationId) {
                params.append('filter_organization_id', options.filterOrganizationId);
            }
            
            const url = `${API_BASE_URL}/email-templates${params.toString() ? `?${params.toString()}` : ''}`;
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error(`Failed to get templates: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error('Error getting email templates:', error);
            throw error;
        }
    },

    /**
     * Get all email templates using dedicated endpoint with enhanced debugging
     */
    getAllTemplates: async () => {
        try {
            console.log('[EmailService] Calling dedicated /api/email-templates/all endpoint');
            const response = await fetch(`${API_BASE_URL}/email-templates/all`);
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error(`[EmailService] Failed to get all templates: ${response.status} - ${errorText}`);
                throw new Error(`Failed to get all templates: ${response.status} - ${errorText}`);
            }
            
            const result = await response.json();
            console.log(`[EmailService] Successfully fetched ${result.count || 0} templates from dedicated endpoint`);
            
            if (result.conversion_errors && result.conversion_errors.length > 0) {
                console.warn('[EmailService] Some templates had conversion errors:', result.conversion_errors);
            }
            
            return result;
        } catch (error) {
            console.error('[EmailService] Error getting all email templates:', error);
            throw error;
        }
    },

    /**
     * Create a new email template
     */
    createTemplate: async (templateData) => {
        try {
            const response = await fetch(`${API_BASE_URL}/email-templates`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(templateData)
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `Failed to create template: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error('Error creating email template:', error);
            throw error;
        }
    },

    /**
     * Update an existing email template
     */
    updateTemplate: async (templateId, templateData) => {
        try {
            const response = await fetch(`${API_BASE_URL}/email-templates/${templateId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(templateData)
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `Failed to update template: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error('Error updating email template:', error);
            throw error;
        }
    },

    /**
     * Delete an email template
     */
    deleteTemplate: async (templateId) => {
        try {
            const response = await fetch(`${API_BASE_URL}/email-templates/${templateId}`, {
                method: 'DELETE',
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `Failed to delete template: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error('Error deleting email template:', error);
            throw error;
        }
    },

    /**
     * Render email template preview
     */
    renderPreview: async (templateType, variables, templateId = null, organizationId = null) => {
        try {
            const requestBody = {
                variables: variables
            };
            
            if (templateId) {
                requestBody.template_id = templateId;
            } else {
                requestBody.template_type = templateType;
                if (organizationId) {
                    requestBody.organization_id = organizationId;
                }
            }
            
            const response = await fetch(`${API_BASE_URL}/email-templates/render-preview`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody)
            });
            
            if (!response.ok) {
                throw new Error(`Failed to render preview: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error('Error rendering email preview:', error);
            throw error;
        }
    },

    /**
     * Initialize default email templates
     */
    initializeDefaultTemplates: async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/initialize-default-email-templates`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                }
            });
            
            if (!response.ok) {
                throw new Error(`Failed to initialize templates: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error('Error initializing email templates:', error);
            throw error;
        }
    },

    /**
     * Check if email service is active for an organization
     */
    isEmailServiceActive: async (organizationId) => {
        try {
            const response = await fetch(`${API_BASE_URL}/organizations/${organizationId}/email-service-status`);
            if (!response.ok) {
                throw new Error(`Failed to check email service status: ${response.status}`);
            }
            const result = await response.json();
            return result.isActive;
        } catch (error) {
            console.error('Error checking email service status:', error);
            throw error;
        }
    },

    /**
     * Get organization email service configuration
     */
    getEmailServiceConfig: async (organizationId) => {
        try {
            const response = await fetch(`${API_BASE_URL}/organizations/${organizationId}/email-service-config`);
            if (!response.ok) {
                throw new Error(`Failed to get email service config: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error('Error getting email service config:', error);
            throw error;
        }
    },

    /**
     * Update organization email service configuration
     */
    updateEmailServiceConfig: async (organizationId, config) => {
        try {
            const response = await fetch(`${API_BASE_URL}/organizations/${organizationId}/email-service-config`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(config)
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `Failed to update email service config: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error('Error updating email service config:', error);
            throw error;
        }
    },

    /**
     * Send invitation email to a user
     */
    sendInvitationEmail: async (emailData) => {
        try {
            const response = await fetch(`${API_BASE_URL}/send-invitation-email`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(emailData)
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `Failed to send invitation email: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error('Error sending invitation email:', error);
            throw error;
        }
    },

    /**
     * Send invitation email to multiple users
     */
    sendBulkInvitationEmails: async (usersData) => {
        try {
            const response = await fetch(`${API_BASE_URL}/send-bulk-invitation-emails`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(usersData)
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `Failed to send bulk invitation emails: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error('Error sending bulk invitation emails:', error);
            throw error;
        }
    },

    /**
     * Send invitation email to a specific user by ID
     */
    sendUserInvitationEmail: async (userId) => {
        try {
            const response = await fetch(`${API_BASE_URL}/users/${userId}/invitation-email`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                }
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `Failed to send invitation email: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error('Error sending invitation email to user:', error);
            throw error;
        }
    },

    /**
     * Debug email templates - check database and table status
     */
    debugEmailTemplates: async () => {
        try {
            console.log('[EmailService] Calling debug endpoint for email templates');
            const response = await fetch(`${API_BASE_URL}/email-templates/debug`);
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error(`[EmailService] Debug endpoint failed: ${response.status} - ${errorText}`);
                throw new Error(`Debug endpoint failed: ${response.status} - ${errorText}`);
            }
            
            const result = await response.json();
            console.log('[EmailService] Debug info:', result);
            return result;
        } catch (error) {
            console.error('[EmailService] Error calling debug endpoint:', error);
            throw error;
        }
    }
};

export default EmailService;
