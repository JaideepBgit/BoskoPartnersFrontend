// services/EmailService.js

const API_BASE_URL = process.env.REACT_APP_API_URL || '';

export const EmailService = {
    /**
     * Get email template by type
     */
    getTemplateByType: async (templateType) => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/email-templates/by-type/${templateType}`);
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
     * Render email template preview
     */
    renderPreview: async (templateType, variables) => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/email-templates/render-preview`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    template_type: templateType,
                    variables: variables
                })
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
            const response = await fetch(`${API_BASE_URL}/api/initialize-default-email-templates`, {
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
    }
};

export default EmailService;
