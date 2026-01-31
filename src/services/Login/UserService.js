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

const selectRole = async (userId, selectedRole) => {
    try {
        console.log('Selecting role:', { userId, selectedRole });
        const response = await axios.post(`${BASE_URL}/users/select-role`, {
            user_id: userId,
            selected_role: selectedRole
        });
        console.log('Role selection response:', response.data);
        return response.data;
    } catch (error) {
        console.error("Role selection failed: ", error.response || error.message);
        throw error;
    }
};

const UserService = { loginUser, selectRole };
export default UserService;