import axios from "axios";

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const loginUser = async (username, password) => {
    try {
        console.log('Sending login request with:', { username });
        const response = await axios.post(`${BASE_URL}/users/login`, {
            username,
            password
        });
        console.log('Raw API response:', response);
        console.log('API response.data:', response.data);

        // Return the full response.data object
        return response.data;
    } catch (error) {
        console.error("API Call failed: ", error.response || error.message);
        throw error;
    }
};

const selectRole = async (userId, selectedRole, organizationId = null) => {
    try {
        console.log('Selecting role:', { userId, selectedRole, organizationId });
        const requestData = {
            user_id: userId,
            selected_role: selectedRole
        };

        if (organizationId) {
            requestData.organization_id = organizationId;
        }

        const response = await axios.post(`${BASE_URL}/users/select-role`, requestData);
        console.log('Role selection response:', response.data);
        return response.data;
    } catch (error) {
        console.error("Role selection failed: ", error.response || error.message);
        throw error;
    }
};

const fetchUser = async (userId) => {
    try {
        const response = await axios.get(`${BASE_URL}/users/${userId}`);
        return response.data;
    } catch (error) {
        console.error("Failed to fetch user: ", error.response || error.message);
        throw error;
    }
};

const updateProfile = async (userId, profileData) => {
    try {
        const response = await axios.put(`${BASE_URL}/users/${userId}`, profileData);
        return response.data;
    } catch (error) {
        console.error("Failed to update profile: ", error.response || error.message);
        throw error;
    }
};

const uploadAvatar = async (userId, file) => {
    try {
        const formData = new FormData();
        formData.append('file', file);
        const response = await axios.post(`${BASE_URL}/users/${userId}/avatar`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data;
    } catch (error) {
        console.error("Failed to upload avatar: ", error.response || error.message);
        throw error;
    }
};

const fetchUserOrganizations = async (userId) => {
    try {
        const response = await axios.get(`${BASE_URL}/users/${userId}/organizations`);
        return response.data;
    } catch (error) {
        console.error("Failed to fetch user organizations: ", error.response || error.message);
        throw error;
    }
};

const UserService = { loginUser, selectRole, fetchUser, updateProfile, uploadAvatar, fetchUserOrganizations };
export default UserService;