// SurveyAssignmentService.js - Service for handling survey assignment API calls

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

class SurveyAssignmentService {
    /**
     * Assign a survey to multiple users
     * @param {Array} userIds - Array of user IDs to assign the survey to
     * @param {number} templateId - ID of the survey template to assign
     * @param {number} adminId - ID of the admin making the assignment
     * @returns {Promise<Object>} Assignment result
     */
    static async assignSurvey(userIds, templateId, adminId) {
        try {
            // Ensure input is treated as an array then strip out primitive IDs only
            const idsArray = Array.isArray(userIds)
                ? userIds
                : userIds !== undefined && userIds !== null
                    ? [userIds]
                    : [];

            const cleanUserIds = idsArray.map((u) => {
                if (u && typeof u === 'object') {
                    return u.id || u.user_id || null;
                }
                return u;
            }).filter(Boolean);

            const parsedTemplateId = templateId !== undefined && templateId !== null && templateId !== ''
                ? Number(templateId)
                : null;

            const payload = {
                user_ids: cleanUserIds,
                template_id: parsedTemplateId,
                admin_id: adminId ? Number(adminId) : undefined,
            };

            console.log('AssignSurvey payload', payload);

            const response = await fetch(`${API_BASE_URL}/assign-survey`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to assign survey');
            }

            return await response.json();
        } catch (error) {
            console.error('Error assigning survey:', error);
            throw error;
        }
    }

    /**
     * Get all survey assignments for a specific user
     * @param {number} userId - ID of the user
     * @returns {Promise<Object>} User's survey assignments
     */
    static async getUserSurveyAssignments(userId) {
        try {
            console.log(`Fetching assignments for user ${userId} from: ${API_BASE_URL}/users/${userId}/survey-assignments`);
            const response = await fetch(`${API_BASE_URL}/users/${userId}/survey-assignments`);

            console.log('Response status:', response.status);
            console.log('Response headers:', response.headers);

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: `HTTP ${response.status}` }));
                console.error('API error response:', errorData);
                throw new Error(errorData.error || `Failed to get user survey assignments (${response.status})`);
            }

            const data = await response.json();
            console.log('Successfully fetched assignments:', data);
            return data;
        } catch (error) {
            console.error('Error getting user survey assignments:', error);
            if (error.name === 'TypeError' && error.message.includes('fetch')) {
                throw new Error('Cannot connect to backend server. Please check if the server is running.');
            }
            throw error;
        }
    }

    /**
     * Get all users for assignment selection
     * @returns {Promise<Array>} List of users
     */
    static async getUsers() {
        try {
            const response = await fetch(`${API_BASE_URL}/users`);

            if (!response.ok) {
                throw new Error('Failed to fetch users');
            }

            const users = await response.json();
            // Filter out admin users for assignment
            return users.filter(user => user.role !== 'admin');
        } catch (error) {
            console.error('Error getting users:', error);
            throw error;
        }
    }

    /**
     * Get all survey templates for assignment
     * @returns {Promise<Array>} List of survey templates
     */
    static async getSurveyTemplates() {
        try {
            const response = await fetch(`${API_BASE_URL}/templates`);

            if (!response.ok) {
                throw new Error('Failed to fetch survey templates');
            }

            return await response.json();
        } catch (error) {
            console.error('Error getting survey templates:', error);
            throw error;
        }
    }

    /**
     * Get all organizations for filtering
     * @returns {Promise<Array>} List of organizations
     */
    static async getOrganizations() {
        try {
            const response = await fetch(`${API_BASE_URL}/organizations`);

            if (!response.ok) {
                throw new Error('Failed to fetch organizations');
            }

            return await response.json();
        } catch (error) {
            console.error('Error getting organizations:', error);
            throw error;
        }
    }

    /**
     * Get survey templates available for a specific organization
     * This checks survey_template_versions to find which versions are assigned to the organization
     * @param {number} organizationId - ID of the organization
     * @returns {Promise<Array>} List of survey templates available for the organization
     */
    static async getTemplatesForOrganization(organizationId) {
        try {
            const response = await fetch(`${API_BASE_URL}/organizations/${organizationId}/survey-templates`);

            if (!response.ok) {
                throw new Error('Failed to fetch survey templates for organization');
            }

            return await response.json();
        } catch (error) {
            console.error('Error getting survey templates for organization:', error);
            throw error;
        }
    }


    /**
     * Send a reminder email for a specific user's survey assignment
     * @param {number} userId - ID of the user
     * @returns {Promise<Object>} Result of the reminder email
     */
    static async sendReminderEmail(userId) {
        try {
            const response = await fetch(`${API_BASE_URL}/users/${userId}/reminder-email`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to send reminder email');
            }

            return await response.json();
        } catch (error) {
            console.error('Error sending reminder email:', error);
            throw error;
        }
    }

    /**
     * Get users with pending surveys for reminder purposes
     * @returns {Promise<Object>} Users with pending surveys
     */
    static async getUsersWithPendingSurveys() {
        try {
            const response = await fetch(`${API_BASE_URL}/users/pending-surveys`);

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to get users with pending surveys');
            }

            return await response.json();
        } catch (error) {
            console.error('Error getting users with pending surveys:', error);
            throw error;
        }
    }

    /**
     * Send bulk reminder emails to multiple users
     * @param {Array} userIds - Array of user IDs to send reminders to
     * @returns {Promise<Object>} Result of the bulk reminder operation
     */
    static async sendBulkReminderEmails(userIds) {
        try {
            const response = await fetch(`${API_BASE_URL}/send-bulk-reminder-emails`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    user_ids: userIds
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to send bulk reminder emails');
            }

            return await response.json();
        } catch (error) {
            console.error('Error sending bulk reminder emails:', error);
            throw error;
        }
    }

    /**
     * Remove a survey assignment for a specific user
     * @param {number} userId - ID of the user
     * @param {number} assignmentId - ID of the assignment to remove
     * @returns {Promise<Object>} Result of the removal operation
     */
    static async removeSurveyAssignment(userId, assignmentId) {
        try {
            console.log(`Removing assignment ${assignmentId} for user ${userId}`);

            const response = await fetch(`${API_BASE_URL}/users/${userId}/survey-assignments/${assignmentId}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: `HTTP ${response.status}` }));
                console.error('API error response:', errorData);
                throw new Error(errorData.error || `Failed to remove survey assignment (${response.status})`);
            }

            const data = await response.json();
            console.log('Successfully removed assignment:', data);
            return data;
        } catch (error) {
            console.error('Error removing survey assignment:', error);
            if (error.name === 'TypeError' && error.message.includes('fetch')) {
                throw new Error('Cannot connect to backend server. Please check if the server is running.');
            }
            throw error;
        }
    }
}

export default SurveyAssignmentService;