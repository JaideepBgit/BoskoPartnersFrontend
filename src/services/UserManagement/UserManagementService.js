import axios from "axios";

const API_BASE_URL = 'http://localhost:5000/api';

// Organization-related API calls
export const fetchOrganizations = async () => {
    try {
        const response = await axios.get(`${API_BASE_URL}/organizations`);
        return response.data;
    } catch (error) {
        console.error('Failed to fetch organizations:', error);
        throw error;
    }
};

export const addOrganization = async (organizationData) => {
    try {
        const response = await axios.post(`${API_BASE_URL}/organizations`, organizationData);
        return response.data;
    } catch (error) {
        console.error('Failed to add organization:', error);
        throw error;
    }
};

export const updateOrganization = async (id, organizationData) => {
    try {
        const response = await axios.put(`${API_BASE_URL}/organizations/${id}`, organizationData);
        return response.data;
    } catch (error) {
        console.error('Failed to update organization:', error);
        throw error;
    }
};

export const deleteOrganization = async (id) => {
    try {
        const response = await axios.delete(`${API_BASE_URL}/organizations/${id}`);
        return response.data;
    } catch (error) {
        console.error('Failed to delete organization:', error);
        throw error;
    }
};

export const fetchOrganizationById = async (id) => {
    try {
        const response = await axios.get(`${API_BASE_URL}/organizations/${id}`);
        return response.data;
    } catch (error) {
        console.error(`Failed to fetch organization with id ${id}:`, error);
        throw error;
    }
};

export const uploadOrganizationFile = async (formData) => {
    try {
        const response = await axios.post(`${API_BASE_URL}/organizations/upload`, formData, {
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
        const response = await axios.get(`${API_BASE_URL}/users`);
        return response.data;
    } catch (error) {
        console.error('Failed to fetch users:', error);
        throw error;
    }
};

export const fetchUsersByOrganization = async (organizationId) => {
    try {
        const response = await axios.get(`${API_BASE_URL}/organizations/${organizationId}/users`);
        return response.data;
    } catch (error) {
        console.error(`Failed to fetch users for organization ${organizationId}:`, error);
        throw error;
    }
};

export const addUser = async (userData) => {
    try {
        const response = await axios.post(`${API_BASE_URL}/users`, userData);
        return response.data;
    } catch (error) {
        console.error('Failed to add user:', error);
        throw error;
    }
};

export const updateUser = async (id, userData) => {
    try {
        const response = await axios.put(`${API_BASE_URL}/users/${id}`, userData);
        return response.data;
    } catch (error) {
        console.error('Failed to update user:', error);
        throw error;
    }
};

export const deleteUser = async (id) => {
    try {
        const response = await axios.delete(`${API_BASE_URL}/users/${id}`);
        return response.data;
    } catch (error) {
        console.error('Failed to delete user:', error);
        throw error;
    }
};

export const fetchUserById = async (id) => {
    try {
        const response = await axios.get(`${API_BASE_URL}/users/${id}`);
        return response.data;
    } catch (error) {
        console.error(`Failed to fetch user with id ${id}:`, error);
        throw error;
    }
};

export const uploadUserFile = async (formData) => {
    try {
        const response = await axios.post(`${API_BASE_URL}/users/upload`, formData, {
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

// Fetch user roles
export const fetchRoles = async () => {
    try {
        const response = await axios.get(`${API_BASE_URL}/roles`);
        return response.data;
    } catch (error) {
        console.error('Failed to fetch roles:', error);
        throw error;
    }
};

// Add a new role
export const addRole = async (roleData) => {
    try {
        const response = await axios.post(`${API_BASE_URL}/roles`, roleData);
        return response.data;
    } catch (error) {
        console.error('Failed to add role:', error);
        throw error;
    }
};

// Fetch denominations
export const fetchDenominations = async () => {
    try {
        const response = await axios.get(`${API_BASE_URL}/denominations`);
        return response.data;
    } catch (error) {
        console.error('Failed to fetch denominations:', error);
        throw error;
    }
};

// Fetch accreditation bodies
export const fetchAccreditationBodies = async () => {
    try {
        const response = await axios.get(`${API_BASE_URL}/accreditation-bodies`);
        return response.data;
    } catch (error) {
        console.error('Failed to fetch accreditation bodies:', error);
        throw error;
    }
};

// Fetch umbrella associations
export const fetchUmbrellaAssociations = async () => {
    try {
        const response = await axios.get(`${API_BASE_URL}/umbrella-associations`);
        return response.data;
    } catch (error) {
        console.error('Failed to fetch umbrella associations:', error);
        throw error;
    }
};

// Fetch users with role "user" and their organizational details
export const fetchUsersWithRoleUser = async () => {
    try {
        const response = await axios.get(`${API_BASE_URL}/users/role/user`);
        return response.data;
    } catch (error) {
        console.error('Failed to fetch users with role "user":', error);
        throw error;
    }
};
