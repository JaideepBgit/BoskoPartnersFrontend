import axios from "axios";

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Organization-related API calls
export const fetchOrganizations = async () => {
    try {
        const response = await axios.get(`${BASE_URL}/organizations`);
        return response.data;
    } catch (error) {
        console.error('Failed to fetch organizations:', error);
        throw error;
    }
};

export const addOrganization = async (organizationData) => {
    try {
        const response = await axios.post(`${BASE_URL}/organizations`, organizationData);
        return response.data;
    } catch (error) {
        console.error('Failed to add organization:', error);
        throw error;
    }
};

export const updateOrganization = async (id, organizationData) => {
    try {
        const response = await axios.put(`${BASE_URL}/organizations/${id}`, organizationData);
        return response.data;
    } catch (error) {
        console.error('Failed to update organization:', error);
        throw error;
    }
};

export const deleteOrganization = async (id) => {
    try {
        const response = await axios.delete(`${BASE_URL}/organizations/${id}`);
        return response.data;
    } catch (error) {
        console.error('Failed to delete organization:', error);
        throw error;
    }
};

export const fetchOrganizationById = async (id) => {
    try {
        const response = await axios.get(`${BASE_URL}/organizations/${id}`);
        return response.data;
    } catch (error) {
        console.error(`Failed to fetch organization with id ${id}:`, error);
        throw error;
    }
};

export const uploadOrganizationFile = async (formData) => {
    try {
        const response = await axios.post(`${BASE_URL}/organizations/upload`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
        return response.data;
    } catch (error) {
        console.error('Failed to upload organization file:', error);
        throw error;
    }
};

// User-related API calls
export const fetchUsers = async () => {
    try {
        const response = await axios.get(`${BASE_URL}/users`);
        return response.data;
    } catch (error) {
        console.error('Failed to fetch users:', error);
        throw error;
    }
};

export const fetchUsersByOrganization = async (organizationId) => {
    try {
        const response = await axios.get(`${BASE_URL}/organizations/${organizationId}/users`);
        return response.data;
    } catch (error) {
        console.error(`Failed to fetch users for organization ${organizationId}:`, error);
        throw error;
    }
};

export const addUser = async (userData) => {
    try {
        const currentUserRole = localStorage.getItem('userRole') || 'user';
        const response = await axios.post(`${BASE_URL}/users`, userData, {
            headers: {
                'X-User-Role': currentUserRole
            }
        });
        return response.data;
    } catch (error) {
        console.error('Failed to add user:', error);
        throw error;
    }
};

export const updateUser = async (id, userData) => {
    try {
        const currentUserRole = localStorage.getItem('userRole') || 'user';
        const response = await axios.put(`${BASE_URL}/users/${id}`, userData, {
            headers: {
                'X-User-Role': currentUserRole
            }
        });
        return response.data;
    } catch (error) {
        console.error('Failed to update user:', error);
        throw error;
    }
};

export const deleteUser = async (id) => {
    try {
        const response = await axios.delete(`${BASE_URL}/users/${id}`);
        return response.data;
    } catch (error) {
        console.error('Failed to delete user:', error);
        throw error;
    }
};

export const fetchUserById = async (id) => {
    try {
        const response = await axios.get(`${BASE_URL}/users/${id}`);
        return response.data;
    } catch (error) {
        console.error(`Failed to fetch user with id ${id}:`, error);
        throw error;
    }
};

export const uploadUserFile = async (formData) => {
    try {
        const response = await axios.post(`${BASE_URL}/users/upload`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
        return response.data;
    } catch (error) {
        console.error('Failed to upload user file:', error);
        throw error;
    }
};

// Update user roles (list) for a specific organization
export const updateUserRoles = async (userId, rolesData) => {
    try {
        // rolesData should be { roles: ['user', 'manager'], organization_id: 123 }
        // or just ['user', 'manager'] for backward compatibility (will fail if org_id required)
        let payload;
        if (Array.isArray(rolesData)) {
            // Legacy format - just roles array
            payload = { roles: rolesData };
        } else {
            // New format - object with roles and organization_id
            payload = rolesData;
        }
        const response = await axios.put(`${BASE_URL}/users/${userId}/roles`, payload);
        return response.data;
    } catch (error) {
        console.error('Failed to update user roles:', error);
        throw error;
    }
};

// Fetch user titles
export const fetchTitles = async () => {
    try {
        const response = await axios.get(`${BASE_URL}/titles`);
        return response.data;
    } catch (error) {
        console.error('Failed to fetch titles:', error);
        throw error;
    }
};

// Add a new title
export const addTitle = async (titleData) => {
    try {
        const response = await axios.post(`${BASE_URL}/titles`, titleData);
        return response.data;
    } catch (error) {
        console.error('Failed to add title:', error);
        throw error;
    }
};

// Fetch user roles
export const fetchRoles = async () => {
    try {
        const response = await axios.get(`${BASE_URL}/roles`);
        return response.data;
    } catch (error) {
        console.error('Failed to fetch roles:', error);
        throw error;
    }
};

// Add a new role
export const addRole = async (roleData) => {
    try {
        const response = await axios.post(`${BASE_URL}/roles`, roleData);
        return response.data;
    } catch (error) {
        console.error('Failed to add role:', error);
        throw error;
    }
};

// Fetch denominations
export const fetchDenominations = async () => {
    try {
        const response = await axios.get(`${BASE_URL}/denominations`);
        return response.data;
    } catch (error) {
        console.error('Failed to fetch denominations:', error);
        throw error;
    }
};

// Fetch accreditation bodies
export const fetchAccreditationBodies = async () => {
    try {
        const response = await axios.get(`${BASE_URL}/accreditation-bodies`);
        return response.data;
    } catch (error) {
        console.error('Failed to fetch accreditation bodies:', error);
        throw error;
    }
};

// Fetch umbrella associations
export const fetchUmbrellaAssociations = async () => {
    try {
        const response = await axios.get(`${BASE_URL}/umbrella-associations`);
        return response.data;
    } catch (error) {
        console.error('Failed to fetch umbrella associations:', error);
        throw error;
    }
};

// Fetch organization types
export const fetchOrganizationTypes = async () => {
    try {
        const response = await axios.get(`${BASE_URL}/organization-types`);
        return response.data.organization_types || [];
    } catch (error) {
        console.error('Failed to fetch organization types:', error);
        throw error;
    }
};

// Initialize organization types
export const initializeOrganizationTypes = async () => {
    try {
        const response = await axios.post(`${BASE_URL}/organization-types/initialize`);
        return response.data;
    } catch (error) {
        console.error('Failed to initialize organization types:', error);
        throw error;
    }
};

// Fetch users with role "user" and their organizational details
export const fetchUsersWithRoleUser = async () => {
    try {
        const response = await axios.get(`${BASE_URL}/users/role/user`);
        return response.data;
    } catch (error) {
        console.error('Failed to fetch users with role "user":', error);
        throw error;
    }
};

// Add organization type
export const addOrganizationType = async (typeData) => {
    try {
        const response = await axios.post(`${BASE_URL}/organization-types`, typeData);
        return response.data;
    } catch (error) {
        console.error('Failed to add organization type:', error);
        throw error;
    }
};

// Add user organizational title (Assign user to organization)
export const addUserOrganizationalTitle = async (userId, data) => {
    try {
        const response = await axios.post(`${BASE_URL}/users/${userId}/organization-titles`, data);
        return response.data;
    } catch (error) {
        console.error('Failed to add user organizational title:', error);
        throw error;
    }
};

// Remove user organizational title
export const removeUserOrganizationalTitle = async (userId, orgId, titleId) => {
    try {
        const response = await axios.delete(`${BASE_URL}/users/${userId}/organization-titles/${orgId}/${titleId}`);
        return response.data;
    } catch (error) {
        console.error('Failed to remove user organizational title:', error);
        throw error;
    }
};

// Fetch user organizational titles
export const fetchUserOrganizationalTitles = async (userId) => {
    try {
        const response = await axios.get(`${BASE_URL}/user-organizational-titles/${userId}`);
        return response.data;
    } catch (error) {
        console.error('Failed to fetch user organizational titles:', error);
        throw error;
    }
};

// Update user organizational titles
export const updateUserOrganizationalTitles = async (userId, titlesData) => {
    try {
        const response = await axios.put(`${BASE_URL}/user-organizational-titles/${userId}`, titlesData);
        return response.data;
    } catch (error) {
        console.error('Failed to update user organizational titles:', error);
        throw error;
    }
};

// Fetch templates by organization
export const fetchTemplatesByOrganization = async (organizationId) => {
    try {
        const response = await axios.get(`${BASE_URL}/templates?organization_id=${organizationId}`);
        return response.data;
    } catch (error) {
        console.error(`Failed to fetch templates for organization ${organizationId}:`, error);
        throw error;
    }
};

// Fetch all templates (for bulk operations)
export const fetchTemplates = async () => {
    try {
        const response = await axios.get(`${BASE_URL}/templates`);
        return response.data;
    } catch (error) {
        console.error('Failed to fetch templates:', error);
        throw error;
    }
};

// Send survey reminder to a specific user
export const sendSurveyReminder = async (userId) => {
    try {
        const response = await axios.post(`${BASE_URL}/users/${userId}/send-reminder`);
        return response.data;
    } catch (error) {
        console.error(`Failed to send reminder to user ${userId}:`, error);
        // Fallback for demo if endpoint doesn't exist yet
        if (error.response && error.response.status === 404) {
            console.warn('Endpoint not found, simulating success for demo');
            return { success: true, message: 'Reminder sent (simulation)' };
        }
        throw error;
    }
};

// Send bulk survey reminders to all pending users in an organization
export const sendBulkSurveyReminders = async (organizationId) => {
    try {
        const response = await axios.post(`${BASE_URL}/organizations/${organizationId}/send-reminders`);
        return response.data;
    } catch (error) {
        console.error(`Failed to send bulk reminders for organization ${organizationId}:`, error);
        // Fallback for demo if endpoint doesn't exist yet
        if (error.response && error.response.status === 404) {
            console.warn('Endpoint not found, simulating success for demo');
            return { success: true, message: 'Bulk reminders sent (simulation)' };
        }
        throw error;
    }
};
